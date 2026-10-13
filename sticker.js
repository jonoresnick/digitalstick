// Sticker rendering shared by the shop (app.js) and the embeddable customizer (embed.js).
window.DigitalStick = (() => {
  'use strict';

  // Each font is named after a hockey term.
  const FONTS = [
    { id: 'beauty', name: 'Beauty', family: 'Bebas Neue',     weight: 400, meaning: 'The teammate everyone loves having in the room.' },
    { id: 'celly',  name: 'Celly',  family: 'Yellowtail',     weight: 400, meaning: 'The celebration after you score.' },
    { id: 'chirp',  name: 'Chirp',  family: 'Alfa Slab One',  weight: 400, meaning: 'Trash talk, usually from the bench.' },
    { id: 'dangle', name: 'Dangle', family: 'Graduate',       weight: 400, meaning: 'A slick deke around a defender.' },
    { id: 'flow',   name: 'Flow',   family: 'Kaushan Script', weight: 400, meaning: 'The hair sticking out the back of your helmet.' },
    { id: 'snipe',  name: 'Snipe',  family: 'Abril Fatface',  weight: 400, meaning: 'A shot picked perfectly into the corner.' },
    { id: 'twig',   name: 'Twig',   family: 'Fredoka',        weight: 700, meaning: 'Your stick.' },
    { id: 'wheel',  name: 'Wheel',  family: 'Russo One',      weight: 400, meaning: 'To skate fast. “That kid can wheel.”' },
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

  const OUTLINE_W = 7;   // in font-size-100 units
  const KEYLINE_W = 17;  // thin white border around the logo, like the printed stickers

  const colourFor = (hex) => {
    hex = normaliseHex(hex);
    if (!hex) return null;
    return COLOURS.find((c) => c.hex === hex) || { name: 'Custom', hex };
  };
  const fontFor = (id) => FONTS.find((f) => f.id === id) || FONTS[1];

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
  function logoParts(design, { keyline = 0 } = {}) {
    const font = fontFor(design.font);
    const text = design.text;
    const m = measure(text, font);
    const outlineW = design.outline ? OUTLINE_W : 0;
    const pad = Math.max(keyline, outlineW) / 2 + 2;
    const x = -m.left - pad;
    const y = -m.ascent - pad;
    const w = m.left + m.right + pad * 2;
    const h = m.ascent + m.descent + pad * 2;

    const textAttrs = `x="0" y="0" font-family="'${font.family}'" font-weight="${font.weight}" font-size="100" stroke-linejoin="round" stroke-linecap="round"`;
    let body = '';
    if (keyline) {
      body += `<text ${textAttrs} fill="#fff" stroke="#fff" stroke-width="${keyline}">${text}</text>`;
    }
    const stroke = design.outline
      ? ` stroke="${design.outline.hex}" stroke-width="${outlineW}" paint-order="stroke fill"`
      : '';
    body += `<text ${textAttrs} fill="${design.fill.hex}"${stroke}>${text}</text>`;

    return { viewBox: `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, body };
  }

  function logoSVG(design, opts = {}) {
    const { viewBox, body } = logoParts(design, opts);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true">${body}</svg>`;
  }

  // The product: a 1" black rounded square with the keylined logo centred on it.
  function stickerSVG(design) {
    const { viewBox, body } = logoParts(design, { keyline: KEYLINE_W });
    return `<svg class="sticker" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="15" fill="#121316"/>
      <svg x="14" y="14" width="72" height="72" viewBox="${viewBox}" overflow="visible">${body}</svg>
    </svg>`;
  }

  // Mirrors where players put it: a 1" square sticker on the lower shaft, above the flex/curve print.
  let stickSeq = 0;
  function stickSVG(design) {
    const { viewBox, body } = logoParts(design, { keyline: KEYLINE_W });
    const u = `st${++stickSeq}`;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <linearGradient id="${u}stickLower" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#45474d"/>
            <stop offset=".1" stop-color="#141518"/>
            <stop offset=".55" stop-color="#0b0c0e"/>
            <stop offset=".88" stop-color="#1b1c20"/>
            <stop offset="1" stop-color="#4b4d53"/>
          </linearGradient>
          <linearGradient id="${u}stickUpper" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#3f3a35"/>
            <stop offset=".3" stop-color="#8e867c"/>
            <stop offset=".6" stop-color="#6c655d"/>
            <stop offset="1" stop-color="#36322e"/>
          </linearGradient>
          <pattern id="${u}stickDots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1" fill="#fff" opacity=".18"/>
          </pattern>
          <linearGradient id="${u}stickerGloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
            <stop offset=".35" stop-color="#fff" stop-opacity="0"/>
          </linearGradient>
          <filter id="${u}stickShadow" x="-30%" y="-10%" width="160%" height="120%">
            <feDropShadow dx="10" dy="6" stdDeviation="9" flood-opacity=".22"/>
          </filter>
        </defs>
        <g transform="translate(200 200) rotate(-9)">
          <g filter="url(#${u}stickShadow)">
            <rect x="-62" y="-340" width="124" height="680" fill="url(#${u}stickLower)"/>
            <path d="M-62 -340H62V-92L38 -126H-38L-62 -92Z" fill="url(#${u}stickUpper)"/>
            <path d="M-62 -340H62V-250H-62Z" fill="url(#${u}stickDots)"/>
            <path d="M-62 -168L0 -206L62 -168" fill="none" stroke="#d3202f" stroke-width="5"/>
            <path d="M-62 -92L-38 -126H38L62 -92" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.5"/>
            <rect x="-62" y="-340" width="4" height="680" fill="#e4e5e8" opacity=".75"/>
            <rect x="58" y="-340" width="4" height="680" fill="#e4e5e8" opacity=".55"/>
            <rect x="-44" y="-340" width="9" height="680" fill="#fff" opacity=".06"/>
          </g>
          <g transform="translate(0 -24)">
            <rect x="-50" y="-50" width="100" height="100" rx="12" fill="#0a0a0c" fill-opacity=".55" stroke="#fff" stroke-opacity=".3" stroke-width="1.2"/>
            <svg x="-40" y="-40" width="80" height="80" viewBox="${viewBox}" overflow="visible">${body}</svg>
            <rect x="-50" y="-50" width="100" height="100" rx="12" fill="url(#${u}stickerGloss)"/>
          </g>
          <text transform="translate(0 52) rotate(90)" x="0" y="0" dominant-baseline="central"
                font-family="'Russo One', sans-serif" font-size="34" letter-spacing="3" fill="#f1f2f4">P28 / 70 FLEX</text>
        </g>
      </svg>`;
  }

  return {
    FONTS, COLOURS, colourFor, fontFor, normaliseHex, cleanText, isLight,
    fontSpec, logoParts, logoSVG, stickerSVG, stickSVG,
  };
})();
