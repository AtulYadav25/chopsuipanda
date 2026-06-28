import { useEffect } from "react";
import StyledQRCode from "./StyledQRCode";
import desktopBg from '../assets/desktop/desktop_bg.png';
import desktopPanda from '../assets/desktop/desktop_panda.png';
import suiLogo from '../assets/desktop/suiLogo.svg'

const GLUTEN_FONT_HREF =
    "https://fonts.googleapis.com/css2?family=Gluten:wght@100..900&display=swap";
const GLUTEN_LINK_ID = "gluten-font-link";
const PHANTOM_DOWNLOAD_URL = "https://phantom.app/download";

interface DesktopFallbackProps {
    gameUrl?: string;
}

export default function DesktopFallback({
    gameUrl = "https://yourgame.app"
}: DesktopFallbackProps) {
    useEffect(() => {
        const existing = document.getElementById(GLUTEN_LINK_ID);
        let link: HTMLLinkElement | null = null;

        if (!existing) {
            link = document.createElement("link");
            link.id = GLUTEN_LINK_ID;
            link.rel = "stylesheet";
            link.href = GLUTEN_FONT_HREF;
            document.head.appendChild(link);
        }

        return () => {
            if (link) {
                link.remove();
            }
        };
    }, []);

    return (
        <div
            className="relative w-full min-h-screen overflow-hidden"
            style={{ fontFamily: '"Gluten", cursive' }}
        >
            <img
                src={desktopBg}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/30 via-transparent to-[#070B14]/30" />

            <div className="relative z-10 flex flex-col md:flex-row items-end md:items-center justify-center md:justify-between gap-10 max-w-6xl mx-auto px-6 md:px-10 min-h-screen py-12">
                <div className="flex-shrink-0 w-[80%] md:w-[40%] order-2 md:order-1 self-center md:self-end">
                    <img
                        src={desktopPanda}
                        alt="ChopSuiPanda mascot holding the Phantom wallet ghost"
                        className="w-full h-auto"
                    />
                </div>

                <div className="order-1 md:order-2 w-full md:max-w-xl md:flex-1">
                    <div className="rounded-2xl border-2 border-dashed border-[#298DFF]/40 bg-[#0B1220]/70 backdrop-blur-md p-6 md:p-9 shadow-[0_0_60px_rgba(41,141,255,0.12)]">
                        <p className="text-2xl md:text-3xl text-[#BFE6FF] mb-1 font-bold">
                            Welcome, fren!
                        </p>
                        <p className="text-sm md:text-lg mb-4">
                            <span className="font-bold" style={{ color: "#7FCFFF" }}>
                                Chop SUI Panda Game only runs on mobile.
                            </span>{" "}
                            <span className="text-[#7C93B5]">
                                You're on desktop right now.
                            </span>
                        </p>

                        {/* pointer to the steps below */}
                        <div className="flex items-center gap-2 mb-6 rounded-lg border border-[#298DFF]/25 bg-[#298DFF]/10 px-3 py-2">
                            <p className="text-[11px] md:text-[15px] text-[#BFE6FF] italic">
                                Grab your phone, scan the QR below, and follow these 3 steps.
                            </p>
                        </div>

                        {/* QR */}
                        {/* QR */}
                        <div className="flex items-center justify-center mb-5">
                            <div>
                                <div className="bg-white rounded-xl p-3">
                                    <StyledQRCode value={gameUrl} size={120} logoSrc={suiLogo} />
                                </div>
                                <p className="text-center text-[10px] mt-2 tracking-widest uppercase" style={{ color: "#7FCFFF" }}>
                                    Scan to enter
                                </p>
                            </div>
                        </div>

                        <ol className="space-y-4">
                            <li className="flex gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#298DFF]/15 border border-[#298DFF]/40 text-[#7FCFFF] text-sm shrink-0 mt-0.5">
                                    1
                                </span>
                                <div>
                                    <p className="text-md text-[#E6F1FB]">
                                        Install a wallet
                                    </p>
                                    <p className="text-sm text-[#7C93B5] mt-0.5 leading-relaxed">
                                        Get{" "}
                                        <a
                                            href={PHANTOM_DOWNLOAD_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold underline decoration-dashed underline-offset-2 transition-colors hover:text-[#E6F1FB]"
                                            style={{ color: "#AB9FF2" }}
                                        >
                                            Phantom
                                        </a>{" "}
                                        (or any Sui-compatible wallet) from your app store.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#298DFF]/15 border border-[#298DFF]/40 text-[#7FCFFF] text-sm shrink-0 mt-0.5">
                                    2
                                </span>
                                <div>
                                    <p className="text-md text-[#E6F1FB]">
                                        Open the game link
                                    </p>
                                    <p className="text-sm text-[#7C93B5] mt-0.5 leading-relaxed">
                                        Scan the QR above with your camera, or open it inside your wallet's browser tab.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#298DFF]/15 border border-[#298DFF]/40 text-[#7FCFFF] text-sm shrink-0 mt-0.5">
                                    3
                                </span>
                                <div>
                                    <p className="text-md text-[#E6F1FB]">
                                        Connect and play
                                    </p>
                                    <p className="text-sm text-[#7C93B5] mt-0.5 leading-relaxed">
                                        Tap connect wallet in-game, approve it, and you're in.
                                    </p>
                                </div>
                            </li>
                        </ol>

                        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#FAC775]/30 bg-[#FAC775]/10 px-3 py-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FAC775]" />
                            <span className="text-[11px] text-[#FAC775]">
                                Testnet only — no real funds, just vibes.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}