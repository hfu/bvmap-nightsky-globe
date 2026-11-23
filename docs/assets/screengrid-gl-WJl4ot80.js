import{l as O}from"./rangecache-flag-DUqD5ZxK.js";import{g as V}from"./renderworker-D_COh6DJ.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";const G=`#version 300 es
precision highp float;
layout(location=0) in vec3 a_pos;
layout(location=1) in float a_w;
uniform mat4 u_mvp; uniform vec3 u_eye; uniform vec2 u_scr; uniform vec2 u_grid; uniform float u_cell; uniform float u_count;
out float v_w;
void main() {
	gl_PointSize = 1.0; v_w = u_count > 0.5 ? 1.0 : a_w;
	vec4 c = u_mvp * vec4(a_pos, 1.0);
	vec2 s = vec2((c.x / c.w * 0.5 + 0.5) * u_scr.x, (0.5 - c.y / c.w * 0.5) * u_scr.y);   // 画面の device px（左上から）
	bool ok = dot(a_pos, u_eye) > 1.0 && c.w > 0.0 && s.x >= 0.0 && s.y >= 0.0 && s.x < u_scr.x && s.y < u_scr.y;   // 裏・画面外は数えない
	vec2 cr = floor(s / u_cell);
	gl_Position = ok ? vec4((cr + 0.5) / u_grid * 2.0 - 1.0, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
}`,Y=`#version 300 es
precision highp float;
in float v_w; out vec4 o;
void main() { o = vec4(v_w, 0.0, 0.0, 1.0); }`,k=`#version 300 es
precision highp float;
uniform sampler2D u_g; uniform int u_cols; out float v_v;
void main() {
	gl_PointSize = 1.0;
	vec4 g = texelFetch(u_g, ivec2(gl_VertexID % u_cols, gl_VertexID / u_cols), 0);
	v_v = g.a > 0.0 ? g.r : 0.0;
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}`,q=`#version 300 es
precision highp float;
in float v_v; out vec4 o;
void main() { o = vec4(v_v, 0.0, 0.0, 1.0); }`,H=`#version 300 es
layout(location=0) in vec2 a_corner;
void main() { gl_Position = vec4(a_corner, 0.0, 1.0); }`,W=`#version 300 es
precision highp float;
uniform sampler2D u_g; uniform sampler2D u_mx; uniform sampler2D u_cr; uniform int u_n; uniform float u_cell; uniform float u_gap; uniform float u_h; uniform float u_opacity;
out vec4 o;
void main() {
	vec2 s = vec2(gl_FragCoord.x, u_h - gl_FragCoord.y);   // 画面の device px（左上から）
	vec2 cr = floor(s / u_cell), l = s - cr * u_cell;
	if (l.x < u_gap * 0.5 || l.y < u_gap * 0.5 || l.x >= u_cell - u_gap * 0.5 || l.y >= u_cell - u_gap * 0.5) discard;   // 隙間（旧 fillRect の内側と同じ）
	vec4 g = texelFetch(u_g, ivec2(cr), 0);
	float mx = texelFetch(u_mx, ivec2(0), 0).r;
	if (g.a <= 0.0 || mx <= 0.0) discard;
	int k = min(u_n - 1, int(floor(g.r / mx * float(u_n))));
	vec4 c = texelFetch(u_cr, ivec2(k, 0), 0);
	float a = c.a * u_opacity;
	o = vec4(c.rgb * a, a);
}`;function ae(){let e=null,T=null,s=null,R=null,c=null,p=null,g=null,U=null,F=null,x=null,E=0,B=!1,v=null,D=0,m=null,A=null,d=null,_={cellPx:24,colorRange:[[255,255,178,40],[254,217,118,120],[254,178,76,170],[253,141,60,200],[240,59,32,230],[189,0,38,255]],agg:"sum",opacity:1,gap:1},f=null;const b=[];function y(t,n,o){const r=e.createProgram();for(const[u,a]of[[e.VERTEX_SHADER,t],[e.FRAGMENT_SHADER,n]]){const i=e.createShader(u);if(e.shaderSource(i,a),e.compileShader(i),!e.getShaderParameter(i,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(i));e.attachShader(r,i)}if(e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(r));const l={};for(const u of o)l[u]=e.getUniformLocation(r,u);return{p:r,u:l}}function N(t,n,o){T=o||null,e=t.getContext("webgl2",V({premultipliedAlpha:!0,antialias:!1,alpha:!0,depth:!1}));const r=!!e.getExtension("EXT_color_buffer_float");d=r&&e.getExtension("EXT_float_blend")?{i:e.RGBA32F,t:e.FLOAT}:r||e.getExtension("EXT_color_buffer_half_float")?{i:e.RGBA16F,t:e.HALF_FLOAT}:{i:e.RGBA8,t:e.UNSIGNED_BYTE},s=y(G,Y,["u_mvp","u_eye","u_scr","u_grid","u_cell","u_count"]),R=y(k,q,["u_g","u_cols"]),c=y(H,W,["u_g","u_mx","u_cr","u_n","u_cell","u_gap","u_h","u_opacity"]),g=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,g),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),p=e.createVertexArray(),U=e.createVertexArray(),v=e.createTexture(),S()}function S(){const t=_.colorRange?.length?_.colorRange:[[255,255,255,255]],n=new Uint8Array(t.length*4);t.forEach((o,r)=>{n[r*4]=o[0],n[r*4+1]=o[1],n[r*4+2]=o[2],n[r*4+3]=o[3]??255}),e.bindTexture(e.TEXTURE_2D,v),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,t.length,1,0,e.RGBA,e.UNSIGNED_BYTE,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),D=t.length}function P(t){if(t.type==="probe"){b.push(t.id),T?.requestDraw?.();return}if(e){if(t.type==="data"){E=t.lon.length,B=!!t.w;const n=new Float32Array(E*3);for(let o=0;o<E;o++){const r=O(t.lon[o],t.lat[o]);n[o*3]=r[0],n[o*3+1]=r[1],n[o*3+2]=r[2]}F??=e.createBuffer(),x??=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,F),e.bufferData(e.ARRAY_BUFFER,n,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,x),e.bufferData(e.ARRAY_BUFFER,t.w||new Float32Array(E).fill(1),e.STATIC_DRAW),e.bindVertexArray(p),e.bindBuffer(e.ARRAY_BUFFER,F),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,x),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,1,e.FLOAT,!1,0,0),e.bindVertexArray(null)}else if(t.type==="style"){const{type:n,...o}=t;_={..._,...o},t.colorRange&&S()}else t.type==="clear"&&(E=0,f=null);T?.requestDraw?.()}}const h=(t,n,o)=>{if(t&&t.w===n&&t.h===o)return t;t&&(e.deleteTexture(t.tex),e.deleteFramebuffer(t.fbo));const r=e.createTexture();e.bindTexture(e.TEXTURE_2D,r),e.texStorage2D(e.TEXTURE_2D,1,d.i,n,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST);const l=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,l),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,r,0),{tex:r,fbo:l,w:n,h:o}};function X(t,n,{w:o,h:r}){return e&&(e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,o,r),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),f=null,E&&I(t,n,o,r),L(o,r)),!1}function I(t,n,o,r){const l=t.dpr||1,u=Math.max(2,_.cellPx*l),a=Math.ceil(o/u),i=Math.ceil(r/u);m=h(m,a,i),e.bindFramebuffer(e.FRAMEBUFFER,m.fbo),e.viewport(0,0,a,i),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.blendEquationSeparate(_.agg==="max"?e.MAX:e.FUNC_ADD,e.FUNC_ADD),e.useProgram(s.p),e.uniformMatrix4fv(s.u.u_mvp,!1,new Float32Array(n.mvp)),e.uniform3fv(s.u.u_eye,new Float32Array(n.eye)),e.uniform2f(s.u.u_scr,o,r),e.uniform2f(s.u.u_grid,a,i),e.uniform1f(s.u.u_cell,u),e.uniform1f(s.u.u_count,_.agg==="count"||!B?1:0),e.bindVertexArray(p),e.drawArrays(e.POINTS,0,E),e.bindVertexArray(null),A=h(A,1,1),e.bindFramebuffer(e.FRAMEBUFFER,A.fbo),e.viewport(0,0,1,1),e.clear(e.COLOR_BUFFER_BIT),e.blendEquation(e.MAX),e.useProgram(R.p),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,m.tex),e.uniform1i(R.u.u_g,0),e.uniform1i(R.u.u_cols,a),e.bindVertexArray(U),e.drawArrays(e.POINTS,0,a*i),e.bindVertexArray(null),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,o,r),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.useProgram(c.p),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,m.tex),e.uniform1i(c.u.u_g,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,A.tex),e.uniform1i(c.u.u_mx,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,v),e.uniform1i(c.u.u_cr,2),e.uniform1i(c.u.u_n,D),e.uniform1f(c.u.u_cell,u),e.uniform1f(c.u.u_gap,_.gap*l),e.uniform1f(c.u.u_h,r),e.uniform1f(c.u.u_opacity,_.opacity),e.bindBuffer(e.ARRAY_BUFFER,g),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.disableVertexAttribArray(0),e.activeTexture(e.TEXTURE0),e.disable(e.BLEND),f={cols:a,rows:i,cell:u}}function L(t,n){if(!b.length)return;const o=b.splice(0);try{const r=new Uint8Array(t*n*4),l=new Uint8Array(t*n*4),u=t*4;e.readPixels(0,0,t,n,e.RGBA,e.UNSIGNED_BYTE,r);for(let a=0;a<n;a++)l.set(r.subarray((n-1-a)*u,(n-a)*u),a*u);for(const a of o)T?.post?.({type:"pixels",id:a,w:t,h:n,flipY:!1,data:a===o[o.length-1]?l:l.slice()})}catch(r){for(const l of o)T?.post?.({type:"pixels",id:l,error:String(r?.message||r)})}}const w=(t,n,o)=>{e.bindFramebuffer(e.FRAMEBUFFER,t.fbo);const r=d.t!==e.UNSIGNED_BYTE,l=r?new Float32Array(4):new Uint8Array(4);return e.readPixels(n,o,1,1,e.RGBA,r?e.FLOAT:e.UNSIGNED_BYTE,l),e.bindFramebuffer(e.FRAMEBUFFER,null),r?[...l]:[...l].map(u=>u/255)};function C(t,n){if(!f||!m||!A)return null;const o=Math.floor(t/f.cell),r=Math.floor(n/f.cell);if(o<0||r<0||o>=f.cols||r>=f.rows)return null;const l=w(m,o,r);if(!(l[3]>0))return null;const u=r*f.cols+o;return{id:u+1,index:u,distance:0,lngLat:null,properties:{count:l[3],value:l[0],col:o,row:r,max:w(A,0,0)[0]}}}function M(){e?.getExtension("WEBGL_lose_context")?.loseContext(),e=null,f=null}return{init:N,message:P,frame:X,pick:C,destroy:M}}export{ae as create};
