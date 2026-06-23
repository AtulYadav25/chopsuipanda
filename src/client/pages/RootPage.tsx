import MobileGameContainer from "../components/MobileGameContainer";
import { ToastProvider } from "../context/ToastContext";
import { useGameplayStore } from "../store/useGameplayStore";
import HomeScreen from "./screens/HomeScreen";

function RootPage() {

    const page = useGameplayStore((s) => s.page);

    // TODO : Add Loading Screen and make it wait untill everything is ready (assets, sounds, authenticated player)

    return (
        <MobileGameContainer>
            <ToastProvider>
                {page === 'home' && <HomeScreen />}
            </ToastProvider>
        </MobileGameContainer>
    );
}

export default RootPage;