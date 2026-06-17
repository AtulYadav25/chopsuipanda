import { Module } from 'modelence/server'
import { requirePlayer } from '../utils/authPlayer';
import { dbPlayers } from './stores/playerStore';
import { successResponse, throwError } from '../utils/responsHandler';
import { calculatePlayerScore } from '../utils/calculateScore';
import { GAME_TYPES } from '@/shared/constants/GameTypes';

const gameSessionModule = new Module('gameSession', {
    stores: [],
    queries: {

    },
    mutations: {
        async startGameSession(_, { req }) {
            try {
                let { walletAddress } = requirePlayer(req);

                // Find player in the leaderboard
                let player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError("Player Not Found")
                }

                // TODO : Use Customized Data instead of redis
                // const redisData = await redisClient.get(`user:${walletAddress}`);

                // if (!redisData) {
                //     return res.status(404).json({ success: false, message: "Player not found" });
                // }
                // const userData = JSON.parse(redisData);
                // const newData = {
                //     ...userData,
                //     score: 0,
                //     isGamePause: false,
                // };
                // await redisClient.set(`user:${walletAddress}`, JSON.stringify(newData));

                // Update existing player session
                await dbPlayers.updateOne(
                    { walletAddress },
                    {
                        $set: {
                            continues: 0
                        }
                    }
                );

                return successResponse({}, "Game Session Started")

            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async continuteGameSession(_, { req }) {
            try {
                let { walletAddress } = requirePlayer(req);

                // Convert message (Uint8Array) to timestamp

                // Find player in the database
                const player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError("Player not found");
                }

                if (player.continues > 10) {
                    return throwError("You have used all your continue game credits.")
                }

                if (player.chi < (player.continues * 5000)) {
                    return throwError("Insufficient CHI Balance")
                }

                // TODO 
                // const redisData = await redisClient.get(`user:${walletAddress}`);
                // if (!redisData) {
                //     return res.status(400).json({ success: false, message: "User is not Active" })
                // }
                // const userData = JSON.parse(redisData);
                const userData = {
                    isGamePause: true
                };

                if (!userData.isGamePause) {
                    return throwError("Unauthorized Access");
                }

                await await dbPlayers.updateOne(
                    { walletAddress },
                    {
                        chi: (player.chi - (player.continues * 5000)),
                    }
                );

                // Increment continues if it's less than 10
                if (player.continues <= 10) {
                    // const newData = {
                    //     ...userData,
                    //     isGamePause: false
                    // };
                    // TODO 
                    // await redisClient.set(`user:${walletAddress}`, JSON.stringify(newData));

                    // TODO 
                    // continueSocket(walletAddress, newData)

                    return throwError("Player continues successfully");

                } else {
                    return throwError("Player has already reached the maximum of 10 continues");
                }
            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async endGameSession(_, { req }) {
            try {
                const { walletAddress } = requirePlayer(req);

                let player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError("Player not found");
                }

                // TODO
                // const redisData = await redisClient.get(`user:${walletAddress}`);
                // const userData = JSON.parse(redisData);
                const userData = {
                    score: 100,
                    gameType: GAME_TYPES.CHOP_TREE,
                    level: 1
                }
                let calculatedchi = 0;
                let toUpdateScore = userData.score;


                // TODO
                // let newData = {
                //     ...userData,
                //     isGamePause: true,
                // }
                if (userData.score > 15) {
                    calculatedchi = calculatePlayerScore(userData.score, userData.gameType)
                }

                // TODO
                // await redisClient.set(`user:${walletAddress}`, JSON.stringify(newData));
                // liveGames.set(walletAddress, newData)

                await dbPlayers.updateOne({ walletAddress }, { chiEarned: calculatedchi + player.chiEarned, chi: player.chi + calculatedchi, continues: player.continues + 1 })

                // TODO : I think i can use modelence live query instead of this websockets subscriber, 
                // but i need to figure out that modelence live query must be for top ranked players
                // const adminPanel = await Reward.find();
                // const rewardArr = adminPanel.length > 0 ? adminPanel[0]?.reward : [];

                // // let LeaderboardLength = adminPanel[0]?.reward.length > 0 ? getTotalQty(rewardArr) : 100;
                // let LeaderboardLength = Math.min(getTotalQty(rewardArr), 50);
                // // Get top players leaderboard to check eligibility


                // const leaderboard = await Leaderboard.find({}, { name: 1, walletAddress: 1, chiEarned: 1, _id: 0 })
                //     .sort({ chiEarned: -1 })
                //     .limit(LeaderboardLength);

                // // Check if the player's new chiEarned is greater than the lowest in top players
                // const lowestTopScore = leaderboard[leaderboard.length - 1]?.chiEarned;

                // if (toUpdateScore >= lowestTopScore) {
                //     // Eligible for leaderboard update
                //     const rewardType = adminPanel[0]?.rewardType || "points";
                //     const rewardDay = adminPanel[0]?.rewardDay;
                //     const payload = {
                //         leaderboard,
                //         reward: rewardArr,
                //         rewardType,
                //         rewardDay
                //     };
                //     await redisClient.set("leaderboard:top", JSON.stringify(payload), { EX: 60 });
                //     await redisPublisher.publish("leaderboard_update", JSON.stringify(payload));
                // }

                return successResponse<{
                    score: number,
                    chi: number
                }>({
                    score: toUpdateScore,
                    chi: calculatedchi
                }, "Game Session Ended")

            } catch (error) {
                return throwError((error as Error).message);
            }
        }

    },
    routes: [],
    rateLimits: [],

    channels: []
})

export default gameSessionModule;