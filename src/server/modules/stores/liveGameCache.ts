// src/server/stores/liveGameCache.ts
//
// Fast, per-process, in-memory cache for active game sessions.
// This is the direct replacement for the old `liveGames` Map.
//
// Why keep an in-memory layer at all instead of reading Mongo every time?
// throwKnife / chopTree fire frequently during active play, and a Mongo
// round-trip on every single one would add latency we don't need — the
// old code already knew this, which is why it kept everything in `liveGames`
// and only touched Redis as a backup/durability layer. We keep that shape,
// just with `gameSessionStore` (Mongo) standing in for Redis.
//
// NOTE: this cache is per-server-instance. If you horizontally scale to
// multiple server processes, each instance has its own cache, same as the
// original Map-based code did. gameSessionStore is the cross-instance
// source of truth.

import type { GameSession } from './types';

const liveGameCache = new Map<string, GameSession>();

export function getSession(userId: string): GameSession | undefined {
    return liveGameCache.get(userId);
}

export function setSession(userId: string, session: GameSession): void {
    liveGameCache.set(userId, session);
}

export function deleteSession(userId: string): void {
    liveGameCache.delete(userId);
}

export default liveGameCache;