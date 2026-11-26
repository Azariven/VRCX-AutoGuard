// @ts-nocheck
import { reactive, readonly } from 'vue';
import configRepository from '../services/config.js';
import { FRIEND_REVIEW_DEFAULTS, getFriendReviewState } from './friendReviewPolicy.js';

const CONFIG_KEY = 'VRCX_autoGuardConfig';
const state = reactive({
  enabled: true,
  rules: { 'hexed.cc': true, 'oversee.lol': true },
  whitelist: [],
  pendingApprovals: [],
  pendingFriends: [],
  friendReviewSettings: { ...FRIEND_REVIEW_DEFAULTS },
  events: [],
  scannedCount: 0,
  blockedCount: 0,
  failedCount: 0,
  initialized: false
});

function snapshot() {
  return { enabled: state.enabled, rules: { ...state.rules }, whitelist: [...state.whitelist], pendingFriends: [...state.pendingFriends], friendReviewSettings: { ...state.friendReviewSettings } };
}
export async function initAutoGuardStore() {
  if (state.initialized) return;
  try {
    const raw = await configRepository.getString(CONFIG_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (typeof saved.enabled === 'boolean') state.enabled = saved.enabled;
      for (const domain of Object.keys(state.rules)) {
        if (typeof saved.rules?.[domain] === 'boolean') state.rules[domain] = saved.rules[domain];
      }
      if (Array.isArray(saved.whitelist)) state.whitelist = [...new Set(saved.whitelist.filter(x => typeof x === 'string'))];
      if (Array.isArray(saved.pendingFriends)) state.pendingFriends = saved.pendingFriends.filter(x => x && typeof x.userId === 'string');
      if (saved.friendReviewSettings && typeof saved.friendReviewSettings === 'object') {
        state.friendReviewSettings = { ...FRIEND_REVIEW_DEFAULTS, ...saved.friendReviewSettings,
          autoBlockEnabled: saved.friendReviewSettings.autoBlockEnabled === true };
      }
    }
  } catch (error) { console.warn('[VRCX AutoGuard] Could not load settings:', error); }
  state.initialized = true;
}
async function persist() {
  try { await configRepository.setString(CONFIG_KEY, JSON.stringify(snapshot())); }
  catch (error) { console.error('[VRCX AutoGuard] Could not save settings:', error); }
}
export async function setAutoGuardEnabled(value) { state.enabled = Boolean(value); await persist(); }
export async function setAutoGuardRule(domain, value) {
  if (!(domain in state.rules)) return;
  state.rules[domain] = Boolean(value); await persist();
}
export async function addAutoGuardWhitelist(userId) {
  const id = String(userId || '').trim();
  if (!/^usr_[0-9a-f-]{36}$/i.test(id)) return false;
  if (!state.whitelist.includes(id)) state.whitelist.push(id);
  state.pendingApprovals = state.pendingApprovals.filter(x => x.userId !== id);
  state.pendingFriends = state.pendingFriends.filter(x => x.userId !== id);
  await persist(); return true;
}
export async function removeAutoGuardWhitelist(userId) {
  state.whitelist = state.whitelist.filter(id => id !== userId); await persist();
}
export function getAutoGuardWhitelist() { return [...state.whitelist]; }
export function recordAutoGuardPendingFriend(friend = {}) {
  const userId = String(friend.userId || '').trim();
  if (!/^usr_[0-9a-f-]{36}$/i.test(userId) || state.whitelist.includes(userId)) return;
  if (state.pendingFriends.some(item => item.userId === userId)) return;
  state.pendingFriends.unshift({
    userId, displayName: String(friend.displayName || ''),
    timestamp: friend.timestamp || new Date().toISOString(),
    source: friend.source || 'unknown', status: 'pending', reminderSent: false
  });
  if (state.pendingFriends.length > 200) state.pendingFriends.length = 200;
  recordAutoGuardEvent({ action: 'friend-pending-approval', userId,
    displayName: friend.displayName || '', reason: 'new-friend-awaiting-manual-whitelist' });
  void persist();
}
export async function confirmAutoGuardFriend(userId) {
  return addAutoGuardWhitelist(userId);
}
export async function setAutoGuardFriendReviewSettings(patch = {}) {
  state.friendReviewSettings = { ...state.friendReviewSettings, ...patch,
    autoBlockEnabled: patch.autoBlockEnabled === true ? true :
      patch.autoBlockEnabled === false ? false : state.friendReviewSettings.autoBlockEnabled };
  await persist();
}
export function getAutoGuardFriendReviewActions(now = Date.now()) {
  const actions = [];
  for (const item of state.pendingFriends) {
    if (item.status !== 'pending') continue;
    const review = getFriendReviewState(item, now, state.friendReviewSettings);
    if (review.state === 'reminder-due' && !item.reminderSent) {
      item.reminderSent = true;
      actions.push({ type: 'reminder', userId: item.userId, displayName: item.displayName, actionAt: review.actionAt });
    } else if (review.state === 'action-due' && state.friendReviewSettings.autoBlockEnabled && !item.actionStarted) {
      item.actionStarted = true;
      actions.push({ type: 'auto-block-due', userId: item.userId, displayName: item.displayName,
        inviteMessageSlot: state.friendReviewSettings.inviteMessageSlot });
    }
  }
  return actions;
}
export async function completeAutoGuardFriendReview(userId, outcome) {
  const item = state.pendingFriends.find(x => x.userId === userId);
  if (item) { item.status = outcome; item.actionStarted = false; }
  await persist();
}
export async function dismissAutoGuardPendingFriend(userId) {
  state.pendingFriends = state.pendingFriends.filter(item => item.userId !== userId);
  await persist();
}
export function getEnabledAutoGuardDomains() { return Object.keys(state.rules).filter(domain => state.rules[domain]); }
export function recordAutoGuardScan(entry = {}) {
  state.scannedCount += 1; recordAutoGuardEvent({ action: 'scanned', ...entry });
}
export function recordAutoGuardEvent(entry = {}) {
  const event = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(), ...entry };
  state.events.push(event);
  if (state.events.length > 200) state.events.splice(0, state.events.length - 200);
  if (event.action === 'blocked') state.blockedCount += 1;
  if (event.action === 'error') state.failedCount += 1;
  if (event.action === 'pending-approval' && event.userId &&
      !state.whitelist.includes(event.userId) &&
      !state.pendingApprovals.some(x => x.userId === event.userId)) {
    state.pendingApprovals.unshift({ userId: event.userId, displayName: event.displayName || '', timestamp: event.timestamp });
  }
}
export function useAutoGuardDashboardState() { return readonly(state); }
