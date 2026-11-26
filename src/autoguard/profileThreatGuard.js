import { normalizeUserId, createModerationQueue } from "./core.js";
import { detectProfileSignals } from "./accountRiskAssessment.js";

function collectProfileText(profile) {
  const links = Array.isArray(profile?.bioLinks) ? profile.bioLinks.map(link =>
    typeof link === "string" ? link : [link?.url, link?.uri, link?.text, link?.displayName].filter(Boolean).join(" ")
  ) : [];
  return [profile?.bio, ...links].filter(Boolean).join("\n");
}

/**
 * @param {{
 *  sendBlock: (userId: string) => Promise<unknown>,
 *  onLog?: (entry: Record<string, any>) => void,
 *  isEnabled?: () => boolean,
 *  getEnabledDomains?: () => string[],
 *  onScan?: (entry: Record<string, any>) => void,
 *  ensureReady?: () => Promise<void>,
 *  isWhitelisted?: (userId: string) => boolean
 * }} options
 */
export function createProfileThreatGuard({ sendBlock, onLog = () => {}, isEnabled = () => true, getEnabledDomains = () => ["hexed.cc", "oversee.lol"], onScan = () => {}, ensureReady = async () => {}, isWhitelisted = () => false }) {
  if (typeof sendBlock !== "function") throw new TypeError("sendBlock must be a function");
  const blocked = new Set();
  const inFlight = new Map();
  const queue = createModerationQueue({ sendBlock, maxRetries: 3, baseDelayMs: 1000,
    onLog: entry => onLog({ source: "profile-bio-domain", ...entry }) });

  async function inspect(profile, currentUserId = "", context = {}) {
    const userId = normalizeUserId(profile?.id);
    if (!userId || userId === normalizeUserId(currentUserId)) return { action: "ignore", reason: "invalid-or-current-user" };
    await ensureReady();
    const source = String(context.source || "profile-scan");
    if (isWhitelisted(userId)) {
      const entry = { action: "whitelisted", userId, displayName: String(profile?.displayName || ""), source };
      onLog(entry);
      return entry;
    }
    onScan({ userId, displayName: String(profile?.displayName || ""), source, eventId: String(context.eventId || "") });
    if (!isEnabled()) return { action: "disabled", userId, source };
    const signals = detectProfileSignals(collectProfileText(profile), getEnabledDomains());
    if (!signals.length) {
      const entry = { action: "no-match", userId, displayName: String(profile?.displayName || ""), source };
      onLog(entry);
      return entry;
    }
    if (blocked.has(userId)) return { action: "already-blocked", userId, signals };
    if (inFlight.has(userId)) return inFlight.get(userId);

    const task = queue.enqueue(userId)
      .then(result => {
        blocked.add(userId);
        const entry = { action: "blocked", userId, displayName: String(profile.displayName || ""), source,
          matchedDomains: signals.map(signal => signal.domain), matchedRules: signals.map(signal => signal.id) };
        onLog(entry);
        return entry;
      })
      .catch(error => {
        const entry = { action: "error", userId, displayName: String(profile.displayName || ""), source,
          matchedDomains: signals.map(signal => signal.domain), error: String(error?.message || error) };
        onLog(entry);
        return entry;
      })
      .finally(() => inFlight.delete(userId));
    inFlight.set(userId, task);
    return task;
  }

  return { inspect, getBlockedIds: () => [...blocked], dispose: () => queue.dispose() };
}
