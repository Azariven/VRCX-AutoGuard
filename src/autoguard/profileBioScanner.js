import { detectProfileSignals } from "./accountRiskAssessment.js";

export function scanProfileBio(bio) {
  return detectProfileSignals(bio).map(signal => ({
    ...signal,
    action: "block",
    autoBlockEligible: true
  }));
}
