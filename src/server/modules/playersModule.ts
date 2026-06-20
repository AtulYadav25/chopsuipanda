import { createSession, dbUsers, LiveData, Module, setSessionUser } from 'modelence/server'
import { time } from 'modelence'
import { z } from 'zod'
import { dbPlayers } from './stores/playerStore';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import jwt from "jsonwebtoken";
import configModule from './configModule';
import { successResponse, throwError } from '../utils/responsHandler';
import { PlayerPublic, playerPublicSchema } from '@/shared/schemas/player.schema';
import { requirePlayer } from '../utils/authPlayer';
import { dbWeeklyRewards } from './stores/weeklyRewardStore';
import { getRewardForDay, generateUniqueUsername } from '../utils/playerHelper';
import { getPlayerSocialData } from './stores/friendshipStore';
import { validateBody } from '../utils/validateBody';
import { LEVEL_CONFIG } from '@/shared/constants/LevelConfig';
import { generateJWTToken, PlayerAuthToken } from '../utils/jwtHelper';
import { dbChiTransactions } from './stores/chiTransactionStore';
import { TRANSACTION } from '@/shared/constants/chiTransaction';
import {
    ChestReward,
    ChestType,
    getChestRewardTable,
    getChestCost,
    DAILY_CHEST_OPEN_LIMIT,
    DAILY_WINDOW_MS,
    CHEST_OPENING_HISTORY_SIZE,
    OpenChestArgs,
    getChestTierProbabilities,
} from '@/shared/constants/ChestConfig';
import { pickReward } from '../utils/chestHelper';

