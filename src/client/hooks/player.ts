import { useMutation, useQuery } from "@tanstack/react-query";
import { playerClientModule } from "../modules";


export function useAuthPlayer() {
    return useMutation(playerClientModule.mutation('authPlayer'));
}

export function useOpenChest() {
    return useMutation(playerClientModule.mutation('openChest'));
}

export function useOnboardPlayer() {
    return useMutation(playerClientModule.mutation('onboardPlayer'));
}

export function useDisconnectWallet() {
    return useMutation(playerClientModule.mutation('disconnectWallet'));
}

export function useLevelUp() {
    return useMutation(playerClientModule.mutation('levelUp'));
}

export function useApplyReferral() {
    return useMutation(playerClientModule.mutation('applyReferral'));
}

export function useContinueDailyStreak() {
    return useMutation(playerClientModule.mutation('continueDailyStreak'));
}

/** Player Queries */

export function useCheckAuth() {
    return useQuery(playerClientModule.query('checkAuth', {}));
}

export function useRefreshPlayerProfile({ includeSocial }: { includeSocial: boolean }) {
    return useQuery(playerClientModule.query('getMe', { includeSocial }));
}
