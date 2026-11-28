/**
 * Coordinates VRCX room events and AutoGuard scanning.
 * The latest VRCX location event is authoritative for the active instance.
 * Avatar changes and room churn remain review-only telemetry.
 */
export function createDefensePipeline({
    autoGuard,
    threatMonitor,
    worldScanner,
    getProfile = () => null,
    getWhitelist = () => [],
    onAlert = () => {},
    onEvent = () => {}
}) {
    let activeInstanceId = '';

    async function onLocationChanged(location = '') {
        activeInstanceId = String(location || '');
        if (worldScanner && typeof worldScanner.enterWorld === 'function') {
            const players = [];
            worldScanner.enterWorld({
                currentLocation: activeInstanceId,
                players,
                currentUserId: ''
            });
        }
        onEvent({ type: 'location-changed', location: activeInstanceId });
        return { location: activeInstanceId };
    }

    async function onPlayerJoin({ userId, displayName = '', location = '', instanceId = '', timestamp, profile } = {}) {
        // VRCX's location transition event is authoritative; the player event can
        // carry a stale cached location while the new room roster is being applied.
        const roomId = activeInstanceId || instanceId || location;
        const telemetry = threatMonitor?.recordJoin(userId, {
            displayName,
            location: roomId,
            timestamp
        });
        if (telemetry?.status === 'alert') onAlert(telemetry.alert);

        let scan = null;
        if (worldScanner && typeof worldScanner.playerJoined === 'function') {
            scan = await worldScanner.playerJoined({
                userId,
                displayName,
                location: roomId,
                timestamp,
                profile: profile || getProfile(userId)
            });
        } else {
            const moderation = await autoGuard?.handleCandidate({
                userId,
                source: 'instance-join',
                eventId: [roomId, timestamp ?? ''].join(':'),
                displayName
            });
            scan = moderation;
        }
        return { telemetry, scan };
    }

    async function onPlayerLeave({ userId, displayName = '', location = '', timestamp } = {}) {
        const roomId = activeInstanceId || location;
        const telemetry = threatMonitor?.recordLeave(userId, {
            displayName,
            location: roomId,
            timestamp
        });
        if (telemetry?.status === 'alert') onAlert(telemetry.alert);
        if (worldScanner && typeof worldScanner.playerLeft === 'function') {
            await worldScanner.playerLeft(userId, timestamp);
        }
        return { telemetry };
    }

    async function onAvatarChange({ userId, displayName = '', avatarName = '', location = '', timestamp } = {}) {
        const telemetry = threatMonitor?.recordAvatarChange(userId, {
            displayName,
            avatarName,
            location: activeInstanceId || location,
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

    async function onInitialRoster(players = []) {
        if (!worldScanner || typeof worldScanner.enterWorld !== 'function') {
            return { action: 'scanner-unavailable' };
        }
        worldScanner.enterWorld({
            currentLocation: activeInstanceId,
            players,
            currentUserId: ''
        });
        const results = [];
        for (const player of players) {
            const userId = player?.userId || player?.id;
            if (!userId) continue;
            const profile = player.profile || getProfile(userId);
            if (profile && typeof worldScanner.profileAvailable === 'function') {
                results.push(await worldScanner.profileAvailable(userId));
            } else if (typeof worldScanner.playerJoined === 'function') {
                results.push(await worldScanner.playerJoined({
                    ...player,
                    location: activeInstanceId
                }));
            }
        }
        return { action: 'roster-processed', count: results.length, results };
    }

    return {
        onLocationChanged,
        onPlayerJoin,
        onPlayerLeave,
        onAvatarChange,
        onFriendRequest,
        onInitialRoster
    };
}
