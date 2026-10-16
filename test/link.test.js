const test = require('node:test');
const assert = require('node:assert/strict');
const link = require('../link.js');

test('isUrl accepts only a single http or https URL', () => {
  assert.ok(link.isUrl('https://example.com/path?q=1#top'));
  assert.ok(link.isUrl('http://localhost:8080'));
  assert.ok(!link.isUrl('example.com'));
  assert.ok(!link.isUrl('javascript:alert(1)'));
  assert.ok(!link.isUrl('see https://example.com'));
  assert.ok(!link.isUrl('https://a.example.com\nhttps://b.example.com'));
  assert.ok(!link.isUrl(''));
  assert.ok(!link.isUrl(undefined));
});

test('markdownLink escapes brackets in the text', () => {
  assert.equal(link.markdownLink('docs', 'https://example.com/'), '[docs](https://example.com/)');
  assert.equal(link.markdownLink('[WIP] a\\b', 'https://example.com/'), '[\\[WIP\\] a\\\\b](https://example.com/)');
});
