import MobileGameContainer from "../components/MobileGameContainer";
import { ToastProvider, useToast } from "../context/ToastContext";
import { Page, useGameplayStore } from "../store/useGameplayStore";
import SoundManager from "../utils/SoundManager";
import EarnScreen from "./screens/EarnScreen";
import FrensScreen from "./screens/FrensScreen";
import HomeScreen from "./screens/HomeScreen";
import LeaderBoardScreen from "./screens/LeaderboardScreen";
import ShopScreen from "./screens/ShopScreen";

function RootPage() {

    const page = useGameplayStore((s) => s.page);
    const setPage = useGameplayStore((s) => s.setPage);

    // Use Toast Context
    const { showToast } = useToast();

    // TODO : Add Loading Screen and make it wait untill everything is ready (assets, sounds, authenticated player)

    const showConnectWallet = () => {
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

    return (
        <MobileGameContainer>
            <ToastProvider>
                {page === 'home' && <HomeScreen />}
                {page === 'earn' && <EarnScreen showConnectWallet={showConnectWallet} />}
                {page === 'frens' && <FrensScreen changePage={handleChangeMenuPage} />}
                {page === 'shop' && <ShopScreen showConnectWallet={showConnectWallet} />}
                {page === 'leaderboard' && <LeaderBoardScreen />}
            </ToastProvider>
        </MobileGameContainer>
    );
}

export default RootPage;