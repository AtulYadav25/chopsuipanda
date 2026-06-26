import { useState, useRef, useMemo } from 'react';
import GameModeSelector from './childScreens/GameModeSelector';
import { usePlayerStore } from '@/client/store/usePlayerStore';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { useToast } from '@/client/context/ToastContext';
import { useRefreshPlayerProfile } from '@/client/hooks/player';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { frensAssets, introAssets } from '@/client/assets';
import { FriendDetails } from '@/shared/schemas/friendship.schema';
import { Page, useGameplayStore } from '@/client/store/useGameplayStore';
import { useSendBattleChallenge } from '@/client/hooks/battleMatch';
import { useDeleteFriend, useSendFriendRequest } from '@/client/hooks/friendship';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FrensScreenProps {
    changePage: (page: Page) => void;
}

interface UnfriendModalState {
    visible: boolean;
    friendUsername: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const FrensScreen = ({ changePage }: FrensScreenProps) => {
    const [showGameSelector, setShowGameSelector] = useState<boolean>(false);
    const [showAddFriendModal, setShowAddFriendModal] = useState<boolean>(false);
    const [showUnfriendModal, setShowUnfriendModal] = useState<UnfriendModalState>({
        visible: false,
        friendUsername: '',
    });
    const [newFriendUsername, setNewFriendUsername] = useState<string>('');
    const [showWagerModal, setShowWagerModal] = useState<boolean>(false);
    const [wagerAmount, setWagerAmount] = useState<number>(1000);

    const challengeFrenUsername = useRef<string>('');
    const challengeFrenAddress = useRef<string>('');

    // Asset loader
    const allAssets = useMemo(
        () => ({
            ...frensAssets,
            ...introAssets,
        }),
        []
    );
    const { assets } = useAssetLoader(allAssets);

    // Hooks
    const account = useCurrentAccount();

    // Mutations & Queries
    const { refetch: refreshPlayerProfile } = useRefreshPlayerProfile();
    const { mutateAsync: sendBattleChallenge } = useSendBattleChallenge();
    const { mutateAsync: sendFriendRequest } = useSendFriendRequest();
    const { mutateAsync: deleteFriend } = useDeleteFriend();

    // Store
    const player = usePlayerStore((s) => s.player);
    const setBattleDetails = useGameplayStore((s) => s.setBattleDetails);
    const gameMode = useGameplayStore((s) => s.gameMode);

    // Toast
    const { showToast } = useToast();

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleAddFriend = async () => {
        setNewFriendUsername('');
        await sendFriendRequest(
            { friendUserName: newFriendUsername.toLowerCase() },
            {
                onSuccess: () => showToast({ type: 'success', message: 'Fren Request Sent!' }),
                onError: () => showToast({ type: 'error', message: 'Failed to Send Fren Request' }),
            }
        );
    };

    const handleUnfriend = async () => {
        await deleteFriend(
            { friendUserName: showUnfriendModal.friendUsername.toLowerCase() },
            {
                onSuccess: async () => {
                    showToast({ type: 'success', message: 'Fren removed!' });
                    setShowUnfriendModal({ visible: false, friendUsername: '' });
                    refreshPlayerProfile({ includeSocial: true });
                },
                onError: () => showToast({ type: 'error', message: 'Failed to unfriend' }),
            }
        );
    };

    const handleChallengeFriend = (walletAddress: string, friendUserName: string) => {
        challengeFrenUsername.current = friendUserName;
        challengeFrenAddress.current = walletAddress;
        setShowGameSelector(true);
    };

    const handleWagerChange = (increment: boolean) => {
        const next = wagerAmount + (increment ? 1000 : -1000);
        if (next >= 1000 && next <= 30000) {
            setWagerAmount(next);
        }
    };

    const handleConfirmChallenge = async () => {
        await sendBattleChallenge(
            {
                friendUsername: challengeFrenUsername.current,
                gameMode,
                wagerAmount,
            },
            {
                onSuccess: (data) => {
                    setBattleDetails(data.data.battle);
                    changePage('battleFren');
                },
            }
        );
        setShowWagerModal(false);
    };

    // ─── Guard ────────────────────────────────────────────────────────────────

    if (!player) return null;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            {showGameSelector && (
                <GameModeSelector
                    onBack={() => setShowGameSelector(false)}
                    onNext={() => {
                        setShowWagerModal(true);
                        setShowGameSelector(false);
                    }}
                />
            )}

            <div className="relative w-full h-screen">
                {/* Background */}
                <img
                    src={assets.frensBackground}
                    alt="Frens Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="relative w-full h-full flex flex-col items-center justify-between pb-[30%]">
                    {/* Main content */}
                    <div className="w-full px-4 mt-[25%] flex flex-col items-center">
                        <span className="text-center text-white bg-black/50 px-2 py-1 m-auto text-md font-Game rounded-sm">
                            Your Username:{' '}
                            <span className="font-poppins font-bold">{player.username}</span>
                        </span>

                        <div className="text-center mb-2 font-Game">
                            <h2 className="inline-block px-6 py-2 text-3xl text-white rounded-lg">
                                Your Frens
                            </h2>
                        </div>

                        {/* Friends list */}
                        <div className="inset-0 bg-black/60 backdrop-blur rounded-lg w-[85%] mx-auto max-h-[40vh] overflow-y-auto mb-4 p-4 font-Game">
                            {(player.friends?.length ?? 0) > 0 ? (
                                player.friends?.map((friend: FriendDetails, index: number) => (
                                    <div
                                        key={index}
                                        className="font-Game flex justify-between items-center mb-3 last:mb-0"
                                    >
                                        <div
                                            onClick={() =>
                                                setShowUnfriendModal({
                                                    visible: true,
                                                    friendUsername: friend.username,
                                                })
                                            }
                                            className="flex gap-2 text-white justify-center items-center cursor-pointer"
                                        >
                                            <span className="text-sm font-semibold">{index + 1}</span>
                                            <span className="text-sm text-left">{friend.username}</span>
                                        </div>
                                        <button
                                            className="px-4 text-sm py-2 bg-[#e03b0b] border-2 border-[#3e1200] text-white rounded-lg hover:opacity-90 active:transform active:scale-95 transition-all"
                                            onClick={() =>
                                                handleChallengeFriend(friend.walletAddress, friend.username)
                                            }
                                        >
                                            Challenge
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <span className="text-white text-center block">No Friends Yet</span>
                            )}
                        </div>
                    </div>

                    {/* Bottom buttons */}
                    <div className="flex gap-3 w-[80%] mx-auto">
                        <button className="flex items-center justify-end font-Game text-md pr-2 pl-3 relative w-full py-3 bg-[#55b75a] text-white rounded-lg border-b-[3px] border-[#409b44] hover:opacity-90 active:transform active:scale-95 transition-all">
                            <div className="absolute top-1/2 left-[6%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <img src={assets.chi} alt="CHI coin" className="w-12 h-12" />
                                <span className="text-sm text-white bottom-[-5px] absolute bg-black/20 px-2 rounded-lg backdrop-blur">
                                    +1K
                                </span>
                            </div>
                            Invite Frens
                        </button>

                        <button
                            onClick={() => setShowAddFriendModal(true)}
                            className="flex relative justify-center items-center font-Game !tracking-[0.1rem] w-full py-3 bg-[#55b75a] text-white rounded-lg border-b-[3px] border-[#409b44] hover:opacity-90 active:transform active:scale-95 transition-all"
                        >
                            <span className="text-md pr-[20%]">Add Fren</span>
                            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 flex flex-col items-center">
                                <img src={assets.pandaHead} alt="Panda head" className="w-12 h-12" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* ── Add Friend Modal ── */}
                {showAddFriendModal && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center z-50"
                        onClick={() => setShowAddFriendModal(false)}
                    >
                        <div
                            className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-[80%] max-w-md mt-[30%]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-white text-xl font-Game mb-4 text-center">Add New Fren</h3>
                            <input
                                type="text"
                                placeholder="Enter username"
                                className="w-full p-3 mb-4 rounded-lg bg-black/30 text-white border border-white/20 focus:outline-none focus:border-[#55b75a] font-Game"
                                value={newFriendUsername}
                                onChange={(e) => setNewFriendUsername(e.target.value)}
                            />
                            <button
                                onClick={handleAddFriend}
                                className="flex relative justify-center items-center font-Game !tracking-[0.1rem] w-full py-3 bg-[#55b75a] text-white rounded-lg border-b-[3px] border-[#409b44] hover:opacity-90 active:transform active:scale-95 transition-all"
                            >
                                Add Friend
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Wager Modal ── */}
                {showWagerModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center z-50">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-[80%] max-w-md mt-[30%] font-Game relative">
                            <button
                                onClick={() => setShowWagerModal(false)}
                                className="absolute top-2 right-2 text-white/70 hover:text-white"
                            >
                                ✕
                            </button>
                            <h3 className="text-white text-xl font-Game mb-6 text-center">
                                Enter Wager Amount
                            </h3>
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <button
                                    onClick={() => handleWagerChange(false)}
                                    disabled={wagerAmount <= 1000}
                                    className="w-12 h-12 bg-[#e03b0b] text-white rounded-lg flex items-center justify-center text-2xl hover:opacity-90 active:transform active:scale-95 transition-all disabled:opacity-40"
                                >
                                    -
                                </button>
                                <div className="text-sky-600 text-xl min-w-[100px] text-center">
                                    {wagerAmount.toLocaleString()} CHI
                                </div>
                                <button
                                    onClick={() => handleWagerChange(true)}
                                    disabled={wagerAmount >= 30000}
                                    className="w-12 h-12 bg-[#4CAF50] text-white rounded-lg flex items-center justify-center text-2xl hover:opacity-90 active:transform active:scale-95 transition-all disabled:opacity-40"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={handleConfirmChallenge}
                                className="w-full py-3 bg-[#55b75a] text-white rounded-lg border-b-[3px] border-[#409b44] hover:opacity-90 active:transform active:scale-95 transition-all font-Game"
                            >
                                Challenge
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Unfriend Modal ── */}
                {showUnfriendModal.visible && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center z-50">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-[80%] max-w-md mt-[30%] font-Game relative">
                            <h3 className="text-white text-xl font-Game mb-6 text-center">
                                Are you sure you want to unfriend{' '}
                                <span className="text-red-400">{showUnfriendModal.friendUsername}</span>?
                            </h3>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={handleUnfriend}
                                    className="w-full py-3 bg-red-600 text-white rounded-lg border-b-[3px] border-red-800 hover:opacity-90 active:transform active:scale-95 transition-all"
                                >
                                    Unfriend
                                </button>
                                <button
                                    onClick={() =>
                                        setShowUnfriendModal({ visible: false, friendUsername: '' })
                                    }
                                    className="w-full py-3 bg-green-600 text-white rounded-lg border-b-[3px] border-green-800 hover:opacity-90 active:transform active:scale-95 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FrensScreen;