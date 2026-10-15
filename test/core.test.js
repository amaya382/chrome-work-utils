const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

const page = (overrides = {}) => ({
  href: 'https://example.com/',
  cookie: '',
  meta: () => null,
  text: () => null,
  ...overrides,
});

test('matchGlob matches the whole value with * as a wildcard and ignores case', () => {
  assert.ok(core.matchGlob('*-prod', 'MyApp-Prod'));
  assert.ok(core.matchGlob('https://*console.aws.amazon.com/*', 'https://us-east-1.console.aws.amazon.com/ec2/home'));
  assert.ok(core.matchGlob('https://*console.aws.amazon.com/*', 'https://console.aws.amazon.com/'));
  assert.ok(!core.matchGlob('*-prod', 'myapp-prod-2'));
  assert.ok(!core.matchGlob('app.prod', 'appxprod'));
  assert.ok(core.matchGlob('*', ''));
});

test('extractValue reads the URL and its query', () => {
  const p = page({ href: 'https://console.cloud.google.com/home/dashboard?project=my-app-prod&authuser=1' });
  assert.equal(core.extractValue({ type: 'url' }, p), p.href);
  assert.equal(core.extractValue({ type: 'query', name: 'project' }, p), 'my-app-prod');
  assert.equal(core.extractValue({ type: 'query', name: 'folder' }, p), null);
});

test('extractValue reads a key of JSON in a meta tag', () => {
  const content = JSON.stringify({ accountId: '123456789012', session: { region: 'ap-northeast-1' } });
  const p = page({ meta: (name) => (name === 'awsc-session-data' ? content : null) });
  assert.equal(core.extractValue({ type: 'meta', name: 'awsc-session-data', key: 'accountId' }, p), '123456789012');
  assert.equal(core.extractValue({ type: 'meta', name: 'awsc-session-data', key: 'session.region' }, p), 'ap-northeast-1');
  assert.equal(core.extractValue({ type: 'meta', name: 'awsc-session-data', key: 'session' }, p), null);
  assert.equal(core.extractValue({ type: 'meta', name: 'awsc-session-data' }, p), content);
  assert.equal(core.extractValue({ type: 'meta', name: 'other', key: 'accountId' }, p), null);
});

test('extractValue reads URL-encoded JSON in a cookie', () => {
  const info = encodeURIComponent(JSON.stringify({ alias: 'mycompany-prod', arn: 'arn:aws:sts::123456789012:assumed-role/Admin/me' }));
  const p = page({ cookie: `a=1; aws-userInfo=${info}; b=2` });
  assert.equal(core.extractValue({ type: 'cookie', name: 'aws-userInfo', key: 'alias' }, p), 'mycompany-prod');
  assert.equal(core.extractValue({ type: 'cookie', name: 'a' }, p), '1');
  assert.equal(core.extractValue({ type: 'cookie', name: 'missing' }, p), null);
  assert.equal(core.extractValue({ type: 'cookie', name: 'b', key: 'alias' }, p), null);
});

test('extractValue trims the text of an element', () => {
  const p = page({ text: (selector) => (selector === '#account' ? '  staging \n' : null) });
  assert.equal(core.extractValue({ type: 'text', selector: '#account' }, p), 'staging');
  assert.equal(core.extractValue({ type: 'text', selector: '#none' }, p), null);
});

test('findRule returns the first rule whose site and pattern match', () => {
  const rules = [
    { name: 'gcp-prod', site: 'https://console.cloud.google.com/*', source: { type: 'query', name: 'project' }, pattern: '*-prod' },
    { name: 'gcp-any', site: 'https://console.cloud.google.com/*', source: { type: 'query', name: 'project' }, pattern: '*' },
    { name: 'staging', site: '*', source: { type: 'url' }, pattern: 'https://staging.example.com/*' },
  ];
  const at = (href) => core.findRule(rules, page({ href }))?.name ?? null;
  assert.equal(at('https://console.cloud.google.com/run?project=app-prod'), 'gcp-prod');
  assert.equal(at('https://console.cloud.google.com/run?project=app-dev'), 'gcp-any');
  assert.equal(at('https://console.cloud.google.com/welcome'), null);
  assert.equal(at('https://staging.example.com/login'), 'staging');
  assert.equal(at('https://example.com/'), null);
});

test('presets read the values of their consoles', () => {
  const preset = (id) => core.PRESETS.find((p) => p.id === id);
  const gcp = preset('gcp-project');
  assert.equal(core.extractValue(gcp.source, page({ href: 'https://console.cloud.google.com/?project=p1' })), 'p1');
  const aws = preset('aws-account-id');
  assert.ok(core.matchGlob(aws.site, 'https://123456789012-abcdefgh.us-east-1.console.aws.amazon.com/console/home'));
  assert.equal(core.extractValue(aws.source, page({ meta: () => '{"accountId":"123456789012"}' })), '123456789012');
});

test('textColor picks the more readable of black and white', () => {
  assert.equal(core.textColor('#c62828'), '#ffffff');
  assert.equal(core.textColor('#1565c0'), '#ffffff');
  assert.equal(core.textColor('#f9a825'), '#000000');
  assert.equal(core.textColor('#ffffff'), '#000000');
  assert.equal(core.textColor('#000000'), '#ffffff');
});

test('retitle replaces its own prefix and keeps the rest of the title', () => {
  assert.equal(core.retitle('EC2', null, 'prod'), '[prod] EC2');
  assert.equal(core.retitle('[prod] EC2', 'prod', 'prod'), '[prod] EC2');
  assert.equal(core.retitle('[prod] EC2', 'prod', 'dev'), '[dev] EC2');
  assert.equal(core.retitle('[prod] EC2', 'prod', null), 'EC2');
  assert.equal(core.retitle('S3', 'prod', 'prod'), '[prod] S3');
});

test('createRule fills the site and source of a preset', () => {
  const rule = core.createRule('aws-account-alias');
  assert.equal(rule.site, 'https://*console.aws.amazon.com/*');
  assert.deepEqual(rule.source, { type: 'cookie', name: 'aws-userInfo', key: 'alias' });
  assert.ok(core.COLORS.some((c) => c.hex === rule.color));
  assert.notEqual(core.createRule('url').id, rule.id);
});
