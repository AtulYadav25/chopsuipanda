import { GameSession } from "@/server/modules/stores/types";
export type GameEventType = 'newLevel' | 'continueGame';

export interface GameEventPayload {
    type: GameEventType;
    session: GameSession;
}
