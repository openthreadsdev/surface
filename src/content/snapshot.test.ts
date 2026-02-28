// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  extractMetaTags,
  extractTextContent,
  extractSkuHints,
  captureSnapshot,
} from "./snapshot.js";

function makeDoc(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

// Need jsdom/happy-dom for DOMParser — run these with vitest "jsdom" env
// For now, we test the pure functions that don't need a real DOM

describe("extractSkuHints", () => {
  it("extracts SKU patterns", () => {
    const text = "Product details: SKU: ABC-123-XYZ available now";
    expect(extractSkuHints(text)).toEqual(["ABC-123-XYZ"]);
  });

  it("extracts ASIN patterns", () => {
    const text = "ASIN: B08N5WRWNW is in stock";
    expect(extractSkuHints(text)).toEqual(["B08N5WRWNW"]);
  });

  it("extracts UPC patterns", () => {
    const text = "UPC: 012345678901 barcode";
    expect(extractSkuHints(text)).toEqual(["012345678901"]);
  });

  it("extracts Item/Model/Part number patterns", () => {
    const text = "Model No. RF-2400X and Part #WZ-100";
    const hints = extractSkuHints(text);
    expect(hints).toContain("RF-2400X");
    expect(hints).toContain("WZ-100");
  });

  it("deduplicates repeated matches", () => {
    const text = "SKU: ABC-123 and also SKU: ABC-123 again";
    expect(extractSkuHints(text)).toEqual(["ABC-123"]);
  });

  it("returns empty for text without identifiers", () => {
    expect(extractSkuHints("Just a regular description")).toEqual([]);
  });

  it("handles multiple different identifier types", () => {
    const text = "SKU: PROD-001 ASIN: B01ABCDEFG UPC: 123456789012";
    const hints = extractSkuHints(text);
    expect(hints).toHaveLength(3);
    expect(hints).toContain("PROD-001");
    expect(hints).toContain("B01ABCDEFG");
    expect(hints).toContain("123456789012");
  });

  it("handles EAN and ISBN patterns", () => {
    const text = "EAN: 4006381333931 ISBN: 978-3-16-148410-0";
    const hints = extractSkuHints(text);
    expect(hints).toContain("4006381333931");
    expect(hints).toContain("978-3-16-148410-0");
  });
});

describe("extractMetaTags", () => {
  it("extracts meta name tags", () => {
    const doc = makeDoc(
      '<html><head><meta name="description" content="A product"></head><body></body></html>',
    );
    const meta = extractMetaTags(doc);
    expect(meta["description"]).toBe("A product");
  });

  it("extracts Open Graph property tags", () => {
    const doc = makeDoc(
      '<html><head><meta property="og:title" content="My Product"></head><body></body></html>',
    );
    const meta = extractMetaTags(doc);
    expect(meta["og:title"]).toBe("My Product");
  });

  it("extracts itemprop meta tags", () => {
    const doc = makeDoc(
      '<html><head><meta itemprop="brand" content="Acme"></head><body></body></html>',
    );
    const meta = extractMetaTags(doc);
    expect(meta["brand"]).toBe("Acme");
  });

  it("skips meta tags without content", () => {
    const doc = makeDoc(
      '<html><head><meta name="empty" content=""><meta name="valid" content="yes"></head><body></body></html>',
    );
    const meta = extractMetaTags(doc);
    expect(meta["empty"]).toBeUndefined();
    expect(meta["valid"]).toBe("yes");
  });

  it("returns empty object for no meta tags", () => {
    const doc = makeDoc("<html><head></head><body></body></html>");
    expect(extractMetaTags(doc)).toEqual({});
  });
});

describe("extractTextContent", () => {
  it("extracts visible text content", () => {
    const doc = makeDoc(
      "<html><body><h1>Title</h1><p>Description here</p></body></html>",
    );
    const text = extractTextContent(doc);
    expect(text).toContain("Title");
    expect(text).toContain("Description here");
  });

  it("strips script and style tags", () => {
    const doc = makeDoc(
      "<html><body><p>Visible</p><script>alert(1)</script><style>.x{}</style></body></html>",
    );
    const text = extractTextContent(doc);
    expect(text).toContain("Visible");
    expect(text).not.toContain("alert");
    expect(text).not.toContain(".x{}");
  });

  it("collapses whitespace", () => {
    const doc = makeDoc(
      "<html><body><p>Hello</p>   \n\n   <p>World</p></body></html>",
    );
    const text = extractTextContent(doc);
    expect(text).not.toMatch(/\s{2,}/);
  });

  it("handles empty body", () => {
    const doc = makeDoc("<html><body></body></html>");
    expect(extractTextContent(doc)).toBe("");
  });
});

describe("captureSnapshot", () => {
  it("returns a complete snapshot", () => {
    const doc = makeDoc(
      '<html><head><title>Test Product</title><meta name="description" content="Great product"></head><body><p>SKU: TEST-001</p></body></html>',
    );
    const snapshot = captureSnapshot(doc, "https://example.com/product");
    expect(snapshot.url).toBe("https://example.com/product");
    expect(snapshot.title).toBe("Test Product");
    expect(snapshot.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(snapshot.meta["description"]).toBe("Great product");
    expect(snapshot.textContent).toContain("SKU: TEST-001");
    expect(snapshot.skuHints).toContain("TEST-001");
  });

  it("handles a minimal page", () => {
    const doc = makeDoc(
      "<html><head><title></title></head><body></body></html>",
    );
    const snapshot = captureSnapshot(doc, "https://example.com");
    expect(snapshot.url).toBe("https://example.com");
    expect(snapshot.title).toBe("");
    expect(snapshot.meta).toEqual({});
    expect(snapshot.textContent).toBe("");
    expect(snapshot.skuHints).toEqual([]);
  });
});
