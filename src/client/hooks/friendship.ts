import { useMutation } from "@tanstack/react-query";
import { friendshipClientModule } from "../modules";


export function useSendFriendRequest() {
    return useMutation(friendshipClientModule.mutation('sendFriendRequest'));
}

export function useRespontToFriendRequest() {
    return useMutation(friendshipClientModule.mutation('acceptFriendRequest'));
}

export function useDeleteFriend() {
    return useMutation(friendshipClientModule.mutation('deleteFriend'));
}
