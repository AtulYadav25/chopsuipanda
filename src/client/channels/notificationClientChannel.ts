// src/client/channels/notificationClientChannel.ts
//
// Receives friend-request and battle-challenge pushes from
// notificationServerChannel. Join with your own wallet address once
// authenticated (see usage example below).

import { ClientChannel } from 'modelence/client';
import { NotificationPayload } from '@/shared/schemas/channels/notification.schema';
import { useNotificationStore } from '../store/useNotificationStore';

const notificationClientChannel = new ClientChannel<NotificationPayload>(
    'notifications',
    (payload) => {
        useNotificationStore.getState().enqueue(payload);
    }
);

export default notificationClientChannel;