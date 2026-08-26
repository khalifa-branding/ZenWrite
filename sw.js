// ZenWrite Progressive Web App (PWA) Service Worker
const CACHE_NAME = "zenwrite-cache-v2.3.1";
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
            console.log("[ZenWrite SW] Pre-caching offline app shell v2.3.1");
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn("[ZenWrite SW] Pre-cache warning:", err);
            });
        })
    );
    self.skipWaiting();
});

// Activate Event: Instant Cleanup of All Stale Caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log("[ZenWrite SW] Purging old cache:", name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Network-First for Document/HTML Navigation & Stale-While-Revalidate for Static Assets
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Bypass Service Worker cache for live Gemini AI API requests
    if (url.hostname.includes("googleapis.com") || url.hostname.includes("generativelanguage")) {
        return;
    }

    // Only handle GET requests
    if (event.request.method !== "GET") {
        return;
    }

    const isHtmlNavigation = event.request.mode === "navigate" || event.request.destination === "document" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");

    if (isHtmlNavigation) {
        // Network-First: Always deliver freshest content when online, fallback to cache when offline
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then((cached) => {
                        return cached || caches.match("./index.html");
                    });
                })
        );
        return;
    }

    // Static Assets: Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {});

            return cachedResponse || fetchPromise;
        })
    );
});
