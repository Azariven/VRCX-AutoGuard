# VRCX AutoGuard

VRCX AutoGuard is a defensive profile-monitoring and moderation integration for VRCX.

## Immediate profile-domain block policy

When a loaded public VRChat profile's Bio or Bio links contain either explicitly designated domain, AutoGuard immediately sends a VRChat block request:

- hexed.cc — designated avatar-ripping / reupload promotion indicator.
- oversee.lol — designated user-stalking / tracking promotion indicator.

A domain match is the trigger; the exact wording can change. Matching is case-insensitive and normalizes common Unicode dot variants. The guard does not use display names, name suffixes, VRC+ icons, trust badges, or account age.

A newly-added friend or an existing friend-list entry alone does not trigger blocking. VRCX loads that user's public profile and the Bio rule decides. The currently logged-in user is excluded. Repeated profile loads are deduplicated; moderation requests are serialized and rate-limit retries are bounded.

## Other AutoGuard modules

- src/autoguard/core.js — strict User ID utilities and serialized moderation queue.
- src/autoguard/profileThreatGuard.js — immediate profile scanning and block enforcement.
- src/autoguard/accountRiskAssessment.js — exact domain classification.
- data/known-users.json — candidate User ID watchlist; IDs are format-validated, not independently verified.
- integration/vrcx-profile-bio-autoblock.patch — VRCX integration patch.
- tests/ — automated tests.

## Integration status

The integration patch targets upstream VRCX commit e819c4e4ee13218393fcf8263e7745971dfc9821. It still needs to be applied to a matching VRCX checkout, then built and runtime-tested. A GitHub commit of this module alone is not a compiled VRCX application.

See docs/INTEGRATION.md for application and validation steps.
