(() => {
  const { TOOLS, DRAW_COLORS, choices, normalizeSettings, createHistory, commit, undo, redo, currentShapes, createLayer, layerOrigin, pinLayer, unpinLayer } =
    DevelopmentAnnotation;

  const ICONS = {
    grip: '<circle cx="6" cy="4" r=".6"/><circle cx="10" cy="4" r=".6"/><circle cx="6" cy="8" r=".6"/><circle cx="10" cy="8" r=".6"/><circle cx="6" cy="12" r=".6"/><circle cx="10" cy="12" r=".6"/>',
    pen: '<path d="M3 13l.8-3.2L11 2.6 13.4 5l-7.2 7.2z"/>',
    line: '<path d="M3 13L13 3"/>',
    rect: '<rect x="2.5" y="4" width="11" height="8" rx=".5"/>',
    ellipse: '<circle cx="8" cy="8" r="5.5"/>',
    eraser: '<path d="M7 13.5h6.5M7 13.5H5L2.5 11l6.5-6.5 4 4-5 5M5.5 8l4 4"/>',
    undo: '<path d="M4 6h6a3 3 0 0 1 0 6H7M4 6l2.5-2.5M4 6l2.5 2.5"/>',
    redo: '<path d="M12 6H6a3 3 0 0 0 0 6h3M12 6L9.5 3.5M12 6L9.5 8.5"/>',
    clear: '<path d="M3 4.5h10M6.5 4.5v-2h3v2M4.5 4.5l.6 9h5.8l.6-9"/>',
    visibility: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/><path class="slash" d="M2.5 2.5l11 11"/>',
    pin: '<path d="M5.5 2h5M6.5 2v4L4 9h8L9.5 6V2M8 9v5"/>',
    close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  };

  const ACTIONS = [
    { id: 'undo', title: 'Undo (Ctrl+Z)' },
    { id: 'redo', title: 'Redo (Ctrl+Shift+Z)' },
    { id: 'clear', title: 'Clear' },
    { id: 'visibility', title: 'Hide drawings' },
    { id: 'pin', title: 'Pin drawings to the screen' },
    { id: 'close', title: 'Stop drawing (Esc)' },
  ];

  const DOT_SIZES = [4, 7, 10, 14];

  const STYLE = `
    :host { all: initial; }
    [hidden] { display: none !important; }
    canvas { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 2147483646; pointer-events: none; }
    canvas.active { pointer-events: auto; cursor: crosshair; touch-action: none; }
    .toolbar {
      --surface: rgb(255 255 255 / 0.6); --text: #1f2328; --border: #d0d7de; --hover: #eef1f4; --pressed: #dbe7f7;
      position: fixed; z-index: 2147483647; display: grid; gap: 4px;
      width: max-content; max-width: calc(100vw - 16px); padding: 4px;
      border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); backdrop-filter: blur(2px);
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.2); font: 12px/1 system-ui, sans-serif; user-select: none;
    }
    @media (prefers-color-scheme: dark) {
      .toolbar { --surface: rgb(31 34 40 / 0.6); --text: #e6e8eb; --border: #3a3f47; --hover: #2a2e35; --pressed: #2c3e5c; }
    }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; }
    .group { display: flex; align-items: center; gap: 2px; }
    .sep { width: 1px; align-self: stretch; margin: 2px 4px; background: var(--border); }
    .label { padding: 0 4px; opacity: 0.7; }
    button, .grip {
      display: grid; place-items: center; width: 28px; height: 28px; padding: 0;
      border: 0; border-radius: 6px; background: none; color: inherit; cursor: pointer;
    }
    .options button { width: 24px; height: 24px; }
    button:hover { background: var(--hover); }
    button[aria-pressed="true"] { background: var(--pressed); }
    button:disabled { opacity: 0.35; cursor: default; background: none; }
    button:focus-visible { outline: 2px solid #1565c0; outline-offset: -2px; }
    .grip { cursor: grab; touch-action: none; }
    svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    [data-action="visibility"]:not([aria-pressed="true"]) .slash { display: none; }
    .swatch { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.6); }
    [data-option="fill"] .swatch { border-radius: 3px; }
    .swatch.none { background: linear-gradient(to top right, transparent 44%, #e53935 44% 56%, transparent 56%); }
    .dot { border-radius: 50%; background: currentColor; }
  `;

  let settings = normalizeSettings();
  let history = createHistory();
  let layer = createLayer();
  let draft = null;
  let active = false;
  let visible = true;
  let frame = 0;
  let canvas = null;
  let toolbar = null;

  const svg = (name) => `<svg viewBox="0 0 16 16" aria-hidden="true">${ICONS[name]}</svg>`;
  const scroll = () => ({ x: scrollX, y: scrollY });
  const colorTitle = (hex) => DRAW_COLORS.find((c) => c.hex === hex)?.title ?? 'None';
  const isFreehand = (tool) => tool === 'pen' || tool === 'eraser';

  function choiceButton(option, value, index) {
    const color = settings.tools[settings.tool].color;
    const [title, content] = {
      color: () => [colorTitle(value), `<span class="swatch" style="background: ${value}"></span>`],
      fill: () => [`Fill: ${colorTitle(value)}`, `<span class="swatch${value === 'none' ? ' none' : ''}" style="background-color: ${value === 'none' ? 'transparent' : value}"></span>`],
      width: () => [`Width: ${value}px`, `<span class="dot" style="width: ${DOT_SIZES[index]}px; height: ${DOT_SIZES[index]}px"></span>`],
      opacity: () => [`Opacity: ${value * 100}%`, `<span class="swatch" style="background: ${color}; opacity: ${value}"></span>`],
    }[option]();
    return `<button type="button" data-option="${option}" data-value="${value}" title="${title}" aria-label="${title}">${content}</button>`;
  }

  function renderToolbar() {
    const values = settings.tools[settings.tool];
    toolbar.querySelector('.options').innerHTML = Object.keys(values)
      .map((option) => {
        const label = option === 'fill' ? '<span class="label">Fill</span>' : '';
        return `<span class="group">${label}${choices(settings.tool, option).map((value, i) => choiceButton(option, value, i)).join('')}</span>`;
      })
      .join('<span class="sep"></span>');
    for (const button of toolbar.querySelectorAll('[data-option]')) {
      button.setAttribute('aria-pressed', String(values[button.dataset.option]) === button.dataset.value);
    }
    for (const button of toolbar.querySelectorAll('[data-tool]')) button.setAttribute('aria-pressed', button.dataset.tool === settings.tool);
    const action = (id) => toolbar.querySelector(`[data-action="${id}"]`);
    action('undo').disabled = history.index === 0;
    action('redo').disabled = history.index === history.states.length - 1;
    action('clear').disabled = currentShapes(history).length === 0;
    action('visibility').setAttribute('aria-pressed', !visible);
    action('pin').setAttribute('aria-pressed', Boolean(layer.pinnedAt));
  }

  function placeToolbar(x, y) {
    const left = Math.round(Math.min(Math.max(0, x), innerWidth - toolbar.offsetWidth));
    const top = Math.round(Math.min(Math.max(0, y), innerHeight - toolbar.offsetHeight));
    settings.toolbar = { x: left, y: top };
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  }

  function saveSettings() {
    chrome.storage.local.set({ drawing: settings }).catch(() => {});
  }

  function tracePath(ctx, points) {
    const [first, ...rest] = points;
    ctx.moveTo(first.x, first.y);
    // A lone point still needs a segment for the round cap to draw a dot.
    if (rest.length === 0) ctx.lineTo(first.x + 0.01, first.y);
    for (let i = 0; i < rest.length - 1; i++) {
      ctx.quadraticCurveTo(rest[i].x, rest[i].y, (rest[i].x + rest[i + 1].x) / 2, (rest[i].y + rest[i + 1].y) / 2);
    }
    if (rest.length) ctx.lineTo(rest.at(-1).x, rest.at(-1).y);
  }

  function drawShape(ctx, shape) {
    const [a, b] = shape.points;
    ctx.save();
    ctx.globalCompositeOperation = shape.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.globalAlpha = shape.opacity ?? 1;
    ctx.lineWidth = shape.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = shape.color ?? '#000000';
    ctx.beginPath();
    if (isFreehand(shape.tool)) tracePath(ctx, shape.points);
    else if (shape.tool === 'line') {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    } else if (shape.tool === 'rect') ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    else if (shape.tool === 'ellipse') ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(a.x - b.x) / 2, Math.abs(a.y - b.y) / 2, 0, 0, 2 * Math.PI);
    if (shape.fill && shape.fill !== 'none') {
      ctx.fillStyle = shape.fill;
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    frame = 0;
    if (!canvas || canvas.hidden) return;
    const ratio = devicePixelRatio;
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height });
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const origin = layerOrigin(layer, scroll());
    ctx.setTransform(ratio, 0, 0, ratio, -origin.x * ratio, -origin.y * ratio);
    for (const shape of currentShapes(history)) drawShape(ctx, shape);
    if (draft) drawShape(ctx, draft);
  }

  function schedule() {
    frame ||= requestAnimationFrame(render);
  }

  function update() {
    canvas.hidden = !visible;
    renderToolbar();
    schedule();
  }

  function toLayer(event) {
    const origin = layerOrigin(layer, scroll());
    return { x: event.clientX + origin.x, y: event.clientY + origin.y };
  }

  function startShape(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    visible = true;
    const point = toLayer(event);
    draft = { tool: settings.tool, ...settings.tools[settings.tool], points: isFreehand(settings.tool) ? [point] : [point, point] };
    update();
  }

  function extendShape(event) {
    if (!draft) return;
    if (isFreehand(draft.tool)) for (const e of event.getCoalescedEvents?.() ?? [event]) draft.points.push(toLayer(e));
    else draft.points = [draft.points[0], toLayer(event)];
    schedule();
  }

  function finishShape() {
    if (!draft) return;
    const [a, b] = draft.points;
    const empty = !isFreehand(draft.tool) && a.x === b.x && a.y === b.y;
    if (!empty) history = commit(history, [...currentShapes(history), draft]);
    draft = null;
    update();
  }

  const actions = {
    undo: () => (history = undo(history)),
    redo: () => (history = redo(history)),
    clear: () => {
      if (currentShapes(history).length) history = commit(history, []);
    },
    visibility: () => (visible = !visible),
    pin: () => (layer = layer.pinnedAt ? unpinLayer(layer, scroll()) : pinLayer(layer, scroll())),
    close: () => setActive(false),
  };

  function onToolbarClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const { tool, option, action, value } = button.dataset;
    if (action) {
      actions[action]();
      if (canvas) update();
      return;
    }
    if (tool) settings.tool = tool;
    else if (option) settings.tools[settings.tool][option] = choices(settings.tool, option).find((v) => String(v) === value);
    saveSettings();
    renderToolbar();
  }

  function startMove(event) {
    const grip = event.currentTarget;
    grip.setPointerCapture(event.pointerId);
    const dx = event.clientX - settings.toolbar.x;
    const dy = event.clientY - settings.toolbar.y;
    const move = (e) => placeToolbar(e.clientX - dx, e.clientY - dy);
    grip.addEventListener('pointermove', move);
    grip.addEventListener(
      'lostpointercapture',
      () => {
        grip.removeEventListener('pointermove', move);
        saveSettings();
      },
      { once: true },
    );
  }

  function create() {
    const host = document.createElement('development-utils-drawing');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${STYLE}</style><canvas></canvas>
      <div class="toolbar" hidden>
        <div class="row">
          <span class="grip" title="Move">${svg('grip')}</span>
          ${TOOLS.map(({ id, title }) => `<button type="button" data-tool="${id}" title="${title}" aria-label="${title}">${svg(id)}</button>`).join('')}
          <span class="sep"></span>
          ${ACTIONS.map(({ id, title }) => `<button type="button" data-action="${id}" title="${title}" aria-label="${title}">${svg(id)}</button>`).join('')}
        </div>
        <div class="row options"></div>
      </div>`;
    canvas = shadow.querySelector('canvas');
    toolbar = shadow.querySelector('.toolbar');
    canvas.addEventListener('pointerdown', startShape);
    canvas.addEventListener('pointermove', extendShape);
    canvas.addEventListener('pointerup', finishShape);
    canvas.addEventListener('pointercancel', finishShape);
    toolbar.addEventListener('click', onToolbarClick);
    toolbar.querySelector('.grip').addEventListener('pointerdown', startMove);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', () => {
      if (active) placeToolbar(settings.toolbar.x, settings.toolbar.y);
      schedule();
    });
    document.documentElement.append(host);
  }

  async function setActive(on) {
    if (on) {
      try {
        settings = normalizeSettings((await chrome.storage.local.get('drawing')).drawing);
      } catch {
        settings = normalizeSettings();
      }
    }
    if (!canvas) create();
    active = on;
    canvas.classList.toggle('active', on);
    toolbar.hidden = !on;
    if (on) placeToolbar(settings.toolbar.x, settings.toolbar.y);
    if (!on) finishShape();
    update();
  }

  addEventListener(
    'keydown',
    (event) => {
      if (!active) return;
      const key = event.key.toLowerCase();
      const command = event.ctrlKey || event.metaKey;
      if (event.key === 'Escape') setActive(false);
      else if (command && key === 'z') actions[event.shiftKey ? 'redo' : 'undo']();
      else if (command && key === 'y') actions.redo();
      else return;
      event.preventDefault();
      event.stopImmediatePropagation();
      update();
    },
    true,
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'drawing') sendResponse(active);
    else if (message.type === 'toggle-drawing') {
      sendResponse(!active);
      setActive(!active);
    }
  });
})();
