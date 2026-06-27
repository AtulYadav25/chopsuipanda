import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { z } from "zod";
import SoundManager from "@/client/utils/SoundManager";
import { useToast } from "@/client/context/ToastContext";
import { useOnboardPlayer, useRefreshPlayerProfile } from "@/client/hooks/player";

const usernameSchema = z
    .string()
    .min(3)
    .max(25)
    .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
    );

const OnboardPlayerScreen = ({
    onClose, // Function to handle closing the alert
}: {
    onClose: () => void,
}) => {

    const alertRef = useRef(null); // Reference for animation
    const bgRef = useRef(null); // Reference for animation

    const [username, setUsername] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showToast } = useToast();
    const { mutateAsync: onboardPlayer } = useOnboardPlayer();
    const { refetch: refreshPlayerProfile } = useRefreshPlayerProfile();

    useEffect(() => {
        alertRef.current && gsap.fromTo(
            alertRef.current,
            { scale: 0.9 }, // Start from scale 0
            {
                scale: 1, // Scale up
                duration: 0.2,
                ease: "power1.inOut",
                onComplete: () => {
                    gsap.to(alertRef.current, { scale: 1, duration: 0.1 }); // Normalize scale
                }
            }
        );
    }, []);

    type ClosableEvent = React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>;
    const handleClose = (e: ClosableEvent) => {
        e.preventDefault();

        gsap.to(bgRef.current,
            {
                scale: 1.2, opacity: 0, duration: 0.3, ease: 'power2.out', onComplete: () => {
                    onClose();
                }
            }
        );
    };

    const shakeInvalidInput = () => {
        if (!alertRef.current) return;
        gsap.fromTo(
            alertRef.current,
            { x: -8 },
            { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
        );
    };

    const handleSubmit = async (e: ClosableEvent) => {
        e.preventDefault();

        const trimmed = username.trim();

        const result = usernameSchema.safeParse(trimmed);
        if (!result.success) {
            const firstIssue = result.error.issues[0];
            let message = firstIssue?.message ?? "Invalid username";

            if (firstIssue?.code === "too_small") {
                message = "Username must be at least 3 characters";
            } else if (firstIssue?.code === "too_big") {
                message = "Username can be at most 25 characters";
            }

            showToast({ type: 'error', message });
            shakeInvalidInput();
            return;
        }

        try {
            setIsSubmitting(true);
            SoundManager.play('menuSwitch');

            await onboardPlayer({ username: trimmed }, {
                onSuccess: () => {
                    showToast({ type: 'success', message: 'Welcome to the bamboo grove!' });
                    refreshPlayerProfile();
                    handleClose(e);
                }
            });

        } catch (error: any) {
            const message =
                error?.message ?? "That username is already taken. Try another one!";

            showToast({ type: 'error', message });
            shakeInvalidInput();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="bg-black/50 fixed inset-0 z-[101] w-full h-full"></div>

            <div ref={bgRef} className="fixed inset-0 flex justify-center items-center z-[105]">
                <div
                    onClick={(e) => e.stopPropagation()}
                    ref={alertRef}
                    className="bg-slate-800 rounded-lg shadow-lg w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 p-6 relative"
                >
                    <div>
                        <h2 className="text-2xl font-Game text-white text-center mb-4">
                            Welcome, Fren!
                        </h2>

                        <hr className="bg-blue-300 mb-4" />

                        <input
                            type="text"
                            className="w-full font-Game px-4 py-2 mb-2 text-white bg-blue-700 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none tracking-wider disabled:opacity-60"
                            placeholder="Enter your panda name"
                            value={username}
                            maxLength={25}
                            disabled={isSubmitting}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <p className="text-xs font-Game text-slate-400 text-center mb-4">
                            No changing this later, choose wisely 🎋
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || username.trim().length === 0}
                                className="game_btn font-Game bg-green-500 hover:bg-green-600 border-green-700 hover:border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "..." : "START CHOPPING"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OnboardPlayerScreen;