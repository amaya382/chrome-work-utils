importScripts('annotation.js');

const { HIGHLIGHT_COLORS } = WorkAnnotation;

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  for (const { id, title } of HIGHLIGHT_COLORS) {
    chrome.contextMenus.create({ id: `highlight:${id}`, title: `Highlight ${title.toLowerCase()}`, contexts: ['selection'] });
  }
  chrome.contextMenus.create({ id: 'separator', type: 'separator', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 'remove-highlight', title: 'Remove highlight', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 'clear-highlights', title: 'Clear highlights', contexts: ['selection'] });
});

// Pages that were open before the extension loaded have no content script to receive messages.
const send = (tabId, message, options) => chrome.tabs.sendMessage(tabId, message, options).catch(() => {});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const [type, color] = String(info.menuItemId).split(':');
  send(tab.id, { type, color }, { frameId: info.frameId });
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-drawing') send(tab.id, { type: 'toggle-drawing' }, { frameId: 0 });
});
