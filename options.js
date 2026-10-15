const { COLORS, STYLES, SOURCE_TYPES, PRESETS, textColor, createRule } = WorkCore;

const list = document.getElementById('rules');
const empty = document.getElementById('empty');
const template = document.getElementById('rule-template');
const presetSelect = document.getElementById('preset');
const status = document.getElementById('status');

let rules = [];
let saveTimer = null;
let statusTimer = null;

// storage.sync limits writes per minute, so typing and dragging the color picker are batched.
const SAVE_DELAY_MS = 400;

const options = (items) => items.map(({ id, title }) => new Option(title, id));

function patternPlaceholder(rule) {
  return rule.source.type === 'url' ? 'https://staging.example.com/*' : '*-prod';
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await chrome.storage.sync.set({ rules });
      status.textContent = 'Saved';
    } catch (error) {
      status.textContent = `Not saved: ${error.message}`;
    }
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (status.textContent = ''), 3000);
  }, SAVE_DELAY_MS);
}

function getField(rule, path) {
  const [head, tail] = path.split('.');
  return (tail ? rule[head][tail] : rule[head]) ?? '';
}

function setField(rule, path, value) {
  const [head, tail] = path.split('.');
  if (tail) rule[head][tail] = value;
  else rule[head] = value;
}

function paint(item, rule) {
  item.style.setProperty('--rule-color', rule.color);
  const preview = item.querySelector('.preview');
  preview.textContent = rule.name || 'unnamed';
  preview.style.background = rule.color;
  preview.style.color = textColor(rule.color);
  const preset = COLORS.some((c) => c.hex === rule.color.toLowerCase());
  const custom = item.querySelector('.swatch.custom');
  custom.classList.toggle('selected', !preset);
  custom.style.setProperty('--swatch', rule.color);
  for (const radio of item.querySelectorAll('.swatch input[type="radio"]')) radio.checked = radio.value === rule.color.toLowerCase();
}

function showParams(item, rule) {
  const { params } = SOURCE_TYPES.find((t) => t.id === rule.source.type);
  for (const label of item.querySelectorAll('[data-param]')) label.hidden = !params.includes(label.dataset.param);
  item.querySelector('[data-field="pattern"]').placeholder = patternPlaceholder(rule);
}

function renderSwatches(container, rule) {
  for (const { title, hex } of COLORS) {
    const swatch = document.createElement('label');
    swatch.className = 'swatch';
    swatch.title = title;
    swatch.style.setProperty('--swatch', hex);
    const radio = Object.assign(document.createElement('input'), { type: 'radio', name: `color-${rule.id}`, value: hex });
    radio.setAttribute('aria-label', title);
    swatch.append(radio);
    container.append(swatch);
  }
  const custom = document.createElement('label');
  custom.className = 'swatch custom';
  custom.title = 'Custom';
  const picker = Object.assign(document.createElement('input'), { type: 'color', value: rule.color });
  picker.setAttribute('aria-label', 'Custom color');
  custom.append(picker);
  container.append(custom);
}

function renderRule(rule, index) {
  const item = template.content.firstElementChild.cloneNode(true);
  item.querySelector('[data-field="style"]').append(...options(STYLES));
  item.querySelector('[data-field="source.type"]').append(...options(SOURCE_TYPES));
  renderSwatches(item.querySelector('.swatches'), rule);

  for (const input of item.querySelectorAll('[data-field]')) {
    input.value = getField(rule, input.dataset.field);
    input.addEventListener('input', () => {
      setField(rule, input.dataset.field, input.value);
      if (input.dataset.field === 'source.type') {
        const { params } = SOURCE_TYPES.find((t) => t.id === input.value);
        rule.source = Object.fromEntries(Object.entries(rule.source).filter(([k]) => k === 'type' || params.includes(k)));
        showParams(item, rule);
      }
      paint(item, rule);
      save();
    });
  }

  item.querySelector('.swatches').addEventListener('input', (event) => {
    rule.color = event.target.value.toLowerCase();
    paint(item, rule);
    save();
  });

  item.querySelector('[data-action="up"]').disabled = index === 0;
  item.querySelector('[data-action="down"]').disabled = index === rules.length - 1;
  item.querySelector('.head').addEventListener('click', (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'remove') rules.splice(index, 1);
    else {
      const to = action === 'up' ? index - 1 : index + 1;
      [rules[index], rules[to]] = [rules[to], rules[index]];
    }
    render();
    save();
  });

  showParams(item, rule);
  paint(item, rule);
  return item;
}

function render() {
  list.replaceChildren(...rules.map(renderRule));
  empty.hidden = rules.length > 0;
}

presetSelect.append(...options(PRESETS));
document.getElementById('add').addEventListener('click', () => {
  rules.push(createRule(presetSelect.value));
  render();
  save();
  list.lastElementChild.querySelector('[data-field="name"]').focus();
});

chrome.storage.sync.get({ rules: [] }).then((stored) => {
  rules = stored.rules;
  render();
});
