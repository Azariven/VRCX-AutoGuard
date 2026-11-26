import { normalizeUserId } from "./core.js";

// Only notifications with a concrete human sender are eligible.
// System-authored group announcements/recommendations without senderUserId are ignored.
const SOCIAL_SIGNAL_TYPES = new Map([
  ["friendRequest", "friend-request"],
  ["group.invite", "group-invite"],
  ["group.joinRequest", "group-join-request"]
]);

export function getSocialSignalCandidate(notification = {}, currentUserId = "") {
  const source = SOCIAL_SIGNAL_TYPES.get(String(notification.type || ""));
  if (!source) return null;

  const userId = normalizeUserId(notification.senderUserId);
  const currentId = normalizeUserId(currentUserId);
  if (!userId || userId === currentId) return null;

  return {
    userId,
    source,
    eventId: String(notification.id || notification.notificationId || ""),
    displayName: String(notification.senderUsername || "")
  };
}

export const SUPPORTED_SOCIAL_SIGNAL_TYPES = [...SOCIAL_SIGNAL_TYPES.keys()];
