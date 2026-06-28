import { ReactNode, lazy, Suspense, useEffect, useState } from "react";

const DesktopFallback = lazy(() => import("./DesktopFallback"));

interface MobileGameContainerProps {
    children: ReactNode;
}

function MobileGameContainer({ children }: MobileGameContainerProps) {
    const [isMobile, setIsMobile] = useState<boolean>(true);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(
                /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                ('ontouchstart' in window && window.innerWidth <= 1024)
            );
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    if (!isMobile) {
        return (
            <Suspense fallback={null}>
                <DesktopFallback gameUrl={typeof window !== "undefined" ? window.location.href : undefined} />
            </Suspense>
        );
    }

    return <>{children}</>;
}

export default MobileGameContainer;