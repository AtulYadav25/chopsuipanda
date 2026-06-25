import { Suspense, lazy } from "react";

// import KnifeNewGame from "./KnifeGame/KnifeNewGame";
// const KnifeNewGame = lazy(() => import('./KnifeGame/KnifeNewGame.jsx'));
// import TreeGame from "./Games/TreeGame";
const TreeGame = lazy(() => import('./GameScreens/TreeChopGame'));

import SimpleLoadingScreen from "./childScreens/SimpleLoadingScreen.js";
import { useGameplayStore } from "@/client/store/useGameplayStore.js";
import { GAME_TYPES } from "@/shared/constants/GameTypes.js";

const PlayGameWrapper = ({ handleEndGame }: {
    handleEndGame: () => void
}) => {

    //Store Data
    const gameMode = useGameplayStore((s) => s.gameMode)


    return (
        <>
            <Suspense fallback={<SimpleLoadingScreen loading={true} noAnimation={true} />}>
                {gameMode === GAME_TYPES.TREE_CHOP && <TreeGame handleEndGame={handleEndGame} />}
                {/* {gameMode === GAME_TYPES.BAMBOO_SHOOT && <KnifeNewGame handleEndGame={handleEndGame} {...gameFunctions} />} */}
            </Suspense>
        </>
    );
};

export default PlayGameWrapper;
