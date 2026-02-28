import { describe, it, expect } from "vitest";
import type {
  ProductCategory,
  FieldResult,
  ClaimFlag,
  ScanResult,
} from "./scan.js";

describe("scan types", () => {
  it("should allow valid ProductCategory values", () => {
    const categories: ProductCategory[] = [
      "textiles",
      "children",
      "cosmetics",
      "electronics",
      "general",
    ];
    expect(categories).toHaveLength(5);
  });

  it("should construct a valid FieldResult", () => {
    const field: FieldResult = {
      key: "product_name",
      group: "Identity & Contacts",
      required: true,
      status: "found",
      value: "Test Product",
      confidence: 0.95,
    };
    expect(field.key).toBe("product_name");
    expect(field.status).toBe("found");
    expect(field.confidence).toBeGreaterThan(0);
  });

  it("should construct a valid ClaimFlag", () => {
    const claim: ClaimFlag = {
      claim: "eco-friendly",
      riskLevel: "high",
      evidenceRequired: "Third-party certification required",
      source: "product description",
    };
    expect(claim.riskLevel).toBe("high");
    expect(claim.evidenceRequired).toBeTruthy();
  });

  it("should construct a valid ScanResult", () => {
    const result: ScanResult = {
      url: "https://example.com/product",
      title: "Test Product Page",
      category: "general",
      timestamp: new Date().toISOString(),
      fields: [],
      claims: [],
      evidence: [],
      riskBreakdown: {
        score: 0,
        maxScore: 100,
        fieldPenalties: [],
        claimPenalties: [],
      },
    };
    expect(result.url).toContain("https://");
    expect(result.category).toBe("general");
    expect(result.fields).toEqual([]);
    expect(result.evidence).toEqual([]);
    expect(result.riskBreakdown?.score).toBeLessThanOrEqual(
      result.riskBreakdown?.maxScore ?? 0,
    );
  });
});
