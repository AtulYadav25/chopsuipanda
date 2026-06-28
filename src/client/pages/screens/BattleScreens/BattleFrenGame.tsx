import { useState, useRef, Suspense, lazy } from "react";
import SimpleLoadingScreen from "../childScreens/SimpleLoadingScreen.js";
import { useGameplayStore } from "@/client/store/useGameplayStore.js";
import { useSubmitBattleScore } from "@/client/hooks/battleMatch.js";
import { useToast } from "@/client/context/ToastContext.js";
import BattleStartScreen from "./BattleStartScreen.js";
import BattleEndScreen from "./BattleEndScreen.js";
import BambooShootGameBattle from "./BambooShootGameBattle.js";
//Lazy Imports
// const KnifeNewGameChallenge = lazy(() => import('./ChallengeGames/KnifeNewGameChallenge.jsx'));
const TreeChopGameBattle = lazy(() => import('./TreeChopGameBattle.jsx'));


const BattleFrenGame = ({ handleEndGame }: {
    handleEndGame: () => void;
}) => {

    const [showBattleScreen, setShowBattleScreen] = useState(true);
    const [showGameOver, setShowGameOver] = useState(false);


    //Store Data
    const battleDetails = useGameplayStore((s) => s.battleDetails)
    const setBattleDetails = useGameplayStore((s) => s.setBattleDetails)

    //Mutations & Queries
    const { mutateAsync: submitBattleScoreToBackend } = useSubmitBattleScore();

    //Toast Context
    const { showToast } = useToast();

    const battleDetailsRef = useRef(battleDetails);

    const [loading, setLoading] = useState(true);
    const [winner, setWinner] = useState<{
        username: string
    }>({ username: 'Panda' });




    const submitBattleScore = async () => {
        //Send this score to backend and also add the score of user below the username
        if (!battleDetails) {
            return
        }
        try {
            setLoading(true);
            const dataFromServer = await submitBattleScoreToBackend({
                battleId: battleDetails?._id
            }, {
                onSuccess: () => {

                }
            });
            const { data } = dataFromServer
            if (!data.battle) return;
            setBattleDetails(data.battle)
            setLoading(false)
            setShowGameOver(true);
            battleDetailsRef.current = data.battle;

            if (!data.winner) return;
            setWinner({ username: data.winner ?? '' });

        } catch (error) {
            showToast({ type: "error", message: "Unable to connect to the server." });
        }


    }

    const handleStartGame = () => {
        setShowBattleScreen(false);
    };

    if (!battleDetails) return <SimpleLoadingScreen loading={true} noAnimation={true} />;

    return (
        <>
            {showBattleScreen && <BattleStartScreen battle={battleDetails} handleStartGame={handleStartGame} />}
            {showGameOver && <BattleEndScreen
                winner={winner}
                loading={loading}
                onReturnHome={handleEndGame}
            />}
            <Suspense fallback={<SimpleLoadingScreen loading={true} noAnimation={true} />}>
                {(battleDetails?.gameMode === 'TREE_CHOP' && !showBattleScreen) && <TreeChopGameBattle submitBattleScore={submitBattleScore} />}
                {(battleDetails?.gameMode === 'BAMBOO_SHOOT' && !showBattleScreen) && <BambooShootGameBattle submitBattleScore={submitBattleScore} />}
            </Suspense>
        </>
    );
};

export default BattleFrenGame;
