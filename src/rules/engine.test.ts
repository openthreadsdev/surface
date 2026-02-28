import { describe, it, expect } from "vitest";
import type { PageSnapshot } from "../content/snapshot.js";
import {
  detectField,
  evaluateFields,
  detectClaims,
  runRules,
} from "./engine.js";

function makeSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: "https://example.com/product",
    title: "Test Product",
    timestamp: new Date().toISOString(),
    meta: {},
    textContent: "",
    skuHints: [],
    ...overrides,
  };
}

describe("detectField", () => {
  it("finds a field via meta tag", () => {
    const result = detectField("product_name", "", { "og:title": "Widget X" });
    expect(result.status).toBe("found");
    expect(result.value).toBe("Widget X");
    expect(result.confidence).toBe(0.9);
  });

  it("finds a field via text pattern", () => {
    const result = detectField(
      "country_of_origin",
      "This product is Made in USA with care",
      {},
    );
    expect(result.status).toBe("found");
    expect(result.value).toBeDefined();
    expect(result.confidence).toBe(0.7);
  });

  it("returns missing when field not found", () => {
    const result = detectField("manufacturer_address", "Nothing here", {});
    expect(result.status).toBe("missing");
    expect(result.confidence).toBe(1.0);
    expect(result.value).toBeUndefined();
  });

  it("prefers meta over text when both present", () => {
    const result = detectField("brand", "Brand: TextBrand", {
      "og:brand": "MetaBrand",
    });
    expect(result.value).toBe("MetaBrand");
    expect(result.confidence).toBe(0.9);
  });

  it("detects email in contact field", () => {
    const result = detectField(
      "contact_email_or_url",
      "Reach us at help@example.com for support",
      {},
    );
    expect(result.status).toBe("found");
  });

  it("detects warnings", () => {
    const result = detectField(
      "warnings",
      "WARNING: This product contains chemicals known to cause harm",
      {},
    );
    expect(result.status).toBe("found");
  });

  it("detects materials", () => {
    const result = detectField(
      "materials",
      "Materials: 100% organic cotton",
      {},
    );
    expect(result.status).toBe("found");
    expect(result.value).toContain("cotton");
  });

  it("detects care instructions", () => {
    const result = detectField(
      "care_instructions",
      "Care instructions: Machine wash cold, tumble dry low",
      {},
    );
    expect(result.status).toBe("found");
  });

  it("detects certifications", () => {
    const result = detectField(
      "certifications",
      "Certified by OEKO-TEX Standard 100",
      {},
    );
    expect(result.status).toBe("found");
  });
});

describe("evaluateFields", () => {
  it("returns results for all 12 defined fields", () => {
    const snapshot = makeSnapshot();
    const results = evaluateFields(snapshot, "general");
    expect(results).toHaveLength(12);
  });

  it("marks fields as found when text matches", () => {
    const snapshot = makeSnapshot({
      textContent:
        "Brand: Acme Corp. Materials: 100% cotton. Made in Portugal. Warning: Keep away from fire.",
      meta: { "og:title": "Acme T-Shirt" },
    });
    const results = evaluateFields(snapshot, "textiles");
    const found = results.filter((r) => r.status === "found");
    expect(found.length).toBeGreaterThanOrEqual(4);

    const productName = results.find((r) => r.key === "product_name");
    expect(productName?.status).toBe("found");

    const brand = results.find((r) => r.key === "brand");
    expect(brand?.status).toBe("found");
  });

  it("marks all fields missing for empty snapshot", () => {
    const snapshot = makeSnapshot();
    const results = evaluateFields(snapshot, "general");
    const missing = results.filter((r) => r.status === "missing");
    expect(missing).toHaveLength(12);
  });

  it("preserves group and required from field definitions", () => {
    const snapshot = makeSnapshot();
    const results = evaluateFields(snapshot, "general");

    const productName = results.find((r) => r.key === "product_name");
    expect(productName?.group).toBe("Identity & Contacts");
    expect(productName?.required).toBe(true);

    const materials = results.find((r) => r.key === "materials");
    expect(materials?.group).toBe("Composition & Origin");
    expect(materials?.required).toBe(false);
  });
});

describe("detectClaims", () => {
  it("flags eco-friendly as high risk", () => {
    const snapshot = makeSnapshot({
      textContent: "Our eco-friendly product is made with care",
    });
    const claims = detectClaims(snapshot);
    expect(claims).toHaveLength(1);
    expect(claims[0].claim).toBe("eco-friendly");
    expect(claims[0].riskLevel).toBe("high");
    expect(claims[0].source).toBeTruthy();
  });

  it("flags multiple claims", () => {
    const snapshot = makeSnapshot({
      textContent:
        "This sustainable, biodegradable, and organic product is vegan",
    });
    const claims = detectClaims(snapshot);
    expect(claims.length).toBeGreaterThanOrEqual(4);
    const claimNames = claims.map((c) => c.claim);
    expect(claimNames).toContain("sustainable");
    expect(claimNames).toContain("biodegradable");
    expect(claimNames).toContain("organic");
    expect(claimNames).toContain("vegan");
  });

  it("returns empty for text without risky claims", () => {
    const snapshot = makeSnapshot({
      textContent: "A regular product description with no special claims",
    });
    expect(detectClaims(snapshot)).toEqual([]);
  });

  it("is case-insensitive", () => {
    const snapshot = makeSnapshot({
      textContent: "ECO-FRIENDLY and SUSTAINABLE materials",
    });
    const claims = detectClaims(snapshot);
    expect(claims.length).toBeGreaterThanOrEqual(2);
  });

  it("includes surrounding context as source", () => {
    const snapshot = makeSnapshot({
      textContent: "We are proud to offer a non-toxic cleaning solution",
    });
    const claims = detectClaims(snapshot);
    const nonToxic = claims.find((c) => c.claim === "non-toxic");
    expect(nonToxic?.source).toContain("non-toxic");
    expect(nonToxic?.source?.length).toBeGreaterThan(10);
  });
});

describe("runRules", () => {
  it("returns both fields and claims", () => {
    const snapshot = makeSnapshot({
      textContent:
        "Brand: TestCo. Materials: recycled plastic. This eco-friendly product is non-toxic.",
      meta: { "og:title": "TestCo Green Widget" },
    });
    const result = runRules(snapshot, "general");

    expect(result.fields).toHaveLength(12);
    expect(result.claims.length).toBeGreaterThanOrEqual(2);

    const brand = result.fields.find((f) => f.key === "brand");
    expect(brand?.status).toBe("found");
  });

  it("works with empty snapshot", () => {
    const snapshot = makeSnapshot();
    const result = runRules(snapshot, "general");
    expect(result.fields).toHaveLength(12);
    expect(result.claims).toHaveLength(0);
  });
});
