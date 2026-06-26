import { Module } from 'modelence/server'
import { dbWeeklyRewards } from './stores/weeklyRewardStore';
import { successResponse, throwError } from '../utils/responsHandler';
import { WeeklyReward } from '@/shared/schemas/weeklyReward.schema';
import { startLeaderboardRewardUpdate } from '../crons/cronJobs';
import { time } from 'modelence';

const weeklyRewardModule = new Module('weeklyReward', {
    stores: [dbWeeklyRewards],
    queries: {

        //Gets latest weeklyReward document
        async getLatestWeeklyReward(_) {
            const latestReward = await dbWeeklyRewards.findOne({}, { sort: { createdAt: -1 } });
            if (!latestReward) return throwError("No Active Thrones Found!");

            return successResponse<WeeklyReward>(latestReward, "Weekly Rewards Fetched!")
        }
    },
    mutations: {

    },
    routes: [],
    rateLimits: [],

    channels: [],
    cronJobs: {
        updateLeaderboardReward: {
            description: "Updates the leaderboard reward snapshot every 4 hours",
            interval: time.hours(1),
            handler: startLeaderboardRewardUpdate,
        }, //TODO: Uncomment this...
    }
})

export default weeklyRewardModule;