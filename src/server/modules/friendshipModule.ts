import { Module } from 'modelence/server'
import { dbFriendships } from './stores/friendshipStore';

const friendshipModule = new Module('weeklyReward', {
    stores: [dbFriendships],
    queries: {

    },
    mutations: {

    },
    routes: [],
    rateLimits: [],

    channels: []
})

export default friendshipModule;