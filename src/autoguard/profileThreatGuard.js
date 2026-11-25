import { normalizeUserId, createModerationQueue } from "./core.js";
import { detectProfileSignals } from "./accountRiskAssessment.js";

function collectProfileText(profile) {
  const links = Array.isArray(profile?.bioLinks) ? profile.bioLinks.map(link =>
    typeof link === "string" ? link : [link?.url, link?.uri, link?.text, link?.displayName].filter(Boolean).join(" ")
  ) : [];
  return [profile?.bio, ...links].filter(Boolean).join("\n");
}

/** Scan loaded public profiles and immediately send a VRChat block request on a designated domain match. */
export function createProfileThreatGuard({ sendBlock, onLog = () => {} } = {}) {
  if (typeof sendBlock !== "function") throw new TypeError("sendBlock must be a function");
  const blocked = new Set();
  const inFlight = new Map();
  const queue = createModerationQueue({
    sendBlock, maxRetries: 3, baseDelayMs: 1000,
    onLog: entry => onLog({ source: "profile-bio-domain", ...entry })
  });

  async function inspect(profile, currentUserId = "") {
    const userId = normalizeUserId(profile?.id);
    if (!userId || userId === normalizeUserId(currentUserId)) return { action: "ignore", reason: "invalid-or-current-user" };
    const signals = detectProfileSignals(collectProfileText(profile));
    if (!signals.length) return { action: "no-match", userId };
    if (blocked.has(userId)) return { action: "already-blocked", userId, signals };
    if (inFlight.has(userId)) return inFlight.get(userId);

    const task = queue.enqueue(userId)
      .then(result => {
        blocked.add(userId);
        const entry = { action: "blocked", userId, displayName: String(profile.displayName || ""),
          matchedDomains: signals.map(signal => signal.domain), matchedRules: signals.map(signal => signal.id),
          moderationResult: result };
        onLog(entry);
        return entry;
      })
      .catch(error => {
        const entry = { action: "error", userId, displayName: String(profile.displayName || ""),
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
