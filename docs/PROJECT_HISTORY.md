# VRCX AutoGuard project history

## Imported baseline

This repository continues the earlier AutoGuard work from `VRChat-AntiExploit`, branch `feature/vrcx-autoguard`, previously at commit `b0a67be248674be0f49a94015e082f59c0c6223c`.

## Imported capabilities

- Strict `usr_<UUID>` normalization and exact-ID matching.
- Whitelist precedence over watchlist matches.
- Preview-only mode and serial moderation queue with bounded retry behavior.
- VRCX moderation adapter.
- Persistent configuration through VRCX config repository APIs.
- Join/leave rejoin telemetry with bounded memory and duplicate/out-of-order filtering.
- Non-blocking event-hook integration patch.
- Settings UI component and integration documentation.

## Imported watchlist status

The source list contained 720 ID occurrences and 713 unique syntactically valid IDs, with 6 duplicate occurrences and 1 malformed ID excluded. These IDs were format-validated and deduplicated; they were not independently verified as malicious accounts. Matching must use IDs only, never display names or four-character name suffixes.

## Verification boundary

Migration into this repository does not mean the VRCX patches have been applied to a complete VRCX checkout, compiled, or runtime-tested. The integration patch should be checked against the exact VRCX revision before release.