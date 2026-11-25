VRCX AutoGuard integration guide

This guide describes prepared integration assets. It does not claim that a full VRCX fork has already been patched, built, or released.

## Files

- `src/autoguard/`: AutoGuard core and runtime.
- `integration/AutoGuardTab.vue`: settings UI component.
- `integration/vrcx-master-autoguard.patch`: prepared VRCX event-hook patch.
- `integration/vrcx-settings-tab.patch`: prepared settings-tab patch.
- `data/known-users.json`: candidate user-ID watchlist.

## Safety

The default configuration is disabled and preview-only. Do not enable automatic moderation until the watchlist has been reviewed and the integration has been tested against the exact VRCX source revision being used.

Hooks are intended to be non-blocking. VRCX event handling should not wait for moderation requests. Avatar changes and join/leave patterns are review-only signals, not proof of ripping and not automatic block triggers.

## Integration status

The patches and Vue component are prepared assets. They have not been verified by applying them to the user's uploaded VRCX ZIP in this repository migration. Apply them to a clean, matching VRCX checkout, inspect the diff, then run the VRCX type checks, tests, and production build.

Suggested validation from the VRCX source root:

```bash
npm ci
npm run typecheck:js
npm run typecheck:vue
npm test
npm run prod
```

The exact scripts available depend on the VRCX revision. Confirm them in that checkout before running.