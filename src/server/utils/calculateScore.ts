import { GameType, GAME_TYPES } from "@/shared/constants/GameTypes"

export const calculatePlayerScore = (score: number, gameType: GameType) => {

    let CHI = 0;

    if (gameType === GAME_TYPES.KNIFE_HIT) {
        CHI = Math.ceil((score * 9)) + Math.floor(Math.random() * 50)
    } else if (gameType === GAME_TYPES.CHOP_TREE) {
        CHI = Math.ceil((score * 5)) + Math.floor(Math.random() * 50)
    }

    return CHI
}