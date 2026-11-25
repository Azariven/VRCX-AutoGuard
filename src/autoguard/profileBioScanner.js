const RULES = [
  {
    id: "hexed-ripped-avatar-promotion",
    severity: "high",
    category: "avatar-ripping-promotion",
    domains: ["hexed.cc"],
    phrases: ["ripped avatars", "reupload", "re-upload", "millions of ripped avatars", "single click"],
    explanation: "Profile text promotes a service/site alongside claims of bulk ripped-avatar access and one-click reuploading. Treat as a strong manual-review indicator, not proof by itself.",
  },
  {
    id: "oversee-user-stalking-promotion",
    severity: "medium",
    category: "user-tracking-promotion",
    domains: ["oversee.lol"],
    phrases: ["user stalking", "free user stalking", "free user tracking"],
    explanation: "Profile text promotes a user-stalking or tracking service. Treat as a privacy/safety concern requiring manual review.",
  },
];

function normalizeText(value) {
  return typeof value === "string" ? value.toLowerCase().normalize("NFKC") : "";
}

export function scanProfileBio(bio) {
  const text = normalizeText(bio);
  if (!text) return [];
  const findings = [];
  for (const rule of RULES) {
    const matchedDomains = rule.domains.filter(domain => text.includes(domain));
    const matchedPhrases = rule.phrases.filter(phrase => text.includes(phrase));
    if (matchedDomains.length || matchedPhrases.length) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        category: rule.category,
        matchedDomains,
        matchedPhrases,
        explanation: rule.explanation,
        action: "manual-review-only",
        autoBlockEligible: false,
      });
    }
  }
  return findings;
}
