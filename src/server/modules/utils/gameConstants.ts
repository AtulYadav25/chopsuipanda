// src/server/utils/gameConstants.ts
//
// Magic numbers from the original KnifeSockets.js / TreeSockets.js, pulled
// out and named. Values are unchanged — this is a rename-only pass.

export const KNIFE_GAME = {
    MIN_ANGLE_DEGREES: 10,
    VISIBLE_PARTS: 7,

    // generateVariationArray
    VARIATION_MIN: 1.0,
    VARIATION_MAX: 4.0,
    VARIATION_MIN_DIFF: 0.3,
    VARIATION_LENGTH_MIN: 2,
    VARIATION_LENGTH_MAX: 5,
    VARIATION_HIGH_STAGE_THRESHOLD: 10,
    VARIATION_MAX_GENERATION_ATTEMPTS: 10,
    // Weighted mode chances used once stage > VARIATION_HIGH_STAGE_THRESHOLD
    VARIATION_MIXED_CHANCE: 0.75,
    VARIATION_POSITIVE_CHANCE: 0.875, // cumulative; positive band is [0.75, 0.875)

    // generateLevelData
    STAGE_PER_LEVEL: 20,
    MAX_ITEMS_CAP: 4,
    THROWABLE_KNIVES_LEVEL_1_MIN: 6,
    THROWABLE_KNIVES_LEVEL_1_MAX: 10,
    THROWABLE_KNIVES_OTHER_MIN: 8,
    THROWABLE_KNIVES_OTHER_MAX: 13,
    CHANGE_TIME_MIN: 1.5,
    CHANGE_TIME_MAX: 2.6,

    // throwKnife scoring
    POINTS_PER_APPLE: 5,
    APPLE_HIT_ANGLE_TOLERANCE: 5, // added to MIN_ANGLE_DEGREES

    // Boss stages occur every 5 stages
    BOSS_STAGE_INTERVAL: 5,

    ANGLE_POOL: [
        0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340,
    ] as const,
} as const;

export const TREE_GAME = {
    INITIAL_EMPTY_BRANCH_COUNT: 7,
    BRANCHES_PER_BATCH: 21,
    BRANCHES_REFILL_COUNT: 20,
    TIME_BONUS_BRANCH_ID_OFFSET: 29,
    TIME_BONUS_INTERVAL_MS: 3750,

    SCORE_BONUS_POINTS: 20,

    // Weighted random direction selection
    // [left branch, right branch, none, scoreBonus-left, scoreBonus-right]
    DIRECTION_WEIGHTS: [32.8, 32.8, 32.8, 0.8, 0.8] as const,
} as const;

export const SESSION = {
    /** Grace period (seconds) before a disconnected player's session is wiped */
    DISCONNECT_GRACE_PERIOD_SECONDS: 60,
} as const;