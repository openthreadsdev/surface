import { describe, it, expect, beforeEach } from "vitest";
import { getSelectedCategory, setStatus, setScanEnabled } from "./popup-ui.js";

function makeSelect(value: string): HTMLSelectElement {
  return { value } as unknown as HTMLSelectElement;
}

function makeStatusElements() {
  return {
    status: { hidden: true, className: "" } as unknown as HTMLDivElement,
    statusMessage: { textContent: "" } as unknown as HTMLParagraphElement,
  };
}

function makeButton(): HTMLButtonElement {
  return { disabled: false, textContent: "Scan Page" } as HTMLButtonElement;
}

describe("getSelectedCategory", () => {
  it("returns a valid category when selected", () => {
    expect(getSelectedCategory(makeSelect("textiles"))).toBe("textiles");
    expect(getSelectedCategory(makeSelect("children"))).toBe("children");
    expect(getSelectedCategory(makeSelect("cosmetics"))).toBe("cosmetics");
    expect(getSelectedCategory(makeSelect("electronics"))).toBe("electronics");
    expect(getSelectedCategory(makeSelect("general"))).toBe("general");
  });

  it("defaults to general for invalid values", () => {
    expect(getSelectedCategory(makeSelect("invalid"))).toBe("general");
    expect(getSelectedCategory(makeSelect(""))).toBe("general");
  });
});

describe("setStatus", () => {
  let el: ReturnType<typeof makeStatusElements>;

  beforeEach(() => {
    el = makeStatusElements();
  });

  it("shows scanning state", () => {
    setStatus(el, "scanning", "Scanning page…");
    expect(el.status.hidden).toBe(false);
    expect(el.status.className).toBe("status scanning");
    expect(el.statusMessage.textContent).toBe("Scanning page…");
  });

  it("shows error state", () => {
    setStatus(el, "error", "Something went wrong.");
    expect(el.status.className).toBe("status error");
    expect(el.statusMessage.textContent).toBe("Something went wrong.");
  });

  it("shows success state", () => {
    setStatus(el, "success", "Scan complete.");
    expect(el.status.className).toBe("status success");
    expect(el.statusMessage.textContent).toBe("Scan complete.");
  });
});

describe("setScanEnabled", () => {
  it("disables button and shows scanning text", () => {
    const btn = makeButton();
    setScanEnabled(btn, false);
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe("Scanning…");
  });

  it("enables button and shows default text", () => {
    const btn = makeButton();
    btn.disabled = true;
    setScanEnabled(btn, true);
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe("Scan Page");
  });
});
