const DOMAIN_RULES = [
  {
    id: "hexed-avatar-ripping-promotion",
    domain: "hexed.cc",
    category: "avatar-theft-promotion",
    severity: "high",
    rationale: "Profile promotes ripped avatars or one-click reuploading. This is a strong profile-level risk indicator, not proof of the account owner's conduct or account compromise."
  },
  {
    id: "oversee-user-tracking-promotion",
    domain: "oversee.lol",
    category: "privacy-invasive-tracking-promotion",
    severity: "medium",
    rationale: "Profile promotes tracking or stalking users. Treat as a privacy/safety concern, not direct evidence of avatar theft."
  }
];

const PHRASES = [
  { id: "ripped-avatar", pattern: /\b(ripped|rip|ripping)\s+(vrchat\s+)?avatars?\b/i, category: "avatar-theft-promotion", severity: "high" },
  { id: "reupload-avatars", pattern: /\b(reupload|re-upload|upload again)\b.{0,50}\bavatars?\b/i, category: "avatar-theft-promotion", severity: "high" },
  { id: "one-click-avatar-rip", pattern: /\bone[- ]click\b.{0,50}\b(rip|ripped|reupload|avatar)s?\b/i, category: "avatar-theft-promotion", severity: "high" },
  { id: "user-stalking", pattern: /\b(user stalking|stalk(ing)? users?|track(ing)? users?)\b/i, category: "privacy-invasive-tracking-promotion", severity: "medium" }
];

function normalizeText(value) {
  return String(value || "").normalize("NFKC").toLowerCase();
}

function detectProfileSignals(bio) {
  const text = normalizeText(bio);
  const signals = [];

  for (const rule of DOMAIN_RULES) {
    if (text.includes(rule.domain)) {
      signals.push({
        id: rule.id,
        category: rule.category,
        severity: rule.severity,
        evidence: rule.domain,
        rationale: rule.rationale
      });
    }
  }

  for (const rule of PHRASES) {
    const match = text.match(rule.pattern);
    if (match) {
      signals.push({
        id: rule.id,
        category: rule.category,
        severity: rule.severity,
        evidence: match[0],
        rationale: "Matched a profile phrase associated with the stated promotion."
      });
    }
  }

  return signals.filter((signal, index, all) =>
    all.findIndex(item => item.id === signal.id) === index
  );
}

/**
 * Assess observations without claiming identity, intent, or account compromise.
 * observedFriendAppearance must be supplied by a real VRCX event/history source;
 * never infer it merely because the current friend list contains the user.
 */
function assessAccountRisk(input = {}) {
  const profileSignals = detectProfileSignals(input.bio);
  const observations = [];

  if (input.observedFriendAppearance === true) {
    observations.push({
      id: "unexpected-friend-list-appearance",
      category: "relationship-state-anomaly",
      severity: "low",
      evidence: input.friendObservation || "User reports an unexpected appearance in the friend list.",
      rationale: "May reflect sync/cache behavior, an old relationship event, or an unrecognized action; not proof of account compromise."
    });
  }

  if (input.accountHistoryLooksEstablished === true) {
    observations.push({
      id: "established-account-history",
      category: "context-only",
      severity: "informational",
      evidence: input.accountHistoryNote || "Account appears to have a long usage history.",
      rationale: "Account age or trusted status does not prove safety and does not prove compromise."
    });
  }

  const categories = new Set(profileSignals.map(signal => signal.category));
  const hasHighRiskBio = profileSignals.some(signal => signal.severity === "high");
  const hasRelationshipAnomaly = observations.some(item => item.id === "unexpected-friend-list-appearance");

  let reviewLevel = "none";
  if (hasHighRiskBio) reviewLevel = "priority-manual-review";
  else if (profileSignals.length || hasRelationshipAnomaly) reviewLevel = "manual-review";

  return {
    reviewLevel,
    profileSignals,
    observations,
    combinedContext: hasHighRiskBio && hasRelationshipAnomaly
      ? "Profile promotion and an independently reported friend-list anomaly coexist. Investigate separately; this combination still does not establish account theft, impersonation, or avatar theft by this account."
      : null,
    categories: [...categories],
    automaticAction: "none",
    autoBlockAllowedFromTheseSignals: false
  };
}

module.exports = { assessAccountRisk, detectProfileSignals };
