// Compact customizer for embedding (Notion, portfolios). Settings can be preset in the URL:
//   embed.html?t=JR&f=celly&c=AF1E2D&o=192168&theme=light
(() => {
  'use strict';

  const { FONTS, COLOURS, colourFor, fontFor, cleanText, isLight, fontSpec, stickerSVG, stickSVG } = window.DigitalStick;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    text: 'JR',
    font: 'celly',
    fill: colourFor('#AF1E2D'),
    outline: colourFor('#192168'),
  };
  let view = 'sticker';

  const params = new URLSearchParams(location.search);
  if (params.has('t')) state.text = cleanText(params.get('t')) || state.text;
  if (params.has('f')) state.font = fontFor(params.get('f')).id;
  if (params.has('c')) state.fill = colourFor(params.get('c')) || state.fill;
  if (params.has('o')) state.outline = params.get('o') === 'none' ? null : (colourFor(params.get('o')) || state.outline);
  if (['light', 'dark'].includes(params.get('theme'))) document.documentElement.dataset.theme = params.get('theme');

  const els = {
    view: $('#view'),
    text: $('#text'),
    fonts: $('#fonts'),
    fill: $('#fill'),
    outline: $('#outline'),
  };

  function renderPreview() {
    els.view.className = `view ${view === 'stick' ? 'stick-view' : 'sticker-view'}`;
    if (!state.text) {
      els.view.innerHTML = '<p class="empty">Type a number or initials</p>';
      return;
    }
    els.view.innerHTML = view === 'stick' ? stickSVG(state) : stickerSVG(state);
    const outline = state.outline ? `${state.outline.name} outline` : 'no outline';
    els.view.setAttribute('aria-label', `${state.text} in ${fontFor(state.font).name}, ${state.fill.name} with ${outline}`);
  }

  function renderControls() {
    els.fonts.innerHTML = FONTS.map((f) => `
      <button class="font-btn" type="button" role="radio" data-font="${f.id}" title="${f.meaning}"
              style="font-family:'${f.family}',sans-serif;font-weight:${f.weight}"
              aria-checked="${f.id === state.font}">${f.name}</button>`).join('');

    const swatch = (c, selected) => `
      <button class="swatch${isLight(c.hex) ? ' light' : ''}" type="button" role="radio" data-hex="${c.hex}"
              style="--c:${c.hex}" title="${c.name} ${c.hex}" aria-label="${c.name}" aria-checked="${selected}"></button>`;
    els.fill.innerHTML = COLOURS.map((c) => swatch(c, c.hex === state.fill.hex)).join('');
    els.outline.innerHTML = COLOURS.map((c) => swatch(c, !!state.outline && c.hex === state.outline.hex)).join('')
      + `<button class="swatch none" type="button" role="radio" data-none title="No outline" aria-label="No outline" aria-checked="${!state.outline}"></button>`;

    $('#fontName').textContent = fontFor(state.font).name;
    $('#fillName').textContent = `${state.fill.name} ${state.fill.hex}`;
    $('#outlineName').textContent = state.outline ? `${state.outline.name} ${state.outline.hex}` : 'None';
  }

  function render() {
    renderControls();
    renderPreview();
  }

  // Canvas measuring needs the real font, so re-render once it has loaded.
  function ensureFont(font = fontFor(state.font)) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return document.fonts.load(fontSpec(font, 100), state.text || 'JR').catch(() => {});
  }

  els.text.value = state.text;
  els.text.addEventListener('input', () => {
    const clean = cleanText(els.text.value);
    if (clean !== els.text.value) els.text.value = clean;
    state.text = clean;
    ensureFont().then(renderPreview);
  });

  els.fonts.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-font]');
    if (!btn) return;
    state.font = btn.dataset.font;
    render();
    ensureFont().then(renderPreview);
    $(`[data-font="${state.font}"]`).focus();
  });

  function wireSwatches(container, key) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.swatch');
      if (!btn) return;
      state[key] = btn.hasAttribute('data-none') ? null : colourFor(btn.dataset.hex);
      render();
      $('.swatch[aria-checked="true"]', container)?.focus();
    });
  }
  wireSwatches(els.fill, 'fill');
  wireSwatches(els.outline, 'outline');

  // Arrow keys move through each radio group.
  document.addEventListener('keydown', (e) => {
    const btn = e.target.closest?.('[role="radio"]');
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!btn || !(e.key in keys)) return;
    const group = $$('[role="radio"]', btn.closest('[role="radiogroup"]'));
    e.preventDefault();
    group[(group.indexOf(btn) + keys[e.key] + group.length) % group.length].click();
  });

  function setView(next) {
    view = next;
    $('#showSticker').setAttribute('aria-pressed', view === 'sticker');
    $('#showStick').setAttribute('aria-pressed', view === 'stick');
    renderPreview();
  }
  $('#showSticker').addEventListener('click', () => setView('sticker'));
  $('#showStick').addEventListener('click', () => setView('stick'));

  // A random font and two different team colours; keeps whatever text is typed.
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  $('#shuffle').addEventListener('click', () => {
    state.font = pick(FONTS.filter((f) => f.id !== state.font)).id;
    state.fill = pick(COLOURS.filter((c) => c.hex !== state.fill.hex));
    state.outline = Math.random() < 0.15 ? null : pick(COLOURS.filter((c) => c.hex !== state.fill.hex));
    if (!state.text) {
      state.text = 'JR';
      els.text.value = state.text;
    }
    render();
    ensureFont().then(renderPreview);
  });

  render();
  Promise.all(FONTS.map((f) => ensureFont(f))).then(renderPreview);
  if (document.fonts) document.fonts.addEventListener('loadingdone', renderPreview);
})();
