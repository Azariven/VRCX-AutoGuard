# VRCX AutoGuard integration

## Automatic profile blocking

The profile guard scans each VRCX public profile as it is loaded. It checks both the Bio field and public Bio links for these two explicitly designated domains:

- hexed.cc
- oversee.lol

A match immediately queues a VRChat block moderation request using VRCX's authenticated playerModerationRequest.sendPlayerModeration({ moderated: userId, type: 'block' }) API. The profile is not judged by display name, suffix, VRC+ icon, trust badge, age badge, or account age.

The guard is invoked centrally from VRCX's applyPublicProfile(), so it covers profiles loaded from player joins, friend additions, friend requests, and other VRCX profile-fetch paths. The integration patch explicitly requests a public profile on new friend-add events and live friend requests.

Only a profile containing one of the two designated domains triggers this policy. A new friend event alone, a pre-existing friend-list snapshot, account age, or avatar changes do not trigger a block. The currently logged-in account is excluded. Repeat profile loads are deduplicated; moderation requests are serialized and rate-limit retries are bounded.

## Apply to VRCX

Target upstream revision: vrcx-team/VRCX commit e819c4e4ee13218393fcf8263e7745971dfc9821.

1. Check out that VRCX revision (or update the patch against the exact revision you use).
2. Copy this repository's src/autoguard/ directory into the VRCX source tree.
3. Apply integration/vrcx-profile-bio-autoblock.patch from the VRCX source root:

```bash
git apply --check path/to/vrcx-profile-bio-autoblock.patch
git apply path/to/vrcx-profile-bio-autoblock.patch
```

4. Inspect the diff and confirm imports resolve.
5. Run the VRCX repository's own type checks, tests, and production build.

The patch is prepared against the stated upstream revision; it has not yet been applied to a local VRCX checkout or compiled in this environment.

## Test the AutoGuard logic

This repository uses Vitest:

```bash
npm install
npm test
```

The unit tests cover exact domain matching, Bio-link matching, current-user exclusion, and duplicate prevention.
