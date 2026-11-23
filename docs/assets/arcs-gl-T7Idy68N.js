import{g as te,r as re,n as ie}from"./glprog-Ctpj38TF.js";import{d as Pe}from"./glprog-Ctpj38TF.js";import{g as ae}from"./renderworker-D_COh6DJ.js";import"./rangecache-flag-DUqD5ZxK.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";const K=`#version 300 es
precision highp float;
layout(location = 0) in vec2 a_tv;      // 頂点ごと：t（0..1）と側（−1/+1）
layout(location = 1) in vec3 a_src;     // 以下インスタンス（弧）ごと
layout(location = 2) in vec3 a_dst;
layout(location = 3) in float a_theta;
layout(location = 4) in vec4 a_c0;
layout(location = 5) in vec4 a_c1;
layout(location = 6) in float a_w;      // 幅（CSS px）
layout(location = 7) in float a_h;      // 高さ（弦長比）
layout(location = 8) in float a_f;      // フィルタの値（PR-6）
uniform vec2 u_filter; uniform float u_filterOn;
uniform vec3 u_brush;                                      // ブラシ（x, y, r・device px）＝始点か終点が中なら描く
uniform sampler2D u_mask; uniform float u_maskOn; uniform vec4 u_maskBox; uniform float u_rAx;   // マスク＝始点の経緯度で
uniform mat4 u_mvp;        // 層ごと＝mvp×平行移動(origin)
uniform vec3 u_origin;
uniform vec3 u_eyeRel;     // eye − origin（倍精度で引いてから f32）
uniform float u_oe;        // dot(origin, eye − origin)（倍精度）
uniform vec2 u_half;       // canvas の半分（device px）
uniform float u_dpr;
uniform float u_seg;
out vec4 v_col;
out float v_side;          // 中心からの距離（device px・符号付き）
out float v_half;          // 幅の半分（device px）
out float v_hid;           // 地平線の判定＝dot(P, eye − P)（< 0 なら球の裏）。頂点で捨てずに FS で discard（帯の片側だけ消えて角へ伸びる棘を作らない）
vec3 arcRel(float t) {
	float th = a_theta, cA, cB;
	if (th < 1e-4) { cA = 1.0 - t; cB = t; } else { float s = sin(th); cA = sin((1.0 - t) * th) / s; cB = sin(t * th) / s; }
	vec3 rel = cA * a_src + cB * a_dst + (cA + cB - 1.0) * u_origin;
	float hh = 4.0 * a_h * 2.0 * sin(th * 0.5) * t * (1.0 - t);
	return hh > 0.0 ? rel + normalize(rel + u_origin) * hh : rel;
}
bool masked(vec3 rel) {
	vec3 P = rel + u_origin; float lon = degrees(atan(P.z, P.x)), beta = asin(clamp(P.y / length(P), -1.0, 1.0)), lat = degrees(atan(tan(beta) / u_rAx));
	vec2 uv = vec2((lon - u_maskBox.x) / (u_maskBox.z - u_maskBox.x), (lat - u_maskBox.y) / (u_maskBox.w - u_maskBox.y));
	return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || texture(u_mask, uv).r < 0.5;
}
vec2 scr(vec3 rel) { vec4 c = u_mvp * vec4(rel, 1.0); return vec2((c.x / c.w + 1.0) * u_half.x, (1.0 - c.y / c.w) * u_half.y); }
void main() {
	float t = a_tv.x, side = a_tv.y;
	v_col = mix(a_c0, a_c1, t);
	vec4 off = vec4(2.0, 2.0, 2.0, 1.0);
	if (u_filterOn > 0.5 && (a_f < u_filter.x || a_f > u_filter.y)) { gl_Position = off; return; }
	if (u_maskOn > 0.5 && masked(a_src)) { gl_Position = off; return; }
	if (u_brush.z > 0.0 && distance(scr(a_src), u_brush.xy) > u_brush.z && distance(scr(a_dst), u_brush.xy) > u_brush.z) { gl_Position = off; return; }
	vec3 p0 = arcRel(t);
	// dot(P, eye − P) を原点相対で：P = O + rel, eye − P = eyeRel − rel → dot(O, eyeRel) − dot(O, rel) + dot(rel, eyeRel) − dot(rel, rel)（絶対座標の f32 では z11 で判定が揺れ、棘になった）
	v_hid = u_oe - dot(u_origin, p0) + dot(p0, u_eyeRel) - dot(p0, p0);
	float dt = 1.0 / u_seg, sgn = t < 1.0 ? 1.0 : -1.0;
	vec3 p1 = arcRel(t + sgn * dt);
	vec4 c0 = u_mvp * vec4(p0, 1.0), c1 = u_mvp * vec4(p1, 1.0);
	if (c0.w <= 0.0) { gl_Position = off; return; }
	if (c1.w <= 0.0) c1 = c0 + vec4(1e-3, 0.0, 0.0, 0.0);
	vec2 s0 = c0.xy / c0.w * u_half, s1 = c1.xy / c1.w * u_half;
	vec2 tg = (s1 - s0) * sgn; float L = length(tg); tg = L > 1e-6 ? tg / L : vec2(1.0, 0.0);
	vec2 nrm = vec2(-tg.y, tg.x);
	float halfW = a_w * u_dpr * 0.5;
	v_half = halfW; v_side = side * (halfW + 0.5);
	gl_Position = c0; gl_Position.xy += nrm * v_side / u_half * c0.w;
}`,oe=`#version 300 es
precision highp float;
in vec4 v_col; in float v_side; in float v_half; in float v_hid;
out vec4 o;
void main() {
	if (v_hid < 0.0) discard;
	float cov = clamp(v_half + 0.5 - abs(v_side), 0.0, 1.0);
	if (cov <= 0.0) discard;
	float a = v_col.a * cov;
	o = vec4(v_col.rgb * a, a);
}`,ne=`#version 300 es
precision highp float;
flat in highp uint v_id; in float v_side; in float v_half; in float v_hid;
out vec4 o;
void main() {
	if (v_hid < 0.0) discard;
	if (abs(v_side) > v_half + 0.5) discard;
	o = vec4(float(v_id & 255u), float((v_id >> 8) & 255u), float((v_id >> 16) & 255u), float((v_id >> 24) & 255u)) / 255.0;
}`,le=(c,e)=>Math.acos(Math.max(-1,Math.min(1,(c[0]*e[0]+c[1]*e[1]+c[2]*e[2])/(Math.hypot(c[0],c[1],c[2])*Math.hypot(e[0],e[1],e[2])||1))));function de(c,e,x,O=0,_=le(c,e)){let R,f;if(_<1e-4)R=1-x,f=x;else{const F=Math.sin(_);R=Math.sin((1-x)*_)/F,f=Math.sin(x*_)/F}const s=[R*c[0]+f*e[0],R*c[1]+f*e[1],R*c[2]+f*e[2]],D=4*O*2*Math.sin(_/2)*x*(1-x);if(D>0){const F=Math.hypot(s[0],s[1],s[2])||1;for(let v=0;v<3;v++)s[v]+=s[v]/F*D}return s}function Te(){const c=K.replace("out vec4 v_col;","out vec4 v_col; flat out highp uint v_id; uniform highp uint u_base;").replace("v_col = mix(a_c0, a_c1, t);","v_col = mix(a_c0, a_c1, t); v_id = u_base + uint(gl_InstanceID);");let e=null,x=null,O={},_=null,R={},f=null,s=null,D=0,F=0,v=null,I=0,G=0;const n=new Map;function C(){let t=1;for(const r of n.values())r.base=t,t+=r.n}let P={width:2,color:[.2,.6,1,.9],color2:null,height:.3,segments:32},L=null,w=null,g=null,N=1,k=null;const X=[],Y=(t,r)=>te(e,t,r);function q(t){if(v&&I===t)return;t=Math.max(2,Math.min(256,t|0));const r=new Float32Array((t+1)*4);for(let i=0;i<=t;i++){const a=i/t;r[i*4]=a,r[i*4+1]=-1,r[i*4+2]=a,r[i*4+3]=1}v??=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,v),e.bufferData(e.ARRAY_BUFFER,r,e.STATIC_DRAW),I=t,G=(t+1)*2;for(const i of n.values())W(i)}function W(t){e.bindVertexArray(t.vao),e.bindBuffer(e.ARRAY_BUFFER,v),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.vertexAttribDivisor(0,0),e.bindVertexArray(null)}function j(t,r,i){if(k=i||null,e=t.getContext("webgl2",ae({premultipliedAlpha:!0,antialias:!0,alpha:!0,depth:!1})),!e)throw new Error("WebGL2 is not available (arcs overlay)");({p:x,u:O}=Y(K,oe));try{({p:_,u:R}=Y(c,ne))}catch(a){_=null,console.warn("[arcs] pick pass unavailable",a?.message)}q(P.segments)}const S=t=>{if(t){for(const r of t.bufs)e.deleteBuffer(r);e.deleteVertexArray(t.vao)}};function J(t){if(t.type==="probe"){X.push(t.id),k?.requestDraw?.();return}if(e){if(t.type==="layer"){S(n.get(t.q));const r=e.createVertexArray(),i=[],a={n:t.n,bufs:i,vao:r,has:{c:!!t.rgba,c2:!!t.rgba2,w:!!t.width,h:!!t.height},src:t.src,dst:t.dst,origin:t.origin||null,on:!0,base:0};W(a),e.bindVertexArray(r);const o=(u,B,m,E,A)=>{const y=e.createBuffer();i.push(y),e.bindBuffer(e.ARRAY_BUFFER,y),e.bufferData(e.ARRAY_BUFFER,B,e.STATIC_DRAW),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,m,E,A,0,0),e.vertexAttribDivisor(u,1)};o(1,t.src,3,e.FLOAT,!1),o(2,t.dst,3,e.FLOAT,!1),o(3,t.theta,1,e.FLOAT,!1),t.rgba?o(4,t.rgba,4,e.UNSIGNED_BYTE,!0):e.disableVertexAttribArray(4),t.rgba2?o(5,t.rgba2,4,e.UNSIGNED_BYTE,!0):t.rgba?(e.bindBuffer(e.ARRAY_BUFFER,i[3]),e.enableVertexAttribArray(5),e.vertexAttribPointer(5,4,e.UNSIGNED_BYTE,!0,0,0),e.vertexAttribDivisor(5,1),a.has.c2=!0):e.disableVertexAttribArray(5),t.width?o(6,t.width,1,e.FLOAT,!1):e.disableVertexAttribArray(6),t.height?o(7,t.height,1,e.FLOAT,!1):e.disableVertexAttribArray(7),t.f?(o(8,t.f,1,e.FLOAT,!1),a.has.f=!0):e.disableVertexAttribArray(8),e.bindVertexArray(null),a.filter=n.get(t.q)?.filter??null,n.set(t.q,a),C()}else if(t.type==="remove")S(n.get(t.q)),n.delete(t.q),C();else if(t.type==="vis"){const r=n.get(t.q);r&&(r.on=!!t.on)}else if(t.type==="clear")n.forEach(S),n.clear(),C();else if(t.type==="style")P={...P,...t},t.segments&&q(t.segments);else if(t.type==="filter"){const r=t.range?[+t.range[0],+t.range[1]]:null;if(t.q!=null){const i=n.get(t.q);i&&(i.filter=r)}else for(const i of n.values())i.filter=r}else t.type==="brush"?L=t.x!=null&&t.r>0?{x:t.x,y:t.y,r:t.r}:null:t.type==="mask"&&(g&&(e.deleteTexture(g),g=null),w=null,t.data&&t.w&&t.h&&(g=e.createTexture(),e.bindTexture(e.TEXTURE_2D,g),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.R8,t.w,t.h,0,e.RED,e.UNSIGNED_BYTE,t.data),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),w={bbox:t.bbox,w:t.w,h:t.h}));k?.requestDraw?.()}}function Q(t,r){if(!X.length)return;const i=X.splice(0);try{const a=new Uint8Array(t*r*4);e.readPixels(0,0,t,r,e.RGBA,e.UNSIGNED_BYTE,a);for(const o of i)k?.post?.({type:"pixels",id:o,w:t,h:r,flipY:!0,data:o===i[i.length-1]?a:a.slice()})}catch(a){for(const o of i)k?.post?.({type:"pixels",id:o,error:String(a?.message||a)})}}function Z(t,r,i,a){return e&&(a?.rAx&&(N=a.rAx),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,i.w,i.h),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),n.size&&(e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),z(x,O,r,t.dpr||1,i,!1)),Q(i.w,i.h)),!1}function z(t,r,i,a,{w:o,h:u},B){e.useProgram(t);const m=i.mvp,E=new Float32Array(16),A=new Float32Array(m),y=i.eye;e.uniform2f(r.u_half,o/2,u/2),e.uniform1f(r.u_dpr,a),e.uniform1f(r.u_seg,I),L?e.uniform3f(r.u_brush,L.x*a,L.y*a,L.r*a):e.uniform3f(r.u_brush,0,0,0),w&&g?(e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,g),e.uniform1i(r.u_mask,0),e.uniform1f(r.u_maskOn,1),e.uniform4f(r.u_maskBox,w.bbox[0],w.bbox[1],w.bbox[2],w.bbox[3]),e.uniform1f(r.u_rAx,N)):(e.uniform1f(r.u_maskOn,0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,null));const b=P.color,d=P.color2||P.color;for(const l of n.values()){if(!l.on)continue;const p=l.origin;if(p){for(let h=0;h<12;h++)E[h]=m[h];for(let h=0;h<4;h++)E[12+h]=m[h]*p[0]+m[4+h]*p[1]+m[8+h]*p[2]+m[12+h];e.uniformMatrix4fv(r.u_mvp,!1,E),e.uniform3f(r.u_origin,p[0],p[1],p[2])}else e.uniformMatrix4fv(r.u_mvp,!1,A),e.uniform3f(r.u_origin,0,0,0);const T=p||[0,0,0],U=y[0]-T[0],V=y[1]-T[1],M=y[2]-T[2];e.uniform3f(r.u_eyeRel,U,V,M),e.uniform1f(r.u_oe,T[0]*U+T[1]*V+T[2]*M),B&&e.uniform1ui(r.u_base,l.base),e.uniform1f(r.u_filterOn,l.filter&&l.has.f?1:0),l.filter&&e.uniform2f(r.u_filter,l.filter[0],l.filter[1]),e.bindVertexArray(l.vao),l.has.f||e.vertexAttrib1f(8,0),l.has.c||e.vertexAttrib4f(4,b[0],b[1],b[2],b[3]??1),l.has.c2||e.vertexAttrib4f(5,d[0],d[1],d[2],d[3]??1),l.has.w||e.vertexAttrib1f(6,P.width),l.has.h||e.vertexAttrib1f(7,P.height),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,G,l.n)}e.bindVertexArray(null)}const H=(t,r,i,a)=>{if(!t||t.length<r*3+3)return null;const o=t[r*3]+i[0],u=t[r*3+1]+i[1],B=t[r*3+2]+i[2],m=Math.atan2(B,o)*180/Math.PI,E=Math.asin(Math.max(-1,Math.min(1,u/Math.hypot(o,u,B))));return[m,Math.atan(Math.tan(E)/a)*180/Math.PI]};function $(t,r,i,a){if(!e||!_||!n.size||!a?.s)return null;const{w:o,h:u}=a.size,B=a.cam?.dpr||1;D!==o||F!==u||!f?(s&&e.deleteTexture(s),f&&e.deleteFramebuffer(f),s=e.createTexture(),e.bindTexture(e.TEXTURE_2D,s),e.texStorage2D(e.TEXTURE_2D,1,e.RGBA8,o,u),f=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,f),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0),D=o,F=u):e.bindFramebuffer(e.FRAMEBUFFER,f),e.viewport(0,0,o,u),e.disable(e.BLEND),e.disable(e.DEPTH_TEST),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),N=a.api?.rAx||N,z(_,R,a.s,B,{w:o,h:u},!0);const{data:m,side:E}=re(e,t,r,i,o,u);e.bindFramebuffer(e.FRAMEBUFFER,null);const A=ie(m,E);if(!A)return null;let y=null,b=null;for(const[V,M]of n)if(A.id>=M.base&&A.id<M.base+M.n){y=V,b=M;break}if(!b)return null;const d=A.id-b.base,l=b.origin||[0,0,0],p=a.api?.rAx||1,T=H(b.src,d,l,p),U=H(b.dst,d,l,p);return{id:A.id,q:y,index:d,distance:A.distance,lngLat:T,properties:{q:y,index:d,source:T,target:U}}}function ee(){e&&(n.forEach(S),n.clear(),g&&e.deleteTexture(g),g=null,w=null,e.deleteProgram(x),_&&e.deleteProgram(_),s&&e.deleteTexture(s),f&&e.deleteFramebuffer(f),v&&e.deleteBuffer(v),v=null,I=0,_=s=f=null,D=F=0,e.getExtension("WEBGL_lose_context")?.loseContext(),e=null)}return{init:j,message:J,frame:Z,pick:$,destroy:ee}}export{de as arcPoint,le as arcTheta,Te as create,Pe as decodeId};
