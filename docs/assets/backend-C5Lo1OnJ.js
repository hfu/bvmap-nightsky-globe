import{s as Kg,a as Qg,b as Zg,u as Jg,p as ev,w as Tu,v as bd,x as tv,f as Zc,q as rv,e as nv,c as ma,m as iv,l as lv,y as _u,d as ov,n as sv,z as Sn,A as wt,o as av,k as cv,j as zu,C as xa,B as Cu,D as fv,i as ba,h as ya,E as uv,F as dv,G as pv,H as gv,I as vv}from"./renderworker-D_COh6DJ.js";import{l as ir,h as Zo,w as yd,i as hd,t as so,A as Oa,q as Qo,a as mv,v as xv,B as ha,x as Eu,y as bv,z as yv,o as wd,u as df}from"./rangecache-flag-DUqD5ZxK.js";import{a9 as Pf,aa as hv,f as wv,l as Pv,d as Sv,e as Bv,p as Fv,g as Gv,b as Tv,j as _v,i as zv,N as Mu,D as fl,H as ul,E as wa,k as Cv,h as Ev,y as Uu,w as Mv,X as Uv,m as Rv,q as Av,n as Lv,s as Ov,ab as Ru,t as Dv,u as kv,v as Iv,x as Nv,B as Vv,r as Wv,z as qv,S as Au,ac as Hv,ad as Xv,G as $v,A as Lu,F as Yv,W as Jc,ae as jv,L as Kv,M as Qv,T as Zv,U as Jv,I as ef,J as Ou,K as e1,af as Du,ag as ku,V as t1,Q as Iu,O as r1,P as n1,Y as i1,Z as l1,a6 as Nu,a7 as Vu,a5 as jo,a8 as Wu,a3 as qu,a1 as o1,a2 as s1,_ as Hu,a0 as a1,$ as c1,a4 as f1}from"./drawdata-DLNGIHNY.js";import{e as u1}from"./paintzoom-Dv7-Ly9z.js";import{b as d1,s as Pa}from"./scene-DPUy_syw.js";import{c as p1,f as g1,e as v1,l as m1,F as x1,d as b1,i as Xu,g as y1,b as h1,v as w1,h as P1,s as S1,S as B1,a as F1,t as G1}from"./bake-BKDmfqS9.js";import{f as T1}from"./identify-6uy89DSH.js";const Sf=`
struct SphereHit { A: vec3f, d: vec3f, t: f32, aa: f32, bb: f32, cc: f32, disc: f32 };
fn sphereRay(ndc: vec2f, rF: vec4f, rX: vec4f, rY: vec4f, eyeC: vec4f) -> SphereHit {
	let d = rF.xyz + ndc.x * rX.xyz + ndc.y * rY.xyz;
	let A = eyeC.xyz; let cc = eyeC.w;
	let aa = dot(d, d); let bb = 2.0 * dot(A, d);
	let disc = bb * bb - 4.0 * aa * cc;
	var t = -1.0;
	if (disc >= 0.0 && !(bb >= 0.0 && cc >= 0.0)) { let q = -bb + sqrt(disc); if (q > 0.0) { t = 2.0 * cc / q; } }   // 外から上向き＝交点なし（c≈0 で q が丸めの ±ulp＝空が地面に化けた・2026-10-28）
	return SphereHit(A, d, t, aa, bb, cc, disc);
}
// 交点の原点相対 δ（＝EO＋t·d・f32 で mm 級）から経緯度の差（deg・測地）を桁落ちなしで：O＝原点（β単位球）・rhoO＝cos β0・beta0（rad）・ell＝楕円体ゲート。
// δlon＝atan2(δz·Ox−δx·Oz, ρO²+δx·Ox+δz·Oz)（atan の差の恒等式＝O² の項は代数的に消える）。
// δβ＝atan2(δy·ρO−dρ·Oy, ρP·ρO+Py·Oy)・dρ＝ρP−ρO＝s/(ρP+ρO)・s＝2(Ox·δx+Oz·δz)+δx²+δz²（ρ の差も桁落ちなし）。測地の補正は差（sin の差）で
fn deltaLL(dl: vec3f, O: vec3f, rhoO: f32, beta0: f32, ell: f32) -> vec2f {
	let dlon = atan2(dl.z * O.x - dl.x * O.z, rhoO * rhoO + dl.x * O.x + dl.z * O.z);
	let s = 2.0 * (O.x * dl.x + O.z * dl.z) + dl.x * dl.x + dl.z * dl.z;
	let rhoP = sqrt(max(rhoO * rhoO + s, 0.0));
	let drho = s / max(rhoP + rhoO, 1e-12);
	let dbeta = atan2(dl.y * rhoO - drho * O.y, rhoP * rhoO + (O.y + dl.y) * O.y);
	let b1 = beta0 + dbeta;
	let corr = ell * (0.0016792203863837047 * (sin(2.0 * b1) - sin(2.0 * beta0)) + 0.0000014098905530233192 * (sin(4.0 * b1) - sin(4.0 * beta0)));
	return vec2f(dlon, dbeta + corr) * 57.29577951308232;
}
`,Pd=(s,p,_)=>`
fn ${s}(h: f32, gEN: vec2f, dh: f32, gm: vec4f, gmC: vec4f, gmP: vec4f) -> vec4f {
	let k = gm.x;
	var m = vec4f(0.0);
	if (k < 3.5) {
		var v = clamp((h - gm.y) * gm.z, 0.0, 1.0);
		if (k > 1.5 && k < 2.5) { v = acos(inverseSqrt(1.0 + dot(gEN, gEN))) / 1.5707963267948966; }
		else if (k > 2.5) { v = fract(atan2(-gEN.y, -gEN.x) / 6.283185307179586 + 1.0); }
		m = textureSampleLevel(${p}, ${_}, vec2f(v, 0.5), 0.0);
	}
	if (gmC.a > 0.0 && (h - floor(h / gmP.x) * gmP.x) < dh * gmP.y) { m = gmC; }   // 等高線（Cesium の ElevationContour）＝標高の画素差 × 太さ の帯
	if (gm.w > 0.5 && h <= 0.0) { m.a = 0.0; }   // 陸だけ（WaterMask の逆）＝標高 0 以下（海面）は塗らない
	m.a *= gmP.z;
	return m;
}`,Sd=`
// 窓 uv → テクスチャ uv（v 反転）。分割（Cesium の ImageryLayer.splitDirection・p.y ≥ 0）は窓が左右の半分に焼いてある＝画面の x（fx）で半分を選ぶ（gl/glsl.ts gndUV と同式）
fn gndUV0(uv: vec2f, fx: f32, sp: f32) -> vec2f {
	var t = vec2f(clamp(uv.x, 0.0, 1.0), 1.0 - clamp(uv.y, 0.0, 1.0));
	if (sp >= 0.0) { t.x = clamp(t.x * 0.5, 0.002, 0.498) + select(0.0, 0.5, fx >= sp); }
	return t;
}
`,rn=`
struct Frame {
	mvp: mat4x4f,
	rayF: vec4f,       // 全画面レイキャスト（#65・旧 invMvp の枠）：視線の基底（CPU f64・camera.js viewRays）v(ndc)＝F＋x·X＋y·Y。等高線が読む
	rayX: vec4f,
	rayY: vec4f,
	eyeC: vec4f,       // xyz＝目の位置・w＝|E|²−1（f64）＝sphereRay の c
	clipT: vec4f,      // mvp*[originPt,1]（CPU double）＝RTE の錨
	trig: vec4f,       // (cosLon, sinLon, cosLat, sinLat) of origin
	originPt: vec3f,   // lonlatTo3D(origin)
	eye: vec3f,        // カメラ位置（単位球ワールド）
	origin: vec2f,     // シーン原点 lon/lat (deg)
	viewport: vec2f,   // canvas 幅高 (device px)
	fogColor: vec3f,   // 霞む先の色（fill/line/bld=land基色・terrain=遠山ブルー）
	params: vec4f,     // fogNear, fogFar, logCoef, dpr
	elevBounds: vec4f, // originLng, originLat, spanLng, spanLat（アトラス被覆）
	elevP: vec4f,      // elevScaleEff((誇張/半径)×pitchフェード), hasElev(0/1), edgeFade(deg), 負の標高をそのまま描く(0/1＝低地フェード無し)
	mesh: vec4f,       // 地形メッシュの窓：xy=原点(lon,lat) zw=幅(deg)。頂点は単位格子 uv＝窓替えで作り直さない（terrain/terrainFar slot のみ非0）
	farBounds: vec4f,  // 遠景層（far）アトラス被覆＝近窓の外を受け持つ粗い R10 第2アトラス（深ズーム×チルトで常設）
	farP: vec4f,       // hasFar(0/1), farEdgeFade(deg), farPass(1=遠景メッシュパス・terrainFar slot のみ), Cesium の霧の濃さ（csFogDensity・地形と模型の頂点で csFogV）
	ellTrig: vec4f,    // 楕円体 dβ 錨 (cos2φ0, sin2φ0, cos4φ0, sin4φ0)（CPU double・原点の測地緯度）。球=vec4(0)＝補正が厳密0
	ellP: vec4f,       // x=1:楕円体（変位方向・β→φ復元のゲート）0:球, y=案A の格子 G（fill/line 系）, z=1:建物の頂点の標高は 1 標本（?elevcheap=1）, w=near 面（単位球・?nearclip=M・0＝従来＝切らない）
	cogP: vec4f,       // ユーザ COG uv 係数（f64 前計算＝f32 絶対経緯度ジッタ根治）: fill系 slot=(off.xy, 1/span)・terrain系 slot=(off.xy, mesh.zw/span)
	gnd0: vec4f,       // 地面アトラス（近窓）uv 係数＝cogP と同形（fill系＝(off.xy, 1/span)・terrain系＝(off.xy, mesh.zw/span)）
	gnd1: vec4f,       // 同・中窓
	gnd2: vec4f,       // 同・遠窓
	gnd3: vec4f,       // 同・4 段目（前景あり＝[前景,近,中,遠]・無し＝[近,中,遠,−]）
	eyeO: vec4f,       // xyz＝目−originPt（f64 で引く＝原点相対の目）・w＝原点の β（rad）。等高線の交点 δ＝eyeO＋t·d（#65）
	elevOff: vec4f,    // 等高線の標高 uv 係数（f64 前計算）：(原点の uv, 1/span)＝uv＝off＋δll·inv
	sun: vec4f,        // 太陽（#46 段 0・2026-09-26）：xyz＝方向の単位ベクトル（地球固定・y=北極＝shadow.js sunVector と同軸）・w＝昼の度合い（原点の太陽高度 −6°→+6° の smoothstep）。夜は減光した固定光へ落とす量の鍵＝段 2 の PBR が読む。段 0 では運ぶだけ
	cg: vec4f,         // 地面の照明（setGroundLighting・2026-10-26）：xyz＝光へ向く単位ベクトル（世界）・w＝0 無し／1 地形の法線／2 楕円体の上向き（cgLambert）。sun の後ろ＝packFrame の詰め順（sun 116・cg 120）と一致させる
	cgP: vec4f,        // (lambert の倍率, 足す値, 効き 0..1＝距離のフェード済み, 大気の夜側の明るさ 0.05..1・負＝暗くしない)
	cgC: vec4f,        // 光の色（czm_lightColor）
	nearBounds: vec4f, // 近景層（near・順 1a 2026-10-28）＝目の足元の細密窓（1 セル）の被覆。末尾に足す＝前の欄の詰め順は不変（tests/frame-layout.mjs）
	nearP: vec4f,      // hasNear(0/1), nearEdgeFade(deg), 0, 1/K＝clip 空間の倍率の逆数（?clipk・0＝倍率なし・上の wTrue）
	fineBounds: vec4f, // 足元層（fine・2026-10-31）＝近景層の窓の内側の 1/512°〜1/32° の窓（近景テクスチャの右半分）
	fineP: vec4f,      // hasFine(0/1), fineEdgeFade(deg), 0, 0
};
@group(0) @binding(0) var<uniform> F: Frame;
${Sf}
@group(0) @binding(1) var elevTex: texture_2d<f32>;
@group(0) @binding(2) var elevSamp: sampler;
@group(0) @binding(3) var farElevTex: texture_2d<f32>;
@group(0) @binding(13) var csEnvTex: texture_cube<f32>;   // the model's specular environment (Cesium ImageBasedLighting.specularEnvironmentMaps, a prefiltered cube, mip = roughness; a dummy cube when none)
@group(0) @binding(14) var csEnvSamp: sampler;
@group(0) @binding(12) var nearElevTex: texture_2d<f32>;   // 近景層（elev() が静的参照＝bgl0/bglOvFrame の全レイアウトに必須・未使用は dummy）
// ユーザ COG（等経緯度整列 RGBA・geopbf/cog が warp 済み）。FRAME を含む全モジュールが宣言＝bgl0 が常に充足
// （未使用モジュールでは宣言だけ＝コスト無し）。bbox=[west,south,spanLon,spanLat] 絶対deg・p.x=has・行0=北＝v反転。
@group(0) @binding(4) var cogTex0: texture_2d<f32>;
@group(0) @binding(5) var<uniform> CG0: Cog0P;
// 見比べ（2 枚組・2026-10-27）＝p.y＝組か・p.z＝境の u・p.w＝半テクセル（gl/glsl.ts の COG と同式）
struct Cog0P { bbox: vec4f, p: vec4f };
fn cogPairV(uv: vec2f, p: vec4f) -> f32 {
	let v = 1.0 - uv.y;
	if (p.y < 0.5) { return v; }
	return clamp(v * 0.5, p.w, 0.5 - p.w) + select(0.0, 0.5, uv.x >= p.z);
}
fn cogTexMix0(col: vec3f, uv: vec2f) -> vec3f {
	if (CG0.p.x < 0.5) { return col; }
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return col; }
	let c = textureSampleLevel(cogTex0, elevSamp, vec2f(uv.x, cogPairV(uv, CG0.p)), 0.0);
	return mix(col, c.rgb, c.a);
}
// 地面アトラス（RTT ドレープ・2026-09-21）：ラスタ基図→ベクタ塗り（3D 時）→ラスタ重ね を renderer が 3 段窓（近/中/遠・前乗算）へ合成し、
// COG と同じ場所で画素標本化（地形面そのものに写る）。行0＝北（WebGPU のレンダーターゲット）＝v 反転。3 枚とも無条件に標本化してから選ぶ（uniformity）。
@group(0) @binding(6) var gndTex0: texture_2d<f32>;
@group(0) @binding(7) var gndTex1: texture_2d<f32>;
@group(0) @binding(8) var gndTex2: texture_2d<f32>;
@group(0) @binding(9) var<uniform> GD0: GndP;
@group(0) @binding(10) var gndSamp: sampler;
@group(0) @binding(11) var gndTex3: texture_2d<f32>;
struct GndP { w0: vec4f, w1: vec4f, w2: vec4f, w3: vec4f, p: vec4f };   // w*=[W,S,spanLon,spanLat]・p.x=有効な窓の数（0..4・細かい順）・p.y=分割の画面 x（device px・負＝なし）
${Sd}
fn gndMix0(col: vec3f, uv0: vec2f, uv1: vec2f, uv2: vec2f, uv3: vec2f, fx: f32) -> vec3f {
	if (GD0.p.x < 0.5) { return col; }   // 地面アトラス無し＝標本化しない（perf plan P6・2026-09-27）。GD0 は var<uniform>＝一様な分岐＝以後の textureSample は合法。GL の gndMix と同順（旧＝4 本標本化してから捨てていた）
	let c0 = textureSample(gndTex0, gndSamp, gndUV0(uv0, fx, GD0.p.y));
	let c1 = textureSample(gndTex1, gndSamp, gndUV0(uv1, fx, GD0.p.y));
	let c2 = textureSample(gndTex2, gndSamp, gndUV0(uv2, fx, GD0.p.y));
	let c3 = textureSample(gndTex3, gndSamp, gndUV0(uv3, fx, GD0.p.y));
	// 窓の縁 4% はひとつ外の窓へクロスフェード＝解像度の段差を溶かす（gl/glsl.js gndMix と同式）
	let w0 = gndEdge(uv0);
	let w1 = select(0.0, gndEdge(uv1), GD0.p.x > 1.5);
	let w2 = select(0.0, gndEdge(uv2), GD0.p.x > 2.5);
	let w3 = select(0.0, gndEdge(uv3), GD0.p.x > 3.5);
	let c = mix(mix(mix(mix(vec4f(0.0), c3, w3), c2, w2), c1, w1), c0, w0);
	return col * (1.0 - c.a) + c.rgb;   // 前乗算＝over 合成
}
fn gndEdge(uv: vec2f) -> f32 {   // 窓内 1・縁 4% で 0 へ・外 0
	let d = min(uv, vec2f(1.0) - uv);
	return clamp(min(d.x, d.y) / 0.04, 0.0, 1.0);
}
// 描画役割毎の小物（renderer.js が役割別スロットに詰める）：
//   fill/line … p0 = (seaGate, lift(m・線の接地リフト。塗りは 3D では地面アトラス側＝未使用), 0, α)
//   terrain  … p0 = (land.rgb, 0)  p1 = (hypso.rgb, hypso量)  p2 = (1/hypso最大標高, 0, 0, 0)
//   building … p0 = (bldColor.rgb, 0)
//   contour  … p0 = (cColor.rgb, 主曲線間隔m)  p1 = (計曲線間隔m, 濃さ, 0, 0)
//   fill/line の層の画面効果（style 互換 S-P1-1/3/4/5・2026-10-22・gl の u_tr/u_blur/u_cj/u_dashP/u_dashI/u_patP/u_patK と同じ意味）＝
//   tr = (東 px, 南 px, 今の zoom の 1px の弧（度）, 破線でずらす md の列のずらし（CSS px・線分プールの語 6 が距離＝paintzoom.ts の層で 1 つの値）)  lx = (blur（px か半径の割合）, blur の種類 0 線/1 円, cj＝cap|join<<2|round(ml×8)<<4, patK＝模様の 1 度の px)
//   dashP = (周期 P, 線の区間の数（0＝破線でない）, 丸い端 1/0, floor(zoom) の px ÷ z24 の px)  dashI0/1 = 区間 [a,b]×4  patP = (原点の位相 x, y, 1/幅, 1/高さ・z＝0 で模様なし)
//   役割だけのスロット（paramBG）は全部 0＝今までの絵。層ごとの値は renderer の lxBind が別のスロットに詰める
//   ズーム連続（V-Ph3＝S-P1-2・paintzoom.ts・gl の u_pz/u_pzC/u_pzO と同じ意味・2026-11-01 WebGPU 版）＝pz = (色を差し替える 1, 線幅を差し替える 1, 半幅（CSS px）, floor(z) の半幅（破線の尺）)
//   pzC = 差し替える色（RGBA・不透明度を掛けた値）  pzO = (ずらしを差し替える 1, 今の z のずらし（CSS px）, paint 表の (b) 類＝描く列が表を読む（1＝色・2＝色と線の半幅）, 0)。全部 0＝頂点の値
struct DrawP { p0: vec4f, p1: vec4f, p2: vec4f, tr: vec4f, lx: vec4f, dashP: vec4f, dashI0: vec4f, dashI1: vec4f, patP: vec4f, pz: vec4f, pzC: vec4f, pzO: vec4f };
@group(1) @binding(0) var<uniform> P: DrawP;
const D2R: f32 = 0.017453292519943295;
// 層の *-translate（S-P1-4/5）：地面の上でずらす（gl FX_TR の trLL と同式）＝経度だけ cos φ で割る。P.tr.z＝0 で 0
fn trLL(ll: vec2f) -> vec2f { return vec2f(P.tr.x / max(cos(ll.y * D2R), 1e-3), -P.tr.y) * P.tr.z; }
// GPU の sin() は微小角で信用できない（glsl.js sinP と同一のテイラー切替）
fn sinP(x: f32) -> f32 {
	let x2 = x * x;
	return select(sin(x), x * (1.0 - x2 * (1.0 / 6.0) * (1.0 - x2 * (1.0 / 20.0))), abs(x) < 0.1);
}
fn cosP(x: f32) -> f32 { let s = sinP(0.5 * x); return 1.0 - 2.0 * s * s; }
// ── 楕円体（?ell=1・段階B）＝glsl.js と1:1：dlat（測地緯度差分）→dβ（更成緯度差分）の閉形式差分。
// 球＝F.ellTrig=vec4(0) で補正が厳密0。F.trig は β の三角を運ぶ（renderer packFrame が配る）。
const ELL_NU: f32 = 0.0016792203863837047;
const ELL_NU2: f32 = 0.0000014098905530233192;
const ELL_INV_R: f32 = 1.0033640898209764;
fn dBeta(dp: f32) -> f32 {
	if (F.ellP.x < 0.5) { return dp; }   // 球＝恒等を早期return（uniform分岐）＝補正の三角関数を毎頂点払わない
	let sd = sinP(dp); let cd = cosP(dp); let s2d = sinP(2.0 * dp); let c2d = cosP(2.0 * dp);
	return dp - 2.0 * ELL_NU  * (F.ellTrig.x * cd  - F.ellTrig.y * sd)  * sd
	          + 2.0 * ELL_NU2 * (F.ellTrig.z * c2d - F.ellTrig.w * s2d) * s2d;
}
// 標高の変位方向：球＝β動径（従来の dir）・楕円体＝測地法線の β空間像（glsl.js liftDir と同式）
fn liftDir(ll: vec2f, dir: vec3f) -> vec3f {
	if (F.ellP.x < 0.5) { return dir; }
	let p = ll.y * D2R; let l = ll.x * D2R; let cp = cos(p);
	return vec3f(cp * cos(l), sin(p) * ELL_INV_R, cp * sin(l));
}
// β→φ 復元（deg）＝レイキャスト系（asin=β）から elev() を引く時に通す。球=恒等（glsl.js geoLat と同式）
fn geoLat(betaDeg: f32) -> f32 {
	let b = betaDeg * D2R;
	return betaDeg + F.ellP.x * degrees(ELL_NU * sin(2.0 * b) + ELL_NU2 * sin(4.0 * b));
}
// 頂点3D − originPt を桁落ちなしで直接作る（cos(θ)-1=-2sin²(θ/2)）＝glsl.js deltaToRel と同式
// dlat は dBeta で β差分へ（球では恒等）＝以降は純粋な球面幾何（β単位球）
fn deltaToRel(dDeg: vec2f) -> vec3f {
	let da = dDeg.x * D2R; let db = dBeta(dDeg.y * D2R);
	let sda = sinP(da); let sdb = sinP(db);
	let sha = sinP(da * 0.5); let shb = sinP(db * 0.5);
	let cdaM1 = -2.0 * sha * sha; let cdbM1 = -2.0 * shb * shb;
	let cda = 1.0 + cdaM1; let cdb = 1.0 + cdbM1;
	let ccM1 = cdaM1 + cdbM1 + cdaM1 * cdbM1;
	let cLon = F.trig.x; let sLon = F.trig.y; let cLat = F.trig.z; let sLat = F.trig.w;
	let rx = cLat * cLon * ccM1 - cLat * sLon * cdb * sda - sLat * cLon * sdb * cda + sLat * sLon * sdb * sda;
	let ry = sLat * cdbM1 + cLat * sdb;
	let rz = cLat * sLon * ccM1 + cLat * cLon * cdb * sda - sLat * sLon * sdb * cda - sLat * cLon * sdb * sda;
	return vec3f(rx, ry, rz);
}
fn fogOf(w: vec3f) -> f32 {
	return clamp((distance(F.eye, w) - F.params.x) / max(F.params.y - F.params.x, 1e-6), 0.0, 1.0);
}
// clip 空間の倍率 K（?clipk=N＝2^N・2026-11-05 Galaxy/Mali-G615 実機「手前の建物が足元へ細長く伸びる」）：単位球の世界では近景の clip w が 1e-6 級と極端に小さく、
// Mali の固定機能（透視除算／クリッパ）が w≈0 と扱う読み。packFrame が F.mvp と F.clipT（模型は B.clipMesh）を K 倍して渡す＝斉次座標なので x/w・z/w は不変（K は 2 のべき＝ビット同値）。
// 深度の式だけは本当の w（K 分の 1）が要る＝ここで戻す（F.nearP.w＝1/K・0＝従来＝倍率なし）
fn wTrue(w: f32) -> f32 { return select(w, w * F.nearP.w, F.nearP.w > 0.0); }
// クリップ z ← 対数深度（WebGPU z01）。GL 版 applyLogDepth の window 深度と同値
fn logDepthZ(w: f32) -> f32 {
	return log1pS(max(wTrue(w), 1e-30)) * 1.4426950 * F.params.z * 0.5 * w;   // 1.0+w を f32 で作らない（下の log1pS）：目が数 m まで寄った 1 m 級の模型は表と裏が同じ深度になり裏が透けた（2026-10-28）
}
// 画素ごとの深度（frag_depth・#62）＝z_ndc＝logDepthZ(w)/w＝0.5·logCoef·log2(1+w)。1+w を f32 で作ると w が 1.2e-7（≈0.76m）刻みに量子化され、
// 画素ごとに書くと 0.76m の階段になる（AO が横縞の壁として見た＝実 GPU 2026-09-29）。log1p を級数で（AO の expm1s と対・w<0.1＝7 次・相対 1e-9）
fn log1pS(w: f32) -> f32 { if (w < 0.1) { return w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715)))))); } return log(1.0 + w); }
fn fragDepthOf(w: f32) -> f32 { return log1pS(max(wTrue(w), 1e-30)) * 1.4426950 * F.params.z * 0.5; }
// 近景の切り取り（?nearclip=M・2026-11-05 Galaxy/Mali-G615 実機「手前の建物が手前に伸びる」）：対数深度を頂点で書くと clip z≈0（w≪1 で z∝w²）＝
// 本当の near 面で切れず、カメラの後ろにかかる壁は w≈0 の点で切られて x/w が無限遠に飛ぶ（Apple/デスクトップは同次座標のまま耐える・Mali は固定小数点の範囲を超えて壊れる）。
// frag_depth を書くパイプライン（fragDepthWgsl）だけ、頂点の z を透視の線形（z=(w−n)·f/(f−n)＝near n・far f＝logCoef から復元）にして GPU に n で切らせる。深度の値は frag_depth が書く＝不変。
fn nearClipZ(w: f32) -> f32 { let n = F.ellP.w; let f = exp2(2.0 / F.params.z) - 1.0; let k = select(1.0, 1.0 / F.nearP.w, F.nearP.w > 0.0); return (w - n * k) * f / (f - n); }   // w は K 倍の clip w（上の wTrue）
// sRGB ⇄ リニア（#46 段 0）。模型の baseColor は rgba8unorm-srgb ビューで読む＝標本化の時点でリニア。照明の計算はリニアで、出口で符号化する。
// 出力面は素の bgra8/rgba8（sRGB ビューにしない＝基図・地形・建物は今までどおり表示空間の値をそのまま書く）。
fn srgbEncode(c: vec3f) -> vec3f {
	let x = max(c, vec3f(0.0));
	return select(1.055 * pow(x, vec3f(1.0 / 2.4)) - 0.055, x * 12.92, x <= vec3f(0.0031308));
}
fn srgbDecode(c: vec3f) -> vec3f {
	let x = max(c, vec3f(0.0));
	return select(pow((x + 0.055) / 1.055, vec3f(2.4)), x / 12.92, x <= vec3f(0.04045));
}
// ── PBR の部品（#46 段 2・2026-09-26）。単位は「原点で水平な白が 1」（CPU が E_ref で正規化＝自動露出）。
// 環境光＝空の放射輝度（段 1 と同じ散乱式・CPU で天球を積分）の SH9（照度の係数 A_l と 1/E_ref を CPU が畳み済み）＝局所系（x=東・y=北・z=上）で評価。
// 太陽＝F.sun.xyz（地球固定）・強さ lp.rgb（透過率込み・正規化）。夜（F.sun.w→0）は段 0 の固定光（局所系・北寄り 64°）へ連続に落とす（lp.w＝固定光の重み）。
// fill＝昼でも固定光を少し混ぜて陰の壁を読めるようにする（地図の読みやすさ・view.pbrFill・sh[0].w）。
const PBR_PI: f32 = 3.14159265;
fn pbrLocal(pos: vec3f) -> mat3x3f {   // 列＝東・北・上
	let up = normalize(pos);
	let e0 = cross(vec3f(0.0, 1.0, 0.0), up);
	let east = select(normalize(e0), vec3f(1.0, 0.0, 0.0), dot(e0, e0) < 1e-12);
	return mat3x3f(east, cross(up, east), up);
}
fn pbrSH(sh: array<vec4f, 9>, nl: vec3f) -> vec3f {   // 照度 E(n)/E_ref（実数 SH の基底・係数は CPU 側で A_l/E_ref 込み）
	let x = nl.x; let y = nl.y; let z = nl.z;
	return max(sh[0].xyz * 0.282095 + sh[1].xyz * (0.488603 * y) + sh[2].xyz * (0.488603 * z) + sh[3].xyz * (0.488603 * x)
		+ sh[4].xyz * (1.092548 * x * y) + sh[5].xyz * (1.092548 * y * z) + sh[6].xyz * (0.315392 * (3.0 * z * z - 1.0))
		+ sh[7].xyz * (1.092548 * x * z) + sh[8].xyz * (0.546274 * (x * x - y * y)), vec3f(0.0));
}
fn pbrFixed(nl: vec3f) -> f32 {   // 段 0 の固定光（局所系）＝屋根 0.9・陰の壁 0.62
	return 0.62 + 0.28 * clamp(dot(nl, normalize(vec3f(0.0, 0.44, 0.90))), 0.0, 1.0);
}
fn pbrEnvBRDF(F0: vec3f, rough: f32, nv: f32) -> vec3f {   // Karis の解析近似（LUT 無し）
	let r = rough * vec4f(-1.0, -0.0275, -0.572, 0.022) + vec4f(1.0, 0.0425, 1.04, -0.04);
	let a004 = min(r.x * r.x, exp2(-9.28 * nv)) * r.x + r.y;
	let AB = vec2f(-1.04, 1.04) * a004 + r.zw;
	return F0 * AB.x + AB.y;
}
// Cesium の模型の照明（@ortho-earth/cesium の setMeshLighting・2026-10-26）＝gl/glsl.ts csLit と同式：czm_pbrLighting（直接光）＋環境光（SH9 の拡散＋反射の向きの SH9 の鏡面・Karis の brdf 近似）
// → czm_pbrNeutralTonemapping → pow(1/2.2)。SH は Cesium の立方体図の系（x 東・y 上・z 南）＝局所系（東・北・上）から写す
fn csSH(sh: array<vec4f, 9>, n: vec3f) -> vec3f {
	let L = sh[0].xyz + sh[1].xyz * n.y + sh[2].xyz * n.z + sh[3].xyz * n.x + sh[4].xyz * (n.y * n.x) + sh[5].xyz * (n.y * n.z)
		+ sh[6].xyz * (3.0 * n.z * n.z - 1.0) + sh[7].xyz * (n.z * n.x) + sh[8].xyz * (n.x * n.x - n.y * n.y);
	return max(L, vec3f(0.0));
}
fn csTonemap(c0: vec3f) -> vec3f {
	let x = min(c0.r, min(c0.g, c0.b));
	let offset = select(0.04, x - 6.25 * x * x, x < 0.08);
	var color = c0 - offset;
	let peak = max(color.r, max(color.g, color.b));
	if (peak < 0.76) { return color; }
	let dd = 0.24; let newPeak = 1.0 - dd * dd / (peak + dd - 0.76);
	color *= newPeak / peak;
	let g = 1.0 - 1.0 / (0.15 * (peak - newPeak) + 1.0);
	return mix(color, vec3f(newPeak), g);
}
// CESIUM_primitive_outline (PrimitiveOutlineStageFS): an edge coordinate within 0.75 px of 1 takes the outline colour; Cesium's mip-mapped lookup
// fades the line as the coordinate's footprint grows past 1/16 (cf. glsl MESH_FS olMix). The mesh FS sets these (olC.a = 0: none)
var<private> olV: vec3f; var<private> olW: vec3f; var<private> olC: vec4f;
fn olMix(b: vec3f) -> vec3f {
	if (olC.a <= 0.0) { return b; }
	let t = max(olW, vec3f(1.0 / 4096.0));
	let o = 0.753 * clamp((olV - 1.0) / t + 1.5, vec3f(0.0), vec3f(1.0)) * min(vec3f(1.0), 1.0 / (16.0 * t));
	return mix(b, olC.rgb, olC.a * max(o.x, max(o.y, o.z)));
}
// Cesium's czm_phong (the entity geometry / Primitive appearances, csL.w 3) = gl/glsl.ts csPhong: two lights at the eye, along the view (eye z)
// and from the camera's up (eye y); ambient 0.5·diffuse; specular 0. F.rayF / F.rayY = the camera's forward and up (world)
fn csPhong(n: vec3f) -> f32 { return 0.5 + 0.5 * (max(dot(n, -normalize(F.rayF.xyz)), 0.0) + max(dot(n, normalize(F.rayY.xyz)), 0.0)); }
struct CsIn { base: vec3f, n: vec3f, pos: vec3f, v: vec3f, metallic: f32, rough: f32, ao: f32, emissive: vec3f, sunK: f32, cc: vec2f, ncc: vec3f };   // cc＝KHR_materials_clearcoat (factor, roughness)・ncc＝its normal (the geometric one)
fn csLit(i: CsIn, sh: array<vec4f, 9>, csL: vec4f, csC: vec4f, csI: vec4f) -> vec3f {   // base＝リニア。戻り＝表示空間（sRGB）
	let l = normalize(csL.xyz); let h = normalize(i.v + l);
	let M = pbrLocal(i.pos);
	let nl3 = transpose(M) * i.n; let rl3 = transpose(M) * reflect(-i.v, i.n);
	let nC = vec3f(-nl3.x, nl3.z, -nl3.y); let rC = vec3f(-rl3.x, rl3.z, -rl3.y);   // cube-map frame (x east, y up, z south): pbrLocal's first column points west (the world axes are mirrored)
	let diffuse = olMix(i.base * (1.0 - i.metallic)); let f0 = mix(vec3f(0.04), i.base, i.metallic);
	let VdotH = clamp(dot(i.v, h), 0.0, 1.0); let NdotL = clamp(dot(i.n, l), 0.001, 1.0); let NdotV = clamp(dot(i.n, i.v), 0.0, 1.0); let NdotH = clamp(dot(i.n, h), 0.0, 1.0);
	let f90 = vec3f(clamp(max(f0.r, max(f0.g, f0.b)) * 25.0, 0.0, 1.0));
	let vs = 1.0 - VdotH; let F = f0 + (f90 - f0) * vs * vs * vs * vs * vs;
	let a = i.rough * i.rough; let a2 = a * a;
	let GGX = NdotL * sqrt(NdotV * NdotV * (1.0 - a2) + a2) + NdotV * sqrt(NdotL * NdotL * (1.0 - a2) + a2);
	let G = select(0.0, 0.5 / GGX, GGX > 0.0);
	let f = (NdotH * a2 - NdotH) * NdotH + 1.0;
	let D = a2 / (PBR_PI * f * f);
	var color = ((vec3f(1.0) - F) * diffuse / PBR_PI + F * G * D) * NdotL * csC.rgb * i.sunK + i.emissive;
	let rr = i.rough * vec4f(-1.0, -0.0275, -0.572, 0.022) + vec4f(1.0, 0.0425, 1.04, -0.04);
	let a004 = min(rr.x * rr.x, exp2(-9.28 * NdotV)) * rr.x + rr.y;
	let AB = vec2f(-1.04, 1.04) * a004 + rr.zw;
	let f90i = max(vec3f(1.0 - i.rough), f0); let vn = 1.0 - NdotV; let Fn = f0 + (f90i - f0) * vn * vn * vn * vn * vn;
	let FssEss = Fn * AB.x + AB.y;
	let avgF = f0 + (vec3f(1.0) - f0) / 21.0; let Ems = 1.0 - AB.x - AB.y;
	let FmsEms = FssEss * avgF * Ems / (vec3f(1.0) - avgF * Ems);
	color += (csSH(sh, nC) * (FmsEms + (vec3f(1.0) - FssEss - FmsEms) * diffuse) * csI.x + select(csSH(sh, rC) * csC.w, textureSampleLevel(csEnvTex, csEnvSamp, rC, i.rough * csI.w).rgb, csI.z > 0.5) * FssEss * csI.y) * i.ao;
	if (i.cc.x > 0.0) {   // KHR_materials_clearcoat (Cesium's clearcoat layer): GGX with f0 0.04 on the geometric normal, its Fresnel taking from the base under it
		let cn = i.ncc; let cNdotL = clamp(dot(cn, l), 0.001, 1.0); let cNdotV = clamp(dot(cn, i.v), 0.0, 1.0); let cNdotH = clamp(dot(cn, h), 0.0, 1.0);
		let crl = transpose(M) * reflect(-i.v, cn); let crC = vec3f(-crl.x, crl.z, -crl.y);
		let cr = clamp(i.cc.y, 0.0, 1.0); let ca = cr * cr; let ca2 = ca * ca; let cF = 0.04 + 0.96 * pow(1.0 - VdotH, 5.0);
		let cGGX = cNdotL * sqrt(cNdotV * cNdotV * (1.0 - ca2) + ca2) + cNdotV * sqrt(cNdotL * cNdotL * (1.0 - ca2) + ca2); let cG = select(0.0, 0.5 / cGGX, cGGX > 0.0);
		let cf = (cNdotH * ca2 - cNdotH) * cNdotH + 1.0; let cD = ca2 / (PBR_PI * cf * cf);
		let crr = cr * vec4f(-1.0, -0.0275, -0.572, 0.022) + vec4f(1.0, 0.0425, 1.04, -0.04);
		let ca004 = min(crr.x * crr.x, exp2(-9.28 * cNdotV)) * crr.x + crr.y; let cAB = vec2f(-1.04, 1.04) * ca004 + crr.zw;
		let cFv = 0.04 + 0.96 * pow(1.0 - cNdotV, 5.0);
		let cEnv = select(csSH(sh, crC) * csC.w, textureSampleLevel(csEnvTex, csEnvSamp, crC, cr * csI.w).rgb, csI.z > 0.5);
		color = color * (1.0 - i.cc.x * cFv) + i.cc.x * (cF * cG * cD * cNdotL * csC.rgb * i.sunK + cEnv * (0.04 * cAB.x + cAB.y) * csI.y * i.ao);
	}
	return pow(max(csTonemap(color), vec3f(0.0)), vec3f(1.0 / 2.2));
}
struct PbrIn { base: vec3f, n: vec3f, pos: vec3f, v: vec3f, metallic: f32, rough: f32, ao: f32, sunK: f32, lp: vec4f, fill: f32 };
// 戻り＝リニアの放射輝度（正規化）。metallic 0・rough 1・ao 1＝拡散だけ（素の建物メッシュ）
fn pbrShade(i: PbrIn, sh: array<vec4f, 9>) -> vec3f {
	let M = pbrLocal(i.pos);
	let nl3 = transpose(M) * i.n;
	let s = F.sun.xyz;
	let nv = max(dot(i.n, i.v), 1e-4); let nl = max(dot(i.n, s), 0.0);
	let h = normalize(i.v + s); let nh = max(dot(i.n, h), 0.0); let vh = max(dot(i.v, h), 0.0);
	let F0 = mix(vec3f(0.04), i.base, i.metallic);
	let a = max(i.rough * i.rough, 0.002); let a2 = a * a;
	let dd = nh * nh * (a2 - 1.0) + 1.0;
	let D = a2 / (PBR_PI * dd * dd);
	let k = (i.rough + 1.0) * (i.rough + 1.0) / 8.0;
	let G = (nv / (nv * (1.0 - k) + k)) * (nl / (nl * (1.0 - k) + k));
	let Fr = F0 + (vec3f(1.0) - F0) * pow(1.0 - vh, 5.0);
	let spec = D * G * Fr / (4.0 * nv * nl + 1e-4);
	let kd = (vec3f(1.0) - Fr) * (1.0 - i.metallic);
	let sunE = i.lp.rgb * i.sunK;
	let Esky = pbrSH(sh, nl3) * i.ao;
	let r = reflect(-i.v, i.n);
	let envSpec = pbrSH(sh, transpose(M) * r) * pbrEnvBRDF(F0, i.rough, nv) * i.ao;
	let phys = kd * i.base * (nl * sunE + Esky) + PBR_PI * spec * nl * sunE + envSpec * (1.0 - i.metallic * 0.0);
	let wP = (1.0 - i.fill) * (1.0 - i.lp.w);   // 物理の重み＝昼×(1−fill)。残りは固定光
	return phys * wP + i.base * pbrFixed(nl3) * (1.0 - wP);
}
// 標高サンプラ（アトラス範囲内なら高さm・外は0）。窓の縁の edgeFade 込み＝glsl.js ELEV と同式。
// textureSampleLevel＝頂点/フラグメント両ステージで合法（暗黙 LOD 不要。mip 無し＝GL の texture() と同値）
fn elevFadeAt(uv: vec2f) -> f32 {
	if (F.elevP.z <= 0.0) { return 1.0; }
	let w = vec2f(F.elevP.z) / F.elevBounds.zw;
	return min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
}
// 遠景層＝近窓の縁は「0 へ落とす」でなく「遠層の値へ溶かす」（ズームインで近窓が縮んでも遠方の山が
// 消えない一般則）。遠層なし（farP.x=0）は elevFar=0 で従来式 near×fade に厳密一致＝挙動不変。glsl.js ELEV と同式。
fn elevFar(ll: vec2f) -> f32 {
	if (F.farP.x < 0.5) { return 0.0; }
	let uv = (ll - F.farBounds.xy) / F.farBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return 0.0; }
	var f = 1.0;
	if (F.farP.y > 0.0) {   // 遠窓自身の縁は従来どおり 0 へフェード（その先は覆いが無い）
		let w = vec2f(F.farP.y) / F.farBounds.zw;
		f = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return textureSampleLevel(farElevTex, elevSamp, uv, 0.0).r * f;
}
// 近景層（near）＝近窓の内側に重ねる細密窓。縁は近窓の値へ溶かす（far の一般則の内側版）。無し（nearP.x=0）は base＝挙動不変。glsl.ts ELEV と同式
// 近景テクスチャは 2 セル幅：左半分＝近景層・右半分＝足元層（fine）。足元層は近景層の値へ縁で溶かす。無し（fineP.x=0）は近景層のまま。glsl.ts ELEV と同式
fn elevFine(ll: vec2f, base: f32) -> f32 {
	if (F.fineP.x < 0.5) { return base; }
	let uv = (ll - F.fineBounds.xy) / F.fineBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return base; }
	let w = vec2f(F.fineP.y) / F.fineBounds.zw;
	let f = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	return mix(base, textureSampleLevel(nearElevTex, elevSamp, vec2f(0.5 + uv.x * 0.5, uv.y), 0.0).r, f);
}
fn elevNear(ll: vec2f, base: f32) -> f32 {
	if (F.nearP.x < 0.5) { return base; }
	let uv = (ll - F.nearBounds.xy) / F.nearBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return base; }
	let w = vec2f(F.nearP.y) / F.nearBounds.zw;
	let f = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	return elevFine(ll, mix(base, textureSampleLevel(nearElevTex, elevSamp, vec2f(uv.x * 0.5, uv.y), 0.0).r, f));
}
fn elev(ll: vec2f) -> f32 {
	if (F.elevP.y < 0.5) { return 0.0; }
	let uv = (ll - F.elevBounds.xy) / F.elevBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return elevFar(ll); }
	return elevNear(ll, mix(elevFar(ll), textureSampleLevel(elevTex, elevSamp, uv, 0.0).r, elevFadeAt(uv)));
}
// 軽い標高（?elevcheap=1・F.ellP.z＝1・2026-11-04 実機 Mali：建物の頂点ごとの elev/elevQ（3〜12 標本）が床だった）＝主アトラス 1 標本だけ。
// 近景・足元層と縁フェードは引かない＝建物の足元が描画メッシュ面と数十 cm〜数 m ずれ得る（非力 GPU の見た目の代償）。窓の外は遠層 1 標本。
fn elev1(ll: vec2f) -> f32 {
	if (F.elevP.y < 0.5) { return 0.0; }
	let uv = (ll - F.elevBounds.xy) / F.elevBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return elevFar(ll); }
	return textureSampleLevel(elevTex, elevSamp, uv, 0.0).r;
}
// 案A（gl/glsl.js QELEV と 1:1）: 線・塗りのドレープ標高を「地形メッシュと同じ折れ線面」に量子化＝
// 同じ格子頂点で elev() を取り同じ三角形分割（対角 a-c-b / b-c-d）で補間＝描画されている面に厳密に乗る。
// fill系 slot は packFrame が F.mesh=近メッシュ窓・F.ellP.y=G を配る（地形なしは G=0＝素の elev()）。
fn elevQ(ll: vec2f) -> f32 {
	let G = F.ellP.y;
	if (G < 1.5) { return elev(ll); }
	// 近景層（順 1a）の窓の内側は近景メッシュパス（同じ単位格子を窓へ縮めた物）が地面＝その格子で量子化（主パスはそこを discard 済み・2026-10-28）
	var win = F.mesh;
	if (F.nearP.x > 0.5) { let gn = (ll - F.nearBounds.xy) / F.nearBounds.zw; if (gn.x >= 0.0 && gn.x <= 1.0 && gn.y >= 0.0 && gn.y <= 1.0) { win = F.nearBounds; } }
	if (F.fineP.x > 0.5) { let gf = (ll - F.fineBounds.xy) / F.fineBounds.zw; if (gf.x >= 0.0 && gf.x <= 1.0 && gf.y >= 0.0 && gf.y <= 1.0) { win = F.fineBounds; } }   // 足元層の窓の内側は足元メッシュパスの格子
	let g = (ll - win.xy) / win.zw;
	if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) { return elev(ll); }
	let N = G - 1.0;
	let gc = min(g * N, vec2f(N - 1e-4));
	let gi = floor(gc);
	let gf = gc - gi;
	let st = win.zw / N;
	let b0 = win.xy + gi * st;
	let h00 = elev(b0);
	let h10 = elev(b0 + vec2f(st.x, 0.0));
	let h01 = elev(b0 + vec2f(0.0, st.y));
	let h11 = elev(b0 + st);
	if (gf.x + gf.y < 1.0) { return h00 + gf.x * (h10 - h00) + gf.y * (h01 - h00); }
	return h11 + (1.0 - gf.x) * (h01 - h11) + (1.0 - gf.y) * (h10 - h11);
}
// 線・overlay 塗りの標高の軽い版（F.fineP.z＝?lineelev・2026-11-07）：1＝elevQ と同じ格子量子化だが 4 隅を elev1（主アトラス 1 標本）で引く＝標本 16→4、
// 2＝elev1 そのまま＝標本 1（格子に乗らない＝線が地形の三角形の間で浮き沈みし得る）。0＝elevQ（従来）。
// 動機：Galaxy の滑走（京都→日本）で、線・塗りの頂点ごとの標高読み（elevQ＝elev×4＝近・遠・近景・足元で最大 16 標本）が地図の描画 125 ms のうち約 50 ms。
fn elevQ1(ll: vec2f) -> f32 {
	let G = F.ellP.y;
	if (G < 1.5) { return elev1(ll); }
	var win = F.mesh;
	if (F.nearP.x > 0.5) { let gn = (ll - F.nearBounds.xy) / F.nearBounds.zw; if (gn.x >= 0.0 && gn.x <= 1.0 && gn.y >= 0.0 && gn.y <= 1.0) { win = F.nearBounds; } }
	if (F.fineP.x > 0.5) { let gf = (ll - F.fineBounds.xy) / F.fineBounds.zw; if (gf.x >= 0.0 && gf.x <= 1.0 && gf.y >= 0.0 && gf.y <= 1.0) { win = F.fineBounds; } }
	let g = (ll - win.xy) / win.zw;
	if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) { return elev1(ll); }
	let N = G - 1.0;
	let gc = min(g * N, vec2f(N - 1e-4));
	let gi = floor(gc);
	let gf = gc - gi;
	let st = win.zw / N;
	let b0 = win.xy + gi * st;
	let h00 = elev1(b0);
	let h10 = elev1(b0 + vec2f(st.x, 0.0));
	let h01 = elev1(b0 + vec2f(0.0, st.y));
	let h11 = elev1(b0 + st);
	if (gf.x + gf.y < 1.0) { return h00 + gf.x * (h10 - h00) + gf.y * (h01 - h00); }
	return h11 + (1.0 - gf.x) * (h01 - h11) + (1.0 - gf.y) * (h10 - h11);
}
// 線・overlay 塗りの頂点が引く標高＝F.fineP.z（0 従来 elevQ／1 elevQ1／2 elev1）で選ぶ。uniform＝一様な分岐
fn elevL(ll: vec2f) -> f32 {
	if (F.fineP.z > 1.5) { return elev1(ll); }
	if (F.fineP.z > 0.5) { return elevQ1(ll); }
	return elevQ(ll);
}
`,$u=`	if (GD0.p.x < 0.5) { return col; }   // 地面アトラス無し＝標本化しない（perf plan P6・2026-09-27）。GD0 は var<uniform>＝一様な分岐＝以後の textureSample は合法。GL の gndMix と同順（旧＝4 本標本化してから捨てていた）
`,tf=`	let c3 = textureSample(gndTex3, gndSamp, gndUV0(uv3, fx, GD0.p.y));
`;function Yu(s){if(!s.includes("fn gndMix0("))return s;if(!s.includes($u)||!s.includes(tf))throw new Error("gndMixSlow: rewrite markers missing = the gndMix0 source format changed");return s.replace($u,"").replace(tf,tf+`	if (GD0.p.x < 0.5) { return col; }
`)}const _1=/if \(F\.ellP\.z > 0\.5\) \{([^{}]*)\} else \{([^{}]*)\}/g;function z1(s){return s.replace(_1,(p,_)=>`{${_}}`)}const Ua=`
${rn}
struct FillOut {
	@builtin(position) pos: vec4f,
	@location(0) color: vec4f,
	@location(1) front: f32,
	@location(2) fog: f32,
	@location(3) ll: vec2f,
	@location(4) pat: vec2f,   // fill-pattern（S-P1-4/5）＝模様の px（原点からの差＝メルカトルの px・縦は中ほどの緯度の cos で割る）
	@location(5) cuv: vec2f,   // COG uv（F.cogP＝f64 前計算係数×原点相対 dLL）
	@location(6) guv0: vec2f,  // 地面アトラス uv（前景/近/中/遠＝F.gnd0..3・同じ前計算）
	@location(7) guv1: vec2f,
	@location(8) guv2: vec2f,
	@location(9) guv3: vec2f,
};
@group(1) @binding(1) var patTex: texture_2d<f32>;   // fill-pattern（S-P1-4/5）＝記号帳の画像 1 枚（repeat）・模様の無い層は 1×1 の透明
@group(1) @binding(2) var patSamp: sampler;
@vertex fn vs(@location(0) a_delta: vec2f, @location(1) a_color: vec4f) -> FillOut {
	var o: FillOut;
	let dLL = a_delta + trLL(F.origin + a_delta);   // fill-translate（S-P1-4/5）＝原点相対 delta をずらす（md は a_tile を足した後）
	o.pat = vec2f(dLL.x, -dLL.y / cos((F.origin.y + dLL.y * 0.5) * D2R)) * P.lx.w;
	let ll = F.origin + dLL;                  // elev 参照用の絶対（粗くて可）
	let rel = deltaToRel(dLL);                // 頂点3D − 原点3D（小・正確）
	let dir = F.originPt + rel;               // 絶対単位球点（front/fog 用＝粗くて可）
	var p = F.clipT + F.mvp * vec4f(rel, 0.0);   // RTE：mvp*[w,1] を相殺なしで（海抜0の球面）
	p.z = logDepthZ(p.w);
	o.pos = p;
	o.color = a_color;
	if (P.pz.x > 0.5) { o.color = P.pzC; }   // ズーム連続の色（V-Ph3＝S-P1-2・paint 表の (b) 類は md の派生がここを差し替える）
	o.front = select(dot(dir, F.eye) - 1.0, 1.0, dot(F.eye, F.eye) < 1.0);
	o.fog = fogOf(dir);
	o.ll = ll;
	o.cuv = F.cogP.xy + dLL * F.cogP.zw;
	o.guv0 = F.gnd0.xy + dLL * F.gnd0.zw;
	o.guv1 = F.gnd1.xy + dLL * F.gnd1.zw;
	o.guv2 = F.gnd2.xy + dLL * F.gnd2.zw;
	o.guv3 = F.gnd3.xy + dLL * F.gnd3.zw;
	return o;
}
fn fillColor(in0: FillOut) -> vec4f {
	var in = in0;
	// 霧はフェードアウト（透明化）＝地平線の先の塗りが空に浮かない（glsl.js FILL_FS と同式）
	// ×P.p0.w＝グローバルα（シーン差し替えクロスフェード用。通常は1）
	var af = in.color.a * clamp(1.0 - 1.2 * in.fog, 0.0, 1.0) * P.p0.w;
	// 模様（S-P1-4/5）＝画像の色と α（MapLibre と同じく fill-color は読まない・fill-opacity は掛ける）。画像は前乗算で届く。P は uniform＝標本化は一様な分岐
	let pt = textureSample(patTex, patSamp, fract((P.patP.xy + in.pat) * P.patP.zw));
	if (P.patP.z > 0.0) { af *= pt.a; in.color = vec4f(select(vec3f(0.0), pt.rgb / max(pt.a, 1e-6), pt.a > 0.0), in.color.a); }
	if (af <= 0.003) { discard; }
	return vec4f(mix(gndMix0(cogTexMix0(in.color.rgb, in.cuv), in.guv0, in.guv1, in.guv2, in.guv3, in.pos.x), F.fogColor, in.fog) * af, af);   // ユーザ COG／地面アトラス（2D のラスタ重ね）＝塗りの上・線/建物/ラベルの下
}
@fragment fn fs(in: FillOut) -> @location(0) vec4f {
	if (in.front < -0.0015) { discard; }
	if (P.p0.x > 0.5 && elev(in.ll) > 0.0) { discard; }   // 図郭外＝陸は塗り残す（紙色+等高線に委ねる）
	return fillColor(in);
}
`,Jo=`
${rn}
struct LineOut {
	@builtin(position) pos: vec4f,
	@location(0) @interpolate(flat) a: vec2f,
	@location(1) @interpolate(flat) b: vec2f,
	@location(2) @interpolate(flat) halfw: f32,
	@location(3) sp: vec2f,
	@location(4) color: vec4f,
	@location(5) front: f32,
	@location(10) @interpolate(flat) ja: vec4f,   // 端 A の継ぎの切り口（二等分線）：点 xy・線分の側を向く法線 zw（S-P1-1）
	@location(11) @interpolate(flat) jb: vec4f,   // 端 B の同じ物
	@location(12) @interpolate(flat) jk: vec4f,   // 端の形 x＝A・y＝B（0 丸＝capsule・1 butt・2 square・3 miter・4 bevel・5 丸い継ぎ）・zw＝bevel の切り線の距離（符号＝外側の向き）
	@location(13) @interpolate(flat) dd: vec2f,   // 破線（S-P1-3）：始点の位相・線分の長さ（線幅の倍数）
	@location(14) @interpolate(flat) gp: vec2f,   // line-gradient（G-3）：始点・終点の進み（0..1）
	@location(6) fog: f32,
};
// 線の色の見本（G-3＝line-gradient の 256 段・RGBA8・前乗算しない）＝塗りの模様と同じ group(1) の binding 1/2（P.patP.x＝1 の層だけ読む・他は 1×1 の透明）。
// P.patP.x＝2 は line-pattern（G-4）＝模様の画像（塗りの模様と同じテクスチャ）・patP.y＝破線と同じ尺・patP.z＝層の line-opacity
@group(1) @binding(1) var ltTex: texture_2d<f32>;
@group(1) @binding(2) var ltSamp: sampler;
fn toScreen(c: vec4f) -> vec2f {
	let ndc = c.xy / c.w;
	return vec2f((ndc.x * 0.5 + 0.5) * F.viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * F.viewport.y);
}
// 継ぎの 3 点を画面へ（高さは継ぎ目の高さで揃える＝継ぎ目を共有する 2 本の線分が同じ値を得る）。z＝1 なら有効（カメラの背後は 0）
fn jScr(p: vec2f, h: f32) -> vec3f {
	let rel = deltaToRel(p);
	let c = F.clipT + F.mvp * vec4f(rel + h * liftDir(F.origin + p, F.originPt + rel), 0.0);
	return vec3f(toScreen(c), select(1.0, 0.0, c.w <= 0.0));
}
// 太い線の四隅の深度＝その画素の下の地面（端点の接平面）の深さ（gl LINE_VARY の lineGroundW と同式・2026-11-06「傾けた高速道路の縁がギザギザ」）。
// 端点の深度のままだと手前側の縁が地形の深度テストに食われて波打つ。手前へ寄せるだけ（奥へは押さない）
fn lineGroundW(relW: vec3f, ll: vec2f, dAbs: vec3f, c: vec4f, off: vec2f) -> f32 {
	let up = normalize(liftDir(ll, dAbs));
	let t1 = normalize(cross(up, select(vec3f(1.0, 0.0, 0.0), vec3f(0.0, 1.0, 0.0), abs(up.y) < 0.9)));
	let t2 = cross(up, t1);
	let e = 0.01 * wTrue(c.w);
	let c1 = F.clipT + F.mvp * vec4f(relW + e * t1, 0.0); let c2 = F.clipT + F.mvp * vec4f(relW + e * t2, 0.0);
	if (c1.w <= 0.0 || c2.w <= 0.0) { return c.w; }
	let s0 = toScreen(c); let d1 = toScreen(c1) - s0; let d2 = toScreen(c2) - s0;
	let det = d1.x * d2.y - d1.y * d2.x;
	if (abs(det) < 1e-3) { return c.w; }
	let a = (off.x * d2.y - off.y * d2.x) / det; let b = (d1.x * off.y - d1.y * off.x) / det;
	return max(c.w + min(a * (c1.w - c.w) + b * (c2.w - c.w), 0.0), c.w * 0.5);
}
struct LineEnd { k: f32, j: vec4f, bev: f32, ext: f32 };
// 端 1 つの形（gl LINE_VARY の lineEnd と同式＝MapLibre の LineBucket と同じ選び方）。x→jt→y＝前の点・この端・次の点（start＝始点の端）。
// link＝0：端（line-cap）・1：隣と継ぐ・2：閉じた環の継ぎ目（隣が並びの前後に無い＝丸に倒す）。
// 継ぎは二等分線で切る：j＝切り口（点・線分の側を向く法線）・bev＝bevel の切り線・ext＝四角形を端から伸ばす長さ
fn lineEnd(x: vec2f, jt: vec2f, y: vec2f, h: f32, hp: f32, start: bool, link: u32) -> LineEnd {
	let cj = u32(P.lx.z);
	let capK = cj & 3u; let joinK = (cj >> 2u) & 3u; let ml = f32(cj >> 4u) / 8.0;
	var r: LineEnd; r.k = 0.0; r.j = vec4f(0.0); r.bev = 0.0; r.ext = hp + 1.0;
	if (link == 0u) {   // 端
		if (capK == 1u) { r.ext = 1.0; r.k = 1.0; return r; }   // butt＝端で切る（AA の 1px だけ伸ばす）
		r.k = select(0.0, 2.0, capK == 2u); return r;
	}
	if (link == 2u) { return r; }
	let sx = jScr(x, h); let sj = jScr(jt, h); let sy = jScr(y, h);
	var d0 = sj.xy - sx.xy; var d1 = sy.xy - sj.xy;
	let l0 = length(d0); let l1 = length(d1);
	if (sx.z * sj.z * sy.z < 0.5 || l0 < 1e-4 || l1 < 1e-4) { return r; }   // カメラの背後・画面で長さ 0＝丸（capsule）に倒す
	d0 = d0 / l0; d1 = d1 / l1;
	let sv = d0 + d1; let ls = length(sv);
	if (ls < 1e-3) { return r; }   // 折り返し（180°）＝丸に倒す
	let n = sv / ls;               // 二等分線の法線（前→次の向き）
	let N = select(-n, n, start);  // 線分の側を向く
	r.j = vec4f(sj.xy, N);
	if (joinK == 0u) { r.k = 5.0; return r; }
	let c = dot(n, d1); let mlen = 1.0 / max(c, 1e-6);   // 曲がりの半角の cos・マイターの長さ（半幅の何倍）
	r.bev = sign(dot(d0 - d1, vec2f(-N.y, N.x))) * hp * c;   // 外の角どうしを結ぶ線＝二等分線の点から外へ hp·c
	// miter は限界を超えたら bevel・bevel は限界未満なら miter（見分けられない＝MapLibre と同じ）
	if (r.bev == 0.0 || select(mlen < ml, mlen <= ml, joinK == 1u)) { r.ext = hp * max(1.0, sqrt(max(mlen * mlen - 1.0, 0.0))) + 1.0; r.k = 3.0; return r; }
	r.k = 4.0; return r;
}
@vertex fn vs(
	@location(0) corner: vec2f,
	@location(1) p1: vec2f, @location(2) p2: vec2f,
	@location(3) col: vec4f, @location(4) halfPx: f32, @location(5) offT: vec3f,
) -> LineOut {
	var o: LineOut;
	var hw0 = halfPx; var off0 = offT; var q1 = p1; var q2 = p2;
	var col0 = col; let hwD = select(hw0, P.pz.w, P.pz.y > 0.5);   // ズーム連続（V-Ph3＝S-P1-2・gl LINE_MAIN と同式）：破線の尺の線幅＝floor(z) の線幅（MapLibre の floorwidth）・差し替えない層は作ったタイルの z の値
	if (P.pz.y > 0.5) { hw0 = P.pz.z; }   // 今の z の線幅と色
	if (P.pz.x > 0.5) { col0 = P.pzC; }
	if (P.pzO.x > 0.5) { off0.x = P.pzO.y; }   // 今の z のずらし（破線の列は md の派生が P.tr.w＝同じ値を入れる）
	o.gp = select(vec2f(0.0), vec2f(col.x + col.y * 256.0, col.z + col.w * 256.0) * (255.0 / 65535.0), P.patP.x > 0.5 && P.patP.x < 1.5);   // line-gradient（G-3）＝色の語の 4 バイト → unorm16×2（gl LINE_MAIN と同式）
	var q0 = p1; var q3 = p2; var jf0 = 0u; var dist0 = 0.0;   // LINEX：端と継ぎの相手の点と旗・破線の距離（classic の X 派生と md の派生が差し替える）
	if (P.tr.z != 0.0) { let tr = trLL(F.origin + q1); q0 += tr; q1 += tr; q2 += tr; q3 += tr; }   // line-translate（S-P1-4/5）＝線分ごとに同じだけ（継ぎの相手も）
	let la1 = F.origin + q1; let la2 = F.origin + q2;   // elev 参照用の絶対（粗くて可）
	let rela = deltaToRel(q1); let relb = deltaToRel(q2);
	let da = F.originPt + rela; let db = F.originPt + relb;
	// 標高変位は地形と同じ距離フェード＝遠景の平ら化に追随（無いと地平線に「漂う点線の鎖」）
	let dfa = 1.0 - smoothstep(F.params.y * 0.8, F.params.y * 2.0, distance(F.eye, da));
	let dfb = 1.0 - smoothstep(F.params.y * 0.8, F.params.y * 2.0, distance(F.eye, db));
	// p0.y＜0＝深度だけのリフト（基図・利用者の vector の層＝gl LINE_MAIN と同式・2026-11-11「チルトを深くすると、基図と建物がズレる？」）：位置は地面のまま
	let liftP = max(P.p0.y, 0.0); let liftZ = abs(P.p0.y);
	let ha = (elevL(la1) + liftP) * F.elevP.x * dfa;   // 案A（F.fineP.z＝?lineelev で軽い版）
	let hb = (elevL(la2) + liftP) * F.elevP.x * dfb;
	let relWa = rela + ha * liftDir(la1, da); let relWb = relb + hb * liftDir(la2, db);   // 楕円体＝測地法線
	let wa = F.originPt + relWa; let wb = F.originPt + relWb;
	let ca = F.clipT + F.mvp * vec4f(relWa, 0.0);
	let cb = F.clipT + F.mvp * vec4f(relWb, 0.0);
	let fa = dot(da, F.eye) - 1.0; let fb = dot(db, F.eye) - 1.0;
	if (ca.w <= 0.0 || cb.w <= 0.0) {        // カメラ背後（var o はゼロ初期化済）
		o.front = -1.0; o.pos = vec4f(2.0, 2.0, 2.0, 1.0); return o;
	}
	var sa = toScreen(ca); var sb = toScreen(cb);
	let d = sb - sa; let len = length(d);
	var dirS = vec2f(1.0, 0.0);
	if (len > 1e-6) { dirS = d / len; }
	let perp = vec2f(-dirS.y, dirS.x);   // 画面は y 下向き＝進行方向の右
	// line-offset（#49・glsl.js LINE_MAIN と同式）：端点を perp＋dir×t だけ（t＝角の継ぎ）
	let offPx = off0.x * F.params.w;
	sa += (perp + dirS * off0.y) * offPx; sb += (perp + dirS * off0.z) * offPx;
	let hw = hw0 * F.params.w + 1.0;      // +1px の AA/丸端余白
	// 端と継ぎ（S-P1-1）：丸でない層（P.lx.z≠0）だけ端ごとに形を決め、四角形を端から伸ばす長さ（eA・eB）を変える
	var eA = hw; var eB = hw;
	o.ja = vec4f(0.0); o.jb = vec4f(0.0); o.jk = vec4f(0.0);
	if (P.lx.z > 0.5) {
		let hp = hw0 * F.params.w;
		let lA = select(select(0u, 2u, (jf0 & 4u) != 0u), 1u, (jf0 & 1u) != 0u);   // JF_PREV／JF_RING_PREV（build.ts）
		let lB = select(select(0u, 2u, (jf0 & 8u) != 0u), 1u, (jf0 & 2u) != 0u);   // JF_NEXT／JF_RING_NEXT
		let ra = lineEnd(q0, q1, q2, ha, hp, true, lA);
		let rb = lineEnd(q1, q2, q3, hb, hp, false, lB);
		o.ja = ra.j; o.jb = rb.j; o.jk = vec4f(ra.k, rb.k, ra.bev, rb.bev); eA = ra.ext; eB = rb.ext;
	}
	// 破線（S-P1-3）：模様の位相は地面の長さ（z24 の px）を floor(zoom) の px にして線幅で割る＝MapLibre の tileRatio／floorwidth と同じ。
	// 線分の長さは経緯度から（縦は中点の緯度のメルカトル＝scene.ts の segLen24 と同式）
	o.dd = vec2f(0.0);
	if (P.dashP.y > 0.5 || P.patP.x > 1.5) {   // line-pattern（G-4）の横の位相も同じ（尺は P.patP.y）
		let my = (q2.y - q1.y) * D2R / cos((F.origin.y + (q1.y + q2.y) * 0.5) * D2R) / 6.2831853;
		o.dd = vec2f(dist0, length(vec2f((q2.x - q1.x) / 360.0, my)) * 4294967296.0) * (select(P.patP.y, P.dashP.w, P.dashP.y > 0.5) / max(2.0 * hwD, 1e-3));
	}
	var base = sb; var capSign = 1.0; var ext = eB;
	if (corner.x < 0.5) { base = sa; capSign = -1.0; ext = eA; }
	let posS = base + perp * (hw * corner.y) + dirS * (capSign * ext);
	o.a = sa; o.b = sb; o.halfw = hw0 * F.params.w; o.sp = posS;
	o.color = col0; o.front = min(fa, fb);
	o.fog = fogOf((wa + wb) * 0.5);
	// 端点の深度は対数系＝地形・建物と同じ深度空間（山岳ビューで尾根の向こうを遮蔽）
	// 深度だけの余白（gl LINE_MAIN と同式・2026-11-07）：画素は動かさず、深度テストの点だけ lift＋弦のたるみ（中点の地面−弦）だけ上げる＝市街地（lift>0）限定
	var relDa = relWa; var relDb = relWb; var cda = ca; var cdb = cb;
	if (liftZ > 0.0) {
		// 軽い標高（F.ellP.z＝?elevcheap・LOW_MEM 既定）は 3 点を 1 標本（elev1）で引く＝建物の頂点と同じ扱い。elevQ だと 1 頂点あたり
		// 標本 12×3 が足され、2026-11-07 Mali 実機で #997 公開後に基図 59 枚の最初の描画が 3.9 秒の GPU 待ちに戻った（bldrange=1.5 でも）。
		// 深度の余白は数 m 単位の話＝格子量子化（elevQ）でなく 1 標本でも縁の波打ちは抑えられる。?elevcheap=0 で従来（全機種の既定）
		var ga = 0.0; var gb = 0.0; var gm = 0.0;
		if (F.ellP.z > 0.5) { ga = elev1(la1); gb = elev1(la2); gm = elev1((la1 + la2) * 0.5); } else { ga = elevQ(la1); gb = elevQ(la2); gm = elevQ((la1 + la2) * 0.5); }
		let dz = 2.0 * liftZ - liftP + max(0.0, gm - 0.5 * (ga + gb));   // 地面から 2|lift|＋たるみ（位置のリフトの分は差し引く＝基図の深度は従来と同じ高さ）
		relDa = relWa + (dz * F.elevP.x * dfa) * liftDir(la1, da); relDb = relWb + (dz * F.elevP.x * dfb) * liftDir(la2, db);
		cda = F.clipT + F.mvp * vec4f(relDa, 0.0); cdb = F.clipT + F.mvp * vec4f(relDb, 0.0);
	}
	let wz = select(lineGroundW(relDb, la2, db, cdb, posS - toScreen(cdb)), lineGroundW(relDa, la1, da, cda, posS - toScreen(cda)), corner.x < 0.5);   // 四隅＝その下の地面の深さ（lineGroundW）
	let ndc = vec2f(posS.x / F.viewport.x * 2.0 - 1.0, 1.0 - posS.y / F.viewport.y * 2.0);
	o.pos = vec4f(ndc, log1pS(max(wTrue(wz), 1e-30)) * 1.4426950 * F.params.z * 0.5, 1.0);
	return o;
}
// 端の先の覆い（S-P1-1）：k＝端の形（jk）・e＝端からの距離（先へ正）・q＝端からの位置・j＝切り口・bev＝bevel の切り線。丸い形の時だけ dist（芯からの距離）を端の点からの距離に替える
fn lineTail(k: f32, e: f32, q: vec2f, j: vec4f, bev: f32, hw: f32, dist: ptr<function, f32>) -> f32 {
	if (k == 0.0 || k == 5.0) { *dist = length(q); return 1.0; }   // 丸い端・丸い継ぎ
	if (k == 1.0) { return clamp(0.5 - e * 2.0, 0.0, 1.0); }          // butt＝端で切る
	if (k == 2.0) { return clamp((hw - e) * 2.0 + 0.5, 0.0, 1.0); }   // square＝半幅だけ出す
	if (k == 4.0) { return clamp((abs(bev) - sign(bev) * dot(q, vec2f(-j.w, j.z))) * 2.0 + 0.5, 0.0, 1.0); }   // bevel＝外の角どうしを結ぶ線で切る
	return 1.0;   // miter＝切り口まで伸ばした帯そのもの
}
@fragment fn fs(in: LineOut) -> @location(0) vec4f {
	if (in.front < -0.0015) { discard; }
	let pa = in.sp - in.a; let ba = in.b - in.a;
	var dist = 0.0; var cov = 1.0;
	if (in.jk.x == 0.0 && in.jk.y == 0.0) {   // 丸い端・丸い継ぎ＝capsule（線分までの距離）
		let t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
		dist = length(pa - ba * t);
	} else {   // 端と継ぎ（S-P1-1）：継ぎは二等分線の向こうを捨てる（隣の線分の受け持ち＝同じ線で切るので隙も重なりも無い）
		// 切り口は画素の中心（framebuffer 座標＝左上原点・y 下向き＝toScreen と同じ向き）で測る＝補間した sp の三角形ごとの丸めの差で継ぎ目に二度塗り・塗り残しを出さない。
		// 線の上の画素（ちょうど 0）は始点の側（次の線分）が取る＝終点の側は 0 も捨てる
		let fp = in.pos.xy;
		if (in.jk.x >= 3.0 && dot(fp - in.ja.xy, in.ja.zw) < 0.0) { discard; }
		if (in.jk.y >= 3.0 && dot(fp - in.jb.xy, in.jb.zw) <= 0.0) { discard; }
		let L = length(ba);
		if (L < 1e-3 && (in.jk.x == 1.0 || in.jk.x == 2.0)) { discard; }   // 長さ 0 の線分の角い端＝描かない（MapLibre は重なった点を捨てる）
		var dir = vec2f(1.0, 0.0);
		if (L > 1e-6) { dir = ba / L; }
		let u = dot(pa, dir);
		dist = abs(dot(pa, vec2f(-dir.y, dir.x)));
		let hw0 = max(in.halfw, 0.5);
		// 端の先の位置は、継ぎなら切り口の点から（両隣で同じ点）・端なら自分の端点から
		if (u < 0.0) { cov = lineTail(in.jk.x, -u, in.sp - select(in.a, in.ja.xy, in.jk.x >= 3.0), in.ja, in.jk.z, hw0, &dist); }
		else if (u > L) { cov = lineTail(in.jk.y, u - L, in.sp - select(in.b, in.jb.xy, in.jk.y >= 3.0), in.jb, in.jk.w, hw0, &dist); }
	}
	// 破線（S-P1-3）：画素の線に沿う位相 x を模様の周期に畳み、線の区間までの距離で切る。butt・square＝区間の端で切る（MapLibre の addRegularDash）・
	// round＝区間の芯からの距離を半幅で丸く切る（長さ 0 の線＝点・MapLibre の addRoundDash）。線分の外（端と継ぎ）は端点の位相のまま
	if (P.dashP.y > 0.5) {
		let Ls = length(ba);
		var k = 0.0;
		if (Ls > 1e-3) { k = in.dd.y / Ls; }   // 線幅の倍数／画素（地面の尺＝傾いた画面では縮む＝MapLibre と同じ）
		if (k > 1e-7) {
			var x = in.dd.x + clamp(dot(pa, ba / Ls), 0.0, Ls) * k;
			x -= P.dashP.x * floor(x / P.dashP.x);
			var s = -1e9;   // 線の区間までの符号つき距離（画素・内が正）
			for (var i = 0; i < 4; i++) {
				if (f32(i) >= P.dashP.y) { break; }
				var ab = P.dashI1.zw;
				if (i == 0) { ab = P.dashI0.xy; } else if (i == 1) { ab = P.dashI0.zw; } else if (i == 2) { ab = P.dashI1.xy; }
				for (var m = -1; m <= 1; m++) {
					let xm = x + f32(m) * P.dashP.x;
					if (P.dashP.z > 0.5) { s = max(s, -length(vec2f(max(max(ab.x - xm, xm - ab.y), 0.0) / k, dist))); }
					else { s = max(s, min(xm - ab.x, ab.y - xm) / k); }
				}
			}
			if (P.dashP.z > 0.5) { dist = -s; } else { cov *= clamp(s * 2.0 + 0.5, 0.0, 1.0); }
		}
	}
	// 細線のシャープ化（glsl.js LINE_FS と同式）：幾何幅±0.5px保証＋細さはカバレッジ・フェザー半減
	let hw = max(in.halfw, 0.5);
	var edge = clamp((hw - dist) * 2.0 + 0.5, 0.0, 1.0);
	// ぼかし（S-P1-4/5）：line-blur＝縁（＋半画素）から内へ blur＋1 画素で線形（MapLibre の blur2）・circle-blur＝半径の (1−blur) から縁へ smoothstep（MapLibre の circle）
	if (P.lx.x > 0.0) { edge = select(clamp((hw + 0.5 - dist) / (P.lx.x + 1.0), 0.0, 1.0), 1.0 - smoothstep(hw * (1.0 - P.lx.x), hw, dist), P.lx.y > 0.5); }
	let alpha = edge * cov * min(in.halfw * 2.0, 1.0);
	if (alpha <= 0.0) { discard; }
	// line-gradient（G-3・gl LINE_FS と同式）：画素の進み＝線分の上の位置で始点・終点の進みを補う → 見本の 256 段の真ん中を引く（Level＝一様な流れを要さない）
	var lc = in.color;
	if (P.patP.x > 1.5) {   // line-pattern（G-4・gl LINE_FS と同式）：横＝線に沿う位相（floor(zoom) の線幅の倍数）×画像の高さ÷幅、縦＝線の幅（右が下）。線分の外（端と継ぎ）は位相を延ばす＝隣の線分と続く。line-color は読まない
		let Ls = length(ba);
		var k = 0.0;
		if (Ls > 1e-3) { k = in.dd.y / Ls; }
		let ts = vec2f(textureDimensions(ltTex, 0));
		let x = in.dd.x + dot(pa, ba) / max(Ls, 1e-6) * k;
		let sd = select(0.0, dot(pa, vec2f(-ba.y, ba.x)) / max(Ls, 1e-6), Ls > 1e-6);
		let t = textureSampleLevel(ltTex, ltSamp, vec2f(fract(x * ts.y / ts.x), clamp(0.5 + sd / (2.0 * max(in.halfw, 0.5)), 0.5 / ts.y, 1.0 - 0.5 / ts.y)), 0.0);
		lc = vec4f(select(vec3f(0.0), t.rgb / max(t.a, 1e-6), t.a > 0.0), t.a * P.patP.z);
	} else if (P.patP.x > 0.5) { lc = textureSampleLevel(ltTex, ltSamp, vec2f(mix(in.gp.x, in.gp.y, clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0)) * (255.0 / 256.0) + 0.5 / 256.0, 0.5), 0.0); }
	let a = lc.a * alpha * clamp(1.0 - 1.2 * in.fog, 0.0, 1.0) * P.p0.w;   // p0.w＝クロスフェード×基図の濃さ
	if (a <= 0.003) { discard; }
	let ga = a * P.p0.w;   // ×グローバルα（クロスフェード用・通常1）
	return vec4f(mix(lc.rgb, F.fogColor, in.fog) * ga, ga);
}
`,Bd=`
// テーマパレット（正準既定＝worldpal.js・view.worldHypso で部分上書き）。struct はここ・var<uniform> WP は
// 注入先モジュールが自分の group/binding で宣言（globe=group(0)binding(4)・terrain=group(2)binding(2)＝同一バッファ）。
// vec3 は align16 の踏み抜き防止で全部 vec4f（rgb のみ使用・grat だけ w=α係数）＝10×vec4f=160B
struct WorldPal {
	lowHumid: vec4f, lowArid: vec4f,   // 低地 湿潤/乾燥
	midHumid: vec4f, midArid: vec4f,   // 〜400m 湿潤/乾燥
	ramp1: vec4f, ramp2: vec4f, peak: vec4f, snow: vec4f,   // 400-1300 / 1300-2800 / 2800-4800 / 氷床
	belowSea: vec4f,   // wdepr 専用＝海面下の締め（乗算ティント）
	grat: vec4f,       // レチクル rgb＋α係数
};
fn wetBox(ll: vec2f, b: vec4f) -> f32 {   // b=(lon0,lon1,lat0,lat1)・縁3°ソフト
	return smoothstep(b.x - 3.0, b.x + 3.0, ll.x) * (1.0 - smoothstep(b.y - 3.0, b.y + 3.0, ll.x))
	     * smoothstep(b.z - 3.0, b.z + 3.0, ll.y) * (1.0 - smoothstep(b.w - 3.0, b.w + 3.0, ll.y));
}
fn worldHypsoColor(e: f32, ll: vec2f, clim: vec2f, hasClim: f32) -> vec3f {
	let latD = ll.y;
	var arid: f32; var pol: f32;
	if (hasClim > 0.5) {
		arid = clim.x; pol = clim.y;
	} else {
		let al = abs(latD);
		arid = smoothstep(10.0, 17.0, al) * (1.0 - smoothstep(32.0, 45.0, al));
		var wet = wetBox(ll, vec4f(95.0, 148.0, 17.0, 40.0));
		wet = max(wet, wetBox(ll, vec4f(118.0, 150.0, 40.0, 55.0)));
		wet = max(wet, wetBox(ll, vec4f(-100.0, -70.0, 24.0, 40.0)));
		wet = max(wet, wetBox(ll, vec4f(-63.0, -35.0, -35.0, -15.0)));
		wet = max(wet, wetBox(ll, vec4f(74.0, 95.0, 8.0, 30.0)));
		arid = arid * (1.0 - wet);
		pol = 1.0 - smoothstep(-64.0, -58.0, latD);
	}
	let lowc = mix(WP.lowHumid.rgb, WP.lowArid.rgb, arid);
	let midc = mix(WP.midHumid.rgb, WP.midArid.rgb, arid);
	var c = mix(lowc, midc, smoothstep(0.0, 400.0, e));
	c = mix(c, WP.ramp1.rgb, smoothstep(400.0, 1300.0, e));
	c = mix(c, WP.ramp2.rgb, smoothstep(1300.0, 2800.0, e));
	c = mix(c, WP.peak.rgb, smoothstep(2800.0, 4800.0, e));
	let snow = pol + smoothstep(56.0, 62.0, latD) * smoothstep(1100.0, 1900.0, e);
	c = mix(c, WP.snow.rgb, clamp(snow, 0.0, 1.0));
	return mix(c, vec3f(dot(c, vec3f(0.299, 0.587, 0.114))), 0.10);
}
fn climUV(ll: vec2f) -> vec2f { return vec2f(fract(ll.x / 360.0 + 0.5), 0.5 - ll.y / 180.0); }   // 経度は一周で折り返す（原点相対の経度は ±180 を越えうる）
`,Da=`
${rn}
// 地面の照明（setGroundLighting・Cesium の globe.enableLighting・2026-10-26）：経緯度（deg）の点の東・北・上（世界軸＝ECEF の (x, z, y)）での lambert。
//   cg＝xyz 光へ向く単位ベクトル（世界）・w 0 無し／1 地形の法線（gEN＝勾配 東・北 m/m）／2 楕円体の上向き。cgP＝(倍率, 足す値, 効き 0..1＝距離のフェード済み, 大気の夜側の明るさ)
fn cgLambert(ll: vec2f, gEN: vec2f, cg: vec4f, cgP: vec4f) -> f32 {
	let lr = ll * 0.017453292519943295;
	let cl = cos(lr.y); let sl = sin(lr.y); let co = cos(lr.x); let so = sin(lr.x);
	let L = vec3f(dot(cg.xyz, vec3f(-so, 0.0, co)), dot(cg.xyz, vec3f(-sl * co, cl, -sl * so)), dot(cg.xyz, vec3f(cl * co, sl, cl * so)));
	let n = select(normalize(vec3f(-gEN, 1.0)), vec3f(0.0, 0.0, 1.0), cg.w > 1.5);
	let diff = clamp(max(dot(n, L), 0.0) * cgP.x + cgP.y, 0.0, 1.0);
	return mix(1.0, diff, cgP.z);
}
${Bd}
${Pf}
// 気候場（全球ハイプソの cross-blend）＝terrain 専用 group(2)。未着は dummy（hasClim=P.p2.z=0 で不使用）
@group(2) @binding(0) var climTex: texture_2d<f32>;
@group(2) @binding(1) var climSamp: sampler;
@group(2) @binding(3) var gmRamp: texture_2d<f32>;   // 地面の材質のランプ（n×1・無ければ dummy＝P.tr.x=0 で不使用）
${Pd("gmColor","gmRamp","climSamp")}
@group(2) @binding(2) var<uniform> WP: WorldPal;   // 世界パレット＝globe 側 binding(4) と同一バッファ（同色契約）
struct TerrOut {
	@builtin(position) pos: vec4f,
	@location(0) ll: vec2f,
	@location(1) front: f32,
	@location(2) fog: f32,
	@location(3) h: f32,
	@location(4) cuv: vec2f,   // COG uv（terrain slot の F.cogP＝メッシュ窓→bbox の f64 前計算係数×a_uv）
	@location(5) guv0: vec2f,  // 地面アトラス uv（前景/近/中/遠＝F.gnd0..3）
	@location(6) guv1: vec2f,
	@location(7) guv2: vec2f,
	@location(12) csFog: vec4f,   // Cesium の霧（頂点で色と量・csFogV）＝派生（影 9・切り抜き 10〜11・cw 15）と重ならない番号
	@location(8) guv3: vec2f,
};
// 画素の地上寸法(m)の目安＝緯度の画面微分（fwidth＝x/y 両方向の和・方位に依らず拾う）。経度は使わない：
// 絶対経度の f32 刻み（135°で 1.7m）が深ズームの画素と同オーダー＝揺れる。緯度は 0.4m 刻み・深ズームは下限 2m に埋もれる
fn terrMpp(ll: vec2f) -> f32 { return fwidth(ll.y) * 111320.0; }
@vertex fn vs(@location(0) a_uv: vec2f) -> TerrOut {
	var o: TerrOut;
	let a_ll = F.mesh.xy + F.mesh.zw * a_uv;   // 単位格子 uv→絶対 lon/lat（頂点属性でなく uniform 窓＝窓替えで作り直さない）
	let dDeg = a_ll - F.origin;               // 原点相対 (deg)。renderer は main シーン原点を渡す
	let rel = deltaToRel(dDeg);
	let dir = F.originPt + rel;
	// 遠景は変位を距離フェードで平ら化＝grazing で粗い格子が縦壁に見えるのを消す（glsl.js と同式）
	let df = 1.0 - smoothstep(F.params.y * 0.8, F.params.y * 2.0, distance(F.eye, dir));
	let h = elev(a_ll) * df;
	o.h = h;
	o.ll = a_ll;
	o.cuv = F.cogP.xy + a_uv * F.cogP.zw;
	o.guv0 = F.gnd0.xy + a_uv * F.gnd0.zw;
	o.guv1 = F.gnd1.xy + a_uv * F.gnd1.zw;
	o.guv2 = F.gnd2.xy + a_uv * F.gnd2.zw;
	o.guv3 = F.gnd3.xy + a_uv * F.gnd3.zw;
	let relW = rel + (h * F.elevP.x) * liftDir(a_ll, dir);   // 楕円体＝測地法線
	o.front = select(dot(dir, F.eye) - 1.0, 1.0, dot(F.eye, F.eye) < 1.0);
	o.fog = fogOf(F.originPt + relW);
	o.csFog = csFogV(F.eye * CS_R, (F.originPt + relW) * CS_R, F.farP.w, F.cg.xyz, select(-1.0, 1.0, F.cg.w > 0.5 && F.cgP.w >= 0.0));
	var p = F.clipT + F.mvp * vec4f(relW, 0.0);
	p.z = logDepthZ(p.w);
	o.pos = p;
	return o;
}
@fragment fn fs(in: TerrOut) -> @location(0) vec4f {
	let mpp = terrMpp(in.ll);   // 画素の地上寸法(m)＝下の低地フェード帯の上端。微分は discard より前（一様制御フロー）
	if (in.front < -0.0015) { discard; }   // 接線より少し先まで許容＝地平線に頭を出す高山。遮蔽は深度とフォグ
	if (F.farP.z > 0.5 && F.farP.z < 1.5) {   // 遠景メッシュパス：近窓の内側は近メッシュの担当＝discard（縁の連続は elev() が保証）
		let uvN = (in.ll - F.elevBounds.xy) / F.elevBounds.zw;
		if (uvN.x >= 0.0 && uvN.x <= 1.0 && uvN.y >= 0.0 && uvN.y <= 1.0) { discard; }
	}
	if (F.farP.z < 0.5 && F.nearP.x > 0.5) {   // 主パス：近景層の窓の内側は近景メッシュパス（farP.z=2）の担当＝discard（縁の連続は elevNear の溶かし）
		let uvF = (in.ll - F.nearBounds.xy) / F.nearBounds.zw;
		if (uvF.x >= 0.0 && uvF.x <= 1.0 && uvF.y >= 0.0 && uvF.y <= 1.0) { discard; }
	}
	if (F.farP.z > 1.5 && F.farP.z < 2.5 && F.fineP.x > 0.5) {   // 近景メッシュパス：足元層の窓の内側は足元メッシュパス（farP.z=3）の担当＝discard
		let uvG = (in.ll - F.fineBounds.xy) / F.fineBounds.zw;
		if (uvG.x >= 0.0 && uvG.x <= 1.0 && uvG.y >= 0.0 && uvG.y <= 1.0) { discard; }
	}
	// 海〜低地は地形を透明化し海岸線は精細なベクタに委ねる（粗いメッシュの海岸の崖・平野ノイズを消す）。
	// 帯の上端＝画素 2 個分の標高（1〜100m）：透けた先は海抜0の球の床（同じ地面アトラスを貼る）＝チルトで
	// h·tanθ ずれた二重像になる（京都 40m×60° で堀が 70m ずれて水色の四角が浮く）。ずれが 2px 未満の高さでだけ透かす＝
	// 低ズーム（1px≧50m）は従来の 1〜100m のまま・寄るほど帯が縮む。gl/glsl.js TERRAIN_FS と同式。
	let t = select(smoothstep(1.0, clamp(2.0 * mpp, 2.0, 100.0), in.h), 1.0, F.elevP.w > 0.5);   // 負の標高をそのまま描く DEM（CWT の楕円体高・海底）＝フェード無し（gl TERRAIN_FS u_terrNeg と同じ）
	if (t <= 0.0) { discard; }
	// 北西光の hillshade（前方差分）。歩幅＝アトラス1texel（下限0.004°≈R10 texel＝遠層域の歩幅としても妥当）
	let tsz = vec2f(textureDimensions(elevTex, 0));
	var d = max(0.004, F.elevBounds.w / tsz.y);
	var dTex = F.elevBounds.w / tsz.y;   // アトラス 1 texel（勾配・材質用）
	var shadeK = 1.0;
	let h0 = elev(in.ll);
	if (F.farP.z > 1.5) {   // 近景メッシュパス：歩幅は近景層の 1 texel（下限 0.004° を外す）・陰影の利得は歩幅比で揃える（gl と同式）
		// ただし r16float の刻み q（1024〜2048 m で 1 m）の 32 倍を下限に＝1 texel 差分が丸め 1 段を勾配に化けさせて粒々の陰影になった（2026-10-31・MapLibre 例 adding-3d-models-using-threejs-on-terrain）。低地（q≤1/32 m）は 1 texel のまま
		let q = exp2(floor(log2(max(abs(h0), 1.0))) - 10.0);
		let nbw = select(F.nearBounds.w, F.fineBounds.w, F.farP.z > 2.5);   // 足元メッシュパス（3）は足元層の 1 texel
		dTex = max(nbw / f32(textureDimensions(nearElevTex, 0).y), q * 32.0 / 111320.0);
		shadeK = 0.004 / max(dTex, 1e-6); d = dTex;
	}
	let hx = elev(in.ll + vec2f(d, 0.0)) - h0;
	let hy = elev(in.ll + vec2f(0.0, d)) - h0;
	var shade = clamp(0.82 + (-hx + hy) * 0.0007 * shadeK, 0.45, 1.15);
	var cgK = 1.0;   // 地面の照明（Cesium）＝北西の陰影の代わりに太陽の lambert を画像ごと掛ける
	let gmDh = fwidth(h0);   // 地面の材質の等高線＝標高の画素差（一様な制御の流れで）
	var gmEN = vec2f(0.0);   // 勾配（東・北 m/m）＝地面の照明と材質（傾斜・方位）が使う。アトラスの 1 texel 差分（陰影の 0.004° の下限を使わない＝近景の急斜面が鈍らない）
	if (F.cg.w > 0.5 || P.tr.x > 1.5) {
		let dL = dTex; let hxL = elev(in.ll + vec2f(dL, 0.0)) - h0; let hyL = elev(in.ll + vec2f(0.0, dL)) - h0;
		gmEN = vec2f(hxL / (dL * 111320.0 * max(cos(in.ll.y * 0.017453292519943295), 0.01)), hyL / (dL * 111320.0));
	}
	if (F.cg.w > 0.5) { shade = 1.0; cgK = cgLambert(in.ll, gmEN, F.cg, F.cgP); }
	// 標高ティント：land を高所ほど hypso 色へ寄せる（テーマのノブ・未指定は量0で恒等）。陰影の前
	var landC = mix(P.p0.rgb, P.p1.rgb, clamp(h0 * P.p2.x, 0.0, 1.0) * P.p1.w);
	// 全球ハイプソ（低ズーム帯・p2.y=出現度/p2.z=hasClim）＝globe パスと同色でピッチ不変（gl 側と同式）
	if (P.p2.y > 0.001) {
		let clim = textureSampleLevel(climTex, climSamp, climUV(in.ll), 0.0).rg;
		landC = mix(landC, worldHypsoColor(h0, in.ll, clim, P.p2.z), P.p2.y);
	}
	// 陰影の立ち上がりは従来の 1〜100m 帯のまま（低地＝陰影なしの紙色）：不透明化した分（t≧tS）を「床と同色＝陰影なし」で埋める
	// ＝ t·X + (1−t)·床 が旧 tS·地形 + (1−tS)·床 と一致（床≈landC）。低ズーム（t＝tS）は旧式と恒等
	let tS = smoothstep(1.0, 100.0, in.h);
	var colBase = gndMix0(cogTexMix0(landC * mix(1.0, shade, min(tS / t, 1.0)), in.cuv), in.guv0, in.guv1, in.guv2, in.guv3, in.pos.x);
	if (P.tr.x > 0.5) { let m = gmColor(h0, gmEN, gmDh, P.tr, P.lx, P.dashP); colBase = mix(colBase, m.rgb, m.a); }   // 地面の材質（Cesium の globe.material）＝画像の上・照明の下
	if (F.cg.w > 0.5) { colBase *= F.cgC.rgb * cgK; }   // ユーザ COG／地面アトラス（ラスタ＋3D の塗り）＝陰影の上・フォグの下
	var col = mix(colBase, F.fogColor, in.fog);
	col = mix(col, in.csFog.rgb, in.csFog.a);   // Cesium の霧（800 km より下・globe の csFogL と同じ式）
	return vec4f(col * t * P.p2.w, t * P.p2.w);   // premultiplied（globe基色→地形へ滑らかに）× 球体の不透明度（p2.w）
}
`,es=`
${rn}
// メッシュ被覆マスク（group(2)）：実フットプリントが立つ区（最大4）を uv 正規化で参照し、基図の押し出し
// 建物を伏せる＝同一体積の全面 z-fight を断ちつつ範囲外は残す（GL BUILDING_FS の u_meshMaskN 移植）。
// mparams.count=0（メッシュ無し）なら discard は起きない＝素通し。
struct MaskP { count: vec4u, bbox: array<vec4f, 4> };
@group(2) @binding(0) var<uniform> M: MaskP;
@group(2) @binding(1) var maskTex0: texture_2d<f32>;
@group(2) @binding(2) var maskTex1: texture_2d<f32>;
@group(2) @binding(3) var maskTex2: texture_2d<f32>;
@group(2) @binding(4) var maskTex3: texture_2d<f32>;
@group(2) @binding(5) var maskSamp: sampler;
fn maskedBy(offInv: vec4f, uvOK: vec2f, hit: f32) -> bool {   // offInv.xy=(origin−bboxMin)/span・zw=1/span（空きスロット=uv圏外）
	return uvOK.x >= 0.0 && uvOK.x <= 1.0 && uvOK.y >= 0.0 && uvOK.y <= 1.0 && hit > 0.5;
}
struct BldOut {
	@builtin(position) pos: vec4f,
	@location(0) shade: f32,
	@location(1) front: f32,
	@location(2) fog: f32,
	@location(3) ll: vec2f,   // 絶対 lon/lat＝被覆マスクの uv 参照
};
@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_shade: f32, @location(2) a_anchor: vec2f) -> BldOut {
	var o: BldOut;
	let rel = deltaToRel(a_pos.xy);
	let dir = F.originPt + rel;
	var base = 0.0;   // 基準点の標高で足元を揃える（案A＝描画メッシュ面）。軽い標高（ellP.z）は 1 標本＝if で分ける（select は両方を評価する）
	if (F.ellP.z > 0.5) { base = elev1(F.origin + a_anchor) * F.elevP.x; } else { base = elevQ(F.origin + a_anchor) * F.elevP.x; }
	let h = base + a_pos.z;                              // 地形標高 + 建物高さ
	let relW = rel + h * liftDir(F.origin + a_pos.xy, dir);   // 楕円体＝測地法線
	o.shade = a_shade;
	o.front = select(dot(dir, F.eye) - 1.0, 1.0, dot(F.eye, F.eye) < 1.0);
	o.fog = fogOf(F.originPt + relW);
	// ⚠絶対経緯度を varying で運ばない：f32 ulp≈1.4m(経度139°)がマスクセル境界の画素ジッタ＝深ズームの点描ゴースト。
	// 原点相対の小値を渡し、大きい定数部は MaskP 側（CPU f64 前計算の off）に持たせる（glsl.js BUILDING_VS と同文）。
	o.ll = a_pos.xy;
	var p = F.clipT + F.mvp * vec4f(relW, 0.0);
	p.z = logDepthZ(p.w);
	o.pos = p;
	return o;
}
@fragment fn fs(in: BldOut) -> @location(0) vec4f {
	if (in.front < 0.0) { discard; }
	// 実フットプリントが立つセルだけ基図建物を伏せる（矩形でなく被覆マスク＝空白地帯なし）。GLSL ES の
	// sampler 配列動的添字不可に倣い 4本アンロール（uv は各 bbox 正規化・textureSampleLevel＝FS でも明示 LOD）。
	if (M.count.x > 0u) {
		let uv0 = M.bbox[0].xy + in.ll * M.bbox[0].zw;   // (off,inv)方式＝uv=off+rel×inv（off/invはCPUのf64前計算）
		if (maskedBy(M.bbox[0], uv0, textureSampleLevel(maskTex0, maskSamp, uv0, 0.0).r)) { discard; }
	}
	if (M.count.x > 1u) {
		let uv1 = M.bbox[1].xy + in.ll * M.bbox[1].zw;   // (off,inv)方式＝uv=off+rel×inv（off/invはCPUのf64前計算）
		if (maskedBy(M.bbox[1], uv1, textureSampleLevel(maskTex1, maskSamp, uv1, 0.0).r)) { discard; }
	}
	if (M.count.x > 2u) {
		let uv2 = M.bbox[2].xy + in.ll * M.bbox[2].zw;   // (off,inv)方式＝uv=off+rel×inv（off/invはCPUのf64前計算）
		if (maskedBy(M.bbox[2], uv2, textureSampleLevel(maskTex2, maskSamp, uv2, 0.0).r)) { discard; }
	}
	if (M.count.x > 3u) {
		let uv3 = M.bbox[3].xy + in.ll * M.bbox[3].zw;   // (off,inv)方式＝uv=off+rel×inv（off/invはCPUのf64前計算）
		if (maskedBy(M.bbox[3], uv3, textureSampleLevel(maskTex3, maskSamp, uv3, 0.0).r)) { discard; }
	}
	let c = mix(P.p0.rgb * in.shade, F.fogColor, in.fog);
	return vec4f(c * P.p0.w, P.p0.w);   // ×グローバルα（クロスフェード・通常1＝不変）
}
`,ts=`
${rn}
${Pf}
struct PB { meshOrigin: vec4f, clipMesh: vec4f, alpha: vec4f, pbr0: vec4f, emis: vec4f, lp: vec4f, sh: array<vec4f, 9>, pad: vec4f, ln: vec4f, lt: array<vec4f, 32>, xf: mat3x3f, xt: vec4f, sl0: vec4f, sl1: vec4f, cs: vec4f, csL: vec4f, csC: vec4f, csI: vec4f, eyeRel: vec4f, tint: vec4f, tintB: vec4f, sil: vec4f, cc: vec4f, dr0: vec4f, dr1: vec4f, dr2: vec4f };   // dr0/dr1＝重ねる絵の uv の平面写像（原点相対の位置 → u・v＝float 256〜263）・dr2.x＝重ねる絵あり（set "meshDrape"）   // tint/tintB＝Cesium の Model.color（float 240〜245）：tint＝色 rgba・tintB.x＝混ぜ方（−1 無し・0 HIGHLIGHT・1 REPLACE・間 MIX の量）・tintB.y＝輪郭線の太さ（device px）・sil＝輪郭線の色 rgba（float 248〜251・Model.silhouetteColor）   // eyeRel＝F.eye − meshOrigin（CPU double・float 236〜238）＝toEye を原点相対で組む（近接の裏面判定）   // csL/csC/csI＝Cesium の模型の照明（setMeshLighting・float 224〜235）：csL＝(光へ向く世界系の単位ベクトル, on)・csC＝(光の色×強さ HDR, 一様な環境で L00 が 1 になる倍率)・csI＝(拡散の係数, 鏡面の係数, 鏡面の環境の立方体図あり, その最大 mip)・sh[9] の xyz には Cesium の並びの SH9   // sl0/sl1＝style の light（setLight・float 212〜219）：sl0＝(東, 北, 上, on)・sl1＝(色 rgb, 強さ)／cs.x＝1 で頂点色は sRGB（押し出し＝表示空間の色・float 220）・cs.y＝街明かりの強さ（float 221）・cs.z＝1 で窓の明かりを canvas の α に印す（夜の色 grade の間・float 222）   // xf/xt＝バッチの剛体変換（glTF の rigid アニメ・W4・float 196〜211・xt.w＝on）   // pad＝clipO の枠（断面の派生が clipO に替える）・ln.x＝局所の光源の数（W2）・lt＝8 灯×(A,B,C,D)（light.js localLightsPayload と同じ並び）   // xyz+cullBack, clip錨, alpha.z＝noLift（1＝地形へ持ち上げない）・alpha.w＝drape（1＝DTM 保証域に縛らず持ち上げる・2026-09-22）。
// #46 段 2：pbr0=(metallic, roughness, normalScale, occlusionStrength)・emis=(発光 rgb, fx.pbr の旗)・lp=(太陽の強さ rgb 正規化, 固定光の重み)・sh=空の SH9（sh[0].w＝fill）
@group(2) @binding(0) var<uniform> B: PB;
struct PlOut {
	@builtin(position) pos: vec4f,
	@location(12) wl: vec3f,     // バッチ原点からの位置（m）＝街明かりの窓の格子（派生が使う 4〜8 と重ならない番号）
	@location(0) n: vec3f,       // 実法線（巻き順非依存で表向きへ）
	@location(1) toEye: vec3f,
	@location(2) front: f32,
	@location(13) csFog: vec4f,   // Cesium の霧（頂点で色と量・csFogV）＝派生（uv/col 4〜5・影 4/6・切り抜き 5〜8・wl 12・cw 15）と重ならない番号
	@location(14) ol: vec3f,     // CESIUM_primitive_outline の辺の座標（法線の 4 バイト目の 3 bit）
	@location(3) fog: f32,
};
@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_normal: vec4f) -> PlOut {
	var o: PlOut;
	let ap = select(a_pos, B.xf * a_pos + B.xt.xyz, B.xt.w > 0.5);   // バッチの剛体変換（W4）＝原点相対のまま
	let wp = B.meshOrigin.xyz + ap;                    // 絶対位置（陰影/フォグ/半球判定＝粗くて可）
	let dir = normalize(wp);
	o.wl = ap * 6371000.0;   // 原点相対＝f32 でも mm 級（絶対位置の f32 は 0.4m 刻み＝窓の格子が揺れる）
	o.n = select(a_normal.xyz, B.xf * a_normal.xyz, B.xt.w > 0.5);
	let olK = floor(a_normal.w * 127.0 + 0.5);
	o.ol = vec3f(olK % 2.0, floor(olK / 2.0) % 2.0, floor(olK / 4.0));
	o.toEye = B.eyeRel.xyz - ap;                      // ＝F.eye − wp を原点相対で（≈1 同士の差は float32 で 0.4 m 級の誤差＝数 m まで寄った 1 m 級の模型で裏面判定が乱れた・2026-10-28）
	o.front = select(dot(dir, F.eye) - 1.0, 1.0, dot(F.eye, F.eye) < 1.0);
	o.fog = fogOf(wp);
	o.csFog = csFogV(F.eye * CS_R, wp * CS_R, F.farP.w, F.cg.xyz, select(-1.0, 1.0, F.cg.w > 0.5 && F.cgP.w >= 0.0));
	// 接地リフト（DTM 保証域 P.p0=liftBounds 内だけ・境界 0.05° smoothstep）。域外/bounds無しは h=0（r=1 接地）
	let lat = geoLat(degrees(asin(clamp(dir.y, -1.0, 1.0))));   // β球点→測地緯度（elev/リフト域は測地の台帳。球=恒等）
	let lon = degrees(atan2(dir.z, dir.x));
	let lb = P.p0;   // [lng0, lat0, spanLng, spanLat]
	let inX = smoothstep(0.0, 0.05, min(lon - lb.x, lb.x + lb.z - lon));
	let inY = smoothstep(0.0, 0.05, min(lat - lb.y, lb.y + lb.w - lat));
	var hE = 0.0;   // 軽い標高（F.ellP.z＝?elevcheap=1）は 1 標本（if＝select は両方を評価する）。noLift／焼き済み（B.alpha.z・?bakelift=1）は引かない
	if (B.alpha.z < 0.5) { if (F.ellP.z > 0.5) { hE = elev1(vec2f(lon, lat)); } else { hE = elev(vec2f(lon, lat)); } }
	let h = hE * F.elevP.x * select(inX * inY, 1.0, B.alpha.w > 0.5) * (1.0 - B.alpha.z);   // noLift＝平面に浮かせた統計・drape＝全域で地形に沿わせる
	var p = B.clipMesh + F.mvp * vec4f(ap + h * liftDir(vec2f(lon, lat), dir), 0.0);   // 楕円体＝測地法線
	if (a_normal.w < -0.004) {   // a glTF line's ribbon (gl/glsl.ts LINE_RIBBON): across the line's direction on screen by half its width (CSS px × dpr)
		let lb = floor(-a_normal.w * 127.0 + 0.5); let hp = floor(lb * 0.5) * 0.125 * max(F.params.w, 1.0);
		let dc = F.mvp * vec4f(o.n, 0.0);
		var sd = (dc.xy * p.w - p.xy * dc.w) * F.viewport;
		if (dot(sd, sd) < 1e-30) { sd = vec2f(1.0, 0.0); }
		p = vec4f(p.xy + normalize(vec2f(-sd.y, sd.x)) * ((lb % 2.0) * 2.0 - 1.0) * hp * 2.0 / F.viewport * p.w, p.zw) * 0.999;   // 0.1% nearer the eye (gl/glsl.ts LINE_RIBBON)
		o.ol = vec3f(0.0);
		o.n = o.toEye;   // faces the eye (the FS's back-face test; lines are unlit in Cesium)
	}
	p.z = logDepthZ(p.w);
	o.pos = p;
	return o;
}
// 局所の光源（第 3 波 W2・2026-10-12）＝陰影の係数に足す（gl/glsl.js localLights と同式）。pos＝画素の世界座標（単位球）
fn localLights(n: vec3f, pos: vec3f) -> vec3f {
	var acc = vec3f(0.0);
	let up = normalize(pos);
	let cnt = u32(B.ln.x + 0.5);
	for (var i = 0u; i < 8u; i++) {
		if (i >= cnt) { break; }
		let A = B.lt[i * 4u]; let Bc = B.lt[i * 4u + 1u]; let C = B.lt[i * 4u + 2u]; let D = B.lt[i * 4u + 3u];
		let kind = i32(A.w + 0.5);
		if (kind == 3) { acc += Bc.rgb * Bc.w; }
		else if (kind == 4) { acc += mix(C.rgb, Bc.rgb, dot(n, up) * 0.5 + 0.5) * Bc.w; }
		else {
			let dv = A.xyz - pos; let dist = length(dv); let L = dv / max(dist, 1e-9);
			var at = select(1.0, pow(clamp(1.0 - dist / C.w, 0.0, 1.0), D.z), C.w > 0.0);
			if (kind == 2) { at *= smoothstep(D.x, D.y, dot(-L, C.xyz)); }
			acc += Bc.rgb * Bc.w * at * max(dot(n, L), 0.0);
		}
	}
	return acc;
}
// 夜の街明かり（2026-10-24）＝壁に窓の格子（幅 3.4m × 階 3.6m・窓は横長 80%×45%）を敷き、窓ごとに点く/点かない・色を hash で決める（建物の用途は PLQ に無い＝見た目の夜景）。
// 点く割合は高さで変える（低層 28%→高層 50%・高い所ほど冷たい白の事務所の灯りが混じる）。強さ＝B.cs.y（素の建物メッシュのバッチだけ CPU が詰める・橋は 0）×
// 夜の度合い（太陽高度 +2°→−8°＝日没後の薄暮から点き始めて夜に満ちる）。窓が 1〜3 画素を切る遠くは「点いた割合」の平均へ溶かす（ちらつかない・遠景の高層群も夜に沈まない）。
// wx/wy＝wl の画面微分（fs の頭＝一様制御フローで取る）。戻り＝(色, 混ぜる量)
fn cwHash(c: vec3i) -> f32 {
	var h = (bitcast<u32>(c.x) * 73856093u) ^ (bitcast<u32>(c.y) * 19349663u) ^ (bitcast<u32>(c.z) * 83492791u);
	h = (h ^ (h >> 16u)) * 0x7feb352du; h = (h ^ (h >> 15u)) * 0x846ca68bu; h = h ^ (h >> 16u);
	return f32(h >> 8u) / 16777216.0;
}
fn cityWin(n: vec3f, wl: vec3f, wx: vec3f, wy: vec3f) -> vec4f {
	if (B.cs.y <= 0.0) { return vec4f(0.0); }
	let up = normalize(B.meshOrigin.xyz);
	let k = B.cs.y * (1.0 - smoothstep(-0.139, 0.035, dot(up, F.sun.xyz)));   // sin(−8°)〜sin(+2°)
	if (k <= 0.0) { return vec4f(0.0); }
	if (abs(dot(n, up)) > 0.35) { return vec4f(0.0); }   // 壁だけ（屋根・床は点けない）
	let t = normalize(cross(up, n));
	let sz = vec2f(3.4, 3.6);
	let hgt = dot(wl, up);   // バッチ原点（地面の近く）からの高さ m
	let uv = vec2f(dot(wl, t), hgt) / sz;
	let fw = max(vec2f(length(vec2f(dot(wx, t), dot(wy, t))), length(vec2f(dot(wx, up), dot(wy, up)))) / sz, vec2f(1e-4));
	let cell = vec2i(floor(uv)); let f = fract(uv);
	let face = i32(floor(dot(wl, n) * 0.5));   // 壁ごとに別の並び（壁の面の位置＝面内で一定）
	let h0 = cwHash(vec3i(cell, face)); let h1 = cwHash(vec3i(cell.x + 7919, cell.y - 104729, face + 31));
	let tall = smoothstep(25.0, 90.0, hgt);
	let rate = mix(0.28, 0.5, tall);
	let on = select(0.0, 1.0, h0 < rate);
	let ex = smoothstep(0.10 - fw.x, 0.10 + fw.x, f.x) * (1.0 - smoothstep(0.90 - fw.x, 0.90 + fw.x, f.x));
	let ey = smoothstep(0.28 - fw.y, 0.28 + fw.y, f.y) * (1.0 - smoothstep(0.73 - fw.y, 0.73 + fw.y, f.y));
	let warm = vec3f(1.0, 0.70, 0.36); let cool = vec3f(0.90, 0.94, 1.0);
	let col = mix(warm, cool, select(0.0, 1.0, h1 > mix(0.85, 0.55, tall))) * (0.75 + 0.25 * fract(h1 * 7.0));
	let far = smoothstep(0.35, 0.9, max(fw.x, fw.y));   // 窓の格子が 1〜3 画素を切る＝平均へ
	// 遠景の平均＝暗めの暖色を、4 列×4 階の塊ごとに明るさを揺らす（一様な乳白の面でなく「灯りの並ぶ高層」に読める・塊は数画素以上＝動いても揺れない）
	let blk = cwHash(vec3i(cell.x >> 2u, cell.y >> 2u, face + 97));
	let farCol = vec3f(0.95, 0.70, 0.40) * (0.35 + 0.65 * blk);
	let m = mix(on * ex * ey, rate * 1.1, far);
	return vec4f(mix(col, farCol, far), clamp(m * k, 0.0, 1.0));
}
@fragment fn fs(in: PlOut, @builtin(front_facing) ff: bool) -> @location(0) vec4f {
	let wlx = dpdx(in.wl); let wly = dpdy(in.wl);   // 街明かりの窓の画素幅（discard より前＝一様制御フロー）
	olV = in.ol; olW = fwidth(in.ol);   // the outline's screen-space width (uniform control flow: before any discard)
	let olPk = u32(B.cc.w); olC = vec4f(f32((olPk >> 16u) & 255u), f32((olPk >> 8u) & 255u), f32(olPk & 255u), 255.0 * B.cc.z) / 255.0;   // cc.z = alpha, cc.w = rgb packed 8 bits each
	// 面の幾何法線＝スクリーン微分（FS冒頭＝uniform control flow・discard より前＝fwidth の轍と同じ掟）。
	// toEye = eye − pos で eye は定数＝微分は −dPos、cross で符号相殺＝位置微分の面法線と等価（varying追加不要）。
	let gnRaw = cross(dpdx(in.toEye), dpdy(in.toEye));
	if (in.front < 0.0) { discard; }
	if (B.tintB.w != 0.0 && sign(B.tintB.w) * (in.pos.x - (abs(B.tintB.w) - 1.0) * F.viewport.x) < 0.0) { discard; }   // Cesium splitDirection (tintB.w: sign = side kept, |w| - 1 = the split as a fraction of the width)
	var n = normalize(in.n);
	var ltBase = P.p1.rgb;   // 局所の光源（W2）が掛かる素の色（模型の派生＝頂点色×テクスチャ）
	// 裏面カリングは幾何法線＝面内で一定＝画素毎の揺れゼロ。旧・補間int8法線のdot閾値は「すれすれ帯≈1px」
	// 前提が深ズーム(z20)で崩れ点描ゴーストになった（glsl.js MESH_FS と同文・2026-08-02）。
	// 向きは属性法線で採決＝巻き順非依存。退化面（微分ゼロ）だけ旧判定へフォールバック。
	let g2 = dot(gnRaw, gnRaw);
	var fe = select(dot(n, normalize(in.toEye)), dot(normalize(gnRaw * sign(dot(gnRaw, n))), normalize(in.toEye)), g2 > 1e-18);
	if (B.meshOrigin.w > 1.5) { fe = select(-1.0, max(abs(fe), 1e-3), ff); }   // 2＝Cesium の表裏（gl/glsl.ts MESH_FS と同文）：巻き順で裏を捨て、法線は書かれたまま。glTF の表（反時計回り）＝front_facing
	// 裏面カリング。cullBack=B.meshOrigin.w
	if (B.meshOrigin.w > 0.5 && fe < -0.02) { discard; }
	if (fe < 0.0) { n = -n; }   // 両面時は法線を視線側へ＝裏から見ても陰影が成立
	// 光の向き＝接地の局所系（上＝その画素の動径・東・北）で固定（#46 段 0・2026-09-26）。旧＝地球固定の定数 (-0.35,0.85,0.30)＝
	// 置いた経度で当たる面が変わっていた（東京では北寄り・仰角 64° の光＝その向きを局所系で写した値が下の 0.44/0.90）。
	// 段 2 で太陽（F.sun）＋環境光へ寄せる（本人裁定）。gl/glsl.js は据え置き（WebGPU だけ）。
	let up = normalize(F.eye - in.toEye);   // = 画素の絶対位置の向き（toEye = eye − pos）
	let e0 = cross(vec3f(0.0, 1.0, 0.0), up);
	let east = select(normalize(e0), vec3f(1.0, 0.0, 0.0), dot(e0, e0) < 1e-12);   // 極では退化＝任意の水平
	let north = cross(up, east);
	let L = normalize(north * 0.44 + up * 0.90);   // 斜め上の光＝屋根が立つ
	var d = vec3f(clamp(dot(n, L) * 0.28 + 0.76, 0.72, 1.0));   // 基図建物の屋根1.0/壁0.76に合わせる
	if (B.sl0.w > 0.5) {   // style の light（MapLibre の setLight・2026-10-13）＝gl/glsl.js MESH_FS と同式：局所系で向きを写し mix(1−強さ, 1, max(dot, 0))×色。fx.pbr の経路（太陽＋環境光）には掛けない
		let Ls = normalize(east * B.sl0.x + north * B.sl0.y + up * B.sl0.z);
		d = B.sl1.rgb * mix(1.0 - B.sl1.w, 1.0, clamp(dot(n, Ls), 0.0, 1.0));
	}
	let sunK = 1.0;   // 影の受け手（MESH_SH）は shLit(in.sc) に差し替える＝太陽の項だけ影が消す（環境光は残る）
	var lit = P.p1.rgb * d;   // 従来（fx.pbr off）
	if (B.emis.w > 0.5) {   // #46 段 2＝太陽＋空の環境光（拡散だけ・rough 1・metallic 0）。夜は固定光へ
		var pi: PbrIn; pi.base = srgbDecode(P.p1.rgb); pi.n = n; pi.pos = F.eye - in.toEye; pi.v = normalize(in.toEye); pi.metallic = 0.0; pi.rough = 1.0; pi.ao = 1.0; pi.sunK = sunK; pi.lp = B.lp; pi.fill = B.sh[0].w;
		lit = srgbEncode(min(pbrShade(pi, B.sh), vec3f(1.0)));
	}
	if (B.csL.w > 1.5) { lit = P.p1.rgb; }   // Cesium の unlit（KHR_materials_unlit・法線無し）＝素の色
	else if (B.csL.w > 0.5) {   // Cesium の模型の照明（@ortho-earth/cesium の setMeshLighting）＝固定光・style の light・fx.pbr の代わり
		var ci: CsIn; ci.base = srgbDecode(P.p1.rgb); ci.n = n; ci.pos = F.eye - in.toEye; ci.v = normalize(in.toEye); ci.metallic = B.pbr0.x; ci.rough = B.pbr0.y; ci.ao = 1.0; ci.emissive = vec3f(0.0); ci.sunK = sunK; ci.cc = B.cc.xy; ci.ncc = n;
		lit = csLit(ci, B.sh, B.csL, B.csC, B.csI);
	}
	if (B.csL.w > 2.5) { lit = min(ltBase * csPhong(select(n, -n, B.csL.w > 3.5 && fe < 0.0)), vec3f(1.0)); }   /* clamped as Cesium's 8-bit target does before blending: a translucent face lit over 1 is not brighter */   // czm_phong（entity geometry）・4＝閉じた外観（faceForward なし＝裏は書かれた法線のまま）
	if (B.ln.x > 0.5) { lit += ltBase * localLights(n, F.eye - in.toEye); }   // 局所の光源（W2）
	let cwin = cityWin(select(n, normalize(gnRaw * sign(dot(gnRaw, n))), g2 > 1e-18), in.wl, wlx, wly);   // 夜の街明かり（cs.y＝0 のバッチ＝模型などは何もしない）・向きは面の幾何法線（面内で一定＝角で丸めた頂点法線でも壁は壁）
	lit = mix(lit, cwin.rgb, cwin.w);
	let wm = cwin.w * B.cs.z * (1.0 - in.fog);   // 窓の印＝canvas の α を 1−wm に（後処理の夜の色が窓だけ暗くしない・cs.z＝grade の間だけ）
	var c = mix(lit, F.fogColor, in.fog);
	c = mix(c, in.csFog.rgb, in.csFog.a);   // Cesium の霧
	return vec4f(c, 1.0 - wm);
}
`,C1=`
struct Sky {
	mvp: mat4x4f,
	rayF: vec4f,       // 夜面レイキャスト（#65・旧 invMvp の枠）：視線の基底（CPU f64）
	rayX: vec4f,
	rayY: vec4f,
	eyeC: vec4f,       // xyz＝目・w＝|E|²−1
	gmst: vec2f,       // (cos, sin) 恒星時
	fadeSky: vec2f,    // (fade=出現α, sky=天球倍率)
	viewport: vec2f,   // device px（星の四角形展開）
	pad: vec2f,
	sun: vec3f,        // 夜面の太陽方向（地球固定・単位）
	alpha: f32,        // 夜面の濃さ
};
${Sf}
@group(0) @binding(0) var<uniform> SK: Sky;
@group(1) @binding(0) var<uniform> LC: vec4f;   // 星座線の色（per-buffer）
fn rotY(cel: vec3f) -> vec3f {   // 天球→地球固定＝GMST の y 軸回転（STARS_VS と同式）
	return vec3f(cel.x * SK.gmst.x + cel.z * SK.gmst.y, cel.y, cel.z * SK.gmst.x - cel.x * SK.gmst.y);
}
const QUAD = array<vec2f, 6>(vec2f(-0.5, -0.5), vec2f(0.5, -0.5), vec2f(-0.5, 0.5), vec2f(-0.5, 0.5), vec2f(0.5, -0.5), vec2f(0.5, 0.5));
struct StarOut { @builtin(position) pos: vec4f, @location(0) col: vec4f, @location(1) uv: vec2f };
@vertex fn vsStar(@builtin(vertex_index) vi: u32, @location(0) a_cel: vec3f, @location(1) a_col: vec4f, @location(2) a_size: f32) -> StarOut {
	var o: StarOut;
	let d = rotY(a_cel);
	let p = SK.mvp * vec4f(d, 0.0);
	let corner = QUAD[vi];
	// GL: gl_Position=vec4(p.xy*sky,0,p.w) の点を、corner を size×2/viewport（NDC）で広げる（×p.w＝rasterの/w相殺）
	o.pos = vec4f(p.xy * SK.fadeSky.y + corner * (a_size * 2.0 / SK.viewport) * p.w, 0.0, p.w);
	o.uv = corner;
	o.col = vec4f(a_col.rgb, a_col.a * SK.fadeSky.x);
	return o;
}
@fragment fn fsStar(in: StarOut) -> @location(0) vec4f {
	let r = length(in.uv) * 2.0;                     // GL gl_PointCoord 相当（edge-mid=1・corner=1.41）
	let a = in.col.a * smoothstep(1.0, 0.3, r);      // 柔らかい円盤＝回転中のシマーを抑える
	return vec4f(in.col.rgb * a, a);                 // premultiplied
}
struct LineOut { @builtin(position) pos: vec4f, @location(0) col: vec4f };
@vertex fn vsLine(@location(0) a_cel: vec3f) -> LineOut {
	var o: LineOut;
	let d = rotY(a_cel);
	let p = SK.mvp * vec4f(d, 0.0);
	o.pos = vec4f(p.xy * SK.fadeSky.y, 0.0, p.w);    // w<0（背後）は自然にクリップ
	o.col = vec4f(LC.rgb, LC.a * SK.fadeSky.x);
	return o;
}
@fragment fn fsLine(in: LineOut) -> @location(0) vec4f {
	return vec4f(in.col.rgb * in.col.a, in.col.a);   // premultiplied
}
struct NOut { @builtin(position) pos: vec4f, @location(0) ndc: vec2f };
@vertex fn vsNight(@builtin(vertex_index) vi: u32) -> NOut {
	var o: NOut;
	let p = vec2f(select(-1.0, 3.0, vi == 1u), select(-1.0, 3.0, vi == 2u));
	o.ndc = p;
	o.pos = vec4f(p, 0.0, 1.0);
	return o;
}
@fragment fn fsNight(in: NOut) -> @location(0) vec4f {
	let h = sphereRay(in.ndc, SK.rayF, SK.rayX, SK.rayY, SK.eyeC);   // #65
	if (h.t < 0.0) { discard; }
	let Pt = h.A + h.t * h.d;
	let night = smoothstep(0.08, -0.18, dot(Pt, SK.sun));   // 太陽直下から遠い半球ほど夜
	let a = night * SK.alpha;
	if (a <= 0.001) { discard; }
	return vec4f(vec3f(0.0, 0.02, 0.078) * a, a);           // v1 の夜紺（premultiplied）
}
`,Fd=`
${rn}
struct SOut { @builtin(position) pos: vec4f };
@vertex fn vsStencil(@location(0) a_delta: vec2f) -> SOut {
	var o: SOut;
	// 塗り(fan)を地形にドレープ＝FILL_WGSL と同じ標高変位。elev 無しだと塗りが海抜0の平面に貼られ、
	// 地形に沿う境界線と乖離して浮く（本人報告 2026-08-12・豊浦町ハイライト）。p0.y=線と同じリフト(3m)で一致。
	let ll = F.origin + a_delta;
	let rel = deltaToRel(a_delta);
	let dir = F.originPt + rel;
	let df = 1.0 - smoothstep(F.params.y * 0.8, F.params.y * 2.0, distance(F.eye, dir));
	let h = (elevL(ll) + P.p0.y) * F.elevP.x * df;   // 案A＝overlay 塗りも描画メッシュ面に乗せる（F.fineP.z＝?lineelev で軽い版）
	var relW = rel + h * liftDir(ll, dir);
	// p0.z=1（wdepr＝全球スケールのポリゴン）＝裏半球の頂点を地平円へ射影クランプ＝球体カリング
	// （gl/glsl.js STENCIL_VS u_sphereClip と対＝裏側は円周に縮退・地平線跨ぎは可視部だけを囲む＝
	// 投影折返しの±1巻き数斑を根絶）。通常 overlay は p0.z=0＝完全不変。
	if (P.p0.z > 0.5) {
		var Pt = F.originPt + relW;
		let e2 = dot(F.eye, F.eye);
		if (dot(Pt, F.eye) < 1.0) {
			let Pp = Pt - F.eye * (dot(Pt, F.eye) / e2);
			let lp = length(Pp);
			var t = normalize(vec3f(-F.eye.z, 0.0, F.eye.x));
			if (lp > 1e-6) { t = Pp / lp; }
			Pt = F.eye / e2 + sqrt(max(1.0 - 1.0 / e2, 0.0)) * t;
			relW = Pt - F.originPt;
		}
	}
	// 巻き数で塗る＝fan の形は問わない。クリップ座標のまま（GL[-w,w]→WebGPU[0,w] へ z 写像・深度は off）
	let c = F.clipT + F.mvp * vec4f(relW, 0.0);
	o.pos = vec4f(c.xy, (c.z + c.w) * 0.5, c.w);
	return o;
}
@fragment fn fsNull(in: SOut) -> @location(0) vec4f { return vec4f(0.0); }   // colorWriteMask 0 で無視
struct CoOut { @builtin(position) pos: vec4f };
@vertex fn vsCover(@builtin(vertex_index) vi: u32) -> CoOut {
	var o: CoOut;
	o.pos = vec4f(select(-1.0, 3.0, vi == 1u), select(-1.0, 3.0, vi == 2u), 0.5, 1.0);
	return o;
}
@fragment fn fsCover(in: CoOut) -> @location(0) vec4f {
	return vec4f(P.p1.rgb * P.p1.a, P.p1.a);   // premultiplied 塗り色（DrawP.p1）
}
`,E1=`
${rn}
struct COut { @builtin(position) pos: vec4f, @location(0) ndc: vec2f };
@vertex fn vs(@builtin(vertex_index) vi: u32) -> COut {
	var o: COut;
	let p = vec2f(select(-1.0, 3.0, vi == 1u), select(-1.0, 3.0, vi == 2u));
	o.ndc = p;
	o.pos = vec4f(p, 0.0, 1.0);
	return o;
}
const R2D: f32 = 57.29577951308232;
fn elevAt(uv: vec2f) -> f32 {   // 等高線は edgeFade 無し（GL CONTOUR_FS と同じ・uv 範囲外=0）。uv＝原点相対（#65）
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return 0.0; }
	return textureSampleLevel(elevTex, elevSamp, uv, 0.0).r;
}
fn band(g: f32) -> f32 {   // iso線：整数の g で 1（fwidth で画面一定幅・AA）。勾配ゼロ抑制＝平坦地に等高線の面は無い
	let dd = abs(fract(g + 0.5) - 0.5);
	let fw = fwidth(g);
	let w = fw * 0.5 + 1e-5;
	return (1.0 - smoothstep(0.0, w, dd)) * smoothstep(0.0, 1e-4, fw);
}
@fragment fn fs(in: COut) -> @location(0) vec4f {
	if (P.p1.y <= 0.002 || F.elevP.y < 0.5) { discard; }
	let h = sphereRay(in.ndc, F.rayF, F.rayX, F.rayY, F.eyeC);   // #65：視線は CPU f64 の基底・交点は原点相対 δ で持つ（絶対経緯度を経ない）
	if (h.t < 0.0) { discard; }
	let dl = F.eyeO.xyz + h.t * h.d;
	let dll = deltaLL(dl, F.originPt, F.trig.z, F.eyeO.w, F.ellP.x);   // 経緯度の差（deg・測地）
	let e = elevAt(F.elevOff.xy + dll * F.elevOff.zw);
	let landMask = smoothstep(0.5, 4.0, e);   // 海/データ無し(≈0)は等高線を出さない
	if (landMask <= 0.0) { discard; }
	let line = max(band(e / P.p0.w) * 0.2, band(e / P.p1.x) * 0.4);   // 主曲線ごく薄・計曲線も薄め
	let a = line * landMask * P.p1.y;
	if (a <= 0.003) { discard; }
	return vec4f(P.p0.rgb * a, a);   // premultiplied
}
`,Bf=`
struct Globe {
	rayF: vec4f,         // 全画面レイキャスト（#65・旧 invMvp の枠）：視線の基底（CPU f64・camera.js viewRays）
	rayX: vec4f,
	rayY: vec4f,
	eyeC: vec4f,         // xyz＝目の位置・w＝|E|²−1（f64）
	land: vec4f,
	atmo: vec4f,   // 大気色 rgb + 強さ(a)
	elevBounds: vec4f,   // 全球ハイプソ用（R90 全球窓の被覆）
	whP: vec4f,          // (出現度whK, hasElev, ell, hasClim)
	seaC: vec4f,         // 海の平色（NE流の淡青）
	farBounds: vec4f,    // far床（世界帯z<8=R90全球固定窓）の被覆＝近窓の外を受ける（タイラーのバグ根治 9/2）
	farP: vec4f,         // (hasFar, 近窓縁フェード幅deg, Cesium の霧の濃さ＝csFogDensity, 0)
	misc: vec4f,         // (globeAlpha=球体の不透明度・本人裁定 2026-09-13, Cesium の地面の大気の効き 0..1, Cesium の大気を点ける 0/1, Cesium の空の大気 0/1)＝view.csAtmo（../csatmo.ts）
	sun: vec4f,          // 大気散乱（#46 段 1）：xyz＝太陽の方向（地球固定）・w＝散乱を点ける度合い（fx.atmosphere × 全球ハイプソの出現度＝0 は従来のリム光と霞）
	anc: vec4f,          // 錨（#65）：xyz＝シーン原点の β単位球の点 O・w＝cos β0
	anc2: vec4f,         // xy＝原点 lon/lat（deg・測地）・z＝β0（rad）
	eyeO: vec4f,         // xyz＝目−O（f64 で引く）＝交点 δ＝eyeO＋t·d（原点相対・f32 で mm 級）
	atmP: vec4f,         // (太陽の強さ, 露出, 球の床の空気遠近の強さ 0..1＝地理の読みやすさのため既定は半分, 帯の幅 k＝殻を k 倍に広げ係数を 1/k＝色は物理のまま)
	cogOff: vec4f,       // 球の床の uv 係数（f64 前計算・#65）：ユーザ COG＝(原点の uv, 1/span)＝uv＝off＋δll·inv
	gndOff0: vec4f,      // 地面アトラス（前景/近/中/遠）＝同形
	gndOff1: vec4f,
	gndOff2: vec4f,
	gndOff3: vec4f,
	elevOff: vec4f,      // 近窓の標高（海面下 fsWdepr）＝同形
	cg: vec4f,           // 地面の照明（setGroundLighting・2026-10-26）＝Frame.cg と同形
	cgP: vec4f,
	cgC: vec4f,
	gm: vec4f,           // 地面の材質（setGroundMaterial・2026-10-28）＝terrain の P.tr/P.lx/P.dashP と同形（GM_WGSL）
	gmC: vec4f,
	gmP: vec4f,
	ugC: vec4f,          // 地下から見た球の裏面（Cesium の globe.undergroundColor）：rgb＋α・α<0＝切
	ugNF: vec4f,         // その α の距離 (near, nearValue, far, farValue)・距離は世界単位
	csHsb: vec4f,        // xyz＝空の大気の色相・彩度・明るさのずらし（Cesium の skyAtmosphere.hueShift…・csHsbShift）
};
@group(0) @binding(0) var<uniform> G: Globe;
// 地面の照明（setGroundLighting・Cesium の globe.enableLighting・2026-10-26）：経緯度（deg）の点の東・北・上（世界軸＝ECEF の (x, z, y)）での lambert。
//   cg＝xyz 光へ向く単位ベクトル（世界）・w 0 無し／1 地形の法線（gEN＝勾配 東・北 m/m）／2 楕円体の上向き。cgP＝(倍率, 足す値, 効き 0..1＝距離のフェード済み, 大気の夜側の明るさ)
fn cgLambert(ll: vec2f, gEN: vec2f, cg: vec4f, cgP: vec4f) -> f32 {
	let lr = ll * 0.017453292519943295;
	let cl = cos(lr.y); let sl = sin(lr.y); let co = cos(lr.x); let so = sin(lr.x);
	let L = vec3f(dot(cg.xyz, vec3f(-so, 0.0, co)), dot(cg.xyz, vec3f(-sl * co, cl, -sl * so)), dot(cg.xyz, vec3f(cl * co, sl, cl * so)));
	let n = select(normalize(vec3f(-gEN, 1.0)), vec3f(0.0, 0.0, 1.0), cg.w > 1.5);
	let diff = clamp(max(dot(n, L), 0.0) * cgP.x + cgP.y, 0.0, 1.0);
	return mix(1.0, diff, cgP.z);
}
${Pf}
${Sf}
// 全球ハイプソ：標高（R90全球窓）＋気候場。未着/K=0 は dummy（whP が使用をゲート）
@group(0) @binding(1) var gElevTex: texture_2d<f32>;
@group(0) @binding(2) var gSamp: sampler;
@group(0) @binding(3) var gClimTex: texture_2d<f32>;
@group(0) @binding(4) var<uniform> WP: WorldPal;   // 世界パレット＝terrain 側 binding(2) と同一バッファ（同色契約）
@group(0) @binding(5) var gFarTex: texture_2d<f32>;   // far床（未使用時は dummy。farP.x=0 ガード）
// ユーザ COG（terrain 側 group(2) binding(3-4) と同じ素材・低地は terrain の t フェードで抜けるためここが床）
@group(0) @binding(6) var gCogTex: texture_2d<f32>;
@group(0) @binding(7) var<uniform> GCG: GCogP;
struct GCogP { bbox: vec4f, p: vec4f };   // p＝(has, 組か, 境の u, 半テクセル)＝Cog0P と同じバッファ
// 地面アトラス（近/中/遠）＝基球の床（真俯瞰 2D の下地・地形の低地フェードの穴）。絶対経緯度→uv・行0＝北
@group(0) @binding(8) var gGnd0: texture_2d<f32>;
@group(0) @binding(9) var gGnd1: texture_2d<f32>;
@group(0) @binding(10) var gGnd2: texture_2d<f32>;
@group(0) @binding(11) var<uniform> GGD: GGndP;
@group(0) @binding(12) var gGnd3: texture_2d<f32>;
@group(0) @binding(13) var gGmRamp: texture_2d<f32>;   // 地面の材質のランプ（無ければ dummy＝G.gm.x=0 で不使用）
${Pd("gGmColor","gGmRamp","gSamp")}
struct GGndP { w0: vec4f, w1: vec4f, w2: vec4f, w3: vec4f, p: vec4f };   // GndP と同じバッファ（p.y＝分割の画面 x）
${Sd}
${Bd}
const R2Dg: f32 = 57.29577951308232;
fn gElevFar(ll0: vec2f) -> f32 {   // far床＝近窓の外の受け（GL elevFar と同式）
	if (G.farP.x < 0.5) { return 0.0; }
	let ll = vec2f(ll0.x - 360.0 * floor((ll0.x + 180.0) / 360.0), ll0.y);   // 経度を -180..180 へ（原点相対の経度は ±180 を越えうる）
	let uv = (ll - G.farBounds.xy) / G.farBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return 0.0; }
	return textureSampleLevel(gFarTex, gSamp, uv, 0.0).r;
}
fn gElevAt(ll: vec2f) -> f32 { return gElevUV((ll - G.elevBounds.xy) / G.elevBounds.zw, ll); }
fn gElevUV(uv0: vec2f, ll: vec2f) -> f32 {   // uv＝原点相対で作った近窓の uv（#65）・ll＝far 床の受け（粗くて可）
	// 全球の窓（R90＝経度幅 360°）は経度が一周＝uv.x を折り返す。原点（最初の視点）から 180° 超回った先は原点相対の uv/経度が窓の外
	//（例 原点 138°E→米州で 276°）に出て far 床（世界帯では未読込＝0）へ落ち、陸が海色に抜けた（本人 2026-10-01「回すと欠ける」）
	var uv = uv0;
	if (G.elevBounds.z > 359.0) { uv.x = fract(uv.x); }
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return gElevFar(ll); }
	var fade = 1.0;
	if (G.farP.y > 0.0) {   // 近窓縁＝far値へ溶かす（R90全球窓=0＝従来どおり）
		let w = vec2f(G.farP.y) / G.elevBounds.zw;
		fade = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return mix(gElevFar(ll), textureSampleLevel(gElevTex, gSamp, uv, 0.0).r, fade);
}
// ── 大気散乱（#46 段 1・2026-09-26）＝Rayleigh＋Mie の単散乱・Nishita 流のレイマーチ。単位＝地球半径（1.0）。誇張しない＝実寸の殻と実測の係数。
// 視線 ATM_N 段・各段から太陽への透過は ATM_NS 段。太陽の方向は G.sun.xyz（地球固定）。露出＝1−exp(−L×露出)・出口で sRGB 符号化。
// 点ける度合い G.sun.w＝0 なら呼ばれない（従来のリム光と霞）。fsWdepr も同じ関数＝球の床と画素一致。
// 帯の幅 k＝G.atmP.w（本人裁定 2026-09-26＝4）：殻の上端とスケール高を k 倍・散乱係数を 1/k＝光学的厚みは不変＝色と明るさは物理のまま、帯の幅だけ k 倍
//（実寸 100 km は z2 で 1〜2px＝「寂しい」。k=4 で 6〜8px・旧リム光 1.09R は k≈6 相当）
const ATM_RT0: f32 = 0.0157;                         // 大気の上端 ≈ 100 km（半径比）
const ATM_HR0: f32 = 0.001256;                       // Rayleigh のスケール高 8 km
const ATM_HM0: f32 = 0.000188;                       // Mie 1.2 km
const ATM_BR0: vec3f = vec3f(36.9, 86.0, 210.9);     // Rayleigh 散乱係数（5.8/13.5/33.1 e-6 /m × 6371 km）
const ATM_BM0: f32 = 133.8;                          // Mie 散乱（21e-6 /m）
const ATM_BME0: f32 = 147.2;                         // Mie 消散（散乱×1.1）
fn atmK() -> f32 { return max(G.atmP.w, 1.0); }
fn atmRt() -> f32 { return 1.0 + ATM_RT0 * atmK(); }
const ATM_G: f32 = 0.76;                             // Mie の非対称
const ATM_N: i32 = 8;
const ATM_NS: i32 = 3;
struct AtmR { L: vec3f, T: vec3f };
// 球（半径 r）と半直線 o+t·d（d は単位）の交点 (t0,t1)。交わらなければ (-1,-1)
fn atmShell(o: vec3f, d: vec3f, r: f32) -> vec2f {
	let b = dot(o, d); let c = dot(o, o) - r * r; let h = b * b - c;
	if (h < 0.0) { return vec2f(-1.0); }
	let sq = sqrt(h);
	return vec2f(-b - sq, -b + sq);
}
fn atmDensity(p: vec3f) -> vec2f { let h = max(length(p) - 1.0, 0.0) / atmK(); return vec2f(exp(-h / ATM_HR0), exp(-h / ATM_HM0)); }
// p から太陽の方向へ上端までの光学的厚み（Rayleigh, Mie）。地球に遮られれば ∞ 扱い
fn atmOptSun(p: vec3f, s: vec3f) -> vec2f {
	let b = dot(p, s);
	if (b < 0.0 && dot(p, p) - b * b < 1.0) { return vec2f(1e9); }   // 最接近が前方かつ球の中＝地球の影
	let sh = atmShell(p, s, atmRt());
	let ds = max(sh.y, 0.0) / f32(ATM_NS);
	var od = vec2f(0.0);
	for (var i = 0; i < ATM_NS; i++) { od += atmDensity(p + s * (ds * (f32(i) + 0.5))) * ds; }
	return od;
}
// o+t·d の t∈[t0,t1] を積分。戻り＝散乱光 L（リニア・放射輝度）と透過率 T（rgb）
fn atmScatter(o: vec3f, d: vec3f, t0: f32, t1: f32, s: vec3f) -> AtmR {
	let mu = dot(d, s);
	let phR = 3.0 / (16.0 * 3.14159265) * (1.0 + mu * mu);
	let g2 = ATM_G * ATM_G;
	let phM = 3.0 / (8.0 * 3.14159265) * (1.0 - g2) * (1.0 + mu * mu) / ((2.0 + g2) * pow(1.0 + g2 - 2.0 * ATM_G * mu, 1.5));
	let ds = (t1 - t0) / f32(ATM_N);
	let BR = ATM_BR0 / atmK(); let BM = ATM_BM0 / atmK(); let BME = ATM_BME0 / atmK();
	var odV = vec2f(0.0); var sumR = vec3f(0.0); var sumM = vec3f(0.0);
	for (var i = 0; i < ATM_N; i++) {
		let p = o + d * (t0 + ds * (f32(i) + 0.5));
		let dn = atmDensity(p) * ds;
		odV += dn;
		let od = odV + atmOptSun(p, s);
		let tr = exp(-(BR * od.x + vec3f(BME * od.y)));
		sumR += tr * dn.x; sumM += tr * dn.y;
	}
	var r: AtmR;
	r.L = (sumR * BR * phR + sumM * BM * phM) * G.atmP.x;
	r.T = exp(-(BR * odV.x + vec3f(BME * odV.y)));
	return r;
}
fn atmTone(L: vec3f) -> vec3f { return srgbEncodeG(vec3f(1.0) - exp(-L * G.atmP.y)); }
fn srgbEncodeG(c: vec3f) -> vec3f { let x = max(c, vec3f(0.0)); return select(1.055 * pow(x, vec3f(1.0 / 2.4)) - 0.055, x * 12.92, x <= vec3f(0.0031308)); }
fn srgbDecodeG(c: vec3f) -> vec3f { let x = max(c, vec3f(0.0)); return select(pow((x + 0.055) / 1.055, vec3f(2.4)), x / 12.92, x <= vec3f(0.04045)); }
// 球に当たった画素の空気遠近＝base（表示空間）を透過率で減らし散乱光を足す（リニアで合成し戻す）。k＝点ける度合い（従来の霞と混ぜる）
fn atmGround(base: vec3f, A: vec3f, Pt: vec3f, viewDir: vec3f, k: f32) -> vec3f {
	let ndv = clamp(dot(Pt, viewDir), 0.0, 1.0);
	let haze = pow(1.0 - ndv, 3.0);
	let old = mix(base, G.atmo.rgb, haze * G.atmo.a * 0.9);
	if (k <= 0.0) { return old; }
	let dn = normalize(Pt - A);
	let sh = atmShell(A, dn, atmRt());
	let t0 = max(sh.x, 0.0); let t1 = length(Pt - A);
	let r = atmScatter(A, dn, t0, t1, G.sun.xyz);
	let kg = G.atmP.z;   // 床の空気遠近の強さ（宇宙から見た陸の青い霞は物理どおりだと段彩が読みにくい＝既定は半分・view.atmGround で調整）
	// 露出のトーン（1−exp）は散乱光だけに掛ける＝地の色（表示用の段彩）は透過率で減らすだけ（トーンまで掛けると 0.91→0.6 に潰れる・2026-09-26 実機）
	let lin = srgbDecodeG(base) * mix(vec3f(1.0), r.T, kg) + (vec3f(1.0) - exp(-r.L * G.atmP.y)) * kg;
	let phys = srgbEncodeG(min(lin, vec3f(1.0)));
	return mix(old, phys, k);
}
struct GOut { @builtin(position) pos: vec4f, @location(0) ndc: vec2f };
@vertex fn vs(@builtin(vertex_index) vi: u32) -> GOut {
	var o: GOut;
	let p = vec2f(select(-1.0, 3.0, vi == 1u), select(-1.0, 3.0, vi == 2u));
	o.ndc = p;
	o.pos = vec4f(p, 0.0, 1.0);
	return o;
}
// 球の床が深度を書く変種（view.globeDepth・gl の u_gDepth と同じ）：G.farP.w＝0.5·logCoef。不透明な地面（α≥0.5）だけ球の交点の対数深度・他は 1（＝消した値）。
// 光線は t あたり clip w が 1 増える（viewRays の正規化・f64 の mvp）＝w＝t。地下の目（裏面）は書かない
struct GFragD { @location(0) c: vec4f, @builtin(frag_depth) d: f32 };
@fragment fn fsDepth(in: GOut) -> GFragD {
	var o: GFragD;
	let c = globeColor(in);
	o.d = 1.0;
	let h = sphereRay(in.ndc, G.rayF, G.rayX, G.rayY, G.eyeC);
	if (h.t > 0.0 && c.a >= 0.5) { o.d = clamp(log2(1.0 + h.t) * G.farP.w, 0.0, 1.0); }   // 深度は手前の面の α で（裏面は模型の後ろ）
	o.c = globeBack(in, c);
	return o;
}
@fragment fn fs(in: GOut) -> @location(0) vec4f { return globeBack(in, globeColor(in)); }
// 球の裏面（Cesium の translucency の backFace・G.cgC.w）：手前の地面の色の穴（colorToAlpha）の向こう＝遠い根の床の画像を下に敷く（霞・照明なし・gl と同じ）
// a ground atlas window at the origin-relative lon/lat dll: xy = its uv, z = its weight (1 inside, fading to 0 over the outer 4%, 0 outside).
// An edge at a pole is no edge of the ground (the pole cap is in the window) and keeps the weight: faded there, the coarsest window let
// the floor through (a dark smudge at the pole). u is not wrapped (#1063): a window a turn wide or more holds imagery only in −180…180,
// so the longitude is folded into that range instead (#1065, below)
fn gndWin(dll: vec2f, off: vec4f) -> vec3f {
	// a window a turn wide or more (globe zoom) holds imagery only for lon −180…180, but dll is relative to the floor anchor (the view
	// centre since #1062): anchor ± 180° reaches past ±180 → fold that lon back by a turn (else the far side samples empty atlas = navy)
	var dl = dll;
	if (abs(off.z) * 360.0 <= 1.001) { let lon = G.anc2.x + dl.x; if (lon < -180.0) { dl.x += 360.0; } else if (lon > 180.0) { dl.x -= 360.0; } }
	let u = off.xy + dl * off.zw;
	let vS = off.y + (-90.0 - G.anc2.y) * off.w; let vN = off.y + (90.0 - G.anc2.y) * off.w;
	let e0 = select(u.y, 1.0, min(abs(vS), abs(vN)) < 1e-3 && u.y >= -1e-3);
	let e1 = select(1.0 - u.y, 1.0, min(abs(vS - 1.0), abs(vN - 1.0)) < 1e-3 && u.y <= 1.0 + 1e-3);
	let ex = min(u.x, 1.0 - u.x);
	return vec3f(u, clamp(min(ex, min(e0, e1)) / 0.04, 0.0, 1.0));
}
// the ground atlas (up to 4 windows, finest first) at the origin-relative lon/lat dll, premultiplied: one copy for the near side
// (globeColor) and the far side (globeBack), so a change to the window weights reaches both (#1061 had to patch two copies)
fn gndAtlas(dll: vec2f, px: f32) -> vec4f {
	let k0 = gndWin(dll, G.gndOff0); let k1 = gndWin(dll, G.gndOff1); let k2 = gndWin(dll, G.gndOff2); let k3 = gndWin(dll, G.gndOff3);
	let w0 = k0.z;
	let w1 = select(0.0, k1.z, GGD.p.x > 1.5);
	let w2 = select(0.0, k2.z, GGD.p.x > 2.5);
	let w3 = select(0.0, k3.z, GGD.p.x > 3.5);
	let g0 = textureSampleLevel(gGnd0, gSamp, gndUV0(k0.xy, px, GGD.p.y), 0.0);
	let g1 = textureSampleLevel(gGnd1, gSamp, gndUV0(k1.xy, px, GGD.p.y), 0.0);
	let g2 = textureSampleLevel(gGnd2, gSamp, gndUV0(k2.xy, px, GGD.p.y), 0.0);
	let g3 = textureSampleLevel(gGnd3, gSamp, gndUV0(k3.xy, px, GGD.p.y), 0.0);
	return mix(mix(mix(mix(vec4f(0.0), g3, w3), g2, w2), g1, w1), g0, w0);
}
fn globeBack(in: GOut, c: vec4f) -> vec4f {
	if (G.cgC.w < 0.5 || c.a >= 0.999) { return c; }
	let h = sphereRay(in.ndc, G.rayF, G.rayX, G.rayY, G.eyeC);
	if (h.t <= 0.0 || h.disc < 0.0) { return c; }
	let t2 = (-h.bb + sqrt(h.disc)) / (2.0 * h.aa);
	let dll = deltaLL(G.eyeO.xyz + t2 * h.d, G.anc.xyz, G.anc.w, G.anc2.z, G.whP.z);
	var b = vec4f(G.land.rgb * G.land.a, G.land.a);
	if (GGD.p.x > 0.5) {
		let gc = gndAtlas(dll, in.pos.x);
		b = b * (1.0 - gc.a) + gc;
	}
	return c + b * G.misc.x * (1.0 - c.a);
}
fn globeColor(in: GOut) -> vec4f {
	let h = sphereRay(in.ndc, G.rayF, G.rayX, G.rayY, G.eyeC);   // #65：視線は CPU f64 の基底・交点は桁落ちなし
	let A = h.A; let d = h.d; let aa = h.aa; let bb = h.bb; let cc = h.cc;
	let aDotd = bb * 0.5; let tstar = -aDotd / aa;
	var t = h.t;
	var ug = false;   // 目が球の中（地下）＝前方の遠い根＝球の裏面（Cesium の globe.undergroundColor・gl と同じ）
	let disc = bb * bb - 4.0 * aa * cc;
	if (t < 0.0 && G.ugC.a >= 0.0 && cc < 0.0 && disc >= 0.0) { t = (-bb + sqrt(disc)) / (2.0 * aa); ug = true; }
	// 地面の材質の等高線用 fwidth(標高)＝ここ（空の return より前＝一様な制御の流れ）で。WGSL の掟：微分は画素ごとの分岐の後では呼べず、
	// Tint が 'fwidth' must only be called from uniform control flow でパイプラインごと落とす（Metal の実 WebGPU で地球が真っ黒）。naga は見逃す
	var gmDe = 0.0;
	if (G.gm.x > 0.5 && G.whP.y > 0.5) {
		let dllS = deltaLL(G.eyeO.xyz + max(t, 0.0) * d, G.anc.xyz, G.anc.w, G.anc2.z, G.whP.z);
		gmDe = fwidth(gElevAt(G.anc2.xy + dllS));
	}
	if (t < 0.0) {                             // 前方に球ヒット無し＝空：地平の霞から宇宙へ連続減衰
		if (G.misc.z > 0.5) {   // Cesium の空の大気（gl と同じ）
			if (G.misc.w < 0.5) { discard; }
			let cs = csSkyL(A * CS_R, normalize(d), 0.0, G.cg.xyz, select(-1.0, G.cgP.w, G.cg.w > 0.5), G.csHsb.xyz);   // lit by the sun with the globe's lighting (Cesium's dynamic atmosphere)
			if (cs.a <= 0.002) { discard; }
			return cs;
		}
		let lenA = length(A);
		var m = lenA;
		if (tstar > 0.0) { m = sqrt(max((cc + 1.0) - aDotd * aDotd / aa, 0.0)); }
		var g = 1.0 - smoothstep(1.0, 1.09, m);
		g = g * (1.0 - smoothstep(0.0, 0.55, dot(normalize(d), A / lenA)));
		let limbCol = mix(G.land.rgb, G.atmo.rgb, G.atmo.a * 0.9);
		let oa = g * g * mix(G.atmo.a, 1.0, g);
		let old = vec4f(mix(G.atmo.rgb, limbCol, g) * oa, oa);   // premultiplied（従来のリム光）
		let k = G.sun.w;
		if (k <= 0.0) { if (g <= 0.0 || G.atmo.a <= 0.0) { discard; } return old; }   // 大気の強さ 0（MapLibre の口＝sky の無い style）＝リム光も描かない（B5・gl と同じ）
		// 大気散乱（#46 段 1）：大気殻を通る区間だけ積分。殻の外＝宇宙＝discard（星がそのまま）。星は透過率のぶん透ける（α＝1−平均透過率）
		let dn = normalize(d);
		let sh = atmShell(A, dn, atmRt());
		var phys = vec4f(0.0);
		if (sh.y > 0.0) {
			let r = atmScatter(A, dn, max(sh.x, 0.0), sh.y, G.sun.xyz);
			let a = clamp(1.0 - (r.T.x + r.T.y + r.T.z) / 3.0, 0.0, 1.0);
			phys = vec4f(atmTone(r.L), a);
		}
		let o = mix(old, phys, k);
		if (o.a <= 0.002) { discard; }
		return o;
	}
	let Pt = A + t * d;                                                       // 絶対（霞・大気・低ズームの粗い用途）
	let dll = deltaLL(G.eyeO.xyz + t * d, G.anc.xyz, G.anc.w, G.anc2.z, G.whP.z);   // 原点相対の経緯度差（deg・測地）＝uv の正本（#65）
	let ll = G.anc2.xy + dll;                                                  // 絶対経緯度（粗くて可＝ハイプソ・気候）
	var base = G.land.rgb;
	// 床の不透明度（B5・gl の ba と同じ）＝G.land.a。透明を明示した地図（clearAlpha・Cesium の globe.baseColor TRANSPARENT）だけ CPU が land.a を載せる（他は 1＝従来とビット同一）
	var ba = mix(G.land.a, 1.0, G.whP.x);
	if (G.whP.x > 0.001 && G.whP.y > 0.5) {   // 全球ハイプソ：標高×気候→配色＋陰影（gl/glsl.js GLOBE_FS と同式）
		let e = gElevAt(ll);
		let tsz = vec2f(textureDimensions(gElevTex, 0));
		let dstep = G.elevBounds.w / tsz.y;
		let hx = gElevAt(ll + vec2f(dstep, 0.0)) - e;
		let hy = gElevAt(ll + vec2f(0.0, dstep)) - e;
		let shade = select(clamp(0.86 + (-hx + hy) * 0.00013, 0.62, 1.08), 1.0, G.cg.w > 0.5);   // 地面の照明（Cesium）の間は陰影は lambert が受け持つ
		let landK = smoothstep(0.2, 4.0, e);   // 海(=0クランプ)↔陸の境（低平地を海に沈めない・干拓地級のみ海側）
		let clim = textureSampleLevel(gClimTex, gSamp, climUV(ll), 0.0).rg;
		let hyp = mix(G.seaC.rgb, worldHypsoColor(e, ll, clim, G.whP.w) * shade, landK);
		base = mix(base, hyp, G.whP.x);
	}
	if (GCG.p.x > 0.5) {   // ユーザ COG（uv＝原点相対の係数＝f32 の絶対経緯度を経ない・#65）
		let cuv = G.cogOff.xy + dll * G.cogOff.zw;
		if (cuv.x >= 0.0 && cuv.x <= 1.0 && cuv.y >= 0.0 && cuv.y <= 1.0) {
			var cv = 1.0 - cuv.y;
			if (GCG.p.y > 0.5) { cv = clamp(cv * 0.5, GCG.p.w, 0.5 - GCG.p.w) + select(0.0, 0.5, cuv.x >= GCG.p.z); }   // 見比べ（cogPairV と同式）
			let cc = textureSampleLevel(gCogTex, gSamp, vec2f(cuv.x, cv), 0.0);
			base = mix(base, cc.rgb, cc.a);
		}
		ba = 1.0;
	}
	if (GGD.p.x > 0.5) {   // 地面アトラス（球の床）：uv＝原点相対の係数（#65＝写真の床がズーム摂動で揺れない）
		let gc = gndAtlas(dll, in.pos.x);
		if (ba < 1.0) {   // 前乗算の重ね（gl の gndOver と同じ）＝穴（Cesium の colorToAlpha）は床の α のまま
			let ga = ba * (1.0 - gc.a) + gc.a;
			base = (base * ba * (1.0 - gc.a) + gc.rgb) / max(ga, 1e-4);
			ba = ga;
		} else { base = base * (1.0 - gc.a) + gc.rgb; }
	}
	if (G.gm.x > 0.5) {   // 地面の材質（Cesium の globe.material）＝球の床（低地の t フェードの穴と真俯瞰）にも地形面と同じ式で。標高が無い所は Cesium と同じく高さ 0 の色
		var e = 0.0; var gEN = vec2f(0.0);
		if (G.whP.y > 0.5) {
			e = gElevAt(ll); let dstep = G.elevBounds.w / vec2f(textureDimensions(gElevTex, 0)).y;
			gEN = vec2f((gElevAt(ll + vec2f(dstep, 0.0)) - e) / (dstep * 111320.0 * max(cos(ll.y * 0.017453292519943295), 0.01)), (gElevAt(ll + vec2f(0.0, dstep)) - e) / (dstep * 111320.0));
		}
		let m = gGmColor(e, gEN, gmDe, G.gm, G.gmC, G.gmP); if (ba < 1.0) { base = (base * ba * (1.0 - m.a) + m.rgb * m.a) / max(ba * (1.0 - m.a) + m.a, 1e-4); ba = max(ba, m.a); } else { base = mix(base, m.rgb, m.a); }   // 標高の画素差は冒頭で（一様な制御の流れ）
	}
	if (G.cg.w > 0.5) { base *= G.cgC.rgb * cgLambert(ll, vec2f(0.0), vec4f(G.cg.xyz, 2.0), G.cgP); }   // 地面の照明（Cesium の globe.enableLighting）：遠景球は楕円体の上向きで
	let col = atmGround(base, A, Pt, normalize(A - Pt), G.sun.w);   // 空気遠近＝従来の霞か大気散乱（#46 段 1・G.sun.w）
	var colC = col;
	if (G.misc.z > 0.5) { let night = select(-1.0, G.cgP.w, G.cg.w > 0.5); colC = csFogL(csGroundL(base, A * CS_R, Pt * CS_R, G.misc.y, G.cg.xyz, night), A * CS_R, Pt * CS_R, G.farP.z, G.cg.xyz, night); }   // Cesium の地面の大気（遠くから）と霧（800 km より下・farP.z＝濃さ）＝従来の霞の代わり
	if (ug) {   // 裏面：霞・大気は掛けない＝床の色に undergroundColor を距離の α で重ねる（gl と同じ）
		let kd = clamp((t * sqrt(aa) - G.ugNF.x) / max(G.ugNF.z - G.ugNF.x, 1e-12), 0.0, 1.0);
		let ua = max(G.ugC.a, 0.0) * mix(G.ugNF.y, G.ugNF.w, kd);   // α<0＝undergroundColor 無し（切った面の向こうの裏面＝cgC.w）
		colC = G.ugC.rgb * ua + base * (1.0 - ua);
	}
	var outC = vec4f(colC * ba * G.misc.x, ba * G.misc.x);   // 球体の不透明度（地中の震源等を透かす）
	// 球が透ける時（globe:false・translucency）は Cesium と同じく空の大気の殻が地面の向こうに見える（gl と同じ）
	if (G.misc.z > 0.5 && G.misc.w > 0.5 && G.misc.x < 1.0) { let cs = csSky2(A * CS_R, normalize(d), select(1.0, 2.0, G.misc.x > 0.0)); outC += cs * (1.0 - outC.a); }
	return outC;
}
// 海面下の陸地（wdepr）カバー：stencil-then-cover の cover 側を「landK=1 強制のハイプソ本体」で塗る＝
// 海→海面下→陸の描画順（2026-09-01 本人設計・gl/glsl.js WDEPR_FS と対）。同モジュール＝globe と同一バインド
//（G/gElevTex/gSamp/gClimTex）を共有し、色は globe パスの陸側と画素単位で厳密一致＝ポリゴン境界が
// e≳4m（landK≈1）の土地に落ちれば継ぎ目が消える。α＝whP.x（whK フェード）。
@fragment fn fsWdepr(in: GOut) -> @location(0) vec4f {
	let h = sphereRay(in.ndc, G.rayF, G.rayX, G.rayY, G.eyeC);   // #65
	let A = h.A; let d = h.d; let aa = h.aa; let bb = h.bb; let disc = h.disc;
	if (disc < 0.0) { discard; }
	let t = (-bb - sqrt(disc)) / (2.0 * aa);
	if (t < 0.0) { discard; }
	let Pt = A + t * d;
	let dll = deltaLL(G.eyeO.xyz + t * d, G.anc.xyz, G.anc.w, G.anc2.z, G.whP.z);   // 原点相対（#65）
	let ll = G.anc2.xy + dll;
	let uv = G.elevOff.xy + dll * G.elevOff.zw;
	let e = gElevUV(uv, ll);
	let tsz = vec2f(textureDimensions(gElevTex, 0));
	let dstep = G.elevBounds.w / tsz.y;
	let hx = gElevUV(uv + vec2f(dstep * G.elevOff.z, 0.0), ll + vec2f(dstep, 0.0)) - e;
	let hy = gElevUV(uv + vec2f(0.0, dstep * G.elevOff.w), ll + vec2f(0.0, dstep)) - e;
	let shade = clamp(0.86 + (-hx + hy) * 0.00013, 0.62, 1.08);
	let clim = textureSampleLevel(gClimTex, gSamp, climUV(ll), 0.0).rg;
	// 以降は fs（globe）の末尾と厳密同式（landK=1 だけが違い）：紙とのwhK混合も大気ヘイズも同じに通し、
	// α=1 の不透明で置く＝ポリゴン境界の e≳4m では画素値が globe と bit 一致し縁が完全に消える。
	var hyp = worldHypsoColor(e, ll, clim, G.whP.w) * shade;   // landK=1 強制＝「陸」の上塗り
	// 海面下の締め（NE流「最深帯」）：0→-60m で僅かに暗く・緑側へ＝乾燥帯でも読める（gl WDEPR_FS と同式）
	hyp = mix(hyp, hyp * WP.belowSea.rgb, clamp(-e / 60.0, 0.0, 1.0));
	let base = mix(G.land.rgb, hyp, G.whP.x);
	return vec4f(atmGround(base, A, Pt, normalize(A - Pt), G.sun.w) * G.misc.x, G.misc.x);   // 球体の不透明度に従う・空気遠近は globe fs と同じ関数（画素一致）
}
// 10度レチクル（v1 ortho-map geoGraticule10/Canvas2D の移植・gl GRAT_FS と対）：レイ→球→測地経緯度→
// 10°格子への画素距離を fwidth で解析AA（≈0.7px 白細線）。度距離の上限ゲート＝極（経線収束）と atan 継ぎ目で
// fwidth が爆発して線が面に化けるのを防ぐ。d3.geoGraticule10 と同じ約束＝±80°打切り・90°毎の経線だけ極まで。
// 出現度＝G.seaC.w（レンダラが z帯フェード×基礎αを書く）。
@fragment fn fsGrat(in: GOut) -> @location(0) vec4f {
	let h = sphereRay(in.ndc, G.rayF, G.rayX, G.rayY, G.eyeC);   // #65
	let A = h.A; let d = h.d; let aa = h.aa; let bb = h.bb; let disc = h.disc;
	if (disc < 0.0) { discard; }
	let t = (-bb - sqrt(disc)) / (2.0 * aa);
	if (t < 0.0) { discard; }
	let Pt = A + t * d;
	let bl = asin(clamp(Pt.y, -1.0, 1.0));
	let latD = bl * R2Dg + G.whP.z * (0.0016792203863837047 * sin(2.0 * bl) + 0.0000014098905530233192 * sin(4.0 * bl)) * R2Dg;
	let ll = vec2f(atan2(Pt.z, Pt.x) * R2Dg, latD);
	let fw = max(fwidth(ll), vec2f(1e-6));
	let g10 = abs(fract(ll / 10.0 + 0.5) - 0.5) * 10.0;
	var mer = (1.0 - smoothstep(0.25, 0.75, g10.x / fw.x)) * (1.0 - smoothstep(0.8, 1.6, g10.x));
	let par = (1.0 - smoothstep(0.25, 0.75, g10.y / fw.y)) * (1.0 - smoothstep(0.8, 1.6, g10.y)) * step(abs(latD), 80.0);
	let in80 = step(abs(latD), 80.0);
	let g90 = abs(fract(ll.x / 90.0 + 0.5) - 0.5) * 90.0;
	let mer90 = (1.0 - smoothstep(0.25, 0.75, g90 / fw.x)) * (1.0 - smoothstep(0.8, 1.6, g90));
	mer = mer * in80 + mer90 * (1.0 - in80);
	let a = max(mer, par) * G.seaC.w * WP.grat.w;
	if (a <= 0.003) { discard; }
	return vec4f(WP.grat.rgb * a, a);   // premultiplied（既定=白）
}
`,Jt=(s,p,_)=>p.reduce((A,[D,C])=>{if(A.split(D).length!==2)throw new Error(`wgsl derive(${_}): anchor missing/ambiguous: ${D.slice(0,50)}`);return A.replace(D,C)},s),M1=`
${rn}
struct PB { meshOrigin: vec4f, clipMesh: vec4f, alpha: vec4f, pbr0: vec4f, emis: vec4f, lp: vec4f, sh: array<vec4f, 9>, pad: vec4f, ln: vec4f, lt: array<vec4f, 32>, xf: mat3x3f, xt: vec4f, sl0: vec4f, sl1: vec4f, cs: vec4f, csL: vec4f, csC: vec4f, csI: vec4f, eyeRel: vec4f, tint: vec4f, tintB: vec4f, sil: vec4f, cc: vec4f, dr0: vec4f, dr1: vec4f, dr2: vec4f };   // dr0/dr1＝重ねる絵の uv の平面写像（原点相対の位置 → u・v＝float 256〜263）・dr2.x＝重ねる絵あり（set "meshDrape"）   // tint/tintB＝Cesium の Model.color（float 240〜245）：tint＝色 rgba・tintB.x＝混ぜ方（−1 無し・0 HIGHLIGHT・1 REPLACE・間 MIX の量）・tintB.y＝輪郭線の太さ（device px）・sil＝輪郭線の色 rgba（float 248〜251・Model.silhouetteColor）   // eyeRel＝F.eye − meshOrigin（CPU double・float 236〜238）＝toEye を原点相対で組む（近接の裏面判定）   // csL/csC/csI＝Cesium の模型の照明（setMeshLighting・float 224〜235）：csL＝(光へ向く世界系の単位ベクトル, on)・csC＝(光の色×強さ HDR, 一様な環境で L00 が 1 になる倍率)・csI＝(拡散の係数, 鏡面の係数, 鏡面の環境の立方体図あり, その最大 mip)・sh[9] の xyz には Cesium の並びの SH9   // sl0/sl1＝style の light（setLight・float 212〜219）：sl0＝(東, 北, 上, on)・sl1＝(色 rgb, 強さ)／cs.x＝1 で頂点色は sRGB（押し出し＝表示空間の色・float 220）・cs.y＝街明かりの強さ（float 221）・cs.z＝1 で窓の明かりを canvas の α に印す（夜の色 grade の間・float 222）   // xf/xt＝バッチの剛体変換（glTF の rigid アニメ・W4・float 196〜211・xt.w＝on）   // pad＝clipO の枠（断面の派生が clipO に替える）・ln.x＝局所の光源の数（W2）・lt＝8 灯×(A,B,C,D)（light.js localLightsPayload と同じ並び）   // xyz+cullBack, clip錨, alpha.z＝noLift（1＝地形へ持ち上げない）・alpha.w＝drape（1＝DTM 保証域に縛らず持ち上げる・2026-09-22）。
@group(2) @binding(0) var<uniform> B: PB;
struct PlLiteOut {
	@builtin(position) pos: vec4f,
	@location(0) n: vec3f,
	@location(3) fog: f32,
};
@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_normal: vec4f) -> PlLiteOut {
	var o: PlLiteOut;
	let ap = select(a_pos, B.xf * a_pos + B.xt.xyz, B.xt.w > 0.5);
	let wp = B.meshOrigin.xyz + ap;
	let dir = normalize(wp);
	o.n = select(a_normal.xyz, B.xf * a_normal.xyz, B.xt.w > 0.5);
	o.fog = fogOf(wp);
	let lat = geoLat(degrees(asin(clamp(dir.y, -1.0, 1.0))));
	let lon = degrees(atan2(dir.z, dir.x));
	let lb = P.p0;
	let inX = smoothstep(0.0, 0.05, min(lon - lb.x, lb.x + lb.z - lon));
	let inY = smoothstep(0.0, 0.05, min(lat - lb.y, lb.y + lb.w - lat));
	var hE = 0.0;
	if (B.alpha.z < 0.5) { if (F.ellP.z > 0.5) { hE = elev1(vec2f(lon, lat)); } else { hE = elev(vec2f(lon, lat)); } }
	let h = hE * F.elevP.x * select(inX * inY, 1.0, B.alpha.w > 0.5) * (1.0 - B.alpha.z);
	var p = B.clipMesh + F.mvp * vec4f(ap + h * liftDir(vec2f(lon, lat), dir), 0.0);
	p.z = logDepthZ(p.w);
	o.pos = p;
	return o;
}
@fragment fn fs(in: PlLiteOut) -> @location(0) vec4f {
	let n = normalize(in.n);
	let up = normalize(B.meshOrigin.xyz);   // 束の原点の動径＝束の中では一定（画素の動径との差は数 km で 0.05° 以下）
	let e0 = cross(vec3f(0.0, 1.0, 0.0), up);
	let east = select(normalize(e0), vec3f(1.0, 0.0, 0.0), dot(e0, e0) < 1e-12);
	let north = cross(up, east);
	let L = normalize(north * 0.44 + up * 0.90);
	let d = clamp(dot(n, L) * 0.28 + 0.76, 0.72, 1.0);   // MESH_WGSL の固定光と同じ式
	return vec4f(mix(P.p1.rgb * d, F.fogColor, in.fog), 1.0);
}
`,U1=`
${rn}
struct PB { meshOrigin: vec4f, clipMesh: vec4f, alpha: vec4f, pbr0: vec4f, emis: vec4f, lp: vec4f, sh: array<vec4f, 9>, pad: vec4f, ln: vec4f, lt: array<vec4f, 32>, xf: mat3x3f, xt: vec4f, sl0: vec4f, sl1: vec4f, cs: vec4f, csL: vec4f, csC: vec4f, csI: vec4f, eyeRel: vec4f, tint: vec4f, tintB: vec4f, sil: vec4f, cc: vec4f, dr0: vec4f, dr1: vec4f, dr2: vec4f, fc: vec4f };   // MESH_WGSL の PB＋fc（float 268〜271）＝束が 1 色の時の表示空間の色（w＝1・CPU が sRGB へ符号化済み）
@group(2) @binding(0) var<uniform> B: PB;
struct PlFastOut {
	@builtin(position) pos: vec4f,
	@location(0) n: vec3f,
	@location(1) toEye: vec3f,
	@location(3) fog: f32,
	@location(5) col: vec4f,
};
@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_normal: vec4f, @location(3) a_col: vec4f) -> PlFastOut {
	var o: PlFastOut;
	let wp = B.meshOrigin.xyz + a_pos;
	o.n = a_normal.xyz;
	o.toEye = B.eyeRel.xyz - a_pos;
	o.fog = fogOf(wp);
	o.col = a_col;
	var lift = vec3f(0.0);
	if (B.alpha.z < 0.5) {   // 地形へ持ち上げる束だけ（MESH_WGSL と同じ式）。noLift／焼き済み＝h は厳密に 0＝足さないのと同じ
		let dir = normalize(wp);
		let lat = geoLat(degrees(asin(clamp(dir.y, -1.0, 1.0))));
		let lon = degrees(atan2(dir.z, dir.x));
		let lb = P.p0;
		let inX = smoothstep(0.0, 0.05, min(lon - lb.x, lb.x + lb.z - lon));
		let inY = smoothstep(0.0, 0.05, min(lat - lb.y, lb.y + lb.w - lat));
		var hE = 0.0;
		if (F.ellP.z > 0.5) { hE = elev1(vec2f(lon, lat)); } else { hE = elev(vec2f(lon, lat)); }
		lift = (hE * F.elevP.x * select(inX * inY, 1.0, B.alpha.w > 0.5)) * liftDir(vec2f(lon, lat), dir);
	}
	var p = B.clipMesh + F.mvp * vec4f(a_pos + lift, 0.0);
	p.z = logDepthZ(p.w);
	o.pos = p;
	return o;
}
@fragment fn fs(in: PlFastOut) -> @location(0) vec4f {
	let gnRaw = cross(dpdx(in.toEye), dpdy(in.toEye));   // 面の幾何法線（MESH_WGSL と同じ）
	var n = normalize(in.n);
	let g2 = dot(gnRaw, gnRaw);
	let fe = select(dot(n, normalize(in.toEye)), dot(normalize(gnRaw * sign(dot(gnRaw, n))), normalize(in.toEye)), g2 > 1e-18);
	if (fe < 0.0) { n = -n; }   // 両面＝法線を視線側へ
	let up = normalize(F.eye - in.toEye);
	let e0 = cross(vec3f(0.0, 1.0, 0.0), up);
	let east = select(normalize(e0), vec3f(1.0, 0.0, 0.0), dot(e0, e0) < 1e-12);
	let north = cross(up, east);
	let L = normalize(north * 0.44 + up * 0.90);
	let d = clamp(dot(n, L) * 0.28 + 0.76, 0.72, 1.0);
	var base = B.fc.rgb;
	if (B.fc.w < 0.5) { base = srgbEncode(select(in.col.rgb, srgbDecode(in.col.rgb), B.cs.x > 0.5)); }   // 色の混じる束＝画素ごとに（MESH_TEX_WGSL の tx → srgbEncode と同じ）
	return vec4f(mix(base * d, F.fogColor, in.fog), 1.0);
}
`,gl=Jt(ts,[[`@group(2) @binding(0) var<uniform> B: PB;
`,`@group(2) @binding(0) var<uniform> B: PB;
fn tintW(c: vec3f) -> vec3f { if (B.tintB.x < -0.5) { return c; } let m = mix(c, B.tint.rgb, B.tintB.x); return m * mix(B.tint.rgb, vec3f(1.0), ceil(B.tintB.x)); }   // Cesium の ModelColorStage（diffuse はリニア）
@group(3) @binding(0) var texS: sampler;
@group(3) @binding(1) var texT: texture_2d<f32>;
@group(3) @binding(2) var texMR: texture_2d<f32>;
@group(3) @binding(3) var texN: texture_2d<f32>;
@group(3) @binding(4) var texOcc: texture_2d<f32>;
@group(3) @binding(5) var texEm: texture_2d<f32>;
@group(3) @binding(99) var texP: texture_2d<f32>;
// imagery draped on the mesh (set "meshDrape": Cesium3DTileset.imageryLayers): uv = the window's plane map of the origin-relative point, over the base colour by its alpha in display space. Level 0 = no derivatives.
// The picture sits in texP's slot (a batch with a paint picture has no drape: one more texture would pass the 16 sampled textures per stage)
fn drapeW(c: vec4f, p: vec3f) -> vec4f { if (B.dr2.x < 0.5) { return c; } let uv = vec2f(dot(B.dr0.xyz, p) + B.dr0.w, dot(B.dr1.xyz, p) + B.dr1.w); if (any(uv < vec2f(0.0)) || any(uv > vec2f(1.0))) { return c; } let d = textureSampleLevel(texP, texS, uv, 0.0); return vec4f(srgbDecode(mix(srgbEncode(c.rgb), d.rgb, d.a)), c.a); }
// the style colour of the feature under this texel (feature ID texture, nearest texel; alpha 0 = no colour), blended like tintW in display space (Cesium colorBlendMode)
fn paintW(c: vec4f, uv: vec2f) -> vec4f { if (B.tintB.z < -0.5) { return c; } let sz = vec2i(textureDimensions(texP)); let p = textureLoad(texP, clamp(vec2i(floor(uv * vec2f(sz))), vec2i(0), sz - 1), 0); if (p.a < 0.5) { return c; } let m = mix(srgbEncode(c.rgb), p.rgb, B.tintB.z) * mix(p.rgb, vec3f(1.0), ceil(B.tintB.z)); return vec4f(srgbDecode(m), c.a); }
`],[`	@location(3) fog: f32,
};`,`	@location(3) fog: f32,
	@location(4) uv: vec2f,
	@location(5) col: vec4f,
};`],[`@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_normal: vec4f) -> PlOut {
	var o: PlOut;
`,`@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_normal: vec4f, @location(2) a_uv: vec2f, @location(3) a_col: vec4f) -> PlOut {
	var o: PlOut;
	o.uv = a_uv; o.col = a_col;
`],[`	let gnRaw = cross(dpdx(in.toEye), dpdy(in.toEye));
`,`	let gnRaw = cross(dpdx(in.toEye), dpdy(in.toEye));
	let txT = drapeW(paintW(textureSample(texT, texS, in.uv), in.uv), B.eyeRel.xyz - in.toEye);   // uniform control flow（discard より前）・塗る絵（meshPaint）
	let tx = vec4f(tintW(txT.rgb * select(in.col.rgb, srgbDecode(in.col.rgb), B.cs.x > 0.5)), txT.a * in.col.a);   // cs.x＝頂点色が sRGB（押し出し）＝リニアへ戻してから掛ける＝出口の srgbEncode で元の色（gl と同じ絵・2026-10-13）
	let mr = textureSample(texMR, texS, in.uv); let nm = textureSample(texN, texS, in.uv); let oc = textureSample(texOcc, texS, in.uv); let em = textureSample(texEm, texS, in.uv);   // #46 段 2＝材質 4 枚（無い物は 1×1 の既定）
	let dpx = dpdx(in.toEye); let dpy = dpdy(in.toEye); let dux = dpdx(in.uv); let duy = dpdy(in.uv);   // 法線マップの接線（微分＝ここで確定）
`],["	var ltBase = P.p1.rgb;   // 局所の光源（W2）","	var ltBase = srgbEncode(tx.rgb);   // 局所の光源（W2）"],[`	var lit = P.p1.rgb * d;   // 従来（fx.pbr off）
`,`	if (tx.a < B.alpha.x) { discard; }
	let a = select(1.0, select(tx.a, 1.0, B.alpha.y > 1.5) * select(1.0, B.tint.a, B.tintB.x > -0.5), B.alpha.y > 0.5);   // alpha.y＝1 BLEND・2 Model.color の α だけで半透明
	var lit = srgbEncode(tx.rgb) * d;   // 従来（fx.pbr off）＝tx はリニア（srgb ビュー）・陰影 d は表示空間
`],[`		var pi: PbrIn; pi.base = srgbDecode(P.p1.rgb); pi.n = n; pi.pos = F.eye - in.toEye; pi.v = normalize(in.toEye); pi.metallic = 0.0; pi.rough = 1.0; pi.ao = 1.0; pi.sunK = sunK; pi.lp = B.lp; pi.fill = B.sh[0].w;
		lit = srgbEncode(min(pbrShade(pi, B.sh), vec3f(1.0)));
`,`		// normal map via screen-space tangents (no TANGENT attribute; degenerate = plain normal). default 1x1 (128,128,255) = identity
		let nmv = vec3f((nm.xy * 2.0 - 1.0) * B.pbr0.z, nm.z * 2.0 - 1.0);
		let dp1 = -dpx; let dp2 = -dpy;
		let dp2p = cross(dp2, n); let dp1p = cross(n, dp1);
		let T = dp2p * dux.x + dp1p * duy.x; let Bt = dp2p * dux.y + dp1p * duy.y;
		let mx = max(dot(T, T), dot(Bt, Bt));
		var nn = n;
		if (mx > 1e-20) { let im = inverseSqrt(mx); nn = normalize(T * im * nmv.x + Bt * im * nmv.y + n * max(nmv.z, 0.05)); }
		var pi: PbrIn; pi.base = tx.rgb; pi.n = nn; pi.pos = F.eye - in.toEye; pi.v = normalize(in.toEye); pi.metallic = clamp(B.pbr0.x * mr.b, 0.0, 1.0); pi.rough = clamp(B.pbr0.y * mr.g, 0.04, 1.0); pi.ao = mix(1.0, oc.r, B.pbr0.w); pi.sunK = sunK; pi.lp = B.lp; pi.fill = B.sh[0].w;
		lit = srgbEncode(min(pbrShade(pi, B.sh) + B.emis.rgb * em.rgb, vec3f(1.0)));   // emissive (srgb view = linear) added as is
`],["	if (B.csL.w > 1.5) { lit = P.p1.rgb; }","	if (B.csL.w > 1.5) { lit = srgbEncode(tx.rgb); }"],[`		var ci: CsIn; ci.base = srgbDecode(P.p1.rgb); ci.n = n; ci.pos = F.eye - in.toEye; ci.v = normalize(in.toEye); ci.metallic = B.pbr0.x; ci.rough = B.pbr0.y; ci.ao = 1.0; ci.emissive = vec3f(0.0); ci.sunK = sunK; ci.cc = B.cc.xy; ci.ncc = n;
`,`		let cnm = vec3f((nm.xy * 2.0 - 1.0) * B.pbr0.z, nm.z * 2.0 - 1.0);   // 法線マップ（fx.pbr の経路と同じ接線）
		let cdp1 = -dpx; let cdp2 = -dpy; let cdp2p = cross(cdp2, n); let cdp1p = cross(n, cdp1);
		let cT = cdp2p * dux.x + cdp1p * duy.x; let cB = cdp2p * dux.y + cdp1p * duy.y; let cmx = max(dot(cT, cT), dot(cB, cB));
		var cn = n; if (cmx > 1e-20) { let im = inverseSqrt(cmx); cn = normalize(cT * im * cnm.x + cB * im * cnm.y + n * max(cnm.z, 0.05)); }
		var ci: CsIn; ci.base = tx.rgb; ci.n = cn; ci.pos = F.eye - in.toEye; ci.v = normalize(in.toEye); ci.metallic = clamp(B.pbr0.x * mr.b, 0.0, 1.0); ci.rough = clamp(B.pbr0.y * mr.g, 0.04, 1.0); ci.ao = mix(1.0, oc.r, B.pbr0.w); ci.emissive = B.emis.rgb * em.rgb; ci.sunK = sunK; ci.cc = B.cc.xy; ci.ncc = n;
`],[`	c = mix(c, in.csFog.rgb, in.csFog.a);   // Cesium の霧
	return vec4f(c, 1.0 - wm);
}
`,`	c = mix(c, in.csFog.rgb, in.csFog.a);   // Cesium の霧
	return vec4f(c * a, a);
}
`]],"MESH_TEX_WGSL");function R1(s){const p=hv(s,3,6),_=gl,A=_.indexOf("fn csLit(i: CsIn, sh: array<vec4f, 9>, csL: vec4f, csC: vec4f, csI: vec4f) -> vec3f {"),D=_.indexOf(`
}
`,A),C=Jt(_.slice(A,D+3),[["fn csLit(i: CsIn, sh: array<vec4f, 9>, csL: vec4f, csC: vec4f, csI: vec4f) -> vec3f {","fn csLitM(i: CsIn, f0m: vec3f, sh: array<vec4f, 9>, csL: vec4f, csC: vec4f, csI: vec4f) -> vec3f {"],["let diffuse = olMix(i.base * (1.0 - i.metallic)); let f0 = mix(vec3f(0.04), i.base, i.metallic);","let diffuse = olMix(i.base); let f0 = f0m;"]],"csLitM");return{code:Jt(gl,[[`@group(3) @binding(5) var texEm: texture_2d<f32>;
`,`@group(3) @binding(5) var texEm: texture_2d<f32>;
`+p.decl+C],[`	@location(5) col: vec4f,
};`,`	@location(5) col: vec4f,
	@location(9) mc: vec4f,
	@location(10) uvm: vec2f,
};`],[`@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_normal: vec4f, @location(2) a_uv: vec2f, @location(3) a_col: vec4f) -> PlOut {
	var o: PlOut;
	o.uv = a_uv; o.col = a_col;
`,`@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_normal: vec4f, @location(2) a_uv: vec2f, @location(3) a_col: vec4f, @location(4) a_mc: vec4f, @location(5) a_uvm: vec2f) -> PlOut {
	var o: PlOut;
	o.uv = a_uv; o.col = a_col;
	o.mc = a_mc; o.uvm = a_uvm;
`],[`	let ap = select(a_pos, B.xf * a_pos + B.xt.xyz, B.xt.w > 0.5);   // バッチの剛体変換（W4）＝原点相対のまま
`,`	var ap = select(a_pos, B.xf * a_pos + B.xt.xyz, B.xt.w > 0.5);   // バッチの剛体変換（W4）＝原点相対のまま
`+(p.hasVs?`	csVi.attributes = csAttrsOf(a_mc.xyz, B.meshOrigin.xyz + ap, CU.V * (ap - B.eyeRel.xyz) * 6378137.0, select(a_normal.xyz, B.xf * a_normal.xyz, B.xt.w > 0.5), a_uv, a_col, a_mc.w);
	csVi.featureIds.featureId_0 = i32(a_mc.w + 0.5); csVi.metadata = csMetaOf(a_uvm);
	csVo.positionMC = a_mc.xyz; csVo.pointSize = 1.0;
	vertexMain();
	ap += CU.J * (csVo.positionMC - a_mc.xyz);
	o.mc = vec4f(csVo.positionMC, a_mc.w);
`:"")],["	if (B.csL.w > 1.5) { lit = srgbEncode(tx.rgb); }",`	let csUnlit = CU.misc.z > 0.5 || (B.csL.w > 1.5 && CU.misc.z > -0.5);
	let csMet = select(clamp(B.pbr0.x * mr.b, 0.0, 1.0), 0.0, csUnlit);
	csM.baseColor = tx; csM.diffuse = tx.rgb * (1.0 - csMet); csM.alpha = tx.a; csM.specular = mix(vec3f(0.04), tx.rgb, csMet); csM.roughness = clamp(B.pbr0.y * mr.g, 0.04, 1.0);
	csM.normalEC = normalize(CU.V * n); csM.occlusion = mix(1.0, oc.r, B.pbr0.w); csM.emissive = B.emis.rgb * em.rgb;
`+(p.hasFs?`	csFi.attributes = csAttrsOf(in.mc.xyz, F.eye - in.toEye, CU.V * (-in.toEye) * 6378137.0, n, in.uv, in.col, in.mc.w);
	csFi.featureIds.featureId_0 = i32(in.mc.w + 0.5); csFi.metadata = csMetaOf(in.uvm);
	fragmentMain();
`:"")+`	let csN = normalize(transpose(CU.V) * csM.normalEC);
	var csA = a;
	if (csUnlit) { lit = czm_linearToSrgb3(csM.diffuse); }   // UNLIT＝Cesium の lightingStage（diffuse を sRGB へ）
	else if (B.csL.w > 0.5) { var ci: CsIn; ci.base = csM.diffuse; ci.n = csN; ci.pos = F.eye - in.toEye; ci.v = normalize(in.toEye); ci.metallic = 0.0; ci.rough = csM.roughness; ci.ao = csM.occlusion; ci.emissive = csM.emissive; ci.sunK = sunK; lit = csLitM(ci, csM.specular, B.sh, B.csL, B.csC, B.csI); }
	else { lit = czm_linearToSrgb3(csM.diffuse) * d; }
	if (CU.misc.w > 0.5) { csA = clamp(csM.alpha, 0.0, 1.0); }
	if (true) { }`],[`	return vec4f(c * a, a);
}
`,`	return vec4f(c * csA, csA);
}
`]],"MESH_CS_WGSL"),textures:p.textures,cuSize:p.layout.size,layout:p.layout}}const A1=Jt(gl,[[`	o.pos = p;
	return o;
}
`,`	let cn = (F.mvp * vec4f(o.n, 0.0)).xy;
	if (dot(cn, cn) > 1e-30) { p = vec4f(p.xy + normalize(cn) * B.tintB.y * 2.0 / F.viewport * p.w, p.zw); }
	o.pos = p;
	return o;
}
@fragment fn fsSil(in: PlOut) -> @location(0) vec4f {
	if (in.front < 0.0) { discard; }
	return vec4f(B.sil.rgb * B.sil.a, B.sil.a);
}
`]],"MESH_SIL_WGSL"),L1=`
struct AP { off: vec4f, uvT: vec4f, p: vec4f };
@group(0) @binding(0) var<uniform> A: AP;
@group(1) @binding(0) var aS: sampler;
@group(1) @binding(1) var aT: texture_2d<f32>;
struct AOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@location(0) a_delta: vec2f, @location(1) a_uv: vec2f) -> AOut {
	var o: AOut;
	let p = (A.off.xy + a_delta) * A.off.zw;
	o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
	o.uv = A.uvT.xy + a_uv * A.uvT.zw;
	return o;
}
@fragment fn fs(in: AOut) -> @location(0) vec4f {
	let c = textureSample(aT, aS, in.uv);
	let a = c.a * A.p.x;
	return vec4f(c.rgb * a, a);
}
`,pf=`
${rn}
struct AtlP { off: vec4f, p: vec4f };
@group(2) @binding(0) var<uniform> A: AtlP;
struct AFOut { @builtin(position) pos: vec4f, @location(0) color: vec4f, @location(1) ll: vec2f };
@vertex fn vs(@location(0) a_delta: vec2f, @location(1) a_color: vec4f) -> AFOut {
	var o: AFOut;
	let p = (A.off.xy + a_delta) * A.off.zw;
	o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
	o.color = a_color;
	if (P.pz.x > 0.5) { o.color = P.pzC; }   // ズーム連続の色（V-Ph3＝S-P1-2・paint 表の (b) 類は md の派生がここを差し替える）
	o.ll = F.origin + a_delta;
	return o;
}
@fragment fn fs(in: AFOut) -> @location(0) vec4f {
	if (A.p.x > 0.5 && elev(in.ll) > 0.0) { discard; }   // 図郭外＝陸は塗り残す
	let a = in.color.a * A.p.y;
	if (a <= 0.003) { discard; }
	return vec4f(in.color.rgb * a, a);
}
`,O1=s=>`	if (FT.count.x > ${s}u) { let uv${s} = FT.bbox[${s}].xy + in.rel * FT.bbox[${s}].zw; if (uv${s}.x >= 0.0 && uv${s}.x <= 1.0 && uv${s}.y >= 0.0 && uv${s}.y <= 1.0 && textureSampleLevel(footTex${s}, footSamp, uv${s}, 0.0).r > 0.5) { hit = true; } }
`,ju=Jt(pf,[[`@group(2) @binding(0) var<uniform> A: AtlP;
`,`@group(2) @binding(0) var<uniform> A: AtlP;
struct FootP { count: vec4u, bbox: array<vec4f, 4>, color: vec4f };
@group(2) @binding(1) var<uniform> FT: FootP;
@group(2) @binding(2) var footTex0: texture_2d<f32>;
@group(2) @binding(3) var footTex1: texture_2d<f32>;
@group(2) @binding(4) var footTex2: texture_2d<f32>;
@group(2) @binding(5) var footTex3: texture_2d<f32>;
@group(2) @binding(6) var footSamp: sampler;
`],["struct AFOut { @builtin(position) pos: vec4f, @location(0) color: vec4f, @location(1) ll: vec2f };","struct AFOut { @builtin(position) pos: vec4f, @location(0) color: vec4f, @location(1) ll: vec2f, @location(2) rel: vec2f };   // rel＝原点相対（マスクの uv・絶対経緯度の f32 ジッタを避ける＝BUILDING と同じ）"],[`	o.ll = F.origin + a_delta;
`,`	o.ll = F.origin + a_delta;
	o.rel = a_delta;
`],[`@fragment fn fs(in: AFOut) -> @location(0) vec4f {
	if (A.p.x > 0.5 && elev(in.ll) > 0.0) { discard; }   // 図郭外＝陸は塗り残す
	let a = in.color.a * A.p.y;
	if (a <= 0.003) { discard; }
	return vec4f(in.color.rgb * a, a);
}`,`@fragment fn fs(in: AFOut) -> @location(0) vec4f {
	var hit = false;
`+[0,1,2,3].map(O1).join("")+`	if (!hit) { discard; }   // メッシュの区の外＝基図の押し出しが立つ所（足元は塗らない＝静止の絵と同じ）
	let a = FT.color.a * A.p.y;
	return vec4f(FT.color.rgb * a, a);
}`]],"ATLAS_FOOT"),vl=(s,p=0)=>`
struct ShadowP { mvp: mat4x4f, clipT: vec4f, anchor: vec4f, p: vec4f, cs: array<vec4f, 3>, cb: array<vec4f, 3>, q: vec4f };
@group(${s}) @binding(${p}) var<uniform> SH: ShadowP;
@group(${s}) @binding(${p+1}) var shTex: texture_depth_2d_array;
@group(${s}) @binding(${p+2}) var shSamp: sampler_comparison;
var<private> SH_PD: array<vec2f, 16> = array<vec2f, 16>(
	vec2f(-0.94201624, -0.39906216), vec2f(0.94558609, -0.76890725), vec2f(-0.09418410, -0.92938870), vec2f(0.34495938, 0.29387760),
	vec2f(-0.91588581, 0.45771432), vec2f(-0.81544232, -0.87912464), vec2f(-0.38277543, 0.27676845), vec2f(0.97484398, 0.75648379),
	vec2f(0.44323325, -0.97511554), vec2f(0.53742981, -0.47373420), vec2f(-0.26496911, -0.41893023), vec2f(0.79197514, 0.19090188),
	vec2f(-0.24188840, 0.99706507), vec2f(-0.81409955, 0.91437590), vec2f(0.19984126, 0.78641367), vec2f(0.14383161, -0.14100790));
fn shClip(relA: vec3f) -> vec4f { return SH.clipT + SH.mvp * vec4f(relA, 0.0); }
// 点をずらした先では受け手自身の深さも変わる＝ずらした距離×面の傾きの上限（SH.cb[i].w＝cot(高度)・深度/uv）を足して比べる。
// これが無いと、広い半影で平らな屋根や地面が自分の影を拾ってまだらになる（低い太陽では 1 texel 動くと深さが cot(高度) texel 変わる）。
// 画面の微分（receiver plane）は使えない＝受け手の多くが分岐の中で影を読むので dpdx が一様な流れに置けない。足元は幅 1 texel＝足す量も小さい
fn shPcss(uv: vec2f, layer: i32, d: f32, i: u32) -> f32 {
	let g = SH.cb[i].w;
	let tx = SH.cb[i].y;
	let dim = vec2f(textureDimensions(shTex));
	var zs = 0.0; var zn = 0.0;
	for (var k = 0; k < 16; k++) {
		let o = SH_PD[k] * (tx * SH.q.w);
		let q = clamp(vec2i((uv + o) * dim), vec2i(0), vec2i(dim) - 1);
		let z = textureLoad(shTex, q, layer, 0);
		if (z < d + length(o) * g) { zs += z; zn += 1.0; }
	}
	if (zn < 0.5) { return 1.0; }   // 周りに遮る物が無い＝日向（比較の 16 点も省く）
	let w = clamp((d - zs / zn) * SH.q.y * SH.q.z / SH.cb[i].z, 1.0, 8.0) * tx;   // 半影の幅（uv）＝遮る物までの距離(m)×係数 を texel に直して 1〜8
	var s = 0.0;
	for (var k = 0; k < 16; k++) { let o = SH_PD[k] * w; s += textureSampleCompareLevel(shTex, shSamp, uv + o, layer, d + length(o) * g); }
	return s / 16.0;
}
// 段 i の日向の度合い（x）と、窓の縁までの距離（y・uv・≤0＝窓の外）
fn shAt(pb: vec3f, i: u32) -> vec2f {
	let c = SH.cs[i];
	let xy = pb.xy * c.x + c.yz;
	let uv = vec2f(xy.x * 0.5 + 0.5, 0.5 - xy.y * 0.5);
	let e = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
	if (e <= 0.0) { return vec2f(1.0, e); }
	var lit = shPcss(uv, i32(c.w), pb.z - SH.cb[i].x, i);
	if (i + 1u >= u32(SH.q.x)) {   // 基の窓＝縁は中心からの距離で丸く日向へ溶かす（#112 段 3）
		lit = mix(1.0, lit, 1.0 - smoothstep(SH.p.w, 1.0, length(xy)));
	}
	return vec2f(lit, e);
}
fn shLit(sc: vec4f) -> f32 {   // 1＝日向・0＝影
	if (sc.w <= 0.0) { return 1.0; }
	let pb = sc.xyz / sc.w;
	if (pb.z <= 0.0 || pb.z >= 1.0) { return 1.0; }
	let n = u32(SH.q.x);
	for (var i = 0u; i < n; i++) {
		let a = shAt(pb, i);
		if (a.y <= 0.0) { continue; }
		if (i + 1u < n && a.y < 0.04) {   // 段の縁の帯＝次の段と混ぜる（次の段の外なら混ぜない）
			let b = shAt(pb, i + 1u);
			if (b.y > 0.0) { return mix(b.x, a.x, a.y / 0.04); }
		}
		return a.x;
	}
	return 1.0;
}
fn shShade(col: vec3f, sc: vec4f) -> vec3f { return col * mix(SH.p.x, 1.0, shLit(sc)); }
`,gf=Jt(Da,[[`	@location(8) guv3: vec2f,
};`,`	@location(8) guv3: vec2f,
	@location(9) sc: vec4f,
};`],[`	let relW = rel + (h * F.elevP.x) * liftDir(a_ll, dir);   // 楕円体＝測地法線
`,`	let relW = rel + (h * F.elevP.x) * liftDir(a_ll, dir);   // 楕円体＝測地法線
	o.sc = shClip(relW + (F.originPt - SH.anchor.xyz));
`],["	var col = mix(colBase, F.fogColor, in.fog);","	var col = mix(shShade(colBase, in.sc), F.fogColor, in.fog);"],["	var shade = clamp(0.82 + (-hx + hy) * 0.0007 * shadeK, 0.45, 1.15);",`	let sdir = -normalize(vec3f(SH.mvp[0].z, SH.mvp[1].z, SH.mvp[2].z));
	let lr = in.ll * 0.017453292519943295;
	let cl = cos(lr.y); let sl = sin(lr.y); let co = cos(lr.x); let so = sin(lr.x);
	let sH = vec2f(dot(sdir, vec3f(-so, 0.0, co)), dot(sdir, vec3f(-sl * co, cl, -sl * so)));   // 太陽の方位（東・北）
	let aH = sH / max(length(sH), 1e-6);
	let gEN = vec2f(hx / (d * 111320.0 * max(cl, 0.01)), hy / (d * 111320.0));   // 勾配（東・北・m/m）
	var shade = clamp(0.82 - 0.44 * dot(gEN, aH), 0.45, 1.15);`]],"TERRAIN_SH_WGSL")+vl(3),Ca=Jt(Ua,[[`	@location(9) guv3: vec2f,
};`,`	@location(9) guv3: vec2f,
	@location(10) sc: vec4f,
};`],[`	o.pos = p;
	o.color = a_color;`,`	o.pos = p;
	o.sc = shClip(rel + (F.originPt - SH.anchor.xyz));
	o.color = a_color;`],["mix(gndMix0(cogTexMix0(in.color.rgb, in.cuv), in.guv0, in.guv1, in.guv2, in.guv3, in.pos.x), F.fogColor, in.fog)","mix(shShade(gndMix0(cogTexMix0(in.color.rgb, in.cuv), in.guv0, in.guv1, in.guv2, in.guv3, in.pos.x), in.sc), F.fogColor, in.fog)"]],"FILL_SH_WGSL")+vl(2),ao=Jt(Jo,[[`	@location(6) fog: f32,
};`,`	@location(6) fog: f32,
	@location(7) sc: vec4f,
};`],[`	o.fog = fogOf((wa + wb) * 0.5);
`,`	o.fog = fogOf((wa + wb) * 0.5);
	o.sc = shClip(select(relWb, relWa, corner.x < 0.5) + (F.originPt - SH.anchor.xyz));
`],["	return vec4f(mix(lc.rgb, F.fogColor, in.fog) * ga, ga);","	return vec4f(mix(shShade(lc.rgb, in.sc), F.fogColor, in.fog) * ga, ga);"]],"LINE_SH_WGSL")+vl(2),Ea=Jt(es,[[`	@location(3) ll: vec2f,   // 絶対 lon/lat＝被覆マスクの uv 参照
};`,`	@location(3) ll: vec2f,   // 絶対 lon/lat＝被覆マスクの uv 参照
	@location(4) sc: vec4f,
};`],[`	let relW = rel + h * liftDir(F.origin + a_pos.xy, dir);   // 楕円体＝測地法線
`,`	let relW = rel + h * liftDir(F.origin + a_pos.xy, dir);   // 楕円体＝測地法線
	o.sc = shClip(relW + (F.originPt - SH.anchor.xyz));
`],["	let c = mix(P.p0.rgb * in.shade, F.fogColor, in.fog);","	let c = mix(shShade(P.p0.rgb * in.shade, in.sc), F.fogColor, in.fog);"]],"BUILDING_SH_WGSL")+vl(3),vf=Jt(ts,[[`	@location(3) fog: f32,
};`,`	@location(3) fog: f32,
	@location(4) sc: vec4f,
};`],[`	var p = B.clipMesh + F.mvp * vec4f(ap + h * liftDir(vec2f(lon, lat), dir), 0.0);   // 楕円体＝測地法線
`,`	let lp = ap + h * liftDir(vec2f(lon, lat), dir);
	o.sc = shClip(B.meshOrigin.xyz - SH.anchor.xyz + lp);   // バッチ原点−main 原点（f32 差＝バッチ内一定の ≤0.4m）
	var p = B.clipMesh + F.mvp * vec4f(lp, 0.0);
`],["	let sunK = 1.0;   // 影の受け手","	let sunK = shLit(in.sc);   // 影の受け手"],[`	var lit = P.p1.rgb * d;   // 従来（fx.pbr off）
`,`	var lit = shShade(P.p1.rgb * d, in.sc);   // 従来（fx.pbr off）＝全体を暗く
`]],"MESH_SH_WGSL")+vl(3),mf=Jt(gl,[[`	@location(5) col: vec4f,
};`,`	@location(5) col: vec4f,
	@location(6) sc: vec4f,
};`],[`	var p = B.clipMesh + F.mvp * vec4f(ap + h * liftDir(vec2f(lon, lat), dir), 0.0);   // 楕円体＝測地法線
`,`	let lp = ap + h * liftDir(vec2f(lon, lat), dir);
	o.sc = shClip(B.meshOrigin.xyz - SH.anchor.xyz + lp);   // バッチ原点−main 原点（MESH_SH と同じ）
	var p = B.clipMesh + F.mvp * vec4f(lp, 0.0);
`],["	let sunK = 1.0;   // 影の受け手","	let sunK = shLit(in.sc);   // 影の受け手"],["	var lit = srgbEncode(tx.rgb) * d;   // 従来（fx.pbr off）","	var lit = shShade(srgbEncode(tx.rgb) * d, in.sc);   // 従来（fx.pbr off）"]],"MESH_TEX_SH_WGSL")+vl(2,1),xf=Jt(Bf,[["	let col = atmGround(base, A, Pt, normalize(A - Pt), G.sun.w);",`	base = shShade(base, shClip(Pt - SH.anchor.xyz));   // 球の床（海抜0）＝低地と真俯瞰の地面
	let col = atmGround(base, A, Pt, normalize(A - Pt), G.sun.w);`]],"GLOBE_SH_WGSL")+vl(1),Ma=Jt(es,[[`	p.z = logDepthZ(p.w);
	o.pos = p;`,"	o.pos = p;"],[`@fragment fn fs(in: BldOut) -> @location(0) vec4f {
	if (in.front < 0.0) { discard; }`,"@fragment fn fs(in: BldOut) {"],[`	let c = mix(P.p0.rgb * in.shade, F.fogColor, in.fog);
	return vec4f(c * P.p0.w, P.p0.w);   // ×グローバルα（クロスフェード・通常1＝不変）
}`,"}"]],"BUILDING_CAST_WGSL"),bf=Jt(ts,[[`	p.z = logDepthZ(p.w);
`,""]],"MESH_CAST_WGSL"),yf=Jt(gl,[[`	p.z = logDepthZ(p.w);
`,""]],"MESH_TEX_CAST_WGSL")+`
@fragment fn fsCast(in: PlOut) {
	let a = textureSample(texT, texS, in.uv).a * in.col.a;
	if (a < B.alpha.x) { discard; }
}
`,D1=2.5,Ra=Jt(Da,[[`	var p = F.clipT + F.mvp * vec4f(relW, 0.0);
	p.z = logDepthZ(p.w);
	o.pos = p;`,`	var p = F.clipT + F.mvp * vec4f(relW - (select(${D1.toFixed(1)}, 0.0, F.elevP.w > 0.5) * F.elevP.x) * liftDir(a_ll, dir), 0.0);   // 落とす側だけ沈める（SH_TERR_SINK_M）
	o.pos = p;`]],"TERRAIN_CAST_WGSL"),k1=Ra+`
@fragment fn fsCast(in: TerrOut) {
	if (F.farP.z < 0.5 && F.nearP.x > 0.5) {
		let uvF = (in.ll - F.nearBounds.xy) / F.nearBounds.zw;
		if (uvF.x >= 0.0 && uvF.x <= 1.0 && uvF.y >= 0.0 && uvF.y <= 1.0) { discard; }
	}
	if (F.farP.z > 1.5 && F.farP.z < 2.5 && F.fineP.x > 0.5) {
		let uvG = (in.ll - F.fineBounds.xy) / F.fineBounds.zw;
		if (uvG.x >= 0.0 && uvG.x <= 1.0 && uvG.y >= 0.0 && uvG.y <= 1.0) { discard; }
	}
}
`,Ff=(s,p=0)=>`
struct ClipP { pl: array<vec4f, 6>, p: vec4f, capT: vec4f, capB: vec4f, edgeC: vec4f, pe: vec4f, pn: vec4f, pv: array<vec4f, 64> };   // p.x＝面の枚数（clip.js CLIP_MAX と対）・p.y＝縁の帯の幅（CSS px・0＝無し）・p.z＝多角形の辺の数（CLIP_POLY_MAX と対）・p.w＝1 で内側だけ残す
@group(${s}) @binding(${p}) var<uniform> CL: ClipP;
// 多角形（P0 #4）：pe・pn＝重心の接平面の東・北（w＝K）・pv[i]＝辺 (a.xy, b.xy)。2D の点は原点相対の位置から線形＝頂点で出して補間してよい
fn polyXY(rel: vec3f) -> vec2f { return vec2f(dot(CL.pe.xyz, rel) + CL.pe.w, dot(CL.pn.xyz, rel) + CL.pn.w); }
fn polyD(q: vec2f) -> f32 {   // 符号付きの距離（残る側が正）＝辺までの最短・内外は偶奇
	let n = u32(CL.p.z);
	if (n == 0u) { return 1e30; }
	var d2 = 1e30;
	var inside = false;
	for (var i = 0u; i < n; i++) {
		let a = CL.pv[i].xy; let b = CL.pv[i].zw;
		if ((a.y > q.y) != (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) { inside = !inside; }
		let v = b - a; let t = clamp(dot(q - a, v) / max(dot(v, v), 1e-30), 0.0, 1.0); let w = q - a - t * v;
		d2 = min(d2, dot(w, w));
	}
	var d = sqrt(d2);
	if (inside != (CL.p.w > 0.5)) { d = -d; }
	return d;
}
fn clipDist(rel: vec3f) -> f32 {   // 画素で位置が分かる時（球の床・蓋）＝全部の面と多角形の最小
	var d = 1e30;
	let n = u32(CL.p.x);
	for (var i = 0u; i < n; i++) { d = min(d, dot(CL.pl[i].xyz, rel) + CL.pl[i].w); }
	return min(d, polyD(polyXY(rel)));
}
fn clipD(rel: vec3f, i: u32) -> f32 { if (i < u32(CL.p.x)) { return dot(CL.pl[i].xyz, rel) + CL.pl[i].w; } return 1e30; }
fn clipA(rel: vec3f) -> vec4f { return vec4f(clipD(rel, 0u), clipD(rel, 1u), clipD(rel, 2u), clipD(rel, 3u)); }   // 面 0〜3 の距離（頂点）
fn clipB(rel: vec3f) -> vec4f { return vec4f(clipD(rel, 4u), clipD(rel, 5u), polyXY(rel)); }                    // 面 4〜5＋多角形の 2D の点
fn clipMin(a: vec4f, b: vec4f) -> f32 { return min(min(min(min(a.x, a.y), min(a.z, a.w)), min(b.x, b.y)), polyD(b.zw)); }   // 画素で最小（負＝どれかの面の外か多角形で消す側）
fn clipOut(a: vec4f, b: vec4f) -> bool { return clipMin(a, b) < 0.0; }
`,Gd=(s,p,_)=>p.reduce((A,D)=>{for(const[C,F]of D){const le=A.split(C).length;if(le===2)return A.replace(C,F);if(le>2)throw new Error(`wgsl derive(${_}): anchor ambiguous: ${C.slice(0,50)}`)}throw new Error(`wgsl derive(${_}): anchor missing: ${D[0][0].slice(0,50)}`)},s),Wn=(s,p)=>[[s,`${s}	@location(${p}) cdA: vec4f,
	@location(${p+1}) cdB: vec4f,
`]],Ui=s=>`o.cdA = clipA(${s}); o.cdB = clipB(${s});`,rf=`	let cm = clipMin(in.cdA, in.cdB); let cw = fwidth(cm);
	if (cm < 0.0) { discard; }
	if (CL.p.y > 0.0 && cm < CL.p.y * F.params.w * cw) { return vec4f(CL.edgeC.rgb, 1.0); }
`,I1=`	let cm = clipMin(in.cdA, in.cdB); let cw = fwidth(cm);
	if (cm < 0.0) { discard; }
	let edgeOn = CL.p.y > 0.0 && cm < CL.p.y * F.params.w * cw;
`,Sa=`	if (clipOut(in.cdA, in.cdB)) { discard; }
`,Ba=[[`	var p = B.clipMesh + F.mvp * vec4f(ap + h * liftDir(vec2f(lon, lat), dir), 0.0);   // 楕円体＝測地法線
`,`	let lp = ap + h * liftDir(vec2f(lon, lat), dir);
	${Ui("B.clipO.xyz + lp")}
	var p = B.clipMesh + F.mvp * vec4f(lp, 0.0);
`],[`	var p = B.clipMesh + F.mvp * vec4f(lp, 0.0);
`,`	${Ui("B.clipO.xyz + lp")}
	var p = B.clipMesh + F.mvp * vec4f(lp, 0.0);
`]],Fa=[["sh: array<vec4f, 9>, pad: vec4f,","sh: array<vec4f, 9>, clipO: vec4f,"]],Ku=[[`	if (B.meshOrigin.w > 0.5 && fe < -0.02) { discard; }
`,`	if (B.meshOrigin.w > 0.5 && fe < -0.02) { if (CL.capB.w > 0.5) { return vec4f(CL.capB.rgb, 1.0); } discard; }
`]],N1={terr:[Wn(`	@location(8) guv3: vec2f,
`,10),[[`	let relW = rel + (h * F.elevP.x) * liftDir(a_ll, dir);   // 楕円体＝測地法線
`,`	let relW = rel + (h * F.elevP.x) * liftDir(a_ll, dir);   // 楕円体＝測地法線
	${Ui("relW")}
`]],[[`	let mpp = terrMpp(in.ll);   // 画素の地上寸法(m)＝下の低地フェード帯の上端。微分は discard より前（一様制御フロー）
`,`	let mpp = terrMpp(in.ll);   // 画素の地上寸法(m)＝下の低地フェード帯の上端。微分は discard より前（一様制御フロー）
`+I1]],[["	return vec4f(col * t * P.p2.w, t * P.p2.w);",`	if (edgeOn) { return vec4f(CL.edgeC.rgb, 1.0); }
	return vec4f(col * t * P.p2.w, t * P.p2.w);`]]],mesh:[Fa,Wn(`	@location(3) fog: f32,
`,5),Ba,[[`	let gnRaw = cross(dpdx(in.toEye), dpdy(in.toEye));
`,`	let gnRaw = cross(dpdx(in.toEye), dpdy(in.toEye));
`+rf]],Ku],meshTex:[Fa,Wn(`	@location(5) col: vec4f,
`,7),Ba,[[`	let dpx = dpdx(in.toEye); let dpy = dpdy(in.toEye); let dux = dpdx(in.uv); let duy = dpdy(in.uv);   // 法線マップの接線（微分＝ここで確定）
`,`	let dpx = dpdx(in.toEye); let dpy = dpdy(in.toEye); let dux = dpdx(in.uv); let duy = dpdy(in.uv);   // 法線マップの接線（微分＝ここで確定）
`+rf]],Ku],fill:[Wn(`	@location(9) guv3: vec2f,
`,11),[["	o.color = a_color;",`	${Ui("rel")}
	o.color = a_color;`]],[[`@fragment fn fs(in: FillOut) -> @location(0) vec4f {
`,`@fragment fn fs(in: FillOut) -> @location(0) vec4f {
`+Sa]]],line:[Wn(`	@location(6) fog: f32,
`,8),[[`	o.fog = fogOf((wa + wb) * 0.5);
`,`	o.fog = fogOf((wa + wb) * 0.5);
	let cpos = select(relWb, relWa, corner.x < 0.5);   // 端点ごと＝線分に沿って線形（幅の張り出しは同じ値）
	${Ui("cpos")}
`]],[[`@fragment fn fs(in: LineOut) -> @location(0) vec4f {
`,`@fragment fn fs(in: LineOut) -> @location(0) vec4f {
`+Sa]]],bld:[Wn(`	@location(3) ll: vec2f,   // 絶対 lon/lat＝被覆マスクの uv 参照
`,5),[[`	let relW = rel + h * liftDir(F.origin + a_pos.xy, dir);   // 楕円体＝測地法線
`,`	let relW = rel + h * liftDir(F.origin + a_pos.xy, dir);   // 楕円体＝測地法線
	${Ui("relW")}
`]],[[`@fragment fn fs(in: BldOut) -> @location(0) vec4f {
`,`@fragment fn fs(in: BldOut) -> @location(0) vec4f {
`+rf]]],globe:[[[`	let Pt = A + t * d;                                                       // 絶対（霞・大気・低ズームの粗い用途）
`,`	let Pt = A + t * d;                                                       // 絶対（霞・大気・低ズームの粗い用途）
	if (clipDist(G.eyeO.xyz + t * d) < 0.0) {
		let t2 = select(-1.0, (-bb + sqrt(max(disc, 0.0))) / (2.0 * aa), disc >= 0.0);   // 裏面（Cesium の globe.backFaceCulling=false・G.cgC.w）＝遠い根の内側を裏面の色で
		if (G.cgC.w > 0.5 && !ug && t2 > t && clipDist(G.eyeO.xyz + t2 * d) >= 0.0) { t = t2; ug = true; } else { discard; }
	}
`]]],terrCast:[Wn(`	@location(8) guv3: vec2f,
`,10),[[`	let relW = rel + (h * F.elevP.x) * liftDir(a_ll, dir);   // 楕円体＝測地法線
`,`	let relW = rel + (h * F.elevP.x) * liftDir(a_ll, dir);   // 楕円体＝測地法線
	${Ui("relW")}
`]]],meshCast:[Fa,Wn(`	@location(3) fog: f32,
`,5),Ba],meshTexCast:[Fa,Wn(`	@location(5) col: vec4f,
`,7),Ba,[[`@fragment fn fsCast(in: PlOut) {
`,`@fragment fn fsCast(in: PlOut) {
`+Sa]]],bldCast:[Wn(`	@location(3) ll: vec2f,   // 絶対 lon/lat＝被覆マスクの uv 参照
`,5),[[`	let relW = rel + h * liftDir(F.origin + a_pos.xy, dir);   // 楕円体＝測地法線
`,`	let relW = rel + h * liftDir(F.origin + a_pos.xy, dir);   // 楕円体＝測地法線
	${Ui("relW")}
`]],[["@fragment fn fs(in: BldOut) {",`@fragment fn fs(in: BldOut) {
`+Sa]]]},cr=(s,p,_,A,D=0,C="")=>Gd(s,N1[p],_)+Ff(A,D)+C,V1=cr(Da,"terr","TERRAIN_CLIP_WGSL",3),W1=cr(ts,"mesh","MESH_CLIP_WGSL",3),q1=cr(gl,"meshTex","MESH_TEX_CLIP_WGSL",2,1),Qu=cr(Ua,"fill","FILL_CLIP_WGSL",2),nf=cr(Jo,"line","LINE_CLIP_WGSL",2),Zu=cr(es,"bld","BUILDING_CLIP_WGSL",3),H1=cr(Bf,"globe","GLOBE_CLIP_WGSL",1),X1=cr(gf,"terr","TERRAIN_SH_CLIP_WGSL",3,3),$1=cr(vf,"mesh","MESH_SH_CLIP_WGSL",3,3),Y1=cr(mf,"meshTex","MESH_TEX_SH_CLIP_WGSL",2,4),Ju=cr(Ca,"fill","FILL_SH_CLIP_WGSL",2,3),lf=cr(ao,"line","LINE_SH_CLIP_WGSL",2,3),ed=cr(Ea,"bld","BUILDING_SH_CLIP_WGSL",3,3),j1=cr(xf,"globe","GLOBE_SH_CLIP_WGSL",1,3),K1=cr(Ra,"terrCast","TERRAIN_CAST_CLIP_WGSL",1,0,`
@fragment fn fsClip(in: TerrOut) { if (clipOut(in.cdA, in.cdB)) { discard; } }
`),Q1=cr(bf,"meshCast","MESH_CAST_CLIP_WGSL",3,0,`
@fragment fn fsClip(in: PlOut) { if (clipOut(in.cdA, in.cdB)) { discard; } }
`),Z1=cr(yf,"meshTexCast","MESH_TEX_CAST_CLIP_WGSL",2,1),td=cr(Ma,"bldCast","BUILDING_CAST_CLIP_WGSL",3),J1=Gd(Fd,[[[`@fragment fn fsCover(in: CoOut) -> @location(0) vec4f {
`,`@fragment fn fsCover(in: CoOut) -> @location(0) vec4f {
	if (ovClipped(in.pos.xy)) { discard; }
`]]],"OVERLAY_CLIP_WGSL")+Ff(2)+`
fn ovClipped(px: vec2f) -> bool {
	let ndc = vec2f(px.x / F.viewport.x * 2.0 - 1.0, 1.0 - px.y / F.viewport.y * 2.0);
	let d = F.rayF.xyz + ndc.x * F.rayX.xyz + ndc.y * F.rayY.xyz;
	let aa = dot(d, d); let bb = 2.0 * dot(F.eyeC.xyz, d);
	let O = F.originPt; let rho = length(O.xz);
	var hW = 0.0;   // 球の半径の上乗せ（単位球）＝地表の高さ
	var rel = vec3f(0.0);
	for (var k = 0; k < 3; k++) {
		let cc = F.eyeC.w - (2.0 * hW + hW * hW);   // |E|² − (1+h)²（|E|²−1 は CPU f64）
		let disc = bb * bb - 4.0 * aa * cc;
		if (disc < 0.0 || (bb >= 0.0 && cc >= 0.0)) { return true; }
		let q = -bb + sqrt(disc);
		if (q <= 0.0) { return true; }
		rel = F.eyeO.xyz + (2.0 * cc / q) * d;
		let dll = deltaLL(rel, O, rho, F.eyeO.w, F.ellP.x);
		hW = (elevQ(F.origin + dll) + P.p0.y) * F.elevP.x;
	}
	return clipDist(rel) < 0.0;
}
`,em=`
${rn}
${Ff(1,0)}
struct CapP { g: vec4f, h: vec4f, q: array<vec4f, 18> };   // g＝(原点の格子座標 xy, 格子/度 xy)・h＝(G−1, 遠窓の回, 0, 0)・q[i*3..]＝面 i の四角（中心の原点相対 xyz, 軸 A, 軸 B）
@group(1) @binding(1) var<uniform> CP: CapP;
struct CapOut { @builtin(position) pos: vec4f, @location(0) x: vec3f, @location(1) @interpolate(flat) pi: u32 };
@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> CapOut {
	var o: CapOut;
	var cs = array<vec2f, 6>(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0), vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0));
	let c = cs[vi];
	let X = CP.q[ii * 3u].xyz + c.x * CP.q[ii * 3u + 1u].xyz + c.y * CP.q[ii * 3u + 2u].xyz;
	var p = F.clipT + F.mvp * vec4f(X, 0.0);
	p.z = 0.5 * p.w;   // 深度は FS で画素ごとに書く＝頂点の z はクリップ（0≤z≤w＝目の面 w=0 で正しく切る）のためだけ。対数深度を頂点に書くと、目の後ろへ回った隅（w<0）で z が壊れ、見えている部分まで切り落とされた
	o.pos = p; o.x = X; o.pi = ii;
	return o;
}
fn capDf(dll: vec2f) -> f32 {   // 地形の頂点と同じ距離フェード（遠景の平ら化）
	let dir = F.originPt + deltaToRel(dll);
	return 1.0 - smoothstep(F.params.y * 0.8, F.params.y * 2.0, distance(F.eye, dir));
}
fn capVert(gi: vec2f) -> f32 {   // 格子頂点 gi の高さ（地形の VS と同じ：絶対経緯度＝窓の原点＋窓の幅×uv）
	let N = CP.h.x;
	let ll = F.mesh.xy + F.mesh.zw * (gi / N);
	return elev(ll) * capDf(ll - F.origin);
}
struct CapFrag { @location(0) c: vec4f, @builtin(frag_depth) d: f32 };
@fragment fn fs(in: CapOut) -> CapFrag {
	let X = in.x;
	// 他の面の外（箱の角）
	let n = u32(CL.p.x);
	for (var i = 0u; i < n; i++) { if (i != in.pi && dot(CL.pl[i].xyz, X) + CL.pl[i].w < 0.0) { discard; } }
	if (polyD(polyXY(X)) < 0.0) { discard; }   // 多角形で消す側（P0 #4）
	// 足と高さ：動径の足から始めて、測地法線に沿って 2 回詰める（楕円体の法線は動径から最大 0.19° 開く）
	let O = F.originPt; let rho = length(O.xz);
	var dll = deltaLL(X, O, rho, F.eyeO.w, F.ellP.x);
	var z = 0.0;
	for (var k = 0; k < 2; k++) {
		let u = deltaToRel(dll);
		let L = liftDir(F.origin + dll, O + u);
		z = dot(X - u, L) / dot(L, L);
		dll = deltaLL(X - z * L, O, rho, F.eyeO.w, F.ellP.x);
	}
	let zm = z / max(F.elevP.x, 1e-30);
	if (zm < 0.0) { discard; }   // 床（海抜 0）より下＝地面の外
	if (dot(O + deltaToRel(dll), F.eye) - 1.0 < -0.0015) { discard; }   // 地平線の向こう（地形と同じ）
	// 窓の分担：近窓の回＝窓の外を捨てる／遠窓の回＝近窓（標高アトラス）の内側を捨てる
	let N = CP.h.x;
	let gc = CP.g.xy + dll * CP.g.zw;
	if (CP.h.y > 0.5) {
		let uvN = (F.origin + dll - F.elevBounds.xy) / F.elevBounds.zw;
		if (uvN.x >= 0.0 && uvN.x <= 1.0 && uvN.y >= 0.0 && uvN.y <= 1.0) { discard; }
	}
	if (gc.x < 0.0 || gc.y < 0.0 || gc.x > N || gc.y > N) { discard; }
	// 地表の高さ＝地形メッシュと同じ三角形
	let g = min(gc, vec2f(N - 1e-4));
	let gi = floor(g); let gf = g - gi;
	var ht: f32;
	if (gf.x + gf.y < 1.0) { let h00 = capVert(gi); ht = h00 + gf.x * (capVert(gi + vec2f(1.0, 0.0)) - h00) + gf.y * (capVert(gi + vec2f(0.0, 1.0)) - h00); }
	else { let h11 = capVert(gi + vec2f(1.0)); ht = h11 + (1.0 - gf.x) * (capVert(gi + vec2f(0.0, 1.0)) - h11) + (1.0 - gf.y) * (capVert(gi + vec2f(1.0, 0.0)) - h11); }
	if (zm > ht) { discard; }   // 地表より上＝空
	var out: CapFrag;
	out.c = vec4f(mix(CL.capT.rgb, F.fogColor, fogOf(O + X)), 1.0);
	let pc = F.clipT + F.mvp * vec4f(X, 0.0);
	out.d = fragDepthOf(pc.w);   // 級数の log1p（#62・0.76m の階段を作らない）
	return out;
}
`,tm=`
struct RP {
	dim: vec4u,   // w, h, kind(0=Int16 1=Float32), mode(0=down 1=box 2=crop 3=float)
	a: vec4f,     // mode 3: ax, bx, ay, by（gx = ax + bx·(i+0.5)）
	lo: vec4f,    // mode 3: gx∈[x,y]・gy∈[z,w]
	o: vec4u,     // ox, oy（セル原点 texel）, N, k
	box: vec4u,   // mode 1: AW, rowN0, col0, 0／mode 0: M（読まない最外周の画素数）
	ix: vec4u,    // mode 0/2: Ax, Bx, Dx, shift（gx = (Ax + Bx·(2i+1))/Dx − shift＝画素中心の −½ を符号なしで書くための下駄・2026-10-02）
	iy: vec4u,    // mode 0/2: Ay, By, Dy, shift
};
@group(0) @binding(0) var<uniform> R: RP;
@group(0) @binding(1) var<storage, read> raw: array<u32>;
fn rdRaw(idx: u32) -> f32 {
	if (R.dim.z == 0u) { return f32(extractBits(bitcast<i32>(raw[idx >> 1u]), (idx & 1u) * 16u, 16u)); }
	return bitcast<f32>(raw[idx]);
}
fn rd(idx: u32) -> f32 {
	let v = rdRaw(idx);
	if (!(v >= select(-420.0, -11500.0, R.box.w == 1u) && v <= 9000.0)) { return 0.0; }   // 異常値（int16 巨大値／-9999／NaN）は 0（box.w＝1：海底＝GEBCO の負値を通す）
	return v;
}
@vertex fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
	return vec4f(f32(i32(vi & 1u) * 4 - 1), f32(i32(vi >> 1u) * 4 - 1), 0.0, 1.0);   // (-1,-1) (3,-1) (-1,3)
}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let i = u32(pos.x) - R.o.x; let j = u32(pos.y) - R.o.y;   // セル内 (列, 南からの行)
	let w = R.dim.x; let h = R.dim.y; let mode = R.dim.w;
	var v: f32;
	if (mode == 1u) {
		let k = R.o.w; let C = R.o.z * k;
		let srcRow = R.box.y + (C - 1u - j * k);
		var sum = 0.0;
		for (var jj = 0u; jj < k; jj++) { let s = (srcRow - jj) * R.box.x + R.box.z + i * k; for (var ii = 0u; ii < k; ii++) { sum += rdRaw(s + ii); } }
		v = sum / f32(k * k);
	} else {
		var x0: u32; var fx: f32; var y0: u32; var fy: f32;
		if (mode == 3u) {
			let gx = clamp(R.a.x + R.a.y * (f32(i) + 0.5), R.lo.x, R.lo.y);
			let gy = clamp(R.a.z + R.a.w * (f32(j) + 0.5), R.lo.z, R.lo.w);
			x0 = u32(clamp(floor(gx), 0.0, f32(w - 2u))); fx = clamp(gx - f32(x0), 0.0, 1.0);
			y0 = u32(clamp(floor(gy), 0.0, f32(h - 2u))); fy = clamp(gy - f32(y0), 0.0, 1.0);
		} else {
			let nx = R.ix.x + R.ix.y * (2u * i + 1u); var qx = nx / R.ix.z; let rx = nx - qx * R.ix.z;
			let ny = R.iy.x + R.iy.y * (2u * j + 1u); var qy = ny / R.iy.z; let ry = ny - qy * R.iy.z;
			let negx = qx < R.ix.w; let negy = qy < R.iy.w;   // gx < 0（タイル西端・南端の半画素）＝画素 0 でクランプ（CPU の x0=0・fx=0 と同じ）
			qx = select(qx - R.ix.w, 0u, negx); qy = select(qy - R.iy.w, 0u, negy);
			x0 = qx; fx = select(f32(rx) / f32(R.ix.z), 0.0, negx); y0 = qy; fy = select(f32(ry) / f32(R.iy.z), 0.0, negy);
			if (mode == 0u) {   // downsampleFlipped：gx を [M, w−1−M] に clamp
				let M = R.box.x;
				if (qx < M) { x0 = M; fx = 0.0; } else if (qx > w - 1u - M || (qx == w - 1u - M && rx > 0u)) { x0 = w - 1u - M; fx = 0.0; }
				if (qy < M) { y0 = M; fy = 0.0; } else if (qy > h - 1u - M || (qy == h - 1u - M && ry > 0u)) { y0 = h - 1u - M; fy = 0.0; }
			} else {            // cropResample：x0 = clamp(floor, 0, w−2)・fx = clamp(gx − x0, 0, 1)
				if (qx > w - 2u) { x0 = w - 2u; fx = 1.0; }
				if (qy > h - 2u) { y0 = h - 2u; fy = 1.0; }
			}
		}
		let r0 = (h - 1u - y0) * w; let r1 = r0 - w;   // データ行（北上げ）：y0 の行と 1 行北
		let a = rd(r0 + x0); let b = rd(r0 + x0 + 1u); let c = rd(r1 + x0); let d = rd(r1 + x0 + 1u);
		let t = a + (b - a) * fx;
		v = t + ((c + (d - c) * fx) - t) * fy;
	}
	return vec4f(select(max(v, 0.0), v, R.box.w == 1u), 0.0, 0.0, 1.0);
}
`,Td=3e-9,co=Td.toExponential();function Aa(s,p=""){let _=s.split("log1pS(max(wTrue(w), 1e-30)) * 1.4426950 * F.params.z * 0.5 * w").join(`select(${co}, ${co} / F.nearP.w, F.nearP.w > 0.0)`);if(_=_.replace(/log1p[SG]\(max\(([\w.]+), 1e-30\)\) \* 1\.4426950 \* [\w.]+ \* 0\.5 \* \1/g,co),_=_.replace(/log1p[SG]\(max\((wTrue\(\w+\)|[\w.]+), 1e-30\)\) \* 1\.4426950 \* [\w.]+ \* 0\.5/g,`clamp(${co} / max($1, 1e-30), 0.0, 1.0)`),_=_.split(`	o.d = 1.0;
	let h = sphereRay(`).join(`	o.d = 0.0;
	let h = sphereRay(`).split("o.d = clamp(log2(1.0 + h.t) * G.farP.w, 0.0, 1.0);").join(`o.d = clamp(${co} / max(h.t, 1e-30), 0.0, 1.0);`),_=_.split("select(0.0, clamp(").join("select(1.0, clamp("),_.includes("1.4426950"))throw new Error(`rzWgsl(${p}): a log-depth expression is left`);return _}function fo(s,p,_){if(!new RegExp(`var ${p}\\s*:`).test(s))return s;const A=`rzLog_${p}`,D=`textureLoad(${p},`;let C="",F=0;for(;;){const le=s.indexOf(D,F);if(le<0){C+=s.slice(F);break}let Se=0,ee=le+11;for(;ee<s.length;ee++){const N=s[ee];if(N==="(")Se++;else if(N===")"&&--Se===0)break}C+=s.slice(F,le)+`${A}(${s.slice(le,ee+1)})`,F=ee+1}return C+`
fn ${A}(d: f32) -> f32 {   // near／w → 対数深度の値（ln(1+w)／k）。0＝消した値＝深度なし（1）
	if (d <= 0.0) { return 1.0; }
	let w = ${co} / d;
	var l = log(1.0 + w);
	if (w < 0.1) { l = w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715)))))); }
	return min(l / (${_}), 0.99999994);
}
`}function rd(s,p=""){const _=/@fragment fn fs\(in: (\w+)(, @builtin\(front_facing\) ff: bool)?\) -> @location\(0\) vec4f \{/.exec(s);if(!_)throw new Error(`fragDepth(${p}): fs not found`);const A=_[1],D=s.indexOf(`struct ${A} {`);if(D<0)throw new Error(`fragDepth(${p}): struct ${A} not found`);const C=s.indexOf(`
};`,D);if(C<0)throw new Error(`fragDepth(${p}): struct ${A} not closed`);let F=s.slice(0,C)+`
	@location(15) cw: f32,   // clip w（frag_depth 用・#62）`+s.slice(C);const le=`	p.z = logDepthZ(p.w);
	o.pos = p;`;if(F.split(le).length!==2)throw new Error(`fragDepth(${p}): vs anchor missing/ambiguous`);F=F.replace(le,`	p.z = select(logDepthZ(p.w), nearClipZ(p.w), F.ellP.w > 0.0);
	o.pos = p; o.cw = p.w;`);const Se=!!_[2];return F=F.replace(_[0],`fn fsColor(in: ${A}${Se?", ff: bool":""}) -> vec4f {`),F+`
struct ${A}Frag { @location(0) c: vec4f, @builtin(frag_depth) d: f32 };
@fragment fn fs(in: ${A}${Se?", @builtin(front_facing) ff: bool":""}) -> ${A}Frag {   // 色は元の fs（fsColor）・深度は画素ごとに対数深度（#62）
	var o: ${A}Frag;
	o.c = fsColor(in${Se?", ff":""});
	o.d = fragDepthOf(in.cw);
	return o;
}
`}const rm=`fn ptRowOf(c: vec4f) -> u32 { return u32(c.r * 255.0 + 0.5) + u32(c.g * 255.0 + 0.5) * 256u; }
`,of=(s,p,_)=>Jt(s,[[`@vertex fn vs(@location(0) a_delta: vec2f, @location(1) a_color: vec4f) -> ${p} {
	var o: ${p};
`,`@group(3) @binding(0) var<storage, read> PT: array<vec4f>;   // paint 表の (b) 類（2 語/行）
${rm}@vertex fn vs(@location(0) a_delta0: vec2f, @location(1) a_color: vec4f, @location(2) a_tile: vec2f) -> ${p} {
	var o: ${p};
	let a_delta = a_tile + a_delta0;   // タイル原点差（小）を先に足す＝原点相対 delta を確定
`],["	if (P.pz.x > 0.5) { o.color = P.pzC; }","	if (P.pz.x > 0.5) { o.color = P.pzC; } else if (P.pzO.z > 0.5) { o.color = PT[ptRowOf(a_color) * 2u]; }   // ズーム連続の色・paint 表の (b) 類（色の語が行）"]],_),_d=`	var q0 = p1; var q3 = p2; var jf0 = 0u; var dist0 = 0.0;   // LINEX：端と継ぎの相手の点と旗・破線の距離（classic の X 派生と md の派生が差し替える）
`,nm=(s,p)=>Jt(s,[[`@vertex fn vs(
	@location(0) corner: vec2f,
	@location(1) p1: vec2f, @location(2) p2: vec2f,
	@location(3) col: vec4f, @location(4) halfPx: f32, @location(5) offT: vec3f,
) -> LineOut {
	var o: LineOut;
`,`@group(3) @binding(0) var<storage, read> SEG: array<vec4u>;   // 線分プール（2 語組/線分）
@group(3) @binding(1) var<storage, read> PT: array<vec4f>;   // paint 表の (b) 類（2 語/行）
@vertex fn vs(@builtin(vertex_index) vi: u32, @location(0) a_tile: vec2f) -> LineOut {
	var o: LineOut;
	let seg = vi / 6u; let k = vi - seg * 6u;
	let corner = vec2f(select(0.0, 1.0, k == 2u || k == 3u || k == 5u), select(-1.0, 1.0, k == 1u || k == 4u || k == 5u));   // CORNERS＝(0,-1)(0,1)(1,-1)(1,-1)(0,1)(1,1)
	let A = SEG[seg * 2u]; let B = SEG[seg * 2u + 1u];
	let p1 = bitcast<vec2f>(A.xy) + a_tile; let p2 = bitcast<vec2f>(A.zw) + a_tile;   // タイル原点差はここ（小さい値同士）で足す
	let ptRow = B.x & 65535u;   // paint 表の (b) 類＝語 4 が行（P.pzO.z＝1 色・2 色と線の半幅＝段 2b・gl LINE_MD_VS と同式）
	let col = select(unpack4x8unorm(B.x), PT[ptRow * 2u], P.pzO.z > 0.5); let halfPx = select(bitcast<f32>(B.y & ~15u), bitcast<f32>(bitcast<u32>(PT[ptRow * 2u + 1u].x) & ~15u), P.pzO.z > 1.5);   // 下位 4 bit＝端と継ぎの旗（S-P1-1・GL2 の LINE_MD_VS と同じ読み方）＝表の半幅も旗の 4 bit を落とす（焼いた半幅と bit 同値）
	let offT = vec3f(bitcast<f32>(B.z), unpack2x16snorm(B.w) * 2.0);
`],[_d,`	var q0 = p1; var q3 = p2; var jf0 = 0u; var dist0 = 0.0;
	if (P.dashP.y > 0.5 || P.patP.x > 1.5) { dist0 = bitcast<f32>(B.z); off0.x = P.tr.w; }   // 破線の列（S-P1-3）・線の模様（G-4）＝語 6 は始点までの線に沿う距離・ずらしは層で 1 つの値（P.tr.w・語 7＝角の継ぎ）
	if (P.lx.z > 0.5) {   // 端と継ぎ（S-P1-1）：旗は半幅の下位 4 bit・継ぐ相手は同じ塊のすぐ前後の線分（旗が立つ時だけ読む）＝p1/p2 と同じ足し算でビット同値
		jf0 = B.y & 15u;
		if ((jf0 & 1u) != 0u) { let Pv = SEG[seg * 2u - 2u]; q0 = bitcast<vec2f>(Pv.xy) + a_tile; }
		if ((jf0 & 2u) != 0u) { let Nv = SEG[seg * 2u + 2u]; q3 = bitcast<vec2f>(Nv.zw) + a_tile; }
	}
`]],p),Ko=(s,p)=>Jt(s,[[`	@location(3) col: vec4f, @location(4) halfPx: f32, @location(5) offT: vec3f,
) -> LineOut {
	var o: LineOut;
`,`	@location(3) col: vec4f, @location(4) halfPx: f32, @location(5) offT: vec3f,
	@location(6) p0: vec2f, @location(7) p3: vec2f, @location(8) jd: vec2f,
) -> LineOut {
	var o: LineOut;
`],[_d,`	var q0 = p0; var q3 = p3; var jf0 = u32(jd.x); var dist0 = jd.y;   // 端と継ぎ（S-P1-1）・破線（S-P1-3）＝属性から
`]],p),nd=(s,p)=>Jt(s,[[`@vertex fn vs(@location(0) a_pos: vec3f, @location(1) a_shade: f32, @location(2) a_anchor: vec2f) -> BldOut {
	var o: BldOut;
`,`@vertex fn vs(@location(0) a_pos0: vec3f, @location(1) a_shade: f32, @location(2) a_anchor0: vec2f, @location(3) a_tile: vec2f) -> BldOut {
	var o: BldOut;
	let a_pos = vec3f(a_tile + a_pos0.xy, a_pos0.z); let a_anchor = a_tile + a_anchor0;   // タイル原点差（小）を先に足す
`]],p),zd=globalThis.Float16Array,im=zd!==void 0;function lm(s){return s instanceof Uint16Array?s:im?new Uint16Array(new zd(s).buffer):om(s)}function om(s){const p=s.length,_=new Uint16Array(p),A=new Uint32Array(s.buffer,s.byteOffset,p);for(let D=0;D<p;D++){const C=A[D],F=C>>>16&32768;let le=C>>>23&255,Se=C&8388607;if(le===255){_[D]=F;continue}if(le<113){_[D]=F;continue}const ee=Se&8191;Se>>=13,(ee>4096||ee===4096&&Se&1)&&(Se++,Se===1024&&(Se=0,le++)),_[D]=le>142?F|31743:F|le-112<<10|Se}return _}function sm(s){const p=s&32768?-1:1,_=s>>10&31,A=s&1023;return _===0?p*A*2**-24:_===31?A?NaN:p*(1/0):p*(1+A/1024)*2**(_-15)}const am=`
struct AP { mvp: mat4x4f, clipT: vec4f, q: vec4f };
@group(0) @binding(0) var<uniform> U: AP;
@group(0) @binding(1) var depth: texture_depth_2d;
@group(0) @binding(2) var<storage, read> pos: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> cnt: array<u32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g: vec3u) {
	let i = g.x;
	if (i >= u32(U.q.y)) { return; }
	let c = U.clipT + U.mvp * vec4f(pos[i].xyz, 0.0);
	let uv = vec2f(c.x * 0.5 + 0.5, 0.5 - c.y * 0.5);
	if (uv.x < 0.0 || uv.x >= 1.0 || uv.y < 0.0 || uv.y >= 1.0 || c.z <= 0.0 || c.z >= 1.0) { return; }
	let dim = vec2f(textureDimensions(depth));
	let z = textureLoad(depth, vec2i(uv * dim), 0);
	if (z < c.z - U.q.x) { cnt[i] = cnt[i] + 1u; }
}`,cm=`
struct AP { mvp: mat4x4f, clipT: vec4f, q: vec4f };
@group(0) @binding(0) var<uniform> U: AP;
@group(0) @binding(1) var depth: texture_depth_2d;
@group(0) @binding(2) var<storage, read> pos: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> S: array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g: vec3u) {
	let i = g.x;
	if (i >= u32(U.q.y)) { return; }
	let c = U.clipT + U.mvp * vec4f(pos[i].xyz, 0.0);
	let uv = vec2f(c.x * 0.5 + 0.5, 0.5 - c.y * 0.5);
	var h = pos[i].w;
	if (uv.x >= 0.0 && uv.x < 1.0 && uv.y >= 0.0 && uv.y < 1.0) {
		let dim = vec2f(textureDimensions(depth));
		let z = textureLoad(depth, vec2i(uv * dim), 0);
		if (z < 1.0) { h = max(h, (c.z - z) * U.q.x * U.q.z); }   // 深度が手前（＝高い）＝海抜 0 の点との差を m に（正射影＝深度は線形）・誇張を外す
	}
	S[i] = h;
}`,fm=`
struct MP { q0: vec4f, q1: vec4f, q2: vec4f };
@group(0) @binding(0) var<uniform> U: MP;
@group(0) @binding(1) var<storage, read> S: array<f32>;
@group(0) @binding(2) var<storage, read_write> vis: array<atomic<u32>>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g: vec3u) {
	let N = i32(U.q0.x);
	let r = i32(g.x);
	if (r >= 4 * N) { return; }
	let fN = f32(N);
	var tx = 0.0; var ty = 0.0;
	if (r < N) { tx = f32(r) + 0.5; ty = 0.5; }
	else if (r < 2 * N) { tx = f32(r - N) + 0.5; ty = fN - 0.5; }
	else if (r < 3 * N) { tx = 0.5; ty = f32(r - 2 * N) + 0.5; }
	else { tx = fN - 0.5; ty = f32(r - 3 * N) + 0.5; }
	let ox = U.q0.y; let oy = U.q0.z; let rCells = U.q0.w;
	let cellX = U.q1.x; let cellY = U.q1.y; let dropK = U.q1.z;
	let oi = clamp(i32(oy), 0, N - 1) * N + clamp(i32(ox), 0, N - 1);
	let z0 = S[oi] + U.q1.w;
	let dx = tx - ox; let dy = ty - oy; let L = sqrt(dx * dx + dy * dy);
	if (L < 1e-6) { return; }
	let steps = i32(ceil(L * 2.0));
	let sx = dx / f32(steps); let sy = dy / f32(steps);
	var maxSlope = -1e30;
	for (var k = 1; k <= steps; k++) {
		let x = ox + sx * f32(k); let y = oy + sy * f32(k);
		let ix = i32(x); let iy = i32(y);
		if (ix < 0 || iy < 0 || ix >= N || iy >= N) { break; }
		let ex = (x - ox) * cellX; let ey = (y - oy) * cellY;
		let d = sqrt(ex * ex + ey * ey);
		let i = iy * N + ix;
		let dr = d * d * dropK;
		let s = S[i];
		let tSlope = (s + U.q2.x - dr - z0) / d;
		let seen = tSlope >= maxSlope;
		let gx = x - ox; let gy = y - oy;
		if (seen && sqrt(gx * gx + gy * gy) <= rCells) { atomicMax(&vis[i], 1u); }
		let sSlope = (s - dr - z0) / d;
		if (sSlope > maxSlope) { maxSlope = sSlope; }
	}
}`;function id(s,p,_,A,D,C,F){const[le,Se,ee,N]=s,fe=yd(),W=Zo(),H=new Float32Array(p*_*4);for(let be=0;be<_;be++){const l=N-(be+.5)/_*(N-Se);for(let Ee=0;Ee<p;Ee++){const Z=le+(Ee+.5)/p*(ee-le),U=be*p+Ee,O=A&&A[U]||0,L=ir(Z,l),G=O*D+C/fe;let me;if(W)me=hd(Z,l);else{const Ie=Math.hypot(L[0],L[1],L[2])||1;me=[L[0]/Ie,L[1]/Ie,L[2]/Ie]}H[U*4]=L[0]+me[0]*G-F[0],H[U*4+1]=L[1]+me[1]*G-F[1],H[U*4+2]=L[2]+me[2]*G-F[2],H[U*4+3]=O}}return H}function ld(s,p,_){const[A,D,C,F]=s,le=yd(),Se=[];for(const[ee,N]of[[A,D],[C,D],[A,F],[C,F],[(A+C)/2,(D+F)/2]]){const fe=ir(ee,N);for(const W of[p,_]){const H=1+W/le;Se.push([fe[0]*H,fe[1]*H,fe[2]*H])}}return Se}const od=s=>`
@group(0) @binding(0) var dep: ${s?"texture_depth_multisampled_2d":"texture_depth_2d"};
@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
	let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
	return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let dim = vec2i(textureDimensions(dep));
	let xy = vec2i(i32(pos.x), dim.y - 1 - i32(pos.y));
	let v = min(floor(textureLoad(dep, xy, 0) * 16777215.0 + 0.5), 16777215.0);   // min＝d=1 の丸め上がり（GL 版の注）
	let r = floor(v / 65536.0);
	let g = floor((v - r * 65536.0) / 256.0);
	let b = v - r * 65536.0 - g * 256.0;
	return vec4f(r, g, b, 255.0) / 255.0;
}`;function um(s,p=!1){const _=p?s.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}):null,A=new OffscreenCanvas(1,1),D=A.getContext("webgpu");if(!D)throw new Error("depthout: webgpu context unavailable");D.configure({device:s,format:"rgba8unorm",alphaMode:"premultiplied",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST});let C=null;const F=new Map,le=W=>{let H=F.get(W);if(!H){const be=s.createShaderModule({code:p?fo(od(W)+`
@group(0) @binding(1) var<uniform> RK: vec4f;   // x＝2·ln2／logCoef（逆向きの浮動小数深度 → 対数深度の値へ直して詰める＝受け手の式は不変）
`,"dep","RK.x"):od(W)});H=s.createRenderPipeline({label:"depthout",layout:"auto",vertex:{module:be,entryPoint:"vs"},fragment:{module:be,entryPoint:"fs",targets:[{format:"rgba8unorm"}]},primitive:{topology:"triangle-list"}}),F.set(W,H)}return H};let Se=null,ee=null;function N(W){(!C||C.width!==W.w||C.height!==W.h)&&(C?.destroy(),C=s.createTexture({size:[W.w,W.h],format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}));const H=W.samples>1,be=le(H);Se!==W.tex&&(ee=s.createBindGroup({layout:be.getBindGroupLayout(0),entries:[{binding:0,resource:W.tex.createView({aspect:"depth-only"})},..._?[{binding:1,resource:{buffer:_}}]:[]]}),Se=W.tex),_&&s.queue.writeBuffer(_,0,new Float32Array([2*Math.LN2/Math.max(W.logCoef||0,1e-9),0,0,0]));const l=s.createCommandEncoder(),Ee=l.beginRenderPass({colorAttachments:[{view:C.createView(),loadOp:"clear",clearValue:{r:1,g:1,b:1,a:1},storeOp:"store"}]});Ee.setPipeline(be),Ee.setBindGroup(0,ee),Ee.draw(3),Ee.end(),s.queue.submit([l.finish()]);const Z=C,U=W.w,O=W.h;return{texture:Z,bitmap(){(A.width!==U||A.height!==O)&&(A.width=U,A.height=O);const L=s.createCommandEncoder();return L.copyTextureToTexture({texture:Z},{texture:D.getCurrentTexture()},[U,O]),s.queue.submit([L.finish()]),A.transferToImageBitmap()}}}function fe(){ee=null,Se=null,F.clear(),C?.destroy(),C=null,_?.destroy();try{D.unconfigure()}catch{}}return{encode:N,dispose:fe,bytes:()=>(C?C.width*C.height*4:0)+A.width*A.height*4}}const sd=`
struct U { mvp: mat4x4f, clip: vec4f, color: vec4f, p: vec4f, rel0: vec4f, eye: vec4f };   // rel0＝原点−目・eye.w＝|目|²−1（double）
@group(0) @binding(0) var<uniform> u: U;
struct O { @builtin(position) pos: vec4f, @location(0) w: f32, @location(1) rel: vec3f };
@vertex fn vs(@location(0) a: vec3f) -> O {
	var o: O;
	var p = u.clip + u.mvp * vec4f(a, 0.0);
	o.w = p.w;
	o.rel = u.rel0.xyz + a;
	p.z = log1pS(max(p.w, 1e-30)) * 1.4426950 * u.p.x * 0.5 * p.w;   // 1.0+w の桁落ちを避ける（下の log1pS）
	o.pos = p;
	return o;
}
fn log1pS(w: f32) -> f32 { if (w < 0.1) { return w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715)))))); } return log(1.0 + w); }
struct F { @location(0) c: vec4f, @builtin(frag_depth) d: f32 };
@fragment fn fs(i: O) -> F {
	var f: F;
	f.c = vec4f(u.color.rgb * u.color.a, u.color.a);
	f.d = clamp(log1pS(max(i.w, 1e-30)) * 1.4426950 * u.p.x * 0.5, 0.0, 1.0);
	return f;
}
// ①b 深度の無い平らな地面（単位球）：目から画素への線分（t＝0..1）が球に当たる最初の t＜1 ＝地面の向こう＝残す（gl/classify.ts と同じ）
@fragment fn fsg(i: O) -> F {
	let A = dot(i.rel, i.rel); let B = dot(u.eye.xyz, i.rel); let D = B * B - A * u.eye.w;
	if (u.eye.w <= 0.0 || D < 0.0) { discard; }
	let t = (-B - sqrt(D)) / A;
	if (t <= 0.0 || t >= 1.0) { discard; }
	var f: F;
	f.c = vec4f(0.0);
	f.d = clamp(log1pS(max(i.w, 1e-30)) * 1.4426950 * u.p.x * 0.5, 0.0, 1.0);
	return f;
}
`;function dm(s,p,_,A,D=!1){const C=new Map,F=s.createShaderModule({code:D?Aa(sd,"classify"):sd,label:"classify"}),le=s.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]}),Se=s.createPipelineLayout({bindGroupLayouts:[le]}),ee=new Map,N=(L,G="keep",me="keep")=>({compare:L,failOp:"keep",depthFailOp:me,passOp:G}),fe=L=>{const G=(me,Ie,ae,Te="fs")=>s.createRenderPipeline({label:"classify:"+ae,layout:Se,vertex:{module:F,entryPoint:"vs",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:F,entryPoint:Te,targets:[Ie?{format:p,blend:A}:{format:p,writeMask:0}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:_,depthWriteEnabled:!1,depthCompare:"always",stencilReadMask:255,stencilWriteMask:127,...me},multisample:{count:L}});return{stencil:G({depthCompare:D?"greater":"less",stencilFront:N("always","keep","decrement-wrap"),stencilBack:N("always","keep","increment-wrap")},!1,"stencil"),ground:G({depthCompare:D?"greater":"less",stencilFront:N("always","decrement-wrap"),stencilBack:N("always","increment-wrap")},!1,"ground","fsg"),occ:G({stencilFront:N("equal","replace"),stencilBack:N("equal","replace"),stencilReadMask:128},!1,"occ"),cover:G({stencilFront:N("not-equal","zero"),stencilBack:N("not-equal","zero"),stencilReadMask:127},!0,"cover"),cover3d:G({stencilFront:N("less","zero"),stencilBack:N("less","zero")},!0,"cover3d"),zero:G({stencilFront:N("always","zero"),stencilBack:N("always","zero")},!1,"zero")}},W=L=>{let G=ee.get(L);return G||(G=fe(L),ee.set(L,G)),G},H=(L,G)=>{const me=s.createBuffer({size:Math.max(16,Math.ceil(L.byteLength/4)*4),usage:G|GPUBufferUsage.COPY_DST});return s.queue.writeBuffer(me,0,L.buffer,L.byteOffset,L.byteLength),me},be=L=>{L.vbo.destroy(),L.ibo.destroy(),L.ubo.destroy()};function l(L,G){const me=C.get(L);if(me&&(be(me),C.delete(L)),!G||!G.pos?.length||!G.idx?.length)return;const Ie=s.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});C.set(L,{vbo:H(G.pos,GPUBufferUsage.VERTEX),ibo:H(G.idx,GPUBufferUsage.INDEX),ubo:Ie,bg:s.createBindGroup({layout:le,entries:[{binding:0,resource:{buffer:Ie}}]}),count:G.idx.length,origin:Array.from(G.origin).slice(0,3),color:Array.from(G.color).slice(0,4),type:G.type??0})}function Ee(L,G){const me=C.get(L);!me||!G||(G.color&&(me.color=Array.from(G.color).slice(0,4)),G.type!=null&&(me.type=G.type))}const Z=new Float32Array(36);function U(L,G,me,Ie,ae,Te=0,Ye=!1){if(!C.size)return;const tt=W(G);for(const T of C.values()){if(!(T.color[3]>0))continue;Z.set(me,0);const ke=wv(T.origin,Te),J=so(me,[ke[0],ke[1],ke[2],1]);Z[16]=J[0],Z[17]=J[1],Z[18]=J[2],Z[19]=J[3],Z[20]=T.color[0],Z[21]=T.color[1],Z[22]=T.color[2],Z[23]=T.color[3],Z[24]=Ie,Z[28]=ke[0]-ae[0],Z[29]=ke[1]-ae[1],Z[30]=ke[2]-ae[2];const pt=Math.hypot(ae[0],ae[1],ae[2]);Z[32]=ae[0],Z[33]=ae[1],Z[34]=ae[2],Z[35]=(pt-1)*(pt+1),s.queue.writeBuffer(T.ubo,0,Z.buffer,0,144),L.setBindGroup(0,T.bg),L.setVertexBuffer(0,T.vbo),L.setIndexBuffer(T.ibo,"uint32"),L.setPipeline(tt.stencil),L.setStencilReference(0),L.drawIndexed(T.count),Ye&&T.type!==2&&(L.setPipeline(tt.ground),L.drawIndexed(T.count)),T.type===1&&(L.setPipeline(tt.occ),L.setStencilReference(128),L.drawIndexed(T.count)),T.type===2?(L.setPipeline(tt.cover3d),L.setStencilReference(128),L.drawIndexed(T.count),L.setPipeline(tt.zero),L.drawIndexed(T.count)):(L.setPipeline(tt.cover),L.setStencilReference(0),L.drawIndexed(T.count))}}function O(){for(const L of C.values())be(L);C.clear(),ee.clear()}return{set:l,style:Ee,draw:U,dispose:O,get size(){return C.size}}}const pm="fn encW(w: f32) -> vec2f { let g = clamp(log2(1.0 + w * 1.0e5) / 25.0, 0.0, 1.0); let hi = floor(g * 255.0); return vec2f(hi, floor((g * 255.0 - hi) * 255.0)) / 255.0; }",Cd="fn decW(gb: vec2f) -> f32 { let g = (gb.x * 255.0 + gb.y) / 255.0; return (exp2(g * 25.0) - 1.0) * 1.0e-5; }",Ed=`@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
	let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
	return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}`,Md=s=>`
struct AoP { rF: vec4f, rX: vec4f, rY: vec4f, eye: vec4f, p: vec4f, size: vec4f };
// rF/rX/rY.xyz＝視線 v(ndc)＝rF＋ndc.x·rX＋ndc.y·rY（clip w が 1 の長さ＝P_rel＝w·v）・rF.w＝焦点距離（AO 面の px）・rX.w＝|eye|²−1・rY.w＝2·ln2／logCoef
// eye.xyz＝目（β 単位球）・p=(0, 半径の係数, 強さ, 接平面の sin の下駄)・size=(W,H,1/W,1/H)（AO 面）
@group(0) @binding(0) var<uniform> A: AoP;
@group(0) @binding(1) var dep: ${s?"texture_depth_multisampled_2d":"texture_depth_2d"};
const M_PER_R: f32 = 1.5696e-7;   // 1m／地球半径
fn expm1s(x: f32) -> f32 {   // exp(x)−1 を 0 の近くでも桁落ちなしに（x＜0.1＝7 次の級数・誤差 1e-11 相対）
	if (x < 0.1) { return x * (1.0 + x * (0.5 + x * (0.16666667 + x * (0.041666668 + x * (0.008333334 + x * 0.0013888889))))); }
	return exp(x) - 1.0;
}
fn linW(z: f32) -> f32 { return expm1s(z * A.rY.w); }   // 対数深度（wgsl.js logDepthZ：z＝logCoef/2·log2(1+w)）の逆＝clip w（目からの奥行き）
${pm}
${Cd}
fn posAt(q: vec2i) -> vec4f {   // 本体の画素 q → xyz＝目からの相対位置・w＝clip w（空は w<0）。深度は sample 0・視線は同じ画素の中心
	let dim = vec2i(textureDimensions(dep));
	let z = textureLoad(dep, q, 0);
	let uv = (vec2f(q) + 0.5) / vec2f(dim);
	let v = A.rF.xyz + (uv.x * 2.0 - 1.0) * A.rX.xyz + (1.0 - uv.y * 2.0) * A.rY.xyz;
	if (z >= 1.0) {   // 深度が無い＝球の床（GLOBE パスは深度を書かない）か空。視線と単位球の交点で床を復元（地形がある所は地形の深度が来る）
		let a = dot(v, v); let b = dot(A.eye.xyz, v); let c = A.rX.w;
		let h = b * b - a * c;
		if (h < 0.0 || b >= 0.0 || c <= 0.0) { return vec4f(0.0, 0.0, 0.0, -1.0); }   // 当たらない・目が球の中（地中）＝空扱い
		let s = c / (-b + sqrt(h));   // 手前の根（打ち消しの無い形）＝そのまま clip w
		return vec4f(v * s, s);
	}
	let w = linW(z);
	return vec4f(v * w, w);
}
fn posRel(xy: vec2i) -> vec4f {   // AO 面の texel → 本体の 2×2 の左上の画素
	return posAt(clamp(xy * 2, vec2i(0), vec2i(textureDimensions(dep)) - vec2i(1)));
}
${Ed}`,gm=s=>`
${Md(s)}
// 4×4 の Bayer＝隣り合う画素ほど離れた番号＝どの 4×4 の窓にも 16 通りが 1 つずつ
const B4 = array<u32, 16>(0u, 8u, 2u, 10u, 12u, 4u, 14u, 6u, 3u, 11u, 1u, 9u, 15u, 7u, 13u, 5u);
// 地平線型（HBAO）：画面上の 8 方向（4×4 の周期で回す）× 4 歩（同じ周期でジッタ）で最大仰角（接平面からの sin）を取り、距離で減衰。
// 半球サンプル型は壁の手前 6m で遮蔽が 1〜2 割にしかならず足元が出ない（机上シミュレーション 2026-09-26）＝壁の方向は仰角 80° 超＝ほぼ全遮蔽になる地平線型へ。
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let xy = vec2i(pos.xy);
	let P = posRel(xy);
	if (P.w < 0.0) { return vec4f(1.0, 1.0, 1.0, 1.0); }
	// 法線＝隣の texel との差（手前側の差を採る＝縁で反対側へ跳ばない）
	let Px1 = posRel(xy + vec2i(1, 0)); let Px0 = posRel(xy - vec2i(1, 0));
	let Py1 = posRel(xy + vec2i(0, 1)); let Py0 = posRel(xy - vec2i(0, 1));
	let dx = select(P.xyz - Px0.xyz, Px1.xyz - P.xyz, abs(Px1.w - P.w) < abs(Px0.w - P.w) || Px0.w < 0.0);
	let dy = select(P.xyz - Py0.xyz, Py1.xyz - P.xyz, abs(Py1.w - P.w) < abs(Py0.w - P.w) || Py0.w < 0.0);
	var n = cross(dx, dy);
	if (dot(n, n) < 1e-30) { return vec4f(1.0, encW(P.w), 1.0); }
	n = normalize(n);
	if (dot(n, P.xyz) > 0.0) { n = -n; }   // 視線に向ける
	// 半径＝視距離の 10%（20m〜400m）・画面上の半径（AO 面の px・4〜48）
	let radius = clamp(P.w * A.p.y, 20.0 * M_PER_R, 400.0 * M_PER_R);
	let rpx = clamp(radius / P.w * A.rF.w, 4.0, 48.0);
	let biasS = A.p.w;   // 接平面からの sin の下駄（自己遮蔽・平面の縞を切る）
	// 回しとジッタ＝4×4 の周期（16 通り）。回しは π/4 を 16 等分・ジッタは同じ番号の別の並び（×7＋5 は 16 の置換）＝ぼかしが 1 周ずつ足して消す。
	// p.x＝模様の位相（横へ texel ずらす・検定の口＝位相を変えても AO が変わらない＝動いても模様が泳がない）
	let r = B4[u32((xy.y & 3) * 4 + ((xy.x + i32(A.p.x)) & 3))];
	let ang0 = (f32(r) + 0.5) * (0.7853982 / 16.0);
	let jit = (f32((r * 7u + 5u) & 15u) + 0.5) / 16.0;
	let fxy = vec2f(xy);
	let dim = vec2i(A.size.xy);
	var occ = 0.0;
	for (var k = 0; k < 8; k++) {
		let a = ang0 + f32(k) * 0.7853982;
		let dv = vec2f(cos(a), sin(a));
		var hmax = 0.0;
		for (var s = 0; s < 4; s++) {
			let q = clamp(vec2i(fxy + 0.5 + dv * (rpx * (f32(s) + 0.3 + 0.7 * jit) / 4.0)), vec2i(0), dim - vec2i(1));
			let Q = posRel(q);
			if (Q.w < 0.0) { continue; }
			let D = Q.xyz - P.xyz; let l = length(D);
			if (l < 1e-12 || l > radius) { continue; }
			let se = dot(D, n) / l;                      // 接平面からの仰角の sin
			let fall = 1.0 - (l * l) / (4.0 * radius * radius);   // 遠い遮蔽は弱く（R で 0.75＝壁の最良の地平線は R 付近に来るので 0 にしない）
			hmax = max(hmax, se * fall);
		}
		occ += max(hmax - biasS, 0.0) / (1.0 - biasS);
	}
	let ao = 1.0 - A.p.z * occ / 8.0;
	return vec4f(clamp(ao, 0.0, 1.0), encW(P.w), 1.0);
}`,ad=s=>`
@group(0) @binding(0) var aoT: texture_2d<f32>;   // R=AO・GB=深度（AO パスが同梱）
${Cd}
const BW = array<f32, 7>(0.5, 2.0, 3.5, 4.0, 3.5, 2.0, 0.5);
${Ed}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let xy = vec2i(pos.xy);
	let dim = vec2i(textureDimensions(aoT));
	let c0 = textureLoad(aoT, xy, 0);
	let w0 = decW(c0.gb); let tol = max(w0 * 0.05, 1.0e-6);
	var s = 0.0; var wsum = 0.0;
	for (var i = -3; i <= 3; i++) {
		let q = clamp(xy + vec2i(${s[0]}, ${s[1]}) * i, vec2i(0), dim - vec2i(1));
		let cq = textureLoad(aoT, q, 0);
		let wq = BW[i + 3] * select(0.0, 1.0, abs(decW(cq.gb) - w0) < tol);
		s += cq.r * wq; wsum += wq;
	}
	return vec4f(select(c0.r, s / wsum, wsum > 0.0), c0.gb, 1.0);
}`,vm=s=>`
${Md(s)}
@group(0) @binding(2) var aoT: texture_2d<f32>;
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let P = posAt(vec2i(pos.xy));
	if (P.w < 0.0) { return vec4f(1.0); }   // 空
	let dimA = vec2i(textureDimensions(aoT));
	let s = (pos.xy - 0.5) * 0.5;   // AO 面の texel 番号の座標（texel i の中心＝i）
	let i0 = vec2i(floor(s)); let f = fract(s);
	var acc = 0.0; var wsum = 0.0; var best = 1.0; var bestD = 1e30;
	for (var k = 0; k < 4; k++) {
		let o = vec2i(k & 1, k >> 1);
		let c = textureLoad(aoT, clamp(i0 + o, vec2i(0), dimA - vec2i(1)), 0);
		let dw = abs(decW(c.gb) - P.w);
		let bw = select(1.0 - f.x, f.x, o.x == 1) * select(1.0 - f.y, f.y, o.y == 1);
		let wk = bw * select(0.0, 1.0, dw < P.w * 0.05);
		acc += c.r * wk; wsum += wk;
		if (dw < bestD) { bestD = dw; best = c.r; }
	}
	let a = select(best, acc / wsum, wsum > 1e-4);
	return vec4f(a, a, a, 1.0);
}`;function mm(s,p,_=!1){const A=GPUShaderStage.FRAGMENT,D=ae=>s.createBindGroupLayout({entries:[{binding:0,visibility:A,buffer:{}},{binding:1,visibility:A,texture:{sampleType:"depth",multisampled:ae}}]}),C=ae=>s.createBindGroupLayout({entries:[{binding:0,visibility:A,buffer:{}},{binding:1,visibility:A,texture:{sampleType:"depth",multisampled:ae}},{binding:2,visibility:A,texture:{sampleType:"unfilterable-float"}}]}),F=s.createBindGroupLayout({entries:[{binding:0,visibility:A,texture:{sampleType:"unfilterable-float"}}]}),le=new Map,Se=ae=>{let Te=le.get(ae);return Te||(Te={ao:D(ae),comp:C(ae)},le.set(ae,Te)),Te},ee=new Map,N=(ae,Te,Ye,tt=1)=>{const T=s.createShaderModule({code:_?fo(ae,"dep","A.rY.w"):ae});return s.createRenderPipeline({label:"ao",layout:s.createPipelineLayout({bindGroupLayouts:[Te]}),vertex:{module:T,entryPoint:"vs"},fragment:{module:T,entryPoint:"fs",targets:Ye},primitive:{topology:"triangle-list"},multisample:{count:tt}})},fe=(ae,Te)=>{let Ye=ee.get(ae);return Ye||(Ye=Te(),ee.set(ae,Ye)),Ye},W=[{format:"rgba8unorm"}],H=[{format:p,blend:{color:{srcFactor:"zero",dstFactor:"src",operation:"add"},alpha:{srcFactor:"zero",dstFactor:"one",operation:"add"}}}],be=s.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),l=new Float32Array(24);let Ee=null,Z=null,U=0,O=0,L=null;function G(ae,Te){const Ye=Math.max(1,ae>>1),tt=Math.max(1,Te>>1);Ee&&U===Ye&&O===tt||(Ee?.destroy(),Z?.destroy(),Ee=s.createTexture({size:[Ye,tt],format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),Z=s.createTexture({size:[Ye,tt],format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),U=Ye,O=tt,L=null)}function me(ae,Te){G(Te.W,Te.H);const Ye=Te.samples>1,tt=Se(Ye),T=fe(Ye?"ms":"ss",()=>N(gm(Ye),tt.ao,W)),ke=fe("blurH",()=>N(ad([1,0]),F,W)),J=fe("blurV",()=>N(ad([0,1]),F,W)),pt=fe("comp"+Te.samples,()=>N(vm(Ye),tt.comp,H,Te.samples));if(L?.dep!==Te.depthTex){const We=Te.depthTex.createView({aspect:"depth-only"}),Ze={buffer:be};L={dep:Te.depthTex,ao:s.createBindGroup({layout:tt.ao,entries:[{binding:0,resource:Ze},{binding:1,resource:We}]}),blurH:s.createBindGroup({layout:F,entries:[{binding:0,resource:Ee.createView()}]}),blurV:s.createBindGroup({layout:F,entries:[{binding:0,resource:Z.createView()}]}),comp:s.createBindGroup({layout:tt.comp,entries:[{binding:0,resource:Ze},{binding:1,resource:We},{binding:2,resource:Ee.createView()}]})}}const Xe=Oa(Te.mvp,Te.invMvp),gt=Te.eye,oe=l;oe.set(Xe.F,0),oe[3]=Te.focal/2,oe.set(Xe.X,4),oe[7]=gt[0]*gt[0]+gt[1]*gt[1]+gt[2]*gt[2]-1,oe.set(Xe.Y,8),oe[11]=2*Math.LN2/Te.logCoef,oe[12]=gt[0],oe[13]=gt[1],oe[14]=gt[2],oe[15]=0,oe[16]=Te.phase|0,oe[17]=Te.radiusK,oe[18]=Te.strength,oe[19]=Te.biasSin,oe[20]=U,oe[21]=O,oe[22]=1/U,oe[23]=1/O,s.queue.writeBuffer(be,0,oe);const K=(We,Ze,te,M=!0)=>{const $=ae.beginRenderPass({colorAttachments:[{view:We,loadOp:M?"clear":"load",clearValue:{r:1,g:1,b:1,a:1},storeOp:"store"}]});$.setPipeline(Ze),$.setBindGroup(0,te),$.draw(3),$.end()};K(Ee.createView(),T,L.ao),K(Z.createView(),ke,L.blurH),K(Ee.createView(),J,L.blurV),K(Te.colorView,pt,L.comp,!1)}function Ie(){Ee?.destroy(),Z?.destroy(),Ee=Z=null,L=null,be.destroy(),ee.clear()}return{encode:me,dispose:Ie,bytes:()=>U*O*8}}const pl=1/6371e3,xm=3072,Ud=`
fn fxHash(p: vec3i) -> f32 {
	var h = (u32(p.x) * 73856093u) ^ (u32(p.y) * 19349663u) ^ (u32(p.z) * 83492791u);
	h = (h ^ (h >> 13u)) * 1274126177u;
	h = h ^ (h >> 16u);
	return f32(h & 0xffffu) / 65535.0;
}
fn fxWrap(p: vec3i, n: i32) -> vec3i { return ((p % vec3i(n)) + vec3i(n)) % vec3i(n); }
fn fxNoise(x: vec3f, n: i32) -> f32 {
	let i = floor(x); let f = x - i; let u = f * f * (3.0 - 2.0 * f);
	let b = vec3i(i);
	let a000 = fxHash(fxWrap(b, n)); let a100 = fxHash(fxWrap(b + vec3i(1, 0, 0), n));
	let a010 = fxHash(fxWrap(b + vec3i(0, 1, 0), n)); let a110 = fxHash(fxWrap(b + vec3i(1, 1, 0), n));
	let a001 = fxHash(fxWrap(b + vec3i(0, 0, 1), n)); let a101 = fxHash(fxWrap(b + vec3i(1, 0, 1), n));
	let a011 = fxHash(fxWrap(b + vec3i(0, 1, 1), n)); let a111 = fxHash(fxWrap(b + vec3i(1, 1, 1), n));
	return mix(mix(mix(a000, a100, u.x), mix(a010, a110, u.x), u.y), mix(mix(a001, a101, u.x), mix(a011, a111, u.x), u.y), u.z);
}
// 水たまり（0..1）＝6 m と 3 m の雑音の和を閾で切る
fn fxPuddle(m: vec3f) -> f32 {
	let v = fxNoise(m / 6.0, 512) * 0.65 + fxNoise(m / 3.0 + vec3f(7.0, 3.0, 1.0), 1024) * 0.35;
	return smoothstep(0.48, 0.62, v);
}
// 水たまりの斑を遠くで均す（画素より細かい斑はちらつく＝150 m より先は平均 0.5 へ）。w＝視距離（R）
fn fxPuddleFar(m: vec3f, w: f32) -> f32 { return mix(0.5, fxPuddle(m), clamp(150.0 * ${pl.toExponential(6)} / max(w, 1e-12), 0.0, 1.0)); }
// 雨の波紋（接平面の 2 成分・−0.5..0.5）＝0.75 m の雑音を時間で流す
fn fxRipple(m: vec3f, t: f32) -> vec2f {
	let z = vec3f(0.0, 0.0, t * 1.7);
	return vec2f(fxNoise(m / 0.75 + z, 4096), fxNoise(m / 0.75 + vec3f(11.0, 5.0, 3.0) + z, 4096)) - 0.5;
}`,Gf=`@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
	let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
	return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}`,rs=s=>`
struct FxP { rF: vec4f, rX: vec4f, rY: vec4f, i0: vec4f, i1: vec4f, i2: vec4f, eye: vec4f, sun: vec4f, sunS: vec4f, cs: vec4f, fog: vec4f, fogC: vec4f, ray: vec4f, rain: vec4f, toon: vec4f, ex: vec4f, ny: vec4f, an: vec4f, size: vec4f, on: vec4f, on2: vec4f };
// rF/rX/rY.xyz＝視線 v(ndc)＝rF＋ndc.x·rX＋ndc.y·rY（clip w が 1 の長さ）・rX.w＝|eye|²−1・rY.w＝2·ln2／logCoef
// i0/i1/i2＝[rF rX rY] の逆の行・eye＝(目 xyz, 目の高度 R)・sun＝(太陽 xyz, 目の所の昼の度合い)・sunS＝(画面の太陽 ndc xy, 前にあるか, 光芒の太陽の高さの重み)
// cs＝接触影 (強さ, 長さ（視距離の割合）, 厚み（視距離の割合）, 歩数)・fog＝(濃さ／R, 高さの尺 R, 底 R, 太陽の散乱)・fogC＝(霧の色, 異方性 g)
// ray＝光芒 (強さ, 減衰, 長さ, 歩数)・rain＝(濡れ＝強さ×濡れ, 暗さ, 時刻 s, 筋＝筋×強さ)・toon＝(段数, 線の濃さ, 線の閾, 彩度)
// ex/ny＝目の所の東・北（β）・an＝目−錨（β）・size＝(W, H, 1/W, 1/H)・on＝(接触影, 霧, 光芒, 雨)・on2＝(イラスト, dpr, 線の消える距離 R, 積み上げの番目)
@group(0) @binding(0) var<uniform> U: FxP;
@group(0) @binding(1) var fxDep: ${s?"texture_depth_multisampled_2d":"texture_depth_2d"};
const FX_M: f32 = ${pl.toExponential(6)};
fn fxExpm1(x: f32) -> f32 {
	if (x < 0.1) { return x * (1.0 + x * (0.5 + x * (0.16666667 + x * (0.041666668 + x * (0.008333334 + x * 0.0013888889))))); }
	return exp(x) - 1.0;
}
fn fxClampQ(q: vec2i) -> vec2i { return clamp(q, vec2i(0), vec2i(U.size.xy) - vec2i(1)); }
fn fxRay(q: vec2i) -> vec3f {
	let uv = (vec2f(q) + 0.5) * U.size.zw;
	return U.rF.xyz + (uv.x * 2.0 - 1.0) * U.rX.xyz + (1.0 - uv.y * 2.0) * U.rY.xyz;
}
// 本体の画素 q → xyz＝目からの相対位置・w＝clip w（空は w<0）。深度の無い画素は球の床
fn fxPos(q0: vec2i) -> vec4f {
	let q = fxClampQ(q0);
	let z = textureLoad(fxDep, q, 0);
	let v = fxRay(q);
	if (z >= 1.0) {
		let a = dot(v, v); let b = dot(U.eye.xyz, v); let c = U.rX.w;
		let h = b * b - a * c;
		if (h < 0.0 || b >= 0.0 || c <= 0.0) { return vec4f(0.0, 0.0, 0.0, -1.0); }
		let s = c / (-b + sqrt(h));
		return vec4f(v * s, s);
	}
	let w = fxExpm1(z * U.rY.w);
	return vec4f(v * w, w);
}
fn fxProj(Q: vec3f) -> vec3f {
	let a = vec3f(dot(U.i0.xyz, Q), dot(U.i1.xyz, Q), dot(U.i2.xyz, Q));
	if (a.x <= 0.0) { return vec3f(-1.0, 0.0, 0.0); }
	return vec3f(a.x, a.yz / a.x);
}
fn fxPix(ndc: vec2f) -> vec2i { return vec2i(vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5) * U.size.xy); }
fn fxUp(Pc: vec4f) -> vec3f { return normalize(U.eye.xyz + Pc.xyz); }
// 画素の高度（R）＝|E＋P|−1 を桁落ち無しで
fn fxAlt(Pc: vec4f) -> f32 { return (2.0 * dot(U.eye.xyz, Pc.xyz) + dot(Pc.xyz, Pc.xyz) + U.rX.w) / (length(U.eye.xyz + Pc.xyz) + 1.0); }
// 法線＝隣の画素との差（奥行きの揃う側）。差は視距離で割って f32 の小さい数の積を避ける。球の床は上向き。0 ベクトル＝決まらない
fn fxNormal(q: vec2i, Pc: vec4f) -> vec3f {
	if (textureLoad(fxDep, fxClampQ(q), 0) >= 1.0) { return fxUp(Pc); }
	let Px1 = fxPos(q + vec2i(1, 0)); let Px0 = fxPos(q - vec2i(1, 0));
	let Py1 = fxPos(q + vec2i(0, 1)); let Py0 = fxPos(q - vec2i(0, 1));
	let dx = select(Pc.xyz - Px0.xyz, Px1.xyz - Pc.xyz, abs(Px1.w - Pc.w) < abs(Px0.w - Pc.w) || Px0.w < 0.0);
	let dy = select(Pc.xyz - Py0.xyz, Py1.xyz - Pc.xyz, abs(Py1.w - Pc.w) < abs(Py0.w - Pc.w) || Py0.w < 0.0);
	let cn = cross(dx / Pc.w, dy / Pc.w);
	if (dot(cn, cn) < 1e-24) { return vec3f(0.0); }
	var n = normalize(cn);
	if (dot(n, Pc.xyz) > 0.0) { n = -n; }
	return n;
}
fn fxIGN(p0: vec2f) -> f32 { let p = p0 + U.on2.w * 5.588238; return fract(52.9829189 * fract(dot(p, vec2f(0.06711056, 0.00583715)))); }   // on2.w＝静止の積み上げの番目（毎フレームずらす）
${Ud}
${Gf}`,bm=s=>rs(s)+`
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let q = vec2i(pos.xy) * 2;
	let Pc = fxPos(q);
	if (Pc.w < 0.0) { return vec4f(1.0, -1.0, 0.0, 0.0); }
	let L = U.sun.xyz;
	let n = fxNormal(q, Pc);
	let up = fxUp(Pc);
	if (dot(n, n) < 0.5 || dot(up, L) < 0.0 || dot(n, L) <= 0.02) { return vec4f(1.0, Pc.w, 0.0, 0.0); }   // 夜・太陽に背を向けた面（照明が既に暗い）は触らない
	let len = Pc.w * U.cs.y;
	let O = Pc.xyz + n * (Pc.w * 1.0e-3);
	let thick = Pc.w * U.cs.z;
	let N = i32(U.cs.w);
	let jit = fxIGN(pos.xy);
	var occ = 0.0;
	for (var i = 0; i < N; i++) {
		let s = (f32(i) + jit) / f32(N);
		let t = len * s * s;
		let a = fxProj(O + L * t);
		if (a.x <= 0.0 || abs(a.y) > 1.0 || abs(a.z) > 1.0) { break; }
		let px = fxPix(a.yz);
		let dq = vec2f(px - q);
		if (dot(dq, dq) < 9.0) { continue; }   // 出発の 3 px の内＝自分の面（画素の量子化）
		let S = fxPos(px);
		if (S.w > 0.0 && a.x > S.w && a.x - S.w < thick + t * 0.05) { occ = 1.0 - smoothstep(0.55, 1.0, s); break; }
	}
	let edge = 1.0 - smoothstep(0.9, 1.0, max(abs(f32(q.x) * U.size.z * 2.0 - 1.0), abs(f32(q.y) * U.size.w * 2.0 - 1.0)));
	return vec4f(1.0 - U.cs.x * occ * edge, Pc.w, 0.0, 0.0);
}`,ym=s=>rs(s)+`
@group(0) @binding(2) var csT: texture_2d<f32>;
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let q = vec2i(pos.xy);
	let Pc = fxPos(q);
	if (Pc.w < 0.0) { return vec4f(1.0); }
	var k = 1.0;
	if (U.on.x > 0.5) {
		let hp = pos.xy * 0.5 - 0.5;
		let b = vec2i(floor(hp)); let f = hp - floor(hp);
		let dim = vec2i(textureDimensions(csT)) - vec2i(1);
		var sv = 0.0; var sw = 0.0; var best = 1.0; var bestD = 1e30;
		for (var j = 0; j < 4; j++) {
			let o = vec2i(j & 1, j >> 1u);
			let c = textureLoad(csT, clamp(b + o, vec2i(0), dim), 0);
			let bw = select(1.0 - f.x, f.x, o.x == 1) * select(1.0 - f.y, f.y, o.y == 1);
			let dd = abs(c.y - Pc.w) / Pc.w;
			if (c.y > 0.0 && dd < bestD) { bestD = dd; best = c.x; }
			let dw = select(0.0, 1.0, c.y > 0.0 && dd < 0.03);
			sv += c.x * bw * dw; sw += bw * dw;
		}
		k = select(best, sv / sw, sw > 1e-3);
	}
	if (U.on.w > 0.5) {   // 雨の濡れ＝上を向いた面を暗く（水たまりはもっと）
		let n = fxNormal(q, Pc);
		let nUp = dot(n, fxUp(Pc));
		let m = (Pc.xyz + U.an.xyz) / FX_M;
		let wet = U.rain.x * smoothstep(0.75, 0.95, nUp) * (0.8 + 0.2 * fxPuddleFar(m, Pc.w));
		k *= 1.0 - U.rain.y * wet;
	}
	return vec4f(k, k, k, 1.0);
}`,hm=s=>rs(s)+`
fn fxH1(x: f32) -> f32 { return fract(sin(x * 127.1) * 43758.5453); }
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let q = vec2i(pos.xy);
	let Pc = fxPos(q);
	let vn = normalize(fxRay(q));
	var fc = vec3f(0.0); var fa = 0.0;
	if (U.on.y > 0.5) {
		let H = U.fog.y; let base = U.fog.z;
		let h0 = max(U.eye.w - base, 0.0);
		let e0 = exp(-h0 / H);
		var od = 0.0;
		if (Pc.w < 0.0) {   // 空＝上へ抜ける光線の積分（d·H·e0／sinθ）。水平に近いほど濃い＝地平線で地面の霧と繋がる
			let s = dot(vn, normalize(U.eye.xyz));
			od = U.fog.x * H * e0 / max(s, 0.002);
		} else {
			let Lm = length(Pc.xyz);
			let h1 = max(fxAlt(Pc) - base, 0.0);
			let k = (h1 - h0) / H;
			od = select(U.fog.x * Lm * e0 * (1.0 - exp(-k)) / k, U.fog.x * Lm * e0 * (1.0 - 0.5 * k), abs(k) < 1e-3);
		}
		fa = 1.0 - exp(-max(od, 0.0));
		let g = U.fogC.w;
		let ct = dot(vn, U.sun.xyz);
		let hg = 0.04 * (1.0 - g * g) / pow(max(1.0 + g * g - 2.0 * g * ct, 1e-4), 1.5);
		let day = U.sun.w;
		let sunC = mix(vec3f(1.0, 0.62, 0.38), vec3f(1.0, 0.94, 0.84), day);
		fc = min(U.fogC.rgb * (0.2 + 0.8 * day) + sunC * (U.fog.w * hg * smoothstep(0.0, 0.15, day + 0.05)), vec3f(1.2)) * fa;
	}
	if (U.on.w > 0.5 && U.rain.w > 0.0) {   // 雨の筋＝奥行き 3 層（6/18/50 m）。手前に物がある層は描かない
		let uv = pos.xy * U.size.zw;
		let asp = U.size.x * U.size.w;
		var sa = 0.0;
		for (var l = 0; l < 3; l++) {
			let dM = select(select(50.0, 18.0, l == 1), 6.0, l == 0);
			if (Pc.w > 0.0 && Pc.w < dM * FX_M) { continue; }
			let sc = select(select(0.35, 0.6, l == 1), 1.0, l == 0);
			let p = vec2f((uv.x * asp + uv.y * 0.12) * 70.0 / sc, uv.y * 3.0 / sc + U.rain.z * (2.2 / sc));
			let col = floor(p.x) + f32(l) * 101.0;
			let h = fxH1(col); let h2 = fxH1(col + 37.0);
			let y = fract(p.y + h * 7.0);
			let st = smoothstep(0.0, 0.04, y) * (1.0 - smoothstep(0.04, 0.3, y)) * step(0.55, h2) * (1.0 - smoothstep(0.05, 0.2, abs(p.x - floor(p.x) - 0.5)));
			sa = max(sa, st * (0.45 + 0.55 * sc));
		}
		sa = clamp(sa * U.rain.w * 0.35, 0.0, 1.0);
		fc = vec3f(0.78, 0.82, 0.88) * sa + fc * (1.0 - sa);
		fa = sa + fa * (1.0 - sa);
	}
	return vec4f(fc, fa);
}`,wm=s=>rs(s)+`
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	if (U.sunS.z < 0.5) { return vec4f(0.0); }
	let uv = (pos.xy * 2.0 + 1.0) * U.size.zw;
	let sUV = vec2f(U.sunS.x * 0.5 + 0.5, 0.5 - U.sunS.y * 0.5);
	let N = i32(U.ray.w);
	let dlt = (sUV - uv) * (U.ray.z / f32(N));
	var p = uv + dlt * fxIGN(pos.xy);
	var ill = 1.0; var acc = 0.0;
	for (var i = 0; i < N; i++) {
		p += dlt;
		if (all(p >= vec2f(0.0)) && all(p <= vec2f(1.0))) {
			if (fxPos(vec2i(p * U.size.xy)).w < 0.0) { acc += ill; }
		}
		ill *= U.ray.y;
	}
	acc /= f32(N);
	let d = length((uv - sUV) * vec2f(U.size.x * U.size.w, 1.0));
	let w = exp(-d * 1.6);
	let c = mix(vec3f(1.0, 0.62, 0.36), vec3f(1.0, 0.93, 0.8), U.sun.w) * (U.ray.x * acc * w * U.sunS.w);
	return vec4f(c, 0.0);
}`,Pm=`
@group(0) @binding(2) var rT: texture_2d<f32>;
@group(0) @binding(3) var rS: sampler;
@group(0) @binding(4) var<uniform> CP: vec4f;
${Gf}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	return vec4f(textureSampleLevel(rT, rS, pos.xy * CP.xy, 0.0).rgb, 0.0);
}`,Sm=`
@group(0) @binding(0) var hT: texture_2d<f32>;
${Gf}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f { return vec4f(textureLoad(hT, vec2i(pos.xy), 0).rgb, 1.0); }`,Bm=s=>rs(s)+`
@group(0) @binding(2) var colT: texture_2d<f32>;
fn fxIz(q: vec2i) -> f32 { let P = fxPos(q); return select(1.0 / P.w, 0.0, P.w < 0.0); }
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let q = vec2i(pos.xy);
	let c = textureLoad(colT, fxClampQ(q), 0).rgb;
	let LW = vec3f(0.2126, 0.7152, 0.0722);
	let l = dot(c, LW);
	let x = l * U.toon.x;
	let fl = floor(x);
	let lq = (fl + smoothstep(0.42, 0.58, x - fl)) / U.toon.x;
	var col = c * (max(lq, 0.02) / max(l, 0.02));
	col = clamp(mix(vec3f(dot(col, LW)), col, U.toon.w), vec3f(0.0), vec3f(1.0));
	let Pc = fxPos(q);
	if (Pc.w > 0.0 && U.toon.y > 0.0) {
		let st = max(1, i32(round(U.on2.y)));
		let iz = 1.0 / Pc.w;
		let izl = fxIz(q - vec2i(st, 0)); let izr = fxIz(q + vec2i(st, 0));
		let izu = fxIz(q - vec2i(0, st)); let izd = fxIz(q + vec2i(0, st));
		let d2 = max(abs(izl + izr - 2.0 * iz), abs(izu + izd - 2.0 * iz)) / iz;
		let fade = 1.0 - smoothstep(0.6, 1.0, Pc.w / U.on2.z);
		let e = smoothstep(U.toon.z, U.toon.z * 2.5, d2) * U.toon.y * fade;
		col = mix(col, vec3f(0.08, 0.08, 0.1), clamp(e, 0.0, 1.0));
	}
	return vec4f(col, 1.0);
}`;function Rd(s,p){const _=Math.hypot(s[0],s[1],s[2]),A=[s[0]/_,s[1]/_,s[2]/_],D=(N,fe)=>[N[1]*fe[2]-N[2]*fe[1],N[2]*fe[0]-N[0]*fe[2],N[0]*fe[1]-N[1]*fe[0]];let C=D(p,A);const F=Math.hypot(C[0],C[1],C[2])||1;C=C.map(N=>N/F);const le=D(A,C),Se=xm*pl,ee=[0,1,2].map(N=>s[N]-Math.round(s[N]/Se)*Se);return{ex:C,ny:le,an:ee}}function cd(s,p,_=!1){const A=GPUShaderStage.FRAGMENT,D=new Map,C=(Y,w)=>{let R=D.get(Y);return R||(R=w(),D.set(Y,R)),R},F=(Y,w)=>[{binding:0,visibility:A,buffer:{}},{binding:1,visibility:A,texture:{sampleType:"depth",multisampled:Y}},...w?[{binding:2,visibility:A,texture:{sampleType:"unfilterable-float"}}]:[]],le=Y=>C("d"+Y,()=>s.createBindGroupLayout({entries:F(Y,!1)})),Se=Y=>C("dt"+Y,()=>s.createBindGroupLayout({entries:F(Y,!0)})),ee=C("rc",()=>s.createBindGroupLayout({entries:[{binding:2,visibility:A,texture:{sampleType:"float"}},{binding:3,visibility:A,sampler:{type:"filtering"}},{binding:4,visibility:A,buffer:{}}]})),N=new Map,fe=(Y,w)=>{let R=N.get(Y);return R||(R=w(),N.set(Y,R)),R},W=(Y,w,R,ge,E)=>{const Oe=s.createShaderModule({code:_?fo(Y,"fxDep","U.rY.w"):Y,label:E});return s.createRenderPipeline({label:E,layout:s.createPipelineLayout({bindGroupLayouts:[w]}),vertex:{module:Oe,entryPoint:"vs"},fragment:{module:Oe,entryPoint:"fs",targets:R},primitive:{topology:"triangle-list"},multisample:{count:ge}})},H={srcFactor:"zero",dstFactor:"one",operation:"add"},be=[{format:p,blend:{color:{srcFactor:"zero",dstFactor:"src",operation:"add"},alpha:H}}],l=[{format:p,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:H}}],Ee=[{format:p,blend:{color:{srcFactor:"one",dstFactor:"one",operation:"add"},alpha:H}}],Z=[{format:p,writeMask:7}],U=s.createBuffer({size:336,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),O=s.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),L=s.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),G=new Float32Array(84);let me=null,Ie=null,ae=null,Te=0,Ye=0;const tt=new Map;function T(Y,w){if(me&&Te===Y&&Ye===w)return;me?.destroy(),Ie?.destroy(),ae?.destroy(),ae=null;const R=Math.max(1,Y>>1),ge=Math.max(1,w>>1);me=s.createTexture({size:[R,ge],format:"rg16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),Ie=s.createTexture({size:[R,ge],format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),Te=Y,Ye=w,tt.clear()}function ke(){return ae??=s.createTexture({size:[Te,Ye],format:p,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),ae}function J(Y,w,R,ge){const E=tt.get(Y);if(E&&E.dep===R)return E.bg;const Oe=[{binding:0,resource:{buffer:U}},{binding:1,resource:R.createView({aspect:"depth-only"})}];ge&&Oe.push({binding:2,resource:ge.createView()});const Ue=s.createBindGroup({layout:w,entries:Oe});return tt.set(Y,{dep:R,bg:Ue}),Ue}let pt=null,Xe=null;function gt(Y){const w=Oa(Y.mvp,Y.invMvp),R=Ad(w.F,w.X,w.Y),ge=Y.eye,E=Y.opt,Oe=Y.sun,Ue=Math.hypot(ge[0],ge[1],ge[2]),se=(ge[0]*Oe[0]+ge[1]*Oe[1]+ge[2]*Oe[2])/Ue,ot=Rd(ge,Y.pole);G.fill(0),G.set(w.F,0),G.set(w.X,4),G[7]=ge[0]*ge[0]+ge[1]*ge[1]+ge[2]*ge[2]-1,G.set(w.Y,8),G[11]=2*Math.LN2/Y.logCoef,G.set(R[0],12),G.set(R[1],16),G.set(R[2],20),G[24]=ge[0],G[25]=ge[1],G[26]=ge[2],G[27]=Ue-1,G[28]=Oe[0],G[29]=Oe[1],G[30]=Oe[2];{const Ft=Math.max(0,Math.min(1,(se+.1045)/.209));G[31]=Ft*Ft*(3-2*Ft)}const st=R[0][0]*Oe[0]+R[0][1]*Oe[1]+R[0][2]*Oe[2],qe=R[1][0]*Oe[0]+R[1][1]*Oe[1]+R[1][2]*Oe[2],Ot=R[2][0]*Oe[0]+R[2][1]*Oe[1]+R[2][2]*Oe[2];st>0&&Math.abs(qe/st)<2.5&&Math.abs(Ot/st)<2.5&&(G[32]=qe/st,G[33]=Ot/st,G[34]=1);{const Ft=Math.max(0,Math.min(1,(se+.02)/.06));G[35]=Ft*Ft*(3-2*Ft)}E.contact&&(G[36]=E.contact.strength*Y.fade,G[37]=E.contact.length,G[38]=E.contact.thickness,G[39]=E.contact.steps),E.fog&&(G[40]=E.fog.density/1e3/pl,G[41]=E.fog.height*pl,G[42]=E.fog.base*pl,G[43]=E.fog.sun,G.set(E.fog.color.slice(0,3),44),G[47]=E.fog.anisotropy),E.rays&&(G[48]=E.rays.strength*Y.fade,G[49]=E.rays.decay,G[50]=E.rays.length,G[51]=E.rays.samples),E.rain&&(G[52]=E.rain.intensity*E.rain.wetness,G[53]=E.rain.darken,G[54]=Y.time%600,G[55]=E.rain.streaks*E.rain.intensity),E.toon&&(G[56]=E.toon.levels,G[57]=E.toon.edge,G[58]=E.toon.threshold,G[59]=E.toon.saturation),G.set(ot.ex,60),G.set(ot.ny,64),G.set(ot.an,68),G[72]=Y.W,G[73]=Y.H,G[74]=1/Y.W,G[75]=1/Y.H,G[76]=E.contact?1:0,G[77]=E.fog?1:0,G[78]=E.rays?1:0,G[79]=E.rain?1:0,G[80]=E.toon?1:0,G[81]=Y.dpr,G[82]=Math.max(Ue-1,50*pl)*40,G[83]=Y.phase??0,s.queue.writeBuffer(U,0,G)}function oe(Y,w,R,ge,E=!1){const Oe=Y.beginRenderPass({colorAttachments:[{view:w,loadOp:E?"clear":"load",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});Oe.setPipeline(R),Oe.setBindGroup(0,ge),Oe.draw(3),Oe.end()}function K(Y,w){const R=w.opt;if(!R.contact&&!R.rain)return;T(w.W,w.H),gt(w);const ge=w.samples>1;R.contact&&oe(Y,me.createView(),fe("cs"+ge,()=>W(bm(ge),le(ge),[{format:"rg16float"}],1,"fxContact")),J("cs"+ge,le(ge),w.depthTex,null),!0),oe(Y,w.colorView,fe("pre"+w.samples,()=>W(ym(ge),Se(ge),be,w.samples,"fxPre")),J("pre"+ge,Se(ge),w.depthTex,me))}function We(Y,w){const R=w.opt,ge=!!R.fog||!!(R.rain&&R.rain.streaks>0);if(!ge&&!R.rays&&!R.toon)return;T(w.W,w.H),gt(w);const E=w.samples>1;if(ge&&oe(Y,w.colorView,fe("fog"+w.samples,()=>W(hm(E),le(E),l,w.samples,"fxFog")),J("fog"+E,le(E),w.depthTex,null)),R.rays&&G[34]>.5&&G[35]>0&&(oe(Y,Ie.createView(),fe("rays"+E,()=>W(wm(E),le(E),[{format:"rgba16float"}],1,"fxRays")),J("rays"+E,le(E),w.depthTex,null),!0),(!pt||Xe!==Ie)&&(Xe=Ie,pt=s.createBindGroup({layout:ee,entries:[{binding:2,resource:Ie.createView()},{binding:3,resource:L},{binding:4,resource:{buffer:O}}]})),s.queue.writeBuffer(O,0,new Float32Array([1/w.W,1/w.H,0,0])),oe(Y,w.colorView,fe("rc"+w.samples,()=>W(Pm,ee,Ee,w.samples,"fxRaysComp")),pt)),R.toon){const Oe=ke();w.canvasTex?Y.copyTextureToTexture({texture:w.canvasTex},{texture:Oe},[w.W,w.H]):Y.beginRenderPass({colorAttachments:[{view:w.colorView,resolveTarget:Oe.createView(),loadOp:"load",storeOp:"store"}]}).end();const Ue="toon"+E;tt.get(Ue)?.dep!==w.depthTex&&tt.delete(Ue),oe(Y,w.colorView,fe("toon"+w.samples,()=>W(Bm(E),Se(E),Z,w.samples,"fxToon")),J(Ue,Se(E),w.depthTex,Oe))}}let Ze=null,te=0,M=0,$=null;const Me=C("acc",()=>s.createBindGroupLayout({entries:[{binding:0,visibility:A,texture:{sampleType:"unfilterable-float"}}]})),we=[{format:p,blend:{color:{srcFactor:"constant",dstFactor:"one-minus-constant",operation:"add"},alpha:H}}];function Be(Y,w){if((!Ze||te!==w.W||M!==w.H)&&(Ze?.destroy(),Ze=s.createTexture({size:[w.W,w.H],format:p,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),te=w.W,M=w.H,$=s.createBindGroup({layout:Me,entries:[{binding:0,resource:Ze.createView()}]}),w.k>0&&(w={...w,k:0})),w.k>0){const R=w.k/(w.k+1),ge=Y.beginRenderPass({colorAttachments:[{view:w.colorView,loadOp:"load",storeOp:"store"}]});ge.setPipeline(fe("acc"+w.samples,()=>W(Sm,Me,we,w.samples,"fxAcc"))),ge.setBindGroup(0,$),ge.setBlendConstant({r:R,g:R,b:R,a:R}),ge.draw(3),ge.end()}w.canvasTex?Y.copyTextureToTexture({texture:w.canvasTex},{texture:Ze},[w.W,w.H]):Y.beginRenderPass({colorAttachments:[{view:w.colorView,resolveTarget:Ze.createView(),loadOp:"load",storeOp:"store"}]}).end()}function Je(){me?.destroy(),Ie?.destroy(),ae?.destroy(),Ze?.destroy(),me=Ie=ae=Ze=null,tt.clear(),pt=null,$=null,U.destroy(),O.destroy(),N.clear()}return{pre:K,post:We,accumulate:Be,dispose:Je,bytes:()=>(Te>>1)*(Ye>>1)*12+(ae?Te*Ye*4:0)+te*M*4}}const hf=1/6371e3,Fm=s=>`
${rn}
struct SsrP { rF: vec4f, rX: vec4f, rY: vec4f, i0: vec4f, i1: vec4f, i2: vec4f, eye: vec4f, p: vec4f, q: vec4f, size: vec4f, rn: vec4f, an: vec4f, ex: vec4f, ny: vec4f };
// rF/rX/rY.xyz＝視線 v(ndc)＝rF＋ndc.x·rX＋ndc.y·rY（clip w が 1 の長さ）・rX.w＝|eye|²−1・rY.w＝2·ln2／logCoef
// i0/i1/i2＝[rF rX rY] の逆行列の行（Q → (w, w·ndc.x, w·ndc.y)）・eye.xyz＝目（β 単位球）
// p＝(強さ, 歩く長さ（R）, 厚み（R）, 歩数)・q＝(ocean, ground, facades, 0)・size＝(W, H, 1/W, 1/H)（本体の画素）
// rn＝雨 (濡れ 0..1, 時刻 s, 積み上げの番目, 0)・an＝目−雑音の錨（β）・ex/ny＝目の所の東・北（β）＝水たまりの斑と波紋（scenefx.ts FX_NOISE_WGSL）
@group(2) @binding(0) var<uniform> SS: SsrP;
@group(2) @binding(1) var ssrDep: ${s?"texture_depth_multisampled_2d":"texture_depth_2d"};
@group(2) @binding(2) var ssrStn: ${s?"texture_multisampled_2d<u32>":"texture_2d<u32>"};
@group(2) @binding(3) var ssrCol: texture_2d<f32>;
const SSR_M: f32 = ${hf.toExponential(6)};
${Ud}
fn ssrExpm1(x: f32) -> f32 {
	if (x < 0.1) { return x * (1.0 + x * (0.5 + x * (0.16666667 + x * (0.041666668 + x * (0.008333334 + x * 0.0013888889))))); }
	return exp(x) - 1.0;
}
fn ssrClampQ(q: vec2i) -> vec2i { return clamp(q, vec2i(0), vec2i(SS.size.xy) - vec2i(1)); }
// 本体の画素 q → xyz＝目からの相対位置・w＝clip w（空は w<0）。深度の無い画素は球の床（AO の posAt と同式）
fn ssrPos(q0: vec2i) -> vec4f {
	let q = ssrClampQ(q0);
	let z = textureLoad(ssrDep, q, 0);
	let uv = (vec2f(q) + 0.5) * SS.size.zw;
	let v = SS.rF.xyz + (uv.x * 2.0 - 1.0) * SS.rX.xyz + (1.0 - uv.y * 2.0) * SS.rY.xyz;
	if (z >= 1.0) {
		let a = dot(v, v); let b = dot(SS.eye.xyz, v); let c = SS.rX.w;
		let h = b * b - a * c;
		if (h < 0.0 || b >= 0.0 || c <= 0.0) { return vec4f(0.0, 0.0, 0.0, -1.0); }
		let s = c / (-b + sqrt(h));
		return vec4f(v * s, s);
	}
	let w = ssrExpm1(z * SS.rY.w);
	return vec4f(v * w, w);
}
// 目からの相対位置 Q → (w, ndc.x, ndc.y)（w≤0＝目の後ろ）
fn ssrProj(Q: vec3f) -> vec3f {
	let a = vec3f(dot(SS.i0.xyz, Q), dot(SS.i1.xyz, Q), dot(SS.i2.xyz, Q));
	if (a.x <= 0.0) { return vec3f(-1.0, 0.0, 0.0); }
	return vec3f(a.x, a.yz / a.x);
}
fn ssrPix(ndc: vec2f) -> vec2i { return vec2i(vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5) * SS.size.xy); }
// 標高の窓（近・遠）の内か＝海の判定は窓の外（標高 0＝データ無し）を海にしない
fn ssrCovered(ll: vec2f) -> bool {
	let u = (ll - F.elevBounds.xy) / F.elevBounds.zw;
	if (all(u >= vec2f(0.0)) && all(u <= vec2f(1.0))) { return true; }
	if (F.farP.x < 0.5) { return false; }
	let g = (ll - F.farBounds.xy) / F.farBounds.zw;
	return all(g >= vec2f(0.0)) && all(g <= vec2f(1.0));
}
${Tf}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let k4 = u32(SS.rn.z) & 3u;   // 静止の積み上げの番目で 2×2 のどの画素を受け持つかを回す（4 枚で全画素＝細い部材が埋まる・動いている間は 0）
	let q = vec2i(pos.xy) * 2 + vec2i(i32(k4 & 1u), i32(k4 >> 1u));   // 半解像度の texel → 本体の 2×2 の左上
	let Pc = ssrPos(q);
	if (Pc.w < 0.0) { return vec4f(0.0); }
	let wp = SS.eye.xyz + Pc.xyz;
	let up = normalize(wp);
	// 法線＝深度のある画素は隣の画素との差（手前側の差＝縁で跳ばない・AO と同式）。球の床は上向き
	var n = up;
	if (textureLoad(ssrDep, ssrClampQ(q), 0) < 1.0) {
		let Px1 = ssrPos(q + vec2i(1, 0)); let Px0 = ssrPos(q - vec2i(1, 0));
		let Py1 = ssrPos(q + vec2i(0, 1)); let Py0 = ssrPos(q - vec2i(0, 1));
		let dx = select(Pc.xyz - Px0.xyz, Px1.xyz - Pc.xyz, abs(Px1.w - Pc.w) < abs(Px0.w - Pc.w) || Px0.w < 0.0);
		let dy = select(Pc.xyz - Py0.xyz, Py1.xyz - Pc.xyz, abs(Py1.w - Pc.w) < abs(Py0.w - Pc.w) || Py0.w < 0.0);
		let cn = cross(dx, dy);
		if (dot(cn, cn) < 1e-30) { return vec4f(0.0); }
		n = normalize(cn);
	}
	if (dot(n, Pc.xyz) > 0.0) { n = -n; }   // 視線に向ける
	let nUp = dot(n, up);
	// 雨（rain）＝上を向いた面は水たまりの所ほど鏡に近く・近くは波紋で揺らす（遠くは画素より細かいので揺らさない）
	var wetK = 1.0;
	if (SS.rn.x > 0.0 && nUp > 0.9) {
		let m = (Pc.xyz + SS.an.xyz) / SSR_M;
		wetK = mix(0.3, 1.0, fxPuddleFar(m, Pc.w));
		let rp = fxRipple(m, SS.rn.y) * (0.12 * SS.rn.x * clamp(60.0 * SSR_M / Pc.w, 0.0, 1.0));
		n = normalize(n + SS.ex.xyz * rp.x + SS.ny.xyz * rp.y);
	}
	// 映す面と反射率
	var r = 0.0;
	if (nUp > 0.9) { r = SS.q.y * wetK; }   // ground
	if (SS.q.z > 0.0 && abs(nUp) < 0.35 && (textureLoad(ssrStn, ssrClampQ(q), 0).r & 0x80u) != 0u) { r = max(r, SS.q.z); }   // facades（建物・模型の立った面）
	if (SS.q.x > 0.0 && nUp > 0.9 && F.elevP.y > 0.5) {   // ocean＝標高 0 m 以下の地面（屋上を除く＝高さ 30 m 未満）
		let alt = (2.0 * dot(SS.eye.xyz, Pc.xyz) + dot(Pc.xyz, Pc.xyz) + SS.rX.w) / (length(wp) + 1.0) / SSR_M;   // |E＋P|−1（桁落ち無し）→ m
		let dll = deltaLL(F.eyeO.xyz + Pc.xyz, F.originPt, F.trig.z, F.eyeO.w, F.ellP.x);
		let ll = F.origin + dll;
		if (alt < 30.0 && ssrCovered(ll)) { r = max(r, SS.q.x * (1.0 - smoothstep(0.0, 1.0, elev(ll)))); }
	}
	if (r <= 0.0) { return vec4f(0.0); }
	// 反射の向きと Fresnel（Schlick＝r が真上から見た反射率・斜めほど 1 へ。小さい r は斜めの伸びも抑える）
	let V = normalize(Pc.xyz);
	let R = reflect(V, n);
	let cosT = clamp(-dot(V, n), 0.0, 1.0);
	let fres = r + (1.0 - r) * pow(1.0 - cosT, 5.0) * min(1.0, 2.0 * r);
	// 深度の中を歩く：t＝長さ×s²（手前ほど細かい）・s のジッタは画素ごと（IGN）＝縞を拡大の双線形で均す。
	// 当たり＝「物の手前」から「物の裏」へ入った 1 歩を見つけ、その歩の中を 6 回の二分で面まで詰め、詰めた所の深度の差が厚みの内なら当たり（厚みを超える＝物の後ろを通った＝歩き続ける）
	let nSteps = i32(SS.p.w);
	let jit = fract(52.9829189 * fract(dot(pos.xy + SS.rn.z * 5.588238, vec2f(0.06711056, 0.00583715))));   // rn.z＝静止の積み上げの番目（毎フレームずらす）
	let O = Pc.xyz + n * (Pc.w * 2.0e-4);   // 自分の面に当たらない下駄（視距離の 0.02%）
	let maxD = SS.p.y;   // 歩く長さ＝maxDistance（視距離の 2 倍で頭打ちにすると、手前の水面から奥の岸のビルへ届かず映り込みが途中で切れた・Mac 2026-11-02）
	var tPrev = 0.0; var tHit = -1.0; var front = true;
	for (var i = 0; i < nSteps; i++) {
		let s = (f32(i) + jit) / f32(nSteps);
		let t = maxD * s * s;
		let a = ssrProj(O + R * t);
		if (a.x <= 0.0 || abs(a.y) > 1.0 || abs(a.z) > 1.0) { break; }   // 目の後ろ・画面の外＝映らない
		let Sx = ssrPos(ssrPix(a.yz));
		let px = ssrPix(a.yz);
		let near = dot(vec2f(px - q), vec2f(px - q)) < 16.0;   // 出発の画素から 4 px の内＝画素の量子化で自分の面の裏に見える（床の自己交差）＝当たりと見ない
		let behind = !near && Sx.w > 0.0 && a.x > Sx.w;
		if (behind && front) {
			var lo = tPrev; var hi = t;
			for (var k = 0; k < 6; k++) {
				let mid = 0.5 * (lo + hi);
				let am = ssrProj(O + R * mid);
				let Sm = ssrPos(ssrPix(am.yz));
				if (am.x > 0.0 && Sm.w > 0.0 && am.x > Sm.w) { hi = mid; } else { lo = mid; }
			}
			let ah = ssrProj(O + R * hi);
			let Sh = ssrPos(ssrPix(ah.yz));
			if (Sh.w > 0.0 && ah.x - Sh.w < SS.p.z + (hi - lo) + Sh.w * 0.004) { tHit = hi; break; }
		}
		front = !behind;
		tPrev = t;
	}
	if (tHit < 0.0) { return vec4f(0.0); }
	let hi = tHit;
	let a = ssrProj(O + R * hi);
	if (a.x <= 0.0) { return vec4f(0.0); }
	let edgeF = 1.0 - smoothstep(0.85, 1.0, max(abs(a.y), abs(a.z)));   // 画面の縁で消す
	let dfade = 1.0 - smoothstep(0.6, 1.0, hi / maxD);                    // 歩く長さの終わりで消す
	let wgt = clamp(SS.p.x * fres * edgeF * dfade, 0.0, 1.0);
	let c = textureLoad(ssrCol, ssrClampQ(ssrPix(a.yz)), 0).rgb;
	return vec4f(c * wgt, wgt);
}`,Tf=`@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
	let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
	return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}`,Gm=`
@group(0) @binding(0) var rT: texture_2d<f32>;
@group(0) @binding(1) var rS: sampler;
@group(0) @binding(2) var<uniform> CP: vec4f;   // (1/W, 1/H, 0, 0)（本体の画素）
${Tf}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	return textureSampleLevel(rT, rS, (pos.xy - CP.zw) * CP.xy, 0.0);   // CP.zw＝半解像度の texel が受け持つ画素のずれ（積み上げで 2×2 を回す）
}`,fd=(s,p)=>`
@group(0) @binding(0) var bT: texture_2d<f32>;
@group(0) @binding(1) var bD: ${p?"texture_depth_multisampled_2d":"texture_depth_2d"};
@group(0) @binding(2) var<uniform> BP: vec4f;   // x＝2·ln2／logCoef（深度 → ln(1+w)）
${Tf}
fn lw(p: vec2i) -> f32 {
	let q = clamp(p * 2, vec2i(0), vec2i(textureDimensions(bD)) - vec2i(1));
	let z = textureLoad(bD, q, 0);
	if (z >= 1.0) { return 1.0e4; }   // 空
	return z * BP.x;
}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let xy = vec2i(pos.xy); let dim = vec2i(textureDimensions(bT));
	let c0 = lw(xy);
	let g = 0.5 * abs(lw(xy + vec2i(0, 1)) - lw(xy - vec2i(0, 1)));
	let kg = exp(-(g * g) / (0.025 * 0.025));
	var s = vec4f(0.0); var ws = 0.0;
	for (var i = -2; i <= 2; i++) {
		let t = clamp(xy + vec2i(${s[0]}, ${s[1]}) * i, vec2i(0), dim - vec2i(1));
		var w = 6.0;
		if (i != 0) { let dl = lw(t) - c0; w = select(1.0, 4.0, abs(i) == 1) * kg * exp(-(dl * dl) / (0.05 * 0.05)); }
		s += w * textureLoad(bT, t, 0); ws += w;
	}
	return s / ws;
}`;function Ad(s,p,_){const A=[[s[0],p[0],_[0]],[s[1],p[1],_[1]],[s[2],p[2],_[2]]],D=(le,Se,ee,N)=>A[le][Se]*A[ee][N]-A[le][N]*A[ee][Se],C=[[D(1,1,2,2),-D(0,1,2,2),D(0,1,1,2)],[-D(1,0,2,2),D(0,0,2,2),-D(0,0,1,2)],[D(1,0,2,1),-D(0,0,2,1),D(0,0,1,1)]],F=A[0][0]*C[0][0]+A[0][1]*C[1][0]+A[0][2]*C[2][0];return C.map(le=>le.map(Se=>Se/F))}function Tm(s,p,_,A,D=!1){const C=GPUShaderStage.FRAGMENT,F=oe=>s.createBindGroupLayout({entries:[{binding:0,visibility:C,buffer:{}},{binding:1,visibility:C,texture:{sampleType:"depth",multisampled:oe}},{binding:2,visibility:C,texture:{sampleType:"uint",multisampled:oe}},{binding:3,visibility:C,texture:{sampleType:"unfilterable-float"}}]}),le=s.createBindGroupLayout({entries:[{binding:0,visibility:C,texture:{sampleType:"float"}},{binding:1,visibility:C,sampler:{type:"filtering"}},{binding:2,visibility:C,buffer:{}}]}),Se=new Map,ee=oe=>{let K=Se.get(oe);return K||(K=F(oe),Se.set(oe,K)),K},N=new Map,fe=(oe,K)=>{let We=N.get(oe);return We||(We=K(),N.set(oe,We)),We},W=(oe,K,We,Ze=1,te="ssr")=>{const M=s.createShaderModule({code:D?fo(fo(oe,"ssrDep","SS.rY.w"),"bD","BP.x"):oe,label:te});return s.createRenderPipeline({label:te,layout:s.createPipelineLayout({bindGroupLayouts:K}),vertex:{module:M,entryPoint:"vs"},fragment:{module:M,entryPoint:"fs",targets:We},primitive:{topology:"triangle-list"},multisample:{count:Ze}})},H=[{format:p,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"zero",dstFactor:"one",operation:"add"}}}],be=s.createBuffer({size:224,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),l=s.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Ee=s.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),Z=new Float32Array(56);let U=null,O=null,L=null,G=0,me=0,Ie=null,ae=null,Te=null,Ye=null;const tt=oe=>s.createBindGroupLayout({entries:[{binding:0,visibility:C,texture:{sampleType:"unfilterable-float"}},{binding:1,visibility:C,texture:{sampleType:"depth",multisampled:oe}},{binding:2,visibility:C,buffer:{}}]}),T=new Map,ke=s.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let J=null;function pt(oe,K){U&&G===oe&&me===K||(U?.destroy(),O?.destroy(),L?.destroy(),U=s.createTexture({size:[oe,K],format:p,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),O=s.createTexture({size:[Math.max(1,oe>>1),Math.max(1,K>>1)],format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),L=s.createTexture({size:[Math.max(1,oe>>1),Math.max(1,K>>1)],format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),G=oe,me=K,Ie=null,ae=null,Te=null,Ye=null)}function Xe(oe,K){pt(K.W,K.H);const We=K.samples>1,Ze=ee(We),te=fe(We?"ms":"ss",()=>W(Fm(We),[_,A,Ze],[{format:"rgba16float"}],1,"ssr")),M=fe("comp"+K.samples,()=>W(Gm,[le],H,K.samples,"ssrComp"));(!Ie||Ie.dep!==K.depthTex||Ie.col!==U)&&(Ie={dep:K.depthTex,col:U,bg:s.createBindGroup({layout:Ze,entries:[{binding:0,resource:{buffer:be}},{binding:1,resource:K.depthTex.createView({aspect:"depth-only"})},{binding:2,resource:K.depthTex.createView({aspect:"stencil-only"})},{binding:3,resource:U.createView()}]})});let $=T.get(We);$||($=tt(We),T.set(We,$));const Me=$,we=We?"m":"s",Be=fe("blurH"+we,()=>W(fd([1,0],We),[Me],[{format:"rgba16float"}],1,"ssrBlurH")),Je=fe("blurV"+we,()=>W(fd([0,1],We),[Me],[{format:"rgba16float"}],1,"ssrBlurV"));J!==K.depthTex&&(Te=Ye=null,J=K.depthTex);const Y=st=>[{binding:0,resource:st.createView()},{binding:1,resource:K.depthTex.createView({aspect:"depth-only"})},{binding:2,resource:{buffer:ke}}];Te??=s.createBindGroup({layout:Me,entries:Y(O)}),Ye??=s.createBindGroup({layout:Me,entries:Y(L)}),ae??=s.createBindGroup({layout:le,entries:[{binding:0,resource:O.createView()},{binding:1,resource:Ee},{binding:2,resource:{buffer:l}}]}),K.canvasTex?oe.copyTextureToTexture({texture:K.canvasTex},{texture:U},[K.W,K.H]):oe.beginRenderPass({colorAttachments:[{view:K.colorView,resolveTarget:U.createView(),loadOp:"load",storeOp:"store"}]}).end();const w=Oa(K.mvp,K.invMvp),R=Ad(w.F,w.X,w.Y),ge=K.eye,E=K.opt;if(Z.fill(0),Z.set(w.F,0),Z.set(w.X,4),Z[7]=ge[0]*ge[0]+ge[1]*ge[1]+ge[2]*ge[2]-1,Z.set(w.Y,8),Z[11]=2*Math.LN2/K.logCoef,Z.set(R[0],12),Z.set(R[1],16),Z.set(R[2],20),Z[24]=ge[0],Z[25]=ge[1],Z[26]=ge[2],Z[28]=E.intensity*K.fade,Z[29]=E.maxDistance*hf,Z[30]=E.thickness*hf,Z[31]=E.steps,Z[32]=E.ocean,Z[33]=E.ground,Z[34]=E.facades,Z[36]=K.W,Z[37]=K.H,Z[38]=1/K.W,Z[39]=1/K.H,Z[42]=K.phase??0,E.rain&&E.rain>0&&K.pole){const st=Rd(ge,K.pole);Z[40]=E.rain,Z[41]=(K.time??0)%600,Z.set(st.an,44),Z.set(st.ex,48),Z.set(st.ny,52)}s.queue.writeBuffer(be,0,Z),s.queue.writeBuffer(ke,0,new Float32Array([Z[11],0,0,0]));const Oe=(K.phase??0)&3;s.queue.writeBuffer(l,0,new Float32Array([1/K.W,1/K.H,Oe&1,Oe>>1]));const Ue=oe.beginRenderPass({colorAttachments:[{view:O.createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});Ue.setPipeline(te),Ue.setBindGroup(0,K.bg0),Ue.setBindGroup(1,K.bg1),Ue.setBindGroup(2,Ie.bg),Ue.draw(3),Ue.end();const se=(st,qe,Ot)=>{const Ft=oe.beginRenderPass({colorAttachments:[{view:st,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});Ft.setPipeline(qe),Ft.setBindGroup(0,Ot),Ft.draw(3),Ft.end()};se(L.createView(),Be,Te),se(O.createView(),Je,Ye);const ot=oe.beginRenderPass({colorAttachments:[{view:K.colorView,loadOp:"load",storeOp:"store"}]});ot.setPipeline(M),ot.setBindGroup(0,ae),ot.draw(3),ot.end()}function gt(){U?.destroy(),O?.destroy(),L?.destroy(),U=O=L=null,Ie=null,ae=null,Te=null,Ye=null,be.destroy(),l.destroy(),ke.destroy(),J=null,N.clear()}return{encode:Xe,dispose:gt,bytes:()=>G*me*4+(G>>1)*(me>>1)*16}}const _m=6378137,La=1,Ld=5e8,_f=`struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VOut {
	var o: VOut;
	let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
	o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0); o.uv = p;
	return o;
}`,ud=s=>`struct DP { p: vec4f };
@group(0) @binding(0) var<uniform> P: DP;
@group(0) @binding(1) var dep: ${s?"texture_depth_multisampled_2d":"texture_depth_2d"};
${_f}
fn expm1s(x: f32) -> f32 { if (x < 0.1) { return x * (1.0 + x * (0.5 + x * (0.16666667 + x * (0.041666668 + x * (0.0083333335 + x * (0.0013888889 + x * 0.00019841270)))))); } return exp(x) - 1.0; }
struct FOut { @builtin(frag_depth) d: f32 };
@fragment fn fs(in: VOut) -> FOut {
	var o: FOut;
	let d = textureLoad(dep, vec2i(in.pos.xy), 0);
	if (d >= 1.0) { o.d = 1.0; return o; }
	let w = expm1s(d * P.p.x) * ${_m.toFixed(1)};
	o.d = clamp(log2(max(w - P.p.z, 0.0) + 1.0) * P.p.y, 0.0, 1.0);
	return o;
}`,ka=`struct SP { c: vec4f, p: vec4f, size: vec4f };
@group(0) @binding(0) var<uniform> S: SP;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
@group(0) @binding(3) var dep: texture_depth_2d;
fn luminance(rgb: vec3f) -> f32 { return dot(rgb, vec3f(0.2125, 0.7154, 0.0721)); }
fn depthAt(p: vec2i) -> f32 { let dim = vec2i(textureDimensions(dep)); return textureLoad(dep, clamp(p, vec2i(0), dim - 1), 0); }
`+_f,zm=ka+`
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	let q = vec2i(in.pos.xy); let pad = max(1, i32(round(S.p.z)));
	let dirs = array<i32, 3>(-1, 0, 1); let sc = array<f32, 3>(3.0, 10.0, 3.0);
	var h = 0.0; var v = 0.0;
	for (var i = 0; i < 3; i++) {
		let dir = dirs[i]; let s = sc[i];
		h -= depthAt(q + vec2i(-pad, dir * pad)) * s;
		h += depthAt(q + vec2i(pad, dir * pad)) * s;
		v -= depthAt(q + vec2i(dir * pad, -pad)) * s;
		v += depthAt(q + vec2i(dir * pad, pad)) * s;
	}
	let len = sqrt(h * h + v * v);
	let a = select(0.0, S.c.a, len > S.p.x);
	let c = textureLoad(src, q, 0);
	return mix(c, vec4f(S.c.rgb, a), a);
}`,Cm=ka+`
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	let rgb = textureLoad(src, vec2i(in.pos.xy), 0).rgb;
	var darkness = luminance(rgb) * S.p.x;
	darkness = (darkness - fract(darkness)) / S.p.x;
	return vec4f(vec3f(darkness), 1.0);
}`,dd=ka+`
@fragment fn fs(in: VOut) -> @location(0) vec4f { let rgb = textureLoad(src, vec2i(in.pos.xy), 0).rgb; return vec4f(mix(vec3f(0.0), rgb, S.p.x), 1.0); }`,Em=ka+`
fn rand(co: vec2f) -> f32 { return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453); }
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	let noise = rand(in.uv + sin(S.p.y)) * 0.1;
	let rgb = textureLoad(src, vec2i(in.pos.xy), 0).rgb;
	return vec4f((noise + rgb) * vec3f(0.0, 1.0, 0.0), 1.0);
}`,ns=`struct XP { a: vec4f, b: vec4f, c: vec4f, d: vec4f, size: vec4f };
@group(0) @binding(0) var<uniform> X: XP;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
@group(0) @binding(3) var dep: texture_depth_2d;
@group(0) @binding(4) var texA: texture_2d<f32>;
@group(0) @binding(5) var texB: texture_2d<f32>;
fn tex(t: texture_2d<f32>, uv: vec2f) -> vec4f { return textureSampleLevel(t, smp, vec2f(uv.x, 1.0 - uv.y), 0.0); }
`+_f,Mm=ns+`
fn isInEarth(texcoord: vec2f, sceneSize: vec2f) -> f32 {
	var ndc = texcoord * 2.0 - 1.0;
	ndc -= X.d.xy;
	let x = abs(ndc.x) * sceneSize.x; let y = abs(ndc.y) * sceneSize.y;
	// Cesium の本文は clamp(0.0, 1.0, m)（下限＞上限＝GLSL では未定義）。実機（Mac の Metal）の Cesium の絵＝min(1, m)＝地球を隠す（gl/poststage.js と同じ）
	return min(1.0, max(sqrt(x * x + y * y) / max(abs(X.d.z * sceneSize.x), 1.0) - 0.8, 0.0));
}
// 太陽の光の玉（gl/poststage.js sunGlow と同式）
fn sunGlow(uv: vec2f) -> vec3f {
	let sp = (X.c.xy * 0.5 + 0.5) * X.size.xy;
	let d = length(uv * X.size.xy - sp) / X.b.w;
	return vec3f(1.0, 1.0, 0.72) * 0.75 * clamp(1.0 - d / 22.0, 0.0, 1.0) + vec3f(exp(-d * d / 2.0));
}
fn sceneAt(uv: vec2f) -> vec4f { let c = tex(src, uv); return vec4f(c.rgb + sunGlow(uv), c.a);
}
fn distorted(texcoord: vec2f, direction: vec2f, distortion: vec3f) -> vec4f {
	let sceneSize = X.size.xy;
	let r = isInEarth(texcoord + direction * distortion.r, sceneSize) * sceneAt(texcoord + direction * distortion.r).r;
	let g = isInEarth(texcoord + direction * distortion.g, sceneSize) * sceneAt(texcoord + direction * distortion.g).g;
	let b = isInEarth(texcoord + direction * distortion.b, sceneSize) * sceneAt(texcoord + direction * distortion.b).b;
	return vec4f(clamp(vec3f(r, g, b), vec3f(0.0), vec3f(1.0)), 0.0);
}
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	let uv = in.uv;
	let originalColor = tex(src, uv);
	let sunPos = X.c.xy;
	if (X.b.y < 0.5 || !(sunPos.x >= -1.1 && sunPos.x <= 1.1 && sunPos.y >= -1.1 && sunPos.y <= 1.1)) { return originalColor; }
	let intensity = X.a.x; let distortion = X.a.y; let ghostDispersal = X.a.z; let haloWidth = X.a.w; let dirtAmount = X.b.x;
	let texcoord = vec2f(1.0) - uv;
	let pixelSize = X.b.w * X.size.zw;
	let invPixelSize = 1.0 / pixelSize;
	let distortionVec = pixelSize.x * vec3f(-distortion, 0.0, distortion);
	let ghostVec = (vec2f(0.5) - texcoord) * ghostDispersal;
	let direction = normalize(vec3f(ghostVec, 0.0));
	var result = vec4f(0.0);
	for (var i = 0; i < 4; i++) { result += distorted(fract(texcoord + ghostVec * f32(i)), direction.xy, distortionVec); }
	let haloVec = normalize(ghostVec) * haloWidth;
	var weightForHalo = length(vec2f(0.5) - fract(texcoord + haloVec)) / length(vec2f(0.5));
	weightForHalo = pow(1.0 - weightForHalo, 5.0);
	result += distorted(texcoord + haloVec, direction.xy, distortionVec) * weightForHalo * 1.5;
	var dc = (uv * invPixelSize) / X.c.zw;
	if (dc.x > 1.0) { dc.x = select(fract(dc.x), 1.0 - fract(dc.x), floor(dc.x) % 2.0 == 1.0); }
	if (dc.y > 1.0) { dc.y = select(fract(dc.y), 1.0 - fract(dc.y), floor(dc.y) % 2.0 == 1.0); }
	result += dirtAmount * tex(texA, dc);
	let camrot = X.b.z; let cs = cos(camrot); let sn = sin(camrot);
	let rotation = mat3x3f(cs, -sn, 0.0, sn, cs, 0.0, 0.0, 0.0, 1.0);
	let st1 = vec3f(uv * 2.0 - vec2f(1.0), 1.0);
	let st2 = vec3f((rotation * st1).xy, 1.0);
	let st3 = st2 * 0.5 + vec3f(0.5);
	let weightForLensFlare = length(vec3f(sunPos, 0.0));
	let oneMinus = max(1.0 - weightForLensFlare, 0.0);
	result *= oneMinus * intensity;
	result *= tex(texB, st3.xy) * weightForLensFlare * max(1.0 - length(st1.xy), 0.0) * 2.0;
	let o = result + sceneAt(uv);
	return vec4f(o.rgb, clamp(max(o.a, max(o.r, max(o.g, o.b))), 0.0, 1.0));   // 透かした宇宙（premultiplied）の上でも光が乗る＝α を色の明るさまで上げる（色＞α は合成で落ちる）
}`,Um=ns+`
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	let delta = X.a.x; let sigma = X.a.y; let dir = vec2f(1.0 - X.a.w, X.a.w);
	let stp = vec2f(X.a.z * X.b.w) * X.size.zw;
	var g = vec3f(1.0 / (sqrt(6.283185307179586) * sigma), exp((-0.5 * delta * delta) / (sigma * sigma)), 0.0);
	g.z = g.y * g.y;
	var result = tex(src, in.uv) * g.x;
	for (var i = 1; i < 8; i++) { g = vec3f(g.x * g.y, g.y * g.z, g.z); let o = f32(i) * dir * stp; result += tex(src, in.uv - o) * g.x; result += tex(src, in.uv + o) * g.x; }
	return result;
}`,Rm=ns+`
fn groundW(uv: vec2f) -> f32 {
	if (X.a.w < 0.5) { return X.a.z; }
	let dir = vec3f((uv * 2.0 - 1.0) * X.d.xy, -1.0);
	let a = dot(dir, dir); let b = -2.0 * dot(dir, X.c.xyz); let c = dot(X.c.xyz, X.c.xyz) - X.c.w * X.c.w;
	let disc = b * b - 4.0 * a * c;
	if (disc < 0.0) { return X.a.z; }
	let t = (-b - sqrt(disc)) / (2.0 * a);
	return select(X.a.z, t, t > 0.0);
}
fn computeDepthBlur(depth: f32) -> f32 {
	let focalDistance = X.a.x; let near = X.a.y; let far = X.a.z;
	var f: f32;
	if (depth < focalDistance) { f = (focalDistance - depth) / (focalDistance - near); }
	else { f = pow((depth - focalDistance) / (far - focalDistance), 0.1); }
	f *= f;
	return pow(clamp(f, 0.0, 1.0), 0.5);
}
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	let dim = vec2i(textureDimensions(dep));
	let d = textureLoad(dep, clamp(vec2i(in.pos.xy), vec2i(0), dim - 1), 0);
	let w = select(exp2(d * ${Math.log2(Ld-La+1).toFixed(6)}) - 1.0 + ${La.toFixed(1)}, groundW(in.uv), d >= 1.0);
	return mix(tex(src, in.uv), tex(texA, in.uv), computeDepthBlur(w));
}`,Am=ns+`
fn rgbToHsb(rgb: vec3f) -> vec3f {
	let K = vec4f(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	let p = mix(vec4f(rgb.bg, K.wz), vec4f(rgb.gb, K.xy), step(rgb.b, rgb.g));
	let q = mix(vec4f(p.xyw, rgb.r), vec4f(rgb.r, p.yzx), step(p.x, rgb.r));
	let d = q.x - min(q.w, q.y);
	return vec3f(abs(q.z + (q.w - q.y) / (6.0 * d + 0.0000001)), d / (q.x + 0.0000001), q.x);
}
fn hsbToRgb(hsb: vec3f) -> vec3f {
	let K = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	let p = abs(fract(hsb.xxx + K.xyz) * 6.0 - K.www);
	return hsb.z * mix(K.xxx, clamp(p - K.xxx, vec3f(0.0), vec3f(1.0)), hsb.y);
}
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	var c = rgbToHsb(textureLoad(src, vec2i(in.pos.xy), 0).rgb);
	c.z += X.a.y;
	let factor = (259.0 * (X.a.x + 255.0)) / (255.0 * (259.0 - X.a.x));
	return vec4f(factor * (hsbToRgb(c) - vec3f(0.5)) + vec3f(0.5), 1.0);
}`,Lm=ns+`
@fragment fn fs(in: VOut) -> @location(0) vec4f {
	let q = vec2i(in.pos.xy);
	let bloom = textureLoad(texA, q, 0);
	if (X.a.x > 0.5) { return bloom; }
	return bloom + textureLoad(src, q, 0);
}`;function Om(s,p,_,A=!1){const D=GPUShaderStage.FRAGMENT,C=s.createBindGroupLayout({entries:[{binding:0,visibility:D,buffer:{}},{binding:1,visibility:D,texture:{}},{binding:2,visibility:D,sampler:{}},{binding:3,visibility:D,texture:{sampleType:"depth"}}]}),F=M=>s.createBindGroupLayout({entries:[{binding:0,visibility:D,buffer:{}},{binding:1,visibility:D,texture:{sampleType:"depth",multisampled:M}}]}),le=s.createBindGroupLayout({entries:[{binding:0,visibility:D,buffer:{}},{binding:1,visibility:D,texture:{}},{binding:2,visibility:D,sampler:{}},{binding:3,visibility:D,texture:{sampleType:"depth"}},{binding:4,visibility:D,texture:{}},{binding:5,visibility:D,texture:{}}]}),Se={lensFlare:Mm,blur:Um,depthOfField:Rm,bloomCB:Am,bloomComp:Lm},ee=new Map,N=(M,$)=>{let Me=ee.get(M);return Me||(Me=s.createRenderPipeline({label:`post.${M}`,layout:s.createPipelineLayout({bindGroupLayouts:[Se[M]?le:C]}),vertex:{module:s.createShaderModule({code:$}),entryPoint:"vs"},fragment:{module:s.createShaderModule({code:$}),entryPoint:"fs",targets:[{format:p}]},primitive:{topology:"triangle-list"}}),ee.set(M,Me)),Me},fe=new Map,W=M=>{let $=fe.get(M);if(!$){const Me=F(M),we=A?fo(ud(M),"dep","P.p.x"):ud(M);$={l:Me,p:s.createRenderPipeline({label:`postDepth${M}x`,layout:s.createPipelineLayout({bindGroupLayouts:[Me]}),vertex:{module:s.createShaderModule({code:we}),entryPoint:"vs"},fragment:{module:s.createShaderModule({code:we}),entryPoint:"fs",targets:[]},primitive:{topology:"triangle-list"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"always"}})},fe.set(M,$)}return $},H=s.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),be=16,l=256,Ee=s.createBuffer({size:l*be,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Z=s.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let U=null,O=null,L=!1,G;const me=new Map,Ie=s.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});s.queue.writeTexture({texture:Ie},new Uint8Array([0,0,0,255]),{bytesPerRow:4},[1,1]);const ae=Ie.createView();function Te(M){if(!M)return null;let $=me.get(M);if($)return $.view?{view:$.view,w:$.w,h:$.h}:null;$={tex:null,view:null,w:1,h:1},me.set(M,$);const Me=$;return fetch(M).then(we=>{if(!we.ok)throw new Error(`${we.status} ${M}`);return we.blob()}).then(we=>createImageBitmap(we)).then(we=>{if(me.get(M)!==Me){we.close();return}const Be=s.createTexture({size:[we.width,we.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});s.queue.copyExternalImageToTexture({source:we},{texture:Be},[we.width,we.height]),Me.tex=Be,Me.view=Be.createView(),Me.w=we.width,Me.h=we.height,we.close(),_?.()}).catch(we=>console.warn("[gpu] post stage image failed:",we?.message||we)),null}function Ye(){if(O){for(const M of O.tex)M.destroy();O=null}}function tt(M,$){if(O&&O.w===M&&O.h===$)return;Ye();const Me=[0,1].map(()=>s.createTexture({size:[M,$],format:p,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT}));O={w:M,h:$,tex:Me,view:Me.map(we=>we.createView())}}function T(){if(Ye(),!!U){for(const M of U.tex)M.destroy();U.d.destroy(),U=null}}function ke(M,$){if(U&&U.w===M&&U.h===$)return;T();const Me=[0,1].map(()=>s.createTexture({size:[M,$],format:p,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST})),we=s.createTexture({size:[M,$],format:"depth24plus",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT});U={w:M,h:$,tex:Me,view:Me.map(Be=>Be.createView()),d:we,dv:we.createView()}}let J=!1,pt=!1;const Xe=()=>(G===void 0&&!J&&(J=!0,import("./glslbridge-CbyQvLYb.js").then(M=>{if(!pt)try{G=M.createGlslBridge(s,p,_,A)}catch($){G=null,console.warn("[gpu] glsl post stages:",$?.message||$)}}).catch(M=>{G=null,console.warn("[gpu] glsl post stages:",M?.message||M)}).finally(()=>_?.())),G??null),gt=M=>M.type!=="glsl"||Xe()?!0:(G===null&&!L&&(L=!0,console.warn('[gpu] post stage "glsl" needs WebGL2 in this worker (skipped on WebGPU)')),!1);function oe(M,$){return ke(M,$),U.view[1]}const K=M=>M.some(gt);function We(M,$,Me,we,Be,Je){ke(we,Be);const Y=$.filter(gt).slice(0,be-3);if(Y.some(Ue=>Ue.type==="silhouette"||Ue.type==="depthOfField")){const Ue=Je.samples>1,se=W(Ue);s.queue.writeBuffer(Z,0,new Float32Array([2*Math.LN2/Math.max(Je.logCoef,1e-9),1/Math.log2(Ld-La+1),La,0]));const ot=M.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:U.dv,depthLoadOp:"clear",depthClearValue:1,depthStoreOp:"store"}});ot.setPipeline(se.p),ot.setBindGroup(0,s.createBindGroup({layout:se.l,entries:[{binding:0,resource:{buffer:Z}},{binding:1,resource:Je.depthTex.createView({aspect:"depth-only"})}]})),ot.draw(3),ot.end()}const w=new Float32Array(l/4*be);let R=0;const ge=Ue=>{w[Ue+16]=we,w[Ue+17]=Be,w[Ue+18]=1/we,w[Ue+19]=1/Be},E=(Ue,se,ot,st,qe,Ot,Ft,qt,Tr)=>{const nn=R*(l/4);w.set(se,nn),w.set(ot,nn+4),w.set(st,nn+8),w.set(qe,nn+12),ge(nn);const ln=s.createBindGroup({layout:le,entries:[{binding:0,resource:{buffer:Ee,offset:R*l,size:80}},{binding:1,resource:Ot},{binding:2,resource:H},{binding:3,resource:U.dv},{binding:4,resource:qt},{binding:5,resource:Tr}]});R++;const Ae=M.beginRenderPass({colorAttachments:[{view:Ft,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});Ae.setPipeline(N(Ue,Se[Ue])),Ae.setBindGroup(0,ln),Ae.draw(3),Ae.end()};let Oe=U.view[1];for(let Ue=0;Ue<Y.length;Ue++){const se=Y[Ue];if(se.type==="glsl"){let qe=Ue;for(;qe+1<Y.length&&Y[qe+1].type==="glsl";)qe++;s.queue.writeBuffer(Ee,0,w,0,R*(l/4));const Ot=Xe()?.run(M,Y.slice(Ue,qe+1),Oe,U.tex[qe&1],we,Be,{...Je,fovy:Je.fovy??50*Math.PI/180});if(Ot&&(M=Ot,Oe=U.view[qe&1]),Ue=qe,Ue===Y.length-1){const Ft=R*(l/4);w[Ft+4]=1;const qt=s.createBindGroup({layout:C,entries:[{binding:0,resource:{buffer:Ee,offset:R*l,size:48}},{binding:1,resource:Oe},{binding:2,resource:H},{binding:3,resource:U.dv}]});R++;const Tr=M.beginRenderPass({colorAttachments:[{view:Me,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});Tr.setPipeline(N("brightness",dd)),Tr.setBindGroup(0,qt),Tr.draw(3),Tr.end()}continue}const ot=Ue===Y.length-1,st=ot?Me:U.view[Ue&1];if(se.type==="lensFlare"){const qe=Te(se.dirt),Ot=Te(se.star);E("lensFlare",[se.intensity,se.distortion,se.ghostDispersal,se.haloWidth],[qe?se.dirtAmount:0,se.space?1:0,se.camrot,Je.dpr],[se.sun[0],se.sun[1],qe?qe.w:1,qe?qe.h:1],[se.earth[0],se.earth[1],se.earth[2],0],Oe,st,qe?.view??ae,Ot?.view??ae)}else if(se.type==="depthOfField"){tt(we,Be),E("blur",[se.delta,se.sigma,se.stepSize,0],[0,0,0,Je.dpr],[0,0,0,0],[0,0,0,0],Oe,O.view[0],ae,ae),E("blur",[se.delta,se.sigma,se.stepSize,1],[0,0,0,Je.dpr],[0,0,0,0],[0,0,0,0],O.view[0],O.view[1],ae,ae);const qe=se.earth,Ot=se.tan??[1,1];E("depthOfField",[se.focalDistance,se.near,se.far,qe?1:0],[0,0,0,Je.dpr],qe?qe.slice(0,4):[0,0,0,0],[Ot[0],Ot[1],0,0],Oe,st,O.view[1],ae)}else if(se.type==="cesiumBloom")tt(we,Be),E("bloomCB",[se.contrast,se.brightness,0,0],[0,0,0,Je.dpr],[0,0,0,0],[0,0,0,0],Oe,O.view[0],ae,ae),E("blur",[se.delta,se.sigma,se.stepSize,0],[0,0,0,Je.dpr],[0,0,0,0],[0,0,0,0],O.view[0],O.view[1],ae,ae),E("blur",[se.delta,se.sigma,se.stepSize,1],[0,0,0,Je.dpr],[0,0,0,0],[0,0,0,0],O.view[1],O.view[0],ae,ae),E("bloomComp",[se.glowOnly?1:0,0,0,0],[0,0,0,Je.dpr],[0,0,0,0],[0,0,0,0],Oe,st,O.view[0],ae);else{const qe=R*(l/4);se.type==="silhouette"?(w.set(se.color,qe),w[qe+4]=se.length):se.type==="grey"?w[qe+4]=se.gradations:se.type==="brightness"&&(w[qe+4]=se.value),w[qe+5]=Je.frame,w[qe+6]=Je.dpr,w[qe+8]=we,w[qe+9]=Be,w[qe+10]=1/we,w[qe+11]=1/Be;const Ot=se.type==="silhouette"?zm:se.type==="grey"?Cm:se.type==="brightness"?dd:Em,Ft=s.createBindGroup({layout:C,entries:[{binding:0,resource:{buffer:Ee,offset:R*l,size:48}},{binding:1,resource:Oe},{binding:2,resource:H},{binding:3,resource:U.dv}]});R++;const qt=M.beginRenderPass({colorAttachments:[{view:st,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});qt.setPipeline(N(se.type,Ot)),qt.setBindGroup(0,Ft),qt.draw(3),qt.end()}Oe=U.view[Ue&1]}return s.queue.writeBuffer(Ee,0,w,0,R*(l/4)),M}function Ze(){pt=!0,G?.dispose(),G=null,T(),Ee.destroy(),Z.destroy(),Ie.destroy();for(const M of me.values())M.tex?.destroy();me.clear(),ee.clear(),fe.clear()}return{target:oe,drawable:K,encode:We,dispose:Ze,bytes:()=>(U?U.w*U.h*12:0)+(O?O.w*O.h*8:0)}}const Dm={linear:0,reinhard:1,aces:2,agx:3,filmic:4},zf=`@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
	let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
	return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}`,Cf=`struct PostP { b: vec4f, vig: vec4f, size: vec4f, dir: vec4f, tm: vec4f, lut: vec4f, gr: vec4f };
@group(0) @binding(0) var<uniform> U: PostP;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
fn graded(c: vec4f) -> vec3f { if (U.gr.w < 0.5) { return c.rgb; } return c.rgb * mix(U.gr.rgb, vec3f(1.0), 1.0 - c.a); }
`,km=Cf+zf+`
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let p = vec2i(pos.xy) * 2;
	let c = (graded(textureLoad(src, p, 0)) + graded(textureLoad(src, p + vec2i(1, 0), 0)) + graded(textureLoad(src, p + vec2i(0, 1), 0)) + graded(textureLoad(src, p + vec2i(1, 1), 0))) * 0.25;
	let l = dot(c, vec3f(0.2126, 0.7152, 0.0722));
	let k = max(l - U.b.x, 0.0) / max(l, 1e-4);
	return vec4f(c * k, 1.0);
}`,Im=Cf+zf+`
const W = array<f32, 5>(0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let ts = 1.0 / vec2f(textureDimensions(src));
	let uv = pos.xy * ts;
	var s = textureSample(src, smp, uv).rgb * W[0];
	for (var i = 1; i < 5; i++) { let d = U.dir.xy * f32(i) * ts; s += textureSample(src, smp, uv + d).rgb * W[i]; s += textureSample(src, smp, uv - d).rgb * W[i]; }
	return vec4f(s, 1.0);
}`,Nm=Cf+`@group(0) @binding(3) var bloom: texture_2d<f32>;
@group(0) @binding(4) var lut: texture_2d<f32>;
`+zf+`
fn tmReinhard(x: vec3f) -> vec3f { return x / (1.0 + x); }
fn tmAces(x: vec3f) -> vec3f { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), vec3f(0.0), vec3f(1.0)); }
fn tmFilmic(x: vec3f) -> vec3f {   // Hable（Uncharted 2）・白点 11.2
	let A = 0.15; let B = 0.50; let C = 0.10; let D = 0.20; let E = 0.02; let F = 0.30; let W = 11.2;
	let c = ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
	let w = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
	return clamp(c / w, vec3f(0.0), vec3f(1.0));
}
fn tmAgx(c0: vec3f) -> vec3f {   // AgX の最小版＝入出力の行列と 6 次の S 字（GL2 と同じ係数）
	let IN = mat3x3f(0.842479062253094, 0.0423282422610123, 0.0423756549057051, 0.0784335999999992, 0.878468636469772, 0.0784336, 0.0792237451477643, 0.0791661274605434, 0.879142973793104);
	let OUT = mat3x3f(1.19687900512017, -0.0528968517574562, -0.0529716355144438, -0.0980208811401368, 1.15190312990417, -0.0980434501171241, -0.0990297440797205, -0.0989611768448433, 1.15107367264116);
	var c = IN * c0;
	c = clamp((log2(max(c, vec3f(1e-10))) + 12.47393) / 16.5, vec3f(0.0), vec3f(1.0));
	let x2 = c * c; let x4 = x2 * x2;
	c = 15.5 * x4 * x2 - 40.14 * x4 * c + 31.96 * x4 - 6.868 * x2 * c + 0.4298 * x2 + 0.1191 * c - 0.00232;
	return clamp(OUT * c, vec3f(0.0), vec3f(1.0));
}
fn tonemap(c0: vec3f) -> vec3f {
	let c = c0 * U.tm.y;
	let m = i32(U.tm.x + 0.5);
	if (m == 1) { return tmReinhard(c); }
	if (m == 2) { return tmAces(c); }
	if (m == 3) { return tmAgx(c); }
	if (m == 4) { return tmFilmic(c); }
	return clamp(c, vec3f(0.0), vec3f(1.0));
}
fn fxaa(fc: vec2f, inv: vec2f) -> vec3f {   // FXAA 3.11 の簡約版（GL2 の depthout.js と同じ式）
	let SPAN = 8.0; let RMIN = 1.0 / 128.0; let RMUL = 1.0 / 8.0;
	let L = vec3f(0.299, 0.587, 0.114);
	let rgbM = textureSample(src, smp, fc * inv).rgb;
	let lNW = dot(textureSample(src, smp, (fc + vec2f(-1.0, -1.0)) * inv).rgb, L); let lNE = dot(textureSample(src, smp, (fc + vec2f(1.0, -1.0)) * inv).rgb, L);
	let lSW = dot(textureSample(src, smp, (fc + vec2f(-1.0, 1.0)) * inv).rgb, L); let lSE = dot(textureSample(src, smp, (fc + vec2f(1.0, 1.0)) * inv).rgb, L); let lM = dot(rgbM, L);
	let lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))); let lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
	var dir = vec2f(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
	let red = max((lNW + lNE + lSW + lSE) * (0.25 * RMUL), RMIN); let rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
	dir = min(vec2f(SPAN), max(vec2f(-SPAN), dir * rcp)) * inv;
	let uv = fc * inv;
	let a = 0.5 * (textureSample(src, smp, uv + dir * (1.0 / 3.0 - 0.5)).rgb + textureSample(src, smp, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
	let b = a * 0.5 + 0.25 * (textureSample(src, smp, uv - dir * 0.5).rgb + textureSample(src, smp, uv + dir * 0.5).rgb);
	let lB = dot(b, L);
	if (lB < lMin || lB > lMax) { return a; }
	return b;
}
fn lut3(c0: vec3f) -> vec3f {   // 帯＝x に B の板×size＋R・y に G
	let n = U.lut.x; let c = clamp(c0, vec3f(0.0), vec3f(1.0));
	let bb = c.b * (n - 1.0); let b0 = floor(bb); let b1 = min(b0 + 1.0, n - 1.0); let f = bb - b0;
	let x = (c.r * (n - 1.0) + 0.5) / (n * n); let y = (c.g * (n - 1.0) + 0.5) / n;
	return mix(textureSample(lut, smp, vec2f(b0 / n + x, y)).rgb, textureSample(lut, smp, vec2f(b1 / n + x, y)).rgb, f);
}
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	let uv = pos.xy * U.size.zw;
	var c = textureLoad(src, vec2i(pos.xy), 0);
	if (U.tm.w > 0.5) { c = vec4f(fxaa(pos.xy, U.size.zw), c.a); }
	if (U.gr.w > 0.5) { c = vec4f(graded(c), 1.0); }   // 夜の色（窓の印の所は掛けない）
	if (U.b.y > 0.0) { c = vec4f(c.rgb + textureSample(bloom, smp, uv).rgb * U.b.y, c.a); }
	if (U.tm.z > 0.5) { c = vec4f(tonemap(c.rgb), c.a); }
	if (U.lut.z > 0.5) { c = vec4f(mix(c.rgb, lut3(c.rgb), U.lut.y), c.a); }
	if (U.vig.w > 0.5) { let d = length(uv - 0.5) * 1.41421356; c = vec4f(c.rgb * (1.0 - U.vig.x * smoothstep(U.vig.y - U.vig.z, U.vig.y, d)), c.a); }
	return c;
}`;function Vm(s,p,_,A=!1){const D=GPUShaderStage.FRAGMENT,C=s.createBindGroupLayout({entries:[{binding:0,visibility:D,buffer:{}},{binding:1,visibility:D,texture:{}},{binding:2,visibility:D,sampler:{}}]}),F=s.createBindGroupLayout({entries:[{binding:0,visibility:D,buffer:{}},{binding:1,visibility:D,texture:{}},{binding:2,visibility:D,sampler:{}},{binding:3,visibility:D,texture:{}},{binding:4,visibility:D,texture:{}}]}),le=(T,ke,J)=>s.createRenderPipeline({label:"postfx",layout:s.createPipelineLayout({bindGroupLayouts:[ke]}),vertex:{module:s.createShaderModule({code:T}),entryPoint:"vs"},fragment:{module:s.createShaderModule({code:T}),entryPoint:"fs",targets:[{format:J}]},primitive:{topology:"triangle-list"}}),Se=le(km,C,"rgba8unorm"),ee=le(Im,C,"rgba8unorm"),N=le(Nm,F,p),fe=s.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),W=[0,1,2,3].map(()=>s.createBuffer({size:112,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));let H=null;function be(T,ke){if(H&&H.w===T&&H.h===ke)return;l();const J=Math.max(1,Math.ceil(T/2)),pt=Math.max(1,Math.ceil(ke/2)),Xe=s.createTexture({size:[T,ke],format:p,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),gt=[0,1,2].map(()=>s.createTexture({size:[J,pt],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT}));H={w:T,h:ke,hw:J,hh:pt,scratch:Xe,half:gt,sv:Xe.createView(),hv:gt.map(oe=>oe.createView())}}function l(){if(H){H.scratch.destroy();for(const T of H.half)T.destroy();H=null}}const Ee=new Float32Array(28);let Z=[1,1,1,0];function U(T,ke,J,pt,Xe,gt=[0,1,0,0],oe=[1,0,0,0]){Ee.set(ke,0),Ee.set(J,4),Ee.set(pt,8),Ee.set(Xe,12),Ee.set(gt,16),Ee.set(oe,20),Ee.set(Z,24),s.queue.writeBuffer(W[T],0,Ee)}let O=null,L=null;const G=()=>(L??=s.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING}),L.createView());function me(){O&&(O.tex?.destroy(),O=null)}function Ie(T){if(!T){me();return}if(O&&O.url===T.url&&O.size===T.size)return;me();const ke=O={url:T.url,size:T.size,tex:null,view:null,n:0,ready:!1};Pv(T.url,T.size).then(J=>{O===ke&&(ke.tex=s.createTexture({size:[J.size*J.size,J.size],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),s.queue.writeTexture({texture:ke.tex},J.data,{bytesPerRow:J.size*J.size*4},{width:J.size*J.size,height:J.size}),ke.view=ke.tex.createView(),ke.n=J.size,ke.ready=!0,_?.())}).catch(J=>{console.warn("[gpu] post lut load failed:",J?.message||J)})}let ae=null;function Te(T,ke,J,pt,Xe,gt){be(J,pt);const oe=Xe.stages?.length&&gt?Xe.stages:null;oe?ae??=Om(s,p,_,A):ae&&(ae.dispose(),ae=null);const K=!!(oe&&ae.drawable(oe)),We=Xe.bloom,Ze=Xe.vignette,te=Xe.tonemap,M=Xe.grade;Z=M&&M.length>=3?[M[0],M[1],M[2],1]:[1,1,1,0],Ie(Xe.lut);const $=!!(Xe.lut&&O&&O.ready&&O.url===Xe.lut.url),Me=[te?Dm[te.mode]??2:0,te?te.exposure:1,te?1:0,Xe.fxaa?1:0],we=[$?O.n:1,$?Xe.lut.intensity:0,$?1:0,0];T.copyTextureToTexture({texture:ke},{texture:H.scratch},{width:J,height:pt});const Be=We?[We.threshold,We.strength,We.radius,0]:[1,0,1,0],Je=Ze?[Ze.strength,Ze.radius,Ze.softness,1]:[0,1,.5,0],Y=[J,pt,1/J,1/pt],w=(E,Oe,Ue)=>{const se=T.beginRenderPass({colorAttachments:[{view:Oe,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});se.setPipeline(E),se.setBindGroup(0,Ue),se.draw(3),se.end()},R=(E,Oe)=>s.createBindGroup({layout:C,entries:[{binding:0,resource:{buffer:W[E]}},{binding:1,resource:Oe},{binding:2,resource:fe}]});We&&(U(0,Be,Je,Y,[0,0,0,0]),w(Se,H.hv[0],R(0,H.sv)),U(1,Be,Je,Y,[We.radius,0,0,0]),w(ee,H.hv[1],R(1,H.hv[0])),U(2,Be,Je,Y,[0,We.radius,0,0]),w(ee,H.hv[2],R(2,H.hv[1]))),U(3,Be,Je,Y,[0,0,0,0],Me,we);const ge=s.createBindGroup({layout:F,entries:[{binding:0,resource:{buffer:W[3]}},{binding:1,resource:H.sv},{binding:2,resource:fe},{binding:3,resource:We?H.hv[2]:H.sv},{binding:4,resource:$?O.view:G()}]});return w(N,K?ae.target(J,pt):ke.createView(),ge),K?ae.encode(T,oe,ke.createView(),J,pt,gt):T}function Ye(){l(),me(),L?.destroy(),L=null;for(const T of W)T.destroy();ae?.dispose(),ae=null}return{encode:Te,dispose:Ye,bytes:()=>(H?H.w*H.h*4+H.hw*H.hh*4*3:0)+(ae?ae.bytes():0)+(O?.ready?O.n*O.n*O.n*4:0)}}const Wm=new Float32Array([0,-1,0,1,1,-1,1,-1,0,1,1,1]),qm=new Float32Array([0,-1,0,1,1,-1,1,1]),pd=new Uint16Array([0,1,2,2,1,3]),Et=768,Hm=148,qn={base:0,main:1,terrain:2,bld:3,terrainFar:4,user:5,terrainNear:6,terrainFine:7},St=256,Ga=192,gd=3,He={normal:0,water:1,seaFb:2,terrain:3,bld:4,contour:5,mesh:6,fadeNormal:7,fadeWater:8,fadeSeaFb:9,fadeBld:10,user:11},sf=12,vd=180,af=99,Xm=254.5/255,Ut=1280,Ei=512,cf=16384,lo=4,dl=96,md=(()=>{const s=[],p=Math.PI*(3-Math.sqrt(5));for(let _=0;_<dl;_++){const A=1-2*(_+.5)/dl,D=Math.sqrt(1-A*A),C=p*_;s.push([D*Math.cos(C),D*Math.sin(C),A])}return s})();function $m(s,p,{k:_=4,sunI:A=20,fill:D=.35}={}){const C=1+.0157*_,F=[36.9/_,86/_,210.9/_],le=133.8/_,Se=147.2/_,ee=.76,N=8,fe=3,W=(te,M)=>te[0]*M[0]+te[1]*M[1]+te[2]*M[2],H=(te,M,$)=>[te[0]+M[0]*$,te[1]+M[1]*$,te[2]+M[2]*$],be=te=>Math.hypot(te[0],te[1],te[2]),l=(te,M,$)=>{const Me=W(te,M),we=W(te,te)-$*$,Be=Me*Me-we;if(Be<0)return[-1,-1];const Je=Math.sqrt(Be);return[-Me-Je,-Me+Je]},Ee=te=>{const M=Math.max(be(te)-1,0)/_;return[Math.exp(-M/.001256),Math.exp(-M/188e-6)]},Z=(te,M)=>{const $=W(te,M);if($<0&&W(te,te)-$*$<1)return[1e9,1e9];const Me=l(te,M,C),we=Math.max(Me[1],0)/fe;let Be=0,Je=0;for(let Y=0;Y<fe;Y++){const w=Ee(H(te,M,we*(Y+.5)));Be+=w[0]*we,Je+=w[1]*we}return[Be,Je]},U=(te,M,$,Me,we)=>{const Be=W(M,we),Je=3/(16*Math.PI)*(1+Be*Be),Y=ee*ee,w=3/(8*Math.PI)*(1-Y)*(1+Be*Be)/((2+Y)*Math.pow(1+Y-2*ee*Be,1.5)),R=(Me-$)/N;let ge=0,E=0;const Oe=[0,0,0],Ue=[0,0,0];for(let se=0;se<N;se++){const ot=H(te,M,$+R*(se+.5)),st=Ee(ot);ge+=st[0]*R,E+=st[1]*R;const qe=Z(ot,we),Ot=ge+qe[0],Ft=E+qe[1];for(let qt=0;qt<3;qt++){const Tr=Math.exp(-(F[qt]*Ot+Se*Ft));Oe[qt]+=Tr*st[0]*R,Ue[qt]+=Tr*st[1]*R}}return[0,1,2].map(se=>(Oe[se]*F[se]*Je+Ue[se]*le*w)*A)},O=[p[0],p[1],p[2]],L=be(O);for(let te=0;te<3;te++)O[te]/=L;const G=[O[2],0,-O[0]],me=be(G),Ie=me>1e-6?G.map(te=>te/me):[1,0,0],ae=[O[1]*Ie[2]-O[2]*Ie[1],O[2]*Ie[0]-O[0]*Ie[2],O[0]*Ie[1]-O[1]*Ie[0]],Te=O.map(te=>te*(1+1e-6)),Ye=W(O,s),tt=Z(Te,s),ke=[0,1,2].map(te=>Math.exp(-(F[te]*tt[0]+Se*tt[1]))).map(te=>A*te),J=new Array(dl),pt=4*Math.PI/dl;let Xe=[0,0,0];for(let te=0;te<dl;te++){const M=md[te];if(M[2]<=0){J[te]=null;continue}const $=[0,1,2].map(we=>Ie[we]*M[0]+ae[we]*M[1]+O[we]*M[2]),Me=l(Te,$,C);J[te]=U(Te,$,0,Math.max(Me[1],0),s);for(let we=0;we<3;we++)Xe[we]+=J[te][we]*M[2]*pt}const gt=[0,1,2].map(te=>.3/Math.PI*(ke[te]*Math.max(Ye,0)+Xe[te]));for(let te=0;te<dl;te++)J[te]||(J[te]=gt);const oe=te=>{const[M,$,Me]=te;return[.282095,.488603*$,.488603*Me,.488603*M,1.092548*M*$,1.092548*$*Me,.315392*(3*Me*Me-1),1.092548*M*Me,.546274*(M*M-$*$)]},K=[Math.PI,2*Math.PI/3,2*Math.PI/3,2*Math.PI/3,Math.PI/4,Math.PI/4,Math.PI/4,Math.PI/4,Math.PI/4],We=new Float32Array(36);for(let te=0;te<dl;te++){const M=oe(md[te]);for(let $=0;$<9;$++)for(let Me=0;Me<3;Me++)We[$*4+Me]+=J[te][Me]*M[$]*pt}const Ze=Math.max((ke[0]+ke[1]+ke[2])/3*Math.max(Ye,.6)+(Xe[0]+Xe[1]+Xe[2])/3,A*.03);for(let te=0;te<9;te++)for(let M=0;M<3;M++)We[te*4+M]*=K[te]/Ze;return We[3]=D,{sh:We,lp:Float32Array.of(ke[0]/Ze,ke[1]/Ze,ke[2]/Ze,0),Eref:Ze}}async function Ym(s,p={}){if(Kg(p.meshLod||1),Qg(p.meshRange||0),Zg(p.meshLodZ0||15,p.meshLodZ||1),typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU unavailable");const _=performance.now(),A=Jg(p.powerPreference??ev()),D=e=>navigator.gpu.requestAdapter(e).catch(t=>(console.warn("[gpu] requestAdapter threw:",t?.message||t),null));let C=await D(A);for(let e=1,t=300;!C&&e<(p.adapterTries||2);e++,t*=2)console.warn(`[gpu] requestAdapter returned null = retrying in ${t} ms`),await new Promise(i=>setTimeout(i,t)),C=await D(A);if(!C&&A&&Object.keys(A).length&&(console.warn("[gpu] still no adapter = retrying without powerPreference"),C=await D()),!C)throw new Error("WebGPU adapter unavailable (requestAdapter kept returning null)");const F=performance.now(),le=C.info||{},Se=[le.vendor,le.architecture,le.device,le.description].filter(Boolean).join(" ")||"unknown",ee=!p.noTQ&&!!(C.features&&C.features.has&&C.features.has("timestamp-query")),N=[];ee&&N.push("timestamp-query"),C.features?.has?.("float32-blendable")&&N.push("float32-blendable");const fe=p.depthRZ??!/[?&]depth=log/.test(globalThis.location?.search||""),W=fe&&!!C.features?.has?.("depth32float-stencil8");W&&N.push("depth32float-stencil8"),console.log(`[gpu] depth=${W?"rz":"log"}: ${fe?W?"reversed float depth (near/w, depth32float-stencil8, no frag_depth)":"depth32float-stencil8 not available = log depth":"log depth (?depth=log)"}`);const H=C.limits||{},be={...N.length?{requiredFeatures:N}:{},requiredLimits:{maxTextureDimension2D:H.maxTextureDimension2D||8192,...H.maxStorageBufferBindingSize?{maxStorageBufferBindingSize:H.maxStorageBufferBindingSize}:{},...H.maxBufferSize?{maxBufferSize:H.maxBufferSize}:{},...H.maxSampledTexturesPerShaderStage?{maxSampledTexturesPerShaderStage:H.maxSampledTexturesPerShaderStage}:{},...H.maxSamplersPerShaderStage?{maxSamplersPerShaderStage:H.maxSamplersPerShaderStage}:{}}},l=await C.requestDevice(be).catch(async e=>(console.warn("[gpu] requestDevice with adapter limits failed = retrying with default limits:",e?.message||e),C.requestDevice(N.length?{requiredFeatures:N}:{}))),Ee=performance.now(),Z=s.getContext("webgpu");if(!Z)throw new Error("webgpu context unavailable");const U=navigator.gpu.getPreferredCanvasFormat();Z.configure({device:l,format:U,alphaMode:"opaque",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});let O=!1;const L=e=>{e!==O&&(O=e,Z.configure({device:l,format:U,alphaMode:e?"premultiplied":"opaque",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}))},G=U==="bgra8unorm",me=e=>console.error("[gpu] uncaptured:",e.error?.message||e.error);l.addEventListener?l.addEventListener("uncapturederror",me):"onuncapturederror"in l&&(l.onuncapturederror=me);const Ie=[];let ae=0;const Te=(e,t)=>{const i=`${e}: ${t}`;Ie.push(i),console.error("[gpu] "+i)},Ye=new Set(["terrain","building","mesh","meshTex","meshTexFast","terrainSh","buildingSh","meshSh","meshTexSh","terrainClip","buildingClip","meshClip","meshTexClip","terrainShClip","buildingShClip","meshShClip","meshTexShClip"]),tt=p.fragDepth!==!1,T=(e,t)=>{p.elevCheap===!0&&(e=z1(e)),p.gndFast===!1&&(e=Yu(e)),W?e=Aa(e,t):tt&&Ye.has(t)&&(e=rd(e,t));const i=l.createShaderModule({code:e});return i.getCompilationInfo&&i.getCompilationInfo().then(n=>{for(const o of n.messages||[])o.type==="error"&&Te(`WGSL ${t}`,`${o.lineNum}:${o.linePos} ${o.message}`)}),i};l.pushErrorScope("validation");const ke=16;let J=ee?{qs:l.createQuerySet({type:"timestamp",count:ke}),resolve:l.createBuffer({size:ke*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),staging:Array.from({length:3},()=>({buf:l.createBuffer({size:ke*8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),busy:!1,spans:null,n:0})),idx:0,spans:[],ready:[]}:null;function pt(e){console.warn("[gpu] timestamp-query disabled (unavailable in this environment):",e&&(e.message||e));try{J&&J.qs.destroy&&J.qs.destroy()}catch{}J=null}function Xe(e){if(!J||J.idx+2>ke)return;const t=J.idx;return J.idx+=2,J.spans.push({tag:e,i0:t}),{querySet:J.qs,beginningOfPassWriteIndex:t,endOfPassWriteIndex:t+1}}const gt={color:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}},oe=p.msaa1?1:4,K=!!p.lazyPipes,We=p.meshCull===1?"front":p.meshCull===2?"back":"none",Ze=p.meshLiteFs||0;Ze>0&&console.log(`[gpu] meshlitefs=${Ze}: lite fragment shader while moving (${Ze>=2?"vertex depth":"frag_depth"})`);const te=!!p.meshSort,M={atmosphere:!1,pbr:!1,ao:!1,...p.fx||{}},$=W?"depth32float-stencil8":"depth24plus-stencil8",Me=W?0:1,we=W?"greater-equal":"less-equal",Be={format:U,blend:gt},Je=l.createShaderModule({label:"alphaOne",code:`@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f { let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u)); return vec4f(p * 2.0 - 1.0, 0.0, 1.0); }
@fragment fn fs() -> @location(0) vec4f { return vec4f(0.0, 0.0, 0.0, 1.0); }`}),Y={format:U,blend:{color:{srcFactor:"one",dstFactor:"zero",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}},w=GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,R=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}},{binding:1,visibility:w,texture:{sampleType:"float"}},{binding:2,visibility:w,sampler:{type:"filtering"}},{binding:3,visibility:w,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:5,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:6,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:7,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:8,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:9,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:10,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:11,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:12,visibility:w,texture:{sampleType:"float"}},{binding:13,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"cube"}},{binding:14,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}]}),ge=[{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}],E=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}},...ge]}),Oe=l.createPipelineLayout({bindGroupLayouts:[R,E]}),Ue=l.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:5,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}]}),se=l.createPipelineLayout({bindGroupLayouts:[R,E,Ue]}),ot=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}}]}),st=l.createPipelineLayout({bindGroupLayouts:[R,E,ot]}),qe=l.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]}),Ot={binding:af,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},Ft=l.createBindGroupLayout({entries:[...[0,1,2,3,4,5].map(e=>e===0?{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}:{binding:e,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}),Ot]}),qt=l.createPipelineLayout({bindGroupLayouts:[R,E,ot,Ft]}),Tr=T(Ua,"fill"),nn=T(Jo,"line"),ln=T(Ko(Jo,"LINE_X"),"line"),Ae=T(Bf,"globe"),lr=T(Da,"terrain"),Bn=T(es,"building"),uo=T(E1,"contour"),Fn=T(ts,"mesh"),Rr=Ze>0?T(M1,Ze>=2?"meshLite":"mesh"):null,ml=T(gl,"meshTex"),Gn=p.meshFast!==!1,yr=Gn?p.meshFastCull===0?"none":p.meshFastCull===2?"front":"back":"none",$r=Gn?T(U1,"meshTexFast"):null,is=T(A1,"meshSil"),xl=T(L1,"rasterAtlas"),Tn=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}}]}),po=l.createPipelineLayout({bindGroupLayouts:[Tn,qe]}),ls=T(pf,"atlasFill"),bl=l.createPipelineLayout({bindGroupLayouts:[R,E,Tn]}),Xn=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{}},...[2,3,4,5].map(e=>({binding:e,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}})),{binding:6,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}]}),yl=p.shedFoot!==!1?T(ju,"atlasFoot"):null,_n=[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},{arrayStride:8,attributes:[{shaderLocation:1,offset:0,format:"float32x2"}]}],Tt={format:$,depthWriteEnabled:!1,depthCompare:"always"},Yr={format:$,depthWriteEnabled:!1,depthCompare:we},ci={format:$,depthWriteEnabled:!0,depthCompare:we},hl={...ci,depthBias:W?-4:4,depthBiasSlopeScale:W?-1:1},wl={compare:"always",failOp:"keep",depthFailOp:"keep",passOp:"replace"},Yt={...ci,stencilFront:wl,stencilBack:wl,stencilWriteMask:128},fi={...Yt,depthWriteEnabled:!1},os={compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},Ar={...Tt,stencilFront:os,stencilBack:os,stencilReadMask:128,stencilWriteMask:0},zn=[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"unorm8x4"}]}],on=[{arrayStride:8,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:1,offset:0,format:"float32x2"}]},{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]},{arrayStride:4,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]},{arrayStride:4,stepMode:"instance",attributes:[{shaderLocation:4,offset:0,format:"float32"}]},{arrayStride:12,stepMode:"instance",attributes:[{shaderLocation:5,offset:0,format:"float32x3"}]}],fr=[on[0],on[1],on[2],{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"},{shaderLocation:4,offset:4,format:"float32"}]},on[5],{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:6,offset:0,format:"float32x2"}]},{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:7,offset:0,format:"float32x2"}]},{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:8,offset:0,format:"float32x2"}]}],$n=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:5,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:6,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:7,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:8,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:9,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:10,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:11,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:12,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:13,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]}),Ri=l.createPipelineLayout({bindGroupLayouts:[$n]}),ui=l.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]}),Lr=l.createPipelineLayout({bindGroupLayouts:[R,E,ui]}),Cn=T(C1,"sky"),Ai=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}}]}),Li=l.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{}}]}),Oi=l.createPipelineLayout({bindGroupLayouts:[Ai]}),ss=l.createPipelineLayout({bindGroupLayouts:[Ai,Li]}),as=[{arrayStride:32,stepMode:"instance",attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x4"},{shaderLocation:2,offset:28,format:"float32"}]}],Or=T(Fd,"overlay"),Pl=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}},{binding:1,visibility:w,texture:{sampleType:"float"}},{binding:2,visibility:w,sampler:{type:"filtering"}},{binding:3,visibility:w,texture:{sampleType:"float"}},{binding:12,visibility:w,texture:{sampleType:"float"}}]}),Yn=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}},...ge]}),di=l.createPipelineLayout({bindGroupLayouts:[Pl,Yn]}),go={format:$,depthWriteEnabled:!1,depthCompare:"always",stencilFront:{compare:"always",failOp:"keep",depthFailOp:"keep",passOp:"increment-wrap"},stencilBack:{compare:"always",failOp:"keep",depthFailOp:"keep",passOp:"decrement-wrap"},stencilWriteMask:255},vo={format:$,depthWriteEnabled:!1,depthCompare:"always",stencilFront:{compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"zero"},stencilBack:{compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"zero"},stencilWriteMask:255},cs={format:$,depthWriteEnabled:!1,depthCompare:"always",stencilFront:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilBack:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilWriteMask:0},Ht={format:$,depthWriteEnabled:!1,depthCompare:"always",stencilFront:{compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"zero"},stencilBack:{compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"zero"},stencilWriteMask:255},jt=l.createPipelineLayout({bindGroupLayouts:[Pl,Yn,Ue]}),En=[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"float32"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]}];function mo(e){const t={count:e},i=(n,o,a,u="fs",d=Oe,b="none",c=Be)=>l.createRenderPipeline({label:wt(),layout:d,vertex:{module:n,entryPoint:"vs",buffers:o},fragment:{module:n,entryPoint:u,targets:[c]},primitive:{topology:"triangle-list",cullMode:b},depthStencil:a,multisample:t});return Sn(`main${e}x`,K,{fillOff:()=>i(Tr,zn,Tt),fillTest:()=>i(Tr,zn,Yr),lineOff:()=>i(ln,fr,Tt),lineTest:()=>i(ln,fr,Yr),terrain:()=>i(lr,[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}],hl,"fs",Lr),bld:()=>i(Bn,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"float32"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]}],Yt,"fs",se),mesh:()=>i(Fn,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]}],Yt,"fs",st,"none",Y),meshCull:()=>i(Fn,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]}],Yt,"fs",st,We,Y),meshLite:()=>Rr?i(Rr,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]}],Yt,"fs",st,"front",Y):null,meshTex:()=>i(ml,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]},{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]}],Yt,"fs",qt),meshTexFast:()=>$r?i($r,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]},{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]}],Yt,"fs",st,"none",Y):null,meshTexFastCull:()=>$r?i($r,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]},{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]}],Yt,"fs",st,yr,Y):null,meshTexBlend:()=>i(ml,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]},{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]}],fi,"fs",qt),meshSil:()=>i(is,[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]},{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]}],fi,"fsSil",qt),contour:()=>i(uo,void 0,Tt),alphaOne:()=>l.createRenderPipeline({label:wt(),layout:"auto",vertex:{module:Je,entryPoint:"vs"},fragment:{module:Je,entryPoint:"fs",targets:[{format:U,writeMask:8}]},primitive:{topology:"triangle-list"},depthStencil:Ar,multisample:t}),globe:()=>l.createRenderPipeline({label:wt(),layout:Ri,vertex:{module:Ae,entryPoint:"vs"},fragment:{module:Ae,entryPoint:"fs",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:t}),wdCover:()=>l.createRenderPipeline({label:wt(),layout:Ri,vertex:{module:Ae,entryPoint:"vs"},fragment:{module:Ae,entryPoint:"fsWdepr",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:vo,multisample:t}),grat:()=>l.createRenderPipeline({label:wt(),layout:Ri,vertex:{module:Ae,entryPoint:"vs"},fragment:{module:Ae,entryPoint:"fsGrat",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:t}),stars:()=>l.createRenderPipeline({label:wt(),layout:Oi,vertex:{module:Cn,entryPoint:"vsStar",buffers:as},fragment:{module:Cn,entryPoint:"fsStar",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:t}),starLine:()=>l.createRenderPipeline({label:wt(),layout:ss,vertex:{module:Cn,entryPoint:"vsLine",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:Cn,entryPoint:"fsLine",targets:[Be]},primitive:{topology:"line-list"},depthStencil:Tt,multisample:t}),night:()=>l.createRenderPipeline({label:wt(),layout:Oi,vertex:{module:Cn,entryPoint:"vsNight"},fragment:{module:Cn,entryPoint:"fsNight",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:t}),ovStencil:()=>l.createRenderPipeline({label:wt(),layout:di,vertex:{module:Or,entryPoint:"vsStencil",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:Or,entryPoint:"fsNull",targets:[{format:U,writeMask:0}]},primitive:{topology:"triangle-list"},depthStencil:go,multisample:t}),ovCover:()=>l.createRenderPipeline({label:wt(),layout:di,vertex:{module:Or,entryPoint:"vsCover"},fragment:{module:Or,entryPoint:"fsCover",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:vo,multisample:t}),ovMaskCover:()=>l.createRenderPipeline({label:wt(),layout:di,vertex:{module:Or,entryPoint:"vsCover"},fragment:{module:Or,entryPoint:"fsCover",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:cs,multisample:t}),ovZero:()=>l.createRenderPipeline({label:wt(),layout:di,vertex:{module:Or,entryPoint:"vsCover"},fragment:{module:Or,entryPoint:"fsNull",targets:[{format:U,writeMask:0}]},primitive:{topology:"triangle-list"},depthStencil:Ht,multisample:t}),ovLine:()=>l.createRenderPipeline({label:wt(),layout:di,vertex:{module:nn,entryPoint:"vs",buffers:on},fragment:{module:nn,entryPoint:"fs",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:t}),gbLine:()=>l.createRenderPipeline({label:wt(),layout:jt,vertex:{module:Bn,entryPoint:"vs",buffers:En},fragment:{module:Bn,entryPoint:"fs",targets:[Be]},primitive:{topology:"line-list"},depthStencil:ci,multisample:t}),gbPoint:()=>l.createRenderPipeline({label:wt(),layout:jt,vertex:{module:Bn,entryPoint:"vs",buffers:En},fragment:{module:Bn,entryPoint:"fs",targets:[Be]},primitive:{topology:"point-list"},depthStencil:ci,multisample:t})})}const Sl=new Map,xo=new Map,Xt=e=>{let t=xo.get(e);return t||(t=l.createRenderPipeline({label:"globeDepth",layout:Ri,vertex:{module:Ae,entryPoint:"vs"},fragment:{module:Ae,entryPoint:"fsDepth",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:{format:$,depthWriteEnabled:!0,depthCompare:"always"},multisample:{count:e}}),xo.set(e,t)),t},fs=e=>{let t=Sl.get(e);return t||(t=mo(e),Sl.set(e,t)),t};let nt=fs(oe);const Di=Ze>0?["meshLite"]:[],pi=["globe","fillOff","lineOff","terrain","fillTest","lineTest","bld","mesh","meshTex","meshTexBlend",...Di];if(K&&p.warmPipes){const e=performance.now();if(p.warmPipes>=3){const t=["globe","terrain"];for(const a of t)nt[a];const i=["lineOff","lineTest","fillOff","fillTest","bld","mesh","meshTex","meshTexBlend",...Di],n=p.warmPar??0,o=Tu(nt,l,i,()=>p.requestDraw?.(),n);o.done.then(a=>console.log(`[boot] warm pipes progressive: base ${t.length} sync in ${performance.now()-e|0} ms · ${a.made}/${o.asked} async (par ${n||"all"}) done at +${a.ms|0} ms${a.failed.length?" failed "+a.failed.join(","):""}`))}else if(p.warmPipes>=2){const t=await bd(nt,l,pi);console.log(`[boot] warm pipes async: ${t.made}/${t.asked} in ${t.ms|0} ms${t.failed.length?" failed "+t.failed.join(","):""}`)}else{for(const t of pi)nt[t];console.log(`[boot] warm pipes sync: ${pi.length} in ${performance.now()-e|0} ms`)}}let sn={on:!1};const Dt=new Float32Array([0,1,0,1]),Bl={key:"",env:{sh:new Float32Array(36),lp:new Float32Array([0,0,0,1])}};let et=null;const an=p.lowMem?1024:2048,Fl=p.lowMem?2:3,us=.018,bo=4,jn=.7,pe=[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"float32"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]}],Rt=[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]}],Kn=[...Rt,{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]},{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]}];function cn(){if(et)return et;const e=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth",viewDimension:"2d-array"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}}]}),t=l.createTexture({size:[an,an,Fl],format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),i=t.createView({dimension:"2d-array"}),n=l.createBuffer({size:256,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),o=[];for(let b=0;b<Fl;b++){const c=l.createBuffer({size:Ut*Ei,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});o.push({view:t.createView({dimension:"2d",baseArrayLayer:b,arrayLayerCount:1}),frameB:l.createBuffer({size:Et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),frameT:l.createBuffer({size:Et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),frameN:l.createBuffer({size:Et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),frameF:l.createBuffer({size:Et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),batch:c,batchCPU:new Float32Array(Ut/4*Ei),batchBG:l.createBindGroup({layout:ot,entries:[{binding:0,resource:{buffer:c,offset:0,size:Ut}}]}),bg0:null,bg0T:null})}const a=l.createSampler({compare:"less-equal",magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"});or||={terr:T(gf,"terrainSh"),fill:T(Ca,"fillSh"),line:T(ao,"lineSh"),lineX:T(Ko(ao,"LINE_SH_X"),"lineSh"),bld:T(Ea,"buildingSh"),mesh:T(vf,"meshSh"),meshTex:T(mf,"meshTexSh"),globe:T(xf,"globeSh"),bldCast:T(Ma,"buildingCast"),meshCast:T(bf,"meshCast"),meshTexCast:T(yf,"meshTexCast"),terrCast:T(Ra,"terrainCast")};const u=b=>l.createPipelineLayout({bindGroupLayouts:b}),d=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}},{binding:1,visibility:w,buffer:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth",viewDimension:"2d-array"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}}]});return et={bgl:e,tex:t,view:i,pBuf:n,samp:a,L:o,bg:l.createBindGroup({layout:e,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:i},{binding:2,resource:a}]}),bglPlSh:d,plShBG:l.createBindGroup({layout:d,entries:[{binding:0,resource:{buffer:bi,offset:0,size:Ut}},{binding:1,resource:{buffer:n}},{binding:2,resource:i},{binding:3,resource:a}]}),lay:{terr:u([R,E,ui,e]),fill:u([R,E,e]),bld:u([R,E,Ue,e]),mesh:u([R,E,ot,e]),meshTex:u([R,E,d,Ft]),globe:u([$n,e])},cast:Dr(),pipes:new Map,cpu:new Float32Array(64)},et}let Gl=null;function Dr(){if(Gl)return Gl;const e=or||(or={terr:T(gf,"terrainSh"),fill:T(Ca,"fillSh"),line:T(ao,"lineSh"),lineX:T(Ko(ao,"LINE_SH_X"),"lineSh"),bld:T(Ea,"buildingSh"),mesh:T(vf,"meshSh"),meshTex:T(mf,"meshTexSh"),globe:T(xf,"globeSh"),bldCast:T(Ma,"buildingCast"),meshCast:T(bf,"meshCast"),meshTexCast:T(yf,"meshTexCast"),terrCast:T(Ra,"terrainCast")}),t={format:"depth32float",depthWriteEnabled:!0,depthCompare:"less",depthBiasSlopeScale:3};return Gl=Sn("cast",K,{bld:()=>l.createRenderPipeline({label:wt(),layout:se,vertex:{module:e.bldCast,entryPoint:"vs",buffers:pe},fragment:{module:e.bldCast,entryPoint:"fs",targets:[]},primitive:{topology:"triangle-list"},depthStencil:t}),mesh:()=>l.createRenderPipeline({label:wt(),layout:st,vertex:{module:e.meshCast,entryPoint:"vs",buffers:Rt},primitive:{topology:"triangle-list"},depthStencil:t}),meshTex:()=>l.createRenderPipeline({label:wt(),layout:qt,vertex:{module:e.meshTexCast,entryPoint:"vs",buffers:Kn},fragment:{module:e.meshTexCast,entryPoint:"fsCast",targets:[]},primitive:{topology:"triangle-list"},depthStencil:t}),terr:()=>l.createRenderPipeline({label:wt(),layout:l.createPipelineLayout({bindGroupLayouts:[R]}),vertex:{module:e.terrCast,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},primitive:{topology:"triangle-list"},depthStencil:t}),terrNF:()=>{const i=e.terrCastNF??=T(k1,"terrainCastNF");return l.createRenderPipeline({label:wt(),layout:l.createPipelineLayout({bindGroupLayouts:[R]}),vertex:{module:i,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:i,entryPoint:"fsCast",targets:[]},primitive:{topology:"triangle-list"},depthStencil:t})}})}let or=null,_r=0;const Nt={passes:0,skipped:0,active:!1,last:null};function ki(){if(et){et.tex.destroy(),et.pBuf.destroy();for(const e of et.L)e.frameB.destroy(),e.frameT.destroy(),e.frameN?.destroy(),e.frameF?.destroy(),e.batch.destroy();et=null}}function ds(e){let t=et.pipes.get(e);if(t)return t;const i={count:e},n=or,o=et.lay,a=(u,d,b,c,B=Be,k="none")=>l.createRenderPipeline({label:wt(),layout:c,vertex:{module:u,entryPoint:"vs",buffers:d},fragment:{module:u,entryPoint:"fs",targets:[B]},primitive:{topology:"triangle-list",cullMode:k},depthStencil:b,multisample:i});return t=Sn(`shadow${e}x`,K,{fillOff:()=>a(n.fill,zn,Tt,o.fill),fillTest:()=>a(n.fill,zn,Yr,o.fill),lineOff:()=>a(n.lineX,fr,Tt,o.fill),lineTest:()=>a(n.lineX,fr,Yr,o.fill),terrain:()=>a(n.terr,[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}],hl,o.terr),bld:()=>a(n.bld,pe,Yt,o.bld),mesh:()=>a(n.mesh,Rt,Yt,o.mesh,Y),meshCull:()=>a(n.mesh,Rt,Yt,o.mesh,Y,We),meshTex:()=>a(n.meshTex,Kn,Yt,o.meshTex),meshTexBlend:()=>a(n.meshTex,Kn,fi,o.meshTex),globe:()=>l.createRenderPipeline({label:wt(),layout:o.globe,vertex:{module:n.globe,entryPoint:"vs"},fragment:{module:n.globe,entryPoint:"fs",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:i})}),et.pipes.set(e,t),t}function Ii(e,t="bg0"){const i=Ve.has&&ri?ri:Pt,n=kt.has&&Zi?Zi:Pt,o=ql||Pt,a=Qt.has&&Ji?Ji:Pt,u=e[t+"K"];return e[t]&&u&&u.v===i&&u.fv===n&&u.cv===o&&u.nv===a&&u.ev===ji?e[t]:(e[t+"K"]={v:i,fv:n,cv:o,nv:a,ev:ji},e[t]=l.createBindGroup({layout:R,entries:[{binding:0,resource:{buffer:t==="bg0T"?e.frameT:t==="bg0N"?e.frameN:t==="bg0F"?e.frameF:e.frameB,offset:0,size:Et}},{binding:1,resource:i},{binding:2,resource:Yi},{binding:3,resource:n},{binding:4,resource:o},{binding:5,resource:{buffer:Ki}},{binding:6,resource:Pt},{binding:7,resource:Pt},{binding:8,resource:Pt},{binding:9,resource:{buffer:Hl}},{binding:10,resource:Os},{binding:11,resource:Pt},{binding:12,resource:a},{binding:13,resource:ji},{binding:14,resource:ec}]}))}const gi=p.lowMem?1024:2048;let hr=!1,yo=null;function vi(){if(yo)return yo;const e=GPUShaderStage.COMPUTE,t=l.createBindGroupLayout({entries:[{binding:0,visibility:e,buffer:{}},{binding:1,visibility:e,texture:{sampleType:"depth",viewDimension:"2d"}},{binding:2,visibility:e,buffer:{type:"read-only-storage"}},{binding:3,visibility:e,buffer:{type:"storage"}}]}),i=l.createBindGroupLayout({entries:[{binding:0,visibility:e,buffer:{}},{binding:1,visibility:e,buffer:{type:"read-only-storage"}},{binding:2,visibility:e,buffer:{type:"storage"}}]}),n=(o,a,u)=>l.createComputePipeline({layout:l.createPipelineLayout({bindGroupLayouts:[u]}),compute:{module:T(o,a),entryPoint:"main"}});return yo={count:n(am,"anSunCount",t),surf:n(cm,"anSurface",t),march:n(fm,"anMarch",i),bglA:t,bglM:i}}function ps(){const e=l.createTexture({size:[gi,gi,1],format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),t=l.createBuffer({size:Ut*Ei,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return{tex:e,view:e.createView({dimension:"2d"}),frameB:l.createBuffer({size:Et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),frameT:l.createBuffer({size:Et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),batch:t,batchCPU:new Float32Array(Ut/4*Ei),batchBG:l.createBindGroup({layout:ot,entries:[{binding:0,resource:{buffer:t,offset:0,size:Ut}}]}),bg0:null,bg0T:null}}function ho(e){e.tex.destroy(),e.frameB.destroy(),e.frameT.destroy(),e.batch.destroy()}function gs(e,t,i,n){const o=Il,a=Le.main.origin||[0,0],u=ir(i[0],i[1]),d=[u[0]*1.001,u[1]*1.001,u[2]*1.001],b={mvp:t.mvp,invMvp:o.invMvp,eye:d,rays:o.rays};l.queue.writeBuffer(e.frameB,0,gr(b,a,10,10,[0,0,0],1,1)),n&&l.queue.writeBuffer(e.frameT,0,gr(b,[i[0],i[1]],10,10,[0,0,0],1,1,vt.mesh)),e.castKey=void 0;const c=l.createCommandEncoder();hr=!0;let B=null;try{B=Rc(c,t,e,{...r0,center:[i[0],i[1]]},null,n,null)}finally{hr=!1}return l.queue.submit([c.finish()]),B||{bldTris:0,meshBatches:0,meshTris:0,terrTris:0}}function wo(e){const t={e:ti,q:Qr,g:rl},i=!!(vt&&Ve.has);ti=i?Ve.scale:0,Qr=i?vt.mesh:null,rl=i?vt.G:0;try{return e(i)}finally{ti=t.e,Qr=t.q,rl=t.g}}function kr(e){const t=ir(e[0],e[1]),i=Zo()?hd(e[0],e[1]):t,n=Math.hypot(i[0],i[1],i[2])||1;return[i[0]/n,i[1]/n,i[2]/n]}function jr(e,t,i){const n=l.createBuffer({size:Math.max(16,Math.ceil(e/16)*16),usage:t});return i&&l.queue.writeBuffer(n,0,i.buffer,i.byteOffset,i.byteLength),n}async function Tl(e){const t=l.createCommandEncoder(),i=e.map(o=>{const a=l.createBuffer({size:o.size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});return t.copyBufferToBuffer(o,0,a,0,o.size),a});l.queue.submit([t.finish()]),await new Promise(o=>setTimeout(o,0)),await Promise.all(i.map(o=>o.mapAsync(GPUMapMode.READ)));const n=i.map(o=>o.getMappedRange().slice(0));for(const o of i)o.unmap(),o.destroy();return n}const Kt=new Float32Array(24);function Qn(e,t,i){Kt.set(e.mvp,0);const n=so(e.mvp,[t[0],t[1],t[2],1]);return Kt[16]=n[0],Kt[17]=n[1],Kt[18]=n[2],Kt[19]=n[3],Kt[20]=i[0],Kt[21]=i[1],Kt[22]=i[2],Kt[23]=i[3],Kt}const Ni=e=>[(e[0]+e[2])/2,(e[1]+e[3])/2],vs=(e,t)=>{let i=0,n=0;if(e)for(let o=0;o<e.length;o++){const a=e[o]||0;a<i&&(i=a),a>n&&(n=a)}return[i*t,n*t]},Na={async sunHours({bbox:e,W:t,H:i,ground:n,planeH:o,suns:a}){if(!Il)throw new Error("analysis: draw first");rr&&la();const u=t*i,d=Ni(e),b=ir(d[0],d[1]),c=kr(d),B=vi(),k=ps(),X=Ve.has&&Ve.exag||1,j=jr(u*16,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,id(e,t,i,n,Ve.has?Ve.scale:0,o,b)),Ge=jr(u*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST),$e=jr(96,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),q=l.createBindGroup({layout:B.bglA,entries:[{binding:0,resource:{buffer:$e}},{binding:1,resource:k.view},{binding:2,resource:{buffer:j}},{binding:3,resource:{buffer:Ge}}]}),[ue,Fe]=vs(n,Ve.has?X:0),de=ld(e,ue+o,Fe+o);let I=0,ce=0,Pe=0;wo(Re=>{for(const lt of a){const ct=Ru(lt,de,gi,Jc,c);if(!ct)continue;const Ke=gs(k,ct,d,Re);ce=Ke.bldTris+Ke.meshTris+Ke.terrTris,Pe=ct.texelM,I++,l.queue.writeBuffer($e,0,Qn(ct,b,[Iu(ct),u,0,0]));const Qe=l.createCommandEncoder(),ht=Qe.beginComputePass();ht.setPipeline(B.count),ht.setBindGroup(0,q),ht.dispatchWorkgroups(Math.ceil(u/64)),ht.end(),l.queue.submit([Qe.finish()])}});const[mt]=await Tl([Ge]);return j.destroy(),Ge.destroy(),$e.destroy(),ho(k),{cnt:new Uint32Array(mt,0,u),used:I,tris:ce,texelM:Pe,exag:X}},async surface(e){const t=await Po(e,null);return{S:t.S,tris:t.tris}},async viewshed(e){const t=await Po(e,e);return{vis:t.vis,S:t.S,tris:t.tris}}};async function Po({bbox:e,N:t,ground:i},n){if(!Il)throw new Error("analysis: draw first");rr&&la();const o=t*t,a=Ni(e),u=ir(a[0],a[1]),d=kr(a),b=vi(),c=ps(),B=Ve.has&&Ve.exag||1,k=jr(o*16,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,id(e,t,t,Ve.has?i:null,0,0,u)),X=jr(o*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC),j=jr(96,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),Ge=l.createBindGroup({layout:b.bglA,entries:[{binding:0,resource:{buffer:j}},{binding:1,resource:c.view},{binding:2,resource:{buffer:k}},{binding:3,resource:{buffer:X}}]}),[$e,q]=vs(i,Ve.has?B:0),ue=Ru(d,ld(e,Math.min(0,$e),Math.max(0,q)),gi,Jc,d),Fe=wo(lt=>gs(c,ue,a,lt)),de=Fe.bldTris+Fe.meshTris+Fe.terrTris;l.queue.writeBuffer(j,0,Qn(ue,u,[ue.zRangeM,o,1/B,0]));const I=l.createCommandEncoder(),ce=I.beginComputePass();ce.setPipeline(b.surf),ce.setBindGroup(0,Ge),ce.dispatchWorkgroups(Math.ceil(o/64)),ce.end();let Pe=null,mt=null;if(n){Pe=jr(o*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC),mt=jr(48,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,new Float32Array([t,n.ox,n.oy,n.rCells,n.cellX,n.cellY,n.dropK,n.eyeH,n.targetH,0,0,0]));const lt=l.createBindGroup({layout:b.bglM,entries:[{binding:0,resource:{buffer:mt}},{binding:1,resource:{buffer:X}},{binding:2,resource:{buffer:Pe}}]}),ct=I.beginComputePass();ct.setPipeline(b.march),ct.setBindGroup(0,lt),ct.dispatchWorkgroups(Math.ceil(4*t/64)),ct.end()}l.queue.submit([I.finish()]);const Re=await Tl(Pe?[X,Pe]:[X]);return k.destroy(),X.destroy(),j.destroy(),Pe?.destroy(),mt?.destroy(),ho(c),{S:new Float32Array(Re[0],0,o),vis:Pe?new Uint32Array(Re[1],0,o):null,tris:de}}const mi=["terrain","buildings","models","main","base","user","globe"],zr=1280,xi=Object.fromEntries(mi.map((e,t)=>[e,t])),_l=512;let ur=null,xe=null,fn=null,Zn=null,zl=oe;function ms(){if(xe)return xe;const e=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}}]}),t=l.createBuffer({size:zr*mi.length,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=l.createBuffer({size:_l*2,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});fn??={terr:T(V1,"terrainClip"),mesh:T(W1,"meshClip"),meshTex:T(q1,"meshTexClip"),fill:T(Qu,"fillClip"),line:T(nf,"lineClip"),lineX:T(Ko(nf,"LINE_CLIP_X"),"lineClip"),bld:T(Zu,"buildingClip"),globe:T(H1,"globeClip"),cap:T(em,"clipCap")};const n=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}},{binding:1,visibility:w,buffer:{}}]}),o=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth",viewDimension:"2d-array"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}},{binding:3,visibility:w,buffer:{}}]}),a=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}},{binding:1,visibility:w,buffer:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth",viewDimension:"2d-array"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}},{binding:4,visibility:w,buffer:{}}]}),u=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{}},{binding:1,visibility:w,buffer:{}}]}),d=k=>l.createPipelineLayout({bindGroupLayouts:k}),b=k=>({buffer:t,offset:k*zr,size:xa*4}),c=l.createBindGroupLayout({entries:[{binding:0,visibility:w,buffer:{hasDynamicOffset:!0}}]}),B=l.createBuffer({size:zr*Al,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return xe={bgl:e,buf:t,capBuf:i,bglShCl:o,bglPlShCl:a,bglPlCl:n,slotRes:b,ovBuf:B,ovCPU:new Float32Array(zr/4*Al),pipesOv:new Map,ovBG:l.createBindGroup({layout:c,entries:[{binding:0,resource:{buffer:B,offset:0,size:xa*4}}]}),layOv:d([Pl,Yn,c]),bg:Object.fromEntries(mi.map((k,X)=>[k,l.createBindGroup({layout:e,entries:[{binding:0,resource:b(X)}]})])),plBG:l.createBindGroup({layout:n,entries:[{binding:0,resource:{buffer:bi,offset:0,size:Ut}},{binding:1,resource:b(xi.models)}]}),capBG:[0,1].map(k=>l.createBindGroup({layout:u,entries:[{binding:0,resource:b(xi.terrain)},{binding:1,resource:{buffer:i,offset:k*_l,size:320}}]})),lay:{terr:d([R,E,ui,e]),mesh:d([R,E,ot,e]),meshTex:d([R,E,n,Ft]),fill:d([R,E,e]),bld:d([R,E,Ue,e]),globe:d([$n,e]),cap:d([R,u])},laySh:{terr:d([R,E,ui,o]),mesh:d([R,E,ot,o]),meshTex:d([R,E,a,Ft]),fill:d([R,E,o]),bld:d([R,E,Ue,o]),globe:d([$n,o])},layCast:{terr:d([R,e]),bld:d([R,E,Ue,e]),mesh:d([R,E,ot,e]),meshTex:d([R,E,n,Ft])},pipes:new Map,pipesSh:new Map,cast:null,shx:null,cpu:new Float32Array(zr/4*mi.length),capCPU:new Float32Array(_l/4*2)},xe}function xs(){xe&&(xe.buf.destroy(),xe.capBuf.destroy(),xe.ovBuf.destroy(),xe=null)}function Cl(e){let t=xe.pipesOv.get(e);if(t)return t;const i={count:e},n=fn.ov??=T(J1,"overlayClip"),o=a=>l.createRenderPipeline({label:wt(),layout:xe.layOv,vertex:{module:n,entryPoint:"vsCover"},fragment:{module:n,entryPoint:"fsCover",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:a,multisample:i});return t=Sn(`clipOv${e}x`,K,{ovCover:()=>o(vo),ovMaskCover:()=>o(cs),ovLine:()=>l.createRenderPipeline({label:wt(),layout:xe.layOv,vertex:{module:fn.line,entryPoint:"vs",buffers:on},fragment:{module:fn.line,entryPoint:"fs",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:i})}),xe.pipesOv.set(e,t),t}function bs(e,t,i,n){const o={count:e},a=(u,d,b,c,B=Be,k="none")=>l.createRenderPipeline({label:wt(),layout:c,vertex:{module:u,entryPoint:"vs",buffers:d},fragment:{module:u,entryPoint:"fs",targets:[B]},primitive:{topology:"triangle-list",cullMode:k},depthStencil:b,multisample:o});return Sn(`${n}${e}x`,K,{terrain:()=>a(t.terr,[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}],hl,i.terr),mesh:()=>a(t.mesh,Rt,Yt,i.mesh,Y),meshCull:()=>a(t.mesh,Rt,Yt,i.mesh,Y,We),meshTex:()=>a(t.meshTex,Kn,Yt,i.meshTex),meshTexBlend:()=>a(t.meshTex,Kn,fi,i.meshTex),fillOff:()=>a(t.fill,zn,Tt,i.fill),fillTest:()=>a(t.fill,zn,Yr,i.fill),lineOff:()=>a(t.lineX,fr,Tt,i.fill),lineTest:()=>a(t.lineX,fr,Yr,i.fill),bld:()=>a(t.bld,pe,Yt,i.bld),globe:()=>l.createRenderPipeline({label:wt(),layout:i.globe,vertex:{module:t.globe,entryPoint:"vs"},fragment:{module:t.globe,entryPoint:"fs",targets:[Be]},primitive:{topology:"triangle-list"},depthStencil:Tt,multisample:o}),cap:()=>t.cap?l.createRenderPipeline({label:wt(),layout:i.cap,vertex:{module:t.cap,entryPoint:"vs"},fragment:{module:t.cap,entryPoint:"fs",targets:[Be]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:ci,multisample:o}):null})}function ys(e){let t=xe.pipes.get(e);return t||(t=bs(e,fn,xe.lay,"clip"),xe.pipes.set(e,t)),t}function Va(e){let t=xe.pipesSh.get(e);return t||(fn.sh??={terr:T(X1,"terrainShClip"),mesh:T($1,"meshShClip"),meshTex:T(Y1,"meshTexShClip"),fill:T(Ju,"fillShClip"),line:T(lf,"lineShClip"),lineX:T(Ko(lf,"LINE_SH_CLIP_X"),"lineShClip"),bld:T(ed,"buildingShClip"),globe:T(j1,"globeShClip")},t=bs(e,fn.sh,xe.laySh,"clipSh"),xe.pipesSh.set(e,t),t)}function hs(){if(xe.shx&&xe.shx.sh===et)return xe.shx;const e=[{binding:0,resource:{buffer:et.pBuf}},{binding:1,resource:et.view},{binding:2,resource:et.samp}];return xe.shx={sh:et,bg:Object.fromEntries(mi.map((t,i)=>[t,l.createBindGroup({layout:xe.bglShCl,entries:[...e,{binding:3,resource:xe.slotRes(i)}]})])),plBG:l.createBindGroup({layout:xe.bglPlShCl,entries:[{binding:0,resource:{buffer:bi,offset:0,size:Ut}},{binding:1,resource:{buffer:et.pBuf}},{binding:2,resource:et.view},{binding:3,resource:et.samp},{binding:4,resource:xe.slotRes(xi.models)}]}),castPlBG:et.L.map(t=>l.createBindGroup({layout:xe.bglPlCl,entries:[{binding:0,resource:{buffer:t.batch,offset:0,size:Ut}},{binding:1,resource:xe.slotRes(xi.models)}]}))},xe.shx}function Wa(){if(xe.cast)return xe.cast;const e=fn.cast??={terr:T(K1,"terrainCastClip"),mesh:T(Q1,"meshCastClip"),meshTex:T(Z1,"meshTexCastClip"),bld:T(td,"buildingCastClip")},t=xe.layCast,i={format:"depth32float",depthWriteEnabled:!0,depthCompare:"less",depthBiasSlopeScale:3},n=(o,a,u,d)=>l.createRenderPipeline({label:wt(),layout:d,vertex:{module:o,entryPoint:"vs",buffers:a},fragment:{module:o,entryPoint:u,targets:[]},primitive:{topology:"triangle-list"},depthStencil:i});return xe.cast=Sn("clipCast",K,{terr:()=>n(e.terr,[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}],"fsClip",t.terr),bld:()=>n(e.bld,pe,"fs",t.bld),mesh:()=>n(e.mesh,Rt,"fsClip",t.mesh),meshTex:()=>n(e.meshTex,Kn,"fsCast",t.meshTex)}),xe.cast}function un(e,t,i,n,o,a,u){const d=xe.capCPU,b=e*_l/4,c=vt.G-1;d.fill(0,b,b+80),d[b]=(n[0]-o[0])/o[2]*c,d[b+1]=(n[1]-o[1])/o[3]*c,d[b+2]=c/o[2],d[b+3]=c/o[3],d[b+4]=c,d[b+5]=u?1:0,l1(d,b+8,t,i,o,a)}const r=l.createBuffer({size:Et*8,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),f=l.createBuffer({size:St*sf,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=l.createBuffer({size:512,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),P=l.createBuffer({size:160,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let h=null;const ne=l.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}).createView(),x=l.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),_e=e=>[{binding:1,resource:e},{binding:2,resource:x}],ye=[];for(let e=0;e<sf;e++)ye.push(l.createBindGroup({layout:E,entries:[{binding:0,resource:{buffer:f,offset:e*St,size:Ga}},..._e(ne)]}));const Ne=St/4;let _t=l.createBuffer({size:St*64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Ce=64,je=new Float32Array(Ne*64);const Lt=new Map;let $t=0,At=!1;const er=new Map,at={zoom:0,bearing:0,dpr:1,cosLat:1};function Ir(e){Lt.clear(),$t=0,at.zoom=e.zoom||0,at.bearing=e.bearing||0,at.dpr=e.dpr||1,at.cosLat=Math.cos((e.center?.[1]||0)*Math.PI/180),At&&(At=!1,_t.destroy(),er.clear(),Ce*=2,_t=l.createBuffer({size:St*Ce,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),je=new Float32Array(Ne*Ce))}function he(e,t,i,n,o){const a=e+"|"+t;let u=Lt.get(a);if(u===void 0){if($t>=Ce)return At=!0,null;u=$t++,Lt.set(a,u);const c=u*Ne;je.fill(0,c,c+Ne),je.set(Uc.subarray(e*Ne,e*Ne+12),c),o(c+12),l.queue.writeBuffer(_t,u*St,je.buffer,u*St,St)}const d=u+"|"+i;let b=er.get(d);return b||(b=l.createBindGroup({layout:E,entries:[{binding:0,resource:{buffer:_t,offset:u*St,size:Ga}},..._e(n)]}),er.set(d,b)),b}function Jn(e,t,i){const n=je;if(t&&(t[0]||t[1])){const o=t[2]?at.bearing:0,a=Math.cos(o),u=Math.sin(o);n[e]=t[0]*a-t[1]*u,n[e+1]=t[0]*u+t[1]*a,n[e+2]=360/(256*2**at.zoom),n[e+3]=0}i&&t&&(n[e+4]=t[4]?t[3]:t[3]*at.dpr,n[e+5]=t[4])}const xt=!!p.noLx,zt=(e,t)=>!xt&&(e&&(e[0]||e[1])||t)?`f|${e?e.join(","):""}|${t||""}`:null,Mn=(e,t,i,n)=>!xt&&(e||t||i&&(i[0]||i[1]||i[3])||n)?`l|${e}|${t?t.join(","):""}|${i?i.join(","):""}|${n?n.key:""}`:null,mr=new Map;function So(e){if(!e?.name)return;const t=mr.get(e.name);t?.tex&&t.tex.destroy();for(const i of[...er.keys()])i.endsWith("|"+e.name)&&er.delete(i);e.bitmap?mr.set(e.name,{bm:e.bitmap,pr:e.pixelRatio||1,view:null,tex:null}):mr.delete(e.name)}function dn(e){const t=mr.get(e);if(!t)return null;if(!t.view)try{t.tex=l.createTexture({size:[t.bm.width,t.bm.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),l.queue.copyExternalImageToTexture({source:t.bm},{texture:t.tex},[t.bm.width,t.bm.height]),t.view=t.tex.createView()}catch{return t.tex?.destroy(),mr.delete(e),null}return t}const Un=new WeakMap;let pn=new Map;const Vi=e=>u1(Un,e,at.zoom,re.dashDz??1),El=(e,t)=>(e?`|pz${e.c?e.c.join(","):""}:${e.hw??""}:${e.hwF}:${e.off??""}`:"")+(t?`|pt${t}`:"");function ws(e,t,i){const n=je;t&&(n[e+24]=t.c?1:0,n[e+25]=t.hw!=null?1:0,n[e+26]=t.hw??0,n[e+27]=t.hwF,t.c&&(n[e+28]=t.c[0],n[e+29]=t.c[1],n[e+30]=t.c[2],n[e+31]=t.c[3]),n[e+32]=t.off!=null?1:0,n[e+33]=t.off??0),n[e+34]=i}function Mf(e,t,i,n,o,a=null,u=0){let d;if(n&&(d=dn(n)??void 0,!d))return null;const b=n?`${t}|${o[0]},${o[1]}`:t;return he(e,b,n||"",d?d.view:ne,c=>{if(Jn(c,i,!1),ws(c,a,u),!d)return;const B=re.dashDz??1,k=Math.floor(at.zoom-B)+B,X=256*2**k,j=d.bm.width/d.pr,Ge=d.bm.height/d.pr,$e=(o[0]+180)/360*X,q=Math.sin(o[1]*Math.PI/180),ue=(.5-Math.log((1+q)/(1-q))/(4*Math.PI))*X;je[c+7]=X/360,je[c+20]=$e-j*Math.floor($e/j),je[c+21]=ue-Ge*Math.floor(ue/Ge),je[c+22]=1/j,je[c+23]=1/Ge})??ye[e]}const Ml=new Map;function Xd(e){let t=Ml.get(e.key);if(!t){if(Ml.size>=64){const o=Ml.keys().next().value;Ml.get(o).tex.destroy(),Ml.delete(o);for(const a of[...er.keys()])a.endsWith("|lt:"+o)&&er.delete(a)}const i=e.lut.length>>2,n=l.createTexture({size:[i,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});l.queue.writeTexture({texture:n},e.lut,{bytesPerRow:i*4},[i,1]),Ml.set(e.key,t={tex:n,view:n.createView()})}return t.view}function Uf(e,t,i,n,o,a=0,u=null,d=null,b=0){const c=u?.lut?u:null,B=u?.pat?dn(u.pat):null;return u?.pat&&!B?null:he(e,a?`${t}|${a}`:t,c?"lt:"+c.key:B?u.pat:"",c?Xd(c):B?B.view:ne,k=>{if(ws(k,d,b),c&&(je[k+20]=1),B){const X=at.zoom-(re.dashDz??1);je[k+20]=2,je[k+21]=2**(at.zoom-24-(X-Math.floor(X)))*at.cosLat,je[k+22]=u.o??1}if(Jn(k,o,!0),je[k+3]=a,je[k+6]=i,n){const X=at.zoom,j=X-(re.dashDz??1);je[k+8]=n.P,je[k+9]=n.n,je[k+10]=n.round,je[k+11]=2**(X-24-(j-Math.floor(j)))*at.cosLat,je.set(n.iv,k+12)}})??ye[e]}let Ul=Ei,bi=l.createBuffer({size:Ut*Ei,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Wi=l.createBindGroup({layout:ot,entries:[{binding:0,resource:{buffer:bi,offset:0,size:Ut}}]}),ie=new Float32Array(Ut/4*Ei);const qa=[];function Rf(e){if(e<=Ul)return!0;if(Ul>=cf)return!1;let t=Ul;for(;t<e&&t<cf;)t*=2;const i=l.createBuffer({size:Ut*t,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),n=new Float32Array(Ut/4*t);n.set(ie),qa.push(bi),bi=i,ie=n,Ul=t;const o={buffer:i,offset:0,size:Ut};if(Wi=l.createBindGroup({layout:ot,entries:[{binding:0,resource:o}]}),et&&(et.plShBG=l.createBindGroup({layout:et.bglPlSh,entries:[{binding:0,resource:o},{binding:1,resource:{buffer:et.pBuf}},{binding:2,resource:et.view},{binding:3,resource:et.samp}]})),xe){xe.plBG=l.createBindGroup({layout:xe.bglPlCl,entries:[{binding:0,resource:o},{binding:1,resource:xe.slotRes(xi.models)}]});const a=xe.shx;a?.sh&&(a.plBG=l.createBindGroup({layout:xe.bglPlShCl,entries:[{binding:0,resource:o},{binding:1,resource:{buffer:a.sh.pBuf}},{binding:2,resource:a.sh.view},{binding:3,resource:a.sh.samp},{binding:4,resource:xe.slotRes(xi.models)}]}))}return!0}const gn=256,Ps=1200,Ha=l.createBuffer({size:gn*Ps,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),$d=l.createBindGroup({layout:Tn,entries:[{binding:0,resource:{buffer:Ha,offset:0,size:48}}]}),Nr=new Float32Array(gn/4*Ps),Xa=l.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Af=new Float32Array(48),Lf=l.createBindGroup({layout:Ai,entries:[{binding:0,resource:{buffer:Xa}}]}),qi=256,Hi={constel:0,ecliptic:1,celeq:2},Ss=l.createBuffer({size:qi*3,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Bs=new Float32Array(qi/4*3),Yd=[0,1,2].map(e=>l.createBindGroup({layout:Li,entries:[{binding:0,resource:{buffer:Ss,offset:e*qi,size:16}}]}));let $a=null;Bs.set([.47,.63,1,.4],Hi.constel*(qi/4)),Bs.set([1,.8,.45,.35],Hi.ecliptic*(qi/4)),Bs.set([1,.55,.5,.32],Hi.celeq*(qi/4)),l.queue.writeBuffer(Ss,0,Bs);let Xi=null,$i=null,Rl=null,Bo=null,Fo=null;function Go(e,t,i){if(e&&e.buf.destroy(),!t||!t.length)return null;const n=t instanceof Float32Array?t:new Float32Array(t),o=l.createBuffer({size:n.byteLength+3&-4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});return l.queue.writeBuffer(o,0,n),{buf:o,count:n.length/i}}const Al=32,Ll=Al,Ya=8,Of=Al+Ya,jd=Of+1,ja=Al+Ya+2,To=l.createBuffer({size:Et*ja,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),_o=l.createBuffer({size:St*ja,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Cr=new Float32Array(St/4*ja);let Rn=null,Df=null,kf=null,If=null;const yi=l.createBindGroup({layout:Yn,entries:[{binding:0,resource:{buffer:_o,offset:0,size:Ga}},..._e(ne)]});function Ka(){const e=Ve.has&&ri?ri:Pt,t=kt.has&&Zi?Zi:Pt,i=Qt.has&&Ji?Ji:Pt;Rn&&Df===e&&kf===t&&If===i||(Df=e,kf=t,If=i,Rn=l.createBindGroup({layout:Pl,entries:[{binding:0,resource:{buffer:To,offset:0,size:Et}},{binding:1,resource:e},{binding:2,resource:Yi},{binding:3,resource:t},{binding:12,resource:i}]}))}let zo=null,hi=null,Co=null,Fs=[],Ol=null,Dl=null;const ei=new Float32Array(St/4),Kd=e=>{const t=new Uint8Array(e.length);for(let i=0;i<e.length;i++)t[i]=Math.max(0,Math.min(255,Math.round(e[i]*255)));return t};function kl(e,t){if(!e||!e.fanPos.length&&!(e.lineHalf&&e.lineHalf.length))return null;const i={origin:e.origin,fill:t,minZoom:e.minZoom||0,fanCount:e.fanPos.length/2,lineCount:0,bufs:[],feats:e.feats||null};return e.fanPos.length&&(i.fanBuf=Vt(e.fanPos,GPUBufferUsage.VERTEX),i.bufs.push(i.fanBuf)),e.lineHalf&&e.lineHalf.length&&(i.lineCount=e.lineHalf.length,i.bP1=Vt(e.P1,GPUBufferUsage.VERTEX),i.bP2=Vt(e.P2,GPUBufferUsage.VERTEX),i.bCol=Vt(Kd(e.lineCol),GPUBufferUsage.VERTEX),i.bHalf=Vt(e.lineHalf,GPUBufferUsage.VERTEX),i.bufs.push(i.bP1,i.bP2,i.bCol,i.bHalf),qf(i.lineCount)),i}function Kr(e){if(e)for(const t of e.bufs)t.destroy()}function Qd(e,t){Kr(zo),zo=e?kl(e,t||[.2,.45,.85,.32]):null}function Zd(e,t){if(Kr(hi),!e){hi=null;return}const i=Yv(t);hi=kl(e,i.color),hi&&(hi.mask=i.mask)}function Jd(e){Kr(Co),Co=e?kl(e,[0,0,0,0]):null}function ep(e){for(const t of Fs)Kr(t);Fs=(e||[]).map(t=>kl(t,[0,0,0,0]))}function tp(e){Kr(Ol),Ol=e?kl(e,[0,0,0,0]):null}function rp(e){Kr(Dl),Dl=e?kl(e,[0,0,0,0]):null}function Nf(e,t,i,n,o,a){Ka(),l.queue.writeBuffer(To,o*Et,t(n.origin)),ei.fill(0),ei[1]=gd,ei[2]=1,ei[3]=1,a&&(ei[4]=a[0],ei[5]=a[1],ei[6]=a[2],ei[7]=a[3]),l.queue.writeBuffer(_o,o*St,ei.buffer,0,St);const u=o*Et,d=o*St;return e.setStencilReference(0),e.setPipeline(nt.ovStencil),e.setBindGroup(0,Rn,[u]),e.setBindGroup(1,yi,[d]),e.setVertexBuffer(0,n.fanBuf),n.feats?Au(n.feats,i.eye,(b,c)=>e.draw(c,1,b)):e.draw(n.fanCount),[u,d]}function np(e,t,i){!Ol||!Ol.fanCount||!h||(Nf(e,t,i,Ol,Of,null),e.setPipeline(nt.wdCover),e.setBindGroup(0,h),e.draw(3))}function ip(e,t,i,n){if(!Dl||!Dl.fanCount)return;const o=Ja().sea,[a,u]=Nf(e,t,i,Dl,jd,[o[0],o[1],o[2],n*(re.globeAlpha??1)]);e.setPipeline(nt.ovCover),e.setBindGroup(0,Rn,[a]),e.setBindGroup(1,yi,[u]),e.draw(3)}let wi=null;function Vf(e){return!e||!e.pos?.length?null:{bPos:Vt(e.pos,GPUBufferUsage.VERTEX),bSh:Vt(e.shade,GPUBufferUsage.VERTEX),bAnc:Vt(e.anchor,GPUBufferUsage.VERTEX),count:e.pos.length/3}}function Wf(){if(wi){for(const e of wi.batches)for(const t of[e.line,e.point])if(t)for(const i of[t.bPos,t.bSh,t.bAnc])i.destroy();wi=null}}function lp(e){if(Wf(),!e)return;const i=(e.batches||[e]).slice(0,Ya).map(n=>({line:Vf(n.lines),point:Vf(n.points),color:n.color||null})).filter(n=>n.line||n.point);i.length&&(wi={origin:e.origin,batches:i})}function op(e,t,i,n){const o=[];if(re.showRail!==!1)for(const b of Fs)b&&n>=b.minZoom&&o.push(b);if(zo&&o.push(zo),hi&&o.push(hi),Co&&o.push(Co),!o.length)return;Ka();const a=Math.min(o.length,Al);Cr.fill(0);for(let b=0;b<a;b++){const c=o[b];l.queue.writeBuffer(To,b*Et,i(c.origin));const B=b*(St/4);Cr[B+1]=gd,Cr[B+3]=1,c.feats&&(Cr[B+2]=1),Cr[B+4]=c.fill[0],Cr[B+5]=c.fill[1],Cr[B+6]=c.fill[2],Cr[B+7]=c.fill[3]}l.queue.writeBuffer(_o,0,Cr.buffer,0,a*St);const u=Zn?Cl(zl):null;if(u){const b=ur.style;for(let c=0;c<a;c++){const B=o[c].origin;zu(Zn.planes,ir(B[0],B[1]),xe.ovCPU.subarray(c*zr/4,c*zr/4+xa),b,Zn.poly)}l.queue.writeBuffer(xe.ovBuf,0,xe.ovCPU.buffer,0,a*zr)}const d=b=>{u&&e.setBindGroup(2,xe.ovBG,[b*zr])};e.setStencilReference(0);for(let b=0;b<a;b++){const c=o[b],B=b*Et,k=b*St;c.fanCount&&(e.setPipeline(nt.ovStencil),e.setBindGroup(0,Rn,[B]),e.setBindGroup(1,yi,[k]),e.setVertexBuffer(0,c.fanBuf),c.feats?Au(c.feats,t.eye,(X,j)=>e.draw(j,1,X)):e.draw(c.fanCount),c.mask?(e.setPipeline(u?u.ovMaskCover:nt.ovMaskCover),e.setBindGroup(0,Rn,[B]),e.setBindGroup(1,yi,[k]),d(b),e.draw(3),e.setPipeline(nt.ovZero),e.setBindGroup(0,Rn,[B]),e.setBindGroup(1,yi,[k]),e.draw(3)):(e.setPipeline(u?u.ovCover:nt.ovCover),e.setBindGroup(0,Rn,[B]),e.setBindGroup(1,yi,[k]),d(b),e.draw(3),u&&(e.setPipeline(nt.ovZero),e.draw(3)))),c.lineCount&&(e.setPipeline(u?u.ovLine:nt.ovLine),e.setBindGroup(0,Rn,[B]),e.setBindGroup(1,yi,[k]),d(b),e.setVertexBuffer(0,Ts),e.setVertexBuffer(1,c.bP1),e.setVertexBuffer(2,c.bP2),e.setVertexBuffer(3,c.bCol),e.setVertexBuffer(4,c.bHalf),e.setVertexBuffer(5,Eo),$f(e,c.lineCount))}}let Eo=null,Gs=0;function qf(e){e<=Gs||(Eo?.destroy(),Gs=Math.max(e,Gs*2,4096),Eo=l.createBuffer({size:Gs*12,usage:GPUBufferUsage.VERTEX}))}const Qa=p.quad4!==!1,Hf=Qa?qm:Wm,Ts=l.createBuffer({size:Hf.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});l.queue.writeBuffer(Ts,0,Hf);const Xf=l.createBuffer({size:pd.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});l.queue.writeBuffer(Xf,0,pd);const $f=(e,t)=>{Qa?(e.setIndexBuffer(Xf,"uint16"),e.drawIndexed(6,t)):e.draw(6,t)};let re={clear:null,land:null,atmo:null,bldColor:null},Yf=!1,_s=null;const dr=()=>Dv(_s,re.fog===!1);let Za=!1,Vr=null,zs=null,jf=1,Kf=null;const Qf=new Float32Array(40),Ja=()=>{const e=re.worldHypsoOpacity??1;return(re.worldHypso!==Za||(re.sea??null)!==zs||e!==jf||re.land!==Kf)&&(Za=re.worldHypso,zs=re.sea??null,jf=e,Kf=re.land,Vr=Vv(Wv(Za),e,re.land||[.96,.96,.95]),zs&&(Vr.sea=zs),[Vr.lowHumid,Vr.lowArid,Vr.midHumid,Vr.midArid,Vr.ramp1,Vr.ramp2,Vr.peak,Vr.snow,Vr.belowSea,Vr.grat].forEach((t,i)=>Qf.set(t,i*4)),l.queue.writeBuffer(P,0,Qf)),Vr};let Wr={li:-1,minzoom:1/0},Cs={ranges:[],rev:0};const Zf=e=>qv(Cs.ranges,e);let Mo=null,Jf=-1,e0=-1;function sp(){if(Jf===$l)return e0;let e=-1;for(const t of["base","main"]){const i=Le[t];for(const n of i.draws)n.li>e&&(e=n.li);if(i.md)for(const n of i.md.layers)n.li>e&&(e=n.li)}return Jf=$l,e0=e,e}let wr={li:-1},Es=0,Ms=0,t0=0,Il=null,r0=null,ti=0,Us=1;const Yi=l.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),n0=l.createTexture({size:[1,1],format:"r16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),Pt=n0.createView(),ec=l.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge"}),i0=l.createTexture({size:[1,1,6],format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}).createView({dimension:"cube"});let Nl=null,ji=i0,tc=0,Pi=null,rc=null,Rs=null;function ap(e){if(Pi=e&&typeof e.kind=="number"?e:null,Pi?.ramp&&Pi.rampN>0){const t=Rs;Rs=l.createTexture({size:[Pi.rampN,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),l.queue.writeTexture({texture:Rs},Pi.ramp,{bytesPerRow:Pi.rampN*4},[Pi.rampN,1]),rc=Rs.createView(),t&&Si(t),qr()}}function l0(e,t,i){const n=Pi,o=n?.contour;e[t]=n?n.kind:0,e[t+1]=n?n.min:0,e[t+2]=n?1/Math.max(1e-6,n.max-n.min):0,e[t+3]=n&&n.landOnly?1:0,e[t+4]=o?o[0]:0,e[t+5]=o?o[1]:0,e[t+6]=o?o[2]:0,e[t+7]=o?o[3]:0,e[t+8]=n?Math.max(.001,n.spacing):1,e[t+9]=n?n.width*i:0,e[t+10]=n?n.opacity:0,e[t+11]=0}let Vl=null,o0=!1,s0=null;function cp(e){Vl||o0||!e||(o0=!0,fetch(e).then(t=>t.blob()).then(t=>createImageBitmap(t,{premultiplyAlpha:"none"})).then(t=>{const i=l.createTexture({size:[t.width,t.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});l.queue.copyExternalImageToTexture({source:t},{texture:i},[t.width,t.height]),Vl=i.createView(),t.close(),qr(),p.requestDraw?.()}).catch(t=>console.warn("[hypso] climate texture load failed (continuing with latitude approximation)",t)))}const Ki=l.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let Wl=null,ql=null,nc=0,Qi=null,ic=0,a0=0,lc=null;function fp(e){if(Wl&&(Wl.destroy(),Wl=null,ql=null),nc=e?1:0,Qi=e?[e.bboxLL[0],e.bboxLL[1],e.bboxLL[2]-e.bboxLL[0],e.bboxLL[3]-e.bboxLL[1]]:null,e){const{rgba:t,w:i,h:n,bboxLL:o}=e;Wl=l.createTexture({size:[i,n],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});const a=i*4,u=Math.ceil(a/256)*256;let d=new Uint8Array(t.buffer||t,t.byteOffset||0,t.byteLength??t.length);if(u!==a){const b=new Uint8Array(u*n);for(let c=0;c<n;c++)b.set(d.subarray(c*a,(c+1)*a),c*u);d=b}l.queue.writeTexture({texture:Wl},d,{bytesPerRow:u},{width:i,height:n}),ql=Wl.createView(),ic=e.pair?1:0,a0=.5/n,l.queue.writeBuffer(Ki,0,new Float32Array([o[0],o[1],o[2]-o[0],o[3]-o[1],1,ic,c0(),a0]))}else ic=0,l.queue.writeBuffer(Ki,0,new Float32Array(8));qr()}const c0=()=>lc==null||!Qi?2:(lc-Qi[0])/Qi[2];function up(e){lc=Number.isFinite(e)?e:null,nc&&l.queue.writeBuffer(Ki,24,new Float32Array([c0()]))}let Er=null,ri=null,Ve={bounds:[0,0,1,0],scale:0,has:0},vt=null,Pr=null,Sr=null,Zi=null,kt={bounds:[0,0,1,0],has:0,edgeFade:0},vn=null,Ji=null,Qt={bounds:[0,0,1,0],has:0,edgeFade:0},sr={bounds:[0,0,1,0],has:0,edgeFade:0},oc=0,As=0,sc=0,ac=0,cc=0;const Uo={gndBake:0,gndMip:0,cellGpu:0,cellCpu:0};let tr=null,Ls=null;const ve={split:!1,w:[null,null,null,null],n:0,key:"",tiles:0,bytes:0,rasterOn:!1,fillsIn:!1,faces:0},Hl=l.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Os=l.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",maxAnisotropy:8,addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),dp=l.createSampler({magFilter:"nearest",minFilter:"nearest",mipmapFilter:"nearest",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"});function qr(){ri=Er?Er.createView():null,Zi=Sr?Sr.createView():null,Ji=vn?vn.createView():null;const e=Ve.has&&ri?ri:Pt,t=kt.has&&Zi?Zi:Pt,i=Qt.has&&Ji?Ji:Pt;tr={},Ls={};for(const[n,o]of Object.entries(qn))Ls[n]=l.createBindGroup({layout:R,entries:[{binding:0,resource:{buffer:r,offset:o*Et,size:Et}},{binding:1,resource:e},{binding:2,resource:Yi},{binding:3,resource:t},{binding:4,resource:ql||Pt},{binding:5,resource:{buffer:Ki}},{binding:6,resource:Pt},{binding:7,resource:Pt},{binding:8,resource:Pt},{binding:9,resource:{buffer:Hl}},{binding:10,resource:Os},{binding:11,resource:Pt},{binding:12,resource:i},{binding:13,resource:ji},{binding:14,resource:ec}]});for(const[n,o]of Object.entries(qn))tr[n]=l.createBindGroup({layout:R,entries:[{binding:0,resource:{buffer:r,offset:o*Et,size:Et}},{binding:1,resource:e},{binding:2,resource:Yi},{binding:3,resource:t},{binding:4,resource:ql||Pt},{binding:5,resource:{buffer:Ki}},{binding:6,resource:ve.w[0]?ve.w[0].view:Pt},{binding:7,resource:ve.w[1]?ve.w[1].view:Pt},{binding:8,resource:ve.w[2]?ve.w[2].view:Pt},{binding:9,resource:{buffer:Hl}},{binding:10,resource:Os},{binding:11,resource:ve.w[3]?ve.w[3].view:Pt},{binding:12,resource:i},{binding:13,resource:ji},{binding:14,resource:ec}]});h=l.createBindGroup({layout:$n,entries:[{binding:0,resource:{buffer:g}},{binding:1,resource:e},{binding:2,resource:Yi},{binding:3,resource:Vl||Pt},{binding:4,resource:{buffer:P}},{binding:5,resource:t},{binding:6,resource:ql||Pt},{binding:7,resource:{buffer:Ki}},{binding:8,resource:ve.w[0]?ve.w[0].view:Pt},{binding:9,resource:ve.w[1]?ve.w[1].view:Pt},{binding:10,resource:ve.w[2]?ve.w[2].view:Pt},{binding:11,resource:{buffer:Hl}},{binding:12,resource:ve.w[3]?ve.w[3].view:Pt},{binding:13,resource:rc||Pt}]}),s0=l.createBindGroup({layout:ui,entries:[{binding:0,resource:Vl||Pt},{binding:1,resource:Yi},{binding:2,resource:{buffer:P}},{binding:3,resource:rc||Pt}]})}qr();const Ds=[],Si=e=>{Ds.push(e)},ks=(e,t)=>l.createTexture({size:[e,t],format:"r16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});function f0(e,t,i,n,o){Uo.cellCpu++,_r++;const a=self.__perfElev,u=a?performance.now():0,d=lm(n),b=a?performance.now():0;l.queue.writeTexture({texture:e,origin:{x:t*o,y:i*o}},d,{bytesPerRow:o*2},{width:o,height:o}),a&&(self.__perfElevLast={f16:b-u,write:performance.now()-b})}function pp(e){const t=Number.isFinite(+e)&&+e>0?+e:1,i=t/Us;Us=t,Ve.has&&(Ve.scale*=i,Ve.exag=(Ve.exag||1)*i),_r++}function u0(e,t){const i=e.cellSpan||10;Ve={bounds:[e.originLng,e.originLat,e.cellsX*i,e.cellsY*i],scale:t*Us,exag:(e.exag||1)*Us,has:1,edgeFade:e.edgeFade||0,liftBounds:e.liftBounds||null,neg:e.negative?1:0};const n=Math.min(e.gMax||1536,Math.max(768,768*Math.max(e.cellsX,e.cellsY)));Rp(e.originLng,e.originLat,e.cellsX*i,e.cellsY*i,n)}function gp(e,t){Er&&Si(Er),Er=ks(e.cellsX*e.cellRes,e.cellsY*e.cellRes),oc=e.cellsX*e.cellRes*e.cellsY*e.cellRes*2,u0(e,t),qr()}function vp(e,t,i,n){Er&&Vs(Er,e,t,i,n)}function mp(e,t){Pr&&Si(Pr.tex),Pr={tex:ks(e.cellsX*e.cellRes,e.cellsY*e.cellRes),a:e,scale:t},As=e.cellsX*e.cellRes*e.cellsY*e.cellRes*2}function xp(e,t,i,n){Pr&&Vs(Pr.tex,e,t,i,n)}function bp(){Pr&&(Er&&Si(Er),Er=Pr.tex,oc=As,As=0,u0(Pr.a,Pr.scale),Pr=null,qr())}function yp(e){const t=e.cellSpan||10;Sr&&Si(Sr),Sr=ks(e.cellsX*e.cellRes,e.cellsY*e.cellRes),sc=e.cellsX*e.cellRes*e.cellsY*e.cellRes*2,kt={bounds:[e.originLng,e.originLat,e.cellsX*t,e.cellsY*t],has:1,edgeFade:e.edgeFade||0},qr()}function hp(e,t,i,n){Sr&&Vs(Sr,e,t,i,n)}function wp(){Sr&&(Si(Sr),Sr=null,kt={bounds:[0,0,1,0],has:0,edgeFade:0},sc=0,qr())}function Pp(e){const t=e.cellSpan||.25;vn&&Si(vn),vn=ks(2*e.cellsX*e.cellRes,e.cellsY*e.cellRes),Qt={bounds:[e.originLng,e.originLat,e.cellsX*t,e.cellsY*t],has:0,edgeFade:e.edgeFade||0},sr.has=0,qr()}function Sp(e,t,i,n){vn&&(Vs(vn,e,t,i,n),e===1?sr.has=sr.bounds[3]>0?1:0:Qt.has||(Qt.has=1,qr()))}function Bp(){vn&&(Si(vn),vn=null,Qt={bounds:[0,0,1,0],has:0,edgeFade:0},sr={bounds:[0,0,1,0],has:0,edgeFade:0},qr())}function Fp(e){sr={bounds:[e.originLng,e.originLat,e.span,e.span],has:0,edgeFade:e.edgeFade||0}}function Gp(){sr.has=0}const d0=!p.cpuElev,fc=256,p0=64,Is=112;let el=null;const Bi=new Map;let Ns=0;const Tp=(p.lowMem?16:64)<<20;function g0(){if(el)return el;const e=T(tm,"elevResample"),t=l.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{hasDynamicOffset:!0,minBindingSize:Is}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),i=l.createRenderPipeline({label:"elevResample",layout:l.createPipelineLayout({bindGroupLayouts:[t]}),vertex:{module:e,entryPoint:"vs"},fragment:{module:e,entryPoint:"fs",targets:[{format:"r16float"}]},primitive:{topology:"triangle-list"}}),n=l.createBuffer({size:fc*p0,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),o=new Uint32Array(Is/4);return el={pipe:i,bgl:t,ubuf:n,u32:o,f32:new Float32Array(o.buffer),slot:0},el}function _p(e){const t=Bi.get(e);if(t)return Bi.delete(e),Bi.set(e,t),t.fresh=0,t;const i=e.data,n=i instanceof Int16Array?0:i instanceof Float32Array?1:-1;if(n<0)return null;let o=i,a=i.byteLength;a&3&&(o=new Int16Array(i.length+1),o.set(i),a=o.byteLength);const u=g0(),d=l.createBuffer({size:a,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});l.queue.writeBuffer(d,0,o.buffer,o.byteOffset,a);const b=l.createBindGroup({layout:u.bgl,entries:[{binding:0,resource:{buffer:u.ubuf,offset:0,size:Is}},{binding:1,resource:{buffer:d}}]}),c={buf:d,bg:b,bytes:a,kind:n,fresh:a};Bi.set(e,c),Ns+=a;for(const[B,k]of Bi){if(Ns<=Tp||B===e)break;Bi.delete(B),Ns-=k.bytes,k.buf.destroy()}return c}const v0=new WeakMap,zp=e=>{let t=v0.get(e);return t||(t=e.createView(),v0.set(e,t)),t};function Cp(e,t,i,n,o){if(!d0)return!1;const a=g0(),u=a.u32,d=a.f32;if(!Zv(u,d,o,t,i,n))return!1;Uo.cellGpu++;const b=_p(o.tile||o.atlas);if(!b)return!1;_r++,u[2]=b.kind;const c=a.slot;a.slot=(c+1)%p0,l.queue.writeBuffer(a.ubuf,c*fc,u.buffer,0,Is);const B=l.createCommandEncoder(),k=B.beginRenderPass({colorAttachments:[{view:zp(e),loadOp:"load",storeOp:"store"}]});return k.setViewport(t*n,i*n,n,n,0,1),k.setScissorRect(t*n,i*n,n,n),k.setPipeline(a.pipe),k.setBindGroup(0,b.bg,[c*fc]),k.draw(3),k.end(),l.queue.submit([B.finish()]),self.__perfElev&&(self.__perfElevLast={f16:0,write:0,gpu:1,raw:b.fresh}),!0}const Ep=Jv;function Vs(e,t,i,n,o){n&&n.mode?Cp(e,t,i,o,n)||f0(e,t,i,Ep(n,o),o):f0(e,t,i,n,o)}async function Mp(e,t,i,n){const o=e==="far"?Sr:e==="stage"?Pr&&Pr.tex:Er;if(!o)return null;const a=Math.ceil(n*2/256)*256,u=l.createBuffer({size:a*n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),d=l.createCommandEncoder();d.copyTextureToBuffer({texture:o,origin:{x:t*n,y:i*n}},{buffer:u,bytesPerRow:a,rowsPerImage:n},{width:n,height:n}),l.queue.submit([d.finish()]),await new Promise(B=>setTimeout(B,0)),await u.mapAsync(GPUMapMode.READ);const b=new Uint8Array(u.getMappedRange()),c=new Float32Array(n*n);for(let B=0;B<n;B++){const k=new Uint16Array(b.buffer,b.byteOffset+B*a,n);for(let X=0;X<n;X++)c[B*n+X]=sm(k[X])}return u.unmap(),u.destroy(),c}const Ro=256,Up=6;let ni=null;function Rp(e,t,i,n,o){const a=[e,t,i,n];if(vt&&vt.G===o){vt.mesh=a,ni=null;return}if(p.terrSync||!p.requestDraw||o<=Ro){ni=null,uc(Ou(o),ef(o),o,a);return}if(vt?vt.mesh=a:uc(Ou(Ro),ef(Ro),Ro,a),ni&&ni.G===o){ni.mesh=a;return}const u=ni={G:o,mesh:a,it:e1(o)},d=()=>{if(ni!==u)return;if(u.it.step(Up)){setTimeout(d,0);return}ni=null;const b=u.it.result();uc(b.uv,b,o,u.mesh),p.requestDraw?.()};setTimeout(d,0)}function uc(e,{idx:t,chunks:i},n,o){vt&&(vt.vbo.destroy(),vt.ibo.destroy(),vt.coarse?.ibo.destroy());const a=l.createBuffer({size:e.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),u=l.createBuffer({size:t.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});l.queue.writeBuffer(a,0,e),l.queue.writeBuffer(u,0,t),ac=e.byteLength+t.byteLength;let d=null;const b=p.terrCoarse|0;if(b>1&&n>Ro){const c=ef(n,void 0,b),B=l.createBuffer({size:c.idx.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});l.queue.writeBuffer(B,0,c.idx),ac+=c.idx.byteLength,d={ibo:B,count:c.idx.length,chunks:c.chunks}}vt={vbo:a,ibo:u,count:t.length,G:n,mesh:o,chunks:i,coarse:d}}let m0=p.terrLod!==!1;const Zt={of:0,drawn:0,cull:0,lod0:0,hidden:0,tris:0,pre:0,sil:0,shed:0,fs:0,fast:0},An={near:{drawn:0,of:0},far:{drawn:0,of:0},fine:{drawn:0,of:0},foot:{drawn:0,of:0}};let tl={ibo:null,count:0,chunks:[]},dc=0;const Ap=e=>{const t=vt?.coarse;dc=t&&(e||p.terrCoarseAlways)?p.terrCoarse|0:0,tl=dc?t:vt},Ws=(e,t,i)=>m0?i1(tl.chunks,e,t,Ve.scale,An[i]):(An[i].drawn=An[i].of=tl.chunks.length,[[0,tl.count]]),Ct=new Map,Xl=dm(l,U,$,gt,W),Lp=()=>{for(const e of Ct.values())if(e.keep2d)return!0;return!1},mn=new Map;let Op=0;const Ln=new Set,pc=l.createSampler({magFilter:"nearest",minFilter:"nearest",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),x0=l.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",maxAnisotropy:8,addressModeU:"repeat",addressModeV:"repeat"});let qs=null,b0=null;function Hs(e,t,i){if(Uo.gndMip++,!qs){const o=l.createShaderModule({code:`@group(0) @binding(0) var s: sampler; @group(0) @binding(1) var t: texture_2d<f32>;
struct VO { @builtin(position) p: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VO { var o: VO; let x = f32((i << 1u) & 2u); let y = f32(i & 2u); o.uv = vec2f(x, 1.0 - y); o.p = vec4f(x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0); return o; }
@fragment fn fs(in: VO) -> @location(0) vec4f { return textureSample(t, s, in.uv); }`});qs=l.createRenderPipeline({label:"mip",layout:"auto",vertex:{module:o,entryPoint:"vs"},fragment:{module:o,entryPoint:"fs",targets:[{format:"rgba8unorm"}]},primitive:{topology:"triangle-list"}}),b0=l.createSampler({magFilter:"linear",minFilter:"linear"})}const n=i??l.createCommandEncoder();for(let o=1;o<t;o++){const a=l.createBindGroup({layout:qs.getBindGroupLayout(0),entries:[{binding:0,resource:b0},{binding:1,resource:e.createView({baseMipLevel:o-1,mipLevelCount:1})}]}),u=n.beginRenderPass({colorAttachments:[{view:e.createView({baseMipLevel:o,mipLevelCount:1}),loadOp:"clear",storeOp:"store"}]});u.setPipeline(qs),u.setBindGroup(0,a),u.draw(3),u.end()}i||l.queue.submit([n.finish()])}const y0={format:"rgba8unorm-srgb"},Ao=(e,t)=>{const i=l.createTexture({size:[1,1],format:"rgba8unorm",viewFormats:["rgba8unorm-srgb"],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return l.queue.writeTexture({texture:i},new Uint8Array(e),{bytesPerRow:4},[1,1]),{tex:i,view:i.createView(t?y0:void 0)}},Dp=Ao([255,255,255,255],!0),Fi=Ao([255,255,255,255],!1),kp=Ao([128,128,255,255],!1),Ip=Ao([255,255,255,255],!1),Np=Ao([255,255,255,255],!0),h0=[Dp,Fi,kp,Ip,Np],Vp=[!0,!1,!1,!1,!0];function w0(e,t=!0){if(!e)return null;const i=e.bitmap?e.bitmap.width:e.w,n=e.bitmap?e.bitmap.height:e.h,o=1+Math.floor(Math.log2(Math.max(i,n))),a=l.createTexture({size:[i,n],mipLevelCount:o,format:"rgba8unorm",viewFormats:["rgba8unorm-srgb"],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});return e.bitmap?l.queue.copyExternalImageToTexture({source:e.bitmap},{texture:a},[i,n]):l.queue.writeTexture({texture:a},e.rgba,{bytesPerRow:i*4,rowsPerImage:n},[i,n]),o>1&&Hs(a,o),{tex:a,view:a.createView(t?y0:void 0)}}function Wp(e){if(!e)return Fi;const t=e.bitmap?e.bitmap.width:e.w,i=e.bitmap?e.bitmap.height:e.h,n=l.createTexture({size:[t,i],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});return e.bitmap?l.queue.copyExternalImageToTexture({source:e.bitmap},{texture:n},[t,i]):l.queue.writeTexture({texture:n},e.rgba,{bytesPerRow:t*4,rowsPerImage:i},[t,i]),{tex:n,view:n.createView()}}const gc=e=>e<=.0031308?e*12.92:1.055*Math.pow(e,1/2.4)-.055;function P0(e,t){if(!e||e.length<4)return null;const i=e[0],n=e[1],o=e[2];for(let a=4;a<e.length;a+=4)if(e[a]!==i||e[a+1]!==n||e[a+2]!==o)return null;return t?Float32Array.of(i/255,n/255,o/255):Float32Array.of(gc(i/255),gc(n/255),gc(o/255))}const S0=e=>{for(let t=3;t<e.length;t+=4)if(e[t]<0)return!1;return!0},B0=new Set,vc=new WeakMap;let qp=0;function F0(e,t="meshTexFast"){if(Cu(e,t))return e[t];if(fv(e,t))return null;vc.has(e)||vc.set(e,++qp);const i=`${vc.get(e)}.${t}`;return B0.has(i)?e[t]:(B0.add(i),Tu(e,l,[t],()=>p.requestDraw?.()),Cu(e,t)?e[t]:null)}const Hp=(e,t)=>{const i=t[0]*t[0]+t[1]*t[1]+t[2]*t[2];if(i<1)return!0;const n=e.bbox;if(!(n[2]>=n[0]&&n[3]>=n[1]))return!1;const o=ir((n[0]+n[2])/2,(n[1]+n[3])/2),a=Math.sqrt(i),u=Math.acos(Math.max(-1,Math.min(1,(o[0]*t[0]+o[1]*t[1]+o[2]*t[2])/a)))+Math.hypot(n[2]-n[0],n[3]-n[1])*(Math.PI/360)+.005;return u<Math.PI/2&&a*Math.cos(u)>1};function mc(e,t=null,i=null){return l.createBindGroup({layout:Ft,entries:[{binding:0,resource:x0},...e.map((n,o)=>({binding:o+1,resource:(n||h0[o]).view})),{binding:af,resource:(t||i||Fi).view}]})}const Xs=new Map,Gi=e=>(e.imagery&&!e.paint?Xs.get(e.imagery):void 0)??null;function xc(e){const t=Gi(e)?.t??null;return e.texs&&(e.texBGDrape??null)!==t&&(e.texBG=mc(e.texs,e.paint??null,t),e.texBGDrape=t),e.texBG}let xn=null,$s=0,$l=0,bc=null,Ys=null,yc=null,hc=null,js=null;const Ks=l.createBuffer({size:gn*24,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Xp=l.createBindGroup({layout:Tn,entries:[{binding:0,resource:{buffer:Ks,offset:0,size:32}}]}),ii=new Float32Array(gn/4*24);function $p(e){const t=e.width,i=e.height,n=1+Math.floor(Math.log2(Math.max(t,i))),o=l.createTexture({size:[t,i],mipLevelCount:n,format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});l.queue.copyExternalImageToTexture({source:e},{texture:o},[t,i]),n>1&&Hs(o,n);const a=Math.round(t*i*4*4/3);$s+=a;const u=o.createView(),d={kind:"tex",tex:o,bg:l.createBindGroup({layout:qe,entries:[{binding:0,resource:Os},{binding:1,resource:u}]}),bgN:null,bytes:a,w:t,h:i};return d.bgOf=b=>b?d.bgN||=l.createBindGroup({layout:qe,entries:[{binding:0,resource:dp},{binding:1,resource:u}]}):d.bg,d}function Yp({pos:e,uv:t,idx:i}){const n=Vt(e,GPUBufferUsage.VERTEX),o=Vt(t,GPUBufferUsage.VERTEX),a=Vt(i,GPUBufferUsage.INDEX),u=e.byteLength+t.byteLength+i.byteLength;return $s+=u,{kind:"mesh",bPos:n,bUv:o,bIdx:a,count:i.length,bufs:[n,o,a],bytes:u}}const wc=[];function jp(e){e&&(wc.push(e),$s-=e.bytes||0)}function G0(){for(const e of wc)if(e.kind==="tex")e.tex.destroy();else for(const t of e.bufs)t.destroy();wc.length=0}function Kp(e){xn=e}function Qs(){const e=new Float32Array(20);for(let t=0;t<4;t++){const i=t<ve.n?ve.w[t]:null;e[t*4]=i?i.win[0]:0,e[t*4+1]=i?i.win[1]:0,e[t*4+2]=i?i.win[2]:1,e[t*4+3]=i?i.win[3]:1}e[16]=ve.n,e[17]=ve.n&&ve.split?Ic*s.width:-1,l.queue.writeBuffer(Hl,0,e)}function Qp(e){const t=1+Math.floor(Math.log2(e)),i=l.createTexture({size:[e,e],mipLevelCount:t,format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST}),n=Math.round(e*e*4*4/3);return ve.bytes+=n,{tex:i,view:i.createView(),view0:i.createView({baseMipLevel:0,mipLevelCount:1}),size:e,levels:t,win:[0,0,1,1],bytes:n}}function T0(e){e&&(e.tex.destroy(),ve.bytes-=e.bytes)}let _0=null,Pc=null;function Zp(e,t){_0=e||null,Pc=t||null}function Jp(e,t,i){const n=!!(xn&&xn.layers.length),o=t&&!(n&&xn.hideFills);ve.rasterOn=n,ve.fillsIn=t;const a=t&&_0;if(!n&&!o&&!a)return ve.split=!1,ve.n&&(ve.n=0,ve.key="",ve.tiles=0,Qs()),null;ve.split=n&&xn.layers.some(q=>q.split);const u=kv(e,s.width,s.height,kt.has&&kt.maxElev||0),d=e.zoom<Wr.minzoom,b=re.baseAlpha??1,c=t&&i.indexOf("user")>=0,B=c?i.filter(q=>q!=="user"):i,k=o?eg(e):[],X=Iv(u)+`|${n?xn.rev:-1}|${o?$l+":"+B.join(""):-1}|${d}|${b}|${wr.li}|${a?Pc?Pc():"":-1}`+(c?`|u${$l}:${Cs.rev}`:"")+(k.length?`|f${k.map(q=>q.ward+":"+q.rev).join(",")}`:"");if(X===ve.key||R0>0&&Lo&&ve.n&&performance.now()-A0<R0)return ve.split&&Qs(),null;let j=!1;const Ge=p.lowMem?1024:2048,$e=Nv(u,Ge);for(let q=0;q<u.length;q++){const ue=u[q],Fe=$e[q];(!ve.w[q]||ve.w[q].size!==Fe)&&(ve.w[q]&&T0(ve.w[q]),ve.w[q]=Qp(Fe),j=!0),ve.w[q].win=[ue[0],ue[1],ue[2]-ue[0],ue[3]-ue[1]]}return ve.n!==u.length&&(j=!0),ve.n=u.length,ve.key=X,j&&qr(),Qs(),{wins:u,rasterOn:n,wantFills:o,seaOff:d,baseA:b,cam:e,hook:a,userIn:c,baseSlots:B,foot:k}}function eg(e){return!yl||_u()<=0||wr.li<0||(e.pitch||0)<.02||!mn.size?[]:ma(mn,Ln,e.center,lo)}const Sc=.96,Zs=new Map,Bc=new ArrayBuffer(96),z0=new Uint32Array(Bc),Ti=new Float32Array(Bc);function tg(e,t,i){const n=re.bldColor||[.86,.86,.85],o=t.map(u=>u.ward+":"+u.rev).join("|")+"@"+i[0]+","+i[1]+"#"+n.join(",");let a=Zs.get(e);if(a&&a.sig===o)return a.bg;a||(a={sig:"",bg:null,buf:l.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})},Zs.set(e,a)),z0.fill(0),z0[0]=t.length;for(let u=0;u<lo;u++){const d=t[u]&&t[u].bbox,b=d?d[2]-d[0]:1,c=d?d[3]-d[1]:1;Ti[4+u*4]=d?(i[0]-d[0])/b:2e9,Ti[5+u*4]=d?(i[1]-d[1])/c:2e9,Ti[6+u*4]=d?1/b:0,Ti[7+u*4]=d?1/c:0}return Ti[20]=n[0]*Sc,Ti[21]=n[1]*Sc,Ti[22]=n[2]*Sc,Ti[23]=1,l.queue.writeBuffer(a.buf,0,Bc),a.sig=o,a.bg=l.createBindGroup({layout:Xn,entries:[{binding:0,resource:{buffer:Ks,offset:0,size:32}},{binding:1,resource:{buffer:a.buf}},...[0,1,2,3].map(u=>({binding:2+u,resource:t[u]?t[u].view:li})),{binding:6,resource:pc}]}),a.bg}function rg(e,t){if(!e)return;Uo.gndBake++;const{wins:i,rasterOn:n,wantFills:o,seaOff:a,baseA:u,cam:d,hook:b,userIn:c,baseSlots:B,foot:k}=e;if(ve.tiles=0,ve.faces=0,bc||(bc=l.createRenderPipeline({label:"rasAtlas",layout:po,vertex:{module:xl,entryPoint:"vs",buffers:_n},fragment:{module:xl,entryPoint:"fs",targets:[{format:"rgba8unorm",blend:gt}]},primitive:{topology:"triangle-list"}})),Ys||(Ys=l.createRenderPipeline({label:"atlasFill",layout:bl,vertex:{module:ls,entryPoint:"vs",buffers:zn},fragment:{module:ls,entryPoint:"fs",targets:[{format:"rgba8unorm",blend:gt}]},primitive:{topology:"triangle-list"}})),yt&&!yc){const q=T(of(pf,"AFOut","ATLAS_FILL_MD"),"atlasFillMd");yc=l.createRenderPipeline({label:"atlasFillMD",layout:l.createPipelineLayout({bindGroupLayouts:[R,E,Tn,na]}),vertex:{module:q,entryPoint:"vs",buffers:ia},fragment:{module:q,entryPoint:"fs",targets:[{format:"rgba8unorm",blend:gt}]},primitive:{topology:"triangle-list"}})}if(k.length&&!hc&&(hc=l.createRenderPipeline({label:"atlasFoot",layout:l.createPipelineLayout({bindGroupLayouts:[R,E,Xn]}),vertex:{module:yl,entryPoint:"vs",buffers:zn},fragment:{module:yl,entryPoint:"fs",targets:[{format:"rgba8unorm",blend:gt}]},primitive:{topology:"triangle-list"}})),k.length&&yt&&!js){const q=T(of(ju,"AFOut","ATLAS_FOOT_MD"),"atlasFootMd");js=l.createRenderPipeline({label:"atlasFootMD",layout:l.createPipelineLayout({bindGroupLayouts:[R,E,Xn,na]}),vertex:{module:q,entryPoint:"vs",buffers:ia},fragment:{module:q,entryPoint:"fs",targets:[{format:"rgba8unorm",blend:gt}]},primitive:{topology:"triangle-list"}})}let X=0,j=0;const Ge=[];for(let q=0;q<i.length;q++){const ue=ve.w[q],Fe=i[q],de=[];if(n){for(const Re of["under","over"])for(const lt of xn.layers)if(lt.order===Re)for(const ct of lt.draws){const Ke=ct.bounds;if(Ke[2]<=Fe[0]||Ke[0]>=Fe[2]||Ke[3]<=Fe[1]||Ke[1]>=Fe[3])continue;if(X>=Ps){console.warn(`[gpu] raster atlas draws exceed ${Ps} = truncated`);break}const Qe=X*(gn/4);Nr[Qe]=ct.nw[0]-ue.win[0],Nr[Qe+1]=ct.nw[1]-ue.win[1],Nr[Qe+2]=1/ue.win[2],Nr[Qe+3]=1/ue.win[3],Nr[Qe+4]=ct.uvT[0],Nr[Qe+5]=ct.uvT[1],Nr[Qe+6]=ct.uvT[2],Nr[Qe+7]=ct.uvT[3],Nr[Qe+8]=lt.opacity*(ct.a??1),Nr[Qe+9]=0,Nr[Qe+10]=0,Nr[Qe+11]=0,de.push({d:ct,slot:X,order:Re,nearest:lt.resampling==="nearest",split:lt.split||0}),X++,ve.tiles++}}const I=[],ce={},Pe=[...o?B:[],...c?["user"]:[]];for(const Re of Pe){const lt=Le[Re];if(!ra(lt))continue;const ct=Re==="user";ce[Re]=[];for(const Ke of ct?[0]:[0,1]){const Qe=j*(gn/4);ii[Qe]=lt.origin[0]-ue.win[0],ii[Qe+1]=lt.origin[1]-ue.win[1],ii[Qe+2]=1/ue.win[2],ii[Qe+3]=1/ue.win[3],ii[Qe+4]=Ke,ii[Qe+5]=ct?1:u,ii[Qe+6]=0,ii[Qe+7]=0,ce[Re][Ke]=j,j++}}const mt=Zf(ce.user&&o?[...B].reverse().find(Re=>ce[Re]):null);for(const Re of Pe){if(!ce[Re]||Re==="user")continue;if(Re!==mt.host||!mt.anchors.length){I.push({slot:Re,gate:0,at:ce[Re][0],user:!1},{slot:Re,gate:1,at:ce[Re][1],user:!1});continue}let lt=-1/0;for(const ct of mt.anchors)I.push({slot:Re,gate:0,at:ce[Re][0],user:!1,lo:lt,hi:ct},{slot:"user",gate:0,at:ce.user[0],user:!0,pick:Ke=>mt.anchorOf(Ke.li)===ct}),lt=ct;I.push({slot:Re,gate:0,at:ce[Re][0],user:!1,lo:lt,hi:1/0},{slot:Re,gate:1,at:ce[Re][1],user:!1})}ce.user&&I.push({slot:"user",gate:0,at:ce.user[0],user:!0,pick:mt.host?Re=>mt.anchorOf(Re.li)===1/0:null}),Ge.push({a:ue,tiles:de,fills:I,index:q})}X&&l.queue.writeBuffer(Ha,0,Nr.buffer,0,X*gn),j&&l.queue.writeBuffer(Ks,0,ii.buffer,0,j*gn);const $e=l.createCommandEncoder();for(const{a:q,tiles:ue,fills:Fe,index:de}of Ge){let I=$e.beginRenderPass({colorAttachments:[{view:q.view0,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});for(const ce of ve.split?[-1,1]:[0]){const Pe=ce>0?q.size>>1:0,mt=ce?q.size>>1:q.size;I.setViewport(Pe,0,mt,q.size,0,1);const Re=Ke=>{let Qe=!1;for(const ht of ue)ht.order!==Ke||ce&&ht.split&&ht.split!==ce||(Qe||(I.setPipeline(bc),Qe=!0),I.setBindGroup(0,$d,[ht.slot*gn]),I.setBindGroup(1,ht.d.tex.bgOf?ht.d.tex.bgOf(ht.nearest):ht.d.tex.bg),I.setVertexBuffer(0,ht.d.mesh.bPos),I.setVertexBuffer(1,ht.d.mesh.bUv),I.setIndexBuffer(ht.d.mesh.bIdx,"uint16"),I.drawIndexed(ht.d.mesh.count))},lt=()=>{if(Fe.length){I.setPipeline(Ys),I.setBindGroup(1,ye[He.normal]);for(const{slot:Ke,gate:Qe,at:ht,user:In,lo:hn=-1/0,hi:Zr=1/0,pick:It=null}of Fe){const Hr=Le[Ke];if(I.setBindGroup(0,Ls[Ke]),I.setBindGroup(2,Xp,[ht*gn]),Hr.md){I.setPipeline(yc),I.setBindGroup(3,zc()),I.setVertexBuffer(0,yt.fillV.buf),I.setIndexBuffer(yt.fillI.buf,"uint32");for(const bt of Hr.md.layers){if(bt.kind!=="fill"||!(It?It(bt):bt.li>=hn&&bt.li<Zr)||bt.pat)continue;const il=Pa(bt.li)!=null,wn=bt.li===Wr.li||bt.li===Wr.li2;if((il?1:0)===Qe&&!(!In&&(il||wn)&&a)&&!(wr.li>=0&&bt.li===wr.li)){I.setBindGroup(1,bt.pt?mg[bt.pt-1]:ye[He.normal]),I.setVertexBuffer(1,Hr.md.orgBuf,bt.orgOff);for(let Jr=0;Jr<bt.counts.length;Jr++)I.drawIndexed(bt.counts[Jr],1,bt.offsets[Jr]>>2,0,Jr)}}I.setPipeline(Ys),I.setBindGroup(1,ye[He.normal]);continue}for(const bt of Hr.draws){if(bt.kind!=="fill"||!(It?It(bt):bt.li>=hn&&bt.li<Zr))continue;const il=Pa(bt.li)!=null,wn=bt.li===Wr.li||bt.li===Wr.li2;(il?1:0)===Qe&&(!In&&(il||wn)&&a||wr.li>=0&&bt.li===wr.li||(I.setVertexBuffer(0,bt.bPos),I.setVertexBuffer(1,bt.bCol),bt.bIdx?(I.setIndexBuffer(bt.bIdx,"uint32"),I.drawIndexed(bt.count)):I.draw(bt.count)))}}}},ct=()=>{if(!k.length)return;const Ke=new Set;for(const{slot:Qe,gate:ht,at:In,user:hn}of Fe){if(hn||ht!==0||Ke.has(Qe))continue;Ke.add(Qe);const Zr=Le[Qe];if(I.setBindGroup(0,Ls[Qe]),I.setBindGroup(1,ye[He.normal]),I.setBindGroup(2,tg(Qe,k,Zr.origin||[0,0]),[In*gn]),Zr.md){if(!js)continue;I.setPipeline(js),I.setBindGroup(3,zc()),I.setVertexBuffer(0,yt.fillV.buf),I.setIndexBuffer(yt.fillI.buf,"uint32");for(const It of Zr.md.layers)if(!(It.kind!=="fill"||It.li!==wr.li)){I.setVertexBuffer(1,Zr.md.orgBuf,It.orgOff);for(let Hr=0;Hr<It.counts.length;Hr++)I.drawIndexed(It.counts[Hr],1,It.offsets[Hr]>>2,0,Hr)}continue}I.setPipeline(hc);for(const It of Zr.draws)It.kind!=="fill"||It.li!==wr.li||(I.setVertexBuffer(0,It.bPos),I.setVertexBuffer(1,It.bCol),It.bIdx?(I.setIndexBuffer(It.bIdx,"uint32"),I.drawIndexed(It.count)):I.draw(It.count))}};if(Re("under"),lt(),ct(),Re("over"),b){I.end();try{ve.faces+=b(d,{enc:$e,view:q.view0,size:q.size,win:q.win,index:de,...ce?{vp:[Pe,mt]}:{}})|0}catch(Ke){console.error("[gpu] ground hook",Ke?.message)}I=$e.beginRenderPass({colorAttachments:[{view:q.view0,loadOp:"load",storeOp:"store"}]}),I.setViewport(Pe,0,mt,q.size,0,1)}}I.end()}if(!p.gndMipSep)for(const{a:q}of Ge)q.levels>1&&Hs(q.tex,q.levels,$e);if(l.queue.submit([$e.finish()]),p.gndMipSep)for(const{a:q}of Ge)q.levels>1&&Hs(q.tex,q.levels);A0=performance.now()}const C0=l.createTexture({size:[1,1],format:"r8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),li=C0.createView(),Fc=l.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Gc=new ArrayBuffer(96),ng=new Uint32Array(Gc),Js=new Float32Array(Gc);let ea=null,Yl="";function Tc(e,t){const i=e.map(n=>n.ward+":"+n.rev).join("|")+"@"+t[0]+","+t[1];if(ea&&i===Yl)return ea;Yl=i,ng[0]=e.length;for(let n=0;n<lo;n++){const o=e[n]&&e[n].bbox,a=o?o[2]-o[0]:1,u=o?o[3]-o[1]:1;Js[4+n*4]=o?(t[0]-o[0])/a:2e9,Js[5+n*4]=o?(t[1]-o[1])/u:2e9,Js[6+n*4]=o?1/a:0,Js[7+n*4]=o?1/u:0}return l.queue.writeBuffer(Fc,0,Gc),ea=l.createBindGroup({layout:Ue,entries:[{binding:0,resource:{buffer:Fc}},{binding:1,resource:e[0]?e[0].view:li},{binding:2,resource:e[1]?e[1].view:li},{binding:3,resource:e[2]?e[2].view:li},{binding:4,resource:e[3]?e[3].view:li},{binding:5,resource:pc}]}),ea}const E0=l.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),ig=l.createBindGroup({layout:Ue,entries:[{binding:0,resource:{buffer:E0}},{binding:1,resource:li},{binding:2,resource:li},{binding:3,resource:li},{binding:4,resource:li},{binding:5,resource:pc}]});function lg(e){_r++;for(const i of[..._i.keys()])(i===e||i.startsWith(e+"#"))&&O0(i);for(const i of[...Ct.keys()]){if(i!==e&&!i.startsWith(e+"#"))continue;const n=Ct.get(i);n.vbo.destroy(),n.nbo.destroy(),n.ibo.destroy(),n.uvbo?.destroy(),n.cbo?.destroy(),n.mcbo?.destroy(),n.cs?.cub.destroy(),n.uvmbo?.destroy();for(const o of n.meta?.texs||[])o!==Fi&&o.tex.destroy();n.paint?.tex.destroy();for(const o of n.texs||[])o?.tex.destroy();Ct.delete(i)}const t=mn.get(e);t&&(t.tex.destroy(),mn.delete(e)),Ln.delete(e),Yl="\0"}function M0(e,t,i){if(i){for(let n=0;n<3;n++)e[t+196+n*4]=i[n*3],e[t+197+n*4]=i[n*3+1],e[t+198+n*4]=i[n*3+2];e[t+208]=i[9],e[t+209]=i[10],e[t+210]=i[11],e[t+211]=1}else e[t+196]=1,e[t+197]=0,e[t+198]=0,e[t+200]=0,e[t+201]=1,e[t+202]=0,e[t+204]=0,e[t+205]=0,e[t+206]=1,e[t+208]=0,e[t+209]=0,e[t+210]=0,e[t+211]=0}const og=p.flatVec===!0,sg=p.lineElev|0,U0=p.lineElevMove|0,R0=p.gndHold>0?p.gndHold:0;let A0=-1e9,Lo=!1;const ag=p.elevCheap===!0,cg=p.nearClip>0?p.nearClip:0,xr=p.clipK>0?2**Math.round(p.clipK):1,fg=p.meshChunk===!0,L0=1<<20,_i=new Map,ta=[];function O0(e){const t=_i.get(e);t&&(t.pre.vbo.destroy(),t.pre.nbo.destroy(),t.pre.ibo.destroy(),_i.delete(e),ta.push(t.data))}function ug(e){const t=performance.now();for(;_i.size;){const[i,n]=_i.entries().next().value;for(;n.jobs.length;){const o=n.jobs[0],a=o.src,u=Math.min(L0,a.byteLength-o.off);if(l.queue.writeBuffer(o.buf,o.off,a.buffer,a.byteOffset+o.off,u),o.off+=u,o.off>=a.byteLength&&n.jobs.shift(),performance.now()-t>=e)break}if(n.jobs.length||(_i.delete(i),D0(i,n.data,n.pre),ta.push(n.data),performance.now()-t>=e))break}return ta.splice(0)}function D0(e,t,i){if(_r++,i||O0(e),!t){lg(e);return}if(fg&&!i&&t.pos?.length&&t.idx?.length&&!(t.uv&&t.col)&&t.pos.byteLength+t.idx.byteLength>L0){const o=t.nrm instanceof Int8Array?t.nrm:Int8Array.from(t.nrm||new Int8Array(t.pos.length/3*4)),a=(d,b)=>l.createBuffer({size:d.byteLength+3&-4,usage:b|GPUBufferUsage.COPY_DST}),u={vbo:a(t.pos,GPUBufferUsage.VERTEX),nbo:a(o,GPUBufferUsage.VERTEX),ibo:a(t.idx,GPUBufferUsage.INDEX)};_i.set(e,{data:t,nrm:o,pre:u,jobs:[{buf:u.vbo,src:t.pos,off:0},{buf:u.nbo,src:o,off:0},{buf:u.ibo,src:t.idx,off:0}]});return}const n=Ct.get(e);if(n){n.vbo.destroy(),n.nbo.destroy(),n.ibo.destroy(),n.uvbo?.destroy(),n.cbo?.destroy(),n.mcbo?.destroy(),n.cs?.cub.destroy(),n.uvmbo?.destroy();for(const o of n.meta?.texs||[])o!==Fi&&o.tex.destroy();for(const o of n.texs||[])o?.tex.destroy();Ct.delete(e)}if(t.pos?.length&&t.idx?.length){const o=t.nrm instanceof Int8Array?t.nrm:Int8Array.from(t.nrm||new Int8Array(t.pos.length/3*4)),a=i?i.vbo:l.createBuffer({size:t.pos.byteLength+3&-4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),u=i?i.nbo:l.createBuffer({size:o.byteLength+3&-4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),d=i?i.ibo:l.createBuffer({size:t.idx.byteLength+3&-4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});i||(l.queue.writeBuffer(a,0,t.pos.buffer,t.pos.byteOffset,t.pos.byteLength),l.queue.writeBuffer(u,0,o.buffer,o.byteOffset,o.byteLength),l.queue.writeBuffer(d,0,t.idx.buffer,t.idx.byteOffset,t.idx.byteLength));const b=!!(t.uv&&t.col);let c=null,B=null,k=null,X=null;b&&(c=l.createBuffer({size:t.uv.byteLength+3&-4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),B=l.createBuffer({size:t.col.byteLength+3&-4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),l.queue.writeBuffer(c,0,t.uv.buffer,t.uv.byteOffset,t.uv.byteLength),l.queue.writeBuffer(B,0,t.col.buffer,t.col.byteOffset,t.col.byteLength),k=["tex","texMR","texN","texOcc","texEm"].map((de,I)=>w0(t[de],Vp[I])),X=mc(k));let j=null;b&&t.mc?.length&&(j=l.createBuffer({size:t.mc.byteLength+3&-4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),l.queue.writeBuffer(j,0,t.mc.buffer,t.mc.byteOffset,t.mc.byteLength));let Ge=null;b&&t.uvm?.length&&(Ge=l.createBuffer({size:t.uvm.byteLength+3&-4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),l.queue.writeBuffer(Ge,0,t.uvm.buffer,t.uvm.byteOffset,t.uvm.byteLength));const $e=b&&t.meta?.props&&t.meta.texs?.length?{props:t.meta.props,sig:JSON.stringify(t.meta.props),texs:t.meta.texs.map(de=>Wp(de))}:null,q=t.pbr||null,ue=b&&t.alphaMode==="BLEND",Fe=b?t.alphaMode==="MASK"?t.alphaCutoff??.5:ue?1/255:-1:-1;Ct.set(e,{vbo:a,nbo:u,ibo:d,textured:b,blend:ue,cut:Fe,pre:ue&&!!t.preOpaque,uvbo:c,cbo:B,texs:k,texBG:X,pbr:q,csLit:t.csLit||"pbr",wind:!!t.wind,count:t.idx.length,origin:t.origin||[0,0,0],bbox:t.bbox||[1e9,1e9,-1e9,-1e9],ward:t.ward||String(e).split("#")[0],lodH:t.lodH||null,lodCounts:t.lodCounts||null,liteCounts:t.liteCounts||null,backCull:!!t.backCull&&!!t.wind,wound:!!t.wound,two:t.twoSided?1:0,noCull:!!t.noCull,colSrgb:!!t.colSrgb,noLift:!!t.noLift,baked:!!t.liftBaked,drape:!!t.drape,keep2d:!!t.keep2d,noCast:t.castShadow===!1||!!t.keep2d&&t.castShadow!==!0,custom:t.custom??null,split:t.split??0,sh:t.sh&&t.sh.length>=27?Float32Array.from(t.sh):null,ol:t.outline?Float32Array.from(t.outline):null,noClip:!!t.noClip,imagery:t.imagery??null,mcJ:t.mcJ&&t.mcJ.length>=9?Float32Array.from(t.mcJ):null,mcbo:j,cs:null,uvmbo:Ge,meta:$e,plain:Gn&&b&&!k.some(Boolean)&&S0(o),flat:Gn&&b?P0(t.col,!!t.colSrgb):null})}if(t.ward&&(t.maskCells||t.mask)&&(t.maskN|0)>0&&t.maskBbox){const o=t.maskN|0;let a=mn.get(t.ward),u=!1;if(!a||a.n!==o){a&&a.tex.destroy();const c=l.createTexture({size:[o,o],format:"r8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});a={ward:t.ward,rev:0,tex:c,view:c.createView(),bbox:t.maskBbox,n:o,bytes:new Uint8Array(o*o)},mn.set(t.ward,a),u=!0}a.bbox=t.maskBbox,av(a.bytes,t.maskCells,t.mask);const[d,b]=u||t.mask||!t.maskCells?[0,o-1]:cv(t.maskCells,o);b>=d&&l.queue.writeTexture({texture:a.tex,origin:[0,d]},a.bytes,{offset:d*o,bytesPerRow:o,rowsPerImage:b-d+1},[o,b-d+1]),a.rev=++Op,Yl="\0"}}function dg(e,t){_r++,t?Ln.delete(e):Ln.add(e),Yl="\0"}const Le={base:{origin:[0,0],draws:[],bld:null},main:{origin:[0,0],draws:[],bld:null},user:{origin:[0,0],draws:[],bld:null}};let pr=null;function Vt(e,t){const i=l.createBuffer({size:e.byteLength+3&-4,usage:t|GPUBufferUsage.COPY_DST});return l.queue.writeBuffer(i,0,e.buffer,e.byteOffset,e.byteLength),i}const k0=e=>e instanceof Uint8Array?e:Uint8Array.from(e,t=>Math.max(0,Math.min(255,Math.round(t*255))));function _c(e){const t=Le[e].fadePrev;if(t){for(const i of t.draws)for(const n of i.bufs)n.destroy();if(t.bld)for(const i of t.bld.bufs)i.destroy();Le[e].fadePrev=null}}function Oo(e){_c(e);for(const t of Le[e].draws)for(const i of t.bufs)i.destroy();if(Le[e].bld)for(const t of Le[e].bld.bufs)t.destroy();Le[e].md&&Le[e].md.orgBuf.destroy(),Le[e]={origin:Le[e].origin,draws:[],bld:null}}const pg=4096,ra=e=>e.draws.length>0||!!(e.md&&e.md.layers.length),yt=p.noMD?null:{fillV:{buf:null,bytes:0},fillI:{buf:null,bytes:0},bldV:{buf:null,bytes:0},line:{buf:null,bytes:0},lineBG:null,lineOver:!1};let I0=0,N0=0;const V0=l.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),na=l.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),W0=l.createBindGroupLayout({entries:[]}),q0=l.createBindGroup({layout:W0,entries:[]}),ia=[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"unorm8x4"}]},{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]}],H0=[{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}],X0=[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32"},{shaderLocation:2,offset:16,format:"float32x2"}]},{arrayStride:8,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"float32x2"}]}],$0={fillV:12,fillI:4,bldV:24,line:32},gg={fillV:GPUBufferUsage.VERTEX,fillI:GPUBufferUsage.INDEX,bldV:GPUBufferUsage.VERTEX,line:GPUBufferUsage.STORAGE};function Y0(){const e=l.limits.maxStorageBufferBindingSize,t=yt.line;t.bytes>e&&!yt.lineOver&&(yt.lineOver=!0,console.warn(`[gpu] md line pool ${t.bytes>>20}MB exceeds maxStorageBufferBindingSize ${e>>20}MB = segments beyond the limit are not drawn`)),yt.lineBG=l.createBindGroup({layout:V0,entries:[{binding:0,resource:{buffer:t.buf,offset:0,size:Math.min(t.bytes,e)}},{binding:1,resource:{buffer:On.buf}}]})}const jl=$v(),On={buf:l.createBuffer({size:64,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),bytes:64,bg:null},zc=()=>On.bg??=l.createBindGroup({layout:na,entries:[{binding:0,resource:{buffer:On.buf}}]});function vg(){const e=jl.takeDirty();if(!e)return;const t=jl.data,i=jv*4;if(t.byteLength>On.bytes){On.buf.destroy(),On.buf=l.createBuffer({size:t.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),On.bytes=t.byteLength,On.bg=null,l.queue.writeBuffer(On.buf,0,t),yt&&yt.line.buf&&Y0();return}l.queue.writeBuffer(On.buf,e[0]*i,t.buffer,e[0]*i,(e[1]-e[0]+1)*i)}const j0=l.createBuffer({size:St*2,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),mg=[1,2].map(e=>l.createBindGroup({layout:E,entries:[{binding:0,resource:{buffer:j0,offset:(e-1)*St,size:Ga}},..._e(ne)]})),Cc=new Float32Array(St/4*2);function xg(e,t){const i=yt[e];if(!i||!$0[e])return;const n=t*$0[e];if(n<=i.bytes)return;const o=l.createBuffer({size:n,usage:gg[e]|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC});if(i.buf){const a=l.createCommandEncoder();a.copyBufferToBuffer(i.buf,0,o,0,i.bytes),l.queue.submit([a.finish()]),i.buf.destroy()}I0+=n-i.bytes,i.buf=o,i.bytes=n,e==="line"&&Y0()}function bg(e){e.fill&&yt.fillV.buf&&l.queue.writeBuffer(yt.fillV.buf,e.fill.base*12,e.fill.buf),e.idx&&yt.fillI.buf&&l.queue.writeBuffer(yt.fillI.buf,e.idx.base*4,e.idx.arr),e.line&&yt.line.buf&&l.queue.writeBuffer(yt.line.buf,e.line.base*32,e.line.arr),e.bld&&yt.bldV.buf&&l.queue.writeBuffer(yt.bldV.buf,e.bld.base*24,e.bld.arr),e.rows&&jl.rows(e.rows)}function yg(e){if(!Le[e.slot])return;const t=self.__perfScene?performance.now():0;$l++,N0++,Oo(e.slot);let i=0;for(const c of e.layers)i+=c.counts.length;if(e.bld)for(const c of e.bld)i+=c.counts.length;const n=new Float32Array(Math.max(2,i*2));let o=0;const a=c=>{const B=o*8;return n.set(c,o*2),o+=c.length>>1,B},u=e.layers.map(c=>{const B=c.cj||0,k=c.kind==="line"?Lu(c.dash,B):null,X=c.fx||null;return{kind:c.kind,li:c.li,counts:c.counts,offsets:c.offsets,firsts:c.firsts,orgOff:a(c.origins),...c.pat?{pat:c.pat}:{},cj:B,dash:k,fx:X,lxk:c.kind==="fill"?zt(X,c.pat):Mn(B,c.dash,X,c.lt),pz:c.pz||null,pt:c.pt||0,lt:c.lt||null}}),d=e.bld?e.bld.map(c=>({counts:c.counts,firsts:c.firsts,orgOff:a(c.origins)})):null,b=l.createBuffer({size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});if(l.queue.writeBuffer(b,0,n),Le[e.slot]={origin:e.origin,draws:[],bld:null,md:{layers:u,bld:d,orgBuf:b}},t){const c=performance.now()-t;c>4&&(self.__perfHitch||={elev:0,scene:0}).scene++,console.log(`[scene] apply ${e.slot} ${c.toFixed(1)}ms ${n.byteLength/1024|0}KB layers=${u.length} md=1 draws=${i}`)}}const K0=new Map,Q0=new Map,Ec=(e,t,i)=>{let n=Q0.get(e);return n||Q0.set(e,n=T(t,i)),n};function Z0(e,t){const i=`${e}:${t}`;let n=K0.get(i);if(n)return n;const o=e==="p"?{fill:Ua,line:Jo,bld:es,lbl:""}:e==="r"?{fill:Ca,line:ao,bld:Ea,lbl:"Sh"}:e==="c"?{fill:Qu,line:nf,bld:Zu,lbl:"Clip"}:{fill:Ju,line:lf,bld:ed,lbl:"ShClip"},a=e==="p"?W0:e==="r"?et.bgl:e==="c"?xe.bgl:xe.bglShCl,u=l.createPipelineLayout({bindGroupLayouts:[R,E,a,na]}),d=e==="p"?se:e==="r"?et.lay.bld:e==="c"?xe.lay.bld:xe.laySh.bld,b=l.createPipelineLayout({bindGroupLayouts:[R,E,a,V0]}),c=Ec(`fill${o.lbl}`,of(o.fill,"FillOut",`FILL_MD${o.lbl}`),`fill${o.lbl}`),B=Ec(`line${o.lbl}`,nm(o.line,`LINE_MD${o.lbl}`),`line${o.lbl}`),k=Ec(`bld${o.lbl}`,nd(o.bld,`BUILDING_MD${o.lbl}`),`building${o.lbl}`),X={count:t},j=(Ge,$e,q,ue,Fe=Be)=>l.createRenderPipeline({label:wt(),layout:ue,vertex:{module:Ge,entryPoint:"vs",buffers:$e},fragment:{module:Ge,entryPoint:"fs",targets:[Fe]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:q,multisample:X});return n=Sn(`md${t}x`,K,{fillOff:()=>j(c,ia,Tt,u),fillTest:()=>j(c,ia,Yr,u),lineOff:()=>j(B,H0,Tt,b),lineTest:()=>j(B,H0,Yr,b),bld:()=>j(k,X0,Yt,d)}),K0.set(i,n),n}let J0=null,eu=null;function hg(e){const t=e?eu:J0;if(t)return t;const i=T(nd(e?td:Ma,e?"BUILDING_CAST_CLIP_MD":"BUILDING_CAST_MD"),e?"buildingCastClip":"buildingCast"),n=l.createRenderPipeline({label:e?"mdCastClip":"mdCast",layout:e?xe.layCast.bld:se,vertex:{module:i,entryPoint:"vs",buffers:X0},fragment:{module:i,entryPoint:"fs",targets:[]},primitive:{topology:"triangle-list"},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less",depthBiasSlopeScale:3}});return e?eu=n:J0=n,n}function wg(e,t="main"){if(!Le[t])return;const i=self.__perfScene?performance.now():0;$l++;let n=null;!p.noFade&&!e.noFade&&t==="main"&&Le[t].draws.length&&Le[t].origin&&e.origin&&Le[t].origin[0]===e.origin[0]&&Le[t].origin[1]===e.origin[1]&&(_c(t),n={draws:Le[t].draws,bld:Le[t].bld},Le[t].draws=[],Le[t].bld=null),Oo(t);const o=[];for(let u of e.layers||[])if(u)if(u.kind==="fill"){if(!u.pos.length||xt&&u.pat)continue;const d=Vt(u.pos,GPUBufferUsage.VERTEX),b=Vt(k0(u.col),GPUBufferUsage.VERTEX),c=u.idx&&u.idx.length,B=c?Vt(u.idx instanceof Uint32Array?u.idx:Uint32Array.from(u.idx),GPUBufferUsage.INDEX):null,k=u.fx||null,X=u.pat||null;o.push({kind:"fill",li:u.li,bufs:B?[d,b,B]:[d,b],bPos:d,bCol:b,bIdx:B,count:c?u.idx.length:u.pos.length/2,fx:k,pat:X,lxk:zt(k,X),pz:u.pz||null})}else{if(xt&&u.dist&&(u=d1(u,e.origin)),!u.half.length)continue;const d=u.half.length,b=xt?null:u.jf||null,c=!!b,B=(Re,lt)=>{const ct=new Float32Array(Re.length+2);return ct.set(Re,lt?2:0),ct},k=Vt(c?B(u.P1,!0):u.P1,GPUBufferUsage.VERTEX),X=Vt(c?B(u.P2,!1):u.P2,GPUBufferUsage.VERTEX),j=new ArrayBuffer(d*8),Ge=new Uint8Array(j),$e=new Float32Array(j),q=k0(u.col);for(let Re=0;Re<d;Re++)Ge[Re*8]=q[Re*4],Ge[Re*8+1]=q[Re*4+1],Ge[Re*8+2]=q[Re*4+2],Ge[Re*8+3]=q[Re*4+3],$e[Re*2+1]=u.half[Re];const ue=Vt($e,GPUBufferUsage.VERTEX),Fe=u.off?Vt(u.off,GPUBufferUsage.VERTEX):null;let de=null;if(b||u.dist){const Re=new Float32Array(d*2);for(let lt=0;lt<d;lt++)Re[lt*2]=b?b[lt]:0,Re[lt*2+1]=u.dist?u.dist[lt]:0;de=Vt(Re,GPUBufferUsage.VERTEX)}(!Fe||!de)&&qf(d);const I=b?u.cj??0:0,ce=u.dist?Lu(u.dash,I):null,Pe=u.fx||null,mt=[k,X,ue];Fe&&mt.push(Fe),de&&mt.push(de),o.push({kind:"line",li:u.li,bufs:mt,bP1:k,bP2:X,bCH:ue,bOff:Fe,bJd:de,pad:c,count:d,cj:I,dash:ce,fx:Pe,lxk:Mn(I,ce?u.dash:void 0,Pe,u.lt),lt:u.lt||null,pz:u.pz||null})}let a=null;if(e.buildings&&e.buildings.pos.length){const u=Vt(e.buildings.pos,GPUBufferUsage.VERTEX),d=Vt(e.buildings.shade,GPUBufferUsage.VERTEX),b=Vt(e.buildings.anchor,GPUBufferUsage.VERTEX);a={bufs:[u,d,b],bPos:u,bSh:d,bAnc:b,count:e.buildings.pos.length/3}}if(Le[t]={origin:e.origin,draws:o,bld:a,fadePrev:n,fadeT0:n?performance.now():0},i){let u=0,d=0;for(const c of e.layers||[])if(c){d++;for(const B of["pos","col","idx","P1","P2","half","off"])c[B]&&(u+=c[B].byteLength)}e.buildings&&(u+=e.buildings.pos.byteLength+e.buildings.shade.byteLength+e.buildings.anchor.byteLength);const b=performance.now()-i;b>4&&(self.__perfHitch||={elev:0,scene:0}).scene++,console.log(`[scene] apply ${t} ${b.toFixed(1)}ms ${u/1024|0}KB layers=${d} fade=${n?1:0}`)}}const Pg=new Float32Array(Hm);let Qr=null,rl=0;function Mc(e,t,i){const n=Qo(i);e[t]=n.F[0],e[t+1]=n.F[1],e[t+2]=n.F[2],e[t+3]=0,e[t+4]=n.X[0],e[t+5]=n.X[1],e[t+6]=n.X[2],e[t+7]=0,e[t+8]=n.Y[0],e[t+9]=n.Y[1],e[t+10]=n.Y[2],e[t+11]=0,e[t+12]=n.E[0],e[t+13]=n.E[1],e[t+14]=n.E[2],e[t+15]=n.c}const Br=e=>_s?_s.fog:e;function tu(e,t,i){const n=lu,o=Math.hypot(i.eye[0],i.eye[1],i.eye[2])*6378137,a=(u,d)=>u?Math.max(d,Math.min(1,(o-u[0])/(u[1]-u[0]))):1;e[t]=n?n.dir[0]:0,e[t+1]=n?n.dir[1]:0,e[t+2]=n?n.dir[2]:1,e[t+3]=n?n.normal==="up"?2:1:0,e[t+4]=n?n.lambert[0]:1,e[t+5]=n?n.lambert[1]:0,e[t+6]=n?a(n.fade,0):0,e[t+7]=n&&n.night?a(n.night,.05):-1,e[t+8]=n?n.color[0]:1,e[t+9]=n?n.color[1]:1,e[t+10]=n?n.color[2]:1,e[t+11]=0}function gr(e,t,i,n,o,a,u,d,b){const c=Pg;if(xr!==1)for(let q=0;q<16;q++)c[q]=e.mvp[q]*xr;else c.set(e.mvp,0);Mc(c,16,e);const B=ir(t[0],t[1]),k=so(e.mvp,[B[0],B[1],B[2],1]);c[32]=k[0]*xr,c[33]=k[1]*xr,c[34]=k[2]*xr,c[35]=k[3]*xr;const X=t[0]*Math.PI/180,j=wd(t[1])*Math.PI/180;c[36]=Math.cos(X),c[37]=Math.sin(X),c[38]=Math.cos(j),c[39]=Math.sin(j),c[40]=B[0],c[41]=B[1],c[42]=B[2],c[43]=0,c[44]=e.eye[0],c[45]=e.eye[1],c[46]=e.eye[2],c[47]=0,c[48]=t[0],c[49]=t[1],c[50]=s.width,c[51]=s.height,c[52]=o[0],c[53]=o[1],c[54]=o[2],c[55]=0,c[56]=i,c[57]=n,c[58]=a,c[59]=u,c[60]=Ve.bounds[0],c[61]=Ve.bounds[1],c[62]=Ve.bounds[2],c[63]=Ve.bounds[3],c[64]=ti,c[65]=Ve.has,c[66]=Ve.edgeFade||0,c[67]=Ve.neg||0,c[68]=d?d[0]:0,c[69]=d?d[1]:0,c[70]=d?d[2]:0,c[71]=d?d[3]:0,c[72]=kt.bounds[0],c[73]=kt.bounds[1],c[74]=kt.bounds[2],c[75]=kt.bounds[3],c[76]=kt.has,c[77]=kt.edgeFade||0,c[78]=b||0,c[79]=Es;const Ge=Zo(),$e=t[1]*Math.PI/180;if(c[80]=Ge?Math.cos(2*$e):0,c[81]=Ge?Math.sin(2*$e):0,c[82]=Ge?Math.cos(4*$e):0,c[83]=Ge?Math.sin(4*$e):0,c[84]=Ge?1:0,c[85]=0,c[86]=ag?1:0,c[87]=cg,!d&&Qr&&(c[68]=Qr[0],c[69]=Qr[1],c[70]=Qr[2],c[71]=Qr[3],c[85]=rl),!d&&og&&(c[64]=0,c[65]=0,c[85]=0),Qi){const[q,ue,Fe,de]=Qi;d?(c[88]=(d[0]-q)/Fe,c[89]=(d[1]-ue)/de,c[90]=d[2]/Fe,c[91]=d[3]/de):(c[88]=(t[0]-q)/Fe,c[89]=(t[1]-ue)/de,c[90]=1/Fe,c[91]=1/de)}else c[88]=0,c[89]=0,c[90]=0,c[91]=0;{const q=Qo(e,t),ue=ha(t,Ve.bounds);c[108]=q.EO[0],c[109]=q.EO[1],c[110]=q.EO[2],c[111]=q.beta0,c[112]=ue[0],c[113]=ue[1],c[114]=ue[2],c[115]=ue[3]}c[116]=Dt[0],c[117]=Dt[1],c[118]=Dt[2],c[119]=Dt[3],tu(c,120,e);for(let q=0;q<4;q++){const ue=92+q*4,Fe=q<ve.n?ve.w[q]:null;if(!Fe){c[ue]=0,c[ue+1]=0,c[ue+2]=0,c[ue+3]=0;continue}const[de,I,ce,Pe]=Fe.win;d?(c[ue]=(d[0]-de)/ce,c[ue+1]=(d[1]-I)/Pe,c[ue+2]=d[2]/ce,c[ue+3]=d[3]/Pe):(c[ue]=(t[0]-de)/ce,c[ue+1]=(t[1]-I)/Pe,c[ue+2]=1/ce,c[ue+3]=1/Pe)}return c[132]=Qt.bounds[0],c[133]=Qt.bounds[1],c[134]=Qt.bounds[2],c[135]=Qt.bounds[3],c[136]=Qt.has,c[137]=Qt.edgeFade||0,c[138]=0,c[139]=xr!==1?1/xr:0,c[140]=sr.bounds[0],c[141]=sr.bounds[1],c[142]=sr.bounds[2],c[143]=sr.bounds[3],c[144]=sr.has&&Qt.has?1:0,c[145]=sr.edgeFade||0,c[146]=Lo&&U0?U0:sg,c[147]=0,c}const Uc=new Float32Array(St/4*sf);function Sg({cityLift:e,land:t,bldColor:i,contour:n,liftBounds:o,fadeK:a=1,worldHypsoK:u=0,hasClim:d=0,dpr:b=1}){const c=re.baseAlpha??1,B=Uc;B.fill(0);const k=($e,q)=>{const ue=$e*(St/4);for(let Fe=0;Fe<q.length;Fe++)B[ue+Fe]=q[Fe]};k(He.normal,[0,-e,0,c]),k(He.water,[0,0,0,c]),k(He.seaFb,[1,0,0,c]);const X=re.hypso,j=new Float32Array(12);l0(j,0,b),k(He.terrain,[t[0],t[1],t[2],0,X?X.color[0]:0,X?X.color[1]:0,X?X.color[2]:0,X?X.amount??.5:0,X?1/(X.max||3e3):0,u,d,re.globeAlpha??1,...j]),k(He.bld,[i[0],i[1],i[2],1]),k(He.contour,[n.color[0],n.color[1],n.color[2],n.interval,n.major,n.alpha,0,0]);const Ge=o||[0,0,0,0];return k(He.mesh,[Ge[0],Ge[1],Ge[2],Ge[3],i[0],i[1],i[2],0]),k(He.fadeNormal,[0,-e,0,a*c]),k(He.fadeWater,[0,0,0,a*c]),k(He.fadeSeaFb,[1,0,0,a*c]),k(He.fadeBld,[i[0],i[1],i[2],a]),k(He.user,[0,-e,0,1]),B}const Do=new Map;function Bg(e,t,i){let n=Do.get(i);if(!n||n.w!==e||n.h!==t){n&&(n.tex?.destroy(),n.depth.destroy());const o=i>1?l.createTexture({size:[e,t],sampleCount:i,format:U,usage:GPUTextureUsage.RENDER_ATTACHMENT}):null,a=l.createTexture({size:[e,t],sampleCount:i,format:$,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});n={tex:o,depth:a,view:o?o.createView():null,depthView:a.createView(),w:e,h:t},Do.set(i,n),cc=0;for(const[u,d]of Do)cc+=d.w*d.h*u*((u>1?4:0)+4)}return n}function Rc(e,t,i,n,o,a,u,d=null){const b=!(o&&o.skipMain)&&!(o&&o.noBld)?Le.main.bld:null,c=`${t.mvp.join(",")}|${_r}|${ti}|${rl}|${Qr?Qr.join(","):""}|${Yl}|${Ve.has}|${kt.has}|${a?1:0}|${u?JSON.stringify(u):""}|${u?(Le.main.origin||[0,0]).join(","):""}|${N0}|${d&&!u&&d.near?Qt.bounds.join(",")+(d.fine?"/"+sr.bounds.join(","):""):""}`,B=u?Wa():null,k=u?hs():null;if(i.castKey===c&&i.castBld===b)return Nt.skipped++,null;i.castKey=c,i.castBld=b;const X={colorAttachments:[],depthStencilAttachment:{view:i.view,depthLoadOp:"clear",depthClearValue:1,depthStoreOp:"store"},timestampWrites:hr?void 0:Xe("shadow")};let j;try{j=e.beginRenderPass(X)}catch(Fe){if(!J)throw Fe;pt(Fe),delete X.timestampWrites,j=e.beginRenderPass(X)}const Ge={bldTris:0,meshBatches:0,meshTris:0,terrTris:0};if(a){const Fe=tl.ibo?tl:vt,de=Du(Fe.chunks,vt.mesh,t.mvp,1+ku*(Ve.scale||0)),I=!B&&!!d&&d.near&&!!i.frameN;if(de.length){j.setPipeline(B?B.terr:I?Dr().terrNF:Dr().terr),j.setBindGroup(0,Ii(i,"bg0T")),B&&j.setBindGroup(1,xe.bg.terrain),j.setVertexBuffer(0,vt.vbo),j.setIndexBuffer(Fe.ibo,"uint32");for(const[ce,Pe]of de)j.drawIndexed(Pe,1,ce),Ge.terrTris+=Pe/3}if(I){const ce=1+ku*(Ve.scale||0),Pe=[[Qt.bounds,"bg0N"]];d.fine&&i.frameF&&Pe.push([sr.bounds,"bg0F"]);for(const[mt,Re]of Pe){const lt=Du(Fe.chunks,mt,t.mvp,ce);if(lt.length){j.setPipeline(Dr().terrNF),j.setBindGroup(0,Ii(i,Re)),j.setVertexBuffer(0,vt.vbo),j.setIndexBuffer(Fe.ibo,"uint32");for(const[ct,Ke]of lt)j.drawIndexed(Ke,1,ct),Ge.terrTris+=Ke/3}}}}const $e=Ii(i,"bg0"),q=!(o&&o.skipMain)&&!(o&&o.noBld)?Le.main.bld:null;if(q){const Fe=ma(mn,Ln,n.center,lo);j.setPipeline(B?B.bld:Dr().bld),j.setBindGroup(0,$e),j.setBindGroup(1,ye[He.bld]),j.setBindGroup(2,Tc(Fe,Le.main.origin||[0,0])),B&&j.setBindGroup(3,xe.bg.buildings),j.setVertexBuffer(0,q.bPos),j.setVertexBuffer(1,q.bSh),j.setVertexBuffer(2,q.bAnc),j.draw(q.count),Ge.bldTris=q.count/3}const ue=!(o&&o.skipMain)&&!(o&&o.noBld)&&Le.main.md?Le.main.md.bld:null;if(ue&&ue.length){const Fe=ma(mn,Ln,n.center,lo);j.setPipeline(hg(!!B)),j.setBindGroup(0,$e),j.setBindGroup(1,ye[He.bld]),j.setBindGroup(2,Tc(Fe,Le.main.origin||[0,0])),B&&j.setBindGroup(3,xe.bg.buildings),j.setVertexBuffer(0,yt.bldV.buf);for(const de of ue){j.setVertexBuffer(1,Le.main.md.orgBuf,de.orgOff);for(let I=0;I<de.counts.length;I++)j.draw(de.counts[I],1,de.firsts[I],I),Ge.bldTris+=de.counts[I]/3}}if(Ct.size){const Fe=[];for(const de of Ct.values()){if(Fe.length>=Ei)break;if(Ln.has(de.ward)||de.noCast||de.blend&&!de.pre||!t1(t.mvp,de.bbox,Jc))continue;const I=Fe.length,ce=I*(Ut/4),Pe=i.batchCPU,mt=so(t.mvp,[de.origin[0],de.origin[1],de.origin[2],1]);Pe[ce]=de.origin[0],Pe[ce+1]=de.origin[1],Pe[ce+2]=de.origin[2],Pe[ce+3]=0,Pe[ce+4]=mt[0]*xr,Pe[ce+5]=mt[1]*xr,Pe[ce+6]=mt[2]*xr,Pe[ce+7]=mt[3]*xr;const Re=de.textured&&(de.cut>0||de.pre);if(Pe[ce+8]=Re?de.pre?.5/255:de.cut:-1,Pe[ce+9]=0,Pe[ce+10]=de.noLift||de.baked?1:0,Pe[ce+11]=de.drape?1:0,u){const lt=ir(...Le.main.origin||[0,0]);Pe[ce+60]=de.origin[0]-lt[0],Pe[ce+61]=de.origin[1]-lt[1],Pe[ce+62]=de.origin[2]-lt[2]}M0(Pe,ce,de.xf),Fe.push({p:de,slot:I,mask:Re})}if(Fe.length){l.queue.writeBuffer(i.batch,0,i.batchCPU.buffer,0,Fe.length*Ut);for(const de of[!1,!0]){const I=Fe.filter(ce=>ce.mask===de);if(I.length){j.setPipeline(de?B?B.meshTex:Dr().meshTex:B?B.mesh:Dr().mesh),j.setBindGroup(0,$e),j.setBindGroup(1,ye[He.mesh]);for(const{p:ce,slot:Pe}of I)B&&!de&&j.setBindGroup(3,ce.textured?xe.bg.models:xe.bg.buildings),j.setBindGroup(2,B&&de?k.castPlBG[et.L.indexOf(i)]:i.batchBG,[Pe*Ut]),j.setVertexBuffer(0,ce.vbo),j.setVertexBuffer(1,ce.nbo),de&&(j.setVertexBuffer(2,ce.uvbo),j.setVertexBuffer(3,ce.cbo),j.setBindGroup(3,xc(ce))),j.setIndexBuffer(ce.ibo,"uint32"),j.drawIndexed(ce.count),Ge.meshTris+=ce.count/3}}Ge.meshBatches=Fe.length}}return j.end(),Nt.passes++,et&&i===et.L[0]&&(Nt.last={N:an,halfM:t.texelM*an/2,texelM:t.texelM,altDeg:t.alt*180/Math.PI,mvp:Array.from(t.mvp),...Ge}),Ge}let rr=null,Ac=null;function Fg(e,t){rr&&la();const i=s.width,n=s.height;if(!i||!n)return!1;const o=t&&t.aa===!1?1:oe;nt=fs(o),zl=o;const a=mv(e,i,n);Il=a,r0=e,Ms=Sv(Ms,t0,a.camDist,dr()),Es=re.csAtmo&&re.csAtmo.ground!==!1?Bv((Math.hypot(a.eye[0],a.eye[1],a.eye[2])-1)*6378137,Math.abs(Math.cos(e.pitch||0)),re.csAtmo.fogDensity):0,t0=a.camDist,a.fogDist=Ms;const u=Ms!==a.camDist,d=Fv(e.pitch),b=Gv(e.pitch);ti=Ve.scale*b;const c=v=>v&&v[3]<1?[v[0]*v[3]+(1-v[3]),v[1]*v[3]+(1-v[3]),v[2]*v[3]+(1-v[3]),1]:v,B=c(re.land)||[.96,.96,.95,1],k=re.atmo||[.45,.62,.95,.6],X=sn.on&&e.zoom>=13?Kv(Mu(sn.time??Zc(re.clock)),e.center,Qv(e.zoom,e.center[1],i,n,e.dpr||1),an):null;let j=[];if(X&&Fl>1){const v=[];for(let y=0;y<=6;y++)for(let it=0;it<=6;it++){const De=df(a,i*it/6,n*y/6);De&&v.push(ir(De[0],De[1]))}j=r1(X,v,a.eye,an,Fl-1)}const Ge=ur?{terrain:ya(ur,"terrain"),buildings:ya(ur,"buildings"),models:ya(ur,"models"),vector:ya(ur,"vector")}:null,$e=ur?{terrain:ba(ur,"terrain"),buildings:ba(ur,"buildings"),models:ba(ur,"models"),vector:ba(ur,"vector")}:null,q=!!Ge&&(Ge.terrain.length+Ge.buildings.length+Ge.models.length+Ge.vector.length>0||!!($e.terrain||$e.buildings||$e.models||$e.vector)),ue=!X&&!q&&(e.pitch||0)<.02&&e.zoom>=9&&!nc&&!ve.rasterOn,Fe=!ue&&!!re.clearAlpha&&!!re.clear&&re.clear[3]<1;L(Fe);const de=ue?[B[0],B[1],B[2],1]:Fe?re.clear:c(re.clear)||[1,1,1,1],I=Tv(a.camDist),ce=_v(a.fogDist,d,dr()),Pe=!!(vt&&Ve.has&&ti>1e-9)&&!(t&&t.noTerrain);Lo=!!(t&&t.moving),Pe&&Ap(Lo),Qr=Pe?vt.mesh:null,rl=Pe?vt.G:0;const mt=Pe,lt=5*zv(e.zoom,mt),ct=wr.li>=0&&(e.pitch||0)>=.02,Ke=e.dpr||1,Qe=Le.main.origin||[0,0],ht=[e.center[0],e.center[1]],In=xv(Le.main.origin,e.center),hn=[e.center[0],e.center[1]];{const v=Mu(Zc(re.clock)),y=ir(hn[0],hn[1]),it=(v[0]*y[0]+v[1]*y[1]+v[2]*y[2])/Math.hypot(y[0],y[1],y[2]),De=Math.max(0,Math.min(1,(it+.1045)/.209));Dt[0]=v[0],Dt[1]=v[1],Dt[2]=v[2],Dt[3]=De*De*(3-2*De)}const Zr=M.pbr?`${Dt[0].toFixed(3)},${Dt[1].toFixed(3)},${Dt[2].toFixed(3)}|${Math.round(hn[0]*2)},${Math.round(hn[1]*2)}|${re.atmScale??4},${re.atmSun??20},${re.pbrFill??.35}`:"";Zr&&Zr!==Bl.key&&(Bl.key=Zr,Bl.env=$m([Dt[0],Dt[1],Dt[2]],ir(hn[0],hn[1]),{k:re.atmScale??4,sunI:re.atmSun??20,fill:re.pbrFill??.35}));const It=Bl.env;It.lp[3]=1-Dt[3],G0();const Hr=t&&t.skipMain?["base"]:t&&t.skipBase?["main"]:["base","main"],bt=Le.user.draws.length>0;bt&&Hr.push("user");const il=Jp(e,Pe,Hr);l.queue.writeBuffer(r,qn.base*Et,gr(a,Le.base.origin||[0,0],fl(a.fogDist,dr()),ce,Br(B),I,Ke)),l.queue.writeBuffer(r,qn.main*Et,gr(a,Qe,fl(a.fogDist,dr()),ce,Br(B),I,Ke));const wn=re.distColor||[.63,.72,.83];l.queue.writeBuffer(r,qn.terrain*Et,gr(a,ht,ul(a.fogDist,d,dr()),ce,Br(wn),I,Ke,vt?vt.mesh:null));const Jr=Pe&&kt.has&&!!Sr;Jr&&l.queue.writeBuffer(r,qn.terrainFar*Et,gr(a,ht,ul(a.fogDist,d,dr()),ce,Br(wn),I,Ke,kt.bounds,1));const kg=Pe?Ws(vt.mesh,a,"near"):null,Ig=Jr?Ws(kt.bounds,a,"far"):null;Jr||(An.far.drawn=0,An.far.of=0);const ll=Pe&&Qt.has&&!!vn;ll&&l.queue.writeBuffer(r,qn.terrainNear*Et,gr(a,ht,ul(a.fogDist,d,dr()),ce,Br(wn),I,Ke,Qt.bounds,2));const Ng=ll?Ws(Qt.bounds,a,"fine"):null;ll||(An.fine.drawn=0,An.fine.of=0);const eo=ll&&sr.has;eo&&l.queue.writeBuffer(r,qn.terrainFine*Et,gr(a,ht,ul(a.fogDist,d,dr()),ce,Br(wn),I,Ke,sr.bounds,3));const Vg=eo?Ws(sr.bounds,a,"foot"):null;if(eo||(An.foot.drawn=0,An.foot.of=0),l.queue.writeBuffer(r,qn.bld*Et,gr(a,Qe,fl(a.fogDist,dr()),wa(a.fogDist,dr()),Br(B),I,Ke)),bt&&l.queue.writeBuffer(r,qn.user*Et,gr(a,Le.user.origin||[0,0],fl(a.fogDist,dr()),ce,Br(B),I,Ke)),X){cn();const v=[X,...j];for(let S=0;S<v.length;S++){const rt=et.L[S],Mt=v[S];l.queue.writeBuffer(rt.frameB,0,gr({mvp:Mt.mvp,invMvp:a.invMvp,eye:X.eye,rays:a.rays},Qe,a.fogDist*2.5,a.fogDist*14,Br(B),I,Ke)),Pe&&l.queue.writeBuffer(rt.frameT,0,gr({mvp:Mt.mvp,invMvp:a.invMvp,eye:a.eye,rays:a.rays},ht,ul(a.fogDist,d,1),ce,Br(wn),I,Ke,vt.mesh)),ll&&rt.frameN&&l.queue.writeBuffer(rt.frameN,0,gr({mvp:Mt.mvp,invMvp:a.invMvp,eye:a.eye,rays:a.rays},ht,ul(a.fogDist,d,1),ce,Br(wn),I,Ke,Qt.bounds,2)),eo&&rt.frameF&&l.queue.writeBuffer(rt.frameF,0,gr({mvp:Mt.mvp,invMvp:a.invMvp,eye:a.eye,rays:a.rays},ht,ul(a.fogDist,d,1),ce,Br(wn),I,Ke,sr.bounds,3))}const y=ir(e.center[0],e.center[1]),it=[Math.fround(y[0]),Math.fround(y[1]),Math.fround(y[2])],De=so(X.mvp,[it[0],it[1],it[2],1]),V=et.cpu;V.fill(0),V.set(X.mvp,0),V[16]=De[0],V[17]=De[1],V[18]=De[2],V[19]=De[3],V[20]=it[0],V[21]=it[1],V[22]=it[2],V[23]=0,V[24]=n1(X.alt,sn.darkness),V[27]=jn;const ft=[...j.map((S,rt)=>({w:S,s:S.s,ox:S.ox,oy:S.oy,layer:rt+1})),{w:X,s:1,ox:0,oy:0,layer:0}];ft.forEach((S,rt)=>{V[28+rt*4]=S.s,V[29+rt*4]=S.ox,V[30+rt*4]=S.oy,V[31+rt*4]=S.layer,V[40+rt*4]=Iu(S.w),V[41+rt*4]=1/an,V[42+rt*4]=S.w.texelM,V[43+rt*4]=Math.min(1/Math.tan(X.alt),6)*S.w.texelM*an/X.zRangeM}),V[52]=ft.length,V[53]=X.zRangeM,V[54]=us,V[55]=bo,l.queue.writeBuffer(et.pBuf,0,V),Nt.cascades=ft.map(S=>({layer:S.layer,halfM:Math.round(S.w.texelM*an/2),texelM:+S.w.texelM.toFixed(3)}))}const Ci=q?ir(Qe[0],Qe[1]):null;if(Zn=q&&(Ge.vector.length||$e.vector)?{planes:Ge.vector,poly:$e.vector,st:a}:null,Ci){ms();const v=ur.style;mi.forEach((y,it)=>{const De=y==="globe"?"terrain":y,V=y==="base"||y==="user"?Le[y].origin||[0,0]:y==="terrain"?ht:y==="globe"?In:Qe,ft=Ge[De]||Ge.vector,S=$e[De]??(De in $e?null:$e.vector);zu(ft,ir(V[0],V[1]),xe.cpu.subarray(it*zr/4,it*zr/4+xa),{...v,capOn:v.capOn&&ft.length>0},S)}),l.queue.writeBuffer(xe.buf,0,xe.cpu)}vg(),rg(il);const Vc=Math.max(0,Math.min(1,((e.pitch||0)-.01)/.05)),Wg=1-Math.max(0,Math.min(1,(e.zoom-17.5)/1.5)),uu=ve.rasterOn&&!!(xn&&xn.hideFills),du=Ve.has&&!(t&&t.noTerrain)&&re.showContour===!0&&!uu?(1-Vc*Vc*(3-2*Vc))*Wg:0,pu=e.zoom>=15?15:e.zoom>=12?30:60;let Wc=1,to=!1;if(Le.main.fadePrev){const v=performance.now()-Le.main.fadeT0;v>=vd?_c("main"):(Wc=v/vd,to=!0)}const fa=re.worldHypsoZ??6.5,ko=re.worldHypso&&Ve.has?Uu(e.zoom,fa):0;ko>0&&cp(re.worldHypso.clim),Ja(),Ir(e),l.queue.writeBuffer(f,0,Sg({dpr:e.dpr||1,fadeK:Wc,cityLift:lt,land:B,bldColor:re.bldColor||[.86,.86,.85],contour:{color:re.contourColor||[.42,.3,.18],interval:pu,major:pu*5,alpha:du*(re.contourAlpha||1)},liftBounds:Ve.liftBounds,worldHypsoK:ko,hasClim:Vl?1:0}));for(let v=0;v<2;v++){const y=v*(St/4);Cc.set(Uc.subarray(He.normal*(St/4),He.normal*(St/4)+12),y),Cc[y+46]=v+1}if(l.queue.writeBuffer(j0,0,Cc),!ue){const v=new Float32Array(128);Mc(v,0,a);const y=Fe&&re.land?re.land:B;v[16]=y[0],v[17]=y[1],v[18]=y[2],v[19]=y[3]??1,v[20]=k[0],v[21]=k[1],v[22]=k[2],v[23]=k[3],v[24]=Ve.bounds[0],v[25]=Ve.bounds[1],v[26]=Ve.bounds[2],v[27]=Ve.bounds[3],v[28]=ko,v[29]=Ve.has?1:0,v[30]=Zo()?1:0,v[31]=Vl?1:0;const it=Ja().sea;v[32]=it[0],v[33]=it[1],v[34]=it[2],v[35]=re.graticule?Cv(e.zoom,fa):0,v[36]=kt.bounds[0],v[37]=kt.bounds[1],v[38]=kt.bounds[2],v[39]=kt.bounds[3],v[40]=kt.has,v[41]=Ve.edgeFade||0,v[44]=re.globeAlpha??1;const De=re.csAtmo;v[45]=De&&De.ground!==!1?Ev((1+a.camDist)*6378137):0,v[46]=De?1:0,v[47]=De&&De.sky!==!1?1:0,v[42]=Es,v[43]=re.globeDepth?I*.5:0;{const V=De?.skyHsb;V&&(v[124]=V[0],v[125]=V[1],v[126]=V[2])}v[48]=Dt[0],v[49]=Dt[1],v[50]=Dt[2],v[51]=M.atmosphere&&re.worldHypso?Uu(e.zoom,fa):0;{const V=Qo(a,In);v[52]=V.O[0],v[53]=V.O[1],v[54]=V.O[2],v[55]=V.rho,v[56]=V.ll[0],v[57]=V.ll[1],v[58]=V.beta0,v[59]=0,v[60]=V.EO[0],v[61]=V.EO[1],v[62]=V.EO[2],v[63]=0,v.set(ha(In,Qi),68);for(let ft=0;ft<4;ft++)v.set(ha(In,ft<ve.n?ve.w[ft].win:null),72+ft*4);v.set(ha(In,Ve.bounds),88)}tu(v,92,a),v[103]=re.globeBack?1:0,l0(v,104,e.dpr||1);{const V=re.underground;v.set(V?[V.color[0],V.color[1],V.color[2],V.color[3],V.nf[0]/6378137,V.nf[1],V.nf[2]/6378137,V.nf[3]]:[0,0,0,-1,0,1,1,1],116)}v[64]=re.atmSun??20,v[65]=re.atmExposure??1,v[66]=re.atmGround??.5,v[67]=re.atmScale??4,l.queue.writeBuffer(g,0,v)}const ua=ue?0:Mv(e.zoom),gu=Xi||Rl||$i?ua:0,qg=re.showConst&&(Rl||Bo||Fo);if(ua>0){const v=Zc(re.clock),y=rv(v),it=Uv(e.zoom),[De,V]=nv(v),ft=Math.cos(V),S=Af;S.set(a.mvp,0),Mc(S,16,a),S[32]=Math.cos(y),S[33]=Math.sin(y),S[34]=gu,S[35]=it,S[36]=i,S[37]=n,S[40]=ft*Math.cos(De),S[41]=Math.sin(V),S[42]=ft*Math.sin(De),S[43]=.5*ua*(re.globeAlpha??1),l.queue.writeBuffer(Xa,0,Af)}const si=Bg(i,n,o),Pn=l.createCommandEncoder();ae||(ae=1,l.pushErrorScope("validation")),J&&(J.idx=0,J.spans.length=0);const Nn=X?ds(o):null,Vn=Ci?ys(o):null,Io=Vn&&Nn?Va(o):null,vu=Io?hs():null,br=Io||Vn||Nn||nt,ar=v=>Io?vu.bg[v]:Vn?xe.bg[v]:Nn?et.bg:null;if(sn.on&&(Nt.active=!!X),X){const v={near:!!ll,fine:!!eo};Rc(Pn,X,et.L[0],e,t,Pe,Ci?Ge:null,v),j.forEach((y,it)=>Rc(Pn,y,et.L[it+1],e,t,Pe,Ci?Ge:null,v))}const ol=o>1?si.view:Z.getCurrentTexture().createView(),qc={timestampWrites:Xe("map"),colorAttachments:[{view:ol,loadOp:"clear",clearValue:{r:de[0]*de[3],g:de[1]*de[3],b:de[2]*de[3],a:de[3]},storeOp:"store"}],depthStencilAttachment:{view:si.depthView,depthLoadOp:"clear",depthClearValue:Me,depthStoreOp:"store",stencilLoadOp:"clear",stencilStoreOp:"store"}};let m;try{m=Pn.beginRenderPass(qc)}catch(v){if(!J)throw v;pt(v),delete qc.timestampWrites,m=Pn.beginRenderPass(qc)}if(gu>0&&(m.setBindGroup(0,Lf),Xi&&(m.setPipeline(nt.stars),m.setVertexBuffer(0,Xi.buf),m.draw(6,Xi.count)),$i&&(m.setPipeline(nt.stars),m.setVertexBuffer(0,$i.buf),m.draw(6,$i.count)),qg)){$a!==!!re.skySolar&&($a=!!re.skySolar,l.queue.writeBuffer(Ss,Hi.constel*qi,new Float32Array([.47,.63,1,.4*($a?.55:1)]))),m.setPipeline(nt.starLine);for(const[v,y]of[[Rl,Hi.constel],[re.skySolar?null:Bo,Hi.ecliptic],[re.skySolar?null:Fo,Hi.celeq]])v&&(m.setBindGroup(1,Yd[y]),m.setVertexBuffer(0,v.buf),m.draw(v.count))}if(ue||(m.setPipeline(re.globeDepth&&br===nt?Xt(zl):br.globe),m.setBindGroup(0,h),ar("globe")&&m.setBindGroup(1,ar("globe")),m.draw(3)),Pe){m.setPipeline(br.terrain),m.setBindGroup(0,tr.terrain),m.setBindGroup(1,ye[He.terrain]),m.setBindGroup(2,s0),ar("terrain")&&m.setBindGroup(3,ar("terrain")),m.setVertexBuffer(0,vt.vbo),m.setIndexBuffer(tl.ibo,"uint32");for(const[v,y]of kg)m.drawIndexed(y,1,v);if(Jr){m.setBindGroup(0,tr.terrainFar);for(const[v,y]of Ig)m.drawIndexed(y,1,v)}if(ll){m.setBindGroup(0,tr.terrainNear);for(const[v,y]of Ng)m.drawIndexed(y,1,v)}if(eo){m.setBindGroup(0,tr.terrainFine);for(const[v,y]of Vg)m.drawIndexed(y,1,v)}if(Vn&&Ge.terrain.length&&ur.style.capOn){const v=ir(ht[0],ht[1]),y=Ge.terrain;un(0,y,v,ht,vt.mesh,e.center,!1),Jr&&un(1,y,v,ht,kt.bounds,e.center,!0),l.queue.writeBuffer(xe.capBuf,0,xe.capCPU),m.setPipeline(Vn.cap),m.setBindGroup(0,tr.terrain),m.setBindGroup(1,xe.capBG[0]),m.draw(6,y.length),Jr&&(m.setBindGroup(0,tr.terrainFar),m.setBindGroup(1,xe.capBG[1]),m.draw(6,y.length))}}if(du>.003&&e.zoom>=9&&(m.setPipeline(nt.contour),m.setBindGroup(0,tr.main),m.setBindGroup(1,ye[He.contour]),m.draw(3)),ko>0&&!uu){const v=y=>gr(a,y,fl(a.fogDist,dr()),wa(a.fogDist,dr()),Br(B),I,Ke);np(m,v,a),ip(m,v,a,ko)}pr={baseFill:0,baseLine:0,mainFill:0,mainLine:0,pt:0,ptw:0,textMid:0,skipMain:!!(t&&t.skipMain),skipBase:!!(t&&t.skipBase),fadeK:Wc,terrainDepth:!!mt,zoom:+(e.zoom||0).toFixed(1),aa:o,get raster(){return ve.rasterOn?ve.tiles:0},get fillsIn(){return ve.fillsIn},get gndFaces(){return ve.fillsIn?ve.faces:0}},pr.shadow=X?+(X.alt*180/Math.PI).toFixed(1):0;const No=t&&t.skipMain?["base"]:t&&t.skipBase?["main"]:["base","main"];bt&&No.push("user");const mu=No.indexOf("main")>=0&&ra(Le.main),Hg=mt?br.fillTest:br.fillOff,xu=mt?br.lineTest:br.lineOff,bu=ve.fillsIn||!!(xn&&xn.hideFills&&ve.rasterOn),Xg=(v,y,it)=>{const De=v==="user";if(y.kind==="fill"){if(De?ve.fillsIn:bu)return;const V=Pa(y.li)!=null,ft=y.li===Wr.li||y.li===Wr.li2;if((V||ft)&&e.zoom<Wr.minzoom||ct&&y.li===wr.li)return;const S=Nn&&!Vn&&y.li===wr.li,rt=De?He.user:it?V?He.fadeSeaFb:ft?He.fadeWater:He.fadeNormal:V?He.seaFb:ft?He.water:He.normal,Mt=pn.get(y.li)??y.pz,Q=Mt?Vi(Mt):null,nr=y.lxk||Q?Mf(rt,(y.lxk??"f")+El(Q,0),y.fx,y.pat,Le[v].origin,Q):ye[rt];if(!nr)return;const ut=S?mt?nt.fillTest:nt.fillOff:Hg;if(!ut)return;m.setPipeline(ut),m.setBindGroup(0,tr[v]),m.setBindGroup(1,nr),!S&&ar(v)&&m.setBindGroup(2,ar(v)),m.setVertexBuffer(0,y.bPos),m.setVertexBuffer(1,y.bCol),y.bIdx?(m.setIndexBuffer(y.bIdx,"uint32"),m.drawIndexed(y.count)):m.draw(y.count),v==="base"?pr.baseFill++:pr.mainFill++}else{if(v==="base"&&mu)return;const V=De?He.user:it?He.fadeNormal:He.normal,ft=pn.get(y.li)??y.pz,S=ft?Vi(ft):null,rt=y.lxk||S?Uf(V,(y.lxk??"l")+El(S,0),y.cj,y.dash,y.fx,0,y.lt,S):ye[V];if(!rt||!xu)return;m.setPipeline(xu),m.setBindGroup(0,tr[v]),m.setBindGroup(1,rt),ar(v)&&m.setBindGroup(2,ar(v)),m.setVertexBuffer(0,Ts),m.setVertexBuffer(1,y.bP1,y.pad?8:0),m.setVertexBuffer(2,y.bP2),m.setVertexBuffer(3,y.bCH),m.setVertexBuffer(4,y.bOff||Eo),m.setVertexBuffer(5,y.bP1),m.setVertexBuffer(6,y.bP2,y.pad?8:0),m.setVertexBuffer(7,y.bJd||Eo),$f(m,y.count),v==="base"?pr.baseLine++:pr.mainLine++}},da=yt?Z0(Io?"cr":Vn?"c":Nn?"r":"p",o):null,$g=(v,y,it)=>{if(y.kind==="fill"){if(bu||xt&&y.pat)return;const De=Pa(y.li)!=null,V=y.li===Wr.li||y.li===Wr.li2;if((De||V)&&e.zoom<Wr.minzoom||ct&&y.li===wr.li)return;const ft=Nn&&!Vn&&y.li===wr.li,S=ft?Z0("p",o):da,rt=De?He.seaFb:V?He.water:He.normal,Mt=pn.get(y.li)??y.pz,Q=Mt?Vi(Mt):null,nr=y.lxk||Q||y.pt?Mf(rt,(y.lxk??"f")+El(Q,y.pt),y.fx,y.pat||null,Le[v].origin,Q,y.pt):ye[rt];if(!nr)return;m.setPipeline(mt?S.fillTest:S.fillOff),m.setBindGroup(0,tr[v]),m.setBindGroup(1,nr),m.setBindGroup(2,(ft?null:ar(v))||q0),m.setBindGroup(3,zc()),m.setVertexBuffer(0,yt.fillV.buf),m.setVertexBuffer(1,it,y.orgOff),m.setIndexBuffer(yt.fillI.buf,"uint32");const ut=y.counts,vr=y.offsets;for(let Wt=0;Wt<ut.length;Wt++)m.drawIndexed(ut[Wt],1,vr[Wt]>>2,0,Wt);v==="base"?pr.baseFill+=ut.length:pr.mainFill+=ut.length,y.pt&&(pr.pt+=ut.length)}else{if(v==="base"&&mu||!yt.lineBG)return;const De=pn.get(y.li)??y.pz,V=De?Vi(De):null,ft=y.lxk||V||y.pt?Uf(He.normal,(y.lxk??"l")+El(V,y.pt),y.cj,y.dash,y.fx,(y.dash||y.lt?.pat)&&V?.off!=null?V.off:0,y.lt,V,y.pt):ye[He.normal];if(!ft)return;m.setPipeline(mt?da.lineTest:da.lineOff),m.setBindGroup(0,tr[v]),m.setBindGroup(1,ft),m.setBindGroup(2,ar(v)||q0),m.setBindGroup(3,yt.lineBG),m.setVertexBuffer(0,it,y.orgOff);const S=y.counts,rt=y.firsts;for(let Mt=0;Mt<S.length;Mt++)m.draw(S[Mt],1,rt[Mt],Mt);v==="base"?pr.baseLine+=S.length:pr.mainLine+=S.length,y.pt&&(pr.pt+=S.length),y.pt===2&&(pr.ptw+=S.length)}},Vo=(v,y,it,De,V,ft=null)=>{if(Array.isArray(y)){for(const S of y)(ft?ft(S):S.li>=De&&S.li<V)&&Xg(v,S,it);return}for(const S of y.layers)(ft?ft(S):S.li>=De&&S.li<V)&&$g(v,S,y.orgBuf)},ro=Zf(bt?[...No].reverse().find(v=>v!=="user"&&ra(Le[v])):null),Hc=Mo?Mo.midAnchors():[],yu=Hc.length?[...No].reverse().find(v=>v!=="user"&&ra(Le[v]))??null:null,hu={format:U,samples:o,depth:$,W:i,H:n,dpr:Ke};let wu=!1;for(const v of No){if(v==="user"){Vo("user",Le.user.draws,!1,-1/0,1/0,wu?De=>ro.anchorOf(De.li)===1/0:null);continue}const y=Le[v],it=y.md?[[y.md,!1]]:v==="main"&&to?[[y.fadePrev.draws,!1],[y.draws,!0]]:[[y.draws,!1]];it.forEach(([De,V],ft)=>{if(Array.isArray(De)?!De.length:!De.layers.length)return;const S=ft===it.length-1,rt=v===ro.host&&S&&ro.anchors.length>0,Mt=v===yu&&S;if(!rt&&!Mt){Vo(v,De,V,-1/0,1/0);return}const Q=[...new Set([...rt?ro.anchors:[],...Mt?Hc:[]])].sort((ut,vr)=>ut-vr);let nr=-1/0;for(const ut of Q)Vo(v,De,V,nr,ut),rt&&ro.anchors.includes(ut)&&Vo("user",Le.user.draws,!1,0,0,vr=>ro.anchorOf(vr.li)===ut),Mt&&(pr.textMid+=Mo.drawMid(m,ut,ut+1,hu)),nr=ut;Vo(v,De,V,nr,1/0),rt&&(wu=!0)})}Hc.length&&!yu&&(pr.textMid+=Mo.drawMid(m,-1/0,1/0,hu)),op(m,a,v=>gr(a,v,fl(a.fogDist,dr()),wa(a.fogDist,dr()),Br(B),I,Ke),e.zoom||0),!ue&&re.graticule&&h&&e.zoom>1.7&&e.zoom<fa&&(m.setPipeline(nt.grat),m.setBindGroup(0,h),m.draw(3)),m.setStencilReference(128);const Wo=(e.pitch||0)>=.02,Yg=ma(mn,Ln,e.center,lo),Xc=Tc(Yg,Le.main.origin||[0,0]),qo=Wo&&!(t&&t.skipMain)&&!(t&&t.noBld)?Le.main.bld:null,Ho=Wo&&!(t&&t.skipMain)&&!(t&&t.noBld)&&to?Le.main.fadePrev.bld:null;Ho&&br.bld&&(m.setPipeline(br.bld),m.setBindGroup(0,tr.bld),m.setBindGroup(1,ye[He.bld]),m.setBindGroup(2,Xc),ar("buildings")&&m.setBindGroup(3,ar("buildings")),m.setVertexBuffer(0,Ho.bPos),m.setVertexBuffer(1,Ho.bSh),m.setVertexBuffer(2,Ho.bAnc),m.draw(Ho.count)),qo&&br.bld&&(m.setPipeline(br.bld),m.setBindGroup(0,tr.bld),m.setBindGroup(1,ye[to?He.fadeBld:He.bld]),m.setBindGroup(2,Xc),ar("buildings")&&m.setBindGroup(3,ar("buildings")),m.setVertexBuffer(0,qo.bPos),m.setVertexBuffer(1,qo.bSh),m.setVertexBuffer(2,qo.bAnc),m.draw(qo.count));const $c=Wo&&!(t&&t.skipMain)&&!(t&&t.noBld)&&Le.main.md?Le.main.md.bld:null;if($c&&$c.length){m.setPipeline(da.bld),m.setBindGroup(0,tr.bld),m.setBindGroup(1,ye[He.bld]),m.setBindGroup(2,Xc),ar("buildings")&&m.setBindGroup(3,ar("buildings")),m.setVertexBuffer(0,yt.bldV.buf);for(const v of $c){m.setVertexBuffer(1,Le.main.md.orgBuf,v.orgOff);for(let y=0;y<v.counts.length;y++)m.draw(v.counts[y],1,v.firsts[y],y)}}if(wi){Ka(),l.queue.writeBuffer(To,Ll*Et,gr(a,wi.origin,fl(a.fogDist,dr()),wa(a.fogDist,dr()),Br(B),I,Ke)),m.setBindGroup(0,Rn,[Ll*Et]),m.setBindGroup(2,ig);for(let v=0;v<wi.batches.length;v++){const y=wi.batches[v],it=y.color||re.bldColor||[.86,.86,.85],De=(Ll+v)*(St/4);Cr[De]=it[0],Cr[De+1]=it[1],Cr[De+2]=it[2],Cr[De+3]=1,l.queue.writeBuffer(_o,(Ll+v)*St,Cr.buffer,(Ll+v)*St,St),m.setBindGroup(1,yi,[(Ll+v)*St]),y.line&&(m.setPipeline(nt.gbLine),m.setVertexBuffer(0,y.line.bPos),m.setVertexBuffer(1,y.line.bSh),m.setVertexBuffer(2,y.line.bAnc),m.draw(y.line.count)),y.point&&(m.setPipeline(nt.gbPoint),m.setVertexBuffer(0,y.point.bPos),m.setVertexBuffer(1,y.point.bSh),m.setVertexBuffer(2,y.point.bAnc),m.draw(y.point.count))}}if(Ct.size&&Pe&&((re.globeAlpha??1)<1||re.meshOverGround&&!nl&&!bn&&!Xl.size)&&(m.end(),m=Pn.beginRenderPass({colorAttachments:[{view:ol,loadOp:"load",storeOp:"store"}],depthStencilAttachment:{view:si.depthView,depthLoadOp:"clear",depthClearValue:Me,depthStoreOp:"store",stencilLoadOp:"load",stencilStoreOp:"store"}}),m.setStencilReference(128)),Ct.size&&(Wo||Lp())){const v=.5*Math.max(a.W,a.H),y=iv(Rv(e.zoom),e.zoom),it=Math.cos((e.center[1]||0)*Math.PI/180),De=Eu(a.eye),V=[],ft=lv(e.centerAlt);Zt.of=Ct.size,Zt.cull=Zt.lod0=Zt.hidden=Zt.tris=Zt.pre=0,Zt.shed=_u();for(const S of Ct.values()){if(V.length>=Ul&&!Rf(V.length+1)){Yf||(Yf=!0,console.warn(`[gpu] mesh visible batches exceed ${cf} = truncated`));break}if(!Wo&&!S.keep2d)continue;if(Ln.has(S.ward)){Zt.hidden++;continue}if(!bv(a,yv(S.bbox,S.origin,S.xf),e.center,De,v,Eu(S.xf?[S.origin[0]+S.xf[9],S.origin[1]+S.xf[10],S.origin[2]+S.xf[11]]:S.origin)[2],S.noLift?0:ft)){Zt.cull++;continue}const rt=ov(S,e.center,it,y);if(!rt){Zt.lod0++;continue}Zt.tris+=rt/3;const Mt=V.length,Q=Mt*(Ut/4),nr=so(a.mvp,[S.origin[0],S.origin[1],S.origin[2],1]);ie[Q]=S.origin[0],ie[Q+1]=S.origin[1],ie[Q+2]=S.origin[2],ie[Q+3]=S.wind&&(Fr||S.csLit==="phong")&&S.csLit!=="off"?2:S.two||S.noCull?0:1,ie[Q+4]=nr[0]*xr,ie[Q+5]=nr[1]*xr,ie[Q+6]=nr[2]*xr,ie[Q+7]=nr[3]*xr,ie[Q+8]=S.cut??-1,ie[Q+9]=ca(S),ie[Q+10]=S.noLift||S.baked?1:0,ie[Q+11]=S.drape?1:0;const ut=S.pbr;if(ie[Q+12]=ut?ut.metallic:0,ie[Q+13]=ut?ut.roughness:1,ie[Q+14]=ut?ut.normalScale:1,ie[Q+15]=ut?ut.occlusion:1,ie[Q+16]=ut?ut.emissive[0]:0,ie[Q+17]=ut?ut.emissive[1]:0,ie[Q+18]=ut?ut.emissive[2]:0,ie[Q+19]=M.pbr?1:0,ie.set(It.lp,Q+20),ie.set(It.sh,Q+24),Jl?(ie[Q+64]=Jl.n,ie.set(Jl.data,Q+68)):ie[Q+64]=0,M0(ie,Q,S.xf),zi){const Wt=zi.color||[1,1,1];ie[Q+212]=zi.dir[0],ie[Q+213]=zi.dir[1],ie[Q+214]=zi.dir[2],ie[Q+215]=1,ie[Q+216]=Wt[0],ie[Q+217]=Wt[1],ie[Q+218]=Wt[2],ie[Q+219]=zi.intensity??.5}else ie[Q+215]=0;if(S.flat?(ie[Q+268]=S.flat[0],ie[Q+269]=S.flat[1],ie[Q+270]=S.flat[2],ie[Q+271]=1):ie[Q+271]=0,ie[Q+220]=S.colSrgb?1:0,Fr){ie[Q+224]=Fr.dir[0],ie[Q+225]=Fr.dir[1],ie[Q+226]=Fr.dir[2],ie[Q+227]=S.csLit==="off"?0:S.csLit==="unlit"?2:1,ie[Q+228]=Fr.color[0],ie[Q+229]=Fr.color[1],ie[Q+230]=Fr.color[2],ie[Q+231]=Fr.invL00,ie[Q+232]=Fr.ibl[0],ie[Q+233]=Fr.ibl[1],ie[Q+234]=Nl?1:0,ie[Q+235]=tc;const Wt=S.sh??Fr.sh;for(let Gr=0;Gr<9;Gr++)ie[Q+24+Gr*4]=Wt[Gr*3],ie[Q+25+Gr*4]=Wt[Gr*3+1],ie[Q+26+Gr*4]=Wt[Gr*3+2]}else ie[Q+227]=0;(S.csLit==="phong"||S.csLit==="phongc")&&(ie[Q+227]=S.csLit==="phongc"?4:3),ie[Q+244]=S.tint?S.tint[4]:-1,S.tint&&ie.set(S.tint.subarray(0,4),Q+240),ie[Q+246]=S.paint?S.paintB??0:-1,ie[Q+247]=S.split?Math.sign(S.split)*(1+Ic):0,ie[Q+252]=ut?.clearcoat?.[0]??0,ie[Q+253]=ut?.clearcoat?.[1]??0;const vr=Fr?S.ol:null;if(Av(ie,Q+256,Gi(S)?.map??null,S.origin),ie[Q+254]=vr?vr[3]:0,ie[Q+255]=vr?Math.round(vr[0]*255)*65536+Math.round(vr[1]*255)*256+Math.round(vr[2]*255):0,S.sil&&(ie[Q+245]=S.sil[4],ie.set(S.sil.subarray(0,4),Q+248)),ie[Q+236]=a.eye[0]-S.origin[0],ie[Q+237]=a.eye[1]-S.origin[1],ie[Q+238]=a.eye[2]-S.origin[2],ie[Q+221]=S.textured||S.two?0:Nc,ie[Q+222]=nl?.grade?1:0,Ci&&(ie[Q+60]=S.origin[0]-Ci[0],ie[Q+61]=S.origin[1]-Ci[1],ie[Q+62]=S.origin[2]-Ci[2]),V.push({p:S,count:rt,slot:Mt}),S.pre&&S.textured&&(V.length<Ul||Rf(V.length+1))){const Wt=V.length,Gr=Wt*(Ut/4);ie.copyWithin(Gr,Q,Q+Ut/4),ie[Gr+8]=Xm,ie[Gr+9]=0,V.push({p:S,count:rt,slot:Wt,pre:!0}),Zt.pre++}}if(Zt.drawn=V.length-Zt.pre,pr.pl=V.length,V.length){l.queue.writeBuffer(bi,0,ie.buffer,0,V.length*Ut);const S=a.eye,rt=ze=>(ze.origin[0]-S[0])**2+(ze.origin[1]-S[1])**2+(ze.origin[2]-S[2])**2;let Mt=null;Zl.size&&ou++;const Q=br.mesh,nr=br,ut=uv(y),vr=We!=="none"?br.meshCull:null,Wt=ut&&Ze>0&&br===nt&&Nc<=0?nt.meshLite:null;Zt.fs=Wt?1:0;const Gr=ze=>(!!vr||!!Wt)&&ze.p.wound&&!ze.p.textured&&!ze.p.two&&!ze.p.noCull;Zt.fast=0;let Xo=null,$o=null;if(Gn&&br===nt&&!Fr&&!zi&&!(Jl&&Jl.n>0)&&!M.pbr&&Es<=0){const ze=V.filter(({p:Gt,pre:tn})=>!tn&&Gt.plain&&!Gt.blend&&Gt.cut<0&&(!!Gt.two||Gt.noCull)&&!Gt.xf&&!Gt.paint&&!Gt.tint&&!Gt.sil&&!Gt.split&&!Gt.custom&&!Gi(Gt)&&Gt.csLit!=="phong"&&Gt.csLit!=="phongc"&&Hp(Gt,a.eye));if(ze.length&&(Xo=F0(nt))){for(const Gt of ze)Gt.fast=!0;Zt.fast=ze.length}Xo&&yr!=="none"&&ze.some(Gt=>Gt.p.backCull)&&($o=F0(nt,"meshTexFastCull"))}const ga=V.filter(ze=>!ze.p.textured);if(te&&ga.length>1){const ze=Math.hypot(S[0],S[1],S[2])||1,Gt=Math.asin(Math.max(-1,Math.min(1,S[1]/ze)))*180/Math.PI,tn=Math.atan2(S[2],S[0])*180/Math.PI,no=Math.cos(Gt*Math.PI/180),dt=Xr=>{const ai=((Xr.bbox[0]+Xr.bbox[2])/2-tn)*no,sl=(Xr.bbox[1]+Xr.bbox[3])/2-Gt;return ai*ai+sl*sl};ga.sort((Xr,ai)=>dt(Xr.p)-dt(ai.p))}const jg=[[Q,ga.filter(ze=>!Gr(ze))],[Wt||vr,Wt||vr?ga.filter(Gr):[]],[Xo,Xo?V.filter(ze=>ze.fast&&!($o&&ze.p.backCull)):[]],[$o,$o?V.filter(ze=>ze.fast&&ze.p.backCull):[]],[nr.meshTex,V.filter(ze=>ze.p.textured&&!ze.fast&&(ze.pre||!ca(ze.p)))],[nr.meshTexBlend,V.filter(ze=>ze.p.textured&&!ze.pre&&ca(ze.p)).sort((ze,Gt)=>rt(Gt.p)-rt(ze.p))]].filter(ze=>!!ze[0]),jc=V.filter(ze=>ze.p.textured&&ze.p.sil&&!ze.pre&&!ca(ze.p));if(Zt.sil=jc.length,jc.length){m.setPipeline(nt.meshSil),m.setBindGroup(0,tr.bld),m.setBindGroup(1,ye[He.mesh]);for(const{p:ze,count:Gt,slot:tn}of jc)m.setBindGroup(2,Wi,[tn*Ut]),m.setVertexBuffer(0,ze.vbo),m.setVertexBuffer(1,ze.nbo),m.setVertexBuffer(2,ze.uvbo),m.setVertexBuffer(3,ze.cbo),m.setBindGroup(3,xc(ze)),m.setIndexBuffer(ze.ibo,"uint32"),m.drawIndexed(Gt)}for(const[ze,Gt]of jg){const tn=ze!==Q&&ze!==vr&&ze!==Wt;if(!Gt.length)continue;if(m.setPipeline(ze),m.setBindGroup(0,tr.bld),m.setBindGroup(1,ye[He.mesh]),ze===Xo||ze===$o){for(const{p:dt,count:Xr,slot:ai}of Gt)m.setBindGroup(2,Wi,[ai*Ut]),m.setVertexBuffer(0,dt.vbo),m.setVertexBuffer(1,dt.nbo),m.setVertexBuffer(2,dt.cbo),m.setIndexBuffer(dt.ibo,"uint32"),m.drawIndexed(Xr);continue}!tn&&ar("buildings")&&m.setBindGroup(3,ar("buildings"));let no=ze;for(const{p:dt,count:Xr,slot:ai}of Gt){const sl=tn?su(dt):null,Kc=sl?_g(sl,dt):null,Qc=Kc?zg(Kc,o):null;if(Qc){const io=ze===nr.meshTexBlend?Qc.bl:Qc.op;if(no!==io&&(m.setPipeline(io),no=io),!Mt){const al=a.invMvp?Oa(a.mvp,a.invMvp):null;Mt=al?Lv(al.F,al.X,al.Y):Float32Array.of(1,0,0,0,1,0,0,0,1)}const Yo=Cg(dt,dt.custom,sl,Kc);Eg(dt,sl,Mt),dt.mcbo||(dt.mcbo=l.createBuffer({size:Math.max(16,dt.vbo.size/12*16),usage:GPUBufferUsage.VERTEX})),dt.uvmbo||(dt.uvmbo=l.createBuffer({size:Math.max(8,dt.vbo.size/12*8),usage:GPUBufferUsage.VERTEX})),m.setBindGroup(2,Wi,[ai*Ut]),m.setVertexBuffer(0,dt.vbo),m.setVertexBuffer(1,dt.nbo),m.setVertexBuffer(2,dt.uvbo),m.setVertexBuffer(3,dt.cbo),m.setVertexBuffer(4,dt.mcbo),m.setVertexBuffer(5,dt.uvmbo),m.setBindGroup(3,Yo.bg),m.setIndexBuffer(dt.ibo,"uint32"),m.drawIndexed(Xr);continue}const Bu=tn&&Vn&&dt.noClip,va=Bu?ze===nr.meshTex?(Nn??nt).meshTex:(Nn??nt).meshTexBlend:ze;if(va)if(no!==va&&(m.setPipeline(va),no=va),m.setBindGroup(2,tn?Bu?Nn?et.plShBG:Wi:Io?vu.plBG:Vn?xe.plBG:Nn?et.plShBG:Wi:Wi,[ai*Ut]),m.setVertexBuffer(0,dt.vbo),m.setVertexBuffer(1,dt.nbo),tn&&(m.setVertexBuffer(2,dt.uvbo),m.setVertexBuffer(3,dt.cbo),m.setBindGroup(3,xc(dt))),m.setIndexBuffer(dt.ibo,"uint32"),!tn&&ut&&dt.liteCounts&&dt.lodCounts){const io=dt.lodCounts,Yo=dt.liteCounts,al=io.length;let Fu=0;for(let cl=al-1;cl>=0;cl--){const Gu=cl===al-1?0:io[cl+1];if(Gu>=Xr)break;Yo[cl]>0&&(m.drawIndexed(Yo[cl],1,Gu),Fu+=Yo[cl])}Zt.tris-=(Xr-Fu)/3}else m.drawIndexed(Xr)}}}}Xl.size&&(Xl.draw(m,o,a.mvp,I,a.eye,vt&&Ve.has&&Ve.scale>0?1-(Pe?ti/Ve.scale:0):0,!Pe),m.setStencilReference(128)),ua>0&&re.night!==!1&&(m.setPipeline(nt.night),m.setBindGroup(0,Lf),m.draw(3)),nl?.grade&&(m.setStencilReference(128),m.setPipeline(nt.alphaOne),m.draw(3)),m.end();const en=Math.min(1,Math.max(0,((e.pitch||0)-.02)/.08));M.ao&&!ue&&en>0?(bn??=mm(l,U,W),bn.encode(Pn,{depthTex:si.depth,samples:o,W:i,H:n,colorView:ol,mvp:a.mvp,invMvp:a.invMvp,eye:a.eye,focal:a.focal,logCoef:I,strength:(re.aoStrength??.6)*en*en*(3-2*en),radiusK:re.aoRadius??.1,biasSin:re.aoBias??.15,phase:re.aoPhase??0})):bn&&!M.ao&&(bn.dispose(),bn=null);const Pu=performance.now()/1e3,Su=ir(0,90),Yc=!ue&&!(yn&&yn.rain)&&(!!(yn&&(yn.contact||yn.rays))||!!Kl&&en>0);if((u||to)&&(Ql=!0),Yc){const v=`${i}x${n}x${o}|${Array.from(a.mvp,y=>y.toPrecision(12)).join(",")}`;v!==Oc?(Oc=v,oi=0,Dc=Lc*3):oi=Ql||oi>=Lc-1?0:oi+1,Dc--}else Oc="",oi=0;Ql=!1,nu=Yc&&oi<Lc-1&&Dc>0;const pa=yn&&!ue?{depthTex:si.depth,samples:o,W:i,H:n,colorView:ol,canvasTex:o>1?null:Z.getCurrentTexture(),mvp:a.mvp,invMvp:a.invMvp,eye:a.eye,logCoef:I,sun:[Dt[0],Dt[1],Dt[2]],dpr:e.dpr||1,pole:Su,time:Pu,opt:yn,fade:en*en*(3-2*en),phase:oi}:null;return pa?(Ur??=cd(l,U,W),Ur.pre(Pn,pa)):Ur&&!yn&&!Kl&&(Ur.dispose(),Ur=null),Kl&&!ue&&en>0?(Dn??=Tm(l,U,R,E,W),Dn.encode(Pn,{depthTex:si.depth,samples:o,W:i,H:n,colorView:ol,canvasTex:o>1?null:Z.getCurrentTexture(),mvp:a.mvp,invMvp:a.invMvp,eye:a.eye,logCoef:I,bg0:tr.main,bg1:ye[He.contour],opt:Kl,fade:en*en*(3-2*en),time:Pu,pole:Su,phase:oi})):Dn&&!Kl&&(Dn.dispose(),Dn=null),pa&&Ur&&Ur.post(Pn,pa),Yc&&(Ur??=cd(l,U,W),Ur.accumulate(Pn,{samples:o,W:i,H:n,colorView:ol,canvasTex:o>1?null:Z.getCurrentTexture(),k:oi})),ru={depthTex:si.depth,samples:o,logCoef:I,dpr:e.dpr||1,frame:++Gg,fovy:e.fovy||50*Math.PI/180},oa=Mr?{tex:si.depth,samples:o,w:i,h:n,logCoef:I}:null,rr={enc:Pn,colorView:ol,depthView:si.depthView,w:i,h:n,samples:o},p1.on=re.gintFarPivot!==!1,Ac=mt?{terrainDepth:!0,logCoef:I,fogFar:ce,elevView:Ve.has&&ri?ri:null,elevSampler:Yi,elevBounds:Ve.bounds,elevScale:ti,hasElev:Ve.has,edgeFade:Ve.edgeFade||0,meshQ:Qr,meshG:rl,noSub:re.gintSub===!1,subBudget:re.gintSubBudget>0?re.gintSubBudget:0,subMove:re.gintSubMove??1,subBudgetMove:re.gintSubBudgetMove>0?re.gintSubBudgetMove:0,moving:Lo,facesInAtlas:ve.fillsIn}:null,u||to||aa>0||!!(yn&&yn.rain&&!ue)}function la(){if(!rr)return;if(rr.samples>1){const t={timestampWrites:Xe("map"),colorAttachments:[{view:rr.colorView,resolveTarget:Z.getCurrentTexture().createView(),loadOp:"load",storeOp:"discard"}]};let i;try{i=rr.enc.beginRenderPass(t)}catch(n){if(!J)throw n;pt(n),delete t.timestampWrites,i=rr.enc.beginRenderPass(t)}i.end()}if(nl)try{kn??=Vm(l,U,()=>p.requestDraw?.(),W),rr.enc=kn.encode(rr.enc,Z.getCurrentTexture(),rr.w,rr.h,nl,ru)}catch(t){console.warn("[gpu] post-process failed (disabled):",t?.message||t),nl=null,kn?.dispose(),kn=null}else kn&&(kn.dispose(),kn=null);let e=null;if(J&&J.idx&&(rr.enc.resolveQuerySet(J.qs,0,J.idx,J.resolve,0),e=J.staging.find(t=>!t.busy)||null,e&&(e.busy=!0,e.spans=J.spans.slice(),e.n=J.idx,rr.enc.copyBufferToBuffer(J.resolve,0,e.buf,0,J.idx*8))),l.queue.submit([rr.enc.finish()]),rr=null,qa.length){const t=qa.splice(0);l.queue.onSubmittedWorkDone().then(()=>{for(const i of t)i.destroy()}).catch(()=>{})}if(Ds.length){const t=Ds.splice(0);l.queue.onSubmittedWorkDone().then(()=>{for(const i of t)i.destroy()}).catch(()=>{})}ae===1&&(ae=2,l.popErrorScope().then(t=>{t&&Te("初回フレーム検証",t.message)}).catch(()=>{})),e&&setTimeout(()=>{e.buf.mapAsync(GPUMapMode.READ).then(()=>{const t=new BigUint64Array(e.buf.getMappedRange(0,e.n*8)),i={};for(const n of e.spans){const o=Number(t[n.i0+1]-t[n.i0])/1e6;o>=0&&o<1e4&&(i[n.tag]=(i[n.tag]||0)+o)}e.buf.unmap(),e.busy=!1;for(const n in i)J.ready.push({tag:n,ms:i[n]})}).catch(()=>{e.busy=!1})},0)}let ru=null,Gg=0,Mr=null,oa=null,sa=!1,bn=null,Dn=null,Kl=null,Ur=null,yn=null;const Lc=8;let oi=0,Oc="",nu=!1,Ql=!1,Dc=0,iu=-3,lu=null;const Zl=new Map;let ou=0,aa=0;const su=e=>e.textured&&e.custom?Zl.get(e.custom)??null:null,Tg=[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:4,attributes:[{shaderLocation:1,offset:0,format:"snorm8x4"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]},{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"unorm8x4"}]},{arrayStride:16,attributes:[{shaderLocation:4,offset:0,format:"float32x4"}]},{arrayStride:8,attributes:[{shaderLocation:5,offset:0,format:"float32x2"}]}],au=new Map,kc=(e,t)=>{const i=`${+e}${+t}`;let n=au.get(i);if(!n){const o=e?"nearest":"linear",a=t?"repeat":"clamp-to-edge";n=l.createSampler({magFilter:o,minFilter:o,mipmapFilter:e?"nearest":"linear",addressModeU:a,addressModeV:a}),au.set(i,n)}return n};function _g(e,t){const i=t.meta?.sig??"";let n=e.vars.get(i);if(n)return n.err?null:n;n={code:null,bgl:null,textures:[],nMeta:t.meta?.texs.length??0,cuSize:0,pipes:new Map,err:!1},e.vars.set(i,n);try{const u=R1(t.meta?{...e.spec,metadata:{...e.spec.metadata,...t.meta.props}}:e.spec);n.code=u.code,n.textures=u.textures,n.cuSize=Math.max(Hv*16+16,u.cuSize+15&-16)}catch(u){return n.err=!0,console.warn("[customShader] cannot translate to WGSL = drawn without it:",u.message),null}const o=GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,a=u=>[{binding:u,visibility:o,sampler:{type:"filtering"}},{binding:u+1,visibility:o,texture:{sampleType:"float"}}];return n.bgl=l.createBindGroupLayout({entries:[...[0,1,2,3,4,5].map(u=>u===0?{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}:{binding:u,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}),{binding:6,visibility:o,buffer:{type:"uniform"}},Ot,...n.textures.flatMap((u,d)=>a(7+d*2)),...Array.from({length:n.nMeta},(u,d)=>a(7+n.textures.length*2+d*2)).flat()]}),n}function zg(e,t){if(e.err)return null;const i=e.pipes.get(t);if(i)return i==="pending"?null:i;let n=e.code;p.gndFast===!1&&(n=Yu(n)),W?n=Aa(n,"meshTexCustom"):tt&&(n=rd(n,"meshTex")),l.pushErrorScope("validation");const o=l.createShaderModule({code:n}),a=l.createPipelineLayout({bindGroupLayouts:[R,E,ot,e.bgl]}),u=b=>l.createRenderPipelineAsync({layout:a,vertex:{module:o,entryPoint:"vs",buffers:Tg},fragment:{module:o,entryPoint:"fs",targets:[Be]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:b,multisample:{count:t}});e.pipes.set(t,"pending"),aa++;const d=Promise.all([u(Yt),u(fi)]);return l.popErrorScope().then(b=>{b&&console.warn("[customShader] WGSL:",b.message.split(`
`)[0])}).catch(()=>{}),d.then(([b,c])=>{aa--,e.pipes.set(t,{op:b,bl:c})}).catch(async b=>{aa--;const B=(await o.getCompilationInfo().catch(()=>null))?.messages.find(k=>k.type==="error");e.err=!0,console.warn("[customShader] WGSL pipeline failed = drawn without it:",B?`${B.lineNum}:${B.linePos} ${B.message}`:b.message)}),null}function Cg(e,t,i,n){if(e.cs&&e.cs.id===t&&e.cs.rev===i.rev&&e.cs.bgl===n.bgl&&e.cs.paint===(e.paint??null)&&e.cs.drape===(Gi(e)?.t??null))return e.cs;e.cs?.cub.destroy();const o=l.createBuffer({size:n.cuSize,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),a=7+n.textures.length*2,u=kc(!0,!1),d=l.createBindGroup({layout:n.bgl,entries:[{binding:0,resource:x0},...(e.texs||[null,null,null,null,null]).map((b,c)=>({binding:c+1,resource:(b||h0[c]).view})),{binding:6,resource:{buffer:o}},{binding:af,resource:(e.paint||Gi(e)?.t||Fi).view},...n.textures.flatMap((b,c)=>{const B=i.tex.get(b);return[{binding:7+c*2,resource:B?B.samp:kc(!1,!0)},{binding:8+c*2,resource:(B?B.t:Fi).view}]}),...Array.from({length:n.nMeta},(b,c)=>[{binding:a+c*2,resource:u},{binding:a+1+c*2,resource:(e.meta?.texs[c]??Fi).view}]).flat()]});return e.cs={id:t,rev:i.rev,bgl:n.bgl,cub:o,bg:d,cpu:new ArrayBuffer(n.cuSize),paint:e.paint??null,drape:Gi(e)?.t??null}}function Eg(e,t,i){const n=e.cs,o=new Float32Array(n.cpu),a=e.mcJ??Float32Array.of(1,0,0,0,1,0,0,0,1);Xv(t.spec,t.spec.values||{},n.cpu);for(let u=0;u<3;u++)for(let d=0;d<3;d++)o[u*4+d]=a[u*3+d],o[12+u*4+d]=i[u*3+d];o[24]=ou,o[25]=0,o[26]=t.spec.lighting==="UNLIT"?1:t.spec.lighting==="PBR"?-1:0,l.queue.writeBuffer(n.cub,0,n.cpu)}function Mg(e,t){const i=Zl.get(e);if(!t){if(i){for(const o of i.tex.values())o.t.tex.destroy();Zl.delete(e)}return}const n=i&&i.spec.vs===t.vs&&i.spec.fs===t.fs&&JSON.stringify(i.spec.uniforms)===JSON.stringify(t.uniforms)&&JSON.stringify(i.spec.metadata)===JSON.stringify(t.metadata);if(i&&n){i.spec=t;return}Zl.set(e,{spec:t,tex:i?i.tex:new Map,rev:(i?.rev??0)+1,vars:new Map})}function Ug(e,t){const i=Zl.get(e);if(!i||!t?.name||!t.tex)return;const n=w0(t.tex,!1);n&&(i.tex.get(t.name)?.t.tex.destroy(),i.tex.set(t.name,{t:n,samp:kc(!!t.nearest,t.repeat!==!1)}),i.rev++)}const ca=e=>e.blend?1:e.tint&&e.tint[3]<1||su(e)?.spec.translucency==="TRANSLUCENT"?2:0;let Ic=.5,Fr=null,zi=null,Jl=null,Nc=0,nl=null,kn=null;function cu(e){if(!e||sa)return Mr&&(Mr.dispose(),Mr=null),oa=null,null;if(!Mr)try{Mr=um(l,W)}catch(t){return sa=!0,console.warn("[gpu] depthOut unavailable:",t?.message||t),null}return{begin:()=>{if(sa||!Mr)throw new Error("depthOut disabled");return!0},abort:()=>{},end:()=>{const t=oa;if(oa=null,!t||!Mr)return null;try{const i=Mr.encode(t),n=Il?Qo(Il):null;return{bitmap:i.bitmap,gpu:{device:l,texture:i.texture},w:t.w,h:t.h,logCoef:t.logCoef,globe:n?{F:n.F,X:n.X,Y:n.Y,E:n.E,c:n.c}:null}}catch(i){return sa=!0,console.warn("[gpu] depthOut failed (disabled):",i?.message||i),cu(!1),null}}}}function Rg(){if(!J)return null;if(!J.ready.length)return[];const e=J.ready;return J.ready=[],e}async function Ag(){const e=s.width,t=s.height;if(!e||!t)return null;const i=Math.ceil(e*4/256)*256,n=l.createBuffer({size:i*t,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),o=l.createCommandEncoder();o.copyTextureToBuffer({texture:Z.getCurrentTexture()},{buffer:n,bytesPerRow:i,rowsPerImage:t},{width:e,height:t}),l.queue.submit([o.finish()]),await new Promise(d=>setTimeout(d,0)),await n.mapAsync(GPUMapMode.READ);const a=new Uint8Array(n.getMappedRange()),u=new Uint8Array(e*t*4);for(let d=0;d<t;d++){const b=d*i,c=d*e*4;if(G)for(let B=0;B<e;B++){const k=b+B*4,X=c+B*4;u[X]=a[k+2],u[X+1]=a[k+1],u[X+2]=a[k],u[X+3]=a[k+3]}else u.set(a.subarray(b,b+e*4),c)}return n.unmap(),n.destroy(),{base:u.buffer,w:e,h:t}}const Lg=new Set(["mdGrow","mdUp","mdScene"]),fu=new Set;function Og(e,t,i){switch(Ql=!0,e){case"overlay":Qd(t,i);break;case"overlayHi":Zd(t,i);break;case"overlayHover":Jd(t);break;case"rail":ep(t);break;case"wdepr":tp(t);break;case"lakes":rp(t);break;case"gintBld":lp(t);break;case"view":re={...re,...t};break;case"patImage":So(t);break;case"sky":_s=t&&Array.isArray(t.sky)?t:null;break;case"lights":Jl=t&&t.n>0&&t.data?t:null;break;case"groundLight":lu=t&&Array.isArray(t.dir)?t:null;break;case"groundMaterial":ap(t);break;case"meshSpecEnv":{const n=t;Nl?.destroy(),Nl=null,ji=i0,tc=0,n&&n.size>0&&n.levels?.length&&(Nl=l.createTexture({size:[n.size,n.size,6],mipLevelCount:n.levels.length,format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),n.levels.forEach((o,a)=>{const u=Math.max(1,n.size>>a);l.queue.writeTexture({texture:Nl,mipLevel:a},o,{bytesPerRow:u*8,rowsPerImage:u},[u,u,6])}),ji=Nl.createView({dimension:"cube"}),tc=n.levels.length-1),qr();break}case"meshLight":Fr=t&&Array.isArray(t.dir)&&t.sh?t:null;break;case"light":zi=t&&Array.isArray(t.dir)?t:null;break;case"sea":Wr={...Wr,...t};break;case"shadow":sn={...sn,...t},sn.on||ki();break;case"clip":ur=sv(t),ur||xs();break;case"post":nl=t||null;break;case"cityLights":Nc=Math.max(0,Math.min(1,+t||0));break;case"ssr":Kl=t?{...t}:null;break;case"sceneFx":{const n=t;yn=n&&(n.contact||n.fog||n.rays||n.rain||n.toon)?{contact:n.contact??null,fog:n.fog??null,rays:n.rays??null,rain:n.rain??null,toon:n.toon??null}:null;break}case"fx":Object.assign(M,t||{});break;case"text":Mo=t||null;break;case"bldFill":wr={...wr,...t};break;case"userAnchor":Cs={ranges:Array.isArray(t?.ranges)?t.ranges:[],rev:Cs.rev+1};break;case"scene":wg(t,i);break;case"mdGrow":yt&&xg(t.pool,t.units);break;case"mdUp":yt&&bg(t);break;case"mdScene":yt&&yg(t);break;case"elevAtlas":gp(t,i);break;case"elevCell":vp(i.cx,i.cy,t,i.cellRes);break;case"elevAtlasStage":mp(t,i);break;case"elevCellStage":xp(i.cx,i.cy,t,i.cellRes);break;case"elevAtlasCommit":bp();break;case"terrainExag":pp(t);break;case"elevAtlasFar":yp(t);break;case"elevCellFar":hp(i.cx,i.cy,t,i.cellRes);break;case"elevFarMax":kt.maxElev=+t||0;break;case"elevAtlasFarOff":wp();break;case"elevAtlasNear":Pp(t);break;case"elevCellNear":Sp(i.cx,i.cy,t,i.cellRes);break;case"elevAtlasNearOff":Bp();break;case"elevFineOn":Fp(t);break;case"elevFineOff":Gp();break;case"terrLod":m0=t!==!1;break;case"meshSet":D0(i,t);break;case"meshPaint":{const n=Ct.get(i),o=t;if(!n?.textured||!n.texs)break;if(n.paint?.tex.destroy(),n.paint=null,o&&o.w>0&&o.h>0&&o.rgba?.length>=o.w*o.h*4){const a=l.createTexture({size:[o.w,o.h],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});l.queue.writeTexture({texture:a},o.rgba,{bytesPerRow:o.w*4,rowsPerImage:o.h},[o.w,o.h]),n.paint={tex:a,view:a.createView()},n.paintB=o.blend}n.texBG=mc(n.texs,n.paint,Gi(n)?.t??null),n.texBGDrape=Gi(n)?.t??null;break}case"meshCol":{const n=Ct.get(i);n?.cbo&&t?.length&&t.byteLength<=n.cbo.size&&(l.queue.writeBuffer(n.cbo,0,t.buffer,t.byteOffset,t.byteLength),Gn&&(n.flat=t.byteLength===n.cbo.size?P0(t,n.colSrgb):null));break}case"meshPos":{const n=Ct.get(i),o=t;if(!n||!o?.pos?.length&&!o?.nrm?.length||o.pos?.length&&(o.pos.byteLength+3&-4)!==n.vbo.size)break;o.pos?.length&&l.queue.writeBuffer(n.vbo,0,o.pos.buffer,o.pos.byteOffset,o.pos.byteLength),o.nrm?.length&&(o.nrm.byteLength+3&-4)===n.nbo.size&&(l.queue.writeBuffer(n.nbo,0,o.nrm.buffer,o.nrm.byteOffset,o.nrm.byteLength),n.plain&&(n.plain=S0(o.nrm))),_r++;break}case"classify":Xl.set(i,t);break;case"classifyStyle":Xl.style(i,t);break;case"meshCut":{const n=Ct.get(i);n&&n.textured&&!n.blend&&typeof t=="number"&&(n.cut=t);break}case"meshSil":{const n=Ct.get(i);n&&(n.sil=t&&t.length>=5&&t[4]>0?Float32Array.from(t):null);break}case"meshEnv":{const n=Ct.get(i);n&&(n.sh=t&&t.length>=27?Float32Array.from(t):null);break}case"meshOutline":{const n=Ct.get(i);n&&(n.ol=t&&t.length>=4?Float32Array.from(t):null);break}case"customShader":Mg(String(i),t);break;case"customShaderTex":Ug(String(i),t);break;case"meshCustom":{const n=Ct.get(i);n&&(n.custom=t!=null&&t!==""?String(t):null);break}case"meshNoClip":{const n=Ct.get(i);n&&(n.noClip=!!t);break}case"meshImagery":{const n=Ct.get(i);n&&(n.imagery=t!=null&&t!==""?String(t):null);break}case"meshDrape":{const n=String(i),o=t,a=Xs.get(n);Xs.delete(n),a&&queueMicrotask(()=>a.t.tex.destroy());const u=o?Ov(o):null,d=o?o.bitmap?o.bitmap.width:o.w??0:0,b=o?o.bitmap?o.bitmap.height:o.h??0:0;if(o&&u&&d>0&&b>0){const c=l.createTexture({size:[d,b],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});o.bitmap?l.queue.copyExternalImageToTexture({source:o.bitmap},{texture:c},[d,b]):o.rgba&&l.queue.writeTexture({texture:c},o.rgba,{bytesPerRow:d*4,rowsPerImage:b},[d,b]),Xs.set(n,{t:{tex:c,view:c.createView()},map:u})}o?.bitmap?.close?.();break}case"meshSplit":{const n=Ct.get(i);n&&(n.split=typeof t=="number"?t:0);break}case"splitPos":{Ic=typeof t=="number"?Math.max(0,Math.min(1,t)):.5;break}case"meshTint":{const n=Ct.get(i);n&&(n.tint=t&&t.length>=5?Float32Array.from(t):null);break}case"meshXf":{const n=Ct.get(i);n&&(n.xf=t&&t.length>=12?t:null,_r++);break}case"meshVis":dg(i,t);break;case"stars":Xi=Go(Xi,t,8);break;case"planets":$i=Go($i,t,8);break;case"constellations":Rl=Go(Rl,t,3);break;case"ecliptic":Bo=Go(Bo,t,3);break;case"celequator":Fo=Go(Fo,t,3);break;case"cogSplit":up(t);break;case"cogTex":fp(t);break;case"pzOver":pn=new Map(t??[]);break;case"ptOver":jl.setOver(t);break;case"ptFsLayers":jl.setFsLayers(t);break;case"ptFs":jl.setFs(t);break;default:Lg.has(e)?fu.has(e)||(fu.add(e),console.log(`[gpu] set("${e}") not implemented = ignored (next phase of WebGPU port)`)):console.warn("[gpu] renderer.set: unknown cmd",e)}}function Dg(){Xl.dispose(),rr=null,Ac=null,ki(),xs(),Oo("base"),Oo("main"),Oo("user"),r.destroy(),f.destroy(),g.destroy(),Ts.destroy(),bi.destroy(),Fc.destroy();for(const e of Zs.values())e.buf.destroy();Zs.clear(),Ha.destroy(),Ks.destroy(),Hl.destroy(),G0();for(let e=0;e<4;e++)T0(ve.w[e]),ve.w[e]=null;ve.n=0,Xa.destroy(),Ss.destroy(),To.destroy(),_o.destroy(),E0.destroy(),Kr(zo),Kr(hi),Kr(Co),Kr(Ol),Kr(Dl);for(const e of Fs)Kr(e);Wf();for(const e of[Xi,$i,Rl,Bo,Fo])e&&e.buf.destroy();for(const e of Ct.values()){e.vbo.destroy(),e.nbo.destroy(),e.ibo.destroy(),e.uvbo?.destroy(),e.cbo?.destroy();for(const t of e.texs||[])t?.tex.destroy();e.paint?.tex.destroy()}Ct.clear();for(const e of mn.values())e.tex.destroy();mn.clear(),Ln.clear(),C0.destroy(),ni=null,vt&&(vt.vbo.destroy(),vt.ibo.destroy(),vt.coarse?.ibo.destroy(),vt=null),Er&&(Er.destroy(),Er=null),Sr&&(Sr.destroy(),Sr=null),Pr&&(Pr.tex.destroy(),Pr=null);for(const e of Ds.splice(0))e.destroy();for(const e of Bi.values())e.buf.destroy();Bi.clear(),Ns=0,el&&(el.ubuf.destroy(),el=null),n0.destroy(),Mr&&(Mr.dispose(),Mr=null),bn&&(bn.dispose(),bn=null),Dn&&(Dn.dispose(),Dn=null),Ur&&(Ur.dispose(),Ur=null),kn&&(kn.dispose(),kn=null);for(const e of Do.values())e.tex?.destroy(),e.depth.destroy();Do.clear(),l.destroy()}return l.popErrorScope().then(e=>{e&&Te("init検証",e.message)}).catch(()=>{}),{set:Og,draw:Fg,flush:la,readback:Ag,dispose:Dg,lazyPipes:K,gintWarm:p.gintWarm>0?p.gintWarm:0,md:!!yt,mdMax:yt?pg:0,mdDash:!xt,pt:!!yt,gintCtx:()=>Ac,clipInfo:()=>Zn,backend:"webgpu",lost:l.lost,maxTex:l.limits.maxTextureDimension2D,gpuResample:d0,readElevCell:Mp,pipeLog:tv,terrStats:()=>({...An,coarse:dc,sub:{...Uo}}),meshStats:()=>({...Zt}),device:l,format:U,gpuInfo:Se,frameInfo:()=>rr,passTS:Xe,tqTake:Rg,gpuErrors:Ie,boot:{adapterMs:F-_,deviceMs:Ee-F,initMs:performance.now()-Ee},meshUpPump:ug,meshUpBusy:()=>_i.size>0||ta.length>0,shadowStats:()=>sn.on?{on:!0,active:Nt.active,passes:Nt.passes,skipped:Nt.skipped,...Nt.last||{},cascades:Nt.cascades||[]}:null,analysis:Na,depthFormat:$,depthRZ:W?Td:0,samples:oe,quad4:Qa,fx:M,accumulating:()=>nu,memEstimate:()=>({atlas:oc+As+sc,mesh:ac,msaa:cc,raster:$s+ve.bytes,depthOut:Mr?Mr.bytes():0,ao:bn?bn.bytes():0,ssr:Dn?Dn.bytes():0,sceneFx:Ur?Ur.bytes():0,pool:I0}),depthOut:cu,rasterTex:((...e)=>(Ql=!0,$p(...e))),rasterMesh:Yp,rasterFree:jp,setRasterDraws:((...e)=>{const t=e[0]?e[0].rev??-1:-2;return t!==iu&&(iu=t,Ql=!0),Kp(...e)}),setGroundHook:Zp,textSplit:sp,dbg:()=>pr}}const Od=`
fn log1pG(w: f32) -> f32 { if (w < 0.1) { return w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715)))))); } return log(1.0 + w); }   // log(1+w) を桁落ちなしに（wgsl.ts log1pS と同じ・対数深度の頂点側）
struct GF {
	mvp: mat4x4f,
	clipT: vec4f,      // mvp*[原点3D,1]（CPU double）＝MVP相殺回避の錨
	trig: vec4f,       // 原点の三角比 (cosLon,sinLon,cosLat,sinLat)
	eye: vec3f,
	originPt: vec3f,   // 原点3D（drape の絶対方向 dir=originPt+rel 用）
	origin: vec2f,     // シーン原点 lon/lat (deg)＝Morton 中心
	viewport: vec2f,   // device px
	centers: vec2u,    // (u_ix_center, u_iy_center)
	texw: vec2i,       // (u_arc_w, u_meta_w)
	originZr: f32,     // dot(原点3D,eye)-1（CPU double）＝zr相殺回避の錨
	lodRank: f32,      // GPU Dynamic LOD 閾値（VW rank 0-63）
	ellT2: vec2f,      // 楕円体 dβ 錨 (cos2φ0, sin2φ0)（旧 _pad0。球＝(0,0)＝補正が厳密0）
	vbb: vec4u,        // 視野 bbox（e7整数・線幅マージン込み）
	flags: vec4u,      // has_pivot, use_vbb, pivot_w, fidstyle_w(0=無効)
	depthP: vec4f,     // logCoef, fogFar, elevScale, hasElev
	elevBounds: vec4f,
	elevP: vec4f,      // edgeFade, cos4φ0, sin4φ0, ell(1=楕円体)＝予備3枠に dβ 錨の残りとゲート（球＝0,0,0）
	meshQ: vec4f,      // 案A: 地形メッシュ窓（xy=原点・zw=span deg）＝ドレープ標高の量子化先
	meshP: vec4f,      // 案A: (格子の頂点数 G, near.x, near.y, skipE7)。G=0＝量子化オフ。yz＝地形適応細分の近傍窓（deg 半幅・0=集中なし）・w＝メイン描画が飛ばす長辺の下限スパン（e7・0=飛ばさない）（⚠GF スロットは 512B へ拡張済み）
	atlas: vec4f,      // 地面アトラスへの焼き込み（窓座標モード）：xy＝原点−窓南西隅(deg)・zw＝1/窓幅（gl/gint u_atlas と対・packGF 72-75）
	atlasQ: vec4f,     // x＝窓座標モード(1)。塗り扇だけ＝球面投影・地平クランプ・ドレープ無し（地形には FS の標本化で乗る・packGF 76-79）
	gfRsv: array<vec4f, 12>,   // float 80〜127＝断面（#111 段 3）の派生だけが clipPl/clipP/ray… として宣言し直す欄（GINT_CLIP_FIELDS）。素の GF は読まない
	farA: vec4f,       // 遠方の要（塗り扇の画面カリング・gint/utility.js farPivotParams）：NDC の東(xy)・北(zw)（packGF 128-131）
	farQ: vec4f,       // (経度差の重み, 緯度差の重み, 有効(1), 距離 K)＝z=0 は無効＝従来の bbox 中心・z=2＝単一要を farA.xy（NDC）へ（packGF 132-135）
	farBig: vec4u,     // xy＝要を遠方へ置く feature の幅/高さ下限（e7）・z＝辺→塗り扇の鍵の表（compTex）の幅（0＝表なし＝鍵は fid）（packGF 136-139）
};
@group(0) @binding(0) var<uniform> F: GF;
struct Styles { style: array<vec4f, 256>, dash: array<vec4f, 256> };   // dash は xy のみ使用（uniform 配列は 16B stride）
@group(0) @binding(1) var<uniform> S: Styles;
struct GP {
	a: vec4f,      // lineWidth(device px), widthAdd, ptRadius(device px), hidden(0/1)（点ロールでは w＝dpr）
	b: vec4i,      // activeId, pass(0=clean/1=highlight), 表の line-width の倍率（f32 のビット＝dpr・0＝1）, 0
	color: vec4f,  // fill/mask 色（cover 用）
};
@group(1) @binding(0) var<uniform> P: GP;
`,Dd=`
${Od}
@group(2) @binding(0) var arcTex: texture_2d_array<u32>;
@group(2) @binding(1) var metaTex: texture_2d_array<u32>;
@group(3) @binding(0) var pivotTex: texture_2d<u32>;
@group(3) @binding(1) var fidTex: texture_2d<u32>;
@group(3) @binding(4) var compTex: texture_2d<u32>;   // ポリゴン辺→塗り扇の鍵（R32UI・多片地物の層だけ・bake comp）
@group(3) @binding(2) var elevTex: texture_2d<f32>;
@group(3) @binding(3) var elevSamp: sampler;
// group(2) の読み＝層ごと TEX_LAYER_H 行の 2D 配列（gint.js texArrU32 と対・分割送り＝1 枚 268 MB の壁を外す）。
// 線形添字 → (x, y, layer)。storage 経路は toStorageWGSL がこの 2 関数の本体だけを添字 1 回に書き換える
const TEX_LAYER_H: i32 = 4096;
fn arcAt(idx: u32) -> vec2u {
	let r = i32(idx) / F.texw.x;
	return textureLoad(arcTex, vec2i(i32(idx) % F.texw.x, r % TEX_LAYER_H), r / TEX_LAYER_H, 0).rg;
}
fn metaAt(edgeId: i32) -> vec4u {
	let r = edgeId / F.texw.y;
	return textureLoad(metaTex, vec2i(edgeId % F.texw.y, r % TEX_LAYER_H), r / TEX_LAYER_H, 0);
}
const D2R: f32 = 0.017453292519943295;
// 標高（renderer と同式＝基図の線/塗りと同じドレープ＝重ねてズレない）
fn elevAt(ll: vec2f) -> f32 {
	if (F.depthP.w < 0.5) { return 0.0; }
	let uv = (ll - F.elevBounds.xy) / F.elevBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return 0.0; }
	var fade = 1.0;
	if (F.elevP.x > 0.0) {
		let w = vec2f(F.elevP.x) / F.elevBounds.zw;
		fade = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return textureSampleLevel(elevTex, elevSamp, uv, 0.0).r * fade;
}
// 案A（gl/gint/programs.js elevQAt と 1:1）: 描画メッシュと同じ折れ線面へ量子化
fn elevQAt(ll: vec2f) -> f32 {
	let G = F.meshP.x;
	if (G < 1.5) { return elevAt(ll); }
	let g = (ll - F.meshQ.xy) / F.meshQ.zw;
	if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) { return elevAt(ll); }
	let N = G - 1.0;
	let gc = min(g * N, vec2f(N - 1e-4));
	let gi = floor(gc);
	let gf = gc - gi;
	let st = F.meshQ.zw / N;
	let b0 = F.meshQ.xy + gi * st;
	let h00 = elevAt(b0);
	let h10 = elevAt(b0 + vec2f(st.x, 0.0));
	let h01 = elevAt(b0 + vec2f(0.0, st.y));
	let h11 = elevAt(b0 + st);
	if (gf.x + gf.y < 1.0) { return h00 + gf.x * (h10 - h00) + gf.y * (h01 - h00); }
	return h11 + (1.0 - gf.x) * (h01 - h11) + (1.0 - gf.y) * (h10 - h11);
}
// GPU sin の微小角誤差回避（テイラー切替＝GLSL 版と同一）
fn sinP(x: f32) -> f32 {
	let x2 = x * x;
	return select(sin(x), x * (1.0 - x2 * (1.0 / 6.0) * (1.0 - x2 * (1.0 / 20.0))), abs(x) < 0.1);
}
fn cosP(x: f32) -> f32 { let s = sinP(0.5 * x); return 1.0 - 2.0 * s * s; }
// 楕円体 dβ（GLSL gint 版と同式・球＝ellT2/elevP.yz=0 で補正が厳密0。F.trig は β の三角）
fn dBeta(dp: f32) -> f32 {
	if (F.elevP.w < 0.5) { return dp; }   // 球＝恒等を早期return＝補正の三角関数を毎頂点払わない
	let sd = sinP(dp); let cd = cosP(dp); let s2d = sinP(2.0 * dp); let c2d = cosP(2.0 * dp);
	return dp - 2.0 * 0.0016792203863837047    * (F.ellT2.x * cd  - F.ellT2.y * sd)  * sd
	          + 2.0 * 0.0000014098905530233192 * (F.elevP.y * c2d - F.elevP.z * s2d) * s2d;
}
// 原点相対 RTE：頂点3D − 原点3D を桁落ちなしで直接作る（cos(θ)-1=-2sin²(θ/2)）
// dlat は dBeta で β差分へ（球では恒等）＝以降は純粋な球面幾何（β単位球）
fn deltaToRel(dlonDeg: f32, dlatDeg: f32) -> vec3f {
	let da = dlonDeg * D2R; let db = dBeta(dlatDeg * D2R);
	let sda = sinP(da); let sdb = sinP(db);
	let sha = sinP(da * 0.5); let shb = sinP(db * 0.5);
	let cdaM1 = -2.0 * sha * sha; let cdbM1 = -2.0 * shb * shb;
	let cda = 1.0 + cdaM1; let cdb = 1.0 + cdbM1;
	let ccM1 = cdaM1 + cdbM1 + cdaM1 * cdbM1;
	let cLon = F.trig.x; let sLon = F.trig.y; let cLat = F.trig.z; let sLat = F.trig.w;
	let rx = cLat * cLon * ccM1 - cLat * sLon * cdb * sda - sLat * cLon * sdb * cda + sLat * sLon * sdb * sda;
	let ry = sLat * cdbM1 + cLat * sdb;
	let rz = cLat * sLon * ccM1 + cLat * cLon * cdb * sda - sLat * sLon * sdb * cda - sLat * cLon * sdb * sda;
	return vec3f(rx, ry, rz);
}
fn compact16(m0: u32) -> u32 {
	var m = m0 & 0x55555555u;
	m = (m | (m >> 1u)) & 0x33333333u;
	m = (m | (m >> 2u)) & 0x0F0F0F0Fu;
	m = (m | (m >> 4u)) & 0x00FF00FFu;
	m = (m | (m >> 8u)) & 0x0000FFFFu;
	return m;
}
// 経度Δ（1e-7°単位・符号付き最短）。360e7 周期を uint のまま畳む＝exact（float 化の格子化を避ける）
fn dlonE7(a: u32, b: u32) -> f32 {
	var d = max(a, b) - min(a, b);
	var sg = select(-1.0, 1.0, a >= b);
	if (d > 1800000000u) { d = 3600000000u - d; sg = -sg; }
	return f32(d) * sg;
}
// gint 整数 → 原点相対 delta (deg)
fn decodeDLL(idx: u32) -> vec2f {
	let px = arcAt(idx);
	let lo = px.r; let hi = px.g;
	let lo_c = select(lo & 0xFFFFFFC0u, lo, (hi >> 31u) != 0u);
	let hi_c = hi & 0x7FFFFFFFu;
	let ix = (compact16(hi_c) << 16u) | compact16(lo_c);
	let iy = (compact16(hi_c >> 1u) << 16u) | compact16(lo_c >> 1u);
	return vec2f(dlonE7(ix, F.centers.x) * 1e-7, f32(i32(iy - F.centers.y)) * 1e-7);
}
fn decodeRel(idx: u32) -> vec3f {
	let dLL = decodeDLL(idx);
	return deltaToRel(dLL.x, dLL.y);
}
// 縫い目上の頂点か（ix が ±180 ちょうど）＝切断の痕。両端が縫い目上の辺は線パスで描かない（GL onSeam と同じ・9/15）
fn onSeam(idx: u32) -> bool {
	let px = arcAt(idx);
	let lo = px.r; let hi = px.g;
	let lo_c = select(lo & 0xFFFFFFC0u, lo, (hi >> 31u) != 0u);
	let ix = (compact16(hi & 0x7FFFFFFFu) << 16u) | compact16(lo_c);
	return ix == 0u || ix == 3600000000u;
}
struct Proj { xy: vec2f, zr: f32, w: f32 };
// gint 整数 → screen px（zr>0 手前半球）
fn fetchProject(idx: u32) -> Proj {
	let rel = decodeRel(idx);
	let zr = F.originZr + dot(rel, F.eye);
	let clip = F.clipT + F.mvp * vec4f(rel, 0.0);
	if (clip.w <= 0.0) { return Proj(F.viewport * 0.5, -1.0, clip.w); }
	let ndc = clip.xy / clip.w;
	return Proj(vec2f((ndc.x * 0.5 + 0.5) * F.viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * F.viewport.y), zr, clip.w);
}
// 深度統合用：標高ドレープ込み投影（elevScale=0 なら fetchProject と同一）。
// drapeRelW（rel＋経緯度 → 標高変位後の relW）と projectRel（rel/relW → screen px）に分けてある＝地形適応細分の
// サブ端点（大円上の内挿点＝idx を持たない）も同じ式で乗せる（GL programs.js と 1:1・2026-09-21）。
fn drapeRelW(rel: vec3f, dLL: vec2f) -> vec3f {
	var relW = rel;
	if (F.depthP.z > 0.0 && F.depthP.w > 0.5) {
		var dir = F.originPt + rel;
		let df = 1.0 - smoothstep(F.depthP.y * 0.8, F.depthP.y * 2.0, distance(F.eye, dir));
		let ll = F.origin + dLL;
		let h = elevQAt(ll) * F.depthP.z * df;   // 案A
		if (F.elevP.w > 0.5) {   // 楕円体＝測地法線で変位（renderer liftDir と同式＝基図の線と同じ高さ）
			let p = ll.y * D2R; let l = ll.x * D2R; let cp = cos(p);
			dir = vec3f(cp * cos(l), sin(p) * 1.0033640898209764, cp * sin(l));
		}
		relW = rel + h * dir;
	}
	return relW;
}
fn projectRel(rel: vec3f, relW: vec3f) -> Proj {
	let zr = F.originZr + dot(rel, F.eye);
	let clip = F.clipT + F.mvp * vec4f(relW, 0.0);
	if (clip.w <= 0.0) { return Proj(F.viewport * 0.5, -1.0, clip.w); }
	let ndc = clip.xy / clip.w;
	return Proj(vec2f((ndc.x * 0.5 + 0.5) * F.viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * F.viewport.y), zr, clip.w);
}
fn projectDrape(idx: u32) -> Proj {
	let dLL = decodeDLL(idx);
	let rel = deltaToRel(dLL.x, dLL.y);
	return projectRel(rel, drapeRelW(rel, dLL));
}
// ── 地形適応細分（3D ドレープの地形貫きの根治・2026-09-21・GL programs.js subRange/slerpRel と 1:1）──
// 線 VS を辺×N インスタンスで起動し、辺を N 個までのサブ区間に割って各サブ端点を地形メッシュ面へ乗せる。
// N は draw の firstInstance 上位16bit（instance_index=firstInstance+i）で運ぶ＝UBO を run ごとに書き換えない。
// 区間長の目安＝メッシュ1セル・近傍窓 meshP.yz の内側に集中（外側 1/8）・窓境界 1/32 倍数・窓内は辺の 2 進格子（入れ子＝滑らない）。
fn pow2ceil(x: i32) -> i32 { var p = 1; while (p < x) { p = p << 1u; } return p; }
fn slerpRel(ra: vec3f, rb: vec3f, t: f32) -> vec3f {
	let c = distance(ra, rb);
	if (c < 1e-9) { return ra; }
	let w = 2.0 * asin(min(0.5 * c, 1.0));
	let sw = sinP(w);
	let ka = sinP((1.0 - t) * w) / sw; let kb = sinP(t * w) / sw;
	let ko = 2.0 * sinP(0.5 * t * w) * sinP(0.5 * (1.0 - t) * w) / cosP(0.5 * w);   // ka+kb−1（相殺なし）
	return ka * ra + kb * rb + ko * F.originPt;
}
struct SubR { ok: bool, ts: f32, te: f32 };
fn subRange(dA: vec2f, dB: vec2f, s: i32, N: i32) -> SubR {
	var r = SubR(s == 0, 0.0, 1.0);
	if (N <= 1 || F.meshP.x < 1.5 || !(F.depthP.z > 0.0 && F.depthP.w > 0.5)) { return r; }
	let cell = F.meshQ.zw / (F.meshP.x - 1.0);
	let d = dB - dA;
	var t0 = 0.0; var t1 = 1.0;
	if (F.meshP.y > 0.0) {
		let near = F.meshP.yz;
		for (var i = 0; i < 2; i++) {
			var p = -d[i]; var q = dA[i] + near[i];
			if (p == 0.0) { if (q < 0.0) { t0 = 1.0; t1 = 0.0; } } else { let rr = q / p; if (p < 0.0) { t0 = max(t0, rr); } else { t1 = min(t1, rr); } }
			p = d[i]; q = near[i] - dA[i];
			if (p == 0.0) { if (q < 0.0) { t0 = 1.0; t1 = 0.0; } } else { let rr = q / p; if (p < 0.0) { t0 = max(t0, rr); } else { t1 = min(t1, rr); } }
		}
		if (t0 > t1) { t0 = 0.0; t1 = 0.0; } else { t0 = floor(t0 * 32.0) / 32.0; t1 = ceil(t1 * 32.0) / 32.0; }
	}
	let pre = select(0, 1, t0 > 0.0); let post = select(0, 1, t1 < 1.0);
	if (N < pre + post + 1) { return r; }
	var nIn = 0;   // 窓内＝辺自身のパラメータの 2 進格子（GL と同じ＝窓が動いても境界は同じ格子＝完全な入れ子）
	if (t1 > t0) {
		let cAll = max(abs(d.x) / cell.x, abs(d.y) / cell.y);
		var Ln = 0; while (f32(1 << u32(Ln)) < cAll && Ln < 12) { Ln++; }
		var Lc = 0; while (f32(1 << u32(Lc + 1)) * (t1 - t0) <= f32(N - pre - post) && Lc < 12) { Lc++; }
		let L = min(Ln, Lc);
		if (L >= 5) { nIn = i32((t1 - t0) * f32(1 << u32(L)) + 0.5); }
		else { nIn = min(pow2ceil(i32(ceil(min(cAll * (t1 - t0), 4096.0)))), N - pre - post); }
		nIn = max(nIn, 1);
	}
	let rem = N - nIn; var nPre = 0; var nPost = 0;
	if (pre == 1) { let c = max(abs(d.x) * t0 / cell.x, abs(d.y) * t0 / cell.y) * 0.125; nPre = clamp(pow2ceil(i32(ceil(min(c, 4096.0)))), 1, select(rem, rem / 2, post == 1)); }
	if (post == 1) { let c = max(abs(d.x) * (1.0 - t1) / cell.x, abs(d.y) * (1.0 - t1) / cell.y) * 0.125; nPost = clamp(pow2ceil(i32(ceil(min(c, 4096.0)))), 1, rem - nPre); }
	let n = nPre + nIn + nPost;
	if (s >= n) { r.ok = false; return r; }
	r.ok = true;
	if (s < nPre) { r.ts = t0 * f32(s) / f32(nPre); r.te = t0 * f32(s + 1) / f32(nPre); }
	else if (s < nPre + nIn) { let k = s - nPre; r.ts = t0 + (t1 - t0) * f32(k) / f32(nIn); r.te = t0 + (t1 - t0) * f32(k + 1) / f32(nIn); }
	else { let k = s - nPre - nIn; r.ts = t1 + (1.0 - t1) * f32(k) / f32(nPost); r.te = t1 + (1.0 - t1) * f32(k + 1) / f32(nPost); }
	return r;
}
// stencil 用：クリップ座標のまま（部分表示でも巻き数が壊れない）。z は GL[-w,w]→WebGPU[0,w] へ等価写像
// 裏半球の頂点を地平円へ射影クランプ（GL horizonClamp・wgsl.js OVERLAY vsStencil p0.z と同式）＝塗り扇の端点専用。
// 裏の面は円周上に縮退（巻き数 0）・跨ぎ面は可視部だけを囲む＝球を透かしたゴースト/±1 相殺の根治（2026-09-15）。
fn horizonClamp(relW: vec3f) -> vec3f {
	// 可視判定は RTE 形（F.originZr＋dot(rel,eye)）＝絶対座標の内積は高ズームで相殺し可視頂点が地平円へ飛ぶ（GL 版と同じ根治 9/15）
	if (F.originZr + dot(relW, F.eye) >= 0.0) { return relW; }
	let Pt = F.originPt + relW;
	let e2 = dot(F.eye, F.eye);
	let Pp = Pt - F.eye * (dot(Pt, F.eye) / e2);
	let lp = length(Pp);
	var t = normalize(vec3f(-F.eye.z, 0.0, F.eye.x));
	if (lp > 1e-6) { t = Pp / lp; }
	return F.eye / e2 + sqrt(max(1.0 - 1.0 / e2, 0.0)) * t - F.originPt;
}
fn atlasClip(dlon: f32, dlat: f32) -> vec4f {   // 窓座標モード＝原点相対 dLL(deg) を経緯度整列の窓へ線形写像（ATLAS_FILL_WGSL と同式）
	let p = (F.atlas.xy + vec2f(dlon, dlat)) * F.atlas.zw;
	return vec4f(p * 2.0 - 1.0, 0.5, 1.0);
}
fn fetchClip(idx: u32) -> vec4f {
	let c = F.clipT + F.mvp * vec4f(horizonClamp(decodeRel(idx)), 0.0);
	return vec4f(c.xy, (c.z + c.w) * 0.5, c.w);
}
// 塗り扇(stencil/idfill)を地形にドレープ＝projectDrape と同じ標高変位のクリップ座標版。elevScale=0(真俯瞰)なら fetchClip と同一
//（既存挙動を壊さない）。町丁目 overlay の面ドレープ(wgsl.js OVERLAY_WGSL vsStencil・2026-08-13)を gint 塗り扇へ写す＝
// 汚い土砂ポリゴン(自己交差/重なり)も winding で斜面に貼る。扇の pivot は非ドレープでよい（winding は screen で pivot 不変）。
fn fetchClipDrape(idx: u32) -> vec4f {
	let dLL = decodeDLL(idx);
	if (F.atlasQ.x > 0.5) { return atlasClip(dLL.x, dLL.y); }   // 窓座標モード
	let rel = deltaToRel(dLL.x, dLL.y);
	var relW = rel;
	if (F.depthP.z > 0.0 && F.depthP.w > 0.5) {
		var dir = F.originPt + rel;
		let df = 1.0 - smoothstep(F.depthP.y * 0.8, F.depthP.y * 2.0, distance(F.eye, dir));
		let ll = F.origin + dLL;
		let h = elevQAt(ll) * F.depthP.z * df;   // 案A
		if (F.elevP.w > 0.5) { let p = ll.y * D2R; let l = ll.x * D2R; let cp = cos(p); dir = vec3f(cp * cos(l), sin(p) * 1.0033640898209764, cp * sin(l)); }
		relW = rel + h * dir;
	}
	let c = F.clipT + F.mvp * vec4f(horizonClamp(relW), 0.0);
	return vec4f(c.xy, (c.z + c.w) * 0.5, c.w);
}
fn toNDC(p: vec2f) -> vec4f {
	return vec4f(2.0 * p.x / F.viewport.x - 1.0, 1.0 - 2.0 * p.y / F.viewport.y, 0.0, 1.0);
}
fn fetchEdgeMeta(edgeId: i32) -> vec4u {
	return metaAt(edgeId);
}
// gint 整数 (ix, iy)（decodeDLL と同じ展開・整数のまま）と辺スパン（e7・経度は 360e7 周期の最短側）＝bake の細分バケット分類と厳密同値
fn decodeIXY(idx: u32) -> vec2u {
	let px = arcAt(idx);
	let lo = px.r; let hi = px.g;
	let loC = select(lo & 0xFFFFFFC0u, lo, (hi >> 31u) != 0u);
	let hiC = hi & 0x7FFFFFFFu;
	return vec2u((compact16(hiC) << 16u) | compact16(loC), (compact16(hiC >> 1u) << 16u) | compact16(loC >> 1u));
}
fn spanE7(a: u32, b: u32) -> u32 {
	let A = decodeIXY(a); let B = decodeIXY(b);
	var dx = max(A.x, B.x) - min(A.x, B.x); if (dx > 1800000000u) { dx = 3600000000u - dx; }
	let dy = max(A.y, B.y) - min(A.y, B.y);
	return max(dx, dy);
}
// 頂点の VW rank（terminal=63 常時保持、他は低6bit）
fn fetchRank(idx: u32) -> u32 {
	let px = arcAt(idx);
	return select(px.r & 0x3Fu, 63u, (px.g >> 31u) != 0u);
}
fn fetchFidBbox(fid: u32) -> vec4u {
	return textureLoad(pivotTex, vec2i(i32(fid) % i32(F.flags.z), i32(fid) / i32(F.flags.z)), 0);
}
// 塗り扇の鍵（GL fanKey と同式）：表が無ければ fid・あれば fid か構成ポリゴンの行（pivot の fid の後ろ）＝要と裏側カリングをポリゴン単位に。
// 世界規模の気候区分（アジアと南米が 1 地物）を地物 bbox で見ると半球級＝裏側の片も描かれ、地平円へ潰れた環が画面を一周して海まで塗った（2026-10-17）
fn fanKey(edgeId: i32, fid: u32) -> u32 {
	if (F.farBig.z == 0u) { return fid; }
	return textureLoad(compTex, vec2i(edgeId % i32(F.farBig.z), edgeId / i32(F.farBig.z)), 0).r;
}
// feature 単位 GPU bbox カリング
// 球面キャップの可視判定（GL capVisible と同式）：bbox を囲む小円 (C, rad) が可視キャップ（Ê, hor）と交わらなければ
// 完全に裏＝捨てる。rad＝矩形内の最遠点（緯線上は角・経線上は Δλ>90° のくぼみを解析的に）＋3.5° の余裕。
// 経度スパン ≥180° の免除は外した（GL と同じ・2026-10-17）：全幅の bbox でも rad が中心の対蹠経線まで伸びる＝保守的に正しい。免除は南極の EF 等を裏側でも描き、環が地平円を一周して画面全体を塗った
fn capVisible(bb: vec4u) -> bool {
	let cx = (bb.x + (bb.z - bb.x) / 2u) % 3600000000u; let cy = bb.y + (bb.w - bb.y) / 2u;   // 周期対応 bbox＝中心を [0,360e7) へ
	let latC = (F.origin.y + f32(i32(cy - F.centers.y)) * 1e-7) * D2R;
	let lat0 = (F.origin.y + f32(i32(bb.y - F.centers.y)) * 1e-7) * D2R;
	let lat1 = (F.origin.y + f32(i32(bb.w - F.centers.y)) * 1e-7) * D2R;
	let dl = min(f32(bb.z - bb.x) * 0.5e-7, 180.0) * D2R;
	let A = sin(latC); let B = cos(latC) * cos(dl);
	var cr = min(A * sin(lat0) + B * cos(lat0), A * sin(lat1) + B * cos(lat1));
	if (B < 0.0) {
		var phiT = atan2(A, B);
		phiT += select(3.141592653589793, -3.141592653589793, phiT > 0.0);
		if (phiT >= lat0 && phiT <= lat1) { cr = -sqrt(A * A + B * B); }
	}
	cr = clamp(cr, -1.0, 1.0);
	let sr = sqrt(1.0 - cr * cr);
	let crm = cr * 0.998135 - sr * 0.061049;
	let srm = sqrt(max(1.0 - crm * crm, 0.0));
	let el = length(F.eye); let ch = min(1.0, 1.0 / el); let sh = sqrt(max(1.0 - ch * ch, 0.0));
	if (crm <= -ch) { return true; }   // rad'+hor ≥ 180°＝キャップは必ず交わる（GL と同じ・閾値 cos(hor+rad') は和が 180° を超えると裏と誤判定＝縫い目に頂点を持つ環が消えた 2026-10-17）
	let C = normalize(F.originPt + deltaToRel(dlonE7(cx, F.centers.x) * 1e-7, f32(i32(cy - F.centers.y)) * 1e-7));
	return dot(C, F.eye) / el > ch * crm - sh * srm;
}
fn bboxVisible(fid: u32) -> bool {
	if (F.flags.x == 0u) { return true; }   // bbox テクスチャ無し（境界メタ＝fid 混成ループ）＝カリング不可
	let bb = fetchFidBbox(fid);
	if (F.flags.y != 0u) {   // 縫い目跨ぎ（x>360e7）＝東片 [0, bb.z−360e7] と西片 [bb.x, 360e7] の 2 区間（GL と同じ）
		if (bb.w < F.vbb.y || bb.y > F.vbb.w) { return false; }
		let xi = select(!(bb.z < F.vbb.x || bb.x > F.vbb.z), (F.vbb.x <= bb.z - 3600000000u || F.vbb.z >= bb.x), bb.z > 3600000000u);
		if (!xi) { return false; }
	}
	if (F.atlasQ.x > 0.5) { return true; }   // 窓座標モード＝vbb（窓 bbox）だけで刈る・地平キャップは無い
	return capVisible(bb);
}
// ── 窓座標モード（地面アトラスへの焼き込み）の塗り扇の頂点（GL programs.ts atlasFanVertex と 1:1）──
// 頂点ごとの最短周回では原点の対蹠経線（origin±180°）を跨ぐ環が窓の両端に割れ、割れ目の辺（幅 360°）と扇の閉じ残しが緯線帯として
// 窓を横切った（チルトの「世界の地形」でケッペンの帯・2026-10-17）。環（鍵＝構成ポリゴン）の bbox 中心の周りで連続になるよう ±360° ずらし、
// 原点±180° を跨ぐ環は反対側の写し（±360°）をインスタンス 1 で描く。ずらす量は整数（e7）で決め、位置は従来の dlonE7＋360 の整数倍
fn dlonE7i(a: u32, b: u32) -> i32 {
	var d = max(a, b) - min(a, b); var neg = a < b;
	if (d > 1800000000u) { d = 3600000000u - d; neg = !neg; }
	return select(i32(d), -i32(d), neg);
}
fn keyLonSpan(key: u32) -> vec2i {   // x＝鍵の bbox 中心の原点相対経度（e7）・y＝半幅（e7）。bbox 無し＝(0,0)
	if (F.flags.x == 0u) { return vec2i(0, 0); }
	let bb = fetchFidBbox(key);
	let cx = (bb.x + (bb.z - bb.x) / 2u) % 3600000000u;
	return vec2i(dlonE7i(cx, F.centers.x), i32((bb.z - bb.x) / 2u));
}
fn atlasCopyShift(cs: vec2i) -> f32 {   // 写し（インスタンス 1）のずらし量（deg）。0＝写し不要
	if (f32(cs.x) + f32(cs.y) > 1.8e9) { return -360.0; }
	if (f32(cs.x) - f32(cs.y) < -1.8e9) { return 360.0; }
	return 0.0;
}
fn atlasFanVertex(idx: u32, cs: vec2i, shift: f32) -> vec4f {
	let v = decodeIXY(idx);
	let dx = dlonE7i(v.x, F.centers.x);
	var k = 0.0;
	if (F.flags.x != 0u) { let diff = f32(dx) - f32(cs.x); if (diff > 1.8e9) { k = -1.0; } else if (diff < -1.8e9) { k = 1.0; } }
	return atlasClip(f32(dx) * 1e-7 + 360.0 * k + shift, f32(i32(v.y - F.centers.y)) * 1e-7);
}
// stencil 塗りの扇要（feature bbox 中心）＝TBDR パラメータバッファ対策。無し＝クリップ原点（z01写像済み）
fn pivotClip(fid: u32) -> vec4f {
	if (F.flags.x == 0u) {   // 単一要（境界メタ）＝クリップ原点（z は WebGPU [0,w] の中央）か遠方の 1 点（farQ.z=2・GL と同じ）
		if (F.farQ.z > 1.5) { return vec4f(F.farA.xy, 0.5, 1.0); }
		return vec4f(0.0, 0.0, 0.5, 1.0);
	}
	let bb = fetchFidBbox(fid);
	if (bb.z - bb.x >= 1800000000u) { return vec4f(0.0, 0.0, 0.5, 1.0); }   // 経度全幅＝中心が裏側＝遠クリップの円盤→クリップ原点（GL と同じ・9/15）
	// 視野より大きい feature＝要を遠方へ（画面外の辺の三角形を画面外に収める＝GPU が捨てる・GL pivotClip と同式）。
	// 張り出し最小の側へ帯が伸びるよう、要はその反対側の遠方。縫い目跨ぎ（x>360e7）は従来どおり
	if (F.farQ.z > 0.5 && F.flags.y != 0u && bb.z <= 3600000000u && (bb.z - bb.x > F.farBig.x || bb.w - bb.y > F.farBig.y)) {
		let oL = (f32(F.vbb.x) - f32(bb.x)) * F.farQ.x; let oR = (f32(bb.z) - f32(F.vbb.z)) * F.farQ.x;
		let oB = (f32(F.vbb.y) - f32(bb.y)) * F.farQ.y; let oT = (f32(bb.w) - f32(F.vbb.w)) * F.farQ.y;
		var d = F.farA.xy; var m = oL;   // 西が最小＝帯は西へ・要は東の遠方
		if (oR < m) { m = oR; d = -F.farA.xy; }
		if (oB < m) { m = oB; d = F.farA.zw; }
		if (oT < m) { d = -F.farA.zw; }
		return vec4f(d * F.farQ.w, 0.5, 1.0);
	}
	let cx = (bb.x + (bb.z - bb.x) / 2u) % 3600000000u; let cy = bb.y + (bb.w - bb.y) / 2u;   // 周期対応 bbox＝中心を [0,360e7) へ
	let dlon = dlonE7(cx, F.centers.x) * 1e-7;
	let dlat = f32(i32(cy - F.centers.y)) * 1e-7;
	if (F.atlasQ.x > 0.5) { return atlasClip(dlon, dlat); }   // 窓座標モード
	let c = F.clipT + F.mvp * vec4f(deltaToRel(dlon, dlat), 0.0);
	return vec4f(c.xy, (c.z + c.w) * 0.5, c.w);
}
// GPU Dynamic LOD（gap無し）：A が閾値未満は捨て、B は「次に閾値を満たす頂点」まで前方スナップ
struct Snap { keep: bool, a: u32, b: u32 };
fn lodSnap(a: u32, b0: u32, edgeId: i32) -> Snap {
	if (f32(fetchRank(a)) < F.lodRank) { return Snap(false, a, b0); }
	var b = b0;
	for (var k = 1; k < 4096; k++) {
		if (f32(fetchRank(b)) >= F.lodRank) { break; }
		let m = fetchEdgeMeta(edgeId + k);
		if (m.r != b) { break; }
		b = m.g;
	}
	return Snap(true, a, b);
}
fn fmod(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }   // GLSL mod（floor型）
const DEGEN: vec4f = vec4f(2.0, 0.0, 0.5, 1.0);   // 画面外へ捨てる縮退頂点
`,kd=`
${Dd}
struct LineOut {
	@builtin(position) pos: vec4f,
	@location(0) color: vec4f,
	@location(1) zr: f32,
	@location(2) dist: f32,
	@location(3) @interpolate(flat) halfw: f32,
	@location(4) @interpolate(flat) dash: vec2f,
	@location(5) @interpolate(flat) distBase: f32,
	@location(6) frag: vec2f,
	@location(7) @interpolate(flat) ea: vec2f,
	@location(8) @interpolate(flat) eb: vec2f,
};
@vertex fn vsRender(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> LineOut {
	var o: LineOut;
	o.pos = DEGEN;
	var edgeId = i32(vi) / 4;   // index の 4 頂点/辺（perf plan P3・2026-09-27）＝drawIndexed の baseVertex に est×4 が乗る。旧 6 頂点の draw は quad6WGSL（?quad4=0）
	let sub = i32(vi) % 4;
	let subN = i32(ii >> 16u); let subS = i32(ii & 0xFFFFu);   // 地形適応細分：N（firstInstance 上位16bit）と区間番号 s
	var em = fetchEdgeMeta(edgeId);
	let dupRow = (em.b & 128u) != 0u;   // 複製行（長辺の細分用・メタ末尾）＝元の辺へ引き直す（歩行・破線位相は元の辺）
	if (dupRow) { edgeId = i32(em.b >> 8u); em = fetchEdgeMeta(edgeId); }
	let featId = i32(em.a);
	// feature bbox カリング（ポリゴン辺のみ＝styleId 0）
	if ((em.b & 255u) == 0u && !bboxVisible(em.a)) { return o; }
	// 地形適応細分：メイン描画（clean）は skip 下限以上の長辺を飛ばす＝同じ辺の複製行がインスタンス描画で細分する（整数スパン＝bake と厳密一致）
	let skipE7 = u32(F.meshP.w);
	if (!dupRow && P.b.y == 0 && skipE7 > 0u && spanE7(em.r, em.g) >= skipE7) { return o; }
	let sn = lodSnap(em.r, em.g, edgeId);
	if (!sn.keep) { return o; }
	if ((em.b & 255u) == 0u && onSeam(sn.a) && onSeam(sn.b)) { return o; }   // 切断の縦線（縫い目辺）は描かない
	if (P.b.y == 0 && featId == P.b.x) { return o; }   // clean パス＝アクティブ除外
	if (P.b.y == 1 && featId != P.b.x) { return o; }   // highlight パス＝アクティブのみ
	// per-fid スタイル（paint 時のみ）：visibility=filter・width=0=非表示・線色上書き
	var lw = P.a.x;
	var fidColor = vec4f(0.0);
	var fidDash = vec2f(0.0);   // 表の第 4 語（線の地物）＝[線, 間] 1/8 CSS px の u16×2（MapLibre の line-dasharray・GL programs.js と対・2026-09-26）
	if (F.flags.w != 0u) {
		let rec = textureLoad(fidTex, vec2i(i32(em.a) % i32(F.flags.w), i32(em.a) / i32(F.flags.w)), 0);
		if (rec.a != 0u) { fidDash = vec2f(f32(rec.a >> 16u), f32(rec.a & 0xFFFFu)) * 0.125 * select(1.0, bitcast<f32>(P.b.z), P.b.z != 0); }
		if ((rec.b & 1u) == 0u) { return o; }
		let w8 = (rec.b >> 24u) | (((rec.b >> 16u) & 255u) << 8u);   // 線幅 u16（1/8px・下位は bit 24〜・上位は bit 16〜＝2026-10-22 から）
		if (w8 == 0u) { return o; }
		lw = f32(w8) * 0.125 * select(1.0, bitcast<f32>(P.b.z), P.b.z != 0) + P.a.y;   // 表は 1/8 CSS px → device px（×dpr・GL の u_fid_wscale と対・U1）
		let lc = rec.g;
		if ((lc & 255u) != 0u) {
			fidColor = vec4f(f32(lc >> 24u), f32((lc >> 16u) & 255u), f32((lc >> 8u) & 255u), f32(lc & 255u)) / 255.0;
		}
	}
	if (P.b.y == 1 && P.a.z > 0.0) { lw = P.a.z; }   // ホバー(hilite)＝指定全幅(device px・radius欄で運搬)を最優先＝per-fid幅/コロプレスに左右されず overlay 町丁目線と一致
	// クアッドは「辺の正準方向（a→b）」で tang/perp を共有（GL版 programs.js と同時修正 8/20）。
	// 旧＝各頂点が自端基準で dir を取り A/B で perp が反転＝ボウタイ（太線のねじれ・片側欠けの根治）
	let useA = sub < 2;   // 4 頂点＝0:A− 1:A+ 2:B+ 3:B−（index [0,1,2,0,2,3]＝旧 6 列 (A−)(A+)(B+)(A−)(B+)(B−) と同じ三角形・同じ向き）
	let side = select(-1.0, 1.0, sub == 1 || sub == 2);
	var pa3: Proj; var pb3: Proj;
	var subOff = 0.0;   // 破線位相の近似基底（このサブ区間より前の区間数）
	if (subN <= 1) {
		pa3 = projectDrape(sn.a);   // 従来経路（2D/地形なし）
		pb3 = projectDrape(sn.b);
	} else {                       // 地形適応細分：サブ区間 s の端点を大円上に内挿して面へ乗せる
		let dA = decodeDLL(sn.a); let dB = decodeDLL(sn.b);
		let sr = subRange(dA, dB, subS, subN);
		if (!sr.ok) { return o; }
		let rA = deltaToRel(dA.x, dA.y); let rB = deltaToRel(dB.x, dB.y);
		let r0 = slerpRel(rA, rB, sr.ts); let r1 = slerpRel(rA, rB, sr.te);
		pa3 = projectRel(r0, drapeRelW(r0, mix(dA, dB, sr.ts)));   // 標高は経緯度線形の t で標本（大円との差は ≤120m×(span/1°)²）
		pb3 = projectRel(r1, drapeRelW(r1, mix(dA, dB, sr.te)));
		subOff = f32(subS);
	}
	o.zr = select(pb3.zr, pa3.zr, useA);
	var axy = pa3.xy; var bxy = pb3.xy;
	if (pb3.zr < 0.0 && pa3.zr > 0.0) { bxy = pa3.xy + (pa3.zr / (pa3.zr - pb3.zr)) * (pb3.xy - pa3.xy); }
	if (pa3.zr < 0.0 && pb3.zr > 0.0) { axy = pb3.xy + (pb3.zr / (pb3.zr - pa3.zr)) * (pa3.xy - pb3.xy); }
	// 対数深度（renderer と同式・同係数の z01）。logCoef=0（深度オフ）は z=0
	let wS = select(pb3.w, pa3.w, useA);
	let zc = select(0.0, log1pG(max(wS, 1e-30)) * 1.4426950 * F.depthP.x * 0.5, F.depthP.x > 0.0);   // 1.0+w の桁落ちを避ける（GF の log1pG）
	let dir = bxy - axy;
	let len = length(dir);
	if (len < 1e-4) { let nd0 = toNDC(axy); o.pos = vec4f(nd0.xy, zc, 1.0); return o; }
	let tang = dir / len;
	let perp = vec2f(-tang.y, tang.x);
	let halfPx = lw * 0.5 + 1.0;   // AA余白込み（device px 一本＝GL の u_dpr=1 と同じ）
	let qpos = select(bxy, axy, useA) + side * halfPx * perp + select(halfPx, -halfPx, useA) * tang;
	let nd = toNDC(qpos);
	o.pos = vec4f(nd.xy, zc, 1.0);
	o.frag = qpos; o.ea = axy; o.eb = bxy;
	let styleIdx = i32(em.b & 0xFFu);
	let baseC = select(S.style[styleIdx], fidColor, fidColor.a > 0.0);
	// ホバー(pass1)＝P.color(hiliteColor)指定ならそれ（census=青）／未指定は黄（凍結デモの既定ハイライトを維持）
	o.color = select(baseC, select(vec4f(1.0, 0.9, 0.0, 1.0), P.color, P.color.a > 0.0), P.b.y == 1);
	o.dash = select(S.dash[styleIdx].xy, fidDash, fidDash.y > 0.0);
	o.distBase = f32(em.b >> 8u) * 0.017453292 + subOff * len;   // ＋サブ区間ぶん（等長近似＝破線位相を辺内で繋ぐ）
	o.dist = select(len, 0.0, useA);
	o.halfw = lw * 0.5;
	return o;
}
@fragment fn fsRender(in: LineOut) -> @location(0) vec4f {
	// fwidth は WGSL の uniformity 規則で分岐内から呼べない＝無条件で先に取る（discard は demote＝微分は健在）
	let aaD = max(fwidth(in.dist), 0.001);
	let pa = in.frag - in.ea; let ba = in.eb - in.ea;
	let t2 = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
	let dcap = length(pa - ba * t2);
	let aaW = max(fwidth(dcap), 1e-3);
	if (in.zr < -0.05) { discard; }
	if (in.color.a == 0.0) { discard; }
	// 地平線フェード窓＝カメラ高さ比例（GL版 FS_RENDER と同時修正 8/20：固定窓は高ズームで全面半透明化）
	// 下限 2e-4（≈1.3km）はカメラ高度がそれを割る近景で線を全面半透明にした（GL 版 FS_RENDER と同時修正 2026-11-05）
	let win = clamp((length(F.eye) - 1.0) * 0.5, 1e-8, 0.02);
	var alpha = in.color.a * smoothstep(-win * 0.5, win, in.zr);
	if (P.a.w > 0.5) {   // 隠線（尾根の向こう）＝淡い固定破線（CAD流）
		let t = fmod(in.distBase + in.dist, 10.0);
		alpha *= (1.0 - smoothstep(6.0 - aaD, 6.0 + aaD, t)) * 0.35;
	}
	if (in.dash.y > 0.0) {
		let d = in.distBase + in.dist;
		let period = in.dash.x + in.dash.y;
		let t = fmod(d, period);
		alpha *= 1.0 - smoothstep(in.dash.x - aaD, in.dash.x + aaD, t);
	}
	// カプセルSDF：両端が半円＝鋭角の繋ぎ目でもトゲが出ない
	alpha *= clamp((in.halfw - dcap) / aaW + 0.5, 0.0, 1.0);
	if (alpha < 0.004) { discard; }
	return vec4f(in.color.rgb, alpha);   // straight alpha（blend が SRC_ALPHA/1-SRC_ALPHA）
}
struct PickOut {
	@builtin(position) pos: vec4f,
	@location(0) color: vec4f,
	@location(1) zr: f32,
};
@vertex fn vsPickLine(@builtin(vertex_index) vi: u32) -> PickOut {
	var o: PickOut;
	o.pos = DEGEN;
	let edgeId = i32(vi) / 4;   // index の 4 頂点/辺（P3・描画 VS と同じ）
	let sub = i32(vi) % 4;
	let em = fetchEdgeMeta(edgeId);
	if ((em.b & 255u) == 0u) { return o; }   // ポリゴン辺＝JSレイキャスト側＝pick から除外
	if (F.flags.w != 0u &&
		(textureLoad(fidTex, vec2i(i32(em.a) % i32(F.flags.w), i32(em.a) / i32(F.flags.w)), 0).b & 1u) == 0u) { return o; }
	let sn = lodSnap(em.r, em.g, edgeId);
	if (!sn.keep) { return o; }
	let useA = sub < 2;   // 4 頂点＝0:A− 1:A+ 2:B+ 3:B−（index [0,1,2,0,2,3]＝旧 6 列 (A−)(A+)(B+)(A−)(B+)(B−) と同じ三角形・同じ向き）
	let side = select(-1.0, 1.0, sub == 1 || sub == 2);
	// 描画VSと同じ「辺の正準方向」でクアッドを張る（ボウタイ根治・同時修正 8/20）
	let pa3 = fetchProject(sn.a);
	let pb3 = fetchProject(sn.b);
	o.zr = select(pb3.zr, pa3.zr, useA);
	var axy = pa3.xy; var bxy = pb3.xy;
	if (pb3.zr < 0.0 && pa3.zr > 0.0) { bxy = pa3.xy + (pa3.zr / (pa3.zr - pb3.zr)) * (pb3.xy - pa3.xy); }
	if (pa3.zr < 0.0 && pb3.zr > 0.0) { axy = pb3.xy + (pb3.zr / (pb3.zr - pa3.zr)) * (pa3.xy - pb3.xy); }
	let dir = bxy - axy;
	let len = length(dir);
	if (len < 1e-4) { o.pos = toNDC(axy); return o; }
	let tang = dir / len;
	let perp = vec2f(-tang.y, tang.x);
	o.pos = toNDC(select(bxy, axy, useA) + side * (P.a.x * 0.5) * perp + select(1.0, -1.0, useA) * tang * (P.a.x * 0.5));
	let fid1 = em.a + 1u;
	o.color = vec4f(f32(fid1 & 255u) / 255.0, f32((fid1 >> 8u) & 255u) / 255.0, f32((fid1 >> 16u) & 255u) / 255.0, 1.0);
	return o;
}
@fragment fn fsPick(in: PickOut) -> @location(0) vec4f {
	if (in.zr < 0.0) { discard; }
	return in.color;
}
`,Id=`
${Dd}
struct SOut { @builtin(position) pos: vec4f };
@vertex fn vsStencil(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> SOut {
	var o: SOut;
	o.pos = DEGEN;
	let edgeId = i32(vi) / 3;
	let sub = i32(vi) % 3;
	let em = fetchEdgeMeta(edgeId);
	let key = fanKey(edgeId, em.a);   // 扇の鍵＝fid か構成ポリゴン（多片地物の層）
	if (!bboxVisible(key)) { return o; }
	let sn = lodSnap(em.r, em.g, edgeId);   // 塗り stencil は lodRank=0（GF側）＝全密度
	if (!sn.keep) { return o; }
	if (F.atlasQ.x > 0.5) {   // 窓座標モード＝環を鍵の中心の周りで連続に・写し（インスタンス 1）は ±360°
		let cs = keyLonSpan(key); let shift = select(atlasCopyShift(cs), 0.0, ii == 0u);
		if (ii != 0u && shift == 0.0) { return o; }
		o.pos = select(atlasFanVertex(select(sn.b, sn.a, sub == 1), cs, shift), pivotClip(key), sub == 0);
		return o;
	}
	if (sub == 0) { o.pos = pivotClip(key); return o; }
	o.pos = fetchClipDrape(select(sn.b, sn.a, sub == 1));   // 塗り扇の辺端点を地形へドレープ（真俯瞰=無変化）
	return o;
}
@fragment fn fsNull(in: SOut) -> @location(0) vec4f { return vec4f(0.0); }   // 色は writeMask=0 で殺す
struct MOut { @builtin(position) pos: vec4f, @location(0) @interpolate(flat) featId: i32 };
@vertex fn vsStencilMask(@builtin(vertex_index) vi: u32) -> MOut {
	var o: MOut;
	o.pos = DEGEN;
	let edgeId = i32(vi) / 3;
	let sub = i32(vi) % 3;
	let em = fetchEdgeMeta(edgeId);
	o.featId = i32(em.a);
	if (sub == 0) { o.pos = pivotClip(fanKey(edgeId, em.a)); return o; }
	o.pos = fetchClip(select(em.g, em.r, sub == 1));
	return o;
}
@fragment fn fsStencilMask(in: MOut) -> @location(0) vec4f {
	if (in.featId != P.b.x) { discard; }
	return vec4f(0.0);
}
struct FOut { @builtin(position) pos: vec4f };
@vertex fn vsFull(@builtin(vertex_index) vi: u32) -> FOut {   // フルスクリーン（cover / stencil ゼロ書き共用）
	var o: FOut;
	let x = select(-1.0, 3.0, vi == 1u);
	let y = select(-1.0, 3.0, vi == 2u);
	o.pos = vec4f(x, y, 0.5, 1.0);
	return o;
}
@fragment fn fsFill(in: FOut) -> @location(0) vec4f { return P.color; }   // straight alpha
// コロプレス ID 蓄積（idfill.js VS_ID/FS_ID）：stencil と同じ fan 幾何＋fid を flat varying へ。
// FS は front_facing で ±(fid+1) を rg16float へ加算＝R=Σ±(fid+1)・G=Σ±1(winding)。解決パスが R/G で fid 復元。
struct IdOut { @builtin(position) pos: vec4f, @location(0) @interpolate(flat) fid1: f32 };
@vertex fn vsId(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> IdOut {
	var o: IdOut;
	o.pos = DEGEN; o.fid1 = 0.0;
	let edgeId = i32(vi) / 3;
	let sub = i32(vi) % 3;
	let em = fetchEdgeMeta(edgeId);
	o.fid1 = f32(em.a + 1u);
	let key = fanKey(edgeId, em.a);   // 扇の鍵＝fid か構成ポリゴン（多片地物の層）＝要とカリングはポリゴン単位・ID は fid のまま
	if (!bboxVisible(key)) { return o; }
	// 不可視fid（filter で落とした feature）は winding 蓄積から除外する。含めると重複被覆時に
	// R/G が非整数化して解決パスが discard＝下の feature まで塗りが消える（振興局が市区町村に重なる
	// 北海道で実証 2026-08-12）。単被覆前提の idfill を「除外した feature は無い物」として正す。
	if (F.flags.w != 0u &&
		(textureLoad(fidTex, vec2i(i32(em.a) % i32(F.flags.w), i32(em.a) / i32(F.flags.w)), 0).b & 1u) == 0u) { return o; }
	let sn = lodSnap(em.r, em.g, edgeId);   // lodRank=0（GF側）＝全密度（自己交差斑点を出さない）
	if (!sn.keep) { return o; }
	if (F.atlasQ.x > 0.5) {   // 窓座標モード＝環を鍵の中心の周りで連続に・写し（インスタンス 1）は ±360°（vsStencil と対）
		let cs = keyLonSpan(key); let shift = select(atlasCopyShift(cs), 0.0, ii == 0u);
		if (ii != 0u && shift == 0.0) { return o; }
		o.pos = select(atlasFanVertex(select(sn.b, sn.a, sub == 1), cs, shift), pivotClip(key), sub == 0);
		return o;
	}
	if (sub == 0) { o.pos = pivotClip(key); return o; }
	o.pos = fetchClipDrape(select(sn.b, sn.a, sub == 1));   // 塗り扇の辺端点を地形へドレープ（真俯瞰=無変化）
	return o;
}
@fragment fn fsId(in: IdOut, @builtin(front_facing) ff: bool) -> @location(0) vec4f {
	let sgn = select(-1.0, 1.0, ff);
	return vec4f(sgn * in.fid1, sgn, 0.0, in.fid1);   // rg＝加算(ONE,ONE)・a＝MAX＝扇が触れた最大 fid+1（重複の後勝ち・向きに依らず＝CW 環も）
}
`,Nd=`
@group(0) @binding(0) var idTex: texture_2d<f32>;
@group(0) @binding(1) var fidTex: texture_2d<u32>;
@group(0) @binding(2) var<uniform> R: vec4u;   // (fid_w, fid_count, overlap, 0)
struct FOut { @builtin(position) pos: vec4f };
@vertex fn vs(@builtin(vertex_index) vi: u32) -> FOut {
	var o: FOut;
	o.pos = vec4f(select(-1.0, 3.0, vi == 1u), select(-1.0, 3.0, vi == 2u), 0.5, 1.0);
	return o;
}
@fragment fn fs(in: FOut) -> @location(0) vec4f {
	let t = textureLoad(idTex, vec2i(floor(in.pos.xy)), 0);
	if (R.z == 1u) {   // 監査プローブ（品質監査）：winding 和の異常だけ色分け
		let ar = abs(t.r); let ag = abs(t.g);
		if (ag < 0.5) { if (ar > 0.5) { return vec4f(0.0, 0.9, 1.0, 0.85); } discard; }   // シアン＝向き矛盾
		let qo = t.r / t.g;
		if (abs(qo - round(qo)) > 0.25) { return vec4f(1.0, 0.0, 0.8, 0.85); }   // マゼンタ＝別筆の重なり
		if (ag > 1.5) { return vec4f(1.0, 0.55, 0.0, 0.85); }                    // 橙＝同一筆の多重登記
		discard;
	}
	var g = t.g; var r = t.r;
	if (g < 0.0) { g = -g; r = -r; }       // 外環 CW＝符号ごと反転
	if (g < 0.5) { discard; }               // 被覆なし（穴・外）
	var q = r / g;                          // 多重登記は約分で消える（R=k(fid+1),G=k → q=fid+1）
	var multi = g > 1.5 || abs(q - round(q)) > 0.25;   // 重複＝A（扇が触れた最大 fid+1）で後勝ち（GL FS_RESOLVE と同じ）
	var fid = -1;
	if (multi && t.a >= 0.5) { fid = i32(round(t.a)) - 1; }
	else if (!multi) { fid = i32(round(q)) - 1; }
	else { discard; }
	// 上側に塗りが無ければ 1 枚剥がして下を出す（2 重なりまで厳密・GL と同じ）
	var col = vec4f(0.0);
	for (var peel = 0; peel < 3; peel++) {
		if (fid < 0 || fid >= i32(R.y)) { discard; }
		let rec = textureLoad(fidTex, vec2i(fid % i32(R.x), fid / i32(R.x)), 0);
		let c = rec.r;                          // R = fill 色 RGBA8
		col = vec4f(f32(c >> 24u), f32((c >> 16u) & 255u), f32((c >> 8u) & 255u), f32(c & 255u)) / 255.0;
		if ((rec.b & 1u) != 0u && col.a > 0.0) { break; }
		if (!multi || g < 1.5) { discard; }
		r -= f32(fid + 1); g -= 1.0;
		q = r / g;
		if (g < 0.5 || abs(q - round(q)) > 0.25) { discard; }
		fid = i32(round(q)) - 1;
		multi = g > 1.5;
	}
	return vec4f(col.rgb, col.a);           // straight alpha（blend が SRC_ALPHA/1-SRC_ALPHA）
}
`,Vd=`
${Od}
@group(2) @binding(0) var ptTex: texture_2d_array<u32>;
@group(2) @binding(1) var ptMetaTex: texture_2d_array<u32>;
@group(3) @binding(1) var fidTex: texture_2d<u32>;   // fid スタイル表（線系と同じ group(3) スロット＝aux bind group を共有）
@group(3) @binding(2) var elevTex: texture_2d<f32>;   // 標高（線系と同じ aux bind group）＝点も地形へドレープ
@group(3) @binding(3) var elevSamp: sampler;
const TEX_LAYER_H: i32 = 4096;   // 線系 HEADER と同じ（2D 配列の層の高さ）
fn ptAt(ptId: i32) -> vec2u {
	let r = ptId / F.texw.x;
	return textureLoad(ptTex, vec2i(ptId % F.texw.x, r % TEX_LAYER_H), r / TEX_LAYER_H, 0).rg;
}
fn ptMetaAt(ptId: i32) -> u32 {
	let r = ptId / F.texw.x;
	return textureLoad(ptMetaTex, vec2i(ptId % F.texw.x, r % TEX_LAYER_H), r / TEX_LAYER_H, 0).r;
}
const D2R: f32 = 0.017453292519943295;
fn sinP(x: f32) -> f32 {
	let x2 = x * x;
	return select(sin(x), x * (1.0 - x2 * (1.0 / 6.0) * (1.0 - x2 * (1.0 / 20.0))), abs(x) < 0.1);
}
fn cosP(x: f32) -> f32 { let s = sinP(0.5 * x); return 1.0 - 2.0 * s * s; }
fn dBeta(dp: f32) -> f32 {   // 楕円体 dβ（arc 側と同一・球＝錨全0で厳密0）
	let sd = sinP(dp); let cd = cosP(dp); let s2d = sinP(2.0 * dp); let c2d = cosP(2.0 * dp);
	return dp - 2.0 * 0.0016792203863837047    * (F.ellT2.x * cd  - F.ellT2.y * sd)  * sd
	          + 2.0 * 0.0000014098905530233192 * (F.elevP.y * c2d - F.elevP.z * s2d) * s2d;
}
fn deltaToRel(dlonDeg: f32, dlatDeg: f32) -> vec3f {
	let da = dlonDeg * D2R; let db = dBeta(dlatDeg * D2R);
	let sda = sinP(da); let sdb = sinP(db);
	let sha = sinP(da * 0.5); let shb = sinP(db * 0.5);
	let cdaM1 = -2.0 * sha * sha; let cdbM1 = -2.0 * shb * shb;
	let cda = 1.0 + cdaM1; let cdb = 1.0 + cdbM1;
	let ccM1 = cdaM1 + cdbM1 + cdaM1 * cdbM1;
	let cLon = F.trig.x; let sLon = F.trig.y; let cLat = F.trig.z; let sLat = F.trig.w;
	let rx = cLat * cLon * ccM1 - cLat * sLon * cdb * sda - sLat * cLon * sdb * cda + sLat * sLon * sdb * sda;
	let ry = sLat * cdbM1 + cLat * sdb;
	let rz = cLat * sLon * ccM1 + cLat * cLon * cdb * sda - sLat * sLon * sdb * cda - sLat * cLon * sdb * sda;
	return vec3f(rx, ry, rz);
}
fn compact16(m0: u32) -> u32 {
	var m = m0 & 0x55555555u;
	m = (m | (m >> 1u)) & 0x33333333u;
	m = (m | (m >> 2u)) & 0x0F0F0F0Fu;
	m = (m | (m >> 4u)) & 0x00FF00FFu;
	m = (m | (m >> 8u)) & 0x0000FFFFu;
	return m;
}
fn dlonE7(a: u32, b: u32) -> f32 {
	var d = max(a, b) - min(a, b);
	var sg = select(-1.0, 1.0, a >= b);
	if (d > 1800000000u) { d = 3600000000u - d; sg = -sg; }
	return f32(d) * sg;
}
// 点を地形へドレープ（GL programs.js ptDrapeRelW と 1:1・線系 HEADER の elevAt/elevQAt/drapeRelW と同式）。
// elevScale=0（真俯瞰・地形なし）なら rel のまま＝従来どおり（choju 本人指摘 2026-10-14＝傾けると点が地形からずれる）
fn elevAt(ll: vec2f) -> f32 {
	if (F.depthP.w < 0.5) { return 0.0; }
	let uv = (ll - F.elevBounds.xy) / F.elevBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return 0.0; }
	var fade = 1.0;
	if (F.elevP.x > 0.0) {
		let w = vec2f(F.elevP.x) / F.elevBounds.zw;
		fade = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return textureSampleLevel(elevTex, elevSamp, uv, 0.0).r * fade;
}
fn elevQAt(ll: vec2f) -> f32 {
	let G = F.meshP.x;
	if (G < 1.5) { return elevAt(ll); }
	let g = (ll - F.meshQ.xy) / F.meshQ.zw;
	if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) { return elevAt(ll); }
	let N = G - 1.0;
	let gc = min(g * N, vec2f(N - 1e-4));
	let gi = floor(gc);
	let gf = gc - gi;
	let st = F.meshQ.zw / N;
	let b0 = F.meshQ.xy + gi * st;
	let h00 = elevAt(b0);
	let h10 = elevAt(b0 + vec2f(st.x, 0.0));
	let h01 = elevAt(b0 + vec2f(0.0, st.y));
	let h11 = elevAt(b0 + st);
	if (gf.x + gf.y < 1.0) { return h00 + gf.x * (h10 - h00) + gf.y * (h01 - h00); }
	return h11 + (1.0 - gf.x) * (h01 - h11) + (1.0 - gf.y) * (h10 - h11);
}
fn ptDrapeRelW(rel: vec3f, dLL: vec2f) -> vec3f {
	if (!(F.depthP.z > 0.0 && F.depthP.w > 0.5)) { return rel; }
	var dir = F.originPt + rel;
	let df = 1.0 - smoothstep(F.depthP.y * 0.8, F.depthP.y * 2.0, distance(F.eye, dir));
	let ll = F.origin + dLL;
	let h = elevQAt(ll) * F.depthP.z * df;
	if (F.elevP.w > 0.5) { let p = ll.y * D2R; let l = ll.x * D2R; let cp = cos(p); dir = vec3f(cp * cos(l), sin(p) * 1.0033640898209764, cp * sin(l)); }
	return rel + h * dir;
}
struct Pt { xy: vec2f, zr: f32 };
fn fetchPoint(ptId: i32) -> Pt {
	let px = ptAt(ptId);
	let hi_c = px.g & 0x7FFFFFFFu;
	let ix = (compact16(hi_c) << 16u) | compact16(px.r);
	let iy = (compact16(hi_c >> 1u) << 16u) | compact16(px.r >> 1u);
	let dlon = dlonE7(ix, F.centers.x) * 1e-7;
	let dlat = f32(i32(iy - F.centers.y)) * 1e-7;
	let rel = deltaToRel(dlon, dlat);
	let zr = F.originZr + dot(rel, F.eye);
	let clip = F.clipT + F.mvp * vec4f(ptDrapeRelW(rel, vec2f(dlon, dlat)), 0.0);   // 地形の高さへ（線の drapeRelW と同式）
	if (clip.w <= 0.0) { return Pt(F.viewport * 0.5, -1.0); }
	let ndc = clip.xy / clip.w;
	return Pt(vec2f((ndc.x * 0.5 + 0.5) * F.viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * F.viewport.y), zr);
}
// per-fid 点スタイル（paint 時のみ・GL programs.js fidPointStyle と同じ約束）：visible bit0=0 か radius=0 は棄却、
// radius＝表(1/4 CSS px)×dpr（P.a.w）、色＝G（α=0 は既定色のまま）。
// 円の縁（2026-09-26・GL fidPointStyle と対）＝第 4 語が縁の色・線幅の欄が縁の幅（1/8 CSS px×dpr）・flags bit1＝塗り無し（中空の円）
struct PtStyle { keep: bool, r: f32, col: vec4f, hasCol: bool, scol: vec4f, sw: f32 };
fn fidPointStyle(featId: i32, r0: f32) -> PtStyle {
	var s = PtStyle(true, r0, vec4f(0.0), false, vec4f(0.0), 0.0);
	if (F.flags.w == 0u) { return s; }
	let rec = textureLoad(fidTex, vec2i(featId % i32(F.flags.w), featId / i32(F.flags.w)), 0);
	if ((rec.b & 1u) == 0u) { s.keep = false; return s; }
	let r4 = (rec.b >> 8u) & 255u;
	if (r4 == 0u) { s.keep = false; return s; }
	s.r = f32(r4) * 0.25 * P.a.w;
	let lc = rec.g;
	if ((rec.b & 2u) != 0u) { s.col = vec4f(0.0); s.hasCol = true; }
	else if ((lc & 255u) != 0u) { s.col = vec4f(f32(lc >> 24u), f32((lc >> 16u) & 255u), f32((lc >> 8u) & 255u), f32(lc & 255u)) / 255.0; s.hasCol = true; }
	let w8 = (rec.b >> 24u) | (((rec.b >> 16u) & 255u) << 8u);   // 線幅 u16（1/8px・下位は bit 24〜・上位は bit 16〜＝2026-10-22 から）
	if (rec.a != 0u && w8 != 0u) { s.scol = vec4f(f32(rec.a >> 24u), f32((rec.a >> 16u) & 255u), f32((rec.a >> 8u) & 255u), f32(rec.a & 255u)) / 255.0; s.sw = f32(w8) * 0.125 * P.a.w; }
	return s;
}
struct POut {
	@builtin(position) pos: vec4f,
	@location(0) zr: f32,
	@location(1) uv: vec2f,
	@location(2) color: vec4f,
	@location(3) @interpolate(flat) stroke: vec4f,   // 縁の色（α0＝縁なし）
	@location(4) @interpolate(flat) inner: f32,      // 塗りの半径／外径
};
@vertex fn vsPoint(@builtin(vertex_index) vi: u32) -> POut {
	var o: POut;
	let ptId = i32(vi) / 4;   // index の 4 頂点/点（P3）
	let sub = i32(vi) % 4;
	let ox = select(-1.0, 1.0, sub == 2 || sub == 3);   // 4 隅＝0:(−,−) 1:(−,+) 2:(+,+) 3:(+,−)（index [0,1,2,0,2,3]＝旧 6 列と同じ三角形）
	let oy = select(-1.0, 1.0, sub == 1 || sub == 2);
	let p = fetchPoint(ptId);
	o.zr = p.zr;
	o.uv = vec2f(ox, oy);
	let featId = i32(ptMetaAt(ptId));
	let fs = fidPointStyle(featId, P.a.z);
	if (!fs.keep) { return o; }   // per-fid：非表示/半径0＝棄却（o.pos=0 の縮退）
	let isActive = featId == P.b.x;
	let r = select(fs.r, fs.r * 1.6, isActive);
	let R = r + fs.sw;   // 外径＝半径＋縁（縁は外側）
	o.pos = vec4f(2.0 * (p.xy.x + ox * R) / F.viewport.x - 1.0, 1.0 - 2.0 * (p.xy.y + oy * R) / F.viewport.y, 0.0, 1.0);
	let base = select(vec4f(1.0, 0.420, 0.208, 1.0), fs.col, fs.hasCol);
	o.color = select(base, vec4f(1.0, 0.9, 0.0, 1.0), isActive);
	o.stroke = fs.scol;
	o.inner = select(1.0, r / R, R > 0.0);
	return o;
}
@fragment fn fsPoint(in: POut) -> @location(0) vec4f {
	if (in.zr < 0.0) { discard; }
	let d = dot(in.uv, in.uv);
	if (d > 1.0) { discard; }
	var c = in.color;
	if (in.stroke.a > 0.0 && d > in.inner * in.inner) { c = in.stroke; }   // 縁の輪か塗りか
	if (c.a == 0.0) { discard; }   // 中空の円の内側
	return c;
}
@vertex fn vsPickPoint(@builtin(vertex_index) vi: u32) -> POut {
	var o: POut;
	let ptId = i32(vi) / 4;   // index の 4 頂点/点（P3）
	let sub = i32(vi) % 4;
	let ox = select(-1.0, 1.0, sub == 2 || sub == 3);   // 4 隅＝0:(−,−) 1:(−,+) 2:(+,+) 3:(+,−)（index [0,1,2,0,2,3]＝旧 6 列と同じ三角形）
	let oy = select(-1.0, 1.0, sub == 1 || sub == 2);
	let p = fetchPoint(ptId);
	o.zr = p.zr;
	o.uv = vec2f(ox, oy);
	let fid1 = ptMetaAt(ptId) + 1u;
	let fs = fidPointStyle(i32(fid1 - 1u), P.a.z);
	if (!fs.keep) { return o; }   // filter 非表示の点は pick からも外す（線と同じ）
	let r = max(fs.r + fs.sw, P.a.z);   // pick 半径＝max(表の半径＋縁, マージン)
	o.pos = vec4f(2.0 * (p.xy.x + ox * r) / F.viewport.x - 1.0, 1.0 - 2.0 * (p.xy.y + oy * r) / F.viewport.y, 0.0, 1.0);
	o.color = vec4f(f32(fid1 & 255u) / 255.0, f32((fid1 >> 8u) & 255u) / 255.0, f32((fid1 >> 16u) & 255u) / 255.0, 1.0);
	return o;
}
@fragment fn fsPickPoint(in: POut) -> @location(0) vec4f {
	if (in.zr < 0.0) { discard; }
	if (dot(in.uv, in.uv) > 1.0) { discard; }
	return in.color;
}
`;function oo(s){const p=[[/@group\(2\) @binding\(0\) var arcTex: texture_2d_array<u32>;/,"@group(2) @binding(0) var<storage, read> arcBuf: array<vec2u>;"],[/@group\(2\) @binding\(1\) var metaTex: texture_2d_array<u32>;/,"@group(2) @binding(1) var<storage, read> metaBuf: array<vec4u>;"],[/@group\(2\) @binding\(0\) var ptTex: texture_2d_array<u32>;/,"@group(2) @binding(0) var<storage, read> ptBuf: array<vec2u>;"],[/@group\(2\) @binding\(1\) var ptMetaTex: texture_2d_array<u32>;/,"@group(2) @binding(1) var<storage, read> ptMetaBuf: array<u32>;"],[/fn arcAt\(idx: u32\) -> vec2u \{\n\tlet r = i32\(idx\) \/ F\.texw\.x;\n\treturn textureLoad\(arcTex, [^\n]*\n\}/,`fn arcAt(idx: u32) -> vec2u {
	return arcBuf[idx];
}`],[/fn metaAt\(edgeId: i32\) -> vec4u \{\n\tlet r = edgeId \/ F\.texw\.y;\n\treturn textureLoad\(metaTex, [^\n]*\n\}/,`fn metaAt(edgeId: i32) -> vec4u {
	return metaBuf[u32(edgeId)];
}`],[/fn ptAt\(ptId: i32\) -> vec2u \{\n\tlet r = ptId \/ F\.texw\.x;\n\treturn textureLoad\(ptTex, [^\n]*\n\}/,`fn ptAt(ptId: i32) -> vec2u {
	return ptBuf[u32(ptId)];
}`],[/fn ptMetaAt\(ptId: i32\) -> u32 \{\n\tlet r = ptId \/ F\.texw\.x;\n\treturn textureLoad\(ptMetaTex, [^\n]*\n\}/,`fn ptMetaAt(ptId: i32) -> u32 {
	return ptMetaBuf[u32(ptId)];
}`]];let _=s;for(const[A,D]of p)_=_.replace(A,D);if(/textureLoad\((arcTex|metaTex|ptTex|ptMetaTex)/.test(_))throw new Error("toStorageWGSL: 変換漏れ（textureLoad が残っている）＝原本の書式が変わった疑い");return _}function Ta(s,p){if(!p||p===4096)return s;const _=s.replace(/const TEX_LAYER_H: i32 = 4096;/g,`const TEX_LAYER_H: i32 = ${p|0};`);if(_===s)throw new Error("withLayerH: TEX_LAYER_H not found = the source shader format changed");return _}function jm(s){const p=[[/i32\(vi\) \/ 4;/g,"i32(vi) / 6;"],[/i32\(vi\) % 4;/g,"i32(vi) % 6;"],[/let useA = sub < 2;/g,"let useA = (sub == 0 || sub == 1 || sub == 3);"],[/let side = select\(-1\.0, 1\.0, sub == 1 \|\| sub == 2\);/g,"let side = select(-1.0, 1.0, sub == 1 || sub == 2 || sub == 4);"],[/let ox = select\(-1\.0, 1\.0, sub == 2 \|\| sub == 3\);/g,"let ox = select(-1.0, 1.0, sub == 2 || sub == 4 || sub == 5);"],[/let oy = select\(-1\.0, 1\.0, sub == 1 \|\| sub == 2\);/g,"let oy = select(-1.0, 1.0, sub == 1 || sub == 2 || sub == 4);"]];let _=s,A=0;for(const[D,C]of p){const F=_;_=_.replace(D,C),_!==F&&A++}if(A===0||/i32\(vi\) [/%] 4;/.test(_))throw new Error("quad6WGSL: rewrite incomplete (4-vertex markers missing or left over) = the source shader format changed");return _}const Wd=`	clipPl: array<vec4f, 6>,   // 面（xyz＝法線・w＝K）＝#111 段 3
	clipP: vec4f,              // x＝面の枚数
	rayF: vec4f, rayX: vec4f, rayY: vec4f, eyeC: vec4f, eyeO: vec4f,   // 全画面レイ（renderer と同じ視線の基底・eyeO＝目−gint 原点）
`,_a=s=>`
fn clipD(rel: vec3f, i: u32) -> f32 { if (i < u32(${s}.clipP.x)) { return dot(${s}.clipPl[i].xyz, rel) + ${s}.clipPl[i].w; } return 1e30; }
fn clipA(rel: vec3f) -> vec4f { return vec4f(clipD(rel, 0u), clipD(rel, 1u), clipD(rel, 2u), clipD(rel, 3u)); }
fn polyXY(rel: vec3f) -> vec2f { return vec2f(dot(${s}.cpe.xyz, rel) + ${s}.cpe.w, dot(${s}.cpn.xyz, rel) + ${s}.cpn.w); }
fn polyD(q: vec2f) -> f32 {   // 多角形までの符号付きの距離（残る側が正・内外は偶奇）＝wgsl.ts の polyD と同じ式
	let n = u32(${s}.clipP.z);
	if (n == 0u) { return 1e30; }
	var d2 = 1e30;
	var inside = false;
	for (var i = 0u; i < n; i++) {
		let a = ${s}.cpv[i].xy; let b = ${s}.cpv[i].zw;
		if ((a.y > q.y) != (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) { inside = !inside; }
		let v = b - a; let t = clamp(dot(q - a, v) / max(dot(v, v), 1e-30), 0.0, 1.0); let w = q - a - t * v;
		d2 = min(d2, dot(w, w));
	}
	var d = sqrt(d2);
	if (inside != (${s}.clipP.w > 0.5)) { d = -d; }
	return d;
}
fn clipB(rel: vec3f) -> vec4f { return vec4f(clipD(rel, 4u), clipD(rel, 5u), polyXY(rel)); }   // zw＝多角形の 2D（線形＝補間してよい）
fn clipOut(a: vec4f, b: vec4f) -> bool { return min(min(min(a.x, a.y), min(a.z, a.w)), min(min(b.x, b.y), polyD(b.zw))) < 0.0; }
fn clipPx(px: vec2f, vp: vec2f) -> bool {   // 画素 px（device）の視線が球（海抜 0）に当たる点が切られているか（当たらない＝切る）
	let ndc = vec2f(px.x / vp.x * 2.0 - 1.0, 1.0 - px.y / vp.y * 2.0);
	let d = ${s}.rayF.xyz + ndc.x * ${s}.rayX.xyz + ndc.y * ${s}.rayY.xyz;
	let A = ${s}.eyeC.xyz; let cc = ${s}.eyeC.w;
	let aa = dot(d, d); let bb = 2.0 * dot(A, d);
	let disc = bb * bb - 4.0 * aa * cc;
	if (disc < 0.0 || (bb >= 0.0 && cc >= 0.0)) { return true; }
	let q = -bb + sqrt(disc);
	if (q <= 0.0) { return true; }
	let t = 2.0 * cc / q;
	let rel = ${s}.eyeO.xyz + t * d;
	let n = u32(${s}.clipP.x);
	for (var i = 0u; i < n; i++) { if (dot(${s}.clipPl[i].xyz, rel) + ${s}.clipPl[i].w < 0.0) { return true; } }
	return polyD(polyXY(rel)) < 0.0;
}
`,za=(s,p,_)=>p.reduce((A,[D,C,F])=>{const le=A.split(D).length-1;if(F?le<1:le!==1)throw new Error(`gint clip derive(${_}): anchor ${le?"ambiguous":"missing"}: ${D.slice(0,50)}`);return F?A.split(D).join(C):A.replace(D,C)},s),qd=`	cpe: vec4f, cpn: vec4f,   // 多角形の接平面の東・北（xyz＝軸・w＝K）
	cpv: array<vec4f, 64>,     // 辺（xy→zw）
`,Km=`（packGF 136-139）
};`,Qm=[Km,`（packGF 136-139）
`+qd+"};"],Zm=`	gfRsv: array<vec4f, 12>,   // float 80〜127＝断面（#111 段 3）の派生だけが clipPl/clipP/ray… として宣言し直す欄（GINT_CLIP_FIELDS）。素の GF は読まない
`,Jm=[Zm,Wd],ff=[Jm,Qm];function Ia(s,p){if(p==="line")return za(s,[...ff,[`	@location(8) @interpolate(flat) eb: vec2f,
};`,`	@location(8) @interpolate(flat) eb: vec2f,
	@location(9) cdA: vec4f,
	@location(10) cdB: vec4f,
};`],[`	var pa3: Proj; var pb3: Proj;
`,`	var pa3: Proj; var pb3: Proj;
	var cwA = vec3f(0.0); var cwB = vec3f(0.0);   // 端点のドレープ後の位置（面の距離）
`],[`		pa3 = projectDrape(sn.a);   // 従来経路（2D/地形なし）
		pb3 = projectDrape(sn.b);
`,`		let dAc = decodeDLL(sn.a); let dBc = decodeDLL(sn.b);
		let rAc = deltaToRel(dAc.x, dAc.y); let rBc = deltaToRel(dBc.x, dBc.y);
		cwA = drapeRelW(rAc, dAc); cwB = drapeRelW(rBc, dBc);
		pa3 = projectRel(rAc, cwA);   // 従来経路（2D/地形なし）＝projectDrape と同式
		pb3 = projectRel(rBc, cwB);
`],["		pa3 = projectRel(r0, drapeRelW(r0, mix(dA, dB, sr.ts)));",`		cwA = drapeRelW(r0, mix(dA, dB, sr.ts)); cwB = drapeRelW(r1, mix(dA, dB, sr.te));
		pa3 = projectRel(r0, cwA);`],["		pb3 = projectRel(r1, drapeRelW(r1, mix(dA, dB, sr.te)));","		pb3 = projectRel(r1, cwB);"],[`	o.halfw = lw * 0.5;
	return o;
}`,`	o.halfw = lw * 0.5;
	let cpos = select(cwB, cwA, useA);
	o.cdA = clipA(cpos); o.cdB = clipB(cpos);
	return o;
}`],[`	let aaW = max(fwidth(dcap), 1e-3);
`,`	let aaW = max(fwidth(dcap), 1e-3);
	if (clipOut(in.cdA, in.cdB)) { discard; }
`],[`	@location(1) zr: f32,
};
@vertex fn vsPickLine`,`	@location(1) zr: f32,
	@location(2) cdA: vec4f,
	@location(3) cdB: vec4f,
};
@vertex fn vsPickLine`],[`	let pa3 = fetchProject(sn.a);
	let pb3 = fetchProject(sn.b);
`,`	let pa3 = fetchProject(sn.a);
	let pb3 = fetchProject(sn.b);
	let cp = select(decodeRel(sn.b), decodeRel(sn.a), useA);
	o.cdA = clipA(cp); o.cdB = clipB(cp);
`],[`@fragment fn fsPick(in: PickOut) -> @location(0) vec4f {
`,`@fragment fn fsPick(in: PickOut) -> @location(0) vec4f {
	if (clipOut(in.cdA, in.cdB)) { discard; }
`]],"line")+_a("F");if(p==="stencil")return za(s,[...ff,["@fragment fn fsFill(in: FOut) -> @location(0) vec4f { return P.color; }",`@fragment fn fsFill(in: FOut) -> @location(0) vec4f {
	if (clipPx(in.pos.xy, F.viewport)) { discard; }
	return P.color;
}`]],"stencil")+_a("F");if(p==="point")return za(s,[...ff,["struct Pt { xy: vec2f, zr: f32 };","struct Pt { xy: vec2f, zr: f32, rel: vec3f };"],["	if (clip.w <= 0.0) { return Pt(F.viewport * 0.5, -1.0); }","	if (clip.w <= 0.0) { return Pt(F.viewport * 0.5, -1.0, rel); }"],["	return Pt(vec2f((ndc.x * 0.5 + 0.5) * F.viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * F.viewport.y), zr);","	return Pt(vec2f((ndc.x * 0.5 + 0.5) * F.viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * F.viewport.y), zr, rel);"],[`	@location(4) @interpolate(flat) inner: f32,      // 塗りの半径／外径
};`,`	@location(4) @interpolate(flat) inner: f32,      // 塗りの半径／外径
	@location(5) @interpolate(flat) cdA: vec4f,
	@location(6) @interpolate(flat) cdB: vec4f,
};`],[`	let p = fetchPoint(ptId);
`,`	let p = fetchPoint(ptId);
	o.cdA = clipA(p.rel); o.cdB = clipB(p.rel);
`,!0],[`@fragment fn fsPoint(in: POut) -> @location(0) vec4f {
`,`@fragment fn fsPoint(in: POut) -> @location(0) vec4f {
	if (clipOut(in.cdA, in.cdB)) { discard; }
`],[`@fragment fn fsPickPoint(in: POut) -> @location(0) vec4f {
`,`@fragment fn fsPickPoint(in: POut) -> @location(0) vec4f {
	if (clipOut(in.cdA, in.cdB)) { discard; }
`]],"point")+_a("F");if(p==="resolve")return za(s,[["@group(0) @binding(2) var<uniform> R: vec4u;   // (fid_w, fid_count, overlap, 0)",`struct RC {
	r: vec4u,   // (fid_w, fid_count, overlap, 0)＝素の R
${Wd}	vp: vec4f,   // xy＝画面（device px）
${qd}};
@group(0) @binding(2) var<uniform> RC0: RC;`],[`@fragment fn fs(in: FOut) -> @location(0) vec4f {
`,`@fragment fn fs(in: FOut) -> @location(0) vec4f {
	if (clipPx(in.pos.xy, RC0.vp.xy)) { discard; }
`],["R.z","RC0.r.z",!0],["R.y","RC0.r.y",!0],["R.x","RC0.r.x",!0]],"resolve")+_a("RC0");throw new Error("gintClipWGSL: unknown kind "+p)}const ex=Ia(kd,"line"),tx=Ia(Id,"stencil"),rx=Ia(Vd,"point"),nx=Ia(Nd,"resolve"),ix=64,uf=(s,p)=>Math.ceil(s/p)*p;function lx(s,{texW:p=4096}={}){const _=new Map,A=s.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},...[1,2,3,4,5].map(ee=>({binding:ee,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}})),{binding:6,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),D=s.createPipelineLayout({bindGroupLayouts:[A]});async function C(ee){let N=_.get(ee);return N||(N=(async()=>{const fe=s.createShaderModule({code:ee}),H=((await fe.getCompilationInfo()).messages||[]).filter(be=>be.type==="error").map(be=>`${be.lineNum}:${be.linePos} ${be.message}`);if(H.length)throw new Error("WGSL gint-expr: "+H.join("; "));return s.createComputePipelineAsync({layout:D,compute:{module:fe,entryPoint:"main"}})})(),_.set(ee,N),N.catch(()=>_.delete(ee))),N}const F=(ee,N,fe)=>s.createBuffer({size:Math.max(16,uf(ee,16)),usage:N,label:fe}),le=(ee,N,fe,W=1)=>{const H=F(ee.byteLength*W,N|GPUBufferUsage.COPY_DST,fe);return ee.byteLength&&s.queue.writeBuffer(H,0,ee.buffer,ee.byteOffset,ee.byteLength),H};async function Se(ee,N){const fe=await C(ee.wgsl),W=N.count|0,H=Math.max(1,Math.ceil(W/p)),be=GPUBufferUsage.STORAGE,l={count:W,H,texW:p,prog:ee,uni:F(16,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,"gint-expr-uni"),props:le(N.props??new Uint32Array(0),be,"gint-expr-props"),states:le(N.states??new Uint32Array(0),be,"gint-expr-states"),geom:le(N.geom??new Uint32Array(0),be,"gint-expr-geom"),dnum:le(N.dnum??new Uint32Array(0),be,"gint-expr-dnum",2),dcol:le(N.dcol??new Float32Array(0),be,"gint-expr-dcol",2),out:F(p*H*16,be|GPUBufferUsage.COPY_SRC,"gint-expr-out"),dictN:(N.dnum?.length??0)/2|0,zoom:+N.zoom||0,bg:null,stateKeys:ee.stateKeys??[]},Ee=()=>{l.bg=s.createBindGroup({layout:A,entries:[l.uni,l.props,l.states,l.geom,l.dnum,l.dcol,l.out].map((U,O)=>({binding:O,resource:{buffer:U}}))})};Ee();const Z=()=>{const U=new ArrayBuffer(16);new Uint32Array(U)[0]=W,new Float32Array(U)[1]=l.zoom,s.queue.writeBuffer(l.uni,0,U)};return l.run=({zoom:U,tex:O,enc:L}={})=>{U!=null&&(l.zoom=+U||0),Z();const G=L??s.createCommandEncoder({label:"gint-expr"}),me=G.beginComputePass();me.setPipeline(fe),me.setBindGroup(0,l.bg),me.dispatchWorkgroups(Math.ceil(Math.max(1,W)/ix)),me.end(),O&&G.copyBufferToTexture({buffer:l.out,bytesPerRow:p*16,rowsPerImage:H},{texture:O},[p,H]),L||s.queue.submit([G.finish()])},l.setState=(U,O)=>{if(!(U>=0&&U<W)||!O)return;const L=l.stateKeys.length,G=new Uint32Array(2);for(let me=0;me<L;me++){const Ie=O[me];G[0]=Ie?.[0]??0,G[1]=Ie?.[1]??0,s.queue.writeBuffer(l.states,(me*W+U)*8,G)}},l.growDict=(U,O)=>{const L=U.length/2|0;L<=l.dictN||(U.byteLength>l.dnum.size?(l.dnum.destroy(),l.dnum=le(U,be,"gint-expr-dnum",2),l.dcol.destroy(),l.dcol=le(O,be,"gint-expr-dcol",2),Ee()):(s.queue.writeBuffer(l.dnum,0,U.buffer,U.byteOffset,U.byteLength),s.queue.writeBuffer(l.dcol,0,O.buffer,O.byteOffset,O.byteLength)),l.dictN=L)},l.setStates=U=>{U.byteLength>l.states.size?(l.states.destroy(),l.states=le(U,be,"gint-expr-states"),Ee()):U.byteLength&&s.queue.writeBuffer(l.states,0,U.buffer,U.byteOffset,U.byteLength)},l.readback=async()=>{const U=W*16;if(!U)return new Uint32Array(0);const O=s.createBuffer({size:uf(U,4),usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),L=s.createCommandEncoder();L.copyBufferToBuffer(l.out,0,O,0,uf(U,4)),s.queue.submit([L.finish()]),await O.mapAsync(GPUMapMode.READ);const G=new Uint32Array(O.getMappedRange().slice(0,U));return O.unmap(),O.destroy(),G},l.destroy=()=>{for(const U of[l.uni,l.props,l.states,l.geom,l.dnum,l.dcol,l.out])U.destroy()},l}return{create:Se,pipelineFor:C,dispose:()=>_.clear()}}const ox=13,Hn=256,Mi=4096,xd=4096,wf=4096;function sx(s,p,_,A,D=0){const C=Math.max(D,Math.ceil(s/p)),F=Math.max(1,Math.ceil(C/_)),le=Math.ceil(F/A),Se=le>1?A:F,ee=_*p,N=Math.floor(s/ee),fe=s-N*ee,W=[];for(let H=0;H<le;H++){const be=H*A,l=Math.min(F,be+A),Ee=Math.min(l,N);Ee>be&&W.push({layer:H,y:0,rows:Ee-be,from:be*ee,to:Ee*ee,tail:!1}),fe&&N>=be&&N<l&&W.push({layer:H,y:N-be,rows:1,from:N*ee,to:s,tail:!0})}return{w:_,h:Se,layers:le,rows:F,writes:W}}const Hd=(s,p)=>{try{return p(s)}catch(_){if(!(_ instanceof TypeError)||!(typeof SharedArrayBuffer<"u"&&s.buffer instanceof SharedArrayBuffer))throw _;return p(s.slice())}};function ax(s,p,_,A,D,C=wf,F=0){const{h:le,layers:Se,writes:ee}=sx(p.length,D,_,C,F),N=s.createTexture({size:[_,le,Se],format:A,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),fe=_*D*4;for(const W of ee){let H=p.subarray(W.from,W.to);if(W.tail){const be=new Uint32Array(_*D);be.set(H),H=be}Hd(H,be=>s.queue.writeTexture({texture:N,origin:[0,W.y,W.layer]},be,{bytesPerRow:fe,rowsPerImage:W.rows},[_,W.rows,1]))}return N}const Bt={stencil:0,fill:1,line:2,lineHidden:3,hilite:4,maskStencil:5,maskFill:6,point:7,pointHi:8,pickLine:9,pickPoint:10};function cx(s,{requestDraw:p,noSB:_,quad4:A=s.quad4!==!1,layerH:D=0}={}){const C=!!s.lazyPipes,{device:F,format:le}=s;let Se=0;const ee=()=>{Se++,p?.()},N=F.limits?.maxStorageBufferBindingSize??0,fe=!_&&N>0&&(F.limits?.maxStorageBuffersPerShaderStage??0)>=2,W=GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,H=F.createBindGroupLayout({entries:[{binding:0,visibility:W,buffer:{}},{binding:1,visibility:W,buffer:{}}]}),be=F.createBindGroupLayout({entries:[{binding:0,visibility:W,buffer:{}}]}),l=F.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,texture:{sampleType:"uint",viewDimension:"2d-array"}},{binding:1,visibility:GPUShaderStage.VERTEX,texture:{sampleType:"uint",viewDimension:"2d-array"}}]}),Ee=F.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,texture:{sampleType:"uint"}},{binding:1,visibility:GPUShaderStage.VERTEX,texture:{sampleType:"uint"}},{binding:2,visibility:GPUShaderStage.VERTEX,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.VERTEX,sampler:{type:"filtering"}},{binding:4,visibility:GPUShaderStage.VERTEX,texture:{sampleType:"uint"}}]}),Z=F.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),U=F.createPipelineLayout({bindGroupLayouts:[H,be,l,Ee]}),O=F.createPipelineLayout({bindGroupLayouts:[H,be,Z,Ee]}),L=(r,f)=>{const g=F.createShaderModule({code:s.depthRZ?Aa(r,"gint-"+f):r});return g.getCompilationInfo&&g.getCompilationInfo().then(P=>{for(const h of P.messages||[])if(h.type==="error"){const z=`WGSL gint-${f}: ${h.lineNum}:${h.linePos} ${h.message}`;s.gpuErrors&&s.gpuErrors.push(z),console.error("[gpu] "+z)}}),g},G=(D|0)>0?Math.min(D|0,wf):wf,me=A?r=>Ta(r,G):r=>Ta(jm(r),G),Ie=me(kd),ae=me(Vd),Te=Ta(Id,G),Ye=L(Ie,"line"),tt=L(Te,"stencil"),T=L(ae,"point"),ke=fe?L(oo(Ie),"line-sb"):null,J=fe?L(oo(Te),"stencil-sb"):null,pt=fe?L(oo(ae),"point-sb"):null,Xe={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}},oe={format:s.depthFormat||"depth24plus-stencil8",depthWriteEnabled:!1,depthCompare:"always"},K=(r,f,g,{ds:P=oe,blend:h=Xe,writeMask:z,samples:ne=s.samples||4,fmt:x=le,lay:_e=U}={})=>F.createRenderPipeline({label:wt(),layout:_e,vertex:{module:r,entryPoint:f},fragment:{module:r,entryPoint:g,targets:[{format:x,blend:h,writeMask:z}]},primitive:{topology:"triangle-list"},...P?{depthStencil:P}:{},multisample:{count:ne}}),We={compare:"always",failOp:"keep",depthFailOp:"keep",passOp:"increment-wrap"},Ze={...We,passOp:"decrement-wrap"},te={...oe,stencilFront:We,stencilBack:Ze,stencilWriteMask:127},M={...oe,stencilFront:{compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilBack:{compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilReadMask:127,stencilWriteMask:0},$={...oe,stencilFront:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilBack:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilReadMask:127,stencilWriteMask:0},Me={...oe,stencilFront:{compare:"always",failOp:"keep",depthFailOp:"keep",passOp:"replace"},stencilBack:{compare:"always",failOp:"keep",depthFailOp:"keep",passOp:"replace"},stencilWriteMask:127},we={...oe,stencilFront:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"replace"},stencilBack:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"replace"},stencilReadMask:128,stencilWriteMask:127},Be=Sn("gintPick",C,{line:()=>K(Ye,"vsPickLine","fsPick",{ds:null,blend:void 0,samples:1,fmt:"rgba8unorm"}),point:()=>K(T,"vsPickPoint","fsPickPoint",{ds:null,blend:void 0,samples:1,fmt:"rgba8unorm"}),lineSB:()=>fe?K(ke,"vsPickLine","fsPick",{ds:null,blend:void 0,samples:1,fmt:"rgba8unorm",lay:O}):null,pointSB:()=>fe?K(pt,"vsPickPoint","fsPickPoint",{ds:null,blend:void 0,samples:1,fmt:"rgba8unorm",lay:O}):null}),Je=()=>s.clipInfo?.()||null;let Y=null;const w=()=>Y??=(()=>{const r=me(ex),f=me(rx),g=Ta(tx,G);return{line:L(r,"line-clip"),stencil:L(g,"stencil-clip"),point:L(f,"point-clip"),lineSB:fe?L(oo(r),"line-clip-sb"):null,stencilSB:fe?L(oo(g),"stencil-clip-sb"):null,pointSB:fe?L(oo(f),"point-clip-sb"):null,resolve:L(nx,"idresolve-clip")}})(),R={},ge=(r,f)=>{if(!f)return r?[Be.lineSB,Be.pointSB]:[Be.line,Be.point];const g=r?"b":"t";if(!R[g]){const P=w(),h={ds:null,blend:void 0,samples:1,fmt:"rgba8unorm",...r?{lay:O}:{}};R[g]=dv(`gintPickClip${r?"SB":""}`,()=>[K(r?P.lineSB:P.line,"vsPickLine","fsPick",h),K(r?P.pointSB:P.point,"vsPickPoint","fsPickPoint",h)])}return R[g]},E=!!F.features?.has?.("float32-blendable"),Oe=E?1<<20:2047,Ue=E?"rgba32float":"rgba16float";E||console.warn("[gint] no float32-blendable = idfill uses rg16float (fill holes possible in large-fid municipality choropleth)");const se=(r,f)=>F.createRenderPipeline({label:wt(),layout:f,vertex:{module:r,entryPoint:"vsId"},fragment:{module:r,entryPoint:"fsId",targets:[{format:Ue,blend:{color:{srcFactor:"one",dstFactor:"one",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one",operation:"max"}}}]},primitive:{topology:"triangle-list"},multisample:{count:1}}),ot=Sn("gintIdAccum",C,{t:()=>se(tt,U),sb:()=>fe?se(J,O):null}),st=L(Nd,"idresolve"),qe=F.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"uint"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{}}]}),Ot=F.createPipelineLayout({bindGroupLayouts:[qe]}),Ft=(r,f,g=st)=>F.createRenderPipeline({label:wt(),layout:Ot,vertex:{module:g,entryPoint:"vs"},fragment:{module:g,entryPoint:"fs",targets:[{format:le,blend:Xe}]},primitive:{topology:"triangle-list"},depthStencil:r,multisample:{count:f}}),qt={...oe,stencilFront:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilBack:{compare:"equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"},stencilReadMask:128,stencilWriteMask:0},Tr=(r,f,g)=>{const P=g?w():null,[h,z,ne,x]=f?P?[P.lineSB,P.stencilSB,P.pointSB,O]:[ke,J,pt,O]:P?[P.line,P.stencil,P.point,U]:[Ye,tt,T,U],_e=P?P.resolve:st;return Sn(`gint${f?"SB":""}${g?"Clip":""}${r}x`,C,{stencilFan:()=>K(z,"vsStencil","fsNull",{ds:te,blend:void 0,writeMask:0,samples:r,lay:x}),cover:()=>K(z,"vsFull","fsFill",{ds:M,samples:r,lay:x}),coverEq:()=>K(z,"vsFull","fsFill",{ds:$,samples:r,lay:x}),zero:()=>K(z,"vsFull","fsNull",{ds:Me,blend:void 0,writeMask:0,samples:r,lay:x}),occlude:()=>K(z,"vsFull","fsNull",{ds:we,blend:void 0,writeMask:0,samples:r,lay:x}),line:()=>K(h,"vsRender","fsRender",{samples:r,lay:x}),lineTest:()=>K(h,"vsRender","fsRender",{ds:{...oe,depthCompare:s.depthRZ?"greater-equal":"less-equal"},samples:r,lay:x}),lineHidden:()=>K(h,"vsRender","fsRender",{ds:{...oe,depthCompare:s.depthRZ?"less":"greater"},samples:r,lay:x}),point:()=>K(ne,"vsPoint","fsPoint",{samples:r,lay:x}),idResolve:()=>Ft(oe,r,_e),idResolveOcc:()=>Ft(qt,r,_e)})},nn=new Map,ln=(r,f,g=!1)=>{const P=`${f?"b":"t"}#${r}${g?"#c":""}`;let h=nn.get(P);return h||(h=Tr(r,f,g),nn.set(P,h)),h};ln(s.samples||4,!1),fe&&ln(s.samples||4,!0),C&&s.gintWarm>0&&setTimeout(()=>{const r=s.samples||4,f=["lineTest","lineHidden","line"],g=performance.now(),P=r>1?[ln(r,fe),ln(1,fe)]:[ln(1,fe)];Promise.all(P.map(h=>bd(h,F,f))).then(h=>{const z=h.reduce((x,_e)=>x+_e.made,0),ne=h.reduce((x,_e)=>x+_e.asked,0);console.log(`[gint/gpu] warm lines: ${z}/${ne} in ${performance.now()-g|0} ms`)}).catch(()=>{})},s.gintWarm);const Ae={width:0,height:0,dpr:1,cam:null,lastViewBbox:null};let lr=-1,Bn=NaN,uo=NaN,Fn=null,Rr=null,ml=NaN,Gn=NaN,yr=!1,$r=0,is=null,xl=!1;const Tn=F.createTexture({size:[1,1],format:"r32uint",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),po=F.createTexture({size:[1,1],format:"r16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),ls=F.createSampler({magFilter:"linear",minFilter:"linear"}),bl=1<<17;let Xn=null;const Ef=()=>{if(Xn)return Xn;const r=new Uint32Array(bl*6);for(let f=0,g=0;f<bl;f++,g+=6){const P=f*4;r[g]=P,r[g+1]=P+1,r[g+2]=P+2,r[g+3]=P,r[g+4]=P+2,r[g+5]=P+3}return Xn=F.createBuffer({size:r.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),F.queue.writeBuffer(Xn,0,r),Xn},yl=r=>{A&&r.setIndexBuffer(Ef(),"uint32")},_n=(r,f,g,P=1,h=0)=>{if(!A){r.draw(f*6,P,g*6,h);return}for(let z=0;z<f;z+=bl)r.drawIndexed(Math.min(bl,f-z)*6,P,0,(g+z)*4,h)};let Tt=null,Yr=null,ci=0,hl=0,wl=0;function Yt(){return Tt&&ci===Ae.width&&hl===Ae.height||(Tt&&Tt.destroy(),Tt=F.createTexture({size:[Ae.width,Ae.height],format:Ue,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),Yr=Tt.createView(),ci=Ae.width,hl=Ae.height,wl++),!0}function fi(r){return r._idrBG&&r._idrGen===wl&&r._idrFid===r.fidStyleTex?r._idrBG:(r._idrGen=wl,r._idrFid=r.fidStyleTex,r._idrBG=r.fidStyleTex?F.createBindGroup({layout:qe,entries:[{binding:0,resource:Yr},{binding:1,resource:r.fidStyleTex.createView()},{binding:2,resource:{buffer:r.idRBuf}}]}):null)}const os=r=>!!r.fidStyleTex&&r.polyEdges>0&&!r.fillOff&&!!r.arcTex&&r.fidStyleCount<=Oe,Ar=new WeakMap,zn=r=>{const f=F.createBuffer({size:Math.max(4,r.byteLength),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return Hd(r,g=>F.queue.writeBuffer(f,0,g)),f},on=(r,f)=>(fe&&f&&f.byteLength<=N&&Ar.set(r,zn(f)),r),fr=r=>{if(!r)return;const f=Ar.get(r);f&&(f.destroy(),Ar.delete(r)),r.destroy()},$n=r=>fe&&(!r.arcTex||Ar.has(r.arcTex))&&(!r.metaTex||Ar.has(r.metaTex))&&(!r.metaTexB||Ar.has(r.metaTexB))&&(!r.ptTex||Ar.has(r.ptTex))&&(!r.ptMetaTex||Ar.has(r.ptMetaTex))&&(r.lodTiers??[]).every(f=>Ar.has(f.tex)),Ri=new WeakMap,ui=new WeakMap,Lr=(r,f,g)=>{if(r){const z=Ar.get(f),ne=Ar.get(g);if(z&&ne){let x=ui.get(z);x||ui.set(z,x=new WeakMap);let _e=x.get(ne);return _e||x.set(ne,_e=F.createBindGroup({layout:Z,entries:[{binding:0,resource:{buffer:z}},{binding:1,resource:{buffer:ne}}]})),_e}}let P=Ri.get(f);P||Ri.set(f,P=new WeakMap);let h=P.get(g);return h||P.set(g,h=F.createBindGroup({layout:l,entries:[{binding:0,resource:f.createView({dimension:"2d-array"})},{binding:1,resource:g.createView({dimension:"2d-array"})}]})),h};function Cn(r,f,g){const P=r.pivotTex||Tn,h=r.fidStyleTex||Tn,z=r.compTex||Tn,ne=f||po.createView(),x=g||ls,_e=[P,h,f||po,x,z];return r._auxBG&&r._auxKey&&r._auxKey.every((ye,Ne)=>ye===_e[Ne])?r._auxBG:(r._auxKey=_e,r._auxBG=F.createBindGroup({layout:Ee,entries:[{binding:0,resource:P.createView()},{binding:1,resource:h.createView()},{binding:2,resource:ne},{binding:3,resource:x},{binding:4,resource:z.createView()}]}))}function Ai(r,f,g,P,h){const z=F.createTexture({size:[f,g],format:P,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return F.queue.writeTexture({texture:z},r,{bytesPerRow:f*h*4,rowsPerImage:g},[f,g]),z}const Li=(r,f,g,P,h=0)=>ax(F,r,f,g,P,G,h);function Oi(r,f){return on(Li(r,xd,"rgba32uint",4,f),r)}function ss(r,f){const{gintData:g}=r,{arcBuffer:P,pointBuffer:h}=g;if(fr(r.arcTex),r.arcTex=null,P?.length){const z=new Uint32Array(P.buffer,P.byteOffset,P.byteLength/4);r.arcTex=on(Li(z,Mi,"rg32uint",2),z)}if(fr(r.metaTex),r.metaTex=null,r.totalEdges=f.base.edgeCount,r.polyEdges=f.base.polyEdgeCount,r.polyEdgeByFid=f.base.polyEdgeByFid,r.metaChunks=f.base.chunks,r.span=[f.base.spanX??-1,f.base.spanY??-1],r.polyBboxByFid=f.polyBboxByFid,r.outlineZoom=f.outlineZoom,r.fillOff=f.fillOff,r.lowFill=!!f.lowFill,console.debug("[gint/gpu] edges=%d chunks=%d",r.totalEdges,r.metaChunks?.length??0),r.totalEdges>0&&(r.metaTex=Oi(f.base.metaU32,r.totalEdges)),r.pivotTex&&(r.pivotTex.destroy(),r.pivotTex=null),r.pivotW=0,f.pivot&&f.pivot.w<=Mi&&(r.pivotTex=Ai(f.pivot.px,f.pivot.w,f.pivot.h,"rgba32uint",4),r.pivotW=f.pivot.w),r.compTex&&(r.compTex.destroy(),r.compTex=null),r.compW=0,r.pivotTex&&f.comp&&f.comp.w<=Mi&&(r.compTex=Ai(f.comp.keys,f.comp.w,f.comp.h,"r32uint",1),r.compW=f.comp.w),fr(r.metaTexB),r.metaTexB=null,r.totalEdgesB=0,r.polyEdgesB=0,r.spanB=[-1,-1],r.subB=null,f.boundary&&(r.totalEdgesB=f.boundary.edgeCount,r.polyEdgesB=f.boundary.polyEdgeCount,r.spanB=[f.boundary.spanX??-1,f.boundary.spanY??-1],r.subB=f.boundary.sub??null,r.metaTexB=Oi(f.boundary.metaU32,f.boundary.edgeCount)),fr(r.ptTex),r.ptTex=null,fr(r.ptMetaTex),r.ptMetaTex=null,h?.length){const z=new Uint32Array(h.buffer,h.byteOffset,h.byteLength/4);r.totalPoints=z.length/2,r.ptTex=on(Li(z,Mi,"rg32uint",2),z);const ne=g.point.subarray(0,r.totalPoints);r.ptMetaTex=on(Li(ne,Mi,"r32uint",1),ne)}else r.totalPoints=0;r.lodTiers?.length&&r.lodTiers.forEach(z=>fr(z.tex)),r.lodTiers=[],r.tiersDone=!1}function as(r,{weightHist:f=null}={}){const{gintData:g}=r,P=g?.arcBuffer,h=r.tierGen=(r.tierGen??0)+1;if(!P?.length||r.totalEdges<=2e5){r.tiersDone=!0;return}let z=null;const ne=()=>{const _e=new Set((r.lodTiers??[]).map(je=>je.minW)),ye=G1(g,r.totalEdges,f,_e),Ne=r.lastDrawData?.lodRank??0,_t=ye.filter(je=>je<=Ne),Ce=_t.length?Math.max(..._t):null;return[...Ce!=null?[Ce]:[],...ye.filter(je=>je!==Ce).reverse()]};r.tiersDone=!1;const x=()=>{if(h!==r.tierGen||r.gintData?.arcBuffer!==P)return;if(yr){setTimeout(x,120);return}z??=ne();const _e=z.shift();if(_e==null){r.tiersDone=!0,postMessage({action:"tiers",layer:r.id,tiers:r.lodTiers.map(Ne=>({minW:Ne.minW,edgeCount:Ne.edgeCount}))}),p?.();return}const ye=F1(g,_e,r.polyBboxByFid);ye.edgeCount&&(r.lodTiers.push({minW:ye.minW,edgeCount:ye.edgeCount,chunks:ye.chunks,tex:Oi(ye.metaU32,ye.edgeCount)}),r.lodTiers.sort((Ne,_t)=>Ne.minW-_t.minW)),setTimeout(x,0)};setTimeout(x,0)}function Or(r){for(const f of["arcTex","metaTex","metaTexB","ptTex","ptMetaTex","pivotTex","compTex"])fr(r[f]),r[f]=null;r.lodTiers?.length&&r.lodTiers.forEach(f=>fr(f.tex)),r.lodTiers=[],r.metaChunks=null,r.totalEdgesB=r.polyEdgesB=0,r.pivotW=0,r.compW=0}function Pl(r,f,g){const P=f instanceof Uint32Array?f:new Uint32Array(f);if(!g||P.length<g*4){Yn(r);return}const h=Math.min(4096,Mi),z=Math.ceil(g/h);r.fidStyleTex&&r.fidStyleTex.destroy();const ne=new Uint32Array(h*z*4);ne.set(P.subarray(0,g*4)),r.fidStyleTex=Ai(ne,h,z,"rgba32uint",4),r.fidStyleW=h,r._fidStyleH=z,r.fidStyleCount=g,r._fidStyleData={u32:P,count:g}}function Yn(r){r.fidStyleTex&&r.fidStyleTex.destroy(),r.fidStyleTex=null,r.fidStyleW=0,r._fidStyleH=0,r.fidStyleCount=0,r._fidStyleData=null,go(r)}let di=null;const go=r=>{r._exprJob&&(r._exprJob.destroy(),r._exprJob=null)};async function vo(r,f){if(!f?.prog||!(f.count>0))return Yn(r),r.idOverlapMode=!!f?.overlap,ee(),null;di||=lx(F,{texW:Math.min(4096,Mi)});const g=await di.create(f.prog,f);go(r),r._exprJob=g;const P=g.texW,h=g.H;return(!r.fidStyleTex||r.fidStyleW!==P||r._fidStyleH!==h)&&(r.fidStyleTex&&r.fidStyleTex.destroy(),r.fidStyleTex=F.createTexture({size:[P,h],format:"rgba32uint",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST})),g.run({tex:r.fidStyleTex}),r.fidStyleW=P,r._fidStyleH=h,r.fidStyleCount=f.count,r._fidStyleData=null,r.idOverlapMode=!!f.overlap,ee(),f.table?g.readback():null}function cs(r,f){const g=r._exprJob;if(!g||!r.fidStyleTex)return null;if(f?.dnum&&g.growDict(f.dnum,f.dcol),f?.rows)for(const[P,h]of f.rows)g.setState(P,h);return g.run({tex:r.fidStyleTex,zoom:f?.zoom}),ee(),f?.table?g.readback():Promise.resolve(null)}const Ht=[];let jt=null;const En=0,mo=1,Sl=2,xo=3,Xt=1792;function fs(){const r={...jo(),id:null,order:0,slots:new Map,activeKey:null,drawStyle:null,visible:!0,stylesDirty:!0,idOverlapMode:!1,tierGen:0,sbOn:!1,lastDrawData:null,_inRange:!1,_forceLowMove:!1,_budgetSkipped:!1,_pfLineEdges:0,_pfTierW:-1,_pfRuns:-1,_pfChunks:-1,_pfDrawn:0,_pfFbo:0,_pfPickMs:0,_dbg:null,_dbgRing:[],_auxBG:null,_auxKey:null,_idrBG:null,_idrGen:-1,_idrFid:null,gfBuf:F.createBuffer({size:Xt*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),gpBuf:F.createBuffer({size:Hn*11,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),styleBuf:F.createBuffer({size:8192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),idRBuf:F.createBuffer({size:1280,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})};r.frameBG=[0,Xt,Xt*2,Xt*3].map(f=>F.createBindGroup({layout:H,entries:[{binding:0,resource:{buffer:r.gfBuf,offset:f,size:Xt}},{binding:1,resource:{buffer:r.styleBuf}}]})),r.gfBufA=F.createBuffer({size:Xt*8,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r.frameBGA=[0,1,2,3,4,5,6,7].map(f=>F.createBindGroup({layout:H,entries:[{binding:0,resource:{buffer:r.gfBufA,offset:f*Xt,size:Xt}},{binding:1,resource:{buffer:r.styleBuf}}]})),r.paramBG=[];for(let f=0;f<11;f++)r.paramBG.push(F.createBindGroup({layout:be,entries:[{binding:0,resource:{buffer:r.gpBuf,offset:f*Hn,size:48}}]}));return r}const nt=r=>{if(r.activeKey==null)return;const f=r.slots.get(r.activeKey)??{};for(const g of Wu)f[g]=r[g];r.slots.set(r.activeKey,f)},Di=(r,f)=>{for(const g of Wu)r[g]=f[g];r.tierGen=(r.tierGen??0)+1,r===jt&&(lr=-1),r.lastDrawData=null,r._pfLineEdges=0,r._pfTierW=-1},pi=r=>{for(const f of["arcTex","metaTex","metaTexB","ptTex","ptMetaTex","pivotTex","compTex","fidStyleTex"])fr(r[f]),r[f]=null;r.lodTiers?.length&&r.lodTiers.forEach(f=>fr(f.tex)),r.lodTiers=[]};function sn(r,f){f!==r.activeKey&&(nt(r),Di(r,r.slots.get(f)??jo()),r.activeKey=r.slots.has(f)?f:null,r.activeKey!=null&&!r.tiersDone&&r.totalEdges>0&&as(r),ee())}function Dt(r,f,g){if(g=g??"user",f){nt(r);const P=r.slots.get(g);P&&g!==r.activeKey&&pi(P),g===r.activeKey&&Or(r),Di(r,jo()),r.activeKey=g,r.gintData=y1(f);const h=h1(r.gintData);ss(r,h),as(r,{weightHist:h.weightHist}),{minZoom:r.minZoom,maxZoom:r.maxZoom}=Xu({arcMeta:r.gintData.arcMeta,minZoom:f.minZoom??null,maxZoom:f.maxZoom??null,precision:f.precision??6}),r.slots.set(g,{})}else if(g===r.activeKey)Or(r),Di(r,jo()),r.slots.delete(g),r.activeKey=null;else{const P=r.slots.get(g);P&&(pi(P),r.slots.delete(g))}r===jt&&(lr=-1),r.lastDrawData=null,ee()}function Bl(r,f,g){if(g=g??"user",!f)return Dt(r,null,g);const P=r.activeKey;nt(r);const h=r.slots.get(g);h&&g!==r.activeKey&&pi(h),g===r.activeKey&&Or(r),Di(r,jo()),r.activeKey=g,r.gintData=f.gint,ss(r,f.artifacts);for(const z of f.tiers??[])z?.edgeCount&&r.lodTiers.push({minW:z.minW,edgeCount:z.edgeCount,chunks:z.chunks,tex:Oi(z.metaU32,z.edgeCount)});r.lodTiers.sort((z,ne)=>z.minW-ne.minW),r.tiersDone=!0,postMessage({action:"tiers",layer:r.id,tiers:r.lodTiers.map(z=>({minW:z.minW,edgeCount:z.edgeCount}))}),{minZoom:r.minZoom,maxZoom:r.maxZoom}=Xu({arcMeta:r.gintData.arcMeta,minZoom:f.minZoom??null,maxZoom:f.maxZoom??null,precision:f.precision??6}),r.slots.set(g,{}),r===jt&&(lr=-1),r.lastDrawData=null,P!==g&&sn(r,P),ee()}function et(r,f){r.drawStyle=f??null,r.stylesDirty=!0,ee()}function an(r,f){r.visible=!!f,ee()}function Fl(r,f){f?.table&&f.count>0?(go(r),Pl(r,f.table,f.count)):Yn(r),r.idOverlapMode=!!f?.overlap,ee()}function us(r,f,g,P){let h=null,z=null;for(const x of r.lodTiers??[])x.minW<=f&&(!h||x.edgeCount<h.edgeCount)&&(h=x),(!z||x.minW<z.minW)&&(z=x);const ne=h?{tex:h.tex,count:h.edgeCount,runs:bo(h.edgeCount,h.chunks),minW:h.minW}:{tex:g,count:P,runs:bo(P,r.metaChunks,r.span),minW:0};if(r._pfRuns=ne.runs.length,r._pfChunks=(h?h.chunks:r.metaChunks)?.length??0,!h&&z){let x=0;for(const _e of ne.runs)x+=_e[1];if(x>z.edgeCount*1.5)return{tex:z.tex,count:z.edgeCount,runs:bo(z.edgeCount,z.chunks),minW:z.minW}}return!h&&!z&&b1(ne),ne}const bo=(r,f,g=null)=>w1(Ae.lastViewBbox,r,f,g),jn=new ArrayBuffer(Xt*4),pe=new Float32Array(jn),Rt=new Uint32Array(jn),Kn=new Int32Array(jn);function cn(r,f,g,P,h=!1,z=0,ne=null){const x=f>>2,_e=g.depth;pe.set(g.mvp,x),pe[x+16]=g.clipT[0],pe[x+17]=g.clipT[1],pe[x+18]=g.clipT[2],pe[x+19]=g.clipT[3];const ye=(g.origin[0]%360+540)%360-180,Ne=ye*Math.PI/180,_t=wd(g.origin[1])*Math.PI/180;pe[x+20]=Math.cos(Ne),pe[x+21]=Math.sin(Ne),pe[x+22]=Math.cos(_t),pe[x+23]=Math.sin(_t),pe[x+24]=g.eye[0],pe[x+25]=g.eye[1],pe[x+26]=g.eye[2],pe[x+27]=0,pe[x+28]=g.originPt[0],pe[x+29]=g.originPt[1],pe[x+30]=g.originPt[2],pe[x+31]=0,pe[x+32]=ye,pe[x+33]=g.origin[1],pe[x+34]=Ae.width,pe[x+35]=Ae.height,Rt[x+36]=Math.round((ye+180)*1e7)>>>0,Rt[x+37]=Math.round((g.origin[1]+90)*1e7)>>>0,Kn[x+38]=Mi,Kn[x+39]=xd;const Ce=Zo(),je=g.origin[1]*Math.PI/180;pe[x+40]=g.originZr??0,pe[x+41]=P,pe[x+42]=Ce?Math.cos(2*je):0,pe[x+43]=Ce?Math.sin(2*je):0;const Lt=ne?ne.vbb:Ae.lastViewBbox;Lt?(Rt[x+44]=Math.max(0,Lt[0]-1e4),Rt[x+45]=Math.max(0,Lt[1]-1e4),Rt[x+46]=Math.min(4294967295,Lt[2]+1e4),Rt[x+47]=Math.min(4294967295,Lt[3]+1e4)):Rt[x+44]=Rt[x+45]=Rt[x+46]=Rt[x+47]=0,Rt[x+48]=!h&&r.pivotTex?1:0,Rt[x+49]=!h&&r.pivotTex&&Lt?1:0,Rt[x+50]=r.pivotW||1,Rt[x+51]=r.fidStyleTex?r.fidStyleW||1:0,pe[x+52]=_e?.logCoef??0,pe[x+53]=_e?.fogFar??1e9,pe[x+54]=_e?.elevScale??0,pe[x+55]=_e?.hasElev??0;const $t=_e?.elevBounds;pe[x+56]=$t?.[0]??0,pe[x+57]=$t?.[1]??0,pe[x+58]=$t?.[2]??1,pe[x+59]=$t?.[3]??1,pe[x+60]=_e?.edgeFade??0,pe[x+61]=Ce?Math.cos(4*je):0,pe[x+62]=Ce?Math.sin(4*je):0,pe[x+63]=Ce?1:0;const At=_e?.meshQ;pe[x+64]=At?.[0]??0,pe[x+65]=At?.[1]??0,pe[x+66]=At?.[2]??1,pe[x+67]=At?.[3]??1,pe[x+68]=_e?.meshG??0,pe[x+69]=g.near?.[0]??0,pe[x+70]=g.near?.[1]??0,pe[x+71]=z,pe[x+72]=ne?ne.off[0]:0,pe[x+73]=ne?ne.off[1]:0,pe[x+74]=ne?ne.inv[0]:1,pe[x+75]=ne?ne.inv[1]:1,pe[x+76]=ne?1:0,pe[x+77]=0,pe[x+78]=0,pe[x+79]=0;const er=ne?{atlas:ne}:g,at=!h&&r.pivotTex?g1(er,Lt):null,Ir=h?v1(er,Lt,m1(r.polyBboxByFid)):null;at?(pe[x+128]=at.axes[0],pe[x+129]=at.axes[1],pe[x+130]=at.axes[2],pe[x+131]=at.axes[3]):Ir&&(pe[x+128]=Ir[0],pe[x+129]=Ir[1],pe[x+130]=0,pe[x+131]=0),pe[x+132]=at?at.q[0]:0,pe[x+133]=at?at.q[1]:0,pe[x+134]=at?1:Ir?2:0,pe[x+135]=x1,Rt[x+136]=at?at.big[0]:0,Rt[x+137]=at?at.big[1]:0,Rt[x+138]=!h&&r.pivotTex&&r.compTex?r.compW||1:0,Rt[x+139]=0;const he=Je();he&&Gl(pe,x+80,g.origin,he,x+140)}function Gl(r,f,g,P,h){const z=ir(g[0],g[1]),ne=Math.min(P.planes.length,6);r.fill(0,f,f+48);const x=P.poly;if(x&&x.edges.length){const ye=[z[0]-x.C[0],z[1]-x.C[1],z[2]-x.C[2]],Ne=Math.min(x.edges.length,pv);r[f+26]=Ne,r[f+27]=x.inverse?1:0,r.set([x.e[0],x.e[1],x.e[2],x.e[0]*ye[0]+x.e[1]*ye[1]+x.e[2]*ye[2],x.n[0],x.n[1],x.n[2],x.n[0]*ye[0]+x.n[1]*ye[1]+x.n[2]*ye[2]],h);for(let _t=0;_t<Ne;_t++)r.set(x.edges[_t],h+8+_t*4)}for(let ye=0;ye<ne;ye++){const[Ne,_t,Ce,je]=P.planes[ye];r[f+ye*4]=Ne,r[f+ye*4+1]=_t,r[f+ye*4+2]=Ce,r[f+ye*4+3]=Ne*z[0]+_t*z[1]+Ce*z[2]-je}r[f+24]=ne;const _e=Qo(P.st,g);r.set([..._e.F,0,..._e.X,0,..._e.Y,0,..._e.E,_e.c,..._e.EO,0],f+28)}const Dr=new ArrayBuffer(Hn*11),or=new Float32Array(Dr),_r=new Int32Array(Dr);function Nt(r,{width:f=0,widthAdd:g=0,radius:P=0,hidden:h=0,dpr:z=null,fidW:ne=0,activeId:x=-1,pass:_e=0,color:ye=null}={}){const Ne=r*(Hn>>2);or[Ne]=f,or[Ne+1]=g,or[Ne+2]=P,or[Ne+3]=z??h,_r[Ne+4]=x,_r[Ne+5]=_e,_r[Ne+7]=0,ne?or[Ne+6]=ne:_r[Ne+6]=0,ye?(or[Ne+8]=ye[0],or[Ne+9]=ye[1],or[Ne+10]=ye[2],or[Ne+11]=ye[3]):or[Ne+8]=or[Ne+9]=or[Ne+10]=or[Ne+11]=0}const ki=new Float32Array(2048);function ds(r,f){const g=f.styleTable??Hu,P=f.dashTable??a1;ki.set(g,0);for(let h=0;h<256;h++)ki[1024+h*4]=P[h*2],ki[1024+h*4+1]=P[h*2+1];F.queue.writeBuffer(r.styleBuf,0,ki),r.stylesDirty=!1}let Ii=0,gi=0,hr=null;function yo(r,f){const g=s.frameInfo();if(!g){for(const z of Ht)vi(z,r,"noFrame");return}Ae.width=g.w,Ae.height=g.h,Ae.dpr=r.dpr||1;const P=is,h=!P||P.center[0]!==r.center[0]||P.center[1]!==r.center[1]||P.zoom!==r.zoom||P.pitch!==r.pitch||P.bearing!==r.bearing;is={center:[r.center[0],r.center[1]],zoom:r.zoom,pitch:r.pitch,bearing:r.bearing},h?(yr=!0,clearTimeout(Fn),Fn=null,Rr=null,$r=0,lr!==-1&&(lr=-1,postMessage({action:"identify",featureId:null,layer:jt?.id??null}))):(yr=!1,$r=($r??0)+1),Bn=NaN,uo=NaN;for(const z of Ht)ps(z,r,g,f)}function vi(r,f,g){r._dbg={path:g,vis:r.visible,z:+(f.zoom??0).toFixed(2),t:Date.now()%1e5},(r._dbgRing??=[]).push(`${g[0]}${r.visible?"":"!"}z${(f.zoom??0).toFixed(1)}w${r._pfTierW??"?"}e${(r._pfLineEdges??0)/1e3|0}k`),r._dbgRing.length>90&&r._dbgRing.shift()}function ps(r,f,g,P){if(r.sbOn=$n(r),!r.visible&&!r.polyBboxByFid&&r.totalPoints===0){vi(r,f,"hidden"),r._inRange=!1,r.lastDrawData=null;return}const h=r.drawStyle?.moveBudget??25e4;if($r>=4?r._forceLowMove=!1:(r._pfLineEdges??0)>h&&(r._forceLowMove=!0),r._forceLowMove){const x=r.metaTexB&&r.totalEdgesB>0&&r.totalEdgesB<=h,_e=(r.polyBboxByFid?.size??0)>0&&(!r.fillOff||r.lowFill)&&r.polyEdgesB>0&&r.polyEdgesB<=h*8;if(!x&&!_e){vi(r,f,"budget"),r.lastDrawData=null,r._budgetSkipped=!0;return}yr||p?.()}const z={cam:f,...r.drawStyle||{}};if(r._forceLowMove&&(z._forceLow=!0),!Nu(r,z)){vi(r,f,"range"),r._inRange=!1,r.lastDrawData=null,r._pfLineEdges=0,r._pfTierW=-1;return}if(r._inRange=!0,r.totalEdges===0&&r.totalPoints===0){r.lastDrawData=null,r._pfLineEdges=0,r._pfTierW=-1;return}r._budgetSkipped=!1;const ne=Vu(Ae,z);P&&P.terrainDepth&&!z.noDepth&&(ne.depth=P),P&&P.facesInAtlas&&(ne.noFaces=!0),r.visible&&gs(r,ne,g,P),vi(r,f,r.visible?"drew":"invisible"),r.lastDrawData=ne,r===jt&&xl&&(xl=!1,Tl())}function ho(r,f,g=!1){const P=f.styleTable??Hu,h=f.zoom??99,z=f.outlineZoom??r.outlineZoom??ox,ne=h<z,x=yr||($r??99)<4,_e=ne||x&&h<z+1.5||!!f._forceLow,ye=(r.polyBboxByFid?.size??0)>0&&(!r.fillOff||r.lowFill),Ne=f._forceLow?P[3]*.8:P[3]*.8*Math.max(0,Math.min(1,(z+1.2-h)/1.2)),_t=f.fillColor??(ye&&(_e||Ne>.004)?[P[0],P[1],P[2],Ne]:c1),Ce=!!(r.metaTexB&&r.polyEdgesB>0)&&!g,je=Ce?r.metaTexB:r.metaTex,Lt=Ce?r.polyEdgesB:r.polyEdges,$t=!f.noFaces&&_t[3]>0&&Lt>0&&r.arcTex&&!(f._forceLow&&Lt>(f.moveBudget??25e4)*8),At=!f.noFaces&&!f._forceLow&&os(r);return{lowZoom:ne,lowZoomEff:_e,moving:x,fc:_t,hasB:Ce,stTex:je,stCount:Lt,doFill:$t,idFill:At}}function gs(r,f,g,P){const h=f.depth,z=ln(g.samples||s.samples||4,r.sbOn,!!Je());cn(r,En*Xt,f,f.lodRank??0),cn(r,mo*Xt,f,0),cn(r,Sl*Xt,f,f.lodRank??0,!0),cn(r,xo*Xt,f,0,!0),F.queue.writeBuffer(r.gfBuf,0,jn),r.stylesDirty&&ds(r,f);const ne=ho(r,f),{lowZoom:x,lowZoomEff:_e,moving:ye,fc:Ne,hasB:_t,stTex:Ce,stCount:je,doFill:Lt}=ne;!yr&&ye&&!x&&_e&&p?.();const $t=ne.idFill&&Yt()&&!!fi(r);let At=null;if(r.totalEdges>0&&r.arcTex){const xt=r.lodTiers?.length?r.lodTiers[0]:null;At=(f._forceLow?!!(r.metaTexB&&r.totalEdgesB>0&&r.totalEdgesB<=(f.moveBudget??25e4)):_e&&r.metaTexB&&r.polyEdgesB>0&&(xt?r.totalEdgesB<=xt.edgeCount*1.5:r.totalEdgesB<=6e5))?{tex:r.metaTexB,count:r.totalEdgesB,runs:null,minW:-2,boundary:!0,sub:S1(r.subB)}:f._forceLow?null:{...us(r,f.lodRank??0,r.metaTex,r.totalEdges),boundary:!1}}!At&&f._forceLow&&(r._pfLineEdges=0,r._pfTierW=-4);const er=r===jt?lr:-1,at=f.lineWidth??1;Nt(Bt.stencil,{}),Nt(Bt.fill,{color:Ne}),Nt(Bt.line,{width:at,activeId:er,pass:0,fidW:Ae.dpr}),Nt(Bt.lineHidden,{width:at,activeId:er,pass:0,hidden:1,fidW:Ae.dpr}),Nt(Bt.hilite,{width:at+2,widthAdd:2,radius:f.hiliteWidth||0,activeId:er,pass:1,color:f.hiliteColor,fidW:Ae.dpr}),Nt(Bt.maskStencil,{activeId:er}),Nt(Bt.maskFill,{color:f.maskColor??qu}),Nt(Bt.point,{radius:f.ptRadius??1.5,activeId:-1,dpr:Ae.dpr}),Nt(Bt.pointHi,{radius:f.ptRadius??1.5,activeId:er,dpr:Ae.dpr}),F.queue.writeBuffer(r.gpBuf,0,Dr);const Ir=Cn(r,P?.elevView,P?.elevSampler);if(r._pickElev=P?.elevView?[P.elevView,P.elevSampler]:null,$t){kr[0]=r.fidStyleW||1,kr[1]=r.fidStyleCount,kr[2]=r.idOverlapMode?1:0,kr[3]=0;const xt=Je();xt&&(Gl(jr,4,f.origin,xt,56),jr[52]=Ae.width,jr[53]=Ae.height),F.queue.writeBuffer(r.idRBuf,0,kr);const zt=g.enc.beginRenderPass({timestampWrites:s.passTS?.("gint"),colorAttachments:[{view:Yr,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});zt.setPipeline(r.sbOn?ot.sb:ot.t),zt.setBindGroup(0,r.frameBG[mo]),zt.setBindGroup(1,r.paramBG[Bt.stencil]),zt.setBindGroup(2,Lr(r.sbOn,r.arcTex,r.metaTex)),zt.setBindGroup(3,Ir),zt.draw(r.polyEdges*3),zt.end()}const he=g.enc.beginRenderPass({timestampWrites:s.passTS?.("gint"),colorAttachments:[{view:g.colorView,loadOp:"load",storeOp:"store"}],depthStencilAttachment:{view:g.depthView,depthLoadOp:"load",depthStoreOp:"store",stencilLoadOp:"load",stencilStoreOp:"store"}});he.setStencilReference(0),he.setBindGroup(1,r.paramBG[Bt.stencil]),he.setBindGroup(3,Ir),yl(he);const Jn=!!(h&&(h.elevScale??0)>0&&h.hasElev);if($t?(he.setPipeline(Jn?z.idResolveOcc:z.idResolve),he.setBindGroup(0,fi(r)),he.draw(3)):Lt&&(he.setBindGroup(0,r.frameBG[_t?xo:mo]),he.setBindGroup(2,Lr(r.sbOn,r.arcTex,Ce)),he.setPipeline(z.stencilFan),he.draw(je*3),Jn&&(he.setStencilReference(128),he.setPipeline(z.occlude),he.draw(3),he.setStencilReference(0)),he.setPipeline(z.cover),he.setBindGroup(1,r.paramBG[Bt.fill]),he.draw(3),he.setPipeline(z.zero),he.draw(3)),$t&&he.setBindGroup(3,Ir),At){he.setBindGroup(0,r.frameBG[At.boundary?Sl:En]),he.setBindGroup(2,Lr(r.sbOn,r.arcTex,At.tex)),he.setPipeline(h?z.lineTest:z.line),he.setBindGroup(1,r.paramBG[Bt.line]);const xt=At.runs??[[0,At.count]],zt=At.runs?At.runs.sub:At.sub,Mn=yr||!!(h&&h.moving),mr=o1(h,zt,Mn);mr.skipE7>0&&(cn(r,En*Xt,f,f.lodRank??0,!1,mr.skipE7),cn(r,Sl*Xt,f,f.lodRank??0,!0,mr.skipE7),F.queue.writeBuffer(r.gfBuf,0,jn));const So=()=>{for(const[Un,pn]of xt)_n(he,pn,Un);if(mr.skipE7>0&&zt)for(let Un=0;Un<B1;Un++){const pn=mr.N[Un],Vi=zt[Un];if(!(pn<=1||!Vi))for(const[El,ws]of Vi)_n(he,ws,El,pn,pn<<16)}};let dn=0;for(const Un of xt)dn+=Un[1];So(),r._pfLineEdges=dn,r._pfSubs=mr.total,r._pfTierW=At.minW??-1,h&&!Mn&&dn<1e5&&(he.setPipeline(z.lineHidden),he.setBindGroup(1,r.paramBG[Bt.lineHidden]),So())}if(r.totalPoints>0&&r.ptTex&&r.ptMetaTex&&(he.setPipeline(z.point),he.setBindGroup(0,r.frameBG[En]),he.setBindGroup(1,r.paramBG[Bt.point]),he.setBindGroup(2,Lr(r.sbOn,r.ptTex,r.ptMetaTex)),_n(he,r.totalPoints,0)),er!==-1&&(r.arcTex||r.ptTex)){const xt=r.polyEdgeByFid?.get(er),zt=xt?.[0]??null,Mn=xt?.[1]??null,mr=zt!=null&&Mn>0;if(r.totalEdges>0&&r.metaTex){he.setPipeline(z.line),he.setBindGroup(0,r.frameBG[En]),he.setBindGroup(1,r.paramBG[Bt.hilite]),he.setBindGroup(2,Lr(r.sbOn,r.arcTex,r.metaTex));const dn=s1(h,[[0,mr?Mn:r.totalEdges,r.span?.[0]??-1,r.span?.[1]??-1]])[0];mr?_n(he,Mn,zt,dn,dn<<16):_n(he,r.totalEdges,0,dn,dn<<16)}r.totalPoints>0&&r.ptTex&&r.ptMetaTex&&(he.setPipeline(z.point),he.setBindGroup(1,r.paramBG[Bt.pointHi]),he.setBindGroup(2,Lr(r.sbOn,r.ptTex,r.ptMetaTex)),_n(he,r.totalPoints,0)),(f.maskColor??qu)[3]>0&&mr&&r.metaTex&&(he.setPipeline(z.zero),he.setBindGroup(1,r.paramBG[Bt.maskStencil]),he.draw(3),he.setPipeline(z.stencilFan),he.setBindGroup(0,r.frameBG[En]),he.setBindGroup(2,Lr(r.sbOn,r.arcTex,r.metaTex)),he.draw(Mn*3,1,zt*3),he.setPipeline(z.coverEq),he.setBindGroup(1,r.paramBG[Bt.maskFill]),he.draw(3),he.setPipeline(z.zero),he.draw(3))}he.end()}const wo=new ArrayBuffer(1280),kr=new Uint32Array(wo),jr=new Float32Array(wo);function Tl(){yr=!1;const r=jt;if(!r)return;if(r._pfDrawn=(r._pfDrawn??0)+1,!r.lastDrawData){r._budgetSkipped&&(r._budgetSkipped=!1,$r=4,xl=!0,p?.());return}if(!r.polyBboxByFid&&r.totalPoints===0)return;r.sbOn=$n(r),(!hr||Ii!==Ae.width||gi!==Ae.height)&&(hr&&hr.destroy(),hr=F.createTexture({size:[Ae.width,Ae.height],format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),Ii=Ae.width,gi=Ae.height,r._pfFbo=(r._pfFbo??0)+1);const f=performance.now(),g=r.lastDrawData,P=12*(Ae.dpr??1);cn(r,0,g,g.lodRank??0),F.queue.writeBuffer(r.gfBuf,0,jn,0,Xt),Nt(Bt.pickLine,{width:(g.lineWidth??1)+P}),Nt(Bt.pickPoint,{radius:Math.max(g.ptRadius??1.5,P*.5),dpr:Ae.dpr}),F.queue.writeBuffer(r.gpBuf,Bt.pickLine*Hn,Dr,Bt.pickLine*Hn,Hn*2);const h=r._pickElev?s.gintCtx?.():null,z=Cn(r,h?.elevView??r._pickElev?.[0]??null,h?.elevSampler??r._pickElev?.[1]??null),ne=F.createCommandEncoder(),x=ne.beginRenderPass({colorAttachments:[{view:hr.createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});if(x.setBindGroup(0,r.frameBG[En]),x.setBindGroup(3,z),yl(x),r.totalEdges>0&&r.metaTex&&r.arcTex){const _e=us(r,g.lodRank??0,r.metaTex,r.totalEdges);x.setPipeline(ge(r.sbOn,!!Je())[0]),x.setBindGroup(1,r.paramBG[Bt.pickLine]),x.setBindGroup(2,Lr(r.sbOn,r.arcTex,_e.tex));for(const[ye,Ne]of _e.runs??[[0,_e.count]])_n(x,Ne,ye)}if(r.totalPoints>0&&r.ptTex&&r.ptMetaTex&&(x.setPipeline(ge(r.sbOn,!!Je())[1]),x.setBindGroup(1,r.paramBG[Bt.pickPoint]),x.setBindGroup(2,Lr(r.sbOn,r.ptTex,r.ptMetaTex)),_n(x,r.totalPoints,0)),x.end(),F.queue.submit([ne.finish()]),r._pfPickMs=(r._pfPickMs??0)+(performance.now()-f),Rr){const _e=Rr;Rr=null,Ni(_e)}}let Kt=null,Qn=null;function Ni(r){if(r.x===Bn&&r.y===uo||(Bn=r.x,uo=r.y,ml=r.x,Gn=r.y,!hr))return;const f=Math.max(0,Math.min(Ii-1,Math.round(r.x*Ae.dpr))),g=Math.max(0,Math.min(gi-1,Math.round(r.y*Ae.dpr)));if(Qn){Qn.next={data:r};return}Kt||(Kt=F.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}));const P=F.createCommandEncoder();P.copyTextureToBuffer({texture:hr,origin:{x:f,y:g}},{buffer:Kt,bytesPerRow:256},{width:1,height:1}),F.queue.submit([P.finish()]),Qn={data:r},setTimeout(()=>Kt.mapAsync(GPUMapMode.READ).then(()=>{const h=new Uint8Array(Kt.getMappedRange(0,4)).slice();Kt.unmap();const z=Qn;Qn=null,z&&(vs(h,z.data),z.next&&(Bn=NaN,Ni(z.next.data)))}).catch(()=>{Qn=null}),0)}function vs(r,f){const g=jt;if(!g)return;const P=r[0]|r[1]<<8|r[2]<<16;let h=P===0?null:P-1;if(P===0&&g.gintData?.polyStream&&Ae.cam){const ne=df(Ae.cam,f.x*Ae.dpr,f.y*Ae.dpr),x=Je();ne&&!(x&&(gv(x.planes,ne[0],ne[1],0)<0||x.poly&&vv(x.poly,ne[0],ne[1])<0))&&(h=T1(g.gintData.arcBuffer,g.gintData.arcMeta,g.gintData.polyStream,Math.round((ne[0]+180)*1e7),Math.round((ne[1]+90)*1e7),g.polyBboxByFid,Ae.lastViewBbox,P1(g)))}const z=h??-1;z!==lr&&(lr=z,postMessage({action:"identify",featureId:h??null,x:f.x,y:f.y,layer:g.id}),p?.())}function Na(r){const f=jt;if(f){if(!f._inRange){Po();return}if(!hr&&f.lastDrawData&&!yr&&Tl(),!Ae.cam||!f.gintData||yr){yr&&(Rr=r);return}if(Fn!==null){Rr=r;return}Ni(r),Fn=setTimeout(()=>{Fn=null,Rr&&(Ni(Rr),Rr=null)},f1)}}function Po(){clearTimeout(Fn),Fn=null,Rr=null,lr!==-1&&(lr=-1,postMessage({action:"identify",featureId:null,layer:jt?.id??null}),p?.())}function mi(){if(lr===-1)return;const r=Ae.cam?df(Ae.cam,ml*Ae.dpr,Gn*Ae.dpr):null;postMessage({action:"click",featureId:lr,x:ml,y:Gn,lng:r?.[0]??null,lat:r?.[1]??null,layer:jt?.id??null})}function zr(r){nt(r);for(const f of r.slots.values())pi(f);r.slots.clear(),r.activeKey=null,Or(r),Yn(r),r.gfBuf.destroy(),r.gpBuf.destroy(),r.styleBuf.destroy(),r.idRBuf.destroy(),r.gfBufA?.destroy(),r._idrA=null,r.gintData=null,r.polyEdgeByFid=null,r.polyBboxByFid=null,r.fillOff=!1,r.lowFill=!1,r.totalEdges=r.totalPoints=r.polyEdges=0,r.lastDrawData=null}function xi(){for(const r of Ht)zr(r);Ht.length=0,jt=null,lr=-1,hr&&(hr.destroy(),hr=null),Kt&&(Kt.destroy(),Kt=null),Tt&&(Tt.destroy(),Tt=null);for(const r of Cl.values())r.stTex.destroy(),r.idTex?.destroy();Cl.clear(),Tn.destroy(),po.destroy()}function _l(r){return{drawn:r._pfDrawn??0,fbo:r._pfFbo??0,pickMs:r._pfPickMs??0,sb:fe?r.sbOn?1:0:-1,quad4:A?1:0,rank:r.lastDrawData?.lodRank??-1,tierW:r._pfTierW??-1,edges:r._pfLineEdges??0,dbg:r._dbg??null,ring:(r._dbgRing??[]).slice(-40).join(" "),style:r.drawStyle?{oz:r.drawStyle.outlineZoom,mb:r.drawStyle.moveBudget,nd:r.drawStyle.noDepth,lw:r.drawStyle.lineWidth}:null,tiers:r.lodTiers?.length??0,tiersDone:!!r.tiersDone,total:r.totalEdges,expr:r._exprJob?1:0,layers:Math.max(r.arcTex?.depthOrArrayLayers??0,r.metaTex?.depthOrArrayLayers??0,r.ptTex?.depthOrArrayLayers??0),layerH:G,sbLimit:N,runs:r._pfRuns??-1,chunks:r._pfChunks??-1,subs:r._pfSubs??0,vb:Ae.lastViewBbox}}function ur(r){return{set:(f,g)=>Dt(r,f,g),setSlot:f=>sn(r,f),setBaked:(f,g)=>Bl(r,f,g),style:f=>et(r,f),setVisible:f=>an(r,f),paint:f=>Fl(r,f),paintExpr:f=>vo(r,f),exprState:f=>cs(r,f),stats:()=>_l(r),range:()=>({minZoom:r.minZoom??null,maxZoom:r.maxZoom??null}),activate:()=>{jt!==r&&(jt=r,lr=-1)},setOrder:f=>{const g=Ht.indexOf(r);if(g<0)return;Ht.splice(g,1),r.order=f;const P=Ht.findIndex(h=>h.order>f);Ht.splice(P<0?Ht.length:P,0,r),ee()},remove:()=>{const f=Ht.indexOf(r);f<0||(Ht.splice(f,1),zr(r),jt===r&&(jt=Ht.length?Ht[Ht.length-1]:null,lr=-1),ee())}}}let xe=0;function fn({id:r=null,order:f=null}={}){const g=fs();g.id=r,g.order=f??++xe;const P=Ht.findIndex(h=>h.order>g.order);return Ht.splice(P<0?Ht.length:P,0,g),jt=g,lr=-1,Se++,ur(g)}const Zn={format:"stencil8",depthWriteEnabled:!1,depthCompare:"always"},zl=(r,f,g,P,h,z,ne)=>F.createRenderPipeline({label:wt(),layout:h,vertex:{module:r,entryPoint:f},fragment:{module:r,entryPoint:g,targets:[{format:"rgba8unorm",blend:z,writeMask:ne}]},primitive:{topology:"triangle-list"},depthStencil:P,multisample:{count:1}}),ms=new Map,xs=r=>{let f=ms.get(r);if(!f){const[g,P]=r?[J,O]:[tt,U],h={compare:"not-equal",failOp:"keep",depthFailOp:"keep",passOp:"keep"};f=Sn(`gintAtlas${r?"SB":""}`,C,{stencilFan:()=>zl(g,"vsStencil","fsNull",{...Zn,stencilFront:We,stencilBack:Ze,stencilWriteMask:255},P,void 0,0),cover:()=>zl(g,"vsFull","fsFill",{...Zn,stencilFront:h,stencilBack:h,stencilReadMask:255,stencilWriteMask:0},P,Xe,void 0),idResolve:()=>F.createRenderPipeline({label:wt(),layout:Ot,vertex:{module:st,entryPoint:"vs"},fragment:{module:st,entryPoint:"fs",targets:[{format:"rgba8unorm",blend:Xe}]},primitive:{topology:"triangle-list"},depthStencil:Zn,multisample:{count:1}})}),ms.set(r,f)}return f},Cl=new Map;function bs(r){let f=Cl.get(r);if(!f){const g=F.createTexture({size:[r,r],format:"stencil8",usage:GPUTextureUsage.RENDER_ATTACHMENT});f={stTex:g,stView:g.createView(),idTex:null,idView:null,gen:0},Cl.set(r,f)}return f}function ys(r,f){return r.idTex||(r.idTex=F.createTexture({size:[f,f],format:Ue,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),r.idView=r.idTex.createView(),r.gen++),r.idView}function Va(r,f,g){const P=r._idrA??=new Map,h=P.get(g);if(h&&h.gen===f.gen&&h.fid===r.fidStyleTex)return h.bg;const z=F.createBindGroup({layout:qe,entries:[{binding:0,resource:ys(f,g)},{binding:1,resource:r.fidStyleTex.createView()},{binding:2,resource:{buffer:r.idRBuf}}]});return P.set(g,{gen:f.gen,fid:r.fidStyleTex,bg:z}),z}function hs(r,{enc:f,view:g,size:P,win:h,index:z,vp:ne}){if(!Ae.width)return 0;const x=bs(P),ye=h[0]<-180||h[0]+h[2]>180?null:[Math.round((h[0]+180)*1e7),Math.round((Math.max(-90,h[1])+90)*1e7),Math.round((h[0]+h[2]+180)*1e7),Math.round((Math.min(90,h[1]+h[3])+90)*1e7)],Ne=s.gintCtx?.();let _t=0;for(const Ce of Ht){if(!Ce.visible||(Ce.polyBboxByFid?.size??0)===0||!Ce.arcTex)continue;const je={cam:r,...Ce.drawStyle||{}};if(Ce._forceLowMove&&(je._forceLow=!0),!Nu(Ce,je)||Ce.totalEdges===0)continue;const Lt=Vu(Ae,je),$t=ho(Ce,Lt,!0),At=$t.idFill&&!!Ce.fidStyleTex;if(!At&&!$t.doFill)continue;Ce.sbOn=$n(Ce);let at=(Lt.origin[0]%360+540)%360-180-h[0];at-=360*Math.round((at-h[2]/2)/360);const Ir={off:[at,Lt.origin[1]-h[1]],inv:[1/h[2],1/h[3]],vbb:ye};cn(Ce,0,Lt,0,!1,0,Ir),cn(Ce,Xt,Lt,0,!0,0,Ir),F.queue.writeBuffer(Ce.gfBufA,z*2*Xt,jn,0,Xt*2),Ce.stylesDirty&&ds(Ce,Lt);const he=Cn(Ce,Ne?.elevView,Ne?.elevSampler),Jn=xs(Ce.sbOn);if(At){kr[0]=Ce.fidStyleW||1,kr[1]=Ce.fidStyleCount,kr[2]=Ce.idOverlapMode?1:0,kr[3]=0,F.queue.writeBuffer(Ce.idRBuf,0,kr);const zt=f.beginRenderPass({colorAttachments:[{view:ys(x,P),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});ne&&zt.setViewport(ne[0],0,ne[1],P,0,1),zt.setPipeline(Ce.sbOn?ot.sb:ot.t),zt.setBindGroup(0,Ce.frameBGA[z*2]),zt.setBindGroup(1,Ce.paramBG[Bt.stencil]),zt.setBindGroup(2,Lr(Ce.sbOn,Ce.arcTex,Ce.metaTex)),zt.setBindGroup(3,he),zt.draw(Ce.polyEdges*3,2),zt.end()}else Nt(Bt.fill,{color:$t.fc}),F.queue.writeBuffer(Ce.gpBuf,Bt.fill*Hn,Dr,Bt.fill*Hn,Hn);const xt=f.beginRenderPass({colorAttachments:[{view:g,loadOp:"load",storeOp:"store"}],depthStencilAttachment:{view:x.stView,stencilLoadOp:"clear",stencilClearValue:0,stencilStoreOp:"discard"}});xt.setStencilReference(0),ne&&xt.setViewport(ne[0],0,ne[1],P,0,1),At?(xt.setPipeline(Jn.idResolve),xt.setBindGroup(0,Va(Ce,x,P)),xt.draw(3)):(xt.setBindGroup(0,Ce.frameBGA[z*2+($t.hasB?1:0)]),xt.setBindGroup(1,Ce.paramBG[Bt.stencil]),xt.setBindGroup(2,Lr(Ce.sbOn,Ce.arcTex,$t.stTex)),xt.setBindGroup(3,he),xt.setPipeline(Jn.stencilFan),xt.draw($t.stCount*3,2),xt.setPipeline(Jn.cover),xt.setBindGroup(1,Ce.paramBG[Bt.fill]),xt.draw(3)),xt.end(),_t++}return _t}const Wa=()=>`${Se}|${yr||($r??99)<4?1:0}|${Ht.map(r=>r._forceLowMove?1:0).join("")}`,un=fn();return{set:un.set,setSlot:un.setSlot,setBaked:un.setBaked,style:un.style,setVisible:un.setVisible,paint:un.paint,stats:un.stats,activate:un.activate,draw:yo,drawn:Tl,move:Na,leave:Po,click:mi,dispose:xi,addLayer:fn,bakeFaces:hs,bakeSig:Wa}}var xx=Object.freeze({__proto__:null,createGintLayerGPU:cx,createRendererGPU:Ym});export{xx as b,fo as r};
