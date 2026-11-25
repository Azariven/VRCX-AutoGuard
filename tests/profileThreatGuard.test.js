import test from "node:test";
import assert from "node:assert/strict";
import { createProfileThreatGuard } from "../src/autoguard/profileThreatGuard.js";

const id = "usr_12345678-1234-1234-1234-123456789abc";

test("sends a block when a designated domain appears in Bio", async () => {
  const calls = [];
  const guard = createProfileThreatGuard({ sendBlock: async userId => { calls.push(userId); return { ok: true }; } });
  const result = await guard.inspect({ id, displayName: "test", bio: "hexed.cc - millions of ripped avatars" });
  assert.deepEqual(calls, [id]);
  assert.equal(result.action, "blocked");
});

test("scans Bio links as well as Bio text", async () => {
  const calls = [];
  const guard = createProfileThreatGuard({ sendBlock: async userId => { calls.push(userId); return { ok: true }; } });
  const result = await guard.inspect({ id, bio: "hello", bioLinks: [{ url: "https://oversee.lol" }] });
  assert.deepEqual(calls, [id]);
  assert.ok(result.matchedDomains.includes("oversee.lol"));
});

test("does not block the current user", async () => {
  let called = false;
  const guard = createProfileThreatGuard({ sendBlock: async () => { called = true; } });
  const result = await guard.inspect({ id, bio: "hexed.cc" }, id);
  assert.equal(result.action, "ignore");
  assert.equal(called, false);
});

test("deduplicates repeated profile loads", async () => {
  let calls = 0;
  const guard = createProfileThreatGuard({ sendBlock: async () => { calls++; return { ok: true }; } });
  await guard.inspect({ id, bio: "hexed.cc" });
  const result = await guard.inspect({ id, bio: "hexed.cc" });
  assert.equal(calls, 1);
  assert.equal(result.action, "already-blocked");
});
