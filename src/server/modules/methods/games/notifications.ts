// src/server/methods/games/notifications.ts
//
// Replaces the old generic `sendNotification(type, walletAddress, message, id)`
// utility. Per spec, this is scoped to exactly two notification kinds:
// friend requests and battle challenge requests.
//
// Each user is expected to join `notifications:<their own walletAddress>`
// on the client (see client/channels/notificationClientChannel.ts).
// Broadcasting to that walletAddress then reaches only that user's socket.
//
// SECURITY NOTE: ServerChannel's access-control callback only receives
// { user, session, roles } — it does NOT receive the channel id the client
// is trying to join. That means we can verify "is this user logged in" but
// can't enforce "can this user join *this specific* wallet's channel" from
// inside canAccessChannel alone. For notifications this is low-risk (a user
// snooping another user's friend-request notifications isn't a serious
// breach), but it's worth knowing this isn't airtight. If you need it
// airtight, the fix has to happen upstream in Modelence, not here.

import { z } from 'zod';
import notificationServerChannel from '../../channels/notificationServerChannel';

export async function notifyFriendRequest(args: unknown) {
    const { toUserId, fromUsername, friendRequestId, type } = z
        .object({
            toUserId: z.string(),
            fromUsername: z.string(),
            friendRequestId: z.string(),
            type: z.union([z.literal('friendRequestSent'), z.literal('friendRequestAccepted')]),
        })
        .parse(args);

    notificationServerChannel.broadcast(toUserId, {
        type,
        message: type === 'friendRequestSent' ? `${fromUsername} wants to be your fren!` : `${fromUsername} is now your fren!`,
        referenceId: friendRequestId,
    });
}

// NOTE: For notifications of battle use username from client to join channel
export async function notifyBattle(args: { toWalletAddress: string, fromUsername: string, type: 'battleChallenge' | 'battleResult', isWinner?: boolean, challengeId: string }) {
    const { toWalletAddress, fromUsername, type, isWinner, challengeId } = z
        .object({
            toWalletAddress: z.string(),
            fromUsername: z.string(),
            challengeId: z.string(),
            type: z.union([z.literal('battleChallenge'), z.literal('battleResult')]),
            isWinner: z.boolean(),
        })
        .parse(args);

    notificationServerChannel.broadcast(toWalletAddress, {
        type,
        message: type === 'battleChallenge' ? `${fromUsername} challenged you to battle!` : `You ${isWinner ? 'Won' : 'Lost'} against ${fromUsername} in battle!`,
        referenceId: challengeId,
    });
}