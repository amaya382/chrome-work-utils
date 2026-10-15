(() => {
  const { findRule, textColor, retitle } = DevelopmentCore;

  // Consoles are single-page apps that switch projects and accounts without a page load.
  const POLL_MS = 1000;

  const STYLE = `
    :host { all: initial; }
    .bar, .frame, .label { position: fixed; pointer-events: none; z-index: 2147483647; }
    .bar { top: 0; left: 0; right: 0; height: 4px; background: var(--color); }
    .frame { inset: 0; border: 6px solid var(--color); }
    .label {
      top: 0; left: 50%; transform: translateX(-50%);
      padding: 2px 12px; border-radius: 0 0 6px 6px;
      background: var(--color); color: var(--text);
      font: 600 12px/1.4 system-ui, sans-serif; white-space: nowrap;
      transition: opacity 0.15s;
    }
    .label.away { opacity: 0.15; }
  `;

  let rules = [];
  let appliedKey = null;
  let host = null;
  let label = null;
  let titledName = null;
  let timer = null;

  const page = () => ({
    href: location.href,
    cookie: document.cookie,
    meta: (name) => document.querySelector(`meta[name="${CSS.escape(name)}"]`)?.content ?? null,
    text: (selector) => {
      try {
        return document.querySelector(selector)?.textContent ?? null;
      } catch {
        return null;
      }
    },
  });

  function applyTitle(name) {
    const title = retitle(document.title, titledName, name);
    titledName = name;
    if (title !== document.title) document.title = title;
  }

  function show(rule) {
    host ??= document.createElement('development-utils-environment');
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${STYLE}</style><div class="${rule.style}"></div><div class="label"></div>`;
    host.style.setProperty('--color', rule.color);
    host.style.setProperty('--text', textColor(rule.color));
    label = shadow.querySelector('.label');
    label.textContent = rule.name;
    label.hidden = !rule.name;
    if (!host.isConnected) document.documentElement.append(host);
  }

  function hide() {
    host?.remove();
    label = null;
  }

  function update() {
    const rule = findRule(rules, page());
    const key = rule && JSON.stringify(rule);
    if (key === appliedKey) return;
    appliedKey = key;
    if (rule) show(rule);
    else hide();
    applyTitle(rule?.name || null);
  }

  function restart() {
    clearInterval(timer);
    timer = rules.length ? setInterval(update, POLL_MS) : null;
    appliedKey = undefined;
    update();
  }

  // The label sits over the page's header, so it fades while the pointer is on it.
  document.addEventListener(
    'mousemove',
    (event) => {
      if (!label?.isConnected) return;
      const rect = label.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      label.classList.toggle('away', inside);
    },
    { passive: true },
  );

  new MutationObserver(() => {
    if (titledName) applyTitle(titledName);
  }).observe(document.head ?? document.documentElement, { subtree: true, childList: true, characterData: true });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.rules) return;
    rules = changes.rules.newValue ?? [];
    restart();
  });

  chrome.storage.sync.get({ rules: [] }).then((stored) => {
    rules = stored.rules;
    restart();
  });
})();
