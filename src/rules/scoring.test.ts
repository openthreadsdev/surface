import { describe, it, expect } from "vitest";
import type { FieldResult, ClaimFlag } from "../types/scan.js";
import {
  calculateFieldPenalties,
  calculateClaimPenalties,
  calculateMaxFieldScore,
  calculateRiskScore,
  REQUIRED_FIELD_WEIGHT,
  OPTIONAL_FIELD_WEIGHT,
  CLAIM_RISK_WEIGHTS,
} from "./scoring.js";

function makeField(overrides: Partial<FieldResult> = {}): FieldResult {
  return {
    key: "test_field",
    group: "Test Group",
    required: false,
    status: "found",
    confidence: 0.9,
    ...overrides,
  };
}

function makeClaim(overrides: Partial<ClaimFlag> = {}): ClaimFlag {
  return {
    claim: "eco-friendly",
    riskLevel: "high",
    evidenceRequired: "Third-party certification",
    source: "...eco-friendly product...",
    ...overrides,
  };
}

describe("calculateFieldPenalties", () => {
  it("returns no penalties when all fields are found", () => {
    const fields = [
      makeField({ key: "product_name", required: true, status: "found" }),
      makeField({ key: "brand", required: true, status: "found" }),
      makeField({ key: "materials", required: false, status: "found" }),
    ];
    expect(calculateFieldPenalties(fields)).toEqual([]);
  });

  it("penalizes missing required fields at higher weight", () => {
    const fields = [
      makeField({ key: "product_name", required: true, status: "missing" }),
    ];
    const penalties = calculateFieldPenalties(fields);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].penalty).toBe(REQUIRED_FIELD_WEIGHT);
    expect(penalties[0].required).toBe(true);
    expect(penalties[0].reason).toContain("Required");
  });

  it("penalizes missing optional fields at lower weight", () => {
    const fields = [
      makeField({ key: "materials", required: false, status: "missing" }),
    ];
    const penalties = calculateFieldPenalties(fields);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].penalty).toBe(OPTIONAL_FIELD_WEIGHT);
    expect(penalties[0].required).toBe(false);
    expect(penalties[0].reason).toContain("Optional");
  });

  it("ignores found and partial fields", () => {
    const fields = [
      makeField({ key: "product_name", required: true, status: "found" }),
      makeField({ key: "brand", required: true, status: "partial" }),
      makeField({ key: "materials", required: false, status: "missing" }),
    ];
    const penalties = calculateFieldPenalties(fields);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].key).toBe("materials");
  });

  it("preserves group in penalty output", () => {
    const fields = [
      makeField({
        key: "warnings",
        group: "Safety & Use",
        required: false,
        status: "missing",
      }),
    ];
    const penalties = calculateFieldPenalties(fields);
    expect(penalties[0].group).toBe("Safety & Use");
  });
});

describe("calculateClaimPenalties", () => {
  it("returns no penalties when no claims", () => {
    expect(calculateClaimPenalties([])).toEqual([]);
  });

  it("assigns weight by risk level", () => {
    const claims = [
      makeClaim({ claim: "eco-friendly", riskLevel: "high" }),
      makeClaim({ claim: "organic", riskLevel: "medium" }),
      makeClaim({ claim: "recyclable", riskLevel: "low" }),
    ];
    const penalties = calculateClaimPenalties(claims);
    expect(penalties).toHaveLength(3);

    const high = penalties.find((p) => p.claim === "eco-friendly");
    expect(high?.penalty).toBe(CLAIM_RISK_WEIGHTS.high);

    const medium = penalties.find((p) => p.claim === "organic");
    expect(medium?.penalty).toBe(CLAIM_RISK_WEIGHTS.medium);

    const low = penalties.find((p) => p.claim === "recyclable");
    expect(low?.penalty).toBe(CLAIM_RISK_WEIGHTS.low);
  });

  it("deduplicates claims by keyword", () => {
    const claims = [
      makeClaim({ claim: "eco-friendly", riskLevel: "high" }),
      makeClaim({ claim: "eco-friendly", riskLevel: "high" }),
      makeClaim({ claim: "eco-friendly", riskLevel: "high" }),
    ];
    const penalties = calculateClaimPenalties(claims);
    expect(penalties).toHaveLength(1);
  });

  it("includes reason with risk level", () => {
    const claims = [makeClaim({ claim: "non-toxic", riskLevel: "high" })];
    const penalties = calculateClaimPenalties(claims);
    expect(penalties[0].reason).toContain("non-toxic");
    expect(penalties[0].reason).toContain("high risk");
  });
});

describe("calculateMaxFieldScore", () => {
  it("sums required and optional weights for all fields", () => {
    const fields = [
      makeField({ required: true }),
      makeField({ required: true }),
      makeField({ required: false }),
      makeField({ required: false }),
      makeField({ required: false }),
    ];
    const expected = 2 * REQUIRED_FIELD_WEIGHT + 3 * OPTIONAL_FIELD_WEIGHT;
    expect(calculateMaxFieldScore(fields)).toBe(expected);
  });

  it("returns 0 for empty fields", () => {
    expect(calculateMaxFieldScore([])).toBe(0);
  });
});

