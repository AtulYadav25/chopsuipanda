import { useMutation } from "@tanstack/react-query";
import { chopsuipandaClientModule } from "../modules";


export function useRegisterSession() {
    return useMutation(chopsuipandaClientModule.mutation('registerSession'));
}

export function useExpireSession() {
    return useMutation(chopsuipandaClientModule.mutation('expireSession'));
}

export function useKnifeSessionStart() {
    return useMutation(chopsuipandaClientModule.mutation('knifeSessionStart'));
}

export function useThrowKnife() {
    return useMutation(chopsuipandaClientModule.mutation('throwKnife'));
}

export function useTreeSessionStart() {
    return useMutation(chopsuipandaClientModule.mutation('treeSessionStart'));
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
