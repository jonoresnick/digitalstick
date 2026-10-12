(() => {
  'use strict';

  // Each font is named after a hockey term.
  const FONTS = [
    { id: 'beauty', name: 'Beauty', family: 'Bebas Neue',     weight: 400 },
    { id: 'celly',  name: 'Celly',  family: 'Yellowtail',     weight: 400 },
    { id: 'chirp',  name: 'Chirp',  family: 'Alfa Slab One',  weight: 400 },
    { id: 'dangle', name: 'Dangle', family: 'Graduate',       weight: 400 },
    { id: 'flow',   name: 'Flow',   family: 'Kaushan Script', weight: 400 },
    { id: 'snipe',  name: 'Snipe',  family: 'Abril Fatface',  weight: 400 },
    { id: 'twig',   name: 'Twig',   family: 'Fredoka',        weight: 700 },
    { id: 'wheel',  name: 'Wheel',  family: 'Russo One',      weight: 400 },
  ];

  // Colours pulled from NHL team palettes.
  const COLOURS = [
    { name: 'Chicago Black',       hex: '#000000' },
    { name: 'Edmonton Blue',       hex: '#041E42' },
    { name: 'Toronto Blue',        hex: '#00205B' },
    { name: 'Montreal Blue',       hex: '#192168' },
    { name: 'Rangers Blue',        hex: '#0038A8' },
    { name: 'Colorado Blue',       hex: '#236192' },
    { name: 'San Jose Teal',       hex: '#006D75' },
    { name: 'Dallas Green',        hex: '#006847' },
    { name: 'Minnesota Green',     hex: '#154734' },
    { name: 'Colorado Burgundy',   hex: '#6F263D' },
    { name: 'Arizona Brick',       hex: '#8C2633' },
    { name: 'Montreal Red',        hex: '#AF1E2D' },
    { name: 'Detroit Red',         hex: '#CE1126' },
    { name: 'Philadelphia Orange', hex: '#F74902' },
    { name: 'Anaheim Orange',      hex: '#F47A38' },
    { name: 'Vegas Gold',          hex: '#B4975A' },
    { name: 'Boston Gold',         hex: '#FFB81C' },
    { name: 'Seattle Ice Blue',    hex: '#99D9D9' },
    { name: 'Kings Silver',        hex: '#A2AAAD' },
    { name: 'Ice White',           hex: '#FFFFFF' },
  ];

  const PACKS = [
    { qty: 6,  price: 12.99, cols: 3 },
    { qty: 12, price: 19.99, cols: 3 },
    { qty: 24, price: 49.99, cols: 4 },
    { qty: 48, price: 89.99, cols: 6 },
  ];

  const OUTLINE_W = 7;   // in font-size-100 units
  const DIECUT_W = 30;   // white sticker border, drawn behind the outline
  const CART_KEY = 'digitalstick.cart';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const colourFor = (hex) => {
    hex = normaliseHex(hex);
    if (!hex) return null;
    return COLOURS.find((c) => c.hex === hex) || { name: 'Custom', hex };
  };
  const fontFor = (id) => FONTS.find((f) => f.id === id) || FONTS[1];
  const money = (n) => `$${n.toFixed(2)}`;

  function normaliseHex(hex) {
    if (typeof hex !== 'string') return null;
    const m = hex.trim().replace(/^#/, '').match(/^[0-9a-f]{6}$/i);
    return m ? `#${m[0].toUpperCase()}` : null;
  }

  function cleanText(value) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2);
  }

  function isLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 200;
  }

  // ---------- State ----------

  const state = {
    text: 'JR',
    font: 'celly',
    fill: colourFor('#AF1E2D'),
    outline: colourFor('#192168'),
  };
  let pack = PACKS[1];

  (function readURL() {
    const p = new URLSearchParams(location.search);
    if (p.has('t')) state.text = cleanText(p.get('t'));
    if (p.has('f')) state.font = fontFor(p.get('f')).id;
    if (p.has('c')) state.fill = colourFor(p.get('c')) || state.fill;
    if (p.has('o')) state.outline = p.get('o') === 'none' ? null : (colourFor(p.get('o')) || state.outline);
  })();

  function writeURL() {
    const p = new URLSearchParams({
      t: state.text,
      f: state.font,
      c: state.fill.hex.slice(1),
      o: state.outline ? state.outline.hex.slice(1) : 'none',
    });
    try { history.replaceState(null, '', `${location.pathname}?${p}${location.hash}`); } catch (_) {}
  }

  // ---------- Logo rendering ----------

  const measureCtx = document.createElement('canvas').getContext('2d');
  const fontSpec = (font, size) => `${font.weight} ${size}px "${font.family}"`;

  // Ink bounds of the text at font-size 100, so every font fills the frame tightly.
  function measure(text, font) {
    measureCtx.font = fontSpec(font, 100);
    const m = measureCtx.measureText(text);
    return {
      left: m.actualBoundingBoxLeft,
      right: m.actualBoundingBoxRight,
      ascent: m.actualBoundingBoxAscent,
      descent: m.actualBoundingBoxDescent,
    };
  }

  // Returns { viewBox, body } so the logo can be dropped into a standalone or nested <svg>.
  function logoParts(design, { dieCut = false } = {}) {
    const font = fontFor(design.font);
    const text = design.text;
    const m = measure(text, font);
    const outlineW = design.outline ? OUTLINE_W : 0;
    const pad = (dieCut ? DIECUT_W : outlineW) / 2 + 2;
    const x = -m.left - pad;
    const y = -m.ascent - pad;
    const w = m.left + m.right + pad * 2;
    const h = m.ascent + m.descent + pad * 2;

    const textAttrs = `x="0" y="0" font-family="'${font.family}'" font-weight="${font.weight}" font-size="100" stroke-linejoin="round" stroke-linecap="round"`;
    let body = '';
    if (dieCut) {
      body += `<text ${textAttrs} fill="#fff" stroke="#fff" stroke-width="${DIECUT_W}">${text}</text>`;
    }
    const stroke = design.outline
      ? ` stroke="${design.outline.hex}" stroke-width="${outlineW}" paint-order="stroke fill"`
      : '';
    body += `<text ${textAttrs} fill="${design.fill.hex}"${stroke}>${text}</text>`;

    return { viewBox: `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, body };
  }

  function logoSVG(design, opts = {}) {
    const { viewBox, body } = logoParts(design, opts);
    const cls = opts.dieCut ? ' class="diecut"' : '';
    return `<svg${cls} xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true">${body}</svg>`;
  }

  function stickSVG(design) {
    const { viewBox, body } = logoParts(design, { dieCut: true });
    const tape = Array.from({ length: 9 }, (_, i) =>
      `<line x1="${-60 + i * 16}" y1="150" x2="${-40 + i * 16}" y2="250" stroke="#d9dce1" stroke-width="2"/>`).join('');
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#3a3f47"/>
            <stop offset=".18" stop-color="#23272d"/>
            <stop offset=".75" stop-color="#15181c"/>
            <stop offset="1" stop-color="#0b0d10"/>
          </linearGradient>
          <pattern id="weave" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="8" fill="#fff" opacity=".035"/>
          </pattern>
          <clipPath id="tape"><rect x="-80" y="150" width="150" height="100" rx="10"/></clipPath>
          <filter id="lift" x="-10%" y="-20%" width="120%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".35"/>
          </filter>
        </defs>
        <g transform="rotate(-24 200 200)">
          <rect x="-80" y="150" width="560" height="100" rx="12" fill="url(#shaft)"/>
          <rect x="-80" y="150" width="560" height="100" rx="12" fill="url(#weave)"/>
          <rect x="-80" y="156" width="560" height="6" fill="#fff" opacity=".08"/>
          <rect x="-80" y="150" width="150" height="100" rx="10" fill="#f4f5f7"/>
          <g clip-path="url(#tape)">${tape}</g>
          <text x="306" y="204" font-family="Nunito, sans-serif" font-weight="800" font-size="11" letter-spacing="2.5" fill="#8a8f98">DIGITAL STICK</text>
          <svg x="92" y="160" width="200" height="80" viewBox="${viewBox}" filter="url(#lift)" overflow="visible">${body}</svg>
        </g>
      </svg>`;
  }

  // ---------- Step 1: design ----------

  const els = {
    preview: $('#logoPreview'),
    textInput: $('#textInput'),
    fontGrid: $('#fontGrid'),
    fillName: $('#fillName'),
    fillSwatches: $('#fillSwatches'),
    outlineName: $('#outlineName'),
    outlineSwatches: $('#outlineSwatches'),
    nextBtn: $('#nextBtn'),
  };

  function renderPreview() {
    if (!state.text) {
      els.preview.innerHTML = '<p class="empty-preview">Enter up to two characters</p>';
      els.preview.setAttribute('aria-label', 'Logo preview, empty');
      return;
    }
    els.preview.innerHTML = logoSVG(state);
    const font = fontFor(state.font);
    const outline = state.outline ? `${state.outline.name} outline` : 'no outline';
    els.preview.setAttribute('aria-label', `${state.text} in ${font.name} font, ${state.fill.name} with ${outline}`);
  }

  function renderFonts() {
    els.fontGrid.innerHTML = FONTS.map((f) => `
      <button class="font-btn" type="button" role="radio" data-font="${f.id}"
              style="font-family:'${f.family}';font-weight:${f.weight}"
              aria-checked="${f.id === state.font}">${f.name}</button>`).join('');
  }

  function swatchButton(c, selected) {
    const light = isLight(c.hex) ? ' light' : '';
    return `<button class="swatch${light}" type="button" role="radio" data-hex="${c.hex}"
              style="--c:${c.hex}" title="${c.name} ${c.hex}"
              aria-label="${c.name}" aria-checked="${selected}"></button>`;
  }

  function renderSwatches(container, current, { allowNone }) {
    const isCustom = current && current.name === 'Custom';
    const plusStyle = isCustom ? `--c:${current.hex};--plus:${isLight(current.hex) ? '#3a3d43' : '#fff'}` : '';
    let html = `
      <button class="swatch add${isCustom ? ' custom' : ''}" type="button" role="radio" data-custom
              style="${plusStyle}" title="Custom colour" aria-label="Custom colour" aria-checked="${isCustom}">
        <input type="color" tabindex="-1" aria-hidden="true" value="${current ? current.hex.toLowerCase() : '#000000'}">
      </button>`;
    html += COLOURS.map((c) => swatchButton(c, !isCustom && current && current.hex === c.hex)).join('');
    if (allowNone) {
      html += `<button class="swatch none" type="button" role="radio" data-none title="No outline"
                aria-label="No outline" aria-checked="${!current}"></button>`;
    }
    container.innerHTML = html;
  }

  const colourLabel = (c) => (c ? `${c.name} ${c.hex}` : 'No outline');

  function renderColours() {
    renderSwatches(els.fillSwatches, state.fill, { allowNone: false });
    renderSwatches(els.outlineSwatches, state.outline, { allowNone: true });
    els.fillName.textContent = colourLabel(state.fill);
    els.outlineName.textContent = colourLabel(state.outline);
  }

  function renderSummary() {
    const values = {
      text: state.text || '—',
      font: fontFor(state.font).name,
      fill: state.fill.name,
      outline: state.outline ? state.outline.name : 'None',
    };
    for (const [key, val] of Object.entries(values)) {
      $(`[data-value="${key}"]`).textContent = val;
    }
    $('[data-opt="text"]').classList.toggle('done', state.text.length > 0);
    $$('[data-opt="font"], [data-opt="fill"], [data-opt="outline"]').forEach((el) => el.classList.add('done'));
    els.nextBtn.disabled = !state.text;
  }

  function update({ swatches = false, fonts = false } = {}) {
    if (fonts) renderFonts();
    if (swatches) renderColours();
    renderPreview();
    renderSummary();
    writeURL();
  }

  els.textInput.value = state.text;
  els.textInput.addEventListener('input', () => {
    const pos = els.textInput.selectionStart;
    const clean = cleanText(els.textInput.value);
    if (clean !== els.textInput.value) {
      els.textInput.value = clean;
      try { els.textInput.setSelectionRange(pos, pos); } catch (_) {}
    }
    state.text = clean;
    ensureFont().then(() => update());
  });

  els.fontGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-font]');
    if (!btn) return;
    state.font = btn.dataset.font;
    $$('[data-font]', els.fontGrid).forEach((b) => b.setAttribute('aria-checked', b === btn));
    update();
    ensureFont().then(() => update());
  });

  function wireSwatches(container, key) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.swatch');
      if (!btn) return;
      if (btn.hasAttribute('data-custom')) {
        const input = $('input', btn);
        if (typeof input.showPicker === 'function') {
          try { input.showPicker(); return; } catch (_) {}
        }
        input.click();
        return;
      }
      state[key] = btn.hasAttribute('data-none') ? null : colourFor(btn.dataset.hex);
      update({ swatches: true });
      $(`.swatch[aria-checked="true"]`, container)?.focus();
    });
    container.addEventListener('input', (e) => {
      if (e.target.type !== 'color') return;
      state[key] = colourFor(e.target.value);
      // Don't rebuild the swatches mid-drag or the native picker closes.
      const plus = $('.swatch.add', container);
      plus.classList.add('custom');
      plus.style.setProperty('--c', state[key].hex);
      plus.style.setProperty('--plus', isLight(state[key].hex) ? '#3a3d43' : '#fff');
      $$('.swatch', container).forEach((b) => b.setAttribute('aria-checked', b === plus));
      $(key === 'fill' ? '#fillName' : '#outlineName').textContent = colourLabel(state[key]);
      update();
    });
  }
  wireSwatches(els.fillSwatches, 'fill');
  wireSwatches(els.outlineSwatches, 'outline');

  // Arrow keys move through any radio group (fonts, swatches, packs).
  document.addEventListener('keydown', (e) => {
    const btn = e.target.closest?.('[role="radio"]');
    if (!btn) return;
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    const group = $$('[role="radio"]', btn.closest('[role="radiogroup"]'));
    const next = group[(group.indexOf(btn) + keys[e.key] + group.length) % group.length];
    e.preventDefault();
    next.focus();
    if (!next.hasAttribute('data-custom')) next.click();
  });

  // Mobile accordion: one section open at a time.
  const mobile = window.matchMedia('(max-width: 760px)');
  $$('#designForm .opt-head').forEach((head) => {
    head.addEventListener('click', () => {
      if (!mobile.matches) return;
      const opt = head.closest('.opt');
      const opening = !opt.classList.contains('open');
      $$('#designForm .opt').forEach((o) => {
        o.classList.toggle('open', o === opt && opening);
        $('.opt-head', o).setAttribute('aria-expanded', o === opt && opening);
      });
    });
  });
  function syncAccordion() {
    $$('#designForm .opt-head').forEach((head) => {
      head.tabIndex = mobile.matches ? 0 : -1;
      if (!mobile.matches) head.removeAttribute('aria-expanded');
      else head.setAttribute('aria-expanded', head.closest('.opt').classList.contains('open'));
    });
  }
  mobile.addEventListener('change', syncAccordion);
  syncAccordion();

  // ---------- Step 2: order ----------

  const stepDesign = $('#stepDesign');
  const stepOrder = $('#stepOrder');
  const carousel = $('#carousel');
  const dots = $$('.dot');

  function renderQty() {
    $('#qtyGrid').innerHTML = PACKS.map((p, i) => `
      <button class="qty-btn" type="button" role="radio" data-pack="${i}" aria-checked="${p === pack}">
        <span class="count">${p.qty} stickers</span>
        <span class="price">${money(p.price)}</span>
      </button>`).join('');
  }

  function renderSheet() {
    const sheet = $('#sheet');
    const one = logoSVG(state, { dieCut: true });
    sheet.style.setProperty('--cols', pack.cols);
    sheet.style.setProperty('--gap', pack.cols > 4 ? '4%' : pack.cols > 3 ? '6%' : '10%');
    sheet.style.padding = pack.qty === 6 ? '18% 10%' : '10%';
    sheet.innerHTML = one.repeat(pack.qty);
  }

  function renderOrder() {
    renderQty();
    renderSheet();
    $('#single').innerHTML = logoSVG(state, { dieCut: true });
    $('#onStick').innerHTML = stickSVG(state);
  }

  $('#qtyGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pack]');
    if (!btn) return;
    pack = PACKS[+btn.dataset.pack];
    $$('[data-pack]').forEach((b) => b.setAttribute('aria-checked', b === btn));
    renderSheet();
  });

  function showStep(order, { push = true } = {}) {
    stepDesign.hidden = order;
    stepOrder.hidden = !order;
    if (order) {
      renderOrder();
      carousel.scrollLeft = 0;
      setDot(0);
    }
    if (push) {
      try { history.pushState({ order }, '', order ? `${location.search}#order` : location.search || location.pathname); } catch (_) {}
    }
    window.scrollTo({ top: 0 });
    $(order ? '#orderTitle' : '#designTitle').focus({ preventScroll: true });
  }
  $('#orderTitle').tabIndex = -1;
  $('#designTitle').tabIndex = -1;

  $('#designForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.text) {
      els.textInput.focus();
      return;
    }
    showStep(true);
  });
  $('#backBtn').addEventListener('click', () => showStep(false));
  window.addEventListener('popstate', () => showStep(location.hash === '#order' && !!state.text, { push: false }));

  function setDot(i) {
    dots.forEach((d, j) => d.setAttribute('aria-selected', i === j));
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    carousel.scrollTo({ left: i * carousel.clientWidth, behavior: 'smooth' });
    setDot(i);
  }));
  carousel.addEventListener('scroll', () => {
    setDot(Math.round(carousel.scrollLeft / carousel.clientWidth));
  }, { passive: true });

  // Terms
  const termsBox = $('#termsBox');
  const termsError = $('#termsError');
  const termsDialog = $('#termsDialog');
  termsBox.addEventListener('change', () => { if (termsBox.checked) termsError.hidden = true; });
  $('#termsLink').addEventListener('click', (e) => {
    e.preventDefault();
    termsDialog.showModal();
  });
  $('#agreeBtn').addEventListener('click', () => {
    termsBox.checked = true;
    termsError.hidden = true;
    termsDialog.close();
  });

  // ---------- Cart ----------

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (_) { return []; }
  }
  let cart = loadCart();
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
  }

  const drawer = $('#cartDrawer');

  function renderCart() {
    const count = cart.length;
    const badge = $('#cartCount');
    badge.textContent = count;
    badge.hidden = count === 0;
    $('#cartBtn').setAttribute('aria-label', count ? `Bag, ${count} item${count > 1 ? 's' : ''}` : 'Bag');

    $('#cartItems').innerHTML = cart.map((item, i) => {
      const design = {
        text: item.text,
        font: item.font,
        fill: colourFor(item.fill),
        outline: item.outline ? colourFor(item.outline) : null,
      };
      const outline = design.outline ? design.outline.name : 'No outline';
      return `
        <li>
          <div class="cart-thumb">${logoSVG(design)}</div>
          <div class="cart-meta">
            <strong>“${item.text}” · ${fontFor(item.font).name}</strong>
            <span>${design.fill.name} / ${outline}</span>
            <span>${item.qty} stickers</span>
          </div>
          <div class="cart-side">${money(item.price)}<button type="button" data-remove="${i}">Remove</button></div>
        </li>`;
    }).join('');
    $('#cartEmpty').hidden = count > 0;
    $('#subtotal').textContent = money(cart.reduce((sum, item) => sum + item.price, 0));
    $('#checkoutBtn').disabled = count === 0;
  }

  $('#cartItems').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    cart.splice(+btn.dataset.remove, 1);
    saveCart();
    renderCart();
  });
  $('#cartBtn').addEventListener('click', () => {
    renderCart();
    drawer.showModal();
  });
  $('#checkoutBtn').addEventListener('click', () => toast('Checkout is closed for the off-season.'));

  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
  });

  $('#orderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!termsBox.checked) {
      termsError.hidden = false;
      termsBox.focus();
      return;
    }
    cart.push({
      text: state.text,
      font: state.font,
      fill: state.fill.hex,
      outline: state.outline ? state.outline.hex : null,
      qty: pack.qty,
      price: pack.price,
    });
    saveCart();
    renderCart();
    toast(`Added ${pack.qty} “${state.text}” stickers to your bag`);
  });

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------- Header ----------

  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $$('a[href="#about"], a[href="#explore"]', nav).forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    toast(`${a.textContent} is coming soon`);
  }));

  // ---------- Fonts & boot ----------

  // Canvas measuring needs the real font loaded, so re-render once it arrives.
  function ensureFont(font = fontFor(state.font)) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return document.fonts.load(fontSpec(font, 100), state.text || 'JR').catch(() => {});
  }

  function rerender() {
    renderPreview();
    if (!stepOrder.hidden) renderOrder();
    if (drawer.open) renderCart();
  }

  update({ fonts: true, swatches: true });
  renderCart();
  if (location.hash === '#order' && state.text) showStep(true, { push: false });

  Promise.all(FONTS.map((f) => ensureFont(f))).then(rerender);
  if (document.fonts) document.fonts.addEventListener('loadingdone', rerender);
})();
