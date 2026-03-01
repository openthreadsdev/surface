import { describe, it, expect } from "vitest";
import type { ScanResult } from "../types/scan.js";
import {
  buildThreadmarkBundle,
  serializeBundle,
  generateFilename,
  THREADMARK_VERSION,
  THREADMARK_GENERATOR,
} from "./threadmark.js";

function makeScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    url: "https://example.com/product/widget",
    title: "Acme Widget",
    category: "general",
    timestamp: "2026-02-28T12:00:00.000Z",
    fields: [],
    claims: [],
    evidence: [],
    ...overrides,
  };
}

describe("buildThreadmarkBundle", () => {
  it("includes version and generator metadata", () => {
    const bundle = buildThreadmarkBundle(makeScanResult());
    expect(bundle.version).toBe(THREADMARK_VERSION);
    expect(bundle.generator).toBe(THREADMARK_GENERATOR);
  });

  it("sets exportedAt to current time when not provided", () => {
    const before = new Date().toISOString();
    const bundle = buildThreadmarkBundle(makeScanResult());
    const after = new Date().toISOString();
    expect(bundle.exportedAt >= before).toBe(true);
    expect(bundle.exportedAt <= after).toBe(true);
  });

  it("accepts custom exportedAt timestamp", () => {
    const customTime = "2026-02-28T15:30:00.000Z";
    const bundle = buildThreadmarkBundle(makeScanResult(), customTime);
    expect(bundle.exportedAt).toBe(customTime);
  });

  it("maps scan metadata from ScanResult", () => {
    const bundle = buildThreadmarkBundle(
      makeScanResult({
        url: "https://shop.example.com/item/42",
        title: "Test Product",
        category: "textiles",
        timestamp: "2026-02-28T10:00:00.000Z",
      }),
    );
    expect(bundle.scan.url).toBe("https://shop.example.com/item/42");
    expect(bundle.scan.title).toBe("Test Product");
    expect(bundle.scan.category).toBe("textiles");
    expect(bundle.scan.scannedAt).toBe("2026-02-28T10:00:00.000Z");
  });

  it("includes fields from scan result", () => {
    const fields = [
      {
        key: "product_name",
        group: "Identity & Contacts",
        required: true,
        status: "found" as const,
        value: "Widget X",
        confidence: 0.9,
      },
      {
        key: "materials",
        group: "Composition & Origin",
        required: false,
        status: "missing" as const,
        confidence: 1.0,
      },
    ];
    const bundle = buildThreadmarkBundle(makeScanResult({ fields }));
    expect(bundle.fields).toEqual(fields);
  });

  it("includes claims from scan result", () => {
    const claims = [
      {
        claim: "eco-friendly",
        riskLevel: "high" as const,
        evidenceRequired: "Third-party certification",
        source: "...eco-friendly product...",
      },
    ];
    const bundle = buildThreadmarkBundle(makeScanResult({ claims }));
    expect(bundle.claims).toEqual(claims);
  });

  it("includes evidence clips from scan result", () => {
    const evidence = [
      {
        id: "clip-1",
        text: "100% organic cotton",
        context: "...made from 100% organic cotton sourced...",
        url: "https://example.com/product",
        timestamp: "2026-02-28T12:00:00.000Z",
        fieldKey: "materials",
      },
    ];
    const bundle = buildThreadmarkBundle(makeScanResult({ evidence }));
    expect(bundle.evidence).toEqual(evidence);
  });

  it("includes risk summary when breakdown is present", () => {
    const bundle = buildThreadmarkBundle(
      makeScanResult({
        riskBreakdown: {
          score: 23,
          maxScore: 50,
          fieldPenalties: [
            {
              key: "materials",
              group: "Composition & Origin",
              required: false,
              penalty: 3,
              reason: 'Optional field "materials" is missing',
            },
          ],
          claimPenalties: [
            {
              claim: "eco-friendly",
              riskLevel: "high",
              penalty: 8,
              reason: 'Unsubstantiated "eco-friendly" claim (high risk)',
            },
          ],
        },
      }),
    );
    expect(bundle.riskSummary).toEqual({
      score: 23,
      maxScore: 50,
      fieldPenaltyCount: 1,
      claimPenaltyCount: 1,
    });
  });

  it("sets riskSummary to null when no breakdown", () => {
    const bundle = buildThreadmarkBundle(makeScanResult());
    expect(bundle.riskSummary).toBeNull();
  });
});

describe("serializeBundle", () => {
  it("produces valid JSON", () => {
    const bundle = buildThreadmarkBundle(makeScanResult());
    const json = serializeBundle(bundle);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(THREADMARK_VERSION);
    expect(parsed.generator).toBe(THREADMARK_GENERATOR);
  });

  it("is pretty-printed with 2-space indent", () => {
    const bundle = buildThreadmarkBundle(makeScanResult());
    const json = serializeBundle(bundle);
    expect(json).toContain("\n  ");
  });

  it("round-trips all data", () => {
    const scanResult = makeScanResult({
      fields: [
        {
          key: "brand",
          group: "Identity & Contacts",
          required: true,
          status: "found",
          value: "Acme",
          confidence: 0.9,
        },
      ],
      claims: [
        {
          claim: "sustainable",
          riskLevel: "high",
          evidenceRequired: "Certification",
          source: "...sustainable...",
        },
      ],
      evidence: [
        {
          id: "clip-1",
          text: "certified organic",
          context: "...certified organic...",
          url: "https://example.com",
          timestamp: "2026-02-28T12:00:00.000Z",
        },
      ],
    });
    const bundle = buildThreadmarkBundle(scanResult);
    const json = serializeBundle(bundle);
    const parsed = JSON.parse(json);
    expect(parsed.fields).toEqual(bundle.fields);
    expect(parsed.claims).toEqual(bundle.claims);
    expect(parsed.evidence).toEqual(bundle.evidence);
  });
});

describe("generateFilename", () => {
  it("generates filename with hostname and date", () => {
    const bundle = buildThreadmarkBundle(
      makeScanResult(),
      "2026-02-28T15:30:00.000Z",
    );
    const filename = generateFilename(bundle);
    expect(filename).toBe("threadmark-example.com-2026-02-28.json");
  });

  it("sanitizes unusual hostnames", () => {
    const bundle = buildThreadmarkBundle(
      makeScanResult({ url: "https://shop.example.co.uk/item" }),
      "2026-03-01T00:00:00.000Z",
    );
    const filename = generateFilename(bundle);
    expect(filename).toBe("threadmark-shop.example.co.uk-2026-03-01.json");
  });

  it("handles invalid URLs gracefully", () => {
    const bundle = buildThreadmarkBundle(
      makeScanResult({ url: "not-a-url" }),
      "2026-02-28T00:00:00.000Z",
    );
    const filename = generateFilename(bundle);
    expect(filename).toBe("threadmark-unknown-2026-02-28.json");
  });
});
