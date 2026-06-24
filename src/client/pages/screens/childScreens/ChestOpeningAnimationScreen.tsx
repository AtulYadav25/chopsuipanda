import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SoundManager from '@/client/utils/SoundManager';
import { ChestReward, ChestType } from '@/shared/constants/ChestConfig';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { introAssets } from '@/client/assets';


const ChestOpeningAnimation = ({ isOpen, onClose, currentChestType, chestCount = 1, preSelectedRewards = [] }: {
    isOpen: boolean;
    onClose: () => void;
    currentChestType: ChestType | null;
    chestCount: number;
    preSelectedRewards: ChestReward[]
}) => {
    const containerRef = useRef(null);
    const chestRef = useRef(null);
    const backgroundRef = useRef(null);
    const textRef = useRef(null);
    const rewardsContainerRef = useRef(null);

    //Asset Laoder
    const { assets } = useAssetLoader(introAssets);

    const [showClaimButton, setShowClaimButton] = useState(false);
    const [chestImage, setChestImage] = useState(assets.closedChest);
    const [showRewards, setShowRewards] = useState(false);



    //Need to add a share button to allow players share their rewards on social media

    useEffect(() => {
        if (isOpen) {
            setChestImage(assets.closedChest);
            setShowClaimButton(false);
            setShowRewards(false);
            SoundManager.stopAll()

            const tl = gsap.timeline();

            gsap.set(containerRef.current, { display: 'flex' });
            gsap.set(chestRef.current, { y: -500, scale: 1, rotation: 0 });
            gsap.set(backgroundRef.current, { scaleY: 0, transformOrigin: 'bottom' });
            gsap.set(textRef.current, { opacity: 0, y: 20 });
            gsap.set(rewardsContainerRef.current, { opacity: 0 });

            tl.to(backgroundRef.current, {
                scaleY: 1,
                duration: 0.8,
                ease: "power2.inOut"
            })
                .to(chestRef.current, {
                    y: 0,
                    duration: 1.2,
                    ease: "bounce.out"
                })
                .to(chestRef.current, {
                    rotation: 8,
                    duration: 0.08,
                    repeat: -1,
                    yoyo: true,
                    ease: "none"
                })
                .to(textRef.current, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5
                });
        }

        return () => {
            gsap.killTweensOf([
                containerRef.current,
                chestRef.current,
                backgroundRef.current,
                textRef.current,
                rewardsContainerRef.current
            ]);
        };
    }, [isOpen]);

    const handleChestClick = () => {
        SoundManager.play('chestOpen');
        gsap.killTweensOf(chestRef.current);
        gsap.set(chestRef.current, { rotation: 0 });
        setChestImage(assets.chest);
        setShowRewards(true);

        const tl = gsap.timeline({
            onComplete: () => {
                setShowClaimButton(true);
            }
        });

        tl.to(chestRef.current, {
            scale: 1.2,
            duration: 0.3,
            ease: "back.out"
        })
            .to(chestRef.current, {
                scale: 1,
                duration: 0.2
            })
            .to(textRef.current, {
                opacity: 0,
                y: 30,
                duration: 0.3
            }, "-=0.2")
            .to(rewardsContainerRef.current, {
                opacity: 1,
                duration: 0.5
            })
            .to(".reward-item", {
                opacity: 1,
                scale: 1,
                stagger: 0.2,
                duration: 0.5,
                ease: "back.out(1.7)"
            });
    };

    const handleClaim = () => {
        SoundManager.resumeBGMIfWasPlaying();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[20000] flex flex-col items-center justify-center"
            style={{ perspective: "1000px" }}
        >
            <div
                ref={backgroundRef}
                className="absolute inset-0 bg-gradient-to-t from-[#fba900] to-[#ffd166]"
            />

            <div className="relative z-10 flex flex-col items-center">
                <img
                    ref={chestRef}
                    src={chestImage}
                    alt="Chest"
                    className="w-48 h-48 object-contain cursor-pointer"
                    onClick={handleChestClick}
                />

                <p
                    ref={textRef}
                    className="mt-6 text-2xl font-Game text-white text-center drop-shadow-lg"
                >
                    Touch to open {chestCount} {chestCount > 1 ? 'chests' : 'chest'}
                </p>

                <div
                    ref={rewardsContainerRef}
                    style={{ top: `-${preSelectedRewards.length * 11}%` }}
                    className={`absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 ${!showRewards ? 'opacity-0 hidden' : 'opacity-100'}`}
                >
                    {preSelectedRewards.map((reward, index) => (
                        <div
                            key={index}
                            className="reward-item bg-black/50 rounded-xl p-4 backdrop-blur-sm opacity-0 scale-95 transform"
                        >
                            <div className="flex items-center justify-center gap-4 px-3">
                                <img
                                    src={currentChestType === ChestType.TREASURE ? assets.chi : assets.sui}
                                    alt="Reward"
                                    className="w-12 h-12 object-contain"
                                />
                                <div className="text-white font-Game text-2xl whitespace-nowrap">
                                    +<span className="text-[#ffd166]">{reward.amount.toLocaleString()} {reward.type}</span>
                                </div>
                            </div>
                        </div>

                    ))}
                </div>

                {showClaimButton && (
                    <button
                        onClick={handleClaim}
                        className="mt-6 px-8 py-3 bg-[#ffd166] text-[#2a1503] rounded-full font-Game text-xl hover:bg-[#fba900] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                        CLAIM REWARDS
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChestOpeningAnimation;
