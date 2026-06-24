import { useMutation, useQuery } from "@tanstack/react-query";
import { chopsuipandaClientModule } from "../modules";


export function useRegisterSession() {
    return useMutation(chopsuipandaClientModule.mutation('registerSession'));
}

export function useExpireSession() {
    return useMutation(chopsuipandaClientModule.mutation('expireSession'));
}

export function useBambooShootSessionStart() {
    return useMutation(chopsuipandaClientModule.mutation('bambooShootSessionStart'));
}

export function useThrowBamboo() {
    return useMutation(chopsuipandaClientModule.mutation('throwBamboo'));
}

export function useTreeChopSessionStart() {
    return useMutation(chopsuipandaClientModule.mutation('treeChopSessionStart'));
}

export function useChopTree() {
    return useMutation(chopsuipandaClientModule.mutation('chopTree'));
}

export function useContiueGame() {
    return useMutation(chopsuipandaClientModule.mutation('contiueGame'));
}

export function useEndGameSession() {
    return useMutation(chopsuipandaClientModule.mutation('endGameSession'));
}

export function useCheckPingPong() {
    return useQuery(chopsuipandaClientModule.query('checkPingPong'));
}