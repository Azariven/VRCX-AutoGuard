import {
    createAutoGuardState,
    createModerationQueue,
    recordPreview,
    recordResult,
    shouldProcess
} from './core.js';

/**
 * Runtime adapter for VRCX.
 * sendBlock must wrap VRCX playerModerationRequest.sendPlayerModeration().
 */
export function createAutoGuard({ config, sendBlock, onLog = () => {} }) {
    const state = createAutoGuardState(config);
    const queue = createModerationQueue({ sendBlock, onLog });

    async function handleCandidate({ userId, source, eventId = '', displayName = '' }) {
        const decision = shouldProcess(state, userId, source, eventId);
        if (decision.action === 'preview') {
            const entry = {
                status: 'preview',
                source,
                userId: decision.userId,
                displayName,
                message: 'Matched exact User ID; no block request was sent.'
            };
            recordPreview(state, decision.key, entry);
            onLog(entry);
            return { ...decision, entry };
        }
        if (decision.action !== 'block') return decision;

        try {
            await queue.enqueue(decision.userId);
            const entry = {
                status: 'blocked',
                source,
                userId: decision.userId,
                displayName,
                message: 'VRCX moderation request completed.'
            };
            recordResult(state, decision.key, entry);
            onLog(entry);
            return { ...decision, entry };
        } catch (error) {
            const entry = {
                status: 'error',
                source,
                userId: decision.userId,
                displayName,
                message: String(error?.message || error)
            };
            recordResult(state, decision.key, entry, { success: false });
            onLog(entry);
            return { ...decision, action: 'error', entry };
        }
    }

    return {
        state,
        handleCandidate,
        dispose: () => queue.dispose(),
        getLog: () => [...state.log]
    };
}
