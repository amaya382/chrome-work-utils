(() => {
  const { HIGHLIGHT_COLORS } = DevelopmentAnnotation;

  const names = HIGHLIGHT_COLORS.map(({ id }) => `development-utils-${id}`);
  const style = document.createElement('style');
  style.textContent = HIGHLIGHT_COLORS.map(({ hex }, i) => `::highlight(${names[i]}) { background-color: ${hex}; color: #000000; }`).join('\n');

  function selectedRanges() {
    const selection = getSelection();
    const ranges = [];
    for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i));
    return ranges.filter((range) => !range.collapsed);
  }

  function overlaps(a, b) {
    try {
      return a.compareBoundaryPoints(Range.END_TO_START, b) < 0 && a.compareBoundaryPoints(Range.START_TO_END, b) > 0;
    } catch {
      return false;
    }
  }

  function highlight(colorId) {
    const name = names[HIGHLIGHT_COLORS.findIndex((c) => c.id === colorId)];
    if (!name) return;
    // Single-page apps may replace the head, which drops the style.
    if (!style.isConnected) (document.head ?? document.documentElement).append(style);
    let target = CSS.highlights.get(name);
    if (!target) CSS.highlights.set(name, (target = new Highlight()));
    for (const range of selectedRanges()) target.add(range.cloneRange());
    // The selection is painted over the highlight, so it is cleared to show the color.
    getSelection().removeAllRanges();
  }

  function removeHighlight() {
    const selected = selectedRanges();
    for (const name of names) {
      const target = CSS.highlights.get(name);
      if (!target) continue;
      for (const range of [...target]) if (selected.some((s) => overlaps(range, s))) target.delete(range);
    }
    getSelection().removeAllRanges();
  }

  function clearHighlights() {
    for (const name of names) CSS.highlights.delete(name);
  }

  const handlers = { highlight: (message) => highlight(message.color), 'remove-highlight': removeHighlight, 'clear-highlights': clearHighlights };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!handlers[message.type]) return;
    handlers[message.type](message);
    sendResponse(true);
  });
})();
