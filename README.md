# bvmap-nightsky-globe

A single-page site that shows **bvmap-nightsky** (a dark, light-on-dark MapLibre style) on a 3D globe, drawn by the **Ortho Earth** engine.

Live: https://hfu.github.io/bvmap-nightsky-globe/

## What it is

- `index.html` + `src/main.js`: one call, `createGlobe({ style: "https://stars.optgeo.org/style/bvmap-nightsky" })`, starting over Japan (the bvmap tiles cover Japan; elsewhere you see Ortho Earth's own world layers).
- `docs/` is the Vite build output served by GitHub Pages (`main`, `/docs`). Rebuild with `npm install && npm run build`.
- Ortho Earth must be served from the same origin as the page (its workers), so it is bundled with Vite and not loaded from a CDN. See the [Ortho Earth recipe](https://www.ortho-earth.com/start.md).

## Credits and attribution

- **Map data / style**: bvmap-nightsky is derived from the [GSI optimized vector tiles (optimal_bvmap)](https://github.com/gsi-cyberjapan/optimal_bvmap) of the Geospatial Information Authority of Japan (国土地理院), used under the [GSI content terms of use](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html). Sprite icons are modified from the originals (grayscale, inverted) by [dwg7/bvmap](https://github.com/dwg7/bvmap).
- **This is a dwg7 activity ([UN Open GIS Initiative](https://unopengis.org/) DWG7), not an official GSI product.** GSI does not endorse this site.
- Style and tiles are served from `stars.optgeo.org` ([hfu/stars](https://github.com/hfu/stars)).
- **Globe engine**: [Ortho Earth](https://github.com/kenjiyoshidahome2026-bit/ortho-earth) (`@ortho-earth/globe` 2.4.2) by Kenji Yoshida, GPL-3.0-or-later. A commercial license is offered by its author.
- The attribution is also shown on the page itself.

## Browsers

Ortho Earth uses WebGPU and falls back to WebGL2. Add `?gl2=1` to force WebGL2. In some virtualized or GPU-less environments the globe can stay black; that was seen in an embedded browser pane, while Brave on macOS rendered it correctly.

## License

GPL-3.0-or-later (see `LICENSE`). Bundling Ortho Earth into this page is distribution, so the page's own code is released under the same license. The map data and style carry their own terms (see above).
