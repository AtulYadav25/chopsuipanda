import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { useAssetLoader } from "@/client/assets/useAssetLoader.js";
import { coreAssets } from "@/client/assets/index.js";

const SimpleLoadingScreen = ({ loading, noAnimation = false }: {
    loading: boolean;
    noAnimation: boolean;
}) => {

    //Image Asset loader
    const { assets } = useAssetLoader(coreAssets);

    const [hide, setHide] = useState(false);
    const containerRef = useRef(null);
    const pandaRef = useRef<HTMLImageElement>(null);
    const circleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (noAnimation) {
            // Skip animation: apply final styles directly
            if (pandaRef.current) {
                pandaRef.current.style.transform = "translateY(-50px)";
            }
            if (circleRef.current) {
                circleRef.current.style.backgroundPosition = "-200% 0";
            }
            return; // Do not run animations
        }

        const ctx = gsap.context(() => {
            if (loading) {
                // Animate panda
                gsap.to(pandaRef.current, {
                    y: -50,
                    duration: 1.5,
                    ease: "power2.out",
                });

                // Animate background
                gsap.to(circleRef.current, {
                    backgroundPosition: "-200% 0",
                    duration: 2,
                    repeat: -1,
                    ease: "linear",
                });
            } else {
                setTimeout(() => {
                    containerRef && gsap.to(containerRef.current, {
                        height: 0,
                        duration: 1.2,
                        ease: "power2.inOut",
                        onComplete: () => setHide(true),
                    });

                    circleRef && gsap.to(circleRef.current, {
                        opacity: 0,
                        duration: 0.8,
                        ease: "power2.out",
                    });
                }, 500);
            }
        }, containerRef);

        return () => ctx.revert();
    }, [loading, noAnimation]);

    if (hide) return null;

    return (
        <div
            ref={containerRef}
            className="loading-container flex items-center justify-center fixed top-0 left-0 w-full h-screen bg-slate-800 z-[100]"
        >
            {loading && (
                <div
                    ref={circleRef}
                    className="circle relative w-36 h-36 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                        background: "linear-gradient(90deg, #1e5dfe, #0da6fe, #1e5dfe)",
                        backgroundSize: "200% 100%",
                    }}
                >
                    <img
                        ref={pandaRef}
                        src={assets.panda}
                        alt="Chop-SUI Panda"
                        className="panda absolute bottom-[-80px] w-full"
                    />
                </div>
            )}
        </div>
    );
};

export default SimpleLoadingScreen;
