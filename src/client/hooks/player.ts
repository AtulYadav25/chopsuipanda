import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { playerClientModule } from "../modules";
import { usePlayerActions } from "../store/usePlayerStore";
import { typedMutationFn, typedQueryFn } from "./apiResponse";
import { PlayerPublic } from "@/shared/schemas/player.schema";
import { useQueryClient } from '@tanstack/react-query';


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

export function useDisconnectWalletBackend() {
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
    return useQuery({
        ...playerClientModule.query('checkAuth', {}),
        enabled: false,
        retry: false,
    });
}

export function useRefreshPlayerProfile() {
    const { setPlayer, mergePlayer, setIsNewPlayer } = usePlayerActions();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const refreshPlayerProfile = useCallback(
        async ({ includeSocial = false }: { includeSocial?: boolean } = {}) => {
            const queryDescriptor = playerClientModule.query('getMe', { includeSocial });

            setIsLoading(true);
            setError(null);

            try {
                const data = await queryClient.fetchQuery({
                    ...queryDescriptor,
                    queryFn: typedQueryFn<PlayerPublic>(queryDescriptor),
                });

                const incoming = data.data;
                const { friends, friendRequestsReceived, ...rest } = incoming;
                setIsNewPlayer(new Date(incoming.createdAt).getTime() === new Date(incoming.updatedAt).getTime())

                if (includeSocial) {
                    setPlayer(incoming);
                } else {
                    mergePlayer(rest);
                }

                return { data, error: null };
            } catch (err) {
                setError(err);
                return { data: null, error: err };
            } finally {
                setIsLoading(false);
            }
        },
        [queryClient, setPlayer, mergePlayer, setIsNewPlayer]
    );

    return { refetch: refreshPlayerProfile, isLoading, error };
}