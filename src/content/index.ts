import { captureSnapshot, extractTextContent } from "./snapshot.js";
import { createClip } from "../evidence/clipper.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ status: "ready" });
  } else if (message.type === "SCAN") {
    const snapshot = captureSnapshot(document, window.location.href);
    sendResponse({ status: "ok", snapshot });
  } else if (message.type === "CLIP_EVIDENCE") {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || "";
    if (!selectedText) {
      sendResponse({ status: "error", error: "No text selected." });
      return true;
    }
    const pageText = extractTextContent(document);
    const clip = createClip(selectedText, pageText, window.location.href, {
      fieldKey: message.fieldKey,
      claimKeyword: message.claimKeyword,
    });
    sendResponse({ status: "ok", clip });
  }
  return true;
});
