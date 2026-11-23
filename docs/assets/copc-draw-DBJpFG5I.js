import{g as L}from"./glprog-Ctpj38TF.js";import{g as N}from"./renderworker-D_COh6DJ.js";import"./rangecache-flag-DUqD5ZxK.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";const O="highp float sceneOcclusion(highp vec2 uv, highp float w) { return 0.0; }",B=`#version 300 es
precision highp float;
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_rgb;
layout(location = 2) in float a_int;
layout(location = 3) in float a_cls;
layout(location = 4) in float a_elev;
uniform mat4 u_mvp; uniform vec3 u_origin; uniform vec3 u_eye;
uniform int u_mode; uniform float u_size; uniform float u_atten; uniform float u_spacing; uniform float u_focal; uniform float u_maxPt;
uniform vec2 u_elev; uniform vec2 u_intRange; uniform float u_opacity; uniform float u_lift; uniform float u_liftM;
out vec4 v_col; out float v_rad; out float v_w;
vec3 ramp(float t) {   // 標高の段彩（青→緑→黄→赤）
	t = clamp(t, 0.0, 1.0);
	return t < 0.33 ? mix(vec3(0.17, 0.35, 0.75), vec3(0.20, 0.65, 0.35), t / 0.33) : t < 0.66 ? mix(vec3(0.20, 0.65, 0.35), vec3(0.95, 0.85, 0.25), (t - 0.33) / 0.33) : mix(vec3(0.95, 0.85, 0.25), vec3(0.80, 0.22, 0.15), (t - 0.66) / 0.34);
}
vec3 clsColor(float c) {   // ASPRS LAS 1.4 の分類
	int k = int(c + 0.5);
	if (k == 2) return vec3(0.63, 0.47, 0.30);   // 地面
	if (k == 3) return vec3(0.62, 0.84, 0.45);   // 低い植生
	if (k == 4) return vec3(0.35, 0.70, 0.30);   // 中の植生
	if (k == 5) return vec3(0.13, 0.50, 0.18);   // 高い植生
	if (k == 6) return vec3(0.90, 0.35, 0.25);   // 建物
	if (k == 7 || k == 18) return vec3(0.85, 0.20, 0.85);   // ノイズ
	if (k == 9) return vec3(0.20, 0.45, 0.90);   // 水
	if (k == 10) return vec3(0.45, 0.35, 0.55);  // 鉄道
	if (k == 11) return vec3(0.55, 0.55, 0.58);  // 道路面
	if (k == 17) return vec3(0.95, 0.65, 0.20);  // 橋
	return vec3(0.72, 0.72, 0.72);               // 未分類・その他
}
void main() {
	vec4 off = vec4(2.0, 2.0, 2.0, 1.0);
	vec3 pos = a_pos + normalize(a_pos + u_origin) * u_lift;   // 高さの足し込み（球の法線＝数 m なら楕円体の法線との差は無視できる）
	vec3 d = (pos + u_origin) - u_eye;   // 地平線の向こう（球の裏側）は描かない
	float a = dot(d, d), b = dot(u_eye, d), c = dot(u_eye, u_eye) - 1.0, disc = b * b - a * c;
	if (disc > 0.0) { float s = sqrt(disc); float t0 = (-b - s) / a; if (t0 > 1e-4 && t0 < 1.0 - 1e-4) { gl_Position = off; gl_PointSize = 0.0; v_col = vec4(0.0); v_rad = 0.0; v_w = 1.0; return; } }
	vec4 cpos = u_mvp * vec4(pos, 1.0);
	if (cpos.w <= 0.0) { gl_Position = off; gl_PointSize = 0.0; v_col = vec4(0.0); v_rad = 0.0; v_w = 1.0; return; }
	float rad = u_atten > 0.5 ? clamp(0.5 * u_spacing * u_focal / max(1e-9, sqrt(a)), 1.0, u_size * 2.0) : u_size;
	v_rad = min(rad, u_maxPt * 0.5 - 1.0);
	vec3 col = u_mode == 0 ? a_rgb : u_mode == 1 ? clsColor(a_cls) : u_mode == 2 ? vec3(clamp((a_int - u_intRange.x) / max(1e-6, u_intRange.y - u_intRange.x), 0.0, 1.0)) : ramp((a_elev + u_liftM - u_elev.x) / max(1e-6, u_elev.y - u_elev.x));
	v_col = vec4(col, u_opacity); v_w = cpos.w;
	gl_PointSize = v_rad * 2.0 + 2.0;
	gl_Position = cpos;
}`;function F(){const l=t=>`#version 300 es
precision highp float;
in vec4 v_col; in float v_rad; in float v_w;
uniform vec2 u_vp;
${t}
out vec4 o;
void main() {
	vec2 p = (gl_PointCoord * 2.0 - 1.0) * (v_rad + 1.0);
	float cov = clamp(v_rad + 0.5 - length(p), 0.0, 1.0);
	if (cov <= 0.0) discard;
	if (sceneOcclusion(gl_FragCoord.xy / u_vp, v_w) > 0.5) discard;
	float a = v_col.a * cov;
	o = vec4(v_col.rgb * a, a);
}`;let e=null,m=null,r={},h=1,d=!1,y=null;const i=new Map;let a={mode:"rgb",size:2,attenuation:!0,elevRange:[0,100],intensityRange:[0,65535],opacity:1,lift:0,liftM:0};const c={rgb:0,classification:1,intensity:2,elevation:3},p=[],P=(t,o)=>L(e,t,o);function f(t,o={},n=null){if(y=n,e=t.getContext("webgl2",N({premultipliedAlpha:!0,antialias:!1,alpha:!0,depth:!1})),!e)throw new Error("WebGL2 is not available (COPC overlay)");return d=o.depth!==!1&&!!n?.depthGLSL,{p:m,u:r}=P(B,l(d?n.depthGLSL:O)),h=e.getParameter(e.ALIASED_POINT_SIZE_RANGE)[1],d?{depth:!0}:void 0}const v=t=>{if(t){for(const o of t.bufs)e.deleteBuffer(o);e.deleteVertexArray(t.vao)}},g=(t,o,n,u,_)=>{const w=e.createBuffer();return e.bindBuffer(e.ARRAY_BUFFER,w),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,u,_,0,0),w};function E(t){if(t.type==="probe"){p.push(t.id),y?.requestDraw?.();return}if(e)if(t.type==="layer"){v(i.get(t.q));const o=e.createVertexArray();e.bindVertexArray(o);const n=[g(0,t.pos,3,e.FLOAT,!1),g(2,t.intensity,1,e.UNSIGNED_SHORT,!1),g(3,t.cls,1,e.UNSIGNED_BYTE,!1),g(4,t.elev,1,e.FLOAT,!1)];t.rgb?n.push(g(1,t.rgb,3,e.UNSIGNED_BYTE,!0)):(e.disableVertexAttribArray(1),e.vertexAttrib3f(1,.85,.85,.85)),e.bindVertexArray(null),i.set(t.q,{n:t.n,vao:o,bufs:n,origin:t.origin,spacing:t.spacing||0,on:!0})}else if(t.type==="remove")v(i.get(t.q)),i.delete(t.q);else if(t.type==="vis"){const o=i.get(t.q);o&&(o.on=!!t.on)}else t.type==="clear"?(i.forEach(v),i.clear()):t.type==="style"&&(a={...a,...t})}function R(t,o){if(!p.length)return;const n=p.splice(0);try{const u=new Uint8Array(t*o*4);e.readPixels(0,0,t,o,e.RGBA,e.UNSIGNED_BYTE,u);for(const _ of n)y?.post?.({type:"pixels",id:_,w:t,h:o,flipY:!0,data:_===n[n.length-1]?u:u.slice(),info:{layers:i.size,depth:d}})}catch(u){for(const _ of n)y?.post?.({type:"pixels",id:_,error:String(u?.message||u)})}}function k(t,o,n,u){return D(t,o,n,u),e&&R(n.w,n.h),!1}function D(t,o,{w:n,h:u},_){if(!e||(e.viewport(0,0,n,u),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),!i.size))return;const w=t.dpr||1;e.useProgram(m),d&&(_?.depth?_.depth.bind(e,m,3):r.u_sceneDepthOn&&e.uniform1f(r.u_sceneDepthOn,0)),e.uniform2f(r.u_vp,n,u),e.uniform3fv(r.u_eye,new Float32Array(o.eye)),e.uniform1i(r.u_mode,c[a.mode]??0),e.uniform1f(r.u_size,Math.max(.5,a.size*w)),e.uniform1f(r.u_atten,a.attenuation?1:0),e.uniform1f(r.u_focal,o.focal),e.uniform1f(r.u_maxPt,h),e.uniform2f(r.u_elev,a.elevRange[0],a.elevRange[1]),e.uniform2f(r.u_intRange,a.intensityRange[0],a.intensityRange[1]),e.uniform1f(r.u_opacity,a.opacity??1),e.uniform1f(r.u_lift,a.lift||0),e.uniform1f(r.u_liftM,a.liftM||0),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.disable(e.DEPTH_TEST);const x=o.mvp,S=new Float32Array(16);for(const A of i.values()){if(!A.on)continue;const b=A.origin;for(let s=0;s<12;s++)S[s]=x[s];for(let s=0;s<4;s++)S[12+s]=x[s]*b[0]+x[4+s]*b[1]+x[8+s]*b[2]+x[12+s];e.uniformMatrix4fv(r.u_mvp,!1,S),e.uniform3f(r.u_origin,b[0],b[1],b[2]),e.uniform1f(r.u_spacing,A.spacing),e.bindVertexArray(A.vao),e.drawArrays(e.POINTS,0,A.n)}e.bindVertexArray(null)}function T(){e&&(i.forEach(v),i.clear(),e.deleteProgram(m),e.getExtension("WEBGL_lose_context")?.loseContext(),e=null)}return{init:f,message:E,frame:k,destroy:T}}function K(){let l=null,e=[],m=!1;function r(i,a={},c=null){const p=a.depth!==!1,P=performance.now();return(async()=>{try{if(!a.gl&&c?.gpuDevice?.())try{const f=(await import("./copc-gpu-CTqijga8.js")).create();if(await f.init(i,{depth:p},c),m){f.destroy();return}l={kind:"webgpu",m:f}}catch(f){console.warn("[copc] WebGPU drawer unavailable, drawing with WebGL2:",f?.message||f)}if(m)return;if(!l){const f=F();f.init(i,{depth:p},c),l={kind:"webgl2",m:f}}for(const f of e)l.m.message(f);e=[],console.info(`[copc] backend=${l.kind} in ${Math.round(performance.now()-P)}ms`),c?.post?.({type:"backend",backend:l.kind}),c?.requestDraw?.()}catch(f){const v=String(f?.message||f);console.error("[copc] overlay failed",f),c?.stage?.("failed",{error:v}),c?.post?.({type:"backend",backend:null,error:v});for(const g of e)g.type==="probe"&&c?.post?.({type:"pixels",id:g.id,error:v});e=[]}})(),p?{depth:!0}:void 0}function h(i){l?l.m.message(i):e.push(i)}function d(i,a,c,p){return l?!!l.m.frame(i,a,c,p):!1}function y(){m=!0,l?.m.destroy(),l=null,e=[]}return{init:r,message:h,frame:d,destroy:y}}export{K as create};
