// src/server/stores/types.ts
//
// Shared shape for a player's live game session, used by both the
// in-memory cache (liveGameCache.ts) and the durable store (gameSessionStore.ts).
import { GameType } from "@/shared/constants/GameTypes";

export interface BambooShootLevelData {
    level: number;
    apples: number[];
    preAttachedBamboos: number[];
    variation?: number[];
    throwableBamboos: number;
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

    // Bamboo Shoot game fields
    bambooShootStage?: number;
    bambooShootScore?: number;
    bambooShootLevelData?: BambooShootLevelData;

    // Tree game fields
    treeChopScore?: number;
    treeChopBranches?: TreeBranch[];
    treeChopLastTimeBonusSentAt?: number;
}