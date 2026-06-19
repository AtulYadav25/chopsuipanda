import { schema, Store } from 'modelence/server';

// ─── Battle Match Store ───────────────────────────────────────────────────────

export const battleMatchSchema = {
    challenger: schema.object({
        username: schema.string(),
        score: schema.number(),
        played: schema.boolean(),
        walletAddress: schema.string(),
    }),

    opponent: schema.object({
        username: schema.string(),
        score: schema.number(),
        played: schema.boolean(),
        walletAddress: schema.string(),
    }),

    gameMode: schema.number(),

    wagerAmount: schema.number(),

    winnerUsername: schema.string().optional(),

    isBattleCompleted: schema.boolean(),

    createdAt: schema.date(),
    updatedAt: schema.date(),
};

export const dbBattleMatches = new Store('battleMatches', {
    schema: battleMatchSchema,

    indexes: [
        { key: { 'challenger.walletAddress': 1 } },
        { key: { 'opponent.walletAddress': 1 } },
        { key: { isBattleCompleted: 1 } },
        { key: { createdAt: 1 }, expireAfterSeconds: 90000 }, // 25h TTL
    ],
});