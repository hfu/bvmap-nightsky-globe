const W=`#version 300 es
out vec2 v_textureCoordinates;
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); v_textureCoordinates = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`,J=(e=!1)=>`#version 300 es
precision highp float;
uniform highp sampler2D u_depth;
uniform vec4 u_p;
float expm1s(float x) { if (x < 0.1) return x * (1.0 + x * (0.5 + x * (0.16666667 + x * (0.041666668 + x * (0.0083333335 + x * (0.0013888889 + x * 0.00019841270)))))); return exp(x) - 1.0; }
void main() {
	float d = ${e?"dot(texelFetch(u_depth, ivec2(gl_FragCoord.xy), 0).rgb, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0))":"texelFetch(u_depth, ivec2(gl_FragCoord.xy), 0).r"};
	if (d >= 1.0) { gl_FragDepth = 1.0; return; }
	float w = expm1s(d * u_p.x) * ${6378137 .toFixed(1)};   // 目からの奥行き（m）
	gl_FragDepth = clamp(log2(max(w - u_p.z, 0.0) + 1.0) * u_p.y, 0.0, 1.0);
}`,b=`#version 300 es
precision highp float;
precision highp sampler2D;
uniform vec4 czm_viewport;
uniform float czm_pixelRatio;
uniform float czm_frameNumber;
uniform vec4 ortho_eyeP;
const float czm_pi = 3.141592653589793;
const float czm_twoPi = 6.283185307179586;
const float czm_piOverTwo = 1.5707963267948966;
const float czm_infinity = 5906376272000.0;
const float czm_epsilon7 = 0.0000001;
float czm_luminance(vec3 rgb) { return dot(rgb, vec3(0.2125, 0.7154, 0.0721)); }
float czm_unpackDepth(vec4 p) { return p.x; }
float czm_readDepth(sampler2D t, vec2 uv) { return texture(t, uv).x; }
vec4 czm_windowToEyeCoordinates(vec2 fragCoord, float depth) { float w = exp2(depth * ortho_eyeP.z) - 1.0 + ortho_eyeP.w; vec2 ndc = fragCoord / czm_viewport.zw * 2.0 - 1.0; return vec4(ndc.x * ortho_eyeP.x * w, ndc.y * ortho_eyeP.y * w, -w, 1.0); }
bool czm_selected() { return false; }
bool czm_selected(vec2 o) { return false; }
vec3 czm_RGBToHSB(vec3 rgb) { const vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0); vec4 p = mix(vec4(rgb.bg, K.wz), vec4(rgb.gb, K.xy), step(rgb.b, rgb.g)); vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r)); float d = q.x - min(q.w, q.y); return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + czm_epsilon7)), d / (q.x + czm_epsilon7), q.x); }
vec3 czm_HSBToRGB(vec3 hsb) { const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0); vec3 p = abs(fract(hsb.xxx + K.xyz) * 6.0 - K.www); return hsb.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsb.y); }
vec3 czm_saturation(vec3 rgb, float adjustment) { const vec3 W = vec3(0.2125, 0.7154, 0.0721); vec3 intensity = vec3(dot(rgb, W)); return mix(intensity, rgb, adjustment); }
`,Q=b+`uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform float u_length;
uniform vec4 u_color;
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
void main() {
	float dirs[3]; dirs[0] = -1.0; dirs[1] = 0.0; dirs[2] = 1.0;
	float sc[3]; sc[0] = 3.0; sc[1] = 10.0; sc[2] = 3.0;
	float padx = czm_pixelRatio / czm_viewport.z, pady = czm_pixelRatio / czm_viewport.w;
	float h = 0.0, v = 0.0;
	for (int i = 0; i < 3; ++i) {
		float dir = dirs[i], s = sc[i];
		h -= texture(depthTexture, v_textureCoordinates + vec2(-padx, dir * pady)).x * s;
		h += texture(depthTexture, v_textureCoordinates + vec2(padx, dir * pady)).x * s;
		v -= texture(depthTexture, v_textureCoordinates + vec2(dir * padx, -pady)).x * s;
		v += texture(depthTexture, v_textureCoordinates + vec2(dir * padx, pady)).x * s;
	}
	float len = sqrt(h * h + v * v);
	vec4 edge = vec4(u_color.rgb, len > u_length ? u_color.a : 0.0);
	vec4 c = texture(colorTexture, v_textureCoordinates);
	out_FragColor = mix(c, edge, edge.a);
}`,g=b+`uniform sampler2D colorTexture;
uniform float u_gradations;
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
void main() {
	vec3 rgb = texture(colorTexture, v_textureCoordinates).rgb;
	float darkness = czm_luminance(rgb) * u_gradations;
	darkness = (darkness - fract(darkness)) / u_gradations;
	out_FragColor = vec4(vec3(darkness), 1.0);
}`,ee=b+`uniform sampler2D colorTexture;
uniform float u_value;
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
void main() { vec3 rgb = texture(colorTexture, v_textureCoordinates).rgb; out_FragColor = vec4(mix(vec3(0.0), rgb, u_value), 1.0); }`,te=b+`uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
float rand(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
	float noise = rand(v_textureCoordinates + sin(czm_frameNumber)) * 0.1;
	vec3 rgb = texture(colorTexture, v_textureCoordinates).rgb;
	out_FragColor = vec4((noise + rgb) * vec3(0.0, 1.0, 0.0), 1.0);
}`,oe=b+`uniform sampler2D colorTexture;
uniform sampler2D dirtTexture;
uniform sampler2D starTexture;
uniform vec2 dirtTextureDimensions;
uniform vec4 u_lf;     // intensity, distortion, ghostDispersal, haloWidth
uniform vec4 u_lf2;    // dirtAmount, space(0/1), camrot, 0
uniform vec4 u_sun;    // 太陽の NDC x,y
uniform vec4 u_earth;  // 地球の中心の NDC x,y・縁の NDC x
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
float isInEarth(vec2 texcoord, vec2 sceneSize) {
	vec2 NDC = texcoord * 2.0 - 1.0;
	NDC.xy -= u_earth.xy;
	float X = abs(NDC.x) * sceneSize.x;
	float Y = abs(NDC.y) * sceneSize.y;
	return min(1.0, max(sqrt(X * X + Y * Y) / max(abs(u_earth.z * sceneSize.x), 1.0) - 0.8, 0.0));   // Cesium の clamp(0.0, 1.0, m)（下限＞上限＝未定義）を実機（Mac の Metal）の Cesium の絵＝min(1, m)＝地球を隠す、に固定（SwiftShader は 1 を返す＝砂場の Cesium は地球ごと光る）
}
// 太陽の光の玉（Cesium は太陽を場面に描き、フレアはそれを光源に輪と筋を出す。この地図の場面に太陽は無い＝ここで足す）。Mac の Cesium の絵から：芯は白・
// 半径 22 px（CSS）で直線に落ちる黄みの暈
vec3 sunGlow(vec2 uv) {
	vec2 sp = (u_sun.xy * 0.5 + 0.5) * czm_viewport.zw;
	float d = length(uv * czm_viewport.zw - sp) / czm_pixelRatio;
	return vec3(1.0, 1.0, 0.72) * 0.75 * clamp(1.0 - d / 22.0, 0.0, 1.0) + vec3(exp(-d * d / 2.0));
}
vec4 sceneAt(sampler2D tex, vec2 uv) { vec4 c = texture(tex, uv); return vec4(c.rgb + sunGlow(uv), c.a); }
vec4 textureDistorted(sampler2D tex, vec2 texcoord, vec2 direction, vec3 distortion, bool isSpace) {
	vec2 sceneSize = czm_viewport.zw;
	vec3 color;
	if (isSpace) {
		color.r = isInEarth(texcoord + direction * distortion.r, sceneSize) * sceneAt(tex, texcoord + direction * distortion.r).r;
		color.g = isInEarth(texcoord + direction * distortion.g, sceneSize) * sceneAt(tex, texcoord + direction * distortion.g).g;
		color.b = isInEarth(texcoord + direction * distortion.b, sceneSize) * sceneAt(tex, texcoord + direction * distortion.b).b;
	} else {
		color.r = sceneAt(tex, texcoord + direction * distortion.r).r;
		color.g = sceneAt(tex, texcoord + direction * distortion.g).g;
		color.b = sceneAt(tex, texcoord + direction * distortion.b).b;
	}
	return vec4(clamp(color, 0.0, 1.0), 0.0);
}
void main() {
	vec4 originalColor = texture(colorTexture, v_textureCoordinates);
	bool isSpace = u_lf2.y > 0.5;
	vec2 sunPos = u_sun.xy;
	if (!isSpace || !((sunPos.x >= -1.1 && sunPos.x <= 1.1) && (sunPos.y >= -1.1 && sunPos.y <= 1.1))) { out_FragColor = originalColor; return; }
	float intensity = u_lf.x, distortion = u_lf.y, ghostDispersal = u_lf.z, haloWidth = u_lf.w, dirtAmount = u_lf2.x;
	vec2 texcoord = vec2(1.0) - v_textureCoordinates;
	vec2 pixelSize = czm_pixelRatio / czm_viewport.zw;
	vec2 invPixelSize = 1.0 / pixelSize;
	vec3 distortionVec = pixelSize.x * vec3(-distortion, 0.0, distortion);
	vec2 ghostVec = (vec2(0.5) - texcoord) * ghostDispersal;
	vec3 direction = normalize(vec3(ghostVec, 0.0));
	vec4 result = vec4(0.0);
	vec4 ghost = vec4(0.0);
	for (int i = 0; i < 4; ++i) { vec2 offset = fract(texcoord + ghostVec * float(i)); ghost += textureDistorted(colorTexture, offset, direction.xy, distortionVec, isSpace); }
	result += ghost;
	vec2 haloVec = normalize(ghostVec) * haloWidth;
	float weightForHalo = length(vec2(0.5) - fract(texcoord + haloVec)) / length(vec2(0.5));
	weightForHalo = pow(1.0 - weightForHalo, 5.0);
	result += textureDistorted(colorTexture, texcoord + haloVec, direction.xy, distortionVec, isSpace) * weightForHalo * 1.5;
	vec2 dirtTexCoords = (v_textureCoordinates * invPixelSize) / dirtTextureDimensions;
	if (dirtTexCoords.x > 1.0) dirtTexCoords.x = mod(floor(dirtTexCoords.x), 2.0) == 1.0 ? 1.0 - fract(dirtTexCoords.x) : fract(dirtTexCoords.x);
	if (dirtTexCoords.y > 1.0) dirtTexCoords.y = mod(floor(dirtTexCoords.y), 2.0) == 1.0 ? 1.0 - fract(dirtTexCoords.y) : fract(dirtTexCoords.y);
	result += dirtAmount * texture(dirtTexture, dirtTexCoords);
	float camrot = u_lf2.z;
	float cosValue = cos(camrot), sinValue = sin(camrot);
	mat3 rotation = mat3(cosValue, -sinValue, 0.0, sinValue, cosValue, 0.0, 0.0, 0.0, 1.0);
	vec3 st1 = vec3(v_textureCoordinates * 2.0 - vec2(1.0), 1.0);
	vec3 st2 = vec3((rotation * st1).xy, 1.0);
	vec3 st3 = st2 * 0.5 + vec3(0.5);
	vec2 lensStarTexcoord = st3.xy;
	float weightForLensFlare = length(vec3(sunPos.xy, 0.0));
	float oneMinusWeightForLensFlare = max(1.0 - weightForLensFlare, 0.0);
	result *= oneMinusWeightForLensFlare * intensity;
	result *= texture(starTexture, lensStarTexcoord) * pow(weightForLensFlare, 1.0) * max((1.0 - length(vec3(st1.xy, 0.0))), 0.0) * 2.0;
	result += sceneAt(colorTexture, v_textureCoordinates);
	out_FragColor = vec4(result.rgb, clamp(max(result.a, max(result.r, max(result.g, result.b))), 0.0, 1.0));   // 透かした宇宙の上でも光が乗る＝α を色の明るさまで上げる（premultiplied の色＞α は合成で落ちる）
}`,q=b+`uniform sampler2D colorTexture;
uniform vec4 u_blur;   // delta, sigma, stepSize, direction（0＝x・1＝y）
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
void main() {
	float delta = u_blur.x, sigma = u_blur.y, stepSize = u_blur.z, direction = u_blur.w;
	vec2 st = v_textureCoordinates;
	vec2 dir = vec2(1.0 - direction, direction);
	vec2 stp = vec2(stepSize * (czm_pixelRatio / czm_viewport.zw));
	vec3 g;
	g.x = 1.0 / (sqrt(czm_twoPi) * sigma);
	g.y = exp((-0.5 * delta * delta) / (sigma * sigma));
	g.z = g.y * g.y;
	vec4 result = texture(colorTexture, st) * g.x;
	for (int i = 1; i < 8; ++i) { g.xy *= g.yz; vec2 offset = float(i) * dir * stp; result += texture(colorTexture, st - offset) * g.x; result += texture(colorTexture, st + offset) * g.x; }
	out_FragColor = result;
}`,re=b+`uniform sampler2D colorTexture;
uniform vec2 u_cb;   // contrast, brightness
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
void main() {
	vec3 sceneColor = texture(colorTexture, v_textureCoordinates).xyz;
	sceneColor = czm_RGBToHSB(sceneColor);
	sceneColor.z += u_cb.y;
	sceneColor = czm_HSBToRGB(sceneColor);
	float factor = (259.0 * (u_cb.x + 255.0)) / (255.0 * (259.0 - u_cb.x));
	sceneColor = factor * (sceneColor - vec3(0.5)) + vec3(0.5);
	out_FragColor = vec4(sceneColor, 1.0);
}`,ie=b+`uniform sampler2D colorTexture;
uniform sampler2D bloomTexture;
uniform float u_glowOnly;
in vec2 v_textureCoordinates;
out vec4 out_FragColor;
void main() {
	vec4 color = texture(colorTexture, v_textureCoordinates);
	vec4 bloom = texture(bloomTexture, v_textureCoordinates);
	out_FragColor = u_glowOnly > 0.5 ? bloom : bloom + color;
}`,ne=b+`uniform sampler2D colorTexture;
uniform sampler2D blurTexture;
uniform sampler2D depthTexture;
uniform vec4 u_dof;   // focalDistance, near, far, 地球あり(1)
uniform vec4 u_earth;  // 地球の中心（目の座標）・半径
uniform vec2 u_tan;    // 画角の半分の tan（x, y）
in vec2 v_textureCoordinates;
// 深度の無い画素：目の光線（目の座標・-z 向き）が球に当たる奥行き（当たらなければ far）
float groundW(vec2 uv) {
	if (u_dof.w < 0.5) return u_dof.z;
	vec3 dir = vec3((uv * 2.0 - 1.0) * u_tan, -1.0);
	float a = dot(dir, dir), b = -2.0 * dot(dir, u_earth.xyz), c = dot(u_earth.xyz, u_earth.xyz) - u_earth.w * u_earth.w;
	float disc = b * b - 4.0 * a * c;
	if (disc < 0.0) return u_dof.z;
	float t = (-b - sqrt(disc)) / (2.0 * a);
	return t > 0.0 ? t : u_dof.z;   // dir.z＝-1＝t がそのまま目からの奥行き
}
out vec4 out_FragColor;
float computeDepthBlur(float depth) {
	float focalDistance = u_dof.x, near = u_dof.y, far = u_dof.z;
	float f;
	if (depth < focalDistance) f = (focalDistance - depth) / (focalDistance - near);
	else { f = (depth - focalDistance) / (far - focalDistance); f = pow(f, 0.1); }
	f *= f;
	f = clamp(f, 0.0, 1.0);
	return pow(f, 0.5);
}
void main() {
	float depth = czm_readDepth(depthTexture, v_textureCoordinates);
	float w = depth >= 1.0 ? groundW(v_textureCoordinates) : exp2(depth * ortho_eyeP.z) - 1.0 + ortho_eyeP.w;   // 目からの奥行き（m）・深度の無い画素＝球に当たる奥行きか far
	float d = computeDepthBlur(w);
	out_FragColor = mix(texture(colorTexture, v_textureCoordinates), texture(blurTexture, v_textureCoordinates), d);
}`;function L(e,f){const w=(y,M)=>{const U=e.createShader(y);if(e.shaderSource(U,M),e.compileShader(U),!e.getShaderParameter(U,e.COMPILE_STATUS)){const x=e.getShaderInfoLog(U);throw e.deleteShader(U),new Error("post stage shader: "+x)}return U},h=e.createProgram(),z=w(e.VERTEX_SHADER,W),l=w(e.FRAGMENT_SHADER,f);if(e.attachShader(h,z),e.attachShader(h,l),e.linkProgram(h),e.deleteShader(z),e.deleteShader(l),!e.getProgramParameter(h,e.LINK_STATUS)){const y=e.getProgramInfoLog(h);throw e.deleteProgram(h),new Error("post stage link: "+y)}return h}function ce(e){let f=e.replace(/^\s*#version[^\n]*\n/,"");return/\bout\s+(?:highp\s+|mediump\s+|lowp\s+)?vec4\s+out_FragColor\b/.test(f)||(f=`out vec4 out_FragColor;
`+f),b+f}function ae(e){const f=new Map;for(const[,w,h]of e.matchAll(/\buniform\s+(?:highp\s+|mediump\s+|lowp\s+)?(float|int|bool|vec2|vec3|vec4|ivec2|ivec3|ivec4|sampler2D)\s+([^;]+);/g))for(const z of h.split(",")){const l=z.trim().replace(/\[.*$/,"");l&&f.set(l,w)}return f}function se(e,f,w,h,z=!1){const l=new Map,y=L(e,J(z)),M=e.getUniformLocation(y,"u_depth"),U=e.getUniformLocation(y,"u_p");let x=null,a=null,p=null,C=null;const A=new Map;let D=null;function B(){if(D)return D;const t=e.getParameter(e.TEXTURE_BINDING_2D);return D=e.createTexture(),e.bindTexture(e.TEXTURE_2D,D),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,255])),e.bindTexture(e.TEXTURE_2D,t),D}function G(t){if(!t)return null;let n=A.get(t);if(n)return n.tex?n:null;n={tex:null,w:1,h:1},A.set(t,n);const _=n;return fetch(t).then(r=>{if(!r.ok)throw new Error(`${r.status} ${t}`);return r.blob()}).then(r=>createImageBitmap(r,{imageOrientation:"flipY"})).then(r=>{if(A.get(t)!==_){r.close();return}const i=e.getParameter(e.TEXTURE_BINDING_2D),u=e.createTexture();e.bindTexture(e.TEXTURE_2D,u),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,e.RGBA,e.UNSIGNED_BYTE,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindTexture(e.TEXTURE_2D,i),_.tex=u,_.w=r.width,_.h=r.height,r.close(),h?.()}).catch(r=>console.warn("[post] stage image failed:",r?.message||r)),null}function O(t,n){if(a&&a.w===t&&a.h===n)return;if(a){for(const u of a.fb)e.deleteFramebuffer(u);for(const u of a.tex)e.deleteTexture(u)}const _=e.getParameter(e.TEXTURE_BINDING_2D),r=[],i=[];for(let u=0;u<2;u++){const T=N(e.RGBA8,t,n,e.RGBA,e.UNSIGNED_BYTE),E=e.createFramebuffer();f.call(e,e.FRAMEBUFFER,E),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,T,0),r.push(T),i.push(E)}e.bindTexture(e.TEXTURE_2D,_),a={w:t,h:n,tex:r,fb:i}}const N=(t,n,_,r,i,u=!1)=>{const T=e.createTexture();e.bindTexture(e.TEXTURE_2D,T),e.texImage2D(e.TEXTURE_2D,0,t,n,_,0,r,i,null);const E=u?e.NEAREST:e.LINEAR;return e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,E),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,E),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),T};function Y(){if(a){for(const t of a.fb)e.deleteFramebuffer(t);for(const t of a.tex)e.deleteTexture(t);a=null}}function I(){if(Y(),!!x){for(const t of x.fb)e.deleteFramebuffer(t);for(const t of x.tex)e.deleteTexture(t);e.deleteFramebuffer(x.dFb),e.deleteTexture(x.dTex),x=null}}function V(t,n){if(x&&x.w===t&&x.h===n)return;I();const _=e.getParameter(e.TEXTURE_BINDING_2D),r=[],i=[];for(let P=0;P<2;P++){const S=N(e.RGBA8,t,n,e.RGBA,e.UNSIGNED_BYTE),F=e.createFramebuffer();f.call(e,e.FRAMEBUFFER,F),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,S,0),r.push(S),i.push(F)}const u=N(e.DEPTH_COMPONENT24,t,n,e.DEPTH_COMPONENT,e.UNSIGNED_INT,!0),T=e.createFramebuffer();f.call(e,e.FRAMEBUFFER,T),e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,u,0);const E=e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE;if(f.call(e,e.FRAMEBUFFER,null),e.bindTexture(e.TEXTURE_2D,_),x={w:t,h:n,tex:r,fb:i,dTex:u,dFb:T},!E)throw I(),new Error("post stage: depth framebuffer incomplete")}function k(t){const n=t.type==="glsl"?"glsl:"+t.src:t.type;if(l.has(n))return l.get(n);let _=null;try{const r=t.type==="silhouette"?Q:t.type==="grey"?g:t.type==="brightness"?ee:t.type==="nightVision"?te:t.type==="lensFlare"?oe:t.type==="depthOfField"?ne:t.type==="cesiumBloom"?ie:ce(t.src),i=L(e,r),u=new Map;if(t.type==="glsl")for(const[T,E]of ae(t.src))E!=="sampler2D"&&u.set(T,{loc:e.getUniformLocation(i,T),type:E});_={p:i,color:e.getUniformLocation(i,"colorTexture"),depth:e.getUniformLocation(i,"depthTexture"),vp:e.getUniformLocation(i,"czm_viewport"),pr:e.getUniformLocation(i,"czm_pixelRatio"),fn:e.getUniformLocation(i,"czm_frameNumber"),eye:e.getUniformLocation(i,"ortho_eyeP"),u,needsDepth:!!e.getUniformLocation(i,"depthTexture")}}catch(r){console.warn(`[post] stage "${t.type}" skipped:`,r?.message||r)}return l.set(n,_),_}function K(t,n,_,r,i,u){V(r,i);const T=t.map(v=>[v,k(v)]).filter(v=>v[1]);e.activeTexture(e.TEXTURE3);const E=e.getParameter(e.TEXTURE_BINDING_2D);e.activeTexture(e.TEXTURE0),e.bindVertexArray(w),e.viewport(0,0,r,i),T.some(v=>v[1].needsDepth)&&(f.call(e,e.FRAMEBUFFER,x.dFb),e.enable(e.DEPTH_TEST),e.depthFunc(e.ALWAYS),e.depthMask(!0),e.useProgram(y),e.uniform1i(M,0),e.uniform4f(U,2*Math.LN2/Math.max(u.logCoef,1e-9),1/Math.log2(5e8),1,0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,_),e.drawArrays(e.TRIANGLES,0,3),e.disable(e.DEPTH_TEST),e.depthFunc(e.LESS));const P=r/Math.max(1,i),S=Math.tan(u.fovy/2),F=[S*P,S,Math.log2(5e8),1];let X=n;for(let v=0;v<T.length;v++){const[o,c]=T[v],j=v===T.length-1;if(o.type==="depthOfField"){O(r,i),p??=L(e,q),e.useProgram(p),e.uniform1i(e.getUniformLocation(p,"colorTexture"),0),e.uniform4f(e.getUniformLocation(p,"czm_viewport"),0,0,r,i),e.uniform1f(e.getUniformLocation(p,"czm_pixelRatio"),u.dpr);const s=e.getUniformLocation(p,"u_blur");e.activeTexture(e.TEXTURE0),f.call(e,e.FRAMEBUFFER,a.fb[0]),e.uniform4f(s,o.delta,o.sigma,o.stepSize,0),e.bindTexture(e.TEXTURE_2D,X),e.drawArrays(e.TRIANGLES,0,3),f.call(e,e.FRAMEBUFFER,a.fb[1]),e.uniform4f(s,o.delta,o.sigma,o.stepSize,1),e.bindTexture(e.TEXTURE_2D,a.tex[0]),e.drawArrays(e.TRIANGLES,0,3)}if(o.type==="cesiumBloom"){O(r,i),C??=L(e,re),p??=L(e,q),e.activeTexture(e.TEXTURE0),e.useProgram(C),e.uniform1i(e.getUniformLocation(C,"colorTexture"),0),e.uniform2f(e.getUniformLocation(C,"u_cb"),o.contrast,o.brightness),f.call(e,e.FRAMEBUFFER,a.fb[0]),e.bindTexture(e.TEXTURE_2D,X),e.drawArrays(e.TRIANGLES,0,3),e.useProgram(p),e.uniform1i(e.getUniformLocation(p,"colorTexture"),0),e.uniform4f(e.getUniformLocation(p,"czm_viewport"),0,0,r,i),e.uniform1f(e.getUniformLocation(p,"czm_pixelRatio"),u.dpr);const s=e.getUniformLocation(p,"u_blur");f.call(e,e.FRAMEBUFFER,a.fb[1]),e.uniform4f(s,o.delta,o.sigma,o.stepSize,0),e.bindTexture(e.TEXTURE_2D,a.tex[0]),e.drawArrays(e.TRIANGLES,0,3),f.call(e,e.FRAMEBUFFER,a.fb[0]),e.uniform4f(s,o.delta,o.sigma,o.stepSize,1),e.bindTexture(e.TEXTURE_2D,a.tex[1]),e.drawArrays(e.TRIANGLES,0,3)}if(f.call(e,e.FRAMEBUFFER,j?null:x.fb[v&1]),e.useProgram(c.p),e.uniform1i(c.color,0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,X),c.depth&&(e.uniform1i(c.depth,1),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,x.dTex),e.activeTexture(e.TEXTURE0)),e.uniform4f(c.vp,0,0,r,i),e.uniform1f(c.pr,u.dpr),e.uniform1f(c.fn,u.frame),e.uniform4f(c.eye,F[0],F[1],F[2],F[3]),o.type==="silhouette")e.uniform1f(e.getUniformLocation(c.p,"u_length"),o.length),e.uniform4f(e.getUniformLocation(c.p,"u_color"),o.color[0],o.color[1],o.color[2],o.color[3]);else if(o.type==="grey")e.uniform1f(e.getUniformLocation(c.p,"u_gradations"),o.gradations);else if(o.type==="brightness")e.uniform1f(e.getUniformLocation(c.p,"u_value"),o.value);else if(o.type==="lensFlare"){const s=G(o.dirt),R=G(o.star);e.uniform4f(e.getUniformLocation(c.p,"u_lf"),o.intensity,o.distortion,o.ghostDispersal,o.haloWidth),e.uniform4f(e.getUniformLocation(c.p,"u_lf2"),s?o.dirtAmount:0,o.space?1:0,o.camrot,0),e.uniform4f(e.getUniformLocation(c.p,"u_sun"),o.sun[0],o.sun[1],0,0),e.uniform4f(e.getUniformLocation(c.p,"u_earth"),o.earth[0],o.earth[1],o.earth[2],0),e.uniform2f(e.getUniformLocation(c.p,"dirtTextureDimensions"),s?s.w:1,s?s.h:1),e.uniform1i(e.getUniformLocation(c.p,"dirtTexture"),2),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,s?.tex??B()),e.uniform1i(e.getUniformLocation(c.p,"starTexture"),3),e.activeTexture(e.TEXTURE3),e.bindTexture(e.TEXTURE_2D,R?.tex??B()),e.activeTexture(e.TEXTURE0)}else if(o.type==="depthOfField"){const s=o.earth,R=o.tan??[F[0],F[1]];e.uniform4f(e.getUniformLocation(c.p,"u_dof"),o.focalDistance,o.near,o.far,s?1:0),e.uniform4f(e.getUniformLocation(c.p,"u_earth"),s?s[0]:0,s?s[1]:0,s?s[2]:0,s?s[3]:0),e.uniform2f(e.getUniformLocation(c.p,"u_tan"),R[0],R[1]),e.uniform1i(e.getUniformLocation(c.p,"blurTexture"),2),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,a.tex[1]),e.activeTexture(e.TEXTURE0)}else if(o.type==="cesiumBloom")e.uniform1f(e.getUniformLocation(c.p,"u_glowOnly"),o.glowOnly?1:0),e.uniform1i(e.getUniformLocation(c.p,"bloomTexture"),2),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,a.tex[0]),e.activeTexture(e.TEXTURE0);else if(o.type==="glsl")for(const[s,R]of Object.entries(o.uniforms)){const d=c.u.get(s);if(!d||!d.loc)continue;const m=typeof R=="boolean"?[R?1:0]:typeof R=="number"?[R]:R;d.type==="float"?e.uniform1f(d.loc,m[0]):d.type==="int"||d.type==="bool"?e.uniform1i(d.loc,m[0]|0):d.type==="vec2"?e.uniform2f(d.loc,m[0],m[1]??0):d.type==="vec3"?e.uniform3f(d.loc,m[0],m[1]??0,m[2]??0):d.type==="vec4"?e.uniform4f(d.loc,m[0],m[1]??0,m[2]??0,m[3]??1):d.type==="ivec2"?e.uniform2i(d.loc,m[0]|0,(m[1]??0)|0):d.type==="ivec3"?e.uniform3i(d.loc,m[0]|0,(m[1]??0)|0,(m[2]??0)|0):d.type==="ivec4"&&e.uniform4i(d.loc,m[0]|0,(m[1]??0)|0,(m[2]??0)|0,(m[3]??0)|0)}e.drawArrays(e.TRIANGLES,0,3),X=x.tex[v&1]}e.activeTexture(e.TEXTURE3),e.bindTexture(e.TEXTURE_2D,E),e.activeTexture(e.TEXTURE0),T.length||f.call(e,e.FRAMEBUFFER,null)}function H(t,n){return V(t,n),{tex:x.tex[1],fb:x.fb[1]}}const Z=t=>t.some(n=>!!k(n));function $(){I();for(const t of l.values())t&&e.deleteProgram(t.p);l.clear(),e.deleteProgram(y),p&&e.deleteProgram(p),p=null,C&&e.deleteProgram(C),C=null;for(const t of A.values())t.tex&&e.deleteTexture(t.tex);A.clear(),D&&e.deleteTexture(D),D=null}return{run:K,target:H,drawable:Z,dispose:$,bytes:()=>(x?x.w*x.h*12:0)+(a?a.w*a.h*8:0)}}export{se as c};
