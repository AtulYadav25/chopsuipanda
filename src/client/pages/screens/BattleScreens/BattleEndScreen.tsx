import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePlayerStore } from "@/client/store/usePlayerStore";
import { PlayerPublic } from "@/shared/schemas/player.schema";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { frensAssets } from "@/client/assets";
import { useGameplayStore } from "@/client/store/useGameplayStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BattleEndScreenProps {
    winner: { username: string };
    onReturnHome: () => void;
    loading: boolean;
}

interface PlayerBoxProps {
    player: PlayerPublic;
    username: string;
    isWinner: boolean;
    showCounter: boolean;
    count: number;
    score: number;
    pandaHead: string;
}

// ─── PlayerBox ────────────────────────────────────────────────────────────────

const PlayerBox = ({ player, username, isWinner, showCounter, count, score, pandaHead }: PlayerBoxProps) => (
    <div className="flex font-Game flex-col items-center bg-blue-400/40 rounded-xl p-4">
        <img
            src={pandaHead}
            alt={username}
            className={`w-16 h-16 object-cover mb-2 ${isWinner ? 'hue-rotate-[189deg]' : ''}`}
        />
        <p className="text-white font-Game">{username === player?.username ? 'You' : username}</p>
        <p className="text-white font-Game">Score: {score}</p>
        {isWinner && showCounter && (
            <p className="text-sky-500 text-lg font-Game mt-1">
                {count} <span className="text-base">CHI</span>
            </p>
        )}
    </div>
);

// ─── BattleEndScreen ───────────────────────────────────────────────────────

const BattleEndScreen = ({ winner, onReturnHome, loading }: BattleEndScreenProps) => {
    const { assets } = useAssetLoader(frensAssets);

    const [startSequence, setStartSequence] = useState<boolean>(false);
    const [showBoxes, setShowBoxes] = useState<boolean>(false);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [count, setCount] = useState<number>(0);
    const [showCounter, setShowCounter] = useState<boolean>(false);

    // Store
    const player = usePlayerStore((s) => s.player);
    const battleDetails = useGameplayStore((s) => s.battleDetails);

    const backdropRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLHeadingElement>(null);
    const timeoutRef = useRef<HTMLHeadingElement>(null);

    // Animate backdrop and loading text on mount
    useEffect(() => {
        if (backdropRef.current) {
            gsap.fromTo(
                backdropRef.current,
                { y: '100%', opacity: 0 },
                { y: '0%', opacity: 1, duration: 0.8, ease: 'power2.out' }
            );
        }
        if (loadingRef.current) {
            gsap.fromTo(
                loadingRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.6, delay: 0.8 }
            );
        }
    }, []);

    // Kick off the end sequence once loading finishes
    useEffect(() => {
        if (!loading) startAnimationSequence();
    }, [loading]);

    const animateCount = (wagerAmount: number) => {
        let current = 0;
        const duration = 1.5;
        const totalFrames = duration * 60;
        const increment = wagerAmount / totalFrames;
        const frameRate = 1000 / 60;
        let frame = 0;

        const counter = setInterval(() => {
            current += increment;
            frame++;
            setCount(Math.floor(current));
            if (frame >= totalFrames) {
                setCount(wagerAmount);
                clearInterval(counter);
            }
        }, frameRate);
    };

    const startAnimationSequence = () => {
        if (!battleDetails) return;

        setStartSequence(true);

        if (timeoutRef.current) {
            gsap.fromTo(
                timeoutRef.current,
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 0.6 }
            );
        }

        const boxTimer = setTimeout(() => setShowBoxes(true), 1500);

        const resultTimer = setTimeout(() => {
            setShowResult(true);
            setShowCounter(true);
            animateCount(battleDetails.wagerAmount);
        }, 3700);

        // Note: these timers are intentionally not cleaned up here — the
        // sequence should always complete once started. If early cleanup is
        // needed, lift the timer refs to the component level.
        return () => {
            clearTimeout(boxTimer);
            clearTimeout(resultTimer);
        };
    };

    // ─── Guards ───────────────────────────────────────────────────────────────

    if (!battleDetails) return null;
    if (!player) return null;

    // ─── Derived ──────────────────────────────────────────────────────────────

    const isOpponentPresent = battleDetails.opponent.username === player.username;
    const isWinner = winner?.username === player.username;

    const resultColor = isOpponentPresent
        ? isWinner ? 'text-green-500' : 'text-red-500'
        : 'text-blue-400';

    const resultText = isOpponentPresent
        ? isWinner ? 'You Won' : 'You Lost'
        : 'Waiting for opponent...';

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-50"
        >
            {loading && (
                <h1 ref={loadingRef} className="text-white text-4xl font-Game opacity-0">
                    Loading...
                </h1>
            )}

            {!loading && startSequence && (
                <>
                    <h1 ref={timeoutRef} className="text-white text-5xl font-Game mb-4">
                        GAME OVER
                    </h1>

                    {showBoxes && (
                        <div className="flex gap-6 font-Game items-end mb-6">
                            <PlayerBox
                                username={battleDetails.challenger.username}
                                isWinner={winner?.username === battleDetails.challenger.username}
                                showCounter={showCounter}
                                count={count}
                                score={battleDetails.challenger.score}
                                player={player}
                                pandaHead={assets.pandaHead}
                            />
                            {isOpponentPresent && (
                                <PlayerBox
                                    username={battleDetails.opponent.username}
                                    isWinner={winner?.username === battleDetails.opponent.username}
                                    showCounter={showCounter}
                                    count={count}
                                    score={battleDetails.opponent.score}
                                    player={player}
                                    pandaHead={assets.pandaHead}
                                />
                            )}
                        </div>
                    )}

                    {showResult && (
                        <h2 className={`text-2xl text-center font-Game mb-4 ${resultColor}`}>
                            {resultText}
                        </h2>
                    )}

                    {showResult && (
                        <button
                            onClick={onReturnHome}
                            className="mt-6 flex relative justify-center items-center font-Game !tracking-[0.1rem] py-3 px-4 bg-[#55b75a] text-white rounded-lg border-b-[3px] border-[#409b44] hover:opacity-90 active:transform active:scale-95 transition-all"
                        >
                            Return Home
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default BattleEndScreen;