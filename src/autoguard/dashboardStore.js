import { reactive, readonly } from 'vue';
import configRepository from '../services/config.js';

const CONFIG_KEY = 'VRCX_autoGuardConfig';
const state = reactive({
  enabled: true,
  rules: { 'hexed.cc': true, 'oversee.lol': true },
  events: [],
  scannedCount: 0,
  blockedCount: 0,
  failedCount: 0,
  initialized: false
});

function snapshot() {
  return { enabled: state.enabled, rules: { ...state.rules } };
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
    }
  } catch (error) {
    console.warn('[VRCX AutoGuard] Could not load settings:', error);
  }
  state.initialized = true;
}

async function persist() {
  try { await configRepository.setString(CONFIG_KEY, JSON.stringify(snapshot())); }
  catch (error) { console.error('[VRCX AutoGuard] Could not save settings:', error); }
}

export async function setAutoGuardEnabled(value) {
  state.enabled = Boolean(value);
  await persist();
}

export async function setAutoGuardRule(domain, value) {
  if (!(domain in state.rules)) return;
  state.rules[domain] = Boolean(value);
  await persist();
}

export function getEnabledAutoGuardDomains() {
  return Object.keys(state.rules).filter(domain => state.rules[domain]);
}

export function recordAutoGuardScan(entry = {}) {
  state.scannedCount += 1;
  recordAutoGuardEvent({ action: 'scanned', ...entry });
}

export function recordAutoGuardEvent(entry = {}) {
  const event = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(), ...entry };
  state.events.push(event);
  if (state.events.length > 200) state.events.splice(0, state.events.length - 200);
  if (event.action === 'blocked') state.blockedCount += 1;
  if (event.action === 'error') state.failedCount += 1;
}

export function useAutoGuardDashboardState() {
  return readonly(state);
}
