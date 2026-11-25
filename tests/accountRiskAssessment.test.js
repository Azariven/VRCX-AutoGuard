import { describe, it, expect } from "vitest";
import { assessAccountRisk, detectProfileSignals } from "../src/autoguard/accountRiskAssessment.js";

describe("explicit profile-domain blocking policy", () => {
  it("blocks a bio containing hexed.cc even if wording changes", () => {
    const result = assessAccountRisk({ bio: "BUY hexed.cc today, millions of ripped avatars to reupload in a single click" });
    expect(result.automaticAction).toBe("block");
    expect(result.profileSignals[0].domain).toBe("hexed.cc");
  });
  it("blocks a bio containing oversee.lol", () => {
    const result = assessAccountRisk({ bio: "oversee.lol for free user stalking" });
    expect(result.automaticAction).toBe("block");
    expect(result.profileSignals[0].domain).toBe("oversee.lol");
  });
  it("matches case-insensitively and tolerates Unicode dot variants", () => {
    expect(detectProfileSignals("HEXED．CC")).toHaveLength(1);
  });
  it("does not block a profile without either designated domain", () => {
    expect(assessAccountRisk({ bio: "I enjoy VRChat photography" }).automaticAction).toBe("none");
  });
  it("does not block merely because a friend-add event occurred", () => {
    expect(assessAccountRisk({ friendAddedEvent: true }).automaticAction).toBe("none");
  });
});
