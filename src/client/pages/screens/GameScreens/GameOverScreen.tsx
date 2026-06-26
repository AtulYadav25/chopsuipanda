import { useRef, useEffect, useState, useMemo } from 'react';
import gsap from 'gsap';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { gameOverAssets, introAssets } from '@/client/assets';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiLoadingState {
    loading: boolean;
    to: string;
}

interface GameOverScreenProps {
    score: number | null;
    onContinue: () => void;
    onRetry: () => void;
    onExit: () => void;
    chi: number | null;
    apiLoading: ApiLoadingState;
    numOfContinues: number;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
    <svg
        aria-hidden="true"
        role="status"
        className="inline w-4 h-4 text-white animate-spin"
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

const GameOverScreen = ({
    score,
    onContinue,
    onRetry,
    onExit,
    chi,
    apiLoading,
    numOfContinues,
}: GameOverScreenProps) => {

    const allAssets = useMemo(
        () => ({
            ...gameOverAssets,
            ...introAssets,
        }),
        []
    );

    const { assets } = useAssetLoader(allAssets);

    const gameOverRef = useRef<HTMLDivElement>(null);
    const scoreRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const scoreTweenRef = useRef<gsap.core.Tween | null>(null);
    const chiCoinRef = useRef<HTMLImageElement>(null);

    const [countdown, setCountdown] = useState<number>(30);

    useEffect(() => {
        if (score == null) return;

        // ── Entrance animation ────────────────────────────────────────────────
        if (gameOverRef.current) {
            gsap.set(gameOverRef.current, { y: -300, opacity: 0 });
            gsap.to(gameOverRef.current, {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: 'bounce.inOut',
                onComplete: () => {
                    const scrollWrapper = document.querySelector<HTMLElement>('.scroll-wrapper');
                    const scrollContent = document.querySelector<HTMLElement>('.scroll-content');

                    if (!scrollWrapper || !scrollContent) return;

                    scrollWrapper.style.visibility = 'visible';

                    gsap.set(scrollWrapper, { scaleY: 0, transformOrigin: 'top' });
                    gsap.set(scrollContent, { opacity: 0, y: -50 });

                    gsap.timeline()
                        .to(scrollWrapper, { scaleY: 1, duration: 1, ease: 'back.out(1.7)' })
                        .to(scrollContent, {
                            opacity: 1,
                            y: 0,
                            duration: 0.5,
                            onComplete: () => {
                                if (!scoreRef.current) return;
                                // Animate score counter
                                scoreTweenRef.current = gsap.to({ val: 0 }, {
                                    val: score,
                                    duration: 2,
                                    ease: 'power1.out',
                                    onUpdate: function () {
                                        if (!scoreRef.current) return;
                                        scoreRef.current.innerHTML =
                                            Math.round(this.targets()[0].val).toLocaleString();
                                    },
                                });
                            },
                        });
                },
            });
        }

        // ── Countdown via rAF ─────────────────────────────────────────────────
        const updateCountdown = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = (timestamp - startTimeRef.current) / 1000;
            const remaining = Math.max(30 - elapsed, 0);
            setCountdown(Math.floor(remaining));
            if (remaining > 0) {
                requestRef.current = requestAnimationFrame(updateCountdown);
            }
        };

        requestRef.current = requestAnimationFrame(updateCountdown);

        return () => {
            cancelAnimationFrame(requestRef.current);
            scoreTweenRef.current?.kill();
            scoreTweenRef.current = null;
        };
    }, [score]);

    useEffect(() => {
        if (apiLoading.to === 'gameSessionEnd' && chiCoinRef.current) {
            gsap.killTweensOf(chiCoinRef.current);
            gsap.set(chiCoinRef.current, { scale: 0, opacity: 0, rotation: 0 });
            gsap.to(chiCoinRef.current, {
                scale: 1.2,
                opacity: 1,
                rotation: 360,
                duration: 0.5,
                ease: 'back.out(1.7)',
                onComplete: () => {
                    gsap.to(chiCoinRef.current, {
                        scale: 1,
                        rotation: 720,
                        duration: 1.5,
                        repeat: -1,
                        ease: 'none',
                    });
                }
            });
        } else if (chiCoinRef.current) {
            gsap.killTweensOf(chiCoinRef.current);
            gsap.to(chiCoinRef.current, { scale: 0, opacity: 0, duration: 0.2 });
        }
    }, [apiLoading.to]);

    const handleOnContinue = () => {
        scoreTweenRef.current?.kill();
        scoreTweenRef.current = null;
        onContinue();
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const continueExpired = countdown === 0;
    const continueLabel = `Continue (${(numOfContinues + 1) * 5}K CHI) - ${countdown}s`;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm font-Game z-[500]">
            <div ref={gameOverRef} className="w-full h-full flex flex-col items-center justify-center">

                <img src={assets.gameOverBoard} alt="Game Over" className="mx-auto mb-6 w-1/2" />

                <div
                    className="flex flex-col items-center justify-center scroll-wrapper relative overflow-hidden mb-6"
                    style={{ visibility: 'hidden' }}
                >
                    <img src={assets.scrollImage} alt="Scroll" className="mx-auto w-full" />

                    <div className="scroll-content w-[90%] absolute inset-0 flex flex-col items-center justify-center m-auto p-6">

                        {/* CHI coin loading overlay */}
                        {apiLoading.to === 'gameSessionEnd' ? (
                            <div className="absolute inset-0 flex items-center justify-center rounded z-10">
                                <img
                                    ref={chiCoinRef}
                                    src={assets.chi}
                                    alt="CHI"
                                    className="w-20 h-20"
                                />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl text-black mb-4">Your Score</h2>
                                <div ref={scoreRef} className="text-white text-5xl mb-6">0</div>

                                <div className="flex items-center justify-center mb-4">
                                    <img src={assets.chi} alt="CHI" className="w-10 mr-2" />
                                    <span className="text-blue-700 text-center text-lg">+{chi} CHI Earned</span>
                                </div>

                                <div className="flex flex-col gap-3 w-full text-white">
                                    <div className="flex gap-4">
                                        <button
                                            disabled={apiLoading.loading}
                                            onClick={onExit}
                                            className="w-1/2 py-2 rounded-lg bg-green-500 border-b-4 border-green-700 hover:bg-green-600 hover:border-green-800 transition"
                                        >
                                            Exit
                                        </button>
                                        <button
                                            disabled={apiLoading.loading}
                                            onClick={onRetry}
                                            className="w-1/2 py-2 rounded-lg bg-green-500 border-b-4 border-green-700 hover:bg-green-600 hover:border-green-800 transition"
                                        >
                                            Retry
                                        </button>
                                    </div>

                                    {numOfContinues < 10 && (
                                        <button
                                            disabled={apiLoading.loading || continueExpired}
                                            onClick={handleOnContinue}
                                            className={`w-full py-2 rounded-lg transition border-b-4 ${continueExpired
                                                ? 'bg-gray-500 cursor-not-allowed border-gray-600'
                                                : 'bg-green-500 hover:bg-green-600 border-green-700 hover:border-green-800'
                                                }`}
                                        >
                                            {apiLoading.to === 'continue' ? (
                                                <Spinner />
                                            ) : continueExpired ? (
                                                'Time Expired'
                                            ) : (
                                                continueLabel
                                            )}
                                        </button>
                                    )}
                                </div>
                            </>)}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GameOverScreen;