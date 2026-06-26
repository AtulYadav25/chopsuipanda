import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
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
    });
}

export function useRefreshPlayerProfile() {
    const { setPlayer, mergePlayer } = usePlayerActions();
    const includeSocialRef = useRef(false);

    const query = useQuery({
        ...playerClientModule.query('getMe', { includeSocial: includeSocialRef.current }),
        queryFn: (context) =>
            typedQueryFn<PlayerPublic>(
                playerClientModule.query('getMe', { includeSocial: includeSocialRef.current })
            )(context),
        enabled: false, // manual only
    });

    useEffect(() => {
        if (query.data) {
            const incoming = query.data.data;
            const { friends, friendRequestsReceived, ...rest } = incoming;

            if (includeSocialRef.current) {
                setPlayer(incoming);
            } else {
                mergePlayer(rest);
            }
        }
    }, [query.data]);

    const refreshPlayerProfile = useCallback(
        ({ includeSocial = false }: { includeSocial?: boolean } = {}) => {
            includeSocialRef.current = includeSocial;
            return query.refetch();
        },
        [query.refetch]
    );

    return { ...query, refetch: refreshPlayerProfile };
}