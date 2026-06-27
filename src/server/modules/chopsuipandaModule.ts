// src/server/module.ts
//
// Wires everything together: stores, channels, mutations, and the
// continueGame HTTP route. This is the single registration point Modelence
// needs — no separate `initializeSocket`/`initializebambooGameEvents`-style
// manual wiring required, since channel join/leave and auth are handled
// internally by Modelence once channels are listed here.

import { Module } from 'modelence/server';

import gameSessionStore from './stores/gameSessionStore';
import notificationServerChannel from './channels/notificationServerChannel';
import gameServerChannel from './channels/gameServerChannel';

import { registerSession, expireSession } from './methods/games/sessionLifecycle';
import { bambooShootSessionStart, throwBamboo } from './methods/games/knifeGame';
import { treeChopSessionStart, chopTree } from './methods/games/treeGame';
import { Context } from 'modelence/types';
import { requirePlayer } from '../utils/authPlayer';
import { dbPlayers } from './stores/playerStore';
import { successResponse, throwError } from '../utils/responsHandler';
import { getSession, setSession } from './stores/liveGameCache';
import { GAME_TYPES } from '@/shared/constants/GameTypes';
import { calculatePlayerScore } from '../utils/calculateScore';

export default new Module('chopsuipanda', {
    stores: [gameSessionStore],

    channels: [notificationServerChannel, gameServerChannel],

    queries: {
        async checkPingPong() {
            return successResponse({}, 'Pong!')
        }
    },

    mutations: {
        // Session lifecycle (replaces "register" socket event; see
        // sessionLifecycle.ts for the disconnect-hook limitation)
        registerSession: (_args: unknown, ctx: Context) => {
            return registerSession(ctx);
        },
        expireSession: (_args: unknown, ctx: Context) => {
            return expireSession(ctx);
        },

        // bamboo game
        bambooShootSessionStart,
        throwBamboo,

        // Tree game
        treeChopSessionStart,
        chopTree,

        //Continue Game
        async contiueGame(_, { req }) {
            try {
                let { walletAddress, userId } = requirePlayer(req);

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

                const sessionData = getSession(userId);

                if (!sessionData) {
                    return throwError("Player not found");
                }

                if (!sessionData.isGamePaused) {
                    return throwError("Unauthorized Access");
                };


                // Increment continues if it's less than 10
                if (player.continues <= 10) {

                    await dbPlayers.updateOne(
                        { walletAddress },
                        {
                            $inc: {
                                chi: -(player.continues * 5000),
                                continues: 1
                            },
                            $set: {
                                hasPendingContinue: false,
                            }
                        }
                    );

                    const newSession = {
                        ...sessionData,
                        isGamePaused: false
                    };

                    setSession(userId, newSession);
                    await gameSessionStore.updateOne({ userId }, { $set: newSession });

                    gameServerChannel.broadcast(walletAddress.toLowerCase(), {
                        type: 'continueGame',
                        session: newSession
                    })

                    return successResponse({}, "Player continues successfully");

                } else {
                    return throwError("Player has already reached the maximum of 10 continues");
                }
            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async endGameSession(_, { req }) {
            try {
                const { walletAddress, userId } = requirePlayer(req);

                let player = await dbPlayers.findOne({ walletAddress });

                if (!player) {
                    return throwError("Player not found");
                }

                const userData = getSession(userId);

                if (!userData) {
                    return throwError("User not found");
                }

                let calculatedchi = 0;
                let toUpdateScore = userData.gameType === GAME_TYPES.TREE_CHOP ? userData.treeChopScore : userData.bambooShootScore;

                if ((toUpdateScore! as number) > 15) {
                    calculatedchi = calculatePlayerScore(toUpdateScore!, userData.gameType)
                }

                await gameSessionStore.updateOne({ userId }, {
                    $set: {
                        isGamePaused: true
                    }
                });

                setSession(userId, { ...userData, isGamePaused: true });

                await dbPlayers.updateOne({ walletAddress }, {
                    $set: {
                        chiEarned: calculatedchi + player.chiEarned,
                        chi: player.chi + calculatedchi,
                        continues: player.continues + 1,
                        hasPendingContinue: true
                    }
                })


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
        },

    },
});