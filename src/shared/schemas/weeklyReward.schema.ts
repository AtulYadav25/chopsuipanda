import { z } from 'zod';

const ObjectIdSchema = z.string();

export const weeklyWinnerSchema = z.object({
    playerId: ObjectIdSchema,
    rank: z.number(), // 1-10
    chiEarned: z.number(), // snapshot at time of reward distribution
});

export const rewardTierSchema = z.object({
    playerCount: z.number(), // how many players qualify
    rewardAmount: z.number(), // reward per player
});

export const weeklyRewardSchema = z.object({
    // What's being rewarded this week
    rewardType: z.enum(['sui', 'chi']),
    rewards: z.array(rewardTierSchema),

    // Session this reward belongs to
    sessionId: z.string(),

    // Top 10 winners snapshot
    topWinners: z.array(weeklyWinnerSchema),

    // Distribution date
    rewardDay: z.date(),

    // Admin wallet or system
    lastUpdatedBy: z.string(),

    // Cron state
    suiPayoutCron: z.object({
        isRunning: z.boolean(),
        lastRunAt: z.date(),
    }).optional(),

    createdAt: z.date(),
    updatedAt: z.date(),
});

export type WeeklyWinner = z.infer<typeof weeklyWinnerSchema>;
export type RewardTier = z.infer<typeof rewardTierSchema>;
export type WeeklyReward = z.infer<typeof weeklyRewardSchema>;