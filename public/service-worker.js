const CACHE_VERSION = 'v1';
const CACHE_NAME = `creatine-tracker-${CACHE_VERSION}`;
const APP_BASE = '/creatine-tracker/';
const PRECACHE = [APP_BASE, `${APP_BASE}index.html`, `${APP_BASE}manifest.webmanifest`, `${APP_BASE}icons/icon.svg`];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			// Delete all old caches with the 'creatine-tracker-' prefix except the current version
			return Promise.all(
				keys
					.filter((key) => key.startsWith('creatine-tracker-') && key !== CACHE_NAME)
					.map((key) => caches.delete(key)),
			);
		}),
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const requestUrl = new URL(event.request.url);
	const isSameOrigin = requestUrl.origin === self.location.origin;
	const isAppRoute = requestUrl.pathname.startsWith(APP_BASE);

	if (!isSameOrigin || !isAppRoute) return;

	if (event.request.mode === 'navigate') {
		event.respondWith(fetch(event.request).catch(() => caches.match(`${APP_BASE}index.html`)));
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request).then((response) => {
				// Only cache successful responses to prevent error caching
				if (!response || response.status !== 200) return response;
				const responseClone = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
				return response;
			});
		}),
	);
});
