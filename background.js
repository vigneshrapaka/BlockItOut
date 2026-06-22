chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "close_tab") {
        if (sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id).catch(() => {});
        }
    }
});
