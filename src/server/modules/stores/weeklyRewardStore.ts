import { schema, Store } from 'modelence/server';

const weeklyWinnerSchema = schema.object({
    playerId: schema.objectId(),
    rank: schema.number(),          // 1-10
    chiEarned: schema.number(),     // snapshot at time of reward distribution
});

const rewardTierSchema = schema.object({
    playerCount: schema.number(),   // how many players qualify for this tier
    rewardAmount: schema.number(),  // how much each of those players gets
});

export const weeklyRewardSchema = {
    // What's being rewarded this week
    rewardType: schema.enum(['sui', 'chi']),
    rewards: schema.array(rewardTierSchema),

    // Session this reward belongs to
    sessionId: schema.string(),

    // Top 10 winners snapshot (populated when cron runs)
    topWinners: schema.array(weeklyWinnerSchema),

    // The day rewards are distributed for this session
    rewardDay: schema.date(),

    // Who last touched this document (admin wallet or system)
    lastUpdatedBy: schema.string(),

    // Sui payout cron state
    suiPayoutCron: schema.object({
        isRunning: schema.boolean(),
        lastRunAt: schema.date(),       // used to auto-reset if admin forgot to flip isRunning back
    }).optional(),

    createdAt: schema.date(),
    updatedAt: schema.date(),
};

// TODO : Add Cron job that updates this weekfly rewards every hour as the number of people increase

export const dbWeeklyRewards = new Store('weekly_rewards', {
    schema: weeklyRewardSchema,

    indexes: [
        { key: { sessionId: 1 }, unique: true },    // one reward doc per week
        { key: { rewardDay: -1 } },                  // latest week first
    ],
});