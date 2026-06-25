// src/client/channels/gameClientChannel.ts
//
// Receives "newLevel" (bamboo game) and "continueGame" pushes from
// gameServerChannel. Join with your own wallet address while actively
// playing.

import { ClientChannel } from 'modelence/client';
import { GameEventPayload } from '@/shared/schemas/channels/gameEvent.schema';
import { useGameplayStore } from '../store/useGameplayStore';

const gameEventClientChannel = new ClientChannel<GameEventPayload>('game', (payload) => {
    if (payload.type === 'newLevel') {
        // Update your Bamboo-game UI with payload.session

        useGameplayStore.getState().setLastGameEvent(payload.session, 'newLevel');
    } else if (payload.type === 'continueGame') {
        // Resume gameplay with payload.session after payment
        useGameplayStore.getState().setLastGameEvent(payload.session, 'continueGame');
    }
});

export default gameEventClientChannel;