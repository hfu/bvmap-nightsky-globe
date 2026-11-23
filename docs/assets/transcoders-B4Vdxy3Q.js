const s=t=>{const e=t?.registry?.textureTranscoders;return e?e.names().map(r=>({name:r,url:e.get(r)?.url})).filter(r=>typeof r.url=="string"):[]};export{s as t};
