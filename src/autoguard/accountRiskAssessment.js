const DOMAIN_RULES = [
  { id: "hexed-avatar-ripping-promotion", domain: "hexed.cc", category: "avatar-theft-promotion", severity: "high",
    rationale: "The profile contains the explicitly designated hexed.cc domain associated with the supplied ripped-avatar and reupload promotion." },
  { id: "oversee-user-stalking-promotion", domain: "oversee.lol", category: "privacy-invasive-tracking-promotion", severity: "high",
    rationale: "The profile contains the explicitly designated oversee.lol domain associated with the supplied free user-stalking promotion." }
];

function normalizeText(value) {
  return String(value || "").normalize("NFKC").replace(/[\u2024\u3002\uff0e\uff61]/g, ".").toLowerCase();
}

function domainPattern(domain) {
  const escaped = domain.replace(".", "\\.");
  return new RegExp("(?:^|[^a-z0-9-])(?:www\\\\.)?" + escaped + "(?=$|[^a-z0-9-])", "i");
}

export function detectProfileSignals(profileText) {
  const text = normalizeText(profileText);
  if (!text) return [];
  return DOMAIN_RULES.flatMap(rule => {
    const match = text.match(domainPattern(rule.domain));
    return match ? [{
      id: rule.id, category: rule.category, severity: rule.severity, domain: rule.domain,
      evidence: match[0].trim(), rationale: rule.rationale, action: "block"
    }] : [];
  });
}

/** Only the two explicitly designated profile domains trigger automatic blocking. */
export function assessAccountRisk(input = {}) {
  const profileText = typeof input === "string"
    ? input
    : [input.bio, ...(Array.isArray(input.bioLinks) ? input.bioLinks.map(link =>
        typeof link === "string" ? link : [link?.url, link?.uri, link?.text, link?.displayName].filter(Boolean).join(" ")
      ) : [])].filter(Boolean).join("\n");
  const profileSignals = detectProfileSignals(profileText);
  return {
    reviewLevel: profileSignals.length ? "block" : "none",
    profileSignals,
    automaticAction: profileSignals.length ? "block" : "none",
    blockReasons: profileSignals.map(signal => signal.id)
  };
}
