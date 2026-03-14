// public/sw.js  ←  place this file in your /public folder
// ─────────────────────────────────────────────────────────────
//  Service Worker  —  Offline support for Daily Income Track
//  Strategy: Network-first with cache fallback
// ─────────────────────────────────────────────────────────────

const CACHE = "dit-cache-v2";
const SHELL = [
    "/",
    "/index.html",
    "/manifest.json",
];

/* ── INSTALL: pre-cache app shell ── */
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE).then(c => {
            // addAll fails silently if any resource 404s in dev — use individual adds
            return Promise.allSettled(SHELL.map(url => c.add(url)));
        })
    );
    self.skipWaiting(); // activate immediately
});

/* ── ACTIVATE: clean old caches ── */
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE).map(k => {
                    console.log("SW: deleting old cache", k);
                    return caches.delete(k);
                })
            )
        )
    );
    self.clients.claim();
});

/* ── FETCH: smart routing ── */
self.addEventListener("fetch", (e) => {
    const { request } = e;
    const url = new URL(request.url);

    // Skip non-GET, chrome-extension, and dev HMR
    if (
        request.method !== "GET" ||
        url.protocol === "chrome-extension:" ||
        url.hostname === "localhost" && url.pathname.startsWith("/@")
    ) return;

    // ── Supabase API: network only (never cache auth/data calls) ──
    if (url.hostname.includes("supabase.co") || url.hostname.includes("supabase.io")) {
        e.respondWith(
            fetch(request).catch(() =>
                new Response(
                    JSON.stringify({ error: "offline", message: "No internet connection." }),
                    { status: 503, headers: { "Content-Type": "application/json" } }
                )
            )
        );
        return;
    }

    // ── Google Fonts: cache-first (fonts rarely change) ──
    if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
        e.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(res => {
                    if (!res || res.status !== 200) return res;
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(request, copy));
                    return res;
                });
            })
        );
        return;
    }

    // ── Everything else: network-first, fallback to cache ──
    e.respondWith(
        fetch(request)
            .then(res => {
                if (!res || res.status !== 200 || res.type === "opaque") return res;
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(request, copy));
                return res;
            })
            .catch(() =>
                caches.match(request).then(cached =>
                    cached ||
                    caches.match("/index.html") || // SPA fallback
                    new Response("Offline", { status: 503 })
                )
            )
    );
});