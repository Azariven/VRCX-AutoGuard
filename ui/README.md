# AutoGuard Dashboard UI

This directory contains the first Vue 3 dashboard view for the VRCX AutoGuard panel.

## Included view

- `AutoGuardDashboard.vue`: status, scan/block/failure counters, the two configured domain rules, and recent activity.
- The view is intentionally driven by props. It does not fabricate activity or claim protection is active when no event source is connected.

## Required VRCX wiring (not yet completed)

1. Add the view to VRCX's navigation/router using the exact UI entry points in the VRCX source revision being built.
2. Replace the current `console.info('[VRCX AutoGuard]', entry)` callback with a small reactive event store.
3. Pass the store's events and counters to this component.
4. Add timestamps and a bounded event history; do not persist full Bio text by default.
5. Verify the view with a test profile and confirm that the VRChat moderation API response is successful before incrementing the blocked counter.

## Current limitation

The existing AutoGuard integration patch hooks profile loading and sends moderation requests, but it only writes logs to the developer console. The dashboard component is therefore a UI foundation, not yet a visible VRCX tab. Navigation and live event-store wiring must be completed against the exact VRCX source tree used for the installer.
