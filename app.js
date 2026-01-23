/**
 * ============================================================================
 * BÍBLIA ÁGAPE - APLICAÇÃO PRINCIPAL (app.js)
 * Versão: V2.1.5
 * Data: 22/01/2026
 * Autor: Mateus Heringer
 * * Descrição:
 * Arquivo principal de lógica da aplicação PWA.
 * Contém toda a regra de negócio para:
 * - Leitura Bíblica (Offline)
 * - Hinários (Destaque de Coro)
 * - Quiz Progressivo
 * - Planos de Leitura (Gestão Completa)
 * - Editor de Imagens (Canvas com compartilhamento nativo)
 * - Contato via AJAX (FormSubmit)
 * - Backup de Dados (Importar/Exportar)
 * ============================================================================
 */

// ============================================================================
// 1. CONSTANTES E CONFIGURAÇÕES GLOBAIS
// ============================================================================

/**
 * Lista de traduções disponíveis.
 * IMPORTANTE: Os nomes devem coincidir exatamente com os arquivos JSON na raiz.
 */
var TRANSLATIONS = [
    "ACF", // Almeida Corrigida Fiel
    "ARA", // Almeida Revista e Atualizada
    "ARC", // Almeida Revista e Corrigida
    "AS21", // Almeida Século 21
    "JFAA", // João Ferreira de Almeida Atualizada
    "KJA", // King James Atualizada
    "KJF", // King James Fiel
    "NAA", // Nova Almeida Atualizada
    "NBV", // Nova Bíblia Viva
    "NTLH", // Nova Tradução na Linguagem de Hoje
    "NVI", // Nova Versão Internacional
    "NVT", // Nova Versão Transformadora
    "TB" // Tradução Brasileira
];

/**
 * Estado Global da Aplicação (State Management).
 * Armazena as preferências do usuário e o estado atual de navegação.
 * Inicializa com valores salvos no LocalStorage ou valores padrão.
 */
var state = {
    // Preferências Visuais
    fontSize: parseInt(localStorage.getItem('agape_font')) || 18,
    theme: localStorage.getItem('agape_theme') || 'light',

    // Navegação Bíblica
    translation: localStorage.getItem('agape_version') || 'NVI',
    book: parseInt(localStorage.getItem('agape_book')) || 0, // Índice do livro (0 = Gênesis)
    chapter: parseInt(localStorage.getItem('agape_chapter')) || 1,

    // Contexto
    hymnbook: 'harpa', // 'harpa', 'cantor', 'novocantico'
    mode: 'free'       // 'free' (leitura livre) ou 'plan' (seguindo plano)
};

// ============================================================================
// 2. CACHES E VARIÁVEIS DE DADOS
// ============================================================================

// Cache em memória para evitar requisições repetidas na mesma sessão
var bibleCache = {};

// Cache específico para hinários (carregados sob demanda)
var hymnCache = {
    harpa: null,
    cantor: null,
    novocantico: null
};

// Variáveis Voláteis (Sessão Atual)
var currentHymnList = [];
var quizData = [];
var selectedVerse = { id: "", text: "", ref: "" };
var deferredPrompt = null; // Evento de instalação PWA
var currentCanvasBg = 0;   // Fundo do editor de imagem
var touchStartX = 0;       // Controle de Swipe
var touchEndX = 0;

// Dados Persistentes (Carregados do LocalStorage com tratamento de erro)
var savedMarks = {};
try {
    savedMarks = JSON.parse(localStorage.getItem('agape_marks_v2')) || {};
} catch (e) {
    savedMarks = {};
    console.error("Erro ao carregar marcas salvas:", e);
}

var streakData = {};
try {
    streakData = JSON.parse(localStorage.getItem('agape_streak')) || { count: 0, lastDate: "" };
} catch (e) {
    streakData = { count: 0, lastDate: "" };
}

var quizTotalPoints = parseInt(localStorage.getItem('agape_quiz_points')) || 0;

var planProgress = [];
try {
    planProgress = JSON.parse(localStorage.getItem('agape_plan_progress')) || [];
} catch (e) {
    planProgress = [];
}

// Controle de Sessão do Quiz
var quizSession = {
    active: false,
    currentLevel: 'facil',
    streak: 0,
    score: 0,
    history: []
};

// ============================================================================
// 3. INICIALIZAÇÃO DO SISTEMA (BOOTSTRAP)
// ============================================================================

window.onload = async function () {
    try {
        // Log de Autoria (Técnico)
        console.log(
            "%c BÍBLIA ÁGAPE %c v2.1.5 \n%c Desenvolvido por Mateus Heringer & Daniel ",
            "background:#2563eb; color:white; font-weight:bold; padding: 4px 8px; border-radius: 4px 0 0 4px;",
            "background:#1e40af; color:white; padding: 4px 8px; border-radius: 0 4px 4px 0;",
            "color:#2563eb; font-size: 10px; margin-top: 5px; font-weight: bold;"
        );

        console.log("=== Iniciando Sistema Bíblia Ágape V2.1.5 ===");

        // 1. Aplica preferências visuais
        applyTheme(state.theme);
        updateStreakDisplay();
        populateSelectElements(); // Preenche os selects de livros/traduções

        // 2. Carregamento de Dados Assíncronos
        loadDailyVerse();
        await loadQuizData(); // Carrega o JSON do quiz

        // 3. Configuração de Listeners de Eventos
        setupSwipeGestures();
        setupInstallPrompt();
        setupSearchInput();

        // 4. Verifica planos
        checkActivePlan();

        // 5. ATUALIZAÇÃO FORÇADA (Network First Strategy)
        if (navigator.onLine) {
            forceUpdateAll();
        }

        // 6. Configuração de Roteamento (SPA)
        window.history.replaceState({ screen: 'screen-home' }, 'Home', '');

        window.onpopstate = function (event) {
            if (event.state && event.state.screen) {
                _showScreenInternal(event.state.screen);
            } else {
                _showScreenInternal('screen-home');
            }
        };

        // 7. Renderização Inicial
        await loadChapter();
        changeHymnbook();

    } catch (error) {
        console.error("ERRO FATAL NA INICIALIZAÇÃO:", error);
        alert("Ocorreu um erro crítico ao iniciar o aplicativo. Por favor, recarregue a página.");
    }
};

