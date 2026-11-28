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

test('transient profile inspection failure can be retried when the profile is available again', async () => {
  const calls = [];
  let fail = true;
  const scanner = createWorldFocusedScanner({
    getProfile: userId => ({ id: userId, bio: '' }),
    inspectProfile: async profile => {
      calls.push(profile.id);
      if (fail) {
        fail = false;
        throw new Error('temporary API failure');
      }
      return { action: 'no-match' };
    }
  });
  scanner.enterWorld({ currentLocation: 'wrld_retry:instance', currentUserId: id(99) });
  const first = await scanner.playerJoined({ userId: id(5), timestamp: 5000 });
  assert.equal(first.action, 'error');
  const retry = await scanner.profileAvailable(id(5));
  assert.equal(retry.action, 'no-match');
  assert.deepEqual(calls, [id(5), id(5)]);
  assert.equal(scanner.getStats().scanned, 1);
});

test('a scan completing after room transition cannot mark the new room scan complete', async () => {
  let resolveFirst;
  const calls = [];
  const scanner = createWorldFocusedScanner({
    getProfile: userId => ({ id: userId, bio: '' }),
    inspectProfile: async profile => {
      calls.push(profile.id);
      if (calls.length === 1) return new Promise(resolve => { resolveFirst = resolve; });
      return { action: 'no-match' };
    }
  });
  scanner.enterWorld({ currentLocation: 'wrld_a:instance', currentUserId: id(99) });
  const first = scanner.playerJoined({ userId: id(6), timestamp: 6000 });
  await Promise.resolve();
  scanner.enterWorld({ currentLocation: 'wrld_b:instance', players: [{ userId: id(6) }], currentUserId: id(99) });
  resolveFirst({ action: 'no-match' });
  await first;
  const stats = scanner.getStats();
  assert.equal(stats.scanned, 0);
});

test('duplicate join events do not start concurrent profile inspections', async () => {
  let finish;
  const calls = [];
  const scanner = createWorldFocusedScanner({
    getProfile: userId => ({ id: userId, bio: '' }),
    inspectProfile: async profile => {
      calls.push(profile.id);
      return new Promise(resolve => { finish = resolve; });
    }
  });
  scanner.enterWorld({ currentLocation: 'wrld_concurrent:instance', currentUserId: id(99) });
  const first = scanner.playerJoined({ userId: id(7), timestamp: 7000 });
  await Promise.resolve();
  const duplicate = await scanner.playerJoined({ userId: id(7), timestamp: 7001 });
  assert.equal(duplicate.action, 'scan-in-progress');
  assert.deepEqual(calls, [id(7)]);
  finish({ action: 'no-match' });
  await first;
  assert.equal(scanner.getStats().scanned, 1);
});

test('initial roster is scanned through the same one-scan-per-session path', async () => {
  const calls = [];
  const scanner = createWorldFocusedScanner({
    getProfile: userId => ({ id: userId, bio: '' }),
    inspectProfile: async profile => { calls.push(profile.id); return { action: 'no-match' }; }
  });
  scanner.enterWorld({
    currentLocation: 'wrld_roster:instance',
    currentUserId: id(99),
    players: [{ userId: id(8) }, { userId: id(9) }]
  });
  const result = await scanner.scanInitialRoster();
  assert.equal(result.count, 2);
  assert.deepEqual(calls, [id(8), id(9)]);
  assert.equal(scanner.getStats().scanned, 2);
});