const CACHE = "dot1-portal-v21";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add("/")).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always fresh, never cache
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {}); return res; })
                .catch(() => caches.match("/").then((r) => r || Response.error()))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => cached))
  );
});



self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  const title = d.title || "Dot One Studio";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    icon: "/dot1-icon.png",
    badge: "/dot1-icon.png",
    data: { url: d.url || "/" },
    tag: d.tag || undefined,
    renotify: !!d.tag,
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
    for (const w of wins) { if (w.url.indexOf(self.location.origin) === 0 && "focus" in w) { w.navigate(url); return w.focus(); } }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
