import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { coreAssets, introAssets, menuIconAssets, notificationAssets } from '@/client/assets';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { useGameplayStore } from '@/client/store/useGameplayStore';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import DailyStreakModal from '../modals/DailyStreakModal';
import FrensModal from '../modals/FrensModal';
import BattleModal from '../modals/BattleModal';
import InboxModal from '../modals/InboxModal';
import StartGameScreen from './childScreens/StartGameScreen';
import { useDisconnectWalletBackend } from '@/client/hooks/player';
import { disConnectMyWallet } from '@/client/dapp-kit';
import SoundManager from '@/client/utils/SoundManager';
import { useToast } from '@/client/context/ToastContext';
import { usePlayerActions, usePlayerStore } from '@/client/store/usePlayerStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelType = 'INBOX' | 'BATTLE' | 'NONE' | 'FRENS' | 'DAILY_STREAK';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDeviceAMobile(): boolean {
    return (
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        ('ontouchstart' in window && window.innerWidth <= 1024)
    );
}

function enterFullScreen(): void {
    const elem = document.documentElement as HTMLElement & {
        mozRequestFullScreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
    };

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

const HomeScreen = () => {
    const textBox = useRef<HTMLDivElement>(null);

    const account = useCurrentAccount();
    const isConnected = Boolean(account?.address);

    const [showStartGameScreen, setShowStartGameScreen] = useState<boolean>(false);
    const [showPanel, setShowPanel] = useState<PanelType>('NONE');

    //Toast Context
    const { showToast } = useToast();

    // Asset loader — merging all asset maps
    const allAssets = useMemo(
        () => ({
            ...coreAssets,
            ...menuIconAssets,
            ...introAssets,
            ...notificationAssets,
        }),
        []
    );
    const { assets } = useAssetLoader(allAssets);

    // Mutations
    const { mutateAsync: disconnectWalletAndClearCookies } = useDisconnectWalletBackend();

    // Store
    const isGameSoundOn = useGameplayStore((s) => s.isGameSoundOn);
    const setGameSoundOn = useGameplayStore((s) => s.setIsGameSoundOn);
    const setPage = useGameplayStore((s) => s.setPage);
    const player = usePlayerStore((s) => s.player)
    const { setPlayer } = usePlayerActions()

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleGameAudio = async () => {

        SoundManager.stopAll();
        if (isGameSoundOn) {
            SoundManager.unloadGroup('Global')
        } else {
            SoundManager.loadGroup('Global')
            SoundManager.play('bgm');
        }

        setGameSoundOn(!isGameSoundOn);
    };

    const handlePanelClose = () => {
        setShowPanel('NONE');
    };

    const handleStartGame = () => {
        const tl = gsap.timeline({
            onComplete: () => {
                localStorage.setItem('player', player!.username)

                if (isDeviceAMobile()) {
                    // enterFullScreen();
                }
                setPage('game');
            },
        });

        tl.to(textBox.current, { y: '-100vh', duration: 1, ease: 'power2.inOut' }, 0);
    };

    // "Play Now" opens the start game screen; actual game launch happens via handleStartGame
    const handlePlay = () => {
        if (!account?.address) {
            return showToast({ type: "info", message: "Please Connect Your Wallet" })
        }
        setShowStartGameScreen(true);
        SoundManager.play('menuSwitch');
    };

    const handleDisconnectWallet = async () => {
        await disconnectWalletAndClearCookies({});
        disConnectMyWallet();
        setPlayer(null);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <div className="max-h-full">
                {showStartGameScreen && (
                    <StartGameScreen
                        onClose={() => setShowStartGameScreen(false)}
                        handleStartGame={handleStartGame}
                    />
                )}

                {/* Background */}
                <div className="backgroundContainer h-[100%] overflow-y-hidden">
                    <img
                        src={assets.mainBackground}
                        alt="Background"
                        className="backgroundHome object-contain"
                    />
                </div>

                <div className="startGame overflow-y-hidden justify-between" id="startGame">

                    {/* Sound toggle */}
                    <div
                        className={`flex flex-col gap-2 justify-between absolute top-6 right-4 z-[200] ${isGameSoundOn ? '' : 'filter grayscale'}`}
                        onClick={handleGameAudio}
                    >
                        <img src={assets.volumeIcon} alt="Toggle sound" className="w-10 h-10" />
                    </div>

                    {/* Side menu icons — only when wallet connected */}
                    {account?.address && (
                        <div className="z-[200] flex flex-col items-center gap-3 justify-center fixed bottom-[15%] right-4">
                            <img src={assets.dailyStreakIcon} onClick={() => setShowPanel('DAILY_STREAK')} alt="Daily streak" className="w-12 h-12" />
                            <img src={assets.mailIcon} onClick={() => setShowPanel('INBOX')} alt="Inbox" className="w-12 h-12" />
                            <img src={assets.pandaHead} onClick={() => setShowPanel('FRENS')} alt="Frens" className="w-12 h-12" />
                            <img src={assets.swordIcon} onClick={() => setShowPanel('BATTLE')} alt="Battle" className="w-12 h-12" />
                        </div>
                    )}

                    {/* Panels */}
                    {showPanel === 'INBOX' && <InboxModal handlePanelClose={handlePanelClose} />}
                    {showPanel === 'BATTLE' && <BattleModal handlePanelClose={handlePanelClose} />}
                    {showPanel === 'DAILY_STREAK' && <DailyStreakModal showPanel={showPanel} handlePanelClose={handlePanelClose} />}
                    {showPanel === 'FRENS' && <FrensModal handlePanelClose={handlePanelClose} />}

                    {/* Main content */}
                    <div className="home relative">
                        <div className="flex flex-col w-full items-center justify-start min-h-[100vh] text-white">
                            <div ref={textBox} className="text-center p-6 pt-[50%]">

                                <img
                                    src={assets.chopsuiPandaLogo}
                                    alt="Chop SUI Panda"
                                    className="max-w-[230px] mb-2 object-contain"
                                />

                                <button
                                    className="mt-5 mb-2 px-5 py-2 bg-gradient-to-r from-custom-blue to-custom-light-blue text-slate-800 font-Game rounded-lg shadow-lg hover:bg-custom-hoverBlue animated-button text-xl animate-Btn-pulse"
                                    onClick={handlePlay}
                                >
                                    Play Now
                                </button>

                                {!isConnected ? (
                                    <div className="flex flex-col items-center w-full">
                                        <ConnectButton className='mt-2 '>

                                            <WalletIcon />
                                            <span className="text-xs font-Game">Connect Wallet</span>
                                            {/* <button className="flex justify-center mt-3 mx-auto items-center gap-2 px-4 py-2 text-white bg-black rounded-lg shadow-md hover:bg-gray-900 transition duration-300">
                                            </button> */}

                                        </ConnectButton>
                                        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-green-500 px-3 py-1 text-[10px] font-semibold text-white uppercase tracking-wider select-none font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            TESTNET Network
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDisconnectWallet}
                                        className="mt-3 mx-auto justify-center flex items-center gap-2 px-4 py-2 text-white bg-black rounded-lg shadow-md hover:bg-gray-900 transition duration-300"
                                    >
                                        <WalletIcon />
                                        <span className="text-xs">Disconnect Wallet</span>
                                    </button>
                                )}



                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

// ─── Shared wallet SVG icon ───────────────────────────────────────────────────

const WalletIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
    >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
);

export default HomeScreen;