/**
 * Força o download de todos os arquivos JSON críticos para garantir que
 * o Service Worker (Network First) capture a versão mais recente do servidor.
 */
window.forceUpdateAll = async function () {
    console.log("Iniciando atualização forçada de conteúdo em background...");

    var filesToUpdate = TRANSLATIONS.map(function (t) { return t + '.json'; });
    filesToUpdate.push(
        'harpa.json',
        'cantor_cristao.json',
        'novo_cantico_completo.json',
        'quiz.json',
        'bible-data.js'
    );

    for (var i = 0; i < filesToUpdate.length; i++) {
        try {
            // O parâmetro cache: 'reload' força a ida à rede, ignorando cache HTTP
            await fetch('./' + filesToUpdate[i], { cache: 'reload' });
        } catch (e) {
            console.warn("Falha ao atualizar arquivo: " + filesToUpdate[i]);
        }
    }
    console.log("Processo de atualização de cache finalizado.");
};

// ============================================================================
// 4. SISTEMA DE NAVEGAÇÃO E ROTEAMENTO
// ============================================================================

/**
 * Função interna para alternar visibilidade das telas (DIVs).
 * @param {string} screenId - O ID da div a ser exibida.
 */
function _showScreenInternal(screenId) {
    // 1. Oculta todas as telas filhas de main-content
    var screens = document.querySelectorAll('#main-content > div');
    screens.forEach(function (screen) {
        if (screen.id && screen.id.startsWith('screen-')) {
            screen.classList.add('hidden');
        }
    });

    // 2. Exibe a tela alvo
    var targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        window.scrollTo(0, 0); // Reseta o scroll para o topo
    } else {
        console.error("Tela não encontrada: " + screenId);
    }
}

/**
 * Função pública para navegação. Adiciona histórico.
 * @param {string} screenId - ID da tela.
 */
window.showScreen = function (screenId) {
    window.history.pushState({ screen: screenId }, screenId, '');
    _showScreenInternal(screenId);

    // Inicializações específicas por tela
    if (screenId === 'screen-read') {
        // Se vier de fora do plano (navegação manual), garante modo livre
        if (state.mode !== 'plan') {
            state.mode = 'free';
        }
        loadChapter();
    }

    if (screenId === 'screen-quiz') {
        startQuizSession();
    }

    if (screenId === 'screen-highlights') {
        loadHighlightsList();
    }

    if (screenId === 'screen-plan-overview') {
        renderPlanOverview();
    }
};

window.goBack = function () {
    window.history.back();
};

// ============================================================================
// 5. LÓGICA DE LEITURA BÍBLICA (CORRIGIDA)
// ============================================================================

/**
 * Esta função é chamada QUANDO O USUÁRIO MUDA UM SELECT.
 * Ela atualiza o state e depois recarrega o texto.
 */
window.handleNavigationChange = function () {
    var selectTranslation = document.getElementById('read-translation');
    var selectBook = document.getElementById('read-book');
    var selectChapter = document.getElementById('read-chapter');

    if (selectTranslation) { state.translation = selectTranslation.value; }
    if (selectBook) { state.book = parseInt(selectBook.value); }
    if (selectChapter) { state.chapter = parseInt(selectChapter.value); }

    // Atualiza a lista de capítulos se o livro mudou (para evitar capítulo inválido)
    updateChaptersSelect(false);

    // Carrega o texto novo
    loadChapter();
};

/**
 * Carrega o texto do capítulo atual baseado no estado global.
 */
