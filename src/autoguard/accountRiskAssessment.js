const DOMAIN_RULES = [
  { id: "hexed-avatar-ripping-promotion", domain: "hexed.cc", category: "avatar-theft-promotion", severity: "high",
    rationale: "The profile contains the explicitly designated hexed.cc domain." },
  { id: "oversee-user-stalking-promotion", domain: "oversee.lol", category: "privacy-invasive-tracking-promotion", severity: "high",
    rationale: "The profile contains the explicitly designated oversee.lol domain." }
];

function normalizeText(value) {
  return String(value || "").normalize("NFKC").replace(/[\u2024\u3002\uff0e\uff61]/g, ".").toLowerCase();
}

function domainPattern(domain) {
  const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(?:^|[^a-z0-9.-])(?:www\\.)?" + escaped + "(?=$|[^a-z0-9.-])", "i");
}

export function detectProfileSignals(profileText, enabledDomains = DOMAIN_RULES.map(rule => rule.domain)) {
  const text = normalizeText(profileText);
  if (!text) return [];
  const enabled = new Set(enabledDomains);
  return DOMAIN_RULES.filter(rule => enabled.has(rule.domain)).flatMap(rule => {
    const match = text.match(domainPattern(rule.domain));
    return match ? [{ id: rule.id, category: rule.category, severity: rule.severity, domain: rule.domain,
      evidence: match[0].trim(), rationale: rule.rationale, action: "block" }] : [];
  });
}

export function assessAccountRisk(input = {}, enabledDomains) {
  const profileText = typeof input === "string" ? input :
    [input.bio, ...(Array.isArray(input.bioLinks) ? input.bioLinks.map(link =>
      typeof link === "string" ? link : [link?.url, link?.uri, link?.text, link?.displayName].filter(Boolean).join(" ")
    ) : [])].filter(Boolean).join("\n");
  const profileSignals = detectProfileSignals(profileText, enabledDomains);
  return { reviewLevel: profileSignals.length ? "block" : "none", profileSignals,
    automaticAction: profileSignals.length ? "block" : "none", blockReasons: profileSignals.map(signal => signal.id) };
}

export const PROFILE_DOMAIN_RULES = DOMAIN_RULES.map(({ id, domain, category, severity }) =>
  ({ id, domain, category, severity }));
