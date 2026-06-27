// src/server/channels/notificationServerChannel.ts
//
// Replaces the old generic `sendNotification(type, walletAddress, message, id)`
// utility, which sent to `io.to(socketId)` directly.
//
// Scope, per spec: this channel is only used for two notification kinds —
// friend requests and battle challenge requests. Each user joins a channel
// keyed by their own wallet address, so broadcasting to that id reaches only
// them (see notifications.ts in /methods for the access-control note).

import { ServerChannel } from 'modelence/server';
import { NotificationPayload } from '@/shared/schemas/channels/notification.schema';

const notificationServerChannel = new ServerChannel<NotificationPayload>('notifications', async ({ user }) => {
    // Only authenticated users can join
    if (!user) {
        return false;
    }

    return true;
}
);

export default notificationServerChannel;