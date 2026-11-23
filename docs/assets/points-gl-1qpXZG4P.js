import{g as se,r as _e,n as ce}from"./glprog-Ctpj38TF.js";import{d as ke}from"./glprog-Ctpj38TF.js";import{g as be}from"./renderworker-D_COh6DJ.js";import"./rangecache-flag-DUqD5ZxK.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";const H=`#version 300 es
precision highp float;
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec4 a_rgba;   // 点ごとの色（無い層は u_color）
layout(location = 2) in float a_size;  // 点ごとの半径（CSS px・無い層は u_size）
layout(location = 3) in float a_f;     // フィルタの値（getFilterValue・PR-6）
layout(location = 4) in vec3 a_pos0;   // トランジションの前の値（位置・色・半径・PR-6）
layout(location = 5) in vec4 a_rgba0;
layout(location = 6) in float a_size0;
uniform float u_perSize;   // 1＝a_size を使う
uniform float u_dpr;
uniform float u_maxPt;
uniform mat4 u_mvp;         // 層ごと＝mvp×平行移動(origin)
uniform vec3 u_origin;      // 層の原点
uniform vec3 u_eyeRel;      // eye − origin（倍精度で引いてから f32）
uniform float u_oe;         // dot(origin, eye − origin)（倍精度）
uniform float u_size;      // 半径（device px）
uniform vec2 u_att;        // 距離で幅（x＝誤差・世界単位・0＝切／y＝幅の上限 device px）
uniform float u_focal;     // 焦点距離（device px）＝P[1][1]×画面の高さの半分
uniform vec4 u_color;
uniform float u_perPoint;  // 1＝a_rgba を使う
uniform vec2 u_filter; uniform float u_filterOn;          // 範囲フィルタ（DataFilterExtension 相当）
uniform vec3 u_brush;                                      // ブラシ（x, y, r・device px・r ≤ 0＝無し・BrushingExtension 相当）
uniform vec2 u_half;                                       // canvas の半分（device px）
uniform sampler2D u_mask; uniform float u_maskOn; uniform vec4 u_maskBox; uniform float u_rAx;   // マスク（MaskExtension 相当）＝経緯度 bbox に張った R8 の画像
uniform float u_t; uniform float u_trans;                  // トランジション（0..1・u_trans＝1 で a_*0 と混ぜる）
uniform vec3 u_dOrigin;                                    // 前の層の原点 − 今の原点（倍精度で引く）＝a_pos0 は前の原点相対
out vec4 v_col;
out float v_size;
out float v_w;   // 奥行き（世界単位・EDL）
void main() {
	vec3 pos = u_trans > 0.5 ? mix(a_pos0 + u_dOrigin, a_pos, u_t) : a_pos;
	vec4 col = u_perPoint > 0.5 ? (u_trans > 0.5 ? mix(a_rgba0, a_rgba, u_t) : a_rgba) : u_color;
	float sz = u_perSize > 0.5 ? (u_trans > 0.5 ? mix(a_size0, a_size, u_t) : a_size) * u_dpr : u_size;
	v_col = col; v_size = min(u_maxPt * 0.5 - 1.0, sz);
	vec4 off = vec4(2.0, 2.0, 2.0, 1.0);
	if (u_filterOn > 0.5 && (a_f < u_filter.x || a_f > u_filter.y)) { gl_Position = off; gl_PointSize = 0.0; return; }
	// 地平線の向こう（球の裏側）は描かない：dot(P, eye − P) < 0。原点相対で（絶対座標の f32 は z11 で揺れる）
	if (u_oe - dot(u_origin, pos) + dot(pos, u_eyeRel) - dot(pos, pos) < 0.0) { gl_Position = off; gl_PointSize = 0.0; return; }
	if (u_maskOn > 0.5) {   // 点の経緯度（β 単位球 → 測地）を bbox の uv に
		vec3 P = pos + u_origin; float lon = degrees(atan(P.z, P.x)), beta = asin(clamp(P.y / length(P), -1.0, 1.0)), lat = degrees(atan(tan(beta) / u_rAx));
		vec2 uv = vec2((lon - u_maskBox.x) / (u_maskBox.z - u_maskBox.x), (lat - u_maskBox.y) / (u_maskBox.w - u_maskBox.y));
		if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || texture(u_mask, uv).r < 0.5) { gl_Position = off; gl_PointSize = 0.0; return; }
	}
	vec4 cpos = u_mvp * vec4(pos, 1.0);
	if (cpos.w <= 0.0) { gl_Position = off; gl_PointSize = 0.0; return; }
	if (u_brush.z > 0.0) { vec2 scr = vec2((cpos.x / cpos.w + 1.0) * u_half.x, (1.0 - cpos.y / cpos.w) * u_half.y); if (distance(scr, u_brush.xy) > u_brush.z) { gl_Position = off; gl_PointSize = 0.0; return; } }
	if (u_att.x > 0.0 && u_perSize < 0.5) v_size = min(u_maxPt * 0.5 - 1.0, max(0.5, min(u_att.x / cpos.w * u_focal, u_att.y) * 0.5));   // Cesium の attenuation＝min(誤差／奥行き×焦点, 上限) が幅
	v_w = cpos.w;
	gl_PointSize = v_size * 2.0 + 2.0;
	gl_Position = cpos;
}`,me=`#version 300 es
precision highp float;
in vec4 v_col;   // premultiplied でない RGBA
in float v_size;
uniform float u_square;   // 1 = square points (Cesium draws gl_PointSize squares)
out vec4 o;
void main() {
	vec2 p = (gl_PointCoord * 2.0 - 1.0) * (v_size + 1.0);
	float cov = u_square > 0.5 ? step(max(abs(p.x), abs(p.y)), v_size) : clamp(v_size + 0.5 - length(p), 0.0, 1.0);   // squares are hard-edged and exactly 2*v_size wide, like Cesium's gl_PointSize
	if (cov <= 0.0) discard;
	float a = v_col.a * cov;
	o = vec4(v_col.rgb * a, a);
}`,pe=`#version 300 es
precision highp float;
flat in highp uint v_id;
in float v_size;
uniform float u_square;
out vec4 o;
void main() {
	vec2 p = (gl_PointCoord * 2.0 - 1.0) * (v_size + 1.0);
	if ((u_square > 0.5 ? max(abs(p.x), abs(p.y)) + 0.5 : length(p)) > v_size + 0.5) discard;
	o = vec4(float(v_id & 255u), float((v_id >> 8) & 255u), float((v_id >> 16) & 255u), float((v_id >> 24) & 255u)) / 255.0;
}`,ve=`#version 300 es
precision highp float;
in vec4 v_col;
in float v_size;
in float v_w;
uniform float u_square;
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 o_d;
void main() {
	vec2 p = (gl_PointCoord * 2.0 - 1.0) * (v_size + 1.0);
	if ((u_square > 0.5 ? max(abs(p.x), abs(p.y)) + 0.5 : length(p)) > v_size + 0.5 || v_col.a < 0.5) discard;
	o = vec4(v_col.rgb, 1.0); o_d = vec4(v_w, 0.0, 0.0, 1.0);
}`,Ee=`#version 300 es
out vec2 v_uv;
void main() { vec2 q = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0; v_uv = q; gl_Position = vec4(q * 2.0 - 1.0, 0.0, 1.0); }`,xe=`#version 300 es
precision highp float;
uniform sampler2D u_col; uniform sampler2D u_dep; uniform vec2 u_texel; uniform vec2 u_distStr;
in vec2 v_uv;
out vec4 o;
vec2 nb(float l2, vec2 off) {   // (response, 1) or (0, 0) when the neighbour is empty: averaged over the neighbours present, as Cesium does
	float dist = u_distStr.x;
	float d0 = texture(u_dep, v_uv + off * floor(dist)).r, d1 = texture(u_dep, v_uv + off * ceil(dist)).r;
	if (d0 <= 0.0 || d1 <= 0.0) return vec2(0.0);
	return vec2(max(0.0, l2 - log2(mix(d0, d1, fract(dist)))), 1.0);
}
void main() {
	float d = texture(u_dep, v_uv).r;
	if (d <= 0.0) discard;
	float l2 = log2(d);
	vec2 rc = nb(l2, vec2(-u_texel.x, 0.0)) + nb(l2, vec2(u_texel.x, 0.0)) + nb(l2, vec2(0.0, -u_texel.y)) + nb(l2, vec2(0.0, u_texel.y));
	float r = rc.y > 0.0 ? rc.x / rc.y : 0.0;
	o = vec4(texture(u_col, v_uv).rgb * exp(-r * 300.0 * u_distStr.y), 1.0);
}`;function we(){const Q=H.replace("out vec4 v_col;","out vec4 v_col; flat out highp uint v_id; uniform highp uint u_base;").replace("v_col = col;","v_col = col; v_id = u_base + uint(gl_VertexID);");let e=null,k=null,Y={},U=1,y=null,W={},R=null,g=null,L=0,I=0;const f=new Map;function X(){let r=1;for(const t of f.values())t.base=r,r+=t.n}let F={size:3,color:[.9,.3,.2,.85]},V=null,K={},j=null,z={},h=null,B=[],O=null,Z=0,J=0,M=!0;function $(r,t){if(!M)return!1;if(!V){if(!e.getExtension("EXT_color_buffer_float"))return M=!1,console.warn("[points] eye dome lighting needs EXT_color_buffer_float"),!1;try{({p:V,u:K}=w(H,ve)),{p:j,u:z}=w(Ee,xe)}catch(i){return M=!1,console.warn("[points] eye dome lighting",i?.message),!1}}if(h&&Z===r&&J===t)return!0;for(const i of B)e.deleteTexture(i);h&&e.deleteFramebuffer(h),O&&e.deleteRenderbuffer(O);const n=i=>{const a=e.createTexture();e.bindTexture(e.TEXTURE_2D,a),e.texStorage2D(e.TEXTURE_2D,1,i,r,t);for(const l of[e.TEXTURE_MIN_FILTER,e.TEXTURE_MAG_FILTER])e.texParameteri(e.TEXTURE_2D,l,e.NEAREST);for(const l of[e.TEXTURE_WRAP_S,e.TEXTURE_WRAP_T])e.texParameteri(e.TEXTURE_2D,l,e.CLAMP_TO_EDGE);return a};return B=[n(e.RGBA8),n(e.R32F)],O=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,O),e.renderbufferStorage(e.RENDERBUFFER,e.DEPTH_COMPONENT24,r,t),h=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,h),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,B[0],0),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT1,e.TEXTURE_2D,B[1],0),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.RENDERBUFFER,O),e.drawBuffers([e.COLOR_ATTACHMENT0,e.COLOR_ATTACHMENT1]),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE?(M=!1,e.bindFramebuffer(e.FRAMEBUFFER,null),console.warn("[points] eye dome lighting: framebuffer incomplete"),!1):(Z=r,J=t,!0)}let S=null,d=null,T=null,A=null;const q=[],w=(r,t)=>se(e,r,t);function ee(r,t,n){if(A=n||null,e=r.getContext("webgl2",be({premultipliedAlpha:!0,antialias:!0,alpha:!0,depth:!1})),!e)throw new Error("WebGL2 is not available (points overlay)");({p:k,u:Y}=w(H,me));try{({p:y,u:W}=w(Q,pe))}catch(i){y=null,console.warn("[points] pick pass unavailable",i?.message)}U=e.getParameter(e.ALIASED_POINT_SIZE_RANGE)[1]}const N=r=>{if(r){for(const t of[r.buf,r.cbuf,r.sbuf,r.fbuf,...r.bufs0||[]])t&&!r.keep?.has(t)&&e.deleteBuffer(t);e.deleteVertexArray(r.vao),r.vao=null}};function re(r){if(r.type==="probe"){q.push(r.id),A?.requestDraw?.();return}if(e)if(r.type==="layer"){const t=f.get(r.q),n=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,r.pos,e.STATIC_DRAW);const i=e.createVertexArray();e.bindVertexArray(i),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0);const a=(p,s,o,_,c)=>{const b=e.createBuffer();return e.bindBuffer(e.ARRAY_BUFFER,b),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW),e.enableVertexAttribArray(p),e.vertexAttribPointer(p,o,_,c,0,0),b},l=r.rgba?a(1,r.rgba,4,e.UNSIGNED_BYTE,!0):(e.disableVertexAttribArray(1),null),v=r.size?a(2,r.size,1,e.FLOAT,!1):(e.disableVertexAttribArray(2),null),E=r.f?a(3,r.f,1,e.FLOAT,!1):(e.disableVertexAttribArray(3),null);let x=null,m=[];if(r.transition&&t&&t.n===r.n&&t.vao){const p=+r.transition.duration||+r.transition||300,s=(c,b,P,D,u)=>{e.bindBuffer(e.ARRAY_BUFFER,b),e.enableVertexAttribArray(c),e.vertexAttribPointer(c,P,D,u,0,0),m.push(b)};s(4,t.buf,3,e.FLOAT,!1),l&&t.cbuf?s(5,t.cbuf,4,e.UNSIGNED_BYTE,!0):l?s(5,l,4,e.UNSIGNED_BYTE,!0):e.disableVertexAttribArray(5),v&&t.sbuf?s(6,t.sbuf,1,e.FLOAT,!1):v?s(6,v,1,e.FLOAT,!1):e.disableVertexAttribArray(6);const o=t.origin||[0,0,0],_=r.origin||[0,0,0];x={start:performance.now(),dur:p,dOrigin:[o[0]-_[0],o[1]-_[1],o[2]-_[2]]},t.keep=new Set(m)}else e.disableVertexAttribArray(4),e.disableVertexAttribArray(5),e.disableVertexAttribArray(6);e.bindVertexArray(null),N(t),f.set(r.q,{n:r.n,buf:n,cbuf:l,sbuf:v,fbuf:E,vao:i,perPoint:!!r.rgba,perSize:!!r.size,hasF:!!r.f,origin:r.origin||null,on:!0,pos:r.pos,base:0,filter:t?.filter??null,trans:x,bufs0:x?m.filter(p=>p!==l&&p!==v):[],att:r.att??null}),X(),A?.requestDraw?.()}else if(r.type==="remove")N(f.get(r.q)),f.delete(r.q),X();else if(r.type==="vis"){const t=f.get(r.q);t&&(t.on=!!r.on)}else if(r.type==="clear")f.forEach(N),f.clear(),X();else if(r.type==="style")F={...F,...r};else if(r.type==="att"){const t=f.get(r.q);t&&(t.att=r.att,A?.requestDraw?.())}else if(r.type==="paint"){const t=f.get(r.q);if(!t||!t.vao)return;e.bindVertexArray(t.vao);const n=(i,a,l,v,E,x)=>{const m=a??e.createBuffer();return e.bindBuffer(e.ARRAY_BUFFER,m),e.bufferData(e.ARRAY_BUFFER,l,e.STATIC_DRAW),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,v,E,x,0,0),m};r.rgba&&(t.cbuf=n(1,t.cbuf,r.rgba,4,e.UNSIGNED_BYTE,!0),t.perPoint=!0),r.size?(t.sbuf=n(2,t.sbuf,r.size,1,e.FLOAT,!1),t.perSize=!0):r.size===null&&t.sbuf&&(e.deleteBuffer(t.sbuf),t.sbuf=null,e.disableVertexAttribArray(2),t.perSize=!1),e.bindVertexArray(null),A?.requestDraw?.()}else if(r.type==="filter"){const t=r.range?[+r.range[0],+r.range[1]]:null;if(r.q!=null){const n=f.get(r.q);n&&(n.filter=t)}else for(const n of f.values())n.filter=t;A?.requestDraw?.()}else r.type==="brush"?(S=r.x!=null&&r.r>0?{x:r.x,y:r.y,r:r.r}:null,A?.requestDraw?.()):r.type==="mask"&&(T&&(e.deleteTexture(T),T=null),d=null,r.data&&r.w&&r.h&&(T=e.createTexture(),e.bindTexture(e.TEXTURE_2D,T),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.R8,r.w,r.h,0,e.RED,e.UNSIGNED_BYTE,r.data),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),d={bbox:r.bbox,w:r.w,h:r.h}),A?.requestDraw?.())}const te=()=>({brush:S,mask:d?.bbox??null,layers:[...f].map(([r,t])=>({q:r,n:t.n,filter:t.filter,trans:!!t.trans}))});function ie(r,t){if(!q.length)return;const n=q.splice(0);try{const i=new Uint8Array(r*t*4);e.readPixels(0,0,r,t,e.RGBA,e.UNSIGNED_BYTE,i);for(const a of n)A?.post?.({type:"pixels",id:a,w:r,h:t,flipY:!0,data:a===n[n.length-1]?i:i.slice()})}catch(i){for(const a of n)A?.post?.({type:"pixels",id:a,error:String(i?.message||i)})}}let C=1;function oe(r,t,n,i){return i?.rAx&&(C=i.rAx),ne(r,t,n),e&&ie(n.w,n.h),[...f.values()].some(a=>a.trans)}function ne(r,t,{w:n,h:i}){if(!e||(e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,n,i),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),!f.size))return!1;const a=r.dpr||1;return F.edl&&$(n,i)?(e.bindFramebuffer(e.FRAMEBUFFER,h),e.clearBufferfv(e.COLOR,0,[0,0,0,0]),e.clearBufferfv(e.COLOR,1,[0,0,0,0]),e.clearBufferfv(e.DEPTH,0,[1]),e.disable(e.BLEND),e.enable(e.DEPTH_TEST),e.depthFunc(e.LESS),G(V,K,t,a,!1,n,i),e.disable(e.DEPTH_TEST),e.bindFramebuffer(e.FRAMEBUFFER,null),e.useProgram(j),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,B[0]),e.uniform1i(z.u_col,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,B[1]),e.uniform1i(z.u_dep,2),e.uniform2f(z.u_texel,1/n,1/i),e.uniform2f(z.u_distStr,F.edl[1]*a,F.edl[0]),e.bindVertexArray(null),e.drawArrays(e.TRIANGLES,0,3),e.activeTexture(e.TEXTURE0),!1):(e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),G(k,Y,t,a,!1,n,i),!1)}function G(r,t,n,i,a,l,v){e.useProgram(r);const E=n.mvp,x=new Float32Array(16),m=new Float32Array(E),p=n.eye,s=performance.now();e.uniform1f(t.u_size,Math.min(U*.5-1,F.size*i)),e.uniform1f(t.u_dpr,i),e.uniform1f(t.u_maxPt,U),e.uniform1f(t.u_square,F.square?1:0),e.uniform2f(t.u_half,l/2,v/2),e.uniform1f(t.u_focal,n.projection[5]*v/2),S?e.uniform3f(t.u_brush,S.x*i,S.y*i,S.r*i):e.uniform3f(t.u_brush,0,0,0),d&&T?(e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,T),e.uniform1i(t.u_mask,0),e.uniform1f(t.u_maskOn,1),e.uniform4f(t.u_maskBox,d.bbox[0],d.bbox[1],d.bbox[2],d.bbox[3]),e.uniform1f(t.u_rAx,C||1)):(e.uniform1f(t.u_maskOn,0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,null)),a||e.uniform4fv(t.u_color,new Float32Array(F.color));for(const o of f.values()){if(!o.on)continue;const _=o.origin;if(_){for(let u=0;u<12;u++)x[u]=E[u];for(let u=0;u<4;u++)x[12+u]=E[u]*_[0]+E[4+u]*_[1]+E[8+u]*_[2]+E[12+u];e.uniformMatrix4fv(t.u_mvp,!1,x),e.uniform3f(t.u_origin,_[0],_[1],_[2])}else e.uniformMatrix4fv(t.u_mvp,!1,m),e.uniform3f(t.u_origin,0,0,0);const c=_||[0,0,0],b=p[0]-c[0],P=p[1]-c[1],D=p[2]-c[2];if(e.uniform3f(t.u_eyeRel,b,P,D),e.uniform1f(t.u_oe,c[0]*b+c[1]*P+c[2]*D),a&&e.uniform1ui(t.u_base,o.base),e.uniform1f(t.u_filterOn,o.filter&&o.hasF?1:0),o.filter&&e.uniform2f(t.u_filter,o.filter[0],o.filter[1]),o.trans&&!a&&s-o.trans.start>=o.trans.dur){e.bindVertexArray(o.vao);for(const u of[4,5,6])e.disableVertexAttribArray(u);e.bindVertexArray(null);for(const u of o.bufs0)e.deleteBuffer(u);o.bufs0=[],o.trans=null}if(o.trans){const u=Math.min(1,(s-o.trans.start)/o.trans.dur);e.uniform1f(t.u_t,u),e.uniform1f(t.u_trans,1),e.uniform3f(t.u_dOrigin,o.trans.dOrigin[0],o.trans.dOrigin[1],o.trans.dOrigin[2])}else e.uniform1f(t.u_trans,0),e.uniform1f(t.u_t,1);o.att?e.uniform2f(t.u_att,o.att[0],o.att[1]*i):e.uniform2f(t.u_att,0,0),e.uniform1f(t.u_perPoint,o.perPoint?1:0),e.uniform1f(t.u_perSize,o.perSize?1:0),e.bindVertexArray(o.vao),e.drawArrays(e.POINTS,0,o.n)}e.bindVertexArray(null)}function ae(r,t,n,i){if(!e||!y||!f.size||!i?.s)return null;const{w:a,h:l}=i.size,v=i.cam?.dpr||1;L!==a||I!==l||!R?(g&&e.deleteTexture(g),R&&e.deleteFramebuffer(R),g=e.createTexture(),e.bindTexture(e.TEXTURE_2D,g),e.texStorage2D(e.TEXTURE_2D,1,e.RGBA8,a,l),R=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,R),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,g,0),L=a,I=l):e.bindFramebuffer(e.FRAMEBUFFER,R),e.viewport(0,0,a,l),e.disable(e.BLEND),e.disable(e.DEPTH_TEST),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),C=i.api?.rAx||C,G(y,W,i.s,v,!0,a,l);const{data:E,side:x}=_e(e,r,t,n,a,l);e.bindFramebuffer(e.FRAMEBUFFER,null);const m=ce(E,x,!0);if(!m)return null;let p=null,s=null;for(const[c,b]of f)if(m.id>=b.base&&m.id<b.base+b.n){p=c,s=b;break}if(!s)return null;const o=m.id-s.base;let _=null;if(s.pos&&s.pos.length>=o*3+3){const c=s.origin||[0,0,0],b=s.pos[o*3]+c[0],P=s.pos[o*3+1]+c[1],D=s.pos[o*3+2]+c[2],u=i.api?.rAx||1,fe=Math.atan2(D,b)*180/Math.PI,le=Math.asin(Math.max(-1,Math.min(1,P/Math.hypot(b,P,D))));_=[fe,Math.atan(Math.tan(le)/u)*180/Math.PI]}return{id:m.id,q:p,index:o,distance:m.distance,lngLat:_,properties:{q:p,index:o}}}function ue(){e&&(f.forEach(r=>{r.keep=null,N(r)}),f.clear(),T&&e.deleteTexture(T),T=null,d=null,e.deleteProgram(k),y&&e.deleteProgram(y),g&&e.deleteTexture(g),R&&e.deleteFramebuffer(R),y=g=R=null,L=I=0,e.getExtension("WEBGL_lose_context")?.loseContext(),e=null)}return{init:ee,message:re,_state:te,frame:oe,pick:ae,destroy:ue}}export{we as create,ke as decodeId,ce as nearestId};
