# Profile bio threat indicators

## Added indicator: hexed.cc / ripped-avatar reupload promotion

The following profile self-description was supplied for defensive classification:

- It advertises **hexed.cc** alongside claims of access to millions of ripped avatars and one-click reuploading.
- It also advertises **oversee.lol** for free user stalking/tracking.

### Classification

| Indicator | Severity | Interpretation |
|---|---|---|
| `hexed.cc` plus phrases such as “ripped avatars”, “reupload”, or “single click” | High | Strong self-promotional signal associated with avatar ripping/reuploading; flag for manual review. |
| `oversee.lol` plus “user stalking” / tracking language | Medium | Promotion of user-stalking/tracking functionality; flag for privacy/safety review. |

### Handling rules

1. Preserve the exact profile bio and the account's VRChat User ID as evidence when a moderator reports a match.
2. Match domains and phrases case-insensitively; do not match by display name or name suffix.
3. A bio match is a **risk indicator**, not independent proof that the account personally ripped an avatar or that the advertised service works as claimed.
4. Bio findings are **manual-review-only** and must never trigger an automatic block on their own.
5. Corroborate with account behavior, direct links, screenshots, and other independently obtained evidence before taking moderation action.
6. Do not visit, download from, or interact with a suspected ripping/tracking service as part of automated detection.

The classification records what the supplied bio claims; it does not independently verify the websites, their operators, or the advertised capabilities.
