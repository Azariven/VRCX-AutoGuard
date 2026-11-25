const test = require("node:test");
const assert = require("node:assert/strict");
const { assessAccountRisk, detectProfileSignals } = require("../src/autoguard/accountRiskAssessment");

test("hexed.cc and ripped-avatar promotion create a priority manual review", () => {
  const result = assessAccountRisk({
    bio: "Millions of ripped avatars to reupload in a single click. hexed.cc"
  });
  assert.equal(result.reviewLevel, "priority-manual-review");
  assert.ok(result.profileSignals.some(signal => signal.id === "hexed-avatar-ripping-promotion"));
  assert.equal(result.autoBlockAllowedFromTheseSignals, false);
  assert.equal(result.automaticAction, "none");
});

test("oversee.lol is classified as tracking/privacy promotion, not avatar theft", () => {
  const signals = detectProfileSignals("oversee.lol free user stalking");
  assert.ok(signals.some(signal => signal.category === "privacy-invasive-tracking-promotion"));
  assert.ok(!signals.some(signal => signal.category === "avatar-theft-promotion"));
});

test("unexpected friend-list appearance is a low-severity observation, not proof", () => {
  const result = assessAccountRisk({ observedFriendAppearance: true });
  assert.equal(result.reviewLevel, "manual-review");
  assert.equal(result.observations[0].severity, "low");
  assert.equal(result.autoBlockAllowedFromTheseSignals, false);
});

test("profile promotion plus friend anomaly is combined for review without asserting compromise", () => {
  const result = assessAccountRisk({
    bio: "hexed.cc millions of ripped avatars to reupload",
    observedFriendAppearance: true,
    accountHistoryLooksEstablished: true
  });
  assert.match(result.combinedContext, /does not establish account theft/);
  assert.equal(result.automaticAction, "none");
});
