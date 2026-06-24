// src/client/stores/gameplayStore.ts
//
// Tracks whether the player is currently in active gameplay, so other parts
// of the app (like GameNotification) can decide whether to suppress UI that
// shouldn't appear mid-game. Deliberately a boolean, not a page/screen enum
// — see chat for why a screen string is more surface area than this needs.

import { GAME_TYPES, GameType } from '@/shared/constants/GameTypes';
import { BattleMatch } from '@/shared/schemas/battleMatch.schema';
import { create } from 'zustand';

export const PAGES = ['home', 'shop', 'frens', 'earn', 'challengeFren', 'leaderboard', 'tutorial', 'game', 'chestOpen'] as const;
export type Page = (typeof PAGES)[number];

interface GameplayState {
    isPlaying: boolean;
    page: Page;
    gameMode: GameType;
    isGameSoundOn: boolean;
    battleDetails: BattleMatch | null;
    setIsPlaying: (isPlaying: boolean) => void;
    setPage: (page: Page) => void;
    showConnectWallet: () => void;
    setGameMode: (gameMode: GameType) => void;
    setIsGameSoundOn: (isGameSoundOn: boolean) => void;
    setBattleDetails: (battleDetails: BattleMatch) => void;
}

export const useGameplayStore = create<GameplayState>((set) => ({
    isPlaying: false,
    page: 'home',
    gameMode: GAME_TYPES.IDLE,
    isGameSoundOn: false,
    battleDetails: null,
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setPage: (page) => set({ page }),
    showConnectWallet: () => {
        set({ page: 'home' })
    },
    setGameMode: (gameMode: GameType) => set({ gameMode }),
    setIsGameSoundOn: (isGameSoundOn: boolean) => set({ isGameSoundOn }),
    setBattleDetails: (battleDetails: BattleMatch) => set({ battleDetails }),
}));


// Example: inside your bambooGame screen component (or wherever gameplay
// actually starts/stops — NOT a generic route-level layout file).
//
// import { useEffect } from 'react';
// import { useGameplayStore } from '@/client/stores/gameplayStore';
//
// function bambooGameScreen() {
//   const setIsPlaying = useGameplayStore((s) => s.setIsPlaying);
//
//   useEffect(() => {
//     setIsPlaying(true);
//     return () => setIsPlaying(false);
//   }, [setIsPlaying]);
//
//   // ...rest of game component
// }
//
// Do the same in TreeGameScreen. If you have a single shared "GameShell"
// wrapper that both bamboo and tree screens render inside, put it there once
// instead of duplicating in both — that's the one case where lifting it up
// a level makes sense.