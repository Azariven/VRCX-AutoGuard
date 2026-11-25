# VRCX AutoGuard integration

## Automatic profile blocking

The profile guard scans each VRCX public profile as it is loaded. It checks both the Bio field and public Bio links for these two explicitly designated domains:

- hexed.cc
- oversee.lol

A match immediately queues a VRChat block moderation request using VRCX's authenticated playerModerationRequest.sendPlayerModeration({ moderated: userId, type: 'block' }) API. A domain match is sufficient; the profile's display name, suffix, VRC+ icon, trust badge, age badge, and account age are not used.

The guard is invoked centrally from VRCX's applyPublicProfile(), so it covers profiles loaded from player joins, friend additions, friend requests, and other VRCX profile-fetch paths. The integration adds profile fetches for new friend-add events, live friend requests, and player joins when a public profile is not cached.

Only a profile containing one of the two designated domains triggers blocking. A new friend event alone, a pre-existing friend-list snapshot, account age, or avatar changes do not trigger a block. The currently logged-in account is excluded. Repeat profile loads are deduplicated; moderation requests are serialized and rate-limit retries are bounded.

## Apply to VRCX

Target upstream revision: vrcx-team/VRCX commit e819c4e4ee13218393fcf8263e7745971dfc9821.

1. Check out that VRCX revision (or update the integration for the exact revision you use).
2. Copy these three files into the VRCX source tree under src/autoguard/:
   - core.js
   - accountRiskAssessment.js
   - profileThreatGuard.js
3. From this repository root, run the cross-platform integration script:

```bash
node scripts/apply-vrcx-integration.mjs path/to/VRCX
```

Alternatively, from the VRCX source root, apply the prepared Git patch:

```bash
git apply --check path/to/vrcx-profile-bio-autoblock.patch
git apply path/to/vrcx-profile-bio-autoblock.patch
```

4. Inspect the source diff.
5. Run the VRCX type checks, tests, and production build.

## Automated validation and builds

GitHub Actions checks the AutoGuard unit tests, applies the patch to a clean checkout of the target VRCX revision, compares VRCX JavaScript and Vue typecheck diagnostics against the unmodified upstream baseline, and builds the VRCX renderer.

A separate Windows job builds the VRCX NSIS installer with AutoGuard and uploads it as a workflow artifact. The installer is a modified VRCX build; it is not an official VRCX release.

The build jobs are CI validation. A successful renderer build or Windows installer artifact does not replace runtime testing inside VRChat with a test account.

## Local AutoGuard tests

This repository uses Node's built-in test runner:

```bash
npm test
```

The tests cover exact domain matching, Bio-link matching, current-user exclusion, duplicate prevention, and review-only behavior telemetry.
