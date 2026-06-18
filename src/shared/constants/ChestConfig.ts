/**
 * Chest configuration: reward tables, costs, and limits.
 *
 * Reward tables MUST be sorted from highest amount to lowest amount.
 * pickReward() relies on this ordering — it walks from the cheapest
 * pair (end of array) toward the most valuable pair (start of array).
 */

export type CurrencyType = 'CHI' | 'SUI';

export interface OpenChestArgs {
    chestDetails: {
        type: ChestType;
        qty: number;
    };
}

export interface ChestReward {
    amount: number;
    type: CurrencyType;
}

export type ChestType = 'treasure' | 'royal';

/** CHI rewards for a "treasure" chest, highest amount first. */
export const TREASURE_CHEST_REWARDS: ChestReward[] = [
    { amount: 100000, type: 'CHI' },
    { amount: 50000, type: 'CHI' },
    { amount: 20000, type: 'CHI' },
    { amount: 15000, type: 'CHI' },
    { amount: 12000, type: 'CHI' },
    { amount: 8000, type: 'CHI' },
    { amount: 5500, type: 'CHI' },
    { amount: 4000, type: 'CHI' },
    { amount: 2200, type: 'CHI' },
    { amount: 1600, type: 'CHI' },
    { amount: 1000, type: 'CHI' },
    { amount: 700, type: 'CHI' },
];

/** SUI rewards for a "royal" chest, highest amount first. */
export const ROYAL_CHEST_REWARDS: ChestReward[] = [
    { amount: 8.0, type: 'SUI' },
    { amount: 4.0, type: 'SUI' },
    { amount: 2.0, type: 'SUI' },
    { amount: 1.8, type: 'SUI' },
    { amount: 0.9, type: 'SUI' },
    { amount: 0.4, type: 'SUI' },
    { amount: 0.2, type: 'SUI' },
    { amount: 0.15, type: 'SUI' },
    { amount: 0.1, type: 'SUI' },
    { amount: 0.5, type: 'SUI' },
];

// Previous SUI reward table, kept for reference / quick rollback.
// const ROYAL_CHEST_REWARDS_LEGACY: ChestReward[] = [
//     { amount: 6.0, type: 'SUI' },
//     { amount: 4.0, type: 'SUI' },
//     { amount: 2.0, type: 'SUI' },
//     { amount: 1.8, type: 'SUI' },
//     { amount: 1.2, type: 'SUI' },
//     { amount: 0.7, type: 'SUI' },
//     { amount: 0.3, type: 'SUI' },
//     { amount: 0.15, type: 'SUI' },
//     { amount: 0.04, type: 'SUI' },
//     { amount: 0.02, type: 'SUI' },
// ];

/** CHI cost to open a single treasure chest. */
export const TREASURE_CHEST_COST = 1000;

/** CHI cost to open a single royal (SUI) chest. */
export const ROYAL_CHEST_COST = 100000;

/** Max chest openings allowed within the rolling daily window. */
export const DAILY_CHEST_OPEN_LIMIT = 10;

/** Length of the rolling daily window, in milliseconds. */
export const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** How many recent chest-opening timestamps to retain per player. */
export const CHEST_OPENING_HISTORY_SIZE = 10;

/**
 * Probability of stopping at the lowest-value pair on the very first
 * check (the "floor" of the reward ladder).
 */
/** Tier-stop probabilities for the treasure (CHI) chest. */
export const TREASURE_BASE_TIER_STOP_PROBABILITY = 0.25;
export const TREASURE_CLIMB_TIER_STOP_PROBABILITY = 0.70;

/** Tier-stop probabilities for the royal (SUI) chest. */
export const ROYAL_BASE_TIER_STOP_PROBABILITY = 0.35;
export const ROYAL_CLIMB_TIER_STOP_PROBABILITY = 0.74;

export function getChestTierProbabilities(chestType: ChestType): {
    base: number;
    climb: number;
} {
    return chestType === 'royal'
        ? { base: ROYAL_BASE_TIER_STOP_PROBABILITY, climb: ROYAL_CLIMB_TIER_STOP_PROBABILITY }
        : { base: TREASURE_BASE_TIER_STOP_PROBABILITY, climb: TREASURE_CLIMB_TIER_STOP_PROBABILITY };
}

/**
 * Probability of stopping at each subsequent (higher-value) pair while
 * climbing the reward ladder.
 */
// export const ROYAL_CLIMB_TIER_STOP_PROBABILITY = 0.70;

export function getChestRewardTable(chestType: ChestType): ChestReward[] {
    return chestType === 'royal' ? ROYAL_CHEST_REWARDS : TREASURE_CHEST_REWARDS;
}

export function getChestCost(chestType: ChestType): number {
    return chestType === 'royal' ? ROYAL_CHEST_COST : TREASURE_CHEST_COST;
}