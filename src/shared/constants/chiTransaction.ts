export const TRANSACTION = {
    BUY_CHI: 'BUY_CHI',
    LEVEL_UP: 'LEVEL_UP',
    CHEST_OPEN: 'CHEST_OPEN',
    SKIN_PURCHASE: 'SKIN_PURCHASE',
    REWARD: 'REWARD',
    REFERRAL_REWARD: 'REFERRAL_REWARD',
} as const;

export type TransactionType =
    typeof TRANSACTION[keyof typeof TRANSACTION];

export const TRANSACTION_TYPES = Object.values(
    TRANSACTION
) as TransactionType[];