import { Module } from 'modelence/server'
import { dbFriendships } from './stores/friendshipStore';

const suiModule = new Module('sui', {
    stores: [],
    queries: {

    },
    mutations: {

    },
    routes: [],
    rateLimits: [],

    channels: []
})

export default suiModule;