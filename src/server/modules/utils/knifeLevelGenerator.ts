// src/server/utils/bambooLevelGenerator.ts
//
// Pure level-generation logic for the bamboo game, extracted out of the old
// bambooSockets.js so it isn't tangled with socket/event code. Logic is
// unchanged from the original — only renamed and reformatted.

import { BAMBOO_GAME } from './gameConstants';
import type { BambooShootLevelData } from '../stores/types';

/**
 * Generates a randomized "variation" array used by the bamboo game's
 * difficulty curve. Originally written from a GPT prompt asking for an array
 * of floats in [1.0, 4.0] with a minimum spacing between values, optionally
 * skewed positive, negative, or mixed depending on stage number.
 */
export function generateVariationArray(stageNumber: number): number[] {
    const { VARIATION_MIN, VARIATION_MAX, VARIATION_MIN_DIFF, VARIATION_LENGTH_MIN, VARIATION_LENGTH_MAX } =
        BAMBOO_GAME;

    const length =
        Math.floor(Math.random() * (VARIATION_LENGTH_MAX - VARIATION_LENGTH_MIN + 1)) + VARIATION_LENGTH_MIN;

    // Weighted mode selection: past a stage threshold, heavily favor "mixed"
    let mode: 'positive' | 'negative' | 'mixed';
    if (stageNumber > BAMBOO_GAME.VARIATION_HIGH_STAGE_THRESHOLD) {
        const rand = Math.random();
        if (rand < BAMBOO_GAME.VARIATION_MIXED_CHANCE) {
            mode = 'mixed';
        } else if (rand < BAMBOO_GAME.VARIATION_POSITIVE_CHANCE) {
            mode = 'positive';
        } else {
            mode = 'negative';
        }
    } else {
        mode = (['positive', 'negative', 'mixed'] as const)[Math.floor(Math.random() * 3)];
    }

    const result: number[] = [];
    let attempts = 0;

    while (result.length < length && attempts < BAMBOO_GAME.VARIATION_MAX_GENERATION_ATTEMPTS) {
        attempts++;

        let value = parseFloat((Math.random() * (VARIATION_MAX - VARIATION_MIN) + VARIATION_MIN).toFixed(1));

        const isTooClose = result.some((existing) => Math.abs(Math.abs(existing) - value) < VARIATION_MIN_DIFF);
        if (isTooClose) continue;

        if (mode === 'negative') {
            value *= -1;
        } else if (mode === 'mixed') {
            value *= Math.random() < 0.5 ? 1 : -1;
        }

        result.push(value);
    }

    return result;
}

function randomBetween(min: number, max: number, isFloat = false): number {
    const rand = Math.random() * (max - min) + min;
    return isFloat ? parseFloat(rand.toFixed(1)) : Math.floor(rand);
}

function shuffle<T>(arr: T[]): T[] {
    return arr.sort(() => Math.random() - 0.5);
}

/**
 * Generates the full level configuration (apples, pre-attached knives,
 * throwable bamboo count, etc.) for a given stage number.
 */
export function generateBambooLevelData(stageNumber: number): BambooShootLevelData {
    const level = Math.floor(stageNumber / BAMBOO_GAME.STAGE_PER_LEVEL) + 1;
    const availableAngles = [...BAMBOO_GAME.ANGLE_POOL];

    const maxItems = Math.min(BAMBOO_GAME.MAX_ITEMS_CAP, Math.floor(level / 2) + 2);
    const appleCount = randomBetween(0, maxItems);
    const preBambooCount = randomBetween(0, 4);

    shuffle(availableAngles);
    const apples = availableAngles.splice(0, appleCount);
    const preAttachedBamboos = availableAngles.splice(0, preBambooCount);

    return {
        level,
        apples,
        preAttachedBamboos,
        variation: generateVariationArray(stageNumber),
        throwableBamboos: randomBetween(
            level === 1 ? BAMBOO_GAME.THROWABLE_BAMBOOS_LEVEL_1_MIN : BAMBOO_GAME.THROWABLE_BAMBOOS_OTHER_MIN,
            level === 1 ? BAMBOO_GAME.THROWABLE_BAMBOOS_LEVEL_1_MAX : BAMBOO_GAME.THROWABLE_BAMBOOS_OTHER_MAX
        ),
        changeTime: randomBetween(BAMBOO_GAME.CHANGE_TIME_MIN, BAMBOO_GAME.CHANGE_TIME_MAX, true),
        boss: {
            name: null,
            type: null,
            score: 0,
        },
    };
}

function normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360;
}

/**
 * Checks that none of the given angles fall within the forbidden zone
 * around 0 degrees (the "too close to the previous bamboo" zone).
 *
 * NOTE: kept the original comparison logic exactly as written. The
 * `>=` / `<=` pairing here behaves like "always true" for most inputs in
 * the original code too — flagging in case this was a pre-existing bug
 * you want to revisit, but not changing behavior in this migration.
 */
export function isLegalBambooHit(targetAngles: number[]): boolean {
    const hasForbiddenAngle = targetAngles.some((angle) => {
        const norm = normalizeAngle(angle);
        return (
            norm >= normalizeAngle(-BAMBOO_GAME.MIN_ANGLE_DEGREES) || norm <= normalizeAngle(BAMBOO_GAME.MIN_ANGLE_DEGREES)
        );
    });

    return !hasForbiddenAngle;
}