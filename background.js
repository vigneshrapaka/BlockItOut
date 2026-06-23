chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'close_tab') {
    if (sender.tab && sender.tab.id) {
      try {
        const promise = chrome.tabs.remove(sender.tab.id);
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => {});
        }
      } catch (e) {
        // Ignore any synchronous errors
      }
    }
  }
});
