import { create } from 'zustand';
import type { PlayerPublic } from '@/shared/schemas/player.schema';


interface PlayerState {
    player: PlayerPublic | null;
    isNewPlayer: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    actions: {
        setPlayer: (player: PlayerPublic | null) => void;
        mergePlayer: (partial: Partial<PlayerPublic>) => void;
        setIsNewPlayer: (isNewPlayer: boolean) => void;
    }
}

export const usePlayerStore = create<PlayerState>((set) => ({
    player: null,
    isNewPlayer: false,
    isLoading: false,
    error: null,
    // in usePlayerStore.ts
    actions: {
        setPlayer: (player: PlayerPublic | null) => {
            set({ player });
        },
        mergePlayer: (partial: Partial<PlayerPublic>) => {
            set((state) => ({
                player: state.player ? { ...state.player, ...partial } : null
            }));
        },
        setIsNewPlayer: (isNewPlayer: boolean) => {
            set({ isNewPlayer });
        }
    }
}));

//Export actions separately for easier access in components
export const usePlayerActions = () => usePlayerStore((state) => state.actions);