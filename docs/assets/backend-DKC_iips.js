import{s as Fu,a as Lu,b as wu,p as Pu,C as ki,c as Su,m as Du,l as Cu,d as Bu,e as Uu,f as Xi,n as Mu,h as Iu,i as Nu,j as Ou,o as zu,k as ku,q as Xu}from"./renderworker-D_COh6DJ.js";import{c as la,a as ua,C as rn,l as Gu,f as Vu,r as fa,R as Wu,b as zr,d as Hu,e as Ku,p as qu,g as Yu,w as ju,h as $u,i as Zu,j as kr,k as Qu,m as Ju,n as ef,o as tf,q as of,s as rf,t as nf,u as af,v as lf,x as uf,y as ff,z as cf,A as ca,B as sf,D as _f,E as df,F as vf,G as mf,H as Gi,I as sa,J as _a,K as xf,L as Ef,M as pf,N as bf,O as Tf,P as hf,Q as gf,S as yf,T as Rf,U as Af,V as Ff,W as Lf,X as wf,Y as Pf,Z as Sf,_ as $i,$ as Df,a0 as ka,a1 as Cf,a2 as Bf,a3 as Uf,a4 as Mf,a5 as ao,a6 as Vi,a7 as Wi,a8 as da}from"./drawdata-DLNGIHNY.js";import{t as To,o as nn,h as uo,a as If,q as va,v as Nf,x as ma,y as Of,z as zf,A as xa,l as lo,B as kf,u as an}from"./rangecache-flag-DUqD5ZxK.js";import{e as Xf}from"./paintzoom-Dv7-Ly9z.js";import{s as Xr}from"./scene-DPUy_syw.js";import{c as Gf}from"./poststage-CdlNbdo_.js";import{f as Vf,F as Wf,c as Hf,b as Kf,a as qf,t as Yf,s as jf,d as $f,e as Zf,l as Qf,S as Jf,v as ec,h as tc,i as Gr,g as Ea}from"./bake-BKDmfqS9.js";import{f as oc}from"./identify-6uy89DSH.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";import"./gint-CASpJLTo.js";import"./pbf-base-CiJ2UBNh.js";const ii=`
uniform sampler2D u_elevTex;
uniform vec4 u_elevBounds;   // originLng, originLat, spanLng, spanLat（アトラス被覆）
uniform float u_elevScale;   // (誇張 / 地球半径m) : m → 単位球
uniform float u_hasElev;     // 0/1
uniform float u_elevEdgeFade;   // 窓の縁のフェード幅(deg)。0=無効（R90全球窓）。R10/R01窓の外（標高0）との崖を馴染ませる
// 遠景層（far）＝近窓の外を受け持つ粗い R10 第2アトラス（terrain.js が深ズーム×チルトで常設）。
// 近窓の縁は「0 へ落とす」でなく「遠層の値へ溶かす」＝ズームインで近窓(cap4=4°)が縮んでも
// 遠方の山（富士等）が消えない一般則。遠層なし（u_hasFar=0）は elevFar=0 で従来式
// mix(0, near, fade) = near×fade に厳密一致＝挙動不変。
uniform sampler2D u_farElevTex;
uniform vec4 u_farBounds;
uniform float u_hasFar;
uniform float u_farEdgeFade;
float elevFadeAt(vec2 uv) {
	if (u_elevEdgeFade <= 0.0) return 1.0;
	vec2 w = vec2(u_elevEdgeFade) / u_elevBounds.zw;
	return min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
}
float elevFar(vec2 ll) {
	if (u_hasFar < 0.5) return 0.0;
	ll.x -= 360.0 * floor((ll.x + 180.0) / 360.0);   // 経度を -180..180 へ（原点相対の経度は ±180 を越えうる）
	vec2 uv = (ll - u_farBounds.xy) / u_farBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	float f = 1.0;
	if (u_farEdgeFade > 0.0) {   // 遠窓自身の縁は従来どおり 0 へフェード（その先は覆いが無い）
		vec2 w = vec2(u_farEdgeFade) / u_farBounds.zw;
		f = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return texture(u_farElevTex, uv).r * f;
}
// 近景層（near）＝目の足元の細密窓（1 セル・2026-10-28）：近窓（R01＝108m/texel）の内側に外来 DEM／R01 生タイルから焼いた
// 1/64°〜1/2° の窓を重ねる。縁は近窓の値へ溶かす（far の一般則の内側版）＝近景層なし（u_hasNear=0）は base をそのまま返す＝挙動不変
// 近景テクスチャは 2 セル幅：左半分＝近景層（near）・右半分＝足元層（fine・2026-10-31）＝画面下端の視線が目から 1.5 km 以内で当たる地面の 1/512°〜1/32° の窓
// （≈1〜7 m/texel）。足元層は近景層の値へ縁で溶かす（near が近窓へ溶けるのと同じ一般則）＝無し（u_hasFine=0）は近景層のまま
uniform sampler2D u_nearElevTex;
uniform vec4 u_nearBounds;
uniform float u_hasNear;
uniform float u_nearEdgeFade;
uniform vec4 u_fineBounds;
uniform float u_hasFine;
uniform float u_fineEdgeFade;
float elevFine(vec2 ll, float base) {
	if (u_hasFine < 0.5) return base;
	vec2 uv = (ll - u_fineBounds.xy) / u_fineBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return base;
	vec2 w = vec2(u_fineEdgeFade) / u_fineBounds.zw;
	float f = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	return mix(base, texture(u_nearElevTex, vec2(0.5 + uv.x * 0.5, uv.y)).r, f);
}
float elevNear(vec2 ll, float base) {
	if (u_hasNear < 0.5) return base;
	vec2 uv = (ll - u_nearBounds.xy) / u_nearBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return base;
	vec2 w = vec2(u_nearEdgeFade) / u_nearBounds.zw;
	float f = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	return elevFine(ll, mix(base, texture(u_nearElevTex, vec2(uv.x * 0.5, uv.y)).r, f));
}
float elev(vec2 ll) {
	if (u_hasElev < 0.5) return 0.0;
	vec2 uv = (ll - u_elevBounds.xy) / u_elevBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return elevFar(ll);
	return elevNear(ll, mix(elevFar(ll), texture(u_elevTex, uv).r, elevFadeAt(uv)));   // アトラスは南上げ格納＝v直接
}
`,bt=`
uniform mat4  u_mvp;
uniform vec3  u_eye;        // カメラ位置（単位球ワールド）
uniform vec2  u_origin;     // シーン原点 lon/lat (deg)
uniform vec2  u_viewport;   // canvas 幅高 (device px)
uniform float u_fogNear;    // フォグ開始距離（カメラからの距離）
uniform float u_fogFar;     // フォグ全開距離
uniform vec3  u_fogColor;   // 霞む先の色（=land基色）
const float D2R = 0.017453292519943295;
float fogOf(vec3 w) { return clamp((distance(u_eye, w) - u_fogNear) / max(u_fogFar - u_fogNear, 1e-6), 0.0, 1.0); }
uniform float u_logCoef;   // 対数深度係数 = 2/log2(far+1)。球(半径1)+局所(建物)の深度精度枯れ(z-fight/マダラ)対策
// clip 空間の倍率 K（?clipk=N＝2^N・wgsl.ts wTrue と対・2026-11-05 Galaxy/Mali-G615「手前の建物が足元へ細長く伸びる」）：単位球の世界では近景の clip w が 1e-6 級と
// 極端に小さく、Mali の固定機能が w≈0 と扱った（WebGPU 実機で clipk=20 が根治）。renderer が u_mvp・u_clipT・u_clipMesh を K 倍して渡す＝斉次なので絵は不変（2 のべき＝ビット同値）。
// 深度の式だけ本当の w（K 分の 1）が要る＝ここで戻す（u_invClipK＝1/K・0＝倍率なし）
uniform float u_invClipK;
float wTrue(float w) { return u_invClipK > 0.0 ? w * u_invClipK : w; }
// 対数深度を頂点側で焼く（Outerra法のVS版）。FSで gl_FragDepth を書くと GPU の early-Z/階層Z棄却が無効になり
// 隠面フラグメントまで全額シェーディングされるため、クリップ座標 z に log2(1+w) を書き込み FS は深度に触れない。
// 三角形内は線形補間＝厳密な対数曲線と微差が出るが、terrain/建物/建物メッシュ とも三角形が小さく実害なし。
// window深度は 0.5*(z/w+1) = log2(1+w)*u_logCoef*0.5 ＝旧FS版と同一式（全パスで一貫＝深度の互換維持）。
// log2(1+w) を桁落ちなしに（w<0.1＝log1p の 7 次級数×1/ln2・FS の log1pS と同じ）：1.0+w を float32 で作ると w が 6e-8（≈0.4 m）刻みに量子化され、
// 目が数 m まで寄った 1 m 級の模型（Cesium Man）は表と裏が同じ深度＝裏の三角形が透けてテクスチャが散った（2026-10-28）
float log2p1(float w) { if (w < 0.1) return (w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715))))))) * 1.4426950; return log2(1.0 + w); }
void applyLogDepth() {
	gl_Position.z = (log2p1(max(wTrue(gl_Position.w), 1e-30)) * u_logCoef - 1.0) * gl_Position.w;
}

vec3 lonlatTo3D(vec2 ll) {
	float a = ll.x * D2R, b = ll.y * D2R, cb = cos(b);
	return vec3(cb * cos(a), sin(b), cb * sin(a));
}
// ── 原点相対 RTE（MVP相殺回避）─────────────────────────────────────────────
// 絶対点×MVP は高ズームで ≈1 同士の相殺→数px格子化（コード既知の z18+ 問題）。対策＝原点3D の clip 位置を
// CPU(double)で先に固定（u_clipT）し、シェーダは「頂点3D−原点3D」の小ベクトルだけを u_mvp で回して足す。
uniform vec4 u_clipT;      // mvp*[u_originPt,1]（CPU double）＝clip空間の原点（相殺回避の錨）
uniform vec3 u_originPt;   // lonlatTo3D(u_origin)（CPU double）＝標高項 h*dir と絶対復元の錨
uniform vec4 u_originTrig; // (cosLon,sinLon,cosLat,sinLat) of u_origin（CPU double）
// GPU の sin() は微小角で信用できない（GLSL 仕様で精度未規定・SwiftShader は |x|≲1e-7rad をゼロフラッシュ、
// 実GPUも実装依存誤差）。高ズームは Δ角×倍率~1e8px/rad で誤差がそのまま px の這い＝タイル/建物の揺らぎになる。
// 微小角は Taylor（x−x³/6+x⁵/120＝f32 で厳密同等）、大角（|x|>0.1rad）のみ native sin（gint 側 sinP と同一）。
float sinP(float x) {
	float x2 = x * x;
	return (abs(x) < 0.1) ? x * (1.0 - x2 * (1.0 / 6.0) * (1.0 - x2 * (1.0 / 20.0))) : sin(x);
}
float cosP(float x) { float s = sinP(0.5 * x); return 1.0 - 2.0 * s * s; }   // 全域可・微小角も桁落ちなし
// ── 楕円体（?ell=1・段階B 2026-08-11）──────────────────────────────────────
// 世界＝β（更成緯度）単位球 × S=diag(1,b/a,1)。S は CPU が mvp へ畳み込み済み＝シェーダの球面式は不変。
// 頂点が運ぶ dlat（測地緯度の差分）だけ dβ へ変換して deltaToRel に流す。β=φ−ν·sin2φ+(ν²/2)·sin4φ
//（全球で誤差≤2cm）の差分を積形式 sinA−sinB=2cos((A+B)/2)sin((A−B)/2) で＝桁落ちなし・テイラー半径の
// 制約なし（z0 の全球ビューも厳密収束）。球＝u_ellTrig=vec4(0) で補正が厳密に 0（GL の uniform 既定値も 0
// ＝renderer が未設定でも球のまま）。原点の測地緯度三角は CPU double（u_originTrig は β の三角を運ぶ）。
const float ELL_NU  = 0.0016792203863837047;    // ν = f/(2−f)（WGS84）
const float ELL_NU2 = 0.0000014098905530233192; // ν²/2
const float ELL_INV_R = 1.0033640898209764;     // a/b = 1/(1−f)（測地法線の β空間像の y 伸長）
uniform vec4  u_ellTrig;   // (cos2φ0, sin2φ0, cos4φ0, sin4φ0)（CPU double・シーン原点の測地緯度）。球=vec4(0)
uniform float u_ell;       // 1=楕円体（標高方向・β→φ復元のゲート）。球=0
float dBeta(float dp) {    // 測地緯度の差分 dφ(rad) → 更成緯度の差分 dβ(rad)
	if (u_ell < 0.5) return dp;   // 球＝恒等を早期return（uniform分岐＝コヒーレント）。補正の三角関数を毎頂点払わない
	float sd = sinP(dp), cd = cosP(dp), s2d = sinP(2.0 * dp), c2d = cosP(2.0 * dp);
	return dp - 2.0 * ELL_NU  * (u_ellTrig.x * cd  - u_ellTrig.y * sd)  * sd
	          + 2.0 * ELL_NU2 * (u_ellTrig.z * c2d - u_ellTrig.w * s2d) * s2d;
}
// 標高の変位方向：球＝β動径（従来の dir）・楕円体＝測地法線の β空間像 m=(cosφcosλ, sinφ·(a/b), cosφsinλ)
//（S を通すと単位測地法線＝地形/建物が正しく「上」へ立つ。方向のみ＝全角 f32 三角で十分・ll は絶対経緯度）。
vec3 liftDir(vec2 ll, vec3 dir) {
	if (u_ell < 0.5) return dir;
	float p = ll.y * D2R, l = ll.x * D2R, cp = cos(p);
	return vec3(cp * cos(l), sin(p) * ELL_INV_R, cp * sin(l));
}
// β→φ 復元（deg）：レイキャスト系（球上の点→asin=β）から elev() など測地緯度の台帳を引く時に通す。球=恒等。
float geoLat(float betaDeg) {
	float b = betaDeg * D2R;
	return betaDeg + u_ell * degrees(ELL_NU * sin(2.0 * b) + ELL_NU2 * sin(4.0 * b));
}
// 頂点3D−u_originPt を桁落ちなしで直接作る（cos(θ)-1=-2sin²(θ/2) で全項に小因子）。dDeg=原点相対(dlon,dlat)deg。
// dlat は測地緯度の差分＝dBeta で β の差分へ（球では恒等）＝以降は純粋な球面幾何。
vec3 deltaToRel(vec2 dDeg) {
	float da = dDeg.x * D2R, db = dBeta(dDeg.y * D2R);
	float sda = sinP(da), sdb = sinP(db);
	float sha = sinP(da * 0.5), shb = sinP(db * 0.5);
	float cdaM1 = -2.0 * sha * sha, cdbM1 = -2.0 * shb * shb;
	float cda = 1.0 + cdaM1, cdb = 1.0 + cdbM1;
	float ccM1 = cdaM1 + cdbM1 + cdaM1 * cdbM1;
	float cLon = u_originTrig.x, sLon = u_originTrig.y, cLat = u_originTrig.z, sLat = u_originTrig.w;
	float rx = cLat * cLon * ccM1 - cLat * sLon * cdb * sda - sLat * cLon * sdb * cda + sLat * sLon * sdb * sda;
	float ry = sLat * cdbM1 + cLat * sdb;
	float rz = cLat * sLon * ccM1 + cLat * cLon * cdb * sda - sLat * sLon * sdb * cda - sLat * cLon * sdb * sda;
	return vec3(rx, ry, rz);
}
// 標高テクスチャ（範囲内なら高さ(m)、外は0）＝ELEV チャンク（FILL_FS と共有）
${ii}
// clip.xy/clip.w → device px（左上原点, y下向き）
vec2 toScreen(vec4 c) {
	vec2 ndc = c.xy / c.w;
	return vec2((ndc.x * 0.5 + 0.5) * u_viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * u_viewport.y);
}
`,ni=`
uniform vec4 u_meshQ;    // 地形メッシュ窓（xy=原点 lon/lat・zw=span deg）
uniform float u_meshG;   // 格子の頂点数 G（0=量子化オフ＝真俯瞰など地形なし）
float elevQ(vec2 ll) {
	if (u_meshG < 1.5) return elev(ll);
	// 近景層（順 1a）の窓の内側は近景メッシュパス（同じ単位格子を窓へ縮めた物）が地面＝その格子で量子化（主パスはそこを discard 済み・2026-10-28）
	vec4 win = u_meshQ;
	if (u_hasNear > 0.5) { vec2 gn = (ll - u_nearBounds.xy) / u_nearBounds.zw; if (gn.x >= 0.0 && gn.x <= 1.0 && gn.y >= 0.0 && gn.y <= 1.0) win = u_nearBounds; }
	if (u_hasFine > 0.5) { vec2 gf = (ll - u_fineBounds.xy) / u_fineBounds.zw; if (gf.x >= 0.0 && gf.x <= 1.0 && gf.y >= 0.0 && gf.y <= 1.0) win = u_fineBounds; }   // 足元層の窓の内側は足元メッシュパスの格子
	vec2 g = (ll - win.xy) / win.zw;
	if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) return elev(ll);
	float N = u_meshG - 1.0;                        // セル数
	vec2 gc = min(g * N, vec2(N - 1e-4));
	vec2 gi = floor(gc);
	vec2 gf = gc - gi;
	vec2 st = win.zw / N;
	vec2 b0 = win.xy + gi * st;
	float h00 = elev(b0);
	float h10 = elev(b0 + vec2(st.x, 0.0));
	float h01 = elev(b0 + vec2(0.0, st.y));
	float h11 = elev(b0 + st);
	return (gf.x + gf.y < 1.0)                       // メッシュと同じ対角（a-c-b / b-c-d）で厳密一致
		? h00 + gf.x * (h10 - h00) + gf.y * (h01 - h00)
		: h11 + (1.0 - gf.x) * (h01 - h11) + (1.0 - gf.y) * (h10 - h11);
}`,$o=`#version 300 es
precision highp float;
in vec3 a_pos;      // dlon, dlat, hWorld（原点からの経緯度差分＋高さ・単位球スケール）
in float a_shade;   // 陰影（屋根1/壁0.76）
in vec2 a_anchor;   // 建物の基準点（原点からの経緯度差分）。一棟の全頂点で単一標高＝垂直プリズム
${bt}
${ni}
out float v_shade;
out float v_front;
out float v_fog;
out vec2  v_ll;      // シーン原点相対の lon/lat 差分(deg)＝メッシュマスク uv 用。⚠絶対経緯度を varying で運ばない：
                     // f32 の ulp は経度139°で~1.4m＝25mマスクセルの境界で画素ジッタ→深ズーム(z20)で櫛状の
                     // まだら discard（点描ゴースト・2026-08-02 中野実測）。大きい定数部は uniform 側で f64 前計算。
void main() {
	vec2 dLL = a_pos.xy;                       // 原点相対 (deg)。multidraw は mdize が u_tileOff を足す
	vec2 dAnchor = a_anchor;                   // 基準点の原点相対 (deg)
	vec2 ll = u_origin + dLL;
	v_ll = dLL;
	vec3 rel = deltaToRel(dLL);               // 頂点3D − 原点3D（小・正確）
	vec3 dir = u_originPt + rel;              // 絶対単位球点（front/fog 用＝粗くて可）
	float base = elevQ(u_origin + dAnchor) * u_elevScale;     // 基準点の標高で足元を揃える（屋根水平・壁垂直）。案A＝描画メッシュ面
	float h = base + a_pos.z;                  // 地形標高 + 建物高さ
	vec3 relW = rel + h * liftDir(ll, dir);    // (dir*(1+h)) − 原点3D を相殺なしで（地形の上に建物を積む。楕円体＝測地法線）
	v_shade = a_shade;
	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;
	v_fog = fogOf(u_originPt + relW);
	gl_Position = u_clipT + u_mvp * vec4(relW, 0.0);
	gl_PointSize = 7.0;   // GL_POINTS 描画時のみ有効（線/面描画では無視）＝draped の点データ用
	applyLogDepth();
}`,qo=`#version 300 es
precision highp float;
uniform vec3 u_bldColor;
uniform vec3 u_fogColor;
uniform int u_meshCount;         // 0..4：アクティブなメッシュ地区数
uniform vec4 u_meshBbox0;        // [minLon,minLat,maxLon,maxLat] deg。マスクの UV 正規化に使う
uniform vec4 u_meshBbox1;
uniform vec4 u_meshBbox2;
uniform vec4 u_meshBbox3;
uniform sampler2D u_meshMask0;   // メッシュの実フットプリントの被覆マスク（立ってるセル＝LOD2 が担う）
uniform sampler2D u_meshMask1;
uniform sampler2D u_meshMask2;
uniform sampler2D u_meshMask3;
in float v_shade;
in float v_front;
in float v_fog;
in vec2  v_ll;
out vec4 fragColor;
bool maskedBy(vec4 offInv, sampler2D mask, vec2 rel) {
	// uv = (origin−bboxMin)/span + rel/span。offInv.xy=(origin−bboxMin)/span（CPUでf64計算）・zw=1/span。
	// rel はシーン原点相対の小値＝f32 で精密。旧・絶対経緯度 (ll−bboxMin)/span は f32 ジッタでセル境界がまだらになった。
	vec2 uv = offInv.xy + rel * offInv.zw;
	return uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0 && texture(mask, uv).r > 0.5;
}
void main() {
	if (v_front < 0.0) discard;
	// 実フットプリントが立つセルだけ基図建物を伏せる（矩形でなく被覆マスク＝空白地帯なし）
	if ((u_meshCount > 0 && maskedBy(u_meshBbox0, u_meshMask0, v_ll)) ||
	    (u_meshCount > 1 && maskedBy(u_meshBbox1, u_meshMask1, v_ll)) ||
	    (u_meshCount > 2 && maskedBy(u_meshBbox2, u_meshMask2, v_ll)) ||
	    (u_meshCount > 3 && maskedBy(u_meshBbox3, u_meshMask3, v_ll))) discard;
	// 深度は VS の applyLogDepth() が焼き済み（gl_FragDepth を書くと early-Z が無効になるためFSでは触れない）
	vec3 c = mix(u_bldColor * v_shade, u_fogColor, v_fog);
	fragColor = vec4(c, 1.0);
}`,rc=`if (a_ol < -0.004) {
		float lb = floor(-a_ol * 127.0 + 0.5), hp = floor(lb * 0.5) * 0.125 * max(u_lineDpr, 1.0);
		vec4 dc = u_mvp * vec4(v_n, 0.0);
		vec2 sd = (dc.xy * gl_Position.w - gl_Position.xy * dc.w) * u_viewport;
		if (dot(sd, sd) < 1e-30) sd = vec2(1.0, 0.0);
		gl_Position.xy += normalize(vec2(-sd.y, sd.x)) * (mod(lb, 2.0) * 2.0 - 1.0) * hp * 2.0 / u_viewport * gl_Position.w;
		gl_Position *= 0.999;   // 0.1% nearer the eye (same place on screen): a line lying on a surface (3D Tiles edges, SURFACES_AND_EDGES) wins the depth test
		v_ol = vec3(0.0);
		v_n = v_toEye;   // a ribbon faces the eye (the FS's back-face test and light read v_n; lines are unlit in Cesium)
	}`,Zo=`#version 300 es
precision highp float;
in vec3 a_pos;      // 重心(u_meshOrigin)相対の delta（RTE-lite：小さい値＝float32 仮数がフルに効く＝建物ディテールを高精度に）
in vec3 a_normal;   // glTF 実法線を ortho へ変換済
uniform vec3 u_meshOrigin;   // メッシュ重心＝単位球の錨。絶対位置 = u_meshOrigin + a_pos
uniform vec4 u_clipMesh;     // mvp*[u_meshOrigin,1]（CPU double）＝MVP相殺回避の錨（旧: シェーダ内 float32 で算出＝錨が相殺）
uniform vec4 u_liftBounds;   // DTM(裸地=DEM10B)保証域 [lng0,lat0,spanLng,spanLat]。外＝接地リフトしない（DSM=ビル天端でリフトすると屋根が斜面に裂ける）
uniform float u_xfOn;        // バッチの剛体変換（glTF の rigid アニメ・W4）：1＝a_pos を u_xfL·a_pos + u_xfT（原点相対）に写し法線も回す。0＝素通し（ビット同一）
uniform mat3 u_xfL;
uniform vec3 u_xfT;
uniform vec3 u_eyeRel;       // u_eye − u_meshOrigin（CPU double）＝視線ベクトルを原点相対で組む（下の v_toEye）
in float a_ol;      // CESIUM_primitive_outline: the normal's 4th byte = 3 bits, which outline coordinates are 1 at this vertex (unset = 0 = none); negative = a glTF line's ribbon (below)
out vec3 v_ol;
uniform float u_lineDpr;   // device px per CSS px (the ribbons' widths are CSS px)
${bt}
// Cesium の霧（csatmo.ts csFogV・頂点で色と量）：u_csFogD＝濃さ（0＝なし）・u_csFogL＝xyz 光へ向く単位ベクトル・w 照明あり 1／なし −1
uniform float u_csFogD;
uniform vec4 u_csFogL;
${rn}
out vec4 v_csFog;
out vec3  v_n;      // 実法線
out vec3  v_toEye;  // 視線ベクトル（巻き順に依存せず法線を表向きへ）
out float v_front;  // >0 で手前半球
out float v_fog;
void main() {
	vec3 ap = u_xfOn > 0.5 ? u_xfL * a_pos + u_xfT : a_pos;      // バッチの剛体変換（W4）＝原点相対のまま
	vec3 wp = u_meshOrigin + ap;                                 // 絶対位置（陰影・フォグ・半球判定用＝粗くて可）
	vec3 dir = normalize(wp);
	v_n = a_normal;
	if (u_xfOn > 0.5) v_n = u_xfL * a_normal;
	float olK = floor(a_ol * 127.0 + 0.5);
	v_ol = vec3(mod(olK, 2.0), mod(floor(olK / 2.0), 2.0), floor(olK / 4.0));
	v_toEye = u_eyeRel - ap;                                     // ＝u_eye − wp を原点相対で：u_eye − wp（≈1 同士の差）は float32 で 0.4 m 級の誤差＝目が数 m まで寄った 1 m 級の模型（Cesium Man）で FS の面法線（dFdx）と裏面判定が乱れ裏側の三角形が透けた（2026-10-28）
	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;
	v_fog = fogOf(wp);
	v_csFog = csFogV(u_eye * CS_R, wp * CS_R, u_csFogD, u_csFogL.xyz, u_csFogL.w);
	// 接地リフト（DTM 化で解禁・746b48a の続き）：メッシュは単位球接地(r=1)で焼き込み済み＝頂点位置の
	// 地表標高（DTM）を elev() でサンプルし法線方向へ持ち上げる。旧・リフト禁止の根拠は ALOS DSM の
	// 不連続（ビル天端の縁で数十〜100m級→同一建物内の頂点が別量動き屋根が裂ける・実機確認）だったが、
	// 現 z≥12 の標高源 R01=DEM10B（裸地・滑らか）では不発。地形の深度書き全ズーム化に伴い、リフト無しでは
	// 持ち上がった地面が建物を深度で飲む（札幌 z16.9 で実測）。建物内の微小な地勾配は頂点へそのまま乗る
	//（斜面の建物は基礎が地形に沿う近似）。⚠橋梁(two=両面)は径間中央が谷の DTM に沿って数m沈み得る＝既知の割り切り。
	// RTE：原点の clip 位置は CPU(double) 錨 u_clipMesh（旧 u_mvp*vec4(u_meshOrigin,1) はシェーダ float32＝
	// ≈1 同士の相殺で錨自体が高ズームに揺らいだ）。delta は小さく float32 精度フルのまま u_mvp で回す。
	// リフト項 h*dir も delta 側に足す＝RTE を壊さない（gint projectDrape と同形）。
	float lat = geoLat(degrees(asin(clamp(dir.y, -1.0, 1.0))));   // β球点→β→測地緯度（elev/リフト域は測地の台帳。球=恒等）
	float lon = degrees(atan(dir.z, dir.x));
	// DTM保証域(u_liftBounds)の中でだけリフト：混成窓の遠方セル等＝ALOS DSM（ビル天端込み）でリフトすると
	// 屋上が斜面に裂ける（東新橋/汐留 高チルトで実測＝旧「形状崩壊」の再現）。境界は 0.05° の smoothstep で
	// 畳む＝境界を跨ぐ建物（≦0.002°）を引き裂かない。域外・bounds無し(全0)は h=0＝従来の r=1 接地。
	float inX = smoothstep(0.0, 0.05, min(lon - u_liftBounds.x, u_liftBounds.x + u_liftBounds.z - lon));
	float inY = smoothstep(0.0, 0.05, min(lat - u_liftBounds.y, u_liftBounds.y + u_liftBounds.w - lat));
	float h = elev(vec2(lon, lat)) * u_elevScale * inX * inY;
	gl_Position = u_clipMesh + u_mvp * vec4(ap + h * liftDir(vec2(lon, lat), dir), 0.0);   // 楕円体＝測地法線で接地リフト
	${rc}
	applyLogDepth();
}`,Jo=`#version 300 es
precision highp float;
uniform vec3 u_bldColor;
uniform vec3 u_fogColor;
in vec4 v_csFog;   // Cesium の霧（頂点で計算）
uniform float u_cullBack;   // 1=裏面discard（建物＝閉じた体積）、0=両面（橋梁＝ケーブル/柵の開いた薄面。dedupで片面化済みのため）
uniform vec3  u_eye;        // カメラ位置（接地の局所系＝画素の動径を出す・light 用）
uniform float u_lightOn;    // style の light（MapLibre・B3 2026-10-12）：1＝u_lightDir（東・北・上の単位ベクトル）・u_lightI（強さ）・u_lightColor で陰影。0＝従来の固定光（ビット同一）
uniform vec3  u_lightDir;
uniform float u_lightI;
uniform vec3  u_lightColor;
uniform int   u_lightN;       // 局所の光源（第 3 波 W2・2026-10-12）＝point/spot/ambient/hemisphere・上限 8。並びは light.js localLightsPayload（A＝位置+kind・B＝色+強さ・C＝向き／地面色+range・D＝cos 内外+decay）
uniform vec4  u_lA[8];
uniform vec4  u_lB[8];
uniform vec4  u_lC[8];
uniform vec4  u_lD[8];
uniform float u_csOn;        // Cesium の模型の照明（@ortho-earth/cesium の setMeshLighting・2026-10-26）：1＝下の固定光・style の light の代わりに csLit（CesiumJS の式）で描く
uniform vec3  u_csDir;       // 光へ向く単位ベクトル（世界系）
uniform vec3  u_csColor;     // 光の色×強さ（HDR・SunLight は 2）
uniform vec3  u_csSH[9];     // 環境光の SH9（Cesium の並び＝L00,L1-1,L10,L11,L2-2,L2-1,L20,L21,L22・立方体図の系＝x 東・y 上・z 南）
uniform vec3  u_csIbl;       // (拡散の係数, 鏡面の係数, 一様な環境で L00 が 1 になる倍率＝鏡面の環境光を放射輝度に戻す)
uniform samplerCube u_csEnvMap;   // the model's specular environment (ImageBasedLighting.specularEnvironmentMaps: a prefiltered KTX2 cube, mip = roughness)
uniform vec2  u_csEnv;       // (1 = u_csEnvMap is set, its largest mip level)
uniform vec2  u_csMR;        // バッチの材質（metallic, roughness）＝glTF の係数（GL は材質テクスチャを持たない）
uniform vec2  u_csCC;        // KHR_materials_clearcoat (factor, roughness); factor 0 = none
uniform vec4  u_olC;         // CESIUM_primitive_outline: the outline colour and its alpha (0 = none)
in vec3  v_ol;
vec3 olW;   // fwidth(v_ol), taken at the top of main
// Cesium's PrimitiveOutlineStageFS: diffuse = mix(diffuse, colour, alpha * outlineness), outlineness = the brightest of the 3 coordinates looked up in a
// mip-mapped strip whose last texel is 192/255 (an outline 0.75 px wide, halved per level once the strip is under 16 texels). w = fwidth(v_ol)
vec3 olMix(vec3 b, vec3 w) {
	if (u_olC.a <= 0.0) return b;
	vec3 t = max(w, vec3(1.0 / 4096.0));
	vec3 o = 0.753 * clamp((v_ol - 1.0) / t + 1.5, 0.0, 1.0) * min(vec3(1.0), 1.0 / (16.0 * t));
	return mix(b, u_olC.rgb, u_olC.a * max(o.x, max(o.y, o.z)));
}
in vec3  v_n;
in vec3  v_toEye;
in float v_front;
in float v_fog;
out vec4 fragColor;
// 局所の光の寄与＝陰影の係数 d に足す（色×(d＋Σ光)）。pos＝画素の世界座標（単位球）・up＝その動径。ambient は向きに依らず・hemisphere は上向き具合で空色と地面色・point/spot は (1−dist/range)^decay と cos の smoothstep
vec3 localLights(vec3 n, vec3 pos, vec3 up) {
	vec3 acc = vec3(0.0);
	for (int i = 0; i < 8; i++) {
		if (i >= u_lightN) break;
		vec4 A = u_lA[i], B = u_lB[i], C = u_lC[i], D = u_lD[i];
		int kind = int(A.w + 0.5);
		if (kind == 3) acc += B.rgb * B.w;
		else if (kind == 4) acc += mix(C.rgb, B.rgb, dot(n, up) * 0.5 + 0.5) * B.w;
		else {
			vec3 dv = A.xyz - pos; float dist = length(dv); vec3 L = dv / max(dist, 1e-9);
			float at = C.w > 0.0 ? pow(clamp(1.0 - dist / C.w, 0.0, 1.0), D.z) : 1.0;
			if (kind == 2) at *= smoothstep(D.x, D.y, dot(-L, C.xyz));
			acc += B.rgb * B.w * at * max(dot(n, L), 0.0);
		}
	}
	return acc;
}
// Cesium の模型の照明（@ortho-earth/cesium・2026-10-26）＝CesiumJS の LightingStageFS をそのまま：czm_pbrLighting（Lambert／π＋GGX＝直接光×色×強さ・NdotL は 0.001 で止める）
// ＋環境光（ImageBasedLightingStageFS＝SH9 の拡散＋反射の向きの SH9 の鏡面・brdf LUT は Karis の近似）→ czm_pbrNeutralTonemapping → czm_linearToSrgb（pow 1/2.2）。
// 法線・視線は世界系、環境光の SH は Cesium の立方体図の系（x 東・y 上・z 南）＝接地の局所系（東・北・上）から写す。gpu/wgsl.ts csLit と同式。
vec3 csSH(vec3 n) {
	vec3 L = u_csSH[0] + u_csSH[1] * n.y + u_csSH[2] * n.z + u_csSH[3] * n.x + u_csSH[4] * (n.y * n.x) + u_csSH[5] * (n.y * n.z)
		+ u_csSH[6] * (3.0 * n.z * n.z - 1.0) + u_csSH[7] * (n.z * n.x) + u_csSH[8] * (n.x * n.x - n.y * n.y);
	return max(L, vec3(0.0));
}
vec3 csTonemap(vec3 color) {   // czm_pbrNeutralTonemapping（Khronos PBR Neutral・startCompression 0.76・desaturation 0.15）
	float x = min(color.r, min(color.g, color.b));
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max(color.r, max(color.g, color.b));
	if (peak < 0.76) return color;
	float dd = 0.24, newPeak = 1.0 - dd * dd / (peak + dd - 0.76);
	color *= newPeak / peak;
	float g = 1.0 - 1.0 / (0.15 * (peak - newPeak) + 1.0);
	return mix(color, vec3(newPeak), g);
}
vec3 csSrgbToLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }   // czm_srgbToLinear
uniform vec3  u_csFwd;       // csPhong: the camera's forward and up (world, unit)
uniform vec3  u_csUpV;
// Cesium's czm_phong (the entity geometry / Primitive appearances, u_csOn 3): no sun in the diffuse = two lights at the eye, one along the view
// (eye z) and one from the camera's up (eye y, 3D); ambient 0.5·diffuse; the material's specular is 0. Colour in = colour out (no sRGB step)
float csPhong(vec3 n) { return 0.5 + 0.5 * (max(dot(n, -u_csFwd), 0.0) + max(dot(n, u_csUpV), 0.0)); }
vec3 csLit(vec3 base, vec3 n) {   // base＝リニアの基本色・n＝表向きの単位法線。戻り＝表示空間（sRGB）
	vec3 v = normalize(v_toEye), l = normalize(u_csDir), h = normalize(v + l);
	vec3 up = normalize(u_eye - v_toEye); vec3 e0 = cross(vec3(0.0, 1.0, 0.0), up);
	vec3 east = dot(e0, e0) < 1e-12 ? vec3(1.0, 0.0, 0.0) : normalize(e0); vec3 north = cross(up, east);
	float metallic = u_csMR.x, roughness = u_csMR.y;
	vec3 diffuse = base * (1.0 - metallic), f0 = mix(vec3(0.04), base, metallic);
	diffuse = olMix(diffuse, olW);   // CESIUM_primitive_outline
	float VdotH = clamp(dot(v, h), 0.0, 1.0), NdotL = clamp(dot(n, l), 0.001, 1.0), NdotV = clamp(dot(n, v), 0.0, 1.0), NdotH = clamp(dot(n, h), 0.0, 1.0);
	vec3 f90 = vec3(clamp(max(f0.r, max(f0.g, f0.b)) * 25.0, 0.0, 1.0));
	float vs = 1.0 - VdotH; vec3 F = f0 + (f90 - f0) * vs * vs * vs * vs * vs;
	float a = roughness * roughness, a2 = a * a;
	float GGX = NdotL * sqrt(NdotV * NdotV * (1.0 - a2) + a2) + NdotV * sqrt(NdotL * NdotL * (1.0 - a2) + a2);
	float G = GGX > 0.0 ? 0.5 / GGX : 0.0;
	float f = (NdotH * a2 - NdotH) * NdotH + 1.0;
	float D = a2 / (3.14159265 * f * f);
	vec3 color = ((1.0 - F) * diffuse / 3.14159265 + F * G * D) * NdotL * u_csColor;
	// 環境光：拡散＝SH9（Cesium の係数＝散乱の強さ込み）・鏡面＝反射の向きの SH9 を放射輝度に戻した物（立方体図の mip の代わり）
	// the cube-map frame (x east, y up, z south); the world axes are mirrored (y the pole, z at 90E), so cross(pole, up) above points west
	vec3 nC = vec3(-dot(n, east), dot(n, up), -dot(n, north)), r = reflect(-v, n), rC = vec3(-dot(r, east), dot(r, up), -dot(r, north));
	vec4 rr = roughness * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
	float a004 = min(rr.x * rr.x, exp2(-9.28 * NdotV)) * rr.x + rr.y;
	vec2 AB = vec2(-1.04, 1.04) * a004 + rr.zw;
	vec3 f90i = max(vec3(1.0 - roughness), f0); float vn = 1.0 - NdotV; vec3 Fn = f0 + (f90i - f0) * vn * vn * vn * vn * vn;
	vec3 FssEss = Fn * AB.x + AB.y;
	vec3 avgF = f0 + (1.0 - f0) / 21.0; float Ems = 1.0 - AB.x - AB.y;
	vec3 FmsEms = FssEss * avgF * Ems / (1.0 - avgF * Ems);
	color += csSH(nC) * (FmsEms + (1.0 - FssEss - FmsEms) * diffuse) * u_csIbl.x + (u_csEnv.x > 0.5 ? textureLod(u_csEnvMap, rC, roughness * u_csEnv.y).rgb : csSH(rC) * u_csIbl.z) * FssEss * u_csIbl.y;
	if (u_csCC.x > 0.0) {   // KHR_materials_clearcoat (Cesium's clearcoat layer): GGX with f0 0.04 on the geometric normal, its Fresnel taking from the base under it
		float cr = clamp(u_csCC.y, 0.0, 1.0), ca = cr * cr, ca2 = ca * ca, cvs = 1.0 - VdotH, cF = 0.04 + 0.96 * cvs * cvs * cvs * cvs * cvs;
		float cGGX = NdotL * sqrt(NdotV * NdotV * (1.0 - ca2) + ca2) + NdotV * sqrt(NdotL * NdotL * (1.0 - ca2) + ca2), cG = cGGX > 0.0 ? 0.5 / cGGX : 0.0;
		float cf = (NdotH * ca2 - NdotH) * NdotH + 1.0, cD = ca2 / (3.14159265 * cf * cf);
		vec4 crr = cr * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
		float ca004 = min(crr.x * crr.x, exp2(-9.28 * NdotV)) * crr.x + crr.y; vec2 cAB = vec2(-1.04, 1.04) * ca004 + crr.zw;
		float cvn = 1.0 - NdotV, cFv = 0.04 + 0.96 * cvn * cvn * cvn * cvn * cvn;
		vec3 cEnv = u_csEnv.x > 0.5 ? textureLod(u_csEnvMap, rC, cr * u_csEnv.y).rgb : csSH(rC) * u_csIbl.z;
		color = color * (1.0 - u_csCC.x * cFv) + u_csCC.x * (cF * cG * cD * NdotL * u_csColor + cEnv * (0.04 * cAB.x + cAB.y) * u_csIbl.y);
	}
	return pow(max(csTonemap(color), 0.0), vec3(1.0 / 2.2));
}
uniform vec2 u_split;   // Cesium splitDirection: x = 0 off, else sign = side kept (-1 left, +1 right) and |x| - 1 = the split as a fraction of the width; y = the width (device px)
void main() {
	// 面の幾何法線＝スクリーン微分（discard より前＝隣接ヘルパー画素が生きているうちに取る）。
	// v_toEye = eye − pos で eye は定数＝微分は −dPos、cross で符号が相殺し位置微分の面法線と等価＝varying追加不要。
	vec3 gn = cross(dFdx(v_toEye), dFdy(v_toEye));
	olW = fwidth(v_ol);   // the outline's pixel footprint (before any discard)
	if (v_front < 0.0) discard;                                   // 裏半球
	if (u_split.x != 0.0 && sign(u_split.x) * (gl_FragCoord.x - (abs(u_split.x) - 1.0) * u_split.y) < 0.0) discard;   // the other side of the split
	vec3 n = normalize(v_n);                                      // glTF 実法線（陰影用＝従来のまま）
	// 裏面カリングは幾何法線で判定＝面内で一定値＝画素毎の揺れが構造的に消える。旧・補間int8法線の
	// dot閾値(-0.02)は「すれすれ帯≈1px」前提が深ズーム(z20)で数十pxに化け、閾値をまたぐ画素だけ
	// discard される「点描ゴースト」になった（2026-08-02 実測・中野z20）。向き（表裏）は属性法線で
	// 採決＝巻き順非依存・面単位で一定。退化面（微分ゼロ）だけ旧判定へフォールバック。
	float g2 = dot(gn, gn);
	float fe = g2 > 1e-18 ? dot(normalize(gn * sign(dot(gn, n))), normalize(v_toEye)) : dot(n, normalize(v_toEye));
	if (u_cullBack > 1.5) fe = gl_FrontFacing ? max(abs(fe), 1e-3) : -1.0;   // 2＝Cesium の表裏（glTF・doubleSided でない材質）：巻き順で裏を捨て、法線は書かれたまま（反転しない）。glTF の表（反時計回り）＝gl_FrontFacing（世界軸の鏡像は投影の行列が戻す・砂場で確認）
	if (u_cullBack > 0.5 && fe < -0.02) discard;
	if (fe < 0.0) n = -n;                                         // 両面時は法線を視線側へ＝裏から見ても陰影が成立
	vec3 L = normalize(vec3(-0.35, 0.85, 0.30));                  // 斜め上の光＝屋根が立つ
	vec3 d = vec3(clamp(dot(n, L) * 0.28 + 0.76, 0.72, 1.0));    // 基図建物の屋根1.0/壁0.76に合わせる（up向き屋根→~1.0、垂直壁→~0.76）
	if (u_lightOn > 0.5) {   // style の light＝接地の局所系（上＝画素の動径・東・北）で向きを写し、MapLibre の式 mix(1−強さ, 1, max(dot, 0))×色
		vec3 up = normalize(u_eye - v_toEye); vec3 e0 = cross(vec3(0.0, 1.0, 0.0), up);
		vec3 east = dot(e0, e0) < 1e-12 ? vec3(1.0, 0.0, 0.0) : normalize(e0); vec3 north = cross(up, east);
		vec3 Ls = normalize(east * u_lightDir.x + north * u_lightDir.y + up * u_lightDir.z);
		d = u_lightColor * mix(1.0 - u_lightI, 1.0, clamp(dot(n, Ls), 0.0, 1.0));
	}
	if (u_lightN > 0) { vec3 pw = u_eye - v_toEye; d += localLights(n, pw, normalize(pw)); }   // 局所の光源（W2）
	vec3 base = u_bldColor * d;
	if (u_csOn > 1.5) base = u_bldColor; else if (u_csOn > 0.5) base = csLit(csSrgbToLinear(u_bldColor), n);   // Cesium の照明（@ortho-earth/cesium）・2＝unlit＝素の色
	if (u_csOn > 2.5) base = min(u_bldColor * csPhong(u_csOn > 3.5 && fe < 0.0 ? -n : n), vec3(1.0));   // 3＝czm_phong（entity geometry）
	vec3 c = mix(base, u_fogColor, v_fog);
	c = mix(c, v_csFog.rgb, v_csFog.a);   // Cesium の霧（影の後）
	fragColor = vec4(c, 1.0);
}`,Ft=(t,n,e)=>n.reduce((a,[s,v])=>{if(a.split(s).length!==2)throw new Error(`glsl derive(${e}): anchor missing/ambiguous: ${s.slice(0,50)}`);return a.replace(s,v)},t),ho=Ft(Zo,[[`in vec3 a_normal;   // glTF 実法線を ortho へ変換済
`,`in vec3 a_normal;   // glTF 実法線を ortho へ変換済
in vec2 a_uv;
in vec4 a_col;
out vec2 v_uv;
out vec4 v_col;
`],[`	v_n = a_normal;
`,`	v_n = a_normal;
	v_uv = a_uv; v_col = a_col;
`]],"MESH_TEX_VS"),Zr=Ft(Jo,[["uniform float u_cullBack;",`uniform float u_cullBack;
uniform sampler2D u_tex;
uniform float u_alphaCut;
uniform float u_blend;
uniform vec4 u_tint;
uniform float u_tintB;
uniform sampler2D u_paint;
uniform float u_paintB;
uniform sampler2D u_drape;
uniform vec4 u_drU;
uniform vec4 u_drV;
uniform float u_drOn;
uniform vec3 u_eyeRel;
in vec2 v_uv;
in vec4 v_col;
vec3 tintC(vec3 c) { if (u_tintB < -0.5) return c; c = mix(c, u_tint.rgb, u_tintB); return c * mix(u_tint.rgb, vec3(1.0), ceil(u_tintB)); }
// the style colour of the feature under this texel (feature ID texture, nearest texel; alpha 0 = no colour), blended like tintC (Cesium colorBlendMode)
vec4 paintT(vec4 c) { if (u_paintB < -0.5) return c; ivec2 sz = textureSize(u_paint, 0); vec4 p = texelFetch(u_paint, clamp(ivec2(floor(v_uv * vec2(sz))), ivec2(0), sz - 1), 0); if (p.a < 0.5) return c; return vec4(mix(c.rgb, p.rgb, u_paintB) * mix(p.rgb, vec3(1.0), ceil(u_paintB)), c.a); }
// imagery draped on the mesh (set "meshDrape": Cesium3DTileset.imageryLayers): uv = the window's plane map of the point (origin-relative), over the base colour by its alpha. Lod 0 = no derivatives (after the clip discards too)
vec4 drapeT(vec4 c, vec3 p) { if (u_drOn < 0.5) return c; vec2 uv = vec2(dot(u_drU.xyz, p) + u_drU.w, dot(u_drV.xyz, p) + u_drV.w); if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return c; vec4 d = textureLod(u_drape, uv, 0.0); return vec4(mix(c.rgb, d.rgb, d.a), c.a); }`],[`	vec3 gn = cross(dFdx(v_toEye), dFdy(v_toEye));
`,`	vec3 gn = cross(dFdx(v_toEye), dFdy(v_toEye));
	vec4 txr = paintT(texture(u_tex, v_uv)); vec4 tx = txr * v_col;
	txr = drapeT(txr, u_eyeRel - v_toEye); tx = txr * v_col;
`],[`	vec3 base = u_bldColor * d;
	if (u_csOn > 1.5) base = u_bldColor; else if (u_csOn > 0.5) base = csLit(csSrgbToLinear(u_bldColor), n);   // Cesium の照明（@ortho-earth/cesium）・2＝unlit＝素の色
	if (u_csOn > 2.5) base = min(u_bldColor * csPhong(u_csOn > 3.5 && fe < 0.0 ? -n : n), vec3(1.0));   // 3＝czm_phong（entity geometry）
	vec3 c = mix(base, u_fogColor, v_fog);
	c = mix(c, v_csFog.rgb, v_csFog.a);   // Cesium の霧（影の後）
	fragColor = vec4(c, 1.0);
}`,`	if (tx.a < u_alphaCut) discard;
	float ta = u_tintB < -0.5 ? 1.0 : u_tint.a;
	float a = (u_blend > 1.5 ? 1.0 : u_blend > 0.5 ? tx.a : 1.0) * (u_blend > 0.5 ? ta : 1.0);
	vec3 base = tintC(tx.rgb) * d;
	if (u_csOn > 1.5) base = tintC(tx.rgb); else if (u_csOn > 0.5) base = csLit(tintC(csSrgbToLinear(txr.rgb) * v_col.rgb), n);   // Cesium の照明＝テクスチャは sRGB・頂点色（baseColorFactor×COLOR_0）はリニア
	if (u_csOn > 2.5) base = min(tintC(tx.rgb) * csPhong(u_csOn > 3.5 && fe < 0.0 ? -n : n), vec3(1.0));
	vec3 c = mix(base, u_fogColor, v_fog);
	c = mix(c, v_csFog.rgb, v_csFog.a);   // Cesium の霧（影の後）
	fragColor = vec4(c * a, a);
}`]],"MESH_TEX_FS"),ic=Ft(ho,[["uniform vec3 u_eyeRel;",`uniform vec3 u_eyeRel;
uniform float u_silPx;`],[`	applyLogDepth();
}`,`	applyLogDepth();
	vec2 cn = (u_mvp * vec4(v_n, 0.0)).xy;
	if (dot(cn, cn) > 1e-30) gl_Position.xy += normalize(cn) * u_silPx * 2.0 / u_viewport * gl_Position.w;
}`]],"MESH_SIL_VS"),nc=`#version 300 es
precision highp float;
uniform vec4 u_silColor;
in float v_front;
out vec4 fragColor;
void main() {
	if (v_front < 0.0) discard;
	fragColor = vec4(u_silColor.rgb * u_silColor.a, u_silColor.a);
}`,ac=t=>{const n=t.indexOf("vec3 csLit(vec3 base, vec3 n) {"),e=t.indexOf(`
}
`,n);return Ft(t.slice(n,e+3),[["vec3 csLit(vec3 base, vec3 n) {","vec3 csLitM(czm_modelMaterial m, vec3 n) {"],[`	float metallic = u_csMR.x, roughness = u_csMR.y;
	vec3 diffuse = base * (1.0 - metallic), f0 = mix(vec3(0.04), base, metallic);
`,`	float roughness = m.roughness;
	vec3 diffuse = m.diffuse, f0 = m.specular;
`],["	return pow(max(csTonemap(color)",`	color += m.emissive;
	return pow(max(csTonemap(color)`]],"csLitM")};function lc(t){const n=t.vs?la(t.vs,t):"",e=t.fs?la(t.fs,t):"",a=Ft(ho,[[`in vec2 a_uv;
in vec4 a_col;
out vec2 v_uv;
out vec4 v_col;
`,`in vec2 a_uv;
in vec4 a_col;
out vec2 v_uv;
out vec4 v_col;
in vec4 a_mc;
out vec4 v_mc;
in vec2 a_uvm;
out vec2 v_uvm;
uniform mat3 u_csJ;
uniform mat3 u_csV;
`],[`void main() {
	vec3 ap = u_xfOn > 0.5 ? u_xfL * a_pos + u_xfT : a_pos;      // バッチの剛体変換（W4）＝原点相対のまま
`,ua(t,"vs")+n+`
void main() {
	vec3 ap = u_xfOn > 0.5 ? u_xfL * a_pos + u_xfT : a_pos;      // バッチの剛体変換（W4）＝原点相対のまま
	v_mc = a_mc; v_uvm = a_uvm;
`+(t.vs?`	{
		VertexInput csVi; csVi.attributes = csAttrsOf(a_mc.xyz, u_meshOrigin + ap, u_csV * (ap - u_eyeRel) * 6378137.0, (u_xfOn > 0.5 ? u_xfL * a_normal : a_normal), a_uv, a_col, a_mc.w, u_csJ, u_csV);
		csVi.featureIds.featureId_0 = int(a_mc.w + 0.5); csVi.featureIds.featureId_1 = 0; csVi.metadata = csMetaOf(a_uvm);
		czm_modelVertexOutput csVo; csVo.positionMC = a_mc.xyz; csVo.pointSize = 1.0;
		vertexMain(csVi, csVo);
		ap += u_csJ * (csVo.positionMC - a_mc.xyz);
		v_mc.xyz = csVo.positionMC;
	}
`:"")]],"MESH_CS_VS"),s=Ft(Zr,[["uniform float u_cullBack;",`uniform float u_cullBack;
in vec4 v_mc;
in vec2 v_uvm;
uniform mat3 u_csJ;
uniform mat3 u_csV;
uniform vec2 u_csMode;   // x＝UNLIT・y＝材質の α で半透明（TRANSLUCENT）`],[`void main() {
`,ua(t,"fs")+e+`
`+ac(Jo)+`void main() {
`],["	if (u_csOn > 1.5) base = tintC(tx.rgb); else if (u_csOn > 0.5) base = csLit(",`	vec3 csB = tintC(csSrgbToLinear(txr.rgb) * v_col.rgb);
	bool csUnlit = u_csMode.x > 0.5 || (u_csOn > 1.5 && u_csMode.x > -0.5);
	float csMet = csUnlit ? 0.0 : u_csMR.x;
	czm_modelMaterial csM; csM.baseColor = vec4(csB, tx.a); csM.diffuse = csB * (1.0 - csMet); csM.alpha = tx.a; csM.specular = mix(vec3(0.04), csB, csMet); csM.roughness = u_csMR.y;
	csM.normalEC = normalize(u_csV * n); csM.occlusion = 1.0; csM.emissive = vec3(0.0);
`+(t.fs?`	FragmentInput csFi; csFi.attributes = csAttrsOf(v_mc.xyz, u_eye - v_toEye, u_csV * (-v_toEye) * 6378137.0, n, v_uv, v_col, v_mc.w, u_csJ, u_csV);
	csFi.featureIds.featureId_0 = int(v_mc.w + 0.5); csFi.featureIds.featureId_1 = 0; csFi.metadata = csMetaOf(v_uvm);
	fragmentMain(csFi, csM);
`:"")+`	vec3 csN = normalize(transpose(u_csV) * csM.normalEC);
	base = csUnlit ? pow(max(csM.diffuse, 0.0), vec3(1.0 / 2.2)) : u_csOn > 0.5 ? csLitM(csM, csN) : pow(max(csM.diffuse, 0.0), vec3(1.0 / 2.2)) * d;   // UNLIT＝Cesium の lightingStage（diffuse を sRGB へ・トーンマップ無し）
	if (u_csMode.y > 0.5) a = clamp(csM.alpha, 0.0, 1.0);
	if (false) base = csLit(`]],"MESH_CS_FS");return{vs:a,fs:s}}const qr=`#version 300 es
precision highp float;
in vec2 a_uv;      // 単位格子 [0,1]²（メッシュは G だけに依存＝窓が動いても作り直さない）
uniform vec4 u_mesh;   // xy=窓の原点(lon,lat)  zw=窓の幅(deg)
${bt}
// Cesium の霧（csatmo.ts csFogV・頂点で色と量）：u_csFogD＝濃さ（0＝なし）・u_csFogL＝xyz 光へ向く単位ベクトル・w 照明あり 1／なし −1
uniform float u_csFogD;
uniform vec4 u_csFogL;
${rn}
out vec4 v_csFog;
out vec2 v_ll;
out float v_front;
out float v_fog;
out float v_h;
uniform vec4 u_cogMesh;   // COG uv＝off+a_uv×scale（メッシュ窓→COG bbox の変換を JS f64 前計算）
out vec2 v_cuv;
uniform vec4 u_gndMesh0;  // 地面アトラス（前景/近/中/遠）＝同じ変換（JS f64 前計算）
uniform vec4 u_gndMesh1;
uniform vec4 u_gndMesh2;
uniform vec4 u_gndMesh3;
out vec2 v_guv0;
out vec2 v_guv1;
out vec2 v_guv2;
out vec2 v_guv3;
void main() {
	vec2 a_ll = u_mesh.xy + u_mesh.zw * a_uv;   // 絶対 lon/lat（旧・頂点属性を単位格子＋uniform へ）
	v_cuv = u_cogMesh.xy + a_uv * u_cogMesh.zw;
	v_guv0 = u_gndMesh0.xy + a_uv * u_gndMesh0.zw;
	v_guv1 = u_gndMesh1.xy + a_uv * u_gndMesh1.zw;
	v_guv2 = u_gndMesh2.xy + a_uv * u_gndMesh2.zw;
	v_guv3 = u_gndMesh3.xy + a_uv * u_gndMesh3.zw;
	vec2 dDeg = a_ll - u_origin;              // 原点相対 (deg)。renderer は terrain に scenes.main.origin を渡す
	vec3 rel = deltaToRel(dDeg);              // 頂点3D − 原点3D（小・正確）
	vec3 dir = u_originPt + rel;              // 絶対単位球点（df/front/fog は粗くて可）
	// 遠景は変位を距離フェードで平ら化＝grazing(すれすれ角)で粗いメッシュ格子が縦壁に見えるのを消す。
	// 開始はフォグがほぼ霞み切る距離から＝可視域の山（中央・北アルプス等）は立体のまま、
	// シルエットが霞に溶けた先だけ平ら化（fogNear基準だと100km先の山脈が丸ごと潰れて見えなくなる）。
	float df = 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, dir));
	float h = elev(a_ll) * df;
	v_h = h;
	v_ll = a_ll;
	vec3 relW = rel + (h * u_elevScale) * liftDir(a_ll, dir);   // (dir*(1+h*scale)) − 原点3D を相殺なしで（楕円体＝測地法線）
	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;
	v_fog = fogOf(u_originPt + relW);
	v_csFog = csFogV(u_eye * CS_R, (u_originPt + relW) * CS_R, u_csFogD, u_csFogL.xyz, u_csFogL.w);
	gl_Position = u_clipT + u_mvp * vec4(relW, 0.0);
	applyLogDepth();
}`,ai=`
uniform sampler2D u_cogTex;
uniform float u_hasCog;
uniform vec4 u_cogPair;
vec3 cogTexMix(vec3 col, vec2 uv) {
	if (u_hasCog < 0.5) return col;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return col;
	float v = 1.0 - uv.y;
	if (u_cogPair.x > 0.5) v = clamp(v * 0.5, u_cogPair.z, 0.5 - u_cogPair.z) + (uv.x >= u_cogPair.y ? 0.5 : 0.0);
	vec4 c = texture(u_cogTex, vec2(uv.x, v));
	return mix(col, c.rgb, c.a);
}`,ln=`
uniform sampler2D u_gnd0;
uniform sampler2D u_gnd1;
uniform sampler2D u_gnd2;
uniform sampler2D u_gnd3;
uniform float u_gndN;   // 有効な窓の数（0..4・細かい順＝前景/近/中/遠）
uniform float u_gndSplit;   // 分割（Cesium の ImageryLayer.splitDirection）の画面 x（device px）｜負＝分割なし。窓は左右の半分に焼いてある
float gndEdge(vec2 uv) {   // 窓内 1・縁 4% で 0 へ・外 0
	vec2 d = min(uv, 1.0 - uv);
	return clamp(min(d.x, d.y) / 0.04, 0.0, 1.0);
}
vec2 gndUV(vec2 uv) {   // 窓 uv → テクスチャ uv（分割時は画面の x で左右の半分を選ぶ。半分の縁は数 texel 内へ寄せる＝隣の半分が滲まない）
	uv = clamp(uv, 0.0, 1.0);
	if (u_gndSplit >= 0.0) uv.x = clamp(uv.x * 0.5, 0.002, 0.498) + (gl_FragCoord.x >= u_gndSplit ? 0.5 : 0.0);
	return uv;
}
vec3 gndMix(vec3 col, vec2 uv0, vec2 uv1, vec2 uv2, vec2 uv3) {
	if (u_gndN < 0.5) return col;
	vec4 c0 = texture(u_gnd0, gndUV(uv0));
	vec4 c1 = texture(u_gnd1, gndUV(uv1));
	vec4 c2 = texture(u_gnd2, gndUV(uv2));
	vec4 c3 = texture(u_gnd3, gndUV(uv3));
	// 窓の縁 4% はひとつ外の窓へクロスフェード＝解像度の段差を溶かす（w=1 で内側・0 で外側。前乗算同士の線形補間）
	float w0 = gndEdge(uv0), w1 = u_gndN > 1.5 ? gndEdge(uv1) : 0.0, w2 = u_gndN > 2.5 ? gndEdge(uv2) : 0.0, w3 = u_gndN > 3.5 ? gndEdge(uv3) : 0.0;
	vec4 c = mix(mix(mix(mix(vec4(0.0), c3, w3), c2, w2), c1, w1), c0, w0);
	return col * (1.0 - c.a) + c.rgb;   // アトラスは前乗算＝over 合成
}
// 前乗算の床（rgb·a, a）の上にアトラスを over（B5＝background 層の無い MapLibre の地図は床が透明＝塗りだけが残る。a=1 なら gndMix と同じ値）
vec4 gndOver(vec4 col, vec2 uv0, vec2 uv1, vec2 uv2, vec2 uv3) {
	if (u_gndN < 0.5) return col;
	vec4 c0 = texture(u_gnd0, gndUV(uv0));
	vec4 c1 = texture(u_gnd1, gndUV(uv1));
	vec4 c2 = texture(u_gnd2, gndUV(uv2));
	vec4 c3 = texture(u_gnd3, gndUV(uv3));
	float w0 = gndEdge(uv0), w1 = u_gndN > 1.5 ? gndEdge(uv1) : 0.0, w2 = u_gndN > 2.5 ? gndEdge(uv2) : 0.0, w3 = u_gndN > 3.5 ? gndEdge(uv3) : 0.0;
	vec4 c = mix(mix(mix(mix(vec4(0.0), c3, w3), c2, w2), c1, w1), c0, w0);
	return col * (1.0 - c.a) + c;
}`,Xa=`
uniform vec4 u_gm;        // (種類 0 なし／1 標高／2 傾斜／3 方位／4 等高線だけ, 最低標高 m, 1/(最高−最低), 陸だけ 0/1)
uniform vec4 u_gmC;       // 等高線の色 rgba（a=0 なし）
uniform vec4 u_gmP;       // (等高線の間隔 m, 太さ px, 材質の不透明度, 0)
uniform sampler2D u_gmRamp;
// h＝標高 m・gEN＝勾配（東・北 m/m）・dh＝fwidth(h)。戻り＝材質の色（rgb・a）。傾斜＝法線と上の角 0..π/2 を 0..1 に・
// 方位＝法線の水平成分（下り向き）の東から反時計回りの角 0..2π を 0..1 に（Cesium の GlobeVS と同じ）
vec4 gmColor(float h, vec2 gEN, float dh) {
	float k = u_gm.x;
	vec4 m = vec4(0.0);
	if (k < 3.5) {
		float v = k < 1.5 ? clamp((h - u_gm.y) * u_gm.z, 0.0, 1.0)
			: k < 2.5 ? acos(inversesqrt(1.0 + dot(gEN, gEN))) / 1.5707963267948966
			: fract(atan(-gEN.y, -gEN.x) / 6.283185307179586 + 1.0);
		m = texture(u_gmRamp, vec2(v, 0.5));
	}
	if (u_gmC.a > 0.0 && mod(h, u_gmP.x) < dh * u_gmP.y) m = u_gmC;   // 等高線（Cesium の ElevationContour）＝標高の画素差 × 太さ の帯
	if (u_gm.w > 0.5 && h <= 0.0) m.a = 0.0;   // 陸だけ（WaterMask の逆）＝標高 0 以下（海面）は塗らない
	m.a *= u_gmP.z;
	return m;
}`,un=`
uniform float u_whK;
uniform sampler2D u_climTex;   // 気候場 720x360（Köppen-Geiger/Beck et al. CC-BY を焼き縮め）R=乾燥度 G=極地/氷床
uniform float u_hasClim;       // 0=未着（緯度近似フォールバック） 1=気候場で本物の cross-blend
// テーマパレット（正準既定＝worldpal.js・view.worldHypso で部分上書き）。式・標高帯はテーマ不変＝色だけ差し替え
uniform vec3 u_whLowH, u_whLowA;   // 低地 湿潤/乾燥
uniform vec3 u_whMidH, u_whMidA;   // 〜400m 湿潤/乾燥
uniform vec3 u_whR1, u_whR2, u_whPeak, u_whSnow;   // 400-1300 / 1300-2800 / 2800-4800 / 氷床
float wetBox(vec2 ll, vec4 b) {   // b=(lon0,lon1,lat0,lat1)・縁3°ソフト（気候場未着時のフォールバック用）
	return smoothstep(b.x - 3.0, b.x + 3.0, ll.x) * (1.0 - smoothstep(b.y - 3.0, b.y + 3.0, ll.x))
	     * smoothstep(b.z - 3.0, b.z + 3.0, ll.y) * (1.0 - smoothstep(b.w - 3.0, b.w + 3.0, ll.y));
}
vec3 worldHypso(float e, vec2 ll) {
	float latD = ll.y;
	float al = abs(latD);
	float arid, pol;
	if (u_hasClim > 0.5) {
		// 本物の cross-blend：気候場テクスチャ（海は焼き時に最寄り陸の値で充填済＝海岸で値が落ちない）
		vec2 c2 = texture(u_climTex, vec2(fract(ll.x / 360.0 + 0.5), 0.5 - latD / 180.0)).rg;   // 経度は一周で折り返す
		arid = c2.r; pol = c2.g;
	} else {
		// フォールバック＝緯度近似（馬緯度の乾燥帯×湿潤東岸の打ち消し箱）。気候場が届くまでの1-2フレーム用
		arid = smoothstep(10.0, 17.0, al) * (1.0 - smoothstep(32.0, 45.0, al));
		float wet = wetBox(ll, vec4(95.0, 148.0, 17.0, 40.0));
		wet = max(wet, wetBox(ll, vec4(118.0, 150.0, 40.0, 55.0)));
		wet = max(wet, wetBox(ll, vec4(-100.0, -70.0, 24.0, 40.0)));
		wet = max(wet, wetBox(ll, vec4(-63.0, -35.0, -35.0, -15.0)));
		wet = max(wet, wetBox(ll, vec4(74.0, 95.0, 8.0, 30.0)));
		arid *= 1.0 - wet;
		pol = 1.0 - smoothstep(-64.0, -58.0, latD);   // 逆順smoothstepはGLSL仕様未定義＝正順で等価書換（WGSL移植と同式）
	}
	vec3 low = mix(u_whLowH, u_whLowA, arid);
	vec3 mid = mix(u_whMidH, u_whMidA, arid);
	vec3 c = mix(low, mid, smoothstep(0.0, 400.0, e));
	c = mix(c, u_whR1, smoothstep(400.0, 1300.0, e));
	c = mix(c, u_whR2, smoothstep(1300.0, 2800.0, e));
	c = mix(c, u_whPeak, smoothstep(2800.0, 4800.0, e));
	// 雪/氷：気候場の極地チャンネル（EF=1・ET≈0.55）＋高緯度×氷床標高（グリーンランド内陸の保険）
	float snow = pol + smoothstep(56.0, 62.0, latD) * smoothstep(1100.0, 1900.0, e);
	c = mix(c, u_whSnow, clamp(snow, 0.0, 1.0));
	return mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), 0.10);
}
`,Zi=`#version 300 es
precision highp float;
uniform vec3 u_fogColor;
uniform vec3 u_land;
uniform float u_landA;   // 床の不透明度（B5）＝globe パスの u_land.a と同じ（background 層の無い MapLibre の地図＝0）。1＝従来とビット同一
uniform vec3 u_hypso;    // 標高ティント色（高所を land からこの色へ寄せる＝控えめな標高彩色）
uniform vec2 u_hypsoP;   // x=1/最大標高(m)（この高さで寄せ切る） y=寄せ量(0=無効…1=全置換)
uniform vec4  u_cg;          // 地面の照明（setGroundLighting・Cesium の globe.enableLighting・2026-10-26）：xyz＝光へ向く単位ベクトル（世界）・w＝0 無し／1 地形の法線／2 楕円体の上向き
uniform vec4  u_cgP;         // (lambert の倍率, 足す値, 効き 0..1＝距離のフェード済み, 大気の夜側の明るさ 0.05..1・負＝暗くしない)
uniform vec3  u_cgC;         // 光の色（czm_lightColor）
// 経緯度（deg）の点の東・北・上（世界軸＝ECEF の (x, z, y)）での lambert：n＝勾配（東・北・m/m）から、mode 2 は上向き
float cgLambert(vec2 ll, vec2 gEN, float mode) {
	vec2 lr = ll * 0.017453292519943295;
	float cl = cos(lr.y), sl = sin(lr.y), co = cos(lr.x), so = sin(lr.x);
	vec3 L = vec3(dot(u_cg.xyz, vec3(-so, 0.0, co)), dot(u_cg.xyz, vec3(-sl * co, cl, -sl * so)), dot(u_cg.xyz, vec3(cl * co, sl, cl * so)));   // 東・北・上
	vec3 n = mode > 1.5 ? vec3(0.0, 0.0, 1.0) : normalize(vec3(-gEN, 1.0));
	float diff = clamp(max(dot(n, L), 0.0) * u_cgP.x + u_cgP.y, 0.0, 1.0);
	return mix(1.0, diff, u_cgP.z);
}
uniform float u_globeAlpha;   // 球体の不透明度（globe パスと同じ値＝地形面も一緒に透ける）
uniform float u_terrNeg;      // 1＝負の標高をそのまま描く DEM（Cesium World Terrain の楕円体高・海底）＝低地フェードを止める：透かした先の 0m の球に地面が化けると、海面が −30m のサンフランシスコで地面ごと 30m 浮く（2026-10-31）
uniform float u_farPass;   // 1=遠景メッシュパス：近窓の内側は近メッシュの担当＝discard（二重描画・z-fight回避）・2=近景メッシュパス（近景層の窓だけ・主パスはその内側を discard）
${ii}
${un}
${Xa}
${ai}
${ln}
in vec2 v_guv0;
in vec2 v_guv1;
in vec2 v_guv2;
in vec2 v_guv3;
in vec2 v_cuv;
in vec2 v_ll;
in float v_front;
in float v_fog;
in float v_h;
in vec4 v_csFog;   // Cesium の霧（頂点で計算・csFogV）
out vec4 fragColor;
void main() {
	float mpp = fwidth(v_ll.y) * 111320.0;   // 画素の地上寸法(m)の目安＝下の低地フェード帯の上端（WGSL terrMpp と同式・経度は f32 刻みが粗いので使わない）。微分は discard より前
	if (v_front < -0.0015) discard;   // 海抜0の接線より少し先まで許容＝地平線の先に頭を出す高山（〜9km球換算）を描く。遮蔽は深度とフォグが担う
	if (u_farPass > 0.5 && u_farPass < 1.5) {   // 遠景パスは近窓の内側を塗らない。縁の座標一致は連続な elev()（近縁が遠層値へ溶ける）が保証
		vec2 uvN = (v_ll - u_elevBounds.xy) / u_elevBounds.zw;
		if (uvN.x >= 0.0 && uvN.x <= 1.0 && uvN.y >= 0.0 && uvN.y <= 1.0) discard;
	}
	if (u_farPass < 0.5 && u_hasNear > 0.5) {   // 主パスは近景層の窓の内側を塗らない（近景メッシュパスの担当。縁の連続は elevNear の溶かしが保証）
		vec2 uvF = (v_ll - u_nearBounds.xy) / u_nearBounds.zw;
		if (uvF.x >= 0.0 && uvF.x <= 1.0 && uvF.y >= 0.0 && uvF.y <= 1.0) discard;
	}
	if (u_farPass > 1.5 && u_farPass < 2.5 && u_hasFine > 0.5) {   // 近景メッシュパスは足元層の窓の内側を塗らない（足元メッシュパス u_farPass=3 の担当）
		vec2 uvG = (v_ll - u_fineBounds.xy) / u_fineBounds.zw;
		if (uvG.x >= 0.0 && uvG.x <= 1.0 && uvG.y >= 0.0 && uvG.y <= 1.0) discard;
	}
	// 海〜低地は地形を透明化し、海岸線は精細なベクタに委ねる。低地から滑らかに陰影を立ち上げ、
	// 粗い標高メッシュが海岸で作る「崖」のガタつき・平野のノイズを消す。
	// 帯の上端＝画素 2 個分の標高（1〜100m）：透けた先は海抜0の球の床（同じ地面アトラス）＝チルトで h·tanθ ずれた
	// 二重像になる（京都 40m×60° で堀が 70m ずれる）。ずれが 2px 未満の高さでだけ透かす（wgsl.js TERRAIN_WGSL と同式）。
	float t = u_terrNeg > 0.5 ? 1.0 : smoothstep(1.0, clamp(2.0 * mpp, 2.0, 100.0), v_h);
	if (t <= 0.0) discard;
	// 北西光の hillshade（前方差分＝中央差分の半分のフェッチ）。
	// 歩幅＝アトラス1texel（下限は従来の0.004°≈450m＝近景は不変）。固定歩幅はズームアウトで
	// texel未満に落ち「鈍った勾配×小さい歩幅」で陰影がベタ灰色に消えていた（広域の塗りの甘さ）。
	// texel差分＝アトラスが持つ最小起伏を常に同じゲインで見せる＝どのスケールでも塗りが痩せない。
	// 遠層域は下限 0.004°≈450m がそのまま R10 texel（463m）＝遠景の歩幅として妥当（別計算しない）。
	vec2 tsz = vec2(textureSize(u_elevTex, 0));
	float d = max(0.004, u_elevBounds.w / tsz.y);
	float dTex = u_elevBounds.w / tsz.y;   // アトラス 1 texel（勾配・材質用）
	float shadeK = 1.0;
	float h0 = elev(v_ll);
	if (u_farPass > 1.5) {   // 近景メッシュパス：歩幅は近景層の 1 texel（下限 0.004° を外す）・陰影の利得は歩幅比で揃える（＝勾配換算・見た目の濃さ不変）
		// ただし R16F の刻み q（1024〜2048 m で 1 m）の 32 倍を下限に＝1 texel 差分が丸め 1 段を勾配に化けさせて粒々の陰影になった（2026-10-31・wgsl と同式）
		float q = exp2(floor(log2(max(abs(h0), 1.0))) - 10.0);
		float nbw = u_farPass > 2.5 ? u_fineBounds.w : u_nearBounds.w;   // 足元メッシュパス（3）は足元層の 1 texel
		dTex = max(nbw / float(textureSize(u_nearElevTex, 0).y), q * 32.0 / 111320.0);
		shadeK = 0.004 / max(dTex, 1e-6); d = dTex;
	}
	float hx = elev(v_ll + vec2(d, 0.0)) - h0;
	float hy = elev(v_ll + vec2(0.0, d)) - h0;
	float shade = clamp(0.82 + (-hx + hy) * 0.0007 * shadeK, 0.45, 1.15);
	float cgK = 1.0;   // 地面の照明（Cesium）＝北西の陰影の代わりに太陽の lambert を画像ごと掛ける
	float gmDh = fwidth(h0);   // 地面の材質の等高線＝標高の画素差（一様な制御の流れで）
	vec2 gmEN = vec2(0.0);   // 勾配（東・北 m/m）＝地面の照明と材質（傾斜・方位）が使う。アトラスの 1 texel 差分（陰影の 0.004° の下限を使わない＝近景の急斜面が鈍らない）。影の派生（TERR_SUN_SHADE）の gEN とは別名
	if (u_cg.w > 0.5 || u_gm.x > 1.5) {
		float dL = dTex, hxL = elev(v_ll + vec2(dL, 0.0)) - h0, hyL = elev(v_ll + vec2(0.0, dL)) - h0;
		gmEN = vec2(hxL / (dL * 111320.0 * max(cos(v_ll.y * 0.017453292519943295), 0.01)), hyL / (dL * 111320.0));
	}
	if (u_cg.w > 0.5) { shade = 1.0; cgK = cgLambert(v_ll, gmEN, u_cg.w); }
	// 標高ティント：land を高所ほど u_hypso へ寄せる（テーマのノブ＝未指定は y=0 で恒等）。陰影の前＝shade が上に乗る
	vec3 landC = mix(u_land, u_hypso, clamp(h0 * u_hypsoP.x, 0.0, 1.0) * u_hypsoP.y);
	landC = mix(landC, worldHypso(h0, v_ll), u_whK);   // 全球ハイプソ（低ズーム帯）＝globe パスと同色でピッチ不変
	// 深度は VS の applyLogDepth() が焼き済み（mesh/building と一貫。FSで書くと early-Z が死ぬ）
	// 陰影の立ち上がりは従来の 1〜100m 帯のまま（低地＝陰影なしの紙色）＝不透明化した分を床と同色で埋める（wgsl.js と同式・低ズームは旧式と恒等）
	float tS = smoothstep(1.0, 100.0, v_h);
	float ba = mix(u_landA, 1.0, max(u_whK, u_hasCog));   // 床の不透明度（B5）＝全球ハイプソ・COG は不透明
	vec4 g = gndOver(vec4(cogTexMix(landC * mix(1.0, shade, min(tS / t, 1.0)), v_cuv) * ba, ba), v_guv0, v_guv1, v_guv2, v_guv3);   // ユーザ COG／地面アトラス（ラスタ＋3D の塗り）＝陰影の上・フォグの下
	if (u_gm.x > 0.5) { vec4 m = gmColor(h0, gmEN, gmDh); g = vec4(g.rgb * (1.0 - m.a) + m.rgb * m.a, max(g.a, m.a)); }   // 地面の材質（Cesium の globe.material）＝画像の上・照明の下
	if (u_cg.w > 0.5) g.rgb *= u_cgC * cgK;
	vec3 col = g.rgb * (1.0 - v_fog) + u_fogColor * v_fog * g.a;   // ＝mix(colBase, fog, v_fog) を前乗算で
	col = mix(col, v_csFog.rgb * g.a, v_csFog.a);   // Cesium の霧（800 km より下・遠景球の csFogL と同じ式）
	fragColor = vec4(col * t * u_globeAlpha, g.a * t * u_globeAlpha);   // premultiplied（globe基色→地形へ滑らかに）× 球体の不透明度
}`,uc=`#version 300 es
precision highp float;
in vec2 a_delta;
${bt}
${ni}
uniform float u_lift;   // 地形からのリフト(m)。塗り(fan)を地形にドレープ＝海抜0平面でなく地形表面へ（境界線と一致）
uniform float u_sphereClip;   // 1＝裏半球の頂点を地平円（可視半球の縁）へ射影クランプ（wdepr＝全球スケールのポリゴン用）。
                              // 裏側ポリゴンは円周上に縮退＝巻き数0で消え、地平線を跨ぐポリゴンは可視部だけを正しく囲む
                              // ＝投影の折返しが円盤内に作る±1の巻き数斑（GL/WebGPUで符号が逆＝ref方式では殺しきれない
                              // 裏半球の幻影・2026-09-02 実測）を根絶。既定0＝従来のoverlay（局所ポリゴン）は完全不変。
void main() {
	// 塗り(fan)を FILL_VS と同じ標高変位で地形にドレープ。elev 無しだと海抜0の平面に貼られ、
	// 地形に沿う境界線と乖離して浮く（本人報告 2026-08-12・豊浦町ハイライト）。WebGPU vsStencil と対。
	vec2 ll = u_origin + a_delta;
	vec3 rel = deltaToRel(a_delta);
	vec3 dir = u_originPt + rel;
	float df = 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, dir));
	float h = (elevQ(ll) + u_lift) * u_elevScale * df;   // 案A＝overlay 塗りも描画メッシュ面に乗せる
	vec3 relW = rel + h * liftDir(ll, dir);
	if (u_sphereClip > 0.5) {
		vec3 P = u_originPt + relW;                  // 絶対位置（単位球近傍）
		float e2 = dot(u_eye, u_eye);
		if (dot(P, u_eye) < 1.0) {                   // 裏半球（可視条件は dot(P,E)>1＝接円）
			vec3 Pp = P - u_eye * (dot(P, u_eye) / e2);   // E 直交成分＝地平円の向き
			float lp = length(Pp);
			vec3 t = lp > 1e-6 ? Pp / lp : normalize(vec3(-u_eye.z, 0.0, u_eye.x));
			P = u_eye / e2 + sqrt(max(1.0 - 1.0 / e2, 0.0)) * t;   // 地平円（中心 E/|E|²・半径 √(1-1/|E|²)）上へ
			relW = P - u_originPt;
		}
	}
	gl_Position = u_clipT + u_mvp * vec4(relW, 0.0);   // RTE：塗りは巻き数で決まるので fan の形は問わない・地形にドレープ
}`,fc=`#version 300 es
precision highp float;
out vec4 o;
void main() { o = vec4(0.0); }`,cc=`#version 300 es
precision highp float;
uniform vec4 u_fill;
out vec4 o;
void main() { o = vec4(u_fill.rgb * u_fill.a, u_fill.a); }`,Gt=`#version 300 es
precision highp float;
out vec2 v_ndc;
void main() {
	vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
	v_ndc = p;
	gl_Position = vec4(p, 0.0, 1.0);
}`,Qi=`#version 300 es
precision highp float;
// 全画面レイキャスト（#65・2026-09-27）：視線の基底は CPU f64（camera.js viewRays）＝invMvp（f32）の積和をしない。
// 交点は近い根を t＝2c/(−b＋√h)（c＝|E|²−1 は CPU f64）＝桁落ちなし。後ろ向き（q≤0）＝t<0。A＝目・d＝視線（clip w＝1 の長さ）
uniform vec3 u_rayF, u_rayX, u_rayY, u_rayE;
uniform float u_rayC;
uniform vec3 u_rayO, u_rayEO;   // 錨：シーン原点の β単位球の点 O・目−O（f64 で引く）＝交点 δ＝u_rayEO＋t·d（原点相対・f32 で mm 級）
uniform vec4 u_rayLL;           // (原点 lon, lat（deg・測地）, β0（rad）, cos β0)
vec3 rayDir(vec2 ndc) { return u_rayF + ndc.x * u_rayX + ndc.y * u_rayY; }
float sphereT(float bb, float disc) { if (disc < 0.0 || (bb >= 0.0 && u_rayC >= 0.0)) return -1.0; float q = -bb + sqrt(disc); return q > 0.0 ? 2.0 * u_rayC / q : -1.0; }   // 外から上向き（bb≥0）は前に交点なし：q＝−b＋√(b²−4c) は c≈0（目が地面すれすれ）で丸めの ±1ulp になり、実 GPU の sqrt では空の画素が地面に化けた（2026-10-28 Cesium 花火）
// δ から経緯度の差（deg・測地）を桁落ちなしで（wgsl.js deltaLL と同式）：δlon＝atan2(δz·Ox−δx·Oz, ρO²+δx·Ox+δz·Oz)・δβ は ρ の差も s/(ρP+ρO) で
vec2 deltaLL(vec3 dl, float ell) {
	vec3 O = u_rayO; float rhoO = u_rayLL.w, beta0 = u_rayLL.z;
	float dlon = atan(dl.z * O.x - dl.x * O.z, rhoO * rhoO + dl.x * O.x + dl.z * O.z);
	float s = 2.0 * (O.x * dl.x + O.z * dl.z) + dl.x * dl.x + dl.z * dl.z;
	float rhoP = sqrt(max(rhoO * rhoO + s, 0.0));
	float drho = s / max(rhoP + rhoO, 1e-12);
	float dbeta = atan(dl.y * rhoO - drho * O.y, rhoP * rhoO + (O.y + dl.y) * O.y);
	float b1 = beta0 + dbeta;
	float corr = ell * (0.0016792203863837047 * (sin(2.0 * b1) - sin(2.0 * beta0)) + 0.0000014098905530233192 * (sin(4.0 * b1) - sin(4.0 * beta0)));
	return vec2(dlon, dbeta + corr) * 57.29577951308232;
}
uniform vec4 u_land;
uniform vec4 u_atmo;   // 大気色 rgb + 強さ(a)
// style の sky（B4・MapLibre の setSky）＝簡易の空：地平線の horizon-color から天頂の sky-color へのグラデーション（球に当たらない光線だけ・不透明）。
// 無指定（u_skyOn=0）＝従来の宇宙へ抜けるリム光とビット同一。u_skyBlend＝(sky-horizon-blend, horizon-fog-blend, atmosphere-blend, 0)
uniform float u_skyOn;
uniform vec3 u_skyColor;
uniform vec3 u_horizonColor;
uniform vec3 u_skyFogColor;
uniform vec4 u_skyBlend;
// Cesium の大気（view.csAtmo・../csatmo.ts）＝(点ける 0/1, 地面の大気の効き 0..1, 空の大気 0/1, 霧の濃さ＝csFogDensity)。点けると従来の霞・リム光・sky の代わり
uniform vec4 u_csAtm;
uniform vec3 u_csHsb;   // 空の大気の色相・彩度・明るさのずらし（Cesium の skyAtmosphere.hueShift…・csHsbShift）
${rn}// 全球ハイプソ（NEラスタの美しさを標高から計算で作る＝ラスタタイル配布ゼロ）：
// レイ→球→測地緯度→elev() は CONTOUR_FS と同式。R90 全球窓（z<6.5 は bounds=[-180,-90,360,180]）を引く。
// 配色本体は WORLD_HYPSO（TERRAIN_FS と共有＝ピッチで色が変わらない）。
uniform sampler2D u_elevTex;
uniform vec4 u_elevBounds;
uniform float u_hasElev;
uniform float u_ell;      // 1=楕円体（β→測地復元。球=0＝恒等）
uniform vec3 u_seaC;      // 海の平色（NE流の淡青）
${Xa}
in vec2 v_ndc;
out vec4 fragColor;
const float R2D = 57.29577951308232;
// far床＝近窓の外を受ける第2アトラス（世界帯z<8はR90全球固定窓＝terrain.jsのB形態）。
// R90/R10境界5.5化で「近窓=全球」の前提が崩れ、窓外の陸が標高0＝海色に抜けた（スカンジナビア/シベリア
// 実測 9/2＝本人発見「タイラーのバグ」）。terrain elev() と同じフォールバック＝カバーの床。
uniform sampler2D u_farElevTex;
uniform vec4 u_farBounds;
uniform float u_hasFar;
uniform float u_elevEdgeFade;   // 近窓縁＝far値へ溶かす幅(deg)。R90全球窓=0（縁は極/±180のみ）
float elevFar(vec2 ll) {
	if (u_hasFar < 0.5) return 0.0;
	ll.x -= 360.0 * floor((ll.x + 180.0) / 360.0);   // 経度を -180..180 へ（原点相対の経度は ±180 を越えうる）
	vec2 uv = (ll - u_farBounds.xy) / u_farBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	return texture(u_farElevTex, uv).r;
}
float elevUV(vec2 uv, vec2 ll) {   // uv＝原点相対で作った近窓の uv（#65）・ll＝far 床の受け（粗くて可）
	if (u_elevBounds.z > 359.0) uv.x = fract(uv.x);   // 全球の窓（R90）は経度が一周＝原点から 180° 超回った先の uv を折り返す（gpu/wgsl.js gElevUV と同じ・2026-10-01）
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return elevFar(ll);
	float fade = 1.0;
	if (u_elevEdgeFade > 0.0) {
		vec2 w = vec2(u_elevEdgeFade) / u_elevBounds.zw;
		fade = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return mix(elevFar(ll), texture(u_elevTex, uv).r, fade);
}
float elevAt(vec2 ll) { return elevUV((ll - u_elevBounds.xy) / u_elevBounds.zw, ll); }
${un}
${ai}
${ln}
uniform vec4 u_cogOff;    // 球の床の COG uv 係数（f64 前計算・#65）＝(原点の uv, 1/span)：uv＝off＋δll·inv（旧＝絶対経緯度→uv を廃止）
uniform vec4 u_gndOff0;   // 地面アトラス（前景/近/中/遠）＝同形
uniform vec4 u_gndOff1;
uniform vec4 u_gndOff2;
uniform vec4 u_gndOff3;
uniform vec4  u_cg;          // 地面の照明（setGroundLighting・Cesium の globe.enableLighting・2026-10-26）：xyz＝光へ向く単位ベクトル（世界）・w＝0 無し／1 地形の法線／2 楕円体の上向き
uniform vec4  u_cgP;         // (lambert の倍率, 足す値, 効き 0..1＝距離のフェード済み, 大気の夜側の明るさ 0.05..1・負＝暗くしない)
uniform vec3  u_cgC;         // 光の色（czm_lightColor）
// 経緯度（deg）の点の東・北・上（世界軸＝ECEF の (x, z, y)）での lambert：n＝勾配（東・北・m/m）から、mode 2 は上向き
float cgLambert(vec2 ll, vec2 gEN, float mode) {
	vec2 lr = ll * 0.017453292519943295;
	float cl = cos(lr.y), sl = sin(lr.y), co = cos(lr.x), so = sin(lr.x);
	vec3 L = vec3(dot(u_cg.xyz, vec3(-so, 0.0, co)), dot(u_cg.xyz, vec3(-sl * co, cl, -sl * so)), dot(u_cg.xyz, vec3(cl * co, sl, cl * so)));   // 東・北・上
	vec3 n = mode > 1.5 ? vec3(0.0, 0.0, 1.0) : normalize(vec3(-gEN, 1.0));
	float diff = clamp(max(dot(n, L), 0.0) * u_cgP.x + u_cgP.y, 0.0, 1.0);
	return mix(1.0, diff, u_cgP.z);
}
uniform float u_globeAlpha;   // 球体の不透明度（表示パネル「基図」を globe/terrain まで拡張＝本人裁定 2026-09-13。1=不透明・premultiplied なので rgb にも掛ける）
uniform vec4 u_ugC;    // 地下から見た球の裏面（Cesium の globe.undergroundColor）：rgb＋α・α<0＝切（目が地面の下の時だけ renderer が点ける）
uniform vec4 u_ugNF;   // undergroundColorAlphaByDistance＝(near, nearValue, far, farValue)・距離は世界単位
// 球の床が深度を書く（view.globeDepth・Cesium の globe.translucency で地面の色に穴＝colorToAlpha の海）：0.5·logCoef（0＝書かない）。
// 不透明な地面（α≥0.5）の画素だけ球の交点の対数深度＝地中の模型（Cesium の globe-interior の核）が陸に隠れ、穴（海）からは見える。
// 光線は t あたり clip w が 1 増える（viewRays の正規化・f64 の mvp＝K 倍なし）＝w＝t。深度テストを切った回（既定）では書いても効かない
uniform float u_gDepth;
uniform float u_gBack;   // 球の裏面を描く（Cesium の globe.backFaceCulling=false）：断面で切った手前の面の向こう＝遠い根の内側（GLOBE_CLIP_FS）
void main() {
	gl_FragDepth = 1.0;
	vec3 A = u_rayE, d = rayDir(v_ndc);   // #65：視線は CPU f64 の基底
	float aa = dot(d, d), bb = 2.0 * dot(A, d), cc = u_rayC;
	float disc = bb * bb - 4.0 * aa * cc;
	float aDotd = bb * 0.5, tstar = -aDotd / aa;
	float t = sphereT(bb, disc);   // 近い根を桁落ちなしで（disc<0 か後ろ向き＝−1）
	bool ug = false;   // 目が球の中（地下）＝前方の遠い根＝球の裏面（Cesium は裏面を undergroundColor で塗る）
	if (t < 0.0 && u_ugC.a >= 0.0 && cc < 0.0 && disc >= 0.0) { t = (-bb + sqrt(disc)) / (2.0 * aa); ug = true; }
	if (t < 0.0) {                                 // 前方に球ヒット無し＝空：地平の霞から宇宙へ連続に減衰
		if (u_csAtm.x > 0.5) {   // Cesium の空の大気（殻の奥の面で計る・星の上に α で重なる）
			if (u_csAtm.z < 0.5) discard;
			vec4 cs = csSkyL(A * CS_R, normalize(d), 0.0, u_cg.xyz, u_cg.w > 0.5 ? u_cgP.w : -1.0, u_csHsb);   // lit by the sun with the globe's lighting (Cesium's dynamic atmosphere)
			if (cs.a <= 0.002) discard;
			fragColor = cs;
			return;
		}
		// ここには2種の光線が来る：(a)球ミス(disc<0)、(b)延長線は背後の地球に当たるが前方は素通り(t<0)。
		// 旧実装は両方 discard 系＝高チルト・低高度で「見上げ境界」「背後ヒット円錐」が画面を横切り、
		// ハロー帯が横一線でスパッと黒に切れて空が2段になった（ズームを上げるほど(b)の黒が下りてくる）。
		// 前方光線の球中心最接近距離：tstar<=0（水平より上向き＝(b)は必ずこちら）は視点自身が最接近＝length(A)。
		float lenA = length(A);
		float m = tstar > 0.0 ? sqrt(max((cc + 1.0) - aDotd * aDotd / aa, 0.0)) : lenA;
		float g = smoothstep(1.09, 1.0, m);
		// 高度角フェード：見上げるほど大気は薄く＝天頂へ滑らかに宇宙色。低高度では m≈lenA が一様なので、
		// これが無いと今度は空全体が一枚の紺に塗り潰される。
		float alt = dot(normalize(d), A / lenA);   // 視線の高度（上向きの余弦・地平線は水平より少し下）
		g *= 1.0 - smoothstep(0.0, 0.55, alt);
		if (u_skyOn > 0.5) {
			// 簡易の空（B4）：地平線（球に接する視線＝sin(俯角)=sqrt(1−1/|A|²)）を 0・天頂を 1 とした高さ u で horizon-color → sky-color。
			// sky-horizon-blend＝混ざる幅（1＝天頂まで・0＝地平線でスパッと）。地平線の際は fog-color を horizon-fog-blend の分だけ重ねる（15% の高さで消える）。
			// atmosphere-blend＝従来のリム光（大気の霞）を空の上に重ねる度合い。空は不透明＝星空は隠れる（MapLibre と同じ）
			float hz = -sqrt(max(1.0 - 1.0 / (lenA * lenA), 0.0));
			float u = clamp((alt - hz) / max(1.0 - hz, 1e-6), 0.0, 1.0);
			float w = u_skyBlend.x;
			float k = w <= 0.0 ? step(1e-6, u) : smoothstep(0.0, w, u);
			vec3 col = mix(u_horizonColor, u_skyColor, k);
			col = mix(col, u_skyFogColor, u_skyBlend.y * (1.0 - smoothstep(0.0, 0.15, u)));
			vec3 limbCol = mix(u_land.rgb, u_atmo.rgb, u_atmo.a * 0.9);
			float a = max(g, 0.0); a = a * a * mix(u_atmo.a, 1.0, a) * u_skyBlend.z;
			fragColor = vec4(col * (1.0 - a) + mix(u_atmo.rgb, limbCol, max(g, 0.0)) * a, 1.0);   // premultiplied・不透明
			return;
		}
		if (g <= 0.0 || u_atmo.a <= 0.0) discard;   // 大気の強さ 0（MapLibre の口＝sky の無い style）＝リム光も描かない（B5・旧＝強さ 0 でも床色の帯が宇宙へ滲んだ）
		// 縁(g=1)は球面リム内側の霞と同色・不透明＝地平線で色が連続。外側へ大気色→透明へフェード。
		vec3 limbCol = mix(u_land.rgb, u_atmo.rgb, u_atmo.a * 0.9);
		float a = g * g * mix(u_atmo.a, 1.0, g);
		fragColor = vec4(mix(u_atmo.rgb, limbCol, g) * a, a);   // premultiplied
		return;
	}
	vec3 P = A + t * d;                            // 面上の点（単位球＝法線）＝絶対（霞・粗い用途）
	vec2 dll = deltaLL(u_rayEO + t * d, u_ell);   // 原点相対の経緯度差（deg・測地）＝uv の正本（#65）
	vec2 ll = u_rayLL.xy + dll;                    // 絶対経緯度（粗くて可＝ハイプソ・気候）
	vec3 base = u_land.rgb;
	if (u_whK > 0.001 && u_hasElev > 0.5) {        // 全球ハイプソ：標高→配色＋陰影（NEラスタの計算版）
		float e = elevAt(ll);
		// hillshade：1テクセル差分・NW光（TERRAIN_FS と同族）。R90 テクセル≈20km なので係数は桁で弱める
		float dstep = u_elevBounds.w / float(textureSize(u_elevTex, 0).y);
		float hx = elevAt(ll + vec2(dstep, 0.0)) - e;
		float hy = elevAt(ll + vec2(0.0, dstep)) - e;
		float shade = clamp(0.86 + (-hx + hy) * 0.00013, 0.62, 1.08);
		if (u_cg.w > 0.5) shade = 1.0;   // 地面の照明（Cesium）＝陰影は lambert が受け持つ
		// 陸海の境：R90/GEBCO の海はクランプで厳密に 0＝閾は低く攻められる（0.5-30m だと華北平原・
		// 長江デルタ級の低平地が海色に沈む＝本人指摘 2026-08-30）。0.2→4m＝干拓地級だけ海側に残る
		// （蘭ポルダー等の 0m 以下はクランプで 0＝負値解禁（海の深度ランプ）とセットの将来課題）
		float landK = smoothstep(0.2, 4.0, e);
		vec3 hyp = mix(u_seaC, worldHypso(e, ll) * shade, landK);
		base = mix(base, hyp, u_whK);
	}
	// 床の不透明度（B5）＝u_land.a（background 層の無い MapLibre の地図＝0＝透明・頁の色が見える。全球ハイプソ・COG は不透明）。a=1 なら従来とビット同一
	float ba = mix(u_land.a, 1.0, u_whK);
	if (u_hasCog > 0.5) {   // ユーザ COG＝基球でも羽織る（地形パスは低地 t フェードで穴が開くためここが床）。uv＝原点相対の係数（#65）
		base = cogTexMix(base, u_cogOff.xy + dll * u_cogOff.zw); ba = 1.0;
	}
	vec4 g = vec4(base * ba, ba);   // 前乗算の床
	if (u_gndN > 0.5) {   // 地面アトラス＝基球の床（地形パスの低地 t フェードの穴と真俯瞰 2D の下地）。uv＝原点相対の係数（#65＝写真の床がズーム摂動で揺れない）
		g = gndOver(g, u_gndOff0.xy + dll * u_gndOff0.zw, u_gndOff1.xy + dll * u_gndOff1.zw, u_gndOff2.xy + dll * u_gndOff2.zw, u_gndOff3.xy + dll * u_gndOff3.zw);
	}
	if (u_gm.x > 0.5) {   // 地面の材質（Cesium の globe.material）＝球の床（低地の t フェードの穴と真俯瞰）にも地形面と同じ式で。標高が無い所は Cesium と同じく高さ 0 の色
		float e = 0.0; vec2 gEN = vec2(0.0);
		if (u_hasElev > 0.5) {
			e = elevAt(ll); float dstep = u_elevBounds.w / float(textureSize(u_elevTex, 0).y);
			gEN = vec2((elevAt(ll + vec2(dstep, 0.0)) - e) / (dstep * 111320.0 * max(cos(ll.y * 0.017453292519943295), 0.01)), (elevAt(ll + vec2(0.0, dstep)) - e) / (dstep * 111320.0));
		}
		vec4 m = gmColor(e, gEN, fwidth(e)); g = vec4(g.rgb * (1.0 - m.a) + m.rgb * m.a, max(g.a, m.a));
	}
	if (u_cg.w > 0.5) g.rgb *= u_cgC * cgLambert(ll, vec2(0.0), 2.0);   // 地面の照明（Cesium の globe.enableLighting）：遠景球は楕円体の上向きで（Cesium も法線の無い地形は位置の法線）
	vec3 viewDir = normalize(A - P);              // 面→カメラ
	float ndv = clamp(dot(P, viewDir), 0.0, 1.0);
	float haze = pow(1.0 - ndv, 3.0);             // 縁ほど強い内側リムの霞
	float hz = haze * u_atmo.a * 0.9;
	vec3 col = g.rgb * (1.0 - hz) + u_atmo.rgb * hz * g.a;   // ＝mix(base, atmo, hz) を前乗算で（a=1 で同値）
	if (u_csAtm.x > 0.5) {   // Cesium の地面の大気（遠くから）と霧（800 km より下・u_csAtm.w＝濃さ）＝従来の霞の代わり
		float night = u_cg.w > 0.5 ? u_cgP.w : -1.0;
		vec3 cs = csGroundL(g.rgb / max(g.a, 1e-4), A * CS_R, P * CS_R, u_csAtm.y, u_cg.xyz, night);
		col = csFogL(cs, A * CS_R, P * CS_R, u_csAtm.w, u_cg.xyz, night) * g.a;
	}
	if (ug) {   // 裏面：霞・大気は掛けない（面の裏から見る）＝床の色に undergroundColor を距離の α で重ねる（Cesium GlobeFS の alphaBlend）
		float k = clamp((t * sqrt(aa) - u_ugNF.x) / max(u_ugNF.z - u_ugNF.x, 1e-12), 0.0, 1.0);
		float ua = max(u_ugC.a, 0.0) * mix(u_ugNF.y, u_ugNF.w, k);   // α<0＝undergroundColor 無し（切った面の向こうの裏面＝u_gBack）
		col = u_ugC.rgb * ua * g.a + g.rgb * (1.0 - ua);
	}
	fragColor = vec4(col * u_globeAlpha, g.a * u_globeAlpha);   // 球体の不透明度（地中の震源等を透かす）
	if (u_gDepth > 0.0 && !ug && fragColor.a >= 0.5) gl_FragDepth = clamp(log2(1.0 + t) * u_gDepth, 0.0, 1.0);
	if (u_gBack > 0.5) {   // 球の裏面（Cesium の translucency の backFace）：手前の地面の色の穴（colorToAlpha）の向こう＝遠い根の床の画像を下に敷く（霞・照明なし）。標本は一様な分岐の中で
		float t2 = (-bb + sqrt(max(disc, 0.0))) / (2.0 * aa);
		vec2 dl2 = deltaLL(u_rayEO + t2 * d, u_ell);
		vec4 b2 = gndOver(vec4(u_land.rgb * u_land.a, u_land.a), u_gndOff0.xy + dl2 * u_gndOff0.zw, u_gndOff1.xy + dl2 * u_gndOff1.zw, u_gndOff2.xy + dl2 * u_gndOff2.zw, u_gndOff3.xy + dl2 * u_gndOff3.zw);
		if (!ug && t > 0.0 && disc >= 0.0 && t2 > t) fragColor += b2 * u_globeAlpha * (1.0 - fragColor.a);
	}
	// 球が透ける時（globe:false・translucency）は Cesium と同じく空の大気の殻が地面の向こうに見える（SkyAtmosphere は地面を知らない＝殻の奥の面）
	if (u_csAtm.x > 0.5 && u_csAtm.z > 0.5 && u_globeAlpha < 1.0) { vec4 cs = csSky2(A * CS_R, normalize(d), u_globeAlpha > 0.0 ? 2.0 : 1.0); fragColor += cs * (1.0 - fragColor.a); }
}`,sc=`#version 300 es
precision highp float;
// 全画面レイキャスト（#65・2026-09-27）：視線の基底は CPU f64（camera.js viewRays）＝invMvp（f32）の積和をしない。
// 交点は近い根を t＝2c/(−b＋√h)（c＝|E|²−1 は CPU f64）＝桁落ちなし。後ろ向き（q≤0）＝t<0。A＝目・d＝視線（clip w＝1 の長さ）
uniform vec3 u_rayF, u_rayX, u_rayY, u_rayE;
uniform float u_rayC;
uniform vec3 u_rayO, u_rayEO;   // 錨：シーン原点の β単位球の点 O・目−O（f64 で引く）＝交点 δ＝u_rayEO＋t·d（原点相対・f32 で mm 級）
uniform vec4 u_rayLL;           // (原点 lon, lat（deg・測地）, β0（rad）, cos β0)
vec3 rayDir(vec2 ndc) { return u_rayF + ndc.x * u_rayX + ndc.y * u_rayY; }
float sphereT(float bb, float disc) { if (disc < 0.0 || (bb >= 0.0 && u_rayC >= 0.0)) return -1.0; float q = -bb + sqrt(disc); return q > 0.0 ? 2.0 * u_rayC / q : -1.0; }   // 外から上向き（bb≥0）は前に交点なし：q＝−b＋√(b²−4c) は c≈0（目が地面すれすれ）で丸めの ±1ulp になり、実 GPU の sqrt では空の画素が地面に化けた（2026-10-28 Cesium 花火）
// δ から経緯度の差（deg・測地）を桁落ちなしで（wgsl.js deltaLL と同式）：δlon＝atan2(δz·Ox−δx·Oz, ρO²+δx·Ox+δz·Oz)・δβ は ρ の差も s/(ρP+ρO) で
vec2 deltaLL(vec3 dl, float ell) {
	vec3 O = u_rayO; float rhoO = u_rayLL.w, beta0 = u_rayLL.z;
	float dlon = atan(dl.z * O.x - dl.x * O.z, rhoO * rhoO + dl.x * O.x + dl.z * O.z);
	float s = 2.0 * (O.x * dl.x + O.z * dl.z) + dl.x * dl.x + dl.z * dl.z;
	float rhoP = sqrt(max(rhoO * rhoO + s, 0.0));
	float drho = s / max(rhoP + rhoO, 1e-12);
	float dbeta = atan(dl.y * rhoO - drho * O.y, rhoP * rhoO + (O.y + dl.y) * O.y);
	float b1 = beta0 + dbeta;
	float corr = ell * (0.0016792203863837047 * (sin(2.0 * b1) - sin(2.0 * beta0)) + 0.0000014098905530233192 * (sin(4.0 * b1) - sin(4.0 * beta0)));
	return vec2(dlon, dbeta + corr) * 57.29577951308232;
}
uniform vec4 u_land;
uniform vec4 u_atmo;
uniform vec3 u_whDeep;   // 海面下の締め（乗算ティント既定 [0.84,0.92,0.82]＝worldpal.js）。globe側の式には非関与
uniform sampler2D u_elevTex;
uniform vec4 u_elevBounds;
uniform float u_ell;
in vec2 v_ndc;
out vec4 fragColor;
const float R2D = 57.29577951308232;
// far床＝近窓の外を受ける第2アトラス（世界帯z<8はR90全球固定窓＝terrain.jsのB形態）。
// R90/R10境界5.5化で「近窓=全球」の前提が崩れ、窓外の陸が標高0＝海色に抜けた（スカンジナビア/シベリア
// 実測 9/2＝本人発見「タイラーのバグ」）。terrain elev() と同じフォールバック＝カバーの床。
uniform sampler2D u_farElevTex;
uniform vec4 u_farBounds;
uniform float u_hasFar;
uniform float u_elevEdgeFade;   // 近窓縁＝far値へ溶かす幅(deg)。R90全球窓=0（縁は極/±180のみ）
float elevFar(vec2 ll) {
	if (u_hasFar < 0.5) return 0.0;
	ll.x -= 360.0 * floor((ll.x + 180.0) / 360.0);   // 経度を -180..180 へ（原点相対の経度は ±180 を越えうる）
	vec2 uv = (ll - u_farBounds.xy) / u_farBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	return texture(u_farElevTex, uv).r;
}
float elevUV(vec2 uv, vec2 ll) {   // uv＝原点相対で作った近窓の uv（#65）・ll＝far 床の受け（粗くて可）
	if (u_elevBounds.z > 359.0) uv.x = fract(uv.x);   // 全球の窓（R90）は経度が一周＝原点から 180° 超回った先の uv を折り返す（gpu/wgsl.js gElevUV と同じ・2026-10-01）
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return elevFar(ll);
	float fade = 1.0;
	if (u_elevEdgeFade > 0.0) {
		vec2 w = vec2(u_elevEdgeFade) / u_elevBounds.zw;
		fade = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return mix(elevFar(ll), texture(u_elevTex, uv).r, fade);
}
float elevAt(vec2 ll) { return elevUV((ll - u_elevBounds.xy) / u_elevBounds.zw, ll); }
${un}
${ai}
uniform vec4 u_elevOff;   // 近窓の標高 uv 係数（f64 前計算・#65）＝(原点の uv, 1/span)
uniform vec4  u_cg;          // 地面の照明（setGroundLighting・Cesium の globe.enableLighting・2026-10-26）：xyz＝光へ向く単位ベクトル（世界）・w＝0 無し／1 地形の法線／2 楕円体の上向き
uniform vec4  u_cgP;         // (lambert の倍率, 足す値, 効き 0..1＝距離のフェード済み, 大気の夜側の明るさ 0.05..1・負＝暗くしない)
uniform vec3  u_cgC;         // 光の色（czm_lightColor）
// 経緯度（deg）の点の東・北・上（世界軸＝ECEF の (x, z, y)）での lambert：n＝勾配（東・北・m/m）から、mode 2 は上向き
float cgLambert(vec2 ll, vec2 gEN, float mode) {
	vec2 lr = ll * 0.017453292519943295;
	float cl = cos(lr.y), sl = sin(lr.y), co = cos(lr.x), so = sin(lr.x);
	vec3 L = vec3(dot(u_cg.xyz, vec3(-so, 0.0, co)), dot(u_cg.xyz, vec3(-sl * co, cl, -sl * so)), dot(u_cg.xyz, vec3(cl * co, sl, cl * so)));   // 東・北・上
	vec3 n = mode > 1.5 ? vec3(0.0, 0.0, 1.0) : normalize(vec3(-gEN, 1.0));
	float diff = clamp(max(dot(n, L), 0.0) * u_cgP.x + u_cgP.y, 0.0, 1.0);
	return mix(1.0, diff, u_cgP.z);
}
uniform float u_globeAlpha;   // 球体の不透明度（表示パネル「基図」を globe/terrain まで拡張＝本人裁定 2026-09-13。1=不透明・premultiplied なので rgb にも掛ける）
void main() {
	vec3 A = u_rayE, d = rayDir(v_ndc);   // #65：視線は CPU f64 の基底
	float aa = dot(d, d), bb = 2.0 * dot(A, d), cc = u_rayC;
	float disc = bb * bb - 4.0 * aa * cc;
	float t = sphereT(bb, disc);   // 球ミス・後ろ向き＝−1
	if (t < 0.0) discard;
	vec3 P = A + t * d;
	vec2 dll = deltaLL(u_rayEO + t * d, u_ell);   // 原点相対（#65）
	vec2 ll = u_rayLL.xy + dll;
	vec2 uv = u_elevOff.xy + dll * u_elevOff.zw;
	float e = elevUV(uv, ll);
	float dstep = u_elevBounds.w / float(textureSize(u_elevTex, 0).y);
	float hx = elevUV(uv + vec2(dstep * u_elevOff.z, 0.0), ll + vec2(dstep, 0.0)) - e;
	float hy = elevUV(uv + vec2(0.0, dstep * u_elevOff.w), ll + vec2(0.0, dstep)) - e;
	float shade = clamp(0.86 + (-hx + hy) * 0.00013, 0.62, 1.08);
	// 以降は GLOBE_FS の末尾と厳密同式（landK=1 だけが違い）：紙とのwhK混合も大気ヘイズも同じに通し、
	// α=1 の不透明で置く＝ポリゴン境界の e≳4m では画素値が globe と bit 一致し縁が完全に消える。
	vec3 hyp = worldHypso(e, ll) * shade;   // landK=1 強制＝「陸」の上塗り（海色ゲート・虫食いの根治）
	// 海面下の締め（NE流「最深帯」）：0→-60m で僅かに暗く・緑側へ。気候によらず効く＝湿潤は深緑・乾燥はオリーブ
	//（landK=1 だけだと乾燥帯の海面下がランプ差僅少でほぼ消える＝カッタラ/デスバレーが読めなくなる対策）
	hyp = mix(hyp, hyp * u_whDeep, clamp(-e / 60.0, 0.0, 1.0));
	vec3 base = mix(u_land.rgb, hyp, u_whK);
	vec3 viewDir = normalize(A - P);
	float ndv = clamp(dot(P, viewDir), 0.0, 1.0);
	float haze = pow(1.0 - ndv, 3.0);
	fragColor = vec4(mix(base, u_atmo.rgb, haze * u_atmo.a * 0.9) * u_globeAlpha, u_globeAlpha);   // 球体の不透明度に従う
}`,_c=`#version 300 es
precision highp float;
// 全画面レイキャスト（#65・2026-09-27）：視線の基底は CPU f64（camera.js viewRays）＝invMvp（f32）の積和をしない。
// 交点は近い根を t＝2c/(−b＋√h)（c＝|E|²−1 は CPU f64）＝桁落ちなし。後ろ向き（q≤0）＝t<0。A＝目・d＝視線（clip w＝1 の長さ）
uniform vec3 u_rayF, u_rayX, u_rayY, u_rayE;
uniform float u_rayC;
uniform vec3 u_rayO, u_rayEO;   // 錨：シーン原点の β単位球の点 O・目−O（f64 で引く）＝交点 δ＝u_rayEO＋t·d（原点相対・f32 で mm 級）
uniform vec4 u_rayLL;           // (原点 lon, lat（deg・測地）, β0（rad）, cos β0)
vec3 rayDir(vec2 ndc) { return u_rayF + ndc.x * u_rayX + ndc.y * u_rayY; }
float sphereT(float bb, float disc) { if (disc < 0.0 || (bb >= 0.0 && u_rayC >= 0.0)) return -1.0; float q = -bb + sqrt(disc); return q > 0.0 ? 2.0 * u_rayC / q : -1.0; }   // 外から上向き（bb≥0）は前に交点なし：q＝−b＋√(b²−4c) は c≈0（目が地面すれすれ）で丸めの ±1ulp になり、実 GPU の sqrt では空の画素が地面に化けた（2026-10-28 Cesium 花火）
// δ から経緯度の差（deg・測地）を桁落ちなしで（wgsl.js deltaLL と同式）：δlon＝atan2(δz·Ox−δx·Oz, ρO²+δx·Ox+δz·Oz)・δβ は ρ の差も s/(ρP+ρO) で
vec2 deltaLL(vec3 dl, float ell) {
	vec3 O = u_rayO; float rhoO = u_rayLL.w, beta0 = u_rayLL.z;
	float dlon = atan(dl.z * O.x - dl.x * O.z, rhoO * rhoO + dl.x * O.x + dl.z * O.z);
	float s = 2.0 * (O.x * dl.x + O.z * dl.z) + dl.x * dl.x + dl.z * dl.z;
	float rhoP = sqrt(max(rhoO * rhoO + s, 0.0));
	float drho = s / max(rhoP + rhoO, 1e-12);
	float dbeta = atan(dl.y * rhoO - drho * O.y, rhoP * rhoO + (O.y + dl.y) * O.y);
	float b1 = beta0 + dbeta;
	float corr = ell * (0.0016792203863837047 * (sin(2.0 * b1) - sin(2.0 * beta0)) + 0.0000014098905530233192 * (sin(4.0 * b1) - sin(4.0 * beta0)));
	return vec2(dlon, dbeta + corr) * 57.29577951308232;
}
uniform float u_ell;
uniform float u_alpha;   // 出現度（ズーム帯フェード×基礎アルファ）。0=不可視（呼び側でドロー自体を省略）
uniform vec4 u_gratC;    // レチクル色 rgb＋α係数（テーマノブ grat。既定 [1,1,1,1]＝従来の白）
in vec2 v_ndc;
out vec4 fragColor;
const float R2D = 57.29577951308232;
void main() {
	vec3 A = u_rayE, d = rayDir(v_ndc);   // #65：視線は CPU f64 の基底
	float aa = dot(d, d), bb = 2.0 * dot(A, d), cc = u_rayC;
	float disc = bb * bb - 4.0 * aa * cc;
	float t = sphereT(bb, disc);   // 球ミス・後ろ向き＝−1
	if (t < 0.0) discard;
	vec3 P = A + t * d;
	float bl = asin(clamp(P.y, -1.0, 1.0));
	float latD = bl * R2D + u_ell * (0.0016792203863837047 * sin(2.0 * bl) + 0.0000014098905530233192 * sin(4.0 * bl)) * R2D;
	vec2 ll = vec2(atan(P.z, P.x) * R2D, latD);
	// 10°格子への距離(度)：±180 の折返しは 180 が格子線そのもの＝fract パターンは連続で無害。
	// 線＝画素距離 g/fwidth のスムーズステップ（≈0.7px・0.5px AA＝v1 geoPath の細線）。
	// ×度距離の上限ゲート＝極（経線収束）と atan 継ぎ目で fwidth が爆発して線が面に化けるのを防ぐ。
	vec2 fw = max(fwidth(ll), vec2(1e-6));
	vec2 g10 = abs(fract(ll / 10.0 + 0.5) - 0.5) * 10.0;
	float mer = (1.0 - smoothstep(0.25, 0.75, g10.x / fw.x)) * (1.0 - smoothstep(0.8, 1.6, g10.x));
	float par = (1.0 - smoothstep(0.25, 0.75, g10.y / fw.y)) * (1.0 - smoothstep(0.8, 1.6, g10.y)) * step(abs(latD), 80.0);   // 緯線は ±80 まで
	float in80 = step(abs(latD), 80.0);
	float g90 = abs(fract(ll.x / 90.0 + 0.5) - 0.5) * 90.0;
	float mer90 = (1.0 - smoothstep(0.25, 0.75, g90 / fw.x)) * (1.0 - smoothstep(0.8, 1.6, g90));
	mer = mer * in80 + mer90 * (1.0 - in80);   // 経線＝±80 までは10°毎・その先(極冠)は90°毎だけ極まで
	float a = max(mer, par) * u_alpha * u_gratC.a;
	if (a <= 0.003) discard;
	fragColor = vec4(u_gratC.rgb * a, a);   // premultiplied（既定=白＝v1 の rgba(255,255,255,α) と同族）
}`,pa=`#version 300 es
precision highp float;
layout(location=0) in vec3 a_cel;    // 天球単位ベクトル（RA/Dec 焼き込み・歳差は装飾精度で無視）
layout(location=1) in vec4 a_col;    // rgb（B-V色）+ 基礎alpha（等級由来）
layout(location=2) in float a_size;  // 点直径(device px)
uniform mat4 u_mvp;
uniform vec2 u_gmst;   // (cos, sin)
uniform float u_fade;  // z4→z3.5 のフェードイン
uniform float u_sky;   // 遠近表現（v1の sr=対角×(0.4+0.3z) の移植）：天球の拡大はズームに線形＝地球(2^z)より
                       // ずっと緩やか＝ズームインで地球だけが近づき星空は奥に留まる。画面中心まわりのNDCスケール。
out vec4 v_col;
void main() {
	vec3 d = vec3(a_cel.x * u_gmst.x + a_cel.z * u_gmst.y, a_cel.y, a_cel.z * u_gmst.x - a_cel.x * u_gmst.y);
	vec4 p = u_mvp * vec4(d, 0.0);
	gl_Position = vec4(p.xy * u_sky, 0.0, p.w);   // w<0（背後）は自然にクリップ
	gl_PointSize = a_size;
	v_col = vec4(a_col.rgb, a_col.a * u_fade);
}`,dc=`#version 300 es
precision highp float;
in vec4 v_col;
out vec4 fragColor;
void main() {
	float r = length(gl_PointCoord - 0.5) * 2.0;
	float a = v_col.a * smoothstep(1.0, 0.3, r);   // 柔らかい円盤＝回転中のシマーを抑える
	fragColor = vec4(v_col.rgb * a, a);            // premultiplied
}`,vc=`#version 300 es
precision highp float;
in vec4 v_col;
out vec4 fragColor;
void main() { fragColor = vec4(v_col.rgb * v_col.a, v_col.a); }`,mc=`#version 300 es
precision highp float;
// 全画面レイキャスト（#65・2026-09-27）：視線の基底は CPU f64（camera.js viewRays）＝invMvp（f32）の積和をしない。
// 交点は近い根を t＝2c/(−b＋√h)（c＝|E|²−1 は CPU f64）＝桁落ちなし。後ろ向き（q≤0）＝t<0。A＝目・d＝視線（clip w＝1 の長さ）
uniform vec3 u_rayF, u_rayX, u_rayY, u_rayE;
uniform float u_rayC;
uniform vec3 u_rayO, u_rayEO;   // 錨：シーン原点の β単位球の点 O・目−O（f64 で引く）＝交点 δ＝u_rayEO＋t·d（原点相対・f32 で mm 級）
uniform vec4 u_rayLL;           // (原点 lon, lat（deg・測地）, β0（rad）, cos β0)
vec3 rayDir(vec2 ndc) { return u_rayF + ndc.x * u_rayX + ndc.y * u_rayY; }
float sphereT(float bb, float disc) { if (disc < 0.0 || (bb >= 0.0 && u_rayC >= 0.0)) return -1.0; float q = -bb + sqrt(disc); return q > 0.0 ? 2.0 * u_rayC / q : -1.0; }   // 外から上向き（bb≥0）は前に交点なし：q＝−b＋√(b²−4c) は c≈0（目が地面すれすれ）で丸めの ±1ulp になり、実 GPU の sqrt では空の画素が地面に化けた（2026-10-28 Cesium 花火）
// δ から経緯度の差（deg・測地）を桁落ちなしで（wgsl.js deltaLL と同式）：δlon＝atan2(δz·Ox−δx·Oz, ρO²+δx·Ox+δz·Oz)・δβ は ρ の差も s/(ρP+ρO) で
vec2 deltaLL(vec3 dl, float ell) {
	vec3 O = u_rayO; float rhoO = u_rayLL.w, beta0 = u_rayLL.z;
	float dlon = atan(dl.z * O.x - dl.x * O.z, rhoO * rhoO + dl.x * O.x + dl.z * O.z);
	float s = 2.0 * (O.x * dl.x + O.z * dl.z) + dl.x * dl.x + dl.z * dl.z;
	float rhoP = sqrt(max(rhoO * rhoO + s, 0.0));
	float drho = s / max(rhoP + rhoO, 1e-12);
	float dbeta = atan(dl.y * rhoO - drho * O.y, rhoP * rhoO + (O.y + dl.y) * O.y);
	float b1 = beta0 + dbeta;
	float corr = ell * (0.0016792203863837047 * (sin(2.0 * b1) - sin(2.0 * beta0)) + 0.0000014098905530233192 * (sin(4.0 * b1) - sin(4.0 * beta0)));
	return vec2(dlon, dbeta + corr) * 57.29577951308232;
}
uniform vec3 u_sun;     // 太陽方向（地球固定・単位ベクトル）
uniform float u_alpha;  // 夜面の濃さ（星空と同じ z4→3.5 フェード込み）
in vec2 v_ndc;
out vec4 fragColor;
void main() {
	vec3 A = u_rayE, d = rayDir(v_ndc);   // #65：視線は CPU f64 の基底
	float aa = dot(d, d), bb = 2.0 * dot(A, d), cc = u_rayC;
	float disc = bb * bb - 4.0 * aa * cc;
	float t = sphereT(bb, disc);   // 球ミス・後ろ向き＝−1
	if (t < 0.0) discard;
	vec3 P = A + t * d;
	float night = smoothstep(0.08, -0.18, dot(P, u_sun));
	float a = night * u_alpha;
	if (a <= 0.001) discard;
	fragColor = vec4(vec3(0.0, 0.02, 0.078) * a, a);   // v1 rgba(0,5,20,0.5) の夜紺（premultiplied）
}`,xc=`#version 300 es
precision highp float;
// 全画面レイキャスト（#65・2026-09-27）：視線の基底は CPU f64（camera.js viewRays）＝invMvp（f32）の積和をしない。
// 交点は近い根を t＝2c/(−b＋√h)（c＝|E|²−1 は CPU f64）＝桁落ちなし。後ろ向き（q≤0）＝t<0。A＝目・d＝視線（clip w＝1 の長さ）
uniform vec3 u_rayF, u_rayX, u_rayY, u_rayE;
uniform float u_rayC;
uniform vec3 u_rayO, u_rayEO;   // 錨：シーン原点の β単位球の点 O・目−O（f64 で引く）＝交点 δ＝u_rayEO＋t·d（原点相対・f32 で mm 級）
uniform vec4 u_rayLL;           // (原点 lon, lat（deg・測地）, β0（rad）, cos β0)
vec3 rayDir(vec2 ndc) { return u_rayF + ndc.x * u_rayX + ndc.y * u_rayY; }
float sphereT(float bb, float disc) { if (disc < 0.0 || (bb >= 0.0 && u_rayC >= 0.0)) return -1.0; float q = -bb + sqrt(disc); return q > 0.0 ? 2.0 * u_rayC / q : -1.0; }   // 外から上向き（bb≥0）は前に交点なし：q＝−b＋√(b²−4c) は c≈0（目が地面すれすれ）で丸めの ±1ulp になり、実 GPU の sqrt では空の画素が地面に化けた（2026-10-28 Cesium 花火）
// δ から経緯度の差（deg・測地）を桁落ちなしで（wgsl.js deltaLL と同式）：δlon＝atan2(δz·Ox−δx·Oz, ρO²+δx·Ox+δz·Oz)・δβ は ρ の差も s/(ρP+ρO) で
vec2 deltaLL(vec3 dl, float ell) {
	vec3 O = u_rayO; float rhoO = u_rayLL.w, beta0 = u_rayLL.z;
	float dlon = atan(dl.z * O.x - dl.x * O.z, rhoO * rhoO + dl.x * O.x + dl.z * O.z);
	float s = 2.0 * (O.x * dl.x + O.z * dl.z) + dl.x * dl.x + dl.z * dl.z;
	float rhoP = sqrt(max(rhoO * rhoO + s, 0.0));
	float drho = s / max(rhoP + rhoO, 1e-12);
	float dbeta = atan(dl.y * rhoO - drho * O.y, rhoP * rhoO + (O.y + dl.y) * O.y);
	float b1 = beta0 + dbeta;
	float corr = ell * (0.0016792203863837047 * (sin(2.0 * b1) - sin(2.0 * beta0)) + 0.0000014098905530233192 * (sin(4.0 * b1) - sin(4.0 * beta0)));
	return vec2(dlon, dbeta + corr) * 57.29577951308232;
}
uniform sampler2D u_elevTex;
uniform vec4 u_elevBounds;   // originLng, originLat, spanLng, spanLat（deg）
uniform float u_hasElev;     // 0/1
uniform float u_interval;    // 主曲線間隔(m)
uniform float u_major;       // 計曲線間隔(m)
uniform float u_alpha;       // 全体の濃さ（pitch で 0 へフェード）
uniform vec3 u_cColor;       // 茶(セピア)
uniform float u_ell;         // 1=楕円体（レイ交点の asin=β → 測地緯度へ復元して elev を引く。球=0＝恒等）
in vec2 v_ndc;
out vec4 fragColor;
const float R2D = 57.29577951308232;
uniform vec4 u_elevOff;      // 標高 uv 係数（f64 前計算・#65）＝(原点の uv, 1/span)：uv＝off＋δll·inv
float elevAt(vec2 uv) {      // uv＝原点相対で作る（絶対経緯度を経ない）
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	return texture(u_elevTex, uv).r;
}
float band(float g) {                                   // iso線：整数の g で 1、離れると 0（fwidth で画面一定幅・AA）
	float dd = abs(fract(g + 0.5) - 0.5);
	float fw = fwidth(g);
	float w = fw * 0.5 + 1e-5;                          // 係数＝線の細さ（細すぎるとサブピクセルで破線化＝汚い）
	// 勾配ゼロ抑制：整数m量子化の平坦な街区が等高線値ちょうどに乗ると面ごと点火する（都市部の薄茶四角）。
	// 紙の地形図の作法どおり「平坦地に等高線の面は無い」＝勾配が消える所では線も消す（1e-4 g≈3mm/px相当）。
	return (1.0 - smoothstep(0.0, w, dd)) * smoothstep(0.0, 1e-4, fw);
}
void main() {
	if (u_alpha <= 0.002 || u_hasElev < 0.5) discard;
	vec3 A = u_rayE, d = rayDir(v_ndc);   // #65：視線は CPU f64 の基底
	float aa = dot(d, d), bb = 2.0 * dot(A, d), cc = u_rayC;
	float disc = bb * bb - 4.0 * aa * cc;
	float t = sphereT(bb, disc);   // 球ミス・後ろ向き＝−1
	if (t < 0.0) discard;
	vec2 dll = deltaLL(u_rayEO + t * d, u_ell);         // 交点＝原点相対 δ → 経緯度の差（deg・測地）（#65）
	float e = elevAt(u_elevOff.xy + dll * u_elevOff.zw);
	float landMask = smoothstep(0.5, 4.0, e);           // 海/データ無し(≈0)は等高線を出さない
	if (landMask <= 0.0) discard;
	float line = max(band(e / u_interval) * 0.2, band(e / u_major) * 0.4);   // さらに淡く（主曲線ごく薄・計曲線も薄め）
	float a = line * landMask * u_alpha;
	if (a <= 0.003) discard;
	fragColor = vec4(u_cColor * a, a);                  // premultiplied
}`,Ga=`
uniform vec4 u_tr;
vec2 trLL(vec2 ll) { return vec2(u_tr.x / max(cos(ll.y * 0.017453293), 1e-3), -u_tr.y) * u_tr.z; }
uniform vec4 u_pz;    // ズーム連続（V-Ph3＝S-P1-2・paintzoom.ts）＝x 色を差し替える（1）・y 線幅を差し替える（1）・z 半幅（CSS px）・w floor(z) の半幅（破線の尺）。0＝頂点の値
uniform vec4 u_pzC;   // 差し替える色（RGBA・不透明度を掛けた値）`,fn=`
uniform float u_pt;
uniform highp sampler2D u_ptTex;
vec4 ptColor(int r) { int w = textureSize(u_ptTex, 0).x, t = r * 2; return texelFetch(u_ptTex, ivec2(t % w, t / w), 0); }
float ptHalf(int r) { int w = textureSize(u_ptTex, 0).x, t = r * 2 + 1; return texelFetch(u_ptTex, ivec2(t % w, t / w), 0).x; }   // 線の半幅（u_pt＝2 の列・段 2b）
int ptRowOf(vec4 c) { return int(c.r * 255.0 + 0.5) + int(c.g * 255.0 + 0.5) * 256; }`,Qr=`#version 300 es
precision highp float;
in vec2 a_delta;
in vec4 a_color;
${bt}
out vec4 v_color;
out float v_front;
out float v_fog;
out vec2 v_ll;    // 絶対 lon/lat(deg)＝FS 標高ゲート（u_seaGate）用
${Ga}
uniform float u_patK;   // fill-pattern（S-P1-4/5）＝floor(z) の世界（256px）の 1 度の px（経度）。0＝模様なし
out vec2 v_pat;         // 模様の px（原点からの差＝メルカトルの px・縦は中ほどの緯度の cos で割る）
uniform vec4 u_cogOffInv;   // COG uv＝off+dLL×inv（off=(origin−west)/span を JS f64 前計算＝f32 ジッタ回避）
out vec2 v_cuv;
uniform vec4 u_gndOffInv0;  // 地面アトラス（前景/近/中/遠）＝同じ変換
uniform vec4 u_gndOffInv1;
uniform vec4 u_gndOffInv2;
uniform vec4 u_gndOffInv3;
out vec2 v_guv0;
out vec2 v_guv1;
out vec2 v_guv2;
out vec2 v_guv3;
void main() {
	vec2 dLL = a_delta;                       // 原点相対 (deg)。multidraw は mdize が u_tileOff を足す
	dLL += trLL(u_origin + dLL);              // fill-translate（S-P1-4/5）
	v_pat = vec2(dLL.x, -dLL.y / cos((u_origin.y + dLL.y * 0.5) * 0.017453293)) * u_patK;
	vec2 ll = u_origin + dLL;                  // elev 参照用の絶対（粗くて可）
	v_ll = ll;
	v_cuv = u_cogOffInv.xy + dLL * u_cogOffInv.zw;
	v_guv0 = u_gndOffInv0.xy + dLL * u_gndOffInv0.zw;
	v_guv1 = u_gndOffInv1.xy + dLL * u_gndOffInv1.zw;
	v_guv2 = u_gndOffInv2.xy + dLL * u_gndOffInv2.zw;
	v_guv3 = u_gndOffInv3.xy + dLL * u_gndOffInv3.zw;
	vec3 rel = deltaToRel(dLL);               // 頂点3D − 原点3D（小・正確）
	vec3 dir = u_originPt + rel;              // 絶対単位球点（front/fog 用＝粗くて可）
	v_color = u_pz.x > 0.5 ? u_pzC : a_color;   // ズーム連続の色（V-Ph3＝S-P1-2）
	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;          // >0 で手前半球（cull＝粗くて可）
	v_fog = fogOf(dir);
	gl_Position = u_clipT + u_mvp * vec4(rel, 0.0);   // RTE：mvp*[w,1] を相殺なしで（海抜0の球面）
	applyLogDepth();   // 深度テストOFF（2D）では無害
}`,Yo=`#version 300 es
precision highp float;
uniform vec3 u_fogColor;
uniform float u_seaGate;      // 1＝図郭外フォールバック水域：標高が陸(h>0)の画素は塗らない
                              // ＝「水域は地理院・陸は標高(GEBCO/R10)」の管轄裁定を画素単位で行う
${ii}
${ai}
${ln}
in vec2 v_guv0;
in vec2 v_guv1;
in vec2 v_guv2;
in vec2 v_guv3;
uniform float u_baseAlpha;   // 基図の濃さ（表示パネルのスライダー）。COG は下層（globe/terrain）にも合成済み＝紙と線だけが引く
in vec2 v_cuv;
in vec4 v_color;
in float v_front;
in float v_fog;
in vec2 v_ll;
in vec2 v_pat;
uniform sampler2D u_patTex;   // fill-pattern（S-P1-4/5）＝記号帳の画像 1 枚（REPEAT）
uniform vec4 u_patP;          // (原点の模様の位相 x, y（px）, 1/幅, 1/高さ（px＝画像の px÷pixelRatio）)。z＝0 で模様なし
out vec4 fragColor;
void main() {
	if (v_front < -0.0015) discard;         // 裏半球は描かない（接線に標高許容＝地平線に頭を出す山上の塗りも描く）
	if (u_seaGate > 0.5 && elev(v_ll) > 0.0) discard;   // 図郭外＝陸は塗り残す（紙色+等高線に委ねる）
	// 霧はフェードアウト（透明化）：紙色で塗り潰すと、地平線の先＝球に隠れるべき塗りが空に不透明で浮く。
	// 1.2倍＝霧83%で完全消滅：地形の霞（fog=1で紙色の帯）より一歩先に消え、暗い空に尻尾が残らない
	float af = v_color.a * clamp(1.0 - 1.2 * v_fog, 0.0, 1.0) * u_baseAlpha;
	vec3 rgb = v_color.rgb;
	if (u_patP.z > 0.0) {   // 模様＝画像の色と α（MapLibre と同じく fill-color は読まない・fill-opacity は掛ける）。画像は前乗算で届く
		vec4 t = texture(u_patTex, fract((u_patP.xy + v_pat) * u_patP.zw));
		af *= t.a; rgb = t.a > 0.0 ? t.rgb / t.a : vec3(0.0);
	}
	if (af <= 0.003) discard;
	fragColor = vec4(mix(gndMix(cogTexMix(rgb, v_cuv), v_guv0, v_guv1, v_guv2, v_guv3), u_fogColor, v_fog) * af, af);  // premultiplied・ユーザCOG／地面アトラス（2D のラスタ重ね）＝塗りの上・線/建物/ラベルの下
}`,Va=`${Ga}
uniform vec2 u_blur;      // line-blur（画素）・circle-blur（y＝1：半径の割合）＝縁から内へ薄める（S-P1-4/5）。x＝0 でぼかさない
uniform vec4 u_dashP;     // 破線（S-P1-3）＝(周期 P, 線の区間の数（0＝破線でない）, 丸い端 1／0, floor(zoom) の px ÷ z24 の px)
uniform vec4 u_dashI[2];  // 線の区間 [a, b]×4（線幅の倍数・scene.ts の dashIntervals）
uniform vec2 u_pzO;       // ズーム連続のずらし（paintzoom.ts）＝x 差し替える（1）・y 今の z のずらし（CSS px）。0＝頂点の値
uniform vec4 u_lt;        // 線の色の見本（G-3）＝x 1＝line-gradient（色の語は線分の始点・終点の進み unorm16×2・色は u_ltTex を画素の進みで引く）。0＝色の語が色
                          // x 2＝line-pattern（G-4）＝u_ltTex は模様の画像（前乗算）・y＝破線と同じ尺（floor(zoom) の px ÷ z24 の px）・z＝層の line-opacity`,Wa=`${Va}
uniform float u_lift;   // 接地リフト(m)。都市帯（深度テスト×DTM起伏）で線を地形メッシュ面の上へ逃がす（fill の u_lift と同意味論）。負＝深度だけ（位置は地面・LINE_MAIN）
uniform float u_cj;     // 端と継ぎ（S-P1-1）＝cap | join<<2 | round(miter-limit×8)<<4（build.ts の lineCapJoin）。0＝丸い端と丸い継ぎ＝p0/p3/jf0 を読まない（従来の capsule）
flat out vec2 v_a;
flat out vec2 v_b;
flat out float v_half;
flat out vec4 v_ja;     // 端 A の継ぎの切り口（二等分線）：点 xy・線分の側を向く法線 zw
flat out vec4 v_jb;     // 端 B の同じ物
flat out vec4 v_jk;     // 端の形 x＝A・y＝B（0 丸＝capsule・1 butt・2 square・3 miter・4 bevel・5 丸い継ぎ）・zw＝bevel の切り線の距離（符号＝外側の向き）
flat out vec2 v_dd;     // 破線：始点の位相・線分の長さ（線幅の倍数）
flat out vec2 v_gp;     // line-gradient（G-3）：始点・終点の進み（0..1）
out vec2 v_pos;
out vec4 v_color;
out float v_front;
out float v_fog;
// 継ぎの 3 点を画面へ（高さは継ぎ目の高さで揃える＝継ぎ目を共有する 2 本の線分が同じ値を得る）
vec2 jScr(vec2 o, vec2 p, float h, inout float ok) {
	vec3 rel = deltaToRel(p);
	vec4 c = u_clipT + u_mvp * vec4(rel + h * liftDir(o + p, u_originPt + rel), 0.0);
	if (c.w <= 0.0) ok = 0.0;
	return toScreen(c);
}
// lineGroundW：太い線の四隅の深度＝その画素の下の地面（端点の接平面）の深さ（2026-11-06 本人報告「傾けた高速道路の縁がギザギザ」）。
// 四角形は画面で幅付けするので、端点の深度を四隅にそのまま使うと手前側の縁は「端点より奥」になる＝地形の深度テストに
// 食われ、地形メッシュの三角形ごとに食われ方が変わって縁が波打つ。接平面上の 2 方向へ少し動かした点を投影して
// 画面のずれ off を接平面のずれへ戻し（2×2 の一次近似）、clip w の差を足す。手前へ寄せるだけ（奥へは押さない）＝奥の縁は従来どおり。
float lineGroundW(vec3 relW, vec2 ll, vec3 dAbs, vec4 c, vec2 off) {
	vec3 up = normalize(liftDir(ll, dAbs));
	vec3 t1 = normalize(cross(up, abs(up.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
	vec3 t2 = cross(up, t1);
	float e = 0.01 * wTrue(c.w);   // 視点からの距離の 1%＝ズームに依らず数〜数十 px のずれ
	vec4 c1 = u_clipT + u_mvp * vec4(relW + e * t1, 0.0), c2 = u_clipT + u_mvp * vec4(relW + e * t2, 0.0);
	if (c1.w <= 0.0 || c2.w <= 0.0) return c.w;
	vec2 s0 = toScreen(c), d1 = toScreen(c1) - s0, d2 = toScreen(c2) - s0;
	float det = d1.x * d2.y - d1.y * d2.x;
	if (abs(det) < 1e-3) return c.w;   // 接平面が画面に真横（地平線）＝寄せない
	float a = (off.x * d2.y - off.y * d2.x) / det, b = (d1.x * off.y - d1.y * off.x) / det;
	return max(c.w + min(a * (c1.w - c.w) + b * (c2.w - c.w), 0.0), c.w * 0.5);
}
// 端 1 つの形（MapLibre の LineBucket と同じ選び方）。x→jt→y＝前の点・この端・次の点（start＝始点の端）。
// link＝0：端（line-cap）・1：隣と継ぐ・2：閉じた環の継ぎ目（隣が並びの前後に無い＝丸に倒す）。
// 継ぎは二等分線で切る：j＝切り口（点・線分の側を向く法線）・bev＝bevel の切り線・ext＝四角形を端から伸ばす長さ
float lineEnd(vec2 o, vec2 x, vec2 jt, vec2 y, float h, float hp, bool start, float link, out vec4 j, out float bev, out float ext) {
	float capK = mod(u_cj, 4.0), joinK = mod(floor(u_cj / 4.0), 4.0), ml = floor(u_cj / 16.0) / 8.0;
	j = vec4(0.0); bev = 0.0; ext = hp + 1.0;
	if (link == 0.0) {   // 端
		if (capK == 1.0) { ext = 1.0; return 1.0; }   // butt＝端で切る（AA の 1px だけ伸ばす）
		return capK == 2.0 ? 2.0 : 0.0;
	}
	if (link == 2.0) return 0.0;
	float ok = 1.0;
	vec2 sx = jScr(o, x, h, ok), sj = jScr(o, jt, h, ok), sy = jScr(o, y, h, ok);
	vec2 d0 = sj - sx, d1 = sy - sj;
	float l0 = length(d0), l1 = length(d1);
	if (ok < 0.5 || l0 < 1e-4 || l1 < 1e-4) return 0.0;   // カメラの背後・画面で長さ 0＝丸（capsule）に倒す
	d0 /= l0; d1 /= l1;
	vec2 s = d0 + d1; float ls = length(s);
	if (ls < 1e-3) return 0.0;   // 折り返し（180°）＝丸に倒す
	vec2 n = s / ls;             // 二等分線の法線（前→次の向き）
	vec2 N = start ? n : -n;     // 線分の側を向く
	j = vec4(sj, N);
	if (joinK == 0.0) return 5.0;
	float c = dot(n, d1), mlen = 1.0 / max(c, 1e-6);   // 曲がりの半角の cos・マイターの長さ（半幅の何倍）
	bev = sign(dot(d0 - d1, vec2(-N.y, N.x))) * hp * c;   // 外の角どうしを結ぶ線＝二等分線の点から外へ hp·c
	// miter は限界を超えたら bevel・bevel は限界未満なら miter（見分けられない＝MapLibre と同じ）
	if (bev == 0.0 || (joinK == 1.0 ? mlen <= ml : mlen < ml)) { ext = hp * max(1.0, sqrt(max(mlen * mlen - 1.0, 0.0))) + 1.0; return 3.0; }
	return 4.0;
}`,Ha=`
	v_gp = u_lt.x > 0.5 && u_lt.x < 1.5 ? vec2(col0.x + col0.y * 256.0, col0.z + col0.w * 256.0) * (255.0 / 65535.0) : vec2(0.0);   // line-gradient（G-3）＝色の語の 4 バイト（/255）→ unorm16×2
	float hwD = u_pz.y > 0.5 ? u_pz.w : hw0;   // 破線の尺の線幅＝floor(z) の線幅（MapLibre の floorwidth）・差し替えない層は作ったタイルの z の値
	if (u_pz.y > 0.5) hw0 = u_pz.z;   // ズーム連続（V-Ph3＝S-P1-2）＝今の z の線幅と色
	if (u_pz.x > 0.5) col0 = u_pzC;
	if (u_pzO.x > 0.5) off0.x = u_pzO.y;
	if (u_tr.z != 0.0) { vec2 tr = trLL(o + p1); p0 += tr; p1 += tr; p2 += tr; p3 += tr; }   // line-translate（S-P1-4/5）＝線分ごとに同じだけ（継ぎの相手も）
	vec2 la1 = o + p1, la2 = o + p2;   // elev 参照用の絶対（粗くて可）。o=u_origin ゆえ p1/p2 が原点相対 delta
	vec3 rela = deltaToRel(p1), relb = deltaToRel(p2);   // 頂点3D − 原点3D（小・正確）
	vec3 da = u_originPt + rela, db = u_originPt + relb; // 絶対単位球点（front/fog/df 用＝粗くて可）
	// 接地リフト u_lift(m)：都市帯（深度テスト×DTM起伏）では、線ドレープ（頂点毎バイリニア）と
	// 地形サーフェス（72m級格子の三角形）の近似差＋疎頂点区間の直線化で、線が地形面を数十cm〜数m
	// 出入りする＝潜った区間が深度に食われ道路がギザギザになる（札幌 z16.9 実測）。数mのリフトで
	// 上へ逃がす。山岳帯は renderer が 0 を渡す＝従来の見た目のまま。
	// 標高変位は地形と同じ距離フェード（TERRAIN_VS の df と同式）＝遠景の平ら化に追随。
	// これが無いと平ら化された山脈の上に線だけがフル標高で浮き、「地平線に漂う点線の鎖」になる
	float dfa = 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, da));
	float dfb = 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, db));
	// u_lift＜0＝深度だけのリフト（基図・利用者の vector の層＝2026-11-11 本人報告「チルトを深くすると、基図と建物がズレる？」）：画素の位置は地面のまま、
	// 深度の点だけ |u_lift| 上げる。位置まで 5m 上げると、深いチルトでは道路が地面より 5·tan(チルト) 奥に描かれる（74° で 17m＝建物の足元・地面アトラスの塗りから離れる）。
	// u_lift＞0（overlay＝塗りも同じ高さに浮かせる）は従来どおり位置ごと上げる＝境界線と塗りが揃う
	float liftP = max(u_lift, 0.0), liftZ = abs(u_lift);
	float ha = (elevQ(la1) + liftP) * u_elevScale * dfa, hb = (elevQ(la2) + liftP) * u_elevScale * dfb;   // 案A
	vec3 relWa = rela + ha * liftDir(la1, da), relWb = relb + hb * liftDir(la2, db);   // (dir*(1+h)) − 原点3D を相殺なしで（楕円体＝測地法線）
	vec3 wa = u_originPt + relWa, wb = u_originPt + relWb;       // 絶対（fog 用＝粗くて可）
	vec4 ca = u_clipT + u_mvp * vec4(relWa, 0.0), cb = u_clipT + u_mvp * vec4(relWb, 0.0);   // RTE：mvp*[w,1] を相殺なしで
	float fa = dot(da, u_eye) - 1.0, fb = dot(db, u_eye) - 1.0;
	if (ca.w <= 0.0 || cb.w <= 0.0) { v_front = -1.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }  // カメラ背後
	vec2 sa = toScreen(ca), sb = toScreen(cb);
	vec2 d = sb - sa; float len = length(d);
	vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0);
	vec2 perp = vec2(-dir.y, dir.x);   // 画面は y 下向き＝進行方向の右
	// line-offset（#49）：端点を画面空間で perp＋dir×t だけ動かす（t＝build.js miterSlides の角の継ぎ＝隣の線分の端点と同じ所へ）
	float offPx = off0.x * u_dpr;
	sa += (perp + dir * off0.y) * offPx; sb += (perp + dir * off0.z) * offPx;
	float hw = hw0 * u_dpr + 1.0;        // +1px の AA/丸端余白
	// 端と継ぎ（S-P1-1）：丸でない層（u_cj≠0）だけ端ごとに形を決め、四角形を端から伸ばす長さ（eA・eB）を変える
	float eA = hw, eB = hw;
	v_ja = vec4(0.0); v_jb = vec4(0.0); v_jk = vec4(0.0);
	if (u_cj > 0.5) {
		float hp = hw0 * u_dpr, bA, bB;
		float fl = jf0, lA = mod(fl, 2.0) == 1.0 ? 1.0 : mod(floor(fl / 4.0), 2.0) == 1.0 ? 2.0 : 0.0, lB = mod(floor(fl / 2.0), 2.0) == 1.0 ? 1.0 : floor(fl / 8.0) == 1.0 ? 2.0 : 0.0;
		v_jk.x = lineEnd(o, p0, p1, p2, ha, hp, true, lA, v_ja, bA, eA);
		v_jk.y = lineEnd(o, p1, p2, p3, hb, hp, false, lB, v_jb, bB, eB);
		v_jk.zw = vec2(bA, bB);
	}
	// 破線（S-P1-3）：模様の位相は地面の長さ（z24 の px）を floor(zoom) の px にして線幅で割る＝MapLibre の tileRatio／floorwidth と同じ。
	// 線分の長さは経緯度から（縦は中点の緯度のメルカトル＝scene.ts の segLen24 と同式）。line-pattern（G-4）の横の位相も同じ（尺は u_lt.y）
	v_dd = vec2(0.0);
	if (u_dashP.y > 0.5 || u_lt.x > 1.5) {
		float my = (p2.y - p1.y) * 0.017453293 / cos((o.y + (p1.y + p2.y) * 0.5) * 0.017453293) / 6.2831853;
		v_dd = vec2(dist0, length(vec2((p2.x - p1.x) / 360.0, my)) * 4294967296.0) * ((u_dashP.y > 0.5 ? u_dashP.w : u_lt.y) / max(2.0 * hwD, 1e-3));
	}
	vec2 base = corner.x < 0.5 ? sa : sb;
	float capSign = corner.x < 0.5 ? -1.0 : 1.0;
	vec2 pos = base + perp * (hw * corner.y) + dir * (capSign * (corner.x < 0.5 ? eA : eB));
	v_a = sa; v_b = sb; v_half = hw0 * u_dpr; v_pos = pos;
	v_color = col0; v_front = min(fa, fb);
	v_fog = fogOf((wa + wb) * 0.5);
	// 端点の深度は対数系（applyLogDepth と同式）＝地形・建物と同じ深度空間（山岳ビューで尾根の向こうを遮蔽）
	// 深度だけの余白（2026-11-07 本人報告「傾けた高速道路の縁がギザギザ」＝横浜 z16.2 74°）：画素の位置は動かさず、深度テストに使う点だけ
	// さらに u_lift ＋ 弦のたるみ（線分の中点の地面が両端を結ぶ弦より高い分＝疎な頂点の区間が凸地形の中へ沈む）だけ持ち上げる。
	// 地形の深度テストは「線が地面の手前か」しか見ないので、深度の点を上げても絵は浮かない（尾根に隠れにくくなるだけ＝市街地の接地リフト（u_lift>0）の帯に限る）
	vec3 relDa = relWa, relDb = relWb; vec4 cda = ca, cdb = cb;
	// 深度の点＝地面から 2|u_lift|＋たるみ（位置のリフト liftP の分は差し引く＝u_lift＜0 の基図も深度は従来と同じ高さ）
	if (liftZ > 0.0) {
		float ga = elevQ(la1), gb = elevQ(la2), sag = max(0.0, elevQ((la1 + la2) * 0.5) - 0.5 * (ga + gb)), dz = 2.0 * liftZ - liftP + sag;
		relDa = relWa + (dz * u_elevScale * dfa) * liftDir(la1, da); relDb = relWb + (dz * u_elevScale * dfb) * liftDir(la2, db);
		cda = u_clipT + u_mvp * vec4(relDa, 0.0); cdb = u_clipT + u_mvp * vec4(relDb, 0.0);
	}
	float wz = (corner.x < 0.5) ? lineGroundW(relDa, la1, da, cda, pos - toScreen(cda)) : lineGroundW(relDb, la2, db, cdb, pos - toScreen(cdb));   // 四隅＝その下の地面の深さ（lineGroundW）
	float zc = log2p1(max(wTrue(wz), 1e-30)) * u_logCoef - 1.0;   // 1.0+w の桁落ちを避ける（PROJECT の log2p1）
	vec2 ndc = vec2(pos.x / u_viewport.x * 2.0 - 1.0, 1.0 - pos.y / u_viewport.y * 2.0);
	gl_Position = vec4(ndc, zc, 1.0);
`,Ji=`#version 300 es
precision highp float;
in vec2 a_p1;
in vec2 a_p2;
in vec2 a_corner;   // (end 0/1, side -1/+1)
in float a_half;    // CSS px
in vec3 a_off;      // line-offset（#49）[CSS px, tS, tE]・持たない層は属性を切る＝既定値 0
in vec2 a_p0;       // 端と継ぎ（S-P1-1）：前の線分の始点・次の線分の終点（renderer が P1／P2 のバッファを 1 線分ずらして読ませる）・旗（JF_*）
in vec2 a_p3;
in float a_jf;      // 持たない層は属性を切る（u_cj＝0 で読まない）
in float a_dist;    // 破線（S-P1-3）の始点までの線に沿う距離（z24 の px）・持たない層は属性を切る（u_dashP.y＝0 で読まない）
in vec4 a_color;
uniform float u_dpr;
${bt}
${ni}
${Wa}
void main() {
	vec2 o = u_origin;
	vec2 p1 = a_p1, p2 = a_p2, corner = a_corner;
	float hw0 = a_half; vec3 off0 = a_off; vec4 col0 = a_color; vec2 p0 = a_p0, p3 = a_p3; float jf0 = a_jf, dist0 = a_dist;
${Ha}
}`,tr=128;function cn(t,n){let e=t.replace("#version 300 es",`#version 300 es
#extension GL_ANGLE_multi_draw : require`);for(const[a,s]of n){if(!e.includes(a))throw new Error("mdize: 置換対象が見つからない: "+a);e=e.split(a).join(s)}return e}const en=cn(Qr,[["in vec4 a_color;",`in vec4 a_color;
uniform vec2 u_tileOff[${tr}];${fn}`],["v_color = u_pz.x > 0.5 ? u_pzC : a_color;","v_color = u_pz.x > 0.5 ? u_pzC : u_pt > 0.5 ? ptColor(ptRowOf(a_color)) : a_color;"],["vec2 dLL = a_delta;","vec2 dLL = u_tileOff[gl_DrawID] + a_delta;"]]),Yr=cn($o,[["in vec2 a_anchor;",`in vec2 a_anchor;
uniform vec2 u_tileOff[${tr}];`],["vec2 dLL = a_pos.xy;","vec2 dLL = u_tileOff[gl_DrawID] + a_pos.xy;"],["vec2 dAnchor = a_anchor;","vec2 dAnchor = u_tileOff[gl_DrawID] + a_anchor;"]]),tn=`#version 300 es
#extension GL_ANGLE_multi_draw : require
precision highp float;
precision highp usampler2D;
// 線分プール（2texel/線分）: [bits(p1.x), bits(p1.y), bits(p2.x), bits(p2.y)] [colRGBA8パック, bits(half)（下位 4 bit＝端と継ぎの旗・S-P1-1）, bits(off), snorm16×2(tS/2,tE/2)]
// 破線の列（u_dashP.y＞0・S-P1-3）は 語 6 が bits(始点までの線に沿う距離)・語 7 は角の継ぎ（ずらしは層で 1 つの値＝u_pzO・ずらさない層は 0）
uniform usampler2D u_segTex;
uniform vec2 u_tileOff[${tr}];${fn}
uniform float u_dpr;
${bt}
${ni}
${Wa}
const vec2 CORN[6] = vec2[6](vec2(0., -1.), vec2(0., 1.), vec2(1., -1.), vec2(1., -1.), vec2(0., 1.), vec2(1., 1.));   // renderer の CORNERS と同一
void main() {
	int seg = gl_VertexID / 6;
	vec2 corner = CORN[gl_VertexID - seg * 6];
	int tw = textureSize(u_segTex, 0).x;
	int t0 = seg * 2;
	uvec4 A = texelFetch(u_segTex, ivec2(t0 % tw, t0 / tw), 0);
	uvec4 B = texelFetch(u_segTex, ivec2((t0 + 1) % tw, (t0 + 1) / tw), 0);
	vec2 off = u_tileOff[gl_DrawID];
	// タイル原点差はここ（小さい値同士）で足す＝大きい u_origin の加算は LINE_MAIN 内で1回だけ（classic と同じ丸め回数）
	vec2 p1 = vec2(uintBitsToFloat(A.x), uintBitsToFloat(A.y)) + off;
	vec2 p2 = vec2(uintBitsToFloat(A.z), uintBitsToFloat(A.w)) + off;
	vec4 col0 = u_pt > 0.5 ? ptColor(int(B.x & 65535u)) : vec4(float(B.x & 255u), float((B.x >> 8) & 255u), float((B.x >> 16) & 255u), float(B.x >> 24)) / 255.0;   // paint 表の (b) 類＝語 4 が行
	float hw0 = uintBitsToFloat(B.y);
	vec3 off0 = vec3(uintBitsToFloat(B.z), unpackSnorm2x16(B.w) * 2.0);
	float dist0 = 0.0;
	if (u_dashP.y > 0.5 || u_lt.x > 1.5) { dist0 = uintBitsToFloat(B.z); off0.x = 0.0; }   // 線の模様（G-4）も語 6 が距離
	// 端と継ぎ（S-P1-1）：旗は半幅の下位 4 bit。継ぐ相手は同じ塊のすぐ前後の線分（旗が立つ時だけ読む）＝p1/p2 と同じ足し算でビット同値
	vec2 p0 = p1, p3 = p2; float jf0 = 0.0;
	if (u_cj > 0.5) {
		jf0 = float(B.y & 15u); hw0 = uintBitsToFloat(B.y & ~15u);
		if ((B.y & 1u) != 0u) { int tp = t0 - 2; uvec4 P = texelFetch(u_segTex, ivec2(tp % tw, tp / tw), 0); p0 = vec2(uintBitsToFloat(P.x), uintBitsToFloat(P.y)) + off; }
		if ((B.y & 2u) != 0u) { int tn = t0 + 2; uvec4 N = texelFetch(u_segTex, ivec2(tn % tw, tn / tw), 0); p3 = vec2(uintBitsToFloat(N.z), uintBitsToFloat(N.w)) + off; }
	}
	if (u_pt > 1.5) { hw0 = ptHalf(int(B.x & 65535u)); if (u_cj > 0.5) hw0 = uintBitsToFloat(floatBitsToUint(hw0) & ~15u); }   // 線幅も表（段 2b）＝語 5 と同じく旗の 4 bit を落とす（焼いた半幅と bit 同値）
	vec2 o = u_origin;
${Ha}
}`,jo=`#version 300 es
precision highp float;
uniform float u_baseAlpha;   // 基図の濃さ（fill と同じスライダー）
uniform vec3 u_fogColor;
uniform vec2 u_viewport;     // 継ぎの切り口は画素の中心（gl_FragCoord）で測る＝補間した v_pos の三角形ごとの丸めの差で継ぎ目に二度塗り・塗り残しを出さない
flat in vec2 v_a;
flat in vec2 v_b;
flat in float v_half;
flat in vec4 v_ja;
flat in vec4 v_jb;
flat in vec4 v_jk;
flat in vec2 v_dd;
flat in vec2 v_gp;
uniform sampler2D u_ltTex;   // 線の色の見本（G-3＝line-gradient の 256 段・RGBA8・前乗算しない）・線の模様（G-4＝画像・前乗算）。使わない層も unit 16（PAT_UNIT）を指す＝型の合う標本器
${Va}
in vec2 v_pos;
in vec4 v_color;
in float v_front;
in float v_fog;
out vec4 fragColor;
// 端の先の覆い（S-P1-1）：k＝端の形（LINE_VARY の v_jk）・e＝端からの距離（先へ正）・q＝端からの位置・j＝切り口・bev＝bevel の切り線。
// 丸い形の時だけ dist（芯からの距離）を端の点からの距離に替える
float lineTail(float k, float e, vec2 q, vec4 j, float bev, float hw, inout float dist) {
	if (k == 0.0 || k == 5.0) { dist = length(q); return 1.0; }   // 丸い端・丸い継ぎ
	if (k == 1.0) return clamp(0.5 - e * 2.0, 0.0, 1.0);          // butt＝端で切る
	if (k == 2.0) return clamp((hw - e) * 2.0 + 0.5, 0.0, 1.0);   // square＝半幅だけ出す
	if (k == 4.0) return clamp((abs(bev) - sign(bev) * dot(q, vec2(-j.w, j.z))) * 2.0 + 0.5, 0.0, 1.0);   // bevel＝外の角どうしを結ぶ線で切る
	return 1.0;   // miter＝切り口まで伸ばした帯そのもの
}
void main() {
	if (v_front < -0.0015) discard;   // 接線に標高許容（地平線に頭を出す山上の線も描く。遮蔽は深度とフォグ）
	vec2 pa = v_pos - v_a, ba = v_b - v_a;
	float dist, cov = 1.0;
	if (v_jk.x == 0.0 && v_jk.y == 0.0) {   // 丸い端・丸い継ぎ＝capsule（線分までの距離）
		float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
		dist = length(pa - ba * t);
	} else {   // 端と継ぎ（S-P1-1）：継ぎは二等分線の向こうを捨てる（隣の線分の受け持ち＝同じ線で切るので隙も重なりも無い）
		// 線の上の画素（ちょうど 0）は始点の側（次の線分）が取る＝終点の側は 0 も捨てる
		vec2 fp = vec2(gl_FragCoord.x, u_viewport.y - gl_FragCoord.y);
		if (v_jk.x >= 3.0 && dot(fp - v_ja.xy, v_ja.zw) < 0.0) discard;
		if (v_jk.y >= 3.0 && dot(fp - v_jb.xy, v_jb.zw) <= 0.0) discard;
		float L = length(ba);
		if (L < 1e-3 && (v_jk.x == 1.0 || v_jk.x == 2.0)) discard;   // 長さ 0 の線分の角い端＝描かない（MapLibre は重なった点を捨てる）
		vec2 dir = L > 1e-6 ? ba / L : vec2(1.0, 0.0);
		float u = dot(pa, dir);
		dist = abs(dot(pa, vec2(-dir.y, dir.x)));
		float hw0 = max(v_half, 0.5);
		// 端の先の位置は、継ぎなら切り口の点から（両隣で同じ点）・端なら自分の端点から
		if (u < 0.0) cov = lineTail(v_jk.x, -u, v_pos - (v_jk.x >= 3.0 ? v_ja.xy : v_a), v_ja, v_jk.z, hw0, dist);
		else if (u > L) cov = lineTail(v_jk.y, u - L, v_pos - (v_jk.y >= 3.0 ? v_jb.xy : v_b), v_jb, v_jk.w, hw0, dist);
	}
	// 破線（S-P1-3）：画素の線に沿う位相 x を模様の周期に畳み、線の区間までの距離で切る。butt・square＝区間の端で切る（MapLibre の addRegularDash）・
	// round＝区間の芯からの距離を半幅で丸く切る（長さ 0 の線＝点・MapLibre の addRoundDash）。線分の外（端と継ぎ）は端点の位相のまま
	if (u_dashP.y > 0.5) {
		float Ls = length(ba), k = Ls > 1e-3 ? v_dd.y / Ls : 0.0;   // 線幅の倍数／画素（地面の尺＝傾いた画面では縮む＝MapLibre と同じ）
		if (k > 1e-7) {
			float x = v_dd.x + clamp(dot(pa, ba / Ls), 0.0, Ls) * k;
			x -= u_dashP.x * floor(x / u_dashP.x);
			float s = -1e9;   // 線の区間までの符号つき距離（画素・内が正）
			for (int i = 0; i < 4; i++) {
				if (float(i) >= u_dashP.y) break;
				vec2 ab = i == 0 ? u_dashI[0].xy : i == 1 ? u_dashI[0].zw : i == 2 ? u_dashI[1].xy : u_dashI[1].zw;
				for (int m = -1; m <= 1; m++) {
					float xm = x + float(m) * u_dashP.x;
					if (u_dashP.z > 0.5) s = max(s, -length(vec2(max(max(ab.x - xm, xm - ab.y), 0.0) / k, dist)));
					else s = max(s, min(xm - ab.x, ab.y - xm) / k);
				}
			}
			if (u_dashP.z > 0.5) dist = -s;
			else cov *= clamp(s * 2.0 + 0.5, 0.0, 1.0);
		}
	}
	// 細線のシャープ化（製図の定石）：幾何幅は最低±0.5px を保証し、それ未満の細さは透明度（カバレッジ）で表現。
	// サブピクセル幅をそのまま描くと±0.5pxのAAフェザーが本体より太くなり「淡くボケた2pxの線」＝低ズームの滲みになる。
	// さらにフェザー自体を±0.25pxへ半減（×2.0）＝エッジの立ち上がりを締める。Retina(dpr2)ではCSS 0.125px相当。
	// 結果は「常にカリッと・細いほど薄く」＝シャープで主張しない線。
	float hw = max(v_half, 0.5);
	float edge = clamp((hw - dist) * 2.0 + 0.5, 0.0, 1.0);
	// ぼかし（S-P1-4/5）：line-blur＝縁（＋半画素）から内へ blur＋1 画素で線形（MapLibre の blur2）・circle-blur＝半径の (1−blur) から縁へ smoothstep（MapLibre の circle）
	if (u_blur.x > 0.0) edge = u_blur.y > 0.5 ? 1.0 - smoothstep(hw * (1.0 - u_blur.x), hw, dist) : clamp((hw + 0.5 - dist) / (u_blur.x + 1.0), 0.0, 1.0);
	float alpha = edge * cov * min(v_half * 2.0, 1.0);
	if (alpha <= 0.0) discard;
	// 霧はフェードアウト（透明化）：塗り潰し式だと地平線の先の線が「空に浮く白線」になる（球の自遮蔽の代役）。
	// 1.2倍＝霧83%で完全消滅：地形の霞の帯より先に消え、暗い空に線の尻尾（残影）が残らない
	// line-gradient（G-3）：画素の進み＝線分の上の位置で始点・終点の進みを補う（線分の外＝端と継ぎは端点の値）→ 見本の 256 段の真ん中を引く
	vec4 lc = v_color;
	if (u_lt.x > 1.5) {   // line-pattern（G-4）＝MapLibre の line_pattern：横＝線に沿う位相（floor(zoom) の線幅の倍数）×画像の高さ÷幅、縦＝線の幅（右が下）。線分の外（端と継ぎ）は位相を延ばす＝隣の線分と続く。line-color は読まない
		float Ls = length(ba), k = Ls > 1e-3 ? v_dd.y / Ls : 0.0;
		vec2 ts = vec2(textureSize(u_ltTex, 0));
		float x = v_dd.x + dot(pa, ba) / max(Ls, 1e-6) * k, sd = Ls > 1e-6 ? dot(pa, vec2(-ba.y, ba.x)) / Ls : 0.0;
		vec4 t = texture(u_ltTex, vec2(fract(x * ts.y / ts.x), clamp(0.5 + sd / (2.0 * max(v_half, 0.5)), 0.5 / ts.y, 1.0 - 0.5 / ts.y)));
		lc = vec4(t.a > 0.0 ? t.rgb / t.a : vec3(0.0), t.a * u_lt.z);
	} else if (u_lt.x > 0.5) lc = texture(u_ltTex, vec2(mix(v_gp.x, v_gp.y, clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0)) * (255.0 / 256.0) + 0.5 / 256.0, 0.5));
	float a = lc.a * alpha * clamp(1.0 - 1.2 * v_fog, 0.0, 1.0) * u_baseAlpha;
	if (a <= 0.003) discard;
	vec3 rgb = mix(lc.rgb, u_fogColor, v_fog);
	fragColor = vec4(rgb * a, a);
}`,Ec=`#version 300 es
precision highp float;
in vec2 a_delta;
in vec2 a_uv;
uniform vec2 u_tileOff;
uniform vec2 u_winInv;
uniform vec4 u_uvT;   // 祖先フォールバックの部分 uv (u0,v0,su,sv)
out vec2 v_uv;
void main() {
	vec2 p = (u_tileOff + a_delta) * u_winInv;
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
	v_uv = u_uvT.xy + a_uv * u_uvT.zw;
}`,pc=`#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform float u_opacity;
in vec2 v_uv;
out vec4 fragColor;
void main() {
	vec4 c = texture(u_tex, v_uv);
	float a = c.a * u_opacity;
	fragColor = vec4(c.rgb * a, a);   // premultiplied
}`,Ka=`#version 300 es
precision highp float;
in vec2 a_delta;
in vec4 a_color;
uniform vec2 u_origin;
uniform vec2 u_atlOff;
uniform vec2 u_atlInv;
out vec4 v_color;
out vec2 v_ll;
void main() {
	vec2 dLL = a_delta;
	vec2 p = (u_atlOff + dLL) * u_atlInv;
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
	v_color = a_color;
	v_ll = u_origin + dLL;
}`,bc=cn(Ka,[["in vec4 a_color;",`in vec4 a_color;
uniform vec2 u_tileOff[${tr}];${fn}`],["v_color = a_color;","v_color = u_pt > 0.5 ? ptColor(ptRowOf(a_color)) : a_color;"],["vec2 dLL = a_delta;","vec2 dLL = u_tileOff[gl_DrawID] + a_delta;"]]),ba=`#version 300 es
precision highp float;
uniform float u_seaGate;    // 1＝図郭外フォールバック水域：標高が陸(h>0)の画素は塗らない
uniform float u_baseAlpha;  // 基図の濃さ（表示パネルのスライダー）
${ii}
in vec4 v_color;
in vec2 v_ll;
out vec4 fragColor;
void main() {
	if (u_seaGate > 0.5 && elev(v_ll) > 0.0) discard;
	float a = v_color.a * u_baseAlpha;
	if (a <= 0.003) discard;
	fragColor = vec4(v_color.rgb * a, a);   // premultiplied
}`,Ta=`#version 300 es
void main() { gl_Position = vec4(float(int(uint(gl_VertexID) & 1u) * 4 - 1), float(int(uint(gl_VertexID) >> 1u) * 4 - 1), 0.0, 1.0); }`,ha=t=>`#version 300 es
precision highp float; precision highp int; precision highp isampler2D; precision highp sampler2D;
uniform ${t===0?"isampler2D":"sampler2D"} u_raw;   // 生タイル（row0＝北・texel(x,y)＝data[y*w+x]）
uniform uvec4 u_dim;   // w, h, kind, mode(0=down 1=box 2=crop 3=float)
uniform vec4  u_a;     // mode 3: ax, bx, ay, by
uniform vec4  u_lo;    // mode 3: gx∈[x,y]・gy∈[z,w]
uniform uvec4 u_o;     // ox, oy（セル原点 texel）, N, k
uniform uvec4 u_box;   // mode 1: AW, rowN0, col0, 0／mode 0: M（読まない最外周の画素数）・w＝1 で海底（mode 0/2）
uniform uvec4 u_ix;    // mode 0/2: Ax, Bx, Dx, shift（gx = (Ax + Bx·(2i+1))/Dx − shift＝画素中心の −½ を符号なしで書くための下駄・2026-10-02）
uniform uvec4 u_iy;    // mode 0/2: Ay, By, Dy, shift
out vec4 fragColor;
float rdRaw(uint idx) { ivec2 p = ivec2(int(idx % u_dim.x), int(idx / u_dim.x)); return ${t===0?"float(texelFetch(u_raw, p, 0).r)":"texelFetch(u_raw, p, 0).r"}; }
float rd(uint idx) { float v = rdRaw(idx); if (!(v >= (u_box.w == 1u ? -11500.0 : -420.0) && v <= 9000.0)) return 0.0; return v; }   // box.w＝1：海底（GEBCO の負値を通す）
void main() {
	uint i = uint(gl_FragCoord.x) - u_o.x; uint j = uint(gl_FragCoord.y) - u_o.y;
	uint w = u_dim.x; uint h = u_dim.y; uint mode = u_dim.w;
	float v;
	if (mode == 1u) {
		uint k = u_o.w; uint C = u_o.z * k;
		uint srcRow = u_box.y + (C - 1u - j * k);
		float sum = 0.0;
		for (uint jj = 0u; jj < k; jj++) { uint s = (srcRow - jj) * u_box.x + u_box.z + i * k; for (uint ii = 0u; ii < k; ii++) sum += rdRaw(s + ii); }
		v = sum / float(k * k);
	} else {
		uint x0; float fx; uint y0; float fy;
		if (mode == 3u) {
			float gx = clamp(u_a.x + u_a.y * (float(i) + 0.5), u_lo.x, u_lo.y);
			float gy = clamp(u_a.z + u_a.w * (float(j) + 0.5), u_lo.z, u_lo.w);
			x0 = uint(clamp(floor(gx), 0.0, float(w - 2u))); fx = clamp(gx - float(x0), 0.0, 1.0);
			y0 = uint(clamp(floor(gy), 0.0, float(h - 2u))); fy = clamp(gy - float(y0), 0.0, 1.0);
		} else {
			uint nx = u_ix.x + u_ix.y * (2u * i + 1u); uint qx = nx / u_ix.z; uint rx = nx - qx * u_ix.z;
			uint ny = u_iy.x + u_iy.y * (2u * j + 1u); uint qy = ny / u_iy.z; uint ry = ny - qy * u_iy.z;
			bool negx = qx < u_ix.w; bool negy = qy < u_iy.w;   // gx < 0（タイル西端・南端の半画素）＝画素 0 でクランプ（CPU の x0=0・fx=0 と同じ）
			qx = negx ? 0u : qx - u_ix.w; qy = negy ? 0u : qy - u_iy.w;
			x0 = qx; fx = negx ? 0.0 : float(rx) / float(u_ix.z); y0 = qy; fy = negy ? 0.0 : float(ry) / float(u_iy.z);
			if (mode == 0u) {
				uint M = u_box.x;
				if (qx < M) { x0 = M; fx = 0.0; } else if (qx > w - 1u - M || (qx == w - 1u - M && rx > 0u)) { x0 = w - 1u - M; fx = 0.0; }
				if (qy < M) { y0 = M; fy = 0.0; } else if (qy > h - 1u - M || (qy == h - 1u - M && ry > 0u)) { y0 = h - 1u - M; fy = 0.0; }
			} else {
				if (qx > w - 2u) { x0 = w - 2u; fx = 1.0; }
				if (qy > h - 2u) { y0 = h - 2u; fy = 1.0; }
			}
		}
		uint r0 = (h - 1u - y0) * w; uint r1 = r0 - w;
		float a = rd(r0 + x0); float b = rd(r0 + x0 + 1u); float c = rd(r1 + x0); float d = rd(r1 + x0 + 1u);
		float t = a + (b - a) * fx;
		v = t + ((c + (d - c) * fx) - t) * fy;
	}
	fragColor = vec4(u_box.w == 1u ? v : max(v, 0.0), 0.0, 0.0, 1.0);
}`,Tc=`
layout(std140) uniform ClipP { vec4 pl[6]; vec4 p; vec4 capT; vec4 capB; vec4 edgeC; vec4 pe; vec4 pn; vec4 pv[64]; } CL;
vec2 polyXY(vec3 rel) { return vec2(dot(CL.pe.xyz, rel) + CL.pe.w, dot(CL.pn.xyz, rel) + CL.pn.w); }
float polyD(vec2 q) {   // 多角形までの符号付きの距離（残る側が正・内外は偶奇）
	int n = int(CL.p.z);
	if (n == 0) return 1e30;
	float d2 = 1e30;
	bool inside = false;
	for (int i = 0; i < 64; i++) {
		if (i >= n) break;
		vec2 a = CL.pv[i].xy, b = CL.pv[i].zw;
		if ((a.y > q.y) != (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
		vec2 v = b - a; float t = clamp(dot(q - a, v) / max(dot(v, v), 1e-30), 0.0, 1.0); vec2 w = q - a - t * v;
		d2 = min(d2, dot(w, w));
	}
	float d = sqrt(d2);
	if (inside != (CL.p.w > 0.5)) d = -d;
	return d;
}
float clipD(vec3 rel, int i) { return i < int(CL.p.x) ? dot(CL.pl[i].xyz, rel) + CL.pl[i].w : 1e30; }
vec4 clipA(vec3 rel) { return vec4(clipD(rel, 0), clipD(rel, 1), clipD(rel, 2), clipD(rel, 3)); }
vec4 clipB(vec3 rel) { return vec4(clipD(rel, 4), clipD(rel, 5), polyXY(rel)); }
float clipMin(vec4 a, vec4 b) { return min(min(min(min(a.x, a.y), min(a.z, a.w)), min(b.x, b.y)), polyD(b.zw)); }
float clipDist(vec3 rel) {   // 画素で位置が分かる時（球の床）＝全部の面と多角形の最小
	float d = 1e30;
	for (int i = 0; i < 6; i++) d = min(d, clipD(rel, i));
	return min(d, polyD(polyXY(rel)));
}
`,go=`precision highp float;
`,li=t=>{if(t.split(go).length<2)throw new Error("glsl clip: precision line missing");return t.replace(go,go+Tc)},ui=`out vec4 v_cdA;
out vec4 v_cdB;
`,qt=`in vec4 v_cdA;
in vec4 v_cdB;
`,or=t=>`v_cdA = clipA(${t}); v_cdB = clipB(${t});`,sn=`	float cm = clipMin(v_cdA, v_cdB); float cw = fwidth(cm);
	if (cm < 0.0) discard;
	if (CL.p.y > 0.0 && cm < CL.p.y * cw) { fragColor = vec4(CL.edgeC.rgb, 1.0); return; }
`,fi=`	if (clipMin(v_cdA, v_cdB) < 0.0) discard;
`,$e=(t,n,e)=>li(Ft(t,n,e)),hc=[[`out vec2 v_guv3;
`,`out vec2 v_guv3;
`+ui],[`	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;
	v_fog = fogOf(u_originPt + relW);`,`	${or("relW")}
	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;
	v_fog = fogOf(u_originPt + relW);`]],ga=$e(qr,hc,"TERRAIN_CLIP_VS"),gc=$e(Zi,[[`in float v_h;
`,`in float v_h;
`+qt],["	float mpp = fwidth(v_ll.y) * 111320.0;",`	float cm = clipMin(v_cdA, v_cdB); float cw = fwidth(cm);
	if (cm < 0.0) discard;
	bool edgeOn = CL.p.y > 0.0 && cm < CL.p.y * cw;
	float mpp = fwidth(v_ll.y) * 111320.0;`],["	fragColor = vec4(col * t * u_globeAlpha, g.a * t * u_globeAlpha);",`	if (edgeOn) { fragColor = vec4(CL.edgeC.rgb, 1.0); return; }
	fragColor = vec4(col * t * u_globeAlpha, g.a * t * u_globeAlpha);`]],"TERRAIN_CLIP_FS"),qa=[["out vec2  v_ll;",`out vec4 v_cdA;
out vec4 v_cdB;
out vec2  v_ll;`],[`	v_shade = a_shade;
`,`	${or("relW")}
	v_shade = a_shade;
`]],ya=$e($o,qa,"BUILDING_CLIP_VS"),Ra=$e(Yr,qa,"BUILDING_MD_CLIP_VS"),Aa=$e(qo,[[`in vec2  v_ll;
`,`in vec2  v_ll;
`+qt],[`void main() {
	if (v_front < 0.0) discard;
`,`void main() {
`+sn+`	if (v_front < 0.0) discard;
`]],"BUILDING_CLIP_FS"),Ya=[[`out float v_fog;
`,`out float v_fog;
`+ui+`uniform vec3 u_clO;
`],["	gl_Position = u_clipMesh + u_mvp * vec4(ap + h * liftDir(vec2(lon, lat), dir), 0.0);",`	vec3 lp = ap + h * liftDir(vec2(lon, lat), dir);
	${or("u_clO + lp")}
	gl_Position = u_clipMesh + u_mvp * vec4(lp, 0.0);`]],ja=["	if (u_cullBack > 0.5 && fe < -0.02) discard;","	if (u_cullBack > 0.5 && fe < -0.02) { if (CL.capB.w > 0.5) { fragColor = vec4(CL.capB.rgb, 1.0); return; } discard; }"],Fa=$e(Zo,Ya,"MESH_CLIP_VS"),La=$e(ho,Ya,"MESH_TEX_CLIP_VS"),yc=$e(Jo,[[`in float v_fog;
`,`in float v_fog;
`+qt],[`	vec3 gn = cross(dFdx(v_toEye), dFdy(v_toEye));
`,`	vec3 gn = cross(dFdx(v_toEye), dFdy(v_toEye));
`+sn],ja],"MESH_CLIP_FS"),Rc=$e(Zr,[[`in float v_fog;
`,`in float v_fog;
`+qt],[`	vec4 txr = paintT(texture(u_tex, v_uv)); vec4 tx = txr * v_col;
`,`	vec4 txr = paintT(texture(u_tex, v_uv)); vec4 tx = txr * v_col;
`+sn],ja],"MESH_TEX_CLIP_FS"),$a=[[`out vec2 v_guv3;
`,`out vec2 v_guv3;
`+ui],["	gl_Position = u_clipT + u_mvp * vec4(rel, 0.0);",`	${or("rel")}
	gl_Position = u_clipT + u_mvp * vec4(rel, 0.0);`]],Ac=$e(Qr,$a,"FILL_CLIP_VS"),Fc=$e(en,$a,"FILL_MD_CLIP_VS"),wa=$e(Yo,[[`in vec2 v_guv3;
`,`in vec2 v_guv3;
`+qt],[`void main() {
	if (v_front < -0.0015) discard;`,`void main() {
`+fi+"	if (v_front < -0.0015) discard;"]],"FILL_CLIP_FS"),Za=[[`out float v_fog;
`,`out float v_fog;
`+ui],[`	v_fog = fogOf((wa + wb) * 0.5);
`,`	v_fog = fogOf((wa + wb) * 0.5);
	vec3 cpos = corner.x < 0.5 ? relWa : relWb;   // 端点ごと＝線分に沿って線形（幅の張り出しは同じ値）
	${or("cpos")}
`]],Lc=$e(Ji,Za,"LINE_CLIP_VS"),wc=$e(tn,Za,"LINE_MD_CLIP_VS"),Pa=$e(jo,[[`in vec2 v_pos;
`,`in vec2 v_pos;
`+qt],[`void main() {
	if (v_front < -0.0015) discard;`,`void main() {
`+fi+"	if (v_front < -0.0015) discard;"]],"LINE_CLIP_FS"),Pc=$e(Qi,[["	vec2 dll = deltaLL(u_rayEO + t * d, u_ell);",`	if (clipDist(u_rayEO + t * d) < 0.0) {
		float t2 = disc >= 0.0 ? (-bb + sqrt(disc)) / (2.0 * aa) : -1.0;   // 裏面（u_gBack）＝遠い根の内側を裏面の色で
		if (u_gBack > 0.5 && !ug && t2 > t && clipDist(u_rayEO + t2 * d) >= 0.0) { t = t2; ug = true; } else discard;
	}
	vec2 dll = deltaLL(u_rayEO + t * d, u_ell);`]],"GLOBE_CLIP_FS"),Qa=(()=>{const t=bt.indexOf("void applyLogDepth()"),n=bt.indexOf(`}
`,t);if(t<0||n<0)throw new Error("glsl cap: applyLogDepth missing");return bt.slice(0,t)+bt.slice(n+2)})(),Ja=`
uniform vec4 u_capQ[18];
uniform vec4 u_capG;
uniform vec4 u_capH;
uniform vec4 u_mesh;
`,Sc=`#version 300 es
precision highp float;
${Qa}
${Ja}
out vec3 v_x;
flat out int v_pi;
void main() {
	vec2 cs[6] = vec2[6](vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0), vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0));
	vec2 c = cs[gl_VertexID];
	int q = gl_InstanceID * 3;
	vec3 X = u_capQ[q].xyz + c.x * u_capQ[q + 1].xyz + c.y * u_capQ[q + 2].xyz;
	vec4 p = u_clipT + u_mvp * vec4(X, 0.0);
	p.z = 0.0;   // 深度は FS（目の後ろへ回った隅＝w<0 は −w≤z≤w を満たさず切られる＝見えている所は残る）
	gl_Position = p;
	v_x = X; v_pi = gl_InstanceID;
}`,Dc=li(`#version 300 es
precision highp float;
${Qa}
${Ja}
in vec3 v_x;
flat in int v_pi;
out vec4 fragColor;
vec2 capLL(vec3 dl) {   // 原点相対 δ → 経緯度の差（deg・測地）＝GLOBE_FS の deltaLL と同式（錨は u_originPt）
	vec3 O = u_originPt; float rhoO = length(O.xz), beta0 = atan(O.y, rhoO);
	float dlon = atan(dl.z * O.x - dl.x * O.z, rhoO * rhoO + dl.x * O.x + dl.z * O.z);
	float s = 2.0 * (O.x * dl.x + O.z * dl.z) + dl.x * dl.x + dl.z * dl.z;
	float rhoP = sqrt(max(rhoO * rhoO + s, 0.0));
	float drho = s / max(rhoP + rhoO, 1e-12);
	float dbeta = atan(dl.y * rhoO - drho * O.y, rhoP * rhoO + (O.y + dl.y) * O.y);
	float b1 = beta0 + dbeta;
	float corr = u_ell * (0.0016792203863837047 * (sin(2.0 * b1) - sin(2.0 * beta0)) + 0.0000014098905530233192 * (sin(4.0 * b1) - sin(4.0 * beta0)));
	return vec2(dlon, dbeta + corr) * 57.29577951308232;
}
float capDf(vec2 dll) { vec3 dir = u_originPt + deltaToRel(dll); return 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, dir)); }   // 地形の頂点と同じ遠景の平ら化
float capVert(vec2 gi) { vec2 ll = u_mesh.xy + u_mesh.zw * (gi / u_capH.x); return elev(ll) * capDf(ll - u_origin); }
float log1pS(float w) { if (w < 0.1) return w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715)))))); return log(1.0 + w); }
void main() {
	vec3 X = v_x;
	int n = int(CL.p.x);
	for (int i = 0; i < 6; i++) { if (i >= n) break; if (i != v_pi && dot(CL.pl[i].xyz, X) + CL.pl[i].w < 0.0) discard; }   // 他の面の外（箱の角）
	if (polyD(polyXY(X)) < 0.0) discard;   // 多角形で消す側
	// 足と高さ：動径の足から始めて、測地法線に沿って 2 回詰める
	vec3 O = u_originPt;
	vec2 dll = capLL(X);
	float z = 0.0;
	for (int k = 0; k < 2; k++) {
		vec3 u = deltaToRel(dll);
		vec3 L = liftDir(u_origin + dll, O + u);
		z = dot(X - u, L) / dot(L, L);
		dll = capLL(X - z * L);
	}
	float zm = z / max(u_elevScale, 1e-30);
	if (zm < 0.0) discard;   // 海抜 0 より下
	if (dot(O + deltaToRel(dll), u_eye) - 1.0 < -0.0015) discard;   // 地平線の向こう
	float N = u_capH.x;
	vec2 gc = u_capG.xy + dll * u_capG.zw;
	if (u_capH.y > 0.5) { vec2 uvN = (u_origin + dll - u_elevBounds.xy) / u_elevBounds.zw; if (uvN.x >= 0.0 && uvN.x <= 1.0 && uvN.y >= 0.0 && uvN.y <= 1.0) discard; }   // 遠窓の回＝近窓の内側は近の担当
	if (gc.x < 0.0 || gc.y < 0.0 || gc.x > N || gc.y > N) discard;
	vec2 g = min(gc, vec2(N - 1e-4)), gi = floor(g), gf = g - gi;   // 地表＝地形メッシュと同じ三角形
	float ht;
	if (gf.x + gf.y < 1.0) { float h00 = capVert(gi); ht = h00 + gf.x * (capVert(gi + vec2(1.0, 0.0)) - h00) + gf.y * (capVert(gi + vec2(0.0, 1.0)) - h00); }
	else { float h11 = capVert(gi + vec2(1.0)); ht = h11 + (1.0 - gf.x) * (capVert(gi + vec2(0.0, 1.0)) - h11) + (1.0 - gf.y) * (capVert(gi + vec2(1.0, 0.0)) - h11); }
	if (zm > ht) discard;   // 地表より上＝空
	fragColor = vec4(mix(CL.capT.rgb, u_fogColor, fogOf(O + X)), 1.0);
	vec4 pc = u_clipT + u_mvp * vec4(X, 0.0);
	gl_FragDepth = clamp(log1pS(max(wTrue(pc.w), 1e-30)) * 1.4426950 * u_logCoef * 0.5, 0.0, 1.0);
}`),Cc=`
layout(std140) uniform ShadowP { mat4 mvp; vec4 clipT; vec4 anchor; vec4 p; vec4 cs[3]; vec4 cb[3]; vec4 q; } SH;
vec4 shClip(vec3 relA) { return SH.clipT + SH.mvp * vec4(relA, 0.0); }
`,Bc=`
uniform highp sampler2DArrayShadow u_shTex;
uniform highp sampler2DArray u_shRaw;
const vec2 SH_PD[16] = vec2[16](
	vec2(-0.94201624, -0.39906216), vec2(0.94558609, -0.76890725), vec2(-0.09418410, -0.92938870), vec2(0.34495938, 0.29387760),
	vec2(-0.91588581, 0.45771432), vec2(-0.81544232, -0.87912464), vec2(-0.38277543, 0.27676845), vec2(0.97484398, 0.75648379),
	vec2(0.44323325, -0.97511554), vec2(0.53742981, -0.47373420), vec2(-0.26496911, -0.41893023), vec2(0.79197514, 0.19090188),
	vec2(-0.24188840, 0.99706507), vec2(-0.81409955, 0.91437590), vec2(0.19984126, 0.78641367), vec2(0.14383161, -0.14100790));
float shPcss(vec2 uv, int layer, float d, int i) {
	float g = SH.cb[i].w, tx = SH.cb[i].y;
	vec2 dim = vec2(textureSize(u_shRaw, 0).xy);
	float zs = 0.0, zn = 0.0;
	for (int k = 0; k < 16; k++) {
		vec2 o = SH_PD[k] * (tx * SH.q.w);
		ivec2 q = clamp(ivec2((uv + o) * dim), ivec2(0), ivec2(dim) - 1);
		float z = texelFetch(u_shRaw, ivec3(q, layer), 0).r;
		if (z < d + length(o) * g) { zs += z; zn += 1.0; }
	}
	if (zn < 0.5) return 1.0;   // 周りに遮る物が無い＝日向
	float w = clamp((d - zs / zn) * SH.q.y * SH.q.z / SH.cb[i].z, 1.0, 8.0) * tx;   // 半影の幅（uv）
	float s = 0.0;
	for (int k = 0; k < 16; k++) { vec2 o = SH_PD[k] * w; s += texture(u_shTex, vec4(uv + o, float(layer), d + length(o) * g)); }
	return s / 16.0;
}
vec2 shAt(vec3 pb, int i) {   // 段 i の日向の度合い（x）と窓の縁までの距離（y・≤0＝窓の外）
	vec4 c = SH.cs[i];
	vec2 xy = pb.xy * c.x + c.yz;
	vec2 uv = vec2(xy.x * 0.5 + 0.5, xy.y * 0.5 + 0.5);
	float e = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
	if (e <= 0.0) return vec2(1.0, e);
	float lit = shPcss(uv, int(c.w), pb.z - SH.cb[i].x, i);
	if (i + 1 >= int(SH.q.x)) lit = mix(1.0, lit, 1.0 - smoothstep(SH.p.w, 1.0, length(xy)));   // 基の窓＝縁を丸く日向へ
	return vec2(lit, e);
}
float shLit(vec4 sc) {   // 1＝日向・0＝影
	if (sc.w <= 0.0) return 1.0;
	vec3 pb = sc.xyz / sc.w;
	if (pb.z <= 0.0 || pb.z >= 1.0) return 1.0;
	int n = int(SH.q.x);
	for (int i = 0; i < 3; i++) {
		if (i >= n) break;
		vec2 a = shAt(pb, i);
		if (a.y <= 0.0) continue;
		if (i + 1 < n && a.y < 0.04) { vec2 b = shAt(pb, i + 1); if (b.y > 0.0) return mix(b.x, a.x, a.y / 0.04); }   // 段の縁の帯＝次の段と混ぜる
		return a.x;
	}
	return 1.0;
}
vec3 shShade(vec3 col, vec4 sc) { return col * mix(SH.p.x, 1.0, shLit(sc)); }
`,el=(t,n)=>{if(t.split(go).length<2)throw new Error("glsl shadow: precision line missing");return t.replace(go,go+Cc+(n?Bc:""))},Wo=`out vec4 v_sc;
`,bo=`in vec4 v_sc;
`,Vr="(u_originPt - SH.anchor.xyz)",on={terrain:[[`out vec2 v_guv3;
`,`out vec2 v_guv3;
`+Wo],[`	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;
`,`	v_sc = shClip(relW + ${Vr});
	v_front = dot(u_eye, u_eye) < 1.0 ? 1.0 : dot(dir, u_eye) - 1.0;
`]],fill:[[`out vec2 v_guv3;
`,`out vec2 v_guv3;
`+Wo],["	gl_Position = u_clipT + u_mvp * vec4(rel, 0.0);",`	v_sc = shClip(rel + ${Vr});
	gl_Position = u_clipT + u_mvp * vec4(rel, 0.0);`]],line:[[`out float v_fog;
`,`out float v_fog;
`+Wo],[`	v_fog = fogOf((wa + wb) * 0.5);
`,`	v_fog = fogOf((wa + wb) * 0.5);
	v_sc = shClip((corner.x < 0.5 ? relWa : relWb) + ${Vr});
`]],bld:[["out vec2  v_ll;",Wo+"out vec2  v_ll;"],[`	v_shade = a_shade;
`,`	v_sc = shClip(relW + ${Vr});
	v_shade = a_shade;
`]],mesh:[[`out float v_fog;
`,`out float v_fog;
`+Wo],["	gl_Position = u_clipMesh + u_mvp * vec4(",`	v_sc = shClip(u_meshOrigin - SH.anchor.xyz + ap + h * liftDir(vec2(lon, lat), dir));   // バッチ原点−main 原点（f32 差＝バッチ内一定）
	gl_Position = u_clipMesh + u_mvp * vec4(`]],meshTex:[],globe:[]};on.meshTex=on.mesh;const Uc=`	vec3 sdir = -normalize(vec3(SH.mvp[0].z, SH.mvp[1].z, SH.mvp[2].z));
	vec2 lr = v_ll * 0.017453292519943295;
	float cl = cos(lr.y), sl = sin(lr.y), co = cos(lr.x), so = sin(lr.x);
	vec2 sH = vec2(dot(sdir, vec3(-so, 0.0, co)), dot(sdir, vec3(-sl * co, cl, -sl * so)));   // 太陽の方位（東・北）
	vec2 aH = sH / max(length(sH), 1e-6);
	vec2 gEN = vec2(hx / (d * 111320.0 * max(cl, 0.01)), hy / (d * 111320.0));   // 勾配（東・北・m/m）
	float shade = clamp(0.82 - 0.44 * dot(gEN, aH), 0.45, 1.15);`,Mc={terrain:[[`in float v_h;
`,`in float v_h;
`+bo],["	float shade = clamp(0.82 + (-hx + hy) * 0.0007 * shadeK, 0.45, 1.15);",Uc],["	vec3 col = g.rgb * (1.0 - v_fog)",`	g.rgb = shShade(g.rgb, v_sc);
	vec3 col = g.rgb * (1.0 - v_fog)`]],fill:[[`in vec2 v_guv3;
`,`in vec2 v_guv3;
`+bo],["fragColor = vec4(mix(gndMix(cogTexMix(rgb, v_cuv), v_guv0, v_guv1, v_guv2, v_guv3), u_fogColor, v_fog) * af, af);","fragColor = vec4(mix(shShade(gndMix(cogTexMix(rgb, v_cuv), v_guv0, v_guv1, v_guv2, v_guv3), v_sc), u_fogColor, v_fog) * af, af);"]],line:[[`in vec2 v_pos;
`,`in vec2 v_pos;
`+bo],["	vec3 rgb = mix(lc.rgb, u_fogColor, v_fog);","	vec3 rgb = mix(shShade(lc.rgb, v_sc), u_fogColor, v_fog);"]],bld:[[`in vec2  v_ll;
`,`in vec2  v_ll;
`+bo],["	vec3 c = mix(u_bldColor * v_shade, u_fogColor, v_fog);","	vec3 c = mix(shShade(u_bldColor * v_shade, v_sc), u_fogColor, v_fog);"]],mesh:[[`in float v_fog;
`,`in float v_fog;
`+bo],["	vec3 c = mix(base, u_fogColor, v_fog);","	vec3 c = mix(shShade(base, v_sc), u_fogColor, v_fog);"]],meshTex:[[`in float v_fog;
`,`in float v_fog;
`+bo],["	vec3 c = mix(base, u_fogColor, v_fog);","	vec3 c = mix(shShade(base, v_sc), u_fogColor, v_fog);"]],globe:[["	vec3 viewDir = normalize(A - P);",`	g.rgb = shShade(g.rgb, shClip(u_rayEO + t * d + (u_rayO - SH.anchor.xyz)));   // 球の床（海抜 0）＝低地と真俯瞰の地面
	vec3 viewDir = normalize(A - P);`]]},Ic=(t,n)=>t==="globe"?n:el(Ft(n,on[t],`SH_VS:${t}`),!1),Nc=(t,n)=>el(Ft(n,Mc[t],`SH_FS:${t}`),!0),Oc=t=>Ft(t,[["	applyLogDepth();",""]],"castVS"),zc=`#version 300 es
precision highp float;
void main() {}`,kc=li(`#version 300 es
precision highp float;
`+qt+`void main() {
`+fi+"}"),tl=`uniform sampler2D u_tex;
uniform float u_alphaCut;
in vec2 v_uv;
in vec4 v_col;
`,Xc=`#version 300 es
precision highp float;
`+tl+"void main() { if (texture(u_tex, v_uv).a * v_col.a < u_alphaCut) discard; }",Gc=li(`#version 300 es
precision highp float;
`+tl+qt+`void main() {
`+fi+`	if (texture(u_tex, v_uv).a * v_col.a < u_alphaCut) discard;
}`),Vc={linear:0,reinhard:1,aces:2,agx:3,filmic:4},Wc=`#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`,Hc=`#version 300 es
precision highp float;
uniform highp sampler2D u_tex;
out vec4 o;
void main() { o = texelFetch(u_tex, ivec2(gl_FragCoord.xy), 0); }`,Kc=`#version 300 es
precision highp float;
uniform highp sampler2D u_depth;
out vec4 o;
void main() {
	// min＝d=1（クリア値）の 16777215.5 は float32 で 16777216 に丸まる＝(255,0,0)＝0.996 に化けて「何かある」になる（検定で踏んだ）
	highp float v = min(floor(texelFetch(u_depth, ivec2(gl_FragCoord.xy), 0).r * 16777215.0 + 0.5), 16777215.0);
	highp float r = floor(v / 65536.0), g = floor((v - r * 65536.0) / 256.0), b = v - r * 65536.0 - g * 256.0;
	o = vec4(r, g, b, 255.0) / 255.0;
}`,qc=`#version 300 es
precision highp float;
uniform highp sampler2D u_tex;
uniform float u_th;
out vec4 o;
void main() {
	ivec2 p = ivec2(gl_FragCoord.xy) * 2;
	vec3 c = (texelFetch(u_tex, p, 0).rgb + texelFetch(u_tex, p + ivec2(1, 0), 0).rgb + texelFetch(u_tex, p + ivec2(0, 1), 0).rgb + texelFetch(u_tex, p + ivec2(1, 1), 0).rgb) * 0.25;
	float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
	float k = max(l - u_th, 0.0) / max(l, 1e-4);
	o = vec4(c * k, 1.0);
}`,Yc=`#version 300 es
precision highp float;
uniform highp sampler2D u_tex;
uniform vec2 u_dir;   // (1,0)·radius か (0,1)·radius（texel）
out vec4 o;
const float W[5] = float[5](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
void main() {
	vec2 ts = 1.0 / vec2(textureSize(u_tex, 0)), uv = gl_FragCoord.xy * ts;
	vec3 s = texture(u_tex, uv).rgb * W[0];
	for (int i = 1; i < 5; i++) { vec2 d = u_dir * float(i) * ts; s += texture(u_tex, uv + d).rgb * W[i]; s += texture(u_tex, uv - d).rgb * W[i]; }
	o = vec4(s, 1.0);
}`,jc=`#version 300 es
precision highp float;
uniform highp sampler2D u_tex;     // 本体の色（フル解像度・texelFetch・FXAA は LINEAR で読む）
uniform highp sampler2D u_bloom;   // ぼかした明部（半解像度・LINEAR）
uniform highp sampler2D u_lut;     // 3D LUT の帯（size²×size・LINEAR）
uniform vec2 u_size;
uniform float u_strength;   // bloom の量（0＝無し）
uniform vec4 u_vig;         // (strength, radius, softness, on)
uniform vec4 u_tm;          // (mode 0..4, exposure, on, fxaaOn)
uniform vec4 u_lutP;        // (size, intensity, on, 0)
out vec4 o;
vec3 tmReinhard(vec3 x) { return x / (1.0 + x); }
vec3 tmAces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tmFilmic(vec3 x) {   // Hable（Uncharted 2）・白点 11.2
	const float A = 0.15, B = 0.50, C = 0.10, D = 0.20, E = 0.02, F = 0.30, W = 11.2;
	vec3 c = ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
	float w = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
	return clamp(c / w, 0.0, 1.0);
}
vec3 tmAgx(vec3 c) {   // AgX（Troy Sobotka・Blender 4 の既定）の最小版＝入出力の行列と 6 次の S 字
	const mat3 IN = mat3(0.842479062253094, 0.0423282422610123, 0.0423756549057051, 0.0784335999999992, 0.878468636469772, 0.0784336, 0.0792237451477643, 0.0791661274605434, 0.879142973793104);
	const mat3 OUT = mat3(1.19687900512017, -0.0528968517574562, -0.0529716355144438, -0.0980208811401368, 1.15190312990417, -0.0980434501171241, -0.0990297440797205, -0.0989611768448433, 1.15107367264116);
	c = IN * c;
	c = clamp((log2(max(c, vec3(1e-10))) + 12.47393) / 16.5, 0.0, 1.0);
	vec3 x2 = c * c, x4 = x2 * x2;
	c = 15.5 * x4 * x2 - 40.14 * x4 * c + 31.96 * x4 - 6.868 * x2 * c + 0.4298 * x2 + 0.1191 * c - 0.00232;
	return clamp(OUT * c, 0.0, 1.0);
}
vec3 tonemap(vec3 c) {
	c *= u_tm.y;
	int m = int(u_tm.x + 0.5);
	if (m == 1) return tmReinhard(c);
	if (m == 2) return tmAces(c);
	if (m == 3) return tmAgx(c);
	if (m == 4) return tmFilmic(c);
	return clamp(c, 0.0, 1.0);
}
vec3 fxaa(vec2 fc, vec2 inv) {   // FXAA 3.11 の簡約版（5 点の輝度から縁の向きを取り、沿って 2〜4 点を混ぜる）
	const float SPAN = 8.0, RMIN = 1.0 / 128.0, RMUL = 1.0 / 8.0;
	const vec3 L = vec3(0.299, 0.587, 0.114);
	vec3 rgbM = texture(u_tex, fc * inv).rgb;
	float lNW = dot(texture(u_tex, (fc + vec2(-1.0, -1.0)) * inv).rgb, L), lNE = dot(texture(u_tex, (fc + vec2(1.0, -1.0)) * inv).rgb, L);
	float lSW = dot(texture(u_tex, (fc + vec2(-1.0, 1.0)) * inv).rgb, L), lSE = dot(texture(u_tex, (fc + vec2(1.0, 1.0)) * inv).rgb, L), lM = dot(rgbM, L);
	float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
	vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
	float red = max((lNW + lNE + lSW + lSE) * (0.25 * RMUL), RMIN), rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
	dir = min(vec2(SPAN), max(vec2(-SPAN), dir * rcp)) * inv;
	vec2 uv = fc * inv;
	vec3 a = 0.5 * (texture(u_tex, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(u_tex, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
	vec3 b = a * 0.5 + 0.25 * (texture(u_tex, uv - dir * 0.5).rgb + texture(u_tex, uv + dir * 0.5).rgb);
	float lB = dot(b, L);
	return (lB < lMin || lB > lMax) ? a : b;
}
vec3 lut3(vec3 c) {   // 帯＝x に B の板×size＋R・y に G。R・G は線形補間・B は隣の板との補間
	float n = u_lutP.x; c = clamp(c, 0.0, 1.0);
	float bb = c.b * (n - 1.0), b0 = floor(bb), b1 = min(b0 + 1.0, n - 1.0), f = bb - b0;
	float x = (c.r * (n - 1.0) + 0.5) / (n * n), y = (c.g * (n - 1.0) + 0.5) / n;
	return mix(texture(u_lut, vec2(b0 / n + x, y)).rgb, texture(u_lut, vec2(b1 / n + x, y)).rgb, f);
}
void main() {
	vec2 uv = gl_FragCoord.xy / u_size;
	vec4 c = texelFetch(u_tex, ivec2(gl_FragCoord.xy), 0);
	if (u_tm.w > 0.5) c.rgb = fxaa(gl_FragCoord.xy, 1.0 / u_size);
	if (u_strength > 0.0) c.rgb += texture(u_bloom, uv).rgb * u_strength;
	if (u_tm.z > 0.5) c.rgb = tonemap(c.rgb);
	if (u_lutP.z > 0.5) c.rgb = mix(c.rgb, lut3(c.rgb), u_lutP.y);
	if (u_vig.w > 0.5) { float d = length(uv - 0.5) * 1.41421356; c.rgb *= 1.0 - u_vig.x * smoothstep(u_vig.y - u_vig.z, u_vig.y, d); }
	o = c;
}`;function Ho(t,n){const e=(p,U)=>{const B=t.createShader(p);if(t.shaderSource(B,U),t.compileShader(B),!t.getShaderParameter(B,t.COMPILE_STATUS))throw new Error("depthout shader: "+t.getShaderInfoLog(B));return B},a=t.createProgram(),s=e(t.VERTEX_SHADER,Wc),v=e(t.FRAGMENT_SHADER,n);if(t.attachShader(a,s),t.attachShader(a,v),t.linkProgram(a),!t.getProgramParameter(a,t.LINK_STATUS))throw new Error("depthout link: "+t.getProgramInfoLog(a));return t.deleteShader(s),t.deleteShader(v),a}function Wr(t,n,e,a,s,v,p=!1){const U=t.createTexture();t.bindTexture(t.TEXTURE_2D,U),t.texImage2D(t.TEXTURE_2D,0,n,e,a,0,s,v,null);const B=p?t.LINEAR:t.NEAREST;return t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,B),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,B),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),U}function $c(t,n,e){const a=t.getContextAttributes()?.antialias?Math.min(4,t.getParameter(t.MAX_SAMPLES)||0):0,s=Ho(t,Hc),v=Ho(t,Kc),p=t.getUniformLocation(s,"u_tex"),U=t.getUniformLocation(v,"u_depth"),B=t.createVertexArray(),S=t.bindFramebuffer;let h=null,R=!1,k=null,y=null,O=null,se=0;const ae=(A,J)=>t.getUniformLocation(A,J);function le(A,J){if(!y){const m=Ho(t,qc),b=Ho(t,Yc),F=Ho(t,jc);y={bright:m,blur:b,comp:F,bTex:ae(m,"u_tex"),bTh:ae(m,"u_th"),lTex:ae(b,"u_tex"),lDir:ae(b,"u_dir"),cTex:ae(F,"u_tex"),cBloom:ae(F,"u_bloom"),cSize:ae(F,"u_size"),cStr:ae(F,"u_strength"),cVig:ae(F,"u_vig"),cTm:ae(F,"u_tm"),cLut:ae(F,"u_lut"),cLutP:ae(F,"u_lutP"),w:0,h:0,tex:[],fb:[]}}const _e=Math.max(1,Math.ceil(A/2)),ue=Math.max(1,Math.ceil(J/2));if(y.w===_e&&y.h===ue)return;for(const m of y.fb)t.deleteFramebuffer(m);for(const m of y.tex)t.deleteTexture(m);y.tex=[],y.fb=[];const _=t.getParameter(t.TEXTURE_BINDING_2D);for(let m=0;m<3;m++){const b=Wr(t,t.RGBA8,_e,ue,t.RGBA,t.UNSIGNED_BYTE,!0),F=t.createFramebuffer();S.call(t,t.FRAMEBUFFER,F),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,b,0),y.tex.push(b),y.fb.push(F)}S.call(t,t.FRAMEBUFFER,null),t.bindTexture(t.TEXTURE_2D,_),y.w=_e,y.h=ue}function de(){if(y){for(const A of y.fb)t.deleteFramebuffer(A);for(const A of y.tex)t.deleteTexture(A);t.deleteProgram(y.bright),t.deleteProgram(y.blur),t.deleteProgram(y.comp),y=null}}function oe(){O&&(O.dispose(),O=null)}function ee(A){k=A||null,k||de(),k?.stages?.length||oe(),nt()}let fe=null;function We(){fe&&(fe.tex&&t.deleteTexture(fe.tex),fe=null)}function nt(){const A=k?.lut;if(!A){We();return}if(fe&&fe.url===A.url&&fe.size===A.size)return;We();const J=fe={url:A.url,size:A.size,tex:null,n:0,ready:!1};Gu(A.url,A.size).then(_e=>{if(fe!==J)return;const ue=t.getParameter(t.TEXTURE_BINDING_2D);J.tex=Wr(t,t.RGBA8,_e.size*_e.size,_e.size,t.RGBA,t.UNSIGNED_BYTE,!0),t.texSubImage2D(t.TEXTURE_2D,0,0,0,_e.size*_e.size,_e.size,t.RGBA,t.UNSIGNED_BYTE,_e.data),t.bindTexture(t.TEXTURE_2D,ue),J.n=_e.size,J.ready=!0,e?.()}).catch(_e=>{fe===J&&(J.ready=!1,J.failed=!0),console.warn("[post] lut load failed:",_e?.message||_e)})}function j(A,J,_e){const ue=k.bloom,_=k.vignette,m=k.tonemap,b=!!(k.lut&&fe&&fe.ready&&fe.url===k.lut.url);le(A,J);const F=k.stages?.length?k.stages:null;F&&(O??=Gf(t,S,B,e));const re=F&&O.drawable(F)?O.target(A,J):null;t.activeTexture(t.TEXTURE1);const Se=t.getParameter(t.TEXTURE_BINDING_2D);t.activeTexture(t.TEXTURE2);const Ae=t.getParameter(t.TEXTURE_BINDING_2D);t.activeTexture(t.TEXTURE0);try{ue&&(t.viewport(0,0,y.w,y.h),S.call(t,t.FRAMEBUFFER,y.fb[0]),t.useProgram(y.bright),t.uniform1i(y.bTex,0),t.uniform1f(y.bTh,ue.threshold),t.bindTexture(t.TEXTURE_2D,h.colorTex),t.drawArrays(t.TRIANGLES,0,3),t.useProgram(y.blur),t.uniform1i(y.lTex,0),S.call(t,t.FRAMEBUFFER,y.fb[1]),t.uniform2f(y.lDir,ue.radius,0),t.bindTexture(t.TEXTURE_2D,y.tex[0]),t.drawArrays(t.TRIANGLES,0,3),S.call(t,t.FRAMEBUFFER,y.fb[2]),t.uniform2f(y.lDir,0,ue.radius),t.bindTexture(t.TEXTURE_2D,y.tex[1]),t.drawArrays(t.TRIANGLES,0,3),t.viewport(0,0,A,J)),S.call(t,t.FRAMEBUFFER,re?re.fb:null),t.useProgram(y.comp),t.uniform1i(y.cTex,0),t.uniform1i(y.cBloom,1),t.uniform2f(y.cSize,A,J),t.uniform1f(y.cStr,ue?ue.strength:0),t.uniform4f(y.cVig,_?_.strength:0,_?_.radius:1,_?_.softness:.5,_?1:0),t.uniform4f(y.cTm,m?Vc[m.mode]??2:0,m?m.exposure:1,m?1:0,k.fxaa?1:0),t.uniform1i(y.cLut,2),t.uniform4f(y.cLutP,b?fe.n:1,b?k.lut.intensity:0,b?1:0,0),t.bindTexture(t.TEXTURE_2D,h.colorTex),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,ue?y.tex[2]:h.colorTex),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,b?fe.tex:h.colorTex),t.activeTexture(t.TEXTURE0),t.drawArrays(t.TRIANGLES,0,3),re&&O.run(F,re.tex,h.depthTex,A,J,_e)}finally{t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,Se),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,Ae),t.activeTexture(t.TEXTURE0)}}function be(){if(h){for(const A of[h.scene,h.res,h.enc])A&&t.deleteFramebuffer(A);for(const A of[h.colorRb,h.dsRb,h.encRb])A&&t.deleteRenderbuffer(A);t.deleteTexture(h.colorTex),t.deleteTexture(h.depthTex),h=null}}function He(A,J){if(h&&h.w===A&&h.h===J)return;be();const _e=t.getParameter(t.TEXTURE_BINDING_2D),ue=t.getParameter(t.RENDERBUFFER_BINDING),_={w:A,h:J,pixels:new Uint8Array(A*J*4)};_.colorTex=Wr(t,t.RGBA8,A,J,t.RGBA,t.UNSIGNED_BYTE,!0),_.depthTex=Wr(t,t.DEPTH24_STENCIL8,A,J,t.DEPTH_STENCIL,t.UNSIGNED_INT_24_8),_.res=t.createFramebuffer(),S.call(t,t.FRAMEBUFFER,_.res),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,_.colorTex,0),t.framebufferTexture2D(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.TEXTURE_2D,_.depthTex,0);const m=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE;a>0?(_.scene=t.createFramebuffer(),S.call(t,t.FRAMEBUFFER,_.scene),_.colorRb=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,_.colorRb),t.renderbufferStorageMultisample(t.RENDERBUFFER,a,t.RGBA8,A,J),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.RENDERBUFFER,_.colorRb),_.dsRb=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,_.dsRb),t.renderbufferStorageMultisample(t.RENDERBUFFER,a,t.DEPTH24_STENCIL8,A,J),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.RENDERBUFFER,_.dsRb)):_.scene=_.res,_.enc=t.createFramebuffer(),S.call(t,t.FRAMEBUFFER,_.enc),_.encRb=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,_.encRb),t.renderbufferStorage(t.RENDERBUFFER,t.RGBA8,A,J),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.RENDERBUFFER,_.encRb);const b=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE;if(S.call(t,t.FRAMEBUFFER,null),t.bindTexture(t.TEXTURE_2D,_e),t.bindRenderbuffer(t.RENDERBUFFER,ue),h=_,!b||!m)throw be(),new Error("depthout: framebuffer incomplete");S.call(t,t.FRAMEBUFFER,_.scene);const F=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE;if(S.call(t,t.FRAMEBUFFER,null),!F)throw be(),new Error("depthout: scene framebuffer incomplete")}function Ye(){const A=n.width,J=n.height;if(!A||!J)return!1;He(A,J);const _e=h.scene;return t.bindFramebuffer=function(ue,_){return S.call(this,ue,_===null?_e:_)},S.call(t,t.FRAMEBUFFER,_e),R=!0,!0}function Ke(A){if(!R)return null;R=!1,delete t.bindFramebuffer;try{return ot(A?.depth!==!1,{logCoef:A?.logCoef||1,dpr:A?.dpr||1,fovy:A?.fovy||50*Math.PI/180,frame:++se})}finally{S.call(t,t.FRAMEBUFFER,null)}}function ot(A,J){const{w:_e,h:ue}=h,_=[t.BLEND,t.DEPTH_TEST,t.STENCIL_TEST,t.SCISSOR_TEST,t.CULL_FACE].map(ce=>[ce,t.isEnabled(ce)]),m=t.getParameter(t.CURRENT_PROGRAM),b=t.getParameter(t.VERTEX_ARRAY_BINDING),F=t.getParameter(t.ACTIVE_TEXTURE),re=t.getParameter(t.COLOR_WRITEMASK),Se=t.getParameter(t.PIXEL_PACK_BUFFER_BINDING),Ae=t.getParameter(t.VIEWPORT);t.activeTexture(t.TEXTURE0);const De=t.getParameter(t.TEXTURE_BINDING_2D);try{h.scene!==h.res&&(S.call(t,t.READ_FRAMEBUFFER,h.scene),S.call(t,t.DRAW_FRAMEBUFFER,h.res),t.blitFramebuffer(0,0,_e,ue,0,0,_e,ue,t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT|t.STENCIL_BUFFER_BIT,t.NEAREST));for(const[ce]of _)t.disable(ce);return t.colorMask(!0,!0,!0,!0),t.viewport(0,0,_e,ue),t.bindVertexArray(B),k?j(_e,ue,J):(S.call(t,t.FRAMEBUFFER,null),t.useProgram(s),t.uniform1i(p,0),t.bindTexture(t.TEXTURE_2D,h.colorTex),t.drawArrays(t.TRIANGLES,0,3)),A?(S.call(t,t.FRAMEBUFFER,h.enc),t.useProgram(v),t.uniform1i(U,0),t.bindTexture(t.TEXTURE_2D,h.depthTex),t.drawArrays(t.TRIANGLES,0,3),t.bindBuffer(t.PIXEL_PACK_BUFFER,null),t.readPixels(0,0,_e,ue,t.RGBA,t.UNSIGNED_BYTE,h.pixels),{pixels:h.pixels,w:_e,h:ue}):{pixels:null,w:_e,h:ue}}finally{S.call(t,t.FRAMEBUFFER,null),t.bindBuffer(t.PIXEL_PACK_BUFFER,Se),t.bindTexture(t.TEXTURE_2D,De),t.activeTexture(F),t.useProgram(m),t.bindVertexArray(b),t.colorMask(re[0],re[1],re[2],re[3]),t.viewport(Ae[0],Ae[1],Ae[2],Ae[3]);for(const[ce,ye]of _)ye&&t.enable(ce)}}function Xe(){R&&(R=!1,delete t.bindFramebuffer,S.call(t,t.FRAMEBUFFER,null))}function dt(){Xe(),be(),de(),oe(),We(),t.deleteProgram(s),t.deleteProgram(v),t.deleteVertexArray(B)}return{begin:Ye,end:Ke,abort:Xe,dispose:dt,bytes:()=>(h?h.w*h.h*(16+(a>0?a*8:0)):0)+(y?y.w*y.h*4*3:0)+(O?O.bytes():0)+(fe?.ready?fe.n*fe.n*fe.n*4:0),samples:a,setPost:ee}}const Zc=`#version 300 es
precision highp float;
in vec3 a_pos;
uniform mat4 u_mvp;
uniform vec4 u_clip;
uniform float u_logCoef;
uniform vec3 u_rel0;   // 原点−目（CPU の double で引く）
uniform float u_invK;   // 1/K（renderer の CLIP_K＝?clipk の clip 空間の倍率・u_mvp も u_clip も K 倍）＝深度は本当の w で（glsl.ts wTrue と同じ）
out float v_w;
out vec3 v_rel;
float log2p1(float w) { if (w < 0.1) return (w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715))))))) * 1.4426950; return log2(1.0 + w); }   // 1.0+w の桁落ちを避ける（glsl.ts PROJECT と同じ）
void main() {
	gl_Position = u_clip + u_mvp * vec4(a_pos, 0.0);
	v_w = gl_Position.w * u_invK;
	v_rel = u_rel0 + a_pos;
	gl_Position.z = (log2p1(max(v_w, 1e-30)) * u_logCoef - 1.0) * gl_Position.w;
}`,Qc=`#version 300 es
precision highp float;
uniform vec4 u_color;
uniform float u_logCoef;
uniform vec4 u_eye;   // xyz＝目・w＝|目|²−1（double）
uniform int u_ground;   // 1＝①b（深度の無い平らな地面）：地面より手前の画素を捨てる
in float v_w;
in vec3 v_rel;
out vec4 o;
float log1pS(float w) { if (w < 0.1) return w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715)))))); return log(1.0 + w); }
void main() {
	if (u_ground == 1) {
		// 目から画素への線分（t＝0..1）が単位球に当たる最初の t＜1 ＝画素は地面の向こう＝残す。当たらない・手前＝捨てる
		float A = dot(v_rel, v_rel), B = dot(u_eye.xyz, v_rel), D = B * B - A * u_eye.w;
		if (u_eye.w <= 0.0 || D < 0.0) discard;
		float t = (-B - sqrt(D)) / A;
		if (t <= 0.0 || t >= 1.0) discard;
	}
	gl_FragDepth = clamp(log1pS(max(v_w, 1e-30)) * 1.4426950 * u_logCoef * 0.5, 0.0, 1.0);
	o = vec4(u_color.rgb * u_color.a, u_color.a);
}`;function Jc(t){const n=new Map;let e=null,a={};const s=()=>{const h=(O,se)=>{const ae=t.createShader(O);if(t.shaderSource(ae,se),t.compileShader(ae),!t.getShaderParameter(ae,t.COMPILE_STATUS))throw new Error("[classify] "+t.getShaderInfoLog(ae));return ae},R=t.createProgram(),k=h(t.VERTEX_SHADER,Zc),y=h(t.FRAGMENT_SHADER,Qc);if(t.attachShader(R,k),t.attachShader(R,y),t.bindAttribLocation(R,0,"a_pos"),t.linkProgram(R),t.deleteShader(k),t.deleteShader(y),!t.getProgramParameter(R,t.LINK_STATUS))throw new Error("[classify] "+t.getProgramInfoLog(R));return a=Object.fromEntries(["u_mvp","u_clip","u_logCoef","u_color","u_rel0","u_eye","u_ground","u_invK"].map(O=>[O,t.getUniformLocation(R,O)])),R},v=h=>{t.deleteVertexArray(h.vao);for(const R of h.bufs)t.deleteBuffer(R)};function p(h,R){const k=n.get(h);if(k&&(v(k),n.delete(h)),!R||!R.pos?.length||!R.idx?.length)return;const y=t.createVertexArray(),O=t.createBuffer(),se=t.createBuffer();t.bindVertexArray(y),t.bindBuffer(t.ARRAY_BUFFER,O),t.bufferData(t.ARRAY_BUFFER,R.pos,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,3,t.FLOAT,!1,0,0),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,se),t.bufferData(t.ELEMENT_ARRAY_BUFFER,R.idx,t.STATIC_DRAW),t.bindVertexArray(null),t.bindBuffer(t.ARRAY_BUFFER,null),n.set(h,{vao:y,bufs:[O,se],count:R.idx.length,origin:Array.from(R.origin).slice(0,3),color:Array.from(R.color).slice(0,4),type:R.type??0})}function U(h,R){const k=n.get(h);!k||!R||(R.color&&(k.color=Array.from(R.color).slice(0,4)),R.type!=null&&(k.type=R.type))}function B(h,R,k=0,y=!1,O=1){if(!n.size)return;e??=s(),t.useProgram(e),t.uniformMatrix4fv(a.u_mvp,!1,h.mvp32),t.uniform1f(a.u_logCoef,R),t.uniform1f(a.u_invK,1/O);const se=h.eye,ae=Math.hypot(se[0],se[1],se[2]);t.uniform4f(a.u_eye,se[0],se[1],se[2],(ae-1)*(ae+1)),t.uniform1i(a.u_ground,0),t.enable(t.STENCIL_TEST),t.disable(t.CULL_FACE),t.depthMask(!1);for(const le of n.values()){if(!(le.color[3]>0))continue;const de=Vu(le.origin,k),oe=To(h.mvp,[de[0],de[1],de[2],1]);t.uniform4f(a.u_clip,oe[0]*O,oe[1]*O,oe[2]*O,oe[3]*O),t.uniform3f(a.u_rel0,de[0]-se[0],de[1]-se[1],de[2]-se[2]),t.uniform4f(a.u_color,le.color[0],le.color[1],le.color[2],le.color[3]),t.bindVertexArray(le.vao),t.colorMask(!1,!1,!1,!1),t.enable(t.DEPTH_TEST),t.depthFunc(t.LESS),t.stencilMask(127),t.stencilFunc(t.ALWAYS,0,255),t.stencilOpSeparate(t.BACK,t.KEEP,t.INCR_WRAP,t.KEEP),t.stencilOpSeparate(t.FRONT,t.KEEP,t.DECR_WRAP,t.KEEP),t.drawElements(t.TRIANGLES,le.count,t.UNSIGNED_INT,0),y&&le.type!==2&&(t.uniform1i(a.u_ground,1),t.stencilOpSeparate(t.BACK,t.KEEP,t.KEEP,t.INCR_WRAP),t.stencilOpSeparate(t.FRONT,t.KEEP,t.KEEP,t.DECR_WRAP),t.drawElements(t.TRIANGLES,le.count,t.UNSIGNED_INT,0),t.uniform1i(a.u_ground,0)),t.disable(t.DEPTH_TEST),le.type===1&&(t.stencilFunc(t.EQUAL,128,128),t.stencilOp(t.KEEP,t.KEEP,t.REPLACE),t.drawElements(t.TRIANGLES,le.count,t.UNSIGNED_INT,0)),t.colorMask(!0,!0,!0,!0),le.type===2?t.stencilFunc(t.LESS,128,255):t.stencilFunc(t.NOTEQUAL,0,127),t.stencilOp(t.KEEP,t.KEEP,t.ZERO),t.drawElements(t.TRIANGLES,le.count,t.UNSIGNED_INT,0),le.type===2&&(t.colorMask(!1,!1,!1,!1),t.stencilFunc(t.ALWAYS,0,255),t.drawElements(t.TRIANGLES,le.count,t.UNSIGNED_INT,0),t.colorMask(!0,!0,!0,!0))}t.bindVertexArray(null),t.stencilOp(t.KEEP,t.KEEP,t.KEEP),t.stencilFunc(t.ALWAYS,0,255),t.stencilMask(255),t.disable(t.STENCIL_TEST),t.depthMask(!0),t.depthFunc(t.LESS),t.enable(t.DEPTH_TEST)}function S(){for(const h of n.values())v(h);n.clear(),e&&t.deleteProgram(e),e=null}return{set:p,style:U,draw:B,dispose:S,get size(){return n.size}}}function yo(t,n,e,a,s,v,p,U,B){t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,a),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,s),t.uniform1i(n.u_arc_tex,0),t.uniform1i(n.u_meta_tex,1),t.uniform1i(n.u_arc_w,v),t.uniform1i(n.u_meta_w,p),t.uniformMatrix4fv(n.u_mvp,!1,e.mvp),t.uniform3f(n.u_eye,e.eye[0],e.eye[1],e.eye[2]);const S=(e.origin[0]%360+540)%360-180;t.uniform2f(n.u_origin,S,e.origin[1]),t.uniform2f(n.u_viewport,U,B),t.uniform1ui(n.u_ix_center,Math.round((S+180)*1e7)>>>0),t.uniform1ui(n.u_iy_center,Math.round((e.origin[1]+90)*1e7)>>>0);const h=S*Math.PI/180,R=nn(e.origin[1])*Math.PI/180;t.uniform4f(n.u_origin_trig,Math.cos(h),Math.sin(h),Math.cos(R),Math.sin(R));const k=uo(),y=e.origin[1]*Math.PI/180;n.u_ell_trig&&t.uniform4f(n.u_ell_trig,...k?[Math.cos(2*y),Math.sin(2*y),Math.cos(4*y),Math.sin(4*y)]:[0,0,0,0]),n.u_ell&&t.uniform1f(n.u_ell,k?1:0),e.clipT&&t.uniform4f(n.u_clipT,e.clipT[0],e.clipT[1],e.clipT[2],e.clipT[3]),t.uniform1f(n.u_origin_zr,e.originZr??0),t.uniform1f(n.u_lod_rank,e.lodRank??0),n.u_atlasOn&&t.uniform1f(n.u_atlasOn,e.atlas?1:0),n.u_atlas&&t.uniform4f(n.u_atlas,e.atlas?e.atlas.off[0]:0,e.atlas?e.atlas.off[1]:0,e.atlas?e.atlas.inv[0]:1,e.atlas?e.atlas.inv[1]:1)}function Jr(t,n,e,a=null){n.uniform1i(e.u_pivot_tex,2),n.uniform1i(e.u_pivot_w,t.pivotW||1),n.uniform1i(e.u_has_pivot,t.pivotTex?1:0),n.uniform1i(e.u_comp_tex,11),n.uniform1i(e.u_comp_w,t.compW||1),n.uniform1i(e.u_has_comp,t.pivotTex&&t.compTex?1:0);const s=t.lastViewBbox;if(n.uniform1i(e.u_use_vbb,t.pivotTex&&s?1:0),s&&n.uniform4ui(e.u_view_bbox,Math.max(0,s[0]-1e4),Math.max(0,s[1]-1e4),Math.min(4294967295,s[2]+1e4),Math.min(4294967295,s[3]+1e4)),e.u_far_q){const v=a&&t.pivotTex?Vf(a,s):null;n.uniform4f(e.u_far_q,v?v.q[0]:0,v?v.q[1]:0,v?1:0,Wf),v&&(n.uniform4f(e.u_far_axes,v.axes[0],v.axes[1],v.axes[2],v.axes[3]),n.uniform2ui(e.u_far_big,v.big[0],v.big[1]))}n.activeTexture(n.TEXTURE2),n.bindTexture(n.TEXTURE_2D,t.pivotTex||null),n.activeTexture(n.TEXTURE11),n.bindTexture(n.TEXTURE_2D,t.compTex||null),n.activeTexture(n.TEXTURE0)}function er(t,n,e){const a=e.depth;t.uniform1i(n.u_elevTex,7),t.uniform1f(n.u_logCoef,a?.logCoef??0),t.uniform1f(n.u_fogFar,a?.fogFar??1e9);const s=e.originPt;t.uniform3f(n.u_origin_pt,s?.[0]??0,s?.[1]??0,s?.[2]??0),t.uniform1f(n.u_elevScale,a?.elevScale??0),t.uniform1f(n.u_hasElev,a?.hasElev??0),t.uniform1f(n.u_elevEdgeFade,a?.edgeFade??0);const v=a?.elevBounds;t.uniform4f(n.u_elevBounds,v?.[0]??0,v?.[1]??0,v?.[2]??1,v?.[3]??1);const p=a?.meshQ;if(t.uniform4f(n.u_meshQ,p?.[0]??0,p?.[1]??0,p?.[2]??1,p?.[3]??1),t.uniform1f(n.u_meshG,a?.meshG??0),n.u_near){const U=e.near;t.uniform2f(n.u_near,U?.[0]??0,U?.[1]??0)}return n.u_sub&&t.uniform1i(n.u_sub,1),n.u_subSkipE7&&t.uniform1ui(n.u_subSkipE7,0),n.u_hidden&&t.uniform1f(n.u_hidden,0),a?.elevTex&&(t.activeTexture(t.TEXTURE7),t.bindTexture(t.TEXTURE_2D,a.elevTex),t.activeTexture(t.TEXTURE0)),a}function fo(t,n,e,a,s,v){const p=t.createTexture();return t.bindTexture(t.TEXTURE_2D,p),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,s,e,a,0,v,t.UNSIGNED_INT,n),p}const es=254.5/255,ts=.5/255,Hr=6,Kr=7,os=24,rs=new Float32Array(4),is=new Float32Array([0,-1,0,1,1,-1,1,-1,0,1,1,1]),ns=new Float32Array([0,-1,0,1,1,-1,1,1]),as=new Uint8Array([0,1,2,2,1,3]),Hi=["terrain","buildings","models","vector"],Ki=[-180,-90,360,180];function i0(t,n={}){Fu(n.meshLod||1),Lu(n.meshRange||0),wu(n.meshLodZ0||15,n.meshLodZ||1);const e=t.getContext("webgl2",{antialias:!n.msaa1,premultipliedAlpha:!0,stencil:!0,powerPreference:n.powerPreference??Pu()});if(!e)throw new Error("WebGL2 unavailable");const a=Me(e,Qr,Yo),s=Me(e,Ji,jo);let v=a,p=s;const U=e.getAttribLocation(p,"a_off"),B=o=>f(e,p,o),S=()=>{U>=0&&e.vertexAttrib3f(U,0,0,0),e.uniform1f(B("u_cj"),0),e.uniform4f(B("u_dashP"),0,0,0,0),e.uniform4f(B("u_tr"),0,0,0,0),e.uniform2f(B("u_blur"),0,0),e.uniform4f(B("u_pz"),0,0,0,0),e.uniform2f(B("u_pzO"),0,0),e.uniform4f(B("u_lt"),0,0,0,0)},h=(o,r,i,l)=>{if(!i||!(i[0]||i[1]))e.uniform4f(o,0,0,0,0);else{const u=i[2]&&l.bearing||0,d=Math.cos(u),E=Math.sin(u);e.uniform4f(o,i[0]*d-i[1]*E,i[0]*E+i[1]*d,360/(256*2**(l.zoom||0)),0)}r&&e.uniform2f(r,i?i[4]?i[3]:i[3]*(l.dpr||1):0,i?i[4]:0)};let R=new Map;const k=new WeakMap,y=(o,r,i)=>{const l=f(e,o,"u_pzO");if(!r){e.uniform4f(f(e,o,"u_pz"),0,0,0,0),l&&e.uniform2f(l,0,0);return}const u=Xf(k,r,i.zoom||0,I.dashDz??1);e.uniform4f(f(e,o,"u_pz"),u.c?1:0,u.hw!=null?1:0,u.hw??0,u.hwF),u.c&&e.uniform4f(f(e,o,"u_pzC"),u.c[0],u.c[1],u.c[2],u.c[3]),l&&e.uniform2f(l,u.off!=null?1:0,u.off??0)},O=new Map,se=16;{const o=e.createTexture();e.activeTexture(e.TEXTURE0+se),e.bindTexture(e.TEXTURE_2D,o),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array(4)),e.activeTexture(e.TEXTURE0)}const ae=new Map,le=o=>{e.useProgram(o),e.uniform1i(f(e,o,"u_ltTex"),se),e.uniform4f(f(e,o,"u_lt"),0,0,0,0)};le(s);const de=(o,r,i)=>{const l=f(e,o,"u_lt");if(r?.pat){const d=ee(r.pat);if(!d)return!1;e.activeTexture(e.TEXTURE0+se),e.bindTexture(e.TEXTURE_2D,d.tex),e.activeTexture(e.TEXTURE0);const E=i.zoom||0,g=E-(I.dashDz??1);return e.uniform4f(l,2,2**(E-24-(g-Math.floor(g)))*Math.cos((i.center?.[1]||0)*Math.PI/180),r.o??1,0),!0}if(!r?.lut)return e.uniform4f(l,0,0,0,0),!0;let u=ae.get(r.key);if(u)e.activeTexture(e.TEXTURE0+se),e.bindTexture(e.TEXTURE_2D,u);else{if(ae.size>=64){const d=ae.keys().next().value;e.deleteTexture(ae.get(d)),ae.delete(d)}u=e.createTexture(),e.activeTexture(e.TEXTURE0+se),e.bindTexture(e.TEXTURE_2D,u),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,r.lut.length>>2,1,0,e.RGBA,e.UNSIGNED_BYTE,r.lut),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),ae.set(r.key,u)}return e.activeTexture(e.TEXTURE0),e.uniform4f(l,1,0,0,0),!0},oe=o=>{if(!o?.name)return;const r=O.get(o.name);r?.tex&&e.deleteTexture(r.tex),o.bitmap?O.set(o.name,{bm:o.bitmap,pr:o.pixelRatio||1,tex:null}):O.delete(o.name)},ee=o=>{const r=O.get(o);if(!r)return null;if(!r.tex){try{r.tex=e.createTexture(),e.activeTexture(e.TEXTURE0+se),e.bindTexture(e.TEXTURE_2D,r.tex),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r.bm),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT)}catch{return r.tex&&e.deleteTexture(r.tex),O.delete(o),e.activeTexture(e.TEXTURE0),null}e.activeTexture(e.TEXTURE0)}return r},fe=(o,r,i,l)=>{if(e.uniform1i(f(e,o,"u_patTex"),se),!r)return e.uniform4f(f(e,o,"u_patP"),0,0,0,0),!0;const u=ee(r);if(!u)return!1;const d=I.dashDz??1,E=Math.floor((l.zoom||0)-d)+d,g=256*2**E,C=u.bm.width/u.pr,w=u.bm.height/u.pr,N=(i[0]+180)/360*g,$=Math.sin(i[1]*Math.PI/180),W=(.5-Math.log((1+$)/(1-$))/(4*Math.PI))*g;return e.activeTexture(e.TEXTURE0+se),e.bindTexture(e.TEXTURE_2D,u.tex),e.activeTexture(e.TEXTURE0),e.uniform4f(f(e,o,"u_patP"),N-C*Math.floor(N/C),W-w*Math.floor(W/w),1/C,1/w),e.uniform1f(f(e,o,"u_patK"),g/360),!0},We=(o,r,i,l)=>{if(!i){e.uniform4f(o,0,0,0,0);return}const u=l.zoom||0,d=u-(I.dashDz??1);e.uniform4f(o,i.P,i.n,i.round,2**(u-24-(d-Math.floor(d)))*Math.cos((l.center?.[1]||0)*Math.PI/180)),e.uniform4fv(r,i.iv)},nt=Me(e,Gt,Qi);let j=nt;const be=Me(e,Gt,sc),He=Me(e,Gt,_c),Ye=Me(e,$o,qo),Ke=Me(e,qr,Zi),ot=Me(e,Zo,Jo),Xe=Me(e,ho,Zr),dt=Ko(e,ic,nc,Object.fromEntries(["a_pos","a_normal","a_uv","a_col"].map(o=>[o,e.getAttribLocation(Xe,o)])));let Fe=Ye,A=Ke,J=ot,_e=Xe,ue=null;const _=Math.ceil(ki*4/Math.max(256,e.getParameter(e.UNIFORM_BUFFER_OFFSET_ALIGNMENT)))*Math.max(256,e.getParameter(e.UNIFORM_BUFFER_OFFSET_ALIGNMENT)),m=16;let b=null;const F=new Float32Array(ki);let re=null;const Se=o=>{const r={},i=e.getProgramParameter(o,e.ACTIVE_ATTRIBUTES);for(let l=0;l<i;l++){const u=e.getActiveAttrib(o,l);u&&(r[u.name]=e.getAttribLocation(o,u.name))}return r},Ae=(o,r,i)=>{const l=Ko(e,r,i,Se(o)),u=e.getUniformBlockIndex(l,"ClipP");return u!==e.INVALID_INDEX&&e.uniformBlockBinding(l,u,0),l},De=new Map;function ce(o,r){const i=(o?"c":"")+(r?"s":"");let l=De.get(i);if(l)return l;const u=(d,E,g,C,w,N)=>{let $=o?w:g,W=o?N:C;r&&($=Ic(E,$),W=Nc(E,W));const H=Ae(d,$,W);if(r){const M=e.getUniformBlockIndex(H,"ShadowP");M!==e.INVALID_INDEX&&e.uniformBlockBinding(H,M,1),e.useProgram(H),e.uniform1i(f(e,H,"u_shTex"),vn),e.uniform1i(f(e,H,"u_shRaw"),mn)}return H};return l={fill:u(a,"fill",Qr,Yo,Ac,wa),line:u(s,"line",Ji,jo,Lc,Pa),globe:u(nt,"globe",Gt,Qi,Gt,Pc),bld:u(Ye,"bld",$o,qo,ya,Aa),terrain:u(Ke,"terrain",qr,Zi,ga,gc),mesh:u(ot,"mesh",Zo,Jo,Fa,yc),meshTex:u(Xe,"meshTex",ho,Zr,La,Rc),mdFill:ft?Bo(u(ft.fill,"fill",en,Yo,Fc,wa)):null,mdLine:ft?Bo(u(ft.line,"line",tn,jo,wc,Pa)):null,mdBld:ft?u(ft.bld,"bld",Yr,qo,Ra,Aa):null},le(l.line),l.mdLine&&le(l.mdLine),e.useProgram(null),De.set(i,l),l}function ye(o){for(const[r,i]of[...De])if(o(r)){for(const l of Object.values(i))l&&e.deleteProgram(l);De.delete(r)}}function je(o,r){const i=o||r?ce(o,r):null;v=i?i.fill:a,p=i?i.line:s,j=i?i.globe:nt,Fe=i?i.bld:Ye,A=i?i.terrain:Ke,J=i?i.mesh:ot,_e=i?i.meshTex:Xe,T&&ft&&(T.fillProg=i?.mdFill||ft.fill,T.lineProg=i?.mdLine||ft.line,T.bldProg=i?.mdBld||ft.bld)}function Ce(o,r){if(!re)return;const i=r||[0,0],l=`${o}|${i[0]}|${i[1]}`;let u=re.slots.get(l);if(u===void 0){u=re.slots.size%m;const d=re.tp[o]||[],E=ue.style;Ou(d,lo(i[0],i[1]),F,{...E,capOn:E.capOn&&d.length>0,edgeWidth:E.edgeWidth*re.dpr},re.tg[o]||null),e.bindBuffer(e.UNIFORM_BUFFER,b),e.bufferSubData(e.UNIFORM_BUFFER,u*_,F),re.slots.set(l,u)}e.bindBufferRange(e.UNIFORM_BUFFER,0,b,u*_,ki*4)}function Tt(o){const r=ue?Object.fromEntries(Hi.map(u=>[u,Iu(ue,u)])):null,i=ue?Object.fromEntries(Hi.map(u=>[u,Nu(ue,u)])):null,l=!!r&&Hi.some(u=>r[u].length>0||!!i[u]);return l&&!b&&(b=e.createBuffer(),e.bindBuffer(e.UNIFORM_BUFFER,b),e.bufferData(e.UNIFORM_BUFFER,_*m,e.DYNAMIC_DRAW)),re=l?{tp:r,tg:i,dpr:o,slots:new Map}:null,l}let Ie=null;const Yt=new Float32Array(72);function rr(o,r,i,l,u,d,E,g){if(!Ie){Ie=Me(e,Sc,Dc);const N=e.getUniformBlockIndex(Ie,"ClipP");N!==e.INVALID_INDEX&&e.uniformBlockBinding(Ie,N,0)}const C=xe.G-1,w=lo(i[0],i[1]);ke(Ie,o,i,g),e.uniform1f(f(e,Ie,"u_fogNear"),E.near),e.uniform1f(f(e,Ie,"u_fogFar"),E.far),e.uniform3f(f(e,Ie,"u_fogColor"),E.color[0],E.color[1],E.color[2]),e.uniform4f(f(e,Ie,"u_mesh"),l[0],l[1],l[2],l[3]),e.uniform4f(f(e,Ie,"u_capG"),(i[0]-l[0])/l[2]*C,(i[1]-l[1])/l[3]*C,C/l[2],C/l[3]),e.uniform4f(f(e,Ie,"u_capH"),C,d?1:0,0,0),Yt.fill(0),Sf(Yt,0,r,w,l,u),e.uniform4fv(f(e,Ie,"u_capQ"),Yt),Ce("terrain",i),e.bindVertexArray(mt),e.drawArraysInstanced(e.TRIANGLES,0,6,Math.min(r.length,6))}function dn(){Ie&&e.deleteProgram(Ie),Ie=null,b&&e.deleteBuffer(b),b=null,re=null,ye(o=>o.includes("c")),je(!1,!1)}const Ne=n.clipK>0?2**Math.round(n.clipK):1,Ut=n.lowMem?1024:2048,ir=n.lowMem?2:3,vn=18,mn=19,_i=20,xn=22,di=23,vi=21,cl=.018,sl=4,_l=.7;let jt={on:!1},rt=null;function dl(){if(rt)return rt;const o=e.createTexture();e.bindTexture(e.TEXTURE_2D_ARRAY,o),e.texStorage3D(e.TEXTURE_2D_ARRAY,1,e.DEPTH_COMPONENT32F,Ut,Ut,ir),e.bindTexture(e.TEXTURE_2D_ARRAY,null);const r=Array.from({length:ir},(u,d)=>{const E=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,E),e.framebufferTextureLayer(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,o,0,d),e.drawBuffers([e.NONE]),e.readBuffer(e.NONE),E});e.bindFramebuffer(e.FRAMEBUFFER,null);const i=u=>{const d=e.createSampler();return e.samplerParameteri(d,e.TEXTURE_MIN_FILTER,u?e.LINEAR:e.NEAREST),e.samplerParameteri(d,e.TEXTURE_MAG_FILTER,u?e.LINEAR:e.NEAREST),e.samplerParameteri(d,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.samplerParameteri(d,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),u&&(e.samplerParameteri(d,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.samplerParameteri(d,e.TEXTURE_COMPARE_FUNC,e.LEQUAL)),d},l=e.createBuffer();return e.bindBuffer(e.UNIFORM_BUFFER,l),e.bufferData(e.UNIFORM_BUFFER,224,e.DYNAMIC_DRAW),rt={tex:o,fbos:r,sampC:i(!0),sampR:i(!1),ubo:l,cpu:new Float32Array(56),cast:new Map},rt}function En(){if(rt){e.deleteTexture(rt.tex);for(const o of rt.fbos)e.deleteFramebuffer(o);e.deleteSampler(rt.sampC),e.deleteSampler(rt.sampR),e.deleteBuffer(rt.ubo);for(const o of rt.cast.values())e.deleteProgram(o);rt=null,ye(o=>o.includes("s")),je(!1,!1)}}const vl=o=>{const r=Array.from(o);for(let i=0;i<4;i++)r[2+4*i]=2*o[2+4*i]-o[3+4*i];return r};function nr(o,r){const i=o+(r?"|c":""),l=rt;let u=l.cast.get(i);if(u)return u;const[d,E,g]=o==="terrain"?[Ke,qr,ga]:o==="bld"?[Ye,$o,ya]:o==="mdBld"?[ft.bld,Yr,Ra]:o==="mesh"?[ot,Zo,Fa]:[Xe,ho,La],C=o==="meshTexCut"?r?Gc:Xc:r?kc:zc;return u=Ae(d,Oc(r?g:E),C),l.cast.set(i,u),u}function ml(o,r,i,l,u,d,E,g,C){const w=rt,N=vl(o.mvp),$={...i,mvp:Float64Array.from(N),mvp32:Float32Array.from(N,D=>D*Ne)};e.bindFramebuffer(e.FRAMEBUFFER,w.fbos[r]),e.viewport(0,0,Ut,Ut),e.disable(e.STENCIL_TEST),e.disable(e.BLEND),e.disable(e.CULL_FACE),e.enable(e.POLYGON_OFFSET_FILL),e.polygonOffset(3,0),e.enable(e.DEPTH_TEST),e.depthFunc(e.LESS),e.depthMask(!0),e.clearDepth(1),e.clear(e.DEPTH_BUFFER_BIT);const W=Ee.main.origin||[0,0],H=D=>{e.uniform4f(f(e,D,"u_meshQ"),g?g[0]:0,g?g[1]:0,g?g[2]:1,g?g[3]:1),e.uniform1f(f(e,D,"u_meshG"),g?xe.G:0)};if(u&&xe){const D=nr("terrain",d);ke(D,$,to,E),e.uniform1f(f(e,D,"u_fogNear"),C.near),e.uniform1f(f(e,D,"u_fogFar"),C.far);const z=xe.mesh;e.uniform4f(f(e,D,"u_mesh"),z[0],z[1],z[2],z[3]),Ce("terrain",to),e.bindVertexArray(xe.vao),e.drawElements(e.TRIANGLES,xe.count,e.UNSIGNED_INT,0)}const M=!!(l&&(l.skipMain||l.noBld));if(!M&&Ee.main.bld){const D=nr("bld",d);ke(D,$,W,E),H(D),Ce("buildings",W),e.bindVertexArray(Ee.main.bld.vao),e.drawArrays(e.TRIANGLES,0,Ee.main.bld.count)}else if(!M&&Ee.main.md&&Ee.main.md.bld&&ft){const D=nr("mdBld",d);ke(D,$,W,E),H(D),Ce("buildings",W),e.bindVertexArray(T.bldVAO);for(const z of Ee.main.md.bld)e.uniform2fv(f(e,D,"u_tileOff"),z.origins),T.ext.multiDrawArraysWEBGL(e.TRIANGLES,z.firsts,0,z.counts,0,z.counts.length)}const K=lo(W[0],W[1]),Z=new Set;for(const D of Le.values()){if(vo.has(D.ward)||D.noCast||D.blend&&!D.pre||!Ff(o.mvp,D.bbox,Lf))continue;const z=D.textured?D.cut>0||D.pre?"meshTexCut":"meshTex":"mesh",ie=nr(z,d);Z.has(ie)?e.useProgram(ie):(Z.add(ie),ke(ie,$,[0,0],E)),z==="meshTexCut"&&(e.activeTexture(e.TEXTURE7),e.bindTexture(e.TEXTURE_2D,D.tex),e.activeTexture(e.TEXTURE0),e.uniform1i(f(e,ie,"u_tex"),7),e.uniform1f(f(e,ie,"u_alphaCut"),D.pre?ts:D.cut)),d&&(Ce(D.textured?"models":"buildings",W),e.uniform3f(f(e,ie,"u_clO"),D.origin[0]-K[0],D.origin[1]-K[1],D.origin[2]-K[2]));const me=D.noLift||D.baked?null:D.drape?Ki:X.liftBounds;e.uniform4f(f(e,ie,"u_liftBounds"),me?me[0]:0,me?me[1]:0,me?me[2]:0,me?me[3]:0),e.uniform3f(f(e,ie,"u_meshOrigin"),D.origin[0],D.origin[1],D.origin[2]),e.uniform1f(f(e,ie,"u_xfOn"),D.xf?1:0),D.xf&&(e.uniformMatrix3fv(f(e,ie,"u_xfL"),!1,D.xf.subarray(0,9)),e.uniform3f(f(e,ie,"u_xfT"),D.xf[9],D.xf[10],D.xf[11]));const Re=To(N,[D.origin[0],D.origin[1],D.origin[2],1]);e.uniform4f(f(e,ie,"u_clipMesh"),Re[0]*Ne,Re[1]*Ne,Re[2]*Ne,Re[3]*Ne),e.bindVertexArray(D.vao),e.drawElements(e.TRIANGLES,D.count,e.UNSIGNED_INT,0)}e.bindVertexArray(null)}function xl(o,r,i,l,u,d,E,g){const C=t.width,w=t.height,N=jt.on&&o.zoom>=13?Ef(bf(jt.time??Xi(I.clock)),o.center,pf(o.zoom,o.center[1],C,w,o.dpr||1),Ut):null;if(!N)return!1;let $=[];if(ir>1){const me=[];for(let Re=0;Re<=6;Re++)for(let Ct=0;Ct<=6;Ct++){const ut=an(r,C*Ct/6,w*Re/6);ut&&me.push(lo(ut[0],ut[1]))}$=Tf(N,me,r.eye,Ut,ir-1)}const W=dl(),H=e.getParameter(e.FRAMEBUFFER_BINDING);[N,...$].forEach((me,Re)=>ml(me,Re,r,i,l,u,d,E,g)),e.disable(e.POLYGON_OFFSET_FILL),e.polygonOffset(0,0),e.bindFramebuffer(e.FRAMEBUFFER,H),e.viewport(0,0,C,w),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA);const K=lo(o.center[0],o.center[1]),Z=[Math.fround(K[0]),Math.fround(K[1]),Math.fround(K[2])],D=To(N.mvp,[Z[0],Z[1],Z[2],1]),z=W.cpu;z.fill(0),z.set(N.mvp,0),z[16]=D[0],z[17]=D[1],z[18]=D[2],z[19]=D[3],z[20]=Z[0],z[21]=Z[1],z[22]=Z[2],z[24]=hf(N.alt,jt.darkness),z[27]=_l;const ie=[...$.map((me,Re)=>({w:me,s:me.s,ox:me.ox,oy:me.oy,layer:Re+1})),{w:N,s:1,ox:0,oy:0,layer:0}];ie.forEach((me,Re)=>{z[28+Re*4]=me.s,z[29+Re*4]=me.ox,z[30+Re*4]=me.oy,z[31+Re*4]=me.layer,z[40+Re*4]=gf(me.w),z[41+Re*4]=1/Ut,z[42+Re*4]=me.w.texelM,z[43+Re*4]=Math.min(1/Math.tan(N.alt),6)*me.w.texelM*Ut/N.zRangeM}),z[52]=ie.length,z[53]=N.zRangeM,z[54]=cl,z[55]=sl,e.bindBuffer(e.UNIFORM_BUFFER,W.ubo),e.bufferSubData(e.UNIFORM_BUFFER,0,z),e.bindBufferBase(e.UNIFORM_BUFFER,1,W.ubo);for(const[me,Re]of[[vn,W.sampC],[mn,W.sampR]])e.activeTexture(e.TEXTURE0+me),e.bindTexture(e.TEXTURE_2D_ARRAY,W.tex),e.bindSampler(me,Re);return e.activeTexture(e.TEXTURE0),!0}const Mt=Me(e,Ec,pc),El=Ko(e,Ka,ba,{a_delta:e.getAttribLocation(v,"a_delta"),a_color:e.getAttribLocation(v,"a_color")}),ar=new Map,ht=new Float32Array(12),Lt=e.createTexture();e.bindTexture(e.TEXTURE_2D,Lt),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([255,255,255,255])),e.bindTexture(e.TEXTURE_2D,null);function pl(o){if(!o)return Lt;const r=e.createTexture();e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),o.bitmap?e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o.bitmap):e.texImage2D(e.TEXTURE_2D,0,e.RGBA,o.w,o.h,0,e.RGBA,e.UNSIGNED_BYTE,o.rgba),e.generateMipmap(e.TEXTURE_2D),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR);const i=e.getExtension("EXT_texture_filter_anisotropic");return i&&e.texParameterf(e.TEXTURE_2D,i.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,e.getParameter(i.MAX_TEXTURE_MAX_ANISOTROPY_EXT)||1)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),e.bindTexture(e.TEXTURE_2D,null),r}const wt=Me(e,uc,fc),lr=Me(e,Gt,cc),vt=Me(e,Gt,xc),pn=Me(e,pa,dc),bn=Me(e,pa,vc),ur=Me(e,Gt,mc),mi=n.quad4!==!1,Tn=he(e,mi?ns:is);let so=null;mi&&(so=e.createBuffer(),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,so),e.bufferData(e.ELEMENT_ARRAY_BUFFER,as,e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,null));const hn=o=>{mi?e.drawElementsInstanced(e.TRIANGLES,6,e.UNSIGNED_BYTE,0,o):e.drawArraysInstanced(e.TRIANGLES,0,6,o)},mt=e.createVertexArray();let qe=null,X={bounds:[0,0,1,0],scale:0,has:0},xe=null,Ze=null,ve={bounds:[0,0,1,0],has:0,edgeFade:0},at=null,Oe={bounds:[0,0,1,0],has:0,edgeFade:0},ze={bounds:[0,0,1,0],has:0,edgeFade:0},Ro=null,gn=!1;function yn(o){Ro||gn||!o||(gn=!0,fetch(o).then(r=>r.blob()).then(r=>createImageBitmap(r,{premultiplyAlpha:"none"})).then(r=>{Ro=e.createTexture(),e.activeTexture(e.TEXTURE12),e.bindTexture(e.TEXTURE_2D,Ro),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.activeTexture(e.TEXTURE0),r.close(),n.requestDraw?.()}).catch(r=>{console.warn("[hypso] climate texture load failed (continuing with latitude approximation)",r)}))}let $t=null,Qe={bbox:[0,0,1,1],has:0,pair:0,half:0},xi=null;function bl(o){if(!o){$t&&e.deleteTexture($t),$t=null,Qe={bbox:[0,0,1,1],has:0,bytes:0,pair:0,half:0};return}const{rgba:r,w:i,h:l,bboxLL:u,pair:d}=o;$t||($t=e.createTexture()),e.activeTexture(e.TEXTURE9),e.bindTexture(e.TEXTURE_2D,$t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,i,l,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array(r.buffer||r,r.byteOffset||0,r.byteLength??r.length)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.activeTexture(e.TEXTURE0),Qe={bbox:[u[0],u[1],u[2]-u[0],u[3]-u[1]],has:1,bytes:i*l*4,pair:d?1:0,half:.5/l}}const Tl=()=>xi==null?2:(xi-Qe.bbox[0])/Qe.bbox[2];function fr(o){e.uniform1i(f(e,o,"u_cogTex"),9),e.uniform1f(f(e,o,"u_hasCog"),Qe.has),e.uniform4f(f(e,o,"u_cogPair"),Qe.pair,Tl(),Qe.half,0),e.activeTexture(e.TEXTURE9),e.bindTexture(e.TEXTURE_2D,Qe.has?$t:null),e.activeTexture(e.TEXTURE0)}function Rn(o,r){if(!Qe.has)return;const[i,l,u,d]=Qe.bbox,E=r||[0,0];e.uniform4f(f(e,o,"u_cogOffInv"),(E[0]-i)/u,(E[1]-l)/d,1/u,1/d)}function cr(o){if(!Qe.has)return;const[r,i,l,u]=Qe.bbox;e.uniform4f(f(e,A,"u_cogMesh"),(o[0]-r)/l,(o[1]-i)/u,o[2]/l,o[3]/u)}let xt=null,sr=0,Je=null,_r=0;const G={split:!1,w:[null,null,null,null],n:0,key:"",tiles:0,bytes:0,rasterOn:!1,fillsIn:!1,faces:0};function hl(o){const r=e.createTexture();e.activeTexture(e.TEXTURE10),e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o),e.generateMipmap(e.TEXTURE_2D),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindTexture(e.TEXTURE_2D,null),e.activeTexture(e.TEXTURE0);const i=Math.round(o.width*o.height*4*4/3);return sr+=i,{kind:"tex",tex:r,bytes:i,w:o.width,h:o.height,nearest:!1}}function gl({pos:o,uv:r,idx:i}){const l=e.createVertexArray(),u=he(e,o),d=he(e,r);e.bindVertexArray(l),ge(e,Mt,"a_delta",u,2),ge(e,Mt,"a_uv",d,2);const E=e.createBuffer();e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,E),e.bufferData(e.ELEMENT_ARRAY_BUFFER,i,e.STATIC_DRAW),e.bindVertexArray(null);const g=o.byteLength+r.byteLength+i.byteLength;return sr+=g,{kind:"mesh",vao:l,bufs:[u,d,E],count:i.length,bytes:g}}function yl(o){if(o){if(o.kind==="tex")e.deleteTexture(o.tex);else{for(const r of o.bufs)e.deleteBuffer(r);e.deleteVertexArray(o.vao)}sr-=o.bytes||0}}function Rl(o){xt=o}function Al(o){const r=e.createTexture();e.activeTexture(e.TEXTURE13),e.bindTexture(e.TEXTURE_2D,r),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,o,o,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const i=e.getExtension("EXT_texture_filter_anisotropic");i&&e.texParameterf(e.TEXTURE_2D,i.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,e.getParameter(i.MAX_TEXTURE_MAX_ANISOTROPY_EXT)||1)),e.bindTexture(e.TEXTURE_2D,null),e.activeTexture(e.TEXTURE0);const l=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,l),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,r,0);const u=e.createRenderbuffer();e.bindRenderbuffer(e.RENDERBUFFER,u),e.renderbufferStorage(e.RENDERBUFFER,e.STENCIL_INDEX8,o,o),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.STENCIL_ATTACHMENT,e.RENDERBUFFER,u),e.bindRenderbuffer(e.RENDERBUFFER,null),e.bindFramebuffer(e.FRAMEBUFFER,null);const d=Math.round(o*o*4*4/3)+o*o;return G.bytes+=d,{tex:r,fbo:l,rb:u,size:o,win:[0,0,1,1],bytes:d}}function An(o){o&&(e.deleteFramebuffer(o.fbo),e.deleteTexture(o.tex),o.rb&&e.deleteRenderbuffer(o.rb),G.bytes-=o.bytes)}let Ao=null,Ei=null;function Fl(o,r){Ao=o||null,Ei=r||null}function Fn(o,r,i,l=0){e.useProgram(Mt),e.uniform2f(f(e,Mt,"u_winInv"),1/o.win[2],1/o.win[3]),e.uniform1i(f(e,Mt,"u_tex"),10),e.activeTexture(e.TEXTURE10);for(const u of xt.layers){if(u.order!==i||l&&u.split&&u.split!==l)continue;const d=u.resampling==="nearest";for(const E of u.draws){const g=E.bounds;g[2]<=r[0]||g[0]>=r[2]||g[3]<=r[1]||g[1]>=r[3]||(e.uniform1f(f(e,Mt,"u_opacity"),u.opacity*(E.a??1)),e.uniform2f(f(e,Mt,"u_tileOff"),E.nw[0]-o.win[0],E.nw[1]-o.win[1]),e.uniform4f(f(e,Mt,"u_uvT"),E.uvT[0],E.uvT[1],E.uvT[2],E.uvT[3]),e.bindTexture(e.TEXTURE_2D,E.tex.tex),E.tex.nearest!==d&&(E.tex.nearest=d,e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,d?e.NEAREST_MIPMAP_NEAREST:e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,d?e.NEAREST:e.LINEAR)),e.bindVertexArray(E.mesh.vao),e.drawElements(e.TRIANGLES,E.mesh.count,e.UNSIGNED_SHORT,0),G.tiles++)}}e.bindVertexArray(null),e.bindTexture(e.TEXTURE_2D,null),e.activeTexture(e.TEXTURE0)}function Fo(o,r,i,l,u,d,E=-1/0,g=1/0,C=null){const w=N=>C?C(N):N.li>=E&&N.li<g;e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,X.has&&qe?qe:null),e.activeTexture(e.TEXTURE8),e.bindTexture(e.TEXTURE_2D,ve.has&&Ze?Ze:null),e.activeTexture(e.TEXTURE0+_i),e.bindTexture(e.TEXTURE_2D,Oe.has&&at?at:null),e.activeTexture(e.TEXTURE0);for(const N of l){const $=Ee[N];if($.md){T.atlasFillProg||(T.atlasFillProg=Bo(Ko(e,bc,ba,{a_delta:e.getAttribLocation(T.fillProg,"a_delta"),a_color:e.getAttribLocation(T.fillProg,"a_color")})));const H=T.atlasFillProg;e.useProgram(H),Gn(),ke(H,r,$.origin,i),e.uniform2f(f(e,H,"u_atlOff"),$.origin[0]-o.win[0],$.origin[1]-o.win[1]),e.uniform2f(f(e,H,"u_atlInv"),1/o.win[2],1/o.win[3]),e.uniform1f(f(e,H,"u_baseAlpha"),d),e.bindVertexArray(T.fillVAO);for(const M of $.md.layers){if(M.kind!=="fill"||!w(M)||M.pat)continue;const K=Xr(M.li)!=null,Z=M.li===lt.li||M.li===lt.li2;(K||Z)&&u||yt.li>=0&&M.li===yt.li||(e.uniform1f(f(e,H,"u_seaGate"),K?1:0),e.uniform1f(f(e,H,"u_pt"),M.pt?1:0),e.uniform2fv(f(e,H,"u_tileOff"),M.origins),T.ext.multiDrawElementsWEBGL(e.TRIANGLES,M.counts,0,e.UNSIGNED_INT,M.offsets,0,M.counts.length))}e.bindVertexArray(null);continue}if(!$.draws.length)continue;const W=El;ke(W,r,$.origin,i),e.uniform2f(f(e,W,"u_atlOff"),$.origin[0]-o.win[0],$.origin[1]-o.win[1]),e.uniform2f(f(e,W,"u_atlInv"),1/o.win[2],1/o.win[3]),e.uniform1f(f(e,W,"u_baseAlpha"),d);for(const H of $.draws){if(H.kind!=="fill"||!w(H)||H.pat)continue;const M=Xr(H.li)!=null,K=H.li===lt.li||H.li===lt.li2;(M||K)&&u||yt.li>=0&&H.li===yt.li||(e.uniform1f(f(e,W,"u_seaGate"),M?1:0),e.bindVertexArray(H.vao),H.idxT?e.drawElements(e.TRIANGLES,H.count,H.idxT,0):e.drawArrays(e.TRIANGLES,0,H.count))}e.bindVertexArray(null)}}function Ll(o,r,i,l,u){const d=!!(xt&&xt.layers.length),E=l&&!(d&&xt.hideFills);if(G.rasterOn=d,G.fillsIn=l,!d&&!E&&!(l&&Ao)){G.split=!1,G.n=0,G.key="",G.tiles=0,G.faces=0;return}const g=af(o,t.width,t.height,ve.has&&ve.maxElev||0),C=o.zoom<lt.minzoom,w=I.baseAlpha??1,N=l&&u.indexOf("user")>=0,$=N?u.filter(Z=>Z!=="user"):u,W=d&&xt.layers.some(Z=>Z.split);G.split=W;const H=lf(g)+`|${d?xt.rev:-1}|${E?_r+":"+$.join(""):-1}|${C}|${w}|${yt.li}|${l&&Ao?Ei?Ei():"":-1}`+(N?`|u${_r}:${pr.rev}`:"");if(H===G.key)return;G.key=H,G.tiles=0,G.faces=0;const M=n.lowMem?1024:2048,K=uf(g,M);for(let Z=0;Z<g.length;Z++){const D=g[Z],z=K[Z];(!G.w[Z]||G.w[Z].size!==z)&&(G.w[Z]&&An(G.w[Z]),G.w[Z]=Al(z));const ie=G.w[Z];ie.win=[D[0],D[1],D[2]-D[0],D[3]-D[1]],e.bindFramebuffer(e.FRAMEBUFFER,ie.fbo),e.viewport(0,0,z,z),e.disable(e.DEPTH_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SCISSOR_TEST),e.disable(e.CULL_FACE),e.depthMask(!0),e.colorMask(!0,!0,!0,!0),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT);for(const me of W?[-1,1]:[0]){const Re=me>0?z>>1:0,Ct=me?z>>1:z;e.viewport(Re,0,Ct,z),d&&Fn(ie,D,"under",me);const ut=On(N&&E?[...$].reverse().find(Be=>Uo(Ee[Be])):null);if(E)for(const Be of $){if(Be!==ut.host){Fo(ie,r,i,[Be],C,w);continue}let ro=-1/0;for(const pt of ut.anchors)Fo(ie,r,i,[Be],C,w,ro,pt),Fo(ie,r,i,["user"],!1,1,-1/0,1/0,io=>ut.anchorOf(io.li)===pt),ro=pt;Fo(ie,r,i,[Be],C,w,ro,1/0)}if(N&&Fo(ie,r,i,["user"],!1,1,-1/0,1/0,ut.host?Be=>ut.anchorOf(Be.li)===1/0:null),d&&Fn(ie,D,"over",me),l&&Ao){try{G.faces+=Ao(o,{fbo:ie.fbo,win:ie.win,size:z})|0}catch(Be){console.error("[gl] ground hook",Be?.message)}e.bindFramebuffer(e.FRAMEBUFFER,ie.fbo),e.viewport(Re,0,Ct,z),e.disable(e.DEPTH_TEST),e.disable(e.STENCIL_TEST),e.colorMask(!0,!0,!0,!0),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.blendEquation(e.FUNC_ADD),e.bindVertexArray(null)}}e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindTexture(e.TEXTURE_2D,ie.tex),e.generateMipmap(e.TEXTURE_2D),e.bindTexture(e.TEXTURE_2D,null)}G.n=g.length}const Ln=[13,14,15,11];function dr(o){for(let r=0;r<4;r++)e.uniform1i(f(e,o,"u_gnd"+r),Ln[r]);e.uniform1f(f(e,o,"u_gndN"),G.n),e.uniform1f(f(e,o,"u_gndSplit"),G.n&&G.split?Li*t.width:-1);for(let r=0;r<4;r++)e.activeTexture(e.TEXTURE0+Ln[r]),e.bindTexture(e.TEXTURE_2D,r<G.n&&G.w[r]?G.w[r].tex:null);e.activeTexture(e.TEXTURE0)}function wn(o,r){if(!G.n)return;const i=r||[0,0];for(let l=0;l<G.n;l++){const[u,d,E,g]=G.w[l].win;e.uniform4f(f(e,o,"u_gndOffInv"+l),(i[0]-u)/E,(i[1]-d)/g,1/E,1/g)}}function vr(o){if(G.n)for(let r=0;r<G.n;r++){const[i,l,u,d]=G.w[r].win;e.uniform4f(f(e,A,"u_gndMesh"+r),(o[0]-i)/u,(o[1]-l)/d,o[2]/u,o[3]/d)}}function wl(o){for(let r=0;r<4;r++)Br(o,"u_gndOff"+r,r<G.n?G.w[r].win:null)}function pi(o){e.uniform1i(f(e,o,"u_climTex"),12),e.uniform1f(f(e,o,"u_hasClim"),Ro?1:0),e.activeTexture(e.TEXTURE12),e.bindTexture(e.TEXTURE_2D,Ro),e.activeTexture(e.TEXTURE0)}let bi=fa(null),Ti=null,mr=null,Pn=1,Sn=null;const Lo=()=>{const o=I.worldHypsoOpacity??1;return(I.worldHypso!==Ti||(I.sea??null)!==mr||o!==Pn||I.land!==Sn)&&(Ti=I.worldHypso,mr=I.sea??null,Pn=o,Sn=I.land,bi=sf(fa(Ti),o,I.land||[.96,.96,.95]),mr&&(bi.sea=mr)),bi};function hi(o){const r=Lo();e.uniform3f(f(e,o,"u_whLowH"),...r.lowHumid),e.uniform3f(f(e,o,"u_whLowA"),...r.lowArid),e.uniform3f(f(e,o,"u_whMidH"),...r.midHumid),e.uniform3f(f(e,o,"u_whMidA"),...r.midArid),e.uniform3f(f(e,o,"u_whR1"),...r.ramp1),e.uniform3f(f(e,o,"u_whR2"),...r.ramp2),e.uniform3f(f(e,o,"u_whPeak"),...r.peak),e.uniform3f(f(e,o,"u_whSnow"),...r.snow)}let gi=0,xr=0,yi=0,Dn=0;const Le=new Map,_o=Jc(e),Pl=()=>{for(const o of Le.values())if(o.keep2d)return!0;return!1},wo=new Map,vo=new Set,Ri=4;let I={clear:null,land:null,atmo:null,bldColor:null},Ge=null;const gt=()=>nf(Ge,I.fog===!1),Ai=o=>Ge?Ge.fog:o;function Sl(o){I={...I,...o}}let Po=null,Zt=null,Er=null;const Fi=17;function Dl(o){Zt=o&&typeof o.kind=="number"?o:null,Zt?.ramp&&Zt.rampN>0&&(Er||(Er=e.createTexture()),e.activeTexture(e.TEXTURE0+Fi),e.bindTexture(e.TEXTURE_2D,Er),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,Zt.rampN,1,0,e.RGBA,e.UNSIGNED_BYTE,Zt.ramp),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.activeTexture(e.TEXTURE0))}function Cn(o,r){const i=Zt;e.uniform4f(f(e,o,"u_gm"),i?i.kind:0,i?i.min:0,i?1/Math.max(1e-6,i.max-i.min):0,i&&i.landOnly?1:0);const l=i?.contour;e.uniform4f(f(e,o,"u_gmC"),l?l[0]:0,l?l[1]:0,l?l[2]:0,l?l[3]:0),e.uniform4f(f(e,o,"u_gmP"),i?Math.max(.001,i.spacing):1,i?i.width*r:0,i?i.opacity:0,0),e.uniform1i(f(e,o,"u_gmRamp"),Fi),e.activeTexture(e.TEXTURE0+Fi),e.bindTexture(e.TEXTURE_2D,i?.ramp?Er:null),e.activeTexture(e.TEXTURE0)}let Et=null;const mo=new Map;let Bn=0;const Un=o=>o.textured&&o.custom?mo.get(o.custom)??null:null;function Cl(o,r){const i=r.meta?.sig??"";if(o.progs.has(i))return o.progs.get(i);let l=null;try{const{vs:u,fs:d}=lc(r.meta?{...o.spec,metadata:{...o.spec.metadata,...r.meta.props}}:o.spec);l=Ko(e,u,d,{...Object.fromEntries(["a_pos","a_normal","a_uv","a_col"].map(E=>[E,e.getAttribLocation(Xe,E)])),a_mc:Hr,a_uvm:Kr,a_ol:e.getAttribLocation(Xe,"a_ol")})}catch(u){console.warn("[customShader] compile failed = drawn without it:",u.message.split(`
`)[0])}return o.progs.set(i,l),l}function Bl(o){for(const r of o.progs.values())r&&e.deleteProgram(r);for(const r of o.tex.values())e.deleteTexture(r)}function Mn(o){for(const r of o.meta?.texs||[])r!==Lt&&e.deleteTexture(r);o.paint&&e.deleteTexture(o.paint),o.paint=null}function In(o){const r=e.createTexture(),i=o.tex;e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_ALIGNMENT,1),i.bitmap?e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i.bitmap):e.texImage2D(e.TEXTURE_2D,0,e.RGBA,i.w,i.h,0,e.RGBA,e.UNSIGNED_BYTE,i.rgba);const l=o.nearest?e.NEAREST:e.LINEAR,u=o.repeat===!1?e.CLAMP_TO_EDGE:e.REPEAT;return e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,u),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,u),e.bindTexture(e.TEXTURE_2D,null),r}function Ul(o,r){const i=mo.get(o);if(!r){i&&(Bl(i),mo.delete(o));return}const l=i&&i.spec.vs===r.vs&&i.spec.fs===r.fs&&JSON.stringify(i.spec.uniforms)===JSON.stringify(r.uniforms)&&JSON.stringify(i.spec.metadata)===JSON.stringify(r.metadata);if(i&&l){i.spec=r;return}if(i)for(const u of i.progs.values())u&&e.deleteProgram(u);mo.set(o,{spec:r,progs:new Map,tex:i?i.tex:new Map})}const So=o=>o.blend?1:o.tint&&o.tint[3]<1||Un(o)?.spec.translucency==="TRANSLUCENT"?2:0;let Li=.5,et=null,Qt=null,Nn=0,It=null,lt={li:-1,minzoom:1/0},pr={ranges:[],rev:0};const On=o=>cf(pr.ranges,o);let yt={li:-1},Nt=null;const wi=3;let Jt=null,Do=null,eo=null,br=null,Tr=null;function Co(o,r,i,l){if(o&&(e.deleteBuffer(o.buf),e.deleteVertexArray(o.vao)),!r||!r.length)return null;const u=e.createVertexArray();e.bindVertexArray(u);const d=he(e,r);return l(),e.bindVertexArray(null),{vao:u,buf:d,count:r.length/i}}function Ml(o){Jt=Co(Jt,o,8,()=>{e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,32,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,4,e.FLOAT,!1,32,12),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,32,28)})}function Il(o){Do=Co(Do,o,3,()=>{e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,12,0)})}function Nl(o){eo=Co(eo,o,8,()=>{e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,32,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,4,e.FLOAT,!1,32,12),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,32,28)})}const zn=()=>{e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,12,0)};function Ol(o){br=Co(br,o,3,zn)}function zl(o){Tr=Co(Tr,o,3,zn)}let Pi=0,hr=0,kn=0,Ot=0,to=[0,0],gr=[0,0],xo=1,Si=null;const Ee={base:{origin:[0,0],draws:[],bld:null,md:null},main:{origin:[0,0],draws:[],bld:null,md:null},overlay:{origin:[0,0],draws:[],bld:null,md:null},user:{origin:[0,0],draws:[],bld:null,md:null}},Rt=2048,Xn=n.noMD?null:e.getExtension("WEBGL_multi_draw"),T=Xn?{ext:Xn,fillProg:Me(e,en,Yo),lineProg:Me(e,tn,jo),bldProg:Me(e,Yr,qo),fillV:{buf:null,bytes:0},fillI:{buf:null,bytes:0},bldV:{buf:null,bytes:0},lineTex:null,lineTexH:0,fillVAO:null,bldVAO:null}:null,ft=T?{fill:T.fillProg,line:T.lineProg,bld:T.bldProg}:null,Di=17,zt=1024,Eo=mf(zt/2),Pt={tex:null,h:0},Bo=o=>(e.useProgram(o),e.uniform1i(f(e,o,"u_ptTex"),Di),o);T&&(Bo(T.fillProg),Bo(T.lineProg),le(T.lineProg),e.useProgram(null));function kl(){const o=Eo.takeDirty();if(!o)return;const r=Eo.data,i=o[0]*2/zt|0,l=(o[1]*2+1)/zt|0,u=r.length/(zt*4);e.activeTexture(e.TEXTURE0+Di),!Pt.tex||u>Pt.h?(Pt.tex&&e.deleteTexture(Pt.tex),Pt.tex=e.createTexture(),e.bindTexture(e.TEXTURE_2D,Pt.tex),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage2D(e.TEXTURE_2D,0,e.RGBA32F,zt,u,0,e.RGBA,e.FLOAT,r),Pt.h=u):(e.bindTexture(e.TEXTURE_2D,Pt.tex),e.texSubImage2D(e.TEXTURE_2D,0,0,i,zt,l-i+1,e.RGBA,e.FLOAT,r.subarray(i*zt*4,(l+1)*zt*4))),e.activeTexture(e.TEXTURE0)}const Gn=()=>{kl(),e.activeTexture(e.TEXTURE0+Di),e.bindTexture(e.TEXTURE_2D,Pt.tex),e.activeTexture(e.TEXTURE0)};function Vn(){T.fillVAO&&e.deleteVertexArray(T.fillVAO),T.fillVAO=e.createVertexArray(),e.bindVertexArray(T.fillVAO),e.bindBuffer(e.ARRAY_BUFFER,T.fillV.buf);let o=e.getAttribLocation(T.fillProg,"a_delta");e.enableVertexAttribArray(o),e.vertexAttribPointer(o,2,e.FLOAT,!1,12,0),o=e.getAttribLocation(T.fillProg,"a_color"),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,4,e.UNSIGNED_BYTE,!0,12,8),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,T.fillI.buf),e.bindVertexArray(null)}function Xl(){T.bldVAO&&e.deleteVertexArray(T.bldVAO),T.bldVAO=e.createVertexArray(),e.bindVertexArray(T.bldVAO),e.bindBuffer(e.ARRAY_BUFFER,T.bldV.buf);let o=e.getAttribLocation(T.bldProg,"a_pos");e.enableVertexAttribArray(o),e.vertexAttribPointer(o,3,e.FLOAT,!1,24,0),o=e.getAttribLocation(T.bldProg,"a_shade"),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,1,e.FLOAT,!1,24,12),o=e.getAttribLocation(T.bldProg,"a_anchor"),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,2,e.FLOAT,!1,24,16),e.bindVertexArray(null)}function Ci(o,r,i){if(r<=o.bytes)return;const l=i?e.ELEMENT_ARRAY_BUFFER:e.COPY_WRITE_BUFFER;i&&e.bindVertexArray(null);const u=e.createBuffer();e.bindBuffer(l,u),e.bufferData(l,r,e.DYNAMIC_DRAW),o.buf&&(e.bindBuffer(e.COPY_READ_BUFFER,o.buf),e.copyBufferSubData(e.COPY_READ_BUFFER,l,0,0,o.bytes),e.deleteBuffer(o.buf)),e.bindBuffer(l,null),o.buf=u,o.bytes=r}function Gl(o,r){if(o==="fillV")Ci(T.fillV,r*12),Vn();else if(o==="fillI")Ci(T.fillI,r*4,!0),Vn();else if(o==="bldV")Ci(T.bldV,r*24),Xl();else if(o==="line"){const i=Math.ceil(r*2/Rt);if(i<=T.lineTexH)return;const l=e.createTexture();if(e.bindTexture(e.TEXTURE_2D,l),e.texImage2D(e.TEXTURE_2D,0,e.RGBA32UI,Rt,i,0,e.RGBA_INTEGER,e.UNSIGNED_INT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),T.lineTex){const u=e.createFramebuffer();e.bindFramebuffer(e.READ_FRAMEBUFFER,u),e.framebufferTexture2D(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,T.lineTex,0),e.copyTexSubImage2D(e.TEXTURE_2D,0,0,0,0,0,Rt,T.lineTexH),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.deleteFramebuffer(u),e.deleteTexture(T.lineTex)}T.lineTex=l,T.lineTexH=i}}function Vl(o){if(o.rows&&Eo.rows(o.rows),o.fill&&(e.bindBuffer(e.COPY_WRITE_BUFFER,T.fillV.buf),e.bufferSubData(e.COPY_WRITE_BUFFER,o.fill.base*12,new Uint8Array(o.fill.buf))),o.bld&&(e.bindBuffer(e.COPY_WRITE_BUFFER,T.bldV.buf),e.bufferSubData(e.COPY_WRITE_BUFFER,o.bld.base*24,o.bld.arr)),e.bindBuffer(e.COPY_WRITE_BUFFER,null),o.idx&&(e.bindVertexArray(null),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,T.fillI.buf),e.bufferSubData(e.ELEMENT_ARRAY_BUFFER,o.idx.base*4,o.idx.arr),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,null)),o.line){e.bindTexture(e.TEXTURE_2D,T.lineTex),e.pixelStorei(e.UNPACK_ALIGNMENT,4);let r=o.line.base*2,i=o.line.arr,l=0,u=i.length/4;const d=(C,w,N,$)=>{e.texSubImage2D(e.TEXTURE_2D,0,C,w,N,$,e.RGBA_INTEGER,e.UNSIGNED_INT,i.subarray(l*4,(l+N*$)*4)),l+=N*$,r+=N*$,u-=N*$},E=r%Rt;E&&d(E,r/Rt|0,Math.min(Rt-E,u),1);const g=u/Rt|0;g&&d(0,r/Rt|0,Rt,g),u&&d(0,r/Rt|0,u,1)}}function Wl(o){_r++,Oo(o.slot),Ee[o.slot]={origin:o.origin,draws:[],bld:null,md:{layers:o.layers,bld:o.bld}}}const Uo=o=>o.draws.length>0||!!(o.md&&o.md.layers.length);function Hl(o,r="main"){_r++,Oo(r);const i=[];for(const u of o.layers)if(u)if(u.kind==="fill"){if(!u.pos.length)continue;const d=e.createVertexArray(),E=he(e,u.pos),g=he(e,u.col);e.bindVertexArray(d),ge(e,v,"a_delta",E,2),ge(e,v,"a_color",g,4,null,u.col instanceof Uint8Array);const C=[E,g];let w=0,N=0;if(u.idx&&u.idx.length){const $=e.createBuffer();e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,$),e.bufferData(e.ELEMENT_ARRAY_BUFFER,u.idx,e.STATIC_DRAW),C.push($),w=u.idx.length,N=u.idx instanceof Uint16Array?e.UNSIGNED_SHORT:e.UNSIGNED_INT}e.bindVertexArray(null),i.push({kind:"fill",li:u.li,vao:d,count:w||u.pos.length/2,idxT:N,bufs:C,fx:u.fx||null,pat:u.pat||null,pz:u.pz||null})}else{if(!u.half.length)continue;const d=e.createVertexArray(),E=u.jf,g=(K,Z)=>{const D=new Float32Array(K.length+2);return D.set(K,Z?2:0),D},C=he(e,E?g(u.P1,!0):u.P1),w=he(e,E?g(u.P2,!1):u.P2),N=he(e,u.col),$=he(e,u.half),W=u.off?he(e,u.off):null;e.bindVertexArray(d),ge(e,p,"a_corner",Tn,2,0),so&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,so),ge(e,p,"a_p1",C,2,1,!1,E?8:0),ge(e,p,"a_p2",w,2,1),ge(e,p,"a_color",N,4,1,u.col instanceof Uint8Array),ge(e,p,"a_half",$,1,1),W&&ge(e,p,"a_off",W,3,1);const H=u.dist?he(e,u.dist):null;H&&ge(e,p,"a_dist",H,1,1);const M=E?he(e,E):null;if(M){ge(e,p,"a_p0",C,2,1),ge(e,p,"a_p3",w,2,1,!1,8);const K=e.getAttribLocation(p,"a_jf");K>=0&&(e.bindBuffer(e.ARRAY_BUFFER,M),e.enableVertexAttribArray(K),e.vertexAttribPointer(K,1,e.UNSIGNED_BYTE,!1,0,0),e.vertexAttribDivisor(K,1))}e.bindVertexArray(null),i.push({kind:"line",li:u.li,vao:d,count:u.half.length,bufs:[C,w,N,$,...W?[W]:[],...M?[M]:[],...H?[H]:[]],cj:M?u.cj??0:0,dash:H?ca(u.dash,M?u.cj??0:0):null,fx:u.fx||null,pz:u.pz||null,lt:u.lt||null})}let l=null;if(o.buildings&&o.buildings.pos.length){const u=e.createVertexArray(),d=he(e,o.buildings.pos),E=he(e,o.buildings.shade),g=he(e,o.buildings.anchor);e.bindVertexArray(u),ge(e,Fe,"a_pos",d,3),ge(e,Fe,"a_shade",E,1),ge(e,Fe,"a_anchor",g,2),e.bindVertexArray(null),l={vao:u,count:o.buildings.pos.length/3,bufs:[d,E,g]}}Ee[r]={origin:o.origin,draws:i,bld:l}}function Wn(o){if(Nt){for(const l of Nt.batches){for(const u of l.bufs)e.deleteBuffer(u);l.lineVAO&&e.deleteVertexArray(l.lineVAO),l.pointVAO&&e.deleteVertexArray(l.pointVAO)}Nt=null}if(!o)return;const r=l=>{if(!l||!l.pos.length)return null;const u=e.createVertexArray(),d=he(e,l.pos),E=he(e,l.shade),g=he(e,l.anchor);return e.bindVertexArray(u),ge(e,Fe,"a_pos",d,3),ge(e,Fe,"a_shade",E,1),ge(e,Fe,"a_anchor",g,2),e.bindVertexArray(null),{vao:u,count:l.pos.length/3,bufs:[d,E,g]}},i=(o.batches||[o]).map(l=>{const u=r(l.lines),d=r(l.points);return!u&&!d?null:{lineVAO:u?.vao||null,lineCount:u?.count||0,pointVAO:d?.vao||null,pointCount:d?.count||0,bufs:[...u?.bufs||[],...d?.bufs||[]],color:l.color||null}}).filter(Boolean);i.length&&(Nt={origin:o.origin,batches:i})}let yr=null;function Rr(o,r){e.texImage2D(e.TEXTURE_2D,0,e.R16F,o,r,0,e.RED,e.FLOAT,null);const i=Math.max(1,Math.min(r,(1<<20)/o|0));(!yr||yr.length<o*i)&&(yr=new Float32Array(o*i));for(let l=0;l<r;l+=i){const u=Math.min(i,r-l);e.texSubImage2D(e.TEXTURE_2D,0,0,l,o,u,e.RED,e.FLOAT,yr.subarray(0,o*u))}}function Kl(o,r){const i=o.cellsX*o.cellRes,l=o.cellsY*o.cellRes,u=o.cellSpan||10;gi=i*l*2,qe||(qe=e.createTexture()),e.bindTexture(e.TEXTURE_2D,qe),e.pixelStorei(e.UNPACK_ALIGNMENT,1),Rr(i,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),X={bounds:[o.originLng,o.originLat,o.cellsX*u,o.cellsY*u],scale:r*xo,exag:(o.exag||1)*xo,has:1,edgeFade:o.edgeFade||0,liftBounds:o.liftBounds||null,neg:o.negative?1:0};const d=Math.min(o.gMax||1536,Math.max(768,768*Math.max(o.cellsX,o.cellsY)));$n(o.originLng,o.originLat,o.cellsX*u,o.cellsY*u,d)}function Hn(o,r,i,l,u){e.bindTexture(e.TEXTURE_2D,o),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texSubImage2D(e.TEXTURE_2D,0,r*u,i*u,u,u,e.RED,e.FLOAT,l)}function ql(o,r,i,l){qe&&Fr(qe,o,r,i,l)}const Kn=!!e.getExtension("EXT_color_buffer_float"),qn=Kn&&!n.cpuElev;let St=null;const kt=new Map;let Ar=0;const Yl=(n.lowMem?16:64)<<20;function Yn(){if(St)return St;const o=[Me(e,Ta,ha(0)),Me(e,Ta,ha(1))];return St={fbo:e.createFramebuffer(),progs:o,vao:e.createVertexArray()},St}function jl(o){const r=kt.get(o);if(r)return kt.delete(o),kt.set(o,r),r.fresh=0,r;const i=o.data,l=i instanceof Int16Array?0:i instanceof Float32Array?1:-1;if(l<0||o.width>e.getParameter(e.MAX_TEXTURE_SIZE)||o.height>e.getParameter(e.MAX_TEXTURE_SIZE))return null;const u=e.createTexture();e.bindTexture(e.TEXTURE_2D,u),e.pixelStorei(e.UNPACK_ALIGNMENT,1),l===0?e.texImage2D(e.TEXTURE_2D,0,e.R16I,o.width,o.height,0,e.RED_INTEGER,e.SHORT,i):e.texImage2D(e.TEXTURE_2D,0,e.R32F,o.width,o.height,0,e.RED,e.FLOAT,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const d={tex:u,bytes:i.byteLength,kind:l,fresh:i.byteLength};kt.set(o,d),Ar+=d.bytes;for(const[E,g]of kt){if(Ar<=Yl||E===o)break;kt.delete(E),Ar-=g.bytes,e.deleteTexture(g.tex)}return d}const jn=new Uint32Array(Wu),$l=new Float32Array(jn.buffer);function Zl(o,r,i,l,u){if(!qn)return!1;const d=jn,E=$l;if(!Rf(d,E,u,r,i,l))return!1;const g=jl(u.tile||u.atlas);if(!g)return!1;const C=Yn(),w=C.progs[g.kind];d[2]=g.kind;const N=e.isEnabled(e.BLEND),$=e.isEnabled(e.DEPTH_TEST),W=e.isEnabled(e.STENCIL_TEST),H=e.isEnabled(e.SCISSOR_TEST),M=e.isEnabled(e.CULL_FACE);return e.bindFramebuffer(e.FRAMEBUFFER,C.fbo),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,o,0),e.viewport(r*l,i*l,l,l),e.enable(e.SCISSOR_TEST),e.scissor(r*l,i*l,l,l),e.disable(e.BLEND),e.disable(e.DEPTH_TEST),e.disable(e.STENCIL_TEST),e.disable(e.CULL_FACE),e.colorMask(!0,!0,!0,!0),e.useProgram(w),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,g.tex),e.uniform1i(f(e,w,"u_raw"),0),e.uniform4uiv(f(e,w,"u_dim"),d.subarray(0,4)),e.uniform4fv(f(e,w,"u_a"),E.subarray(4,8)),e.uniform4fv(f(e,w,"u_lo"),E.subarray(8,12)),e.uniform4uiv(f(e,w,"u_o"),d.subarray(12,16)),e.uniform4uiv(f(e,w,"u_box"),d.subarray(16,20)),e.uniform4uiv(f(e,w,"u_ix"),d.subarray(20,24)),e.uniform4uiv(f(e,w,"u_iy"),d.subarray(24,28)),e.bindVertexArray(C.vao),e.drawArrays(e.TRIANGLES,0,3),e.bindVertexArray(null),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,null,0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,t.width,t.height),H||e.disable(e.SCISSOR_TEST),N&&e.enable(e.BLEND),$&&e.enable(e.DEPTH_TEST),W&&e.enable(e.STENCIL_TEST),M&&e.enable(e.CULL_FACE),e.bindTexture(e.TEXTURE_2D,null),self.__perfElev&&(self.__perfElevLast={f16:0,write:0,gpu:1,raw:g.fresh}),!0}const Ql=Af;function Fr(o,r,i,l,u){l&&l.mode?Zl(o,r,i,u,l)||Hn(o,r,i,Ql(l,u),u):Hn(o,r,i,l,u)}async function Jl(o,r,i,l){const u=o==="far"?Ze:o==="stage"?ct&&ct.tex:qe;if(!u||!Kn)return null;const d=Yn();e.bindFramebuffer(e.FRAMEBUFFER,d.fbo),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,u,0);const E=new Float32Array(l*l*4);e.readPixels(r*l,i*l,l,l,e.RGBA,e.FLOAT,E),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,null,0),e.bindFramebuffer(e.FRAMEBUFFER,null);const g=new Float32Array(l*l);for(let C=0;C<l*l;C++)g[C]=E[C*4];return g}let ct=null;function eu(o,r){ct&&e.deleteTexture(ct.tex);const i=o.cellsX*o.cellRes,l=o.cellsY*o.cellRes;xr=i*l*2;const u=e.createTexture();e.bindTexture(e.TEXTURE_2D,u),e.pixelStorei(e.UNPACK_ALIGNMENT,1),Rr(i,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),ct={tex:u,a:o,scale:r}}function tu(o,r,i,l){ct&&Fr(ct.tex,o,r,i,l)}function ou(o){const r=Number.isFinite(+o)&&+o>0?+o:1,i=r/xo;xo=r,X.has&&(X.scale*=i,X.exag=(X.exag||1)*i)}function ru(){if(!ct)return;qe&&e.deleteTexture(qe),qe=ct.tex,gi=xr,xr=0;const o=ct.a,r=o.cellSpan||10;X={bounds:[o.originLng,o.originLat,o.cellsX*r,o.cellsY*r],scale:ct.scale*xo,exag:(o.exag||1)*xo,has:1,edgeFade:o.edgeFade||0,liftBounds:o.liftBounds||null,neg:o.negative?1:0};const i=Math.min(o.gMax||1536,Math.max(768,768*Math.max(o.cellsX,o.cellsY)));$n(o.originLng,o.originLat,o.cellsX*r,o.cellsY*r,i),ct=null}function iu(o){const r=o.cellsX*o.cellRes,i=o.cellsY*o.cellRes,l=o.cellSpan||10;yi=r*i*2,Ze||(Ze=e.createTexture()),e.bindTexture(e.TEXTURE_2D,Ze),e.pixelStorei(e.UNPACK_ALIGNMENT,1),Rr(r,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),ve={bounds:[o.originLng,o.originLat,o.cellsX*l,o.cellsY*l],has:1,edgeFade:o.edgeFade||0}}function nu(o,r,i,l){Ze&&Fr(Ze,o,r,i,l)}function au(){Ze&&e.deleteTexture(Ze),Ze=null,ve={bounds:[0,0,1,0],has:0,edgeFade:0},yi=0}function lu(o){const r=2*o.cellsX*o.cellRes,i=o.cellsY*o.cellRes,l=o.cellSpan||.25;at||(at=e.createTexture()),e.bindTexture(e.TEXTURE_2D,at),e.pixelStorei(e.UNPACK_ALIGNMENT,1),Rr(r,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),Oe={bounds:[o.originLng,o.originLat,o.cellsX*l,o.cellsY*l],has:0,edgeFade:o.edgeFade||0},ze.has=0}function uu(o,r,i,l){at&&(Fr(at,o,r,i,l),o===1?ze.has=ze.bounds[3]>0?1:0:Oe.has=1)}function fu(){at&&e.deleteTexture(at),at=null,Oe={bounds:[0,0,1,0],has:0,edgeFade:0},ze={bounds:[0,0,1,0],has:0,edgeFade:0}}function cu(o){ze={bounds:[o.originLng,o.originLat,o.span,o.span],has:0,edgeFade:o.edgeFade||0}}function su(){ze.has=0}const Lr=256,_u=6;let Dt=null;function $n(o,r,i,l,u){const d=[o,r,i,l];if(xe&&xe.G===u){xe.mesh=d,Dt=null;return}if(n.terrSync||!n.requestDraw||u<=Lr){Dt=null,Bi(_a(u),sa(u),u,d);return}if(xe?xe.mesh=d:Bi(_a(Lr),sa(Lr),Lr,d),Dt&&Dt.G===u){Dt.mesh=d;return}const E=Dt={G:u,mesh:d,it:xf(u)},g=()=>{if(Dt!==E)return;if(E.it.step(_u)){setTimeout(g,0);return}Dt=null;const C=E.it.result();Bi(C.uv,C,u,E.mesh),n.requestDraw?.()};setTimeout(g,0)}function Bi(o,{idx:r,chunks:i},l,u){xe&&(e.deleteVertexArray(xe.vao),e.deleteBuffer(xe.vbo),e.deleteBuffer(xe.ibo));const d=e.createVertexArray(),E=he(e,o),g=e.createBuffer();e.bindVertexArray(d),ge(e,A,"a_uv",E,2),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,g),e.bufferData(e.ELEMENT_ARRAY_BUFFER,r,e.STATIC_DRAW),e.bindVertexArray(null),Dn=o.byteLength+r.byteLength,xe={vao:d,vbo:E,ibo:g,count:r.length,G:l,mesh:u,chunks:i}}let Zn=n.terrLod!==!1;const st={near:{drawn:0,of:0},far:{drawn:0,of:0},fine:{drawn:0,of:0},foot:{drawn:0,of:0}},wr=(o,r,i)=>Zn?Pf(xe.chunks,o,r,X.scale,st[i]):(st[i].drawn=st[i].of=xe.chunks.length,[[0,xe.count]]);function du(o,r){if(!r){for(const K of[...Le.keys()]){if(K!==o&&!K.startsWith(o+"#"))continue;const Z=Le.get(K);e.deleteVertexArray(Z.vao);for(const D of Z.bufs)e.deleteBuffer(D);Z.tex&&Z.tex!==Lt&&e.deleteTexture(Z.tex),Mn(Z),Le.delete(K)}const M=wo.get(o);M&&(e.deleteTexture(M.tex),wo.delete(o)),vo.delete(o);return}const i=Le.get(o);if(i){e.deleteVertexArray(i.vao);for(const M of i.bufs)e.deleteBuffer(M);i.tex&&i.tex!==Lt&&e.deleteTexture(i.tex),Mn(i),Le.delete(o)}if(!r.pos?.length||!r.idx?.length)return;const l=!!(r.uv&&r.col),u=l?_e:J,d=e.createVertexArray(),E=he(e,r.pos),g=he(e,r.nrm),C=e.createBuffer();if(e.bindVertexArray(d),ge(e,u,"a_pos",E,3),r.nrm instanceof Int8Array){const M=e.getAttribLocation(u,"a_normal");e.bindBuffer(e.ARRAY_BUFFER,g),e.enableVertexAttribArray(M),e.vertexAttribPointer(M,3,e.BYTE,!0,4,0);const K=e.getAttribLocation(u,"a_ol");K>=0&&(e.enableVertexAttribArray(K),e.vertexAttribPointer(K,1,e.BYTE,!0,4,3))}else ge(e,u,"a_normal",g,3);let w=null;const N=[E,g,C];if(l){const M=he(e,r.uv),K=he(e,r.col);if(N.push(M,K),ge(e,u,"a_uv",M,2),ge(e,u,"a_col",K,4,null,!0),w=pl(r.tex),r.mc?.length){const Z=he(e,r.mc);N.push(Z),e.bindBuffer(e.ARRAY_BUFFER,Z),e.enableVertexAttribArray(Hr),e.vertexAttribPointer(Hr,4,e.FLOAT,!1,0,0)}if(r.uvm?.length){const Z=he(e,r.uvm);N.push(Z),e.bindBuffer(e.ARRAY_BUFFER,Z),e.enableVertexAttribArray(Kr),e.vertexAttribPointer(Kr,2,e.FLOAT,!1,0,0)}}e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,C),e.bufferData(e.ELEMENT_ARRAY_BUFFER,r.idx,e.STATIC_DRAW),e.bindVertexArray(null);const $=r.origin||[0,0,0],W=l&&r.alphaMode==="BLEND",H=l?r.alphaMode==="MASK"?r.alphaCutoff??.5:W?1/255:-1:-1;if(Le.set(o,{vao:d,bufs:N,tex:w,textured:l,blend:W,cut:H,pre:W&&!!r.preOpaque,count:r.idx.length,origin:$,bbox:r.bbox||[1e9,1e9,-1e9,-1e9],ward:r.ward||String(o).split("#")[0],lodH:r.lodH||null,lodCounts:r.lodCounts||null,two:r.twoSided?1:0,noCull:!!r.noCull,noLift:!!r.noLift,baked:!!r.liftBaked,drape:!!r.drape,keep2d:!!r.keep2d,noCast:r.castShadow===!1||!!r.keep2d&&r.castShadow!==!0,pbr:r.pbr?{metallic:r.pbr.metallic,roughness:r.pbr.roughness,clearcoat:r.pbr.clearcoat??null}:null,csLit:r.csLit||"pbr",wind:!!r.wind,custom:r.custom??null,split:r.split??0,sh:r.sh&&r.sh.length>=27?Float32Array.from(r.sh):null,ol:r.outline?Float32Array.from(r.outline):null,noClip:!!r.noClip,imagery:r.imagery??null,mcJ:r.mcJ&&r.mcJ.length>=9?Float32Array.from(r.mcJ):null,mc:l&&!!r.mc?.length,uvm:l&&!!r.uvm?.length,meta:l&&r.meta?.props&&r.meta.texs?.length?{props:r.meta.props,sig:JSON.stringify(r.meta.props),texs:r.meta.texs.map(M=>M?In({tex:M,nearest:!0,repeat:!1}):Lt)}:null}),r.ward&&(r.maskCells||r.mask)&&(r.maskN|0)>0&&r.maskBbox){const M=r.maskN|0;let K=wo.get(r.ward),Z=!1;if((!K||K.n!==M)&&(K&&e.deleteTexture(K.tex),K={tex:e.createTexture(),bbox:r.maskBbox,n:M,bytes:new Uint8Array(M*M)},wo.set(r.ward,K),Z=!0),K.bbox=r.maskBbox,zu(K.bytes,r.maskCells,r.mask),e.bindTexture(e.TEXTURE_2D,K.tex),e.pixelStorei(e.UNPACK_ALIGNMENT,1),Z||r.mask||!r.maskCells)e.texImage2D(e.TEXTURE_2D,0,e.R8,M,M,0,e.RED,e.UNSIGNED_BYTE,K.bytes);else{const[D,z]=ku(r.maskCells,M);z>=D&&e.texSubImage2D(e.TEXTURE_2D,0,0,D,M,z-D+1,e.RED,e.UNSIGNED_BYTE,K.bytes.subarray(D*M,(z+1)*M))}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}function vu(o,r){r?vo.delete(o):vo.add(o)}let Pr=null,oo=null,Sr=null,Dr=[],Mo=null,Io=null;function po(o,r){if(!o||!o.fanPos.length&&!(o.lineHalf&&o.lineHalf.length))return null;const i=e.createVertexArray(),l=he(e,o.fanPos);e.bindVertexArray(i),ge(e,wt,"a_delta",l,2),e.bindVertexArray(null);const u=[l];let d=null,E=0;if(o.lineHalf&&o.lineHalf.length){d=e.createVertexArray();const g=he(e,o.P1),C=he(e,o.P2),w=he(e,o.lineCol),N=he(e,o.lineHalf);e.bindVertexArray(d),ge(e,p,"a_corner",Tn,2,0),so&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,so),ge(e,p,"a_p1",g,2,1),ge(e,p,"a_p2",C,2,1),ge(e,p,"a_color",w,4,1,o.lineCol instanceof Uint8Array),ge(e,p,"a_half",N,1,1),e.bindVertexArray(null),E=o.lineHalf.length,u.push(g,C,w,N)}return{fanVao:i,fanCount:o.fanPos.length/2,lineVao:d,lineCount:E,origin:o.origin,fillColor:r,bufs:u,minZoom:o.minZoom||0,feats:o.feats||null}}function _t(o){if(o){for(const r of o.bufs)e.deleteBuffer(r);e.deleteVertexArray(o.fanVao),o.lineVao&&e.deleteVertexArray(o.lineVao)}}function mu(o,r){_t(Pr),Pr=o?po(o,r||[.2,.45,.85,.32]):null}function xu(o){for(const r of Dr)_t(r);Dr=(o||[]).map(r=>po(r,[0,0,0,0]))}function Eu(o,r){if(_t(oo),!o){oo=null;return}const i=vf(r);oo=po(o,i.color),oo&&(oo.mask=i.mask)}function pu(o){_t(Sr),Sr=o?po(o,[0,0,0,0]):null}function Cr(o,r,i,l){o&&(o.fanCount&&(o.feats?Ui(o,r,l):(e.enable(e.STENCIL_TEST),e.clearStencil(0),e.clear(e.STENCIL_BUFFER_BIT),e.colorMask(!1,!1,!1,!1),e.stencilMask(255),e.stencilFunc(e.ALWAYS,0,255),e.stencilOpSeparate(e.FRONT,e.KEEP,e.KEEP,e.INCR_WRAP),e.stencilOpSeparate(e.BACK,e.KEEP,e.KEEP,e.DECR_WRAP),ke(wt,r,o.origin,l),e.uniform1f(f(e,wt,"u_lift"),wi),e.bindVertexArray(o.fanVao),e.drawArrays(e.TRIANGLES,0,o.fanCount)),e.colorMask(!0,!0,!0,!0),e.useProgram(lr),e.uniform4f(f(e,lr,"u_fill"),o.fillColor[0],o.fillColor[1],o.fillColor[2],o.fillColor[3]),o.mask?(e.stencilFunc(e.EQUAL,0,255),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3),e.clearStencil(0),e.clear(e.STENCIL_BUFFER_BIT)):(e.stencilFunc(e.NOTEQUAL,0,255),e.stencilOp(e.KEEP,e.KEEP,e.ZERO),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3)),e.disable(e.STENCIL_TEST)),o.lineVao&&(ke(p,r,o.origin,l),e.uniform1f(f(e,p,"u_lift"),wi),e.uniform1f(f(e,p,"u_dpr"),i),S(),e.bindVertexArray(o.lineVao),hn(o.lineCount)))}function bu(o,r,i,l){if(I.showRail!==!1)for(const u of Dr)l>=u.minZoom&&Cr(u,o,r,i);Cr(Pr,o,r,i),Cr(oo,o,r,i),Cr(Sr,o,r,i)}function Ui(o,r,i){e.enable(e.STENCIL_TEST),e.clearStencil(0),e.clear(e.STENCIL_BUFFER_BIT),e.colorMask(!1,!1,!1,!1),e.stencilMask(255),e.stencilFunc(e.ALWAYS,0,255),e.stencilOpSeparate(e.FRONT,e.KEEP,e.KEEP,e.INCR_WRAP),e.stencilOpSeparate(e.BACK,e.KEEP,e.KEEP,e.DECR_WRAP),ke(wt,r,o.origin,i),e.uniform1f(f(e,wt,"u_lift"),wi),e.uniform1f(f(e,wt,"u_sphereClip"),1),e.bindVertexArray(o.fanVao),o.feats?yf(o.feats,r.eye,(l,u)=>e.drawArrays(e.TRIANGLES,l,u)):e.drawArrays(e.TRIANGLES,0,o.fanCount),e.uniform1f(f(e,wt,"u_sphereClip"),0),e.colorMask(!0,!0,!0,!0)}function Tu(o,r,i){const l=Mo;if(!l||!l.fanCount)return;Ui(l,o,r),e.useProgram(be),No(be,o);const u=I.atmo||[.45,.62,.95,.6];e.uniform4f(f(e,be,"u_land"),r[0],r[1],r[2],r[3]),e.uniform4f(f(e,be,"u_atmo"),u[0],u[1],u[2],u[3]),e.uniform1i(f(e,be,"u_elevTex"),1),e.uniform4f(f(e,be,"u_elevBounds"),X.bounds[0],X.bounds[1],X.bounds[2],X.bounds[3]),Br(be,"u_elevOff",X.bounds),e.uniform1f(f(e,be,"u_elevEdgeFade"),X.edgeFade||0),e.uniform1i(f(e,be,"u_farElevTex"),8),e.uniform4f(f(e,be,"u_farBounds"),ve.bounds[0],ve.bounds[1],ve.bounds[2],ve.bounds[3]),e.uniform1f(f(e,be,"u_hasFar"),ve.has),e.uniform1f(f(e,be,"u_ell"),uo()?1:0),e.uniform1f(f(e,be,"u_whK"),i),e.uniform1f(f(e,be,"u_globeAlpha"),I.globeAlpha??1),pi(be),hi(be),e.uniform3f(f(e,be,"u_whDeep"),...Lo().belowSea),e.stencilFunc(e.NOTEQUAL,0,255),e.stencilOp(e.KEEP,e.KEEP,e.ZERO),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3),e.clearStencil(0),e.clear(e.STENCIL_BUFFER_BIT),e.disable(e.STENCIL_TEST)}function hu(o,r,i){const l=Io;if(!l||!l.fanCount)return;Ui(l,o,r),e.useProgram(lr);const u=Lo().sea;e.uniform4f(f(e,lr,"u_fill"),u[0],u[1],u[2],i*(I.globeAlpha??1)),e.stencilFunc(e.NOTEQUAL,0,255),e.stencilOp(e.KEEP,e.KEEP,e.ZERO),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3),e.clearStencil(0),e.clear(e.STENCIL_BUFFER_BIT),e.disable(e.STENCIL_TEST)}function No(o,r){const i=va(r,gr);e.uniform3f(f(e,o,"u_rayF"),i.F[0],i.F[1],i.F[2]),e.uniform3f(f(e,o,"u_rayX"),i.X[0],i.X[1],i.X[2]),e.uniform3f(f(e,o,"u_rayY"),i.Y[0],i.Y[1],i.Y[2]),e.uniform3f(f(e,o,"u_rayE"),i.E[0],i.E[1],i.E[2]),e.uniform1f(f(e,o,"u_rayC"),i.c),e.uniform3f(f(e,o,"u_rayO"),i.O[0],i.O[1],i.O[2]),e.uniform3f(f(e,o,"u_rayEO"),i.EO[0],i.EO[1],i.EO[2]),e.uniform4f(f(e,o,"u_rayLL"),i.ll[0],i.ll[1],i.beta0,i.rho)}const Br=(o,r,i)=>{const l=kf(gr,i);e.uniform4f(f(e,o,r),l[0],l[1],l[2],l[3])};function ke(o,r,i,l){e.useProgram(o),e.uniformMatrix4fv(f(e,o,"u_mvp"),!1,r.mvp32),e.uniform3f(f(e,o,"u_eye"),r.eye[0],r.eye[1],r.eye[2]),e.uniform2f(f(e,o,"u_origin"),i[0],i[1]);const u=lo(i[0],i[1]),d=To(r.mvp,[u[0],u[1],u[2],1]);e.uniform4f(f(e,o,"u_clipT"),d[0]*Ne,d[1]*Ne,d[2]*Ne,d[3]*Ne),e.uniform3f(f(e,o,"u_originPt"),u[0],u[1],u[2]);const E=i[0]*Math.PI/180,g=nn(i[1])*Math.PI/180;e.uniform4f(f(e,o,"u_originTrig"),Math.cos(E),Math.sin(E),Math.cos(g),Math.sin(g));const C=uo(),w=i[1]*Math.PI/180;e.uniform4f(f(e,o,"u_ellTrig"),...C?[Math.cos(2*w),Math.sin(2*w),Math.cos(4*w),Math.sin(4*w)]:[0,0,0,0]),e.uniform1f(f(e,o,"u_ell"),C?1:0),e.uniform2f(f(e,o,"u_viewport"),t.width,t.height),e.uniform1f(f(e,o,"u_lineDpr"),Mi),e.uniform1f(f(e,o,"u_fogNear"),_f(r.fogDist||r.camDist,gt())),e.uniform1f(f(e,o,"u_fogFar"),df(r.fogDist||r.camDist,gt())),l=Ai(l),e.uniform3f(f(e,o,"u_fogColor"),l[0],l[1],l[2]),e.uniform1f(f(e,o,"u_csFogD"),Pi),e.uniform4f(f(e,o,"u_csFogL"),Et?Et.dir[0]:0,Et?Et.dir[1]:0,Et?Et.dir[2]:1,Et&&Et.night?1:-1),e.uniform1f(f(e,o,"u_logCoef"),zr(r.camDist)),e.uniform1f(f(e,o,"u_invClipK"),Ne!==1?1/Ne:0),e.uniform1i(f(e,o,"u_elevTex"),1),e.uniform4f(f(e,o,"u_elevBounds"),X.bounds[0],X.bounds[1],X.bounds[2],X.bounds[3]),e.uniform1f(f(e,o,"u_elevScale"),Ot),e.uniform1f(f(e,o,"u_hasElev"),X.has),e.uniform1f(f(e,o,"u_elevEdgeFade"),X.edgeFade||0),e.uniform1i(f(e,o,"u_farElevTex"),8),e.uniform4f(f(e,o,"u_farBounds"),ve.bounds[0],ve.bounds[1],ve.bounds[2],ve.bounds[3]),e.uniform1f(f(e,o,"u_hasFar"),ve.has),e.uniform1f(f(e,o,"u_farEdgeFade"),ve.edgeFade||0),e.uniform1i(f(e,o,"u_nearElevTex"),_i),e.uniform1i(f(e,o,"u_csEnvMap"),xn),e.uniform4f(f(e,o,"u_nearBounds"),Oe.bounds[0],Oe.bounds[1],Oe.bounds[2],Oe.bounds[3]),e.uniform1f(f(e,o,"u_hasNear"),Oe.has),e.uniform1f(f(e,o,"u_nearEdgeFade"),Oe.edgeFade||0),e.uniform4f(f(e,o,"u_fineBounds"),ze.bounds[0],ze.bounds[1],ze.bounds[2],ze.bounds[3]),e.uniform1f(f(e,o,"u_hasFine"),ze.has&&Oe.has?1:0),e.uniform1f(f(e,o,"u_fineEdgeFade"),ze.edgeFade||0)}function gu(o,r){e.viewport(0,0,t.width,t.height),Je={baseFill:0,baseLine:0,mainFill:0,mainLine:0,pt:0,ptw:0,skipMain:!!(r&&r.skipMain),skipBase:!!(r&&r.skipBase),zoom:+(o.zoom||0).toFixed(1),terrainDepth:!1};const i=If(o,t.width,t.height);i.mvp32=Float32Array.from(i.mvp,L=>L*Ne),Ur=zr(i.camDist),Mi=o.dpr||1,Jn=o.fovy||50*Math.PI/180;const l=Tt(o.dpr||1);hr=Hu(hr,kn,i.camDist,gt()),kn=i.camDist,i.fogDist=hr,Pi=I.csAtmo&&I.csAtmo.ground!==!1?Ku((Math.hypot(i.eye[0],i.eye[1],i.eye[2])-1)*6378137,Math.abs(Math.cos(o.pitch||0)),I.csAtmo.fogDensity):0;const u=hr!==i.camDist,d=qu(o.pitch),E=Yu(o.pitch);Ot=X.scale*E;{const L=va(i);Qn={F:L.F,X:L.X,Y:L.Y,E:L.E,c:L.c}}to=[o.center[0],o.center[1]],gr=Nf(Ee.main.origin,o.center);{const L=!!(xe&&X.has&&Ot>1e-9)&&!(r&&r.noTerrain),ne=r&&r.skipMain?["base"]:r&&r.skipBase?["main"]:["base","main"];Uo(Ee.user)&&ne.push("user"),Ll(o,i,I.land||[.96,.96,.95,1],L,ne),e.viewport(0,0,t.width,t.height)}const g=!!(xe&&X.has&&Ot>1e-9)&&!(r&&r.noTerrain),C=jt.on?xl(o,i,r,g,l,I.land||[.96,.96,.95,1],g?xe.mesh:null,{near:Gi(i.fogDist,d,gt()),far:kr(i.fogDist,d,gt())}):!1;je(l,C);const w=I.land||[.96,.96,.95,1],N=I.atmo||[.45,.62,.95,.6],$=I.worldHypsoZ??6.5,W=I.worldHypso&&X.has?ff(o.zoom,$):0,H=!l&&!C&&(o.pitch||0)<.02&&o.zoom>=9&&!Qe.has&&!G.rasterOn,M=H?[w[0],w[1],w[2],w[3]??1]:I.clear||[1,1,1,1];e.clearColor(M[0]*M[3],M[1]*M[3],M[2]*M[3],M[3]),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA);const K=I.globeAlpha??1;e.disable(e.DEPTH_TEST),e.clear(e.DEPTH_BUFFER_BIT);const Z=H?0:ju(o.zoom),D=Jt||Do||eo?Z:0;if(D>0){const L=Xu(Xi(I.clock)),ne=Math.cos(L),P=Math.sin(L),q=wf(o.zoom),Y=we=>{e.uniformMatrix4fv(f(e,we,"u_mvp"),!1,i.mvp32),e.uniform2f(f(e,we,"u_gmst"),ne,P),e.uniform1f(f(e,we,"u_fade"),D),e.uniform1f(f(e,we,"u_sky"),q)};if((Jt||eo)&&(e.useProgram(pn),Y(pn),Jt&&(e.bindVertexArray(Jt.vao),e.drawArrays(e.POINTS,0,Jt.count)),eo&&(e.bindVertexArray(eo.vao),e.drawArrays(e.POINTS,0,eo.count))),I.showConst&&(Do||br||Tr)){e.useProgram(bn),Y(bn);const we=I.skySolar?.55:1,pe=[[Do,[.47,.63,1,.4*we]],[I.skySolar?null:br,[1,.8,.45,.35]],[I.skySolar?null:Tr,[1,.55,.5,.32]]];for(const[tt,te]of pe)tt&&(e.bindVertexArray(tt.vao),e.vertexAttrib4f(1,te[0],te[1],te[2],te[3]),e.drawArrays(e.LINES,0,tt.count))}e.bindVertexArray(mt)}if(!H){e.useProgram(j),No(j,i),Ce("terrain",gr),e.uniform4f(f(e,j,"u_land"),w[0],w[1],w[2],w[3]),e.uniform4f(f(e,j,"u_atmo"),N[0],N[1],N[2],N[3]),e.uniform1f(f(e,j,"u_skyOn"),Ge?1:0),Ge&&(e.uniform3f(f(e,j,"u_skyColor"),Ge.sky[0],Ge.sky[1],Ge.sky[2]),e.uniform3f(f(e,j,"u_horizonColor"),Ge.horizon[0],Ge.horizon[1],Ge.horizon[2]),e.uniform3f(f(e,j,"u_skyFogColor"),Ge.fog[0],Ge.fog[1],Ge.fog[2]),e.uniform4f(f(e,j,"u_skyBlend"),Ge.skyHorizonBlend,Ge.horizonFogBlend,Ge.atmosphereBlend,0)),e.uniform1f(f(e,j,"u_globeAlpha"),K);{const P=I.underground;e.uniform4f(f(e,j,"u_ugC"),P?P.color[0]:0,P?P.color[1]:0,P?P.color[2]:0,P?P.color[3]:-1),e.uniform4f(f(e,j,"u_ugNF"),P?P.nf[0]/6378137:0,P?P.nf[1]:1,P?P.nf[2]/6378137:1,P?P.nf[3]:1)}{const P=Et,q=Math.hypot(i.eye[0],i.eye[1],i.eye[2])*6378137,Y=(we,pe)=>we?Math.max(pe,Math.min(1,(q-we[0])/(we[1]-we[0]))):1;e.uniform4f(f(e,j,"u_cg"),P?P.dir[0]:0,P?P.dir[1]:0,P?P.dir[2]:1,P?P.normal==="up"?2:1:0),e.uniform4f(f(e,j,"u_cgP"),P?P.lambert[0]:1,P?P.lambert[1]:0,P?Y(P.fade,0):0,P&&P.night?Y(P.night,.05):-1),e.uniform3f(f(e,j,"u_cgC"),P?P.color[0]:1,P?P.color[1]:1,P?P.color[2]:1)}Cn(j,o.dpr||1);const L=I.csAtmo;e.uniform4f(f(e,j,"u_csAtm"),L?1:0,L&&L.ground!==!1?$u((1+i.camDist)*6378137):0,L&&L.sky!==!1?1:0,Pi);{const P=L?.skyHsb;e.uniform3f(f(e,j,"u_csHsb"),P?P[0]:0,P?P[1]:0,P?P[2]:0)}if(e.uniform1f(f(e,j,"u_whK"),W),e.uniform1f(f(e,j,"u_ell"),uo()?1:0),e.uniform1i(f(e,j,"u_elevTex"),1),e.uniform1i(f(e,j,"u_climTex"),12),e.uniform1i(f(e,j,"u_farElevTex"),8),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,X.has&&qe?qe:null),e.activeTexture(e.TEXTURE0),(W>0||Zt)&&(e.uniform4f(f(e,j,"u_elevBounds"),X.bounds[0],X.bounds[1],X.bounds[2],X.bounds[3]),e.uniform1f(f(e,j,"u_elevEdgeFade"),X.edgeFade||0),e.uniform4f(f(e,j,"u_farBounds"),ve.bounds[0],ve.bounds[1],ve.bounds[2],ve.bounds[3]),e.uniform1f(f(e,j,"u_hasFar"),ve.has),e.uniform1f(f(e,j,"u_hasElev"),X.has&&qe?1:0)),W>0){const P=Lo().sea;e.uniform3f(f(e,j,"u_seaC"),P[0],P[1],P[2]),hi(j),yn(I.worldHypso.clim),pi(j)}fr(j),Br(j,"u_cogOff",Qe.has?Qe.bbox:null),dr(j),wl(j);const ne=!!I.globeDepth;e.uniform1f(f(e,j,"u_gBack"),I.globeBack?1:0),e.uniform1f(f(e,j,"u_gDepth"),ne?zr(i.camDist)*.5:0),ne&&(e.enable(e.DEPTH_TEST),e.depthFunc(e.ALWAYS),e.depthMask(!0)),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3),ne&&(e.disable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL))}e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,X.has&&qe?qe:null),e.activeTexture(e.TEXTURE8),e.bindTexture(e.TEXTURE_2D,ve.has&&Ze?Ze:null),e.activeTexture(e.TEXTURE0+_i),e.bindTexture(e.TEXTURE_2D,Oe.has&&at?at:null),e.activeTexture(e.TEXTURE0+xn),e.bindTexture(e.TEXTURE_CUBE_MAP,Qt),e.activeTexture(e.TEXTURE0);const z=!!(xe&&X.has&&Ot>1e-9)&&!(r&&r.noTerrain);e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL);const ie=z;Je.terrainDepth=!!ie;const Re=5*Zu(o.zoom,ie),Ct=yt.li>=0&&(o.pitch||0)>=.02;if(self.__perfElev&&performance.now()-(self.__perfElevT||0)>2e3&&(self.__perfElevT=performance.now(),console.log("[elev] z=%s pitch=%s scale=%s pf=%s eff=%s has=%s mesh=%s active=%s depth=%s bounds=%s far=%s farBounds=%s",o.zoom.toFixed(2),((o.pitch||0)*180/Math.PI).toFixed(0),X.scale?.toExponential?.(2),E.toFixed(2),Ot?.toExponential?.(2),X.has,!!xe,z,ie,X.bounds?.map(L=>+L.toFixed(2)).join(","),ve.has,ve.bounds?.map(L=>+L.toFixed(2)).join(","))),z){e.depthMask(ie),ie&&(e.enable(e.POLYGON_OFFSET_FILL),e.polygonOffset(1,4)),ke(A,i,to,w),Ce("terrain",to);const L=Ai(I.distColor||[.63,.72,.83]);e.uniform3f(f(e,A,"u_fogColor"),L[0],L[1],L[2]),e.uniform1f(f(e,A,"u_fogNear"),Gi(i.fogDist,d,gt())),e.uniform1f(f(e,A,"u_fogFar"),kr(i.fogDist,d,gt())),e.uniform3f(f(e,A,"u_land"),w[0],w[1],w[2]),e.uniform1f(f(e,A,"u_landA"),w[3]??1);const ne=I.hypso;e.uniform3f(f(e,A,"u_hypso"),ne?ne.color[0]:0,ne?ne.color[1]:0,ne?ne.color[2]:0),e.uniform2f(f(e,A,"u_hypsoP"),ne?1/(ne.max||3e3):0,ne?ne.amount??.5:0),e.uniform1f(f(e,A,"u_whK"),W),e.uniform1f(f(e,A,"u_globeAlpha"),K),e.uniform1f(f(e,A,"u_terrNeg"),X.neg||0);{const q=Et,Y=Math.hypot(i.eye[0],i.eye[1],i.eye[2])*6378137,we=(pe,tt)=>pe?Math.max(tt,Math.min(1,(Y-pe[0])/(pe[1]-pe[0]))):1;e.uniform4f(f(e,A,"u_cg"),q?q.dir[0]:0,q?q.dir[1]:0,q?q.dir[2]:1,q?q.normal==="up"?2:1:0),e.uniform4f(f(e,A,"u_cgP"),q?q.lambert[0]:1,q?q.lambert[1]:0,q?we(q.fade,0):0,q&&q.night?we(q.night,.05):-1),e.uniform3f(f(e,A,"u_cgC"),q?q.color[0]:1,q?q.color[1]:1,q?q.color[2]:1)}Cn(A,o.dpr||1),W>0?(yn(I.worldHypso.clim),pi(A),hi(A)):(e.uniform1i(f(e,A,"u_climTex"),12),e.uniform1f(f(e,A,"u_hasClim"),0)),fr(A),dr(A);const P=xe.mesh;e.uniform1f(f(e,A,"u_farPass"),0),e.uniform4f(f(e,A,"u_mesh"),P[0],P[1],P[2],P[3]),cr(P),vr(P),e.bindVertexArray(xe.vao);for(const[q,Y]of wr(xe.mesh,i,"near"))e.drawElements(e.TRIANGLES,Y,e.UNSIGNED_INT,q*4);if(ve.has&&Ze){e.uniform1f(f(e,A,"u_farPass"),1),e.uniform4f(f(e,A,"u_mesh"),ve.bounds[0],ve.bounds[1],ve.bounds[2],ve.bounds[3]),cr(ve.bounds),vr(ve.bounds);for(const[q,Y]of wr(ve.bounds,i,"far"))e.drawElements(e.TRIANGLES,Y,e.UNSIGNED_INT,q*4);e.uniform1f(f(e,A,"u_farPass"),0)}else st.far.drawn=0,st.far.of=0;if(Oe.has&&at){e.uniform1f(f(e,A,"u_farPass"),2),e.uniform4f(f(e,A,"u_mesh"),Oe.bounds[0],Oe.bounds[1],Oe.bounds[2],Oe.bounds[3]),cr(Oe.bounds),vr(Oe.bounds);for(const[q,Y]of wr(Oe.bounds,i,"fine"))e.drawElements(e.TRIANGLES,Y,e.UNSIGNED_INT,q*4);if(ze.has){e.uniform1f(f(e,A,"u_farPass"),3),e.uniform4f(f(e,A,"u_mesh"),ze.bounds[0],ze.bounds[1],ze.bounds[2],ze.bounds[3]),cr(ze.bounds),vr(ze.bounds);for(const[q,Y]of wr(ze.bounds,i,"foot"))e.drawElements(e.TRIANGLES,Y,e.UNSIGNED_INT,q*4)}else st.foot.drawn=0,st.foot.of=0;e.uniform1f(f(e,A,"u_farPass"),0)}else st.fine.drawn=0,st.fine.of=0,st.foot.drawn=0,st.foot.of=0;if(re&&re.tp.terrain.length&&ue.style.capOn){ie&&e.disable(e.POLYGON_OFFSET_FILL),e.depthMask(!0);const q={near:Gi(i.fogDist,d,gt()),far:kr(i.fogDist,d,gt()),color:Ai(I.distColor||[.63,.72,.83])};rr(i,re.tp.terrain,to,xe.mesh,o.center,!1,q,w),ve.has&&Ze&&rr(i,re.tp.terrain,to,ve.bounds,o.center,!0,q,w)}e.depthMask(!0),ie&&e.disable(e.POLYGON_OFFSET_FILL)}e.disable(e.DEPTH_TEST);const ut=G.rasterOn&&!!(xt&&xt.hideFills);Mo&&W>0&&!ut&&Tu(i,w,W),Io&&W>0&&!ut&&hu(i,w,W);{const L=Math.max(0,Math.min(1,((o.pitch||0)-.01)/.05)),ne=1-Math.max(0,Math.min(1,(o.zoom-17.5)/1.5)),P=X.has&&!(r&&r.noTerrain)&&I.showContour===!0&&!ut?(1-L*L*(3-2*L))*ne:0;if(P>.003&&o.zoom>=9){e.useProgram(vt),No(vt,i),e.uniform1i(f(e,vt,"u_elevTex"),1),e.uniform4f(f(e,vt,"u_elevBounds"),X.bounds[0],X.bounds[1],X.bounds[2],X.bounds[3]),Br(vt,"u_elevOff",X.bounds),e.uniform1f(f(e,vt,"u_hasElev"),X.has);const q=o.zoom>=15?15:o.zoom>=12?30:60;e.uniform1f(f(e,vt,"u_ell"),uo()?1:0),e.uniform1f(f(e,vt,"u_interval"),q),e.uniform1f(f(e,vt,"u_major"),q*5),e.uniform1f(f(e,vt,"u_alpha"),P*(I.contourAlpha||1));const Y=I.contourColor||[.42,.3,.18];e.uniform3f(f(e,vt,"u_cColor"),Y[0],Y[1],Y[2]),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3)}}e.useProgram(p),e.uniform1f(f(e,p,"u_dpr"),o.dpr||1);const Be=z&&xe?xe.mesh:null,ro=I.baseAlpha??1,pt=L=>{e.uniform1f(f(e,L,"u_baseAlpha"),ro),e.uniform4f(f(e,L,"u_meshQ"),Be?Be[0]:0,Be?Be[1]:0,Be?Be[2]:1,Be?Be[3]:1),e.uniform1f(f(e,L,"u_meshG"),Be?xe.G:0)};pt(p),T&&T.lineProg&&(e.useProgram(T.lineProg),pt(T.lineProg)),e.useProgram(wt),pt(wt),e.useProgram(Fe),pt(Fe),T&&T.bldProg&&(e.useProgram(T.bldProg),pt(T.bldProg)),e.useProgram(v),fr(v),dr(v),pt(v),T&&T.fillProg&&(e.useProgram(T.fillProg),fr(T.fillProg),dr(T.fillProg),pt(T.fillProg)),ie&&(e.enable(e.DEPTH_TEST),e.depthMask(!1));const io=r&&r.skipMain?["base"]:r&&r.skipBase?["main"]:["base","main"];Uo(Ee.user)&&io.push("user");const ta=G.fillsIn||!!(xt&&xt.hideFills&&G.rasterOn),zo=kr(i.fogDist,d,gt());Hf.on=I.gintFarPivot!==!1,ie?Si={terrainDepth:!0,logCoef:Ur,fogFar:zo,elevTex:qe,elevBounds:X.bounds,elevScale:Ot,hasElev:X.has,edgeFade:X.edgeFade||0,meshQ:Be,meshG:Be?xe.G:0,noSub:I.gintSub===!1,subBudget:I.gintSubBudget>0?I.gintSubBudget:0,subMove:I.gintSubMove??1,subBudgetMove:I.gintSubBudgetMove>0?I.gintSubBudgetMove:0,facesInAtlas:G.fillsIn}:Si=null;const oa=io.indexOf("main")>=0&&Uo(Ee.main),ko=(L,ne=-1/0,P=1/0,q=null)=>{const Y=Ee[L],we=te=>q?q(te):te.li>=ne&&te.li<P;if(Y.md){ke(T.fillProg,i,Y.origin,w),Ce("vector",Y.origin),e.useProgram(T.fillProg),Rn(T.fillProg,Y.origin),wn(T.fillProg,Y.origin),ke(T.lineProg,i,Y.origin,w),e.useProgram(T.fillProg),e.uniform1f(f(e,T.fillProg,"u_fogFar"),zo),e.useProgram(T.lineProg),e.uniform1f(f(e,T.lineProg,"u_fogFar"),zo),e.uniform1f(f(e,T.lineProg,"u_lift"),-Re),e.uniform1f(f(e,T.lineProg,"u_dpr"),o.dpr||1),e.uniform1i(f(e,T.lineProg,"u_segTex"),6),T.lineTex&&(e.activeTexture(e.TEXTURE6),e.bindTexture(e.TEXTURE_2D,T.lineTex),e.activeTexture(e.TEXTURE0)),Gn();let te=null;for(const Q of Y.md.layers)if(we(Q))if(Q.kind==="fill"){if(ta)continue;const Go=Xr(Q.li)!=null;if((Go||Q.li===lt.li||Q.li===lt.li2)&&o.zoom<lt.minzoom||Ct&&Q.li===yt.li||(te!==T.fillProg&&(e.useProgram(T.fillProg),e.bindVertexArray(T.fillVAO),te=T.fillProg),e.uniform1f(f(e,T.fillProg,"u_seaGate"),Go?1:0),e.uniform2fv(f(e,T.fillProg,"u_tileOff"),Q.origins),h(f(e,T.fillProg,"u_tr"),null,Q.fx,o),y(T.fillProg,R.get(Q.li)??Q.pz,o),e.uniform1f(f(e,T.fillProg,"u_pt"),Q.pt?1:0),!fe(T.fillProg,Q.pat,Y.origin,o)))continue;T.ext.multiDrawElementsWEBGL(e.TRIANGLES,Q.counts,0,e.UNSIGNED_INT,Q.offsets,0,Q.counts.length),L==="base"?Je.baseFill+=Q.counts.length:Je.mainFill+=Q.counts.length,Q.pt&&(Je.pt+=Q.counts.length)}else{if(L==="base"&&oa||(te!==T.lineProg&&(e.useProgram(T.lineProg),e.bindVertexArray(mt),te=T.lineProg),e.uniform2fv(f(e,T.lineProg,"u_tileOff"),Q.origins),e.uniform1f(f(e,T.lineProg,"u_cj"),Q.cj||0),Q.dashU===void 0&&(Q.dashU=ca(Q.dash,Q.cj||0)),We(f(e,T.lineProg,"u_dashP"),f(e,T.lineProg,"u_dashI"),Q.dashU,o),h(f(e,T.lineProg,"u_tr"),f(e,T.lineProg,"u_blur"),Q.fx,o),y(T.lineProg,R.get(Q.li)??Q.pz,o),e.uniform1f(f(e,T.lineProg,"u_pt"),Q.pt??0),!de(T.lineProg,Q.lt,o)))continue;T.ext.multiDrawArraysWEBGL(e.TRIANGLES,Q.firsts,0,Q.counts,0,Q.counts.length),L==="base"?Je.baseLine+=Q.counts.length:Je.mainLine+=Q.counts.length,Q.pt&&(Je.pt+=Q.counts.length),Q.pt===2&&(Je.ptw+=Q.counts.length)}e.bindVertexArray(null);return}if(!Y.draws.length)return;const pe=L==="user";ke(v,i,Y.origin,w),ke(p,i,Y.origin,w),Ce("vector",Y.origin),e.useProgram(v),e.uniform1f(f(e,v,"u_fogFar"),zo),Rn(v,Y.origin),wn(v,Y.origin),pe&&e.uniform1f(f(e,v,"u_baseAlpha"),1),e.useProgram(p),e.uniform1f(f(e,p,"u_fogFar"),zo),e.uniform1f(f(e,p,"u_lift"),-Re),pe&&e.uniform1f(f(e,p,"u_baseAlpha"),1),S();let tt=null;for(const te of Y.draws)if(we(te))if(te.kind==="fill"){if(pe?G.fillsIn:ta)continue;const Q=Xr(te.li)!=null;if((Q||te.li===lt.li||te.li===lt.li2)&&o.zoom<lt.minzoom||Ct&&te.li===yt.li||(tt!==v&&(e.useProgram(v),tt=v),e.uniform1f(f(e,v,"u_seaGate"),Q?1:0),h(f(e,v,"u_tr"),null,te.fx,o),y(v,R.get(te.li)??te.pz,o),!fe(v,te.pat,Y.origin,o)))continue;e.bindVertexArray(te.vao),te.idxT?e.drawElements(e.TRIANGLES,te.count,te.idxT,0):e.drawArrays(e.TRIANGLES,0,te.count),L==="base"?Je.baseFill++:Je.mainFill++}else{if(L==="base"&&oa||(tt!==p&&(e.useProgram(p),tt=p),e.uniform1f(B("u_cj"),te.cj),We(B("u_dashP"),B("u_dashI"),te.dash,o),h(B("u_tr"),B("u_blur"),te.fx,o),y(p,R.get(te.li)??te.pz,o),!de(p,te.lt,o)))continue;e.bindVertexArray(te.vao),hn(te.count),L==="base"?Je.baseLine++:Je.mainLine++}pe&&(e.useProgram(v),e.uniform1f(f(e,v,"u_baseAlpha"),ro),e.useProgram(p),e.uniform1f(f(e,p,"u_baseAlpha"),ro))},Xo=On(io.indexOf("user")>=0?[...io].reverse().find(L=>L!=="user"&&Uo(Ee[L])):null);for(const L of io){if(L==="user"){ko("user",-1/0,1/0,Xo.host?P=>Xo.anchorOf(P.li)===1/0:null);continue}if(L!==Xo.host){ko(L);continue}let ne=-1/0;for(const P of Xo.anchors)ko(L,ne,P),ko("user",-1/0,1/0,q=>Xo.anchorOf(q.li)===P),ne=P;ko(L,ne,1/0)}if(ie&&(e.disable(e.DEPTH_TEST),e.depthMask(!0)),bu(i,o.dpr||1,w,o.zoom||0),I.graticule&&!H){const L=Qu(o.zoom||0,I.worldHypsoZ??6.5)*.5;L>.003&&(e.useProgram(He),No(He,i),e.uniform1f(f(e,He,"u_ell"),uo()?1:0),e.uniform1f(f(e,He,"u_alpha"),L),e.uniform4f(f(e,He,"u_gratC"),...Lo().grat),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3))}e.enable(e.DEPTH_TEST);const Ii=(o.pitch||0)>=.02;e.stencilMask(128),e.clearStencil(0),e.clear(e.STENCIL_BUFFER_BIT);const Ir=L=>{L?(e.enable(e.STENCIL_TEST),e.stencilFunc(e.ALWAYS,128,255),e.stencilOp(e.KEEP,e.KEEP,e.REPLACE),e.stencilMask(128)):(e.disable(e.STENCIL_TEST),e.stencilMask(255))},ra=Ee.main.md&&Ee.main.md.bld,Ni=Ii&&!(r&&r.skipMain)&&!(r&&r.noBld)?Ee.main.bld||ra:null;if(Ni){Ir(!0);const L=Ee.main.bld?Fe:T.bldProg,ne=I.bldColor||[.86,.86,.85];ke(L,i,Ee.main.origin,w),Ce("buildings",Ee.main.origin),e.uniform3f(f(e,L,"u_bldColor"),ne[0],ne[1],ne[2]);const P=Su(wo,vo,o.center,Ri);e.uniform1i(f(e,L,"u_meshCount"),P.length);const q=Ee.main.origin||[0,0];for(let Y=0;Y<Ri;Y++){const we=P[Y],pe=we&&we.bbox,tt=pe?pe[2]-pe[0]:1,te=pe?pe[3]-pe[1]:1;e.uniform4f(f(e,L,`u_meshBbox${Y}`),pe?(q[0]-pe[0])/tt:2e9,pe?(q[1]-pe[1])/te:2e9,pe?1/tt:0,pe?1/te:0),e.activeTexture(e.TEXTURE2+Y),e.bindTexture(e.TEXTURE_2D,we?we.tex:null),e.activeTexture(e.TEXTURE0),e.uniform1i(f(e,L,`u_meshMask${Y}`),2+Y)}if(Ee.main.bld)e.bindVertexArray(Ni.vao),e.drawArrays(e.TRIANGLES,0,Ni.count);else{e.bindVertexArray(T.bldVAO);for(const Y of ra)e.uniform2fv(f(e,L,"u_tileOff"),Y.origins),T.ext.multiDrawArraysWEBGL(e.TRIANGLES,Y.firsts,0,Y.counts,0,Y.counts.length)}Ir(!1)}if(Nt){ke(Fe,i,Nt.origin,w),Ce("vector",Nt.origin),e.uniform1i(f(e,Fe,"u_meshCount"),0);for(let L=0;L<Ri;L++)e.uniform4f(f(e,Fe,`u_meshBbox${L}`),1e9,1e9,-1e9,-1e9),e.activeTexture(e.TEXTURE2+L),e.bindTexture(e.TEXTURE_2D,null),e.activeTexture(e.TEXTURE0),e.uniform1i(f(e,Fe,`u_meshMask${L}`),2+L);for(const L of Nt.batches){const ne=L.color||I.bldColor||[.86,.86,.85];e.uniform3f(f(e,Fe,"u_bldColor"),ne[0],ne[1],ne[2]),L.lineCount&&(e.bindVertexArray(L.lineVAO),e.drawArrays(e.LINES,0,L.lineCount)),L.pointCount&&(e.bindVertexArray(L.pointVAO),e.drawArrays(e.POINTS,0,L.pointCount))}}if(Le.size&&z&&(K<1||I.meshOverGround&&!Mr&&!_o.size)&&e.clear(e.DEPTH_BUFFER_BIT),Le.size&&(Ii||Pl())){Ir(!0),e.useProgram(J);let L=J;const ne=I.bldColor||[.86,.86,.85],P=.5*Math.max(i.W,i.H),q=ma(i.eye),Y=Du(Ju(o.zoom),o.zoom),we=Math.cos((o.center[1]||0)*Math.PI/180),pe=[],tt=Cu(o.centerAlt);for(const x of Le.values()){if(!Ii&&!x.keep2d||vo.has(x.ward)||!Of(i,zf(x.bbox,x.origin,x.xf),o.center,q,P,ma(x.xf?[x.origin[0]+x.xf[9],x.origin[1]+x.xf[10],x.origin[2]+x.xf[11]]:x.origin)[2],x.noLift?0:tt))continue;const Te=Bu(x,o.center,we,Y);Te&&pe.push({p:x,count:Te})}const te=i.eye,Q=x=>(x.origin[0]-te[0])**2+(x.origin[1]-te[1])**2+(x.origin[2]-te[2])**2,Go=[...pe.filter(x=>!x.p.textured),...pe.filter(x=>x.p.textured&&!So(x.p)),...pe.filter(x=>x.p.textured&&x.p.pre).map(x=>({...x,pre:!0})),...pe.filter(x=>x.p.textured&&So(x.p)).sort((x,Te)=>Q(Te.p)-Q(x.p))];let Nr=!1;const ia=new Set,na=Go.filter(x=>x.p.textured&&x.p.sil&&!So(x.p));if(na.length){const x=dt;e.useProgram(x),L=x,e.depthMask(!1),ke(x,i,[0,0],w);for(const{p:Te,count:Vo}of na){const Ve=Te.noLift||Te.baked?null:Te.drape?Ki:X.liftBounds;e.uniform4f(f(e,x,"u_liftBounds"),Ve?Ve[0]:0,Ve?Ve[1]:0,Ve?Ve[2]:0,Ve?Ve[3]:0),e.uniform4f(f(e,x,"u_silColor"),Te.sil[0],Te.sil[1],Te.sil[2],Te.sil[3]),e.uniform1f(f(e,x,"u_silPx"),Te.sil[4]),e.uniform3f(f(e,x,"u_meshOrigin"),Te.origin[0],Te.origin[1],Te.origin[2]),e.uniform3f(f(e,x,"u_eyeRel"),i.eye[0]-Te.origin[0],i.eye[1]-Te.origin[1],i.eye[2]-Te.origin[2]),e.uniform1f(f(e,x,"u_xfOn"),Te.xf?1:0),Te.xf&&(e.uniformMatrix3fv(f(e,x,"u_xfL"),!1,Te.xf.subarray(0,9)),e.uniform3f(f(e,x,"u_xfT"),Te.xf[9],Te.xf[10],Te.xf[11]));const no=To(i.mvp,[Te.origin[0],Te.origin[1],Te.origin[2],1]);e.uniform4f(f(e,x,"u_clipMesh"),no[0]*Ne,no[1]*Ne,no[2]*Ne,no[3]*Ne),e.bindVertexArray(Te.vao),e.drawElements(e.TRIANGLES,Vo,e.UNSIGNED_INT,0)}e.depthMask(!0)}let Oi=null;mo.size&&Bn++;for(const{p:x,count:Te,pre:Vo}of Go){const Ve=Un(x),no=Ve?Cl(Ve,x):null,V=no??(x.textured?l&&x.noClip?C?ce(!1,!0).meshTex:Xe:_e:J);if(V!==L&&(e.useProgram(V),L=V),Ve&&no){if(!Oi){const Pe=i.invMvp?xa(i.mvp,i.invMvp):null;Oi=Pe?ef(Pe.F,Pe.X,Pe.Y):Float32Array.of(1,0,0,0,1,0,0,0,1)}e.uniformMatrix3fv(f(e,V,"u_csJ"),!1,x.mcJ??Float32Array.of(1,0,0,0,1,0,0,0,1)),e.uniformMatrix3fv(f(e,V,"u_csV"),!1,Oi),e.uniform2f(f(e,V,"u_csMode"),Ve.spec.lighting==="UNLIT"?1:Ve.spec.lighting==="PBR"?-1:0,Ve.spec.translucency==="TRANSLUCENT"?1:0),e.uniform1f(f(e,V,"u_czmFrame"),Bn);let Ue=os;for(const[Pe,it]of Object.entries(Ve.spec.uniforms||{})){if(it==="sampler2D"){e.activeTexture(e.TEXTURE0+Ue),e.bindTexture(e.TEXTURE_2D,Ve.tex.get(Pe)??Lt),e.uniform1i(f(e,V,"cu_"+Pe),Ue++);continue}tf(e,f(e,V,"cu_"+Pe),it,Ve.spec.values?.[Pe])}(x.meta?.texs||[]).forEach((Pe,it)=>{e.activeTexture(e.TEXTURE0+Ue),e.bindTexture(e.TEXTURE_2D,Pe),e.uniform1i(f(e,V,"csmt_"+it),Ue++)}),e.activeTexture(e.TEXTURE0),x.mc||e.vertexAttrib4f(Hr,0,0,0,0),x.uvm||e.vertexAttrib2f(Kr,0,0)}if(l&&!(x.textured&&x.noClip)){const Ue=lo(...Ee.main.origin||[0,0]);Ce(x.textured?"models":"buildings",Ee.main.origin),e.uniform3f(f(e,V,"u_clO"),x.origin[0]-Ue[0],x.origin[1]-Ue[1],x.origin[2]-Ue[2])}if(x.textured){e.activeTexture(e.TEXTURE7),e.bindTexture(e.TEXTURE_2D,x.tex),e.activeTexture(e.TEXTURE0),e.uniform1i(f(e,V,"u_tex"),7),e.uniform1f(f(e,V,"u_alphaCut"),Vo?es:x.cut),e.uniform1f(f(e,V,"u_blend"),Vo?0:So(x)),e.uniform1f(f(e,V,"u_tintB"),x.tint?x.tint[4]:-1),x.tint&&e.uniform4f(f(e,V,"u_tint"),x.tint[0],x.tint[1],x.tint[2],x.tint[3]),e.activeTexture(e.TEXTURE0+di),e.bindTexture(e.TEXTURE_2D,x.paint??Lt),e.activeTexture(e.TEXTURE0),e.uniform1i(f(e,V,"u_paint"),di),e.uniform1f(f(e,V,"u_paintB"),x.paint?x.paintB??0:-1);const Ue=x.imagery&&!x.paint?ar.get(x.imagery):void 0;of(ht,0,Ue?.map??null,x.origin),e.activeTexture(e.TEXTURE0+vi),e.bindTexture(e.TEXTURE_2D,Ue?.tex??Lt),e.activeTexture(e.TEXTURE0),e.uniform1i(f(e,V,"u_drape"),vi),e.uniform4f(f(e,V,"u_drU"),ht[0],ht[1],ht[2],ht[3]),e.uniform4f(f(e,V,"u_drV"),ht[4],ht[5],ht[6],ht[7]),e.uniform1f(f(e,V,"u_drOn"),ht[8])}e.uniform2f(f(e,V,"u_split"),x.split?Math.sign(x.split)*(1+Li):0,t.width);const aa=x.textured&&!!So(x)&&!Vo;if(aa!==Nr&&(Nr=aa,e.depthMask(!Nr)),!ia.has(V)){ia.add(V),ke(V,i,[0,0],w),e.uniform3f(f(e,V,"u_bldColor"),ne[0],ne[1],ne[2]);{const Ue=i.invMvp?xa(i.mvp,i.invMvp):null,Pe=Ue?Ue.F:[0,0,-1],it=Ue?Ue.Y:[0,1,0],Bt=Math.hypot(Pe[0],Pe[1],Pe[2])||1,zi=Math.hypot(it[0],it[1],it[2])||1;e.uniform3f(f(e,V,"u_csFwd"),Pe[0]/Bt,Pe[1]/Bt,Pe[2]/Bt),e.uniform3f(f(e,V,"u_csUpV"),it[0]/zi,it[1]/zi,it[2]/zi)}if(e.uniform1f(f(e,V,"u_lightOn"),It?1:0),It){e.uniform3f(f(e,V,"u_lightDir"),It.dir[0],It.dir[1],It.dir[2]),e.uniform1f(f(e,V,"u_lightI"),It.intensity??.5);const Ue=It.color||[1,1,1];e.uniform3f(f(e,V,"u_lightColor"),Ue[0],Ue[1],Ue[2])}if(et&&(e.uniform3f(f(e,V,"u_csDir"),et.dir[0],et.dir[1],et.dir[2]),e.uniform3f(f(e,V,"u_csColor"),et.color[0],et.color[1],et.color[2]),e.uniform3f(f(e,V,"u_csIbl"),et.ibl[0],et.ibl[1],et.invL00),e.uniform2f(f(e,V,"u_csEnv"),Qt?1:0,Nn)),e.uniform1i(f(e,V,"u_lightN"),Po?Po.n:0),Po){const Ue=Po.data;for(let Pe=0;Pe<4;Pe++){const it=new Float32Array(32);for(let Bt=0;Bt<8;Bt++)it.set(Ue.subarray(Bt*16+Pe*4,Bt*16+Pe*4+4),Bt*4);e.uniform4fv(f(e,V,["u_lA","u_lB","u_lC","u_lD"][Pe]),it)}}}const Xt=x.noLift||x.baked?null:x.drape?Ki:X.liftBounds;e.uniform4f(f(e,V,"u_liftBounds"),Xt?Xt[0]:0,Xt?Xt[1]:0,Xt?Xt[2]:0,Xt?Xt[3]:0),e.uniform1f(f(e,V,"u_csOn"),x.csLit==="phongc"?4:x.csLit==="phong"?3:!et||x.csLit==="off"?0:x.csLit==="unlit"?2:1),et&&(e.uniform2f(f(e,V,"u_csMR"),x.pbr?x.pbr.metallic:0,x.pbr?x.pbr.roughness:1),e.uniform2f(f(e,V,"u_csCC"),x.pbr?.clearcoat?.[0]??0,x.pbr?.clearcoat?.[1]??0),e.uniform3fv(f(e,V,"u_csSH"),x.sh??et.sh),e.uniform4fv(f(e,V,"u_olC"),x.ol??rs)),e.uniform1f(f(e,V,"u_cullBack"),x.wind&&(et||x.csLit==="phong")&&x.csLit!=="off"?2:x.two||x.noCull?0:1),e.uniform3f(f(e,V,"u_meshOrigin"),x.origin[0],x.origin[1],x.origin[2]),e.uniform3f(f(e,V,"u_eyeRel"),i.eye[0]-x.origin[0],i.eye[1]-x.origin[1],i.eye[2]-x.origin[2]),e.uniform1f(f(e,V,"u_xfOn"),x.xf?1:0),x.xf&&(e.uniformMatrix3fv(f(e,V,"u_xfL"),!1,x.xf.subarray(0,9)),e.uniform3f(f(e,V,"u_xfT"),x.xf[9],x.xf[10],x.xf[11]));const Or=To(i.mvp,[x.origin[0],x.origin[1],x.origin[2],1]);e.uniform4f(f(e,V,"u_clipMesh"),Or[0]*Ne,Or[1]*Ne,Or[2]*Ne,Or[3]*Ne),e.bindVertexArray(x.vao),e.drawElements(e.TRIANGLES,Te,e.UNSIGNED_INT,0)}Nr&&e.depthMask(!0),Ir(!1)}if(_o.size&&_o.draw(i,zr(i.camDist),xe&&X.has&&X.scale>0?1-(z?Ot/X.scale:0):0,!ie,Ne),e.disable(e.DEPTH_TEST),Z>0&&I.night!==!1){const[L,ne]=Uu(Xi(I.clock)),P=Math.cos(ne);e.useProgram(ur),No(ur,i),e.uniform3f(f(e,ur,"u_sun"),P*Math.cos(L),Math.sin(ne),P*Math.sin(L)),e.uniform1f(f(e,ur,"u_alpha"),.5*Z*K),e.bindVertexArray(mt),e.drawArrays(e.TRIANGLES,0,3)}return e.bindVertexArray(null),u}function Oo(o){for(const r of Ee[o].draws){for(const i of r.bufs)e.deleteBuffer(i);e.deleteVertexArray(r.vao)}if(Ee[o].bld){for(const r of Ee[o].bld.bufs)e.deleteBuffer(r);e.deleteVertexArray(Ee[o].bld.vao)}Ee[o]={origin:Ee[o].origin,draws:[],bld:null,md:null}}function yu(){Dt=null,_o.dispose(),dn(),En();for(const o of kt.values())e.deleteTexture(o.tex);if(kt.clear(),Ar=0,St){e.deleteFramebuffer(St.fbo),e.deleteVertexArray(St.vao);for(const o of St.progs)e.deleteProgram(o);St=null}for(let o=0;o<4;o++)An(G.w[o]),G.w[o]=null;G.n=0,Oo("base"),Oo("main"),Oo("user"),_t(Pr),_t(oo),_t(Sr),_t(Mo),_t(Io);for(const o of Dr)_t(o);Wn(null),ea(!1)}function Ru(o,r,i){switch(o){case"view":Sl(r);break;case"patImage":oe(r);break;case"groundLight":Et=r&&Array.isArray(r.dir)?r:null;break;case"groundMaterial":Dl(r);break;case"meshSpecEnv":{Qt&&(e.deleteTexture(Qt),Qt=null);const l=r;if(l&&l.size>0&&l.levels?.length){Qt=e.createTexture(),e.bindTexture(e.TEXTURE_CUBE_MAP,Qt),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),l.levels.forEach((u,d)=>{const E=Math.max(1,l.size>>d),g=E*E*4;for(let C=0;C<6;C++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+C,d,e.RGBA16F,E,E,0,e.RGBA,e.HALF_FLOAT,u.subarray(C*g,(C+1)*g))}),e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_BASE_LEVEL,0),e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,l.levels.length-1),e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAG_FILTER,e.LINEAR);for(const u of[e.TEXTURE_WRAP_S,e.TEXTURE_WRAP_T,e.TEXTURE_WRAP_R])e.texParameteri(e.TEXTURE_CUBE_MAP,u,e.CLAMP_TO_EDGE);e.bindTexture(e.TEXTURE_CUBE_MAP,null),Nn=l.levels.length-1}break}case"meshLight":et=r&&Array.isArray(r.dir)&&r.sh?r:null;break;case"light":It=r&&Array.isArray(r.dir)?r:null;break;case"lights":Po=r&&r.n>0&&r.data?r:null;break;case"sky":Ge=r&&Array.isArray(r.sky)?r:null;break;case"sea":lt={...lt,...r};break;case"bldFill":yt={...yt,...r};break;case"ptOver":Eo.setOver(r);break;case"ptFsLayers":Eo.setFsLayers(r);break;case"ptFs":Eo.setFs(r);break;case"pzOver":R=new Map(r??[]);break;case"userAnchor":pr={ranges:Array.isArray(r?.ranges)?r.ranges:[],rev:pr.rev+1};break;case"gintBld":Wn(r);break;case"scene":Hl(r,i);break;case"mdGrow":Gl(r.pool,r.units);break;case"mdUp":Vl(r);break;case"mdScene":Wl(r);break;case"overlay":mu(r,i);break;case"overlayHi":Eu(r,i);break;case"overlayHover":pu(r);break;case"rail":xu(r);break;case"wdepr":_t(Mo),Mo=r?po(r,[0,0,0,0]):null;break;case"lakes":_t(Io),Io=r?po(r,[0,0,0,0]):null;break;case"elevAtlas":Kl(r,i);break;case"elevCell":ql(i.cx,i.cy,r,i.cellRes);break;case"elevAtlasStage":eu(r,i);break;case"elevCellStage":tu(i.cx,i.cy,r,i.cellRes);break;case"elevAtlasCommit":ru();break;case"terrainExag":ou(r);break;case"elevAtlasFar":iu(r);break;case"elevCellFar":nu(i.cx,i.cy,r,i.cellRes);break;case"terrLod":Zn=r!==!1;break;case"elevFarMax":ve.maxElev=+r||0;break;case"elevAtlasFarOff":au();break;case"elevAtlasNear":lu(r);break;case"elevCellNear":uu(i.cx,i.cy,r,i.cellRes);break;case"elevAtlasNearOff":fu();break;case"elevFineOn":cu(r);break;case"elevFineOff":su();break;case"meshSet":du(i,r);break;case"classify":_o.set(i,r);break;case"classifyStyle":_o.style(i,r);break;case"meshCut":{const l=Le.get(i);l&&l.textured&&!l.blend&&typeof r=="number"&&(l.cut=r);break}case"meshSil":{const l=Le.get(i);l&&(l.sil=r&&r.length>=5&&r[4]>0?Float32Array.from(r):null);break}case"meshEnv":{const l=Le.get(i);l&&(l.sh=r&&r.length>=27?Float32Array.from(r):null);break}case"meshOutline":{const l=Le.get(i);l&&(l.ol=r&&r.length>=4?Float32Array.from(r):null);break}case"meshTint":{const l=Le.get(i);l&&(l.tint=r&&r.length>=5?Float32Array.from(r):null);break}case"customShader":Ul(String(i),r);break;case"customShaderTex":{const l=mo.get(String(i)),u=r;if(l&&u?.name&&u.tex){const d=l.tex.get(u.name);d&&e.deleteTexture(d),l.tex.set(u.name,In(u))}break}case"meshCustom":{const l=Le.get(i);l&&(l.custom=r!=null&&r!==""?String(r):null);break}case"meshNoClip":{const l=Le.get(i);l&&(l.noClip=!!r);break}case"meshImagery":{const l=Le.get(i);l&&(l.imagery=r!=null&&r!==""?String(r):null);break}case"meshDrape":{const l=String(i),u=r,d=ar.get(l);d&&e.deleteTexture(d.tex),ar.delete(l);const E=u?rf(u):null,g=u?u.bitmap?u.bitmap.width:u.w??0:0,C=u?u.bitmap?u.bitmap.height:u.h??0:0;if(u&&E&&g>0&&C>0&&(u.bitmap||u.rgba)){const w=e.createTexture();e.activeTexture(e.TEXTURE0+vi),e.bindTexture(e.TEXTURE_2D,w),e.pixelStorei(e.UNPACK_ALIGNMENT,1),u.bitmap?e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,e.RGBA,e.UNSIGNED_BYTE,u.bitmap):e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,g,C,0,e.RGBA,e.UNSIGNED_BYTE,u.rgba),e.pixelStorei(e.UNPACK_ALIGNMENT,4);for(const[N,$]of[[e.TEXTURE_MIN_FILTER,e.LINEAR],[e.TEXTURE_MAG_FILTER,e.LINEAR],[e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE],[e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE]])e.texParameteri(e.TEXTURE_2D,N,$);e.activeTexture(e.TEXTURE0),ar.set(l,{tex:w,map:E})}u?.bitmap?.close?.();break}case"meshSplit":{const l=Le.get(i);l&&(l.split=typeof r=="number"?r:0);break}case"splitPos":{Li=typeof r=="number"?Math.max(0,Math.min(1,r)):.5;break}case"meshXf":{const l=Le.get(i);l&&(l.xf=r&&r.length>=12?r:null);break}case"meshPaint":{const l=Le.get(i),u=r;if(!l?.textured)break;if(l.paint&&e.deleteTexture(l.paint),l.paint=null,u&&u.w>0&&u.h>0&&u.rgba?.length>=u.w*u.h*4){const d=e.createTexture();e.activeTexture(e.TEXTURE0+di),e.bindTexture(e.TEXTURE_2D,d),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,u.w,u.h,0,e.RGBA,e.UNSIGNED_BYTE,u.rgba),e.pixelStorei(e.UNPACK_ALIGNMENT,4);for(const[E,g]of[[e.TEXTURE_MIN_FILTER,e.NEAREST],[e.TEXTURE_MAG_FILTER,e.NEAREST],[e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE],[e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE]])e.texParameteri(e.TEXTURE_2D,E,g);e.activeTexture(e.TEXTURE0),l.paint=d,l.paintB=u.blend}break}case"meshCol":{const l=Le.get(i);l?.textured&&r?.length&&l.bufs[4]&&(e.bindBuffer(e.ARRAY_BUFFER,l.bufs[4]),e.bufferSubData(e.ARRAY_BUFFER,0,r),e.bindBuffer(e.ARRAY_BUFFER,null));break}case"meshPos":{const l=Le.get(i),u=r;if(!l||!u?.pos?.length&&!u?.nrm?.length)break;u.pos?.length&&(e.bindBuffer(e.ARRAY_BUFFER,l.bufs[0]),e.getBufferParameter(e.ARRAY_BUFFER,e.BUFFER_SIZE)===u.pos.byteLength&&e.bufferSubData(e.ARRAY_BUFFER,0,u.pos)),u.nrm?.length&&(e.bindBuffer(e.ARRAY_BUFFER,l.bufs[1]),e.getBufferParameter(e.ARRAY_BUFFER,e.BUFFER_SIZE)===u.nrm.byteLength&&e.bufferSubData(e.ARRAY_BUFFER,0,u.nrm)),e.bindBuffer(e.ARRAY_BUFFER,null);break}case"meshVis":vu(i,r);break;case"stars":Ml(r);break;case"constellations":Il(r);break;case"planets":Nl(r);break;case"ecliptic":Ol(r);break;case"celequator":zl(r);break;case"cogSplit":xi=Number.isFinite(r)?r:null;break;case"cogTex":bl(r);break;case"post":Mr=r||null,At?.setPost(Mr);break;case"cityLights":break;case"clip":ue=Mu(r),ue||dn();break;case"shadow":jt={...jt,...r},jt.on||En();break;default:console.warn("renderer.set: unknown cmd",o)}}const Au=()=>({atlas:gi+xr+yi,mesh:Dn,msaa:0,raster:sr+G.bytes,depthOut:At?At.bytes():0});let Qn=null,At=null,Ur=0,Mi=1,Jn=50*Math.PI/180,Mr=null;function ea(o){if(!o)return At&&(At.dispose(),At=null),null;At||(At=$c(e,t,()=>n.requestDraw?.()),At.setPost(Mr));const r=At;return{begin:r.begin,abort:r.abort,end:i=>{const l=r.end({...i||{},logCoef:Ur,dpr:Mi,fovy:Jn});return l?{...l,logCoef:Ur,globe:Qn}:null}}}return{gl:e,set:Ru,draw:gu,dispose:yu,depthOut:ea,md:!!T,mdMax:tr,mdDash:!0,pt:!!T,gintCtx:()=>Si,memEstimate:Au,maxTex:e.getParameter(e.MAX_TEXTURE_SIZE),terrStats:()=>st,gpuResample:qn,readElevCell:Jl,rasterTex:hl,rasterMesh:gl,rasterFree:yl,setRasterDraws:Rl,setGroundHook:Fl,dbg:()=>Je?{...Je,raster:G.rasterOn?G.tiles:0,fillsIn:G.fillsIn,gndFaces:G.fillsIn?G.faces:0}:null}}function Ko(t,n,e,a){const s=t.createProgram();t.attachShader(s,ei(t,t.VERTEX_SHADER,n)),t.attachShader(s,ei(t,t.FRAGMENT_SHADER,e));for(const[v,p]of Object.entries(a))p>=0&&t.bindAttribLocation(s,p,v);if(t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))throw new Error("link: "+t.getProgramInfoLog(s));return s}function Me(t,n,e){const a=t.createProgram();if(t.attachShader(a,ei(t,t.VERTEX_SHADER,n)),t.attachShader(a,ei(t,t.FRAGMENT_SHADER,e)),t.linkProgram(a),!t.getProgramParameter(a,t.LINK_STATUS))throw new Error("link: "+t.getProgramInfoLog(a));return a}function ei(t,n,e){const a=t.createShader(n);if(t.shaderSource(a,e),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS))throw new Error("compile: "+t.getShaderInfoLog(a)+`
`+e);return a}function he(t,n){const e=t.createBuffer();return t.bindBuffer(t.ARRAY_BUFFER,e),t.bufferData(t.ARRAY_BUFFER,n,t.STATIC_DRAW),e}const Sa=new WeakMap;function f(t,n,e){let a=Sa.get(n);return a||Sa.set(n,a=new Map),a.has(e)||a.set(e,t.getUniformLocation(n,e)),a.get(e)}function ge(t,n,e,a,s,v,p,U=0){const B=t.getAttribLocation(n,e);B<0||(t.bindBuffer(t.ARRAY_BUFFER,a),t.enableVertexAttribArray(B),t.vertexAttribPointer(B,s,p?t.UNSIGNED_BYTE:t.FLOAT,!!p,0,U),v!=null&&t.vertexAttribDivisor(B,v))}const ci=`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
float log2p1G(float w) { if (w < 0.1) return (w * (1.0 - w * (0.5 - w * (0.33333334 - w * (0.25 - w * (0.2 - w * (0.16666667 - w * 0.14285715))))))) * 1.4426950; return log2(1.0 + w); }   // log2(1+w) を桁落ちなしに（対数深度の頂点側・glsl.ts PROJECT の log2p1 と同じ）
uniform usampler2D u_arc_tex;
uniform usampler2D u_meta_tex;
uniform int        u_arc_w;
uniform int        u_meta_w;
uniform int        u_vbase;      // index の 4 頂点/辺（perf plan P3）：run の先頭辺（WebGL の drawElements に baseVertex が無い＝uniform で運ぶ。旧 6 頂点 drawArrays 時は 0）
uniform mat4       u_mvp;        // japan の MVP（cameraState 由来）
uniform vec3       u_eye;        // カメラ位置（単位球ワールド）＝手前/裏半球判定
uniform vec2       u_origin;     // シーン原点 lon/lat (deg)＝Morton 中心（現状 deltaTo3D 化で未使用・documentation）
uniform vec4       u_origin_trig; // 原点の三角比 (cosLon,sinLon,cosLat,sinLat)＝CPUでdouble算出＝RTE角度加算の錨
uniform vec2       u_viewport;   // canvas 幅高 (device px)
uniform uint       u_ix_center;  // u_origin の Morton 整数（経度）
uniform uint       u_iy_center;  // u_origin の Morton 整数（緯度）
uniform float      u_lod_rank;   // GPU Dynamic LOD 閾値（VW rank 0-63）。辺の max(rankA,rankB) 未満は VS で discard
uniform vec4       u_clipT;      // mvp*[原点3D,1]＝CPU(double)算出＝MVP相殺回避の錨（clip空間の原点）
uniform float      u_origin_zr;  // dot(原点3D,eye)-1＝CPU(double)算出＝zr相殺回避の錨
// ── 深度統合（1canvas 段階B）：renderer の地形深度（terrainDepth＝山岳ビュー z<13）へ参加する時だけ実値。
// 全て 0 ＝完全に従来動作（worker モード/非統合は一切影響なし）。使用は VS_RENDER のみ（他は宣言だけ＝prune）。
uniform float      u_logCoef;      // >0＝対数深度を焼く（renderer applyLogDepth と同式・同係数）。0＝z=0（深度オフ）
uniform float      u_fogFar;       // 標高変位の距離フェード終端（renderer LINE_MAIN の df と同式＝遠景平ら化に追随）
uniform vec3       u_origin_pt;    // 原点3D（CPU double 算出）＝絶対方向 dir = u_origin_pt + rel
uniform sampler2D  u_elevTex;      // 標高アトラス（renderer と共有・texture unit 7 固定）
uniform vec4       u_elevBounds;   // originLng, originLat, spanLng, spanLat
uniform float      u_elevScale;    // (誇張/地球半径m)：0＝ドレープなし
uniform float      u_hasElev;      // 0/1
uniform float      u_elevEdgeFade; // 標高窓の縁フェード幅(deg)。renderer elev() と同式
const float D2R = 0.017453292519943295;

// 標高（renderer glsl.js elev() と同式＝基図の線/塗りと同じドレープ＝重ねてズレない）。
float elevAt(vec2 ll) {
	if (u_hasElev < 0.5) return 0.0;
	vec2 uv = (ll - u_elevBounds.xy) / u_elevBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	float fade = 1.0;
	if (u_elevEdgeFade > 0.0) {
		vec2 w = vec2(u_elevEdgeFade) / u_elevBounds.zw;
		fade = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return texture(u_elevTex, uv).r * fade;   // アトラスは南上げ格納＝v直接
}
// 案A（renderer glsl.js QELEV と同式）: ドレープ標高を「地形メッシュと同じ折れ線面」に量子化＝
// 同じ格子頂点で elevAt を取り同じ三角形分割（対角 a-c-b / b-c-d）で補間＝描画されている面に厳密に乗る。
uniform vec4  u_meshQ;   // 地形メッシュ窓（xy=原点・zw=span deg）
uniform float u_meshG;   // 格子の頂点数 G（0=量子化オフ）
uniform vec2  u_near;    // 地形適応細分の近傍窓（原点＝視野中心・半幅 deg）。x<=0＝集中なし（辺全体を一様に細分）
float elevQAt(vec2 ll) {
	if (u_meshG < 1.5) return elevAt(ll);
	vec2 g = (ll - u_meshQ.xy) / u_meshQ.zw;
	if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) return elevAt(ll);
	float N = u_meshG - 1.0;
	vec2 gc = min(g * N, vec2(N - 1e-4));
	vec2 gi = floor(gc);
	vec2 gf = gc - gi;
	vec2 st = u_meshQ.zw / N;
	vec2 b0 = u_meshQ.xy + gi * st;
	float h00 = elevAt(b0);
	float h10 = elevAt(b0 + vec2(st.x, 0.0));
	float h01 = elevAt(b0 + vec2(0.0, st.y));
	float h11 = elevAt(b0 + st);
	return (gf.x + gf.y < 1.0)
		? h00 + gf.x * (h10 - h00) + gf.y * (h01 - h00)
		: h11 + (1.0 - gf.x) * (h01 - h11) + (1.0 - gf.y) * (h10 - h11);
}

vec3 lonlatTo3D(vec2 ll) {
	float a = ll.x * D2R, b = ll.y * D2R, cb = cos(b);
	return vec3(cb * cos(a), sin(b), cb * sin(a));
}

// GPU の sin() は微小角で信用できない：GLSL 仕様は sin/cos の精度を未規定で、SwiftShader は
// |x|≲1e-7rad を 0 にフラッシュ（transform feedback 実測）、実 GPU も実装依存の近似誤差を持つ。
// 高ズームは Δ角が 1e-9〜1e-6rad かつ倍率 ~1e8px/rad＝誤差がそのまま px の這いになる（v1 の
// 「z>16 は三角関数を捨てる（Jacobian）」と同じ問題の v2 形。左下悪化・チルト軽減の空間署名まで一致）。
// 微小角は Taylor（x−x³/6+x⁵/120＝f32 で厳密同等）、大角（|x|>0.1rad＝低ズームの遠方＝px が km 級）のみ native sin。
float sinP(float x) {
	float x2 = x * x;
	return (abs(x) < 0.1) ? x * (1.0 - x2 * (1.0 / 6.0) * (1.0 - x2 * (1.0 / 20.0))) : sin(x);
}
float cosP(float x) { float s = sinP(0.5 * x); return 1.0 - 2.0 * s * s; }
// 楕円体（?ell=1・段階B）＝renderer glsl.js と同式：dlat（測地緯度差分）→dβ（更成緯度差分）の閉形式差分。
// 球＝u_ell_trig=vec4(0)（GL既定値も0）で補正が厳密0。u_origin_trig は β の三角を運ぶ（drawdata が配る）。
const float ELL_NU  = 0.0016792203863837047;
const float ELL_NU2 = 0.0000014098905530233192;
const float ELL_INV_R = 1.0033640898209764;
uniform vec4  u_ell_trig;   // (cos2φ0, sin2φ0, cos4φ0, sin4φ0)（CPU double・原点の測地緯度）。球=vec4(0)
uniform float u_ell;        // 1=楕円体（ドレープの変位方向・dβ早期returnのゲート）。球=0
float dBeta(float dp) {
	if (u_ell < 0.5) return dp;   // 球＝恒等を早期return＝補正の三角関数を毎頂点払わない
	float sd = sinP(dp), cd = cosP(dp), s2d = sinP(2.0 * dp), c2d = cosP(2.0 * dp);
	return dp - 2.0 * ELL_NU  * (u_ell_trig.x * cd  - u_ell_trig.y * sd)  * sd
	          + 2.0 * ELL_NU2 * (u_ell_trig.z * c2d - u_ell_trig.w * s2d) * s2d;
}

// 原点相対 RTE：絶対経緯度を float32 で組み立てない（u_origin.x≈140 の加算は ulp≈1.8m の格子スナップ＝
// 原点がカメラ追従で毎フレーム動く→頂点が格子間を飛ぶ＝パンで這う揺らぎ）。原点の三角比（u_origin_trig＝
// CPUでdouble算出）へ、小さいΔ角(dlon/dlat)を角度加算で合成＝厳密・全球で有効（線形化＝接平面近似ではない）。
// 頂点3D − 原点3D を「桁落ちなし」で直接作る（絶対 dir を組んで引くと ≈1 同士の相殺で高ズームに揺らぎ）。
// cos(θ)-1 は -2sin²(θ/2) の恒等式で作り、全項に小因子を残す＝dlon/dlat→0 で rel=0 が厳密。
// 原点三角比 u_origin_trig=(cosLon0,sinLon0,cosLat0,sinLat0)。原点3D=(cLat cLon, sLat, cLat sLon)。
// dlat は dBeta で β差分へ（球では恒等）＝以降は純粋な球面幾何（β単位球）。
vec3 deltaToRel(float dlon_deg, float dlat_deg) {
	float da = dlon_deg * D2R, db = dBeta(dlat_deg * D2R);
	float sda = sinP(da), sdb = sinP(db);
	float sha = sinP(da * 0.5), shb = sinP(db * 0.5);
	float cdaM1 = -2.0 * sha * sha, cdbM1 = -2.0 * shb * shb;   // cos(da)-1, cos(db)-1（相殺なし）
	float cda = 1.0 + cdaM1, cdb = 1.0 + cdbM1;
	float ccM1 = cdaM1 + cdbM1 + cdaM1 * cdbM1;                 // cos(da)cos(db)-1（相殺なし）
	float cLon = u_origin_trig.x, sLon = u_origin_trig.y, cLat = u_origin_trig.z, sLat = u_origin_trig.w;
	float rx = cLat * cLon * ccM1 - cLat * sLon * cdb * sda - sLat * cLon * sdb * cda + sLat * sLon * sdb * sda;
	float ry = sLat * cdbM1 + cLat * sdb;
	float rz = cLat * sLon * ccM1 + cLat * cLon * cdb * sda - sLat * sLon * sdb * cda - sLat * cLon * sdb * sda;
	return vec3(rx, ry, rz);
}

uint compact16(uint m) {
	m &= 0x55555555u;
	m = (m | (m >> 1u)) & 0x33333333u;
	m = (m | (m >> 2u)) & 0x0F0F0F0Fu;
	m = (m | (m >> 4u)) & 0x00FF00FFu;
	m = (m | (m >> 8u)) & 0x0000FFFFu;
	return m;
}

// 経度 Δ（1e-7°単位, 符号付き最短）。経度は 360e7 周期で、素朴な int(a-b) は 2^32 で
// 折れて ±180° 越えを誤ラップする。max/min で |Δ| を厳密に取り、360e7 で正しく畳む。
// 【畳み込みは uint のまま】旧実装 f = 3.6e9 - float(d) は float 化後の大数引き算＝f32 ulp(3.6e9)=256
// （2.56e-5°≈2.8m）に格子化し、antimeridian 跨ぎの頂点がパンで最大数十px 飛ぶ（f32忠実シミュ実測）。
float dlonE7(uint a, uint b) {
	uint d = max(a, b) - min(a, b);   // |Δ| ∈ [0, 360e7], exact
	float s = (a >= b) ? 1.0 : -1.0;
	if (d > 1800000000u) { d = 3600000000u - d; s = -s; }  // take the short way around (exact in uint)
	return float(d) * s;
}

// gint 整数 → 原点相対 delta (deg)（decode 共通部）。
vec2 decodeDLL(uint idx) {
	ivec2 tc = ivec2(int(idx) % u_arc_w, int(idx) / u_arc_w);
	uvec4 px = texelFetch(u_arc_tex, tc, 0);
	uint lo = px.r, hi = px.g;
	uint lo_c = ((hi >> 31u) != 0u) ? lo : (lo & 0xFFFFFFC0u);
	uint hi_c = hi & 0x7FFFFFFFu;
	uint ix = (compact16(hi_c) << 16u) | compact16(lo_c);
	uint iy = (compact16(hi_c >> 1u) << 16u) | compact16(lo_c >> 1u);
	// 中心(=シーン原点)からの delta を整数空間で計算（精度確保・antimeridian 対応）。
	return vec2(dlonE7(ix, u_ix_center) * 1e-7, float(int(iy - u_iy_center)) * 1e-7);
}
// gint 整数 (ix, iy)（decodeDLL と同じ展開・整数のまま）
uvec2 decodeIXY(uint idx) {
	ivec2 tc = ivec2(int(idx) % u_arc_w, int(idx) / u_arc_w);
	uvec4 px = texelFetch(u_arc_tex, tc, 0);
	uint lo = px.r, hi = px.g;
	uint lo_c = ((hi >> 31u) != 0u) ? lo : (lo & 0xFFFFFFC0u);
	uint hi_c = hi & 0x7FFFFFFFu;
	return uvec2((compact16(hi_c) << 16u) | compact16(lo_c), (compact16(hi_c >> 1u) << 16u) | compact16(lo_c >> 1u));
}
// 辺 A→B の経緯度スパン max(|Δx|,|Δy|)（e7 整数・経度は 360e7 周期の最短側）＝bake の細分バケット分類と厳密同値
uint spanE7(uint a, uint b) {
	uvec2 A = decodeIXY(a), B = decodeIXY(b);
	uint dx = max(A.x, B.x) - min(A.x, B.x); if (dx > 1800000000u) dx = 3600000000u - dx;
	uint dy = max(A.y, B.y) - min(A.y, B.y);
	return max(dx, dy);
}
// 縫い目上の頂点か（ix が経度 ±180 ちょうど）＝antimeridian 切断の痕。両端が縫い目上の辺は「切断で生えた縦線」＝線パスでは描かない
//（塗りの巻き数には必要＝塗り扇は素通し）。本人スクショ 2026-09-15（切断された円の中を走る縦線）
bool onSeam(uint idx) {
	ivec2 tc = ivec2(int(idx) % u_arc_w, int(idx) / u_arc_w);
	uvec4 px = texelFetch(u_arc_tex, tc, 0);
	uint lo = px.r, hi = px.g;
	uint lo_c = ((hi >> 31u) != 0u) ? lo : (lo & 0xFFFFFFC0u);
	uint ix = (compact16(hi & 0x7FFFFFFFu) << 16u) | compact16(lo_c);
	return ix == 0u || ix == 3600000000u;
}
// gint 整数 → 原点相対 rel（fetchProject / fetchClip が共用）。
vec3 decodeRel(uint idx) {
	vec2 dLL = decodeDLL(idx);
	return deltaToRel(dLL.x, dLL.y);              // 頂点3D − 原点3D（小・正確）
}

// 【swap 本体】gint 整数 → 単位球 → mat4 → screen px。
vec3 fetchProject(uint idx) {
	vec3 rel = decodeRel(idx);
	float zr = u_origin_zr + dot(rel, u_eye);     // = dot(dir,eye)-1（相殺回避）。>0 手前半球
	vec4 clip = u_clipT + u_mvp * vec4(rel, 0.0); // = mvp*[dir,1]（相殺回避）
	if (clip.w <= 0.0) return vec3(u_viewport * 0.5, -1.0);   // カメラ背後 → 裏扱い
	vec2 ndc = clip.xy / clip.w;
	return vec3((ndc.x * 0.5 + 0.5) * u_viewport.x,
				(1.0 - (ndc.y * 0.5 + 0.5)) * u_viewport.y,
				zr);
}

// 深度統合（段階B）用の投影：標高ドレープ（u_elevScale>0 時）を掛けた screen px＋clip.w を返す。
// ドレープは renderer LINE_MAIN と同式（距離フェード df ＝遠景平ら化に追随・relW=rel+h*dir の相殺なしRTE）
// ＝基図の線と同じ高さに乗る。u_elevScale=0 なら relW=rel が厳密に成立＝fetchProject と同一結果（従来動作）。
// drapeRelW（rel＋経緯度 → 標高変位後の relW）と projectRel（rel/relW → screen px）に分けてある＝地形適応細分の
// サブ端点（大円上の内挿点＝idx を持たない）も同じ式で乗せる（2026-09-21）。
vec3 drapeRelW(vec3 rel, vec2 dLL) {
	vec3 relW = rel;
	if (u_elevScale > 0.0 && u_hasElev > 0.5) {
		vec3 dir = u_origin_pt + rel;             // 絶対単位球点（elev/df 用＝粗くて可）
		float df = 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, dir));
		vec2 ll = u_origin + dLL;
		float h = elevQAt(ll) * u_elevScale * df;   // 案A
		if (u_ell > 0.5) {                        // 楕円体＝測地法線で変位（renderer liftDir と同式＝基図の線と同じ高さ）
			float p = ll.y * D2R, l = ll.x * D2R, cp = cos(p);
			dir = vec3(cp * cos(l), sin(p) * ELL_INV_R, cp * sin(l));
		}
		relW = rel + h * dir;                     // (dir*(1+h)) − 原点3D を相殺なしで
	}
	return relW;
}
vec3 projectRel(vec3 rel, vec3 relW, out float clipW) {
	float zr = u_origin_zr + dot(rel, u_eye);     // 半球判定は非ドレープ（粗くて可）
	vec4 clip = u_clipT + u_mvp * vec4(relW, 0.0);
	clipW = clip.w;
	if (clip.w <= 0.0) return vec3(u_viewport * 0.5, -1.0);   // カメラ背後 → 裏扱い
	vec2 ndc = clip.xy / clip.w;
	return vec3((ndc.x * 0.5 + 0.5) * u_viewport.x,
				(1.0 - (ndc.y * 0.5 + 0.5)) * u_viewport.y,
				zr);
}
vec3 projectDrape(uint idx, out float clipW) {
	vec2 dLL = decodeDLL(idx);
	vec3 rel = deltaToRel(dLL.x, dLL.y);
	return projectRel(rel, drapeRelW(rel, dLL), clipW);
}

// per-feature bbox テクスチャ（fid→bbox e7整数・RGBA32UI・unit2）。
// pivotClip＝stencil 塗りの扇要（bbox中心）：巻き数は閉リングなら要の位置に依存しない＝正確さ不変。
//   旧・クリップ原点（画面中心）要は全三角形が「画面中心→辺」＝TBDR(Apple GPU) のパラメータバッファが
//   辺数×画面級で爆発した（fill 表示瞬間にGB級）。u_has_pivot=0（線のみ/疎fid）は従来のクリップ原点。
// bboxVisible＝feature 単位の GPU bbox カリング：チャンク粒度（広域ポリゴン＝国立公園級で無力）より
//   細かく、VS 冒頭で視野bbox との交差判定＝視野外 feature を頂点ごと捨てる（walk/raster 前の早期棄却）。
uniform usampler2D u_pivot_tex;
uniform int        u_pivot_w;
uniform int        u_has_pivot;
uniform uvec4      u_view_bbox;   // 視野 bbox（e7整数・保守的＝地平キャップ fallback 込み）
uniform int        u_use_vbb;     // 1＝bboxカリング有効（bboxテクスチャと視野bboxが両方ある時だけ）
// 遠方の要（塗り扇の画面カリング・utility.js farPivotParams）：axes＝NDC の東(xy)・北(zw)、q＝(経度差の重み, 緯度差の重み, 有効, 距離 K)、
// big＝要を遠方へ置く feature の幅/高さ下限（e7）。q.z=0＝無効（従来の bbox 中心）・q.z=2＝境界メタ（単一要）の要を axes.xy（NDC）へ（farPivotGlobal）
uniform vec4       u_far_axes;
uniform vec4       u_far_q;
uniform uvec2      u_far_big;
// 辺→塗り扇の鍵（R32UI・unit11・bake comp）：多片地物（1 地物に複数の構成ポリゴン）の層だけ。鍵は fid か、多片地物の片なら
// pivot テクスチャの fid の後ろの行＝構成ポリゴンの bbox。扇の要と裏側カリングを「地物」でなく「構成ポリゴン」単位にする：
// 世界規模の気候区分（アジアと南米が 1 地物）を地物 bbox で見ると半球級＝裏側の片も描かれ、地平円へ潰れた環が画面を一周して
// 海まで塗った（2026-10-17）。u_has_comp=0（全地物 1 片・線パス・境界メタ）＝鍵は fid（従来どおり）
uniform usampler2D u_comp_tex;
uniform int        u_comp_w;
uniform int        u_has_comp;
uint fanKey(int edge_id, uint fid) {
	if (u_has_comp == 0) return fid;
	return texelFetch(u_comp_tex, ivec2(edge_id % u_comp_w, edge_id / u_comp_w), 0).r;
}
// 地面アトラスへの焼き込み（RTT ドレープ・2026-09-21）：窓座標モード＝原点相対 dLL（deg）を経緯度整列の窓へ線形写像。
// 球面投影・地平クランプ・ドレープ・視野カリングは無効（窓の外は FBO の外＝クリップ）。塗り扇（stencil/idfill）だけが使う。
uniform vec4       u_atlas;       // xy＝原点−窓南西隅(deg・CPU f64)・zw＝1/窓幅
uniform float      u_atlasOn;
vec4 atlasClip(float dlon, float dlat) {
	vec2 p = (u_atlas.xy + vec2(dlon, dlat)) * u_atlas.zw;
	return vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
uvec4 fetchFidBbox(uint fid) {
	return texelFetch(u_pivot_tex, ivec2(int(fid) % u_pivot_w, int(fid) / u_pivot_w), 0);
}
// ── 窓座標モード（地面アトラスへの焼き込み）の塗り扇の頂点 ──
// 窓座標は原点相対の経度 dlon（最短周回）の線形写像。頂点ごとに最短周回を取ると、原点の対蹠経線（origin±180°）を跨ぐ環は窓の
// 両端に割れる＝割れ目の辺（幅 360°）と扇の閉じ残し（要→端点の楔）が緯線帯として窓いっぱいに走り、海を塗った（チルトの「世界の地形」で
// ケッペンの帯・2026-10-17。遠窓は 360° 超＝縫い目跨ぎの窓は bbox カリングも無く全球の辺が来る。画面側の球面投影には無い病）。
// 直し＝環（扇の鍵＝構成ポリゴン）の bbox 中心の周りで連続になるよう頂点を ±360° ずらす（環は割れない＝閉じた環の巻き数は要に依らず正確）。
// 中心から見て原点±180° を跨ぐ環は、標本化される中央の 360°（原点±180°）の両端に掛かる＝反対側の写し（±360°）をインスタンス 1 で描く。
// ずらす量は整数（e7・uint）で決め、位置は従来の dlonE7（原点近傍で厳密）＋360 の整数倍＝原点近傍の精度は不変（高ズームの窓を崩さない）
int dlonE7i(uint a, uint b) {   // dlonE7 と同じ符号規約の int 版（|値| ≤ 180e7＝int に収まる）
	uint d = max(a, b) - min(a, b); bool neg = a < b;
	if (d > 1800000000u) { d = 3600000000u - d; neg = !neg; }
	return neg ? -int(d) : int(d);
}
// 鍵（構成ポリゴン）の bbox：x＝中心の原点相対経度（e7）・y＝半幅（e7）。u_has_pivot=0（境界メタ・bbox 無し）＝(0,0)＝従来の最短周回
ivec2 keyLonSpan(uint key) {
	if (u_has_pivot == 0) return ivec2(0, 0);
	uvec4 bb = fetchFidBbox(key);
	uint cx = (bb.x + (bb.z - bb.x) / 2u) % 3600000000u;   // 周期対応 bbox（x>360e7）＝中心を [0,360e7) へ
	return ivec2(dlonE7i(cx, u_ix_center), int((bb.z - bb.x) / 2u));
}
// 写し（インスタンス 1）のずらし量（deg）。0＝写し不要（環が中央の 360° に収まる）。和は int を溢れる＝float で
float atlasCopyShift(ivec2 cs) {
	if (float(cs.x) + float(cs.y) > 1.8e9) return -360.0;
	if (float(cs.x) - float(cs.y) < -1.8e9) return 360.0;
	return 0.0;
}
// 扇の辺端点：鍵の中心の周りで連続な経度（＋写しのずらし）
vec4 atlasFanVertex(uint idx, ivec2 cs, float shift) {
	uvec2 v = decodeIXY(idx);
	int dx = dlonE7i(v.x, u_ix_center);
	float k = 0.0;
	if (u_has_pivot != 0) { float diff = float(dx) - float(cs.x); if (diff > 1.8e9) k = -1.0; else if (diff < -1.8e9) k = 1.0; }   // 中心から 180° 超＝反対の周回へ（ちょうど 180°＝そのまま：全幅の環の縫い目頂点は両端とも同じ側）
	return atlasClip(float(dx) * 1e-7 + 360.0 * k + shift, float(int(v.y - u_iy_center)) * 1e-7);
}
// 球面キャップの可視判定（renderer stencilWorldFan の CPU 二段構え①を GPU で）：feature bbox（経緯度矩形）を囲む
// 小円 (C, rad) が可視キャップ（中心 Ê・半径 hor＝acos(1/|E|)）と交わらなければ完全に裏＝頂点ごと捨てる。
// 交差条件 dot(C,Ê) > cos(hor+rad)（cos 加法）。rad＝矩形内で C から最遠の点＝緯線上は角、経線上は Δλ>90° で
// cos d(φ)=A sinφ+B cosφ（B<0）のくぼみが角より遠くなり得る＝解析的に取る。3.5° の余裕＝標高で地平線の向こうが
// 覗く分と bbox 中心≒キャップ中心の粗さ。Δλ≥180°（縫い目跨ぎ bbox）は rad が 180° へ伸びる＝自然に「常に可視」。
// 対蹠点を囲む面は horizonClamp だけだと環が地平円を一周＝全面 ±1 になる（2026-09-02 実測）＝この棄却が要。
// 経度スパン ≥180° の bbox も免除しない（旧＝免除・2026-09-15「縫い目を跨ぐ円が z≈6 以下で消える」の応急）：縫い目跨ぎは bake の
// 周期対応合流（x>360e7）で中心が正しく、全幅の bbox も rad が縁の経線（中心の対蹠経線）まで伸びる＝保守的に正しい。免除したままだと
// 南極の EF（全幅）や世界規模の区分の片が裏側でも描かれ、対蹠点を囲む環が地平円を一周して画面全体を塗った（2026-10-17 ケッペン）
bool capVisible(uvec4 bb) {
	uint cx = (bb.x + (bb.z - bb.x) / 2u) % 3600000000u, cy = bb.y + (bb.w - bb.y) / 2u;   // 周期対応 bbox（x>360e7）＝中心を [0,360e7) へ
	float latC = (u_origin.y + float(int(cy - u_iy_center)) * 1e-7) * D2R;
	float lat0 = (u_origin.y + float(int(bb.y - u_iy_center)) * 1e-7) * D2R;
	float lat1 = (u_origin.y + float(int(bb.w - u_iy_center)) * 1e-7) * D2R;
	float dl = min(float(bb.z - bb.x) * 0.5e-7, 180.0) * D2R;   // 中心経線→縁の経線
	float A = sin(latC), B = cos(latC) * cos(dl);              // 縁の経線上：cos d(φ) = A sinφ + B cosφ
	float cr = min(A * sin(lat0) + B * cos(lat0), A * sin(lat1) + B * cos(lat1));   // 角（cos rad の候補）
	if (B < 0.0) {   // くぼみ（最遠）が緯度範囲内なら -R
		float phiT = atan(A, B); phiT += phiT > 0.0 ? -3.141592653589793 : 3.141592653589793;
		if (phiT >= lat0 && phiT <= lat1) cr = -sqrt(A * A + B * B);
	}
	cr = clamp(cr, -1.0, 1.0);
	float sr = sqrt(1.0 - cr * cr);
	float crm = cr * 0.998135 - sr * 0.061049;                  // cos(rad + 3.5°)
	float srm = sqrt(max(1.0 - crm * crm, 0.0));
	float el = length(u_eye), ch = min(1.0, 1.0 / el), sh = sqrt(max(1.0 - ch * ch, 0.0));   // cos/sin hor
	// rad+3.5° と hor の和が 180° 以上＝二つのキャップは必ず交わる＝常に可視。加法定理の閾値 cos(hor+rad) は和が 180° を超えると
	// 向きが戻って（cos が増える）裏と誤判定する＝縫い目に頂点を持つ環（ix=0 と 360e7 近くが同じ arc＝bbox が経度全幅・rad≈180°）が
	// 消えた（t-rectlook の円・2026-10-17＝旧「≥180° は免除」が隠していた）。crm ≤ −ch ⟺ rad' ≥ 180°−hor
	if (crm <= -ch) return true;
	vec3 C = normalize(u_origin_pt + deltaToRel(dlonE7(cx, u_ix_center) * 1e-7, float(int(cy - u_iy_center)) * 1e-7));
	return dot(C, u_eye) / el > ch * crm - sh * srm;
}
// 縫い目跨ぎ feature の bbox は x が 360e7 を超える（bake の周期対応合流）＝東片 [0, bb.z−360e7] と西片 [bb.x, 360e7] の 2 区間として視野と交差判定
bool bboxVisible(uint fid) {
	if (u_has_pivot == 0) return true;   // bbox テクスチャ無し（境界メタ＝fid 混成ループ）＝カリング不可
	uvec4 bb = fetchFidBbox(fid);
	if (u_use_vbb != 0) {
		if (bb.w < u_view_bbox.y || bb.y > u_view_bbox.w) return false;
		bool xi = bb.z > 3600000000u ? (u_view_bbox.x <= bb.z - 3600000000u || u_view_bbox.z >= bb.x) : !(bb.z < u_view_bbox.x || bb.x > u_view_bbox.z);
		if (!xi) return false;
	}
	if (u_atlasOn > 0.5) return true;    // 窓座標モード＝vbb（窓 bbox）だけで刈る・地平キャップは無い
	return capVisible(bb);
}
vec4 pivotClip(uint fid) {
	if (u_has_pivot == 0) return u_far_q.z > 1.5 ? vec4(u_far_axes.xy, 0.0, 1.0) : vec4(0.0, 0.0, 0.0, 1.0);   // 単一要＝遠方の 1 点か画面中心
	uvec4 bb = fetchFidBbox(fid);
	// 縫い目跨ぎ（bbox 経度全幅）＝bbox 中心は経度 0°＝地球の裏側。裏側の要から手前の辺へ張る扇は遠クリップ面で深い側が切られ、
	// 要の投影位置を中心に環の大きさ比例の円盤が塗り残る（本人スクショ 2026-09-15「自分自身の影」）。要はクリップ原点（常に手前）へ
	if (bb.z - bb.x >= 1800000000u) return vec4(0.0, 0.0, 0.0, 1.0);
	// 視野より大きい feature＝要を遠方へ（画面外の辺の三角形を画面外に収める＝GPU が捨てる）。巻き数は閉環なら要に依らない。
	// 張り出し（視野の外へ出ている量）が最小の側へ帯が伸びるよう、要はその反対側の遠方。縫い目跨ぎ（x>360e7）は従来どおり
	if (u_far_q.z > 0.5 && u_use_vbb != 0 && bb.z <= 3600000000u && (bb.z - bb.x > u_far_big.x || bb.w - bb.y > u_far_big.y)) {
		float oL = (float(u_view_bbox.x) - float(bb.x)) * u_far_q.x, oR = (float(bb.z) - float(u_view_bbox.z)) * u_far_q.x;
		float oB = (float(u_view_bbox.y) - float(bb.y)) * u_far_q.y, oT = (float(bb.w) - float(u_view_bbox.w)) * u_far_q.y;
		vec2 d = u_far_axes.xy; float m = oL;            // 西が最小＝帯は西へ・要は東の遠方
		if (oR < m) { m = oR; d = -u_far_axes.xy; }
		if (oB < m) { m = oB; d = u_far_axes.zw; }
		if (oT < m) { d = -u_far_axes.zw; }
		return vec4(d * u_far_q.w, 0.0, 1.0);
	}
	uint cx = (bb.x + (bb.z - bb.x) / 2u) % 3600000000u, cy = bb.y + (bb.w - bb.y) / 2u;   // 中点（和は u32 を溢れる＝差分で）。周期対応 bbox＝[0,360e7) へ
	float dlon = dlonE7(cx, u_ix_center) * 1e-7;
	float dlat = float(int(cy - u_iy_center)) * 1e-7;
	if (u_atlasOn > 0.5) return atlasClip(dlon, dlat);   // 窓座標モード
	return u_clipT + u_mvp * vec4(deltaToRel(dlon, dlat), 0.0);
}

// stencil 用：クリップ座標のまま返す＝カメラ後方(w<=0)の頂点も動かさずハードウェアクリップに任せる。
// スクリーン化(fetchProject)は後方頂点を画面中央へ潰す＝ファン三角形が歪み winding が壊れ、
// チルトで図形の一部が視野外に出ると塗りが「中央へ向かう楔」でフラッドする（実写バグ）。
// クリップ空間の三角形はクリッピング後も可視画素の巻き数が厳密に保たれる＝部分表示でも正しい塗り。
// 裏半球の頂点を地平円（可視半球の縁：中心 E/|E|²・半径 √(1-1/|E|²)）へ射影クランプ＝renderer STENCIL_VS
// u_sphereClip と同式。塗り扇の端点だけに使う（巻き数は環が閉じていれば形を問わない）：裏側の面は円周上に
// 縮退＝巻き数 0 で消え、地平線を跨ぐ面は可視部だけを囲む。無しだと球を透かした投影の折返しが
// 「裏の面のゴースト」と「跨ぎ面の表側が塗れない（±1 相殺）」を作る（geoedit 本人報告 2026-09-15）。
vec3 horizonClamp(vec3 relW) {
	// 可視判定は RTE 形（fetchProject の zr と同式）＝u_origin_zr(CPU double)＋dot(rel,eye)。絶対座標 dot(origin_pt+rel, eye) を
	// float で組むと ≈1 同士の相殺で高ズーム（|E|−1≈1e-6・z18+）に可視頂点が「向こう側」へ化け地平円へ飛ぶ＝図形が突然消える／塗り崩壊
	//（本人報告 2026-09-15「zoom-in/out で突然消える」＝この版の初日に踏んだ）。
	if (u_origin_zr + dot(relW, u_eye) >= 0.0) return relW;   // 手前＝そのまま（RTE の精度を保つ）
	vec3 P = u_origin_pt + relW;
	float e2 = dot(u_eye, u_eye);
	vec3 Pp = P - u_eye * (dot(P, u_eye) / e2);
	float lp = length(Pp);
	vec3 t = lp > 1e-6 ? Pp / lp : normalize(vec3(-u_eye.z, 0.0, u_eye.x));
	return u_eye / e2 + sqrt(max(1.0 - 1.0 / e2, 0.0)) * t - u_origin_pt;
}
vec4 fetchClip(uint idx) {
	return u_clipT + u_mvp * vec4(horizonClamp(decodeRel(idx)), 0.0);
}

// 塗り扇(stencil/idfill)を地形にドレープ＝projectDrape と同じ標高変位のクリップ座標版（WebGPU fetchClipDrape と対・
// 2026-08-14 GL 移植）。u_elevScale=0(真俯瞰)なら fetchClip と同一＝既存挙動を壊さない。汚い土砂ポリゴン
//（自己交差/重なり）も winding で斜面に貼る。扇の pivot は非ドレープでよい（winding は screen で pivot 不変）。
vec4 fetchClipDrape(uint idx) {
	vec2 dLL = decodeDLL(idx);
	if (u_atlasOn > 0.5) return atlasClip(dLL.x, dLL.y);   // 窓座標モード（ドレープ・地平クランプ無し＝地形には FS の標本化で乗る）
	vec3 rel = deltaToRel(dLL.x, dLL.y);
	vec3 relW = rel;
	if (u_elevScale > 0.0 && u_hasElev > 0.5) {
		vec3 dir = u_origin_pt + rel;
		float df = 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, dir));
		vec2 ll = u_origin + dLL;
		float h = elevQAt(ll) * u_elevScale * df;   // 案A
		if (u_ell > 0.5) { float p = ll.y * D2R, l = ll.x * D2R, cp = cos(p); dir = vec3(cp * cos(l), sin(p) * ELL_INV_R, cp * sin(l)); }
		relW = rel + h * dir;
	}
	return u_clipT + u_mvp * vec4(horizonClamp(relW), 0.0);
}

vec4 toNDC(vec2 p) {
	return vec4(2.0 * p.x / u_viewport.x - 1.0,
				1.0 - 2.0 * p.y / u_viewport.y,
				0.0, 1.0);
}

uvec4 fetchEdgeMeta(int edge_id) {
	ivec2 mtc = ivec2(edge_id % u_meta_w, edge_id / u_meta_w);
	return texelFetch(u_meta_tex, mtc, 0);
}
// 頂点の VW rank（LOD 重要度 0-63）。terminal(L1 anchor)=63 常時保持、L2=低6bit（rust WEIGHT_MASK=0x3F）。
uint fetchRank(uint idx) {
	uvec4 px = texelFetch(u_arc_tex, ivec2(int(idx) % u_arc_w, int(idx) / u_arc_w), 0);
	return ((px.g >> 31u) != 0u) ? 63u : (px.r & 0x3Fu);
}

// GPU Dynamic LOD（gap無し・全描画パス共通）：始点 A が閾値未満の辺は捨てる（直前の kept 辺が跨いで描く）。
// 終点 B は「次に閾値を満たす頂点」まで前方スナップ＝間引き頂点を飛ばして kept 同士を直結。
// B のスナップはメタ隣接エントリを辿る：同一 arc 内は meta[e+1].A == meta[e].B（全密度でも
// long-jump tier でも成立）＝1 hop で次の kept 頂点へ（reversed arc も meta が向きを吸収済み）。
// 旧実装（arc 密頂点±1 の線形歩行）は rank とメタ密度の差ぶん texelFetch を浪費（ortho-map ZCTA実測: 1辺≈50fetch）。
// arc 終端は B が anchor(rank63)＝rank 判定で必ず停止。隣接が別 arc なら m.r != lodB で停止。
// 戻り値: true=辺を描く（lodB はスナップ済み）/ false=discard。
bool lodSnap(inout uint lodA, inout uint lodB, int edge_id) {
	if (float(fetchRank(lodA)) < u_lod_rank) return false;
	for (int k = 1; k < 4096; k++) {
		if (float(fetchRank(lodB)) >= u_lod_rank) break;
		uvec4 m = fetchEdgeMeta(edge_id + k);
		if (m.r != lodB) break;
		lodB = m.g;
	}
	return true;
}
`,ol=`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
uniform usampler2D u_pt_tex;
uniform usampler2D u_pt_meta_tex;
uniform int        u_pt_w;
uniform int        u_vbase;      // index の 4 頂点/点（P3）＝run の先頭（点は常に 0・QK 超で割った時だけ非 0）
uniform mat4       u_mvp;
uniform vec3       u_eye;
uniform vec2       u_origin;
uniform vec4       u_origin_trig; // 原点の三角比 (cosLon,sinLon,cosLat,sinLat)＝RTE角度加算の錨
uniform vec2       u_viewport;
uniform float      u_pt_radius;
uniform usampler2D u_fid_style;    // fid スタイル表（paint 時のみ・unit5。線 VS と同一レイアウト＝§7.1）
uniform int        u_fidstyle_w;
uniform int        u_has_fidstyle;
uniform float      u_dpr;          // 表の circle-radius(1/4 CSS px) → device px
uniform uint       u_ix_center;
uniform uint       u_iy_center;
uniform vec4       u_clipT;      // mvp*[原点3D,1]＝CPU(double)算出＝MVP相殺回避の錨
uniform float      u_origin_zr;  // dot(原点3D,eye)-1＝CPU(double)算出＝zr相殺回避の錨
const float D2R = 0.017453292519943295;

vec3 lonlatTo3D(vec2 ll) {
	float a = ll.x * D2R, b = ll.y * D2R, cb = cos(b);
	return vec3(cb * cos(a), sin(b), cb * sin(a));
}
// 微小角 sin（arc 側と同一＝GPU sin の実装誤差/ゼロフラッシュ回避）。
float sinP(float x) {
	float x2 = x * x;
	return (abs(x) < 0.1) ? x * (1.0 - x2 * (1.0 / 6.0) * (1.0 - x2 * (1.0 / 20.0))) : sin(x);
}
float cosP(float x) { float s = sinP(0.5 * x); return 1.0 - 2.0 * s * s; }
// 楕円体 dβ（arc 側と同一・球=u_ell=0 で早期return＝三角関数を払わない）
uniform vec4 u_ell_trig;
uniform float u_ell;
float dBeta(float dp) {
	if (u_ell < 0.5) return dp;
	float sd = sinP(dp), cd = cosP(dp), s2d = sinP(2.0 * dp), c2d = cosP(2.0 * dp);
	return dp - 2.0 * 0.0016792203863837047    * (u_ell_trig.x * cd  - u_ell_trig.y * sd)  * sd
	          + 2.0 * 0.0000014098905530233192 * (u_ell_trig.z * c2d - u_ell_trig.w * s2d) * s2d;
}
// 原点相対 RTE（arc 側 deltaToRel と同一）：頂点3D−原点3D を桁落ちなしで直接作る（cos-1=-2sin²(θ/2)）。
vec3 deltaToRel(float dlon_deg, float dlat_deg) {
	float da = dlon_deg * D2R, db = dBeta(dlat_deg * D2R);
	float sda = sinP(da), sdb = sinP(db);
	float sha = sinP(da * 0.5), shb = sinP(db * 0.5);
	float cdaM1 = -2.0 * sha * sha, cdbM1 = -2.0 * shb * shb;
	float cda = 1.0 + cdaM1, cdb = 1.0 + cdbM1;
	float ccM1 = cdaM1 + cdbM1 + cdaM1 * cdbM1;
	float cLon = u_origin_trig.x, sLon = u_origin_trig.y, cLat = u_origin_trig.z, sLat = u_origin_trig.w;
	float rx = cLat * cLon * ccM1 - cLat * sLon * cdb * sda - sLat * cLon * sdb * cda + sLat * sLon * sdb * sda;
	float ry = sLat * cdbM1 + cLat * sdb;
	float rz = cLat * sLon * ccM1 + cLat * cLon * cdb * sda - sLat * sLon * sdb * cda - sLat * cLon * sdb * sda;
	return vec3(rx, ry, rz);
}
uint compact16(uint m) {
	m &= 0x55555555u; m = (m | (m >> 1u)) & 0x33333333u; m = (m | (m >> 2u)) & 0x0F0F0F0Fu;
	m = (m | (m >> 4u)) & 0x00FF00FFu; m = (m | (m >> 8u)) & 0x0000FFFFu; return m;
}
float dlonE7(uint a, uint b) {
	uint d = max(a, b) - min(a, b); float s = (a >= b) ? 1.0 : -1.0;
	if (d > 1800000000u) { d = 3600000000u - d; s = -s; }   // uint で畳む＝exact（arc 側と同修正）
	return float(d) * s;
}
// pt_id → screen px（zr>0 手前）。
// per-fid 点スタイル（paint 時のみ）：visible bit0=0 か radius=0 は棄却（false）。radius＝表(1/4 CSS px)×dpr、
// 色＝G（circle色。α=0 は既定色のまま）。線 VS の per-fid 節と同じ表・同じ約束（幅0=線なし ⇔ 半径0=点なし）。
// 円の縁（2026-09-26・MapLibre の circle-stroke）＝表の第 4 語（点の地物）が縁の色・線幅の欄（点では使わない）が縁の幅（1/8 CSS px×dpr）・
// flags bit1＝塗り無し（中空の円）。縁は半径の外側（MapLibre と同じ）。どれも 0 なら従来どおり
bool fidPointStyle(int feat_id, inout float r, inout vec4 col, inout vec4 scol, inout float sw) {
	if (u_has_fidstyle != 1) return true;
	uvec4 rec = texelFetch(u_fid_style, ivec2(feat_id % u_fidstyle_w, feat_id / u_fidstyle_w), 0);
	if ((rec.b & 1u) == 0u) return false;
	uint r4 = (rec.b >> 8u) & 255u;
	if (r4 == 0u) return false;
	r = float(r4) * 0.25 * u_dpr;
	uint lc = rec.g;
	if ((rec.b & 2u) != 0u) col = vec4(0.0);
	else if ((lc & 255u) != 0u) col = vec4(float(lc >> 24u), float((lc >> 16u) & 255u), float((lc >> 8u) & 255u), float(lc & 255u)) / 255.0;
	uint w8 = (rec.b >> 24u) | (((rec.b >> 16u) & 255u) << 8u);   // 線幅 u16（1/8px・下位は bit 24〜・上位は bit 16〜＝2026-10-22 から）
	if (rec.a != 0u && w8 != 0u) { scol = vec4(float(rec.a >> 24u), float((rec.a >> 16u) & 255u), float((rec.a >> 8u) & 255u), float(rec.a & 255u)) / 255.0; sw = float(w8) * 0.125 * u_dpr; }
	return true;
}
// 点を地形へドレープ（線の drapeRelW と同式＝基図の線・塗りと同じ高さ）。標高 uniform は bindDepthUniforms が配る＝
// 未設定（真俯瞰・地形なし）なら u_elevScale=0＝rel のまま＝従来どおり海面高。無いと起伏のある地図で傾けた時に
// 点だけ海面に残り地形からずれる（choju 本人指摘 2026-10-14）
uniform float      u_fogFar;
uniform vec3       u_origin_pt;
uniform sampler2D  u_elevTex;
uniform vec4       u_elevBounds;
uniform float      u_elevScale;
uniform float      u_hasElev;
uniform float      u_elevEdgeFade;
uniform vec4       u_meshQ;
uniform float      u_meshG;
float elevAt(vec2 ll) {
	if (u_hasElev < 0.5) return 0.0;
	vec2 uv = (ll - u_elevBounds.xy) / u_elevBounds.zw;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
	float fade = 1.0;
	if (u_elevEdgeFade > 0.0) {
		vec2 w = vec2(u_elevEdgeFade) / u_elevBounds.zw;
		fade = min(smoothstep(0.0, w.x, min(uv.x, 1.0 - uv.x)), smoothstep(0.0, w.y, min(uv.y, 1.0 - uv.y)));
	}
	return texture(u_elevTex, uv).r * fade;
}
float elevQAt(vec2 ll) {
	if (u_meshG < 1.5) return elevAt(ll);
	vec2 g = (ll - u_meshQ.xy) / u_meshQ.zw;
	if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) return elevAt(ll);
	float N = u_meshG - 1.0;
	vec2 gc = min(g * N, vec2(N - 1e-4));
	vec2 gi = floor(gc);
	vec2 gf = gc - gi;
	vec2 st = u_meshQ.zw / N;
	vec2 b0 = u_meshQ.xy + gi * st;
	float h00 = elevAt(b0), h10 = elevAt(b0 + vec2(st.x, 0.0)), h01 = elevAt(b0 + vec2(0.0, st.y)), h11 = elevAt(b0 + st);
	return (gf.x + gf.y < 1.0)
		? h00 + gf.x * (h10 - h00) + gf.y * (h01 - h00)
		: h11 + (1.0 - gf.x) * (h01 - h11) + (1.0 - gf.y) * (h10 - h11);
}
vec3 ptDrapeRelW(vec3 rel, vec2 dLL) {
	if (!(u_elevScale > 0.0 && u_hasElev > 0.5)) return rel;
	vec3 dir = u_origin_pt + rel;
	float df = 1.0 - smoothstep(u_fogFar * 0.8, u_fogFar * 2.0, distance(u_eye, dir));
	vec2 ll = u_origin + dLL;
	float h = elevQAt(ll) * u_elevScale * df;
	if (u_ell > 0.5) { float p = ll.y * D2R, l = ll.x * D2R, cp = cos(p); dir = vec3(cp * cos(l), sin(p) * 1.0033640898209764, cp * sin(l)); }
	return rel + h * dir;
}
vec3 fetchPoint(int pt_id) {
	ivec2 tc = ivec2(pt_id % u_pt_w, pt_id / u_pt_w);
	uvec4 px = texelFetch(u_pt_tex, tc, 0);
	uint hi_c = px.g & 0x7FFFFFFFu;
	uint ix = (compact16(hi_c)       << 16u) | compact16(px.r);
	uint iy = (compact16(hi_c >> 1u) << 16u) | compact16(px.r >> 1u);
	float dlon = dlonE7(ix, u_ix_center) * 1e-7;
	float dlat = float(int(iy - u_iy_center)) * 1e-7;
	vec3 rel = deltaToRel(dlon, dlat);            // 頂点3D − 原点3D（小・正確）
	float zr = u_origin_zr + dot(rel, u_eye);     // = dot(dir,eye)-1（相殺回避）
	vec4 clip = u_clipT + u_mvp * vec4(ptDrapeRelW(rel, vec2(dlon, dlat)), 0.0); // = mvp*[dir,1]（相殺回避）＋地形の高さ
	if (clip.w <= 0.0) return vec3(u_viewport * 0.5, -1.0);
	vec2 ndc = clip.xy / clip.w;
	return vec3((ndc.x * 0.5 + 0.5) * u_viewport.x, (1.0 - (ndc.y * 0.5 + 0.5)) * u_viewport.y, zr);
}
`,ls=`${ci}
void main() {
	int edge_id = gl_VertexID / 3;
	int sub     = gl_VertexID % 3;
	uvec4 meta = fetchEdgeMeta(edge_id);
	uint key = fanKey(edge_id, meta.a);   // 扇の鍵＝fid か構成ポリゴン（多片地物の層）
	if (!bboxVisible(key)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }   // 視野外（裏側）の構成ポリゴン＝丸ごと棄却
	uint lodA = meta.r, lodB = meta.g;
	if (!lodSnap(lodA, lodB, edge_id)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	if (u_atlasOn > 0.5) {   // 窓座標モード＝環を鍵の中心の周りで連続に・写し（インスタンス 1）は ±360°（要は閉じた環なら何処でもよい）
		ivec2 cs = keyLonSpan(key); float shift = gl_InstanceID == 0 ? 0.0 : atlasCopyShift(cs);
		if (gl_InstanceID != 0 && shift == 0.0) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
		gl_Position = sub == 0 ? pivotClip(key) : atlasFanVertex(sub == 1 ? lodA : lodB, cs, shift);
		return;
	}
	if (sub == 0) { gl_Position = pivotClip(key); return; }   // 扇要＝構成ポリゴン局所（TBDRパラメータバッファ対策）
	gl_Position = fetchClipDrape(sub == 1 ? lodA : lodB);   // 塗り扇の辺端点を地形へドレープ（真俯瞰=無変化・WebGPU vsStencil と対）
}`,us=`${ci}
uniform float u_line_width;
uniform float u_dpr;
uniform int   u_active_id;
uniform int   u_pass;
uniform vec4  u_style_table[256];
uniform vec4  u_hilite_color;   // ホバー(pass1)の線色。a>0で有効・0で素の線色を不透明に
uniform float u_hilite_width;   // ホバー(pass1)の指定全幅(device px)。0=未指定＝u_line_width のまま（per-fid/コロプレスに左右されず overlay 町丁目線と一致させる）
uniform vec2  u_dash_table[256];   // [dash_len, gap_len] in px; gap=0 → solid
uniform usampler2D u_fid_style;    // fid スタイル表（RGBA32UI・unit5。idfill と同一レイアウト）
uniform int        u_fidstyle_w;
uniform int        u_has_fidstyle;
uniform float      u_width_add;    // パス増分（clean=0 / highlight=+2）
uniform float      u_fid_wscale;   // 表の line-width（1/8 CSS px）→ device px＝dpr（2026-09-26・旧＝×1＝高 dpr で細く出た＝U1）
uniform int        u_sub;          // 地形適応細分：1辺あたりのサブ区間数＝インスタンス数（1＝従来経路・細分なし）
uniform uint       u_subSkipE7;    // メイン描画（clean・u_sub=1）が飛ばす長辺の下限スパン（e7）＝複製行のインスタンス描画が担う。0＝飛ばさない
out vec4  v_color;
out float v_zr;
out float v_dist;
out float v_perp;
flat out float v_halfw;
flat out vec2  v_dash;
flat out float v_dist_base;
out vec2       v_frag;   // 頂点の実スクリーン位置（device px）＝カプセルSDF用
flat out vec2  v_ea;     // 線分端A（device px）
flat out vec2  v_eb;     // 線分端B（clip済, device px）

// ── 地形適応細分（3D ドレープの地形貫きの根治・2026-09-21）──
// gint は保持頂点間を 3D 直線チョードで描き、標高は端点でしか取らない＝長辺は途中の地形を無視して山を貫く／浮く
//（米加国境状態。度アンカーで最悪 1°=111km に縮んだだけ）。線 VS を辺×u_sub インスタンスで起動し、辺を u_sub 個
// までのサブ区間に割って各サブ端点を地形メッシュ面（elevQAt＝描画されている折れ線面）へ乗せる。
//  ・区間長の目安＝メッシュ1セル（サブ端点が面の折れ目ごとに乗る＝面に厳密に沿う）
//  ・密度は近傍窓 u_near（視野中心の箱）の内側 [t0,t1] に集中・外側（遠景/画面外）は 1/8 密度＝1° の長辺が z15 で
//    画面に掛かっても、見えている数 km に区間が集まる
//  ・窓境界は 1/32 の倍数・窓内は辺の 2 進格子（1/2^L）・区間数は 2 の冪＝カメラが動いても頂点は「増減」するだけで「滑らない」（入れ子）
//  ・サブ端点は大円上（完全球体＝頂点は大円で結ぶ・度アンカーと同じ弧）を原点相対・相殺なしで内挿
//  ・u_sub=1（2D/地形なし）は従来経路そのまま＝ゼロ費用
int pow2ceil(int x) { int p = 1; while (p < x) p <<= 1; return p; }
// A,B の rel（頂点3D−原点3D）から大円上の P(t) の rel を返す。P=slerp(Â,B̂)＝ka·Â+kb·B̂・Â=O+ra 等より
// P−O = ka·ra + kb·rb + (ka+kb−1)·O。ka+kb−1 = cos((½−t)ω)/cos(ω/2) − 1 = 2·sin(tω/2)·sin((1−t)ω/2)/cos(ω/2)（相殺なし）。
// t=0/1 は ka/kb が厳密 1/0 ＝端点を bit 同一で返す（細分されない辺は従来と同じ位置）。
vec3 slerpRel(vec3 ra, vec3 rb, float t) {
	float c = distance(ra, rb);                     // 弦長
	if (c < 1e-9) return ra;
	float w = 2.0 * asin(min(0.5 * c, 1.0));        // 中心角
	float sw = sinP(w);
	float ka = sinP((1.0 - t) * w) / sw, kb = sinP(t * w) / sw;
	float ko = 2.0 * sinP(0.5 * t * w) * sinP(0.5 * (1.0 - t) * w) / cosP(0.5 * w);
	return ka * ra + kb * rb + ko * u_origin_pt;
}
// 辺 A→B（原点相対 deg）のサブ区間 s の [ts,te] を返す。false＝この s は空（縮退させる）。
bool subRange(vec2 dA, vec2 dB, int s, out float ts, out float te) {
	ts = 0.0; te = 1.0;
	if (u_sub <= 1 || u_meshG < 1.5 || !(u_elevScale > 0.0 && u_hasElev > 0.5)) return s == 0;
	vec2 cell = u_meshQ.zw / (u_meshG - 1.0);       // 地形メッシュ 1 セル (deg)
	vec2 d = dB - dA;
	float t0 = 0.0, t1 = 1.0;
	if (u_near.x > 0.0) {                           // Liang-Barsky：-near <= dA + t·d <= near
		for (int i = 0; i < 2; i++) {
			float p = -d[i], q = dA[i] + u_near[i];
			if (p == 0.0) { if (q < 0.0) { t0 = 1.0; t1 = 0.0; } } else { float r = q / p; if (p < 0.0) t0 = max(t0, r); else t1 = min(t1, r); }
			p = d[i]; q = u_near[i] - dA[i];
			if (p == 0.0) { if (q < 0.0) { t0 = 1.0; t1 = 0.0; } } else { float r = q / p; if (p < 0.0) t0 = max(t0, r); else t1 = min(t1, r); }
		}
		if (t0 > t1) { t0 = 0.0; t1 = 0.0; }        // 窓の外＝全体を 1/8 密度（post 区間として）
		else { t0 = floor(t0 * 32.0) / 32.0; t1 = ceil(t1 * 32.0) / 32.0; }   // 1/32 倍数へ量子化（窓内格子 1/2^L・L≥5 に乗る）
	}
	int pre = (t0 > 0.0) ? 1 : 0, post = (t1 < 1.0) ? 1 : 0;
	int N = u_sub;
	if (N < pre + post + 1) return s == 0;
	// 窓内＝辺自身のパラメータの 2 進格子（区間長 1/2^L・2^L ≥ 辺のセル数＝区間 ≤ 1 セル）＝窓 [t0,t1]（1/32 倍数）が
	// カメラ追従で動いても区間境界は同じ格子に留まる（完全な入れ子）。L≥5 が取れない小さい N/短辺は等分に退避。
	int nIn = 0;
	if (t1 > t0) {
		float cAll = max(abs(d.x) / cell.x, abs(d.y) / cell.y);   // 辺全体の地形セル数
		int Ln = 0; while (float(1 << Ln) < cAll && Ln < 12) Ln++;   // 2^Ln 分割で区間 ≤ 1 セル
		int Lc = 0; while (float(1 << (Lc + 1)) * (t1 - t0) <= float(N - pre - post) && Lc < 12) Lc++;   // 窓内区間数 ≤ N−pre−post
		int L = min(Ln, Lc);
		nIn = (L >= 5) ? int((t1 - t0) * float(1 << L) + 0.5)
		               : min(pow2ceil(int(ceil(min(cAll * (t1 - t0), 4096.0)))), N - pre - post);
		nIn = max(nIn, 1);
	}
	int rem = N - nIn, nPre = 0, nPost = 0;
	if (pre == 1) { float c = max(abs(d.x) * t0 / cell.x, abs(d.y) * t0 / cell.y) * 0.125; nPre = clamp(pow2ceil(int(ceil(min(c, 4096.0)))), 1, (post == 1) ? rem / 2 : rem); }
	if (post == 1) { float c = max(abs(d.x) * (1.0 - t1) / cell.x, abs(d.y) * (1.0 - t1) / cell.y) * 0.125; nPost = clamp(pow2ceil(int(ceil(min(c, 4096.0)))), 1, rem - nPre); }
	int n = nPre + nIn + nPost;
	if (s >= n) return false;
	if (s < nPre) { ts = t0 * float(s) / float(nPre); te = t0 * float(s + 1) / float(nPre); }
	else if (s < nPre + nIn) { int k = s - nPre; ts = t0 + (t1 - t0) * float(k) / float(nIn); te = t0 + (t1 - t0) * float(k + 1) / float(nIn); }
	else { int k = s - nPre - nIn; ts = t1 + (1.0 - t1) * float(k) / float(nPost); te = t1 + (1.0 - t1) * float(k + 1) / float(nPost); }
	return true;
}

void main() {
	int edge_id = u_vbase + gl_VertexID / 4;   // index の 4 頂点/辺（perf plan P3）＝drawElements の index は 0..4K・run の先頭は u_vbase。旧 6 頂点は quad6GLSL（?quad4=0）
	int sub     = gl_VertexID % 4;
	uvec4 meta  = fetchEdgeMeta(edge_id);
	bool dupRow = (meta.b & 128u) != 0u;   // 複製行（長辺の細分用・メタ末尾・bake appendSubRows）＝元の辺へ引き直す（歩行・破線位相は元の辺）
	if (dupRow) { edge_id = int(meta.b >> 8u); meta = fetchEdgeMeta(edge_id); }
	int feat_id = int(meta.a);

	// feature bbox カリング（ポリゴン辺のみ＝styleId 0。折れ線 fid は bbox テクスチャに無い）
	if ((meta.b & 255u) == 0u && !bboxVisible(meta.a)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	// 地形適応細分：メイン描画（clean）は skip 下限以上の長辺を飛ばす＝同じ辺の複製行がインスタンス描画で細分する（整数スパン＝bake と厳密一致）
	if (!dupRow && u_pass == 0 && u_subSkipE7 > 0u && spanE7(meta.r, meta.g) >= u_subSkipE7) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	uint lodA = meta.r, lodB = meta.g;
	if (!lodSnap(lodA, lodB, edge_id)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	if ((meta.b & 255u) == 0u && onSeam(lodA) && onSeam(lodB)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }   // 切断の縦線（縫い目辺）は描かない

	if (u_pass == 0 && feat_id == u_active_id) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	if (u_pass == 1 && feat_id != u_active_id) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }

	// per-fid スタイル（paint 時のみ）。visibility=filter の実体（線にも効く）・width=0=線を描かない（§7.1）。
	float lw = u_line_width;
	vec4  fidColor = vec4(0.0);
	vec2  fidDash  = vec2(0.0);   // 表の第 4 語（線の地物）＝[線, 間] 1/8 CSS px の u16×2（MapLibre の line-dasharray・2026-09-26）。0＝従来の style 表
	if (u_has_fidstyle == 1) {
		uvec4 rec = texelFetch(u_fid_style, ivec2(int(meta.a) % u_fidstyle_w, int(meta.a) / u_fidstyle_w), 0);
		if (rec.a != 0u) fidDash = vec2(float(rec.a >> 16u), float(rec.a & 0xFFFFu)) * 0.125 * u_fid_wscale;
		if ((rec.b & 1u) == 0u) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
		uint w8 = (rec.b >> 24u) | (((rec.b >> 16u) & 255u) << 8u);   // 線幅 u16（1/8px・下位は bit 24〜・上位は bit 16〜＝2026-10-22 から）
		if (w8 == 0u) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
		lw = float(w8) * 0.125 * u_fid_wscale + u_width_add;
		uint lc = rec.g;
		if ((lc & 255u) != 0u)
			fidColor = vec4(float(lc >> 24u), float((lc >> 16u) & 255u), float((lc >> 8u) & 255u), float(lc & 255u)) / 255.0;
	}
	if (u_pass == 1 && u_hilite_width > 0.0) lw = u_hilite_width;   // ホバー＝指定全幅を最優先（per-fid幅にもコロプレスにも左右されず overlay 町丁目線と一致）

	// クアッドは「辺の正準方向（lodA→lodB）」で tang/perp を共有する。
	// 旧実装は各頂点が「自端→相手端」で dir を取っていた＝A側とB側で perp が反転し、
	// クアッドがボウタイ（ねじれリボン）化：細線ではAAに紛れ、太線（per-fid @width）で
	// 「片側欠け＋交差部だけ二重描画の濃い芯」として露呈（geoedit 8/20・本人「ねじれ」報告の根治）。
	bool  useA = sub < 2;   // 4 頂点＝0:A− 1:A+ 2:B+ 3:B−（index [0,1,2,0,2,3]＝旧 6 列 (A−)(A+)(B+)(A−)(B+)(B−) と同じ三角形・同じ向き）
	float side = (sub == 1 || sub == 2) ? 1.0 : -1.0;

	float wA, wB;                        // 端点の clip.w（対数深度用。深度オフ時は未使用）
	vec3 pa3, pb3;
	float subOff = 0.0;                  // 破線位相の近似基底（このサブ区間より前の区間数）
	if (u_sub <= 1) {
		pa3 = projectDrape(lodA, wA);    // ドレープ込み投影（u_elevScale=0 なら fetchProject と同一）＝従来経路
		pb3 = projectDrape(lodB, wB);
	} else {                             // 地形適応細分：サブ区間 gl_InstanceID の端点を大円上に内挿して面へ乗せる
		vec2 dA = decodeDLL(lodA), dB = decodeDLL(lodB);
		float ts, te;
		if (!subRange(dA, dB, gl_InstanceID, ts, te)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
		vec3 rA = deltaToRel(dA.x, dA.y), rB = deltaToRel(dB.x, dB.y);
		vec3 r0 = slerpRel(rA, rB, ts), r1 = slerpRel(rA, rB, te);
		pa3 = projectRel(r0, drapeRelW(r0, mix(dA, dB, ts)), wA);   // 標高は経緯度線形の t で標本（大円との差は ≤120m×(span/1°)²＝実用上ゼロ）
		pb3 = projectRel(r1, drapeRelW(r1, mix(dA, dB, te)), wB);
		subOff = float(gl_InstanceID);
	}
	v_zr = useA ? pa3.z : pb3.z;
	// 相手端が視点の裏へ回る場合の端点クリップ（旧＝自端基準の片側のみ→両対称へ）
	vec2 axy = pa3.xy, bxy = pb3.xy;
	if (pb3.z < 0.0 && pa3.z > 0.0) bxy = pa3.xy + (pa3.z / (pa3.z - pb3.z)) * (pb3.xy - pa3.xy);
	if (pa3.z < 0.0 && pb3.z > 0.0) axy = pb3.xy + (pb3.z / (pb3.z - pa3.z)) * (pa3.xy - pb3.xy);

	// 対数深度（renderer applyLogDepth/LINE_MAIN の zc と同式・同係数）＝地形/基図線と同じ深度空間。
	// u_logCoef=0（深度オフ）は z=0＝従来動作（深度テストも off なので値は無関係だが分岐で保証）。
	float wS = useA ? wA : wB;
	float zc = (u_logCoef > 0.0) ? (log2p1G(max(wS, 1e-30)) * u_logCoef - 1.0) : 0.0;   // 1.0+w の桁落ちを避ける（glsl.ts PROJECT の log2p1 と同じ）

	vec2 dir = bxy - axy;
	float len = length(dir);
	if (len < 1e-4) { vec4 nd0 = toNDC(axy); gl_Position = vec4(nd0.xy, zc, 1.0); return; }
	vec2 tang = dir / len;
	vec2 perp = vec2(-tang.y, tang.x);
	float halfCss = lw * 0.5 + 1.0 / u_dpr;
	vec2 qpos = (useA ? axy : bxy) + side * halfCss * perp + (useA ? -halfCss : halfCss) * tang;   // AA余白込み・端は FS のカプセルSDFが丸める
	vec4 nd = toNDC(qpos);
	gl_Position = vec4(nd.xy, zc, 1.0);
	v_frag = qpos; v_ea = axy; v_eb = bxy;

	int style_idx = int(meta.b & 0xFFu);
	vec4 baseC = (fidColor.a > 0.0 ? fidColor : u_style_table[style_idx]);   // fid線色（paint）＞style_table（既定）
	v_color = (u_pass == 1) ? (u_hilite_color.a > 0.0 ? u_hilite_color : vec4(1.0, 0.9, 0.0, 1.0)) : baseC;   // ホバー(pass1)＝hiliteColor指定色（census=青）／未指定は黄（凍結デモの既定ハイライトを維持）
	v_dash      = fidDash.y > 0.0 ? fidDash : u_dash_table[style_idx];
	v_dist_base = float(meta.b >> 8u) * 0.017453292 + subOff * len;   // 累積px距離の基底（scale 非依存の相対）＋サブ区間ぶん（等長近似＝破線位相を辺内で繋ぐ）
	v_dist = useA ? 0.0 : len;
	v_perp  = side * halfCss * u_dpr;
	v_halfw = lw * 0.5 * u_dpr;
}`,fs=`#version 300 es
precision mediump float;
uniform float u_hidden;   // 1＝隠線パス（深度不合格側＝depthFunc GREATER で再描画）：淡く＋固定破線（CAD流）。既定0＝通常
uniform highp vec3 u_eye; // 視点位置＝地平線フェード窓のスケール。VS(highp)と同一プログラム＝precision一致必須（mediumpだとリンク失敗＝gint全消え）
in  vec4  v_color;
in  highp float v_zr;   // 近景の zr は 1e-5 級＝mediump では潰れる（VS と精度を揃える）
in  float v_dist;
in  float v_perp;
flat in float v_halfw;
flat in vec2  v_dash;
flat in float v_dist_base;
in  vec2  v_frag;
flat in vec2  v_ea;
flat in vec2  v_eb;
out vec4  fragColor;
void main() {
	if (v_zr < -0.05)     discard;
	if (v_color.a == 0.0) discard;
	// 地平線フェード窓＝カメラ高さ(length(u_eye)-1)に比例（上限0.02＝低ズームは従来どおりの柔らかさ）。
	// 旧・固定窓(-0.01..0.02)は、高ズームでは zr の最大値(=カメラ距離-1≈1e-3級)ごと窓の内側＝
	// 画面全体の gint 線が常時半透明(α≈0.35)だった（geoedit の太線で発覚 8/20。海岸線は z<7 専用で無傷だった理由）
	// 下限は 2e-4（≈1.3km）だった＝カメラ高度がそれを割る z16.5 前後から足元まで窓の内側＝線が全面半透明（z17.3 で α≈0.73・z18.5 で ≈0.47）、
	// 線分ごとの丸端が重なる所だけ濃く「数珠・波打つ縁」になった（本人報告 2026-11-05「道路がギザギザ」）。窓は高さに比例させ切る＝足元の zr≈h は常に窓の外。
	highp float win = clamp((length(u_eye) - 1.0) * 0.5, 1e-8, 0.02);
	float alpha = v_color.a * smoothstep(-win * 0.5, win, v_zr);
	if (u_hidden > 0.5) {
		// 隠線（尾根の向こう）＝淡い固定破線：消し去らず「向こう側に在る」ことだけ静かに残す（CAD の隠線表現）。
		float t = mod(v_dist_base + v_dist, 10.0);
		float aa0 = max(fwidth(v_dist), 0.001);
		alpha *= (1.0 - smoothstep(6.0 - aa0, 6.0 + aa0, t)) * 0.35;
	}
	if (v_dash.y > 0.0) {
		float d      = v_dist_base + v_dist;
		float period = v_dash.x + v_dash.y;
		float t      = mod(d, period);
		float aa     = max(fwidth(v_dist), 0.001);
		alpha *= 1.0 - smoothstep(v_dash.x - aa, v_dash.x + aa, t);
	}
	// カプセルSDF：線分[v_ea,v_eb]への距離で塗る＝両端が半円(丸キャップ)。
	// 鋭角の繋ぎ目でも隣接線分の丸端が重なり、四角キャップのトゲ(イガイガ)が出ない。
	vec2 pa = v_frag - v_ea, ba = v_eb - v_ea;
	float t2 = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
	float dcap = length(pa - ba * t2);
	float aaW = max(fwidth(dcap), 1e-3);
	alpha *= clamp((v_halfw - dcap) / aaW + 0.5, 0.0, 1.0);
	if (alpha < 0.004) discard;
	fragColor = vec4(v_color.rgb, alpha);
}`,cs=`${ci}
uniform float u_line_width;
uniform usampler2D u_fid_style;    // fid スタイル表（visibility＝filter を pick にも効かせる）
uniform int        u_fidstyle_w;
uniform int        u_has_fidstyle;
out vec4  v_color;
out float v_zr;

void main() {
	int edge_id = u_vbase + gl_VertexID / 4;   // index の 4 頂点/辺（perf plan P3）＝drawElements の index は 0..4K・run の先頭は u_vbase。旧 6 頂点は quad6GLSL（?quad4=0）
	int sub     = gl_VertexID % 4;
	uvec4 meta  = fetchEdgeMeta(edge_id);

	// style 0 = polygon edge（JS レイキャストで識別）→ここでは捨てる。1 = polyline。
	if ((meta.b & 255u) == 0u) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	// filter で非表示の feature は pick からも外す（見えない線に当たらない）
	if (u_has_fidstyle == 1 &&
		(texelFetch(u_fid_style, ivec2(int(meta.a) % u_fidstyle_w, int(meta.a) / u_fidstyle_w), 0).b & 1u) == 0u)
		{ gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }

	// pick も描画と同じ kept 集合＝当たり判定が「見えている線」と一致（12px マージンが吸収する範囲の差だが、
	// settle 毎の VS 起動と walk を描画パスと同じだけ削る＝軽さの均質化）。
	uint lodA = meta.r, lodB = meta.g;
	if (!lodSnap(lodA, lodB, edge_id)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }

	bool  useA = sub < 2;   // 4 頂点＝0:A− 1:A+ 2:B+ 3:B−（index [0,1,2,0,2,3]＝旧 6 列 (A−)(A+)(B+)(A−)(B+)(B−) と同じ三角形・同じ向き）
	float side = (sub == 1 || sub == 2) ? 1.0 : -1.0;

	// 描画VSと同じ「辺の正準方向」でクアッドを張る（旧＝自端基準で perp が反転＝ボウタイ。同時修正 8/20）
	vec3 pa3 = fetchProject(lodA);
	vec3 pb3 = fetchProject(lodB);
	v_zr = useA ? pa3.z : pb3.z;
	vec2 axy = pa3.xy, bxy = pb3.xy;
	if (pb3.z < 0.0 && pa3.z > 0.0) bxy = pa3.xy + (pa3.z / (pa3.z - pb3.z)) * (pb3.xy - pa3.xy);
	if (pa3.z < 0.0 && pb3.z > 0.0) axy = pb3.xy + (pb3.z / (pb3.z - pa3.z)) * (pa3.xy - pb3.xy);

	vec2 dir = bxy - axy;
	float len = length(dir);
	if (len < 1e-4) { gl_Position = toNDC(axy); return; }
	vec2 tang = dir / len;
	vec2 perp = vec2(-tang.y, tang.x);
	gl_Position = toNDC((useA ? axy : bxy) + side * (u_line_width * 0.5) * perp
	                          + (useA ? -1.0 : 1.0) * tang * (u_line_width * 0.5));

	uint fid1 = meta.a + 1u;
	v_color = vec4(float(fid1 & 255u)/255.0, float((fid1>>8u)&255u)/255.0, float((fid1>>16u)&255u)/255.0, 1.0);
}`,ss=`#version 300 es
precision mediump float;
in  vec4  v_color;
in  float v_zr;
out vec4  fragColor;
void main() {
	if (v_zr < 0.0) discard;
	fragColor = v_color;
}`,_s=`${ol}
out float v_zr;
out vec2  v_uv;
out vec4  v_color;
void main() {
	int pt_id = u_vbase + gl_VertexID / 4;   // index の 4 頂点/点（P3）
	int sub   = gl_VertexID % 4;
	float ox = (sub == 2 || sub == 3) ? 1.0 : -1.0;   // 4 隅＝0:(−,−) 1:(−,+) 2:(+,+) 3:(+,−)（index [0,1,2,0,2,3]＝旧 6 列と同じ三角形）
	float oy = (sub == 1 || sub == 2) ? 1.0 : -1.0;
	vec3 p = fetchPoint(pt_id);
	v_zr = p.z;
	v_uv = vec2(ox, oy);
	ivec2 tc = ivec2(pt_id % u_pt_w, pt_id / u_pt_w);
	uint fid1 = texelFetch(u_pt_meta_tex, tc, 0).r + 1u;
	float r = u_pt_radius, dsw = 0.0;
	vec4  dummy = vec4(0.0), dsc = vec4(0.0);
	if (!fidPointStyle(int(fid1 - 1u), r, dummy, dsc, dsw)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }   // filter 非表示の点は pick からも外す（線と同じ）
	r = max(r + dsw, u_pt_radius);   // pick 半径＝max(表の半径＋縁, マージン)＝見た目より広く拾う
	gl_Position = vec4(2.0*(p.x + ox*r)/u_viewport.x - 1.0,
					   1.0 - 2.0*(p.y + oy*r)/u_viewport.y, 0.0, 1.0);
	v_color = vec4(float(fid1 & 255u)/255.0, float((fid1>>8u)&255u)/255.0, float((fid1>>16u)&255u)/255.0, 1.0);
}`,ds=`#version 300 es
precision mediump float;
in  float v_zr;
in  vec2  v_uv;
in  vec4  v_color;
out vec4  fragColor;
void main() {
	if (v_zr < 0.0)            discard;
	if (dot(v_uv, v_uv) > 1.0) discard;
	fragColor = v_color;
}`,vs=`${ol}
uniform int u_active_id;
out float v_zr;
out vec2  v_uv;
out vec4  v_color;
flat out vec4  v_stroke;   // 縁の色（α0＝縁なし）
flat out float v_inner;    // 塗りの半径／外径（縁の内側の境）
void main() {
	int pt_id = u_vbase + gl_VertexID / 4;   // index の 4 頂点/点（P3）
	int sub   = gl_VertexID % 4;
	float ox = (sub == 2 || sub == 3) ? 1.0 : -1.0;   // 4 隅＝0:(−,−) 1:(−,+) 2:(+,+) 3:(+,−)（index [0,1,2,0,2,3]＝旧 6 列と同じ三角形）
	float oy = (sub == 1 || sub == 2) ? 1.0 : -1.0;
	vec3 p = fetchPoint(pt_id);
	v_zr = p.z;
	v_uv = vec2(ox, oy);
	ivec2 tc = ivec2(pt_id % u_pt_w, pt_id / u_pt_w);
	int feat_id = int(texelFetch(u_pt_meta_tex, tc, 0).r);
	float r = u_pt_radius, sw = 0.0;
	vec4  col = vec4(1.0, 0.420, 0.208, 1.0), scol = vec4(0.0);
	if (!fidPointStyle(feat_id, r, col, scol, sw)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }   // per-fid：非表示/半径0＝棄却
	bool isActive = (feat_id == u_active_id);
	if (isActive) r *= 1.6;
	float R = r + sw;   // 外径＝半径＋縁（縁は外側）
	gl_Position = vec4(2.0*(p.x + ox*R)/u_viewport.x - 1.0,
					   1.0 - 2.0*(p.y + oy*R)/u_viewport.y, 0.0, 1.0);
	v_color = isActive ? vec4(1.0, 0.9, 0.0, 1.0) : col;
	v_stroke = scol;
	v_inner = R > 0.0 ? r / R : 1.0;
}`,ms=`#version 300 es
precision mediump float;
in  float v_zr;
in  vec2  v_uv;
in  vec4  v_color;
flat in vec4  v_stroke;
flat in float v_inner;
out vec4  fragColor;
void main() {
	if (v_zr < 0.0)            discard;
	float d = dot(v_uv, v_uv);
	if (d > 1.0) discard;
	vec4 c = (v_stroke.a > 0.0 && d > v_inner * v_inner) ? v_stroke : v_color;   // 縁の輪か塗りか
	if (c.a == 0.0) discard;   // 中空の円の内側
	fragColor = c;
}`,xs=`#version 300 es
precision mediump float;
out vec4 fragColor;
void main() { fragColor = vec4(0.0); }`,rl=`#version 300 es
void main() {
	vec2[4] p = vec2[4](vec2(-1,-1), vec2(1,-1), vec2(-1,1), vec2(1,1));
	gl_Position = vec4(p[gl_VertexID], 0.0, 1.0);
}`,Es=`#version 300 es
precision mediump float;
uniform vec4 u_fill_color;
out vec4 fragColor;
void main() { fragColor = u_fill_color; }`,jr=["u_arc_tex","u_meta_tex","u_arc_w","u_meta_w","u_mvp","u_eye","u_origin","u_origin_trig","u_clipT","u_origin_zr","u_viewport","u_ix_center","u_iy_center","u_lod_rank","u_ell_trig","u_ell","u_atlas","u_atlasOn","u_vbase"],ti=["u_logCoef","u_fogFar","u_origin_pt","u_elevTex","u_elevBounds","u_elevScale","u_hasElev","u_elevEdgeFade","u_meshQ","u_meshG","u_hidden","u_near","u_sub","u_subSkipE7"],Da=["u_pt_tex","u_pt_meta_tex","u_pt_w","u_mvp","u_eye","u_origin","u_origin_trig","u_clipT","u_origin_zr","u_viewport","u_pt_radius","u_ix_center","u_iy_center","u_ell_trig","u_ell","u_fid_style","u_fidstyle_w","u_has_fidstyle","u_dpr","u_vbase",...ti];function ps(t){const n=[[/u_vbase \+ gl_VertexID \/ 4;/g,"gl_VertexID / 6;"],[/gl_VertexID % 4;/g,"gl_VertexID % 6;"],[/bool  useA = sub < 2;/g,"bool  useA = (sub == 0 || sub == 1 || sub == 3);"],[/float side = \(sub == 1 \|\| sub == 2\) \? 1\.0 : -1\.0;/g,"float side = (sub == 1 || sub == 2 || sub == 4) ? 1.0 : -1.0;"],[/float ox = \(sub == 2 \|\| sub == 3\) \? 1\.0 : -1\.0;/g,"float ox = (sub == 2 || sub == 4 || sub == 5) ? 1.0 : -1.0;"],[/float oy = \(sub == 1 \|\| sub == 2\) \? 1\.0 : -1\.0;/g,"float oy = (sub == 1 || sub == 2 || sub == 4) ? 1.0 : -1.0;"]];let e=t,a=0;for(const[s,v]of n){const p=e;e=e.replace(s,v),e!==p&&a++}if(a===0||/gl_VertexID [/%] 4;/.test(e))throw new Error("quad6GLSL: rewrite incomplete (4-vertex markers missing or left over) = the source shader format changed");return e}const qi=1<<17;function bs(t,{quad4:n=!0}={}){const e=n?de=>de:ps,a=Wt(t,e(us),fs),s=Wt(t,ls,xs),v=Wt(t,rl,Es),p=Wt(t,e(vs),ms),U=Wt(t,e(cs),ss),B=Wt(t,e(_s),ds),S=Ht(t,a,[...jr,"u_line_width","u_dpr","u_active_id","u_pass","u_style_table","u_dash_table","u_hilite_color","u_hilite_width",...ti,"u_pivot_tex","u_pivot_w","u_has_pivot","u_view_bbox","u_use_vbb","u_fid_style","u_fidstyle_w","u_has_fidstyle","u_width_add","u_fid_wscale"]),h=Ht(t,s,[...jr,...ti,"u_pivot_tex","u_pivot_w","u_has_pivot","u_view_bbox","u_use_vbb","u_far_axes","u_far_q","u_far_big","u_comp_tex","u_comp_w","u_has_comp"]),R=Ht(t,v,["u_fill_color"]),k=Ht(t,p,[...Da,"u_active_id"]),y=Ht(t,U,[...jr,"u_line_width","u_fid_style","u_fidstyle_w","u_has_fidstyle"]),O=Ht(t,B,Da),se=t.createVertexArray();let ae=null,le=null;if(n){const de=new Uint32Array(qi*6);for(let oe=0,ee=0;oe<qi;oe++,ee+=6){const fe=oe*4;de[ee]=fe,de[ee+1]=fe+1,de[ee+2]=fe+2,de[ee+3]=fe,de[ee+4]=fe+2,de[ee+5]=fe+3}ae=t.createVertexArray(),le=t.createBuffer(),t.bindVertexArray(ae),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,le),t.bufferData(t.ELEMENT_ARRAY_BUFFER,de,t.STATIC_DRAW),t.bindVertexArray(null)}return t.enable(t.BLEND),t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA),{renderProgram:a,stencilProgram:s,fillProgram:v,pointProgram:p,pickLineProgram:U,pickPointProgram:B,uRender:S,uStencil:h,uFill:R,uPoint:k,uPickLine:y,uPickPoint:O,emptyVAO:se,quad4:n,quadVAO:ae,quadIdx:le,QK:qi}}function Ca(t,n,e){const a=t.createShader(n);if(t.shaderSource(a,e),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS))throw new Error(t.getShaderInfoLog(a));return a}function Wt(t,n,e){const a=t.createProgram();if(t.attachShader(a,Ca(t,t.VERTEX_SHADER,n)),t.attachShader(a,Ca(t,t.FRAGMENT_SHADER,e)),t.linkProgram(a),!t.getProgramParameter(a,t.LINK_STATUS))throw new Error(t.getProgramInfoLog(a));return a}function Ht(t,n,e){const a={};for(const s of e)a[s]=t.getUniformLocation(n,s);return a}function Ts(t,n){if(n){n.emptyVAO&&t.deleteVertexArray(n.emptyVAO),n.quadVAO&&t.deleteVertexArray(n.quadVAO),n.quadIdx&&t.deleteBuffer(n.quadIdx);for(const e of[n.renderProgram,n.stencilProgram,n.fillProgram,n.pointProgram,n.pickLineProgram,n.pickPointProgram])e&&t.deleteProgram(e)}}const c={canvas:null,gl:null,dpr:1,width:0,height:0,programs:null,TEX_ARC_W:4096,TEX_META_W:4096,arcTex:null,metaTex:null,ptTex:null,ptMetaTex:null,metaTexB:null,totalEdgesB:0,polyEdgesB:0,fidStyleTex:null,fidStyleW:0,fidStyleCount:0,pivotTex:null,pivotW:0,compTex:null,compW:0,lodTiers:[],metaChunks:null,totalEdges:0,totalPoints:0,polyEdges:0,fillOff:!1,lowFill:!1,tiersDone:!1,pickFBO:null,pickColorTex:null,pickDepthStencilRBO:null,lastDrawData:null,polyEdgeByFid:null,polyBboxByFid:null,minZoom:null,maxZoom:null,requestDraw:null,activeId:-1,gintData:null,lastViewBbox:null,cam:null,lastMX:NaN,lastMY:NaN,hitMX:NaN,hitMY:NaN,_isDrawing:!1,_moveTimer:null,_pendingMove:null,_inRange:!1};function oi(t,n,e,a){const s=Math.max(a,e.length>>2),v=Math.ceil(s/t.TEX_META_W),p=new Uint32Array(t.TEX_META_W*v*4);return p.set(e),fo(n,p,t.TEX_META_W,v,n.RGBA32UI,n.RGBA_INTEGER)}function il(t,n){const{gl:e,gintData:a}=t,{arcBuffer:s,pointBuffer:v}=a;if(t.arcTex&&e.deleteTexture(t.arcTex),t.arcTex=null,s?.length){const p=new Uint32Array(s.buffer,s.byteOffset,s.byteLength/4),U=Math.ceil(p.length/2/t.TEX_ARC_W),B=new Uint32Array(t.TEX_ARC_W*U*2);B.set(p),t.arcTex=fo(e,B,t.TEX_ARC_W,U,e.RG32UI,e.RG_INTEGER)}if(t.metaTex&&e.deleteTexture(t.metaTex),t.metaTex=null,t.totalEdges=n.base.edgeCount,t.polyEdges=n.base.polyEdgeCount,t.polyEdgeByFid=n.base.polyEdgeByFid,t.metaChunks=n.base.chunks,t.span=[n.base.spanX??-1,n.base.spanY??-1],t.polyBboxByFid=n.polyBboxByFid,t.outlineZoom=n.outlineZoom,t.fillOff=n.fillOff,t.lowFill=!!n.lowFill,console.debug("[gint] edges=%d chunks=%d ck0=%s",t.totalEdges,t.metaChunks?.length??0,JSON.stringify(t.metaChunks?.[0]?.bbox??null)),t.totalEdges>0&&(t.metaTex=oi(t,e,n.base.metaU32,t.totalEdges)),t.pivotTex&&(e.deleteTexture(t.pivotTex),t.pivotTex=null),t.pivotW=0,n.pivot&&n.pivot.w<=t.TEX_ARC_W&&(t.pivotTex=fo(e,n.pivot.px,n.pivot.w,n.pivot.h,e.RGBA32UI,e.RGBA_INTEGER),t.pivotW=n.pivot.w),t.compTex&&(e.deleteTexture(t.compTex),t.compTex=null),t.compW=0,t.pivotTex&&n.comp&&n.comp.w<=t.TEX_ARC_W&&(t.compTex=fo(e,n.comp.keys,n.comp.w,n.comp.h,e.R32UI,e.RED_INTEGER),t.compW=n.comp.w),t.metaTexB&&e.deleteTexture(t.metaTexB),t.metaTexB=null,t.totalEdgesB=0,t.polyEdgesB=0,t.spanB=[-1,-1],t.subB=null,n.boundary&&(t.totalEdgesB=n.boundary.edgeCount,t.polyEdgesB=n.boundary.polyEdgeCount,t.spanB=[n.boundary.spanX??-1,n.boundary.spanY??-1],t.subB=n.boundary.sub??null,t.metaTexB=oi(t,e,n.boundary.metaU32,n.boundary.edgeCount),console.debug("[gint] boundary edges=%d (%.1f%%)",t.totalEdgesB,t.totalEdges?100*t.totalEdgesB/t.totalEdges:0)),t.ptTex&&(e.deleteTexture(t.ptTex),t.ptTex=null),t.ptMetaTex&&(e.deleteTexture(t.ptMetaTex),t.ptMetaTex=null),v?.length){const p=new Uint32Array(v.buffer,v.byteOffset,v.byteLength/4);t.totalPoints=p.length/2;const U=Math.ceil(t.totalPoints/t.TEX_ARC_W),B=new Uint32Array(t.TEX_ARC_W*U*2);B.set(p),t.ptTex=fo(e,B,t.TEX_ARC_W,U,e.RG32UI,e.RG_INTEGER);const S=new Uint32Array(t.TEX_ARC_W*U);S.set(a.point.subarray(0,t.totalPoints)),t.ptMetaTex=fo(e,S,t.TEX_ARC_W,U,e.R32UI,e.RED_INTEGER)}else t.totalPoints=0;t.lodTiers?.length&&t.lodTiers.forEach(p=>e.deleteTexture(p.tex)),t.lodTiers=[],t.tiersDone=!1}function Ba(t){const{gl:n,gintData:e}=t;if(!n||!e)return;const a=Kf(e);il(t,a),nl(t,{weightHist:a.weightHist})}function Ua(t,n){const{gl:e,gintData:a}=t;!e||!a||il(t,n)}function Ma(t,n,e=null){const{gl:a}=t;if(!a||!n?.edgeCount)return;const s=oi(t,a,n.metaU32,n.edgeCount),v=e?e.lodTiers:t.lodTiers;v.push({minW:n.minW,edgeCount:n.edgeCount,chunks:n.chunks,tex:s}),v.sort((p,U)=>p.minW-U.minW)}function Ia(t,n=null){if(n){n.tiersDone=!0;return}t.tiersDone=!0;const e=t.lodTiers??[];e.length&&console.debug("[gint] LOD tiers(baked): %s",e.map(a=>`w${a.minW}=${a.edgeCount}辺(ck${a.chunks?.length??0})`).join(" / ")),postMessage({action:"tiers",layer:t.layerId??null,tiers:e.map(a=>({minW:a.minW,edgeCount:a.edgeCount}))}),t.requestDraw?.()}function nl(t,{weightHist:n=null}={}){const{gl:e,gintData:a}=t,s=a?.arcBuffer,v=t.tierGen=(t.tierGen??0)+1;if(!s?.length||t.totalEdges<=2e5){t.tiersDone=!0;return}let p=null;const U=()=>{const S=new Set((t.lodTiers??[]).map(O=>O.minW)),h=Yf(a,t.totalEdges,n,S),R=t.lastDrawData?.lodRank??0,k=h.filter(O=>O<=R),y=k.length?Math.max(...k):null;return[...y!=null?[y]:[],...h.filter(O=>O!==y).reverse()]};t.tiersDone=!1;const B=()=>{if(v!==t.tierGen||!t.gl||t.gintData?.arcBuffer!==s)return;if(t._isDrawing){setTimeout(B,120);return}p??=U();const S=p.shift();if(S==null){t.tiersDone=!0,t.lodTiers.length&&console.debug("[gint] LOD tiers: %s tcks=%s",t.lodTiers.map(R=>`w${R.minW}=${R.edgeCount}辺(ck${R.chunks?.length??0})`).join(" / "),JSON.stringify(t.lodTiers[0]?.chunks?.map(R=>R.bbox)??null)),postMessage({action:"tiers",layer:t.layerId??null,tiers:t.lodTiers.map(R=>({minW:R.minW,edgeCount:R.edgeCount}))}),t.requestDraw?.();return}const h=qf(a,S,t.polyBboxByFid);h.edgeCount&&(t.lodTiers.push({minW:h.minW,edgeCount:h.edgeCount,chunks:h.chunks,tex:oi(t,e,h.metaU32,h.edgeCount)}),t.lodTiers.sort((R,k)=>R.minW-k.minW)),setTimeout(B,0)};setTimeout(B,0)}function Vt(t){const{gl:n}=t;n&&(t.arcTex&&n.deleteTexture(t.arcTex),t.metaTex&&n.deleteTexture(t.metaTex),t.metaTexB&&n.deleteTexture(t.metaTexB),t.ptTex&&n.deleteTexture(t.ptTex),t.ptMetaTex&&n.deleteTexture(t.ptMetaTex),t.pivotTex&&n.deleteTexture(t.pivotTex),t.compTex&&n.deleteTexture(t.compTex),t.lodTiers?.length&&t.lodTiers.forEach(e=>n.deleteTexture(e.tex)),t.lodTiers=[],t.metaChunks=null,t.arcTex=t.metaTex=t.metaTexB=t.ptTex=t.ptMetaTex=t.pivotTex=t.compTex=null,t.totalEdgesB=t.polyEdgesB=0,t.pivotW=0,t.compW=0)}function hs(t,n,e){const a=t.createTexture();t.bindTexture(t.TEXTURE_2D,a),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,n,e,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST);const s=t.createRenderbuffer();t.bindRenderbuffer(t.RENDERBUFFER,s),t.renderbufferStorage(t.RENDERBUFFER,t.DEPTH24_STENCIL8,n,e);const v=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,v),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,a,0),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.RENDERBUFFER,s),{fbo:v,colorTex:a,dsRBO:s}}function gs(){const{gl:t}=c,n=c.width,e=c.height;al();const a=hs(t,n,e);c.pickFBO=a.fbo,c.pickColorTex=a.colorTex,c.pickDepthStencilRBO=a.dsRBO,t.bindFramebuffer(t.FRAMEBUFFER,null),c.lastDrawData=null}function al(){const{gl:t}=c;t&&(c.pickFBO&&t.deleteFramebuffer(c.pickFBO),c.pickColorTex&&t.deleteTexture(c.pickColorTex),c.pickDepthStencilRBO&&t.deleteRenderbuffer(c.pickDepthStencilRBO),c._pickPBO&&(t.deleteBuffer(c._pickPBO),c._pickPBO=null),c.pickFBO=c.pickColorTex=c.pickDepthStencilRBO=null)}const ys=`${ci}
uniform usampler2D u_fid_style;   // fid スタイル表（unit5・RGBA32UI）。蓄積で不可視fidを弾くために参照
uniform int        u_fidstyle_w;
uniform int        u_has_fidstyle;
flat out float v_fid1;
void main() {
	int edge_id = gl_VertexID / 3;
	int sub     = gl_VertexID % 3;
	uvec4 meta = fetchEdgeMeta(edge_id);
	v_fid1 = float(meta.a + 1u);
	uint key = fanKey(edge_id, meta.a);   // 扇の鍵＝fid か構成ポリゴン（多片地物の層）＝要とカリングはポリゴン単位・ID は fid のまま
	if (!bboxVisible(key)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	// 不可視fid（filter で落とした feature）を winding 蓄積から除外＝重複被覆時に R/G が非整数化して
	// 解決が discard＝下の feature まで塗りが消える事故を防ぐ（振興局が市区町村に重なる北海道で実証・WebGPU vsId と対）。
	if (u_has_fidstyle == 1 &&
		(texelFetch(u_fid_style, ivec2(int(meta.a) % u_fidstyle_w, int(meta.a) / u_fidstyle_w), 0).b & 1u) == 0u) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	uint lodA = meta.r, lodB = meta.g;
	if (!lodSnap(lodA, lodB, edge_id)) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
	if (u_atlasOn > 0.5) {   // 窓座標モード＝環を鍵の中心の周りで連続に・写し（インスタンス 1）は ±360°（VS_STENCIL と対）
		ivec2 cs = keyLonSpan(key); float shift = gl_InstanceID == 0 ? 0.0 : atlasCopyShift(cs);
		if (gl_InstanceID != 0 && shift == 0.0) { gl_Position = vec4(2.0, 0.0, 0.0, 1.0); return; }
		gl_Position = sub == 0 ? pivotClip(key) : atlasFanVertex(sub == 1 ? lodA : lodB, cs, shift);
		return;
	}
	if (sub == 0) { gl_Position = pivotClip(key); return; }
	gl_Position = fetchClipDrape(sub == 1 ? lodA : lodB);   // 塗り扇の辺端点を地形へドレープ（真俯瞰=無変化・WebGPU vsId と対）
}`,Rs=`#version 300 es
precision highp float;
flat in float v_fid1;
out vec4 fragColor;
void main() {
	float sgn = gl_FrontFacing ? 1.0 : -1.0;
	fragColor = vec4(sgn * v_fid1, sgn, 0.0, v_fid1);   // A は向きに依らず（CW 環＝内側が後向き扇・G の符号で吸収している流儀と同じ）
}`,As=`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
uniform sampler2D  u_id_tex;
uniform usampler2D u_fid_style;
uniform int u_fid_w;
uniform int u_fid_count;
uniform int u_overlap;   // 1＝重複可視化モード（データ品質監査）：通常塗りせず異常画素だけ色分け
out vec4 fragColor;
void main() {
	vec4 t = texelFetch(u_id_tex, ivec2(gl_FragCoord.xy), 0);
	if (u_overlap == 1) {
		// 監査プローブ（STENCIL_DEBUG と同思想）：winding 和の異常だけを色分けして残す。
		float ar = abs(t.r), ag = abs(t.g);
		if (ag < 0.5) {
			if (ar > 0.5) { fragColor = vec4(0.0, 0.9, 1.0, 0.85); return; }   // シアン＝向き矛盾の重なり（巻き数正味0なのに fid 和が残る）
			discard;                                                            // 被覆なし＝正常
		}
		float qo = t.r / t.g;
		if (abs(qo - round(qo)) > 0.25) { fragColor = vec4(1.0, 0.0, 0.8, 0.85); return; }   // マゼンタ＝別筆同士の重なり（fid 不定）
		if (ag > 1.5)                   { fragColor = vec4(1.0, 0.55, 0.0, 0.85); return; }   // 橙＝同一筆の多重登記（k重・fid は約分で整数）
		discard;                                                                              // 単被覆＝正常
	}
	float g = t.g, r = t.r;
	if (g < 0.0) { g = -g; r = -r; }    // 外環 CW（向き未正規化）＝符号ごと反転して正に揃える
	if (g < 0.5) discard;               // 被覆なし（穴・外）
	float q = r / g;                    // 多重登記は約分で消える（R=k(fid+1), G=k → q=fid+1）
	// 重複（|G|≥2＝2 者以上 or 多重登記／R/G 非整数＝別 feature の重なり）＝A（扇が触れた最大 fid+1）で後勝ち。A 無しは従来の q
	bool multi = g > 1.5 || abs(q - round(q)) > 0.25;
	int fid;
	if (multi && t.a >= 0.5) fid = int(round(t.a)) - 1;
	else if (!multi) fid = int(round(q)) - 1;
	else discard;
	// 上側の feature に塗りが無い（非表示・濃さ 0）なら 1 枚剥がして下を出す＝2 重なりまで厳密（R−(fid+1) が残りの fid+1）。
	// 剥がさないと「上に透明な図形を置いた所だけ下の塗りが抜けて穴」（本人スクショ 2026-09-15）。3 重以上は残りの比が非整数＝塗らない
	vec4 col = vec4(0.0);
	for (int peel = 0; peel < 3; peel++) {
		if (fid < 0 || fid >= u_fid_count) discard;
		uvec4 rec = texelFetch(u_fid_style, ivec2(fid % u_fid_w, fid / u_fid_w), 0);
		uint c = rec.r;                 // R = fill 色 RGBA8
		col = vec4(float(c >> 24u), float((c >> 16u) & 255u), float((c >> 8u) & 255u), float(c & 255u)) / 255.0;
		if ((rec.b & 1u) != 0u && col.a > 0.0) break;   // flags bit0 = visible（filter の実体）＋塗りあり＝採用
		if (!multi || g < 1.5) discard;
		r -= float(fid + 1); g -= 1.0;
		q = r / g;
		if (g < 0.5 || abs(q - round(q)) > 0.25) discard;
		fid = int(round(q)) - 1;
		multi = g > 1.5;
	}
	fragColor = col;
}`;function ll(t){if(c._idCaps!==void 0)return c._idCaps;const n=t.getExtension("EXT_color_buffer_float"),e=t.getExtension("EXT_float_blend");let a=null;return n&&e?a={internal:t.RGBA32F,fmt:t.RGBA,type:t.FLOAT,maxFid:1<<24,name:"RGBA32F"}:n?a={internal:t.RGBA16F,fmt:t.RGBA,type:t.HALF_FLOAT,maxFid:2047,name:"RGBA16F"}:t.getExtension("EXT_color_buffer_half_float")&&(a={internal:t.RGBA16F,fmt:t.RGBA,type:t.HALF_FLOAT,maxFid:2047,name:"RGBA16F"}),c._idCaps=a,console.info("[gint] idFill caps: %s (float_blend=%s)",a?.name??"none (falling back to stencil flat color)",!!e),a}function Na(t,n,e){const a=t.gl,s=n instanceof Uint32Array?n:new Uint32Array(n);if(!a||!e||s.length<e*4){Kt(t);return}t._fidStyleData={u32:s,count:e};const v=Math.min(4096,t.TEX_ARC_W),p=Math.ceil(e/v);if(t.fidStyleTex&&t.fidStyleW===v&&t._fidStyleH===p){const U=new Uint32Array(v*p*4);U.set(s.subarray(0,e*4)),a.bindTexture(a.TEXTURE_2D,t.fidStyleTex),a.texSubImage2D(a.TEXTURE_2D,0,0,0,v,p,a.RGBA_INTEGER,a.UNSIGNED_INT,U)}else{t.fidStyleTex&&a.deleteTexture(t.fidStyleTex);const U=new Uint32Array(v*p*4);U.set(s.subarray(0,e*4)),t.fidStyleTex=fo(a,U,v,p,a.RGBA32UI,a.RGBA_INTEGER),t.fidStyleW=v,t._fidStyleH=p}t.fidStyleCount=e}function Kt(t){t.fidStyleTex&&t.gl&&t.gl.deleteTexture(t.fidStyleTex),t.fidStyleTex=null,t.fidStyleW=0,t._fidStyleH=0,t.fidStyleCount=0,t._fidStyleData=null}function Fs(t){const n=t.gl;if(!n||!t.fidStyleTex||t.polyEdges<=0||t.fillOff)return!1;const e=ll(n);return!!e&&t.fidStyleCount<=e.maxFid}function Ls(t){if(c._idPrograms)return c._idPrograms;const n=Wt(t,ys,Rs),e=Wt(t,rl,As);return c._idPrograms={idProgram:n,resolveProgram:e,uId:Ht(t,n,[...jr,...ti,"u_pivot_tex","u_pivot_w","u_has_pivot","u_view_bbox","u_use_vbb","u_far_axes","u_far_q","u_far_big","u_comp_tex","u_comp_w","u_has_comp","u_fid_style","u_fidstyle_w","u_has_fidstyle"]),uResolve:Ht(t,e,["u_id_tex","u_fid_style","u_fid_w","u_fid_count","u_overlap"])},c._idPrograms}function ws(t,n,e=c.width,a=c.height){if(c._idFBO&&c._idW===e&&c._idH===a)return!0;c._idFBO&&(t.deleteFramebuffer(c._idFBO),t.deleteTexture(c._idTex));const s=t.createTexture();t.bindTexture(t.TEXTURE_2D,s),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texImage2D(t.TEXTURE_2D,0,n.internal,e,a,0,n.fmt,n.type,null);const v=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,v),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,s,0);const p=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE;return t.bindFramebuffer(t.FRAMEBUFFER,null),p?(c._idFBO=v,c._idTex=s,c._idW=e,c._idH=a,!0):(t.deleteFramebuffer(v),t.deleteTexture(s),c._idCaps=null,console.warn("[gint] idFill FBO incomplete -> degraded to stencil flat color"),!1)}function Ps(t,n,e){const a=t.gl,s=ll(a),v=n.atlas?n.atlas.size:t.width,p=n.atlas?n.atlas.size:t.height;if(!s||!Ls(a)||!ws(a,s,v,p))return a.bindFramebuffer(a.FRAMEBUFFER,e??null),!1;const{idProgram:U,resolveProgram:B,uId:S,uResolve:h}=c._idPrograms,{arcTex:R,metaTex:k,TEX_ARC_W:y,TEX_META_W:O}=t;a.bindFramebuffer(a.FRAMEBUFFER,c._idFBO),a.disable(a.STENCIL_TEST),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.blendFuncSeparate(a.ONE,a.ONE,a.ONE,a.ONE),a.blendEquationSeparate(a.FUNC_ADD,a.MAX),a.useProgram(U),yo(a,S,n,R,k,y,O,v,p),er(a,S,n),Jr(t,a,S,n),a.uniform1i(S.u_has_fidstyle,t.fidStyleTex?1:0),t.fidStyleTex&&(a.uniform1i(S.u_fid_style,5),a.uniform1i(S.u_fidstyle_w,t.fidStyleW||1),a.activeTexture(a.TEXTURE5),a.bindTexture(a.TEXTURE_2D,t.fidStyleTex),a.activeTexture(a.TEXTURE0)),a.uniform1f(S.u_lod_rank,0),n.atlas?a.drawArraysInstanced(a.TRIANGLES,0,t.polyEdges*3,2):a.drawArrays(a.TRIANGLES,0,t.polyEdges*3),a.bindFramebuffer(a.FRAMEBUFFER,e),a.blendEquation(a.FUNC_ADD),a.blendFuncSeparate(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);const se=!e&&!!(n.depth&&(n.depth.elevScale??0)>0&&n.depth.hasElev);return se&&(a.enable(a.STENCIL_TEST),a.stencilMask(0),a.stencilFunc(a.EQUAL,0,128),a.stencilOp(a.KEEP,a.KEEP,a.KEEP)),a.useProgram(B),a.activeTexture(a.TEXTURE3),a.bindTexture(a.TEXTURE_2D,c._idTex),a.activeTexture(a.TEXTURE4),a.bindTexture(a.TEXTURE_2D,t.fidStyleTex),a.activeTexture(a.TEXTURE0),a.uniform1i(h.u_id_tex,3),a.uniform1i(h.u_fid_style,4),a.uniform1i(h.u_fid_w,t.fidStyleW),a.uniform1i(h.u_fid_count,t.fidStyleCount),a.uniform1i(h.u_overlap,t.idOverlapMode?1:0),a.drawArrays(a.TRIANGLE_STRIP,0,4),se&&a.disable(a.STENCIL_TEST),!0}function Ss(t){const n=t.gl;n&&(c._idFBO&&n.deleteFramebuffer(c._idFBO),c._idTex&&n.deleteTexture(c._idTex),c._idPrograms&&(n.deleteProgram(c._idPrograms.idProgram),n.deleteProgram(c._idPrograms.resolveProgram))),Kt(t),c._idFBO=null,c._idTex=null,c._idW=c._idH=0,c._idPrograms=null,c._idCaps=void 0}const Ds=13;function ul(t,n,e,a){let s=null,v=null;for(const U of t.lodTiers??[])U.minW<=n&&(!s||U.edgeCount<s.edgeCount)&&(s=U),(!v||U.minW<v.minW)&&(v=U);const p=s?{tex:s.tex,count:s.edgeCount,runs:Yi(t,s.edgeCount,s.chunks),minW:s.minW}:{tex:e,count:a,runs:Yi(t,a,t.metaChunks,t.span),minW:0};if(t._pfRuns=p.runs.length,t._pfChunks=(s?s.chunks:t.metaChunks)?.length??0,!s&&v){let U=0;for(const B of p.runs)U+=B[1];if(U>v.edgeCount*1.5)return{tex:v.tex,count:v.edgeCount,runs:Yi(t,v.edgeCount,v.chunks),minW:v.minW}}return!s&&!v&&$f(p),p}const Yi=(t,n,e,a=null)=>ec(t.lastViewBbox,n,e,a);function Oa(t,n,e=null,a=null){if(t.uniform1i(n.u_has_pivot,0),t.uniform1i(n.u_use_vbb,0),t.uniform1i(n.u_has_comp,0),!n.u_far_q)return;const s=e&&a?Zf(a,e.lastViewBbox,Qf(e.polyBboxByFid)):null;t.uniform4f(n.u_far_q,0,0,s?2:0,0),s&&t.uniform4f(n.u_far_axes,s[0],s[1],0,0)}function si(t,n,e,a=0){n.uniform1i(e.u_has_fidstyle,t.fidStyleTex?1:0),e.u_width_add&&n.uniform1f(e.u_width_add,a),e.u_fid_wscale&&n.uniform1f(e.u_fid_wscale,t.dpr??1),t.fidStyleTex&&(n.uniform1i(e.u_fid_style,5),n.uniform1i(e.u_fidstyle_w,t.fidStyleW||1),n.activeTexture(n.TEXTURE5),n.bindTexture(n.TEXTURE_2D,t.fidStyleTex),n.activeTexture(n.TEXTURE0))}function _n(t,n,e){const{gl:a,ptTex:s,ptMetaTex:v,TEX_ARC_W:p,width:U,height:B}=t;a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,s),a.activeTexture(a.TEXTURE1),a.bindTexture(a.TEXTURE_2D,v),a.uniform1i(n.u_pt_tex,0),a.uniform1i(n.u_pt_meta_tex,1),a.uniform1i(n.u_pt_w,p),a.uniformMatrix4fv(n.u_mvp,!1,e.mvp),a.uniform3f(n.u_eye,e.eye[0],e.eye[1],e.eye[2]);const S=(e.origin[0]%360+540)%360-180;a.uniform2f(n.u_origin,S,e.origin[1]),a.uniform2f(n.u_viewport,U,B),a.uniform1f(n.u_pt_radius,e.ptRadius??1.5),a.uniform1f(n.u_dpr,t.dpr??1),si(t,a,n),a.uniform1ui(n.u_ix_center,Math.round((S+180)*1e7)>>>0),a.uniform1ui(n.u_iy_center,Math.round((e.origin[1]+90)*1e7)>>>0);const h=S*Math.PI/180,R=nn(e.origin[1])*Math.PI/180;a.uniform4f(n.u_origin_trig,Math.cos(h),Math.sin(h),Math.cos(R),Math.sin(R));const k=e.origin[1]*Math.PI/180,y=uo();n.u_ell_trig&&a.uniform4f(n.u_ell_trig,...y?[Math.cos(2*k),Math.sin(2*k),Math.cos(4*k),Math.sin(4*k)]:[0,0,0,0]),n.u_ell&&a.uniform1f(n.u_ell,y?1:0),e.clipT&&a.uniform4f(n.u_clipT,e.clipT[0],e.clipT[1],e.clipT[2],e.clipT[3]),a.uniform1f(n.u_origin_zr,e.originZr??0),er(a,n,e)}function ji(t,n,e=null){const{gl:a,programs:s,arcTex:v,metaTex:p,ptTex:U,ptMetaTex:B,totalEdges:S,totalPoints:h,TEX_ARC_W:R,TEX_META_W:k}=t,y=n.atlas?n.atlas.size:t.width,O=n.atlas?n.atlas.size:t.height,{renderProgram:se,stencilProgram:ae,fillProgram:le,pointProgram:de,uRender:oe,uStencil:ee,uFill:fe,uPoint:We,emptyVAO:nt}=s;a.bindFramebuffer(a.FRAMEBUFFER,e),!e||n.atlas?(a.stencilMask(127),a.clear(a.STENCIL_BUFFER_BIT)):(a.clearColor(0,0,0,0),a.stencilMask(255),a.clear(a.COLOR_BUFFER_BIT|a.STENCIL_BUFFER_BIT)),a.bindVertexArray(s.quadVAO||nt);const j=n.styleTable??$i,be=n.zoom??99,He=n.outlineZoom??t.outlineZoom??Ds,Ye=be<He,Ke=t._isDrawing||(t._staticN??99)<4,ot=Ye||Ke&&be<He+1.5||!!n._forceLow;!t._isDrawing&&Ke&&!Ye&&ot&&t.requestDraw?.();const Xe=(t.polyBboxByFid?.size??0)>0&&(!t.fillOff||t.lowFill),dt=n._forceLow?j[3]*.8:j[3]*.8*Math.max(0,Math.min(1,(He+1.2-be)/1.2)),Fe=n.fillColor??(Xe&&(ot||dt>.004)?[j[0],j[1],j[2],dt]:Df),A=!n.noFaces&&!n._forceLow&&Fs(t)&&Ps(t,n,e),J=!!(t.metaTexB&&t.polyEdgesB>0)&&!n.atlas,_e=J?t.metaTexB:p,ue=J?t.polyEdgesB:t.polyEdges;if(!n.noFaces&&!A&&Fe[3]>0&&ue>0&&!(n._forceLow&&ue>(n.moveBudget??25e4)*8)){const m=!e&&!!(n.depth&&(n.depth.elevScale??0)>0&&n.depth.hasElev);a.enable(a.STENCIL_TEST),a.stencilMask(127),a.clear(a.STENCIL_BUFFER_BIT),a.colorMask(!1,!1,!1,!1),a.stencilFunc(a.ALWAYS,0,127),a.stencilOpSeparate(a.FRONT,a.KEEP,a.KEEP,a.INCR_WRAP),a.stencilOpSeparate(a.BACK,a.KEEP,a.KEEP,a.DECR_WRAP),a.useProgram(ae),yo(a,ee,n,v,_e,R,k,y,O),er(a,ee,n),J?Oa(a,ee,t,n):Jr(t,a,ee,n),a.uniform1f(ee.u_lod_rank,0),n.atlas?a.drawArraysInstanced(a.TRIANGLES,0,ue*3,2):a.drawArrays(a.TRIANGLES,0,ue*3),a.useProgram(le),m&&(a.stencilFunc(a.EQUAL,128,128),a.stencilOp(a.KEEP,a.KEEP,a.REPLACE),a.drawArrays(a.TRIANGLE_STRIP,0,4)),a.colorMask(!0,!0,!0,!0),a.stencilMask(0),a.stencilFunc(a.NOTEQUAL,0,127),a.stencilOp(a.KEEP,a.KEEP,a.KEEP),a.uniform4fv(fe.u_fill_color,Fe),a.drawArrays(a.TRIANGLE_STRIP,0,4),a.disable(a.STENCIL_TEST)}if(n.facesOnly)return;const _=!(n._forceLow&&!(t.metaTexB&&t.totalEdgesB>0&&t.totalEdgesB<=(n.moveBudget??25e4)));if(_||(t._pfLineEdges=0,t._pfTierW=-4),S>0&&_){const m=t.lodTiers?.length?t.lodTiers[0]:null,b=n._forceLow?!!(t.metaTexB&&t.totalEdgesB>0&&t.totalEdgesB<=(n.moveBudget??25e4)):ot&&t.metaTexB&&t.polyEdgesB>0&&(m?t.totalEdgesB<=m.edgeCount*1.5:t.totalEdgesB<=6e5),F=b?{tex:t.metaTexB,count:t.totalEdgesB,runs:null,minW:-2,sub:jf(t.subB)}:ul(t,n.lodRank??0,p,S);a.useProgram(se),yo(a,oe,n,v,F.tex,R,k,y,O),a.uniform1f(oe.u_line_width,n.lineWidth??1),a.uniform1f(oe.u_dpr,1),a.uniform1i(oe.u_active_id,-1),a.uniform4fv(oe.u_style_table,n.styleTable??$i),a.uniform2fv(oe.u_dash_table,n.dashTable??ka),a.uniform1i(oe.u_pass,0),b?Oa(a,oe):Jr(t,a,oe),si(t,a,oe,0);const re=er(a,oe,n);re&&(a.enable(a.DEPTH_TEST),a.depthFunc(a.LEQUAL),a.depthMask(!1));const Se=F.runs??[[0,F.count]],Ae=F.runs?F.runs.sub:F.sub,De=Cf(re,Ae,!!t._isDrawing),ce=()=>{a.uniform1i(oe.u_sub,1),a.uniform1ui(oe.u_subSkipE7,De.skipE7);for(const[je,Ce]of Se)co(a,s,oe,je,Ce);if(De.skipE7>0&&Ae){a.uniform1ui(oe.u_subSkipE7,0);for(let je=0;je<Jf;je++){const Ce=De.N[je],Tt=Ae[je];if(!(Ce<=1||!Tt)){a.uniform1i(oe.u_sub,Ce);for(const[Ie,Yt]of Tt)co(a,s,oe,Ie,Yt,Ce)}}}};let ye=0;for(const je of Se)ye+=je[1];ce(),t._pfLineEdges=ye,t._pfSubs=De.total,t._pfTierW=F.minW??-1,re&&(!t._isDrawing&&ye<1e5&&(a.depthFunc(a.GREATER),a.uniform1f(oe.u_hidden,1),ce(),a.uniform1f(oe.u_hidden,0),a.depthFunc(a.LEQUAL)),a.disable(a.DEPTH_TEST),a.depthMask(!0))}h>0&&U&&B&&(a.useProgram(de),_n(t,We,n),a.uniform1i(We.u_active_id,-1),co(a,s,We,0,h)),a.bindFramebuffer(a.FRAMEBUFFER,null)}function co(t,n,e,a,s,v=1){if(!n.quad4){v>1?t.drawArraysInstanced(t.TRIANGLES,a*6,s*6,v):t.drawArrays(t.TRIANGLES,a*6,s*6);return}const p=n.QK;for(let U=0;U<s;U+=p){t.uniform1i(e.u_vbase,a+U);const B=Math.min(p,s-U)*6;v>1?t.drawElementsInstanced(t.TRIANGLES,B,t.UNSIGNED_INT,0,v):t.drawElements(t.TRIANGLES,B,t.UNSIGNED_INT,0)}}function za(t,n){const{gl:e,programs:a,arcTex:s,metaTex:v,ptTex:p,ptMetaTex:U,totalEdges:B,totalPoints:S,TEX_ARC_W:h,TEX_META_W:R,width:k,height:y,activeId:O,polyEdgeByFid:se}=t;if(O===-1||!s&&!p)return;const{renderProgram:ae,stencilProgram:le,fillProgram:de,pointProgram:oe,uRender:ee,uStencil:fe,uFill:We,uPoint:nt,emptyVAO:j}=a;e.bindVertexArray(a.quadVAO||j);const be=se?.get(O),He=be?.[0]??null,Ye=be?.[1]??null,Ke=He!=null&&Ye>0;e.useProgram(ae),yo(e,ee,n,s,v,h,R,k,y);const ot=er(e,ee,n),Xe=Bf(ot,[[0,Ke?Ye:B,t.span?.[0]??-1,t.span?.[1]??-1]])[0];e.uniform1i(ee.u_sub,Xe),e.uniform1ui(ee.u_subSkipE7,0);const dt=(A,J)=>co(e,a,ee,A,J,Xe);si(t,e,ee,2),e.uniform1f(ee.u_line_width,(n.lineWidth??1)+2),e.uniform1f(ee.u_dpr,1),e.uniform1i(ee.u_active_id,O),e.uniform4fv(ee.u_style_table,n.styleTable??$i),e.uniform2fv(ee.u_dash_table,n.dashTable??ka),ee.u_hilite_color&&e.uniform4fv(ee.u_hilite_color,n.hiliteColor??[0,0,0,0]),ee.u_hilite_width&&e.uniform1f(ee.u_hilite_width,n.hiliteWidth??0),e.uniform1i(ee.u_pass,1),Ke?dt(He,Ye):B>0&&dt(0,B),S>0&&p&&U&&(e.useProgram(oe),_n(t,nt,n),e.uniform1i(nt.u_active_id,O),co(e,a,nt,0,S));const Fe=n.maskColor??Uf;Fe[3]>0&&Ke&&(e.enable(e.STENCIL_TEST),e.stencilMask(127),e.clear(e.STENCIL_BUFFER_BIT),e.colorMask(!1,!1,!1,!1),e.stencilFunc(e.ALWAYS,0,127),e.stencilOpSeparate(e.FRONT,e.KEEP,e.KEEP,e.INCR_WRAP),e.stencilOpSeparate(e.BACK,e.KEEP,e.KEEP,e.DECR_WRAP),e.useProgram(le),yo(e,fe,n,s,v,h,R,k,y),Jr(t,e,fe,n),e.drawArrays(e.TRIANGLES,He*3,Ye*3),e.colorMask(!0,!0,!0,!0),e.stencilMask(0),e.stencilFunc(e.EQUAL,0,127),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.useProgram(de),e.uniform4fv(We.u_fill_color,Fe),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.disable(e.STENCIL_TEST))}function Cs(t,n){const{gl:e,programs:a,arcTex:s,metaTex:v,ptTex:p,ptMetaTex:U,totalEdges:B,totalPoints:S,TEX_ARC_W:h,TEX_META_W:R,width:k,height:y,pickFBO:O}=t;if(!O||!s&&!p)return;const{pickLineProgram:se,pickPointProgram:ae,uPickLine:le,uPickPoint:de}=a;try{e.bindFramebuffer(e.FRAMEBUFFER,O),e.bindVertexArray(a.quadVAO||a.emptyVAO),e.clearColor(0,0,0,0),e.stencilMask(255),e.clear(e.COLOR_BUFFER_BIT|e.STENCIL_BUFFER_BIT|e.DEPTH_BUFFER_BIT),e.disable(e.BLEND);const oe=12*(t.dpr??1);if(B>0&&v){const ee=ul(t,n.lodRank??0,v,B);e.useProgram(se),yo(e,le,n,s,ee.tex,h,R,k,y),si(t,e,le),e.uniform1f(le.u_line_width,(n.lineWidth??1)+oe);for(const[fe,We]of ee.runs??[[0,ee.count]])co(e,a,le,fe,We)}S>0&&p&&U&&(e.useProgram(ae),_n(t,de,n),e.uniform1f(de.u_pt_radius,Math.max(n.ptRadius??1.5,oe*.5)),co(e,a,de,0,S)),e.enable(e.BLEND)}finally{e.bindFramebuffer(e.FRAMEBUFFER,null),e.colorMask(!0,!0,!0,!0),e.stencilMask(255),e.disable(e.STENCIL_TEST)}}function ri(t,n){if(n.x===t.lastMX&&n.y===t.lastMY||(t.lastMX=n.x,t.lastMY=n.y,t.hitMX=n.x,t.hitMY=n.y,!t.pickFBO))return;const e=Math.max(0,Math.min(t.width-1,Math.round(n.x*t.dpr))),a=Math.max(0,Math.min(t.height-1,Math.round(t.height-n.y*t.dpr)));Bs(t,e,a,n)}let Qo=null;function Bs(t,n,e,a){const s=t.gl;if(Qo){Qo.next={pickX:n,pickY:e,data:a};return}t._pickPBO||(t._pickPBO=s.createBuffer()),s.bindFramebuffer(s.READ_FRAMEBUFFER,t.pickFBO),s.bindBuffer(s.PIXEL_PACK_BUFFER,t._pickPBO),s.bufferData(s.PIXEL_PACK_BUFFER,4,s.STREAM_READ),s.readPixels(n,e,1,1,s.RGBA,s.UNSIGNED_BYTE,0),s.bindBuffer(s.PIXEL_PACK_BUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null);const v=s.fenceSync(s.SYNC_GPU_COMMANDS_COMPLETE,0);s.flush(),Qo={fence:v,data:a,s:t},fl(t)}function fl(t){const n=t.gl,e=Qo;if(!e||!n)return;if(n.clientWaitSync(e.fence,0,0)===n.TIMEOUT_EXPIRED){setTimeout(()=>fl(t),16);return}n.deleteSync(e.fence);const a=new Uint8Array(4);n.bindBuffer(n.PIXEL_PACK_BUFFER,t._pickPBO),n.getBufferSubData(n.PIXEL_PACK_BUFFER,0,a),n.bindBuffer(n.PIXEL_PACK_BUFFER,null);const s=e.next;Qo=null,Us(t,a,e.data),s&&(t.lastMX=NaN,ri(t,s.data))}function Us(t,n,e){const a=n[0]|n[1]<<8|n[2]<<16;let s=a===0?null:a-1;if(a===0&&t.gintData?.polyStream&&t.cam){const p=an(t.cam,e.x*t.dpr,e.y*t.dpr);p&&(s=oc(t.gintData.arcBuffer,t.gintData.arcMeta,t.gintData.polyStream,Math.round((p[0]+180)*1e7),Math.round((p[1]+90)*1e7),t.polyBboxByFid,t.lastViewBbox,tc(t)))}const v=s??-1;v!==t.activeId&&(t.activeId=v,postMessage({action:"identify",featureId:s??null,x:e.x,y:e.y,layer:t.layerId??null}),t.requestDraw?.())}function Ms(t,n){if(!t._inRange){$r(t);return}if(!t.cam||!t.gintData||t._isDrawing){t._isDrawing&&(t._pendingMove=n);return}if(t._moveTimer!==null){t._pendingMove=n;return}ri(t,n),t._moveTimer=setTimeout(()=>{t._moveTimer=null,t._pendingMove&&(ri(t,t._pendingMove),t._pendingMove=null)},Mf)}function $r(t){clearTimeout(t._moveTimer),t._moveTimer=null,t._pendingMove=null,t.activeId!==-1&&(t.activeId=-1,postMessage({action:"identify",featureId:null,layer:t.layerId??null}),t.requestDraw?.())}function n0(t,{requestDraw:n,quad4:e=!0}={}){c.requestDraw=n??null;let a=0;const s=()=>{a++,c.requestDraw?.()};c.gl=t,c.TEX_ARC_W=Math.min(c.TEX_ARC_W,t.getParameter(t.MAX_TEXTURE_SIZE)),c.TEX_META_W=Math.min(c.TEX_META_W,t.getParameter(t.MAX_TEXTURE_SIZE)),c.programs=bs(t,{quad4:e});let v=null,p=!0,U=0,B=0;const S=new Map;let h=null;const R=[];let k=0,y=null;const O=()=>y?y.st:c;function se({id:_=null,order:m=null}={}){const b=Object.create(c);Object.assign(b,ao()),b.layerId=_,b.activeId=-1,b.lastDrawData=null,b._inRange=!1,b._pfLineEdges=0,b._pfTierW=-1,b._pfRuns=-1,b._pfChunks=-1,b._forceLowMove=!1,b._budgetSkipped=!1,b._pickPending=!1,b._moveTimer=null,b._pendingMove=null,b.tierGen=0,b.idOverlapMode=!1;const F={id:_,st:b,order:m??++k,drawStyle:null,visible:!0},re=R.findIndex(Se=>Se.order>F.order);return R.splice(re<0?R.length:re,0,F),y=F,a++,ae(F)}function ae(_){const m=_.st;return{set:b=>{Vt(m),Kt(m),Object.assign(m,ao()),b&&(m.gintData=Ea(b),Ba(m),{minZoom:m.minZoom,maxZoom:m.maxZoom}=Gr({arcMeta:m.gintData.arcMeta,minZoom:b.minZoom??null,maxZoom:b.maxZoom??null,precision:b.precision??6})),m.activeId=-1,m.lastDrawData=null,s()},setSlot:()=>{},setBaked:b=>{if(!b)return ae(_).set(null);Vt(m),Kt(m),Object.assign(m,ao()),m.gintData=b.gint,Ua(m,b.artifacts);for(const F of b.tiers??[])Ma(m,F);Ia(m),{minZoom:m.minZoom,maxZoom:m.maxZoom}=Gr({arcMeta:m.gintData.arcMeta,minZoom:b.minZoom??null,maxZoom:b.maxZoom??null,precision:b.precision??6}),m.activeId=-1,m.lastDrawData=null,s()},style:b=>{_.drawStyle=b??null,s()},setVisible:b=>{_.visible=!!b,s()},paint:b=>{b?.table&&b.count>0?Na(m,b.table,b.count):Kt(m),m.idOverlapMode=!!b?.overlap,s()},activate:()=>{y!==_&&($r(O()),y=_)},setOrder:b=>{const F=R.indexOf(_);if(F<0)return;R.splice(F,1),_.order=b;const re=R.findIndex(Se=>Se.order>b);R.splice(re<0?R.length:re,0,_),s()},remove:()=>{const b=R.indexOf(_);b<0||(R.splice(b,1),clearTimeout(m._moveTimer),Vt(m),Kt(m),y===_&&(y=R.length?R[R.length-1]:null),s())},stats:()=>({tiers:m.lodTiers?.length??0,tiersDone:!!m.tiersDone,total:m.totalEdges,edges:m._pfLineEdges??0,subs:m._pfSubs??0,tierW:m._pfTierW??-1}),range:()=>({minZoom:m.minZoom??null,maxZoom:m.maxZoom??null})}}function le(_,m,b){const F=_.st;if(!_.visible&&!F.polyBboxByFid&&F.totalPoints===0){F._inRange=!1,F.lastDrawData=null;return}const re=_.drawStyle?.moveBudget??25e4;if((c._staticN??0)>=4?F._forceLowMove=!1:(F._pfLineEdges??0)>re&&(F._forceLowMove=!0),F._forceLowMove){const De=F.metaTexB&&F.totalEdgesB>0&&F.totalEdgesB<=re,ce=(F.polyBboxByFid?.size??0)>0&&(!F.fillOff||F.lowFill)&&F.polyEdgesB>0&&F.polyEdgesB<=re*8;if(!De&&!ce){F.lastDrawData=null,F._budgetSkipped=!0;return}c._isDrawing||c.requestDraw?.()}const Se={cam:m,..._.drawStyle||{}};if(F._forceLowMove&&(Se._forceLow=!0),!Vi(F,Se)){F._inRange=!1,F.lastDrawData=null,F._pfLineEdges=0,F._pfTierW=-1;return}if(F._inRange=!0,F.totalEdges===0&&F.totalPoints===0){F.lastDrawData=null,F._pfLineEdges=0,F._pfTierW=-1;return}F._budgetSkipped=!1;const Ae=Wi(c,Se);b&&b.terrainDepth&&!Se.noDepth&&(Ae.depth=b),b&&b.facesInAtlas&&(Ae.noFaces=!0),_.visible&&(ji(F,Ae,null),za(F,Ae)),F.lastDrawData=Ae}const de=()=>{if(h==null)return;const _=S.get(h)??{};for(const m of da)_[m]=c[m];S.set(h,_)},oe=_=>{for(const m of da)c[m]=_[m];c.tierGen=(c.tierGen??0)+1,c.activeId=-1,c.lastDrawData=null,c._pfLineEdges=0,c._pfTierW=-1},ee=_=>{for(const m of["arcTex","metaTex","metaTexB","ptTex","ptMetaTex","pivotTex","compTex","fidStyleTex"])_[m]&&(t.deleteTexture(_[m]),_[m]=null);_.lodTiers?.length&&_.lodTiers.forEach(m=>t.deleteTexture(m.tex)),_.lodTiers=[]};function fe(_){_!==h&&(de(),oe(S.get(_)??ao()),h=S.has(_)?_:null,h!=null&&!c.tiersDone&&c.totalEdges>0&&nl(c),s())}function We(_,m){if(m=m??"user",_){de();const b=S.get(m);b&&m!==h&&ee(b),m===h&&Vt(c),oe(ao()),h=m,c.gintData=Ea(_),Ba(c),{minZoom:c.minZoom,maxZoom:c.maxZoom}=Gr({arcMeta:c.gintData.arcMeta,minZoom:_.minZoom??null,maxZoom:_.maxZoom??null,precision:_.precision??6}),S.set(m,{})}else if(m===h)Vt(c),oe(ao()),S.delete(m),h=null;else{const b=S.get(m);b&&(ee(b),S.delete(m))}c.activeId=-1,c.lastDrawData=null,s()}function nt(_,m){if(m=m??"user",!_)return We(null,m);const b=h;de();const F=S.get(m);F&&m!==h&&ee(F),m===h&&Vt(c),oe(ao()),h=m,c.gintData=_.gint,Ua(c,_.artifacts);for(const re of _.tiers??[])Ma(c,re);Ia(c),{minZoom:c.minZoom,maxZoom:c.maxZoom}=Gr({arcMeta:c.gintData.arcMeta,minZoom:_.minZoom??null,maxZoom:_.maxZoom??null,precision:_.precision??6}),S.set(m,{}),c.activeId=-1,c.lastDrawData=null,b!==m&&fe(b),s()}function j(_){v=_??null,s()}function be(_){p=!!_,s()}function He(_){_?.table&&_.count>0?Na(c,_.table,_.count):Kt(c),c.idOverlapMode=!!_?.overlap,s()}function Ye(_,m){if(!c.programs)return;const b=()=>{t.disable(t.DEPTH_TEST),t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);for(const ye of R)le(ye,_,m);t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.disable(t.STENCIL_TEST),t.stencilMask(255),t.bindVertexArray(null),t.activeTexture(t.TEXTURE0)};if(!p&&!c.polyBboxByFid&&c.totalPoints===0){c._inRange=!1,c.lastDrawData=null,b();return}c.width=t.canvas.width,c.height=t.canvas.height,c.dpr=_.dpr||1;const F=c._lastSyncCam,re=!F||F.center[0]!==_.center[0]||F.center[1]!==_.center[1]||F.zoom!==_.zoom||F.pitch!==_.pitch||F.bearing!==_.bearing;if(c._lastSyncCam={center:[_.center[0],_.center[1]],zoom:_.zoom,pitch:_.pitch,bearing:_.bearing},re){c._isDrawing=!0;const ye=O();clearTimeout(ye._moveTimer),ye._moveTimer=null,ye._pendingMove=null,c._staticN=0,ye.activeId!==-1&&(ye.activeId=-1,postMessage({action:"identify",featureId:null,layer:y?.id??null}))}else c._isDrawing=!1,c._staticN=(c._staticN??0)+1;{const ye=O();ye.lastMX=NaN,ye.lastMY=NaN}const Se=v?.moveBudget??25e4;if(c._staticN>=4?c._forceLowMove=!1:(c._pfLineEdges??0)>Se&&(c._forceLowMove=!0),c._forceLowMove){const ye=c.metaTexB&&c.totalEdgesB>0&&c.totalEdgesB<=Se,je=(c.polyBboxByFid?.size??0)>0&&(!c.fillOff||c.lowFill)&&c.polyEdgesB>0&&c.polyEdgesB<=Se*8;if(!ye&&!je){c.lastDrawData=null,c._budgetSkipped=!0,b();return}c._isDrawing||c.requestDraw?.()}const Ae={cam:_,...v||{}};if(c._forceLowMove&&(Ae._forceLow=!0),!Vi(c,Ae)){c._inRange=!1,c.lastDrawData=null,c._pfLineEdges=0,c._pfTierW=-1,b();return}if(c._inRange=!0,c.totalEdges===0&&c.totalPoints===0){c.lastDrawData=null,c._pfLineEdges=0,c._pfTierW=-1,b();return}c._budgetSkipped=!1;const De=Wi(c,Ae);m&&m.terrainDepth&&!Ae.noDepth&&(De.depth=m),m&&m.facesInAtlas&&(De.noFaces=!0),t.disable(t.DEPTH_TEST),t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);for(const ye of R)ye.order<0&&le(ye,_,m);p&&(ji(c,De,null),za(c,De)),c.lastDrawData=De;for(const ye of R)ye.order>=0&&le(ye,_,m);const ce=O();ce._pickPending&&(ce._pickPending=!1,Ke()),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.disable(t.STENCIL_TEST),t.stencilMask(255),t.bindVertexArray(null),t.activeTexture(t.TEXTURE0)}function Ke(){c._isDrawing=!1;const _=O();if(c._pfDrawn=(c._pfDrawn??0)+1,!_.lastDrawData){_._budgetSkipped&&(_._budgetSkipped=!1,c._staticN=4,_._pickPending=!0,c.requestDraw?.());return}if(!_.polyBboxByFid&&_.totalPoints===0)return;if(!c.pickFBO||U!==c.width||B!==c.height){const b=c.lastDrawData;gs(),c.lastDrawData=b,U=c.width,B=c.height,c._pfFbo=(c._pfFbo??0)+1}const m=performance.now();if(Cs(_,_.lastDrawData),c._pfPickMs=(c._pfPickMs??0)+(performance.now()-m),_._pendingMove){const b=_._pendingMove;_._pendingMove=null,ri(_,b)}}function ot(_){const m=O();!c.pickFBO&&m.lastDrawData&&!c._isDrawing&&Ke(),Ms(m,_)}function Xe(){$r(O())}function dt(){const _=O();if(_.activeId===-1)return;const m=c.cam?an(c.cam,_.hitMX*c.dpr,_.hitMY*c.dpr):null;postMessage({action:"click",featureId:_.activeId,x:_.hitMX,y:_.hitMY,lng:m?.[0]??null,lat:m?.[1]??null,layer:y?.id??null})}function Fe(){for(const _ of R.slice())clearTimeout(_.st._moveTimer),Vt(_.st),Kt(_.st);R.length=0,y=null,de();for(const _ of S.values())ee(_);S.clear(),h=null,Vt(c),al(),Ss(c),c.gl&&Ts(t,c.programs),c.programs=null,c.gintData=null,c.polyEdgeByFid=null,c.polyBboxByFid=null,c.fillOff=!1,c.lowFill=!1,c.totalEdges=c.totalPoints=c.polyEdges=0,c.activeId=-1,c.lastDrawData=null}function A(){return{drawn:c._pfDrawn??0,fbo:c._pfFbo??0,pickMs:c._pfPickMs??0,rank:c.lastDrawData?.lodRank??-1,tierW:c._pfTierW??-1,edges:c._pfLineEdges??0,tiers:c.lodTiers?.length??0,tiersDone:!!c.tiersDone,total:c.totalEdges,runs:c._pfRuns??-1,chunks:c._pfChunks??-1,vb:c.lastViewBbox}}function J(_,m){if(!c.programs)return 0;c.width=t.canvas.width,c.height=t.canvas.height;const b=m.win,F={off:null,inv:[1/b[2],1/b[3]],size:m.size},Se=b[0]<-180||b[0]+b[2]>180?null:[Math.round((b[0]+180)*1e7),Math.round((Math.max(-90,b[1])+90)*1e7),Math.round((b[0]+b[2]+180)*1e7),Math.round((Math.min(90,b[1]+b[3])+90)*1e7)];let Ae=0;const De=(ce,ye,je)=>{if(!je||!ce.polyBboxByFid||(ce.polyBboxByFid.size??0)===0)return;const Ce={cam:_,...ye||{}};if(ce._forceLowMove&&(Ce._forceLow=!0),!Vi(ce,Ce)||ce.totalEdges===0)return;const Tt=Wi(c,Ce);let Ie=Tt.origin[0]-b[0];Ie-=360*Math.round((Ie-b[2]/2)/360),Tt.atlas={...F,off:[Ie,Tt.origin[1]-b[1]]},Tt.facesOnly=!0;const Yt=Object.prototype.hasOwnProperty.call(ce,"lastViewBbox"),rr=ce.lastViewBbox;ce.lastViewBbox=Se;try{ji(ce,Tt,m.fbo),Ae++}finally{Yt?ce.lastViewBbox=rr:delete ce.lastViewBbox}};t.disable(t.DEPTH_TEST),t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);for(const ce of R)ce.order<0&&De(ce.st,ce.drawStyle,ce.visible);De(c,v,p);for(const ce of R)ce.order>=0&&De(ce.st,ce.drawStyle,ce.visible);return t.bindFramebuffer(t.FRAMEBUFFER,m.fbo),Ae}return{set:We,setSlot:fe,setBaked:nt,style:j,setVisible:be,paint:He,draw:Ye,drawn:Ke,move:ot,leave:Xe,click:dt,dispose:Fe,stats:A,addLayer:se,bakeFaces:J,bakeSig:()=>`${a}|${c._isDrawing||(c._staticN??99)<4?1:0}|${c._forceLowMove?1:0}${R.map(_=>_.st._forceLowMove?1:0).join("")}`,activate:()=>{y!==null&&($r(O()),y=null)}}}export{n0 as createGintLayer,i0 as createRenderer};
