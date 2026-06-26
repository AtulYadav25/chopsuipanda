import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import GameModeSelector from "./GameModeSelector";
import SoundManager from "@/client/utils/SoundManager";
import { usePlayerStore } from "@/client/store/usePlayerStore";

const StartGameScreen = ({
    onClose, // Function to handle closing the alert (optional for name input)
    handleStartGame,
}: {
    onClose: () => void,
    handleStartGame: () => void,
}) => {

    const alertRef = useRef(null); // Reference for animation
    const bgRef = useRef(null); // Reference for animation
    const [showScreen, setShowScreen] = useState("gameSelector");


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

    //Store Data
    const player = usePlayerStore((s) => s.player);

    type ClosableEvent = React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>;
    const handleClose = (e: ClosableEvent | boolean, hasToStartGame?: boolean) => {
        if (typeof e !== 'boolean') e.preventDefault();
        // Animation when component unmounts
        // if (showScreen !== "Home") {
        //     setShowScreen("Home")
        //     return
        // }

        gsap.to(bgRef.current,
            {
                scale: 1.2, opacity: 0, duration: 0.3, ease: 'power2.out', onComplete: () => {
                    onClose();
                    console.log("Closing, ", hasToStartGame)
                    hasToStartGame && handleStartGame()
                }
            }
        );
    };

    const handleStartGameByClosingBox = async (e: ClosableEvent) => {
        SoundManager.play('menuSwitch');
        handleClose(e, true);
    }

    const itemRefs = useRef([]);

    useEffect(() => {
        itemRefs.current.forEach((itemRef) => {
            gsap.fromTo(
                itemRef,
                { backgroundPosition: '-100% 0' },
                { backgroundPosition: '100% 0', duration: 5, repeat: -1, ease: 'linear' }
            );
        });

        return () => {
            setShowScreen('gameSelector')
        }
    }, []);


    return (
        <>
            <button
                onClick={handleClose}
                className="absolute top-2 right-4 text-white hover:text-slate-300 text-2xl z-[108]"
            >
                &times;
            </button>




            <div className="bg-black/50 fixed inset-0 z-[101] w-full h-full" onClick={handleClose}></div>

            {showScreen === 'gameSelector' && <GameModeSelector onBack={() => onClose()} onNext={() => setShowScreen('Home')} />}
            {showScreen === "Home" &&
                <div onClick={handleClose} ref={bgRef} className={`fixed inset-0 flex justify-center items-center z-[105] `} >
                    <div onClick={(e) => e.stopPropagation()} ref={alertRef} className={`bg-slate-800 rounded-lg shadow-lg w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 p-6 relative `} >
                        <div>
                            <h2 className={`text-2xl font-bold mb-4 font-Game text-white text-center `}>
                                WELCOME FREN!
                            </h2>

                            <hr className="bg-blue-300 mb-4" />
                            <p className="text-sm font-Game text-slate-200 text-center mb-3">
                                IF YOU DON'T LIKE YOUR USERNAME, YOU CAN CHANGE IT BELOW:
                            </p>


                            <input
                                type="text"
                                className="w-full font-Game px-4 py-2 mb-3 text-white bg-blue-700 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none tracking-wider"
                                placeholder="Enter your name"
                                value={player?.username}
                                onChange={() => { }}
                            />


                            <div className="flex flex-col sm:flex-row gap-4 justify-center">

                                <button
                                    onClick={handleStartGameByClosingBox}
                                    className="game_btn font-Game bg-green-500 hover:bg-green-600 border-green-700 hover:border-blue-800"
                                >
                                    Play
                                </button>



                            </div>


                        </div>
                    </div>
                </div>
            }
        </>
    );
};

export default StartGameScreen;