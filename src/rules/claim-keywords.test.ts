import { describe, it, expect } from "vitest";
import { CLAIM_KEYWORDS } from "./claim-keywords.js";

describe("claim-keywords", () => {
  it("should have at least one keyword defined", () => {
    expect(CLAIM_KEYWORDS.length).toBeGreaterThan(0);
  });

  it("should have valid risk levels for all keywords", () => {
    const validLevels = ["low", "medium", "high"];
    for (const kw of CLAIM_KEYWORDS) {
      expect(validLevels).toContain(kw.riskLevel);
    }
  });

  it("should have non-empty patterns and evidence requirements", () => {
    for (const kw of CLAIM_KEYWORDS) {
      expect(kw.pattern.length).toBeGreaterThan(0);
      expect(kw.evidenceRequired.length).toBeGreaterThan(0);
    }
  });

  it("should include high-risk greenwashing terms", () => {
    const highRisk = CLAIM_KEYWORDS.filter((kw) => kw.riskLevel === "high");
    const patterns = highRisk.map((kw) => kw.pattern);
    expect(patterns).toContain("eco-friendly");
    expect(patterns).toContain("sustainable");
    expect(patterns).toContain("biodegradable");
    expect(patterns).toContain("non-toxic");
  });
});
