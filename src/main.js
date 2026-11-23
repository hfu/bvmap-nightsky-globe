import { createGlobe } from "@ortho-earth/globe";

const STYLE = "https://stars.optgeo.org/style/bvmap-nightsky";
// "#zoom/lat/lon" — start over Japan, where the bvmap tiles have data.
const map = await createGlobe({ target: "#map", style: STYLE, view: "#4.5/36/138" });
window.map = map;
