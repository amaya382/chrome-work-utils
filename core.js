(function (root) {
  // Material 700-800 shades: similar lightness and saturation, hues spread apart.
  const COLORS = [
    { id: 'red', title: 'Red', hex: '#c62828' },
    { id: 'orange', title: 'Orange', hex: '#e65100' },
    { id: 'yellow', title: 'Yellow', hex: '#f9a825' },
    { id: 'green', title: 'Green', hex: '#2e7d32' },
    { id: 'teal', title: 'Teal', hex: '#00838f' },
    { id: 'blue', title: 'Blue', hex: '#1565c0' },
    { id: 'purple', title: 'Purple', hex: '#6a1b9a' },
    { id: 'gray', title: 'Gray', hex: '#546e7a' },
  ];

  const STYLES = [
    { id: 'bar', title: 'Bar' },
    { id: 'frame', title: 'Frame' },
  ];

  const SOURCE_TYPES = [
    { id: 'url', title: 'URL', params: [] },
    { id: 'query', title: 'URL query', params: ['name'] },
    { id: 'meta', title: 'Meta tag', params: ['name', 'key'] },
    { id: 'cookie', title: 'Cookie', params: ['name', 'key'] },
    { id: 'text', title: 'Element text', params: ['selector'] },
  ];

  const PRESETS = [
    {
      id: 'gcp-project',
      title: 'Google Cloud project',
      site: 'https://console.cloud.google.com/*',
      source: { type: 'query', name: 'project' },
    },
    {
      id: 'aws-account-id',
      title: 'AWS account ID',
      site: 'https://*console.aws.amazon.com/*',
      source: { type: 'meta', name: 'awsc-session-data', key: 'accountId' },
    },
    {
      id: 'aws-account-alias',
      title: 'AWS account alias',
      site: 'https://*console.aws.amazon.com/*',
      source: { type: 'cookie', name: 'aws-userInfo', key: 'alias' },
    },
    {
      id: 'url',
      title: 'URL',
      site: '*',
      source: { type: 'url' },
    },
  ];

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function matchGlob(glob, value) {
    const pattern = glob.split('*').map(escapeRegExp).join('.*');
    return new RegExp(`^${pattern}$`, 'is').test(value);
  }

  function readCookie(cookies, name) {
    for (const pair of cookies.split(';')) {
      const at = pair.indexOf('=');
      if (at >= 0 && pair.slice(0, at).trim() === name) return pair.slice(at + 1).trim();
    }
    return null;
  }

  function decode(text) {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  }

  // A dotted key reads a nested JSON property, such as "user.alias".
  function readKey(text, key) {
    if (text == null || !key) return text;
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      return null;
    }
    for (const part of key.split('.')) value = value?.[part];
    return value == null || typeof value === 'object' ? null : String(value);
  }

  function queryParam(href, name) {
    try {
      return new URL(href).searchParams.get(name);
    } catch {
      return null;
    }
  }

  // `page` keeps DOM access out of this file: { href, cookie, meta(name), text(selector) }.
  function extractValue(source, page) {
    switch (source.type) {
      case 'url':
        return page.href;
      case 'query':
        return queryParam(page.href, source.name);
      case 'meta':
        return readKey(page.meta(source.name), source.key);
      case 'cookie': {
        const raw = readCookie(page.cookie, source.name);
        return readKey(raw == null ? null : decode(raw), source.key);
      }
      case 'text':
        return page.text(source.selector)?.trim() ?? null;
      default:
        return null;
    }
  }

  function findRule(rules, page) {
    return (
      rules.find((rule) => {
        if (!matchGlob(rule.site, page.href)) return false;
        const value = extractValue(rule.source, page);
        return value != null && matchGlob(rule.pattern, value);
      }) ?? null
    );
  }

  function luminance(hex) {
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Picks whichever of white and black has the higher WCAG contrast ratio against the color.
  function textColor(hex) {
    const l = luminance(hex);
    return (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? '#000000' : '#ffffff';
  }

  function retitle(title, oldName, newName) {
    const oldPrefix = oldName ? `[${oldName}] ` : '';
    const base = oldPrefix && title.startsWith(oldPrefix) ? title.slice(oldPrefix.length) : title;
    return newName ? `[${newName}] ${base}` : base;
  }

  function createRule(presetId) {
    const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
    return {
      id: crypto.randomUUID(),
      name: '',
      color: COLORS[0].hex,
      style: STYLES[0].id,
      site: preset.site,
      source: { ...preset.source },
      pattern: '',
    };
  }

  const api = { COLORS, STYLES, SOURCE_TYPES, PRESETS, matchGlob, readCookie, extractValue, findRule, textColor, retitle, createRule };
  root.WorkCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
