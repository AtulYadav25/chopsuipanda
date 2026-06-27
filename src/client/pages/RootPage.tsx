import { lazy, useEffect, useMemo, useState } from "react";
import { coreAssets, homeAssets, introAssets, menuIconAssets } from "../assets";
import { useAssetLoader } from "../assets/useAssetLoader";
import BottomNavBar from "../components/BottomNavbar";
import MobileGameContainer from "../components/MobileGameContainer";
import { useToast } from "../context/ToastContext";
import { useRefreshPlayerProfile } from "../hooks/player";
import { Page, useGameplayStore } from "../store/useGameplayStore";
import SoundManager from "../utils/SoundManager";
import BattleFrenGame from "./screens/BattleScreens/BattleFrenGame";
import PandaLoadingScreen from "./screens/childScreens/PandaLoadingScreen";
import EarnScreen from "./screens/EarnScreen";
import FrensScreen from "./screens/FrensScreen";
import HomeScreen from "./screens/HomeScreen";
import LeaderBoardScreen from "./screens/LeaderboardScreen";
import ShopScreen from "./screens/ShopScreen";
import PlayGameWrapper from "./screens/PlayGameWrapper";
import gsap from "gsap";
import ChiBalanceModal from "./modals/ChiBalanceModal";
import { usePlayerStore } from "../store/usePlayerStore";
const OnboardPlayerScreen = lazy(() => import('./screens/childScreens/OnboardPlayer'));

function RootPage() {

    const [showOnboardPlayer, setShowOnboardPlayer] = useState(true);

    const page = useGameplayStore((s) => s.page);
    const setPage = useGameplayStore((s) => s.setPage);
    const player = usePlayerStore((s) => s.player)


    const allAssets = useMemo(
        () => ({
            ...homeAssets,
            ...menuIconAssets,
            ...coreAssets,
            ...introAssets,
        }),
        []
    );

    const { assets, ready } = useAssetLoader(allAssets);
    // Use Toast Context
    const { showToast } = useToast();

    //Mutations & Queries
    const { isLoading: isLoadingPlayerProfile, refetch: refreshPlayerProfile } = useRefreshPlayerProfile();

    // TODO : Add Loading Screen and make it wait untill everything is ready (assets, sounds, authenticated player)

    const showConnectWallet = (): void => {
        setPage('home');
        showToast({ type: 'info', message: 'Please Connect Wallet' })
    }

    //Navbar Helpers
    const handleChangeMenuPage = (page: Page) => {
        if (page === 'game') {
            return
        }
        setPage(page);
        SoundManager.play('menuSwitch');

        // Define the shift distance
        const SHIFT_AMOUNT = 20; // pixels to shift

        // Get all menu items
        const menuItems = ['shop', 'frens', 'home', 'earn', 'leaderboard'];
        const selectedIndex = menuItems.indexOf(page);

        // Reset and move all menu items
        menuItems.forEach((item, index) => {
            let xMove = 0;

            // If item is before selected item, move left
            if (index < selectedIndex) {
                xMove = -SHIFT_AMOUNT;
            }
            // If item is after selected item, move right
            else if (index > selectedIndex) {
                xMove = SHIFT_AMOUNT;
            }

            gsap.to(`#menu-${item}`, {
                scale: 0.8,
                x: xMove,
                duration: 0.1,
                ease: "linear"
            });
        });

        // Animate the selected menu item
        gsap.to(`#menu-${page}`, {
            scale: 1.4,
            x: 0, // ensure selected item stays centered
            duration: 0.2,
            ease: "bounce.out"
        });
    };

    useEffect(() => {
        SoundManager.loadGroup('Global')

        return () => {
            SoundManager.unloadGroup('Global')
        }
    }, [])


    const handleEndGame = () => {
        setPage('home');
        refreshPlayerProfile();
        handleChangeMenuPage('home');
    }

    const hiddenOnPages = ['game', 'chestOpen', 'battleFren', 'tutorial']

    return (
        <MobileGameContainer>
            <>
                {(player?.createdAt === player?.updatedAt) && showOnboardPlayer && <OnboardPlayerScreen onClose={() => setShowOnboardPlayer(false)} />}
                {!hiddenOnPages.includes(page) && player && <ChiBalanceModal chiAmount={player?.chi} handleChangeMenuPage={handleChangeMenuPage} />}
                <PandaLoadingScreen ready={ready && !isLoadingPlayerProfile} />
                {page === 'home' && <HomeScreen />}
                {page === 'earn' && <EarnScreen showConnectWallet={showConnectWallet} />}
                {page === 'frens' && <FrensScreen changePage={handleChangeMenuPage} />}
                {page === 'shop' && <ShopScreen showConnectWallet={showConnectWallet} />}
                {page === 'leaderboard' && <LeaderBoardScreen />}
                {page === 'battleFren' && <BattleFrenGame handleEndGame={handleEndGame} />}
                {page === 'game' && <PlayGameWrapper handleEndGame={handleEndGame} />}
                <BottomNavBar assets={assets} ready={ready} handleChangeMenuPage={handleChangeMenuPage} />
            </>
        </MobileGameContainer>
    );
}

export default RootPage;