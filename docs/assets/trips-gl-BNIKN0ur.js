import{g as J,r as Q,n as Z}from"./glprog-Ctpj38TF.js";import{d as be}from"./glprog-Ctpj38TF.js";import{g as $}from"./renderworker-D_COh6DJ.js";import"./rangecache-flag-DUqD5ZxK.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";const V=`#version 300 es
precision highp float;
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_oth;     // 同じ線分のもう一方の端
layout(location = 2) in float a_side;   // ±1＝側・|2|＝oth は前の点
layout(location = 3) in float a_time;
layout(location = 4) in vec4 a_rgba;
layout(location = 5) in float a_w;
layout(location = 6) in highp uint a_id;
layout(location = 7) in float a_f;
uniform mat4 u_mvp; uniform vec3 u_origin; uniform vec3 u_eyeRel; uniform float u_oe;
uniform vec2 u_half; uniform float u_dpr;
uniform vec2 u_filter; uniform float u_filterOn;
out vec4 v_col; out float v_side; out float v_half; out float v_hid; out float v_time; flat out highp uint v_id;
void main() {
	v_col = a_rgba; v_time = a_time; v_id = a_id;
	vec4 off = vec4(2.0, 2.0, 2.0, 1.0);
	if (u_filterOn > 0.5 && (a_f < u_filter.x || a_f > u_filter.y)) { gl_Position = off; return; }
	v_hid = u_oe - dot(u_origin, a_pos) + dot(a_pos, u_eyeRel) - dot(a_pos, a_pos);
	float sgn = abs(a_side) > 1.5 ? -1.0 : 1.0, side = sign(a_side);
	vec4 c0 = u_mvp * vec4(a_pos, 1.0), c1 = u_mvp * vec4(a_oth, 1.0);
	if (c0.w <= 0.0) { gl_Position = off; return; }
	if (c1.w <= 0.0) c1 = c0 + vec4(1e-3, 0.0, 0.0, 0.0);
	vec2 s0 = c0.xy / c0.w * u_half, s1 = c1.xy / c1.w * u_half;
	vec2 tg = (s1 - s0) * sgn; float L = length(tg); tg = L > 1e-6 ? tg / L : vec2(1.0, 0.0);
	vec2 nrm = vec2(-tg.y, tg.x);
	float halfW = a_w * u_dpr * 0.5;
	v_half = halfW; v_side = side * (halfW + 0.5);
	gl_Position = c0; gl_Position.xy += nrm * v_side / u_half * c0.w;
}`,q=`#version 300 es
precision highp float;
in vec4 v_col; in float v_side; in float v_half; in float v_hid; in float v_time; flat in highp uint v_id;
uniform float u_time; uniform float u_trail; uniform float u_fade;
out vec4 o;
void main() {
	if (v_hid < 0.0) discard;
	float age = u_time - v_time;
	if (age < 0.0 || age > u_trail) discard;
	float cov = clamp(v_half + 0.5 - abs(v_side), 0.0, 1.0);
	if (cov <= 0.0) discard;
`;function ve(){const W=q+`	float a = v_col.a * cov * (u_fade > 0.5 ? 1.0 - age / u_trail : 1.0);
	o = vec4(v_col.rgb * a, a);
}`,G=q+`	o = vec4(float(v_id & 255u), float((v_id >> 8) & 255u), float((v_id >> 16) & 255u), float((v_id >> 24) & 255u)) / 255.0;
}`;let e=null,L=null,O={},A=null,P={},v=null,d=null,B=0,M=0;const f=new Map;function D(){let t=1;for(const i of f.values())i.base=t,t+=i.trips.length}let y={trail:1,fade:!0,width:2,color:[1,.6,.1,.9]},c=0,n=null,E=!1,R=0,x=null;const N=[],I=(t,i)=>J(e,t,i);function U(t,i,r){if(x=r||null,e=t.getContext("webgl2",$({premultipliedAlpha:!0,antialias:!0,alpha:!0,depth:!1})),!e)throw new Error("WebGL2 is not available (trips overlay)");({p:L,u:O}=I(V,W));try{({p:A,u:P}=I(V,G))}catch(o){A=null,console.warn("[trips] pick pass unavailable",o?.message)}}const T=t=>{if(t){for(const i of t.bufs)e.deleteBuffer(i);e.deleteVertexArray(t.vao)}};function Y(t){if(t.type==="probe"){N.push(t.id),x?.requestDraw?.();return}if(e){if(t.type==="layer"){T(f.get(t.q));const i=e.createVertexArray(),r=[];e.bindVertexArray(i);const o=(u,w,m,b,_,g)=>{const a=e.createBuffer();r.push(a),e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,w,e.STATIC_DRAW),e.enableVertexAttribArray(u),g?e.vertexAttribIPointer(u,m,b,0,0):e.vertexAttribPointer(u,m,b,_,0,0)};o(0,t.pos,3,e.FLOAT,!1),o(1,t.oth,3,e.FLOAT,!1),o(2,t.side,1,e.FLOAT,!1),o(3,t.time,1,e.FLOAT,!1),t.rgba?o(4,t.rgba,4,e.UNSIGNED_BYTE,!0):e.disableVertexAttribArray(4),t.width?o(5,t.width,1,e.FLOAT,!1):e.disableVertexAttribArray(5),o(6,t.id,1,e.UNSIGNED_INT,!1,!0),t.f?o(7,t.f,1,e.FLOAT,!1):e.disableVertexAttribArray(7);const l=e.createBuffer();r.push(l),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,l),e.bufferData(e.ELEMENT_ARRAY_BUFFER,t.index,e.STATIC_DRAW),e.bindVertexArray(null),f.set(t.q,{nv:t.nv,ni:t.ni,bufs:r,vao:i,has:{c:!!t.rgba,w:!!t.width,f:!!t.f},origin:t.origin||null,on:!0,base:0,trips:t.trips||[],filter:null,tMin:t.tMin,tMax:t.tMax}),D()}else if(t.type==="remove")T(f.get(t.q)),f.delete(t.q),D();else if(t.type==="vis"){const i=f.get(t.q);i&&(i.on=!!t.on)}else if(t.type==="clear")f.forEach(T),f.clear(),D();else if(t.type==="style"){const{type:i,...r}=t;y={...y,...r}}else if(t.type==="time")c=+t.t||0,n=null,E=!1;else if(t.type==="animate")n=t.on===!1?null:{from:t.from,to:t.to,speed:t.speed??1,loop:t.loop!==!1},n&&(c=n.from,E=!1,R=0);else if(t.type==="clock")E=!!t.on,E&&(n=null);else if(t.type==="filter"){const i=t.range?[+t.range[0],+t.range[1]]:null;if(t.q!=null){const r=f.get(t.q);r&&(r.filter=i)}else for(const r of f.values())r.filter=i}x?.requestDraw?.()}}const H=()=>({time:c,anim:!!n,useClock:E,layers:f.size});function X(t,i){if(!N.length)return;const r=N.splice(0);try{const o=new Uint8Array(t*i*4);e.readPixels(0,0,t,i,e.RGBA,e.UNSIGNED_BYTE,o);for(const l of r)x?.post?.({type:"pixels",id:l,w:t,h:i,flipY:!0,time:c,data:l===r[r.length-1]?o:o.slice()})}catch(o){for(const l of r)x?.post?.({type:"pixels",id:l,error:String(o?.message||o)})}}function K(t,i,r,o){if(!e)return!1;let l=!1;if(E&&o?.time!=null)c=o.time,l=o.clock?.rate!==0;else if(n){const u=performance.now();R&&(c+=(u-R)/1e3*n.speed,c>n.to&&(n.loop?c=n.from+(c-n.to)%Math.max(1e-9,n.to-n.from):(c=n.to,n=null))),R=u,l=!!n}return e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,r.w,r.h),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),f.size&&(e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),S(L,O,i,t.dpr||1,r)),X(r.w,r.h),l}function S(t,i,r,o,{w:l,h:u},w){e.useProgram(t);const m=r.mvp,b=new Float32Array(16),_=new Float32Array(m),g=r.eye;e.uniform2f(i.u_half,l/2,u/2),e.uniform1f(i.u_dpr,o),e.uniform1f(i.u_time,c),e.uniform1f(i.u_trail,Math.max(1e-9,y.trail)),e.uniform1f(i.u_fade,y.fade?1:0);for(const a of f.values()){if(!a.on)continue;const p=a.origin;if(p){for(let s=0;s<12;s++)b[s]=m[s];for(let s=0;s<4;s++)b[12+s]=m[s]*p[0]+m[4+s]*p[1]+m[8+s]*p[2]+m[12+s];e.uniformMatrix4fv(i.u_mvp,!1,b),e.uniform3f(i.u_origin,p[0],p[1],p[2])}else e.uniformMatrix4fv(i.u_mvp,!1,_),e.uniform3f(i.u_origin,0,0,0);const h=p||[0,0,0],F=g[0]-h[0],k=g[1]-h[1],C=g[2]-h[2];if(e.uniform3f(i.u_eyeRel,F,k,C),e.uniform1f(i.u_oe,h[0]*F+h[1]*k+h[2]*C),e.uniform1f(i.u_filterOn,a.filter&&a.has.f?1:0),a.filter&&e.uniform2f(i.u_filter,a.filter[0],a.filter[1]),e.bindVertexArray(a.vao),!a.has.c){const s=y.color;e.vertexAttrib4f(4,s[0],s[1],s[2],s[3]??1)}a.has.w||e.vertexAttrib1f(5,y.width),a.has.f||e.vertexAttrib1f(7,0),e.drawElements(e.TRIANGLES,a.ni,e.UNSIGNED_INT,0)}e.bindVertexArray(null)}function j(t,i,r,o){if(!e||!A||!f.size||!o?.s)return null;const{w:l,h:u}=o.size,w=o.cam?.dpr||1;B!==l||M!==u||!v?(d&&e.deleteTexture(d),v&&e.deleteFramebuffer(v),d=e.createTexture(),e.bindTexture(e.TEXTURE_2D,d),e.texStorage2D(e.TEXTURE_2D,1,e.RGBA8,l,u),v=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,v),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,d,0),B=l,M=u):e.bindFramebuffer(e.FRAMEBUFFER,v),e.viewport(0,0,l,u),e.disable(e.BLEND),e.disable(e.DEPTH_TEST),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),S(A,P,o.s,w,{w:l,h:u});const{data:m,side:b}=Q(e,t,i,r,l,u);e.bindFramebuffer(e.FRAMEBUFFER,null);const _=Z(m,b);if(!_)return null;let g=null,a=null;for(const[h,F]of f)F.on&&_.id>=1&&_.id<=F.trips.length&&(g=h,a=F);if(!a)return null;const p=a.trips[_.id-1];return{id:_.id,q:g,index:_.id-1,distance:_.distance,lngLat:p?.lngLat??null,properties:{q:g,index:_.id-1,t0:p?.t0,t1:p?.t1,time:c}}}function z(){e&&(f.forEach(T),f.clear(),e.deleteProgram(L),A&&e.deleteProgram(A),d&&e.deleteTexture(d),v&&e.deleteFramebuffer(v),A=d=v=null,B=M=0,e.getExtension("WEBGL_lose_context")?.loseContext(),e=null)}return{init:U,message:Y,_state:H,frame:K,pick:j,destroy:z}}export{ve as create,be as decodeId};
