// src/server/stores/types.ts
//
// Shared shape for a player's live game session, used by both the
// in-memory cache (liveGameCache.ts) and the durable store (gameSessionStore.ts).
import { GameType } from "@/shared/constants/GameTypes";

export interface KnifeLevelData {
    level: number;
    apples: number[];
    preAttachedKnives: number[];
    variation?: number[];
    throwableKnives: number;
    changeTime: number;
    boss: {
        name: string | null;
        type: string | null;
        score: number;
    };
}

export interface TreeBranch {
    type: 'branch' | 'scoreBonus' | 'timeBonus' | null;
    position: 'left' | 'right' | 'none';
    id: number;
}

export interface GameSession {
    userId: string;
    isGamePaused: boolean;
    gameType: GameType

    // Knife game fields
    knifeStage?: number;
    knifeScore?: number;
    knifeLevelData?: KnifeLevelData;

    // Tree game fields
    treeScore?: number;
    treeBranches?: TreeBranch[];
    treeLastTimeBonusSentAt?: number;
}