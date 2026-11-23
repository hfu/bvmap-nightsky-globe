import{n as J,d as G,c as rt,w as ct,l as U,a as pt,u as N,i as Nt,m as Zt,t as Qt}from"./rangecache-flag-DUqD5ZxK.js";import{e as Xt,r as Jt,t as Yt}from"./renderworker-D_COh6DJ.js";import{w as te}from"./loader-BDMM-NDo.js";import{d as ee,e as ne,f as _t,g as re,h as oe}from"./scene-DPUy_syw.js";import{S as tt,j as Ct}from"./bake-BKDmfqS9.js";function ze(t){const n=6356752314245179e-9,e=Math.PI/2*n,s=Math.PI*n;return Math.max(0,Math.min(1,(t-e)/(s-e)))}function ke(t,n,e=6e-4){return!(t<8e5)||!(e>0)?0:e*.001*Math.pow(Math.max(t/8e5,1e-4),-.59)*(1-Math.max(0,Math.min(1,n)))}const ot={R:"6378137.0",RPOLAR:"6356752.3142451793",THICK:"111000.0"},Le=`
const float CS_R = ${ot.R};
const float CS_RP = ${ot.RPOLAR};
const float CS_THICK = ${ot.THICK};
const vec3 CS_BR = vec3(5.5e-6, 13.0e-6, 28.4e-6);
const vec3 CS_BM = vec3(21e-6);
const vec2 CS_H = vec2(10000.0, 3200.0);
const float CS_G = 0.9;
float csTanh(float x) { float x2 = x * x; return max(-1.0, min(1.0, x * (27.0 + x2) / (27.0 + 9.0 * x2))); }
// 半直線と球（中心 0）の区間（czm_raySphereIntersectionInterval）。交わらない＝false
bool csSphere(vec3 o, vec3 d, float r, out vec2 seg) {
	float a = dot(d, d), b = 2.0 * dot(d, o), c = dot(o, o) - r * r, det = b * b - 4.0 * a * c;
	if (det < 0.0) { seg = vec2(0.0); return false; }
	float s = sqrt(det);
	seg = vec2(-b - s, -b + s) / (2.0 * a);
	return true;
}
// computeScattering（AtmosphereCommon.glsl）
void csScatter(vec3 ro, vec3 rd, float rayLen, vec3 L, float inner, out vec3 ray, out vec3 mie, out float opac) {
	ray = vec3(0.0); mie = vec3(0.0); opac = 0.0;
	float outer = inner + CS_THICK;
	vec2 seg;
	if (!csSphere(ro, rd, outer, seg)) return;
	float x = 1e-7 * seg.y / abs(rayLen);
	float wStop = 0.5 * (1.0 + csTanh(x));
	float start0 = seg.x;
	seg.x = max(seg.x, 0.0);
	seg.y = min(seg.y, abs(rayLen));
	float wIn = 1.0 - 0.5 * (1.0 + csTanh(start0 - CS_THICK));
	int PS = 16 - int(wIn * 12.0), LS = 4 - int(wIn * 2.0);
	float pos = seg.x, total = seg.y - pos;
	float inc = wIn * ((1.0 - wStop) * total / (float(PS * (PS + 1)) / 2.0));
	float stepL = max(1.0 - wIn, wStop) * total / max(7.0 * wIn, float(PS));
	vec3 accR = vec3(0.0), accM = vec3(0.0);
	vec2 od = vec2(0.0);
	for (int i = 0; i < 16; i++) {
		if (i >= PS) break;
		vec3 sp = ro + rd * (pos + stepL);
		vec2 dens = exp(-(length(sp) - inner) / CS_H) * stepL;
		od += dens;
		vec2 ls;
		csSphere(sp, L, outer, ls);
		float lstep = ls.y / float(LS), lpos = 0.0;
		vec2 lod = vec2(0.0);
		for (int j = 0; j < 4; j++) {
			if (j >= LS) break;
			lod += exp(-(length(sp + L * (lpos + lstep * 0.5)) - inner) / CS_H) * lstep;
			lpos += lstep;
		}
		vec3 att = exp(-(CS_BM * (od.y + lod.y) + CS_BR * (od.x + lod.x)));
		accR += dens.x * att; accM += dens.y * att;
		stepL += inc; pos += stepL;
	}
	ray = CS_BR * accR; mie = CS_BM * accM;
	opac = length(exp(-(CS_BM * od.y + CS_BR * od.x)));
}
// computeAtmosphereColor
vec4 csColor(vec3 eye, vec3 p, vec3 L, vec3 ray, vec3 mie, float opac, float intensity) {
	float c = dot(normalize(p - eye), L), c2 = c * c, g2 = CS_G * CS_G;
	float phR = 3.0 / 50.2654824574 * (1.0 + c2);
	float phM = 3.0 / 25.1327412287 * ((1.0 - g2) * (c2 + 1.0)) / (pow(1.0 + g2 - 2.0 * c * CS_G, 1.5) * (2.0 + g2));
	return vec4((phR * ray + phM * mie) * intensity, opac);
}
// 地面の大気（GlobeFS・HDR なし）：col は表示の色（Cesium も画像の色に直に足す）
//   lightDir＝globe.enableLighting の光（地球固定・単位ベクトル）・night＝夜側の暗さ（GlobeFS の sunlitAtmosphereIntensity 0.05..1・負＝照明なし＝従来）
vec3 csGroundL(vec3 col, vec3 eye, vec3 p, float fade, vec3 lightDir, float night) {
	if (fade <= 0.0) return col;
	vec3 L = night >= 0.0 ? lightDir : normalize(p), ray, mie;   // 照明あり＝散乱も本物の光の向きで（夜側は暗い）・無し＝天頂の光
	float op;
	csScatter(eye, normalize(p - eye), length(p - eye), L, length(p), ray, mie, op);
	vec4 a = csColor(eye, p, L, ray, mie, op, 10.0);
	vec3 f = col + a.rgb * (0.5 + clamp(1.0 - a.a, 0.0, 1.0));
	if (night >= 0.0) {   // 夜側＝地面を見せず大気の色だけ（darken）→ 距離で日向と混ぜる
		float darken = clamp(dot(normalize(p), lightDir), 0.0, 1.0);
		f = mix(mix(a.rgb, f, darken), f, night);
	}
	return mix(col, vec3(1.0) - exp(-2.0 * f), fade);
}
vec3 csGround(vec3 col, vec3 eye, vec3 p, float fade) { return csGroundL(col, eye, p, fade, vec3(0.0), -1.0); }
vec3 csTone(vec3 c) {   // czm_pbrNeutralTonemapping
	float x = min(c.r, min(c.g, c.b));
	c -= x < 0.08 ? x - 6.25 * x * x : 0.04;
	float peak = max(c.r, max(c.g, c.b));
	if (peak < 0.76) return c;
	float d = 0.24, np = 1.0 - d * d / (peak + d - 0.76);
	c *= np / peak;
	return mix(c, vec3(np), 1.0 - 1.0 / (0.15 * (peak - np) + 1.0));
}
// 霧（GlobeFS の FOG の枝・HDR なし）：800 km より下で、地面の色を点の大気の色（tonemap＋逆ガンマ）へ czm_fog（距離×濃さ・visualDensityScalar 0.15）で寄せる。
//   density＝csFogDensity（0＝霧なし）。lightDir/night は csGroundL と同じ（照明あり＝霧の色を目の位置の昼夜で暗く・minimumBrightness 0.03）
//   csFogV＝霧の色（rgb）と混ぜる量（a）：地形・模型は頂点で出して補間する（Cesium の GlobeVS／模型の AtmosphereStage も頂点）
vec4 csFogV(vec3 eye, vec3 p, float density, vec3 lightDir, float night) {
	if (density <= 0.0) return vec4(0.0);
	vec3 L = night >= 0.0 ? lightDir : normalize(p), ray, mie;
	float op, dist = length(p - eye);
	csScatter(eye, normalize(p - eye), dist, L, length(p), ray, mie, op);
	vec3 fc = csColor(eye, p, L, ray, mie, op, 10.0).rgb;
	if (night >= 0.0) fc *= clamp(dot(normalize(eye), lightDir), 0.03, 1.0);
	fc = pow(max(csTone(fc), vec3(0.0)), vec3(1.0 / 2.2));
	float s = dist * density, m = 0.15;
	return vec4(fc, 1.0 - exp(-((m * s + m) * (s * (1.0 + m)))));
}
vec3 csFogL(vec3 col, vec3 eye, vec3 p, float density, vec3 lightDir, float night) { vec4 v = csFogV(eye, p, density, lightDir, night); return mix(col, v.rgb, v.a); }
vec3 csFog(vec3 col, vec3 eye, vec3 p, float density) { return csFogL(col, eye, p, density, vec3(0.0), -1.0); }
// 地面の向こうの空の大気（globe:false・translucency で地面が透ける時）＝Cesium の SkyAtmosphere は地面を知らず殻の奥の面まで描く。地面を通る視線だけ色を返す（通らない＝a<0）
//   translucent（globe.translucency）：Cesium は球の裏面（backFaceAlpha 既定 1＝不透明・光の当たらない内側）が透けた表面の奥に見える＝黒
//   それ以外（globe を描かない）：Cesium は地球の中まで標本化する＝深い弦は密度 exp が溢れて NaN＝実 GPU（Metal）では何も描かれない＝透明（後ろの星空・背景色が見える）。
//   浅い弦（地平の近く）は溢れず不透明の黒。その見た目を写す（深さ 282km＝exp(88) の 3200m）。白は SwiftShader の NaN の出方だった（2026-10-28 より前の門の ref）＝clipping-regions の穴で実測（2026-11-10）
vec4 csSkyUnder(vec3 eye, vec3 dir, float inner, float translucent) {
	vec2 g;
	if (!csSphere(eye, dir, inner, g) || g.y <= 0.0) return vec4(-1.0);
	if (translucent > 0.5) return vec4(0.0, 0.0, 0.0, 1.0);
	vec3 pm = eye + dir * (max(g.x, 0.0) + g.y) * 0.5;
	return inner - length(pm) > 282000.0 ? vec4(0.0) : vec4(0.0, 0.0, 0.0, 1.0);
}
// 空の大気（SkyAtmosphereCommon＋SkyAtmosphereFS・HDR なし）：殻（半径×1.025）の奥の面の点の色。前乗算の rgba。under＝地面を通る視線も描く（0=描かない 1=不透明の地面の向こう 2=半透明の地面の向こう）
// lightDir/dyn: the sun when Cesium lights the atmosphere (globe.enableLighting + dynamicAtmosphereLighting: dyn >= 0), otherwise the light is
// straight above each point (dyn < 0). Lit, the night side of the sky fades out by sqrt(dot(up, light)) as SkyAtmosphereCommon's nightAlpha
// czm_applyHSBShift（ignoreBlackPixels）＝空の大気の色相・彩度・明るさのずらし（Cesium の skyAtmosphere.hueShift/saturationShift/brightnessShift・COLOR_CORRECT）
vec3 csHsbShift(vec3 rgb, vec3 sh) {
	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(rgb.bg, K.wz), vec4(rgb.gb, K.xy), step(rgb.b, rgb.g));
	vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));
	float d = q.x - min(q.w, q.y);
	vec3 hsb = vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-7)), d / (q.x + 1e-7), q.x);
	hsb.x += sh.x;
	hsb.y = clamp(hsb.y + sh.y, 0.0, 1.0);
	hsb.z = clamp(hsb.z > 1e-7 ? hsb.z + sh.z : 0.0, 0.0, 1.0);
	vec3 h = abs(fract(hsb.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
	return hsb.z * mix(vec3(1.0), clamp(h - 1.0, 0.0, 1.0), hsb.y);
}
// hsb：csHsbShift のずらし（全部 0＝Cesium は COLOR_CORRECT を立てない＝掛けない）
vec4 csSkyL(vec3 eye, vec3 dir, float under, vec3 lightDir, float dyn, vec3 hsb) {
	vec2 s;
	if (!csSphere(eye, dir, CS_R * 1.025, s) || s.y <= 0.0) return vec4(0.0);
	vec3 p = eye + dir * s.y;
	float eyeH = length(eye) - CS_R, rdiff = CS_R - CS_RP;
	float rAdj = rdiff / 4.0 + rdiff / 2.0 * clamp((eyeH - CS_R / 4.0) / (CS_R - CS_R / 4.0), 0.0, 1.0);
	float inner = CS_R - rAdj;
	if (under > 0.5) { vec4 u = csSkyUnder(eye, dir, inner, under - 1.0); if (u.a >= 0.0) return u; }
	vec3 L = dyn >= 0.0 ? lightDir : normalize(p), ray, mie;
	float op;
	csScatter(eye, dir, length(p - eye), L, inner, ray, mie, op);
	float outer = inner + CS_THICK;
	op = clamp((outer - (eyeH + inner)) / (outer - inner), 0.0, 1.0);
	if (dyn >= 0.0) op *= sqrt(clamp(dot(normalize(p), L), 0.0, 1.0));
	vec4 c = csColor(eye, p, L, ray, mie, op, 50.0);
	c.rgb = pow(max(csTone(c.rgb), vec3(0.0)), vec3(1.0 / 2.2));
	if (any(notEqual(hsb, vec3(0.0)))) c.rgb = csHsbShift(c.rgb, hsb);   // α は ずらした後の青から（SkyAtmosphereFS と同じ順）
	float a = clamp(mix(c.b, 1.0, c.a), 0.0, 1.0);
	return vec4(c.rgb * a, a);
}
vec4 csSky2(vec3 eye, vec3 dir, float under) { return csSkyL(eye, dir, under, vec3(0.0), -1.0, vec3(0.0)); }
vec4 csSky(vec3 eye, vec3 dir) { return csSky2(eye, dir, 0.0); }
`,Re=`
const CS_R: f32 = ${ot.R};
const CS_RP: f32 = ${ot.RPOLAR};
const CS_THICK: f32 = ${ot.THICK};
const CS_BR: vec3f = vec3f(5.5e-6, 13.0e-6, 28.4e-6);
const CS_BM: vec3f = vec3f(21e-6);
const CS_H: vec2f = vec2f(10000.0, 3200.0);
const CS_G: f32 = 0.9;
fn csTanh(x: f32) -> f32 { let x2 = x * x; return max(-1.0, min(1.0, x * (27.0 + x2) / (27.0 + 9.0 * x2))); }
// 半直線と球（中心 0）の区間。交わらない＝z が 0
fn csSphere(o: vec3f, d: vec3f, r: f32) -> vec3f {
	let a = dot(d, d); let b = 2.0 * dot(d, o); let c = dot(o, o) - r * r; let det = b * b - 4.0 * a * c;
	if (det < 0.0) { return vec3f(0.0); }
	let s = sqrt(det);
	return vec3f((-b - s) / (2.0 * a), (-b + s) / (2.0 * a), 1.0);
}
struct CsScat { ray: vec3f, mie: vec3f, opac: f32 };
fn csScatter(ro: vec3f, rd: vec3f, rayLen: f32, L: vec3f, inner: f32) -> CsScat {
	var r: CsScat; r.ray = vec3f(0.0); r.mie = vec3f(0.0); r.opac = 0.0;
	let outer = inner + CS_THICK;
	var seg = csSphere(ro, rd, outer);
	if (seg.z < 0.5) { return r; }
	let wStop = 0.5 * (1.0 + csTanh(1e-7 * seg.y / abs(rayLen)));
	let start0 = seg.x;
	seg.x = max(seg.x, 0.0);
	seg.y = min(seg.y, abs(rayLen));
	let wIn = 1.0 - 0.5 * (1.0 + csTanh(start0 - CS_THICK));
	let PS = 16 - i32(wIn * 12.0); let LS = 4 - i32(wIn * 2.0);
	var pos = seg.x; let total = seg.y - pos;
	let inc = wIn * ((1.0 - wStop) * total / (f32(PS * (PS + 1)) / 2.0));
	var stepL = max(1.0 - wIn, wStop) * total / max(7.0 * wIn, f32(PS));
	var accR = vec3f(0.0); var accM = vec3f(0.0); var od = vec2f(0.0);
	for (var i = 0; i < 16; i++) {
		if (i >= PS) { break; }
		let sp = ro + rd * (pos + stepL);
		let dens = exp(-(length(sp) - inner) / CS_H) * stepL;
		od += dens;
		let ls = csSphere(sp, L, outer);
		let lstep = ls.y / f32(LS); var lpos = 0.0; var lod = vec2f(0.0);
		for (var j = 0; j < 4; j++) {
			if (j >= LS) { break; }
			lod += exp(-(length(sp + L * (lpos + lstep * 0.5)) - inner) / CS_H) * lstep;
			lpos += lstep;
		}
		let att = exp(-(CS_BM * (od.y + lod.y) + CS_BR * (od.x + lod.x)));
		accR += dens.x * att; accM += dens.y * att;
		stepL += inc; pos += stepL;
	}
	r.ray = CS_BR * accR; r.mie = CS_BM * accM;
	r.opac = length(exp(-(CS_BM * od.y + CS_BR * od.x)));
	return r;
}
fn csColor(eye: vec3f, p: vec3f, L: vec3f, s: CsScat, intensity: f32) -> vec4f {
	let c = dot(normalize(p - eye), L); let c2 = c * c; let g2 = CS_G * CS_G;
	let phR = 3.0 / 50.2654824574 * (1.0 + c2);
	let phM = 3.0 / 25.1327412287 * ((1.0 - g2) * (c2 + 1.0)) / (pow(1.0 + g2 - 2.0 * c * CS_G, 1.5) * (2.0 + g2));
	return vec4f((phR * s.ray + phM * s.mie) * intensity, s.opac);
}
fn csGroundL(col: vec3f, eye: vec3f, p: vec3f, fade: f32, lightDir: vec3f, night: f32) -> vec3f {
	if (fade <= 0.0) { return col; }
	let L = select(normalize(p), lightDir, night >= 0.0);   // 照明あり＝散乱も本物の光の向きで（夜側は暗い）・無し＝天頂の光
	let a = csColor(eye, p, L, csScatter(eye, normalize(p - eye), length(p - eye), L, length(p)), 10.0);
	var f = col + a.rgb * (0.5 + clamp(1.0 - a.a, 0.0, 1.0));
	if (night >= 0.0) { let darken = clamp(dot(normalize(p), lightDir), 0.0, 1.0); f = mix(mix(a.rgb, f, darken), f, night); }
	return mix(col, vec3f(1.0) - exp(-2.0 * f), fade);
}
fn csGround(col: vec3f, eye: vec3f, p: vec3f, fade: f32) -> vec3f { return csGroundL(col, eye, p, fade, vec3f(0.0), -1.0); }
fn csTone(c0: vec3f) -> vec3f {
	var c = c0;
	let x = min(c.r, min(c.g, c.b));
	c -= select(0.04, x - 6.25 * x * x, x < 0.08);
	let peak = max(c.r, max(c.g, c.b));
	if (peak < 0.76) { return c; }
	let d = 0.24; let np = 1.0 - d * d / (peak + d - 0.76);
	c *= np / peak;
	return mix(c, vec3f(np), 1.0 - 1.0 / (0.15 * (peak - np) + 1.0));
}
// 霧（gl と同じ・csFogL）
fn csFogV(eye: vec3f, p: vec3f, density: f32, lightDir: vec3f, night: f32) -> vec4f {
	if (density <= 0.0) { return vec4f(0.0); }
	let L = select(normalize(p), lightDir, night >= 0.0);
	let dist = length(p - eye);
	var fc = csColor(eye, p, L, csScatter(eye, normalize(p - eye), dist, L, length(p)), 10.0).rgb;
	if (night >= 0.0) { fc *= clamp(dot(normalize(eye), lightDir), 0.03, 1.0); }
	fc = pow(max(csTone(fc), vec3f(0.0)), vec3f(1.0 / 2.2));
	let s = dist * density; let m = 0.15;
	return vec4f(fc, 1.0 - exp(-((m * s + m) * (s * (1.0 + m)))));
}
fn csFogL(col: vec3f, eye: vec3f, p: vec3f, density: f32, lightDir: vec3f, night: f32) -> vec3f { let v = csFogV(eye, p, density, lightDir, night); return mix(col, v.rgb, v.a); }
fn csFog(col: vec3f, eye: vec3f, p: vec3f, density: f32) -> vec3f { return csFogL(col, eye, p, density, vec3f(0.0), -1.0); }
// 地面の向こうの空の大気（gl と同じ・csSkyUnder）
fn csSkyUnder(eye: vec3f, dir: vec3f, inner: f32, translucent: f32) -> vec4f {
	let g = csSphere(eye, dir, inner);
	if (g.z < 0.5 || g.y <= 0.0) { return vec4f(-1.0); }
	if (translucent > 0.5) { return vec4f(0.0, 0.0, 0.0, 1.0); }
	let pm = eye + dir * (max(g.x, 0.0) + g.y) * 0.5;
	return select(vec4f(0.0, 0.0, 0.0, 1.0), vec4f(0.0), inner - length(pm) > 282000.0);
}
// czm_applyHSBShift（gl と同じ・csHsbShift）
fn csHsbShift(rgb: vec3f, sh: vec3f) -> vec3f {
	let K = vec4f(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	let p = mix(vec4f(rgb.bg, K.wz), vec4f(rgb.gb, K.xy), step(rgb.b, rgb.g));
	let q = mix(vec4f(p.xyw, rgb.r), vec4f(rgb.r, p.yzx), step(p.x, rgb.r));
	let d = q.x - min(q.w, q.y);
	var hsb = vec3f(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-7)), d / (q.x + 1e-7), q.x);
	hsb.x += sh.x;
	hsb.y = clamp(hsb.y + sh.y, 0.0, 1.0);
	hsb.z = clamp(select(0.0, hsb.z + sh.z, hsb.z > 1e-7), 0.0, 1.0);
	let h = abs(fract(hsb.xxx + vec3f(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
	return hsb.z * mix(vec3f(1.0), clamp(h - 1.0, vec3f(0.0), vec3f(1.0)), hsb.y);
}
// lightDir/dyn/hsb: as the GLSL csSkyL
fn csSkyL(eye: vec3f, dir: vec3f, under: f32, lightDir: vec3f, dyn: f32, hsb: vec3f) -> vec4f {
	let s = csSphere(eye, dir, CS_R * 1.025);
	if (s.z < 0.5 || s.y <= 0.0) { return vec4f(0.0); }
	let p = eye + dir * s.y;
	let eyeH = length(eye) - CS_R; let rdiff = CS_R - CS_RP;
	let inner = CS_R - (rdiff / 4.0 + rdiff / 2.0 * clamp((eyeH - CS_R / 4.0) / (CS_R - CS_R / 4.0), 0.0, 1.0));
	if (under > 0.5) { let u = csSkyUnder(eye, dir, inner, under - 1.0); if (u.a >= 0.0) { return u; } }
	let L = select(normalize(p), lightDir, dyn >= 0.0);
	var sc = csScatter(eye, dir, length(p - eye), L, inner);
	let outer = inner + CS_THICK;
	sc.opac = clamp((outer - (eyeH + inner)) / (outer - inner), 0.0, 1.0);
	if (dyn >= 0.0) { sc.opac *= sqrt(clamp(dot(normalize(p), L), 0.0, 1.0)); }
	let c = csColor(eye, p, L, sc, 50.0);
	var rgb = pow(max(csTone(c.rgb), vec3f(0.0)), vec3f(1.0 / 2.2));
	if (any(hsb != vec3f(0.0))) { rgb = csHsbShift(rgb, hsb); }   // α は ずらした後の青から（SkyAtmosphereFS と同じ順）
	let a = clamp(mix(rgb.b, 1.0, c.a), 0.0, 1.0);
	return vec4f(rgb * a, a);
}
fn csSky2(eye: vec3f, dir: vec3f, under: f32) -> vec4f { return csSkyL(eye, dir, under, vec3f(0.0), -1.0, vec3f(0.0)); }
fn csSky(eye: vec3f, dir: vec3f) -> vec4f { return csSky2(eye, dir, 0.0); }
`,se=t=>typeof t=="string"?t:t.type,Bt=t=>Math.max(0,...Object.values(t.metadata||{}).map(n=>typeof n=="string"?-1:n.tex))+1;function Et(t,n){const e=t.type,s=/vec([234])/.test(e)?+RegExp.$1:1,a=e.startsWith("u")?"u":e.startsWith("i")?"i":"f",r=l=>{const c=[];for(let h=0;h<t.bytes;h++){const g=t.ch[l*t.bytes+h]??0;c.push(`${n?"u32":"uint"}(px[${g}] * 255.0 + 0.5)${h?` << ${8*h}u`:""}`)}const f=c.length>1?`(${c.join(" | ")})`:c[0];let p;return t.float?p=n?`bitcast<f32>(${f})`:`uintBitsToFloat(${f})`:t.norm?p=`${n?"f32":"float"}(${f}) / ${(2**(8*t.bytes)-1).toFixed(1)}`:a==="f"?p=`${n?"f32":"float"}(${f})`:a==="i"?p=n?`bitcast<i32>(${f} << ${32-8*t.bytes}u) >> ${32-8*t.bytes}u`:`(int(${f} << ${32-8*t.bytes}u) >> ${32-8*t.bytes})`:p=f,a==="f"&&(t.scale!=null||t.offset!=null)&&(p=`(${p}) * ${(t.scale??1).toFixed(9)} + ${(t.offset??0).toFixed(9)}`),p},o=Array.from({length:s},(l,c)=>r(c));return s===1?o[0]:n?`${O(e)}(${o.join(", ")})`:`${e}(${o.join(", ")})`}const ae=["<<=",">>=","++","--","+=","-=","*=","/=","%=","&=","|=","^=","==","!=","<=",">=","&&","||","^^","<<",">>"];function wt(t){const n=[];let e=0,s=!0;for(;e<t.length;){const a=t[e];if(a===`
`){s=!0,e++;continue}if(a===" "||a==="	"||a==="\r"){e++;continue}if(a==="/"&&t[e+1]==="/"){for(;e<t.length&&t[e]!==`
`;)e++;continue}if(a==="/"&&t[e+1]==="*"){const o=t.indexOf("*/",e+2);e=o<0?t.length:o+2;continue}if(a==="#"&&s){let o=e;for(;o<t.length&&t[o]!==`
`;)t[o]==="\\"&&t[o+1]===`
`&&o++,o++;n.push({t:"pp",v:t.slice(e,o)}),e=o;continue}if(s=!1,/[A-Za-z_]/.test(a)){let o=e+1;for(;o<t.length&&/[A-Za-z0-9_]/.test(t[o]);)o++;n.push({t:"id",v:t.slice(e,o)}),e=o;continue}if(/[0-9]/.test(a)||a==="."&&/[0-9]/.test(t[e+1]||"")){const o=/^(0[xX][0-9a-fA-F]+[uU]?|(?:[0-9]+\.[0-9]*|\.[0-9]+|[0-9]+)(?:[eE][+-]?[0-9]+)?[fFuU]?)/.exec(t.slice(e));n.push({t:"num",v:o[0]}),e+=o[0].length;continue}const r=ae.find(o=>t.startsWith(o,e))||a;n.push({t:"op",v:r}),e+=r.length}return n}const ce=new Set(["highp","mediump","lowp","in","out","inout","const","flat","smooth","uniform","precise","invariant"]),Dt=/^(void|float|int|uint|bool|[biu]?vec[234]|mat[234](x[234])?|sampler2D)$/;function ie(t){const n=wt(t);let e=0;const s=new Set(["czm_modelMaterial","czm_modelVertexOutput","FragmentInput","VertexInput","Attributes","FeatureIds","Metadata"]),a=(b=0)=>n[e+b],r=(b,i=0)=>n[e+i]?.v===b&&n[e+i].t!=="num",o=b=>{if(!r(b))throw new Error(`csshader: expected '${b}' near '${n.slice(e,e+6).map(i=>i.v).join(" ")}'`);e++},l=(b=0)=>{const i=n[e+b];return!!i&&i.t==="id"&&(Dt.test(i.v)||s.has(i.v))},c=()=>{const b=[];for(;n[e]?.t==="id"&&ce.has(n[e].v);)b.push(n[e++].v);return b},f=()=>{const b=n[e];if(!b||b.t!=="id")throw new Error("csshader: type expected");return e++,b.v},p=()=>{const b=n[e];if(!b||b.t!=="id")throw new Error(`csshader: identifier expected near '${b?.v}'`);return e++,b.v},h=[[["||"],1],[["^^"],2],[["&&"],3],[["|"],4],[["^"],5],[["&"],6],[["==","!="],7],[["<",">","<=",">="],8],[["<<",">>"],9],[["+","-"],10],[["*","/","%"],11]],g=b=>{if(!b||b.t!=="op")return-1;for(const[i,x]of h)if(i.includes(b.v))return x;return-1},M=new Set(["=","+=","-=","*=","/=","%=","&=","|=","^=","<<=",">>="]);function d(){return m()}function m(){const b=v(),i=a();return i&&i.t==="op"&&M.has(i.v)?(e++,{k:"asg",op:i.v,l:b,r:m()}):b}function v(){const b=$(0);if(r("?")){e++;const i=m();o(":");const x=m();return{k:"tern",c:b,a:i,b:x}}return b}function $(b){let i=C();for(;;){const x=g(a());if(x<0||x<b)break;const y=n[e++].v,u=$(x+1);i={k:"bin",op:y,a:i,b:u}}return i}function C(){const b=a();return b&&b.t==="op"&&["-","+","!","~","++","--"].includes(b.v)?(e++,{k:"un",op:b.v,e:C()}):k(R())}function R(){const b=n[e++];if(!b)throw new Error("csshader: unexpected end");if(b.t==="num")return{k:"num",v:b.v};if(b.v==="("){const i=d();return o(")"),i}if(b.t==="id"){if(r("(")){e++;const i=[];for(r("void")&&r(")",1)&&e++;!r(")")&&(i.push(m()),r(","));)e++;return o(")"),{k:"call",fn:b.v,args:i}}return{k:"id",name:b.v}}throw new Error(`csshader: unexpected '${b.v}'`)}function k(b){for(;;)if(r("."))e++,b={k:"mem",o:b,name:p()};else if(r("[")){e++;const i=d();o("]"),b={k:"idx",o:b,i}}else if(r("++")||r("--"))b={k:"post",op:n[e++].v,e:b};else return b}function T(b,i){const x=[];for(;;){const y=p();if(r("["))throw new Error("csshader: arrays are not supported");let u=null;if(r("=")&&(e++,u=m()),x.push({name:y,init:u}),r(",")){e++;continue}break}return o(";"),{k:"decl",type:b,vars:x,isConst:i}}function _(){if(r("{")){e++;const b=[];for(;!r("}");)b.push(_());return o("}"),{k:"block",body:b}}if(r(";"))return e++,{k:"empty"};if(r("if")){e++,o("(");const b=d();o(")");const i=_();let x=null;return r("else")&&(e++,x=_()),{k:"if",c:b,t:i,f:x}}if(r("for")){e++,o("(");let b=null;r(";")?e++:b=A();const i=r(";")?null:d();o(";");const x=r(")")?null:d();return o(")"),{k:"for",init:b,cond:i,step:x,body:_()}}if(r("while")){e++,o("(");const b=d();return o(")"),{k:"while",c:b,body:_()}}if(r("return")){e++;const b=r(";")?null:d();return o(";"),{k:"ret",e:b}}if(r("break"))return e++,o(";"),{k:"break"};if(r("continue"))return e++,o(";"),{k:"cont"};if(r("discard"))return e++,o(";"),{k:"discard"};if(r("do")||r("switch"))throw new Error(`csshader: '${a().v}' is not supported`);return A()}function A(){const b=e,i=c();if(l()&&a(1)?.t==="id"){const y=f();return T(y,i.includes("const"))}e=b;const x=d();return o(";"),{k:"expr",e:x}}const L=[];for(;e<n.length;){const b=a();if(b.t==="pp"){L.push({k:"pp",v:b.v}),e++;continue}if(r(";")){e++;continue}if(r("precision")){for(;!r(";");)e++;e++;continue}if(r("struct")){e++;const u=p();s.add(u),o("{");const z=[];for(;!r("}");){c();const w=f();for(;;){if(z.push({type:w,name:p()}),r(",")){e++;continue}break}o(";")}o("}"),o(";"),L.push({k:"struct",name:u,fields:z});continue}const i=c();if(i.includes("uniform")){for(;!r(";");)e++;e++;continue}const x=f(),y=p();if(r("(")){e++;const u=[];for(r("void")&&r(")",1)&&e++;!r(")");){const w=c(),S=f(),B=n[e]?.t==="id"?p():`_p${u.length}`;if(u.push({q:w.includes("inout")?"inout":w.includes("out")?"out":"in",type:S,name:B}),r(","))e++;else break}if(o(")"),r(";")){e++;continue}o("{");const z=[];for(;!r("}");)z.push(_());o("}"),L.push({k:"fn",ret:x,name:y,params:u,body:z});continue}e-=1,L.push({k:"gdecl",d:T(x,i.includes("const"))})}return L}const V=t=>t==="float"||t==="afloat"||/^vec|^mat/.test(t)?"f":t==="int"||t==="aint"||t.startsWith("ivec")?"i":t==="uint"||t.startsWith("uvec")?"u":t==="bool"||t.startsWith("bvec")?"b":"?",D=t=>{const n=/vec([234])$/.exec(t);return n?+n[1]:/^(float|int|uint|bool|afloat|aint)$/.test(t)?1:0},ut=t=>D(t)===1,X=t=>/vec[234]$/.test(t),W=t=>/^mat/.test(t),K=t=>t==="afloat"||t==="aint",at=(t,n)=>n===1?{f:"float",i:"int",u:"uint",b:"bool"}[t]:{f:"",i:"i",u:"u",b:"b"}[t]+"vec"+n,et=t=>t==="afloat"?"float":t==="aint"?"int":t,nt=t=>{const n=/^mat([234])(?:x([234]))?$/.exec(t);return[+n[1],+(n[2]||n[1])]};function O(t){if(t=et(t),t==="float")return"f32";if(t==="int")return"i32";if(t==="uint")return"u32";if(t==="bool")return"bool";if(X(t)){const n=V(t),e=D(t);return n==="b"?`vec${e}<bool>`:`vec${e}${n}`}if(W(t)){const[n,e]=nt(t);return`mat${n}x${e}f`}return t}const zt=/^([xyzw]{1,4}|[rgba]{1,4}|[stpq]{1,4})$/,kt={s:"x",t:"y",p:"z",q:"w"},Ot=[["positionMC","vec3"],["positionWC","vec3"],["positionEC","vec3"],["normalMC","vec3"],["normalEC","vec3"],["tangentMC","vec3"],["tangentEC","vec3"],["bitangentMC","vec3"],["bitangentEC","vec3"],["texCoord_0","vec2"],["texCoord_1","vec2"],["color_0","vec4"],["featureId_0","float"]],le=[["baseColor","vec4"],["diffuse","vec3"],["alpha","float"],["specular","vec3"],["roughness","float"],["normalEC","vec3"],["occlusion","float"],["emissive","vec3"]],fe=[["positionMC","vec3"],["pointSize","float"]],ue=[["featureId_0","int"],["featureId_1","int"]],bt={czm_pi:["float","3.141592653589793"],czm_twoPi:["float","6.283185307179586"],czm_piOverTwo:["float","1.5707963267948966"],czm_piOverFour:["float","0.7853981633974483"],czm_oneOverPi:["float","0.3183098861837907"],czm_radiansPerDegree:["float","0.017453292519943295"],czm_degreesPerRadian:["float","57.29577951308232"],czm_epsilon1:["float","0.1"],czm_epsilon2:["float","0.01"],czm_epsilon3:["float","0.001"],czm_epsilon4:["float","0.0001"],czm_epsilon5:["float","0.00001"],czm_epsilon6:["float","0.000001"],czm_epsilon7:["float","0.0000001"]},Mt=t=>{const n=Object.entries(t.metadata||{}).map(([e,s])=>[e,se(s)]);return{Attributes:Ot,czm_modelMaterial:le,czm_modelVertexOutput:fe,FeatureIds:ue,Metadata:n.length?n:[["_none","float"]],FragmentInput:[["attributes","Attributes"],["featureIds","FeatureIds"],["metadata","Metadata"]],VertexInput:[["attributes","Attributes"],["featureIds","FeatureIds"],["metadata","Metadata"]]}},he=[{name:"czm_HSBToRGB",deps:[],src:`const vec4 czm_K_HSB2RGB = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 czm_HSBToRGB(vec3 hsb) {
	vec3 p = abs(fract(hsb.xxx + czm_K_HSB2RGB.xyz) * 6.0 - czm_K_HSB2RGB.www);
	return hsb.z * mix(czm_K_HSB2RGB.xxx, clamp(p - czm_K_HSB2RGB.xxx, 0.0, 1.0), hsb.y);
}
`},{name:"czm_HSLToRGB",deps:[],src:`vec3 czm_hueToRGB(float hue) {
	float r = abs(hue * 6.0 - 3.0) - 1.0;
	float g = 2.0 - abs(hue * 6.0 - 2.0);
	float b = 2.0 - abs(hue * 6.0 - 4.0);
	return clamp(vec3(r, g, b), 0.0, 1.0);
}
vec3 czm_HSLToRGB(vec3 hsl) {
	vec3 rgb = czm_hueToRGB(hsl.x);
	float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
	return (rgb - 0.5) * c + hsl.z;
}
`},{name:"czm_RGBToHSB",deps:[],src:`const vec4 czm_K_RGB2HSB = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
vec3 czm_RGBToHSB(vec3 rgb) {
	vec4 p = mix(vec4(rgb.bg, czm_K_RGB2HSB.wz), vec4(rgb.gb, czm_K_RGB2HSB.xy), step(rgb.b, rgb.g));
	vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));
	float d = q.x - min(q.w, q.y);
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + czm_epsilon7)), d / (q.x + czm_epsilon7), q.x);
}
`},{name:"czm_RGBToHSL",deps:[],src:`vec3 czm_RGBtoHCV(vec3 rgb) {
	vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1.0, 2.0 / 3.0) : vec4(rgb.gb, 0.0, -1.0 / 3.0);
	vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);
	float c = q.x - min(q.w, q.y);
	float h = abs((q.w - q.y) / (6.0 * c + czm_epsilon7) + q.z);
	return vec3(h, c, q.x);
}
vec3 czm_RGBToHSL(vec3 rgb) {
	vec3 hcv = czm_RGBtoHCV(rgb);
	float l = hcv.z - hcv.y * 0.5;
	float s = hcv.y / (1.0 - abs(l * 2.0 - 1.0) + czm_epsilon7);
	return vec3(hcv.x, s, l);
}
`}];function Pt(t){const n=new Set([t.vs,t.fs].flatMap(e=>e?wt(e).filter(s=>s.t==="id").map(s=>s.v):[]));return he.filter(e=>n.has(e.name)).map(e=>e.src).join("")}const qt=t=>`cu_${t}`;function Te(t,n){const e=Mt(t),s=o=>`struct ${o} {
${e[o].map(([l,c])=>`	${c} ${l};`).join(`
`)}
};
`;let a="";for(const[o,[l,c]]of Object.entries(bt))a+=`const ${l} ${o} = ${c};
`;a+=`uniform float u_czmFrame;
#define czm_frameNumber u_czmFrame
`,a+=`vec3 czm_srgbToLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec4 czm_srgbToLinear(vec4 c) { return vec4(czm_srgbToLinear(c.rgb), c.a); }
`,a+=`vec3 czm_linearToSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
vec4 czm_linearToSrgb(vec4 c) { return vec4(czm_linearToSrgb(c.rgb), c.a); }
`,a+=`float czm_luminance(vec3 rgb) { return dot(rgb, vec3(0.2125, 0.7154, 0.0721)); }
`,a+=s("Attributes")+s("FeatureIds")+s("Metadata")+(n==="vs"?s("czm_modelVertexOutput")+s("VertexInput"):s("czm_modelMaterial")+s("FragmentInput"));for(const[o,l]of Object.entries(t.uniforms||{}))a+=`uniform ${l} ${qt(o)};
`;a+=`Attributes csAttrsOf(vec3 mc, vec3 pw, vec3 ec, vec3 nw, vec2 uv, vec4 col, float fid, mat3 J, mat3 V) {
	Attributes a;
${Ot.map(([o,l])=>`	a.${o} = ${l==="float"?"0.0":`${l}(0.0)`};
`).join("")}	a.positionMC = mc; a.positionWC = vec3(pw.x, pw.z, pw.y) * 6378137.0; a.positionEC = ec;
	vec3 nm = transpose(J) * nw; a.normalMC = dot(nm, nm) > 0.0 ? normalize(nm) : vec3(0.0, 0.0, 1.0);
	a.normalEC = normalize(V * nw); a.texCoord_0 = uv; a.texCoord_1 = uv; a.color_0 = col; a.featureId_0 = fid;
	return a;
}
`;const r=n==="fs"?Bt(t):0;for(let o=0;o<r;o++)a+=`uniform sampler2D csmt_${o};
`;return a+=`Metadata csMetaOf(vec2 uvm) {
	Metadata m;
${r?`	vec4 px;
`:""}${Mt(t).Metadata.map(([o,l])=>{const c=t.metadata?.[o];return r&&c&&typeof c!="string"?`	px = texture(csmt_${c.tex}, uvm);
	m.${o} = ${Et(c,!1)};
`:`	m.${o} = ${l}(0);
`}).join("")}	return m;
}
`,a+Pt(t)}function Ae(t,n){const e=new Set(Object.keys(n.uniforms||{}));let s="",a=null;for(const r of wt(t)){if(r.t==="pp"){s+=`
${r.v}
`,a=null;continue}const o=r.t==="id"&&e.has(r.v)&&a?.v!=="."?qt(r.v):r.v,l=a&&(a.t!=="op"||r.t!=="op")&&!(r.v==="."||a.v==="."||r.v==="("||r.v===")"||r.v===","||r.v===";"||r.v==="["||r.v==="]")?" ":"";s+=l+o+(r.v===";"||r.v==="{"||r.v==="}"?`
`:""),a=r.v===";"||r.v==="{"||r.v==="}"?null:r}return s}const pe=7;function jt(t){const n=[],e=[];let s=pe*16;for(const[a,r]of Object.entries(t.uniforms||{})){if(r==="sampler2D"){e.push(a);continue}n.push({name:a,type:r,off:s}),s+=r==="mat3"?48:r==="mat4"?64:r==="mat2"?32:16}return{fields:n,textures:e,size:Math.max(s,16)}}const me=t=>t==="bool"?"u32":t.startsWith("bvec")?`vec${t[4]}u`:t==="mat2"?"mat2x2f":O(t);function Fe(t,n,e){const s=new Float32Array(e),a=new Int32Array(e),r=new Uint32Array(e);for(const o of jt(t).fields){const l=n[o.name],c=typeof l=="number"||typeof l=="boolean"?[Number(l)]:Array.isArray(l)||ArrayBuffer.isView(l)?Array.from(l):[],f=o.off/4,p=V(o.type);if(W(o.type)){const h=+o.type[3];for(let g=0;g<h;g++)for(let M=0;M<h;M++)s[f+g*4+M]=c[g*h+M]??0}else for(let h=0;h<D(o.type);h++){const g=c[h]??0;p==="f"?s[f+h]=g:p==="i"?a[f+h]=g|0:r[f+h]=p==="b"?g?1:0:g>>>0}}}const dt=(t,n)=>{for(;t;t=t.parent){const e=t.vars.get(n);if(e)return e}return null};function Ie(t,n,e){const s=jt(t),r={...Mt(t)},o=new Map,l={vars:new Map,parent:null};for(const[i,[x]]of Object.entries(bt))l.vars.set(i,x);l.vars.set("czm_frameNumber","float");const c=t.uniforms||{};for(const[i,x]of Object.entries(c))l.vars.set(i,x);let f="";const p=i=>`struct ${i} {
${r[i].map(([x,y])=>`	${x}: ${O(y)},`).join(`
`)}
};
`;f+=p("Attributes")+p("FeatureIds")+p("Metadata")+p("czm_modelVertexOutput")+p("VertexInput")+p("czm_modelMaterial")+p("FragmentInput"),f+=`struct CsU {
	J: mat3x3f,
	V: mat3x3f,
	misc: vec4f,
${s.fields.map(i=>`	@align(16) ${i.name}: ${me(i.type)},`).join(`
`)}${s.fields.length?"":"	_pad: vec4f,"}
};
`,f+=`@group(${n}) @binding(${e}) var<uniform> CU: CsU;
`,s.textures.forEach((i,x)=>{f+=`@group(${n}) @binding(${e+1+x*2}) var css_${i}: sampler;
@group(${n}) @binding(${e+2+x*2}) var cst_${i}: texture_2d<f32>;
`});for(const[i,[x,y]]of Object.entries(bt))f+=`const ${i}: ${O(x)} = ${y};
`;f+=`fn czm_srgbToLinear3(c: vec3f) -> vec3f { return pow(max(c, vec3f(0.0)), vec3f(2.2)); }
fn czm_srgbToLinear4(c: vec4f) -> vec4f { return vec4f(czm_srgbToLinear3(c.rgb), c.a); }
`,f+=`fn czm_linearToSrgb3(c: vec3f) -> vec3f { return pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.2)); }
fn czm_linearToSrgb4(c: vec4f) -> vec4f { return vec4f(czm_linearToSrgb3(c.rgb), c.a); }
`,f+=`fn czm_luminance(rgb: vec3f) -> f32 { return dot(rgb, vec3f(0.2125, 0.7154, 0.0721)); }
`,f+=`var<private> csFi: FragmentInput;
var<private> csM: czm_modelMaterial;
var<private> csVi: VertexInput;
var<private> csVo: czm_modelVertexOutput;
`,f+=`fn csAttrsOf(mc: vec3f, pw: vec3f, ec: vec3f, nw: vec3f, uv: vec2f, col: vec4f, fid: f32) -> Attributes {
	var a: Attributes;
	a.positionMC = mc; a.positionWC = vec3f(pw.x, pw.z, pw.y) * 6378137.0; a.positionEC = ec;
	let nm = transpose(CU.J) * nw; a.normalMC = select(vec3f(0.0, 0.0, 1.0), normalize(nm), dot(nm, nm) > 0.0);
	a.normalEC = normalize(CU.V * nw); a.texCoord_0 = uv; a.texCoord_1 = uv; a.color_0 = col; a.featureId_0 = fid;
	return a;
}
`;const h=Bt(t),g=e+1+s.textures.length*2;for(let i=0;i<h;i++)f+=`@group(${n}) @binding(${g+i*2}) var css_csmt_${i}: sampler;
@group(${n}) @binding(${g+1+i*2}) var cst_csmt_${i}: texture_2d<f32>;
`;f+=`fn csMetaOf(uvm: vec2f) -> Metadata {
	var m: Metadata;
${h?`	var px: vec4f;
`:""}${Object.entries(t.metadata||{}).map(([i,x])=>typeof x=="string"||!h?"":`	px = textureSampleLevel(cst_csmt_${x.tex}, css_csmt_${x.tex}, uvm, 0.0);
	m.${i} = ${Et(x,!0)};
`).join("")}	return m;
}
`;let M=!1,d=!1;const m=[Pt(t),t.vs,t.fs].filter(Boolean);let v=0;for(const i of m){const x=ie(i);for(const y of x)y.k==="fn"&&o.set(y.name,{ret:y.ret,params:y.params});for(const y of x){if(y.k==="pp")throw new Error(`csshader: preprocessor is not supported in WGSL: ${y.v}`);if(y.k==="struct"){r[y.name]=y.fields.map(I=>[I.name,I.type]),f+=p(y.name);continue}if(y.k==="gdecl"){for(const I of y.d.vars)l.vars.set(I.name,y.d.type),f+=y.d.isConst?`const ${I.name}: ${O(y.d.type)} = ${$(_(I.init,l,null).s,C(I.init,l),y.d.type)};
`:`var<private> ${I.name}: ${O(y.d.type)}${I.init?` = ${$(_(I.init,l,null).s,C(I.init,l),y.d.type)}`:""};
`;continue}const u=y.name==="fragmentMain",z=y.name==="vertexMain";u&&(d=!0),z&&(M=!0);const w={vars:new Map,parent:l},S=new Map,B=new Set;let H="";if(u||z){const[I,Q]=y.params;I&&(S.set(I.name,u?"csFi":"csVi"),w.vars.set(I.name,I.type)),Q&&(S.set(Q.name,u?"csM":"csVo"),w.vars.set(Q.name,Q.type))}else H=y.params.map(I=>(w.vars.set(I.name,I.type),I.q!=="in"?(B.add(I.name),`${I.name}: ptr<function, ${O(I.type)}>`):`${I.name}: ${O(I.type)}`)).join(", ");const E={ren:S,ptrs:B,depth:u||z?0:1,ret:y.ret};f+=`fn ${y.name}(${H})${y.ret==="void"?"":` -> ${O(y.ret)}`} {
${y.body.map(I=>R(I,w,E,"	")).join("")}}
`}}return{decl:f,hasVs:M,hasFs:d,textures:s.textures,layout:s};function $(i,x,y){return x===y||K(x)||!y||y==="void"?i:D(x)===D(y)&&V(x)!==V(y)&&D(y)>0?`${O(y)}(${i})`:i}function C(i,x){return _(i,x,null).t}function R(i,x,y,u){switch(i.k){case"empty":return"";case"block":{const z={vars:new Map,parent:x};return`${u}{
${i.body.map(w=>R(w,z,y,u+"	")).join("")}${u}}
`}case"decl":return i.vars.map(z=>{const w=z.init?_(z.init,x,y):null;x.vars.set(z.name,i.type);const S=i.isConst?"let":"var";if(i.isConst&&!w)throw new Error("csshader: const without initializer");return`${u}${S} ${z.name}: ${O(i.type)}${w?` = ${$(w.s,w.t,i.type)}`:""};
`}).join("");case"expr":return T(i.e,x,y,u);case"if":{const z=_(i.c,x,y);y.depth++;const w=k(i.t,x,y,u),S=i.f?i.f.k==="if"?` else ${R(i.f,x,y,u).trimStart()}`:` else ${k(i.f,x,y,u)}
`:`
`;return y.depth--,`${u}if (${z.s}) ${w}${S.endsWith(`
`)?S:S+`
`}`}case"for":{const z={vars:new Map,parent:x},w=i.init?R(i.init,z,y,"").trim().replace(/;$/,""):"",S=i.cond?_(i.cond,z,y).s:"",B=i.step?T(i.step,z,y,"").trim().replace(/;$/,""):"";y.depth++;const H=k(i.body,z,y,u);return y.depth--,`${u}for (${w}; ${S}; ${B}) ${H}
`}case"while":{const z=_(i.c,x,y);y.depth++;const w=k(i.body,x,y,u);return y.depth--,`${u}while (${z.s}) ${w}
`}case"ret":return i.e?`${u}return ${(z=>$(z.s,z.t,y.ret))(_(i.e,x,y))};
`:`${u}return;
`;case"break":return`${u}break;
`;case"cont":return`${u}continue;
`;case"discard":return`${u}discard;
`}}function k(i,x,y,u){const z={vars:new Map,parent:x};return`{
${(i.k==="block"?i.body:[i]).map(S=>R(S,z,y,u+"	")).join("")}${u}}`}function T(i,x,y,u){if(i.k==="asg"){if(i.l.k==="mem"&&zt.test(i.l.name)&&i.l.name.length>1){const S=_(i.l.o,x,y),B=_(i.r,x,y),H=`_sw${v++}`,E=i.l.name.split("").map(Z=>kt[Z]||Z),I=i.op==="="?B.s:`${_(i.l,x,y).s} ${i.op.slice(0,-1)} (${B.s})`,Q="xyzw";return`${u}let ${H} = ${I};
`+E.map((Z,F)=>`${u}${S.s}.${Z} = ${H}${ut(B.t)&&i.op==="="?"":"."+Q[F]};
`).join("")}const z=_(i.l,x,y),w=_(i.r,x,y);return`${u}${z.s} ${i.op} ${i.op==="="?$(w.s,w.t,z.t):w.s};
`}if((i.k==="post"||i.k==="un")&&(i.op==="++"||i.op==="--"))return`${u}${_(i.e,x,y).s}${i.op};
`;if(i.k==="call")return`${u}${_(i,x,y).s};
`;throw new Error("csshader: expression statement without effect")}function _(i,x,y){switch(i.k){case"num":{const u=i.v;return/^0[xX]/.test(u)?u.endsWith("u")||u.endsWith("U")?{s:u.replace(/U$/,"u"),t:"uint"}:{s:u,t:"aint"}:/[uU]$/.test(u)?{s:u.replace(/U$/,"u"),t:"uint"}:/[.eE]/.test(u)||/[fF]$/.test(u)?{s:u.replace(/[fF]$/,""),t:"afloat"}:{s:u,t:"aint"}}case"id":{const u=i.name;if(y?.ren.has(u))return{s:y.ren.get(u),t:dt(x,u)};const z=dt(x,u);if(!z)throw new Error(`csshader: unknown identifier '${u}'`);return y?.ptrs.has(u)&&x.vars.get(u)===void 0&&dt(x,u)?{s:`(*${u})`,t:z}:y?.ptrs.has(u)?{s:`(*${u})`,t:z}:u==="czm_frameNumber"?{s:"CU.misc.x",t:"float"}:Object.prototype.hasOwnProperty.call(c,u)&&!A(x,u)?c[u]==="sampler2D"?{s:u,t:"sampler2D"}:c[u]==="bool"?{s:`(CU.${u} != 0u)`,t:"bool"}:c[u].startsWith("bvec")?{s:`(CU.${u} != vec${c[u][4]}u(0u))`,t:c[u]}:{s:`CU.${u}`,t:c[u]}:{s:u,t:z}}case"mem":{const u=_(i.o,x,y);if(X(u.t)||ut(u.t)){if(!zt.test(i.name))throw new Error(`csshader: bad swizzle .${i.name}`);const w=i.name.split("").map(S=>kt[S]||S).join("");return{s:`${u.s}.${w}`,t:at(V(u.t),w.length)}}const z=r[u.t]?.find(([w])=>w===i.name);if(!z)throw new Error(`csshader: ${u.t} has no field '${i.name}'`);return{s:`${u.s}.${i.name}`,t:z[1]}}case"idx":{const u=_(i.o,x,y),z=_(i.i,x,y),w=W(u.t)?`vec${nt(u.t)[1]}`:X(u.t)?at(V(u.t),1):u.t;return{s:`${u.s}[${z.s}]`,t:w}}case"un":{const u=_(i.e,x,y);if(i.op==="++"||i.op==="--")throw new Error("csshader: ++/-- inside an expression");return{s:`(${i.op}${u.s})`,t:u.t}}case"post":throw new Error("csshader: ++/-- inside an expression");case"bin":{const u=_(i.a,x,y),z=_(i.b,x,y);if(i.op==="^^")return{s:`(${u.s} != ${z.s})`,t:"bool"};if(i.op==="=="||i.op==="!=")return X(u.t)||X(z.t)?{s:i.op==="=="?`all(${u.s} == ${z.s})`:`any(${u.s} != ${z.s})`,t:"bool"}:{s:`(${u.s} ${i.op} ${z.s})`,t:"bool"};if(["<",">","<=",">=","&&","||"].includes(i.op))return{s:`(${u.s} ${i.op} ${z.s})`,t:"bool"};let w;return i.op==="*"&&W(u.t)&&X(z.t)?w=`vec${nt(u.t)[1]}`:i.op==="*"&&X(u.t)&&W(z.t)?w=`vec${nt(z.t)[0]}`:W(u.t)?w=u.t:W(z.t)?w=z.t:D(u.t)>=D(z.t)?w=K(u.t)&&!K(z.t)?z.t:u.t:w=z.t,K(u.t)&&!K(z.t)&&D(z.t)>1&&(w=z.t),{s:`(${u.s} ${i.op} ${z.s})`,t:w}}case"tern":{const u=_(i.c,x,y),z=_(i.a,x,y),w=_(i.b,x,y),S=K(z.t)?w.t:z.t;return{s:`select(${$(w.s,w.t,S)}, ${$(z.s,z.t,S)}, ${u.s})`,t:S}}case"asg":throw new Error("csshader: assignment inside an expression");case"call":return b(i,x,y)}}function A(i,x){for(let y=i;y&&y!==l;y=y.parent)if(y.vars.has(x))return!0;return!1}function L(i,x){return D(x)>1&&ut(i.t)?`${O(at(V(x),D(x)))}(${i.s})`:i.s}function b(i,x,y){const u=i.fn;if(Dt.test(u)&&u!=="void"&&u!=="sampler2D"){const F=i.args.map(P=>_(P,x,y));if(W(u)){const[P,j]=nt(u);if(F.length===1&&ut(F[0].t)){const lt=F[0].s;return{s:`${O(u)}(${Array.from({length:P*j},(Wt,ft)=>ft%j===(ft/j|0)?lt:"0.0").join(", ")})`,t:u}}if(F.length===1&&W(F[0].t)){const[it,lt]=nt(F[0].t);if(it>=P&&lt>=j)return{s:`${O(u)}(${Array.from({length:P},(Wt,ft)=>`${F[0].s}[${ft}]${lt>j?"."+"xyzw".slice(0,j):""}`).join(", ")})`,t:u}}return{s:`${O(u)}(${F.map(it=>it.s).join(", ")})`,t:u}}const q=D(u),st=V(u);if(F.length===1&&D(F[0].t)>q){const P="xyzw".slice(0,q),j=`${F[0].s}.${P}`;return{s:V(F[0].t)===st?q===1?j:`${O(u)}(${j})`:`${O(u)}(${j})`,t:u}}const Y=F.map(P=>K(P.t)||V(P.t)===st?P.s:`${O(at(st,D(P.t)))}(${P.s})`);return{s:`${O(u)}(${Y.join(", ")})`,t:u}}if(r[u]&&!o.has(u)){const F=i.args.map(q=>_(q,x,y));return{s:`${u}(${F.map(q=>q.s).join(", ")})`,t:u}}const z=o.get(u);if(z){const F=i.args.map((q,st)=>{const Y=z.params[st];if(Y&&Y.q!=="in"){if(q.k!=="id")throw new Error(`csshader: out/inout argument must be a variable (${u})`);const j=_(q,x,y);if(j.s.startsWith("(*"))return j.s.slice(2,-1);if(!A(x,q.name))throw new Error(`csshader: out/inout argument must be a local variable (${u})`);return`&${j.s}`}const P=_(q,x,y);return Y?$(P.s,P.t,Y.type):P.s});return{s:`${u}(${F.join(", ")})`,t:z.ret}}const w=i.args.map(F=>_(F,x,y)),S=w.map(F=>F.s),B=w[0]?.t??"float",H=K(B)&&w[1]&&!K(w[1].t)?w[1].t:B,E=F=>({s:F,t:et(H)}),I=F=>({s:F,t:"float"}),Q=!y||y.depth>0,Z=F=>{const q=/^\w+$/.test(F)?F:null;if(!q||c[q]!=="sampler2D")throw new Error("csshader: texture() needs a sampler2D uniform");return q};switch(u){case"texture":case"texture2D":{const F=Z(w[0].s);return{s:Q?`textureSampleLevel(cst_${F}, css_${F}, ${S[1]}, 0.0)`:`textureSample(cst_${F}, css_${F}, ${S[1]})`,t:"vec4"}}case"textureLod":{const F=Z(w[0].s);return{s:`textureSampleLevel(cst_${F}, css_${F}, ${S[1]}, f32(${S[2]}))`,t:"vec4"}}case"texelFetch":return{s:`textureLoad(cst_${Z(w[0].s)}, ${S[1]}, ${S[2]})`,t:"vec4"};case"textureSize":return{s:`vec2i(textureDimensions(cst_${Z(w[0].s)}, ${S[1]}))`,t:"ivec2"};case"abs":case"sign":case"floor":case"ceil":case"fract":case"sin":case"cos":case"tan":case"asin":case"acos":case"exp":case"exp2":case"log":case"log2":case"sqrt":case"normalize":case"radians":case"degrees":case"trunc":case"sinh":case"cosh":case"tanh":case"transpose":return E(`${u}(${S[0]})`);case"round":case"roundEven":return E(`round(${S[0]})`);case"inversesqrt":return E(`inverseSqrt(${S[0]})`);case"dFdx":return E(`dpdx(${S[0]})`);case"dFdy":return E(`dpdy(${S[0]})`);case"fwidth":return E(`fwidth(${S[0]})`);case"atan":return w.length===2?E(`atan2(${S[0]}, ${S[1]})`):E(`atan(${S[0]})`);case"pow":return E(`pow(${S[0]}, ${L(w[1],H)})`);case"mod":return E(`(${S[0]} - ${S[1]} * floor(${S[0]} / ${S[1]}))`);case"min":case"max":return D(w[1].t)>D(w[0].t)?{s:`${u}(${L(w[0],w[1].t)}, ${S[1]})`,t:et(w[1].t)}:E(`${u}(${S[0]}, ${L(w[1],H)})`);case"clamp":return E(`clamp(${S[0]}, ${L(w[1],B)}, ${L(w[2],B)})`);case"mix":{if(V(w[2].t)==="b")return E(`select(${S[0]}, ${S[1]}, ${S[2]})`);const F=D(w[0].t)>=D(w[1].t)?K(w[0].t)?w[1].t:w[0].t:w[1].t;return{s:`mix(${L(w[0],F)}, ${L(w[1],F)}, ${S[2]})`,t:et(F)}}case"step":return{s:`step(${L(w[0],w[1].t)}, ${S[1]})`,t:et(w[1].t)};case"smoothstep":return{s:`smoothstep(${L(w[0],w[2].t)}, ${L(w[1],w[2].t)}, ${S[2]})`,t:et(w[2].t)};case"length":return I(`length(${S[0]})`);case"distance":return I(`distance(${S[0]}, ${S[1]})`);case"dot":return I(`dot(${S[0]}, ${S[1]})`);case"determinant":return I(`determinant(${S[0]})`);case"cross":return{s:`cross(${S[0]}, ${S[1]})`,t:"vec3"};case"reflect":return E(`reflect(${S[0]}, ${S[1]})`);case"refract":return E(`refract(${S[0]}, ${S[1]}, ${S[2]})`);case"faceforward":return E(`faceForward(${S[0]}, ${S[1]}, ${S[2]})`);case"lessThan":case"lessThanEqual":case"greaterThan":case"greaterThanEqual":case"equal":case"notEqual":{const F={lessThan:"<",lessThanEqual:"<=",greaterThan:">",greaterThanEqual:">=",equal:"==",notEqual:"!="}[u];return{s:`(${S[0]} ${F} ${S[1]})`,t:at("b",D(B))}}case"not":return{s:`(!${S[0]})`,t:B};case"any":case"all":return{s:`${u}(${S[0]})`,t:"bool"};case"czm_srgbToLinear":case"czm_linearToSrgb":return E(`${u}${D(B)}(${S[0]})`);case"czm_luminance":return I(`czm_luminance(${S[0]})`)}throw new Error(`csshader: unsupported function '${u}'`)}}function Be(t,n,e){const s=(h,g)=>h[0]*g[0]+h[1]*g[1]+h[2]*g[2],a=h=>{const g=Math.hypot(h[0],h[1],h[2])||1;return h.map(M=>M/g)},r=a([t[0],t[1],t[2]]),o=s(n,r),l=a([n[0]-r[0]*o,n[1]-r[1]*o,n[2]-r[2]*o]),c=s(e,r),f=s(e,l),p=a([e[0]-r[0]*c-l[0]*f,e[1]-r[1]*c-l[1]*f,e[2]-r[2]*c-l[2]*f]);return Float32Array.of(l[0],p[0],-r[0],l[1],p[1],-r[1],l[2],p[2],-r[2])}function Ee(t,n,e,s){if(!n)return;const a=typeof s=="number"||typeof s=="boolean"?[Number(s)]:Array.isArray(s)||ArrayBuffer.isView(s)?Array.from(s):[],r=D(e),o=V(e);if(W(e)){const c=+e[3],f=new Float32Array(c*c);for(let p=0;p<c*c;p++)f[p]=a[p]??0;(c===2?t.uniformMatrix2fv:c===3?t.uniformMatrix3fv:t.uniformMatrix4fv).call(t,n,!1,f);return}const l=Array.from({length:r},(c,f)=>a[f]??0);o==="f"?t[`uniform${r}fv`].call(t,n,Float32Array.from(l)):o==="u"?t[`uniform${r}uiv`].call(t,n,Uint32Array.from(l)):t[`uniform${r}iv`].call(t,n,Int32Array.from(l.map(c=>o==="b"?c?1:0:c|0)))}const mt=Math.PI/180;function De(t){const[n,e]=Xt(t),s=Math.cos(e);return[s*Math.cos(n),Math.sin(e),s*Math.sin(n)]}function Oe(t,n,e,s){const a=ct(),r=U(n[0],n[1]),o=J(r),l=G(t,o);if(l<Math.sin(2*mt))return null;const c=[-t[0],-t[1],-t[2]];let f=rt(c,[0,1,0]);Math.hypot(f[0],f[1],f[2])<1e-6&&(f=rt(c,[1,0,0])),f=J(f);const p=rt(f,c),h=e/a,g=2*h/s,M=Math.round(G(r,f)/g)*g,d=Math.round(G(r,p)/g)*g,m=Math.sqrt(Math.max(0,1-l*l)),v=h*Math.max(1,m/l)+5e3/a,$=G(r,c)-v,C=2*v;return{mvp:St(f,p,c,M,d,h,$,C),alt:Math.asin(l),texelM:g*a,zRangeM:C*a,eye:[r[0]+t[0],r[1]+t[1],r[2]+t[2]],r:f,u:p,f:c,cx:M,cy:d,R:h,z0:$,Z:C}}function St(t,n,e,s,a,r,o,l){const c=new Float64Array(16);return c[0]=t[0]/r,c[4]=t[1]/r,c[8]=t[2]/r,c[12]=-s/r,c[1]=n[0]/r,c[5]=n[1]/r,c[9]=n[2]/r,c[13]=-a/r,c[2]=e[0]/l,c[6]=e[1]/l,c[10]=e[2]/l,c[14]=-o/l,c[15]=1,c}const Lt=.8;function Pe(t,n,e,s,a=2){if(a<=0)return[];const r=ct(),o=[];for(const h of n){const g=G(h,t.r),M=G(h,t.u);Math.abs(g-t.cx)>t.R||Math.abs(M-t.cy)>t.R||o.push({d:Math.hypot(h[0]-e[0],h[1]-e[1],h[2]-e[2]),x:g,y:M})}if(o.length<4)return[];let l=1/0,c=0;for(const h of o)l=Math.min(l,h.d),c=Math.max(c,h.d);if(!(l>0)||c/l<1.6)return[];const f=[];let p=0;for(let h=1;h<=a;h++){const g=h/(a+1),M=Lt*l*Math.pow(c/l,g)+(1-Lt)*(l+(c-l)*g);let d=1/0,m=-1/0,v=1/0,$=-1/0,C=0;for(const L of o)L.d<=M&&(C++,d=Math.min(d,L.x),m=Math.max(m,L.x),v=Math.min(v,L.y),$=Math.max($,L.y));if(!C)continue;const R=Math.max(60,Math.max(m-d,$-v)*.5*1.15*r),k=Math.pow(2,Math.ceil(Math.log2(R)*4)/4)/r;if(k>=t.R*.7||k<p*1.5)continue;p=k;const T=2*k/s,_=Math.round((d+m)/2/T)*T,A=Math.round((v+$)/2/T)*T;f.push({mvp:St(t.r,t.u,t.f,_,A,k,t.z0,t.Z),alt:t.alt,texelM:T*r,zRangeM:t.zRangeM,eye:t.eye,r:t.r,u:t.u,f:t.f,cx:_,cy:A,R:k,z0:t.z0,Z:t.Z,s:t.R/k,ox:(t.cx-_)/k,oy:(t.cy-A)/k})}return f}function qe(t,n,e,s=Ut,a){if(!n.length)return null;const r=ct();let o=[0,0,0];for(const L of n)o[0]+=L[0],o[1]+=L[1],o[2]+=L[2];o=J(o);const l=a?J(a):o,c=G(t,l);if(c<Math.sin(.5*mt))return null;const f=[-t[0],-t[1],-t[2]];let p=rt(f,[0,1,0]);Math.hypot(p[0],p[1],p[2])<1e-6&&(p=rt(f,[1,0,0])),p=J(p);const h=rt(p,f);let g=1/0,M=-1/0,d=1/0,m=-1/0,v=1/0,$=-1/0;for(const L of n){const b=G(L,p),i=G(L,h),x=G(L,f);g=Math.min(g,b),M=Math.max(M,b),d=Math.min(d,i),m=Math.max(m,i),v=Math.min(v,x),$=Math.max($,x)}const C=Math.max(1e-9,Math.max(M-g,m-d)*.5*1.02+(M-g+m-d)/e),R=2*C/e,k=(g+M)/2,T=(d+m)/2,_=v-s/r/c-2/r,A=$-_+2/r;return{mvp:St(p,h,f,k,T,C,_,A),alt:Math.asin(Math.min(1,c)),texelM:R*r,zRangeM:A*r,eye:[o[0]+t[0],o[1]+t[1],o[2]+t[2]],r:p,u:h,f,cx:k,cy:T,R:C,z0:_,Z:A}}function je(t,n){if(n!=null&&Number.isFinite(n))return Math.max(0,Math.min(1,n));const e=t/mt,s=Math.max(0,Math.min(1,(e-5)/30));return .6-.2*s*s*(3-2*s)}function Ue(t,n,e,s,a){const r=156543.03392*Math.cos(n*mt)/Math.pow(2,t),o=.75*Math.hypot(e,s)/(a||1)*r;return Math.pow(2,Math.round(Math.log2(Math.max(120,Math.min(6e3,o)))*4)/4)}function Ve(t){const n=Math.min(1/Math.tan(t.alt),6);return(.1+t.texelM*n*1)/t.zRangeM}const Ut=700;function He(t,n,e=Ut){const[s,a,r,o]=n,l=(s+r)/2,c=(a+o)/2,f=t,p=1.02,h=ct();let g=!0,M=!0,d=!0,m=!0;for(const[v,$]of[[s,a],[r,a],[s,o],[r,o],[l,a],[l,o],[s,c],[r,c],[l,c]]){const C=U(v,$);for(const R of[0,e]){const k=1+R/h,T=C[0]*k,_=C[1]*k,A=C[2]*k,L=f[0]*T+f[4]*_+f[8]*A+f[12],b=f[1]*T+f[5]*_+f[9]*A+f[13];L>=-p&&(g=!1),L<=p&&(M=!1),b>=-p&&(d=!1),b<=p&&(m=!1)}}return!(g||M||d||m)}const vt=[1,6,36],de=9,yt=(t,n,e,s)=>{const a=e/4,r=Math.round(t/a)*a,o=Math.round(n/a)*a;return[r-e,Math.max(-90,o-s),r+e,Math.min(90,o+s)]};function Ge(t,n,e,s=0){const a=t.dpr||1;let r=t.zoom,o=t.center[0],l=t.center[1];const c=1+Math.max(0,t.groundAlt||0)/ct(),f=m=>{const v=U(m[0],m[1]);return c===1?v:[v[0]*c,v[1]*c,v[2]*c]};if((t.centerAlt||0)>0){const m=pt(t,n,e),v=N(m,n/2,e/2,c);if(v){const $=f(v);r-=Math.log2(Math.max(1,Math.hypot($[0]-m.eye[0],$[1]-m.eye[1],$[2]-m.eye[2])/m.camDist)),o=v[0],l=v[1]}else r-=Math.log2(Math.max(1,(Math.hypot(m.eye[0],m.eye[1],m.eye[2])-c)/m.camDist))}const p=Math.floor(r*4)/4,h=360*(n/a)/(256*Math.pow(2,p)),g=h*e/n,M=[];if((t.pitch||0)>.06){const m=pt(t,n,e),v=N(m,n/2,e/2,c),$=N(m,n/2,e*.9,c),C=N(m,n/2,e*.75,c);if(v&&$&&C){const R=T=>{const _=f(T);return Math.hypot(_[0]-m.eye[0],_[1]-m.eye[1],_[2]-m.eye[2])},k=Math.pow(2,Math.floor(Math.log2(Math.max(1,R(v)/R($)))*4)/4);k>=1.3&&(M.push(yt(C[0],C[1],h/k*1.1,g/k*1.1)),M.fg=!0)}}for(const m of vt)M.push(yt(o,l,h*m,g*m));const d=ve(t,n,e,o,l,s);if(d>0){const m=Math.min(vt[2]*36,Math.pow(2,Math.ceil(Math.log2(1.05*d/Math.min(h*Math.cos(l*Math.PI/180),g))*2)/2));if(m>vt[2]){const v=yt(o,l,h*m,g*m);M.length<4?M.push(v):(M[3]=v,M.wide=!0)}}return M}function ve(t,n,e,s,a,r=0){const o=pt(t,n,e),l=o.eye,c=Math.hypot(l[0],l[1],l[2]),f=U(s,a),p=M=>Math.acos(Math.max(-1,Math.min(1,(M[0]*f[0]+M[1]*f[1]+M[2]*f[2])/Math.hypot(M[0],M[1],M[2]))))*180/Math.PI;if(!(c>1))return c>0&&c<1?p(l)+de:0;let h=0,g=!1;for(const M of[0,n/2,n]){const d=N(o,M,0);d?h=Math.max(h,p(U(d[0],d[1]))):g=!0}return g&&(h=Math.max(h,p(l)+(Math.acos(1/c)+(r>0?Math.acos(1/(1+r/6378137)):0))*180/Math.PI)),h}const Ke=(t,n)=>t.map((e,s)=>s===0||t.fg&&s===1||t.wide&&s===3?n:n>>1),We=t=>t.map(n=>n.map(e=>e.toFixed(6)).join(",")).join("|"),ht=Math.PI/180,Rt=t=>Math.log(Math.tan(Math.PI/4+Math.max(-85.06,Math.min(85.06,t))*ht/2));function Ne(t){const{west:n,south:e,east:s,north:a}=t;if(![n,e,s,a].every(Number.isFinite)||s<=n||a<=e)return null;const r=Rt(a),o=Rt(e),l=(n+s)/2,c=Math.atan(Math.sinh((r+o)/2))/ht,f=U(l,c),p=1e-4,h=U(l+p,c),g=U(l-p,c),M=U(l,c+p),d=U(l,c-p),m=[0,1,2].map(L=>(h[L]-g[L])/(2*p)),v=[0,1,2].map(L=>(M[L]-d[L])/(2*p)),$=Nt(l,c),C=(L,b)=>[L[1]*b[2]-L[2]*b[1],L[2]*b[0]-L[0]*b[2],L[0]*b[1]-L[1]*b[0]],R=m[0]*(v[1]*$[2]-v[2]*$[1])-v[0]*(m[1]*$[2]-m[2]*$[1])+$[0]*(m[1]*v[2]-m[2]*v[1]);if(!Number.isFinite(R)||Math.abs(R)<1e-30)return null;const k=C(v,$).map(L=>L/R),T=C($,m).map(L=>L/R),_=1/(s-n),A=-ht/Math.cos(c*ht)/(r-o);return{U:k.map(L=>L*_),V:T.map(L=>L*A),C:f}}function Ze(t,n,e,s){if(!e){for(let l=0;l<12;l++)t[n+l]=0;return}const a=s[0]-e.C[0],r=s[1]-e.C[1],o=s[2]-e.C[2];t[n]=e.U[0],t[n+1]=e.U[1],t[n+2]=e.U[2],t[n+3]=e.U[0]*a+e.U[1]*r+e.U[2]*o+.5,t[n+4]=e.V[0],t[n+5]=e.V[1],t[n+6]=e.V[2],t[n+7]=e.V[0]*a+e.V[1]*r+e.V[2]*o+.5,t[n+8]=1,t[n+9]=0,t[n+10]=0,t[n+11]=0}const Vt=16,ye=9e3;function Qe(t,n=Vt,e=1){const s=t-1,a=Math.max(1,e|0),r=[],o=(p,h)=>Math.ceil((h-p)/a);let l=0;for(let p=0;p<n;p++)for(let h=0;h<n;h++){const g=Math.floor(h*s/n),M=Math.floor((h+1)*s/n),d=Math.floor(p*s/n),m=Math.floor((p+1)*s/n);l+=o(g,M)*o(d,m)*6}const c=new Uint32Array(l);let f=0;for(let p=0;p<n;p++)for(let h=0;h<n;h++){const g=Math.floor(h*s/n),M=Math.floor((h+1)*s/n),d=Math.floor(p*s/n),m=Math.floor((p+1)*s/n),v=f;for(let $=d;$<m;$+=a){const C=Math.min($+a,m);for(let R=g;R<M;R+=a){const k=Math.min(R+a,M),T=$*t+R,_=$*t+k,A=C*t+R,L=C*t+k;c[f++]=T,c[f++]=A,c[f++]=_,c[f++]=_,c[f++]=A,c[f++]=L}}r.push({first:v,count:f-v,u0:g/s,u1:M/s,v0:d/s,v1:m/s})}return{idx:c,chunks:r}}const ge=(t,n)=>t+360*Math.round((n-t)/360);function xe(t,n,e,s,a,r,o){const l=a.eye,c=(t+n)/2,f=(e+s)/2,p=Math.min(n,Math.max(t,ge(o[0],c))),h=Math.min(s,Math.max(e,o[1])),g=[[t,e],[n,e],[t,s],[n,s],[c,e],[c,s],[t,f],[n,f],[c,f],[p,h]],M=Math.hypot(n-t,s-e)*Math.PI/180,d=o[2]*M*M/2;let m=-1/0;for(const[_,A]of g){const L=U(_,A),b=L[0]*l[0]+L[1]*l[1]+L[2]*l[2]-1;b>m&&(m=b)}if(m<-.0015-d)return!1;let v=!0,$=!0,C=!0,R=!0,k=0,T=0;for(const[_,A]of g)for(const L of[1,r]){const b=Zt(a,_,A,L);if(T++,b[3]<=1e-9){k++;continue}const i=b[3]*1.02;b[0]>=-i&&(v=!1),b[0]<=i&&($=!1),b[1]>=-i&&(C=!1),b[1]<=i&&(R=!1)}return k===T?!1:k>0?!0:!(v||$||C||R)}function Xe(t,n,e,s,a=null){const r=n[0],o=n[1],l=n[2],c=n[3],f=e.eye,p=Math.hypot(f[0],f[1],f[2]),h=[Math.atan2(f[2],f[0])*180/Math.PI,Math.asin(Math.max(-1,Math.min(1,f[1]/p)))*180/Math.PI,p],g=1+ye*(s||0),M=[];let d=null,m=0;for(const v of t)xe(r+l*v.u0,r+l*v.u1,o+c*v.v0,o+c*v.v1,e,g,h)&&(m++,d&&d[0]+d[1]===v.first?d[1]+=v.count:M.push(d=[v.first,v.count]));return a&&(a.drawn=m,a.of=t.length),M}function Je(t,n,e,s,a=null){const r=n[0],o=n[1],l=n[2],c=n[3],f=e,p=1.05,h=[];let g=null,M=0;for(const d of t){const m=r+l*d.u0,v=r+l*d.u1,$=o+c*d.v0,C=o+c*d.v1,R=(m+v)/2,k=($+C)/2;let T=!0,_=!0,A=!0,L=!0;for(const[b,i]of[[m,$],[v,$],[m,C],[v,C],[R,$],[R,C],[m,k],[v,k],[R,k]]){const x=U(b,i);for(const y of[1,s]){const u=x[0]*y,z=x[1]*y,w=x[2]*y,S=f[0]*u+f[4]*z+f[8]*w+f[12],B=f[1]*u+f[5]*z+f[9]*w+f[13];S>=-p&&(T=!1),S<=p&&(_=!1),B>=-p&&(A=!1),B<=p&&(L=!1)}}T||_||A||L||(M++,g&&g[0]+g[1]===d.first?g[1]+=d.count:h.push(g=[d.first,d.count]))}return a&&(a.drawn=M,a.of=t.length),h}function Ye(t,n=Vt){const e=t-1,s=new Float32Array(t*t*2),a=new Uint32Array(e*e*6),r=[];let o=0,l=0,c=0,f=!1;return{step:h=>{if(f)return!1;const g=performance.now();for(;o<t;){for(let M=0;M<t;M++){const d=(o*t+M)*2;s[d]=M/e,s[d+1]=o/e}if(o++,(o&15)===0&&performance.now()-g>h)return!0}for(;l<n*n;){const M=l%n,d=(l-M)/n,m=Math.floor(M*e/n),v=Math.floor((M+1)*e/n),$=Math.floor(d*e/n),C=Math.floor((d+1)*e/n),R=c;for(let k=$;k<C;k++)for(let T=m;T<v;T++){const _=k*t+T,A=_+1,L=_+t,b=L+1;a[c++]=_,a[c++]=L,a[c++]=A,a[c++]=A,a[c++]=L,a[c++]=b}if(r.push({first:R,count:c-R,u0:m/e,u1:v/e,v0:$/e,v1:C/e}),l++,l<n*n&&performance.now()-g>h)return!0}return f=!0,!1},result:()=>{if(!f)throw new Error("terrainMeshSliced: not done");return{uv:s,idx:a,chunks:r}}}}function tn(t){const n=new Float32Array(t*t*2);for(let e=0;e<t;e++)for(let s=0;s<t;s++){const a=(e*t+s)*2;n[a]=s/(t-1),n[a+1]=e/(t-1)}return n}const en=28;function nn(t,n,e,s,a,r){const o=e.tile||e.atlas,l=o.width,c=o.height;if(!(l>=2&&c>=2))return!1;if(t.fill(0),e.mode==="down")t[20]=r,t[21]=l,t[22]=2*r,t[23]=1,t[24]=r,t[25]=c,t[26]=2*r,t[27]=1,t[16]=e.edge??2;else if(e.mode==="crop"){const f=o.range,p=e.lng0-o.lng,h=e.lat0-o.lat,g=e.span,M=[f,p,h,g,r].every(Number.isInteger)&&p>=0&&h>=0&&f>0&&g>0,d=p*2*r*l+r*f,m=h*2*r*c+r*f,v=g*l,$=g*c,C=2*r*f;M&&d+v*(2*r-1)<4294967296&&m+$*(2*r-1)<4294967296&&C<4294967296?(t[3]=2,t[20]=d,t[21]=v,t[22]=C,t[23]=1,t[24]=m,t[25]=$,t[26]=C,t[27]=1):(t[3]=3,n[4]=p/f*l-.5,n[5]=g/r/f*l,n[6]=h/f*c-.5,n[7]=g/r/f*c,n[8]=-1e30,n[9]=1e30,n[10]=-1e30,n[11]=1e30)}else if(e.mode==="world"){const f=l>>2;if(f%r)return!1;t[3]=1,t[15]=f/r,t[16]=l,t[17]=(1-e.cy)*f,t[18]=e.cx*f}else return!1;return t[0]=l,t[1]=c,t[12]=s*r,t[13]=a*r,t[14]=r,e.mode!=="world"&&e.sea&&(t[19]=1),!0}const rn=(t,n)=>t.mode==="down"?Jt(t.tile,n,t.edge??2,!!t.sea):t.mode==="crop"?Yt(t.tile,t.lng0,t.lat0,t.span,n,!!t.sea):te(t.atlas,t.cx,t.cy,n);function on(t,n){if(!t)return null;const e=!(n&3),{P:s,iv:a}=ee(t,e),r=new Float32Array(8);return r.set(a.length?a.slice(0,8):[-2*s,-2*s]),{P:s,n:Math.max(1,Math.min(4,a.length>>1)),round:e?1:0,iv:r}}function sn(t,n){const e=t,s=a=>{for(const r of e)if(a>=r[0]&&a<=r[1])return r[2];return 1/0};return!n||!e.length?{host:null,anchors:[],anchorOf:s}:{host:n,anchors:[...new Set(e.map(a=>a[2]))].sort((a,r)=>a-r),anchorOf:s}}function an(t){return!!t&&!Array.isArray(t)&&!ArrayBuffer.isView(t)?{color:t.color||[0,0,0,.15],mask:!!t.mask}:{color:t||[.95,.55,.15,.6],mask:!1}}function cn(t,n,e){const s=Math.hypot(n[0],n[1],n[2])||1,a=Math.min(1,1/s),r=Math.sqrt(Math.max(0,1-a*a)),o=n[0]/s,l=n[1]/s,c=n[2]/s;let f=-1,p=0;for(const h of t){const g=h.C[0]*o+h.C[1]*l+h.C[2]*c>h.cosR*a-h.sinR*r;if(g&&f>=0&&h.start===f+p){p+=h.count;continue}p&&e(f,p),f=g?h.start:-1,p=g?h.count:0}p&&e(f,p)}function ln(t,n,e,s,a,r){const o=U(r[0],r[1]),l=Math.cos(r[1]*Math.PI/180),c=Math.min(1.2,Math.hypot(a[2]*l,a[3])*Math.PI/180),f=J(o),p=r[0]*Math.PI/180,h=[-Math.sin(p),0,Math.cos(p)];e.forEach(([g,M,d,m],v)=>{const $=[g,M,d],C=g*o[0]+M*o[1]+d*o[2]-m,R=[o[0]-C*g,o[1]-C*M,o[2]-C*d],k=Math.abs(g*f[0]+M*f[1]+d*f[2])>.9?h:f,T=J([$[1]*k[2]-$[2]*k[1],$[2]*k[0]-$[0]*k[2],$[0]*k[1]-$[1]*k[0]]),_=[$[1]*T[2]-$[2]*T[1],$[2]*T[0]-$[0]*T[2],$[0]*T[1]-$[1]*T[0]],A=n+v*12;t[A]=R[0]-s[0],t[A+1]=R[1]-s[1],t[A+2]=R[2]-s[2],t[A+4]=T[0]*c,t[A+5]=T[1]*c,t[A+6]=T[2]*c,t[A+8]=_[0]*c,t[A+9]=_[1]*c,t[A+10]=_[2]*c})}const fn=(t,n)=>t?t.groundBlend<=0?1e6:.5/t.groundBlend:n?1e6:1;function un(t,n,e,s){let a=t;return!a||s>=1e6||e>n*2||e*2<n?a=e:a+=(e-a)*.18,Math.abs(e-a)<e*.002&&(a=e),a}const hn=(t,n)=>t*2.5*n,pn=(t,n)=>t*14*n,mn=(t,n,e)=>Math.max(t*1.2,.008*n)*e,dn=(t,n,e)=>Math.max(t*5,.026*n)*e,vn=t=>Math.max(0,Math.min(1,((t||0)-.35)/.45));function yn(t){const n=Math.max(0,Math.min(1,((t||0)-.06)/.14));return n*n*(3-2*n)}const gn=(t,n)=>n?Math.max(0,Math.min(1,((t||0)-13.5)/.5)):0,xn=(t,n)=>Math.max(0,Math.min(1,(n-t)/.8)),bn=(t,n)=>Math.max(0,Math.min(1,(t-1.7)/.5))*Math.max(0,Math.min(1,(n-t)/.5))*.5,Mn=t=>t<5?Math.min(1,(5-t)/.5):0;function $n(t){const n=t-1;return(.4+.3*(1+(n>0?n+.25*Math.log(1+Math.exp(-n/.25)):.25*Math.log(1+Math.exp(n/.25)))))/1.6}function wn(t){const n=Math.sqrt(Math.max((1+t)*(1+t)-1,1e-12));return 2/Math.log2(n*1.15+t+1)}const Sn=t=>156543.03392*.819/Math.pow(2,t||0),Tt=8;function _n(t=512){const n=t*Tt;let e=new Float32Array(0),s=0,a=1/0,r=-1;const o=[];let l=new Map,c=new Map;const f=new Map,p=new Map,h=[];function g(M){const[d,m,v,$,C,R]=M,k=d*Tt,T=c.get(m),_=T&&h[d]!==void 0?f.get(T.sl)?.get(h[d]):void 0,A=l.get(m),L=A&&_t(A,v)?A:_&&_t(T.L,v)?T.L:null;L?(re(L,v,$,e,k,_),L.w!=null?e[k+4]=oe(L,v,$,_):R!==void 0&&(e[k+4]=R)):(e[k]=(C&255)/255,e[k+1]=(C>>>8&255)/255,e[k+2]=(C>>>16&255)/255,e[k+3]=(C>>>24)/255,R!==void 0&&(e[k+4]=R)),d<a&&(a=d),d>r&&(r=d)}return{get data(){return e},get n(){return s},rows(M){for(const d of M){const m=d[0],v=(m/t|0)+1;if(v*n>e.length){const T=new Float32Array(Math.max(v,e.length/n*2)*n);T.set(e),e=T}o[m]=d,m>=s&&(s=m+1);const $=h[m],C=d[2].indexOf(ne),R=C<0?null:d[3][C],k=R==null?void 0:String(R);if($!==void 0&&p.get($)?.delete(m),h[m]=k,k!==void 0){let T=p.get(k);T||p.set(k,T=new Set),T.add(m)}g(d)}},setOver(M){const d=l;l=new Map(M??[]);for(let m=0;m<s;m++){const v=o[m];v&&(d.has(v[1])||l.has(v[1]))&&g(v)}},setFsLayers(M){const d=c;c=new Map((M??[]).map(([m,v,$])=>[m,{sl:v,L:$}]));for(let m=0;m<s;m++){const v=o[m];v&&h[m]!==void 0&&(d.has(v[1])||c.has(v[1]))&&g(v)}},setFs(M){const d=new Set;for(const[m,v,$]of M){if(v==null){for(const R of m==null?[...f.keys()]:[m]){const k=f.get(R);if(k){for(const T of k.keys())for(const _ of p.get(T)??[])d.add(_);f.delete(R)}}continue}let C=f.get(m);C||f.set(m,C=new Map),$&&Object.keys($).length?C.set(v,$):C.delete(v);for(const R of p.get(v)??[])d.add(R)}for(const m of d){const v=o[m];v&&c.has(v[1])&&g(v)}},takeDirty(){if(r<0)return null;const M=[a,r];return a=1/0,r=-1,M}}}const At={sea:[.757,.847,.891],lowHumid:[.582,.716,.531],lowArid:[.839,.796,.639],midHumid:[.752,.79,.578],midArid:[.855,.788,.612],ramp1:[.871,.831,.659],ramp2:[.788,.718,.635],peak:[.925,.925,.937],snow:[.945,.953,.962],belowSea:[.84,.92,.82],grat:[1,1,1,1]};function Cn(t){const n={};for(const e in At)n[e]=t&&t[e]||At[e];return n}const be=["lowHumid","lowArid","midHumid","midArid","ramp1","ramp2","peak","snow"];function zn(t,n,e){const s=Math.max(0,Math.min(1,n??1));if(s>=1||!e)return t;const a={...t};for(const r of be)a[r]=[0,1,2].map(o=>e[o]+(t[r][o]-e[o])*s);return a}const Ft=(t,n)=>/\.cube(\?|#|$)/i.test(t)||/^\s*(TITLE|LUT_3D_SIZE|DOMAIN_MIN)/m.test(n||"");function It(t){let n=0,e=[0,0,0],s=[1,1,1];const a=[];for(const o of t.split(/\r?\n/)){const l=o.trim();if(!l||l[0]==="#"||/^TITLE/i.test(l))continue;if(/^LUT_1D_SIZE/i.test(l))throw new Error("lut: 1D .cube is not supported");if(/^LUT_3D_SIZE/i.test(l)){n=+l.split(/\s+/)[1];continue}if(/^DOMAIN_MIN/i.test(l)){e=l.split(/\s+/).slice(1,4).map(Number);continue}if(/^DOMAIN_MAX/i.test(l)){s=l.split(/\s+/).slice(1,4).map(Number);continue}const c=l.split(/\s+/).map(Number);c.length>=3&&c.every(Number.isFinite)&&a.push(c)}if(!(n>=2)||a.length<n*n*n)throw new Error(`lut: bad .cube (size ${n}, rows ${a.length})`);const r=new Uint8Array(n*n*n*4);for(let o=0;o<n;o++)for(let l=0;l<n;l++)for(let c=0;c<n;c++){const f=a[c+l*n+o*n*n],p=(l*n*n+o*n+c)*4;for(let h=0;h<3;h++){const g=s[h]-e[h]||1;r[p+h]=Math.max(0,Math.min(255,Math.round((f[h]-e[h])/g*255)))}r[p+3]=255}return{size:n,data:r}}function Me(t,n){const e=t.width,s=t.height,a=e===s*s?s:n&&e===n*n&&s===n?n:0;if(!a)throw new Error(`lut: image must be size²×size (got ${e}×${s})`);const r=new OffscreenCanvas(e,s),o=r.getContext("2d",{willReadFrequently:!0});o.drawImage(t,0,0);const l=o.getImageData(0,0,e,s);return{size:a,data:new Uint8Array(l.data.buffer,l.data.byteOffset,l.data.byteLength)}}async function kn(t,n=32){const e=await fetch(t);if(!e.ok)throw new Error(`lut: ${e.status} ${t}`);const s=e.headers.get("content-type")||"";if(Ft(t,"")||/^text\//.test(s)&&!/image/.test(s)){const o=await e.text();if(Ft(t,o))return It(o);throw new Error("lut: text that is not a .cube")}const a=await e.blob();if(/^text\//.test(a.type))return It(await a.text());const r=await createImageBitmap(a,{premultiplyAlpha:"none",colorSpaceConversion:"none"});try{return Me(r,n)}finally{r.close()}}function Ln(t,n){const e=Math.hypot(t[0],t[1],t[2]),s=e-1;if(!(n>0)||!(Math.abs(s)<.01))return[t[0],t[1],t[2]];const a=(e-n*s)/e;return[t[0]*a,t[1]*a,t[2]*a]}const Ht=new Float32Array(256*4);Ht.set([1,.42,.208,1]);Ht.set([0,.706,.847,1],4);const Rn=new Float32Array(256*2),Tn=new Float32Array([0,0,0,0]),An=new Float32Array([0,0,0,.4]),Fn=32,In=["gintData","arcTex","metaTex","metaTexB","ptTex","ptMetaTex","pivotTex","pivotW","compTex","compW","totalEdges","totalPoints","polyEdges","totalEdgesB","polyEdgesB","fillOff","lowFill","tiersDone","lodTiers","metaChunks","span","spanB","subB","polyEdgeByFid","polyBboxByFid","outlineZoom","minZoom","maxZoom","fidStyleTex","fidStyleW","_fidStyleH","fidStyleCount","_fidStyleData"],Bn=()=>({gintData:null,arcTex:null,metaTex:null,metaTexB:null,ptTex:null,ptMetaTex:null,pivotTex:null,pivotW:0,compTex:null,compW:0,totalEdges:0,totalPoints:0,polyEdges:0,totalEdgesB:0,polyEdgesB:0,fillOff:!1,lowFill:!1,tiersDone:!1,lodTiers:[],metaChunks:null,span:[-1,-1],spanB:[-1,-1],subB:null,polyEdgeByFid:null,polyBboxByFid:null,outlineZoom:null,minZoom:null,maxZoom:null,fidStyleTex:null,fidStyleW:0,_fidStyleH:0,fidStyleCount:0,_fidStyleData:null}),Gt=1e7;function gt(t){return Math.round((t+180)*Gt)>>>0}function xt(t){return Math.round((t+90)*Gt)>>>0}function En(t,n){const e=n.cam.zoom,s=Math.max(t.minZoom??0,n.minZoom??0),a=Math.min(t.maxZoom??22,n.maxZoom??22);return e>=s&&e<=a}function Dn(t,n){const e=pt(n.cam,t.width,t.height);t.cam=e;const s=(n.cam.center[0]%360+540)%360-180,a=[Math.round((s+180)*1e7)/1e7-180,Math.round((n.cam.center[1]+90)*1e7)/1e7-90],r=U(a[0],a[1]),o=Qt(e.mvp,[r[0],r[1],r[2],1]),l=G(r,e.eye)-1,c={mvp:e.mvp instanceof Float32Array?e.mvp:Float32Array.from(e.mvp),eye:e.eye,origin:a,clipT:o,originZr:l,originPt:r,zoom:n.cam.zoom,lineWidth:(n.lineWidth??1)*t.dpr,fillColor:n.fillColor,styleTable:n.styleTable,dashTable:n.dashTable,maskColor:n.maskColor,hiliteColor:n.hiliteColor,hiliteWidth:n.hiliteWidth!=null?n.hiliteWidth*t.dpr:0,ptRadius:(n.ptRadius??1.5)*t.dpr,outlineZoom:n.outlineZoom,moveBudget:n.moveBudget,_forceLow:n._forceLow};{const d=N(e,t.width*.5,t.height*.5),m=N(e,t.width*.5+1,t.height*.5),v=N(e,t.width*.5,t.height*.5+1);let $=Math.max(0,Math.min(63,Math.round(63-3*n.cam.zoom)));if(d&&m&&v){const C=Math.cos(d[1]*Math.PI/180),R=(m[0]-d[0])*C,k=m[1]-d[1],T=(v[0]-d[0])*C,_=v[1]-d[1],A=Math.abs(R*_-k*T);A>0&&($=Math.max(0,Math.min(63,Math.floor(1.5*Math.log2(A)+61.524)-0)));const b=R*_-T*k;if(Math.abs(b)>0){const i=(u,z)=>{const w=u*2/t.width,S=-z*2/t.height,B=Math.hypot(w,S);return B>0?[w/B,S/B]:null},x=i(_/b,-k/b),y=i(-T/b,R/b);x&&y&&(c.farAxes=[x[0],x[1],y[0],y[1]],c.farScale=[C,1])}}c.lodRank=$}let f=4294967295,p=4294967295,h=0,g=0,M=0;for(const[d,m]of[[0,0],[t.width,0],[0,t.height],[t.width,t.height],[t.width*.5,0],[t.width*.5,t.height],[0,t.height*.5],[t.width,t.height*.5]]){const v=N(e,d,m);if(!v||!Number.isFinite(v[0])||!Number.isFinite(v[1]))continue;M++;const $=gt(v[0]),C=xt(v[1]);$<f&&(f=$),$>h&&(h=$),C<p&&(p=C),C>g&&(g=C)}if(M===8&&f<=h)t.lastViewBbox=[f,p,h,g];else{const d=e.eye,m=Math.hypot(d[0],d[1],d[2]),v=Math.acos(Math.min(1,1/m))*180/Math.PI+.5,$=Math.asin(d[1]/m)*180/Math.PI,C=Math.atan2(d[2],d[0])*180/Math.PI,R=v/Math.max(Math.cos(Math.min(85,Math.abs($)+v)*Math.PI/180),.001);t.lastViewBbox=v<45&&Math.abs($)+v<85&&C-R>-180&&C+R<180?[gt(C-R),xt($-v),gt(C+R),xt($+v)]:null}{let d=0,m=0,v=!0;for(const[$,C]of[[0,t.height],[t.width*.5,t.height],[t.width,t.height]]){const R=N(e,$,C);if(!R||!Number.isFinite(R[0])||!Number.isFinite(R[1])){v=!1;break}const k=((R[0]-a[0])%360+540)%360-180;Math.abs(k)>d&&(d=Math.abs(k)),Math.abs(R[1]-a[1])>m&&(m=Math.abs(R[1]-a[1]))}c.near=v?[d*2,m*2]:[0,0]}return c}const $t=128,Kt=15e5;function On(t,n,e=!1){const s=new Int32Array(tt).fill(1),a={N:s,skipE7:0,total:0};if(!t||t.noSub||!(t.elevScale>0)||!t.hasElev||!(t.meshG>1)||!t.meshQ)return a;const r=t.subMove??1;if(e&&r<0)return a;const o=e&&t.subBudgetMove>0?t.subBudgetMove:t.subBudget>0?t.subBudget:Kt,l=Math.min(t.meshQ[2],t.meshQ[3])/(t.meshG-1);if(!(l>0))return a;const c=new Float64Array(tt);for(let h=0;h<tt;h++){const g=Ct*Math.pow(2,h+1)*1e-7/l;let M=1;if(g>1)for(M=2;M<g&&M<$t;)M<<=1;e&&(M>>=r),s[h]=Math.max(M,1);for(const d of n?.[h]??[])c[h]+=d[1]}const f=()=>{let h=0;for(let g=0;g<tt;g++)s[g]>1&&(h+=c[g]*s[g]);return h};let p=f();for(;p>o;){let h=!1;for(let g=0;g<tt;g++)s[g]>1&&(s[g]>>=1,h=!0);if(!h)break;p=f()}a.total=p;for(let h=0;h<tt;h++)if(s[h]>1){a.skipE7=Ct*Math.pow(2,h);break}return a}function Pn(t,n){const e=n.length,s=new Array(e).fill(1);if(!t||t.noSub||!(t.elevScale>0)||!t.hasElev||!(t.meshG>1)||!t.meshQ)return s;const a=t.meshQ[2]/(t.meshG-1),r=t.meshQ[3]/(t.meshG-1);if(!(a>0)||!(r>0))return s;let o=0;for(let l=0;l<e;l++){const c=n[l],f=c[2]??-1,p=c[3]??-1;let h=$t;if(f>=0&&p>=0){const g=Math.max(f*1e-7/a,p*1e-7/r);for(h=1;h<g&&h<$t;)h<<=1}s[l]=h,o+=c[1]*h}for(;o>Kt;){let l=!1;o=0;for(let c=0;c<e;c++)s[c]>1&&(s[c]>>=1,l=!0),o+=n[c][1]*s[c];if(!l)break}return s}export{Tn as $,on as A,zn as B,Le as C,hn as D,pn as E,an as F,_n as G,mn as H,Qe as I,tn as J,Ye as K,Oe as L,Ue as M,De as N,Pe as O,je as P,Ve as Q,en as R,cn as S,nn as T,rn as U,He as V,Ut as W,$n as X,Xe as Y,ln as Z,Ht as _,Te as a,Rn as a0,On as a1,Pn as a2,An as a3,Fn as a4,Bn as a5,En as a6,Dn as a7,In as a8,Re as a9,Ie as aa,qe as ab,pe as ac,Fe as ad,Tt as ae,Je as af,ye as ag,wn as b,Ae as c,un as d,ke as e,Ln as f,yn as g,ze as h,gn as i,dn as j,bn as k,kn as l,Sn as m,Be as n,Ee as o,vn as p,Ze as q,Cn as r,Ne as s,fn as t,Ge as u,We as v,Mn as w,Ke as x,xn as y,sn as z};
