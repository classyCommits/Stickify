// background.js

// This listener runs when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener(() => {
    // This ensures the side panel will open with the correct HTML file.
    chrome.sidePanel.setOptions({
      path: 'sidepanel.html',
      enabled: true
    });
  });
  
  // Explicitly tell the browser to open the side panel on the action icon click.
  // This is the most reliable method.
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));