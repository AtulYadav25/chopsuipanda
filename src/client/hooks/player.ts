import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { playerClientModule } from "../modules";
import { usePlayerActions } from "../store/usePlayerStore";
import { typedMutationFn, typedQueryFn } from "./apiResponse";
import { PlayerPublic } from "@/shared/schemas/player.schema";


export function useAuthPlayer() {
    const { setPlayer } = usePlayerActions();
    return useMutation({
        ...playerClientModule.mutation('authPlayer'),
        mutationFn: typedMutationFn<{ player: PlayerPublic; isNewUser: boolean }>(
            playerClientModule.mutation('authPlayer')
        ),
        onSuccess: (res) => {
            setPlayer(res.data.player);
        },
    });
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
    const { setPlayer, mergePlayer } = usePlayerActions();

    const query = useQuery({
        ...playerClientModule.query('getMe', { includeSocial }),
        queryFn: typedQueryFn<PlayerPublic>(
            playerClientModule.query('getMe', { includeSocial })
        ),
    });

    useEffect(() => {
        if (query.data) {
            const incoming = query.data.data;
            const { friends, friendRequestsReceived, ...rest } = query.data.data;

            if (includeSocial) {
                setPlayer(incoming);
            } else {
                mergePlayer(rest); // only updates what server returned, preserves friends
            }
        }
    }, [query.data, includeSocial]);

    return query;
}