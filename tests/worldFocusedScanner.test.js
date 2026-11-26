import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldFocusedScanner } from '../src/autoguard/worldFocusedScanner.js';

const id = n => 'usr_12345678-1234-1234-1234-' + String(n).padStart(12, '0');

test('scans a current-world player once and ignores repeat join events', async () => {
  const calls = [];
  const scanner = createWorldFocusedScanner({
    getProfile: userId => ({ id: userId, bio: '' }),
    inspectProfile: async profile => { calls.push(profile.id); return { action: 'no-match' }; }
  });
  scanner.enterWorld({ currentLocation: 'wrld_test:private', currentUserId: id(99) });
  await scanner.playerJoined({ userId: id(1), timestamp: 1000 });
  await scanner.playerJoined({ userId: id(1), timestamp: 2000 });
  assert.deepEqual(calls, [id(1)]);
});

test('whitelist prevents profile inspection', async () => {
  let calls = 0;
  const scanner = createWorldFocusedScanner({
    getWhitelist: () => [id(2)], getProfile: userId => ({ id: userId }),
    inspectProfile: async () => { calls++; }
  });
  scanner.enterWorld({ currentLocation: 'private', currentUserId: id(99) });
  await scanner.playerJoined({ userId: id(2) });
  assert.equal(calls, 0);
});

test('recent friend-added timestamp is recognized only when the friend enters the world', async () => {
  const reasons = [], userId = id(3);
  const scanner = createWorldFocusedScanner({
    getProfile: id => ({ id, bio: '' }),
    inspectProfile: async (_profile, _self, context) => {
      reasons.push(context.reason); return { action: 'no-match' };
    }
  });
  scanner.setFriendAdded(userId, 1000);
  scanner.enterWorld({ currentLocation: 'public', currentUserId: id(99) });
  await scanner.playerJoined({ userId, timestamp: 2000 });
  assert.deepEqual(reasons, ['recent-friend-in-world']);
});

test('scans a newly joined non-friend in the active room exactly once', async () => {
  const calls = [];
  const scanner = createWorldFocusedScanner({
    getProfile: userId => ({ id: userId, bio: '' }),
    inspectProfile: async profile => {
      calls.push(profile.id);
      return { action: 'no-match' };
    }
  });
  scanner.enterWorld({ currentLocation: 'wrld_test:public', currentUserId: id(99) });
  // No friend-added timestamp is registered: this is an ordinary room visitor.
  await scanner.playerJoined({ userId: id(4), timestamp: 3000 });
  await scanner.playerJoined({ userId: id(4), timestamp: 4000 });
  assert.deepEqual(calls, [id(4)]);
});
