import { useState, useRef, Suspense, lazy } from "react";

// import ChallengeScreen from './ChallengeGames/ChallengeScreen.jsx'
// import ChallengeEndScreen from './ChallengeGames/ChallengeEndScreen.jsx'

const TreeChopGameBattle = lazy(() => import('./TreeChopGameBattle.jsx'));
// const KnifeNewGameChallenge = lazy(() => import('./ChallengeGames/KnifeNewGameChallenge.jsx'));
import SimpleLoadingScreen from "../childScreens/SimpleLoadingScreen.js";
import { useGameplayStore } from "@/client/store/useGameplayStore.js";
import { useSubmitBattleScore } from "@/client/hooks/battleMatch.js";
import { useToast } from "@/client/context/ToastContext.js";


const BattleFrenGame = ({ handleEndGame }: {
    handleEndGame: () => void;
}) => {

    const [showChallengeScreen, setShowChallengeScreen] = useState(true);
    const [showGameOver, setShowGameOver] = useState(false);


    //Store Data
    const battleDetails = useGameplayStore((s) => s.battleDetails)
    const setBattleDetails = useGameplayStore((s) => s.setBattleDetails)

    //Mutations & Queries
    const { mutateAsync: submitBattleScoreToBackend } = useSubmitBattleScore();

    //Toast Context
    const { showToast } = useToast();

    const challengeDetailsRef = useRef(battleDetails);

    const [loading, setLoading] = useState(true);
    const [won, setWon] = useState<{
        username: string
    }>({ username: 'Panda' });




    const submitBattleScore = async () => {
        //Send this score to backend and also add the score of user below the username
        if (!battleDetails) {
            return
        }
        try {
            setLoading(true);
            await submitBattleScoreToBackend({
                battleId: battleDetails?._id
            }, {
                onSuccess: (dataFromServer) => {
                    const { data } = dataFromServer;
                    if (!data.battle || !data.winner) return;
                    setBattleDetails(data.battle)
                    challengeDetailsRef.current = data.battle;
                    setWon({ username: data.winner });

                    setLoading(false)
                    setShowGameOver(true);
                }
            });



        } catch (error) {
            showToast({ type: "error", message: "Unable to connect to the server." });
        }


    }

    const handleStartGame = () => {
        setShowChallengeScreen(false);
    };


    return (
        <>
            {/* {showChallengeScreen && <BattleStartScreen battle={battleDetails} handleStartGame={handleStartGame} />}
            {showGameOver && <BattleEndScreen
                battle={battleDetails}
                won={won}
                loading={loading}
                onReturnHome={handleEndGame}
            />} */}
            <Suspense fallback={<SimpleLoadingScreen loading={true} noAnimation={true} />}>
                {(battleDetails?.gameMode === 'TREE_CHOP' && !showChallengeScreen) && <TreeChopGameBattle submitBattleScore={submitBattleScore} />}
                {/* {(battleDetails?.gameMode === 'BAMBOO_SHOOT' && !showChallengeScreen) && <BambooShootGameBattle submitBattleScore={submitBattleScore} />} */}
            </Suspense>
        </>
    );
};

export default BattleFrenGame;
