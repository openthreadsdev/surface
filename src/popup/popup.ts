import type { PopupElements } from "./popup-ui.js";
import {
  getElements,
  getSelectedCategory,
  setStatus,
  setScanEnabled,
} from "./popup-ui.js";

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab?.id;
}

async function handleScan(elements: PopupElements) {
  const category = getSelectedCategory(elements.categorySelect);
  setScanEnabled(elements.scanBtn, false);
  setStatus(elements, "scanning", "Scanning page…");

  try {
    const tabId = await getActiveTabId();
    if (tabId === undefined) {
      setStatus(elements, "error", "No active tab found.");
      return;
    }

    const response = await chrome.tabs.sendMessage(tabId, {
      type: "SCAN",
      category,
    });

    if (response?.status === "ok") {
      setStatus(elements, "success", "Scan complete.");
    } else {
      setStatus(
        elements,
        "error",
        response?.error ?? "Unexpected response from content script.",
      );
    }
  } catch {
    setStatus(
      elements,
      "error",
      "Could not reach page. Try refreshing the tab.",
    );
  } finally {
    setScanEnabled(elements.scanBtn, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const elements = getElements();
  elements.scanBtn.addEventListener("click", () => handleScan(elements));
});
