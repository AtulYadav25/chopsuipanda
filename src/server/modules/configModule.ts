import { Module } from 'modelence/server'

const configModule = new Module('config', {
    configSchema: {
        JWT_SECRET: {
            type: 'secret',
            default: process.env.JWT_SECRET || '',
            isPublic: false,
        },
        SERVER_WALLET_PRIVATE_KEY: { // Used for sending sui rewards (cron job)
            type: 'secret',
            default: process.env.SERVER_WALLET_PRIVATE_KEY || '',
            isPublic: false,
        },
        MODULE_NAME: {
            type: 'secret',
            default: process.env.MODULE_NAME || '',
            isPublic: false,
        },
        SUI_NETWORK: {
            type: 'secret',
            default: process.env.SUI_NETWORK || '',
            isPublic: false,
        },
        PACKAGE_ID: {
            type: 'secret',
            default: process.env.PACKAGE_ID || '',
            isPublic: false,
        },
    },
    routes: [],
    rateLimits: [],
    channels: []
})


export default configModule;