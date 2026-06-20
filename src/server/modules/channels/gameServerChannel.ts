// src/server/channels/gameServerChannel.ts
//
// Replaces the old `io.to(socket.id).emit("new-level", ...)` and
// `io.to(socketId).emit("continue-game", ...)` calls.
//
// Same per-user pattern as notifications: each player joins a channel keyed
// by their own wallet address. broadcast(walletAddress, payload) then only
// reaches that one player's socket.

import { ServerChannel } from 'modelence/server';
import type { GameSession } from '../stores/types';
import configModule from '../configModule';
import jwt from 'jsonwebtoken'
import { PlayerAuthToken } from '@/server/utils/jwtHelper';

export type GameEventType = 'newLevel' | 'continueGame';

export interface GameEventPayload {
    type: GameEventType;
    session: GameSession;
}

const gameServerChannel = new ServerChannel<GameEventPayload>('game', async ({ session }) => {
    // Only authenticated users can join
    if (!session?.authToken) {
        return false;
    }

    const decoded = jwt.verify(session.authToken, configModule.getConfig('JWT_SECRET')) as PlayerAuthToken;

    if (!decoded) return false;

    return true;
}
);

export default gameServerChannel;