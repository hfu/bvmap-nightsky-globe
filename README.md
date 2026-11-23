# bvmap-nightsky-globe

A single-page site that shows **bvmap-nightsky** (a dark, light-on-dark MapLibre style) on a 3D globe, drawn by the **Ortho Earth** engine.

Live: https://hfu.github.io/bvmap-nightsky-globe/

## What it is

- `index.html` + `src/main.js`: one call, `createGlobe({ style: "https://stars.optgeo.org/style/bvmap-nightsky" })`, starting over Japan (the bvmap tiles cover Japan; elsewhere you see Ortho Earth's own world layers).
- **Terrain**: `map.setTerrain(...)` with the Terrarium DEM `https://stars.optgeo.org/mapterhorn-japan-bridge/{z}/{x}/{y}` ([hfu/mapterhorn-japan-bridge](https://github.com/hfu/mapterhorn-japan-bridge): GSI 基盤地図情報 DEM 1m/5m/10m priority-merged, processed with Mapterhorn). The style itself has no hillshade, so relief shows mainly when the camera is tilted.
- **Only bvmap-nightsky is drawn.** Ortho Earth's defaults are switched off in `createGlobe`: built-in elevation (`terrain: false`; the Mapterhorn DEM is added with `setTerrain`), night-side dimming, Natural Earth coastline, world rivers/lakes, stars/planets/moon/constellations (`sky`, `stars`), 3D buildings (`mesh`), country-name hover, the top-right chips and the built-in layer groups; only the attribution box and scale bar are kept (`instruments`). The sky clock cannot be switched off by an option, so it is hidden with one line of CSS.
- **Layer control** (top left): Ortho Earth's standard control (Places/Terrain/Rail/... and themes) is hidden and replaced by a bvmap one that switches the style's layers by GSI source-layer group (Roads, Railways, Buildings, Water, Boundaries, Contours, Power lines, Labels).
- **Equal Earth**: the "Equal Earth map" button in the layer control calls Ortho Earth's standard `map.gadget.equalStart()`, which opens Ortho Earth's own Equal Earth page (`https://www.ortho-earth.com/equal/`, in an iframe) at the current view. That page draws Ortho Earth's world data, not bvmap-nightsky.
- **Attribution** uses Ortho Earth's standard box (bottom right, "Data sources"): the style is fetched at start and the dwg7 / terrain credits are appended to the `bvmap` source's `attribution`.
- URL options: the view is kept in Ortho Earth's standard URL hash (`#zoom/lat/lon/<pitch>t/<bearing>r`, e.g. [`#10.5/35.36/138.73/65t/20r`](https://hfu.github.io/bvmap-nightsky-globe/#10.5/35.36/138.73/65t/20r) for Mt. Fuji); `?exag=2` for vertical exaggeration (default 1 = true scale); `?gl2=1` to force WebGL2.
- `docs/` is the Vite build output served by GitHub Pages (`main`, `/docs`). Rebuild with `npm install && npm run build`.
- Ortho Earth must be served from the same origin as the page (its workers), so it is bundled with Vite and not loaded from a CDN. See the [Ortho Earth recipe](https://www.ortho-earth.com/start.md).

## Credits and attribution

- **Map data / style**: bvmap-nightsky is derived from the [GSI optimized vector tiles (optimal_bvmap)](https://github.com/gsi-cyberjapan/optimal_bvmap) of the Geospatial Information Authority of Japan (国土地理院), used under the [GSI content terms of use](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html). Sprite icons are modified from the originals (grayscale, inverted) by [dwg7/bvmap](https://github.com/dwg7/bvmap).
- **This is a dwg7 activity ([UN Open GIS Initiative](https://unopengis.org/) DWG7), not an official GSI product.** GSI does not endorse this site.
- **Terrain data**: 国土地理院 (GSI Japan) 基盤地図情報 DEM, processed with Mapterhorn (japan-bridge, interim), via hfu/mapterhorn-japan-bridge (the bridge code is CC0; the GSI-derived elevation data keeps GSI's own terms).
- Style and tiles are served from `stars.optgeo.org` ([hfu/stars](https://github.com/hfu/stars)).
- **Globe engine**: [Ortho Earth](https://github.com/kenjiyoshidahome2026-bit/ortho-earth) (`@ortho-earth/globe` 2.4.2) by Kenji Yoshida, GPL-3.0-or-later. A commercial license is offered by its author.

## Known differences

Ortho Earth's rendering of the MapLibre style is not pixel-identical to MapLibre GL JS; line widths in particular can differ slightly. `createGlobe` is called with `zoomScale: "maplibre"` (numeric zoom on MapLibre's scale) as a best-effort measure (Ortho Earth's documentation says a style's own zoom values are already read on MapLibre's scale, so this may change nothing for the style itself); whether it narrows the gap has **not** been verified against a MapLibre reference image. On WebGPU the base map's paint is baked per tile zoom (not continuous with zoom), while WebGL2 (`?gl2=1`) evaluates it every frame, so the two paths can differ too (per Ortho Earth's `maplibre-compat.md`).

## Browsers

Ortho Earth uses WebGPU and falls back to WebGL2. In some virtualized or GPU-less environments the globe can stay black; that was seen in an embedded browser pane, while Brave on macOS rendered it correctly.

## License

GPL-3.0-or-later (see `LICENSE`). Bundling Ortho Earth into this page is distribution, so the page's own code is released under the same license. The map data and style carry their own terms (see above).
