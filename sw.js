// ZenWrite Progressive Web App (PWA) Service Worker
const CACHE_NAME = "zenwrite-cache-v1.3.0";
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./config.js",
    "./manifest.json",
    "./favicon.jpg",
    "./favicon.ico",
    "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css",
    "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap"
];

// Install Event: Cache Core App Shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[ZenWrite SW] Pre-caching offline app shell");
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn("[ZenWrite SW] Pre-cache warning:", err);
            });
        })
    );
    self.skipWaiting();
});

// Activate Event: Cleanup Old Caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log("[ZenWrite SW] Removing stale cache:", name);
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Stale-While-Revalidate Strategy for App Assets & Network-Only for Gemini API
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Bypass Service Worker cache for live Gemini AI API requests
    if (url.hostname.includes("googleapis.com") || url.hostname.includes("generativelanguage")) {
        return;
    }

    // Only cache GET requests
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                if (event.request.mode === "navigate") {
                    return caches.match("./index.html");
                }
            });
        })
    );
});
