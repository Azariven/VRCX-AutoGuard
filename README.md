# VRCX AutoGuard

VRCX AutoGuard is a defensive monitoring and moderation-integration project for VRCX. It uses exact VRChat user IDs, configurable watchlists and whitelists, preview-first behavior, and bounded event monitoring.

## Safety defaults

- Disabled by default.
- Preview-only by default.
- Friend-request auto-block and instance-join auto-block are opt-in.
- Exact normalized `usr_<UUID>` matching only. Display names and name suffixes are not identity keys.
- Whitelist entries override watchlist matches.
- Avatar-change and rejoin telemetry are review signals, not proof of avatar ripping and never standalone block triggers.

## Layout

- `src/autoguard/` — runtime, matching, monitoring, persistence, moderation adapter, and profile-bio indicator scanner.
- `data/known-users.json` — imported candidate ID watchlist (IDs are format-validated, not independently verified as malicious).
- `integration/` — VRCX integration component and patches.
- `tests/` — automated tests.
- `docs/` — project documentation, including `THREAT_INDICATORS.md` for suspicious profile-bio promotion.

## Important limitations

This project cannot detect external avatar-ripping tools merely from VRCX events. A moderation block request is not a kick and does not guarantee that a user is removed from the current instance. Review candidate IDs before enabling automated actions.

See `docs/INTEGRATION.md` for integration steps and validation requirements.