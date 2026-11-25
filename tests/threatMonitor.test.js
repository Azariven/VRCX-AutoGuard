import test from "node:test";
import assert from "node:assert/strict";
import { createThreatMonitor } from "../src/autoguard/threatMonitor.js";

const id = "usr_12345678-1234-1234-1234-123456789abc";

test("does not flag a single join", () => {
  const monitor = createThreatMonitor();
  const result = monitor.recordJoin(id, { timestamp: 1000 });
  assert.equal(result.status, "recorded");
  assert.equal(monitor.getAlerts().length, 0);
});

test("repeated join/leave cycles remain review-only telemetry", () => {
  const monitor = createThreatMonitor({ repeatedJoinThreshold: 2 });
  monitor.recordJoin(id, { timestamp: 1000 });
  monitor.recordLeave(id, { timestamp: 2000 });
  monitor.recordJoin(id, { timestamp: 3000 });
  monitor.recordLeave(id, { timestamp: 4000 });
  const result = monitor.recordJoin(id, { timestamp: 5000 });
  assert.equal(result.status, "alert");
  assert.equal(result.alert.action, "manual-review-only");
  assert.equal(result.alert.findings[0].severity, "review");
});
