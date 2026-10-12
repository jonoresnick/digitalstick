# Digital Stick

A two-character logo customizer for hockey sticks. Pick your numbers or initials, choose a font, and colour it in NHL team colours. Then choose a sticker pack and add it to your bag.

It's a static site with no build step. Serve the folder and open it:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

- `index.html`: markup for both steps (build your design, then quantity and cart)
- `styles.css`: desktop and mobile layouts (the mobile layout is an accordion below 760px)
- `app.js`: fonts, colours, SVG logo rendering, sticker packs and the cart

The design is saved in the URL (`?t=JR&f=celly&c=AF1E2D&o=192168`), so you can share a link to it.
