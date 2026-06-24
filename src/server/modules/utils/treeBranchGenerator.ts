// src/server/utils/treeBranchGenerator.ts
//
// Pure branch-generation logic for the tree game, extracted out of the old
// TreeSockets.js. Logic unchanged from the original — renamed only.

import { TREE_GAME } from './gameConstants';
import { TREE_CHOP_BRANCH_POSITION, TREE_CHOP_BRANCH_TYPE, type TreeBranch } from '../stores/types';

/**
 * Generates a single random branch outcome for a given branch id, using a
 * weighted distribution: branches (left/right) and "none" are common,
 * scoreBonus is rare. See TREE_GAME.DIRECTION_WEIGHTS for the exact split.
 */
export function generateRandomBranch(id: number): TreeBranch {
    const options: TreeBranch[] = [
        { type: TREE_CHOP_BRANCH_TYPE.BRANCH, position: TREE_CHOP_BRANCH_POSITION.LEFT, id },
        { type: TREE_CHOP_BRANCH_TYPE.BRANCH, position: TREE_CHOP_BRANCH_POSITION.RIGHT, id },
        { type: TREE_CHOP_BRANCH_TYPE.NONE, position: TREE_CHOP_BRANCH_POSITION.NONE, id },
        { type: TREE_CHOP_BRANCH_TYPE.SCORE_BONUS, position: TREE_CHOP_BRANCH_POSITION.LEFT, id },
        { type: TREE_CHOP_BRANCH_TYPE.SCORE_BONUS, position: TREE_CHOP_BRANCH_POSITION.RIGHT, id },
    ];

    const weights = TREE_GAME.DIRECTION_WEIGHTS;
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    let weightSum = 0;
    for (let i = 0; i < options.length; i++) {
        weightSum += weights[i];
        if (random < weightSum) {
            return options[i];
        }
    }

    // Fallback, should never be reached
    return options[2];
}

/**
 * Builds the initial branch stack for a new tree game session: a fixed run
 * of empty branches at the bottom, followed by a randomized batch, followed
 * by a guaranteed time-bonus branch at the top.
 */
export function generateInitialBranches(): { branches: TreeBranch[]; newBranchesForClient: TreeBranch[] } {
    const branches: TreeBranch[] = Array.from({ length: TREE_GAME.INITIAL_EMPTY_BRANCH_COUNT }, (_, i) => ({
        type: TREE_CHOP_BRANCH_TYPE.NONE,
        position: TREE_CHOP_BRANCH_POSITION.NONE,
        id: i + 1,
    }));

    const newBranchesForClient: TreeBranch[] = [];
    for (let i = 0; i < TREE_GAME.BRANCHES_PER_BATCH; i++) {
        newBranchesForClient.push(generateRandomBranch(i + TREE_GAME.INITIAL_EMPTY_BRANCH_COUNT + 1));
    }

    newBranchesForClient.push({
        type: TREE_CHOP_BRANCH_TYPE.TIME_BONUS,
        position: TREE_CHOP_BRANCH_POSITION.RIGHT,
        id: TREE_GAME.TIME_BONUS_BRANCH_ID_OFFSET,
    });

    return { branches, newBranchesForClient };
}

/**
 * Generates a refill batch of branches following on from the last existing
 * branch id, optionally appending a time-bonus branch if enough time has
 * passed since the last one was sent.
 */
export function generateBranchRefill(
    lastBranchId: number,
    lastTimeBonusSentAt: number
): { newBranches: TreeBranch[]; timeBonusSentAt: number } {
    const newBranches: TreeBranch[] = [];

    for (let i = 0; i < TREE_GAME.BRANCHES_REFILL_COUNT; i++) {
        newBranches.push(generateRandomBranch(lastBranchId + i + 1));
    }

    let timeBonusSentAt = lastTimeBonusSentAt;
    if (Date.now() - lastTimeBonusSentAt >= TREE_GAME.TIME_BONUS_INTERVAL_MS) {
        newBranches.push({
            type: TREE_CHOP_BRANCH_TYPE.TIME_BONUS,
            position: Math.random() < 0.5 ? TREE_CHOP_BRANCH_POSITION.LEFT : TREE_CHOP_BRANCH_POSITION.RIGHT,
            id: newBranches[newBranches.length - 1].id + 1,
        });
        timeBonusSentAt = Date.now();
    }

    return { newBranches, timeBonusSentAt };
}