import { captureSnapshot } from "./snapshot.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ status: "ready" });
  } else if (message.type === "SCAN") {
    const snapshot = captureSnapshot(document, window.location.href);
    sendResponse({ status: "ok", snapshot });
  }
  return true;
});
