// src/client/stores/notificationStore.ts
//
// Holds the current notification to display, plus a queue for anything
// that arrives while gameplay is active. Notifications received mid-game
// aren't dropped — they're queued and shown once gameplay ends, which
// matters for things like a battle challenge you don't want to silently
// lose just because the recipient was mid-match.

import { create } from 'zustand';
import type { NotificationPayload } from '@/shared/schemas/channels/notification.schema';

interface NotificationState {
    current: NotificationPayload | null;
    queue: NotificationPayload[];
    enqueue: (payload: NotificationPayload) => void;
    dismissCurrent: () => void;
    flushQueue: () => void;
}

const AUTO_DISMISS_MS = 3600;

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
    current: null,
    queue: [],

    enqueue: (payload) => {
        const { current, queue } = get();
        if (current) {
            set({ queue: [...queue, payload] });
        } else {
            set({ current: payload });
            if (dismissTimer) clearTimeout(dismissTimer);
            dismissTimer = setTimeout(() => get().dismissCurrent(), AUTO_DISMISS_MS);
        }
    },

    dismissCurrent: () => {
        const { queue } = get();
        const [next, ...rest] = queue;
        set({ current: next ?? null, queue: rest });
        if (next) {
            if (dismissTimer) clearTimeout(dismissTimer);
            dismissTimer = setTimeout(() => get().dismissCurrent(), AUTO_DISMISS_MS);
        }
    },

    // Called when gameplay ends, to start draining anything that piled up
    // while isPlaying was true.
    flushQueue: () => {
        const { current, queue } = get();
        if (current || queue.length === 0) return;
        const [next, ...rest] = queue;
        set({ current: next, queue: rest });
        if (dismissTimer) clearTimeout(dismissTimer);
        dismissTimer = setTimeout(() => get().dismissCurrent(), AUTO_DISMISS_MS);
    },
}));