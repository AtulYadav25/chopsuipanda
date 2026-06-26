import { create } from 'zustand';
import type { PlayerPublic } from '@/shared/schemas/player.schema';


interface PlayerState {
    player: PlayerPublic | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    actions: {
        setPlayer: (player: PlayerPublic) => void;
        mergePlayer: (partial: Partial<PlayerPublic>) => void;
    }
}

export const usePlayerStore = create<PlayerState>((set) => ({
    player: null,
    isLoading: false,
    error: null,
    // in usePlayerStore.ts
    actions: {
        setPlayer: (player: PlayerPublic) => {
            console.log("Okay Setting Player")
            set({ player });
        },
        mergePlayer: (partial: Partial<PlayerPublic>) => {
            set((state) => ({
                player: state.player ? { ...state.player, ...partial } : null
            }));
        },
    }
}));

//Export actions separately for easier access in components
export const usePlayerActions = () => usePlayerStore((state) => state.actions);