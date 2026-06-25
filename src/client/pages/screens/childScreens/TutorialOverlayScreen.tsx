import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAssetLoader } from "@/client/assets/useAssetLoader.js";
import { GameType } from "@/shared/constants/GameTypes.js";
import {
    bambooShootTutorialAssets,
    treeChopTutorialAssets,
} from "@/client/assets/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetMap = Record<string, () => Promise<{ default: string }>>;

interface TutorialConfig {
    assets: AssetMap;
    backgroundKey: string;
    imageKeys: string[];
}

// ─── Per-mode config ──────────────────────────────────────────────────────────
// "backgroundKey" must match a key in the asset map.
// "imageKeys" lists tutorial slide keys in order.

const TUTORIAL_CONFIG: Partial<Record<GameType, TutorialConfig>> = {
    TREE_CHOP: {
        assets: {
            ...treeChopTutorialAssets,
            bg: () => import("../../../assets/tutorial/TreeGame/treetutorBg.png"),
        },
        backgroundKey: "bg",
        imageKeys: ["tut1", "tut2", "tut3"],
    },
    BAMBOO_SHOOT: {
        assets: {
            ...bambooShootTutorialAssets,
            bg: () => import("../../../assets/knife_boss/background.webp"),
        },
        backgroundKey: "bg",
        imageKeys: ["tut1", "tut2", "tut3"],
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface TutorialOverLayScreenProps {
    onComplete: () => void;
    gameMode: GameType;
}

const TutorialOverLayScreen = ({
    onComplete,
    gameMode,
}: TutorialOverLayScreenProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const imageRef = useRef<HTMLImageElement>(null);
    const floatTween = useRef<gsap.core.Tween | null>(null);

    const config = TUTORIAL_CONFIG[gameMode];

    // Falls back to an empty map so the hook is always called unconditionally
    const { assets, ready } = useAssetLoader(config?.assets ?? {});

    // Animate each tutorial slide on step change
    useEffect(() => {
        if (!imageRef.current) return;

        gsap.fromTo(
            imageRef.current,
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
        );

        floatTween.current?.kill();

        floatTween.current = gsap.to(imageRef.current, {
            x: () => Math.random() * 20 - 5,
            y: () => Math.random() * 20 - 5,
            duration: 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
        });

        return () => {
            floatTween.current?.kill();
        };
    }, [currentStep]);

    const handleClick = () => {
        if (!config) return;

        if (currentStep < config.imageKeys.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            floatTween.current?.kill();
            onComplete();
        }
    };

    // Wait until assets are loaded and config exists
    if (!ready || !config) return null;

    const backgroundUrl = assets[config.backgroundKey];
    const currentImageUrl = assets[config.imageKeys[currentStep]];

    // Sanity check — asset keys must be present
    if (!backgroundUrl || !currentImageUrl) return null;

    const imageClass =
        gameMode === "TREE_CHOP"
            ? "h-full object-cover pointer-events-none"
            : "max-w-[90%] max-h-[90%] object-contain pointer-events-none";

    return (
        <div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
            onClick={handleClick}
        >
            <img
                ref={imageRef}
                src={currentImageUrl}
                alt={`Tutorial Step ${currentStep + 1}`}
                className={imageClass}
            />
        </div>
    );
};

export default TutorialOverLayScreen;