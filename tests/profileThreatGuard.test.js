import { describe, it, expect, vi } from "vitest";
import { createProfileThreatGuard } from "../src/autoguard/profileThreatGuard.js";
const id = "usr_12345678-1234-1234-1234-123456789abc";

describe("profile threat enforcement", () => {
  it("sends a block when a designated domain appears in Bio", async () => {
    const sendBlock = vi.fn().mockResolvedValue({ ok: true });
    const guard = createProfileThreatGuard({ sendBlock });
    const result = await guard.inspect({ id, displayName: "test", bio: "hexed.cc - millions of ripped avatars" });
    expect(sendBlock).toHaveBeenCalledWith(id);
    expect(result.action).toBe("blocked");
  });
  it("scans Bio links as well as Bio text", async () => {
    const sendBlock = vi.fn().mockResolvedValue({ ok: true });
    const guard = createProfileThreatGuard({ sendBlock });
    const result = await guard.inspect({ id, bio: "hello", bioLinks: [{ url: "https://oversee.lol" }] });
    expect(sendBlock).toHaveBeenCalledWith(id);
    expect(result.matchedDomains).toContain("oversee.lol");
  });
  it("does not block the current user", async () => {
    const sendBlock = vi.fn();
    const guard = createProfileThreatGuard({ sendBlock });
    const result = await guard.inspect({ id, bio: "hexed.cc" }, id);
    expect(result.action).toBe("ignore");
    expect(sendBlock).not.toHaveBeenCalled();
  });
  it("deduplicates repeated profile loads", async () => {
    const sendBlock = vi.fn().mockResolvedValue({ ok: true });
    const guard = createProfileThreatGuard({ sendBlock });
    await guard.inspect({ id, bio: "hexed.cc" });
    const result = await guard.inspect({ id, bio: "hexed.cc" });
    expect(sendBlock).toHaveBeenCalledTimes(1);
    expect(result.action).toBe("already-blocked");
  });
});
