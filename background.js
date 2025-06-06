chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    const url = details.url;
    const timestamp = new Date().toLocaleString();

    chrome.storage.local.get(["userEmail", "history"], (data) => {
      if (!data.userEmail) return;

      const history = data.history || [];
      history.push({ url, timestamp });

      if (history.length > 100) history.shift();

      chrome.storage.local.set({ history });
    });
  }
});
