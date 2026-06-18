import { Module } from 'modelence/server'
import { dbChiTransactions } from './stores/chiTransactionStore';

const chiTransactionModule = new Module('chiTransaction', {
    stores: [dbChiTransactions],
    queries: {

    },
    mutations: {

    },
    routes: [],
    rateLimits: [],
    channels: []
})

export default chiTransactionModule;