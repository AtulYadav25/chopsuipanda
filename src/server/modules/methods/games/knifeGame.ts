// src/server/methods/games/bambooGame.ts
//
// Migrated from bambooSockets.js. The two socket events (`sessionStart`,
// `throwbamboo`) become mutations, since Modelence's client→server flow for
// "client sends data, server computes, client gets a result back" is the
// mutation/query system, not a custom socket event with an ack callback.
//
// `io.to(socket.id).emit("new-level", ...)` becomes a per-user channel
// broadcast on gameServerChannel, keyed by walletAddress (see channel docs).
//
// As noted in the spec: throwBamboo is not called on every single throw —
// the client only calls it once it has computed the full sequence of bamboo
// angles for the current level and detects either a legal level-clear or an
// illegal hit. This mutation's job is unchanged: validate that sequence and
// return/broadcast the next level (or pause the game on an illegal hit).

import { z } from 'zod';
import gameSessionStore from '../../stores/gameSessionStore';
import { getSession, setSession } from '../../stores/liveGameCache';
import { generateBambooLevelData, isLegalBambooHit } from '../../utils/knifeLevelGenerator';
import { BAMBOO_GAME } from '../../utils/gameConstants';
import { BossLevels } from '../../data/levels';
import gameServerChannel from '../../channels/gameServerChannel';
import type { GameSession } from '../../stores/types';
import type { Context } from 'modelence/types';
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
 * Starts a new bamboo game session for stage 1.
 * Replaces socket event "sessionStart".
 */
export async function bambooShootSessionStart(_: unknown, { req }: Context) {

    const { userId } = requirePlayer(req!);
    if (!userId) {
        throw new Error('Not authenticated');
    }

    const session = await loadSession(userId);
    if (!session) {
        throw new Error('User not found');
    }

    const sessionData: GameSession = {
        ...session,
        treeChopScore: 0,
        treeChopBranches: [],
        treeChopLastTimeBonusSentAt: 0,
        isGamePaused: false,
        bambooShootLevelData: generateBambooLevelData(1),
        bambooShootStage: 1,
        bambooShootScore: 0,
        gameType: GAME_TYPES.BAMBOO_SHOOT,
        numOfContinues: 0,
    };

    await persistSession(userId, sessionData);

    //Update Player doc

    return sessionData;
}

/**
 * Validates a completed bamboo-throw sequence for the current level and
 * either advances to the next level/boss stage or pauses the game on an
 * illegal hit. Replaces socket event "throwbamboo".
 */
export async function throwBamboo(args: unknown, { req }: Context) {

    const { userId, walletAddress } = requirePlayer(req!);
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
    if (!session.bambooShootLevelData) {
        throw new Error('No active level');
    }

    const levelData = session.bambooShootLevelData;
    const checkingAngles = targetAngle.slice(0, -1);
    const legalHit = isLegalBambooHit(checkingAngles);

    const apples = levelData.apples;
    const totalBamboosInLevel = levelData.throwableBamboos + levelData.preAttachedBamboos.length;

    // Illegal hit: either the angle check failed, or the player ran out of
    // apples and threw more knives than the level allows (the game-end signal).
    const isIllegalHit = !legalHit || (apples.length === 0 && totalBamboosInLevel !== targetAngle.length);

    if (isIllegalHit) {
        // (targetAngle.length - 1) excludes the final bamboo that ended the game
        const scoreGained = targetAngle.length - 1 - levelData.preAttachedBamboos.length;
        const isBossStage = (session.bambooShootStage ?? 1) % BAMBOO_GAME.BOSS_STAGE_INTERVAL === 0;

        const updatedSession: GameSession = isBossStage
            ? {
                ...session,
                bambooShootScore: (session.bambooShootScore ?? 0) + scoreGained,
                bambooShootLevelData: BossLevels[(session.bambooShootStage ?? 1) / BAMBOO_GAME.BOSS_STAGE_INTERVAL - 1],
                isGamePaused: true,
                numOfContinues: (session.numOfContinues ?? 0) + 1,
            }
            : {
                ...session,
                bambooShootScore: (session.bambooShootScore ?? 0) + scoreGained,
                isGamePaused: true,
                bambooShootLevelData: generateBambooLevelData(session.bambooShootStage ?? 1),
                numOfContinues: (session.numOfContinues ?? 0) + 1,
            };

        persistSession(userId, updatedSession);
        return { message: "Game Ends! Illegal Hit" };
    }

    // Legal hit: check for apple hits and update score/apples accordingly.
    let scoreGained = 0;
    let remainingApples = apples;

    for (let i = 0; i < remainingApples.length; i++) {
        const isAppleHit = 180 - Math.abs(appleAngles[i]) < BAMBOO_GAME.MIN_ANGLE_DEGREES + BAMBOO_GAME.APPLE_HIT_ANGLE_TOLERANCE;
        if (isAppleHit) {
            scoreGained += BAMBOO_GAME.POINTS_PER_APPLE;
            remainingApples = remainingApples.length > 1 ? remainingApples.slice(1) : [];
        }
    }

    const updatedLevelData = { ...levelData, apples: remainingApples };
    const updatedSession: GameSession = {
        ...session,
        bambooShootScore: (session.bambooShootScore ?? 0) + scoreGained,
        bambooShootLevelData: updatedLevelData,
    };

    const isLevelComplete =
        updatedLevelData.throwableBamboos + updatedLevelData.preAttachedBamboos.length === targetAngle.length;


    if (!isLevelComplete) {
        persistSession(userId, updatedSession);
        return { message: "Level Not Completed" };
    }

    // Level complete: advance stage, generate the next level or boss fight,
    // and push it to the player over their personal game channel.
    const nextStage = (session.bambooShootStage ?? 1) + 1;
    const isBossStage = (session.bambooShootStage ?? 1) % BAMBOO_GAME.BOSS_STAGE_INTERVAL === 0;

    const nextLevelSession: GameSession = isBossStage
        ? {
            ...session,
            bambooShootStage: nextStage,
            bambooShootLevelData: BossLevels[(session.bambooShootStage ?? 1) / BAMBOO_GAME.BOSS_STAGE_INTERVAL - 1],
            bambooShootScore: updatedSession.bambooShootScore! + updatedLevelData.throwableBamboos,
        }
        : {
            ...session,
            bambooShootStage: nextStage,
            bambooShootLevelData: generateBambooLevelData(nextStage),
            bambooShootScore:
                updatedSession.bambooShootScore! +
                updatedLevelData.throwableBamboos +
                (updatedLevelData.boss ? updatedLevelData.boss.score : 0),
        };

    persistSession(userId, nextLevelSession);

    gameServerChannel.broadcast(walletAddress.toLowerCase(), {
        type: 'newLevel',
        session: nextLevelSession,
    });

    return { message: "Level Completed" };
}