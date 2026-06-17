import { startApp } from 'modelence/server';
import playerModule from './modules/playersModule';
import configModule from './modules/configModule';
import weeklyRewardModule from './modules/weeklyRewardModule';

startApp({
    modules: [
        playerModule,
        configModule,
        weeklyRewardModule
    ]
});
