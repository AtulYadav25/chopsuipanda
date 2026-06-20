// src/server/methods/games/knifeGame.ts
//
// Migrated from KnifeSockets.js. The two socket events (`sessionStart`,
// `throwKnife`) become mutations, since Modelence's client→server flow for
// "client sends data, server computes, client gets a result back" is the
// mutation/query system, not a custom socket event with an ack callback.
//
// `io.to(socket.id).emit("new-level", ...)` becomes a per-user channel
// broadcast on gameServerChannel, keyed by walletAddress (see channel docs).
//
// As noted in the spec: throwKnife is not called on every single throw —
// the client only calls it once it has computed the full sequence of knife
// angles for the current level and detects either a legal level-clear or an
// illegal hit. This mutation's job is unchanged: validate that sequence and
// return/broadcast the next level (or pause the game on an illegal hit).

import { z } from 'zod';
import gameSessionStore from '../../stores/gameSessionStore';
import { getSession, setSession } from '../../stores/liveGameCache';
import { generateKnifeLevelData, isLegalKnifeHit } from '../../utils/knifeLevelGenerator';
import { KNIFE_GAME } from '../../utils/gameConstants';
import { BossLevels } from '../../data/levels';
import gameServerChannel from '../../channels/gameServerChannel';
import type { GameSession } from '../../stores/types';
import type { HttpContext } from 'modelence/types';
import { requirePlayer } from '@/server/utils/authPlayer';
import { GAME_TYPES } from '@/shared/constants/GameTypes';

async function loadSession(userId: string): Promise<GameSession | null> {
    const cached = getSession(userId);
    if (cached) return cached;

    const stored = await gameSessionStore.findOne({ userId });
    if (stored) {
        setSession(userId, stored);
    }
    return stored;
}


async function persistSession(userId: string, session: GameSession): Promise<void> {
    setSession(userId, session);
    await gameSessionStore.upsertOne({ userId }, { $set: session });
}

/**
 * Starts a new knife game session for stage 1.
 * Replaces socket event "sessionStart".
 */
export async function knifeSessionStart(args: unknown, { req }: HttpContext) {

    const { userId } = requirePlayer(req);
    if (!userId) {
        throw new Error('Not authenticated');
    }

    const session = await loadSession(userId);
    if (!session) {
        throw new Error('User not found');
    }

    const sessionData: GameSession = {
        ...session,
        isGamePaused: false,
        knifeLevelData: generateKnifeLevelData(1),
        knifeStage: 1,
        knifeScore: 0,
        gameType: GAME_TYPES.KNIFE_HIT
    };

    await persistSession(userId, sessionData);

    //Update Player doc

    return sessionData;
}

/**
 * Validates a completed knife-throw sequence for the current level and
 * either advances to the next level/boss stage or pauses the game on an
 * illegal hit. Replaces socket event "throwKnife".
 */
export async function throwKnife(args: unknown, { req }: HttpContext) {

    const { userId } = requirePlayer(req);
    if (!userId) {
        throw new Error('Not authenticated');
    }

    const { targetAngle, appleAngles } = z
        .object({
            targetAngle: z.array(z.number()).min(1),
            appleAngles: z.array(z.number()),
        })
        .parse(args);

    if (!userId) {
        throw new Error('Not authenticated');
    }

    const session = await loadSession(userId);

    if (!session) {
        throw new Error('You Lost Connection!');
    }
    if (session.isGamePaused) {
        throw new Error('Game is paused');
    }
    if (!session.knifeLevelData) {
        throw new Error('No active level');
    }

    const levelData = session.knifeLevelData;
    const checkingAngles = targetAngle.slice(0, -1);
    const legalHit = isLegalKnifeHit(checkingAngles);

    const apples = levelData.apples;
    const totalKnivesInLevel = levelData.throwableKnives + levelData.preAttachedKnives.length;

    // Illegal hit: either the angle check failed, or the player ran out of
    // apples and threw more knives than the level allows (the game-end signal).
    const isIllegalHit = !legalHit || (apples.length === 0 && totalKnivesInLevel !== targetAngle.length);

    if (isIllegalHit) {
        // (targetAngle.length - 1) excludes the final knife that ended the game
        const scoreGained = targetAngle.length - 1 - levelData.preAttachedKnives.length;
        const isBossStage = (session.knifeStage ?? 1) % KNIFE_GAME.BOSS_STAGE_INTERVAL === 0;

        const updatedSession: GameSession = isBossStage
            ? {
                ...session,
                knifeScore: (session.knifeScore ?? 0) + scoreGained,
                knifeLevelData: BossLevels[(session.knifeStage ?? 1) / KNIFE_GAME.BOSS_STAGE_INTERVAL - 1],
                isGamePaused: true,
            }
            : {
                ...session,
                knifeScore: (session.knifeScore ?? 0) + scoreGained,
                isGamePaused: true,
                knifeLevelData: generateKnifeLevelData(session.knifeStage ?? 1),
            };

        persistSession(userId, updatedSession);
        return true;
    }

    // Legal hit: check for apple hits and update score/apples accordingly.
    let scoreGained = 0;
    let remainingApples = apples;

    for (let i = 0; i < remainingApples.length; i++) {
        const isAppleHit = 180 - Math.abs(appleAngles[i]) < KNIFE_GAME.MIN_ANGLE_DEGREES + KNIFE_GAME.APPLE_HIT_ANGLE_TOLERANCE;
        if (isAppleHit) {
            scoreGained += KNIFE_GAME.POINTS_PER_APPLE;
            remainingApples = remainingApples.length > 1 ? remainingApples.slice(1) : [];
        }
    }

    const updatedLevelData = { ...levelData, apples: remainingApples };
    const updatedSession: GameSession = {
        ...session,
        knifeScore: (session.knifeScore ?? 0) + scoreGained,
        knifeLevelData: updatedLevelData,
    };

    const isLevelComplete =
        updatedLevelData.throwableKnives + updatedLevelData.preAttachedKnives.length === targetAngle.length;

    if (!isLevelComplete) {
        persistSession(userId, updatedSession);
        return true;
    }

    // Level complete: advance stage, generate the next level or boss fight,
    // and push it to the player over their personal game channel.
    const nextStage = (session.knifeStage ?? 1) + 1;
    const isBossStage = (session.knifeStage ?? 1) % KNIFE_GAME.BOSS_STAGE_INTERVAL === 0;

    const nextLevelSession: GameSession = isBossStage
        ? {
            ...session,
            knifeStage: nextStage,
            knifeLevelData: BossLevels[(session.knifeStage ?? 1) / KNIFE_GAME.BOSS_STAGE_INTERVAL - 1],
            knifeScore: updatedSession.knifeScore! + updatedLevelData.throwableKnives,
        }
        : {
            ...session,
            knifeStage: nextStage,
            knifeLevelData: generateKnifeLevelData(nextStage),
            knifeScore:
                updatedSession.knifeScore! +
                updatedLevelData.throwableKnives +
                (updatedLevelData.boss ? updatedLevelData.boss.score : 0),
        };

    persistSession(userId, nextLevelSession);

    gameServerChannel.broadcast(userId, {
        type: 'newLevel',
        session: nextLevelSession,
    });

    return true;
}