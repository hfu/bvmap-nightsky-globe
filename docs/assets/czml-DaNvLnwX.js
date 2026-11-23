import{G as b}from"./pbf-base-CiJ2UBNh.js";import{d as u,f as y}from"./czml-T_gO4Qu0.js";import"./pbf-BAkmwiOE.js";import"./utility-COSYcFzm.js";const o=new TextEncoder;onmessage=async c=>{const{buf:p,name:a,opts:s}=c.data,r=s&&s.gz;try{const e=await new b().name(a).set(p),{readable:i,writable:m}=new TransformStream,t=m.getWriter(),w=r?i.pipeThrough(new CompressionStream("gzip")):i,g=new Response(w).blob();(async()=>{await t.write(o.encode(`[
`+JSON.stringify(u(e.name(),e.description()))));for(let n=0,l=e.length;n<l;n++)for(const d of y(e.getFeature(n),n))await t.write(o.encode(`,
`+JSON.stringify(d)));await t.write(o.encode(`
]
`)),await t.close()})();const f=await g;postMessage(new File([f],`${a}.czml${r?".gz":""}`,{type:"application/json"}))}catch{postMessage(null)}};
