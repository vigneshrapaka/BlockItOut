chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "open_dashboard" }).catch(() => {
            chrome.tabs.create({ url: "https://www.google.com/search?q=blockitout" });
        });
    }
});