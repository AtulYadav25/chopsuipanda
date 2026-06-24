import { dbPlayers } from "../modules/stores/playerStore";
import { dbWeeklyRewards } from "../modules/stores/weeklyRewardStore";


/**
 * How many players are rewarded (step-locked per 100-player milestone).
 *
 * Rules:
 *  - < 30  players → top 3  (podium only)
 *  - < 100 players → top 10
 *  - ≥ 100 players → 30% of the milestone (snapped DOWN to nearest 100),
 *                    so the rewarded count only grows every 100 extra players.
 *
 * Examples (≥ 100 bracket):
 *   150 players → milestone 1 → 30% of 100 = 30 rewarded
 *   220 players → milestone 2 → 30% of 200 = 60 rewarded
 *   350 players → milestone 3 → 30% of 300 = 90 rewarded
 */
function getRewardedPlayerCount(totalPlayers: number): number {
    if (totalPlayers < 30) return 3;
    if (totalPlayers < 100) return 10;
    const snapped = Math.floor(totalPlayers / 100) * 100;   // e.g. 250 → 200
    return Math.floor(snapped * 0.3);                        // 30% of milestone
}

/**
 * Builds the full reward tier array with milestone-driven prize scaling.
 *
 * ── Podium (ranks 1–3) ──────────────────────────────────────────────────────
 *   Prizes use a 5 : 3 : 2 ratio and multiply with each 100-player milestone:
 *
 *   Bracket        │ Milestone │ Rank 1    │ Rank 2    │ Rank 3
 *   ────────────────┼───────────┼───────────┼───────────┼──────────
 *   < 30  players  │     —     │  5 000    │  3 000    │  2 000
 *   30–99 players  │     —     │ 20 000    │ 12 000    │  8 000
 *   100–199        │     1     │ 50 000    │ 30 000    │ 20 000
 *   200–299        │     2     │100 000    │ 60 000    │ 40 000
 *   300–399        │     3     │150 000    │ 90 000    │ 60 000
 *   …and so on (milestone × base podium)
 *
 * ── Ranks 4+ (30% window split into 4 descending sub-tiers) ─────────────────
 *   Within the remaining rewarded slots the pool is split by count:
 *     Sub-tier A – top  5% → 40% of pool  (highest individual prize)
 *     Sub-tier B – next 15% → 30% of pool
 *     Sub-tier C – next 30% → 20% of pool
 *     Sub-tier D – bottom 50% → 10% of pool  (base prize)
 *
 *   The pool itself also grows per milestone:
 *     < 30  → 200 × remaining slots
 *     30–99 → 500 × remaining slots
 *     ≥ 100 → 500 × milestone × remaining slots
 */
function buildRewardTiers(totalPlayers: number, rewardedCount: number) {
    // ── 1. Determine milestone for scaling ────────────────────────────────────
    const milestone = Math.floor(totalPlayers / 100);  // 0 for <100, 1 for 100-199, …

    // ── 2. Podium prizes (ranks 1-3) — scale with milestone ──────────────────
    let podium1: number, podium2: number, podium3: number;

    if (totalPlayers < 30) {
        podium1 = 30_000; podium2 = 20_000; podium3 = 15_000;
    } else if (totalPlayers < 100) {
        podium1 = 50_000; podium2 = 35_000; podium3 = 25_000;
    } else {
        // milestone ≥ 1: scale linearly — each new 100 players adds one unit
        podium1 = milestone * 60_000;
        podium2 = milestone * 40_000;
        podium3 = milestone * 30_000;
    }

    const tiers: { playerCount: number; rewardAmount: number }[] = [
        { playerCount: 1, rewardAmount: podium1 },   // rank 1
        { playerCount: 1, rewardAmount: podium2 },   // rank 2
        { playerCount: 1, rewardAmount: podium3 },   // rank 3
    ];

    // ── 3. Rank 4+ sub-tiers ─────────────────────────────────────────────────
    const remaining = rewardedCount - 3;
    if (remaining <= 0) return tiers;   // < 30 players: podium only

    // Pool grows with community size (and with milestone for ≥ 100 sessions)
    const poolPerSlot =
        totalPlayers < 30 ? 200 :
            totalPlayers < 100 ? 500 :
                500 * milestone;                             // doubles every 100 players

    const pool = remaining * poolPerSlot;

    // Sub-tier player counts (must sum exactly to `remaining`)
    const subA = Math.max(1, Math.floor(remaining * 0.05));
    const subB = Math.max(1, Math.floor(remaining * 0.15));
    const subC = Math.max(1, Math.floor(remaining * 0.30));
    const subD = Math.max(1, remaining - subA - subB - subC);

    // Individual prize = tier's share of pool ÷ number of players in that tier
    const amtA = Math.floor((pool * 0.40) / subA);
    const amtB = Math.floor((pool * 0.30) / subB);
    const amtC = Math.floor((pool * 0.20) / subC);
    const amtD = Math.floor((pool * 0.10) / subD);

    tiers.push(
        { playerCount: subA, rewardAmount: amtA },
        { playerCount: subB, rewardAmount: amtB },
        { playerCount: subC, rewardAmount: amtC },
        { playerCount: subD, rewardAmount: amtD },
    );

    return tiers;
}


/**
 * Runs every 4 hours (configured externally).
 * Fetches the active weekly reward session, calculates the current top players
 * and reward tiers based on total participant count, then updates the latest
 * weeklyReward document with the snapshot and tier data.
 */
export const startLeaderboardRewardUpdate = async () => {
    const activeThrone = await dbWeeklyRewards.findOne({}, { sort: { createdAt: -1 } });

    if (!activeThrone) {
        console.log("[LeaderboardCron] No active weekly reward session found. Skipping.");
        return;
    }

    // Fetch all players in this session, sorted by chiEarned descending
    const allPlayers = await dbPlayers.fetch(
        { sessionId: activeThrone.sessionId },
        { sort: { chiEarned: -1 } }
    );

    const totalPlayers = allPlayers.length;

    if (totalPlayers === 0) {
        console.log("[LeaderboardCron] No players in current session. Skipping.");
        return;
    }

    // Determine how many players get rewarded
    const rewardedCount = getRewardedPlayerCount(totalPlayers);

    // Build tiered reward structure
    const rewards = buildRewardTiers(totalPlayers, rewardedCount);

    // Snapshot the top rewarded winners
    const topWinners = allPlayers.slice(0, rewardedCount).map((player, index) => ({
        playerId: player._id,
        rank: index + 1,
        chiEarned: player.chiEarned,
    }));

    // Persist the snapshot + reward tiers into the active weeklyReward document
    await dbWeeklyRewards.updateOne(
        { _id: activeThrone._id },
        {
            $set: {
                rewards,
                topWinners,
                lastUpdatedBy: "system",
                updatedAt: new Date(),
            },
        }
    );

    console.log(
        `[LeaderboardCron] Updated rewards for session "${activeThrone.sessionId}". ` +
        `Total players: ${totalPlayers}, Rewarded: ${rewardedCount}, Tiers: ${rewards.length}`
    );
};