async function loadChapter() {
    window.scrollTo(0, 0);
    var container = document.getElementById('text-container');

    // 1. Atualiza os selects visualmente para combinar com o STATE atual (importante para o plano de leitura)
    var selectTranslation = document.getElementById('read-translation');
    var selectBook = document.getElementById('read-book');
    var selectChapter = document.getElementById('read-chapter');

    if (selectTranslation) selectTranslation.value = state.translation;
    if (selectBook) {
        selectBook.value = state.book;
        // Precisamos garantir que os capítulos do livro atual estejam populados
        updateChaptersSelect(false);
    }
    if (selectChapter) selectChapter.value = state.chapter;

    // 2. Persiste Estado no LocalStorage
    localStorage.setItem('agape_version', state.translation);
    localStorage.setItem('agape_book', state.book);
    localStorage.setItem('agape_chapter', state.chapter);

    // 3. Indicador de Carregamento
    container.innerHTML = '<div class="text-center p-10 text-gray-500 animate-pulse flex flex-col items-center justify-center h-64">Carregando Escrituras Sagradas...</div>';

    try {
        // 4. Verifica Cache de Tradução
        if (!bibleCache[state.translation]) {
            var response = await fetch('./' + state.translation + '.json');
            if (!response.ok) { throw new Error("Falha no download da tradução: " + response.status); }
            bibleCache[state.translation] = await response.json();
        }

        // 5. Recupera Dados do Livro
        var bookData = bibleCache[state.translation][state.book];

        // 6. Validação de Segurança (Capítulo fora do índice)
        if (!bookData || !bookData.chapters || !bookData.chapters[state.chapter - 1]) {
            state.chapter = 1;
            if (selectChapter) selectChapter.value = 1;
        }

        var versesArray = bookData.chapters[state.chapter - 1];
        var bookName = BIBLE_BOOKS[state.book].name;

        // Verifica se é Evangelho para destacar falas de Jesus
        var isGospel = (state.book >= 39 && state.book <= 42);

        var htmlBuilder = '';

        // 7. Loop de Renderização
        versesArray.forEach(function (text, index) {
            var verseNumber = index + 1;
            var verseId = state.book + '-' + state.chapter + '-' + verseNumber;

            // Verifica marcação salva
            var markClass = savedMarks[verseId] || '';

            var reference = bookName + ' ' + state.chapter + ':' + verseNumber;
            var content = text;

            // Processamento de Texto (Letras Vermelhas)
            if (isGospel) {
                content = content
                    .replace(/“([^”]+)”/g, '<span class="red-letter">“$1”</span>')
                    .replace(/"([^"]+)"/g, '<span class="red-letter">"$1"</span>');
            }

            htmlBuilder +=
                '<div class="flex gap-3 relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition ' + markClass + '" ' +
                '     id="v-' + verseNumber + '" onclick="handleVerseClick(\'' + verseId + '\', \'' + escapeHtml(text) + '\', \'' + reference + '\')">' +
                '    <span class="text-xs font-bold text-bible-500 mt-1.5 select-none w-6 text-right shrink-0">' + verseNumber + '</span>' +
                '    <p class="verse-content text-lg text-gray-800 dark:text-gray-200 flex-1 leading-relaxed" style="font-size:' + state.fontSize + 'px">' + content + '</p>' +
                '</div>';
        });

        container.innerHTML = htmlBuilder;

        // Re-attach de Eventos de Swipe
        setupSwipeGestures();

    } catch (error) {
        console.error("Erro na Leitura:", error);
        container.innerHTML = '<div class="text-center p-10 text-red-500 font-bold">Erro ao carregar o texto bíblico. Verifique sua conexão.</div>';
    }
}

/**
 * Função para mudar o capítulo atual (botões flutuantes).
 * ATUALIZADO: Suporte para navegação cronológica.
 * @param {number} delta - +1 para próximo, -1 para anterior.
 */
window.changeChapter = function (delta) {
    // 1. Tenta carregar configuração do plano
    var planConfig = null;
    try { planConfig = JSON.parse(localStorage.getItem('agape_plan')); } catch (e) { }

    // 2. Verifica se estamos no modo plano e se ele é cronológico
    if (state.mode === 'plan' && planConfig && planConfig.type === 'chronological' && typeof FLAT_CHRONO_INDEX !== 'undefined') {
        // Encontra o índice atual no array linear cronológico
        var currentIndex = FLAT_CHRONO_INDEX.findIndex(function (x) { return x.b === state.book && x.c === state.chapter; });

        if (currentIndex !== -1) {
            var nextIndex = currentIndex + delta;

            // Verifica limites do array
            if (nextIndex >= 0 && nextIndex < FLAT_CHRONO_INDEX.length) {
                var nextItem = FLAT_CHRONO_INDEX[nextIndex];
                state.book = nextItem.b;
                state.chapter = nextItem.c;
                loadChapter();
                return; // Encerra a função, evitando o comportamento padrão
            } else {
                return; // Fim ou Início do Plano
            }
        }
    }

    // --- COMPORTAMENTO PADRÃO (BÍBLIA SEQUENCIAL) ---
    var maxChapters = BIBLE_BOOKS[state.book].caps;
    var nextChapter = state.chapter + delta;

    // Lógica para avançar para o próximo livro
    if (nextChapter > maxChapters) {
        if (state.book < 65) {
            state.book++;
            nextChapter = 1;
        } else {
            return; // Fim da Bíblia
        }
    }
    // Lógica para voltar para o livro anterior
    else if (nextChapter < 1) {
        if (state.book > 0) {
            state.book--;
            nextChapter = BIBLE_BOOKS[state.book].caps;
        } else {
            return; // Início da Bíblia
        }
    }

    state.chapter = nextChapter;
    loadChapter();
};

window.updateChaptersSelect = function (shouldLoadText) {
    var selectChapter = document.getElementById('read-chapter');
    var bookIndex = state.book; // Usa o estado atual, não o valor do select (pois pode não ter mudado ainda)

    // Limpa
    selectChapter.innerHTML = '';

    // Popula
    for (var i = 1; i <= BIBLE_BOOKS[bookIndex].caps; i++) {
        selectChapter.add(new Option(i, i));
    }

    // Ajusta limites
    if (state.chapter > BIBLE_BOOKS[bookIndex].caps) {
        state.chapter = 1;
    }
    selectChapter.value = state.chapter;

    if (shouldLoadText) {
        loadChapter();
    }
};

window.populateSelectElements = function () {
    var selectTrans = document.getElementById('read-translation');
    if (selectTrans) {
        selectTrans.innerHTML = TRANSLATIONS.map(function (t) {
            return '<option value="' + t + '">' + t + '</option>';
        }).join('');
        selectTrans.value = state.translation;
    }

    var selectPlanTrans = document.getElementById('plan-translation');
    if (selectPlanTrans) {
        selectPlanTrans.innerHTML = TRANSLATIONS.map(function (t) {
            return '<option value="' + t + '">' + t + '</option>';
        }).join('');
        selectPlanTrans.value = 'NVI';
    }

    var selectBook = document.getElementById('read-book');
    if (selectBook) {
        selectBook.innerHTML = '';
        BIBLE_BOOKS.forEach(function (book, index) {
            selectBook.add(new Option(book.name, index));
        });
        selectBook.value = state.book;
        updateChaptersSelect(false);
    }
};

