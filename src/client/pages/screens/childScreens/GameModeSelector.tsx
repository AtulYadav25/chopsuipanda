import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import SoundManager from '@/client/utils/SoundManager';
import TutorialOverlay from './TutorialOverlayScreen';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { gameModeAssets } from '@/client/assets';
import { usePlayerStore } from '@/client/store/usePlayerStore';
import { useGameplayStore } from '@/client/store/useGameplayStore';
import { useLevelUp, useRefreshPlayerProfile } from '@/client/hooks/player';
import { useToast } from '@/client/context/ToastContext';
import { GAME_TYPES, GameType } from '@/shared/constants/GameTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameModeSelectorProps {
    onBack: () => void;
    onNext: () => void;
}

interface LoadingState {
    visible: boolean;
    for: number;
}

interface GameModeData {
    heading: string;
    image: string;
    expandedImage: string;
    bg: string;
    activeStatus: boolean;
    description: string;
    amount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (num: number): string => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(0) + "K";
    return num.toString();
};

const gameIndexToType: Record<number, GameType> = {
    0: GAME_TYPES.TREE_CHOP,
    1: GAME_TYPES.BAMBOO_SHOOT,
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
    <svg
        aria-hidden="true"
        role="status"
        className="inline w-4 h-4 me-3 text-white animate-spin"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="#E5E7EB"
        />
        <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentColor"
        />
    </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const GameModeSelector = ({ onBack, onNext }: GameModeSelectorProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [loadingFor, setLoadingFor] = useState<LoadingState>({ visible: false, for: 0 });
    const [showTutorial, setShowTutorial] = useState<boolean>(false);
    const [selectedGameModeIndex, setSelectedGameModeIndex] = useState<number>(0);
    const [isNextDisabled, setIsNextDisabled] = useState<boolean>(false);

    // Asset loader
    const { assets } = useAssetLoader(gameModeAssets);

    // Store
    const player = usePlayerStore((s) => s.player);
    const setGameMode = useGameplayStore((s) => s.setGameMode);
    const { refetch: refetchPlayerProfile } = useRefreshPlayerProfile();

    // Toast
    const { showToast } = useToast();

    // Mutations
    const { mutateAsync: levelUp } = useLevelUp();

    const data: GameModeData[] = [
        {
            heading: "Tree Chop",
            image: assets.treeChopGameLogo ?? '',
            expandedImage: assets.treeChopBg ?? '',
            bg: "bg-[#eec472]",
            activeStatus: (player?.level ?? 0) > 0,
            description: "Swing your Panda and rack up points! Chop your way to glory and get 20% more CHI with every hit",
            amount: 12000,
        },
        {
            heading: "Bamboo Shoot!",
            image: assets.bambooShootGameLogo ?? '',
            expandedImage: assets.bambooShootGameBg ?? '',
            bg: "bg-[#3ad92b]",
            activeStatus: (player?.level ?? 0) > 1,
            description: "Master the art of precision! Throw bamboo like a ninja and earn 50% bonus CHI for every perfect strike",
            amount: 30000,
        },
    ];

    const handleUnlockLevel = async () => {
        if ((player?.chi ?? 0) < data[selectedGameModeIndex].amount) {
            showToast({ type: "error", message: "Insufficient CHI Balance!" });
            return;
        }

        try {
            setLoadingFor({ visible: true, for: selectedGameModeIndex });
            await levelUp({}, {
                onSuccess: () => {
                    showToast({ type: "success", message: "New Game Unlocked!" });
                    refetchPlayerProfile();
                },
                onError: (err) => {
                    console.error(err)
                    showToast({ type: "error", message: "Failed to unlock game. Please try again." });
                }
            });
        } catch (error) {
            console.error("Level up failed:", error);
        } finally {
            setLoadingFor({ visible: false, for: 0 });
        }
    };

    const handleOnNext = () => {
        SoundManager.play('menuSwitch');
        const tutorialSeen = localStorage.getItem(`tutorialSeen${selectedGameModeIndex}`);
        if (!tutorialSeen) {
            setShowTutorial(true);
        } else {
            onNext();
        }
    };

    const handleProceedToPlay = () => {
        localStorage.setItem(`tutorialSeen${selectedGameModeIndex}`, "true");
        onNext();
    };

    const handleSelect = (index: number) => {
        setSelectedGameModeIndex(index);
        setGameMode(gameIndexToType[index]);
        SoundManager.play('menuSwitch');
        setIsNextDisabled((player!.level) < (index + 1))
        console.log(index, player!.level, (player!.level) < index + 1)

        itemRefs.current.forEach((ref, i) => {
            if (!ref) return;
            gsap.to(ref, {
                height: i === index ? "100%" : "6%",
                duration: 0.6,
                ease: i === index ? "power2.out" : "power1.inOut",
            });
        });
    };

    const isLoadingCurrent = loadingFor.visible && loadingFor.for === selectedGameModeIndex;

    return (
        <>
            <div className="fixed inset-0 z-[200] flex justify-center items-center bg-black/20 backdrop-blur-sm">
                {showTutorial ? (
                    <TutorialOverlay
                        onComplete={handleProceedToPlay}
                        gameMode={gameIndexToType[selectedGameModeIndex]}
                    />
                ) : (
                    <div
                        ref={containerRef}
                        className="w-[90%] h-[85%] flex flex-col items-center justify-start gap-4"
                    >
                        <p onClick={onBack} className="text-white font-Game fixed top-5 left-5 z-[100]">
                            <i className="fa-solid fa-arrow-left" /> BACK
                        </p>

                        <h1 className="font-Game text-white text-xl text-center">Choose Your Game</h1>

                        {data.map((item, i) => (
                            <div
                                key={i}
                                ref={(el) => { itemRefs.current[i] = el; }}
                                onClick={() => {
                                    handleSelect(i)
                                }}
                                className={`w-[85%] !min-h-[8%] border-1 relative border-b-4 border-t-4 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 flex ${selectedGameModeIndex === i
                                    ? "flex-col justify-center items-center"
                                    : `flex-row justify-between items-center p-4 ${item.bg}`
                                    }`}
                                style={{
                                    height: selectedGameModeIndex === i ? "100%" : "6%",
                                }}
                            >
                                {selectedGameModeIndex === i ? (
                                    <>
                                        <h2 className="text-xl font-Game text-white tracking-widest text-center z-10 relative pt-4 pb-3 w-full">
                                            {item.heading}{" "}
                                            {!item.activeStatus && (
                                                <i className="fa-solid fa-lock text-md" />
                                            )}
                                        </h2>

                                        <p className="z-10 text-gray-200 text-xs font-Game text-center w-[85%] pb-3">
                                            {item.description}
                                        </p>

                                        {!item.activeStatus && (
                                            <button
                                                className="z-10 game_btn tracking-widest w-[60%] px-2"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent handleSelect firing
                                                    handleUnlockLevel();
                                                }}
                                            >
                                                {isLoadingCurrent ? (
                                                    <Spinner />
                                                ) : (
                                                    `Unlock ${formatNumber(item.amount)} CHI`
                                                )}
                                            </button>
                                        )}

                                        <div className="w-full h-full">
                                            <img
                                                src={item.expandedImage}
                                                alt={item.heading}
                                                className="absolute top-0 left-0 w-full h-full rounded-xl object-cover"
                                            />
                                            <div className="absolute top-[-1px] left-0 w-full h-full bg-gradient-to-b from-black/50 to-transparent z-0 rounded-xl" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-lg font-Game text-white w-[75%]">
                                            {item.heading}
                                        </h2>
                                        <img
                                            src={item.image}
                                            alt={item.heading}
                                            className="w-[20%] aspect-square object-cover rounded-md"
                                        />
                                    </>
                                )}
                            </div>
                        ))}

                        <button
                            disabled={isNextDisabled}
                            className={`game_btn font-Game mt-2 w-[80%] ${isNextDisabled ? "!bg-gray-400 border-gray-600" : ""}`}
                            onClick={handleOnNext}
                        >
                            NEXT
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default GameModeSelector;