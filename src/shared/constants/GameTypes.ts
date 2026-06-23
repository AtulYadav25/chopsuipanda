import { z } from 'zod';

export const GAME_TYPES = {
    BAMBOO_SHOOT: 'BAMBOO_SHOOT',
    TREE_CHOP: 'TREE_CHOP',
    IDLE: 'IDLE'
} as const;

export const GameTypeSchema = z.nativeEnum(GAME_TYPES);

export type GameType = z.infer<typeof GameTypeSchema>;

export const GAME_TYPE_VALUES = Object.values(GAME_TYPES) as [GameType, ...GameType[]];

export const GAME_TYPES_UI: Record<GameType, string> = {
    BAMBOO_SHOOT: 'Bamboo Shoot',
    TREE_CHOP: 'Tree Chop',
    IDLE: 'Idle',
};