// ============================================================================
// 6. GESTÃO DE PLANOS DE LEITURA
// ============================================================================

/**
 * Calcula os capítulos de um dia e formata o texto de exibição.
 * ATUALIZADO: Agrupa intervalos para exibição mais clara (Ex: "Gênesis 7-11; Jó 1-2")
 */
function getPlanDataForDay(dayIndex, totalDuration, type) {
    if (typeof FLAT_BIBLE_INDEX === 'undefined') return null;

    var sourceIndex = (type === 'chronological') ? FLAT_CHRONO_INDEX : FLAT_BIBLE_INDEX;
    var chaptersPerDay = sourceIndex.length / totalDuration;

    var startIndex = Math.floor((dayIndex - 1) * chaptersPerDay);
    var endIndex = Math.floor(dayIndex * chaptersPerDay) - 1;

    if (startIndex >= sourceIndex.length) return null;

    var safeEndIndex = Math.min(endIndex, sourceIndex.length - 1);

    var startItem = sourceIndex[startIndex]; // Item inicial para o clique (abrir leitura)

    // --- NOVA LÓGICA DE FORMATAÇÃO DE INTERVALOS ---
    var chunks = [];
    var currentChunk = null;

    for (var i = startIndex; i <= safeEndIndex; i++) {
        var item = sourceIndex[i];
        var bookName = BIBLE_BOOKS[item.b].name;

        if (!currentChunk) {
            // Inicia o primeiro bloco
            currentChunk = { name: bookName, start: item.c, end: item.c };
        } else {
            // Verifica continuidade: Mesmo livro E capítulo sequencial
            // Nota: Se o plano cronológico pular caps dentro do mesmo livro, isso cria um novo bloco.
            if (currentChunk.name === bookName && item.c === currentChunk.end + 1) {
                currentChunk.end = item.c;
            } else {
                // Fecha bloco anterior e inicia novo
                chunks.push(currentChunk);
                currentChunk = { name: bookName, start: item.c, end: item.c };
            }
        }
    }
    // Adiciona o último bloco pendente
    if (currentChunk) chunks.push(currentChunk);

    // Gera o texto final (Ex: "Gênesis 1-3; Jó 1")
    var rangeText = chunks.map(function (c) {
        if (c.start === c.end) return c.name + ' ' + c.start;
        return c.name + ' ' + c.start + '-' + c.end;
    }).join('; ');

    return { rangeText: rangeText, start: startItem };
}

window.renderPlanOverview = function () {
    var config = JSON.parse(localStorage.getItem('agape_plan'));
    var container = document.getElementById('plan-overview-list');

    if (!config || !config.active) {
        container.innerHTML = '<div class="text-center p-10 flex flex-col items-center"><p class="text-gray-500 mb-4">Nenhum plano ativo.</p><button onclick="openPlanSetup()" class="bg-bible-600 text-white px-6 py-2 rounded-lg font-bold">Criar Plano Agora</button></div>';
        return;
    }

    var totalDays = parseInt(config.duration);
    var completedCount = planProgress.length;
    var pct = Math.round((completedCount / totalDays) * 100);

    document.getElementById('plan-progress-bar').style.width = pct + '%';
    document.getElementById('plan-progress-text').innerText = pct + '% Concluído';

    var htmlBuilder = '';

    for (var i = 1; i <= totalDays; i++) {
        var isDone = planProgress.includes(i);
        var planData = getPlanDataForDay(i, totalDays, config.type);

        if (!planData) continue;

        var checkIcon = isDone ? 'ph-check' : 'ph-circle';
        var cardClass = isDone ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-700';
        var btnClass = isDone ? 'bg-green-500 text-white shadow-green-500/30 shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200';
        var textClass = isDone ? 'line-through opacity-70 text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200';

        // IMPORTANTE: Passamos os argumentos do dia específico (b, c) para o onclick
        htmlBuilder +=
            '<div class="bg-white dark:bg-gray-800 p-4 rounded-xl border ' + cardClass + ' flex items-center justify-between shadow-sm transition">' +
            '   <div class="flex-1 cursor-pointer" onclick="openPlanDayReading(' + planData.start.b + ',' + planData.start.c + ')">' +
            '       <div class="flex items-center gap-2 mb-1">' +
            '           <p class="text-xs font-bold text-gray-400 uppercase">Dia ' + i + '</p>' +
            '           <i class="ph-bold ph-book-open-text text-bible-500 text-xs"></i>' +
            '       </div>' +
            '       <h4 class="font-bold text-lg ' + textClass + '">' + planData.rangeText + '</h4>' +
            '   </div>' +
            '   <button onclick="togglePlanDay(' + i + ')" class="p-3 rounded-full transition ' + btnClass + '">' +
            '       <i class="ph-bold ' + checkIcon + ' text-xl"></i>' +
            '   </button>' +
            '</div>';
    }
    container.innerHTML = htmlBuilder;
};

window.togglePlanDay = function (day) {
    var index = planProgress.indexOf(day);
    if (index === -1) planProgress.push(day);
    else planProgress.splice(index, 1);
    localStorage.setItem('agape_plan_progress', JSON.stringify(planProgress));
    renderPlanOverview();
};

window.openPlanDayReading = function (book, chapter) {
    state.book = book;
    state.chapter = chapter;
    state.mode = 'plan';
    showScreen('screen-read');
};

window.deleteCurrentPlan = function () {
    if (confirm("ATENÇÃO: Deseja excluir o plano atual? Todo o progresso será perdido.")) {
        localStorage.removeItem('agape_plan');
        localStorage.removeItem('agape_plan_progress');
        planProgress = [];
        document.getElementById('active-plan-card').classList.add('hidden');
        alert("Plano excluído.");
        goBack();
    }
};

window.startNewPlan = function () {
    var type = document.querySelector('input[name="plan_order"]:checked').value;
    var duration = document.getElementById('plan-duration').value;
    var translation = document.getElementById('plan-translation').value;

    localStorage.setItem('agape_plan', JSON.stringify({ active: true, start: new Date(), type: type, duration: duration }));
    planProgress = [];
    localStorage.setItem('agape_plan_progress', '[]');

    state.translation = translation;
    localStorage.setItem('agape_version', translation);

    closeModal('modal-plan');
    document.getElementById('active-plan-card').classList.remove('hidden');

    alert("Plano Criado!");
    showScreen('screen-plan-overview');
};

// ============================================================================
// 7. LÓGICA DE HINÁRIOS (COM DESTAQUE PARA CORO)
// ============================================================================

window.changeHymnbook = async function () {
    var select = document.getElementById('hymnbook-select');
    if (select) state.hymnbook = select.value;

    var container = document.getElementById('harpa-list');
    container.innerHTML = '<div class="p-10 opacity-50 text-center">Carregando Hinário...</div>';

    if (!hymnCache[state.hymnbook]) {
        try {
            var filename = 'harpa.json';
            if (state.hymnbook === 'cantor') filename = 'cantor_cristao.json';
            else if (state.hymnbook === 'novocantico') filename = 'novo_cantico_completo.json';

            var response = await fetch('./' + filename);
            if (!response.ok) throw new Error("Erro 404");
            var jsonData = await response.json();

            hymnCache[state.hymnbook] = normalizeHymnData(jsonData, state.hymnbook);
        } catch (e) {
            container.innerHTML = '<div class="text-red-500 text-center p-4">Erro ao carregar hinário.</div>';
            return;
        }
    }

    currentHymnList = hymnCache[state.hymnbook];
    renderHymnList(currentHymnList);
};

function normalizeHymnData(data, type) {
    var list = [];

    if (type === 'harpa') {
        Object.keys(data).forEach(function (key) {
            if (data[key].hino) {
                list.push({
                    id: key,
                    title: data[key].hino,
                    fullText: data[key].verses ? Object.values(data[key].verses).join('\n\n') : '',
                    chorus: data[key].coro
                });
            }
        });
    } else if (type === 'cantor') {
        var source = Array.isArray(data) ? data : Object.values(data);
        source.forEach(function (h) {
            list.push({
                id: h.id,
                title: h.id + ' - ' + (h.title || ''),
                fullText: h.lyrics || h.hino
            });
        });
    } else if (type === 'novocantico') {
        var source = Array.isArray(data) ? data : (data.hinos || []);
        source.forEach(function (h) {
            list.push({
                id: h.numero,
                title: h.numero + ' - ' + h.titulo,
                fullText: h.letra
            });
        });
    }
    return list;
}

function renderHymnList(list) {
    var container = document.getElementById('harpa-list');
    var displayList = list.slice(0, 100);

    container.innerHTML = displayList.map(function (h) {
        var cleanTitle = h.title.replace(/^\d+\s*-\s*/, '');
        return '<div onclick="openHymn(\'' + h.id + '\')" class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer flex items-center gap-3 hover:border-bible-500 transition shadow-sm">' +
            '    <span class="w-10 h-10 rounded-full bg-bible-50 text-bible-600 font-bold flex items-center justify-center text-sm shrink-0">' + h.id + '</span>' +
            '    <span class="truncate font-medium flex-1">' + cleanTitle + '</span>' +
            '</div>';
    }).join('');
}

window.openHymn = function (id) {
    var hymn = currentHymnList.find(function (x) { return x.id.toString() === id.toString(); });
    if (!hymn) return;

    document.getElementById('hymn-title').innerText = hymn.title;
    var htmlContent = '';

    // Tratamento de Letra e Coro
    if (hymn.fullText) {
        var parts = hymn.fullText.split(/\n\n/);
        htmlContent = parts.map(function (part) {
            var lower = part.toLowerCase();
            // Identifica se é coro
            var isChorus = lower.includes('[coro]') || lower.includes('coro:') || lower.includes('refrão');
            var cleanText = part.replace(/\[coro\]/gi, '').replace(/coro:/gi, '').trim();

            // Aplica estilo destacado se for coro (div.hymn-chorus definida no CSS)
            if (isChorus) {
                return '<div class="hymn-chorus">' + cleanText.replace(/\n/g, '<br>') + '</div>';
            } else {
                return '<div class="mb-8 leading-loose">' + cleanText.replace(/\n/g, '<br>') + '</div>';
            }
        }).join('');
    } else if (hymn.chorus) {
        // Fallback antigo
        htmlContent = '<div class="hymn-chorus">' + hymn.chorus + '</div>';
    }

    document.getElementById('hymn-content').innerHTML = htmlContent;
    showScreen('screen-hymn');
};

window.filterHarpa = function () {
    var term = document.getElementById('harpa-search').value.toLowerCase();
    var filtered = currentHymnList.filter(function (h) {
        return h.title.toLowerCase().includes(term) || h.id.toString() === term;
    });
    renderHymnList(filtered);
};

// ============================================================================
// 8. QUIZ BÍBLICO (LÓGICA PROGRESSIVA)
// ============================================================================

window.loadQuizData = async function () {
    try {
        var r = await fetch('./quiz.json');
        if (r.ok) quizData = await r.json();
    } catch (e) { console.error(e); }
    document.getElementById('quiz-points').innerText = quizTotalPoints;
};

window.startQuizSession = function () {
    quizSession = { active: true, currentLevel: 'facil', streak: 0, score: 0, history: [] };
    renderQuizQuestion();
};

