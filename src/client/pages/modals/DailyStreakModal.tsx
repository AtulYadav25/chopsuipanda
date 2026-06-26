import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

//Constanst And Schema Imports
import { getRewardsForClientUI, isStreakMissed } from "@/shared/constants/DailyLoginRewards";
import { usePlayerStore } from "@/client/store/usePlayerStore";
import { useToast } from "@/client/context/ToastContext";
import { useContinueDailyStreak, useRefreshPlayerProfile } from "@/client/hooks/player";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { introAssets } from "@/client/assets";

// Register GSAP Draggable plugin
gsap.registerPlugin(Draggable);

const formatReward = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    return value.toString();
};

const DailyStreakModal = ({
    showPanel,
    handlePanelClose
}: {
    showPanel: string
    handlePanelClose: () => void
}) => {
    const modalRef = useRef(null);
    const headerRef = useRef<HTMLDivElement>(null); // New ref for the draggable header
    const preventDefaultTouchRef = useRef<{ touch?: (e: TouchEvent) => void; move?: (e: TouchEvent) => void }>({});
    const continueBtnRef = useRef<HTMLButtonElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const greetHeadingRef = useRef<HTMLHeadingElement>(null);
    const greetImageRef = useRef<HTMLImageElement>(null);
    const smallPandaRef = useRef<HTMLImageElement>(null);
    const [showOverlay, setShowOverlay] = useState<boolean>(true);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    //Image Assets Loader
    const { assets } = useAssetLoader(introAssets)

    //Store Data
    const player = usePlayerStore((s) => s.player);

    useEffect(() => {
        console.log(player)
    }, [player])

    if (!player) return;

    const rewardsData = getRewardsForClientUI(player?.dailyStreak.currentStreak || 1);
    const lastLoginMissed = isStreakMissed(player?.dailyStreak.lastLogin);
    const currentDay = player!.dailyStreak.currentStreak

    //Toast 
    const { showToast } = useToast();

    // Mutations & Queries
    const { mutateAsync: continueDailyStreak, isSuccess: continueStreakSuccess } = useContinueDailyStreak();
    const { refetch: refreshPlayerProfile } = useRefreshPlayerProfile();

    useEffect(() => {
        if (showPanel === "DAILY_STREAK" && modalRef.current && headerRef.current) {
            // Initial modal animation
            gsap.fromTo(
                modalRef.current,
                { y: 100, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
            );

            // Greet image animation
            if (greetImageRef.current) {
                gsap.fromTo(
                    greetImageRef.current,
                    { scale: 0.0 },
                    { scale: 1.05, duration: 2, ease: "back.out(1.7)" }
                );
            }

            // Shake the text
            if (greetHeadingRef.current) {
                gsap.fromTo(
                    greetHeadingRef.current,
                    { x: -5 },
                    {
                        x: 5,
                        duration: 0.1,
                        ease: "power1.inOut",
                        repeat: 3,
                        yoyo: true,
                    }
                );
            }

            // Continue button animation if streak is broken
            if (continueBtnRef.current && lastLoginMissed) {
                gsap.to(continueBtnRef.current, {
                    y: 2,
                    repeat: -1,
                    yoyo: true,
                    duration: 0.2,
                    ease: "power1.inOut",
                });
            }

            // Set up Draggable for touch-based dragging on the header
            const modalElement = modalRef.current;
            // In your useEffect, modify the Draggable setup:
            const draggableInstance = Draggable.create(modalElement, {
                trigger: headerRef.current,
                type: "y",
                bounds: { minY: 0, maxY: 300 },
                edgeResistance: 0.8,
                // Add this to exclude the back button from dragging
                dragClickables: false, // Prevents dragging from clickable elements
                onPress: function (e) {
                    // Check if the clicked element is the back button or its children
                    const backButton = headerRef.current?.querySelector('button');
                    if (backButton && (backButton.contains(e.target) || backButton === e.target)) {
                        this.disable(); // Temporarily disable dragging
                        setTimeout(() => this.enable(), 100); // Re-enable after a short delay
                        return false;
                    }
                },
                onDragStart: function () {
                    setIsDragging(true);
                },
                onDragEnd: function () {
                    setIsDragging(false);
                    if (this.y > 200) {
                        gsap.to(modalElement, {
                            y: 500,
                            opacity: 0,
                            duration: 0.3,
                            ease: "power2.in",
                            onComplete: () => handlePanelClose(),
                        });
                    } else {
                        gsap.to(modalElement, {
                            y: 0,
                            duration: 0.3,
                            ease: "power2.out",
                        });
                    }
                },
            })[0];

            // Set touch-action to none only for the header
            // headerRef.current.style.touchAction = "none";

            // Prevent default touch behaviors that might interfere
            const preventDefaultTouch = (e: TouchEvent) => {
                e.preventDefault();
            };

            const preventDefaultTouchMove = (e: TouchEvent) => {
                if (isDragging) {
                    e.preventDefault();
                }
            };

            headerRef.current?.addEventListener('touchstart', preventDefaultTouch, { passive: false });
            headerRef.current?.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });

            // Store the event listeners for cleanup
            preventDefaultTouchRef.current.touch = preventDefaultTouch;
            preventDefaultTouchRef.current.move = preventDefaultTouchMove;
        }

        // Cleanup Draggable on unmount
        return () => {
            if (modalRef.current) {
                Draggable.get(modalRef.current)?.kill();
            }
            if (headerRef.current) {
                headerRef.current.style.touchAction = "auto";
                if (preventDefaultTouchRef.current.touch) {
                    headerRef.current.removeEventListener('touchstart', preventDefaultTouchRef.current.touch);
                    headerRef.current.removeEventListener('touchmove', preventDefaultTouchRef.current.move!);
                }
            }
        };
    }, [showPanel, lastLoginMissed]);

    useEffect(() => {
        if (showOverlay && overlayRef.current) {
            gsap.fromTo(
                overlayRef.current,
                { opacity: 0, y: -50 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
            );
        }
    }, [showOverlay]);

    const handleOverlayClick = () => {
        if (!greetImageRef.current || !smallPandaRef.current) return;

        const source = greetImageRef.current.getBoundingClientRect();
        const target = smallPandaRef.current.getBoundingClientRect();

        const deltaX = target.left + target.width / 2 - (source.left + source.width / 2);
        const deltaY = target.top + target.height / 2 - (source.top + source.height / 2);
        const scale = target.width / source.width;

        gsap.to(greetImageRef.current, {
            x: deltaX,
            y: deltaY,
            scale: scale,
            opacity: 0,
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
                setShowOverlay(false);
            },
        });

        gsap.to(overlayRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: "power1.inOut",
        });
    };

    const handleContinueStreak = async () => {
        try {
            const data = await continueDailyStreak({});

            if (continueStreakSuccess) {
                showToast({ type: "success", message: "Continue Streak Successful!" });
                await refreshPlayerProfile();
            } else {
                showToast({ type: "error", message: data.message || "Something went wrong." });
            }
        } catch (error) {
            showToast({ type: "error", message: "Failed to continue streak" });
        }
    };

    const renderRewardBoxes = () => {
        if (rewardsData.length === 1) {
            return (
                <div
                    className="reward-box bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-between transition-transform hover:scale-105"
                >
                    <h3 className="text-xl md:text-3xl text-slate-900 z-11 text-center">Daily Login Reward</h3>
                    <img
                        src={assets.chi}
                        alt={rewardsData[0].rewardType}
                        className="w-16 h-16 object-contain my-2 z-11"
                    />
                    <p className="bg-blue-600/90 z-11 mt-1 text-white px-2 py-1 rounded-full text-base">
                        {formatReward(rewardsData[0].reward)} {rewardsData[0].rewardType}
                    </p>
                    <div className="shine absolute inset-0 z-10 rounded-xl"></div>
                </div>
            );
        }

        return rewardsData.map((reward, index) => {
            const isClaimed = reward.day < player!.dailyStreak.currentStreak || (reward.day === player!.dailyStreak.currentStreak);
            return (
                <div
                    key={index}
                    className={`reward-box bg-blue-100 rounded-xl p-4 flex flex-col items-center border-2 border-blue-700 justify-between transition-transform hover:scale-105 
            ${isClaimed ? "border-dashed !border-blue-500" : ""}`}
                >
                    <h3 className="text-3xl md:text-3xl text-slate-900 z-11">Day {reward.day}</h3>
                    <img
                        src={assets.chi}
                        alt={reward.rewardType}
                        className="w-16 h-16 object-contain my-2 z-11"
                    />
                    <p className={`${isClaimed ? 'bg-blue-600/50' : 'bg-blue-600/90'} z-11 mt-1 text-white px-2 py-1 rounded-full text-base`}>
                        {formatReward(reward.reward)} {reward.rewardType}
                    </p>
                    <div className="shine absolute inset-0 z-10 rounded-xl"></div>
                </div>
            );
        });
    };

    const pandaImg = lastLoginMissed ? assets.sadPanda : assets.happyPanda;
    const continueAmount = (Math.floor(player!.dailyStreak.currentStreak / 4) + 1) * 5000;

    return (
        showPanel === "DAILY_STREAK" && (
            <div
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        handlePanelClose()
                    }
                }}

                className="font-Game fixed inset-0 bg-black/40 backdrop-blur z-[200] flex items-center justify-center ios-touch-fix"
            >
                {showOverlay && (
                    <div
                        ref={overlayRef}
                        onClick={handleOverlayClick}
                        className="absolute w-full h-full top-0 inset-0 z-[2002] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
                    >
                        <div className="text-center px-4">
                            <h2 className="text-xl text-white mb-4" ref={greetHeadingRef}>
                                {lastLoginMissed ? `You lost your ${currentDay}-day streak!` :
                                    `Congrats! You're on a ${currentDay}-day streak!`}
                            </h2>
                            <img
                                src={lastLoginMissed ? assets.sadPanda : assets.happyPanda}
                                alt="Panda"
                                ref={greetImageRef}
                                className="w-30 h-30 object-contain mx-auto"
                            />
                            {!lastLoginMissed && <p className="text-xl mt-5 !text-white bg-blue-500 p-2 rounded-md">CHI Rewarded!</p>}
                            <p className="text-sm text-white mt-2">Tap anywhere to continue</p>
                        </div>
                    </div>
                )}
                <div
                    ref={modalRef}
                    className="z-[2000]  user-select-none h-auto max-h-[80%] w-[90vw] max-w-[550px] bg-white rounded-2xl shadow-xl px-5 py-4 flex flex-col overflow-hidden ios-touch-fix"
                >
                    <div className="z-[4000] flex justify-between items-center w-[100%] mb-4">
                        {/* Dedicated drag handle */}
                        <div
                            ref={headerRef}
                            className="flex-1 mt-3 touch-none select-none ios-touch-fix flex items-center"
                        >
                            <h2 className="text-xl z-[100001] text-blue-800">Daily Rewards</h2>
                            {/* Optional: Add a drag indicator */}
                            <div className="ml-2 w-12 absolute top-4 left-1/2 transform translate-x-[-50%] h-1 bg-gray-300/70 rounded-full"></div>
                        </div>

                        {/* Back button outside the draggable area */}
                        <button
                            className="text-blue-500 z-[10000] font-semibold text-sm px-4 py-3 -mr-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePanelClose();
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePanelClose();
                            }}
                        >
                            Back
                        </button>
                    </div>
                    <div className="flex items-center gap-4 mb-4 px-2 z-[3000]">
                        <div ref={smallPandaRef} className="w-20 h-20 bg-blue-600 relative rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                            <img src={pandaImg} alt="Panda" style={{ transform: 'scale(1.2)', transformOrigin: 'center' }} className="w-full absolute bottom-[-10px] left-0 object-cover" />
                        </div>
                        <div className="flex flex-col flex-1">
                            {!lastLoginMissed ? (
                                <p className="text-base text-gray-700 font-medium">
                                    You're on a <span className="text-blue-500">{currentDay}-day</span> streak!
                                </p>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-700 mb-1">
                                        Continue your streak by paying {formatReward(continueAmount)} CHI
                                    </p>
                                    <button
                                        ref={continueBtnRef}
                                        className="z-[10000] bg-blue-800 hover:bg-blue-900 text-white text-sm font-bold py-2 px-4 rounded w-fit shadow touch-manipulation min-h-[44px]"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleContinueStreak();
                                        }}

                                        onTouchEnd={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleContinueStreak();
                                        }}
                                    >
                                        Continue
                                    </button>

                                </>
                            )}
                        </div>
                    </div>
                    <div className="max-h-[60%] w-[100%] overflow-y-auto font-Game pb-0 touch-auto">
                        <div className={`grid p-2 w-full gap-3 ${rewardsData.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {renderRewardBoxes()}
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default DailyStreakModal;