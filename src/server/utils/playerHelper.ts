import { dbPlayers } from "../modules/stores/playerStore";
import { dailyRewards, rewardOfDay } from "@/shared/constants/DailyLoginRewards";


const generateRandomString = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const LETTERS = "ABCEGYZUPQRTSFDHJKLNMWXV";

export const generateUniqueReferralIdAndUsername = async () => {
    const MAX_ATTEMPTS = 20;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const referralId = `Panda-${generateRandomString(6)}`;
        const username = `PANDA${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}${LETTERS[Math.floor(Math.random() * LETTERS.length)]}`;

        const [existingReferral, existingUsername] = await Promise.all([
            dbPlayers.findOne({ referralId }),
            dbPlayers.findOne({ username }),
        ]);

        if (!existingReferral && !existingUsername) {
            return {
                referralId,
                username,
            };
        }
    }

    throw new Error(
        "Failed to generate unique referral ID and username after multiple attempts."
    );
};





export function getRewardForDay(day: number): rewardOfDay {
    return day <= 7
        ? dailyRewards[day - 1]
        : { day, reward: 4000, rewardType: 'CHI' };

}
