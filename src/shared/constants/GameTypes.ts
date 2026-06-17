import { z } from 'zod';

export const GAME_TYPES = {
    KNIFE_HIT: 'KNIFE_HIT',
    CHOP_TREE: 'CHOP_TREE',
} as const;

export const GameTypeSchema = z.nativeEnum(GAME_TYPES);

export type GameType = z.infer<typeof GameTypeSchema>;