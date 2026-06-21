import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { notificationAssets } from "../assets";
import { useAssetLoader } from "../assets/useAssetLoader";

const GameNotification = ({ message, type }: {
    message: string,
    type: 'battleChallenge' | 'friendRequest'
}) => {
    const notificationRef = useRef(null);
    const { assets, ready } = useAssetLoader(notificationAssets);

    useEffect(() => {
        if (!ready) return;

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
    }, [ready]);

    if (!ready) return null;

    return (
        <div
            ref={notificationRef}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md bg-blue-200 text-white rounded-lg flex p-4 items-center gap-4 z-[1000] shadow-lg"
        >
            {type === 'battleChallenge' && (
                <img src={assets.challengeNotification} alt="Notification" className="w-12 h-12" />
            )}
            {type === 'friendRequest' && (
                <img src={assets.pandaHead} alt="Notification" className="w-12 h-12" />
            )}
            <div className="flex-1">
                <p className="font-Game text-xs text-black">{message}</p>
            </div>
        </div>
    );
};

export default GameNotification;
