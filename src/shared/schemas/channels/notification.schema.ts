
export type NotificationType = 'friendRequestSent' | 'friendRequestAccepted' | 'battleChallenge' | 'battleResult';

export interface NotificationPayload {
    type: NotificationType;
    message: string;
    /** id of the related entity, e.g. the friend request id or challenge id */
    referenceId: string;
}