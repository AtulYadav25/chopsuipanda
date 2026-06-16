import { z } from 'zod';

const rewardOfDay = z.object({
    day: z.number().int().min(1).max(7),
    reward: z.number().int().nonnegative(),
    rewardType: z.literal("CHI"),
})

export const dailyRewardsSchema = z.array(
    rewardOfDay
);

export type dailyReward = z.infer<typeof dailyRewardsSchema>;
export type rewardOfDay = z.infer<typeof rewardOfDay>;

export const dailyRewards: dailyReward = [
    { day: 1, reward: 400, rewardType: "CHI" },
    { day: 2, reward: 800, rewardType: "CHI" },
    { day: 3, reward: 1200, rewardType: "CHI" },
    { day: 4, reward: 1800, rewardType: "CHI" },
    { day: 5, reward: 2400, rewardType: "CHI" },
    { day: 6, reward: 3000, rewardType: "CHI" },
    { day: 7, reward: 3600, rewardType: "CHI" },
];