/**
 * 最小化 Service Worker - 支援 PWA 安裝
 * 預快取關鍵資源以改善首次載入
 */
const CACHE_NAME = "routecast-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(["/", "/login", "/manifest.json", "/icon.svg", "/icon-192.png", "/icon-512.png"]).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
