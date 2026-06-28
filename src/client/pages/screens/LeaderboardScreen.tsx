import { leaderboardAssets } from "@/client/assets";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { useGetLatestWeeklyReward } from "@/client/hooks/weeklyReward";
import { modelenceLiveQuery } from "@modelence/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RewardTier {
    playerCount: number;
    rewardAmount: number;
}

interface PlayerEntry {
    username: string;
    chiEarned: number;
    walletAddress: string;
    rank: number;
}

interface WeeklyRewardData {
    data?: {
        rewards?: RewardTier[];
        rewardType?: string;
        rewardDay?: string;
    };
}

interface RewardDisplay {
    rewardRank: string[];
    rewardAmount: number[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumberShort = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) return '0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    const trim = (val: string) => val.replace(/\.0+$/, '');

    if (absNum >= 1_000_000_000) return `${sign}${trim((absNum / 1_000_000_000).toFixed(0))}B`;
    if (absNum >= 1_000_000) return `${sign}${trim((absNum / 1_000_000).toFixed(2))}M`;
    if (absNum >= 1_000) return `${sign}${trim((absNum / 1_000).toFixed(1))}K`;
    return `${sign}${absNum}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const LeaderBoardScreen = () => {
    const { assets } = useAssetLoader(leaderboardAssets);

    const [showLeaderboardRankAndReward, setShowLeaderboardRankAndReward] = useState<boolean>(false);

    const account = useCurrentAccount();

    // Queries
    const { data: topPlayers, isLoading } = useQuery(
        modelenceLiveQuery('player.getTopPlayers', {})
    );

    const { data: weeklyRewardRaw } = useGetLatestWeeklyReward();
    const weeklyReward = weeklyRewardRaw as WeeklyRewardData | undefined;

    // ─── Derived state ────────────────────────────────────────────────────────

    const leaderboardData = useMemo<PlayerEntry[]>(
        () => (topPlayers as PlayerEntry[] | undefined) ?? [],
        [topPlayers]
    );

    const rewardTiers = useMemo<RewardTier[]>(
        () => weeklyReward?.data?.rewards ?? [],
        [weeklyReward]
    );

    const rewardType = useMemo<string>(
        () => weeklyReward?.data?.rewardType ?? '',
        [weeklyReward]
    );

    const rewardDay = useMemo<string>(() => {
        const raw = weeklyReward?.data?.rewardDay;
        if (!raw) return '';
        const date = new Date(raw);
        const formatted = date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        return `Prize Day:🏆 ${formatted}`;
    }, [weeklyReward]);

    const rewardDisplay = useMemo<RewardDisplay>(() => {
        const result: RewardDisplay = { rewardRank: [], rewardAmount: [] };
        let currentRank = 1;
        for (const tier of rewardTiers) {
            const start = currentRank;
            const end = currentRank + tier.playerCount - 1;
            result.rewardRank.push(start === end ? `${start}` : `${start}-${end}`);
            result.rewardAmount.push(tier.rewardAmount);
            currentRank = end + 1;
        }
        return result;
    }, [rewardTiers]);

    const getNumByRank = (rank: number): number | null => {
        let cumulative = 0;
        for (const tier of rewardTiers) {
            cumulative += tier.playerCount;
            if (rank <= cumulative) return tier.rewardAmount;
        }
        return null;
    };

    // Top-3 podium: show 2nd, 1st, 3rd order visually
    const podiumPlayers = [leaderboardData[1], leaderboardData[0], leaderboardData[2]];
    const trophyImages = [assets.silverTrophy, assets.goldTrophy, assets.bronzeTrophy];
    const trophySizes = ['w-16 h-16', 'w-20 h-20', 'w-14 h-14'];

    // Current user's row (only shown when outside top 50)
    const address = account?.address;
    const currentUserEntry = address
        ? leaderboardData.find((p) => p.walletAddress === address)
        : null;
    const isInTopList = address
        ? leaderboardData.some((p, idx) => p.walletAddress === address && idx < 50)
        : false;
    const showCurrentUserRow = currentUserEntry && !isInTopList;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-[#0B1624] flex flex-col items-center justify-center p-4 h-[100vh]">
            <div className="w-full max-w-md h-[80vh] flex flex-col">
                <div className="w-full bg-[#0B1624] rounded-lg border-2 border-amber-600 overflow-hidden flex flex-col h-full">

                    {/* Header */}
                    <div className="p-4 border-b border-amber-600">
                        <div className="relative flex justify-center items-center">
                            <h1 className="text-4xl text-[#E6D5B8] font-Game text-center">LEADERBOARD</h1>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-amber-500 mt-2 font-Game">
                            <span className="text-sm">
                                {rewardTiers.length > 0
                                    ? (rewardDay || 'Resets in: 6d 23h')
                                    : 'Rewards To Be Declared'}
                            </span>
                            <button
                                onClick={() => setShowLeaderboardRankAndReward((prev) => !prev)}
                                className="text-amber-500 hover:text-amber-400"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {showLeaderboardRankAndReward ? (
                            /* ── Rank rewards view ── */
                            <div className="px-2 py-4">
                                <h2 className="text-2xl text-center text-amber-500 mb-4 font-Game">Rank Rewards</h2>
                                <div className="space-y-2">
                                    {rewardDisplay.rewardRank.length > 0 ? (
                                        <>
                                            {rewardDisplay.rewardRank.map((rank, index) => (
                                                <div
                                                    key={index}
                                                    className="font-Game flex justify-between items-center bg-[#1a2b3d] p-3 rounded-lg"
                                                >
                                                    <span className="text-[#E6D5B8]">Rank {rank}</span>
                                                    <span className="text-amber-400">
                                                        {formatNumberShort(rewardDisplay.rewardAmount[index])} {rewardType}
                                                    </span>
                                                </div>
                                            ))}
                                            <p className="font-Game text-white text-center mt-2">Love From SUI</p>
                                        </>
                                    ) : (
                                        <div className="text-center text-[#E6D5B8] bg-[#1a2b3d] p-4 rounded-lg font-Game">
                                            Rewards will be announced soon! Stay tuned for exciting prizes.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ── Leaderboard view ── */
                            <div className="px-2 py-4">
                                {/* Podium — top 3 */}
                                {isLoading ? (
                                    /* ✅ Proper table row — no colSpan on <p> */
                                    <table className="w-full font-Game mb-3">
                                        <tbody>
                                            <tr>
                                                <td colSpan={4} className="text-center text-white py-4">
                                                    Loading...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex gap-2 font-Game mb-3">
                                        {podiumPlayers.map((player, index) => (
                                            <div
                                                key={index}
                                                className={`text-white w-full flex flex-col items-center justify-center ${index === 0 ? 'order-1' : index === 1 ? 'order-2' : 'order-3'
                                                    }`}
                                            >
                                                <img
                                                    src={trophyImages[index]}
                                                    alt="Trophy"
                                                    className={trophySizes[index]}
                                                />
                                                <p className="py-1">
                                                    {(player?.username?.length ?? 0) > 7
                                                        ? `${player?.username.slice(0, 7)}...`
                                                        : player?.username}
                                                </p>
                                                <p className="text-center">
                                                    {player?.chiEarned?.toLocaleString()}
                                                </p>
                                                <p className="text-center text-blue-400 py-1">
                                                    {getNumByRank(index + 1)
                                                        ? `${formatNumberShort(getNumByRank(index + 1))} ${rewardType}`
                                                        : 'TBD'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Table — rank 4+ */}
                                <table className="w-full border-separate border-spacing-x-2 font-Game">
                                    <thead>
                                        <tr className="text-[#E6D5B8] text-sm">
                                            <th className="w-[14%] text-center pb-2">RANK</th>
                                            <th className="w-[40%] text-left pb-2">PLAYER</th>
                                            <th className="w-[20%] text-center pb-2">SCORE</th>
                                            <th className="w-[25%] text-right pb-2">PRIZE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-white py-4">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : (
                                            leaderboardData.slice(3).map((player, index) => (
                                                <tr key={index + 4} className="text-white text-sm font-Game">
                                                    <td className="w-[15%] text-center py-2">
                                                        <span className="text-gray-400">{index + 4}</span>
                                                    </td>
                                                    <td className="w-[45%] font-medium py-2">
                                                        {player.username.length > 10
                                                            ? `${player.username.slice(0, 9)}...`
                                                            : player.username}
                                                    </td>
                                                    <td className="w-[20%] text-center py-2">
                                                        {player.chiEarned.toLocaleString()}
                                                    </td>
                                                    <td className="w-[20%] text-right py-2 text-blue-400">
                                                        {getNumByRank(index + 4)
                                                            ? `${formatNumberShort(getNumByRank(index + 4))} ${rewardType}`
                                                            : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Current user's row — only when outside top 50 */}
                    {showCurrentUserRow && (
                        <div className="p-4 border-t border-gray-700 bg-[#1a2b3d] font-Game">
                            <table className="w-full border-separate border-spacing-x-2">
                                <tbody>
                                    <tr className="text-white">
                                        <td className="w-[15%] text-center">{currentUserEntry.rank}th</td>
                                        <td className="w-[45%]">You</td>
                                        <td className="w-[20%] text-center">
                                            {currentUserEntry.chiEarned?.toLocaleString()}
                                        </td>
                                        <td className="w-[20%] text-right">
                                            {getNumByRank(currentUserEntry.rank)
                                                ? `${formatNumberShort(getNumByRank(currentUserEntry.rank))} ${rewardType}`
                                                : '-'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LeaderBoardScreen;