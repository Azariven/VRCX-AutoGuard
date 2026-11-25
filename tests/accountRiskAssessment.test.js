const test = require("node:test");
const assert = require("node:assert/strict");
const { assessAccountRisk, detectProfileSignals } = require("../src/autoguard/accountRiskAssessment");

test("hexed.cc plus explicit ripped-avatar one-click reupload promotion triggers block", () => {
  const result = assessAccountRisk({
    bio: "hexed.cc millions of ripped avatars to reupload in a single click"
  });
  assert.equal(result.automaticAction, "block");
  assert.ok(result.profileSignals.some(signal => signal.id === "hexed-avatar-ripping-promotion"));
});

test("hexed.cc without the explicit promotion phrase does not trigger this rule", () => {
  const result = assessAccountRisk({ bio: "Visit hexed.cc" });
  assert.equal(result.automaticAction, "none");
});

test("oversee.lol plus explicit free user stalking promotion triggers block", () => {
  const result = assessAccountRisk({ bio: "oversee.lol for free user stalking" });
  assert.equal(result.automaticAction, "block");
  assert.ok(result.profileSignals.some(signal => signal.id === "oversee-user-stalking-promotion"));
});

test("friend list snapshot alone does not trigger block", () => {
  const result = assessAccountRisk({ observedFriendAppearance: true });
  assert.equal(result.automaticAction, "none");
});

test("confirmed newly-added friend event triggers block", () => {
  const result = assessAccountRisk({ friendAddedEvent: true });
  assert.equal(result.automaticAction, "block");
  assert.ok(result.blockReasons.includes("unexpected-friend-added-event"));
});

test("whitelist overrides automatic block", () => {
  const result = assessAccountRisk({
    bio: "hexed.cc millions of ripped avatars to reupload in a single click",
    friendAddedEvent: true,
    isWhitelisted: true
  });
  assert.equal(result.automaticAction, "none");
  assert.equal(result.isWhitelisted, true);
});
