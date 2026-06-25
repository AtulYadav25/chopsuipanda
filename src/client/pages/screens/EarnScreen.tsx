import { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { FaEye } from "react-icons/fa";
import { MdOutlineTimer } from "react-icons/md";
import { useToast } from "@/client/context/ToastContext";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { usePlayerStore } from "@/client/store/usePlayerStore";
import { useOpenChest } from "@/client/hooks/player";
import { ChestReward, ChestType, ROYAL_CHEST_REWARDS, TREASURE_CHEST_REWARDS } from "@/shared/constants/ChestConfig";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { earnAssets, introAssets } from "@/client/assets";
import ChestOpeningAnimation from './childScreens/ChestOpeningAnimationScreen';
import { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'arena' | 'mystery' | 'suiRewards' | 'royalRewards';
type CountAction = 'increment' | 'decrement';

interface EarnScreenProps {
    showConnectWallet: () => void;
    refreshPlayerProfile: (
        options?: RefetchOptions
    ) => Promise<QueryObserverResult<any>>;
}

interface RewardsGridProps {
    rewards: ChestReward[];
    onBack: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const RewardsGrid = ({ rewards, onBack }: RewardsGridProps) => {

    const allAssets = useMemo(
        () => ({
            ...earnAssets,
            ...introAssets,
        }),
        []
    );

    const { assets } = useAssetLoader(allAssets);

    return (
        <div className="EarnBoxes font-Game inset-0 bg-black/60 backdrop-blur">
            <span onClick={onBack} className="text-white cursor-pointer">
                <i className="fa-solid fa-arrow-left" /> Back
            </span>
            <div className="mt-4 border-t-2 border-[#2a1503] pt-4">
                <h4 className="text-white font-Game text-lg mb-3">Prizes:</h4>
                <div className="grid grid-cols-2 gap-4">
                    {rewards.map((reward, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 bg-[#2a1503] rounded-lg p-2 ${index === 0 ? 'bg-[#fba900] text-black' : ''}`}
                        >
                            <img
                                src={assets[reward.image]}
                                alt={`${reward.amount} ${reward.type}`}
                                className="w-8 h-8 object-contain"
                            />
                            <div className="text-white font-Game">
                                <span className={`${index === 0 ? '!text-white' : 'text-[#fba900]'}`}>
                                    {reward.amount.toLocaleString()}
                                </span>
                                <span className="text-sm"> {reward.type}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_CHEST_LIMIT = 10;
const MS_IN_24H = 24 * 60 * 60 * 1000;

const buttonClass =
    'highlight-text flex relative justify-center items-center font-Game !tracking-[0.1rem] w-full py-3 bg-[#55b75a] text-white rounded-lg border-b-[3px] border-[#409b44] hover:opacity-90 active:transform active:scale-95 transition-all';

// ─── Component ────────────────────────────────────────────────────────────────

const EarnScreen = ({ showConnectWallet, refreshPlayerProfile }: EarnScreenProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('arena');
    const [treasureCount, setTreasureCount] = useState<number>(1);
    const [royalCount, setRoyalCount] = useState<number>(1);
    const [isOpeningChest, setIsOpeningChest] = useState<boolean>(false);
    const [currentChestType, setCurrentChestType] = useState<ChestType | null>(null);
    const [currentChestCount, setCurrentChestCount] = useState<number>(1);
    const [selectedRewards, setSelectedRewards] = useState<ChestReward[]>([]);
    const [chestOpeningsLimit, setChestOpeningsLimit] = useState<Date[]>([]);

    const unlockChestCountDownRef = useRef<HTMLDivElement>(null);
    const treasureChestRef = useRef<HTMLImageElement>(null);
    const royalChestRef = useRef<HTMLImageElement>(null);

    // Asset loader
    const allAssets = useMemo(
        () => ({
            ...earnAssets,
            ...introAssets,
        }),
        []
    );
    const { assets } = useAssetLoader(allAssets);

    // Hooks
    const account = useCurrentAccount();
    const player = usePlayerStore((s) => s.player);
    const { showToast } = useToast();

    // Mutations & Queries
    const { mutateAsync: openChest } = useOpenChest();

    // ─── Chest countdown + GSAP ───────────────────────────────────────────────

    useEffect(() => {
        if (activeTab !== 'mystery') return;

        let intervalId: ReturnType<typeof setInterval>;

        const getRecentTimestamps = (): Date[] =>
            (player?.chestOpenings ?? []).filter(
                (ts) => new Date(ts).getTime() >= Date.now() - MS_IN_24H
            );

        const updateChestCountdown = () => {
            const recentTimestamps = getRecentTimestamps();
            setChestOpeningsLimit(recentTimestamps);

            if (recentTimestamps.length === 0) {
                if (unlockChestCountDownRef.current) {
                    unlockChestCountDownRef.current.textContent = '';
                }
                clearInterval(intervalId);
                return;
            }

            const oldestChest = recentTimestamps.reduce((oldest, current) =>
                current < oldest ? current : oldest
            );

            const timeSinceOldest = Date.now() - oldestChest.getTime();

            if (timeSinceOldest > MS_IN_24H) {
                setChestOpeningsLimit(getRecentTimestamps());
                clearInterval(intervalId);
                return;
            }

            const timeRemaining = MS_IN_24H - timeSinceOldest;
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

            if (unlockChestCountDownRef.current) {
                unlockChestCountDownRef.current.textContent =
                    `Get 1 Chest in: ${hours}h ${minutes}m ${seconds}s`;
            }
        };

        if (account?.address) {
            updateChestCountdown();
            intervalId = setInterval(updateChestCountdown, 1000);
        }

        // GSAP pulse on chest images
        [treasureChestRef.current, royalChestRef.current].forEach((ref) => {
            if (!ref) return;
            gsap.timeline({ repeat: -1, defaults: { ease: 'power1.inOut' } })
                .to(ref, { scale: 1.1, duration: 1 })
                .to(ref, { scale: 1, duration: 1 });
        });

        return () => {
            clearInterval(intervalId);
            gsap.killTweensOf([treasureChestRef.current, royalChestRef.current]);
        };
    }, [activeTab, player?.chestOpenings, account?.address]);

    // ─── Count handlers ───────────────────────────────────────────────────────

    const handleTreasureCount = (action: CountAction) => {
        setTreasureCount((prev) =>
            action === 'increment' ? Math.min(prev + 1, 4) : Math.max(prev - 1, 1)
        );
    };

    const handleRoyalCount = (action: CountAction) => {
        setRoyalCount((prev) =>
            action === 'increment' ? Math.min(prev + 1, 4) : Math.max(prev - 1, 1)
        );
    };

    // ─── Buy chest ────────────────────────────────────────────────────────────

    const handleBuyChest = async (chestType: ChestType) => {
        if (!account?.address) {
            showConnectWallet();
            return;
        }

        const count = chestType === ChestType.TREASURE ? treasureCount : royalCount;

        if (chestOpeningsLimit.length === DAILY_CHEST_LIMIT) {
            showToast({ type: 'info', message: 'Daily Limit Reached' });
            return;
        }

        try {
            await openChest(
                { chestDetails: { type: chestType, qty: count } },
                {
                    onSuccess: (data) => {
                        refreshPlayerProfile();
                        setCurrentChestType(chestType);
                        setCurrentChestCount(count);
                        setSelectedRewards(data?.data ?? []);
                        setIsOpeningChest(true);
                    },
                    onError: () => {
                        showToast({ type: 'error', message: 'Transaction Failed' });
                    },
                }
            );
        } catch {
            showToast({ type: 'error', message: 'Transaction Failed' });
        }
    };

    const handleChestClose = () => {
        setIsOpeningChest(false);
        setCurrentChestType(null);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const remainingChests = DAILY_CHEST_LIMIT - chestOpeningsLimit.length;
    const progressPercent = 100 - chestOpeningsLimit.length * 10;

    return (
        <>
            {/* Background */}
            <div className="fixed inset-0 w-full h-full bg-black z-0">
                <img
                    src={assets.earnBackground}
                    alt="background"
                    className="fixed inset-0 w-full h-full object-cover z-0 opacity-80"
                />
            </div>

            <div className="min-h-screen w-full relative flex flex-col pt-[18%]">
                {/* Header & Tabs */}
                <div className="bg-transparent z-20">
                    <div className="px-5 pt-8">
                        <div className="flex justify-center mb-6 font-Game">
                            <div className="inset-0 bg-black/60 backdrop-blur p-1 rounded-lg w-fit flex">
                                <button
                                    onClick={() => setActiveTab('arena')}
                                    className={`px-3 py-2 font-bold text-white transition-colors duration-300 rounded-md ${activeTab === 'arena' ? 'bg-[#fba900]' : ''}`}
                                >
                                    Arena
                                </button>
                                <button
                                    onClick={() => setActiveTab('mystery')}
                                    className={`px-3 py-2 font-bold text-white transition-colors duration-300 rounded-md ${activeTab !== 'arena' ? 'bg-[#fba900]' : ''}`}
                                >
                                    Mystery Chest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-3 pb-12 space-y-6 z-10 mb-[25%] max-h-[70vh]">

                    {/* ── Arena tab ── */}
                    {activeTab === 'arena' && (
                        <div className="EarnBoxes inset-0 bg-black/60 backdrop-blur">
                            <h2 className="text-[#fba900] text-3xl leading-[1.2] tracking-wide text-center mb-3 font-Game">
                                HOLD THE THRONE
                            </h2>
                            <p className="text-gray-300 mb-4 text-center font-Game tracking-wider">
                                Climb to the top of the leaderboard and claim the Throne. Earn SUI as long as you
                                reign — but beware, challengers are coming.{' '}
                                <span>Can you defend your crown?</span>
                            </p>
                            <img src={assets.suiweek} alt="Sui Week" className="w-full rounded-lg mb-4" />
                            <span className="flex items-center gap-2 text-slate-200 text-sm font-Game mb-2">
                                <FaEye size="1.2rem" /> View Leaderboard
                            </span>
                            <button
                                className={`${buttonClass} mt-3`}
                                onClick={() => showToast({ type: 'info', message: 'Coming Soon...' })}
                            >
                                {`Play (1 SUI)`}
                            </button>
                            <p className="text-white/95 tracking-wide text-center mt-2 font-Game text-sm">
                                Note: This requires only One Time Entry Fee every week
                            </p>
                        </div>
                    )}

                    {/* ── Mystery tab ── */}
                    {activeTab === 'mystery' && (
                        <>
                            {/* Daily limit bar */}
                            {account?.address && (
                                <div className="mx-auto min-w-[99%] px-4 pb-3 my-3">
                                    <div className="bg-[#c13d1d]/90 backdrop-blur rounded-lg overflow-hidden shadow-lg border-2 border-[#fba900]/70">
                                        <div className="px-5 py-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h2 className="text-white font-Game text-lg tracking-wider">
                                                    YOUR DAILY CHEST LIMIT
                                                </h2>
                                                <div className="text-white font-Game text-sm">
                                                    {remainingChests}/{DAILY_CHEST_LIMIT}
                                                </div>
                                            </div>
                                            <div className="relative h-4 bg-[#7a3420] rounded-full overflow-hidden mb-3">
                                                <div
                                                    className="absolute left-0 top-0 h-full bg-[#fba900] rounded-full"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            {chestOpeningsLimit.length > 0 && (
                                                <div
                                                    ref={unlockChestCountDownRef}
                                                    className="text-gray-200 font-Game text-sm flex items-center gap-2"
                                                >
                                                    <MdOutlineTimer /> Get 1 Chest in: 23h 57m 16s
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Treasure Chest */}
                            <div className="EarnBoxes font-Game">
                                <h2 className="text-3xl text-white mb-2 font-Game">Grand Prize:</h2>
                                <h3 className="text-4xl text-[#fba900] mb-4 relative overflow-hidden">
                                    <span className="highlight-text">100,000 CHI</span>
                                </h3>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col items-center gap-2 rounded-lg p-2">
                                        <h2 className="text-xl font-bold text-white mb-2 font-Game">
                                            1,000 CHI <br /> Per Chest
                                        </h2>
                                        <div className="flex items-center gap-4 bg-[#d14207] rounded-lg p-2">
                                            <button
                                                onClick={() => handleTreasureCount('decrement')}
                                                className="w-8 h-8 flex items-center justify-center bg-[#ffb704] rounded text-black font-poppins"
                                            >
                                                -
                                            </button>
                                            <span className="text-white font-bold text-center">{treasureCount}</span>
                                            <button
                                                onClick={() => handleTreasureCount('increment')}
                                                className="w-8 h-8 flex items-center justify-center bg-[#ffb704] rounded text-black font-poppins"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <img
                                        ref={treasureChestRef}
                                        src={assets.chiChest}
                                        alt="Treasure Chest"
                                        className="w-1/2 object-contain transform-gpu"
                                    />
                                </div>
                                <span
                                    className="text-white my-2 flex items-center gap-2 cursor-pointer"
                                    onClick={() => setActiveTab('royalRewards')}
                                >
                                    <FaEye size="1.2rem" /> View Rewards
                                </span>
                                <div className="flex flex-col gap-2 mt-5">
                                    <button className={buttonClass} onClick={() => handleBuyChest(ChestType.TREASURE)}>
                                        BUY CHEST
                                    </button>
                                </div>
                            </div>

                            {/* Royal Chest */}
                            <div className="EarnBoxes font-Game">
                                <h2 className="text-3xl text-white mb-2">Grand Prize:</h2>
                                <h3 className="text-4xl text-blue-400 mb-4 relative overflow-hidden">
                                    <span className="highlight-text">8.0 SUI</span>
                                </h3>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col items-center gap-2 rounded-lg p-2">
                                        <h2 className="text-xl font-bold text-white mb-2">
                                            100,000 CHI <br /> Per Chest
                                        </h2>
                                        <div className="flex items-center gap-4 bg-[#d14207] rounded-lg p-2">
                                            <button
                                                onClick={() => handleRoyalCount('decrement')}
                                                className="w-8 h-8 flex items-center justify-center bg-[#ffb704] rounded text-black font-poppins"
                                            >
                                                -
                                            </button>
                                            <span className="text-white font-bold text-center">{royalCount}</span>
                                            <button
                                                onClick={() => handleRoyalCount('increment')}
                                                className="w-8 h-8 flex items-center justify-center bg-[#ffb704] rounded text-black font-poppins"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <img
                                        ref={royalChestRef}
                                        src={assets.suiChest}
                                        alt="Royal Chest"
                                        className="w-1/2 object-contain transform-gpu"
                                    />
                                </div>
                                <span
                                    className="text-white my-2 flex items-center gap-2 cursor-pointer"
                                    onClick={() => setActiveTab('suiRewards')}
                                >
                                    <FaEye size="1.2rem" /> View Rewards
                                </span>
                                <div className="flex flex-col gap-2 mt-5">
                                    <button
                                        className={`${buttonClass} bg-blue-400 border-blue-700`}
                                        onClick={() => handleBuyChest(ChestType.ROYAL)}
                                    >
                                        BUY CHEST
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Reward grids ── */}
                    {activeTab === 'suiRewards' && (
                        <RewardsGrid rewards={ROYAL_CHEST_REWARDS} onBack={() => setActiveTab('mystery')} />
                    )}
                    {activeTab === 'royalRewards' && (
                        <RewardsGrid rewards={TREASURE_CHEST_REWARDS} onBack={() => setActiveTab('mystery')} />
                    )}
                </div>
            </div>

            <ChestOpeningAnimation
                isOpen={isOpeningChest}
                currentChestType={currentChestType}
                onClose={handleChestClose}

                chestCount={currentChestCount}
                preSelectedRewards={selectedRewards}
            />
        </>
    );
};

export default EarnScreen;