import { Module, ObjectId } from 'modelence/server'
import { dbBattleMatches } from './stores/battleMatchStore';
import { validateBody } from '../utils/validateBody';
import { z } from 'zod'
import { GAME_TYPE_VALUES } from '@/shared/constants/GameTypes';
import { BattleMatch, SendBattleChallenge, sendBattleChallengeSchema } from '@/shared/schemas/battleMatch.schema';
import { requirePlayer } from '../utils/authPlayer';
import { successResponse, throwError } from '../utils/responsHandler';
import { dbPlayers } from './stores/playerStore';
import { getAvailableGames } from '@/shared/constants/LevelConfig';
import { dbChiTransactions } from './stores/chiTransactionStore';
import { TRANSACTION } from '@/shared/constants/chiTransaction';

const battleMatchModule = new Module('battleMatch', {
    stores: [dbBattleMatches],
    queries: {

        async getMyActiveBattles(args, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);

                const currentPlayer = await dbPlayers.findOne({ walletAddress });

                if (!currentPlayer) {
                    return throwError("Player not found");
                }

                // Fetch all incomplete battles where the current player is the opponent
                const pendingBattles = await dbBattleMatches.fetch(
                    {
                        isBattleCompleted: false,
                        "opponent.walletAddress": currentPlayer.walletAddress,
                    },
                    {
                        projection: {
                            _id: 1,
                            challenger: 1,
                            opponent: 1,
                            gameMode: 1,
                            wagerAmount: 1,
                        },
                    }
                );

                return successResponse<BattleMatch[]>(
                    pendingBattles,
                    "Active battle challenges fetched successfully"
                );

            } catch (error) {
                return throwError((error as Error).message);
            }
        },

    },
    mutations: {
        async sendBattleChallenge(args, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);
                const { success, data } = validateBody<SendBattleChallenge>(sendBattleChallengeSchema, args);

                if (!success) {
                    return throwError("Invalid request data");
                }

                const { friendUsername, gameMode, wagerAmount } = data;

                const [currentPlayer, friendPlayer] = await Promise.all([
                    dbPlayers.findOne({ walletAddress }),
                    dbPlayers.findOne({ username: friendUsername }),
                ]);

                if (!currentPlayer) return throwError("Player not found");
                if (!friendPlayer) return throwError("Friend not found");

                // ─── Wager Validations ────────────────────────────────────────────
                if (wagerAmount < 1000) {
                    return throwError("Wager amount must be at least 1,000 CHI");
                }
                if (wagerAmount > 100000) {
                    return throwError("Wager amount cannot exceed 100,000 CHI");
                }
                if (wagerAmount >= currentPlayer.chi) {
                    return throwError("Insufficient CHI balance to place this wager");
                }
                if (wagerAmount >= friendPlayer.chi) {
                    return throwError("Your friend has insufficient CHI balance for this wager");
                }

                // ─── Game Unlock Validations ──────────────────────────────────────
                if (!getAvailableGames(currentPlayer.level).includes(gameMode)) {
                    return throwError("You have not unlocked this game yet");
                }
                if (!getAvailableGames(friendPlayer.level).includes(gameMode)) {
                    return throwError("Your friend has not unlocked this game yet");
                }

                // ─── Duplicate Challenge Check ────────────────────────────────────
                const existingChallenge = await dbBattleMatches.findOne({
                    $or: [
                        {
                            'challenger.walletAddress': currentPlayer.walletAddress,
                            'opponent.walletAddress': friendPlayer.walletAddress,
                            isBattleCompleted: false,
                        },
                        {
                            'challenger.walletAddress': friendPlayer.walletAddress,
                            'opponent.walletAddress': currentPlayer.walletAddress,
                            isBattleCompleted: false,
                        },
                    ],
                });

                if (existingChallenge) {
                    return throwError("An active battle already exists between you and this player");
                }

                const battleStartedAt = new Date();

                // ─── Deduct Wager & Reset Player Session ──────────────────────────
                await Promise.all([
                    dbPlayers.updateOne(
                        { walletAddress },
                        {
                            chi: currentPlayer.chi - wagerAmount,
                            gameStartedAt: battleStartedAt,
                            continues: 0,
                            currentScore: 0,
                        }
                    ),
                ]);

                // ─── Create Battle ────────────────────────────────────────────────
                const newBattle = await dbBattleMatches.create({
                    challenger: {
                        username: currentPlayer.username,
                        walletAddress: currentPlayer.walletAddress,
                        score: 0,
                        played: false,
                    },
                    opponent: {
                        username: friendPlayer.username,
                        walletAddress: friendPlayer.walletAddress,
                        score: 0,
                        played: false,
                    },
                    gameMode,
                    wagerAmount,
                    isBattleCompleted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                // TODO: Use live query to push battle challenge notification to friend
                // sendNotification('battleChallenge', friendPlayer.walletAddress, `...`, newBattle._id);

                return successResponse<{
                    timestamp: Date,
                    battle: BattleMatch
                }>(
                    { timestamp: battleStartedAt, battle: newBattle },
                    "Battle challenge sent successfully"
                );

            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async acceptBattleChallenge(args: { battleId: string }, { req }) {
            try {
                const { battleId } = args;
                const { walletAddress } = requirePlayer(req);

                let player = await dbPlayers.findOne({ walletAddress })

                if (!player) {
                    return throwError("Player not found");
                }

                // Check for existing active challenge between these players
                // Check for existing active challenge and return only specific fields
                const battle = await dbBattleMatches.findOne(
                    {
                        _id: new ObjectId(battleId),
                        isBattleCompleted: false
                    },
                    {
                        projection: {
                            challenger: 1,
                            opponent: 1,
                            wagerAmount: 1,
                            winnerUsername: 1,
                            gameMode: 1,
                            _id: 1
                        }
                    }
                );


                if (!battle) {
                    return throwError("Battle not found");
                }


                if (!battle.challenger.played) {
                    return throwError("Wait For Opponent to submit score.");
                }

                if (battle.challenger.walletAddress !== player.walletAddress && battle.opponent.walletAddress !== player.walletAddress) {
                    return throwError("You are not a part of this battle");
                }


                if (player.chi < battle.wagerAmount) {
                    return throwError("You don't have enough CHI to compete! Buy Some!");
                }

                const timestamp = new Date();

                await dbPlayers.updateOne(
                    { walletAddress },
                    {
                        $set: {
                            gameStartedAt: timestamp,
                            continues: 0,
                            currentScore: 0,
                        },
                        $inc: {
                            chi: -battle.wagerAmount
                        }
                    }
                );

                return successResponse<{
                    timestamp: Date,
                    battle: BattleMatch
                }>({
                    timestamp,
                    battle
                }, "Challenge Accepted");

            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async rejectBattleChallenge(args: { battleId: string }, { req }) {
            try {

                const { battleId } = args;
                const { walletAddress } = requirePlayer(req);
                const player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError("Player not found");
                }

                const battle = await dbBattleMatches.findOne({
                    _id: new ObjectId(battleId),
                    isBattleCompleted: false
                });

                if (!battle) {
                    return throwError("Battle not found or already completed");
                }

                if (
                    battle.challenger.walletAddress !== player.walletAddress &&
                    battle.opponent.walletAddress !== player.walletAddress
                ) {
                    return throwError("You are not a part of this battle");
                }

                // Refund wager safely using $inc
                if (typeof battle.wagerAmount === "number" && battle.wagerAmount > 0) {
                    await dbPlayers.updateOne(
                        { walletAddress: battle.challenger.walletAddress },
                        { $inc: { chi: battle.wagerAmount } }
                    );
                }

                // Delete the challenge
                await dbBattleMatches.deleteOne({ _id: new ObjectId(battleId) });

                return successResponse({
                    battleId
                }, "Battle challenge rejected.");

            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async submitBattleScore(args: { battleId: string }, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);
                const { battleId } = args;

                if (!battleId) {
                    return throwError("Battle ID is required");
                }

                // ─── Fetch Player & Battle ────────────────────────────────────────
                const [currentPlayer, activeBattle] = await Promise.all([
                    dbPlayers.findOne({ walletAddress }),
                    dbBattleMatches.findOne({
                        _id: new ObjectId(battleId),
                        isBattleCompleted: false,
                    }),
                ]);

                if (!currentPlayer) return throwError("Player not found");
                if (!activeBattle) return throwError("Active battle not found");

                // ─── Authorization Check ──────────────────────────────────────────
                const isChallenger = activeBattle.challenger.walletAddress === walletAddress;
                const isOpponent = activeBattle.opponent.walletAddress === walletAddress;

                if (!isChallenger && !isOpponent) {
                    return throwError("You are not a participant in this battle");
                }

                // ─── Fetch Player Score ───────────────────────────────────────────
                // TODO: Replace with Redis session score
                // const redisData = await redisClient.get(`user:${walletAddress}`);
                // if (!redisData) return throwError("Invalid session");
                // const { score: playerScore } = JSON.parse(redisData);
                const playerScore = 55; // placeholder

                // ─── Challenger Submits First ─────────────────────────────────────
                if (isChallenger) {
                    const updatedBattle = await dbBattleMatches.findOneAndUpdate(
                        { _id: new ObjectId(battleId) },
                        {
                            "challenger.score": playerScore,
                            "challenger.played": true,
                        }
                    );

                    return successResponse(
                        { winner: null, battle: updatedBattle },
                        "Score submitted — waiting for opponent to play"
                    );
                }

                // ─── Opponent Submits — Resolve Battle ────────────────────────────
                const challengerScore = activeBattle.challenger.score;
                const opponentScore = playerScore;
                const isDraw = challengerScore === opponentScore;

                const winner = isDraw
                    ? null
                    : challengerScore > opponentScore
                        ? { username: activeBattle.challenger.username, walletAddress: activeBattle.challenger.walletAddress }
                        : { username: activeBattle.opponent.username, walletAddress: activeBattle.opponent.walletAddress };

                const loser = isDraw
                    ? null
                    : winner?.walletAddress === activeBattle.challenger.walletAddress
                        ? { username: activeBattle.opponent.username, walletAddress: activeBattle.opponent.walletAddress }
                        : { username: activeBattle.challenger.username, walletAddress: activeBattle.challenger.walletAddress };

                const chiPrize = activeBattle.wagerAmount * 2;

                // ─── Persist Battle Result ────────────────────────────────────────
                const resolvedBattle = await dbBattleMatches.findOneAndUpdate(
                    { _id: new ObjectId(battleId) },
                    {
                        "opponent.score": opponentScore,
                        "opponent.played": true,
                        winnerUsername: winner?.username ?? null,
                        isBattleCompleted: true,
                    }
                );

                if (isDraw) {
                    // Refund both players their wager on a draw
                    await Promise.all([
                        dbPlayers.updateOne(
                            { walletAddress: activeBattle.challenger.walletAddress },
                            { $inc: { chi: activeBattle.wagerAmount } }
                        ),
                        dbPlayers.updateOne(
                            { walletAddress: activeBattle.opponent.walletAddress },
                            { $inc: { chi: activeBattle.wagerAmount } }
                        ),
                    ]);

                    return successResponse(
                        { winner: null, battle: resolvedBattle },
                        "Battle ended in a draw — wagers refunded"
                    );
                }

                // ─── Award Winner & Notify Both Players ───────────────────────────
                const winnerNotification = {
                    type: "wager_result" as const,
                    message: `You won the battle against ${loser!.username}! Prize: ${chiPrize.toLocaleString()} CHI`,
                    token: "",
                    isRead: false,
                    createdAt: new Date(),
                };

                const loserNotification = {
                    type: "wager_result" as const,
                    message: `You lost the battle against ${winner!.username}. Wager: ${activeBattle.wagerAmount.toLocaleString()} CHI`,
                    token: "",
                    isRead: false,
                    createdAt: new Date(),
                };

                const notificationOptions = { $position: 0, $slice: 60 };

                await Promise.all([
                    dbPlayers.updateOne(
                        { walletAddress: winner!.walletAddress },
                        { $inc: { chi: chiPrize } }
                    ),
                    dbPlayers.updateOne(
                        { walletAddress: winner!.walletAddress },
                        { $push: { notifications: { $each: [winnerNotification], ...notificationOptions } } }
                    ),
                    dbPlayers.updateOne(
                        { walletAddress: loser!.walletAddress },
                        { $push: { notifications: { $each: [loserNotification], ...notificationOptions } } }
                    ),
                ]);

                const currentDate = new Date();
                await Promise.all([
                    dbChiTransactions.insertMany([
                        {
                            ownerWalletAddress: winner!.walletAddress,
                            type: TRANSACTION.BATTLE_RESULT,
                            chiAmount: chiPrize,
                            referenceType: 'battle',
                            referenceId: battleId,
                            message: `Battle with ${loser?.username}, result : WON`,
                            status: 'success',
                            createdAt: currentDate,
                            updatedAt: currentDate
                        },
                        {
                            ownerWalletAddress: loser!.walletAddress,
                            type: TRANSACTION.BATTLE_RESULT,
                            chiAmount: -activeBattle.wagerAmount,
                            referenceType: 'battle',
                            referenceId: battleId,
                            message: `Battle with ${winner?.username}, result : LOST`,
                            status: 'success',
                            createdAt: currentDate,
                            updatedAt: currentDate
                        }]
                    )
                ]);

                return successResponse<{
                    winner: string,
                    battle: BattleMatch
                }>(
                    { winner: winner!.username, battle: resolvedBattle },
                    "Battle completed"
                );

            } catch (error) {
                return throwError((error as Error).message);
            }
        },
    },
    routes: [],
    rateLimits: [],
    channels: []
})

export default battleMatchModule;