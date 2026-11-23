import { createGlobe } from "@ortho-earth/globe";

const STYLE = "https://stars.optgeo.org/style/bvmap-nightsky";
// Terrarium-encoded nationwide Japan terrain (GSI DEM 1m/5m/10m, priority-merged), served by stars.optgeo.org.
const TERRAIN = "https://stars.optgeo.org/mapterhorn-japan-bridge/{z}/{x}/{y}";

// "#zoom/lat/lon" — start over Japan, where the bvmap tiles and the terrain have data.
const map = await createGlobe({ target: "#map", style: STYLE, view: "#4.5/36/138" });

// ?exag=2 exaggerates the relief (default 1 = true scale).
const exag = Number(new URLSearchParams(location.search).get("exag")) || 1;
map.setTerrain({
  source: { tiles: [TERRAIN], encoding: "terrarium", tileSize: 512, maxzoom: 16,
    attribution: "国土地理院 (GSI Japan). Processed with Mapterhorn (japan-bridge, interim)." },
  exaggeration: exag,
});

// ?v=zoom/lat/lon[/pitch[/bearing]] opens at a given view, e.g. ?v=11/35.36/138.73/65 (Mt. Fuji).
const v = new URLSearchParams(location.search).get("v");
if (v) {
  const [zoom, lat, lon, pitch = 0, bearing = 0] = v.split("/").map(Number);
  map.jumpTo({ center: [lon, lat], zoom, pitch, bearing });
}
window.map = map;
