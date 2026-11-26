import test from 'node:test';
import assert from 'node:assert/strict';
import { FRIEND_REVIEW_DEFAULTS, getFriendReviewState } from '../src/autoguard/friendReviewPolicy.js';

test('new friend gets a reminder after 30 minutes, then a five-minute grace period', () => {
  const addedAt = 1_000_000;
  assert.equal(getFriendReviewState({ timestamp: addedAt }, addedAt + 29 * 60_000).state, 'waiting');
  assert.equal(getFriendReviewState({ timestamp: addedAt }, addedAt + 30 * 60_000).state, 'reminder-due');
  assert.equal(getFriendReviewState({ timestamp: addedAt }, addedAt + 34 * 60_000 + 59_999).state, 'reminder-due');
  assert.equal(getFriendReviewState({ timestamp: addedAt }, addedAt + 35 * 60_000).state, 'action-due');
});

test('automatic blocking is opt-in and approved friends never become due', () => {
  const addedAt = 1_000_000, now = addedAt + 35 * 60_000;
  assert.equal(getFriendReviewState({ timestamp: addedAt }, now).due, false);
  assert.equal(getFriendReviewState({ timestamp: addedAt, status: 'approved' }, now,
    { ...FRIEND_REVIEW_DEFAULTS, autoBlockEnabled: true }).due, false);
  assert.equal(getFriendReviewState({ timestamp: addedAt }, now,
    { ...FRIEND_REVIEW_DEFAULTS, autoBlockEnabled: true }).due, true);
});
