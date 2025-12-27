chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "open_dashboard" }).catch(() => {
            console.log("BlockItOut: script not active on this tab");
        });
    }
});