// @ts-nocheck
import { notificationRequest, playerModerationRequest } from '../api';
import { useLocationStore, useUserStore } from '../stores';
import { parseLocation } from '../shared/utils';
import { toast } from 'vue-sonner';
import {
  completeAutoGuardFriendReview, getAutoGuardFriendReviewActions, initAutoGuardStore,
  recordAutoGuardEvent, useAutoGuardDashboardState
} from './dashboardStore.js';

let timer = null;
let processing = new Set();

/**
 * Runs staged friend review checks. Automatic block is opt-in.
 * A configured invite message must be sent successfully before moderation.
 */
export function startAutoGuardFriendReviewRuntime() {
  if (timer) return;
  const tick = async () => {
    const settings = useAutoGuardDashboardState().friendReviewSettings;
    const actions = getAutoGuardFriendReviewActions(Date.now());
    for (const action of actions) {
      if (processing.has(action.userId)) continue;
      processing.add(action.userId);
      try {
        if (action.type === 'reminder') {
          recordAutoGuardEvent({ action: 'friend-review-reminder', userId: action.userId,
            displayName: action.displayName, reason: 'pending-for-30-minutes' });
          toast.warning(`新好友待確認：${action.displayName || action.userId}，請確認是否由你手動新增。五分鐘後進入逾時處理。`);
          continue;
        }
        if (action.type !== 'auto-block-due' || settings?.autoBlockEnabled !== true) continue;
        const slot = Number(action.inviteMessageSlot);
        if (!Number.isInteger(slot) || slot < 0 || slot > 10) {
          recordAutoGuardEvent({ action: 'friend-review-action-skipped', userId: action.userId,
            reason: 'invite-message-slot-not-configured' });
          await completeAutoGuardFriendReview(action.userId, 'needs-manual-review');
          continue;
        }
        const location = useLocationStore().lastLocation?.location;
        if (!location) {
          recordAutoGuardEvent({ action: 'friend-review-action-skipped', userId: action.userId,
            reason: 'no-active-room-to-send-invite-message' });
          await completeAutoGuardFriendReview(action.userId, 'needs-manual-review');
          continue;
        }
        const parsed = parseLocation(location);
        const worldId = parsed?.worldId;
        const instanceId = parsed?.instanceId;
        if (!worldId || !instanceId) {
          recordAutoGuardEvent({ action: 'friend-review-action-skipped', userId: action.userId,
            reason: 'active-room-location-unavailable' });
          await completeAutoGuardFriendReview(action.userId, 'needs-manual-review');
          continue;
        }
        // Send the pre-configured VRCX invite-message slot first. Block only on API success.
        await notificationRequest.sendInvite({
          worldId, instanceId, messageSlot: slot
        }, action.userId);
        recordAutoGuardEvent({ action: 'friend-review-warning-sent', userId: action.userId,
          reason: 'invite-message-sent-before-block' });
        await playerModerationRequest.sendPlayerModeration({ moderated: action.userId, type: 'block' });
        recordAutoGuardEvent({ action: 'blocked', userId: action.userId,
          reason: 'friend-review-timeout-after-warning' });
        await completeAutoGuardFriendReview(action.userId, 'blocked');
      } catch (error) {
        recordAutoGuardEvent({ action: 'error', userId: action.userId,
          reason: 'friend-review-enforcement-failed', error: String(error?.message || error) });
        await completeAutoGuardFriendReview(action.userId, 'needs-manual-review');
      } finally {
        processing.delete(action.userId);
      }
    }
  };
  timer = setInterval(() => { void tick(); }, 30_000);
  void initAutoGuardStore().then(tick).catch(error => {
    recordAutoGuardEvent({ action: 'error', reason: 'friend-review-store-init-failed', error: String(error) });
  });
}
