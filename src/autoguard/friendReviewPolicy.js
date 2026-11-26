/**
 * Time-based review policy for newly added friends.
 * A missed review is not proof of malicious behavior. Automatic enforcement is
 * opt-in and must send a configured invite message successfully before blocking.
 */
export const FRIEND_REVIEW_DEFAULTS = Object.freeze({
  reminderAfterMs: 30 * 60 * 1000,
  graceAfterReminderMs: 5 * 60 * 1000,
  autoBlockEnabled: false,
  inviteMessageSlot: null
});

export function getFriendReviewState(item, now = Date.now(), settings = FRIEND_REVIEW_DEFAULTS) {
  if (!item || item.status === 'approved' || item.status === 'dismissed' || item.status === 'processed') {
    return { state: item?.status || 'invalid', due: false };
  }
  const createdAt = typeof item.timestamp === 'number' ? item.timestamp : Date.parse(item.timestamp);
  if (!Number.isFinite(createdAt)) return { state: 'invalid-timestamp', due: false };
  const reminderAt = createdAt + settings.reminderAfterMs;
  const actionAt = reminderAt + settings.graceAfterReminderMs;
  if (now < reminderAt) return { state: 'waiting', reminderAt, actionAt, due: false };
  if (now < actionAt) return { state: 'reminder-due', reminderAt, actionAt, due: false };
  return { state: 'action-due', reminderAt, actionAt, due: Boolean(settings.autoBlockEnabled) };
}
