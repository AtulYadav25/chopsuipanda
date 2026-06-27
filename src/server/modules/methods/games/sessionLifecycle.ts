// src/server/methods/games/sessionLifecycle.ts
//
// --- IMPORTANT MIGRATION NOTE ---
// The original sockets.js had this flow on every raw connection:
//
//   io.on("connection", socket => {
//     WalletToSocket.set(wallet, socket.id)
//     socket.on("register", ...)
//     socket.on("disconnect", ...)
//   })
//
// Modelence's public WebSocket API does NOT expose `io.on('connection', ...)`
// or `socket.on('disconnect', ...)` to application code — these live inside
// Modelence's own Socket.IO wrapper and aren't surfaced to your Module code.
// There is no direct migration for "run this code when a socket connects or
// disconnects."
//
// What this means practically:
//   - `registerSession` below replaces the "register" handler, but it has to
//     be called as a regular mutation from the client right after the
//     websocket connects (see client/channels — call it once on mount),
//     instead of firing automatically server-side on socket connection.
//   - There is no automatic disconnect cleanup anymore. The 60s grace-period
//     expiry (gameSessionStore's TTL index) covers most of what the old
//     disconnect handler did for Redis, but the in-memory `liveGameCache`
//     and `walletToSocketId` map entries will NOT be cleaned up on
//     disconnect, because we have no disconnect hook to clean them from.
//     Options if this matters for you:
//       1) Add a lightweight client-side heartbeat mutation (e.g. call
//          `touchSession` every N seconds) and a cron job that sweeps
//          liveGameCache entries that haven't been touched recently.
//       2) Patch Modelence itself to expose an onDisconnect hook on
//          ServerChannel or startApp — you're already contributing PRs
//          upstream, so this is a legitimate option, just not a 5-minute fix.
//   - If precise online/offline presence detection turns out to matter for
//     ChopsuiPanda (e.g. for friend-request "is this user online" indicators),
//     flag it and we can scope out option 2 properly instead of guessing at
//     a workaround here.

import { Context } from 'modelence/types';
import gameSessionStore from '../../stores/gameSessionStore';
import { getSession, setSession } from '../../stores/liveGameCache';
import type { GameSession } from '../../stores/types';
import { dbPlayers } from '../../stores/playerStore';
import { requirePlayer } from '@/server/utils/authPlayer';
import { GAME_TYPES } from '@/shared/constants/GameTypes';

/**
 * Replaces the old `socket.on("register", ...)` handler.
 * Call this once from the client right after the websocket connects.
 */
export async function registerSession(ctx: Context): Promise<void> {
    const { req } = ctx
    const { userId } = requirePlayer(req!);
    if (!userId) return;

    const player = await dbPlayers.findById(userId)

    if (!player || player._id.toString() != userId) {
        throw new Error('Player not found');
    }

    let existing = await gameSessionStore.findOne({ userId });

    if (!existing) {
        existing = await gameSessionStore.create({
            userId: player._id.toString(),
            isGamePaused: true,
            gameType: GAME_TYPES.IDLE,
        })
    }

    const sessionData: GameSession = {
        ...(existing)
    };

    setSession(player._id.toString(), sessionData);
}

//TODO : When client disconnects, expire the session (From Client Side)

/**
 * Best-effort cleanup, intended to be called explicitly (e.g. from a
 * "leaveGame" mutation fired on page unload, or a heartbeat sweep) since
 * there's no automatic disconnect hook — see note above.
 */
export async function expireSession(ctx: Context): Promise<void> {
    const { req } = ctx
    const { userId } = requirePlayer(req!);
    if (!userId) return;

    const existing = getSession(userId);
    if (!existing) return;

    const expiresAt = new Date(Date.now() + 60_000); // 60s grace period, matches original
    await gameSessionStore.updateOne({ userId }, { $set: { expiresAt } });
}