/**
 * 90 Minutes or More — Service Worker
 * Cache-first strategy for a fast, offline-capable PWA.
 *
 * Generated: June 2026
 * Update this version string to force re-registration:
 */
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `90min-${CACHE_VERSION}`;

/* ── Precache list ─────────────────────────────────────────────────── */
const PRECACHE_URLS = [
  '/',
  '/world-cup-predictor/',
  '/world-cup-predictor/index.html',
  '/world-cup-predictor/matches.html',
  '/world-cup-predictor/game.html',
  '/world-cup-predictor/players-data.js',
  '/leaderboard.html',
];

/* ── Install: populate static cache ────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Force waiting service worker to become active immediately
  self.skipWaiting();
});

/* ── Activate: clean old caches ────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('90min-') && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

/* ── Fetch: cache-first for app assets, network-first for API ──────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Match-schedule API: network-first, fall back to cache ──
  if (url.pathname.includes('/api/match-schedule') ||
      url.pathname.includes('/.netlify/functions/match-schedule')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // ── CDN assets (Tailwind, Google Fonts, Font Awesome): stale-while-revalidate ──
  if (
    url.hostname === 'cdn.tailwindcss.com' ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname === 'cdnjs.cloudflare.com'
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // ── App pages and images: cache-first ──
  if (
    url.pathname.startsWith('/world-cup-predictor/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/' ||
    url.pathname === '/leaderboard.html' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Everything else: network-only (don't interfere) ──
  return;
});

/* ── Cache-first strategy ──────────────────────────────────────────── */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const network = await fetch(request);
    if (network.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, network.clone());
    }
    return network;
  } catch (err) {
    // Offline and not in cache — return a fallback if available
    if (request.destination === 'document') {
      const fallback = await caches.match('/world-cup-predictor/matches.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

/* ── Network-first strategy (for API endpoints) ────────────────────── */
async function networkFirstWithCache(request) {
  try {
    const network = await fetch(request);
    if (network.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, network.clone());
    }
    return network;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

/* ── Stale-while-revalidate (for CDN assets) ───────────────────────── */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((network) => {
    if (network.ok) {
      caches.open(STATIC_CACHE).then((cache) => cache.put(request, network));
    }
  }).catch(() => {
    // Network failed — stale cache is fine
  });

  return cached || fetchPromise;
}
