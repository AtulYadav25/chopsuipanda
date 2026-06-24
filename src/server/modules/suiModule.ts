import { Module } from 'modelence/server'
import { requirePlayer } from '../utils/authPlayer';
import { successResponse, throwError } from '../utils/responsHandler';
import { dbPlayers } from './stores/playerStore';
import { CHI_SHOP_ITEMS } from '@/shared/constants/ChiShopConfig';
import configModule from './configModule';
import { ChiPurchaseToken, generateJWTToken, verifyJWTToken } from '../utils/jwtHelper';
import { time } from 'modelence';
import SuiTransactionVerifier from '../utils/suiTransactionVerifier';
import { dbChiTransactions } from './stores/chiTransactionStore';
import { TRANSACTION } from '@/shared/constants/chiTransaction';
import { mistToSui, suiToMist } from '@/shared/utils/suiConversion';


const suiModule = new Module('sui', {
    stores: [],
    queries: {

    },
    mutations: {

        // Instead of decoding the message in smart contract, let player pay the amount and while verifying the digest i will check if correct amount is paid or not or let it go
        async purchaseChi(args: { packId: number }, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);
                const { packId } = args;

                if (!walletAddress || !packId) {
                    return throwError('Invalid request data');
                }

                const player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError('Player not found');
                }

                const selectedPack = CHI_SHOP_ITEMS.find(
                    (item) => item.id === packId,
                );

                if (!selectedPack) {
                    return throwError('Invalid CHI pack selected');
                }

                // convert SUI → smallest unit (assuming 1e9)
                const costInSui = selectedPack.price;
                const costInMistToPay = suiToMist(costInSui);

                const timestamp = Date.now();

                const message = `${walletAddress}:${packId}:${costInMistToPay}:${timestamp}`;

                const payload: ChiPurchaseToken = {
                    walletAddress,
                    packId,
                    message,
                    amount: selectedPack.amount,
                    costInMistToPay,
                    timestamp,
                };

                const token = generateJWTToken(payload, configModule.getConfig('JWT_SECRET'), {
                    expiresIn: time.minutes(15)
                })

                // TODO : In frontend pass this token to the smart contract to emit it as message, and while verifiying the digest get the token decode it and compare the amount of sui paid with the coin in mist
                return successResponse({
                    token,
                    costInMistToPay
                });
            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async verifyDigest(args: { digest: string }, { req }) {
            try {
                const { digest } = args;
                const { walletAddress } = req.user;

                const MODULE_NAME = process.env.MODULE_NAME;
                const player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError("Player not found");
                }

                // Check duplicate tx first (cheap check before hitting blockchain)
                const transactionExists = await dbChiTransactions.findOne({
                    'payment.txDigest': digest
                });
                if (transactionExists) {
                    return throwError("Transaction already verified");
                }

                // Verify on-chain
                const txVerifier = new SuiTransactionVerifier();
                const txDetails = await txVerifier.verifyTransaction(digest, walletAddress.trim());

                if (!txDetails.verified) {
                    return throwError("Transaction Not Verified");
                }

                // Extract token from PaymentMessageEvent emitted by smart contract
                const messageEvent: any = txDetails.events.find((event: any) =>
                    event.eventType.includes(`::${MODULE_NAME}::PaymentMessageEvent`)
                );

                if (!messageEvent?.json?.message) {
                    return throwError("Payment message not found in transaction");
                }

                // message is emitted as vector<u8> — decode bytes back to JWT string
                const tokenBytes: number[] = messageEvent.json.message;
                const token = new TextDecoder().decode(new Uint8Array(tokenBytes));

                // Decode and validate JWT
                const decoded = verifyJWTToken<ChiPurchaseToken>(token, configModule.getConfig('JWT_SECRET'));

                if (decoded?.walletAddress !== walletAddress) {
                    return throwError("Token does not belong to this wallet");
                }

                const expectedPayAmount = decoded?.costInMistToPay;

                // Verify paid amount from PaidToContract event
                const purchaseEvent: any = txDetails.events.find((event: any) =>
                    event.eventType.includes(`::${MODULE_NAME}::PaidToContract`)
                );

                if (!purchaseEvent) {
                    return throwError("Payment event not found in transaction");
                }

                const actualPaidAmount = Number(purchaseEvent.json.amount);
                if (actualPaidAmount < Number(expectedPayAmount)) {
                    return throwError("Insufficient payment detected");
                }


                // TODO 
                // const exists = await redisClient.exists(`tx:${digest}`);
                // if (exists) {
                //     checkForMerit(walletAddress, req.ip)
                //     return res.status(400).json({ success: false, message: "Invalid Access" });
                // }

                // Store with 30 min expiry (1800 seconds)
                // await redisClient.set(`tx:${digest}`, "1", { EX: 1200 });


                // Update chi if amount is present
                if (decoded?.amount) {
                    let updatedchi = player.chi;
                    updatedchi += decoded.amount;

                    if (player.referredBy !== null) {
                        const rewardAmount = Math.ceil(decoded.amount * 0.3);

                        const referer = await dbPlayers.findOneAndUpdate(
                            { _id: player.referredBy },
                            {
                                $inc: { chi: rewardAmount },
                                $push: {
                                    notifications: {
                                        $each: [{
                                            type: "referral_reward",
                                            message: `🎉 Your friend ${player.name} just Purchased CHI, and you got ${rewardAmount.toLocaleString()} CHI as a referral reward!`,
                                            token: "",
                                            isRead: false,
                                            createdAt: new Date()
                                        }],
                                        $position: 0,
                                        $slice: 60
                                    }
                                }
                            }
                        );

                        if (!referer) {
                            return
                        }

                        await dbChiTransactions.create({
                            ownerWalletAddress: referer.walletAddress,
                            chiAmount: rewardAmount,
                            type: TRANSACTION.REFERRAL_REWARD,
                            referenceType: 'REFERRAL',
                            referenceId: player.walletAddress,
                            status: "success",
                            message: `BY: ${player.username} as reward`,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        })
                    }


                    await dbPlayers.updateOne(
                        { walletAddress },
                        { chi: updatedchi }
                    );

                    await dbChiTransactions.create({
                        ownerWalletAddress: player.walletAddress,
                        chiAmount: decoded.amount,
                        type: TRANSACTION.BUY_CHI,
                        referenceType: ' CHI_PACK',
                        referenceId: String(decoded.packId),
                        status: "success",
                        payment: {
                            amountInMist: expectedPayAmount,
                            txDigest: digest,
                        },
                        message: `Purchased ${decoded.amount.toLocaleString()} CHI for ${mistToSui(expectedPayAmount)} SUI`,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    })
                }

                return successResponse({}, "Successfully Verified Transaction");

            } catch (error) {
                return throwError((error as Error).message);
            }
        }


    },
    routes: [],
    rateLimits: [],

    channels: []
})

export default suiModule;