import { Suspense, lazy, useEffect } from "react";

const BambooShootGame = lazy(() => import('./GameScreens/BambooShootGame'));
const TreeGame = lazy(() => import('./GameScreens/TreeChopGame'));

import SimpleLoadingScreen from "./childScreens/SimpleLoadingScreen.js";
import { useGameplayStore } from "@/client/store/useGameplayStore.js";
import { GAME_TYPES } from "@/shared/constants/GameTypes.js";

const PlayGameWrapper = ({ handleEndGame }: {
    handleEndGame: () => void
}) => {

    //Store Data
    const gameMode = useGameplayStore((s) => s.gameMode)

    useEffect(() => { console.log(gameMode) }, [gameMode])


    return (
        <>
            <Suspense fallback={<SimpleLoadingScreen loading={true} noAnimation={true} />}>
                {gameMode === GAME_TYPES.TREE_CHOP && <TreeGame handleEndGame={handleEndGame} />}
                {gameMode === GAME_TYPES.BAMBOO_SHOOT && <BambooShootGame handleEndGame={handleEndGame} />}
            </Suspense>
        </>
    );
};

export default PlayGameWrapper;