describe("calculateRiskScore", () => {
  it("returns score 0 when all fields present and no claims", () => {
    const fields = [
      makeField({ key: "product_name", required: true, status: "found" }),
      makeField({ key: "brand", required: true, status: "found" }),
      makeField({ key: "materials", required: false, status: "found" }),
    ];
    const result = calculateRiskScore(fields, []);
    expect(result.score).toBe(0);
    expect(result.fieldPenalties).toHaveLength(0);
    expect(result.claimPenalties).toHaveLength(0);
  });

  it("returns max field score when all fields missing and no claims", () => {
    const fields = [
      makeField({ required: true, status: "missing" }),
      makeField({ key: "brand", required: true, status: "missing" }),
      makeField({ key: "materials", required: false, status: "missing" }),
    ];
    const result = calculateRiskScore(fields, []);
    const expectedMax = 2 * REQUIRED_FIELD_WEIGHT + 1 * OPTIONAL_FIELD_WEIGHT;
    expect(result.score).toBe(expectedMax);
    expect(result.maxScore).toBe(expectedMax);
    expect(result.score).toBe(result.maxScore);
  });

  it("combines field and claim penalties", () => {
    const fields = [
      makeField({ key: "product_name", required: true, status: "missing" }),
      makeField({ key: "materials", required: false, status: "found" }),
    ];
    const claims = [makeClaim({ claim: "sustainable", riskLevel: "high" })];
    const result = calculateRiskScore(fields, claims);
    expect(result.score).toBe(REQUIRED_FIELD_WEIGHT + CLAIM_RISK_WEIGHTS.high);
    expect(result.fieldPenalties).toHaveLength(1);
    expect(result.claimPenalties).toHaveLength(1);
  });

  it("maxScore includes max field penalties plus actual claim penalties", () => {
    const fields = [
      makeField({ key: "product_name", required: true, status: "found" }),
      makeField({ key: "materials", required: false, status: "found" }),
    ];
    const claims = [makeClaim({ claim: "eco-friendly", riskLevel: "high" })];
    const result = calculateRiskScore(fields, claims);
    const expectedMax =
      REQUIRED_FIELD_WEIGHT + OPTIONAL_FIELD_WEIGHT + CLAIM_RISK_WEIGHTS.high;
    expect(result.maxScore).toBe(expectedMax);
  });

  it("handles realistic full scan with 12 fields", () => {
    const fields: FieldResult[] = [
      makeField({
        key: "product_name",
        group: "Identity & Contacts",
        required: true,
        status: "found",
      }),
      makeField({
        key: "brand",
        group: "Identity & Contacts",
        required: true,
        status: "found",
      }),
      makeField({
        key: "manufacturer_name",
        group: "Identity & Contacts",
        required: false,
        status: "missing",
      }),
      makeField({
        key: "manufacturer_address",
        group: "Identity & Contacts",
        required: false,
        status: "missing",
      }),
      makeField({
        key: "contact_email_or_url",
        group: "Identity & Contacts",
        required: false,
        status: "found",
      }),
      makeField({
        key: "materials",
        group: "Composition & Origin",
        required: false,
        status: "found",
      }),
      makeField({
        key: "country_of_origin",
        group: "Composition & Origin",
        required: false,
        status: "missing",
      }),
      makeField({
        key: "warnings",
        group: "Safety & Use",
        required: false,
        status: "missing",
      }),
      makeField({
        key: "instructions",
        group: "Safety & Use",
        required: false,
        status: "found",
      }),
      makeField({
        key: "care_instructions",
        group: "Safety & Use",
        required: false,
        status: "missing",
      }),
      makeField({
        key: "marketing_claims",
        group: "Claims & Evidence",
        required: false,
        status: "found",
      }),
      makeField({
        key: "certifications",
        group: "Claims & Evidence",
        required: false,
        status: "missing",
      }),
    ];
    const claims = [
      makeClaim({ claim: "eco-friendly", riskLevel: "high" }),
      makeClaim({ claim: "organic", riskLevel: "medium" }),
    ];

    const result = calculateRiskScore(fields, claims);

    // 6 missing optional fields * 3 = 18, plus claims: 8 + 5 = 13, total = 31
    expect(result.score).toBe(
      6 * OPTIONAL_FIELD_WEIGHT +
        CLAIM_RISK_WEIGHTS.high +
        CLAIM_RISK_WEIGHTS.medium,
    );
    expect(result.fieldPenalties).toHaveLength(6);
    expect(result.claimPenalties).toHaveLength(2);
    expect(result.score).toBeLessThan(result.maxScore);
  });

  it("handles empty fields and empty claims", () => {
    const result = calculateRiskScore([], []);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
    expect(result.fieldPenalties).toEqual([]);
    expect(result.claimPenalties).toEqual([]);
  });

  it("deduplicates repeated claims in score", () => {
    const fields = [makeField({ required: false, status: "found" })];
    const claims = [
      makeClaim({ claim: "sustainable", riskLevel: "high" }),
      makeClaim({ claim: "sustainable", riskLevel: "high" }),
    ];
    const result = calculateRiskScore(fields, claims);
    expect(result.claimPenalties).toHaveLength(1);
    expect(result.score).toBe(CLAIM_RISK_WEIGHTS.high);
  });
});
