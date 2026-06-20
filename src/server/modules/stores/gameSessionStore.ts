// src/server/stores/gameSessionStore.ts
//
// Durable backing store for a player's live game session.
// Replaces the old `redisClient.set/get("user:<wallet>", ...)` calls.
//
// liveGameCache (in-memory Map, see liveGameCache.ts) is still the fast path
// read on every gameplay tick. This store is the source of truth that the
// cache is rehydrated from after a server restart or cache miss.

import { GAME_TYPE_VALUES } from '@/shared/constants/GameTypes';
import { Store, schema } from 'modelence/server';

const gameSessionStore = new Store('gameSessions', {
    schema: {
        userId: schema.string(),
        isGamePaused: schema.boolean(),
        gameType: schema.enum(GAME_TYPE_VALUES),

        // Knife game state
        knifeStage: schema.number().optional(),
        knifeScore: schema.number().optional(),
        knifeLevelData: schema.object({
            level: schema.number(),
            apples: schema.array(schema.number()),
            preAttachedKnives: schema.array(schema.number()),
            variation: schema.array(schema.number()).optional(),
            throwableKnives: schema.number(),
            changeTime: schema.number(),
            boss: schema.object({
                name: schema.string().nullable(),
                type: schema.string().nullable(),
                score: schema.number(),
            }),

        }).optional(),

        // Tree game state
        treeScore: schema.number().optional(),
        treeBranches: schema.array(schema.object({
            type: schema.enum(['branch', 'scoreBonus', 'timeBonus']).nullable(),
            position: schema.enum(['left', 'right', 'none']),
            id: schema.number(),
        })).optional(),
        treeLastTimeBonusSentAt: schema.number().optional(),

        // Grace-period expiry after disconnect (see disconnect handler)
        expiresAt: schema.date().optional(),
    },
    indexes: [
        { key: { userId: 1 }, unique: true },
        // TTL index: Mongo sweeps expired docs roughly every 60s, not exactly on
        // expiry — fine for a disconnect grace period, not for hard real-time expiry.
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ],
});

export default gameSessionStore;