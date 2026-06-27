import { z } from 'zod';
import { friendDetailsSchema } from './friendship.schema';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

export const notificationSchema = z.object({
    type: z.enum(['reward', 'friend_request', 'system']),
    message: z.string(),
    token: z.string().optional(),
    isRead: z.boolean(),
    createdAt: z.date(),
});

// If you're using MongoDB ObjectIds as strings:
const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

// ─── Player Schema ────────────────────────────────────────────────────────────

export const playerSchema = z.object({
    // Identity
    id: z.string().optional(),
    username: z.string(),
    walletAddress: z.string(),
    referredBy: objectIdSchema.optional(),

    // Economy
    chi: z.number(),
    chiEarned: z.number(), // Weekly; reset each session
    merit: z.number(),

    // Progression
    level: z.number(),
    currentScore: z.number(),

    // Active game session
    gameStartedAt: z.date().optional(),
    hasPendingContinue: z.boolean(),
    continues: z.number(), // Max 3; enforce with .max(3) if desired

    // Weekly session tracking
    sessionId: z.string(),

    // Daily streak
    dailyStreak: z.object({
        lastLogin: z.date().optional(),
        currentStreak: z.number(),
    }),

    // Daily chest openings
    chestOpenings: z.array(z.date()),

    // Notifications
    notifications: z.array(notificationSchema),

    createdAt: z.date(),
    updatedAt: z.date(),
});

export const playerPublicSchema = playerSchema.pick({
    id: true,
    username: true,
    walletAddress: true,
    chi: true,
    level: true,
    dailyStreak: true,
    chestOpenings: true,
    notifications: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    friends: z.array(friendDetailsSchema),
    friendRequestsReceived: z.array(friendDetailsSchema)
});


// Type inference
export type Player = z.infer<typeof playerSchema>;
export type PlayerPublic = z.infer<typeof playerPublicSchema>;
export type Notification = z.infer<typeof notificationSchema>;


export type LeaderboardEntry = {
    rank: number;
    username: string;
    chiEarned: number;
};