import test from "node:test";
import assert from "node:assert/strict";
import { assessAccountRisk, detectProfileSignals } from "../src/autoguard/accountRiskAssessment.js";

test("hexed.cc is a direct block indicator regardless of wording", () => {
  const result = assessAccountRisk({ bio: "BUY hexed.cc today, millions of ripped avatars to reupload in a single click" });
  assert.equal(result.automaticAction, "block");
  assert.equal(result.profileSignals[0].domain, "hexed.cc");
});

test("oversee.lol is a direct block indicator", () => {
  const result = assessAccountRisk({ bio: "oversee.lol for free user stalking" });
  assert.equal(result.automaticAction, "block");
  assert.equal(result.profileSignals[0].domain, "oversee.lol");
});

test("domain matching is case-insensitive and normalizes Unicode dots", () => {
  assert.equal(detectProfileSignals("HEXED．CC").length, 1);
});

test("unrelated profile content does not trigger blocking", () => {
  assert.equal(assessAccountRisk({ bio: "I enjoy VRChat photography" }).automaticAction, "none");
});

test("a friend-add event by itself does not trigger blocking", () => {
  assert.equal(assessAccountRisk({ friendAddedEvent: true }).automaticAction, "none");
});
