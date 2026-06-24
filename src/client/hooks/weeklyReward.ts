import { useQuery } from "@tanstack/react-query";
import { weeklyRewardClientModule } from "../modules";


export function useGetLatestWeeklyReward() {
    return useQuery(weeklyRewardClientModule.query('getLatestWeeklyReward'));
}
