import { Module } from 'modelence/server'
import { dbWeeklyRewards } from './stores/weeklyRewardStore';

const weeklyRewardModule = new Module('weeklyReward', {
    stores: [dbWeeklyRewards],
    queries: {

    },
    mutations: {

    },
    routes: [],
    rateLimits: [],

    channels: []
})

export default weeklyRewardModule;