const playerModule = new Module('player', {
    stores: [],
    queries: {

        //Leaderboard Live Queries
        getTopPlayers: async () => {
            return new LiveData({
                fetch: async () => {
                    const players = await dbPlayers.fetch(
                        {},
                        { sort: { chiEarned: -1 }, limit: 100 }
                    );
                    return players.map(p => ({
                        username: p.username,
                        chiEarned: p.chiEarned,
                    }));
                },
                watch: ({ publish }) => {
                    const pipeline = [
                        {
                            $match: {
                                operationType: { $in: ['update', 'replace'] },
                                'updateDescription.updatedFields.chiEarned': { $exists: true },
                            },
                        },
                    ];
                    const changeStream = dbPlayers.watch(pipeline);
                    changeStream.on('change', () => publish());
                    return () => changeStream.close();
                },
            });
        },

        async checkAuth(_, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);
                if (walletAddress) {
                    const player = await dbPlayers.findOne({ walletAddress });
                    if (player) {
                        return successResponse({}, "Authenticated");
                    } else {
                        return throwError("Invalid Access");
                    }
                }

                return throwError("Invalid Access");
            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        // Auth & Profile Refersh ───────────────────────────────────────────────
        async getMe({ includeSocial }: { includeSocial: boolean }, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);

                // ✅ Parallel fetch — these don't depend on each other
                const [player, latestWeeklyReward] = await Promise.all([
                    dbPlayers.findOne({ walletAddress }),
                    dbWeeklyRewards.findOne({}, { sort: { createdAt: -1 } }),
                ]);

                if (!player) return throwError("Player Not Found");
                if (!latestWeeklyReward?.sessionId) return throwError("Internal Server Error");

                // ─── Build a single update payload ───────────────────────────────────
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const yesterdayStr = new Date(now.getTime() - 86_400_000).toISOString().split('T')[0];
                const lastLoginStr = player.dailyStreak?.lastLogin
                    ? new Date(player.dailyStreak.lastLogin).toISOString().split('T')[0]
                    : null;

                const updates: Record<string, any> = {};

                // Session ID drift
                if (player.sessionId !== latestWeeklyReward.sessionId) {
                    updates.sessionId = latestWeeklyReward.sessionId;
                    updates.chiEarned = 0;  // reset weekly earnings on new session
                }

                // Daily streak logic
                let currentStreak = player.dailyStreak?.currentStreak ?? 1;

                if (!lastLoginStr) {
                    // First login ever
                    const { reward } = getRewardForDay(1);
                    currentStreak = 1;
                    updates['dailyStreak.lastLogin'] = now;
                    updates['dailyStreak.currentStreak'] = currentStreak;
                    updates.chi = (player.chi ?? 0) + reward;

                } else if (lastLoginStr === yesterdayStr) {
                    // Continue streak
                    currentStreak = currentStreak + 1;
                    const { reward } = getRewardForDay(currentStreak);
                    updates['dailyStreak.lastLogin'] = now;
                    updates['dailyStreak.currentStreak'] = currentStreak;
                    updates.chi = (player.chi ?? 0) + reward;

                } else if (lastLoginStr !== todayStr) {
                    // Missed 2+ days — reset, no reward
                    currentStreak = 1;
                    updates['dailyStreak.lastLogin'] = now;
                    updates['dailyStreak.currentStreak'] = currentStreak;
                }
                // else: lastLoginStr === todayStr → already claimed, do nothing

                // ─── Write + Social in parallel ──────────────────────────────────────────────
                const [updatedPlayer, socialData] = await Promise.all([
                    Object.keys(updates).length > 0
                        ? dbPlayers.findOneAndUpdate(
                            { walletAddress },
                            { $set: updates }
                        )
                        : player,
                    includeSocial ? getPlayerSocialData(player._id) : Promise.resolve(null),
                ]);

                const finalPlayer = updatedPlayer ?? player;

                return successResponse<PlayerPublic>({
                    username: finalPlayer.username,
                    chi: finalPlayer.chi,
                    chiEarned: finalPlayer.chiEarned,
                    powerUps: finalPlayer.powerUps,
                    referredBy: finalPlayer.referredBy,
                    level: finalPlayer.level,
                    friends: socialData?.friends ?? [],
                    friendRequestsReceived: socialData?.pendingRequests ?? [],
                    notifications: finalPlayer.notifications,
                    chestOpenings: finalPlayer.chestOpenings,
                    dailyStreak: finalPlayer.dailyStreak,
                }, "Fetched Player Details Successfully");

            } catch (error) {
                return throwError((error as Error).message);
            }
        }

    },
    mutations: {


        async openChest(args: OpenChestArgs, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);
                const { chestDetails } = args;
                const { type: chestType, qty: chestQty } = chestDetails;

                const player = await dbPlayers.findOne({ walletAddress });
                if (!player) {
                    return throwError("Player Not Found");
                }

                const openingsInLastDay = player.chestOpenings.filter((timestamp) => {
                    return new Date(timestamp).getTime() >= Date.now() - DAILY_WINDOW_MS;
                });

                if (openingsInLastDay.length >= DAILY_CHEST_OPEN_LIMIT) {
                    return throwError("Daily Limit Reached");
                }

                const rewardTable = getChestRewardTable(chestType);
                const costPerChest = getChestCost(chestType);
                const totalCost = chestQty * costPerChest;

                if (player.chi < totalCost) {
                    return throwError("Insufficient CHI Balance");
                }

                const { base, climb } = getChestTierProbabilities(chestType);
                const rewardsReceived: ChestReward[] = Array.from(
                    { length: chestQty },
                    () => pickReward(rewardTable, base, climb)
                );

                //Updating Player chest openings array
                const updatedChestOpenings = [
                    ...(player.chestOpenings || []),
                    ...Array.from({ length: chestQty }, () => new Date()),
                ].slice(-CHEST_OPENING_HISTORY_SIZE);

                if (chestType === 'treasure') {
                    const totalChiAwarded = rewardsReceived.reduce(
                        (sum, reward) => sum + reward.amount,
                        0
                    );

                    await dbPlayers.updateOne({ walletAddress }, {
                        chi: player.chi - totalCost + totalChiAwarded,
                        chestOpenings: updatedChestOpenings,
                    });
                } else {
                    // Royal chests pay out SUI off-chain via a Redis-queued payout,
                    // settled later by a cron job — not credited to `chi` directly.
                    await dbPlayers.updateOne({ walletAddress }, {
                        chi: player.chi - totalCost,
                        chestOpenings: updatedChestOpenings,
                    });

                    // TODO
                    // await queueSuiPayout(walletAddress, rewardsReceived);
                }

                return successResponse({ rewardsReceived }, "Chest Opened Successfully");
            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        // Alice shares referral code ABC123
        // Bob enters ABC123

        // Alice = Referrer
        // Bob = Referee (Referred User)
        async applyReferral(args, { req }) {
            try {
                const { walletAddress } = req.user;
                const { referrerUsername } = args as { referrerUsername: string };

                if (!walletAddress || !referrerUsername) {
                    return throwError("Referrer username is required");
                }

                const player = await dbPlayers.findOne({ walletAddress });
                if (!player) {
                    return throwError("Player not found");
                }
                if (player.referredBy != null) {
                    return throwError("Referral already used");
                }
                if (player.username === referrerUsername) {
                    return throwError("You cannot refer yourself");
                }

                const referrer = await dbPlayers.findOne({ username: referrerUsername });
                if (!referrer) {
                    return throwError("Referral code is invalid");
                }
                if (
                    referrer._id.equals(player._id) ||
                    referrer.referredBy?.equals(player._id)
                ) {
                    return throwError("Players are already connected");
                }

                const now = new Date();

                if (player.referredBy) {
                    return throwError("Referral already used");
                }

                // Atomic claim: only succeeds if referredBy is still null,
                // closing the race-condition window between check and write
                await dbPlayers.updateOne(
                    { walletAddress },
                    { $inc: { chi: 3000 }, $set: { referredBy: referrer._id, updatedAt: now } }
                );

                // From here on, the referral is "claimed" — if anything below fails,
                // log it for reconciliation rather than leaving the user stuck,
                // since we can't roll back the claim without a transaction.
                try {
                    await dbPlayers.updateOne({ _id: referrer._id }, { $inc: { chi: 1000 }, $set: { updatedAt: now } });

                    await dbChiTransactions.insertMany([
                        {
                            ownerWalletAddress: walletAddress,
                            chiAmount: 3000,
                            type: TRANSACTION.REFERRAL_REWARD,
                            status: "success",
                            message: `Referrer is ${referrer.username}`,
                            createdAt: now,
                            updatedAt: now,
                        },
                        {
                            ownerWalletAddress: referrer.walletAddress,
                            chiAmount: 1000,
                            type: TRANSACTION.REFERRAL_REWARD,
                            status: "success",
                            message: `Referred by ${player.username}`,
                            createdAt: now,
                            updatedAt: now,
                        },
                    ]);
                } catch (innerError) {
                    console.error("applyReferral: partial failure after claim", {
                        playerId: player._id,
                        referrerId: referrer._id,
                        error: innerError,
                    });
                }

                await Promise.allSettled([
                    dbPlayers.updateOne(
                        { _id: referrer._id },
                        {
                            $push: {
                                notifications: {
                                    $each: [{
                                        type: "referral_reward",
                                        message: `You earned 1,000 chi by referring ${player.name}. Keep up the good work!`,
                                        token: "",
                                        isRead: false,
                                        createdAt: new Date(),
                                    }],
                                    $position: 0,
                                    $slice: 60,
                                },
                            },
                        }
                    ),
                    dbPlayers.updateOne(
                        { _id: player._id },
                        {
                            $push: {
                                notifications: {
                                    $each: [{
                                        type: "referral_reward",
                                        message: `You received 3,000 chi for using a referral code from ${referrer.name}. Enjoy your reward!`,
                                        token: "",
                                        isRead: false,
                                        createdAt: new Date(),
                                    }],
                                    $position: 0,
                                    $slice: 60,
                                },
                            },
                        }
                    ),
                ]);

                return successResponse({}, "Referral Applied");
            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async continueDailyStreak(_, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);

                const player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError("Player Not Found");
                }

                const today = new Date();
                const todayDateKey = today.toISOString().split("T")[0];

                const lastClaimDate = player.dailyStreak?.lastLogin
                    ? new Date(player.dailyStreak.lastLogin)
                    : null;

                const lastClaimDateKey = lastClaimDate?.toISOString().split("T")[0];

                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                const yesterdayDateKey = yesterday.toISOString().split("T")[0];

                const isStreakAlreadyActive =
                    !lastClaimDate ||
                    lastClaimDateKey === todayDateKey ||
                    lastClaimDateKey === yesterdayDateKey;

                if (isStreakAlreadyActive) {
                    return throwError("Streak is not broken or already claimed today");
                }

                const currentStreakCount = player.dailyStreak?.currentStreak || 0;

                const streakRestoreCost =
                    (Math.floor(currentStreakCount / 4) + 1) * 5000;

                const currentChiBalance = player.chi || 0;

                if (currentChiBalance < streakRestoreCost) {
                    return throwError("Insufficient CHI Balance");
                }

                const updatedStreakCount = currentStreakCount + 1;
                const remainingChiBalance = currentChiBalance - streakRestoreCost;

                await dbPlayers.findOneAndUpdate(
                    { walletAddress },
                    {
                        $set: {
                            "dailyStreak.lastLogin": today,
                            "dailyStreak.currentStreak": updatedStreakCount,
                            chi: remainingChiBalance,
                        },
                    }
                );

                return successResponse<{
                    newStreak: number;
                    remainingChi: number;
                }>(
                    {
                        newStreak: updatedStreakCount,
                        remainingChi: remainingChiBalance,
                    },
                    `Streak continued by paying ${streakRestoreCost} CHI`
                );
            } catch (error) {
                return throwError((error as Error).message);
            }
        },


        async disconnectWallet(_, { req, res }) {
            try {

                requirePlayer(req);
                res.cookie("token", null, {
                    expires: new Date(Date.now()),
                    httpOnly: true,
                });

                res.cookie("socketToken", null, {
                    expires: new Date(Date.now()),
                    httpOnly: true,
                });

                return successResponse({}, "Wallet Disconnected");
            } catch (error) {
                return throwError((error as Error).message);
            }
        },



        // Auth & Profile Refersh ───────────────────────────────────────────────


        /*
        @authPlayer
        Used to register new players Or Refresh Auth Tokens
        */
        async authPlayer({ walletAddress, message, signature }: any, { res, session }) {
            try {


                if (!walletAddress || !message || !signature) {
                    throw new Error("Invalid Access!");
                }

                // Convert message to Uint8Array
                const messageBytes = new Uint8Array(message);

                // Verify signature
                try {
                    await verifyPersonalMessageSignature(messageBytes, signature, {
                        address: walletAddress,
                    });//Verify the Message is valid, also verifying the message is valid for given address
                } catch (err) {
                    return throwError("Invalid Signature");
                }

                // 2. Upsert player
                let player = await dbPlayers.findOne({ walletAddress });
                let isNewUser = player?.createdAt === player?.updatedAt;

                if (!player) {
                    isNewUser = true;
                    const username = await generateUniqueUsername();

                    player = await dbPlayers.create({
                        status: "active",
                        handle: username,
                        authMethods: {},
                        walletAddress,
                        username,   // temp username, they'll set it in onboarding
                        chi: 0,
                        chiEarned: 0,
                        merit: 0,
                        level: 1,
                        currentScore: 0,
                        continues: 0,
                        hasPendingContinue: false,
                        sessionId: 'something', // TODO : Update this to current session id
                        dailyStreak: { currentStreak: 1, lastLogin: new Date() },
                        chestOpenings: [],
                        powerUps: [],
                        notifications: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }

                // ⏳ Token Expiry = 10 days
                const tenDaysInSeconds = time.days(10);
                const tenDaysInMilliseconds = tenDaysInSeconds * 1000;

                const token = generateJWTToken<PlayerAuthToken>(
                    { time: Date.now(), walletAddress, userId: player._id.toString() },
                    configModule.getConfig('JWT_SECRET'),
                    {
                        expiresIn: tenDaysInSeconds,
                    }
                );

                // ✅ Set token cookie for 10 days
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: true, // Only over HTTPS
                    sameSite: "strict",
                    maxAge: tenDaysInMilliseconds,
                    path: '/'
                });

                // ✅ Set socketToken as (authToken) cookie for 10 days (This is customized auth instead of modelence auth)
                res.cookie('authToken', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: tenDaysInMilliseconds,
                    path: '/',
                });

                successResponse<{ isNewUser: boolean, player: PlayerPublic }>(
                    {
                        player: playerPublicSchema.parse(player),
                        isNewUser
                    },
                    "User Authenticated"
                )


            } catch (error) {
                return throwError((error as Error).message)
            }
        },

        async onboardPlayer(args, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);

                const { success, data } = validateBody(z.object({
                    username: z
                        .string()
                        .min(3)
                        .max(25)
                        .regex(
                            /^[a-zA-Z0-9_]+$/,
                            "Username can only contain letters, numbers, and underscores"
                        ),
                }), { username: args.username })


                if (!success) {
                    return throwError("Invalid username");
                }

                const { username } = data;

                //Check if the username already exist
                const existingPlayer = await dbPlayers.findOne({ username })

                if (existingPlayer) {
                    return throwError("Username Already Exist")
                }

                const updatedPlayer = await dbPlayers.findOneAndUpdate(
                    { walletAddress },
                    {
                        $set: {
                            username: args.username,
                            updatedAt: new Date(),
                        }
                    }
                );

                if (!updatedPlayer) {
                    return throwError("Player Not Found");
                }

                return successResponse({}, "Player Onboarded Successfully");

            } catch (error) {
                return throwError((error as Error).message);
            }

        },

        async levelUp(_, { req }) {
            try {
                const { walletAddress } = req.user;

                // Find player in the database
                const player = await dbPlayers.findOne({ walletAddress });
                if (!player) {
                    return throwError("Player not found");
                }

                const nextLevel = player.level + 1;

                const nextLevelConfig = LEVEL_CONFIG[nextLevel];

                if (player.chi < nextLevelConfig.upgradeCost) {
                    return throwError("Insufficient CHI Balance");
                }

                await await dbPlayers.updateOne(
                    { walletAddress },
                    {
                        chi: player.chi - nextLevelConfig.upgradeCost,
                        level: nextLevel
                    }
                );

                return successResponse({}, "Player Unlocked New Level successfully");
            } catch (error) {
                return throwError((error as Error).message);
            }
        }

    },
    routes: [],
    rateLimits: [],

    channels: []
})

export default playerModule;