// Creates a Stripe Checkout Session for the bag and returns its URL.
// Prices are looked up here, never taken from the browser.
//
// Needs one environment variable in Netlify: STRIPE_SECRET_KEY (sk_test_… or sk_live_…).

const CURRENCY = 'cad';

// Pack size -> price in cents. Must match PACKS in app.js.
const PACKS = { 6: 1299, 12: 1999, 24: 4999, 48: 8999 };

// Must match SHIPPING in app.js.
const SHIPPING = {
  standard: { name: 'Standard mail', amount: 299, min: 5, max: 10 },
  tracked:  { name: 'Tracked',       amount: 999, min: 2, max: 5 },
};

const FONTS = {
  beauty: 'Beauty', celly: 'Celly', chirp: 'Chirp', dangle: 'Dangle',
  flow: 'Flow', snipe: 'Snipe', twig: 'Twig', wheel: 'Wheel',
};

const ALLOWED_COUNTRIES = ['CA', 'US'];

const HEX = /^#[0-9A-F]{6}$/;
const TEXT = /^[A-Z0-9]{1,2}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function validItem(item) {
  return item
    && TEXT.test(item.text)
    && Object.hasOwn(FONTS, item.font)
    && HEX.test(item.fill)
    && (item.outline === null || HEX.test(item.outline))
    && Object.hasOwn(PACKS, item.qty);
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json({ error: 'Payments aren’t set up yet.' }, 500);

  let order;
  try {
    order = await req.json();
  } catch {
    return json({ error: 'That order couldn’t be read.' }, 400);
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const ship = SHIPPING[order.shipping];
  if (items.length === 0 || items.length > 20 || !items.every(validItem) || !ship) {
    return json({ error: 'Something in your bag isn’t valid. Rebuild the design and try again.' }, 400);
  }

  const origin = new URL(req.url).origin;
  const p = new URLSearchParams();
  p.append('mode', 'payment');
  p.append('success_url', `${origin}/?paid={CHECKOUT_SESSION_ID}#thanks`);
  p.append('cancel_url', `${origin}/#checkout`);
  p.append('billing_address_collection', 'auto');
  p.append('phone_number_collection[enabled]', 'false');
  ALLOWED_COUNTRIES.forEach((c, i) => p.append(`shipping_address_collection[allowed_countries][${i}]`, c));

  items.forEach((item, i) => {
    const outline = item.outline || 'none';
    const li = `line_items[${i}]`;
    p.append(`${li}[quantity]`, '1');
    p.append(`${li}[price_data][currency]`, CURRENCY);
    p.append(`${li}[price_data][unit_amount]`, String(PACKS[item.qty]));
    p.append(`${li}[price_data][product_data][name]`, `“${item.text}” sticker pack, ${item.qty} stickers`);
    p.append(`${li}[price_data][product_data][description]`, `${FONTS[item.font]} font, fill ${item.fill}, outline ${outline}`);
    // Shows up on the order in the Stripe dashboard, so you know exactly what to print.
    p.append(`${li}[price_data][product_data][metadata][text]`, item.text);
    p.append(`${li}[price_data][product_data][metadata][font]`, item.font);
    p.append(`${li}[price_data][product_data][metadata][fill]`, item.fill);
    p.append(`${li}[price_data][product_data][metadata][outline]`, outline);
    p.append(`${li}[price_data][product_data][metadata][pack]`, String(item.qty));
  });

  const rate = 'shipping_options[0][shipping_rate_data]';
  p.append(`${rate}[type]`, 'fixed_amount');
  p.append(`${rate}[display_name]`, ship.name);
  p.append(`${rate}[fixed_amount][amount]`, String(ship.amount));
  p.append(`${rate}[fixed_amount][currency]`, CURRENCY);
  p.append(`${rate}[delivery_estimate][minimum][unit]`, 'business_day');
  p.append(`${rate}[delivery_estimate][minimum][value]`, String(ship.min));
  p.append(`${rate}[delivery_estimate][maximum][unit]`, 'business_day');
  p.append(`${rate}[delivery_estimate][maximum][value]`, String(ship.max));

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: p,
  });
  const session = await res.json();
  if (!res.ok) {
    console.error('Stripe error', session.error);
    return json({ error: 'Checkout is unavailable right now.' }, 502);
  }
  return json({ url: session.url });
};

export const config = { path: '/api/checkout' };
