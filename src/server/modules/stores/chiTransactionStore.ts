import { schema, Store } from 'modelence/server';
import { TRANSACTION_TYPES, TransactionType } from '@/shared/constants/chiTransaction';

// ─── Chi Transaction Store ───────────────────────────────────────────────────────

export const chiTransactionSchema = {
    ownerWalletAddress: schema.string(),

    type: schema.enum(
        TRANSACTION_TYPES as [TransactionType, ...TransactionType[]]
    ),

    chiAmount: schema.number(),

    referenceType: schema.string().optional(), //References to other config name/tag
    referenceId: schema.string().optional(), //References to other config packId/skinId..

    payment: schema.object({
        amountInMist: schema.number(), // SUI -> MIST
        txDigest: schema.string(),
    }).optional(),

    message: schema.string(),

    status: schema.enum(['pending', 'success', 'failed']),

    createdAt: schema.date(),
    updatedAt: schema.date(),
};

export const dbChiTransactions = new Store('chiTransactions', {
    schema: chiTransactionSchema,

    indexes: [
        { key: { ownerWalletAddress: 1 } },
        { key: { status: 1 } },
    ],
});


/*
Examples:

{
    type: 'SKIN_PURCHASE',

    chiAmount: -300,

    referenceType: 'SKIN',
    referenceId: 'ninja-panda'
}

{
    type: 'REWARD',

    chiAmount: 5000,

    referenceType: 'LEADERBOARD_REWARD',
    referenceId: 'weekly-2026-06-18'
}

*/