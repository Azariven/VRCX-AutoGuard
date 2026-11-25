import { playerModerationRequest } from '../api';
import { createAutoGuard } from './service.js';
import { DEFAULT_AUTOGUARD_CONFIG } from './config.js';

/**
 * Creates AutoGuard using VRCX's existing authenticated moderation API.
 * Import this from VRCX source only after the API layer is initialized.
 */
export function createVrcxAutoGuard({ config = DEFAULT_AUTOGUARD_CONFIG, onLog } = {}) {
    return createAutoGuard({
        config,
        sendBlock: (userId) =>
            playerModerationRequest.sendPlayerModeration({
                moderated: userId,
                type: 'block'
            }),
        onLog
    });
}

export function handleAutoGuardFriendRequest(autoGuard, notification) {
    if (!autoGuard || notification?.type !== 'friendRequest') {
        return Promise.resolve({ action: 'ignore' });
    }
    return autoGuard.handleCandidate({
        userId: notification.senderUserId,
        source: 'friend-request',
        eventId: notification.id || notification.notificationId || '',
        displayName: notification.senderUsername || ''
    });
}

export function handleAutoGuardPlayerJoin(autoGuard, { userId, displayName = '', location = '', dt = '' } = {}) {
    if (!autoGuard) return Promise.resolve({ action: 'disabled' });
    return autoGuard.handleCandidate({
        userId,
        source: 'instance-join',
        eventId: [location, dt].filter(Boolean).join(':'),
        displayName
    });
}
