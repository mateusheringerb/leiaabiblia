/**
 * SERVICE WORKER - BÍBLIA ÁGAPE
 * Versão: 2.6.2 (Atualização Forçada)
 */
const CACHE_NAME = 'biblia-agape-v2.6.2-final';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './bible-data.js',
    './manifest.json',
    './assets/favicon-new.ico',
    './assets/logo-2.png',
    './NVI.json',
    './ACF.json',
    './harpa.json',
    './quiz.json',
    './cantor_cristao.json',
    './novo_cantico_completo.json'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Força o novo SW a assumir imediatamente
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
        ))
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});