import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { pandaLoadingAssets } from "@/client/assets";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PandaLoadingScreenProps {
    ready: boolean;
    progress: number; // 0–100, driven by useAssetLoader
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

// ─── Component ────────────────────────────────────────────────────────────────

const PandaLoadingScreen = ({ ready, progress }: PandaLoadingScreenProps) => {

    //Assets
    const { assets, ready: loadingAssetsReady } = useAssetLoader(pandaLoadingAssets);

    const [welcomeMessage, setWelcomeMessage] = useState<string>('');
    const [done, setDone] = useState<boolean>(false);

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

    // When everything is ready, fade out and unmount
    useEffect(() => {
        if (!ready) return;

        gsap.to(containerRef.current, {
            opacity: 0,
            duration: 1,
            onComplete: () => setDone(true),
        });
    }, [ready]);

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

            {/* Progress bar — driven directly by the `progress` prop */}
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