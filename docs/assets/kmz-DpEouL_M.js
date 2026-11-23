import{G as F}from"./pbf-base-DB6HGkDn.js";import{e as j}from"./encodeZIP-BbgXDXij.js";import{e as d}from"./xml-DXCU6bpl.js";const v=(c,S=1)=>{const m=Math.round(S*255).toString(16).padStart(2,"0");if(Array.isArray(c))return m+c[2].toString(16).padStart(2,"0")+c[1].toString(16).padStart(2,"0")+c[0].toString(16).padStart(2,"0");const y=c.replace("#",""),g=y.substring(0,2),f=y.substring(2,4),u=y.substring(4,6);return m+u+f+g};onmessage=async c=>{const{buf:S,name:m,opts:y}=c.data,g=y&&y.kmz!==void 0?y.kmz:!0;try{const f=await new F().name(m).set(S),u=[],w=new TextEncoder,{readable:D,writable:x}=new TransformStream,p=x.getWriter(),I=new Response(D).blob();(async()=>{let t=`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
`;t+=`  <Style id="defaultStyle">
    <LineStyle><color>ff0000ff</color><width>2</width></LineStyle>
    <PolyStyle><color>400000ff</color></PolyStyle>
  </Style>
`,await p.write(w.encode(t));const P=e=>`${e[0]},${e[1]},0`,b=e=>e.map(P).join(" "),B=(e,o)=>`${o}<Polygon>
`+e.map((n,r)=>{const a=r===0?"outerBoundaryIs":"innerBoundaryIs";return`${o}  <${a}><LinearRing><coordinates>${b(n)}</coordinates></LinearRing></${a}>
`}).join("")+`${o}</Polygon>
`,L=(e,o)=>{if(!e)return"";const{type:n,coordinates:r}=e;if(n==="Point")return`${o}<Point><coordinates>${P(r)}</coordinates></Point>
`;if(n==="LineString")return`${o}<LineString><coordinates>${b(r)}</coordinates></LineString>
`;if(n==="Polygon")return B(r,o);const a=n==="MultiPoint"?r.map(i=>({type:"Point",coordinates:i})):n==="MultiLineString"?r.map(i=>({type:"LineString",coordinates:i})):n==="MultiPolygon"?r.map(i=>({type:"Polygon",coordinates:i})):n==="GeometryCollection"?e.geometries:null;return a?`${o}<MultiGeometry>
${a.map(i=>L(i,o+"  ")).join("")}${o}</MultiGeometry>
`:""};for(let e=0,o=f.length;e<o;e++){const n=f.getFeature(e),r=n.properties,{color:a,fillOpacity:i,iconData:k,iconName:h}=r;if(t=`  <Placemark>
    <name>${d(n.id??e)}</name>
`,a){const l=v(a,i||1);t+=`    <Style><LineStyle><color>${l}</color></LineStyle><PolyStyle><color>${l}</color></PolyStyle></Style>
`}else t+=`    <styleUrl>#defaultStyle</styleUrl>
`;if(k&&h){const l=`files/${h}`;t+=`    <Style><IconStyle><Icon><href>${d(l)}</href></Icon></IconStyle></Style>
`,u.push(new File([k],l))}t+=`    <ExtendedData>
`;for(const[l,s]of Object.entries(r)){if(["iconData","iconName"].includes(l))continue;const M=s==null||typeof Blob<"u"&&s instanceof Blob||ArrayBuffer.isView(s)?null:s instanceof Date?s.toISOString():typeof s=="object"?JSON.stringify(s):String(s);M!==null&&(t+=`      <Data name="${d(l)}"><value>${d(M)}</value></Data>
`)}t+=`    </ExtendedData>
`,t+=L(n.geometry,"    "),t+=`  </Placemark>
`,await p.write(w.encode(t))}await p.write(w.encode(`</Document>
</kml>`)),await p.close()})().catch(t=>p.abort(t));const $=new File([await I],"doc.kml",{type:"application/vnd.google-earth.kml+xml"});if(g){const t=await j([$,...u],`${m}.kmz`);postMessage(t)}else postMessage($)}catch{postMessage(null)}};
