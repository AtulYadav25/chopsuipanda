import { useMutation } from "@tanstack/react-query";
import { suiClientModule } from "../modules";


export function usePurchaseChi() {
    return useMutation(suiClientModule.mutation('purchaseChi'));
}

export function useVerifyDigest() {
    return useMutation(suiClientModule.mutation('verifyDigest'));
}
