import knownUsers from '../../data/known-users.json' with { type: 'json' };

/**
 * AutoGuard initial config.
 * The imported watchlist is preloaded, but enforcement remains disabled
 * and preview-only until the user explicitly enables it in VRCX settings.
 */
export const DEFAULT_AUTOGUARD_CONFIG = Object.freeze({
    enabled: false,
    previewOnly: true,
    autoBlockFriendRequests: false,
    autoBlockInstanceJoins: false,
    userIds: knownUsers.userIds,
    whitelist: []
});
