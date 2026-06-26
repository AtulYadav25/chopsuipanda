import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { pandaLoadingAssets } from "@/client/assets";
import { usePlayerAuth } from "@/client/context/PlayerAuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PandaLoadingScreenProps {
    ready: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WELCOME_MESSAGES = [
    "Sharpen your blade, warrior!",
    "Get ready to slice some SUI!",
    "The panda is almost here...",
    "Hold tight, your ninja moment is near!",
    "Summoning bamboo energy...",
    "Panda power is loading...",
];

// Progress bar tuning
const PRE_READY_CAP = 75;       // cap while waiting for `ready` (70-80% range)
const PRE_READY_TICK_MS = 180;  // how often we bump progress before ready
const POST_READY_TICK_MS = 60;  // faster ticks once ready, racing to 100%

// ─── Component ────────────────────────────────────────────────────────────────

const PandaLoadingScreen = ({ ready }: PandaLoadingScreenProps) => {

    //Context
    const { isAuthenticating } = usePlayerAuth();

    //Assets
    const { assets } = useAssetLoader(pandaLoadingAssets);

    const [welcomeMessage, setWelcomeMessage] = useState<string>('');
    const [done, setDone] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    const overlayRef = useRef<HTMLImageElement>(null);
    const characterRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Pick a random welcome message and start float animations on mount
    useEffect(() => {
        setWelcomeMessage(
            WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]
        );

        const overlayTL = gsap.timeline({ repeat: -1, yoyo: true });
        overlayTL.to(overlayRef.current, {
            x: Math.random() * 40 - 15,
            y: Math.random() * 15 - 5,
            duration: 2,
            ease: 'power1.inOut',
        });

        const characterTL = gsap.timeline({ repeat: -1, yoyo: true });
        characterTL.to(characterRef.current, {
            x: Math.random() * 30 - 10,
            y: Math.random() * 18 - 7,
            duration: 3,
            ease: 'power1.inOut',
        });

        return () => {
            overlayTL.kill();
            characterTL.kill();
        };
    }, []);

    // Fake progress engine:
    // - Before `ready`: climbs toward PRE_READY_CAP (70-80%) and holds there.
    // - Once `ready` is true: races the remainder up to 100%.
    // - The bar hitting 100% is cosmetic only — actual hide/unmount is still
    //   gated on `ready && !isAuthenticating` below, matching prior behavior.
    useEffect(() => {
        const target = ready ? 100 : PRE_READY_CAP;
        const tickMs = ready ? POST_READY_TICK_MS : PRE_READY_TICK_MS;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= target) return prev;
                // ease-out: bigger steps far from target, smaller steps near it
                const remaining = target - prev;
                const step = Math.max(1, Math.round(remaining * 0.12));
                return Math.min(target, prev + step);
            });
        }, tickMs);

        return () => clearInterval(interval);
    }, [ready]);

    // When everything is ready, wait a random 1-3s "grace" delay, then fade out and unmount.
    // This avoids the loading screen disappearing too abruptly even when the app
    // technically finished loading instantly.
    useEffect(() => {
        if (!ready || isAuthenticating) return;

        const delayMs = 1000 + Math.random() * 2000; // random delay between 1s and 3s

        const timeoutId = setTimeout(() => {
            gsap.to(containerRef.current, {
                opacity: 0,
                duration: 1,
                onComplete: () => setDone(true),
            });
        }, delayMs);

        return () => clearTimeout(timeoutId);
    }, [ready, isAuthenticating]);

    if (done) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-cover bg-center tracking-widest !font-Game"
            style={{ backgroundImage: `url(${assets.TempleBackground})` }}
        >
            {/* Overlay image */}
            <img
                ref={overlayRef}
                src={assets.suiBackground}
                alt="Overlay"
                className="absolute inset-0 w-full h-full object-contain top-0 pointer-events-none z-[10]"
            />

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 w-full h-[38%] z-[15] pointer-events-none bg-gradient-to-t from-black via-black/70 to-transparent" />

            {/* Spacer */}
            <div className="w-full h-[25%]" />

            {/* Character */}
            <img
                ref={characterRef}
                src={assets.suiPandaLoading}
                alt="Character"
                className="z-50 w-[80%] pointer-events-none"
            />

            {/* Text */}
            <div className="text-center mt-6 z-[20]">
                <h1 className="text-4xl text-white">
                    Chop <span className="text-blue-300">SUI</span> PANDA
                </h1>
                <p className="text-blue-300 mt-2 text-lg">{welcomeMessage}</p>
            </div>

            {/* Progress bar — driven by the fake progress engine above */}
            <div className="w-3/4 md:w-1/2 h-5 mt-5 bg-blue-300 rounded-full overflow-hidden z-[80] border border-black relative">
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-700 z-[90]" />
                <div
                    className="h-full bg-blue-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default PandaLoadingScreen;