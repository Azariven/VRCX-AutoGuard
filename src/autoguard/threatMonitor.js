/**
 * Defensive behavior telemetry for suspected avatar-ripping bot activity.
 *
 * VRChat/VRCX logs do not prove that a player cloned or downloaded an avatar.
 * These signals are heuristic alerts only and never trigger automatic blocks.
 */
import { normalizeUserId } from './core.js';

const DEFAULTS = Object.freeze({
    enabled: true,
    joinWindowMs: 120_000,
    // Number of re-entries, not raw join lines. A leave is required between joins.
    repeatedJoinThreshold: 3,
    avatarChangeWindowMs: 180_000,
    avatarChangeThreshold: 4,
    maxEventsPerUser: 40,
    // Bound memory use if a busy instance produces many unique user IDs.
    maxTrackedUsers: 2_000,
    maxAlerts: 300
});

export function createThreatMonitor(options = {}) {
    const config = { ...DEFAULTS, ...options };
    const maxEventsPerUser = Number.isInteger(config.maxEventsPerUser) && config.maxEventsPerUser > 0
        ? config.maxEventsPerUser : DEFAULTS.maxEventsPerUser;
    const maxTrackedUsers = Number.isInteger(config.maxTrackedUsers) && config.maxTrackedUsers > 0
        ? config.maxTrackedUsers : DEFAULTS.maxTrackedUsers;
    const maxAlerts = Number.isInteger(config.maxAlerts) && config.maxAlerts > 0
        ? config.maxAlerts : DEFAULTS.maxAlerts;
    const eventsByUser = new Map();
    const alerts = [];
    const emittedAlertKeys = new Set();

    function forgetUser(userId) {
        eventsByUser.delete(userId);
        const prefix = userId + ':';
        for (const key of emittedAlertKeys) {
            if (key.startsWith(prefix)) emittedAlertKeys.delete(key);
        }
    }

    function addEvent(userId, event) {
        const normalizedId = normalizeUserId(userId);
        if (!normalizedId) {
            return { status: 'ignored', reason: 'missing-or-invalid-user-id' };
        }
        if (!config.enabled) return { status: 'disabled' };

        const now = Number.isFinite(event.timestamp) ? event.timestamp : Date.now();
        let history = eventsByUser.get(normalizedId);
        if (!history) {
            // Map preserves insertion order, so the oldest inactive user is evicted first.
            while (eventsByUser.size >= maxTrackedUsers) {
                const oldestUserId = eventsByUser.keys().next().value;
                if (!oldestUserId) break;
                forgetUser(oldestUserId);
            }
            history = [];
        }
        history.push({ ...event, timestamp: now });
        while (history.length > maxEventsPerUser) history.shift();
        // Refresh insertion order so active users are less likely to be evicted.
        eventsByUser.delete(normalizedId);
        eventsByUser.set(normalizedId, history);
        return evaluate(normalizedId, history, now);
    }

    function countReentries(history, now) {
        let lastJoinAt = null;
        let leaveAfterJoin = false;
        let reentries = 0;

        for (const item of history) {
            if (item.type === 'join') {
                const isInWindow = now >= item.timestamp &&
                    now - item.timestamp <= config.joinWindowMs;
                const followsRecentJoin = lastJoinAt !== null &&
                    item.timestamp >= lastJoinAt &&
                    item.timestamp - lastJoinAt <= config.joinWindowMs;

                if (leaveAfterJoin && isInWindow && followsRecentJoin) {
                    reentries += 1;
                }
                lastJoinAt = item.timestamp;
                leaveAfterJoin = false;
            } else if (item.type === 'leave' &&
                lastJoinAt !== null &&
                item.timestamp >= lastJoinAt) {
                leaveAfterJoin = true;
            }
        }
        return reentries;
    }

    function evaluate(userId, history, now) {
        const reentryCount = countReentries(history, now);
        const avatarChangeCount = history.filter(
            (x) => x.type === 'avatar-change' &&
                now >= x.timestamp &&
                now - x.timestamp <= config.avatarChangeWindowMs
        ).length;

        const findings = [];
        if (reentryCount >= config.repeatedJoinThreshold) {
            findings.push({
                code: 'repeated-rejoins',
                count: reentryCount,
                windowMs: config.joinWindowMs,
                severity: 'review'
            });
        }
        if (avatarChangeCount >= config.avatarChangeThreshold) {
            findings.push({
                code: 'rapid-avatar-switching',
                count: avatarChangeCount,
                windowMs: config.avatarChangeWindowMs,
                severity: 'review'
            });
        }
        if (!findings.length) return { status: 'recorded', findings: [] };

        // One alert per user + finding combination avoids flooding the UI on
        // every subsequent log line after a threshold has already been crossed.
        const alertKey = userId + ':' + findings.map((x) => x.code).sort().join(',');
        if (emittedAlertKeys.has(alertKey)) {
            return { status: 'alert-already-reported', findings };
        }
        emittedAlertKeys.add(alertKey);

        const alert = {
            userId,
            at: new Date(now).toISOString(),
            findings,
            action: 'manual-review-only',
            note: 'Behavior is not proof of avatar theft. No moderation action was taken.'
        };
        alerts.unshift(alert);
        if (alerts.length > maxAlerts) alerts.length = maxAlerts;
        return { status: 'alert', alert };
    }

    return {
        recordJoin: (userId, metadata = {}) => addEvent(userId, { type: 'join', ...metadata }),
        recordLeave: (userId, metadata = {}) => addEvent(userId, { type: 'leave', ...metadata }),
        recordAvatarChange: (userId, metadata = {}) =>
            addEvent(userId, { type: 'avatar-change', ...metadata }),
        getAlerts: () => [...alerts],
        clear: () => {
            eventsByUser.clear();
            alerts.length = 0;
            emittedAlertKeys.clear();
        },
        // Exposed for diagnostics and bounded-memory tests, not UI mutation.
        getStats: () => ({
            trackedUsers: eventsByUser.size,
            alertCount: alerts.length,
            emittedAlertKeys: emittedAlertKeys.size,
            maxTrackedUsers
        })
    };
}

export { DEFAULTS as DEFAULT_THREAT_MONITOR_CONFIG };
