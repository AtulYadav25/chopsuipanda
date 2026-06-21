import { Module } from 'modelence/server'
import { dbFriendships } from './stores/friendshipStore';
import { dbPlayers } from './stores/playerStore';
import { successResponse, throwError } from '../utils/responsHandler';
import { requirePlayer } from '../utils/authPlayer';
import { notifyFriendRequest } from './methods/games/notifications';

const friendshipModule = new Module('friendship', {
    stores: [dbFriendships],
    queries: {

    },
    mutations: {
        async sendFriendRequest(args: { friendUserName: string }, { req }) {
            const { friendUserName } = args;
            const { walletAddress } = requirePlayer(req);

            try {
                const requestingPlayer = await dbPlayers.findOne({ walletAddress });
                const targetPlayer = await dbPlayers.findOne({ username: friendUserName });

                if (!requestingPlayer || !targetPlayer) {
                    return throwError("Player not found");
                }

                if (targetPlayer.walletAddress === requestingPlayer.walletAddress) {
                    return throwError("You cannot send a friend request to yourself");
                }

                const existingFriendship = await dbFriendships.findOne({
                    $or: [
                        { user1: requestingPlayer._id, user2: targetPlayer._id },
                        { user1: targetPlayer._id, user2: requestingPlayer._id },
                    ],
                });

                if (existingFriendship?.status === "accepted") {
                    return throwError("You are already friends with this player");
                }

                const hasPendingRequest = existingFriendship?.status === "pending";

                if (hasPendingRequest) {
                    return throwError("You have already sent a friend request to this player");
                }

                // Add new friend request
                await dbFriendships.insertOne({
                    user1: requestingPlayer._id,
                    user2: targetPlayer._id,
                    status: "pending",
                    synergy: 0,
                    initiatedBy: requestingPlayer._id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                return successResponse({}, "Friend request sent");

            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async acceptFriendRequest(args: { friendUserName: string, accepted: boolean }, { req }) {
            try {
                const { friendUserName, accepted } = args;
                const { walletAddress } = requirePlayer(req);

                const respondingPlayer = await dbPlayers.findOne({ walletAddress });
                const requestingPlayer = await dbPlayers.findOne({ username: friendUserName });

                if (!respondingPlayer || !requestingPlayer) {
                    return throwError("Player not found");
                }

                const existingFriendship = await dbFriendships.findOne({
                    $or: [
                        { user1: respondingPlayer._id, user2: requestingPlayer._id },
                        { user1: requestingPlayer._id, user2: respondingPlayer._id },
                    ],
                });
                if (existingFriendship?.status === 'accepted') {
                    return throwError("You are already friends with this player");
                }

                let message;

                if (accepted) {
                    // Add each other to friends list
                    await dbFriendships.updateOne(
                        {
                            $or: [
                                { user1: respondingPlayer._id, user2: requestingPlayer._id },
                                { user1: requestingPlayer._id, user2: respondingPlayer._id },
                            ],
                        }, {
                        status: 'accepted',
                        updatedAt: new Date(),
                    }
                    );
                    // sendNotification('friendRequest', requestingPlayer.walletAddress, `Your friend ${respondingPlayer.name} has accepted your request`, 'ad');

                    message = "Friend request accepted";
                } else {
                    // Just remove the friend request
                    await dbFriendships.deleteOne(
                        {
                            $or: [
                                { user1: respondingPlayer._id, user2: requestingPlayer._id },
                                { user1: requestingPlayer._id, user2: respondingPlayer._id },
                            ],
                        }
                    );

                    message = "Friend request rejected";
                }

                if (accepted) {
                    notifyFriendRequest({
                        toUserId: requestingPlayer._id.toString(),
                        fromUsername: respondingPlayer.username,
                        friendRequestId: existingFriendship?._id?.toString(),
                        type: 'friendRequestAccepted'
                    })
                }


                return successResponse({}, message);

            } catch (error) {
                return throwError((error as Error).message);
            }
        },

        async deleteFriend(args, { req }) {
            try {
                const { friendUserName } = args;
                const { walletAddress } = requirePlayer(req);

                // Fetch both users
                const player = await dbPlayers.findOne({ walletAddress });
                const friend = await dbPlayers.findOne({ username: friendUserName });

                if (!player || !friend) {
                    return throwError("Player or Friend not found");
                }

                // Filter out each other from friends list
                const deletedFriendship = await dbFriendships.findOneAndDelete(
                    {
                        $or: [
                            { user1: player._id, user2: friend._id },
                            { user1: friend._id, user2: player._id },
                        ],
                    }
                );

                if (!deletedFriendship) {
                    return throwError("Friend Not Found");
                }

                return successResponse({}, `Removed ${friendUserName} from friends list`);

            } catch (error) {
                return throwError((error as Error).message);
            }
        }
    },
    routes: [],
    rateLimits: [],

    channels: []
})

export default friendshipModule;