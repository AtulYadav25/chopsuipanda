import { useMemo, useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import SoundManager from '@/client/utils/SoundManager.js';
import { useToast } from '@/client/context/ToastContext.js';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { configClientModule } from '@/client/modules.js';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { introAssets, shopAssets } from '@/client/assets/index.js';
import { CHI_SHOP_ITEMS, ChiShopItem } from '@/shared/constants/ChiShopConfig';
import { usePurchaseChi, useVerifyDigest } from '@/client/hooks/sui';
import { useRefreshPlayerProfile } from '@/client/hooks/player';
import { fromBase64 } from '@mysten/sui/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopScreenProps {
    showConnectWallet: () => void;
}

interface ApiLoadingState {
    loading: boolean;
    to: number | null;
}

interface ProcessPurchaseArgs {
    cost: number;
    message: string; // JWT token from backend
}

// ─── Helpers (stable — defined outside component) ─────────────────────────────

const formatNumber = (num: number): string => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return num.toString();
};

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

// ─── Shared spinner ───────────────────────────────────────────────────────────

const Spinner = () => (
    <svg
        aria-hidden="true"
        role="status"
        className="inline w-4 h-4 text-white animate-spin"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="#E5E7EB"
        />
        <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentColor"
        />
    </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ShopScreen = ({ showConnectWallet }: ShopScreenProps) => {

    const allAssets = useMemo(
        () => ({
            ...shopAssets,
            ...introAssets,
        }),
        []
    );

    const { assets } = useAssetLoader(allAssets);

    const [apiLoading, setApiLoading] = useState<ApiLoadingState>({
        loading: false,
        to: null,
    });

    // Toast
    const { showToast } = useToast();


    // Hooks
    const account = useCurrentAccount();
    const dAppKit = useDAppKit();
    const client = useCurrentClient();

    // Mutations
    const { mutateAsync: purchaseChi } = usePurchaseChi();
    const { mutateAsync: verifyDigest } = useVerifyDigest();
    const { refetch: refreshPlayerProfile } = useRefreshPlayerProfile();

    // Config — const since these never change after init
    const PACKAGE_ID = configClientModule.getConfig('PACKAGE_ID');
    const OBJECT_ID = configClientModule.getConfig('OBJECT_ID');
    const MODULE_NAME = configClientModule.getConfig('MODULE_NAME');

    // ─── Transaction processor ─────────────────────────────────────────────────

    const processCHIPurchaseTransaction = async ({ cost, message }: ProcessPurchaseArgs): Promise<void> => {
        if (!PACKAGE_ID || !OBJECT_ID || !MODULE_NAME) {
            showToast({ type: 'error', message: 'Server not configured' });
            return;
        }

        const timeStampNow = Date.now();

        try {
            const tx = new Transaction();

            tx.setGasBudget(10000000);

            const [coin] = tx.splitCoins(tx.gas, [cost]);

            // const messageBytes = Array.from(new TextEncoder().encode(message));

            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::paySUI`,
                arguments: [
                    tx.object(OBJECT_ID),
                    coin,
                    tx.pure.string(message),
                    tx.pure.u64(timeStampNow),
                    tx.pure.u64(cost),
                ],
            });

            // Sign only (don't let Phantom execute)
            const { bytes, signature } = await dAppKit.signTransaction({ transaction: tx });

            // Execute yourself via the client
            const result = await client.core.executeTransaction({
                transaction: fromBase64(bytes),
                signatures: [signature],
            });


            if (result.FailedTransaction) {
                setApiLoading({ loading: false, to: null });
                showToast({ type: 'error', message: 'Failed to purchase Chi' });
                return;
            }

            await delay(2000);

            await verifyDigest(
                { digest: result.Transaction.digest },
                {
                    onSuccess: () => {
                        SoundManager.play('chiPurchase');
                        showToast({ type: 'success', message: 'CHI Purchased Successfully' });
                        refreshPlayerProfile();
                    },
                    onError: () => {
                        showToast({ type: 'error', message: 'Transaction Failed' });
                    },
                }
            );
        } catch (e) {
            showToast({ type: 'error', message: 'Transaction Failed' });
        } finally {
            setApiLoading({ loading: false, to: null });
        }
    };

    // ─── Buy handler ───────────────────────────────────────────────────────────

    const handleBuyChi = async (chiData: ChiShopItem): Promise<void> => {
        if (!account?.address) {
            showConnectWallet();
            return; // ← was missing: execution continued even without a wallet
        }

        if (apiLoading.loading) return;

        setApiLoading({ loading: true, to: chiData.id });
        SoundManager.play('menuSwitch');

        await purchaseChi(
            { packId: chiData.id },
            {
                onSuccess: async (data) => {
                    await processCHIPurchaseTransaction({
                        cost: data.data.costInMistToPay,
                        message: data.data.token,
                    });
                },
            }
        );
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <div
                className="min-h-screen p-3 flex justify-center items-center"
                style={{
                    backgroundImage: `url(${assets.shopBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="w-full max-w-[85%] relative">
                    <div className="inset-0 flex flex-col items-center justify-center p-3 max-h-[75vh] pt-6 pb-8 bg-black/60 backdrop-blur rounded-lg">
                        <h1 className="text-4xl font-Game font-bold text-amber-100 text-center mb-4 drop-shadow-lg [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000]">
                            POWER UP <br /> WITH <span className="text-blue-700">CHI!</span>
                        </h1>
                        <span className="text-white font-Game font-medium mb-2 text-center text-sm max-w-[300px]">
                            Buy powerups, boost your score, open more mystery chests
                        </span>

                        <div className="max-h-[60%] w-full overflow-y-auto font-Game">
                            <div className="grid grid-cols-2 p-2 w-full gap-3">
                                {CHI_SHOP_ITEMS.map((option, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleBuyChi(option)}
                                        className="bg-black/80 rounded-xl p-4 flex flex-col items-center border-2 border-blue-700 justify-between transition-transform hover:scale-105 outline outline-2 outline-black shadow-sm shadow-black/50 cursor-pointer"
                                    >
                                        <div className="text-3xl font-bold text-yellow-400 mb-1">
                                            {formatNumber(option.amount)}
                                        </div>

                                        {option.bonus && (
                                            <div className="text-white mt-0 text-sm font-medium mb-2">
                                                {option.bonus}
                                            </div>
                                        )}

                                        <img
                                            src={assets.chi}
                                            alt="CHI coin"
                                            className="w-20 h-20 md:w-24 md:h-24 object-contain my-2"
                                        />

                                        <div className="bg-blue-600/60 mt-1 text-white px-3 py-1 rounded-full text-base">
                                            {apiLoading.to === option.id ? (
                                                <Spinner />
                                            ) : (
                                                `${option.price} SUI`
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShopScreen;