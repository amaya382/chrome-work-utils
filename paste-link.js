(() => {
  const { DEFAULTS, isUrl, markdownLink } = WorkLink;

  let enabled = DEFAULTS.pasteLink;

  function selectedText(target) {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      // Input types without a text selection, such as number, report null.
      return target.value.slice(target.selectionStart ?? 0, target.selectionEnd ?? 0);
    }
    return target instanceof HTMLElement && target.isContentEditable ? getSelection().toString() : '';
  }

  addEventListener(
    'paste',
    (event) => {
      if (!enabled) return;
      const text = selectedText(event.composedPath()[0]);
      const url = event.clipboardData?.getData('text/plain').trim();
      if (!text || !isUrl(url)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      // insertText keeps the undo history and fires the input events that editors listen to.
      document.execCommand('insertText', false, markdownLink(text, url));
    },
    true,
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.pasteLink) enabled = changes.pasteLink.newValue ?? DEFAULTS.pasteLink;
  });

  chrome.storage.sync.get(DEFAULTS).then((stored) => (enabled = stored.pasteLink));
})();
