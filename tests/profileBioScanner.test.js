import test from "node:test";
import assert from "node:assert/strict";
import { scanProfileBio } from "../src/autoguard/profileBioScanner.js";

test("hexed.cc profile promotion is an immediate block indicator", () => {
  const findings = scanProfileBio("BUY hexed.cc today, millions of ripped avatars to reupload in a single click");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, "hexed-avatar-ripping-promotion");
  assert.equal(findings[0].action, "block");
  assert.equal(findings[0].autoBlockEligible, true);
});

test("oversee.lol is an immediate block indicator", () => {
  const findings = scanProfileBio("oversee.lol for free user stalking");
  assert.ok(findings.some(x => x.id === "oversee-user-stalking-promotion"));
  assert.ok(findings.every(x => x.action === "block"));
});

test("unrelated profile text is not flagged", () => {
  assert.deepEqual(scanProfileBio("I enjoy photography and VRChat worlds"), []);
});
