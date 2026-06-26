import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { introAssets } from "@/client/assets";
import { Page } from "@/client/store/useGameplayStore";

/**
 * Formats large numbers into a compact, abbreviated form.
 * e.g. 10421 -> "10.42K", 2_500_000 -> "2.50M"
 */
function formatCompactNumber(value: number): string {
    if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
    if (value >= 1e3) return (value / 1e3).toFixed(2) + "K";
    return value.toString();
}

const ChiBalanceModal = ({ handleChangeMenuPage, chiAmount }: {
    handleChangeMenuPage: (page: Page) => void;
    chiAmount: number;
}) => {

    //Assets
    const { assets } = useAssetLoader(introAssets)

    const [animatedChi, setAnimatedChi] = useState(0);
    const plusButtonRef = useRef<HTMLButtonElement>(null);


    useEffect(() => {
        // Animate the CHI counter from 0 up to the target chiAmount
        const tweenTarget = { value: 0 };

        gsap.to(tweenTarget, {
            value: chiAmount,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => {
                setAnimatedChi(Math.floor(tweenTarget.value));
            },
        });
    }, [chiAmount]); // Re-run animation whenever chiAmount updates

    return (
        <div className="absolute font-poppins top-4 lg:top-7 left-7 flex items-center z-50">
            <div className="flex items-center">
                {/* CHI Image */}
                <img
                    src={assets.chi}
                    alt="CHI"
                    className="w-14 shadow-md mr-[-0.8rem] z-[10] object-contain"
                />

                {/* CHI Value */}
                <span className="cxpBar text-white text-sm lg:text-xl font-bold bg-custom-blue border-b-4 border-blue-600 pl-5 pr-4 py-1 rounded-lg shadow-md">
                    {formatCompactNumber(animatedChi)}
                </span>

                {/* Plus Button */}
                <button
                    ref={plusButtonRef}
                    onClick={() => handleChangeMenuPage('shop')}
                    className="ml-2 bg-custom-blue flex items-center justify-center text-lg lg:text-2xl border-b-4 border-blue-600 w-6 h-6 lg:w-8 lg:h-8 text-white font-bold rounded-md cursor-pointer hover:bg-blue-600 transition"
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default ChiBalanceModal;