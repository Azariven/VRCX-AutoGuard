const PROMOTION_RULES = [
  {
    id: "hexed-avatar-ripping-promotion",
    domain: "hexed.cc",
    requiredPattern: /(?:millions?\s+of\s+)?ripped\s+avatars?.{0,100}(?:reupload|re-upload).{0,60}(?:one[- ]click|single\s+click)|(?:one[- ]click|single\s+click).{0,60}(?:reupload|re-upload).{0,60}ripped\s+avatars?/i,
    category: "avatar-theft-promotion",
    severity: "high",
    action: "block",
    rationale: "Exact domain plus explicit promotion of ripped avatars and one-click reuploading."
  },
  {
    id: "oversee-user-stalking-promotion",
    domain: "oversee.lol",
    requiredPattern: /(?:free\s+)?user\s+stalking|stalking\s+users?/i,
    category: "privacy-invasive-tracking-promotion",
    severity: "high",
    action: "block",
    rationale: "Exact domain plus explicit promotion of free user stalking/tracking."
  }
];

function normalizeText(value) {
  return String(value || "").normalize("NFKC").toLowerCase();
}

function detectProfileSignals(bio) {
  const text = normalizeText(bio);
  return PROMOTION_RULES
    .filter(rule => text.includes(rule.domain) && rule.requiredPattern.test(text))
    .map(rule => ({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      evidence: rule.domain,
      matchedText: text.match(rule.requiredPattern)?.[0] || "",
      rationale: rule.rationale,
      policyAction: rule.action
    }));
}

/**
 * Returns a policy decision for VRCX to execute.
 * A friend-list snapshot alone is not a newly-added event.
 * The caller must provide friendAddedEvent only from a confirmed VRCX event.
 */
function assessAccountRisk(input = {}) {
  const profileSignals = detectProfileSignals(input.bio);
  const observations = [];
  const isWhitelisted = input.isWhitelisted === true;

  if (input.friendAddedEvent === true) {
    observations.push({
      id: "unexpected-friend-added-event",
      category: "unexpected-friend-relationship",
      severity: "high",
      evidence: input.friendObservation || "VRCX reported a newly-added friend relationship.",
      policyAction: "block"
    });
  } else if (input.observedFriendAppearance === true) {
    observations.push({
      id: "friend-present-in-snapshot-only",
      category: "relationship-state-anomaly",
      severity: "informational",
      evidence: input.friendObservation || "Account appeared in a friend-list snapshot.",
      policyAction: "review-only"
    });
  }

  if (input.accountHistoryLooksEstablished === true) {
    observations.push({
      id: "established-account-history",
      category: "context-only",
      severity: "informational",
      evidence: input.accountHistoryNote || "Account appears to have an established usage history."
    });
  }

  const matchedProfileBlock = profileSignals.length > 0;
  const confirmedNewFriend = input.friendAddedEvent === true;
  const shouldBlock = !isWhitelisted && (matchedProfileBlock || confirmedNewFriend);

  return {
    reviewLevel: shouldBlock ? "block" : (profileSignals.length || observations.length ? "review" : "none"),
    profileSignals,
    observations,
    automaticAction: shouldBlock ? "block" : "none",
    blockReasons: [
      ...(matchedProfileBlock ? profileSignals.map(signal => signal.id) : []),
      ...(confirmedNewFriend && !isWhitelisted ? ["unexpected-friend-added-event"] : [])
    ],
    isWhitelisted,
    whitelistOverridesAutomaticBlock: true,
    requiresConfirmedFriendAddedEvent: true
  };
}

module.exports = { assessAccountRisk, detectProfileSignals };
