// friendship.schema.ts
import { z } from 'zod';

export const friendshipStatusSchema = z.enum(['pending', 'accepted']);

export const friendshipSchema = z.object({
    player1: z.string(),
    player2: z.string(),
    status: friendshipStatusSchema,
    initiatedBy: z.string(),
    synergy: z.number().int().min(0).default(0),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

// For creating a new friendship (request payload)
export const createFriendshipSchema = friendshipSchema.pick({
    player1: true,
    player2: true,
    initiatedBy: true,
});

// For updating status (accept/block)
export const updateFriendshipStatusSchema = z.object({
    status: friendshipStatusSchema,
});

// Response shape of getFriendsWithDetails
export const friendDetailsSchema = z.object({
    walletAddress: z.string(),
    username: z.string(),
    synergy: z.number().int().min(0),
});

export const friendsListSchema = z.array(friendDetailsSchema);

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type Friendship = z.infer<typeof friendshipSchema>;
export type CreateFriendship = z.infer<typeof createFriendshipSchema>;
export type UpdateFriendshipStatus = z.infer<typeof updateFriendshipStatusSchema>;
export type FriendDetails = z.infer<typeof friendDetailsSchema>;
export type FriendsList = z.infer<typeof friendsListSchema>;