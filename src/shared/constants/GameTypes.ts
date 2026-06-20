import { z } from 'zod';

export const GAME_TYPES = {
    KNIFE_HIT: 'KNIFE_HIT',
    CHOP_TREE: 'CHOP_TREE',
    IDLE: 'IDLE'
} as const;

export const GameTypeSchema = z.nativeEnum(GAME_TYPES);

export type GameType = z.infer<typeof GameTypeSchema>;

export const GAME_TYPE_VALUES = Object.values(GAME_TYPES) as [GameType, ...GameType[]];