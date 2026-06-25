import { createClientModule } from 'modelence/client';

import type friendshipModule from '@/server/modules/friendshipModule';
import type playerModule from '@/server/modules/playersModule';
import type battleMatchModule from '@/server/modules/battleMatchModule';
import suiModule from '@/server/modules/suiModule';
import chopsuipandaModule from '@/server/modules/chopsuipandaModule';
import configModule from '@/server/modules/configModule';
import weeklyRewardModule from '@/server/modules/weeklyRewardModule';

export const playerClientModule = createClientModule<typeof playerModule>('player');

export const friendshipClientModule = createClientModule<typeof friendshipModule>('friendship');

export const battleMatchClientModule = createClientModule<typeof battleMatchModule>('battleMatch');

export const suiClientModule = createClientModule<typeof suiModule>('sui');

export const chopsuipandaClientModule = createClientModule<typeof chopsuipandaModule>('chopsuipanda');

export const configClientModule = createClientModule<typeof configModule>('config');

export const weeklyRewardClientModule = createClientModule<typeof weeklyRewardModule>('weeklyReward');