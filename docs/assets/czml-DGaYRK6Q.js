import{G as b}from"./pbf-base-DB6HGkDn.js";import{d as u,f as y}from"./czml-b1xiUdGF.js";const a=new TextEncoder;onmessage=async c=>{const{buf:w,name:o,opts:s}=c.data,r=s&&s.gz;try{const e=await new b().name(o).set(w),{readable:i,writable:p}=new TransformStream,t=p.getWriter(),m=r?i.pipeThrough(new CompressionStream("gzip")):i,g=new Response(m).blob();(async()=>{await t.write(a.encode(`[
`+JSON.stringify(u(e.name(),e.description()))));for(let n=0,l=e.length;n<l;n++)for(const d of y(e.getFeature(n),n))await t.write(a.encode(`,
`+JSON.stringify(d)));await t.write(a.encode(`
]
`)),await t.close()})();const f=await g;postMessage(new File([f],`${o}.czml${r?".gz":""}`,{type:"application/json"}))}catch{postMessage(null)}};
