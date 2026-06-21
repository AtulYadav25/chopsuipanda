import { useMutation, useQuery } from "@tanstack/react-query";
import { battleMatchClientModule } from "../modules";


export function useSendBattleChallenge() {
    return useMutation(battleMatchClientModule.mutation('sendBattleChallenge'));
}

export function useAcceptBattleChallenge() {
    return useMutation(battleMatchClientModule.mutation('acceptBattleChallenge'));
}

export function useRejectBattleChallenge() {
    return useMutation(battleMatchClientModule.mutation('rejectBattleChallenge'));
}

export function useSubmitBattleScore() {
    return useMutation(battleMatchClientModule.mutation('submitBattleScore'));
}



/** Battle Match Queries */

export function useGetMyActiveBattles() {
    return useQuery(battleMatchClientModule.query('getMyActiveBattles', {}));
}
