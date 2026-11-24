import { createGlobe } from "@ortho-earth/globe";

const STYLE = "https://stars.optgeo.org/style/bvmap-nightsky";
// Terrarium-encoded nationwide Japan terrain (GSI DEM 1m/5m/10m, priority-merged), served by stars.optgeo.org.
const TERRAIN = "https://stars.optgeo.org/mapterhorn-japan-bridge/{z}/{x}/{y}";
const q = new URLSearchParams(location.search);

// Credits go to Ortho Earth's standard attribution box (#attr, "Data sources"), which collects the `attribution` of the
// style's sources. The bvmap source already carries the GSI text; fetch the style and append the rest to it.
const style = await (await fetch(STYLE)).json();
style.sources.bvmap.attribution +=
  '・bvmap-nightsky: a <a href="https://dwg7.unopengis.org/" target="_blank" rel="noopener">dwg7</a> activity, not an official GSI product' +
  '・Terrain: 国土地理院 (GSI) DEM, processed with <a href="https://github.com/hfu/mapterhorn-japan-bridge" target="_blank" rel="noopener">Mapterhorn (japan-bridge)</a>';

// zoomScale "maplibre": numeric zoom follows MapLibre's scale (engine z = MapLibre z + 1); an attempt to close small style differences (e.g. line widths).
// The style's opaque land fill (bvmap-行政区画) has the same colour as the background from z8 up, but over terrain it hides
// contour lines on some slopes. Keep it only below z9 (where the background is the sea colour) and let the background show above.
const landFill = style.layers.find((l) => l.id === "bvmap-行政区画");
if (landFill) landFill.maxzoom = 9;

// Start over Japan, where the bvmap tiles and the terrain have data. urlHash keeps the view in the URL hash
// (Ortho Earth's standard "#zoom/lat/lon/<pitch>t/<bearing>r"); an incoming hash is passed on as the initial `view`.
const map = await createGlobe({
  target: "#map", style, view: location.hash || "#4.5/36/138", urlHash: true, zoomScale: "maplibre",
  handlers: { dragRotate: false }, // Ortho Earth's tilt drag runs the opposite way to MapLibre; replaced by the handler below
  // Switch off everything Ortho Earth draws by default so that only bvmap-nightsky (and the terrain below) is shown:
  terrain: false,       // no built-in elevation (AW3D30); the DEM is added with setTerrain below
  night: false,         // no night-side dimming
  coastline: false,     // no Natural Earth coastline/borders
  worldLines: false,    // no world rivers / maritime lines
  worldFill: false,     // no world lakes / below-sea-level fill
  stars: false, sky: false, // no stars, planets, moon, constellations, clock
  mesh: false,          // no 3D buildings
  countryTip: false,    // no hover country names
  chips: false,         // no top-right chips
  layers: { place: false, terrain: false, rail: false, road: false, facility: false }, // seal the built-in layer groups
  instruments: ["attr", "scale"], // keep the attribution box (required) and the scale bar
});

map.setTerrain({
  source: { tiles: [TERRAIN], encoding: "terrarium", tileSize: 512, maxzoom: 16 },
  exaggeration: Number(q.get("exag")) || 1, // ?exag=2 exaggerates the relief (default 1 = true scale)
});

// Compass (north-up) button: Ortho Earth's standard gadget; it shows while the view is tilted or rotated.
map.gadget.compass();

// Relief (hillshade + hypsometric tint) from the same DEM. Ortho Earth draws these layers above the base map and below the labels,
// so the style's opaque fills (background, administrative area) do not paint over them.
map.addSource("dem", { type: "raster-dem", tiles: [TERRAIN], encoding: "terrarium", tileSize: 512, maxzoom: 16 });
map.addLayer({ id: "relief-tint", type: "color-relief", source: "dem", paint: {
  "color-relief-opacity": 0.4,
  "color-relief-color": ["interpolate", ["linear"], ["elevation"],
    0, "#1e2a2e", 300, "#2f3d36", 1000, "#4a5646", 2000, "#6f7566", 3000, "#9a9c90", 3800, "#d0d0c8"],
} }).then(() => map.addLayer({ id: "relief-shade", type: "hillshade", source: "dem", paint: {
  "hillshade-exaggeration": 0.35,
  "hillshade-shadow-color": "#000000",
  "hillshade-highlight-color": "#ffffff",
  "hillshade-accent-color": "#000000",
} })).catch((e) => console.warn("relief layers:", e));

