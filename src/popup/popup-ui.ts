import type { ProductCategory } from "../types/scan.js";

export interface PopupElements {
  categorySelect: HTMLSelectElement;
  scanBtn: HTMLButtonElement;
  status: HTMLDivElement;
  statusMessage: HTMLParagraphElement;
  results: HTMLDivElement;
}

export function getElements(): PopupElements {
  return {
    categorySelect: document.getElementById(
      "category-select",
    ) as HTMLSelectElement,
    scanBtn: document.getElementById("scan-btn") as HTMLButtonElement,
    status: document.getElementById("status") as HTMLDivElement,
    statusMessage: document.getElementById(
      "status-message",
    ) as HTMLParagraphElement,
    results: document.getElementById("results") as HTMLDivElement,
  };
}

export function getSelectedCategory(
  select: HTMLSelectElement,
): ProductCategory {
  const value = select.value;
  const valid: ProductCategory[] = [
    "general",
    "textiles",
    "children",
    "cosmetics",
    "electronics",
  ];
  if (valid.includes(value as ProductCategory)) {
    return value as ProductCategory;
  }
  return "general";
}

export function setStatus(
  el: { status: HTMLDivElement; statusMessage: HTMLParagraphElement },
  state: "scanning" | "error" | "success",
  message: string,
) {
  el.status.hidden = false;
  el.status.className = `status ${state}`;
  el.statusMessage.textContent = message;
}

export function setScanEnabled(btn: HTMLButtonElement, enabled: boolean) {
  btn.disabled = !enabled;
  btn.textContent = enabled ? "Scan Page" : "Scanning…";
}
