import { startApp } from 'modelence/server';
import playerModule from './modules/playersModule';
import configModule from './modules/configModule';
import weeklyRewardModule from './modules/weeklyRewardModule';
import battleMatchModule from './modules/battleMatchModule';
import friendshipModule from './modules/friendshipModule';
import chopsuipandaModule from './modules/chopsuipandaModule';
import suiModule from './modules/suiModule';
import chiTransactionModule from './modules/chiTransactionModule';
import { seedInitialWeeklyReward } from './migrations/SeedInitialWeeklyReward';

startApp({
    modules: [
        playerModule,
        configModule,
        weeklyRewardModule,
        battleMatchModule,
        friendshipModule,
        chiTransactionModule,
        chopsuipandaModule,
        suiModule,
    ],
    migrations: [
        {
            version: 1,
            description: 'Seed Initial WeeklyReward',
            handler: seedInitialWeeklyReward,
        },
    ]
});
