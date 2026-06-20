import { startApp } from 'modelence/server';
import playerModule from './modules/playersModule';
import configModule from './modules/configModule';
import weeklyRewardModule from './modules/weeklyRewardModule';
import battleMatchModule from './modules/battleMatchModule';
import friendshipModule from './modules/friendshipModule';
import gameSessionModule from './modules/gameSessionModule';
import suiModule from './modules/suiModule';
import chiTransactionModule from './modules/chiTransactionModule';

startApp({
    modules: [
        playerModule,
        configModule,
        weeklyRewardModule,
        battleMatchModule,
        friendshipModule,
        chiTransactionModule,
        gameSessionModule,
        suiModule,
    ]
});
