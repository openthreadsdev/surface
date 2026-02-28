import { describe, it, expect, beforeEach } from "vitest";
import type { EvidenceClip } from "../types/scan.js";
import {
  createClip,
  extractContext,
  addClip,
  removeClip,
  getClipsForField,
  getClipsForClaim,
  resetClipCounter,
} from "./clipper.js";

beforeEach(() => {
  resetClipCounter();
});

describe("extractContext", () => {
  const pageText =
    "Welcome to our store. This product is made from 100% organic cotton sourced from certified farms. It is eco-friendly and sustainable. Shop now.";

  it("extracts surrounding context around selected text", () => {
    const context = extractContext(pageText, "organic cotton");
    expect(context).toContain("organic cotton");
    expect(context.length).toBeGreaterThan("organic cotton".length);
  });

  it("adds ellipsis when context is truncated at start", () => {
    const context = extractContext(pageText, "sustainable", 20);
    expect(context.startsWith("…")).toBe(true);
  });

  it("adds ellipsis when context is truncated at end", () => {
    const context = extractContext(pageText, "Welcome", 10);
    expect(context.endsWith("…")).toBe(true);
  });

  it("returns full text when short enough", () => {
    const short = "organic cotton";
    const context = extractContext(short, "organic cotton", 80);
    expect(context).toBe("organic cotton");
  });

  it("returns selected text when not found in page", () => {
    const context = extractContext(pageText, "nonexistent phrase");
    expect(context).toBe("nonexistent phrase");
  });
});

describe("createClip", () => {
  const pageText =
    "Our product uses biodegradable packaging for sustainability.";
  const url = "https://example.com/product";

  it("creates a clip with text, context, url, and timestamp", () => {
    const clip = createClip("biodegradable packaging", pageText, url);
    expect(clip).not.toBeNull();
    expect(clip!.text).toBe("biodegradable packaging");
    expect(clip!.context).toContain("biodegradable packaging");
    expect(clip!.url).toBe(url);
    expect(clip!.timestamp).toBeTruthy();
    expect(clip!.id).toMatch(/^clip-\d+-\d+$/);
  });

  it("returns null for empty text", () => {
    expect(createClip("", pageText, url)).toBeNull();
  });

  it("returns null for whitespace-only text", () => {
    expect(createClip("   \n\t  ", pageText, url)).toBeNull();
  });

  it("trims selected text", () => {
    const clip = createClip("  biodegradable  ", pageText, url);
    expect(clip!.text).toBe("biodegradable");
  });

  it("attaches optional fieldKey", () => {
    const clip = createClip("biodegradable", pageText, url, {
      fieldKey: "materials",
    });
    expect(clip!.fieldKey).toBe("materials");
    expect(clip!.claimKeyword).toBeUndefined();
  });

  it("attaches optional claimKeyword", () => {
    const clip = createClip("biodegradable", pageText, url, {
      claimKeyword: "biodegradable",
    });
    expect(clip!.claimKeyword).toBe("biodegradable");
    expect(clip!.fieldKey).toBeUndefined();
  });

  it("generates unique IDs for each clip", () => {
    const clip1 = createClip("text1", pageText, url);
    const clip2 = createClip("text2", pageText, url);
    expect(clip1!.id).not.toBe(clip2!.id);
  });
});

function makeClip(overrides: Partial<EvidenceClip> = {}): EvidenceClip {
  return {
    id: "clip-1",
    text: "test text",
    context: "...test text...",
    url: "https://example.com",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("addClip", () => {
  it("appends a clip to the list", () => {
    const clip = makeClip({ id: "clip-new" });
    const result = addClip([], clip);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("clip-new");
  });

  it("does not mutate the original array", () => {
    const original: EvidenceClip[] = [];
    const clip = makeClip();
    addClip(original, clip);
    expect(original).toHaveLength(0);
  });
});

describe("removeClip", () => {
  it("removes a clip by ID", () => {
    const clips = [makeClip({ id: "a" }), makeClip({ id: "b" })];
    const result = removeClip(clips, "a");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("returns unchanged array when ID not found", () => {
    const clips = [makeClip({ id: "a" })];
    const result = removeClip(clips, "nonexistent");
    expect(result).toHaveLength(1);
  });

  it("does not mutate the original array", () => {
    const clips = [makeClip({ id: "a" })];
    removeClip(clips, "a");
    expect(clips).toHaveLength(1);
  });
});

describe("getClipsForField", () => {
  it("filters clips by fieldKey", () => {
    const clips = [
      makeClip({ id: "1", fieldKey: "materials" }),
      makeClip({ id: "2", fieldKey: "warnings" }),
      makeClip({ id: "3", fieldKey: "materials" }),
      makeClip({ id: "4" }),
    ];
    const result = getClipsForField(clips, "materials");
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.fieldKey === "materials")).toBe(true);
  });

  it("returns empty for no matches", () => {
    const clips = [makeClip({ id: "1", fieldKey: "materials" })];
    expect(getClipsForField(clips, "brand")).toEqual([]);
  });
});

describe("getClipsForClaim", () => {
  it("filters clips by claimKeyword", () => {
    const clips = [
      makeClip({ id: "1", claimKeyword: "eco-friendly" }),
      makeClip({ id: "2", claimKeyword: "organic" }),
      makeClip({ id: "3", claimKeyword: "eco-friendly" }),
    ];
    const result = getClipsForClaim(clips, "eco-friendly");
    expect(result).toHaveLength(2);
  });

  it("returns empty for no matches", () => {
    const clips = [makeClip({ id: "1", claimKeyword: "organic" })];
    expect(getClipsForClaim(clips, "vegan")).toEqual([]);
  });
});
