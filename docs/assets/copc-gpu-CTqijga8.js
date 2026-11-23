const y={MAP_READ:1,COPY_DST:8,UNIFORM:64,STORAGE:128},S={COPY_SRC:1,COPY_DST:2,TEXTURE_BINDING:4,RENDER_ATTACHMENT:16},M={VERTEX:1,FRAGMENT:2},R=256,re=64,ne={rgb:0,classification:1,intensity:2,elevation:3},oe=`
struct Uni {
	mvp: mat4x4f,                    // mvp·T(origin)（倍精度で掛けてから f32）
	origin: vec3f, spacing: f32,     // 節の原点（単位球）・この節の点の間隔（世界単位）
	eye: vec3f, focal: f32,          // 目（単位球）・焦点距離（px）
	vp: vec2f, ddim: vec2f,          // 描画面（device px）・本体の深度テクスチャの大きさ
	elev: vec2f, intRange: vec2f,    // 段彩の範囲（m）・強度の範囲
	size: f32, atten: f32, maxRad: f32, opacity: f32,
	lift: f32, liftM: f32, logCoef: f32, eps: f32,
	mode: u32, depthOn: u32, hasRgb: u32, pad: u32,
};
@group(0) @binding(0) var<uniform> U: Uni;
@group(0) @binding(1) var dep: texture_2d<f32>;
@group(1) @binding(0) var<storage, read> P: array<f32>;     // 位置（原点相対・x y z）
@group(1) @binding(1) var<storage, read> RGB: array<u32>;   // 色（rgba8・無い層は 1 語のダミー）
@group(1) @binding(2) var<storage, read> INT: array<u32>;   // 強度（u16 を 2 つずつ）
@group(1) @binding(3) var<storage, read> CLS: array<u32>;   // 分類（u8 を 4 つずつ）
@group(1) @binding(4) var<storage, read> ELEV: array<f32>;  // 標高（m）
struct VO { @builtin(position) pos: vec4f, @location(0) col: vec4f, @location(1) p: vec2f, @location(2) rad: f32, @location(3) w: f32 }
fn ramp(t0: f32) -> vec3f {   // 標高の段彩（青→緑→黄→赤）＝copc-gl.ts と同じ
	let t = clamp(t0, 0.0, 1.0);
	if (t < 0.33) { return mix(vec3f(0.17, 0.35, 0.75), vec3f(0.20, 0.65, 0.35), t / 0.33); }
	if (t < 0.66) { return mix(vec3f(0.20, 0.65, 0.35), vec3f(0.95, 0.85, 0.25), (t - 0.33) / 0.33); }
	return mix(vec3f(0.95, 0.85, 0.25), vec3f(0.80, 0.22, 0.15), (t - 0.66) / 0.34);
}
fn clsColor(k: u32) -> vec3f {   // ASPRS LAS 1.4 の分類
	switch k {
		case 2u: { return vec3f(0.63, 0.47, 0.30); }
		case 3u: { return vec3f(0.62, 0.84, 0.45); }
		case 4u: { return vec3f(0.35, 0.70, 0.30); }
		case 5u: { return vec3f(0.13, 0.50, 0.18); }
		case 6u: { return vec3f(0.90, 0.35, 0.25); }
		case 7u, 18u: { return vec3f(0.85, 0.20, 0.85); }
		case 9u: { return vec3f(0.20, 0.45, 0.90); }
		case 10u: { return vec3f(0.45, 0.35, 0.55); }
		case 11u: { return vec3f(0.55, 0.55, 0.58); }
		case 17u: { return vec3f(0.95, 0.65, 0.20); }
		default: { return vec3f(0.72, 0.72, 0.72); }
	}
}
@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) i: u32) -> VO {
	var o: VO;
	o.pos = vec4f(2.0, 2.0, 2.0, 1.0); o.col = vec4f(0.0); o.p = vec2f(0.0); o.rad = 0.0; o.w = 1.0;   // 画面の外＝描かない
	let p0 = vec3f(P[i * 3u], P[i * 3u + 1u], P[i * 3u + 2u]);
	let pos = p0 + normalize(p0 + U.origin) * U.lift;   // 高さの足し込み（球の法線）
	let d = (pos + U.origin) - U.eye;   // 地平線の向こう（球の裏側）は描かない
	let a = dot(d, d); let b = dot(U.eye, d); let c = dot(U.eye, U.eye) - 1.0; let disc = b * b - a * c;
	if (disc > 0.0) { let s = sqrt(disc); let t0 = (-b - s) / a; if (t0 > 1e-4 && t0 < 1.0 - 1e-4) { return o; } }
	let cpos = U.mvp * vec4f(pos, 1.0);
	if (cpos.w <= 0.0) { return o; }
	var rad = U.size;
	if (U.atten > 0.5) { rad = clamp(0.5 * U.spacing * U.focal / max(1e-9, sqrt(a)), 1.0, U.size * 2.0); }
	rad = min(rad, U.maxRad);
	var corner = vec2f(-1.0, -1.0);
	switch vi { case 1u: { corner = vec2f(1.0, -1.0); } case 2u, 4u: { corner = vec2f(1.0, 1.0); } case 5u: { corner = vec2f(-1.0, 1.0); } default: {} }
	let half = rad + 1.0;   // GL の gl_PointSize＝rad×2＋2 と同じ
	let ndc = cpos.xy / cpos.w;
	o.pos = vec4f(ndc + corner * half * 2.0 / U.vp, 0.0, 1.0);   // z＝0（深度は書かない・GL 向きの mvp の z を WebGPU の [0,1] で切らせない）
	o.p = corner * half; o.rad = rad; o.w = cpos.w;
	var col = vec3f(0.85);
	if (U.mode == 0u) { if (U.hasRgb != 0u) { col = unpack4x8unorm(RGB[i]).rgb; } }
	else if (U.mode == 1u) { col = clsColor((CLS[i >> 2u] >> ((i & 3u) * 8u)) & 0xffu); }
	else if (U.mode == 2u) { let v = f32((INT[i >> 1u] >> ((i & 1u) * 16u)) & 0xffffu); col = vec3f(clamp((v - U.intRange.x) / max(1e-6, U.intRange.y - U.intRange.x), 0.0, 1.0)); }
	else { col = ramp((ELEV[i] + U.liftM - U.elev.x) / max(1e-6, U.elev.y - U.elev.x)); }
	o.col = vec4f(col, U.opacity);
	return o;
}
// 本体の深度（詰めた 24 bit の対数深度・行は下から＝GL）で隠れるか＝splat と同じ
fn occluded(pos: vec2f, w: f32) -> bool {
	if (U.depthOn == 0u) { return false; }
	let uv = vec2f(pos.x / U.vp.x, 1.0 - pos.y / U.vp.y);
	let t = vec2i(clamp(uv * U.ddim, vec2f(0.0), U.ddim - 1.0));
	let c = floor(textureLoad(dep, t, 0).rgb * 255.0 + 0.5);
	let s = dot(c, vec3f(65536.0, 256.0, 1.0)) / 16777215.0;
	let d = 0.5 * log2(max(1.0 + w, 1e-6)) * U.logCoef;
	return s < 1.0 && d > s + U.eps;
}
@fragment fn fs(v: VO) -> @location(0) vec4f {
	let cov = clamp(v.rad + 0.5 - length(v.p), 0.0, 1.0);
	if (cov <= 0.0) { discard; }
	if (occluded(v.pos.xy, v.w)) { discard; }
	let a = v.col.a * cov;
	return vec4f(v.col.rgb * a, a);
}`,ae=a=>Math.ceil(a/256)*256;function ie(){let a=null,x=null,w=null,T="rgba8unorm",Y=!1,D=!1,A=!1,B=null,_=null,z=null,h=null,N=0,G=new ArrayBuffer(0),L=null,F=null,C=null,X=null,k=null;const b=new Map,q=[];let v={mode:"rgb",size:2,attenuation:!0,elevRange:[0,100],intensityRange:[0,65535],opacity:1,lift:0,liftM:0};const V=new Float64Array(16),E=(e,t,c)=>{const u=Math.max(16,Math.ceil(e.byteLength/16)*16),o=a.createBuffer({label:c,size:u,usage:t,mappedAtCreation:!0});return new Uint8Array(o.getMappedRange()).set(new Uint8Array(e.buffer,e.byteOffset,e.byteLength)),o.unmap(),o};async function $(e,t={},c=null){w=c;const u=globalThis.navigator?.gpu;if(!u)throw new Error("WebGPU is not available (navigator.gpu)");const o=c?.gpuDevice?.()??null;if(!o)throw new Error("map is not drawing with WebGPU (no shared device)");if(a=o,Y=!0,A)return;D=t.depth!==!1,T=u.getPreferredCanvasFormat(),_=a.createBindGroupLayout({label:"copc-u",entries:[{binding:0,visibility:M.VERTEX|M.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!0}},{binding:1,visibility:M.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d"}}]}),z=a.createBindGroupLayout({label:"copc-pts",entries:[0,1,2,3,4].map(g=>({binding:g,visibility:M.VERTEX,buffer:{type:"read-only-storage"}}))});const i=a.createShaderModule({code:oe,label:"copc"}),f=((await i.getCompilationInfo()).messages||[]).filter(g=>g.type==="error").map(g=>`${g.lineNum}:${g.linePos} ${g.message}`);if(f.length)throw new Error(`copc WGSL: ${f.join("; ")}`);if(A)return;const s={color:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}};if(B=await a.createRenderPipelineAsync({label:"copc-draw",layout:a.createPipelineLayout({bindGroupLayouts:[_,z]}),vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:T,blend:s}]},primitive:{topology:"triangle-list"}}),A)return;L=a.createTexture({label:"copc-dep0",size:[1,1],format:"rgba8unorm",usage:S.TEXTURE_BINDING|S.COPY_DST}),F=a.createBuffer({label:"copc-rgb0",size:16,usage:y.STORAGE}),W(64);const p=e.getContext("webgpu");if(!p)throw new Error("webgpu canvas context unavailable");p.configure({device:a,format:T,alphaMode:"premultiplied",usage:S.RENDER_ATTACHMENT|S.COPY_SRC}),x=p}function W(e){if(e<=N)return;let t=Math.max(64,N);for(;t<e;)t*=2;h?.destroy(),h=a.createBuffer({label:"copc-ub",size:t*R,usage:y.UNIFORM|y.COPY_DST}),N=t,G=new ArrayBuffer(t*R)}const P=e=>{if(e)for(const t of e.bufs)t.destroy()};function j(e){if(e.type==="probe"){q.push(e.id),w?.requestDraw?.();return}if(!(!a||!x)){if(e.type==="layer"){P(b.get(e.q));let t=null;if(e.rgb){const o=new Uint32Array(e.n);for(let i=0,d=0;i<e.n;i++,d+=3)o[i]=4278190080|e.rgb[d+2]<<16|e.rgb[d+1]<<8|e.rgb[d];t=E(o,y.STORAGE,"copc-rgb")}const c=[E(e.pos,y.STORAGE,"copc-pos"),E(e.intensity,y.STORAGE,"copc-int"),E(e.cls,y.STORAGE,"copc-cls"),E(e.elev,y.STORAGE,"copc-elev")];t&&c.push(t);const u=a.createBindGroup({layout:z,entries:[{binding:0,resource:{buffer:c[0]}},{binding:1,resource:{buffer:t??F}},{binding:2,resource:{buffer:c[1]}},{binding:3,resource:{buffer:c[2]}},{binding:4,resource:{buffer:c[3]}}]});b.set(e.q,{n:e.n,bufs:c,bg:u,origin:e.origin,spacing:e.spacing||0,on:!0,hasRgb:!!t})}else if(e.type==="remove")P(b.get(e.q)),b.delete(e.q);else if(e.type==="vis"){const t=b.get(e.q);t&&(t.on=!!e.on)}else e.type==="clear"?(b.forEach(P),b.clear()):e.type==="style"&&(v={...v,...e});w?.requestDraw?.()}}async function H(e,t){const c=x.getCurrentTexture(),u=ae(e*4),o=a.createBuffer({size:u*t,usage:y.MAP_READ|y.COPY_DST}),i=a.createCommandEncoder();i.copyTextureToBuffer({texture:c},{buffer:o,bytesPerRow:u},[e,t]),a.queue.submit([i.finish()]),await o.mapAsync(y.MAP_READ);const d=new Uint8Array(o.getMappedRange()),f=new Uint8Array(e*t*4),s=/^bgra/.test(T);for(let p=0;p<t;p++)for(let g=0;g<e;g++){const m=p*u+g*4,r=(p*e+g)*4;f[r]=d[m+(s?2:0)],f[r+1]=d[m+1],f[r+2]=d[m+(s?0:2)],f[r+3]=d[m+3]}return o.unmap(),o.destroy(),f}function J(e,t){if(!q.length)return;const c=q.splice(0),u={layers:b.size,depth:D,backend:"webgpu"};H(e,t).then(o=>{for(const i of c)w?.post?.({type:"pixels",id:i,w:e,h:t,flipY:!1,info:u,data:i===c[c.length-1]?o:o.slice()})}).catch(o=>{for(const i of c)w?.post?.({type:"pixels",id:i,error:String(o?.message||o)})})}function K(e,t,{w:c,h:u},o){if(!a||!x||!B)return!1;const i=[...b.values()].filter(s=>s.on&&s.n),d=a.createCommandEncoder({label:"copc-frame"});if(i.length){const s=D&&o?.depth?{tex:o.depth.gpuTexture(a),w:o.depth.w,h:o.depth.h,logCoef:o.depth.logCoef}:null,p=s?s.tex:L;W(i.length),(!C||X!==p||k!==h)&&(C=a.createBindGroup({layout:_,entries:[{binding:0,resource:{buffer:h,size:R}},{binding:1,resource:p.createView()}]}),X=p,k=h);const g=e.dpr||1,m=t.mvp,r=new Float32Array(G),O=new Uint32Array(G),Z=ne[v.mode]??0,ee=Math.max(.5,v.size*g);i.forEach((I,te)=>{const U=I.origin,n=te*(R/4);for(let l=0;l<12;l++)V[l]=m[l];for(let l=0;l<4;l++)V[12+l]=m[l]*U[0]+m[4+l]*U[1]+m[8+l]*U[2]+m[12+l];for(let l=0;l<16;l++)r[n+l]=V[l];r[n+16]=U[0],r[n+17]=U[1],r[n+18]=U[2],r[n+19]=I.spacing,r[n+20]=t.eye[0],r[n+21]=t.eye[1],r[n+22]=t.eye[2],r[n+23]=t.focal,r[n+24]=c,r[n+25]=u,r[n+26]=s?s.w:1,r[n+27]=s?s.h:1,r[n+28]=v.elevRange[0],r[n+29]=v.elevRange[1],r[n+30]=v.intensityRange[0],r[n+31]=v.intensityRange[1],r[n+32]=ee,r[n+33]=v.attenuation?1:0,r[n+34]=re,r[n+35]=v.opacity??1,r[n+36]=v.lift||0,r[n+37]=v.liftM||0,r[n+38]=s?s.logCoef:1,r[n+39]=2e-6,O[n+40]=Z,O[n+41]=s?1:0,O[n+42]=I.hasRgb?1:0,O[n+43]=0}),a.queue.writeBuffer(h,0,G,0,i.length*R)}const f=d.beginRenderPass({label:"copc-draw",colorAttachments:[{view:x.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});return i.length&&(f.setPipeline(B),i.forEach((s,p)=>{f.setBindGroup(0,C,[p*R]),f.setBindGroup(1,s.bg),f.draw(6,s.n)})),f.end(),a.queue.submit([d.finish()]),J(c,u),!1}function Q(){A=!0,b.forEach(P),b.clear(),h?.destroy(),L?.destroy(),F?.destroy();try{x?.unconfigure()}catch{}a=null,x=null,C=null}return{init:$,message:j,frame:K,destroy:Q,get shared(){return Y}}}export{ie as create};
