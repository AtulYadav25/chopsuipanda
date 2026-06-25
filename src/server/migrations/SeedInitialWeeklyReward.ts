import { dbWeeklyRewards } from "../modules/stores/weeklyRewardStore"

function getWeeklySessionId() {
    const now = new Date();

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor(
        (now.getTime() - startOfYear.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    return `WEEK-${now.getFullYear()}-${week}`;
}

export const seedInitialWeeklyReward = async () => {
    try {
        const now = new Date();

        const rewardDay = new Date(now);
        rewardDay.setDate(rewardDay.getDate() + 7);

        const sessionId = getWeeklySessionId()

        await dbWeeklyRewards.create({
            // What's being rewarded this week
            rewardType: 'chi',

            rewards: [
                {
                    playerCount: 1,
                    rewardAmount: 300,
                },
            ],

            sessionId,

            // Top winners snapshot (populated when cron runs)
            topWinners: [],

            // Distribution date
            rewardDay,

            // System user
            lastUpdatedBy: '0x0',

            // Same exact timestamp
            createdAt: now,
            updatedAt: now,
        });

    } catch (error) {
        console.error('Failed to seed weekly reward:', error);
        throw error;
    }
};