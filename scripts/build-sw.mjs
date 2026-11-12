import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const files = [
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  ...fs.readdirSync("dist/assets").map((n) => `assets/${n}`),
  ...fs
    .readdirSync("dist/data")
    .filter((n) => n.endsWith(".json"))
    .map((n) => `data/${n}`),
];
const mediaFiles = fs
  .readdirSync("dist/media", { recursive: true })
  .map((n) => path.join("media", n))
  .filter((n) => fs.statSync(path.join("dist", n)).isFile())
  .sort();
const version = crypto
  .createHash("sha256")
  .update(
    [...files, ...mediaFiles]
      .map((n) => fs.readFileSync(path.join("dist", n)))
      .map((b) => crypto.createHash("sha256").update(b).digest("hex"))
      .join(""),
  )
  .digest("hex")
  .slice(0, 12);
const script = `const CACHE='xiajin-v3-${version}';
const PRECACHE=${JSON.stringify(["./", ...files.map((f) => `./${f}`)])};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('xiajin-v3-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.href.startsWith(self.registration.scope))return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
`;
fs.writeFileSync("dist/sw.js", script);
console.log(`Offline cache: ${files.length + 1} resources, ${version}`);
