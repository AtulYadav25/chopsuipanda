import MobileGameContainer from "../components/MobileGameContainer";
import { ToastProvider } from "../context/ToastContext";

function RootPage() {

    return (
        <MobileGameContainer>
            <ToastProvider>
                <p></p>

            </ToastProvider>
        </MobileGameContainer>
    );
}

export default RootPage;