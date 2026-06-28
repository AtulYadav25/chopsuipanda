import { dbUsers, schema, Store } from 'modelence/server';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const notificationSchema = schema.object({
    type: schema.enum(['reward', 'friend_request', 'system', 'referral_reward', 'wager_result']),
    message: schema.string(),
    token: schema.string().optional(),
    isRead: schema.boolean(),
    createdAt: schema.date(),
});

// ─── Player Schema ────────────────────────────────────────────────────────────

export const playerSchema = {
    // Identity
    username: schema.string(),
    usernameLower: schema.string(),
    walletAddress: schema.string(),
    referredBy: schema.objectId().optional(),   // ObjectId of referring player

    // Economy
    chi: schema.number(),
    chiEarned: schema.number(),     // Weekly; reset each session
    merit: schema.number(),

    // Progression
    level: schema.number(),
    currentScore: schema.number(),

    // Active game session
    gameStartedAt: schema.date().optional(), //Probably we dont need this really..
    hasPendingContinue: schema.boolean(),

    // Weekly session tracking (reset chiEarned when mismatched with admin sessionId)
    sessionId: schema.string(),

    // Daily streak
    dailyStreak: schema.object({
        lastLogin: schema.date().optional(),
        currentStreak: schema.number(),
    }),

    // Daily chest openings (10/day limit)
    chestOpenings: schema.array(
        schema.date()),

    // Notifications (keep last 50 in app logic via $slice)
    notifications: schema.array(notificationSchema),

    createdAt: schema.date(),
    updatedAt: schema.date(),
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const dbPlayers = dbUsers.extend({
    schema: playerSchema,

    indexes: [
        { key: { walletAddress: 1 }, unique: true },
        { key: { username: 1 }, unique: true },
        { key: { usernameLower: 1 }, unique: true },
        { key: { chiEarned: -1 } },       // Leaderboard ranking
        { key: { sessionId: 1 } },         // Weekly reset queries
        { key: { referredBy: 1 }, sparse: true },
    ]
});