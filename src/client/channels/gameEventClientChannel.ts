// src/client/channels/gameClientChannel.ts
//
// Receives "newLevel" (knife game) and "continueGame" pushes from
// gameServerChannel. Join with your own wallet address while actively
// playing.

import { ClientChannel } from 'modelence/client';
import { GameEventPayload } from '@/shared/schemas/channels/gameEvent.schema';

const gameEventClientChannel = new ClientChannel<GameEventPayload>('game', (payload) => {
    if (payload.type === 'newLevel') {
        // Update your knife-game UI with payload.session
    } else if (payload.type === 'continueGame') {
        // Resume gameplay with payload.session after payment
    }
});

export default gameEventClientChannel;