import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefensePipeline } from '../src/autoguard/defensePipeline.js';

const userId = 'usr_12345678-1234-1234-1234-123456789abc';

test('latest VRCX location transition wins over stale cached player location', async () => {
    const seen = [];
    const worldScanner = {
        enterWorld: () => {},
        playerJoined: async player => { seen.push(player.location); return { action: 'scanned' }; }
    };
    const pipeline = createDefensePipeline({ worldScanner });
    await pipeline.onLocationChanged('wrld_current:instance-new');
    await pipeline.onPlayerJoin({
        userId,
        displayName: 'Player',
        location: 'wrld_old:instance-old',
        instanceId: 'wrld_old:instance-old'
    });
    assert.deepEqual(seen, ['wrld_current:instance-new']);
});

test('player join falls back to event location before a location transition is seen', async () => {
    const seen = [];
    const worldScanner = {
        enterWorld: () => {},
        playerJoined: async player => { seen.push(player.location); return { action: 'scanned' }; }
    };
    const pipeline = createDefensePipeline({ worldScanner });
    await pipeline.onPlayerJoin({ userId, location: 'wrld_event:instance-1' });
    assert.deepEqual(seen, ['wrld_event:instance-1']);
});

test('avatar changes remain review-only and do not trigger AutoGuard moderation', async () => {
    let moderationCalls = 0;
    const pipeline = createDefensePipeline({
        autoGuard: { handleCandidate: async () => { moderationCalls++; } },
        threatMonitor: { recordAvatarChange: () => ({ status: 'recorded' }) }
    });
    const result = await pipeline.onAvatarChange({ userId, avatarName: 'Avatar' });
    assert.equal(result.moderation.action, 'manual-review-only');
    assert.equal(moderationCalls, 0);
});
