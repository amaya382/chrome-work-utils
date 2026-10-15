chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// Pages that were open before the extension loaded have no content script to receive messages.
const send = (tabId, message, options) => chrome.tabs.sendMessage(tabId, message, options).catch(() => {});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-drawing') send(tab.id, { type: 'toggle-drawing' }, { frameId: 0 });
});
