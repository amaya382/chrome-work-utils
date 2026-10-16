const { textColor } = WorkCore;
const { HIGHLIGHT_COLORS } = WorkAnnotation;
const { DEFAULTS } = WorkLink;

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Rejects on pages without content scripts, such as chrome:// pages.
async function sendToPage(message, options = { frameId: 0 }) {
  return chrome.tabs.sendMessage((await activeTab()).id, message, options);
}

function showEnvironment(environment) {
  if (!environment) return;
  const chip = document.getElementById('environment-chip');
  chip.textContent = environment.name || 'Unnamed';
  chip.style.background = environment.color;
  chip.style.color = textColor(environment.color);
  chip.hidden = false;
  document.getElementById('environment').textContent = 'matches this page';
}

async function init() {
  try {
    const [environment, drawing] = await Promise.all([sendToPage({ type: 'environment' }), sendToPage({ type: 'drawing' })]);
    showEnvironment(environment);
    document.getElementById('draw-label').textContent = drawing ? 'Stop drawing' : 'Start drawing';
  } catch {
    document.getElementById('environment').textContent = 'Not available on this page';
    for (const button of document.querySelectorAll('[data-page]')) button.disabled = true;
    document.getElementById('unavailable').hidden = false;
  }
}

document.getElementById('rules').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

document.getElementById('draw').addEventListener('click', async () => {
  await sendToPage({ type: 'toggle-drawing' });
  window.close();
});

document.getElementById('clear-highlights').addEventListener('click', async () => {
  await sendToPage({ type: 'clear-highlights' }, {});
  window.close();
});

chrome.commands.getAll().then((commands) => {
  document.getElementById('shortcut').textContent = commands.find((c) => c.name === 'toggle-drawing')?.shortcut ?? '';
});

document.getElementById('highlight-colors').append(
  ...HIGHLIGHT_COLORS.map(({ title, hex }) => Object.assign(document.createElement('span'), { title, style: `background: ${hex}` })),
);

const pasteLink = document.getElementById('paste-link');
chrome.storage.sync.get(DEFAULTS).then((stored) => (pasteLink.checked = stored.pasteLink));
pasteLink.addEventListener('change', () => chrome.storage.sync.set({ pasteLink: pasteLink.checked }));

init();
