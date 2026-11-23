import{g as ce}from"./glprog-Ctpj38TF.js";import{g as ve}from"./renderworker-D_COh6DJ.js";import"./rangecache-flag-DUqD5ZxK.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";const J=`
uniform vec3 u_eyeRel;   // E − O（f64 で引いて f32 へ＝小さい）
uniform float u_oe;      // dot(O, E − O)（f64）
bool behindGlobe(vec3 p) {   // p＝原点相対。見える ⇔ dot(P, E − P) > 0 ＝ u_oe + dot(p, eyeRel − p) − dot(O, p)（全部小さい量＝桁落ちしない）
	return u_oe + dot(p, u_eyeRel - p) - dot(u_origin, p) <= 0.0;
}`,G=`
uniform highp usampler2D u_tab;
uniform int u_tabW;
uvec4 rec(uint f) { int i = int(f); return texelFetch(u_tab, ivec2(i % u_tabW, i / u_tabW), 0); }
vec4 unpack(uint c) { return vec4(float((c >> 24u) & 255u), float((c >> 16u) & 255u), float((c >> 8u) & 255u), float(c & 255u)) / 255.0; }`,Y=`
uniform float u_lift;   // 標高 1m あたりの持ち上げ（世界単位・pitch のフェード込み）。0＝真俯瞰＝持ち上げない
vec3 lifted(vec3 p, float e) { return u_lift == 0.0 ? p : p + normalize(p + u_origin) * (e * u_lift); }`,w="vec4(2.0, 2.0, 2.0, 1.0)",_e=`
highp float sceneOcclusion(highp vec2 uv, highp float w) { return 0.0; }`;function De(){const K=`#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
layout(location = 0) in vec3 a_pos;
layout(location = 1) in uint a_feat;
layout(location = 2) in float a_elev;
uniform mat4 u_mvp; uniform vec3 u_origin;
${G}
${Y}
out vec4 v_col; out vec3 v_rel; out float v_w;
void main() {
	uvec4 r = rec(a_feat); vec4 col = unpack(r.r);
	if ((r.b & 1u) == 0u || col.a <= 0.0) { gl_Position = ${w}; v_col = vec4(0.0); v_rel = vec3(0.0); v_w = 1.0; return; }
	v_col = col; v_rel = a_pos;
	gl_Position = u_mvp * vec4(lifted(a_pos, a_elev), 1.0); v_w = gl_Position.w;
}`,$=t=>`#version 300 es
precision highp float;
in vec4 v_col; in vec3 v_rel; in float v_w;
uniform vec3 u_origin; uniform vec2 u_size;
out vec4 o;
${J}
${t}
void main() {
	if (v_col.a <= 0.0 || behindGlobe(v_rel)) discard;
	if (sceneOcclusion(gl_FragCoord.xy / u_size, v_w) > 0.5) discard;
	o = vec4(v_col.rgb * v_col.a, v_col.a);
}`,Q=`#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
layout(location = 0) in vec3 a_p0;
layout(location = 1) in vec3 a_p1;
layout(location = 2) in uint a_feat;
layout(location = 3) in float a_e0;
layout(location = 4) in float a_e1;
uniform mat4 u_mvp; uniform vec3 u_origin; uniform vec2 u_vp; uniform float u_dpr;
${G}
${Y}
out vec4 v_col; out vec3 v_rel; out float v_w;
void main() {
	uint f = a_feat & 0x7fffffffu;
	uvec4 r = rec(f); vec4 col = unpack(r.g); float w = float((r.b >> 24u) | (((r.b >> 16u) & 255u) << 8u)) / 8.0 * u_dpr;   // 線幅 u16（1/8px・下位は bit 24〜・上位は bit 16〜＝2026-10-22 から）
	if ((a_feat & 0x80000000u) != 0u || (r.b & 1u) == 0u || col.a <= 0.0 || w <= 0.0) { gl_Position = ${w}; v_col = vec4(0.0); v_rel = vec3(0.0); v_w = 1.0; return; }
	vec4 c0 = u_mvp * vec4(lifted(a_p0, a_e0), 1.0), c1 = u_mvp * vec4(lifted(a_p1, a_e1), 1.0);
	if (c0.w <= 0.0 || c1.w <= 0.0) { gl_Position = ${w}; v_col = vec4(0.0); v_rel = vec3(0.0); v_w = 1.0; return; }
	vec2 s0 = c0.xy / c0.w * 0.5 * u_vp, s1 = c1.xy / c1.w * 0.5 * u_vp;
	vec2 d = s1 - s0; float L = length(d); vec2 dir = L > 0.0 ? d / L : vec2(1.0, 0.0); vec2 nrm = vec2(-dir.y, dir.x);
	int id = gl_VertexID; bool at1 = (id >> 1) == 1; float side = float((id & 1) * 2 - 1);
	float wp = max(w, 1.0); col.a *= min(w, 1.0);   // 1px 未満は 1px で薄く
	vec4 c = at1 ? c1 : c0; vec2 s = at1 ? s1 : s0;
	vec2 off = nrm * side * wp * 0.5 + dir * (at1 ? 1.0 : -1.0) * wp * 0.5;   // 正方キャップ＝繋ぎ目の欠けを埋める
	vec2 sp = s + off;
	gl_Position = vec4(sp / (0.5 * u_vp) * c.w, c.z, c.w);
	v_col = col; v_rel = at1 ? a_p1 : a_p0; v_w = c.w;
}`,ee=`#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
layout(location = 0) in vec3 a_pos;
layout(location = 1) in uint a_feat;
layout(location = 2) in float a_elev;
uniform mat4 u_mvp; uniform vec3 u_origin; uniform float u_dpr; uniform float u_maxPt;
${G}
${Y}
${J}
out vec4 v_col; out float v_rad; out float v_w;
void main() {
	uvec4 r = rec(a_feat); vec4 col = unpack(r.g); float rad = float((r.b >> 8u) & 255u) / 4.0 * u_dpr;
	if ((r.b & 1u) == 0u || col.a <= 0.0 || rad <= 0.0 || behindGlobe(a_pos)) { gl_Position = ${w}; gl_PointSize = 0.0; v_col = vec4(0.0); v_rad = 0.0; v_w = 1.0; return; }
	vec4 c = u_mvp * vec4(lifted(a_pos, a_elev), 1.0);
	if (c.w <= 0.0) { gl_Position = ${w}; gl_PointSize = 0.0; v_col = vec4(0.0); v_rad = 0.0; v_w = 1.0; return; }
	v_rad = min(rad, u_maxPt * 0.5 - 1.0); v_col = col; v_w = c.w;
	gl_PointSize = v_rad * 2.0 + 2.0;
	gl_Position = c;
}`,te=t=>`#version 300 es
precision highp float;
in vec4 v_col; in float v_rad; in float v_w;
uniform vec2 u_size;
out vec4 o;
${t}
void main() {
	vec2 p = (gl_PointCoord * 2.0 - 1.0) * (v_rad + 1.0);
	float cov = clamp(v_rad + 0.5 - length(p), 0.0, 1.0);
	if (cov <= 0.0 || v_col.a <= 0.0) discard;
	if (sceneOcclusion(gl_FragCoord.xy / u_size, v_w) > 0.5) discard;
	float a = v_col.a * cov;
	o = vec4(v_col.rgb * a, a);
}`;let e=null,g=null,D=null,x=null,h=null,W=1,X=!0,S=!1,I=0,T=0,R=!0,F=!0,O=1;const V=[],c=new Map,U=1024,k=180/Math.PI,re=6e4,oe=2e3,z=(t,r)=>ce(e,t,r,!0);function ie(t,r={},i=null){if(g=i,e=t.getContext("webgl2",ve({premultipliedAlpha:!0,antialias:!0,alpha:!0,depth:!1})),!e)throw new Error("WebGL2 is not available (columnar overlay)");R=r.drape!==!1,F=r.depth!==!1&&!!i?.depthGLSL,O=r.rAx||1;const o=F?i.depthGLSL:_e;return D=z(K,$(o)),x=z(Q,$(o)),h=z(ee,te(o)),W=e.getParameter(e.ALIASED_POINT_SIZE_RANGE)[1],S=!!r.perf,F?{depth:!0}:void 0}const b=(t,r=e.ARRAY_BUFFER,i=e.STATIC_DRAW)=>{const o=e.createBuffer();return e.bindBuffer(r,o),e.bufferData(r,t,i),o};function C(t,r){const i=Math.max(1,Math.ceil(r/U)),o=U*i*4;let l=t;t.length!==o&&(l=new Uint32Array(o),l.set(t.subarray(0,Math.min(t.length,o))));const u=e.createTexture();return e.bindTexture(e.TEXTURE_2D,u),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.RGBA32UI,U,i,0,e.RGBA_INTEGER,e.UNSIGNED_INT,l),e.bindTexture(e.TEXTURE_2D,null),u}function N(t){if(t){for(const r of t.bufs)e.deleteBuffer(r);for(const r of t.vaos)e.deleteVertexArray(r);e.deleteTexture(t.tab)}}const L=(t,r,i,o)=>{if(!R)return e.disableVertexAttribArray(r),e.vertexAttrib1f(r,0),null;const l=new Float32Array(i),u=b(l,e.ARRAY_BUFFER,e.DYNAMIC_DRAW);return e.enableVertexAttribArray(r),e.vertexAttribPointer(r,1,e.FLOAT,!1,0,0),t.bufs.push(u),{cpu:l,glb:u,pos:o,at:0,done:0,n:i}};function H(t,r){const i={zoom:r.zoom,lines:null,fills:null};if(r.lines&&r.lines.feat.length>=2){const o=r.lines.feat.length,l=b(r.lines.pos),u=b(r.lines.feat),f=e.createVertexArray();e.bindVertexArray(f),e.bindBuffer(e.ARRAY_BUFFER,l),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0),e.vertexAttribDivisor(0,1),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,0,12),e.vertexAttribDivisor(1,1),e.bindBuffer(e.ARRAY_BUFFER,u),e.enableVertexAttribArray(2),e.vertexAttribIPointer(2,1,e.UNSIGNED_INT,0,0),e.vertexAttribDivisor(2,1);let s=null;R?(s=L(t,3,o,r.lines.pos),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,1,e.FLOAT,!1,0,4),e.vertexAttribDivisor(4,1)):(e.disableVertexAttribArray(3),e.vertexAttrib1f(3,0),e.disableVertexAttribArray(4),e.vertexAttrib1f(4,0)),e.bindVertexArray(null),i.lines={vao:f,nSeg:o-1,elev:s},t.bufs.push(l,u),t.vaos.push(f)}if(r.fills&&r.fills.index.length){const o=r.fills.pos.length/3,l=b(r.fills.pos),u=b(r.fills.feat),f=b(r.fills.index,e.ELEMENT_ARRAY_BUFFER),s=e.createVertexArray();e.bindVertexArray(s),e.bindBuffer(e.ARRAY_BUFFER,l),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,u),e.enableVertexAttribArray(1),e.vertexAttribIPointer(1,1,e.UNSIGNED_INT,0,0);const n=L(t,2,o,r.fills.pos);e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,f),e.bindVertexArray(null),i.fills={vao:s,count:r.fills.index.length,elev:n},t.bufs.push(l,u,f),t.vaos.push(s)}t.levels=t.levels.filter(o=>o.zoom!==i.zoom),t.levels.push(i),t.levels.sort((o,l)=>o.zoom-l.zoom)}function ne(t){N(c.get(t.g));const r=t.chunk,i={origin:r.origin,n:r.n,tab:C(t.table,r.n),tabW:U,points:null,levels:[],bufs:[],vaos:[]};if(r.points&&r.points.feat.length){const o=r.points.feat.length,l=b(r.points.pos),u=b(r.points.feat),f=e.createVertexArray();e.bindVertexArray(f),e.bindBuffer(e.ARRAY_BUFFER,l),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,u),e.enableVertexAttribArray(1),e.vertexAttribIPointer(1,1,e.UNSIGNED_INT,0,0);const s=L(i,2,o,r.points.pos);e.bindVertexArray(null),i.points={vao:f,n:o,elev:s},i.bufs.push(l,u),i.vaos.push(f)}for(const o of r.levels)H(i,o);c.set(t.g,i)}function le(t){if(e)try{ae(t)}catch(r){console.error("[columnar overlay]",t.type,r?.message||r),g?.post?.({type:"error",where:t.type,error:String(r?.message||r)})}}function ae(t){if(t.type==="chunk")ne(t);else if(t.type==="table"){const r=c.get(t.g);r&&(e.deleteTexture(r.tab),r.tab=C(t.table,r.n))}else if(t.type==="levels"){const r=c.get(t.g);if(r)for(const i of t.levels)H(r,i)}else t.type==="remove"?(N(c.get(t.g)),c.delete(t.g)):t.type==="vis"?X=!!t.on:t.type==="clear"?(c.forEach(N),c.clear()):t.type==="perf"?(S=!!t.on,I=0,T=0):t.type==="probe"&&(V.push(t.id),g?.requestDraw?.())}function Z(t,r){if(!V.length)return;const i=V.splice(0);try{const o=new Uint8Array(t*r*4);e.readPixels(0,0,t,r,e.RGBA,e.UNSIGNED_BYTE,o);const l=e.getError(),u={chunks:c.size,levels:[...c.values()].map(f=>f.levels.map(s=>[s.zoom,s.lines?.nSeg??0,s.fills?.count??0])),glErr:l,drape:R,depth:F};for(const f of i)g?.post?.({type:"pixels",id:f,w:t,h:r,data:f===i[i.length-1]?o:o.slice(),info:u})}catch(o){for(const l of i)g?.post?.({type:"pixels",id:l,error:String(o?.message||o)})}}const M=(t,r)=>{for(const i of t.levels)if(i.zoom>=r)return i;return t.levels[t.levels.length-1]};function se(t,r,i){if(!R||!t?.terrainOn||!(t.liftScale>0))return!1;let o=re,l=!1;const u=Math.round(i),f=(s,n)=>{if(!n||o<=0||(n.done>=n.n&&(n.z!==u||r-n.at>=oe)&&(n.done=0,n.z=u),n.done>=n.n))return;const d=s.origin,A=n.pos,y=Math.min(n.n,n.done+o);for(let m=n.done;m<y;m++){const E=A[m*3]+d[0],P=A[m*3+1]+d[1],a=A[m*3+2]+d[2],_=Math.atan2(a,E)*k,v=Math.atan2(P,Math.hypot(E,a)),B=(O===1?v:Math.atan(Math.tan(v)/O))*k;n.cpu[m]=t.elevM(_,B)||0}e.bindBuffer(e.ARRAY_BUFFER,n.glb),e.bufferSubData(e.ARRAY_BUFFER,n.done*4,n.cpu.subarray(n.done,y)),o-=y-n.done,n.done=y,n.done>=n.n?n.at=r:l=!0};for(const s of c.values()){const n=M(s,i);if(n&&(f(s,n.fills?.elev),f(s,n.lines?.elev)),f(s,s.points?.elev),o<=0){l=!0;break}}return l}function ue(t,r,{w:i,h:o},l){if(!e)return!1;const u=S?performance.now():0;if(e.viewport(0,0,i,o),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),!c.size||!X)return Z(i,o),!1;const f=t.dpr||1,s=t.zoom??0,n=r.mvp,d=new Float32Array(16),A=r.eye,y=R&&l?.terrainOn&&l.liftScale||0,m=se(l,u||performance.now(),s),E=a=>{e.useProgram(a.p),e.uniform2f(a.u.u_size,i,o),e.uniform1f(a.u.u_lift,y),F&&(l?.depth?l.depth.bind(e,a.p,3):a.u.u_sceneDepthOn&&e.uniform1f(a.u.u_sceneDepthOn,0))},P=(a,_)=>{for(let p=0;p<12;p++)d[p]=n[p];const v=_.origin;for(let p=0;p<4;p++)d[12+p]=n[p]*v[0]+n[4+p]*v[1]+n[8+p]*v[2]+n[12+p];const B=A[0]-v[0],q=A[1]-v[1],j=A[2]-v[2];e.uniformMatrix4fv(a.u.u_mvp,!1,d),e.uniform3f(a.u.u_origin,v[0],v[1],v[2]),e.uniform3f(a.u.u_eyeRel,B,q,j),e.uniform1f(a.u.u_oe,v[0]*B+v[1]*q+v[2]*j),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,_.tab),e.uniform1i(a.u.u_tab,0),e.uniform1i(a.u.u_tabW,_.tabW)};e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.disable(e.DEPTH_TEST),e.disable(e.CULL_FACE),E(D);for(const a of c.values()){const _=M(a,s);_?.fills&&(P(D,a),e.bindVertexArray(_.fills.vao),e.drawElements(e.TRIANGLES,_.fills.count,e.UNSIGNED_INT,0))}E(x),e.uniform2f(x.u.u_vp,i,o),e.uniform1f(x.u.u_dpr,f);for(const a of c.values()){const _=M(a,s);_?.lines&&(P(x,a),e.bindVertexArray(_.lines.vao),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,_.lines.nSeg))}E(h),e.uniform1f(h.u.u_dpr,f),e.uniform1f(h.u.u_maxPt,W);for(const a of c.values())a.points&&(P(h,a),e.bindVertexArray(a.points.vao),e.drawArrays(e.POINTS,0,a.points.n));if(e.bindVertexArray(null),Z(i,o),S){const a=performance.now()-u;T=I?T+(a-T)*.2:a,++I>=3&&g?.post?.({type:"perf",ms:T,n:I,chunks:c.size})}return m}function fe(){e&&(c.forEach(N),c.clear(),e.deleteProgram(D.p),e.deleteProgram(x.p),e.deleteProgram(h.p),e.getExtension("WEBGL_lose_context")?.loseContext(),e=null)}return{init:ie,message:le,frame:ue,destroy:fe}}export{De as create};
