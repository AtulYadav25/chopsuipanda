import { useEffect } from "react";
import { Page, useGameplayStore } from "../store/useGameplayStore";
import { useCurrentAccount } from "@mysten/dapp-kit-react";


const hiddenOnPages = ['game', 'chestOpen', 'battleFren', 'tutorial']

const BottomNavBar = ({ assets, ready, handleChangeMenuPage }: {
    assets: any;
    ready: boolean;
    handleChangeMenuPage: (page: Page) => void;
}) => {
    const page = useGameplayStore((s) => s.page);
    const isPlaying = useGameplayStore((s) => s.isPlaying);
    const showConnectWallet = useGameplayStore((s) => s.showConnectWallet);

    const account = useCurrentAccount();

    if (isPlaying || hiddenOnPages.includes(page) || !ready) {
        return null;
    }

    return (
        <div className="bottombar fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[100%] h-[100px] mb-0 z-[100]">
            <div className="w-full h-full pointer-events-none relative">
                <img
                    src={assets.navbarBackground}
                    alt="Navigation Background"
                    className="absolute bottom-[-10px] w-full h-full object-cover"
                />
                <div className="pointer-events-auto m-auto flex w-[95%] justify-between items-center h-full absolute inset-0 px-[3%] py-[2%]">
                    <img
                        id="menu-shop"
                        onClick={() => handleChangeMenuPage('shop')}
                        src={assets.shop}
                        alt="Menu Item 1"
                        className="menu-item w-[18%] h-[80%] object-contain transition-all cursor-pointer transform"
                        style={{ transformOrigin: 'center' }}
                    />
                    <img
                        id="menu-frens"
                        onClick={() => {
                            if (!account?.address) {
                                showConnectWallet();
                                return;
                            }
                            handleChangeMenuPage('frens');
                        }}
                        src={assets.frens}
                        alt="Menu Item 2"
                        className="menu-item w-[19%] h-[80%] object-contain transition-all cursor-pointer transform"
                        style={{ transformOrigin: 'center' }}
                    />
                    <img
                        id="menu-home"
                        onClick={() => handleChangeMenuPage('home')}
                        src={assets.play}
                        alt="Menu Item 3"
                        className="menu-item w-[18%] h-[80%] object-contain transition-all cursor-pointer transform"
                        style={{ transformOrigin: 'center' }}
                    />
                    <img
                        id="menu-earn"
                        onClick={() => handleChangeMenuPage('earn')}
                        src={assets.earn}
                        alt="Menu Item 4"
                        className="menu-item w-[19%] h-[80%] object-contain transition-all cursor-pointer transform"
                        style={{ transformOrigin: 'center' }}
                    />
                    <img
                        id="menu-leaderboard"
                        onClick={() => handleChangeMenuPage('leaderboard')}
                        src={assets.leaderboard}
                        alt="Menu Item 5"
                        className="menu-item w-[23%] h-[80%] object-contain transition-all cursor-pointer transform"
                        style={{ transformOrigin: 'center' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default BottomNavBar;

// NOTE: `menuItems`, `account`, and `showConnectWallet` were referenced in
// your original snippet but not defined in what you pasted — they're kept
// as-is here (presumably imports/context from your actual file). Wire your
// real imports back in; nothing about their usage changed.