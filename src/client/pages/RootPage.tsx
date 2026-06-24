import MobileGameContainer from "../components/MobileGameContainer";
import { ToastProvider, useToast } from "../context/ToastContext";
import { useGameplayStore } from "../store/useGameplayStore";
import EarnScreen from "./screens/EarnScreen";
import HomeScreen from "./screens/HomeScreen";

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

    return (
        <MobileGameContainer>
            <ToastProvider>
                {page === 'home' && <HomeScreen />}
                {page === 'earn' && <EarnScreen showConnectWallet={showConnectWallet} />}
            </ToastProvider>
        </MobileGameContainer>
    );
}

export default RootPage;