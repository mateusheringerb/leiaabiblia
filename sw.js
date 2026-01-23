/**
 * ============================================================================
 * SERVICE WORKER - BÍBLIA ÁGAPE
 * Versão: 2.1.6
 * Data: 22/01/2026
 * ============================================================================
 * Estratégia de Cache: NETWORK FIRST (Rede Primeiro)
 * * Funcionamento:
 * 1. O SW intercepta a requisição do navegador.
 * 2. Tenta buscar o arquivo mais recente na internet (Network).
 * 3. Se conseguir, salva no Cache (atualizando a versão offline) e entrega ao usuário.
 * 4. Se falhar (sem internet), entrega a versão salva no Cache.
 */

var CACHE_NAME = 'agape-v2.1.6';

// Lista de arquivos vitais para o funcionamento offline
var FILES_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './bible-data.js',
    './manifest.json',

    // Assets de Imagem
    './assets/favicon-new.ico',
    './assets/logo-2.png',
    './assets/logo-new.png',

    // Dados JSON - Bíblias (Traduções)
    './ACF.json',
    './ARA.json',
    './ARC.json',
    './AS21.json',
    './JFAA.json',
    './KJA.json',
    './KJF.json',
    './NAA.json',
    './NBV.json',
    './NTLH.json',
    './NVI.json',
    './NVT.json',
    './TB.json',

    // Dados JSON - Conteúdo Extra
    './harpa.json',
    './cantor_cristao.json',
    './novo_cantico_completo.json',
    './quiz.json'
];

// 1. Instalação: Cache inicial dos arquivos estáticos
self.addEventListener('install', function (event) {
    console.log('[Service Worker] Instalando a versão 2.1.5...');

    // Força o SW a ativar imediatamente
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('[Service Worker] Armazenando arquivos essenciais...');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// 2. Ativação: Limpeza de caches antigos
self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Ativando a versão 2.1.5...');

    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                // Remove caches que não sejam da versão atual
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removendo cache obsoleto:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // Reivindica o controle imediato
    return self.clients.claim();
});

// 3. Interceptação de Rede (Fetch)
self.addEventListener('fetch', function (event) {
    // Ignora requisições que não sejam GET (ex: POST do formulário de contato)
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (networkResponse) {
                // Se a rede responder com sucesso (Status 200), atualiza o cache
                if (networkResponse && networkResponse.status === 200) {
                    var responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }

                // Retorna resposta da rede mesmo se for erro (ex: 404)
                return networkResponse;
            })
            .catch(function () {
                // Se houver falha na rede (OFFLINE), busca no cache
                console.log('[Service Worker] Offline detectado. Buscando no cache:', event.request.url);
                return caches.match(event.request);
            })
    );
});