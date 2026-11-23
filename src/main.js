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
// Start over Japan, where the bvmap tiles and the terrain have data. urlHash keeps the view in the URL hash
// (Ortho Earth's standard "#zoom/lat/lon/<pitch>t/<bearing>r"); an incoming hash is passed on as the initial `view`.
const map = await createGlobe({
  target: "#map", style, view: location.hash || "#4.5/36/138", urlHash: true, zoomScale: "maplibre",
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
// Equal Earth (the flat, equal-area world map): Ortho Earth's standard entry, opened from Ortho Earth's own site.
const eq = document.createElement("button");
eq.type = "button";
eq.textContent = "Equal Earth map";
eq.style.cssText = "margin-top:6px;width:100%;cursor:pointer";
eq.addEventListener("click", () => map.gadget.equalStart({ url: "https://www.ortho-earth.com/equal/" }));
box.append(eq);
document.body.append(panel);
window.map = map;
