import { describe, it, expect } from "vitest";
import { scanProfileBio } from "../src/autoguard/profileBioScanner.js";

describe("scanProfileBio", () => {
  it("flags hexed.cc ripped-avatar reupload promotion as high-risk review", () => {
    const findings = scanProfileBio("BUY hexed.cc today, millions of ripped avatars to reupload in a single click");
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe("hexed-ripped-avatar-promotion");
    expect(findings[0].severity).toBe("high");
    expect(findings[0].action).toBe("manual-review-only");
    expect(findings[0].autoBlockEligible).toBe(false);
  });

  it("flags oversee.lol stalking promotion separately", () => {
    const findings = scanProfileBio("oversee.lol for free user stalking");
    expect(findings.some(x => x.id === "oversee-user-stalking-promotion")).toBe(true);
  });

  it("does not flag unrelated profile text", () => {
    expect(scanProfileBio("I enjoy photography and VRChat worlds")).toEqual([]);
  });
});
