(() => {
  'use strict';

  const {
    FONTS, COLOURS, colourFor, fontFor, cleanText, isLight,
    fontSpec, logoSVG, stickerSVG, stickSVG,
  } = window.DigitalStick;

  const PACKS = [
    { qty: 6,  price: 12.99, cols: 3 },
    { qty: 12, price: 19.99, cols: 3 },
    { qty: 24, price: 49.99, cols: 4 },
    { qty: 48, price: 89.99, cols: 6 },
  ];

  // Starter designs for the Explore page and the homepage.
  const SAMPLES = [
    { text: 'CF', font: 'twig',   fill: '#AF1E2D', outline: '#FFFFFF' },
    { text: 'JR', font: 'celly',  fill: '#AF1E2D', outline: '#192168' },
    { text: '19', font: 'dangle', fill: '#00205B', outline: '#FFFFFF' },
    { text: '87', font: 'wheel',  fill: '#FFB81C', outline: '#000000' },
    { text: 'MB', font: 'flow',   fill: '#F74902', outline: '#000000' },
    { text: '97', font: 'beauty', fill: '#041E42', outline: '#F74902' },
    { text: 'AK', font: 'snipe',  fill: '#006847', outline: '#000000' },
    { text: '8',  font: 'chirp',  fill: '#CE1126', outline: '#FFFFFF' },
    { text: 'SK', font: 'celly',  fill: '#99D9D9', outline: '#041E42' },
    { text: '29', font: 'dangle', fill: '#6F263D', outline: '#236192' },
    { text: '14', font: 'twig',   fill: '#B4975A', outline: '#000000' },
    { text: 'LA', font: 'wheel',  fill: '#A2AAAD', outline: '#000000' },
    { text: 'NY', font: 'flow',   fill: '#0038A8', outline: '#CE1126' },
    { text: '71', font: 'beauty', fill: '#FFB81C', outline: '#000000' },
    { text: 'SJ', font: 'chirp',  fill: '#006D75', outline: '#000000' },
    { text: 'DD', font: 'snipe',  fill: '#FFFFFF', outline: '#CE1126' },
    { text: '00', font: 'celly',  fill: '#000000', outline: null },
    { text: 'TB', font: 'dangle', fill: '#F47A38', outline: '#000000' },
  ];

  // Must match SHIPPING in netlify/functions/checkout.mjs.
  const SHIPPING = [
    { id: 'standard', name: 'Standard mail', price: 2.99, eta: '5–10 business days' },
    { id: 'tracked',  name: 'Tracked',       price: 9.99, eta: '2–5 business days' },
  ];

  // Leave empty to run checkout in demo mode. Set to '/api/checkout' once the
  // Stripe function is deployed (see README).
  const CHECKOUT_URL = '';
  const CURRENCY = 'CAD';

  const CART_KEY = 'digitalstick.cart';
  const ORDER_KEY = 'digitalstick.lastOrder';
  const PROFILE_KEY = 'digitalstick.profile';
  const DESIGNS_KEY = 'digitalstick.designs';
  const ORDERS_KEY = 'digitalstick.orders';
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const money = (n) => `$${n.toFixed(2)}`;

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
    els.preview.innerHTML = stickerSVG(state);
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

  function update({ swatches = false, fonts = false, url = true } = {}) {
    if (fonts) renderFonts();
    if (swatches) renderColours();
    renderPreview();
    renderSummary();
    if (url) writeURL();
  }

  function loadDesign(d) {
    state.text = d.text;
    state.font = d.font;
    state.fill = colourFor(d.fill);
    state.outline = d.outline ? colourFor(d.outline) : null;
    els.textInput.value = state.text;
    update({ fonts: true, swatches: true });
    ensureFont().then(() => update());
  }

  const designOf = (d) => ({
    text: d.text,
    font: d.font,
    fill: colourFor(d.fill),
    outline: d.outline ? colourFor(d.outline) : null,
  });
  const describe = (d) => `${d.fill.name} / ${d.outline ? d.outline.name : 'No outline'}`;

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

  const carousel = $('#carousel');
  const dots = $$('.dot');

  function renderQty() {
    $('#qtyGrid').innerHTML = PACKS.map((p, i) => `
      <button class="qty-btn" type="button" role="radio" data-pack="${i}" aria-checked="${p === pack}">
        <span class="count">${p.qty} stickers</span>
        <span class="price">${money(p.price)}</span>
      </button>`).join('');
  }

  // Lays the pack out like the real backing sheet, sized to fit the square preview.
  function renderSheet() {
    const sheet = $('#sheet');
    const cols = pack.cols;
    const rows = pack.qty / cols;
    const GAP = 0.24;
    const PAD = 0.45;
    const span = (n) => n + (n - 1) * GAP + PAD * 2;
    const unit = 84 / Math.max(span(cols), span(rows));
    sheet.style.setProperty('--cols', cols);
    sheet.style.setProperty('--u', `${unit.toFixed(3)}cqmin`);
    sheet.style.setProperty('--gap', `${(unit * GAP).toFixed(3)}cqmin`);
    sheet.style.setProperty('--pad', `${(unit * PAD).toFixed(3)}cqmin`);
    sheet.innerHTML = stickerSVG(state).repeat(pack.qty);
  }

  function renderOrder() {
    renderQty();
    renderSheet();
    $('#single').innerHTML = stickerSVG(state);
    $('#onStick').innerHTML = stickSVG(state);
  }

  $('#qtyGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pack]');
    if (!btn) return;
    pack = PACKS[+btn.dataset.pack];
    $$('[data-pack]').forEach((b) => b.setAttribute('aria-checked', b === btn));
    renderSheet();
  });

  $('#designForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.text) {
      els.textInput.focus();
      return;
    }
    location.hash = 'order';
  });
  $('#backBtn').addEventListener('click', () => { location.hash = 'design'; });

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
      const design = designOf(item);
      return `
        <li>
          <div class="cart-thumb">${stickerSVG(design)}</div>
          <div class="cart-meta">
            <strong>“${item.text}” · ${fontFor(item.font).name}</strong>
            <span>${describe(design)}</span>
            <span>${item.qty} stickers</span>
          </div>
          <div class="cart-side">${money(item.price)}<button type="button" data-remove="${i}">Remove</button></div>
        </li>`;
    }).join('');
    $('#cartEmpty').hidden = count > 0;
    $('#subtotal').textContent = money(subtotal());
    $('#checkoutBtn').disabled = count === 0;
    if (currentPage === 'checkout') renderCheckout();
  }

  const subtotal = () => cart.reduce((sum, item) => sum + item.price, 0);

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
  $('#checkoutBtn').addEventListener('click', () => {
    drawer.close();
    location.hash = 'checkout';
  });

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
  const header = $('.site-header');
  const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 4);
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $('#accountBtn').addEventListener('click', () => { location.hash = 'account'; });
  $$('[data-terms]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    termsDialog.showModal();
  }));

  // ---------- Home ----------

  function renderHome() {
    const sample = { text: '19', font: 'dangle', fill: '#00205B', outline: '#FFFFFF' };
    $('#howColour').innerHTML = stickerSVG(designOf(sample));
    $('#howSwatches').innerHTML = ['#AF1E2D', '#00205B', '#006847', '#FFB81C', '#99D9D9']
      .map((hex) => `<span class="${hex === sample.fill ? 'on' : ''}" style="--c:${hex}"></span>`).join('');
    // Cropped so the sticker is the same size as in step 2.
    $('#howStick').innerHTML = stickSVG(designOf(sample), { frame: '55 91 290 218' });

    const tileColours = ['#AF1E2D', '#99D9D9', '#FFB81C', '#F74902', '#FFFFFF', '#B4975A', '#0038A8', '#CE1126'];
    $('#fontTiles').innerHTML = FONTS.map((f, i) => `
      <button class="font-tile" type="button" data-tile-font="${f.id}">
        <span class="tile-art">${stickerSVG(designOf({ text: 'JR', font: f.id, fill: tileColours[i], outline: null }))}</span>
        <span class="tile-name" style="font-family:'${f.family}',sans-serif;font-weight:${f.weight}">${f.name}</span>
        <span class="tile-meaning">${f.meaning}</span>
      </button>`).join('');

    $('#packList').innerHTML = PACKS.map((p) => `
      <li><span class="pack-qty">${p.qty}</span><span class="pack-label">stickers</span><span class="pack-price">${money(p.price)}</span></li>`).join('');
  }

  $('#fontTiles').addEventListener('click', (e) => {
    const tile = e.target.closest('[data-tile-font]');
    if (!tile) return;
    loadDesign({ ...currentDesign(), font: tile.dataset.tileFont });
    location.hash = 'design';
  });

  function currentDesign() {
    return {
      text: state.text || 'JR',
      font: state.font,
      fill: state.fill.hex,
      outline: state.outline ? state.outline.hex : null,
    };
  }

  // ---------- Explore ----------

  let exploreFilter = 'all';

  function renderExplore() {
    const chips = [{ id: 'all', name: 'All' }, ...FONTS];
    $('#exploreChips').innerHTML = chips.map((c) => `
      <button class="chip" type="button" role="radio" data-filter="${c.id}" aria-checked="${c.id === exploreFilter}"
              ${c.family ? `style="font-family:'${c.family}',sans-serif;font-weight:${c.weight}"` : ''}>${c.name}</button>`).join('');

    const list = SAMPLES.map((d, i) => ({ d, i })).filter(({ d }) => exploreFilter === 'all' || d.font === exploreFilter);
    $('#gallery').innerHTML = list.map(({ d, i }) => {
      const design = designOf(d);
      const font = fontFor(d.font);
      return `
        <li>
          <button class="g-card" type="button" data-sample="${i}" aria-label="Customize “${d.text}” in ${font.name}, ${describe(design)}">
            <span class="g-art">${stickerSVG(design)}</span>
            <span class="g-meta">
              <strong>“${d.text}” · ${font.name}</strong>
              <span>${describe(design)}</span>
            </span>
            <span class="g-cta">Customize
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
            </span>
          </button>
        </li>`;
    }).join('');
    $('#galleryEmpty').hidden = list.length > 0;
  }

  $('#exploreChips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    exploreFilter = chip.dataset.filter;
    renderExplore();
    $(`[data-filter="${exploreFilter}"]`).focus();
  });
  $('#gallery').addEventListener('click', (e) => {
    const card = e.target.closest('[data-sample]');
    if (!card) return;
    loadDesign(SAMPLES[+card.dataset.sample]);
    location.hash = 'design';
  });

  // ---------- About ----------

  function renderAbout() {
    $('#glossary').innerHTML = FONTS.map((f) => `
      <div>
        <dt style="font-family:'${f.family}',sans-serif;font-weight:${f.weight}">${f.name}</dt>
        <dd>${f.meaning}</dd>
      </div>`).join('');
    $('#paletteList').innerHTML = COLOURS.map((c) => `
      <li>
        <span class="pal-chip${isLight(c.hex) ? ' light' : ''}" style="--c:${c.hex}"></span>
        <span class="pal-name">${c.name}</span>
        <span class="pal-hex">${c.hex}</span>
      </li>`).join('');
  }

  // ---------- Account (kept in this browser) ----------

  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
  };
  const store = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };

  let profile = load(PROFILE_KEY, { name: '', email: '' });
  let savedDesigns = load(DESIGNS_KEY, []);
  let orders = load(ORDERS_KEY, []);

  const sameDesign = (a, b) => a.text === b.text && a.font === b.font && a.fill === b.fill && a.outline === b.outline;
  const placedOn = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  $('#saveDesignBtn').addEventListener('click', () => {
    if (!state.text) {
      els.textInput.focus();
      toast('Enter your numbers or initials first');
      return;
    }
    const design = currentDesign();
    if (savedDesigns.some((d) => sameDesign(d, design))) {
      toast('This design is already in your account');
      return;
    }
    savedDesigns = [{ ...design, saved: new Date().toISOString() }, ...savedDesigns].slice(0, 60);
    store(DESIGNS_KEY, savedDesigns);
    toast(`Saved “${design.text}” to your account`);
  });

  function recordOrder(order) {
    if (!order || !order.id) return;
    orders = [order, ...orders.filter((o) => o.id !== order.id)].slice(0, 50);
    store(ORDERS_KEY, orders);
  }

  function renderAccount() {
    const first = profile.name.trim().split(/\s+/)[0];
    $('#accountTitle').textContent = first ? `Hi, ${first}` : 'Your account';
    $('#profileName').value = profile.name;
    $('#profileEmail').value = profile.email;

    $('#savedGrid').innerHTML = savedDesigns.map((d, i) => {
      const design = designOf(d);
      const font = fontFor(d.font);
      return `
        <li>
          <button class="g-card" type="button" data-edit-design="${i}" aria-label="Edit “${d.text}” in ${font.name}, ${describe(design)}">
            <span class="g-art">${stickerSVG(design)}</span>
            <span class="g-meta"><strong>“${d.text}” · ${font.name}</strong><span>${describe(design)}</span></span>
          </button>
          <button class="saved-remove" type="button" data-remove-design="${i}">Remove</button>
        </li>`;
    }).join('');
    $('#savedEmpty').hidden = savedDesigns.length > 0;

    $('#orderList').innerHTML = orders.map((o) => `
      <li class="order-card">
        <div class="order-head">
          <strong>Order ${o.id}</strong>
          <span class="order-date">${placedOn(o.placed)}</span>
          <span class="pill${o.demo ? '' : ' paid'}">${o.demo ? 'Demo' : 'Paid'}</span>
          <strong class="order-total">${withCurrency(o.total)}</strong>
        </div>
        <ul class="co-items">${o.items.map((item, i) => itemRow(item, i, { editable: false })).join('')}</ul>
      </li>`).join('');
    $('#ordersEmpty').hidden = orders.length > 0;
  }

  $('#savedGrid').addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit-design]');
    const remove = e.target.closest('[data-remove-design]');
    if (edit) {
      loadDesign(savedDesigns[+edit.dataset.editDesign]);
      location.hash = 'design';
    } else if (remove) {
      const [gone] = savedDesigns.splice(+remove.dataset.removeDesign, 1);
      store(DESIGNS_KEY, savedDesigns);
      renderAccount();
      toast(`Removed “${gone.text}”`);
    }
  });

  $('#detailsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#profileName').value.trim();
    const email = $('#profileEmail').value.trim();
    const error = $('#profileError');
    if (email && !EMAIL.test(email)) {
      error.textContent = 'Enter an email like name@example.com, or leave it blank.';
      error.hidden = false;
      $('#profileEmail').setAttribute('aria-invalid', 'true');
      $('#profileEmail').focus();
      return;
    }
    error.hidden = true;
    $('#profileEmail').removeAttribute('aria-invalid');
    profile = { name, email };
    store(PROFILE_KEY, profile);
    renderAccount();
    toast('Details saved');
  });

  // ---------- Checkout ----------

  let shipping = SHIPPING[0];
  let lastOrder = loadLastOrder();

  function loadLastOrder() {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY)); } catch (_) { return null; }
  }
  function saveLastOrder() {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(lastOrder)); } catch (_) {}
  }

  const withCurrency = (n) => `${money(n)} ${CURRENCY}`;

  function itemRow(item, i, { editable }) {
    const design = designOf(item);
    const packPicker = editable
      ? `<label class="pack-select"><span class="sr-only">Pack size for “${item.text}”</span>
           <select id="pack-${i}" data-pack-item="${i}">
             ${PACKS.map((p) => `<option value="${p.qty}"${p.qty === item.qty ? ' selected' : ''}>${p.qty} stickers · ${money(p.price)}</option>`).join('')}
           </select></label>`
      : `<span>${item.qty} stickers</span>`;
    return `
      <li class="co-item">
        <div class="cart-thumb">${stickerSVG(design)}</div>
        <div class="cart-meta">
          <strong>“${item.text}” · ${fontFor(item.font).name}</strong>
          <span>${describe(design)}</span>
          ${packPicker}
        </div>
        <div class="cart-side">${money(item.price)}${editable ? `<button type="button" data-co-remove="${i}">Remove</button>` : ''}</div>
      </li>`;
  }

  function renderCheckout() {
    const empty = cart.length === 0;
    $('#checkoutEmpty').hidden = !empty;
    $('#checkoutForm').hidden = empty;
    if (empty) return;

    $('#coItems').innerHTML = cart.map((item, i) => itemRow(item, i, { editable: true })).join('');
    $('#shipOptions').innerHTML = SHIPPING.map((o) => `
      <button class="ship-opt" type="button" role="radio" data-ship="${o.id}" aria-checked="${o === shipping}">
        <span class="ship-radio" aria-hidden="true"></span>
        <span class="ship-text"><strong>${o.name}</strong><span>${o.eta}</span></span>
        <span class="ship-price">${money(o.price)}</span>
      </button>`).join('');

    const sub = subtotal();
    $('#sumSubtotal').textContent = money(sub);
    $('#sumShipping').textContent = money(shipping.price);
    $('#sumTotal').textContent = withCurrency(sub + shipping.price);
    $('#demoNote').hidden = !!CHECKOUT_URL;
  }

  $('#coItems').addEventListener('change', (e) => {
    const sel = e.target.closest('[data-pack-item]');
    if (!sel) return;
    const item = cart[+sel.dataset.packItem];
    const p = PACKS.find((x) => x.qty === +sel.value);
    item.qty = p.qty;
    item.price = p.price;
    saveCart();
    renderCart();
    $(`#pack-${sel.dataset.packItem}`)?.focus();
  });
  $('#coItems').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-co-remove]');
    if (!btn) return;
    cart.splice(+btn.dataset.coRemove, 1);
    saveCart();
    renderCart();
  });
  $('#shipOptions').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ship]');
    if (!btn) return;
    shipping = SHIPPING.find((o) => o.id === btn.dataset.ship);
    renderCheckout();
    $(`[data-ship="${shipping.id}"]`).focus();
  });

  $('#checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!cart.length) return;
    const payBtn = $('#payBtn');
    const payError = $('#payError');
    payError.hidden = true;

    lastOrder = {
      id: `DS-${Date.now().toString(36).toUpperCase()}`,
      placed: new Date().toISOString(),
      items: cart.map((item) => ({ ...item })),
      shipping: shipping.id,
      total: subtotal() + shipping.price,
      demo: !CHECKOUT_URL,
    };
    saveLastOrder();

    if (!CHECKOUT_URL) {
      completeOrder();
      return;
    }

    payBtn.disabled = true;
    $('span', payBtn).textContent = 'Opening secure checkout…';
    try {
      const res = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(({ text, font, fill, outline, qty }) => ({ text, font, fill, outline, qty })),
          shipping: shipping.id,
          email: profile.email || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout is unavailable right now.');
      location.href = data.url;
    } catch (err) {
      payError.textContent = `${err.message} Your bag is saved, so try again in a minute.`;
      payError.hidden = false;
      payBtn.disabled = false;
      $('span', payBtn).textContent = 'Continue to payment';
    }
  });

  function completeOrder() {
    recordOrder(lastOrder);
    cart = [];
    saveCart();
    renderCart();
    location.hash = 'thanks';
  }

  // Stripe sends buyers back to ?paid=<session id>#thanks after a successful payment.
  function returnFromStripe() {
    const params = new URLSearchParams(location.search);
    if (!params.has('paid')) return;
    if (lastOrder) lastOrder.demo = false;
    saveLastOrder();
    recordOrder(lastOrder);
    cart = [];
    saveCart();
    renderCart();
    params.delete('paid');
    const qs = params.toString();
    try { history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}#thanks`); } catch (_) { location.hash = 'thanks'; }
  }

  function renderThanks() {
    const order = lastOrder;
    $('#thanksDemo').hidden = !(order && order.demo);
    $('#thanksNo').textContent = order && order.id ? `Order ${order.id}` : '';
    $('#thanksItems').innerHTML = order ? order.items.map((item, i) => itemRow(item, i, { editable: false })).join('') : '';
    const ship = order && SHIPPING.find((o) => o.id === order.shipping);
    $('#thanksSub').textContent = ship
      ? `We’ll print your stickers and send them by ${ship.name.toLowerCase()} (${ship.eta}). Total ${withCurrency(order.total)}.`
      : 'We’ll print your stickers and email you when they ship.';
  }

  // ---------- Router ----------

  const PAGES = $$('[data-page]');
  const TITLES = { design: 'Design', order: 'Your design', explore: 'Explore', about: 'About', checkout: 'Checkout', thanks: 'Thanks', account: 'Account' };
  let currentPage = null;

  function renderPage(id, { fresh = true } = {}) {
    switch (id) {
      case 'home':
        renderHome();
        break;
      case 'order':
        renderOrder();
        if (fresh) {
          carousel.scrollLeft = 0;
          setDot(0);
        }
        break;
      case 'explore': renderExplore(); break;
      case 'about': renderAbout(); break;
      case 'checkout': renderCheckout(); break;
      case 'thanks': renderThanks(); break;
      case 'account': renderAccount(); break;
      default: break;
    }
  }

  function go() {
    let id = location.hash.slice(1) || 'home';
    if (!PAGES.some((p) => p.dataset.page === id)) id = 'home';
    if (id === 'order' && !state.text) id = 'design';

    PAGES.forEach((p) => { p.hidden = p.dataset.page !== id; });
    const navId = id === 'order' ? 'design' : id;
    $$('[data-nav]').forEach((a) => {
      if (a.dataset.nav === navId) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.title = TITLES[id] ? `${TITLES[id]} · Digital Stick` : 'Digital Stick';

    renderPage(id);
    if (currentPage !== null) {
      window.scrollTo({ top: 0 });
      $(`[data-page="${id}"] h1`)?.focus({ preventScroll: true });
    }
    currentPage = id;
  }
  window.addEventListener('hashchange', go);

  // ---------- Fonts & boot ----------

  // Canvas measuring needs the real font loaded, so re-render once it arrives.
  function ensureFont(font = fontFor(state.font)) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return document.fonts.load(fontSpec(font, 100), state.text || 'JR').catch(() => {});
  }

  function rerender() {
    renderPreview();
    renderPage(currentPage, { fresh: false });
    if (drawer.open) renderCart();
  }

  $('#year').textContent = new Date().getFullYear();
  update({ fonts: true, swatches: true, url: false });
  renderCart();
  returnFromStripe();
  go();

  Promise.all(FONTS.map((f) => ensureFont(f))).then(rerender);
  if (document.fonts) document.fonts.addEventListener('loadingdone', rerender);
})();
