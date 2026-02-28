// Content script entry point – listens for scan requests from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ status: "ready" });
  }
  return true;
});
