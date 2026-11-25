/**
 * VRCX AutoGuard core.
 * Strict User ID matching. No display-name or suffix matching.
 */
const USER_ID_RE = /^usr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCES = new Set(['friend-request', 'instance-join']);

export function normalizeUserId(value) {
    if (typeof value !== 'string') return '';
    const id = value.trim();
    return USER_ID_RE.test(id) ? id.toLowerCase() : '';
}

export function normalizeIdList(values = []) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.map(normalizeUserId).filter(Boolean))];
}

export function sanitizeConfig(config = {}) {
    return {
        enabled: config.enabled === true,
        previewOnly: config.previewOnly !== false,
        autoBlockFriendRequests: config.autoBlockFriendRequests === true,
        autoBlockInstanceJoins: config.autoBlockInstanceJoins === true,
        userIds: normalizeIdList(config.userIds),
        whitelist: normalizeIdList(config.whitelist)
    };
}

export function createAutoGuardState(config = {}) {
    const safe = sanitizeConfig(config);
    return {
        config: safe,
        userIds: new Set(safe.userIds),
        whitelist: new Set(safe.whitelist),
        pending: new Set(),
        processed: new Set(),
        // Preview observations are tracked separately. They must never suppress
        // a later explicit block after previewOnly is switched off.
        previewed: new Set(),
        log: []
    };
}

export function matchKnownUser(state, candidateId) {
    const userId = normalizeUserId(candidateId);
    if (!userId || state.whitelist.has(userId) || !state.userIds.has(userId)) return null;
    return { userId, source: 'exact-user-id' };
}

export function shouldProcess(state, candidateId, source, eventId = '') {
    if (!SOURCES.has(source)) return { action: 'unsupported-source' };
    if (!state.config.enabled) return { action: 'disabled' };
    const sourceEnabled =
        (source === 'friend-request' && state.config.autoBlockFriendRequests) ||
        (source === 'instance-join' && state.config.autoBlockInstanceJoins);
    if (!sourceEnabled) return { action: 'source-disabled' };

    const match = matchKnownUser(state, candidateId);
    if (!match) return { action: 'ignore' };

    const dedupeId = typeof eventId === 'string' && eventId.trim()
        ? eventId.trim()
        : match.userId;
    const key = source + ':' + match.userId + ':' + dedupeId;
    if (state.processed.has(key) || state.pending.has(key) ||
        (state.config.previewOnly && state.previewed.has(key))) {
        return { action: 'duplicate', ...match, key };
    }
    if (!state.config.previewOnly) state.pending.add(key);
    return {
        action: state.config.previewOnly ? 'preview' : 'block',
        key,
        ...match
    };
}

export function recordResult(state, key, entry, { success = true } = {}) {
    state.pending.delete(key);
    if (success) state.processed.add(key);
    state.log.unshift({ at: new Date().toISOString(), ...entry });
    if (state.log.length > 500) state.log.length = 500;
}

export function recordPreview(state, key, entry) {
    // Preview is deduplicated separately for the same source/user/event.
    // It is deliberately not marked as processed, so a later explicit
    // transition out of preview mode can still perform the moderation action.
    state.previewed.add(key);
    state.log.unshift({ at: new Date().toISOString(), ...entry });
    if (state.log.length > 500) state.log.length = 500;
}

/**
 * Serial moderation queue with bounded exponential backoff.
 * The caller must pass VRCX's existing authenticated moderation method.
 */
export function createModerationQueue({ sendBlock, onLog = () => {}, maxRetries = 3, baseDelayMs = 1000 }) {
    if (typeof sendBlock !== 'function') throw new TypeError('sendBlock must be a function');
    let queue = Promise.resolve();
    let disposed = false;

    async function block(userId) {
        let attempt = 0;
        while (true) {
            if (disposed) throw new Error('AutoGuard queue disposed');
            try {
                return await sendBlock(userId);
            } catch (error) {
                const status = Number(error?.status ?? error?.response?.status ?? error?.code);
                const message = String(error?.message || error);
                const limited = status === 429 || /\b429\b|rate.?limit/i.test(message);
                if (!limited || attempt >= maxRetries) throw error;
                const retryAfter = Number(error?.retryAfter ?? error?.response?.headers?.['retry-after']);
                const delay = Number.isFinite(retryAfter) && retryAfter > 0
                    ? Math.min(60000, retryAfter * 1000)
                    : Math.min(30000, baseDelayMs * (2 ** attempt));
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    return {
        enqueue(userId) {
            const task = queue.then(() => block(userId));
            queue = task.catch((error) => {
                onLog({ status: 'error', userId, message: String(error?.message || error) });
            });
            return task;
        },
        dispose() {
            disposed = true;
        }
    };
}

export { USER_ID_RE };
