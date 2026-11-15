const C="hourly-v1";
const SHELL=["./","./index.html","./css/app.css","./js/config.js","./js/lic.js","./js/app.js","./js/co.js","./privacy.html","./termini.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==C)await caches.delete(k);
  await self.clients.claim();
})())});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  e.respondWith((async()=>{
    const c=await caches.open(C),hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res}).catch(()=>null);
    return hit||(await net)||new Response("Offline",{status:503});
  })());
});
