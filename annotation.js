(function (root) {
  const DRAW_COLORS = [
    { id: 'red', title: 'Red', hex: '#e53935' },
    { id: 'yellow', title: 'Yellow', hex: '#fdd835' },
    { id: 'green', title: 'Green', hex: '#43a047' },
    { id: 'blue', title: 'Blue', hex: '#1e88e5' },
    { id: 'black', title: 'Black', hex: '#000000' },
    { id: 'white', title: 'White', hex: '#ffffff' },
  ];

  const OPACITIES = [1, 0.6, 0.3];

  const LINE_WIDTHS = [2, 4, 8, 16];

  const TOOLS = [
    { id: 'pen', title: 'Pen', widths: LINE_WIDTHS, defaults: { color: '#e53935', width: 4, opacity: 1 } },
    { id: 'line', title: 'Line', widths: LINE_WIDTHS, defaults: { color: '#e53935', width: 4, opacity: 1 } },
    { id: 'rect', title: 'Rectangle', widths: LINE_WIDTHS, defaults: { color: '#e53935', width: 4, opacity: 1, fill: 'none' } },
    { id: 'ellipse', title: 'Circle', widths: LINE_WIDTHS, defaults: { color: '#e53935', width: 4, opacity: 1, fill: 'none' } },
    { id: 'eraser', title: 'Eraser', widths: [8, 16, 32, 64], defaults: { width: 32 } },
  ];

  // Light enough that black text stays readable on them.
  const HIGHLIGHT_COLORS = [
    { id: 'yellow', title: 'Yellow', hex: '#fff176' },
    { id: 'green', title: 'Green', hex: '#a5d6a7' },
    { id: 'blue', title: 'Blue', hex: '#90caf9' },
    { id: 'pink', title: 'Pink', hex: '#f48fb1' },
  ];

  function choices(toolId, option) {
    const colors = DRAW_COLORS.map((c) => c.hex);
    switch (option) {
      case 'color':
        return colors;
      case 'fill':
        return ['none', ...colors];
      case 'width':
        return TOOLS.find((t) => t.id === toolId).widths;
      case 'opacity':
        return OPACITIES;
      default:
        return [];
    }
  }

  function normalizeSettings(stored = {}) {
    const tools = Object.fromEntries(
      TOOLS.map((tool) => [
        tool.id,
        Object.fromEntries(
          Object.entries(tool.defaults).map(([option, fallback]) => {
            const value = stored.tools?.[tool.id]?.[option];
            return [option, choices(tool.id, option).includes(value) ? value : fallback];
          }),
        ),
      ]),
    );
    const tool = TOOLS.some((t) => t.id === stored.tool) ? stored.tool : TOOLS[0].id;
    const { x, y } = stored.toolbar ?? {};
    const toolbar = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : { x: 16, y: 16 };
    return { tool, tools, toolbar };
  }

  // Each state is a whole list of shapes, so clearing is undone the same way as drawing.
  function createHistory() {
    return { states: [[]], index: 0 };
  }

  function commit(history, shapes) {
    return { states: [...history.states.slice(0, history.index + 1), shapes], index: history.index + 1 };
  }

  function undo(history) {
    return { ...history, index: Math.max(0, history.index - 1) };
  }

  function redo(history) {
    return { ...history, index: Math.min(history.states.length - 1, history.index + 1) };
  }

  function currentShapes(history) {
    return history.states[history.index];
  }

  // Shapes keep the coordinates they were drawn at; the layer only moves the origin that maps them onto the viewport.
  function createLayer() {
    return { pinnedAt: null, shift: { x: 0, y: 0 } };
  }

  function layerOrigin(layer, scroll) {
    const base = layer.pinnedAt ?? scroll;
    return { x: base.x - layer.shift.x, y: base.y - layer.shift.y };
  }

  function pinLayer(layer, scroll) {
    return layer.pinnedAt ? layer : { ...layer, pinnedAt: { ...scroll } };
  }

  // Shifts the origin so the drawing stays where it is on the screen when it starts scrolling again.
  function unpinLayer(layer, scroll) {
    if (!layer.pinnedAt) return layer;
    return {
      pinnedAt: null,
      shift: { x: layer.shift.x + scroll.x - layer.pinnedAt.x, y: layer.shift.y + scroll.y - layer.pinnedAt.y },
    };
  }

  const api = {
    DRAW_COLORS,
    OPACITIES,
    TOOLS,
    HIGHLIGHT_COLORS,
    choices,
    normalizeSettings,
    createHistory,
    commit,
    undo,
    redo,
    currentShapes,
    createLayer,
    layerOrigin,
    pinLayer,
    unpinLayer,
  };
  root.WorkAnnotation = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
