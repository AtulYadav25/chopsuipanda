import { z } from 'zod';
import { GAME_TYPE_VALUES } from '@/shared/constants/GameTypes';

// ─── Battle Match Zod Schema ──────────────────────────────────────────────────

export const battleMatchSchema = z.object({
    _id: z.string(),
    challenger: z.object({
        username: z.string(),
        score: z.number(),
        played: z.boolean(),
        walletAddress: z.string(),
    }),

    opponent: z.object({
        username: z.string(),
        score: z.number(),
        played: z.boolean(),
        walletAddress: z.string(),
    }),

    gameMode: z.enum(GAME_TYPE_VALUES),

    wagerAmount: z.number(),

    winnerUsername: z.string().nullable().optional(),

    isBattleCompleted: z.boolean(),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type BattleMatch = z.infer<typeof battleMatchSchema>;

// ─── Battle Challenge Schema ──────────────────────────────────────────────────

export const sendBattleChallengeSchema = battleMatchSchema
    .pick({
        gameMode: true,
        wagerAmount: true,
    })
    .extend({
        friendUsername: z.string(),
    });

export type SendBattleChallenge = z.infer<typeof sendBattleChallengeSchema>;