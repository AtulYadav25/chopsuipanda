import { create } from 'zustand';
import type { BattleMatch } from '@/shared/schemas/battleMatch.schema';


interface BattleState {
    activeBattles: BattleMatch[] | [];
    currentBattle: BattleMatch | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    actions: {
        setCurrentBattle: (battle: any) => void;
        setActiveBattles: (battles: any) => void;
    }
}

export const useBattleMatchStore = create<BattleState>((set) => ({
    activeBattles: [],
    isLoading: false,
    currentBattle: null,
    error: null,
    actions: {
        setCurrentBattle: (battle: BattleMatch) => {
            set((state) => ({
                ...state,
                currentBattle: battle,
            }));
        },
        setActiveBattles: (activeBattles: BattleMatch[]) => {
            set((state) => ({
                ...state,
                activeBattles,
            }));
        },
    }
}));

//Export actions separately for easier access in components
export const useBattleMatchActions = () => useBattleMatchStore((state) => state.actions);