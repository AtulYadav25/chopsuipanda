import { GameType, GAME_TYPES } from "@/shared/constants/GameTypes"

export const calculatePlayerScore = (score: number, gameType: GameType) => {

    let CHI = 0;

    if (gameType === GAME_TYPES.BAMBOO_SHOOT) {
        CHI = Math.ceil((score * 9)) + Math.floor(Math.random() * 50)
    } else if (gameType === GAME_TYPES.TREE_CHOP) {
        CHI = Math.ceil((score * 5)) + Math.floor(Math.random() * 50)
    }

    return CHI
}