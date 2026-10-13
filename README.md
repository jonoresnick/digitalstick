# Digital Stick

Custom hockey stick stickers. Players design a two-character logo, choose a font and NHL team colours, pick a sticker pack and pay through Stripe.

## Pages

The site is one page with hash routes and no build step.

| Route | Page |
| --- | --- |
| `#home` | Homepage: hero, how it works, the eight fonts, sticker packs |
| `#design` | The customizer: initials, font, colour, outline |
| `#order` | Your design: pack size, terms, add to bag |
| `#explore` | Starter designs, filterable by font. Click one to load it into the customizer |
| `#about` | Story, where the sticker goes, how to apply it, glossary, colour list, FAQ |
| `#checkout` | Bag review, pack changes, shipping speed, order summary |
| `#thanks` | Order confirmation |

## Files

- `index.html`: markup for every page
- `styles.css`: desktop and mobile layouts
- `sticker.js`: fonts, colours and sticker drawing, shared by the shop and the embed
- `app.js`: shop pages, cart, checkout and routing
- `embed.html`, `embed.js`: the compact customizer for Notion and other pages
- `netlify/functions/checkout.mjs`: creates the Stripe Checkout session
- `netlify.toml`: Netlify config

## Run it locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Checkout runs in demo mode until you connect Stripe. The pay button goes to a confirmation page that says nothing was charged.

## Taking payments with Stripe

Customers review their bag on your checkout page, then continue to Stripe's hosted checkout. Stripe collects the shipping address and card (Apple Pay and Google Pay too), so card details never touch your site. The Netlify function recalculates every price on the server, so nobody can change a price in their browser. It also attaches each design's text, font and colours to the order, so you know exactly what to print.

1. **Create a Stripe account** at stripe.com and stay in test mode for now.
2. **Copy your secret key.** In the Stripe dashboard, go to Developers → API keys and copy the key that starts with `sk_test_`.
3. **Deploy to Netlify.** Create a new site from this GitHub repo. No build command is needed.
4. **Add the key.** In Netlify, go to Site configuration → Environment variables and add `STRIPE_SECRET_KEY` with the key you copied. Redeploy.
5. **Turn on checkout.** In `app.js`, set `const CHECKOUT_URL = '/api/checkout';`, then commit and push.
6. **Test it.** Place an order using Stripe's test card `4242 4242 4242 4242`, with any future expiry date and any CVC. The order appears under Payments in Stripe. Each line item shows the design to print.
7. **Go live.** Activate your Stripe account, swap in your `sk_live_` key and redeploy.

### Things to set before launch

- **Currency:** CAD by default. Change `CURRENCY` in both `app.js` and `checkout.mjs`.
- **Prices:** `PACKS` in `app.js` and `checkout.mjs` must match.
- **Shipping:** `SHIPPING` in both files must match. `ALLOWED_COUNTRIES` in `checkout.mjs` controls where you ship.
- **Taxes:** turn on Stripe Tax in the dashboard and add `automatic_tax[enabled]=true` to the session if you need to collect sales tax.
- **About page:** the story and FAQ are starter copy. Rewrite them in your own words.

## Embedding the customizer (Notion, portfolios)

`embed.html` is a compact version of the customizer with no shop, bag or checkout. It's built to sit inside a Notion embed block or any other page.

1. **Publish the repo with GitHub Pages.** In the GitHub repo, go to Settings → Pages. Under "Build and deployment", choose "Deploy from a branch", pick `master` and `/ (root)`, then click Save. After a minute or two the site is live at `https://jonoresnick.github.io/digitalstick/`.
2. **Add it to Notion.** On your Notion page, type `/embed`, paste `https://jonoresnick.github.io/digitalstick/embed.html` and choose "Embed link". Drag the block's bottom edge until the whole widget shows. About 480px tall fits the two-column layout.

Optional URL settings:

| Parameter | Example | What it does |
| --- | --- | --- |
| `t` | `t=19` | Starting text (up to 2 letters or numbers) |
| `f` | `f=dangle` | Starting font: beauty, celly, chirp, dangle, flow, snipe, twig, wheel |
| `c` | `c=FFB81C` | Fill colour (hex, no `#`) |
| `o` | `o=000000` or `o=none` | Outline colour |
| `theme` | `theme=dark` | Force light or dark. By default it follows the viewer's system setting |

For example: `embed.html?t=JR&f=twig&c=99D9D9&o=041E42`
