// public/sw.js  ← place this in your /public folder
const CACHE_NAME = "daily-income-v1";

// Files to cache for offline use
const PRECACHE = [
    "/",
    "/index.html",
    "/manifest.json",
];

// ── Install: cache core files ──
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
    );
    self.skipWaiting();
});

// ── Activate: remove old caches ──
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Fetch: network first, fallback to cache ──
self.addEventListener("fetch", (e) => {
    // Skip non-GET and chrome-extension requests
    if (e.request.method !== "GET" || e.request.url.startsWith("chrome-extension")) return;

    // For Supabase API calls — network only (no caching auth/data)
    if (e.request.url.includes("supabase.co")) {
        e.respondWith(
            fetch(e.request).catch(() =>
                new Response(JSON.stringify({ error: "You are offline." }), {
                    headers: { "Content-Type": "application/json" },
                })
            )
        );
        return;
    }

    // For everything else — network first, then cache fallback
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                // Cache a copy of the response
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return res;
            })
            .catch(() => caches.match(e.request).then((cached) => cached || caches.match("/index.html")))
    );
});