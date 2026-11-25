# Account Profile and Relationship Anomaly Review

## Purpose

Record profile promotions and unexpected friend-list appearances as reviewable signals in VRCX AutoGuard. The system must distinguish evidence of a profile advertising a service from evidence about the account owner's identity, intent, or account security.

## Indicators

| Indicator | Classification | Review priority | Meaning |
|---|---|---:|---|
| `hexed.cc` | Avatar-theft/reupload promotion | High | A profile containing the domain alongside claims about ripped avatars, mass avatar libraries, or one-click reuploading is a strong profile-level risk indicator. It does not prove that this account personally stole an avatar. |
| Phrases such as `ripped avatars`, `reupload`, `one click` | Avatar-theft/reupload promotion | High | Preserve the exact matched text and source timestamp for manual review. |
| `oversee.lol` | Privacy-invasive tracking promotion | Medium | Track separately from avatar theft. A claim about user stalking/tracking is not direct proof of model theft. |
| Unexpected appearance in the local friend list | Relationship-state anomaly | Low | Record only when supported by an observed VRCX event or an explicitly user-reported observation. Consider sync/cache behavior and historical relationship changes. |
| Long account history, Verified 18+, VRC Plus, Shield, Trusted User | Context only | Informational | These labels do not prove that an account is safe, compromised, genuine, or malicious. |

## Combined interpretation

If a profile advertises avatar ripping/reuploading and the user independently reports an unexpected friend-list appearance, raise a priority manual review case and retain both observations separately. The combination is suspicious enough to investigate, but it does not establish:

- that the account was stolen;
- that the account is a fake or alternate account;
- that the account can crack or steal other people's avatars;
- that the account owner personally performed the advertised activity.

Those remain hypotheses until independently corroborated.

## Evidence to retain

- VRChat User ID (stable identifier; do not use display name as identity).
- Exact Bio text and matched fragments.
- Profile capture time and observation time (UTC timestamp).
- Source of observation: profile scan, VRCX friend event, local friend-list snapshot, or user report.
- Whether the friend relationship was newly observed, historically recorded, or merely present in a current snapshot.
- Relevant event IDs/log references, when available.

Do not store passwords, session tokens, or other credentials.

## Enforcement policy

- Bio matches and relationship anomalies are review signals, not automatic block grounds.
- Known confirmed User IDs may follow the existing known-ID policy.
- Behavioral anomalies remain warning/manual-review only.
- Keep AutoGuard disabled and Preview Only enabled by default until the integration and tests are verified.
- Never claim an account is compromised based solely on its Bio, badges, account age, or friend-list presence.
