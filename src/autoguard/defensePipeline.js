/**
 * Combines exact-ID watchlist enforcement with behavior telemetry.
 * Only the exact-ID watchlist path can request a moderation action.
 */
export function createDefensePipeline({ autoGuard, threatMonitor, onAlert = () => {} }) {
    async function onPlayerJoin({ userId, displayName = '', location = '', timestamp } = {}) {
        const telemetry = threatMonitor?.recordJoin(userId, { displayName, location, timestamp });
        if (telemetry?.status === 'alert') onAlert(telemetry.alert);
        const moderation = await autoGuard?.handleCandidate({
            userId,
            source: 'instance-join',
            eventId: [location, timestamp ?? ''].join(':'),
            displayName
        });
        return { telemetry, moderation };
    }

    async function onPlayerLeave({ userId, displayName = '', location = '', timestamp } = {}) {
        const telemetry = threatMonitor?.recordLeave(userId, { displayName, location, timestamp });
        if (telemetry?.status === 'alert') onAlert(telemetry.alert);
        return { telemetry };
    }

    async function onAvatarChange({ userId, displayName = '', avatarName = '', location = '', timestamp } = {}) {
        const telemetry = threatMonitor?.recordAvatarChange(userId, {
            displayName,
            avatarName,
            location,
            timestamp
        });
        if (telemetry?.status === 'alert') onAlert(telemetry.alert);
        // Avatar switching is not proof of cloning or extraction. Never block on this signal.
        return { telemetry, moderation: { action: 'manual-review-only' } };
    }

    async function onFriendRequest(notification) {
        return autoGuard?.handleCandidate({
            userId: notification?.senderUserId,
            source: 'friend-request',
            eventId: notification?.id || notification?.notificationId || '',
            displayName: notification?.senderUsername || ''
        });
    }

    return { onPlayerJoin, onPlayerLeave, onAvatarChange, onFriendRequest };
}
