/**
 * ==================================================================================
 * SERVICE WORKER - BÍBLIA ÁGAPE
 * ==================================================================================
 * VERSÃO: 4.0.0
 * DESENVOLVIDO POR: Mateus Heringer
 * REPOSITÓRIO: https://github.com/mateusheringerb
 * LINKEDIN: https://www.linkedin.com/in/mateusheringerb
 * DATA DE ATUALIZAÇÃO: 26 de Janeiro de 2026
 *
 * DESCRIÇÃO:
 * Este arquivo atua como um "porteiro" ou "gerente de tráfego" entre o aplicativo e
 * a internet. Ele é responsável por:
 * 1. Salvar os arquivos essenciais no dispositivo do usuário (Cache).
 * 2. Garantir que o app funcione mesmo sem internet (Offline).
 * 3. Atualizar o conteúdo sempre que houver conexão.
 * ==================================================================================
 */

// ----------------------------------------------------------------------------------
// 1. CONFIGURAÇÕES E DEFINIÇÕES
// ----------------------------------------------------------------------------------

/**
 * CACHE_NAME
 * Pense nisso como uma etiqueta na caixa de arquivos.
 * Sempre que lançamos uma atualização (como a 4.0.0), mudamos esse nome.
 * Isso avisa o navegador que "temos coisas novas" e ele deve descartar a caixa velha.
 */
const CACHE_NAME = 'agape-v4.0.0';

/**
 * FILES_TO_CACHE
 * Esta é a "Lista de Compras" ou "Mala de Viagem".
 * São todos os arquivos que o app precisa para funcionar perfeitamente,
 * mesmo que o usuário esteja no topo de uma montanha sem sinal.
 */
const FILES_TO_CACHE = [
    './',                     // Raiz do app
    './index.html',           // A estrutura principal
    './styles.css',           // A maquiagem (estilos)
    './app.js',               // O cérebro (lógica)
    './bible-data.js',        // Dados auxiliares
    './manifest.json',        // Informações de instalação

    // Imagens e ícones (Identidade visual)
    './assets/favicon-new.ico',
    './assets/logo-2.png',
    './assets/logo-new.png',

    // Dados Bíblicos (JSONs das versões)
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

    // Hinários e Extras
    './harpa.json',
    './cantor_cristao.json',
    './novo_cantico_completo.json',
    './quiz.json'
];

// ----------------------------------------------------------------------------------
// 2. EVENTO DE INSTALAÇÃO (O Primeiro Contato)
// ----------------------------------------------------------------------------------

/**
 * Este evento acontece apenas UMA vez, quando o navegador encontra este arquivo novo.
 * É o momento ideal para "preparar a casa", ou seja, baixar e salvar os arquivos.
 */
self.addEventListener('install', function (event) {
    console.log('[Service Worker] 📥 Instalando a versão 4.0.0...');

    // Força o Service Worker a assumir o controle imediatamente, sem esperar
    // que o usuário feche e reabra a aba.
    self.skipWaiting();

    // O waitUntil diz ao navegador: "Não termine a instalação até que eu acabe isso aqui".
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('[Service Worker] 💾 Armazenando arquivos essenciais no cache...');
                // Aqui a mágica acontece: baixamos tudo da lista FILES_TO_CACHE de uma vez.
                return cache.addAll(FILES_TO_CACHE);
            })
            .catch(function (error) {
                // É sempre bom saber se algo deu errado na instalação (ex: arquivo faltando)
                console.error('[Service Worker] ❌ Falha ao registrar arquivos no cache:', error);
            })
    );
});

// ----------------------------------------------------------------------------------
// 3. EVENTO DE ATIVAÇÃO (A Limpeza)
// ----------------------------------------------------------------------------------

/**
 * Este evento roda quando o Service Worker antigo sai de cena e o novo (v4.0.0) assume.
 * É a hora da "faxina": deletar os caches antigos (v3, v2, etc.) para não ocupar
 * espaço à toa no celular do usuário.
 */
self.addEventListener('activate', function (event) {
    console.log('[Service Worker] 🚀 Ativando a versão 4.0.0...');

    event.waitUntil(
        caches.keys().then(function (keyList) {
            // Varremos todas as "caixas" (caches) que existem no navegador
            return Promise.all(keyList.map(function (key) {
                // Se o nome da caixa não for igual à versão atual (agape-v4.0.0)...
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] 🧹 Removendo cache obsoleto:', key);
                    // ...nós a jogamos fora.
                    return caches.delete(key);
                }
            }));
        })
    );

    // Garante que o SW controle todas as abas abertas imediatamente
    return self.clients.claim();
});

// ----------------------------------------------------------------------------------
// 4. EVENTO DE FETCH (O Interceptador de Pedidos)
// ----------------------------------------------------------------------------------

/**
 * Toda vez que o app pede um arquivo (uma imagem, um script, uma página),
 * este evento intercepta o pedido.
 * * ESTRATÉGIA UTILIZADA: Network First (Rede Primeiro)
 * 1. Tentamos buscar o conteúdo fresco na internet.
 * 2. Se conseguir, salvamos uma cópia nova no cache (para usar depois) e mostramos ao usuário.
 * 3. Se a internet falhar (Offline), entregamos o que temos salvo no cache.
 */
self.addEventListener('fetch', function (event) {

    // VALIDACÃO DE SEGURANÇA:
    // Só queremos lidar com pedidos GET (leitura). Ignoramos POST, PUT, DELETE, etc.
    // Também ignoramos requisições que não sejam 'http' ou 'https' (como chrome-extension://)
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        // Tentativa 1: Ir para a Rede (Internet)
        fetch(event.request)
            .then(function (networkResponse) {

                // Verificação de Sucesso:
                // O servidor respondeu? O status é 200 (OK)? É uma resposta válida?
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Se tudo deu certo na internet, vamos clonar a resposta.
                // Precisamos clonar porque a resposta é um "fluxo" (stream) que só pode ser lido uma vez.
                // Uma cópia vai para o navegador (usuário) e outra para o cache (guardar).
                var responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            })
            .catch(function () {
                // Tentativa 2: Fallback para o Cache (Modo Offline)
                // Se o `fetch` falhar (sem internet), caímos aqui.
                console.log('[Service Worker] 📡 Offline detectado. Buscando no cache:', event.request.url);

                return caches.match(event.request)
                    .then(function (cachedResponse) {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // Opcional: Se não tiver na rede E não tiver no cache,
                        // poderíamos retornar uma página de "Você está offline" genérica aqui.
                        // Por enquanto, retornamos null (o navegador mostrará erro padrão).
                        return null;
                    });
            })
    );
});