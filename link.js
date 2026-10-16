(function (root) {
  const DEFAULTS = { pasteLink: true };

  function isUrl(text) {
    if (!text || /\s/.test(text)) return false;
    try {
      const { protocol } = new URL(text);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  // A bracket in the text would end the link text early.
  function markdownLink(text, url) {
    return `[${text.replace(/[\\[\]]/g, '\\$&')}](${url})`;
  }

  const api = { DEFAULTS, isUrl, markdownLink };
  root.WorkLink = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
