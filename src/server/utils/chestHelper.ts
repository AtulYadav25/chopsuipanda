import {
    ChestReward,
} from '@/shared/constants/ChestConfig';

/**
 * Picks a reward from a table that is sorted highest-amount-first.
 *
 * Mechanic: the table is walked in pairs starting from the *end*
 * (lowest-value pair) toward the *start* (highest-value pair).
 * At each pair there's a chance to stop and award one of the two
 * rewards in that pair; otherwise the walk climbs to the next
 * (more valuable) pair. This makes big rewards rare, since the walk
 * has to "survive" every lower tier to reach them.
 *
 * - First pair checked (lowest tier): stop with BASE_TIER_STOP_PROBABILITY.
 * - Every pair after that while climbing: stop with CLIMB_TIER_STOP_PROBABILITY.
 * - If the walk reaches the first pair (index 0) without stopping, a
 *   reward is always returned from that pair.
 *
 * Behavior is unchanged from the original implementation.
 */
export function pickReward(
    rewardTable: ChestReward[],
    baseTierStopProbability: number,
    climbTierStopProbability: number,
): ChestReward {
    if (rewardTable.length === 0) {
        throw new Error('pickReward: rewardTable must not be empty');
    }

    const pickFromPair = (pairStartIndex: number): ChestReward => {
        const offset = Math.floor(Math.random() * 2);
        const safeOffset = pairStartIndex + 1 < rewardTable.length ? offset : 0;
        return rewardTable[pairStartIndex + safeOffset];
    };

    let pairStartIndex = rewardTable.length - 2;

    // Lowest tier: high chance to stop immediately.
    if (Math.random() < baseTierStopProbability) {
        return pickFromPair(pairStartIndex);
    }

    while (pairStartIndex >= 0) {
        if (Math.random() < climbTierStopProbability) {
            return pickFromPair(pairStartIndex);
        }

        pairStartIndex -= 2;

        if (pairStartIndex < 0) {
            // Reached the top pair: always award from it.
            return pickFromPair(0);
        }
    }

    // Unreachable, but keeps TypeScript's control-flow analysis happy.
    return rewardTable[0];
}