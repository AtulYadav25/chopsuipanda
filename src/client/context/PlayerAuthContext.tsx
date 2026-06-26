// src/context/PlayerAuthContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
    useRef,
} from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { toHex } from "@mysten/sui/utils";
import {
    useAuthPlayer,
    useCheckAuth,
    useDisconnectWalletBackend,
    useRefreshPlayerProfile,
} from "../hooks/player";
import { useRegisterSession } from "../hooks/chopsuipanda";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerAuthContextValue {
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    handleDisconnectWallet: () => Promise<void>;
}

interface PlayerAuthProviderProps {
    children: ReactNode;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const PlayerAuthContext = createContext<PlayerAuthContextValue | null>(null);

export function usePlayerAuth(): PlayerAuthContextValue {
    const ctx = useContext(PlayerAuthContext);
    if (!ctx) {
        throw new Error("usePlayerAuth must be used inside <PlayerAuthProvider>");
    }
    return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const PlayerAuthProvider = ({ children }: PlayerAuthProviderProps) => {
    const account = useCurrentAccount();
    const dAppKit = useDAppKit(); // v2: all actions live here

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const { mutateAsync: disconnectBackend } = useDisconnectWalletBackend();
    const { mutateAsync: authPlayer } = useAuthPlayer();
    const { refetch: refreshPlayerProfile } = useRefreshPlayerProfile();
    const { mutateAsync: registerSession } = useRegisterSession();
    const { refetch: checkAuth } = useCheckAuth();

    // ── Disconnect ─────────────────────────────────────────────────────────────

    const handleDisconnectWallet = useCallback(async () => {
        try {
            await disconnectBackend({});
        } catch {
            // backend disconnect is best-effort; always clear local state
        } finally {
            setIsAuthenticated(false);
            await dAppKit.disconnectWallet(); // v2 API
        }
    }, [disconnectBackend, dAppKit]);

    // ── Auth flow ──────────────────────────────────────────────────────────────

    const authInFlight = useRef(false);

    const checkForAuthentication = useCallback(async () => {
        if (!account?.address || isAuthenticated || isAuthenticating || authInFlight.current) return;

        setIsAuthenticating(true);
        authInFlight.current = true;

        try {
            const checkResult = await checkAuth();

            if (checkResult.isSuccess && checkResult.data) {
                // Cookie already valid — skip signing
                setIsAuthenticated(true);
                refreshPlayerProfile({ includeSocial: true });
                await registerSession({});
                return;
            }

            // Build a human-readable, date-stamped message to prevent replay attacks
            const formattedDate = new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
            const messageText = `I am an Authenticated User of Chop SUI Panda! SignDate ${formattedDate}`;
            const message = new TextEncoder().encode(messageText);

            // v2: signPersonalMessage is async/await — no more mutate callbacks
            let signResult: { bytes: string; signature: string };
            try {
                signResult = await dAppKit.signPersonalMessage({ message });
            } catch {
                // User rejected the signature prompt
                await handleDisconnectWallet();
                return;
            }

            const { signature } = signResult;

            // Strip the leading 0x if present before sending to backend
            let publicKeyHex = toHex(new Uint8Array(account.publicKey));
            if (publicKeyHex.startsWith("0x")) {
                publicKeyHex = publicKeyHex.slice(2);
            }

            await authPlayer(
                {
                    walletAddress: account.address,
                    message: Array.from(message),
                    signature,
                },
                {
                    onSuccess: async () => {
                        setIsAuthenticated(true);
                        refreshPlayerProfile({ includeSocial: true });
                        await registerSession({});
                    },
                    onError: async () => {
                        await handleDisconnectWallet();
                    },
                },
            );
        } finally {
            authInFlight.current = false;
            setIsAuthenticating(false);
        }
    }, [
        account,
        isAuthenticated,
        isAuthenticating,
        checkAuth,
        dAppKit,
        authPlayer,
        refreshPlayerProfile,
        handleDisconnectWallet,
    ]);

    // ── Trigger auth whenever account changes ──────────────────────────────────

    useEffect(() => {
        if (account?.address) {
            checkForAuthentication();
        } else {
            // Wallet was disconnected externally (e.g. user removed from wallet UI)
            setIsAuthenticated(false);
        }
    }, [account?.address]); // eslint-disable-line react-hooks/exhaustive-deps
    // ↑ intentionally only reacts to address change, not the callback ref

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <PlayerAuthContext.Provider
            value={{ isAuthenticated, isAuthenticating, handleDisconnectWallet }}
        >
            {children}
        </PlayerAuthContext.Provider>
    );
};