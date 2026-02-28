import { describe, it, expect } from "vitest";
import { FIELD_GROUPS } from "./field-groups.js";

describe("field-groups", () => {
  it("should have four field groups", () => {
    expect(FIELD_GROUPS).toHaveLength(4);
  });

  it("should include all expected group names", () => {
    const names = FIELD_GROUPS.map((g) => g.group);
    expect(names).toContain("Identity & Contacts");
    expect(names).toContain("Composition & Origin");
    expect(names).toContain("Safety & Use");
    expect(names).toContain("Claims & Evidence");
  });

  it("should have product_name and brand as required fields", () => {
    const identity = FIELD_GROUPS.find(
      (g) => g.group === "Identity & Contacts",
    );
    expect(identity).toBeDefined();
    const productName = identity!.fields.find((f) => f.key === "product_name");
    const brand = identity!.fields.find((f) => f.key === "brand");
    expect(productName?.required).toBe(true);
    expect(brand?.required).toBe(true);
  });

  it("should have unique field keys across all groups", () => {
    const allKeys = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    const uniqueKeys = new Set(allKeys);
    expect(uniqueKeys.size).toBe(allKeys.length);
  });

  it("should have 12 total fields matching the PRD", () => {
    const total = FIELD_GROUPS.reduce((sum, g) => sum + g.fields.length, 0);
    expect(total).toBe(12);
  });
});
