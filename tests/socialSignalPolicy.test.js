import test from "node:test";
import assert from "node:assert/strict";
import { getSocialSignalCandidate } from "../src/autoguard/socialSignalPolicy.js";

const sender = "usr_12345678-1234-1234-1234-123456789abc";
const current = "usr_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

test("recognizes friend requests and group invitations with a sender", () => {
  for (const [type, source] of [
    ["friendRequest", "friend-request"],
    ["group.invite", "group-invite"],
    ["group.joinRequest", "group-join-request"]
  ]) {
    const result = getSocialSignalCandidate({ type, senderUserId: sender, id: "event-1", senderUsername: "Player" }, current);
    assert.equal(result.userId, sender);
    assert.equal(result.source, source);
    assert.equal(result.eventId, "event-1");
  }
});

test("ignores system notifications and unsupported notification types", () => {
  assert.equal(getSocialSignalCandidate({ type: "group.informative", senderUserId: sender }, current), null);
  assert.equal(getSocialSignalCandidate({ type: "group.invite" }, current), null);
});

test("ignores the current user and invalid user identifiers", () => {
  assert.equal(getSocialSignalCandidate({ type: "group.invite", senderUserId: current }, current), null);
  assert.equal(getSocialSignalCandidate({ type: "group.invite", senderUserId: "not-a-user-id" }, current), null);
});