window.renderQuizQuestion = function () {
    var container = document.getElementById('quiz-container');

    var pool = quizData.filter(function (q) {
        return q.nivel === quizSession.currentLevel && !quizSession.history.includes(q.id);
    });

    if (pool.length === 0) {
        pool = quizData.filter(function (q) { return !quizSession.history.includes(q.id); });
    }

    if (pool.length === 0) {
        container.innerHTML = '<div class="text-center p-8"><h3 class="font-bold text-2xl mb-2">Parabéns!</h3><button onclick="startQuizSession()" class="bg-bible-600 text-white px-6 py-3 rounded-xl font-bold mt-4">Reiniciar</button></div>';
        return;
    }

    var question = pool[Math.floor(Math.random() * pool.length)];

    container.innerHTML =
        '<div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in">' +
        '   <div class="flex justify-between items-center mb-4"><span class="bg-bible-100 dark:bg-bible-900/30 text-bible-700 dark:text-bible-300 text-xs font-bold px-3 py-1 rounded-full uppercase">' + quizSession.currentLevel + '</span></div>' +
        '   <h3 class="text-xl font-bold my-4">' + question.pergunta + '</h3>' +
        '   <div class="space-y-3">' +
        question.opcoes.map(function (op, i) {
            return '<button onclick="handleQuizAnswer(' + question.id + ',' + i + ',this)" class="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium flex gap-3 group items-center">' +
                '    <div class="w-8 h-8 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center font-bold text-sm text-gray-500 group-hover:text-bible-600 shadow-sm">' + ['A', 'B', 'C', 'D'][i] + '</div>' +
                '    <span class="flex-1">' + op + '</span>' +
                '</button>';
        }).join('') +
        '   </div>' +
        '</div>';
};

window.handleQuizAnswer = function (questionId, optionIndex, btnElement) {
    document.querySelectorAll('#quiz-container button').forEach(function (b) { b.disabled = true; });
    var question = quizData.find(function (x) { return x.id === questionId; });

    btnElement.classList.remove('bg-gray-50', 'dark:bg-gray-700');

    if (optionIndex === question.correta) {
        btnElement.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
        quizTotalPoints += 10;
        quizSession.streak++;
        quizSession.history.push(questionId);

        localStorage.setItem('agape_quiz_points', quizTotalPoints);
        document.getElementById('quiz-points').innerText = quizTotalPoints;

        if (quizSession.streak >= 2) {
            if (quizSession.currentLevel === 'facil') quizSession.currentLevel = 'medio';
            else if (quizSession.currentLevel === 'medio') quizSession.currentLevel = 'dificil';
            quizSession.streak = 0;
        }
        setTimeout(renderQuizQuestion, 1200);
    } else {
        btnElement.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
        if (navigator.vibrate) navigator.vibrate(200);
        quizSession.streak = 0;
        setTimeout(function () {
            alert('Incorreto! A resposta correta era: ' + question.opcoes[question.correta]);
            quizSession.history.push(questionId);
            renderQuizQuestion();
        }, 1000);
    }
};

// ============================================================================
// 9. CRIADOR DE STORIES (CANVAS) - EXPANDIDO E DETALHADO
// ============================================================================

window.openImageCreator = function () {
    document.getElementById('modal-image-creator').classList.remove('hidden');
    document.getElementById('modal-image-creator').classList.add('flex');
    drawCanvas();
};

window.openImageCreatorFromVerse = function () {
    closeModal('modal-verse');
    openImageCreator();
};

window.changeCanvasBg = function (i) {
    currentCanvasBg = i;
    drawCanvas();
};

/**
 * Função responsável por desenhar o conteúdo no Canvas (Editor de Imagem).
 * ATUALIZAÇÃO: Adicionado crédito do desenvolvedor na imagem gerada.
 * Lógica expandida para maior clareza.
 */
function drawCanvas() {
    var canvas = document.getElementById('image-editor-canvas');
    var ctx = canvas.getContext('2d');

    // 1. Definição do Fundo (Lógica de cores)
    // Mantém a lógica original mas formatada para leitura clara
    if (currentCanvasBg === 0) {
        ctx.fillStyle = '#111827'; // Dark Gray
    } else if (currentCanvasBg === 1) {
        ctx.fillStyle = '#2563eb'; // Blue
    } else if (currentCanvasBg === 2) {
        ctx.fillStyle = '#7c3aed'; // Purple
    } else {
        ctx.fillStyle = '#059669'; // Emerald
    }

    // Preenche o fundo
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Configuração de Texto Principal (Versículo)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 70px "Merriweather"'; // Fonte serifada para o texto sagrado
    ctx.textAlign = 'center';

    // Obtém o texto do versículo selecionado ou do versículo do dia
    var text = selectedVerse.text || document.getElementById('daily-text').innerText;
    var ref = selectedVerse.ref || document.getElementById('daily-reference').innerText;

    // Remove aspas duplas extras para evitar duplicação visual
    text = text.replace(/^"|"$/g, '');

    // Função auxiliar para quebrar o texto em múltiplas linhas (Word Wrap)
    // x=540 (centro), y=800 (início vertical), maxW=900 (margem), lineHeight=100
    wrapText(ctx, '"' + text + '"', 540, 800, 900, 100);

    // 3. Renderiza a Referência Bíblica
    ctx.font = 'italic 50px "Inter"';
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; // Levemente transparente
    ctx.fillText(ref, 540, 1500);

    // ==================================================================
    // 4. CRÉDITOS E BRANDING NA IMAGEM (NOVO BLOCO)
    // ==================================================================

    // Nome do App (Destaque maior)
    ctx.font = 'bold 40px "Inter"';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText("Bíblia Ágape App", 540, 1680);

    // Crédito do Desenvolvedor (Mateus Heringer & Daniel)
    ctx.font = 'normal 24px "Inter"';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("Dev. Mateus Heringer & Daniel", 540, 1730);
}

