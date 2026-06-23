import { useAcceptBattleChallenge, useGetMyActiveBattles, useRejectBattleChallenge } from '@/client/hooks/battleMatch'
import { GAME_TYPES, GAME_TYPES_UI } from '@/shared/constants/GameTypes'
import React, { useEffect } from 'react'

const BattleModal = ({
    handlePanelClose
}: {
    handlePanelClose: () => void
}) => {

    //Mutations & Queries
    const { data, isLoading } = useGetMyActiveBattles();
    const battles = data?.data

    const { mutateAsync: handleAcceptChallenge } = useAcceptBattleChallenge();
    const { mutateAsync: handleRejectChallenge } = useRejectBattleChallenge();

    return (
        <div className="font-Game fixed inset-0 bg-black/20 backdrop-blur z-200 flex items-center justify-center z-[201]">
            <div className="z-[201] h-[80vh] w-[90vw] bg-white rounded-2xl shadow-lg p-6 flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl text-blue-800">Your Challenges</h2>
                    <button className="text-blue-500 font-medium" onClick={handlePanelClose}>Back</button>
                </div>

                {/* Challenge Messages Scrollable */}
                <div className="flex-1 overflow-y-auto space-y-6">
                    {((isLoading)) ?
                        <span className='font-Game text-2xl text-blue-800 text-center'>Loading...</span> :
                        (battles?.length === 0 ? <span className='font-Game text-md text-slate-600 text-center'>No Challenges</span> : battles?.map((battle) => {
                            return <div key={battle.challenger.username} className="border p-2 rounded-lg flex flex-col items-center bg-slate-100 py-4">
                                <p className="text-md text-gray-700 mb-2 text-center">
                                    Your fren {battle.challenger.username} challenges you in {GAME_TYPES_UI[battle.gameMode]} for
                                </p>
                                <h2 className="text-3xl text-blue-600 mb-3 text-center">
                                    {(battle.wagerAmount).toLocaleString()} CHI
                                </h2>
                                <div className="flex space-x-4">
                                    <button onClick={() => handleAcceptChallenge({ battleId: battle._id })} className="px-6 py-2 bg-green-500 text-white rounded-md border-b-4 border-green-700 border-t-2 border-t-green-300">
                                        Accept
                                    </button>
                                    <button onClick={() => handleRejectChallenge({ battleId: battle._id })} className="px-6 py-2 bg-red-800 text-white rounded-md border-b-4 border-red-900 border-t-2 border-t-red-500">
                                        Reject
                                    </button>
                                </div>
                            </div>
                        }))
                    }
                </div>

            </div>
        </div>

    )
}

export default BattleModal