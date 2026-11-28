// @ts-nocheck
import { normalizeUserId, normalizeIdList } from './core.js';

const DEFAULTS = Object.freeze({
  recentFriendWindowMs: 7 * 24 * 60 * 60 * 1000,
  churnWindowMs: 30000, churnThreshold: 5,
  massLeaveWindowMs: 10000, massLeaveMinimum: 5, massLeaveRatio: 0.4,
  maxHistory: 200
});

/**
 * Schedules profile checks only for people in the active instance.
 * A new friend is eligible only when their recorded friend-added timestamp
 * is recent AND they are present in the active instance.
 */
export function createWorldFocusedScanner({
  inspectProfile, getProfile = () => null, getWhitelist = () => [],
  onEvent = () => {}, options = {}
} = {}) {
  if (typeof inspectProfile !== 'function') throw new TypeError('inspectProfile is required');
  const config = { ...DEFAULTS, ...options };
  let location = '', selfId = '', session = 0;
  const present = new Map(), scanned = new Set(), friendAddedAt = new Map();
  const timeline = [], pending = new Map(), inFlight = new Map();
  const whitelisted = id => normalizeIdList(getWhitelist()).includes(id);
  const emit = event => onEvent({ at: new Date().toISOString(), ...event });

  async function scan(userId, reason) {
    const id = normalizeUserId(userId);
    if (!id || id === selfId || !present.has(id) || whitelisted(id)) {
      return { action: 'ignored', reason: 'not-in-world-or-whitelisted' };
    }
    if (scanned.has(id)) return { action: 'already-scanned', userId: id };
    if (inFlight.get(id) === session) return { action: 'scan-in-progress', userId: id };
    const profile = getProfile(id);
    if (!profile) {
      pending.set(id, { reason, session });
      emit({ action: 'awaiting-profile', userId: id, reason });
      return { action: 'awaiting-profile', userId: id };
    }
    const scanSession = session;
    pending.delete(id);
    inFlight.set(id, scanSession);
    emit({ action: 'scan-started', userId: id, reason });
    try {
      const result = await inspectProfile(profile, selfId, { reason, location, session });
      if (scanSession !== session || !present.has(id)) return { action: 'stale-session', userId: id };
      scanned.add(id);
      if (result?.action === 'no-match') {
        emit({ action: 'pending-approval', userId: id,
          displayName: profile.displayName || '', status: 'safe-pending-confirmation', reason });
      }
      return result;
    } catch (error) {
      // A transient profile/API failure must not permanently mark this user scanned.
      if (scanSession === session && present.has(id)) {
        pending.set(id, { reason, session, retry: true });
      }
      emit({
        action: 'scan-error',
        userId: id,
        reason,
        message: String(error?.message || error)
      });
      return { action: 'error', userId: id, error };
    } finally {
      if (inFlight.get(id) === scanSession) inFlight.delete(id);
    }
  }

  async function profileAvailable(userId) {
    const id = normalizeUserId(userId), item = pending.get(id);
    if (!item || item.session !== session || !present.has(id)) return { action: 'ignored' };
    return scan(id, item.reason);
  }

  function setFriendAdded(userId, addedAt = Date.now()) {
    const id = normalizeUserId(userId);
    const at = typeof addedAt === 'number' ? addedAt : Date.parse(addedAt);
    if (id && Number.isFinite(at)) friendAddedAt.set(id, at);
  }

  function enterWorld({ currentLocation, players = [], currentUserId = '' } = {}) {
    session++;
    location = String(currentLocation || '');
    selfId = normalizeUserId(currentUserId);
    present.clear(); scanned.clear(); pending.clear(); inFlight.clear(); timeline.length = 0;
    for (const player of players) {
      const id = normalizeUserId(player.userId || player.id);
      if (id && id !== selfId) present.set(id, { ...player, joinedAt: player.joinedAt || Date.now() });
    }
    emit({ action: 'world-entered', location, playerCount: present.size });
  }

  async function scanInitialRoster() {
    const ids = [...present.keys()];
    const results = [];
    for (const id of ids) results.push(await scan(id, 'initial-roster'));
    return { action: 'roster-scanned', count: results.length, results };
  }

  function trim(now) {
    while (timeline.length && now - timeline[0].at > Math.max(config.churnWindowMs, config.massLeaveWindowMs)) timeline.shift();
    while (timeline.length > config.maxHistory) timeline.shift();
  }

  async function evaluate(now) {
    const churn = timeline.filter(x => now - x.at <= config.churnWindowMs);
    const rapid = churn.length >= config.churnThreshold;
    const leaves = timeline.filter(x => x.type === 'leave' && now - x.at <= config.massLeaveWindowMs);
    const before = present.size + leaves.length;
    const massLeave = leaves.length >= config.massLeaveMinimum && before > 0 &&
      leaves.length / before >= config.massLeaveRatio;
    if (!rapid && !massLeave) return;
    const reason = massLeave ? 'mass-departure' : 'rapid-room-churn';
    const candidates = [...present.entries()]
      .filter(([id]) => !whitelisted(id) && !scanned.has(id))
      .sort((a, b) => massLeave
        ? (b[1].joinedAt || 0) - (a[1].joinedAt || 0)
        : (a[1].joinedAt || 0) - (b[1].joinedAt || 0))
      .slice(0, 5);
    emit({ action: 'anomaly-rescan', reason, candidates: candidates.length });
    for (const [id] of candidates) await scan(id, reason);
  }

  async function playerJoined(player = {}) {
    const id = normalizeUserId(player.userId || player.id);
    if (!id || id === selfId) return { action: 'ignored' };
    const now = Number.isFinite(player.timestamp) ? player.timestamp : Date.now();
    present.set(id, { ...player, joinedAt: now });
    timeline.push({ id, type: 'join', at: now }); trim(now);
    const addedAt = friendAddedAt.get(id);
    const recentFriend = Number.isFinite(addedAt) && now >= addedAt &&
      now - addedAt <= config.recentFriendWindowMs;
    const result = await scan(id, recentFriend ? 'recent-friend-in-world' : 'world-player-joined');
    await evaluate(now);
    return result;
  }

  async function playerLeft(userId, timestamp = Date.now()) {
    const id = normalizeUserId(userId);
    if (!id || !present.has(id)) return { action: 'ignored' };
    present.delete(id);
    timeline.push({ id, type: 'leave', at: timestamp }); trim(timestamp);
    await evaluate(timestamp);
    return { action: 'left', userId: id };
  }

  function exitWorld() {
    location = ''; present.clear(); scanned.clear(); pending.clear(); inFlight.clear(); timeline.length = 0; session++;
  }

  return {
    setFriendAdded, enterWorld, scanInitialRoster, playerJoined, playerLeft, profileAvailable, exitWorld,
    isInCurrentWorld: id => present.has(normalizeUserId(id)),
    getStats: () => ({ location, present: present.size, scanned: scanned.size, pending: pending.size, inFlight: inFlight.size })
  };
}