// Tilt/rotate drag with MapLibre's direction and speed (right button, or Ctrl + left button). Ortho Earth's own handler moves the
// pitch the other way (drag down = tilt more), so it is switched off above. Temporary: remove when Ortho Earth follows MapLibre.
// MapLibre: bearing += dx * 0.8 deg, pitch += dy * -0.5 deg. No inertia.
{
  const el = document.getElementById("map");
  let g = null;
  const deg = (rad) => (rad * 180) / Math.PI;
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || !(e.button === 2 || e.ctrlKey)) return;
    g = { id: e.pointerId, x: e.clientX, y: e.clientY };
    el.setPointerCapture?.(e.pointerId);
  }, true);
  el.addEventListener("pointermove", (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    g.x = e.clientX; g.y = e.clientY;
    const maxPitch = map.view.maxPitch ? deg(map.view.maxPitch) : 75;
    map.jumpTo({
      bearing: deg(map.view.bearing) + dx * 0.8,
      pitch: Math.min(maxPitch, Math.max(0, deg(map.view.pitch) - dy * 0.5)),
    });
  }, true);
  const end = (e) => { if (g && e.pointerId === g.id) g = null; };
  el.addEventListener("pointerup", end, true);
  el.addEventListener("pointercancel", end, true);
  el.addEventListener("contextmenu", (e) => e.preventDefault()); // Ctrl+click is a context menu on macOS
}

// bvmap layer control: the style's layers, grouped by GSI source-layer, switched with layout.visibility.
const GROUPS = [
  ["Roads", ["RdCL", "RdEdg", "RdCompt"]],
  ["Railways", ["RailCL", "RailTrCL"]],
  ["Buildings", ["BldA", "StrctArea", "StrctLine"]],
  ["Water", ["WA", "WL", "Cstline", "RvrCL", "WStrA", "WStrL", "WRltLine"]],
  ["Boundaries", ["AdmArea", "AdmBdry", "SpcfArea"]],
  ["Contours", ["Cntr", "Isbt", "TpgphLine", "TpgphArea"]],
  ["Power lines", ["PwrTrnsmL"]],
  ["Labels", ["Anno"]],
];
const layers = map.getStyle().layers;
const panel = document.createElement("div");
panel.id = "bvl";
panel.innerHTML = '<button id="bvl-btn" type="button" aria-expanded="false" aria-controls="bvl-panel" title="bvmap layers">☰</button>' +
  '<div id="bvl-panel" hidden><h4>bvmap layers</h4></div>';
const box = panel.querySelector("#bvl-panel");
for (const [name, sls] of GROUPS) {
  const ids = layers.filter((l) => sls.includes(l["source-layer"])).map((l) => l.id);
  if (!ids.length) continue;
  const label = document.createElement("label");
  label.innerHTML = '<input type="checkbox" checked> ' + name;
  label.firstElementChild.addEventListener("change", (e) => {
    for (const id of ids) map.setLayoutProperty(id, "visibility", e.target.checked ? "visible" : "none");
  });
  box.append(label);
}
panel.querySelector("#bvl-btn").addEventListener("click", (e) => {
  box.hidden = !box.hidden;
  e.currentTarget.setAttribute("aria-expanded", String(!box.hidden));
});
const relief = document.createElement("label");
relief.innerHTML = '<input type="checkbox" checked> Relief (shade + tint)';
relief.firstElementChild.addEventListener("change", (e) => {
  for (const id of ["relief-tint", "relief-shade"]) map.setLayoutProperty(id, "visibility", e.target.checked ? "visible" : "none");
});
box.append(relief);

// Equal Earth (the flat, equal-area world map): Ortho Earth's standard entry, opened from Ortho Earth's own site.
const eq = document.createElement("button");
eq.type = "button";
eq.textContent = "Equal Earth map";
eq.style.cssText = "margin-top:6px;width:100%;cursor:pointer";
eq.addEventListener("click", () => map.gadget.equalStart({ url: "https://www.ortho-earth.com/equal/" }));
box.append(eq);
document.body.append(panel);
window.map = map;
