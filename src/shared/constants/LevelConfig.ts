import { GAME_TYPES, type GameType } from './GameTypes';

export type LevelConfig = {
    upgradeCost: number;
    unlocks: readonly GameType[];
};

export const LEVEL_CONFIG: Record<number, LevelConfig> = {
    1: {
        upgradeCost: 100,
        unlocks: [GAME_TYPES.CHOP_TREE],
    },
    2: {
        upgradeCost: 250,
        unlocks: [GAME_TYPES.KNIFE_HIT],
    },
    3: {
        upgradeCost: 500,
        unlocks: [],
    },
};

export const MAX_LEVEL = Math.max(
    ...Object.keys(LEVEL_CONFIG).map(Number),
);

export function getAvailableGames(level: number): GameType[] {
    const games = new Set<GameType>();

    for (let i = 1; i <= level; i++) {
        const config = LEVEL_CONFIG[i];

        if (!config) continue;

        for (const game of config.unlocks) {
            games.add(game);
        }
    }

    return [...games];
}