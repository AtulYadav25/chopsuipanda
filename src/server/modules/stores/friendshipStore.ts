import { ObjectId, schema, Store } from 'modelence/server';
import { dbPlayers } from './playerStore';
import { FriendsList } from '@/shared/schemas/friendship.schema';

// ─── Friendship Store ───────────────────────────────────────────────────────

export const friendshipSchema = {
    user1: schema.objectId(),
    user2: schema.objectId(),
    status: schema.enum(['pending', 'accepted']),
    initiatedBy: schema.objectId(),
    synergy: schema.number(),   // incremented on player interactions
    createdAt: schema.date(),
    updatedAt: schema.date(),
};

export const dbFriendships = new Store('friendships', {
    schema: friendshipSchema,

    indexes: [
        { key: { user1: 1, user2: 1 }, unique: true },
        { key: { user2: 1, user1: 1 } },
        { key: { status: 1 } },
        { key: { synergy: -1 } },   // for sorted friend list queries
    ],
});

// ─── getPlayerSocialData ───────────────────────────────────────────────────
export async function getPlayerSocialData(playerId: ObjectId): Promise<{
    friends: FriendsList;
    pendingRequests: FriendsList;
}> {
    const friendships = await dbFriendships.fetch({
        $or: [
            { user1: playerId, status: 'accepted' },
            { user2: playerId, status: 'accepted' },
            { user2: playerId, status: 'pending' },  // requests received by this player
        ],
    });

    const accepted = friendships.filter((f) => f.status === 'accepted')
        .sort((a, b) => b.synergy - a.synergy);

    const pending = friendships.filter((f) => f.status === 'pending');

    // Collect all unique player IDs needed
    const allIds = friendships.map((f) =>
        f.user1.equals(playerId) ? f.user2 : f.user1
    );

    if (allIds.length === 0) return { friends: [], pendingRequests: [] };

    const players = await dbPlayers.fetch(
        { _id: { $in: allIds } },
        { projection: { walletAddress: 1, username: 1 } }
    );

    const playerMap = new Map(players.map((p) => [p._id.toString(), p]));

    const toFriendDetails = (fs: typeof friendships): FriendsList =>
        fs
            .map((f) => {
                const friendId = f.user1.equals(playerId) ? f.user2 : f.user1;
                const player = playerMap.get(friendId.toString());
                if (!player) return null;
                return {
                    walletAddress: player.walletAddress,
                    username: player.username,
                    synergy: f.synergy,
                };
            })
            .filter((f): f is NonNullable<typeof f> => f !== null);

    return {
        friends: toFriendDetails(accepted),         // sorted by synergy
        pendingRequests: toFriendDetails(pending),   // who sent this player a request
    };
}