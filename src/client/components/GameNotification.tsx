import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { notificationAssets } from "../assets";
import { useAssetLoader } from "../assets/useAssetLoader";
import { useNotificationStore } from "../store/useNotificationStore";
import { useGameplayStore } from "../store/useGameplayStore";

const GameNotification = () => {
    const notificationRef = useRef(null);
    const { assets, ready } = useAssetLoader(notificationAssets);

    const current = useNotificationStore((s) => s.current);
    const dismissCurrent = useNotificationStore((s) => s.dismissCurrent);
    const isPlaying = useGameplayStore((s) => s.isPlaying);

    // When gameplay ends, drain anything that queued up while suppressed.
    useEffect(() => {
        if (!isPlaying) {
            useNotificationStore.getState().flushQueue();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!ready || !current || isPlaying) return;

        gsap.fromTo(
            notificationRef.current,
            { y: -100, opacity: 0 },
            { y: 10, opacity: 1, duration: 1, ease: "easeOut" }
        );

        return () => {
            gsap.to(notificationRef.current, {
                y: -100,
                opacity: 0,
                duration: 1,
                ease: "easeIn",
            });
        };
    }, [ready, current, isPlaying]);

    // Suppressed mid-game, not ready yet, or nothing to show — render nothing.
    if (!ready || !current || isPlaying) return null;

    const { message, type } = current;

    return (
        <div
            ref={notificationRef}
            onClick={dismissCurrent}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md bg-blue-200 text-white rounded-lg flex p-4 items-center gap-4 z-[1000] shadow-lg cursor-pointer"
        >
            {type.includes('battle') && (
                <img src={assets.challengeNotification} alt="Notification" className="w-12 h-12" />
            )}
            {type.includes('friend') && (
                <img src={assets.pandaHead} alt="Notification" className="w-12 h-12" />
            )}
            <div className="flex-1">
                <p className="font-Game text-xs text-black">{message}</p>
            </div>
        </div>
    );
};

export default GameNotification;