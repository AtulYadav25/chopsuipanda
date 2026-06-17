import { LiveData, Module } from 'modelence/server'
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

const playerModule = new Module('player', {
    stores: [dbPlayers],
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





        // Auth & Profile Refersh ───────────────────────────────────────────────


        /*
        @authPlayer
        Used to register new players Or Refresh Auth Tokens
        */
        async authPlayer({ walletAddress, message, signature }: any, { res }) {
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

                const token = jwt.sign(
                    { time: Date.now(), walletAddress },
                    configModule.getConfig('JWT_SECRET'),
                    {
                        expiresIn: tenDaysInSeconds,
                    }
                );

                const socketToken = jwt.sign(
                    { time: Date.now(), walletAddress },
                    configModule.getConfig('JWT_SECRET'),
                    {
                        expiresIn: tenDaysInSeconds,
                    }
                );

                // ✅ Set token cookie for 10 days
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: true, // Only over HTTPS
                    sameSite: "None",
                    maxAge: tenDaysInMilliseconds,
                });

                // ✅ Set socketToken cookie for 10 days // TODO: Probably we might not need this socketToken
                res.cookie("socketToken", socketToken, {
                    httpOnly: true,
                    secure: true, // Only over HTTPS
                    sameSite: "None",
                    maxAge: tenDaysInMilliseconds,
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