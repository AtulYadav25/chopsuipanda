import { usePlayerStore } from '@/client/store/usePlayerStore'
import React from 'react'

const InboxModal = ({
    handlePanelClose
}: {
    handlePanelClose: () => void
}) => {

    //Store Data
    const player = usePlayerStore((s) => s.player)

    function formatDateToDayMonth(dateInput: Date) {
        const date = new Date(dateInput);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        return `${day} ${month}`;
    }

    return (
        <div className="font-Game fixed inset-0 bg-black/20 backdrop-blur z-200 flex items-center justify-center"> <div className="pt-[10%] z-[201] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[82vh] w-[95vw] bg-white rounded-2xl shadow-lg p-6 flex z-[201] flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl text-blue-800">Your Inbox</h2>
                <button className="text-blue-500 font-medium" onClick={handlePanelClose}>Back</button>
            </div>

            {/* Notifications */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Example Notification */}
                {player!.notifications?.length > 0 &&
                    player?.notifications?.map((notific) => {

                        return <div key={notific.createdAt.toDateString()} className="border p-4 rounded-lg relative bg-slate-100">
                            <p className="text-gray-700">
                                {notific.message}
                            </p>
                            <div className='flex justify-between mt-2'>
                                <span></span>
                                <span className="text-sm text-gray-400 ">
                                    {formatDateToDayMonth(notific.createdAt)}
                                </span>
                            </div>
                        </div>
                    })}


                {/* Add more notifications like this */}
            </div>
        </div>
        </div>
    )
}

export default InboxModal