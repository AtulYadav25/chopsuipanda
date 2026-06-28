import { useRespontToFriendRequest } from '@/client/hooks/friendship';
import { useRefreshPlayerProfile } from '@/client/hooks/player';
import { usePlayerStore } from '@/client/store/usePlayerStore'
import { useEffect } from 'react';

const FrensModal = ({
    handlePanelClose
}: {
    handlePanelClose: () => void
}) => {

    //Store Data
    const player = usePlayerStore((s) => s.player);

    // Mutations & Queries
    const { mutateAsync: respondToFriendRequest } = useRespontToFriendRequest();
    const { refetch: refreshPlayerProfile, isLoading } = useRefreshPlayerProfile();

    const handleRespondToFriendRequest = async (username: string, response: boolean) => {
        await respondToFriendRequest({
            friendUserName: username,
            accepted: response
        });

        await refreshPlayerProfile({ includeSocial: true })
    }

    useEffect(() => {
        refreshPlayerProfile({ includeSocial: true })
    }, [])

    return (
        <div className="font-Game fixed inset-0 bg-black/20 backdrop-blur z-200 flex items-center justify-center z-[201]">
            <div className="z-[201] h-[80vh] w-[90vw] bg-white rounded-2xl shadow-lg p-6 flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl text-blue-800">Friend Requests</h2>
                    <button className="text-blue-500 font-medium" onClick={handlePanelClose}>Back</button>
                </div>

                {/* Challenge Messages Scrollable */}
                {isLoading ?
                    <span className='font-Game text-2xl text-blue-800 text-center'>Loading...</span> :
                    <div className="flex-1 overflow-y-auto space-y-6">
                        {(player?.friendRequestsReceived?.length === 0) ?
                            <span className='font-Game text-md text-slate-800 text-center'>No Friend Requests</span> :
                            (player?.friendRequestsReceived?.map((fren) => {
                                return <div key={fren.username} className="border p-2 rounded-lg flex flex-col items-center bg-slate-100 py-4">
                                    <p className="text-md text-gray-700 mb-2 text-center">
                                        {fren.username} wants to be your fren
                                    </p>
                                    <div className="flex space-x-4">
                                        <button onClick={() => handleRespondToFriendRequest(fren.username, true)} className="px-6 py-2 bg-green-500 text-white rounded-md border-b-4 border-green-700 border-t-2 border-t-green-300">
                                            Accept
                                        </button>
                                        <button onClick={() => handleRespondToFriendRequest(fren.username, false)} className="px-6 py-2 bg-red-800 text-white rounded-md border-b-4 border-red-900 border-t-2 border-t-red-500">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            }))
                        }


                    </div>
                }

            </div>
        </div>


    )
}

export default FrensModal