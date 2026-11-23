import{G as T}from"./pbf-base-CiJ2UBNh.js";import{e as l}from"./xml-DXCU6bpl.js";import"./pbf-BAkmwiOE.js";import"./utility-COSYcFzm.js";const p=new TextEncoder,F=o=>o==null?null:o instanceof Date?o.toISOString():String(o),y=(o,h,$,f)=>{if(!Array.isArray(o))return null;const m=f===1&&!Array.isArray(o[0])?o:o[h];return Array.isArray(m)?m[$]??null:null};onmessage=async o=>{const{buf:h,name:$,opts:f}=o.data,m=f&&f.gz;try{const b=await new T().name($).set(h),{readable:k,writable:M}=new TransformStream,r=M.getWriter(),z=m?k.pipeThrough(new CompressionStream("gzip")):k,L=new Response(z).blob();(async()=>{await r.write(p.encode(`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="geopbf" xmlns="http://www.topografix.com/GPX/1/1">
`));const A=(a,d,g,s,w,e)=>{const n=s!=null&&Number.isFinite(+s)?`<ele>${+s}</ele>`:"",i=F(w),t=n+(i?`<time>${l(i)}</time>`:"");return t?`${e}<${a} lat="${g}" lon="${d}">${t}</${a}>
`:`${e}<${a} lat="${g}" lon="${d}" />
`};for(let a=0,d=b.length;a<d;a++){const g=b.getFeature(a),{type:s,coordinates:w}=g.geometry,e=g.properties;if(s==="Point"){const n=w;let i=`<wpt lat="${n[1]}" lon="${n[0]}">
`;e.ele!=null&&Number.isFinite(+e.ele)&&(i+=`  <ele>${+e.ele}</ele>
`),e.time!=null&&(i+=`  <time>${l(F(e.time))}</time>
`),e.name!=null&&(i+=`  <name>${l(e.name)}</name>
`),e.desc!=null&&(i+=`  <desc>${l(e.desc)}</desc>
`),e.type!=null&&(i+=`  <type>${l(e.type)}</type>
`),i+=`</wpt>
`,await r.write(p.encode(i))}else if(s==="LineString"||s==="MultiLineString"){const n=s==="MultiLineString"?w:[w],i=()=>(e.name!=null?`  <name>${l(e.name)}</name>
`:"")+(e.desc!=null?`  <desc>${l(e.desc)}</desc>
`:"")+(e.type!=null?`  <type>${l(e.type)}</type>
`:"");if(e.route)for(let t=0;t<n.length;t++){let c=`<rte>
`+i();n[t].forEach(([x,S],u)=>{c+=A("rtept",x,S,y(e.ele,t,u,n.length),y(e.time,t,u,n.length),"  ")}),c+=`</rte>
`,await r.write(p.encode(c))}else{await r.write(p.encode(`<trk>
`+i()));for(let t=0;t<n.length;t++){let c=`  <trkseg>
`;n[t].forEach(([x,S],u)=>{c+=A("trkpt",x,S,y(e.ele,t,u,n.length),y(e.time,t,u,n.length),"    ")}),c+=`  </trkseg>
`,await r.write(p.encode(c))}await r.write(p.encode(`</trk>
`))}}}await r.write(p.encode("</gpx>")),await r.close()})();const P=await L;postMessage(new File([P],`${$}.gpx${m?".gz":""}`,{type:"application/gpx+xml"}))}catch{postMessage(null)}};