/**
 * Função auxiliar para quebra de linha em Canvas.
 * Calcula se uma palavra excede a largura máxima e joga para a próxima linha.
 */
function wrapText(ctx, t, x, y, mw, lh) {
    var words = t.split(' ');
    var line = '';

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;

        if (testWidth > mw && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lh;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

window.downloadCreatedImage = function () {
    var l = document.createElement('a');
    l.download = 'story_biblia_agape.png';
    l.href = document.getElementById('image-editor-canvas').toDataURL('image/png');
    l.click();
};

window.shareCreatedImage = function () {
    var canvas = document.getElementById('image-editor-canvas');
    canvas.toBlob(function (blob) {
        if (blob) {
            var f = new File([blob], 'story.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [f] })) {
                navigator.share({ files: [f] });
            } else {
                alert('Seu dispositivo não suporta compartilhamento direto. Use a opção Baixar.');
            }
        }
    }, 'image/png');
};

// ============================================================================
// 10. GESTOS, BUSCA E UTILITÁRIOS GERAIS
// ============================================================================

window.setupSwipeGestures = function () {
    var el = document.getElementById('main-content');
    if (!el) return;
    el.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    el.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        var diff = touchStartX - touchEndX;
        if (diff < -80) goBack();
    }, { passive: true });
};

window.checkActivePlan = function () { if (localStorage.getItem('agape_plan')) document.getElementById('active-plan-card').classList.remove('hidden'); };
window.escapeHtml = function (t) { return t.replace(/"/g, "&quot;").replace(/'/g, "&#039;"); };
window.updateStreakDisplay = function () { document.getElementById('streak-count-header').innerText = streakData.count; };

window.searchBible = function () {
    showScreen('screen-search');
    setTimeout(function () { document.getElementById('search-input').focus(); }, 300);
};

window.setupSearchInput = function () {
    document.getElementById('btn-search-action').onclick = window.performSearch;
    document.getElementById('search-input').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') window.performSearch();
    });
};

window.performSearch = async function () {
    var query = document.getElementById('search-input').value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (query.length < 3) return alert("Digite pelo menos 3 letras.");

    var container = document.getElementById('search-results');
    container.innerHTML = '<div class="p-10 text-center animate-pulse">Buscando em toda a Bíblia...</div>';

    setTimeout(async function () {
        if (!bibleCache[state.translation]) bibleCache[state.translation] = await (await fetch('./' + state.translation + '.json')).json();

        var bib = bibleCache[state.translation];
        var results = [];
        var count = 0;

        // Algoritmo de busca profunda (otimizado com break)
        outerLoop:
        for (var b = 0; b < bib.length; b++) {
            for (var ch = 0; ch < bib[b].chapters.length; ch++) {
                for (var v = 0; v < bib[b].chapters[ch].length; v++) {
                    var verseText = bib[b].chapters[ch][v];
                    if (verseText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(query)) {
                        results.push({
                            b: b, c: ch + 1, v: v + 1,
                            text: verseText,
                            ref: BIBLE_BOOKS[b].name + ' ' + (ch + 1) + ':' + (v + 1)
                        });
                        count++;
                        if (count >= 50) break outerLoop;
                    }
                }
            }
        }

        container.innerHTML = results.length ? results.map(function (r) {
            return '<div onclick="goToVerse(' + r.b + ',' + r.c + ',' + r.v + ')" class="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 cursor-pointer hover:border-bible-500 transition shadow-sm">' +
                '    <p class="font-bold text-bible-600 text-sm mb-1">' + r.ref + '</p>' +
                '    <p class="text-sm line-clamp-2 text-gray-700 dark:text-gray-300">' + r.text + '</p>' +
                '</div>';
        }).join('') : '<div class="p-10 text-center text-gray-500">Nenhum resultado encontrado.</div>';
    }, 100);
};

window.goToVerse = function (b, c, v) {
    state.book = b;
    state.chapter = c;
    showScreen('screen-read');

    setTimeout(function () {
        var el = document.getElementById('v-' + v);
        if (el) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            el.classList.add('highlight-yellow');
            setTimeout(function () { el.classList.remove('highlight-yellow'); }, 2000);
        }
    }, 600);
};

window.setupInstallPrompt = function () {
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('install-container').classList.remove('hidden');
        document.getElementById('btn-install').onclick = function () { deferredPrompt.prompt(); };
    });
};

window.hardReset = function () {
    if (confirm("Tem certeza absoluta? Isso apagará todos os seus dados deste dispositivo.")) {
        localStorage.clear();
        location.reload();
    }
};

window.loadHighlightsList = function () {
    var container = document.getElementById('highlights-container');
    var keys = Object.keys(savedMarks);

    if (!keys.length) {
        container.innerHTML = '<div class="p-10 text-center text-gray-500">Você ainda não destacou nenhum versículo.</div>';
        return;
    }

    container.innerHTML = keys.map(function (ky) {
        var p = ky.split('-');
        var bName = BIBLE_BOOKS[p[0]].name;
        return '<div onclick="goToVerse(' + p[0] + ',' + p[1] + ',' + p[2] + ')" class="bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-bible-500 cursor-pointer shadow-sm hover:bg-gray-50 transition">' +
            '    <p class="font-bold text-gray-800 dark:text-gray-200">' + bName + ' ' + p[1] + ':' + p[2] + '</p>' +
            '</div>';
    }).join('');
};

window.shareApp = function () {
    if (navigator.share) {
        navigator.share({ title: "Bíblia Ágape", url: window.location.href });
    } else {
        alert("Use o menu do navegador para compartilhar.");
    }
};

