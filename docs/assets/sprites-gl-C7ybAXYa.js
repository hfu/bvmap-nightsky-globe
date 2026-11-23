import{w as ue,h as fe}from"./rangecache-flag-DUqD5ZxK.js";import{e as de}from"./czml-time-9pw_AL3J.js";import{g as we}from"./glprog-Ctpj38TF.js";import{g as Se}from"./renderworker-D_COh6DJ.js";import"./czml-T_gO4Qu0.js";import"./expr-BgCfkmTG.js";import"./labelkey-DK-6IrK6.js";import"./loader-BDMM-NDo.js";import"./fname2mime-DOppX15p.js";import"./decodeZIP-BZD3MZ78.js";import"./utility-COSYcFzm.js";import"./encodeZIP-BbgXDXij.js";import"./gzip-BVMn5YY7.js";import"./Cache-C9e-FoRZ.js";import"./pbf-BAkmwiOE.js";import"./matrix-DyHkXCDh.js";import"./sunshadow-core-C3uCFzIw.js";const Fe=`#version 300 es
precision highp float;
layout(location = 0) in vec2 a_corner;   // -1..1
layout(location = 1) in vec4 a_c;        // x, y, hw, hh（device px）
layout(location = 2) in vec4 a_col;
layout(location = 3) in vec4 a_ms;       // maximumSize xyz・slice
layout(location = 4) in vec2 a_wb;       // clip w・brightness
uniform vec2 u_vp;
out vec2 v_offset; out vec3 v_maximumSize; out vec4 v_color; out float v_slice; out float v_brightness; out float v_w;
void main() {
	vec2 p = a_c.xy + vec2(a_corner.x * a_c.z, -a_corner.y * a_c.w);   // 画面は y 下向き（Cesium の目の空間の +y＝上）
	v_offset = a_corner * 0.5;
	v_maximumSize = a_ms.xyz; v_slice = a_ms.w; v_color = a_col; v_brightness = a_wb.y; v_w = a_wb.x;
	gl_Position = vec4(p.x / u_vp.x * 2.0 - 1.0, 1.0 - p.y / u_vp.y * 2.0, 0.0, 1.0);
}`,Pe=i=>`#version 300 es
precision highp float;
uniform sampler2D u_noiseTexture;
uniform vec3 u_noiseTextureDimensions;
uniform float u_noiseDetail;
uniform vec2 u_vp;
in vec2 v_offset; in vec3 v_maximumSize; in vec4 v_color; in float v_slice; in float v_brightness; in float v_w;
${i}
out vec4 o;
const float CZM_PI = 3.141592653589793;
const float CZM_EPSILON2 = 0.01;
float wrap(float value, float rangeLength) {
	if (value < 0.0) { float absValue = abs(value); float modValue = mod(absValue, rangeLength); return mod(rangeLength - modValue, rangeLength); }
	return mod(value, rangeLength);
}
vec3 wrapVec(vec3 value, float rangeLength) { return vec3(wrap(value.x, rangeLength), wrap(value.y, rangeLength), wrap(value.z, rangeLength)); }
vec2 voxelToUV(vec3 voxelIndex) {
	float textureSliceWidth = u_noiseTextureDimensions.x;
	float noiseTextureRows = u_noiseTextureDimensions.y;
	float inverseNoiseTextureRows = u_noiseTextureDimensions.z;
	float textureSliceWidthSquared = textureSliceWidth * textureSliceWidth;
	vec2 inverseNoiseTextureDimensions = vec2(noiseTextureRows / textureSliceWidthSquared, inverseNoiseTextureRows / textureSliceWidth);
	vec3 wrappedIndex = wrapVec(voxelIndex, textureSliceWidth);
	float column = mod(wrappedIndex.z, textureSliceWidth * inverseNoiseTextureRows);
	float row = floor(wrappedIndex.z / textureSliceWidth * noiseTextureRows);
	float xPixelCoord = wrappedIndex.x + column * textureSliceWidth;
	float yPixelCoord = wrappedIndex.y + row * textureSliceWidth;
	return vec2(xPixelCoord, yPixelCoord) * inverseNoiseTextureDimensions;
}
vec4 lerpSamplesX(vec3 voxelIndex, float x) {
	vec4 sample0 = texture(u_noiseTexture, voxelToUV(voxelIndex));
	vec4 sample1 = texture(u_noiseTexture, voxelToUV(voxelIndex + vec3(1.0, 0.0, 0.0)));
	return mix(sample0, sample1, x);
}
vec4 sampleNoiseTexture(vec3 position) {
	float textureSliceWidth = u_noiseTextureDimensions.x;
	vec3 recenteredPos = position + vec3(textureSliceWidth / 2.0);
	vec3 lerpValue = fract(recenteredPos);
	vec3 voxelIndex = floor(recenteredPos);
	vec4 xLerp00 = lerpSamplesX(voxelIndex, lerpValue.x);
	vec4 xLerp01 = lerpSamplesX(voxelIndex + vec3(0.0, 0.0, 1.0), lerpValue.x);
	vec4 xLerp10 = lerpSamplesX(voxelIndex + vec3(0.0, 1.0, 0.0), lerpValue.x);
	vec4 xLerp11 = lerpSamplesX(voxelIndex + vec3(0.0, 1.0, 1.0), lerpValue.x);
	vec4 yLerp0 = mix(xLerp00, xLerp10, lerpValue.y);
	vec4 yLerp1 = mix(xLerp01, xLerp11, lerpValue.y);
	return mix(yLerp0, yLerp1, lerpValue.z);
}
bool intersectSphere(vec3 origin, vec3 dir, float slice, out vec3 point, out vec3 normal) {
	float A = dot(dir, dir);
	float B = dot(origin, dir);
	float C = dot(origin, origin) - 0.25;
	float discriminant = (B * B) - (A * C);
	if (discriminant < 0.0) return false;
	float root = sqrt(discriminant);
	float t = (-B - root) / A;
	if (t < 0.0) t = (-B + root) / A;
	point = origin + t * dir;
	if (slice >= 0.0) { point.z = (slice / 2.0) - 0.5; if (length(point) > 0.5) return false; }
	normal = normalize(point);
	point -= CZM_EPSILON2 * normal;
	return true;
}
bool intersectEllipsoid(vec3 origin, vec3 dir, vec3 center, vec3 scale, float slice, out vec3 point, out vec3 normal) {
	if (scale.x <= 0.01 || scale.y < 0.01 || scale.z < 0.01) return false;
	vec3 oo = (origin - center) / scale;
	vec3 d = dir / scale;
	vec3 p, n;
	bool intersected = intersectSphere(oo, d, slice, p, n);
	if (intersected) { point = (p * scale) + center; normal = n; }
	return intersected;
}
vec2 phaseShift2D(vec2 p, vec2 freq) { return (CZM_PI / 2.0) * sin(freq.yx * p.yx); }
vec2 phaseShift3D(vec3 p, vec2 freq) { return phaseShift2D(p.xy, freq) + CZM_PI * vec2(sin(freq.x * p.z)); }
const float T0 = 0.6; const float k = 0.1; const float C0 = 0.8; const float FX0 = 0.6; const float FY0 = 0.6; const int octaves = 5;
float T(vec3 point) {
	vec2 sum = vec2(0.0); float Ci = C0; vec2 FXY = vec2(FX0, FY0); vec2 PXY = vec2(0.0);
	for (int i = 1; i <= octaves; i++) { PXY = phaseShift3D(point, FXY); Ci *= 0.707; FXY *= 2.0; vec2 sinTerm = sin(FXY * point.xy + PXY); sum += Ci * sinTerm + vec2(T0); }
	return k * sum.x * sum.y;
}
const float a = 0.5; const float t = 0.4; const float s = 0.25;
float I(float Id, float Is, float It) { return (1.0 - a) * ((1.0 - t) * ((1.0 - s) * Id + s * Is) + t * It) + a; }
const vec3 lightDir = normalize(vec3(0.2, -1.0, 0.7));
vec4 drawCloud(vec3 rayOrigin, vec3 rayDir, vec3 cloudCenter, vec3 cloudScale, float cloudSlice, float brightness) {
	vec3 cloudPoint, cloudNormal;
	if (!intersectEllipsoid(rayOrigin, rayDir, cloudCenter, cloudScale, cloudSlice, cloudPoint, cloudNormal)) return vec4(0.0);
	float Id = clamp(dot(cloudNormal, -lightDir), 0.0, 1.0);
	float Is = max(pow(dot(-lightDir, -rayDir), 2.0), 0.0);
	float It = T(cloudPoint);
	float intensity = I(Id, Is, It);
	vec3 color = vec3(intensity * clamp(brightness, 0.1, 1.0));
	vec4 noise = sampleNoiseTexture(u_noiseDetail * cloudPoint);
	float W = noise.x; float W2 = noise.y; float W3 = noise.z;
	float ndDot = clamp(dot(cloudNormal, -rayDir), 0.0, 1.0);
	float TR = pow(ndDot, 3.0) - W;
	TR *= 1.3;
	float minusDot = 0.5 - ndDot;
	TR -= min(minusDot * W2, 0.0);
	TR -= 0.8 * (minusDot + 0.25) * W3;
	float shading = mix(1.0 - 0.8 * W * W, 1.0, Id * TR);
	shading = clamp(shading + 0.2, 0.3, 1.0);
	vec3 finalColor = mix(vec3(0.5), shading * color, 1.15);
	return vec4(finalColor, clamp(TR, 0.0, 1.0)) * v_color;
}
void main() {
	vec2 coordinate = v_maximumSize.xy * v_offset;
	vec3 ellipsoidScale = 0.82 * v_maximumSize;
	vec3 ellipsoidCenter = vec3(0.0);
	float zOffset = max(ellipsoidScale.z - 10.0, 0.0);
	vec3 eye = vec3(0, 0, -10.0 - zOffset);
	vec3 rayDir = normalize(vec3(coordinate, 1.0) - eye);
	vec4 cloud = drawCloud(eye, rayDir, ellipsoidCenter, ellipsoidScale, v_slice, v_brightness);
	if (cloud.w < 0.01) discard;
	if (sceneOcclusion(gl_FragCoord.xy / u_vp, v_w) > 0.5) discard;
	o = vec4(cloud.rgb * cloud.a, cloud.a);   // Cesium は ALPHA_BLEND（非前乗算）＝この canvas は前乗算
}`,Ie=`#version 300 es
precision highp float;
uniform vec3 u_noiseTextureDimensions;
layout(location = 0) in vec2 position;
out vec2 v_position;
void main() {
	gl_Position = vec4(position, 0.1, 1.0);
	float textureSliceWidth = u_noiseTextureDimensions.x;
	float noiseTextureRows = u_noiseTextureDimensions.y;
	float inverseNoiseTextureRows = u_noiseTextureDimensions.z;
	vec2 transformedPos = (position * 0.5) + vec2(0.5);
	transformedPos *= textureSliceWidth;
	transformedPos.x *= textureSliceWidth * inverseNoiseTextureRows;
	transformedPos.y *= noiseTextureRows;
	v_position = transformedPos;
}`,Be=`#version 300 es
precision highp float;
uniform vec3 u_noiseTextureDimensions;
uniform float u_noiseDetail;
uniform vec3 u_noiseOffset;
in vec2 v_position;
out vec4 o;
float wrap(float value, float rangeLength) {
	if (value < 0.0) { float absValue = abs(value); float modValue = mod(absValue, rangeLength); return mod(rangeLength - modValue, rangeLength); }
	return mod(value, rangeLength);
}
vec3 wrapVec(vec3 value, float rangeLength) { return vec3(wrap(value.x, rangeLength), wrap(value.y, rangeLength), wrap(value.z, rangeLength)); }
vec3 random3(vec3 p) {
	float dot1 = dot(p, vec3(127.1, 311.7, 932.8));
	float dot2 = dot(p, vec3(269.5, 183.3, 421.4));
	return fract(vec3(sin(dot1 - dot2), cos(dot1 * dot2), dot1 * dot2));
}
vec3 getWorleyCellPoint(vec3 centerCell, vec3 offset, float freq) {
	float textureSliceWidth = u_noiseTextureDimensions.x;
	vec3 cell = centerCell + offset;
	cell = wrapVec(cell, textureSliceWidth / u_noiseDetail);
	cell += floor(u_noiseOffset / u_noiseDetail);
	return offset + random3(cell);
}
float worleyNoise(vec3 p, float freq) {
	vec3 centerCell = floor(p * freq);
	vec3 pointInCell = fract(p * freq);
	float shortestDistance = 1000.0;
	for (float z = -1.0; z <= 1.0; z++) for (float y = -1.0; y <= 1.0; y++) for (float x = -1.0; x <= 1.0; x++) {
		vec3 point = getWorleyCellPoint(centerCell, vec3(x, y, z), freq);
		float distance = length(pointInCell - point);
		if (distance < shortestDistance) shortestDistance = distance;
	}
	return shortestDistance;
}
const float MAX_FBM_ITERATIONS = 10.0;
float worleyFBMNoise(vec3 p, float octaves, float scale) {
	float noise = 0.0; float freq = 1.0; float persistence = 0.625;
	for (float i = 0.0; i < MAX_FBM_ITERATIONS; i++) {
		if (i >= octaves) break;
		noise += worleyNoise(p * scale, freq * scale) * persistence;
		persistence *= 0.5; freq *= 2.0;
	}
	return noise;
}
void main() {
	float textureSliceWidth = u_noiseTextureDimensions.x;
	float inverseNoiseTextureRows = u_noiseTextureDimensions.z;
	float x = mod(v_position.x, textureSliceWidth);
	float y = mod(v_position.y, textureSliceWidth);
	float sliceRow = floor(v_position.y / textureSliceWidth);
	float z = floor(v_position.x / textureSliceWidth) + sliceRow * inverseNoiseTextureRows * textureSliceWidth;
	vec3 position = vec3(x, y, z) / u_noiseDetail;
	float worley0 = clamp(worleyFBMNoise(position, 3.0, 1.0), 0.0, 1.0);
	float worley1 = clamp(worleyFBMNoise(position, 3.0, 2.0), 0.0, 1.0);
	float worley2 = clamp(worleyFBMNoise(position, 3.0, 3.0), 0.0, 1.0);
	o = vec4(worley0, worley1, worley2, 1.0);
}`,Z=128,H=4,$=14,ve=Math.PI/180,j=10,Ue=`#version 300 es
precision highp float;
layout(location = 0) in vec2 a_corner;   // -1..1 の四隅
layout(location = 1) in vec4 a_c;        // x, y, hw, hh（device px）
layout(location = 2) in vec2 a_rw;       // 回転・clip w
layout(location = 3) in vec4 a_col;
uniform vec2 u_vp;
out vec2 v_uv; out vec4 v_col; out float v_w;
void main() {
	float c = cos(a_rw.x), s = sin(a_rw.x);
	vec2 d = vec2(a_corner.x * a_c.z, a_corner.y * a_c.w);
	vec2 p = a_c.xy + vec2(c * d.x - s * d.y, -(s * d.x + c * d.y));   // 画面は y 下向き＝反時計回りは -y
	v_uv = vec2(a_corner.x * 0.5 + 0.5, 0.5 - a_corner.y * 0.5);
	v_col = a_col; v_w = a_rw.y;
	gl_Position = vec4(p.x / u_vp.x * 2.0 - 1.0, 1.0 - p.y / u_vp.y * 2.0, 0.0, 1.0);
}`,xe="highp float sceneOcclusion(highp vec2 uv, highp float w) { return 0.0; }",Ce=i=>`#version 300 es
precision highp float;
in vec2 v_uv; in vec4 v_col; in float v_w;
uniform sampler2D u_img; uniform float u_hasImg; uniform vec2 u_vp;
${i}
out vec4 o;
void main() {
	vec4 t;
	if (u_hasImg > 0.5) t = texture(u_img, v_uv);   // premultiplied で上げてある
	else { float r = length(v_uv * 2.0 - 1.0); float a = clamp((1.0 - r) * 8.0, 0.0, 1.0); t = vec4(a); }
	vec4 col = t * vec4(v_col.rgb, 1.0) * v_col.a;
	if (col.a <= 0.002) discard;
	float occ = sceneOcclusion(vec2(gl_FragCoord.x, gl_FragCoord.y) / u_vp, v_w);
	if (occ > 0.5) discard;
	o = col;
}`;function pe(i,B,A,D,_,O){if(D)return[i/_,A/(_*O),B/_];const w=de(i,B,A),U=w[0]*ve,p=w[1]*ve,d=1+w[2]/_,m=Math.cos(p);return[m*Math.cos(U)*d,Math.sin(p)*d,m*Math.sin(U)*d]}function Je(){let i=null,B=null,A={},D=null,_=!1,O=null,w=null,U=null,p=new Float32Array(0);const d=new Map,m=new Map,T=new Map,k=new Map;let L=null,C={},J=null,Q=null,v=new Float32Array(0),oe=xe;const re=[];let ee=!1;const ie=(e,o)=>we(i,e,o);function me(e,o={},t=null){if(D=t,i=e.getContext("webgl2",Se({premultipliedAlpha:!0,antialias:!1,alpha:!0,depth:!1})),!i)throw new Error("WebGL2 is not available (sprites overlay)");_=o.depth!==!1&&!!t?.depthGLSL,oe=_?t.depthGLSL:xe,{p:B,u:A}=ie(Ue,Ce(oe)),O=i.createVertexArray(),i.bindVertexArray(O),w=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,w),i.bufferData(i.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),i.STATIC_DRAW),i.enableVertexAttribArray(0),i.vertexAttribPointer(0,2,i.FLOAT,!1,0,0),U=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,U);const l=j*4;return i.enableVertexAttribArray(1),i.vertexAttribPointer(1,4,i.FLOAT,!1,l,0),i.vertexAttribDivisor(1,1),i.enableVertexAttribArray(2),i.vertexAttribPointer(2,2,i.FLOAT,!1,l,16),i.vertexAttribDivisor(2,1),i.enableVertexAttribArray(3),i.vertexAttribPointer(3,4,i.FLOAT,!1,l,24),i.vertexAttribDivisor(3,1),i.bindVertexArray(null),_?{depth:!0}:void 0}function _e(e){const o=i,t=o.createTexture();return o.bindTexture(o.TEXTURE_2D,t),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,o.RGBA,o.UNSIGNED_BYTE,e),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE),t}function Te(e){if(e.type==="probe"){re.push(e.id),D?.requestDraw?.();return}if(i){if(e.type==="image"){const o=m.get(e.q);o&&i.deleteTexture(o);const t=e.image?_e(e.image):null;m.set(e.q,t),e.image?.close?.();const l=d.get(e.q);l&&(l.tex=t)}else if(e.type==="clouds"){ee=!0;const o=e.noise?.detail??16,t=e.noise?.offset??[0,0,0];T.set(e.q,{n:e.n,origin:e.origin,pos:e.pos,scale:e.scale,maxSize:e.maxSize,slice:e.slice,bright:e.bright,rgba:e.rgba,detail:o,offset:t,noiseKey:`${o}|${t.join(",")}`,on:T.get(e.q)?.on??!0})}else if(e.type==="layer")ee=!0,d.set(e.q,{n:e.n,origin:e.origin,pos:e.pos,rgba:e.rgba,size:e.size,rot:e.rot??null,meters:!!e.meters,tex:m.get(e.q)??null,on:d.get(e.q)?.on??!0});else if(e.type==="remove"){d.delete(e.q),T.delete(e.q);const o=m.get(e.q);o&&i.deleteTexture(o),m.delete(e.q)}else if(e.type==="vis"){const o=d.get(e.q)??T.get(e.q);o&&(o.on=!!e.on)}else if(e.type==="clear"){d.clear(),T.clear();for(const o of m.values())o&&i.deleteTexture(o);m.clear()}D?.requestDraw?.()}}function ge(e,o){if(!re.length)return;const t=re.splice(0);try{const l=new Uint8Array(e*o*4);i.readPixels(0,0,e,o,i.RGBA,i.UNSIGNED_BYTE,l);for(const r of t)D?.post?.({type:"pixels",id:r,w:e,h:o,flipY:!0,data:r===t[t.length-1]?l:l.slice()})}catch(l){for(const r of t)D?.post?.({type:"pixels",id:r,error:String(l?.message||l)})}}function ye(e,o,t,l,r,a,n){const s=o.mvp,u=o.eye,S=fe(),h=ue(),c=e.origin;p.length<e.n*j&&(p=new Float32Array(Math.max(e.n,64)*j*2));let F=0;for(let x=0;x<e.n;x++){const N=e.rgba[x*4+3];if(!N)continue;const P=c[0]+e.pos[x*3],V=c[1]+e.pos[x*3+1],z=c[2]+e.pos[x*3+2],[E,M,g]=pe(P,V,z,S,h,a),b=s[3]*E+s[7]*M+s[11]*g+s[15];if(b<=1e-9)continue;const I=E-u[0],W=M-u[1],R=g-u[2],X=I*I+W*W+R*R,f=-(u[0]*I+u[1]*W+u[2]*R)/X;if(f>0&&f<1){const G=u[0]+I*f,se=u[1]+W*f,ce=u[2]+R*f;if(G*G+se*se+ce*ce<.99999)continue}if(n){const G=de(P,V,z);if(n.distM(G[0],G[1],G[2])<0)continue}const q=((s[0]*E+s[4]*M+s[8]*g+s[12])/b*.5+.5)*t,Y=(1-((s[1]*E+s[5]*M+s[9]*g+s[13])/b*.5+.5))*l,K=e.meters?o.focal/(b*h):r,ne=e.size[x*2]*K*.5,le=e.size[x*2+1]*K*.5;if(ne<.05&&le<.05)continue;const te=Math.max(ne,le)*1.415;if(q+te<0||Y+te<0||q-te>t||Y-te>l)continue;const y=F*j;p[y]=q,p[y+1]=Y,p[y+2]=ne,p[y+3]=le,p[y+4]=e.rot?e.rot[x]:0,p[y+5]=b,p[y+6]=e.rgba[x*4]/255,p[y+7]=e.rgba[x*4+1]/255,p[y+8]=e.rgba[x*4+2]/255,p[y+9]=N/255,F++}return F}function Ae(){if(L)return;const e=i;({p:L,u:C}=ie(Fe,Pe(oe))),J=e.createVertexArray(),e.bindVertexArray(J),e.bindBuffer(e.ARRAY_BUFFER,w),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),Q=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,Q);const o=$*4;e.enableVertexAttribArray(1),e.vertexAttribPointer(1,4,e.FLOAT,!1,o,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,4,e.FLOAT,!1,o,16),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,4,e.FLOAT,!1,o,32),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,2,e.FLOAT,!1,o,48),e.vertexAttribDivisor(4,1),e.bindVertexArray(null)}function ae(e){const o=k.get(e.noiseKey);if(o)return o;const t=i,l=Z*Z/H,r=Z*H,a=t.createTexture();t.bindTexture(t.TEXTURE_2D,a),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,l,r,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.REPEAT);const n=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,n),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,a,0);const{p:s,u}=ie(Ie,Be),S=t.createVertexArray();t.bindVertexArray(S);const h=t.createBuffer();return t.bindBuffer(t.ARRAY_BUFFER,h),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.viewport(0,0,l,r),t.disable(t.BLEND),t.useProgram(s),t.uniform3f(u.u_noiseTextureDimensions,Z,H,1/H),t.uniform1f(u.u_noiseDetail,e.detail),t.uniform3f(u.u_noiseOffset,e.offset[0]||0,e.offset[1]||0,e.offset[2]||0),t.drawArrays(t.TRIANGLE_STRIP,0,4),t.bindVertexArray(null),t.deleteVertexArray(S),t.deleteBuffer(h),t.deleteProgram(s),t.bindFramebuffer(t.FRAMEBUFFER,null),t.deleteFramebuffer(n),k.set(e.noiseKey,a),a}function he(e,o,t,l,r){const a=o.mvp,n=o.eye,s=fe(),u=ue(),S=e.origin;v.length<e.n*$&&(v=new Float32Array(Math.max(e.n,16)*$*2));let h=0;for(let c=0;c<e.n;c++){if(!e.rgba[c*4+3])continue;const[F,x,N]=pe(S[0]+e.pos[c*3],S[1]+e.pos[c*3+1],S[2]+e.pos[c*3+2],s,u,r),P=a[3]*F+a[7]*x+a[11]*N+a[15];if(P<=1e-9)continue;const V=F-n[0],z=x-n[1],E=N-n[2],M=V*V+z*z+E*E,g=-(n[0]*V+n[1]*z+n[2]*E)/M;if(g>0&&g<1){const q=n[0]+V*g,Y=n[1]+z*g,K=n[2]+E*g;if(q*q+Y*Y+K*K<.99999)continue}const b=((a[0]*F+a[4]*x+a[8]*N+a[12])/P*.5+.5)*t,I=(1-((a[1]*F+a[5]*x+a[9]*N+a[13])/P*.5+.5))*l,W=o.focal/(P*u),R=e.scale[c*2]*W*.5,X=e.scale[c*2+1]*W*.5;if(R<.05&&X<.05||b+R<0||I+X<0||b-R>t||I-X>l)continue;const f=h*$;v[f]=b,v[f+1]=I,v[f+2]=R,v[f+3]=X,v[f+4]=e.rgba[c*4]/255,v[f+5]=e.rgba[c*4+1]/255,v[f+6]=e.rgba[c*4+2]/255,v[f+7]=e.rgba[c*4+3]/255,v[f+8]=e.maxSize[c*3],v[f+9]=e.maxSize[c*3+1],v[f+10]=e.maxSize[c*3+2],v[f+11]=e.slice[c],v[f+12]=P,v[f+13]=e.bright[c],h++}return h}function Ee(e,o,t,l){const r=i;let a=!1;for(const n of T.values())if(n.on&&n.n){a=!0;break}if(a){Ae();for(const n of T.values())n.on&&n.n&&ae(n);r.bindFramebuffer(r.FRAMEBUFFER,null),r.viewport(0,0,o,t),r.useProgram(L),_&&(l?.depth?l.depth.bind(r,L,3):C.u_sceneDepthOn&&r.uniform1f(C.u_sceneDepthOn,0)),r.uniform2f(C.u_vp,o,t),r.uniform3f(C.u_noiseTextureDimensions,Z,H,1/H),r.enable(r.BLEND),r.blendFunc(r.ONE,r.ONE_MINUS_SRC_ALPHA),r.disable(r.DEPTH_TEST),r.bindVertexArray(J);for(const n of T.values()){if(!n.on||!n.n)continue;const s=he(n,e,o,t,l?.rAx||1);s&&(r.bindBuffer(r.ARRAY_BUFFER,Q),r.bufferData(r.ARRAY_BUFFER,v.subarray(0,s*$),r.STREAM_DRAW),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,ae(n)),r.uniform1i(C.u_noiseTexture,0),r.uniform1f(C.u_noiseDetail,n.detail),r.drawArraysInstanced(r.TRIANGLE_STRIP,0,4,s))}r.bindVertexArray(null)}}function be(e,o,t,l){if(!i)return!1;const r=i,{w:a,h:n}=t;if(r.bindFramebuffer(r.FRAMEBUFFER,null),r.viewport(0,0,a,n),r.clearColor(0,0,0,0),r.clear(r.COLOR_BUFFER_BIT),Ee(o,a,n,l),d.size){r.useProgram(B),_&&(l?.depth?l.depth.bind(r,B,3):A.u_sceneDepthOn&&r.uniform1f(A.u_sceneDepthOn,0)),r.uniform2f(A.u_vp,a,n),r.enable(r.BLEND),r.blendFunc(r.ONE,r.ONE_MINUS_SRC_ALPHA),r.disable(r.DEPTH_TEST),r.bindVertexArray(O);for(const s of d.values()){if(!s.on||!s.n)continue;const u=ye(s,o,a,n,e.dpr||l?.dpr||1,l?.rAx||1,l?.clip??null);u&&(r.bindBuffer(r.ARRAY_BUFFER,U),r.bufferData(r.ARRAY_BUFFER,p.subarray(0,u*j),r.STREAM_DRAW),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,s.tex),r.uniform1i(A.u_img,0),r.uniform1f(A.u_hasImg,s.tex?1:0),r.drawArraysInstanced(r.TRIANGLE_STRIP,0,4,u))}r.bindVertexArray(null)}return ge(a,n),ee&&(ee=!1,D?.post?.({type:"drawn"})),!1}const Re=()=>({layers:[...d].map(([e,o])=>({q:e,n:o.n,meters:o.meters,image:!!o.tex,on:o.on})),clouds:[...T].map(([e,o])=>({q:e,n:o.n,on:o.on,noise:k.has(o.noiseKey)}))});function De(){if(i){for(const e of m.values())e&&i.deleteTexture(e);m.clear(),d.clear(),T.clear();for(const e of k.values())i.deleteTexture(e);k.clear(),L&&(i.deleteProgram(L),i.deleteBuffer(Q),i.deleteVertexArray(J)),i.deleteBuffer(w),i.deleteBuffer(U),i.deleteVertexArray(O),i.deleteProgram(B),i.getExtension("WEBGL_lose_context")?.loseContext(),i=null}}return{init:me,message:Te,frame:be,_state:Re,destroy:De}}export{Je as create,pe as ecefToWorld};
