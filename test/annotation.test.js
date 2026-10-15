const test = require('node:test');
const assert = require('node:assert/strict');
const annotation = require('../annotation.js');

test('normalizeSettings keeps stored choices and falls back to defaults for unknown values', () => {
  const settings = annotation.normalizeSettings({
    tool: 'rect',
    tools: { rect: { color: '#1e88e5', width: 999, fill: '#fdd835' }, eraser: { width: 64 } },
    toolbar: { x: 100, y: 40 },
  });
  assert.equal(settings.tool, 'rect');
  assert.deepEqual(settings.tools.rect, { color: '#1e88e5', width: 4, opacity: 1, fill: '#fdd835' });
  assert.deepEqual(settings.tools.eraser, { width: 64 });
  assert.deepEqual(settings.toolbar, { x: 100, y: 40 });
});

test('normalizeSettings gives every tool its defaults when nothing is stored', () => {
  const settings = annotation.normalizeSettings();
  assert.equal(settings.tool, 'pen');
  for (const tool of annotation.TOOLS) {
    assert.deepEqual(settings.tools[tool.id], tool.defaults);
    for (const [option, value] of Object.entries(tool.defaults)) assert.ok(annotation.choices(tool.id, option).includes(value));
  }
  assert.equal(annotation.normalizeSettings({ tool: 'laser' }).tool, 'pen');
});

test('history undoes and redoes commits, and a new commit drops the redo states', () => {
  const a = { tool: 'pen' };
  const b = { tool: 'line' };
  let history = annotation.createHistory();
  history = annotation.commit(history, [a]);
  history = annotation.commit(history, [a, b]);
  history = annotation.commit(history, []);
  assert.deepEqual(annotation.currentShapes(history), []);
  history = annotation.undo(history);
  assert.deepEqual(annotation.currentShapes(history), [a, b]);
  history = annotation.undo(annotation.undo(annotation.undo(history)));
  assert.deepEqual(annotation.currentShapes(history), []);
  history = annotation.redo(history);
  assert.deepEqual(annotation.currentShapes(history), [a]);
  history = annotation.commit(history, [a, b, b]);
  assert.deepEqual(annotation.currentShapes(annotation.redo(history)), [a, b, b]);
});

test('a layer follows the scroll, stays put while pinned, and keeps its place when unpinned', () => {
  let layer = annotation.createLayer();
  assert.deepEqual(annotation.layerOrigin(layer, { x: 0, y: 300 }), { x: 0, y: 300 });
  layer = annotation.pinLayer(layer, { x: 0, y: 300 });
  assert.deepEqual(annotation.layerOrigin(layer, { x: 0, y: 900 }), { x: 0, y: 300 });
  layer = annotation.unpinLayer(layer, { x: 0, y: 900 });
  assert.deepEqual(annotation.layerOrigin(layer, { x: 0, y: 900 }), { x: 0, y: 300 });
  assert.deepEqual(annotation.layerOrigin(layer, { x: 0, y: 1000 }), { x: 0, y: 400 });
});
