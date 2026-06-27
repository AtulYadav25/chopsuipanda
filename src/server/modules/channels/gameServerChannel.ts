// src/server/channels/gameServerChannel.ts
//
// Replaces the old `io.to(socket.id).emit("new-level", ...)` and
// `io.to(socketId).emit("continue-game", ...)` calls.
//
// Same per-user pattern as notifications: each player joins a channel keyed
// by their own wallet address. broadcast(walletAddress, payload) then only
// reaches that one player's socket.

import { ServerChannel } from 'modelence/server';
import { GameEventPayload } from '@/shared/schemas/channels/gameEvent.schema';


const gameServerChannel = new ServerChannel<GameEventPayload>('gameEvents', async ({ user }) => {
    // Only authenticated users can join
    if (!user) {
        return false;
    }

    return true;
}
);

export default gameServerChannel;