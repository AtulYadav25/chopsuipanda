// src/client/channels/gameClientChannel.ts
//
// Receives "newLevel" (bamboo game) and "continueGame" pushes from
// gameServerChannel. Join with your own wallet address while actively
// playing.

import { ClientChannel } from 'modelence/client';
import { GameEventPayload } from '@/shared/schemas/channels/gameEvent.schema';
import { useGameplayStore } from '../store/useGameplayStore';

// --- Subscriber registry for game event listeners ---
type GameMessageCallback = (payload: GameEventPayload) => void;
const listeners = new Set<GameMessageCallback>();

/**
 * Register a callback that fires whenever a game event (newLevel, continueGame)
 * is received from the server channel.
 *
 * Returns an unsubscribe function — call it in your useEffect cleanup.
 *
 * @example
 * useEffect(() => {
 *     const unsub = onGameMessage((msg) => {
 *         if (msg.type === 'newLevel') { ... }
 *     });
 *     return unsub;
 * }, []);
 */
export function onGameMessage(callback: GameMessageCallback): () => void {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
}

const gameEventClientChannel = new ClientChannel<GameEventPayload>('gameEvents', (payload) => {
    console.log("I got the payload");
    console.log(payload)

    // Notify all registered listeners
    listeners.forEach((cb) => cb(payload));

    if (payload.type === 'newLevel') {
        // Update your Bamboo-game UI with payload.session

        console.log("New Level Recevied: ");
        console.log(payload.session)
        useGameplayStore.getState().setLastGameEvent(payload.session, 'newLevel');
    } else if (payload.type === 'continueGame') {
        // Resume gameplay with payload.session after payment
        useGameplayStore.getState().setLastGameEvent(payload.session, 'continueGame');
    }
});

export default gameEventClientChannel;