window.actionVerse = function (action) {
    if (action === 'copy') {
        navigator.clipboard.writeText('"' + selectedVerse.text + '" - ' + selectedVerse.ref);
        closeModal('modal-verse');
        alert("Copiado!");
    }
};

window.loadDailyVerse = function () {
    if (typeof DAILY_VERSES_POOL !== 'undefined') {
        var index = new Date().getDate() % DAILY_VERSES_POOL.length;
        var v = DAILY_VERSES_POOL[index];
        document.getElementById('daily-text').innerText = '"' + v.text + '"';
        document.getElementById('daily-reference').innerText = v.ref;
    }
};

window.handleVerseClick = function (id, text, ref) {
    selectedVerse = { id: id, text: text, ref: ref };
    document.getElementById('modal-verse').classList.remove('hidden');
    document.getElementById('modal-verse').classList.add('flex');
};

window.markVerse = function (colorClass) {
    if (colorClass === 'remove') delete savedMarks[selectedVerse.id];
    else savedMarks[selectedVerse.id] = colorClass;

    localStorage.setItem('agape_marks_v2', JSON.stringify(savedMarks));

    var element = document.getElementById('v-' + selectedVerse.id.split('-')[2]);
    if (element) {
        element.className = 'flex gap-3 relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition ' + colorClass;
    }
    closeModal('modal-verse');
};

window.closeModal = function (id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(id).classList.remove('flex');
};

window.openPlanSetup = function () {
    document.getElementById('modal-plan').classList.remove('hidden');
    document.getElementById('modal-plan').classList.add('flex');
};

window.openFeedbackModal = function () {
    document.getElementById('modal-feedback').classList.remove('hidden');
    document.getElementById('modal-feedback').classList.add('flex');
};

// ============================================================================
// 11. FEEDBACK VIA AJAX (FormSubmit.co)
// ============================================================================

window.sendFeedbackToEmail = function () {
    var e = document.getElementById('feedback-email');
    var m = document.getElementById('feedback-text');
    var btn = document.querySelector('#modal-feedback button');

    if (!e.value.trim()) { alert("Por favor, informe seu email."); e.focus(); return; }
    if (!m.value.trim()) { alert("Por favor, escreva uma mensagem."); m.focus(); return; }

    var originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    // Configuração para envio via FormSubmit
    fetch('https://formsubmit.co/agapeconnect75@gmail.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            email: e.value,
            message: m.value,
            _subject: "Novo Contato via App Bíblia Ágape",
            _captcha: "false",
            _template: "table"
        })
    })
        .then(function (response) {
            if (response.ok) {
                alert("Mensagem enviada com sucesso! Obrigado pelo feedback.");
                closeModal('modal-feedback');
                e.value = '';
                m.value = '';
            } else {
                // Fallback para mailto se a API falhar
                alert("Não foi possível enviar automaticamente. Abrindo seu app de email...");
                var subject = "Contato App Bíblia Ágape";
                var body = "De: " + e.value + "\n\n" + m.value;
                window.location.href = "mailto:agapeconnect75@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            }
        })
        .catch(function (error) {
            console.error("Erro AJAX:", error);
            // Fallback para mailto
            var subject = "Contato App Bíblia Ágape";
            var body = "De: " + e.value + "\n\n" + m.value;
            window.location.href = "mailto:agapeconnect75@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        })
        .finally(function () {
            btn.innerText = originalText;
            btn.disabled = false;
        });
};

window.exportData = function () {
    var obj = {
        meta: { app: "Bíblia Ágape", version: "V2.1.2", date: new Date().toISOString() },
        data: { ...localStorage }
    };
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
    var a = document.createElement('a');
    a.href = dataStr;
    a.download = "backup_agape_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
};

window.triggerImport = function () { document.getElementById('import-file').click(); };
window.handleImportFile = function (e) {
    var f = e.target.files[0];
    if (!f) return;

    var r = new FileReader();
    r.onload = function (ev) {
        try {
            var json = JSON.parse(ev.target.result);
            if (json.meta.app !== "Bíblia Ágape") throw new Error("Arquivo inválido");

            if (confirm("Deseja restaurar este backup? Seus dados atuais serão substituídos.")) {
                var d = json.data;
                // Restauração manual segura
                if (d.agape_font) localStorage.setItem('agape_font', d.agape_font);
                if (d.agape_theme) localStorage.setItem('agape_theme', d.agape_theme);
                if (d.agape_version) localStorage.setItem('agape_version', d.agape_version);
                if (d.agape_book) localStorage.setItem('agape_book', d.agape_book);
                if (d.agape_chapter) localStorage.setItem('agape_chapter', d.agape_chapter);
                if (d.agape_marks_v2) localStorage.setItem('agape_marks_v2', d.agape_marks_v2);
                if (d.agape_plan) localStorage.setItem('agape_plan', d.agape_plan);
                if (d.agape_plan_progress) localStorage.setItem('agape_plan_progress', d.agape_plan_progress);
                if (d.agape_quiz_points) localStorage.setItem('agape_quiz_points', d.agape_quiz_points);
                if (d.agape_streak) localStorage.setItem('agape_streak', d.agape_streak);

                location.reload();
            }
        } catch (err) { alert("Arquivo de backup inválido."); }
    };
    r.readAsText(f);
};

window.toggleTheme = function () {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(state.theme);
    localStorage.setItem('agape_theme', state.theme);
};

function applyTheme(t) {
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
}

window.changeFontSize = function (delta) {
    state.fontSize += delta;
    if (state.fontSize < 14) state.fontSize = 14;
    if (state.fontSize > 40) state.fontSize = 40;
    localStorage.setItem('agape_font', state.fontSize);

    document.querySelectorAll('.verse-content').forEach(function (p) { p.style.fontSize = state.fontSize + 'px'; });
};