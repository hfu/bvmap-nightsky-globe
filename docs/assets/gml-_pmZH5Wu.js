import{G as B}from"./pbf-base-CiJ2UBNh.js";import{e as C}from"./encodeZIP-BbgXDXij.js";import{e as P}from"./xml-DXCU6bpl.js";import"./pbf-BAkmwiOE.js";import"./utility-COSYcFzm.js";onmessage=async S=>{const{buf:x,name:i,opts:$}=S.data,_=$&&$.gz;try{const s=await new B().name(i).set(x),a=e=>`${e[1]} ${e[0]}`,c=e=>e.map(a).join(" "),u=(e,n,t)=>`${t}<gml:Polygon gml:id="s${n}">
`+e.map((l,o)=>{const r=o===0?"exterior":"interior";return`${t}  <gml:${r}><gml:LinearRing><gml:posList>${c(l)}</gml:posList></gml:LinearRing></gml:${r}>
`}).join("")+`${t}</gml:Polygon>
`,f=(e,n,t)=>{if(!e)return"";const{type:l,coordinates:o}=e;return l==="Point"?`${t}<gml:Point gml:id="p${n}"><gml:pos>${a(o)}</gml:pos></gml:Point>
`:l==="LineString"?`${t}<gml:LineString gml:id="l${n}"><gml:posList>${c(o)}</gml:posList></gml:LineString>
`:l==="Polygon"?u(o,n,t):l==="MultiPoint"?`${t}<gml:MultiPoint gml:id="mp${n}">
`+o.map((r,m)=>`${t}  <gml:pointMember><gml:Point gml:id="p${n}_${m}"><gml:pos>${a(r)}</gml:pos></gml:Point></gml:pointMember>
`).join("")+`${t}</gml:MultiPoint>
`:l==="MultiLineString"?`${t}<gml:MultiCurve gml:id="mc${n}">
`+o.map((r,m)=>`${t}  <gml:curveMember><gml:LineString gml:id="l${n}_${m}"><gml:posList>${c(r)}</gml:posList></gml:LineString></gml:curveMember>
`).join("")+`${t}</gml:MultiCurve>
`:l==="MultiPolygon"?`${t}<gml:MultiSurface gml:id="ms${n}">
`+o.map((r,m)=>`${t}  <gml:surfaceMember>
${u(r,`${n}_${m}`,t+"    ")}${t}  </gml:surfaceMember>
`).join("")+`${t}</gml:MultiSurface>
`:l==="GeometryCollection"?`${t}<gml:MultiGeometry gml:id="mg${n}">
`+e.geometries.map((r,m)=>`${t}  <gml:geometryMember>
${f(r,`${n}_${m}`,t+"    ")}${t}  </gml:geometryMember>
`).join("")+`${t}</gml:MultiGeometry>
`:""},F=e=>e==null||typeof Blob<"u"&&e instanceof Blob||ArrayBuffer.isView(e)?null:e instanceof Date?e.toISOString():typeof e=="object"?JSON.stringify(e):String(e),M=new Map,w=new Set,y=e=>{let n=M.get(e);if(n)return n;n=e.replace(/[^\p{L}\p{N}_.\-]/gu,"_"),/^[\p{L}_]/u.test(n)||(n="_"+n);for(let t=2,l=n;w.has(n);t++)n=`${l}_${t}`;return w.add(n),M.set(e,n),n},p=new TextEncoder,{readable:j,writable:G}=new TransformStream,g=G.getWriter(),h=new Response(j).blob();(async()=>{await g.write(p.encode(`<?xml version="1.0" encoding="UTF-8"?>
<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" srsName="urn:ogc:def:crs:EPSG::4326">
`));for(let e=0,n=s.length;e<n;e++){const t=s.getFeature(e),l=t.id??`f${e}`;let o=`  <gml:featureMember>
    <gml:GenericFeature gml:id="${P(l)}">
      <gml:geometryProperty>
`;o+=f(t.geometry,`${e}`,"        "),o+=`      </gml:geometryProperty>
`;for(const[r,m]of Object.entries(t.properties)){const L=F(m);L!==null&&r!=="id"&&(o+=`      <${y(r)}>${P(L)}</${y(r)}>
`)}o+=`    </gml:GenericFeature>
  </gml:featureMember>
`,await g.write(p.encode(o))}await g.write(p.encode("</gml:FeatureCollection>")),await g.close()})().catch(e=>g.abort(e));const b=new File([await h],`${i}.gml`,{type:"application/gml+xml"});if(_){const e=await C([b],`${i}_gml.zip`);postMessage(e)}else postMessage(b)}catch{postMessage(null)}};
