/**
 * ============================================================================
 * BÍBLIA ÁGAPE - APLICAÇÃO PRINCIPAL (app.js)
 * Versão: V2.6.0 (Bússola Aleatória & Cards)
 * Data: 24/01/2026
 * Autor: Mateus Heringer & Daniel
 * * Descrição:
 * Arquivo principal de lógica da aplicação PWA.
 * Contém toda a regra de negócio para leitura, gamificação e ferramentas de estudo.
 * ============================================================================
 */

// ============================================================================
// 1. CONSTANTES GLOBAIS E CONFIGURAÇÕES
// ============================================================================

/**
 * Lista de traduções disponíveis no sistema.
 * Cada sigla corresponde a um arquivo .json na raiz do projeto.
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
    "TB"   // Tradução Brasileira
];

/**
 * Definição dos Temas Visuais para o Estúdio de Criação (Stories).
 * Contém configurações de cores, gradientes e fontes.
 */
const THEMES = {
    midnight: {
        bgStart: "#18181b",
        bgEnd: "#09090b",
        text: "#ffffff",
        accent: "#d4d4d8",
        watermark: "rgba(255,255,255,0.03)",
        fontMain: "Merriweather",
        fontSec: "Inter"
    },
    paper: {
        bgStart: "#fafaf9",
        bgEnd: "#e7e5e4",
        text: "#1c1917",
        accent: "#b45309",
        watermark: "rgba(0,0,0,0.03)",
        fontMain: "Merriweather",
        fontSec: "Inter"
    },
    royal: {
        bgStart: "#1e1b4b",
        bgEnd: "#020617",
        text: "#ffffff",
        accent: "#a5b4fc",
        watermark: "rgba(255,255,255,0.05)",
        fontMain: "Playfair Display",
        fontSec: "Inter"
    },
    nature: {
        bgStart: "#064e3b",
        bgEnd: "#022c22",
        text: "#ecfdf5",
        accent: "#6ee7b7",
        watermark: "rgba(255,255,255,0.05)",
        fontMain: "Merriweather",
        fontSec: "Inter"
    }
};

// ============================================================================
// 2. ESTADO GLOBAL DA APLICAÇÃO (STATE MANAGEMENT)
// ============================================================================

var state = {
    // Preferências Visuais
    fontSize: parseInt(localStorage.getItem('agape_font')) || 18,
    theme: localStorage.getItem('agape_theme') || 'light',

    // Navegação Bíblica
    translation: localStorage.getItem('agape_version') || 'NVI',
    book: parseInt(localStorage.getItem('agape_book')) || 0, // Índice 0 = Gênesis
    chapter: parseInt(localStorage.getItem('agape_chapter')) || 1,

    // Contexto de Uso
    hymnbook: 'harpa', // 'harpa', 'cantor', 'novocantico'
    mode: 'free',      // 'free' (livre) ou 'plan' (plano de leitura)
    pulpitMode: false  // NOVO: Controle do Modo Púlpito (Tela Cheia)
};

// ============================================================================
// 3. CACHES E VARIÁVEIS DE SESSÃO
// ============================================================================

// Cache em memória para evitar requisições de rede repetidas
var bibleCache = {};

// Cache específico para hinários
var hymnCache = {
    harpa: null,
    cantor: null,
    novocantico: null
};

// Variáveis Voláteis (existem apenas durante a sessão)
var currentHymnList = [];
var quizData = [];
var selectedVerse = { id: "", text: "", ref: "" };
var deferredPrompt = null; // Para instalação do PWA
var touchStartX = 0;       // Controle de gestos (Swipe)
var touchEndX = 0;

// Variáveis do Estúdio de Criação Pro
var currentVerseText = "";
var currentVerseRef = "";
var currentThemeId = 'midnight';

// ============================================================================
// 4. DADOS PERSISTENTES (LOCALSTORAGE)
// ============================================================================

// Carregamento de Marcações (Destaques)
var savedMarks = {};
try {
    savedMarks = JSON.parse(localStorage.getItem('agape_marks_v2')) || {};
} catch (e) {
    savedMarks = {};
}

// NOVO: Carregamento de Notas Pessoais (Journaling)
var savedNotes = {};
try {
    savedNotes = JSON.parse(localStorage.getItem('agape_notes')) || {};
} catch (e) {
    savedNotes = {};
}

// Carregamento da Ofensiva (Streak)
var streakData = {};
try {
    streakData = JSON.parse(localStorage.getItem('agape_streak')) || { count: 0, lastDate: "" };
} catch (e) {
    streakData = { count: 0, lastDate: "" };
}

// Pontuação do Quiz
var quizTotalPoints = parseInt(localStorage.getItem('agape_quiz_points')) || 0;

// Progresso do Plano de Leitura
var planProgress = [];
try {
    planProgress = JSON.parse(localStorage.getItem('agape_plan_progress')) || [];
} catch (e) {
    planProgress = [];
}

// Sessão atual do Quiz
var quizSession = {
    active: false,
    currentLevel: 'facil',
    streak: 0,
    score: 0,
    history: []
};

// ============================================================================
// 5. INICIALIZAÇÃO DO SISTEMA (BOOTSTRAP)
// ============================================================================

window.onload = async function () {
    try {
        console.log("=== Iniciando Sistema Bíblia Ágape V2.6.0 ===");

        // 1. Aplica preferências visuais salvas
        applyTheme(state.theme);
        updateStreakDisplay();
        populateSelectElements();

        // 2. Carregamento de Dados Assíncronos
        loadDailyVerse();
        renderCompass(); // NOVO: Renderiza a Bússola da Alma Agrupada
        await loadQuizData();

        // 3. Configuração de Listeners de Eventos
        setupSwipeGestures();
        setupInstallPrompt();
        setupSearchInput();

        // 4. Verifica se existe plano ativo
        checkActivePlan();

        // 5. Estratégia de Atualização de Cache (Network First)
        if (navigator.onLine) {
            forceUpdateAll();
        }

        // 6. Configuração de Roteamento (Single Page Application)
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
        console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
    }
};

/**
 * Força a atualização de todos os arquivos JSON críticos em background.
 * Isso garante que o PWA tenha sempre a versão mais recente dos dados.
 */
window.forceUpdateAll = async function () {
    console.log("Iniciando atualização de cache em background...");

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
            await fetch('./' + filesToUpdate[i], { cache: 'reload' });
        } catch (e) {
            console.warn("Falha ao atualizar arquivo: " + filesToUpdate[i]);
        }
    }
};

// ============================================================================
// 6. SISTEMA DE NAVEGAÇÃO E ROTEAMENTO
// ============================================================================

function _showScreenInternal(screenId) {
    // Se o usuário sair da tela de leitura e estiver no modo púlpito, desativar
    if (screenId !== 'screen-read' && state.pulpitMode) {
        togglePulpitMode();
    }

    // Oculta todas as telas ativas
    var screens = document.querySelectorAll('#main-content > div');
    screens.forEach(function (screen) {
        if (screen.id && screen.id.startsWith('screen-')) {
            screen.classList.add('hidden');
        }
    });

    // Exibe a tela de destino
    var targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
}

window.showScreen = function (screenId) {
    window.history.pushState({ screen: screenId }, screenId, '');
    _showScreenInternal(screenId);

    // Lógicas específicas de inicialização por tela
    if (screenId === 'screen-read') {
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
// 7. LÓGICA DE LEITURA BÍBLICA (COM SUPORTE A NOTAS)
// ============================================================================

window.handleNavigationChange = function () {
    var selectTranslation = document.getElementById('read-translation');
    var selectBook = document.getElementById('read-book');
    var selectChapter = document.getElementById('read-chapter');

    if (selectTranslation) { state.translation = selectTranslation.value; }
    if (selectBook) { state.book = parseInt(selectBook.value); }
    if (selectChapter) { state.chapter = parseInt(selectChapter.value); }

    updateChaptersSelect(false);
    loadChapter();
};

async function loadChapter() {
    window.scrollTo(0, 0);
    var container = document.getElementById('text-container');

    // Sincroniza selects com o estado atual
    var selectTranslation = document.getElementById('read-translation');
    var selectBook = document.getElementById('read-book');
    var selectChapter = document.getElementById('read-chapter');

    if (selectTranslation) selectTranslation.value = state.translation;
    if (selectBook) {
        selectBook.value = state.book;
        updateChaptersSelect(false); // Atualiza sem recarregar para evitar loop
    }
    if (selectChapter) selectChapter.value = state.chapter;

    // Persiste estado no LocalStorage
    localStorage.setItem('agape_version', state.translation);
    localStorage.setItem('agape_book', state.book);
    localStorage.setItem('agape_chapter', state.chapter);

    container.innerHTML = '<div class="text-center p-10 text-gray-500 animate-pulse flex flex-col items-center justify-center h-64">Carregando Escrituras Sagradas...</div>';

    try {
        // Verifica Cache da Bíblia
        if (!bibleCache[state.translation]) {
            var response = await fetch('./' + state.translation + '.json');
            if (!response.ok) { throw new Error("Falha no download da tradução"); }
            bibleCache[state.translation] = await response.json();
        }

        var bookData = bibleCache[state.translation][state.book];

        // Validação de segurança para capítulo
        if (!bookData || !bookData.chapters || !bookData.chapters[state.chapter - 1]) {
            state.chapter = 1;
            if (selectChapter) selectChapter.value = 1;
        }

        var versesArray = bookData.chapters[state.chapter - 1];
        var bookName = BIBLE_BOOKS[state.book].name;
        var isGospel = (state.book >= 39 && state.book <= 42); // Mateus, Marcos, Lucas, João

        var htmlBuilder = '';

        versesArray.forEach(function (text, index) {
            var verseNumber = index + 1;
            var verseId = state.book + '-' + state.chapter + '-' + verseNumber;
            var markClass = savedMarks[verseId] || '';
            var reference = bookName + ' ' + state.chapter + ':' + verseNumber;

            // Verifica se existe nota pessoal para este versículo
            var hasNoteIcon = '';
            if (savedNotes[verseId]) {
                hasNoteIcon = '<i class="ph-fill ph-note-pencil text-accent-500 text-xs ml-1" title="Nota Pessoal"></i>';
            }

            var content = text;

            // Processamento de Letras Vermelhas (Palavras de Jesus)
            if (isGospel) {
                content = content
                    .replace(/“([^”]+)”/g, '<span class="red-letter">“$1”</span>')
                    .replace(/"([^"]+)"/g, '<span class="red-letter">"$1"</span>');
            }

            // Construção do HTML do versículo
            htmlBuilder += '<div class="flex gap-3 relative group cursor-pointer hover:bg-bible-100 dark:hover:bg-bible-800/50 p-2 rounded-lg transition ' + markClass + '" ' +
                '     id="v-' + verseNumber + '" onclick="handleVerseClick(\'' + verseId + '\', \'' + escapeHtml(text) + '\', \'' + reference + '\')">' +
                '    <div class="flex flex-col items-end w-6 shrink-0 mt-2">' +
                '       <span class="text-xs font-bold text-bible-400 font-sans">' + verseNumber + '</span>' +
                '       ' + hasNoteIcon +
                '    </div>' +
                '    <p class="verse-content text-lg flex-1 leading-loose" style="font-size:' + state.fontSize + 'px">' + content + '</p>' +
                '</div>';
        });

        container.innerHTML = htmlBuilder;
        setupSwipeGestures();

    } catch (error) {
        console.error("Erro na Leitura:", error);
        container.innerHTML = '<div class="text-center p-10 text-red-500 font-bold">Erro ao carregar o texto bíblico.</div>';
    }
}

window.changeChapter = function (delta) {
    // 1. Tenta carregar configuração do plano para navegação cronológica
    var planConfig = null;
    try {
        planConfig = JSON.parse(localStorage.getItem('agape_plan'));
    } catch (e) { }

    // 2. Lógica Especial: Plano Cronológico
    if (state.mode === 'plan' && planConfig && planConfig.type === 'chronological' && typeof FLAT_CHRONO_INDEX !== 'undefined') {
        var currentIndex = FLAT_CHRONO_INDEX.findIndex(function (x) { return x.b === state.book && x.c === state.chapter; });
        if (currentIndex !== -1) {
            var nextIndex = currentIndex + delta;
            if (nextIndex >= 0 && nextIndex < FLAT_CHRONO_INDEX.length) {
                var nextItem = FLAT_CHRONO_INDEX[nextIndex];
                state.book = nextItem.b;
                state.chapter = nextItem.c;
                loadChapter();
                return;
            } else {
                return; // Fim ou Início do Plano
            }
        }
    }

    // 3. Lógica Padrão: Navegação Sequencial
    var maxChapters = BIBLE_BOOKS[state.book].caps;
    var nextChapter = state.chapter + delta;

    if (nextChapter > maxChapters) {
        if (state.book < 65) {
            state.book++;
            nextChapter = 1;
        } else {
            return; // Fim da Bíblia
        }
    } else if (nextChapter < 1) {
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
    var bookIndex = state.book;

    selectChapter.innerHTML = '';
    for (var i = 1; i <= BIBLE_BOOKS[bookIndex].caps; i++) {
        selectChapter.add(new Option(i, i));
    }

    if (state.chapter > BIBLE_BOOKS[bookIndex].caps) {
        state.chapter = 1;
    }
    selectChapter.value = state.chapter;

    if (shouldLoadText) {
        loadChapter();
    }
};

window.populateSelectElements = function () {
    // Popula Seleção de Tradução Principal
    var selectTrans = document.getElementById('read-translation');
    if (selectTrans) {
        selectTrans.innerHTML = TRANSLATIONS.map(function (t) {
            return '<option value="' + t + '">' + t + '</option>';
        }).join('');
        selectTrans.value = state.translation;
    }

    // Popula Seleção de Tradução do Plano
    var selectPlanTrans = document.getElementById('plan-translation');
    if (selectPlanTrans) {
        selectPlanTrans.innerHTML = TRANSLATIONS.map(function (t) {
            return '<option value="' + t + '">' + t + '</option>';
        }).join('');
        selectPlanTrans.value = 'NVI';
    }

    // Popula Seleção de Livros
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
// 8. GESTÃO DE PLANOS DE LEITURA
// ============================================================================

function getPlanDataForDay(dayIndex, totalDuration, type) {
    if (typeof FLAT_BIBLE_INDEX === 'undefined') return null;

    var sourceIndex = (type === 'chronological') ? FLAT_CHRONO_INDEX : FLAT_BIBLE_INDEX;
    var chaptersPerDay = sourceIndex.length / totalDuration;

    var startIndex = Math.floor((dayIndex - 1) * chaptersPerDay);
    var endIndex = Math.floor(dayIndex * chaptersPerDay) - 1;

    if (startIndex >= sourceIndex.length) return null;

    var safeEndIndex = Math.min(endIndex, sourceIndex.length - 1);
    var startItem = sourceIndex[startIndex];

    // Formatação dos intervalos de leitura
    var chunks = [];
    var currentChunk = null;

    for (var i = startIndex; i <= safeEndIndex; i++) {
        var item = sourceIndex[i];
        var bookName = BIBLE_BOOKS[item.b].name;

        if (!currentChunk) {
            currentChunk = { name: bookName, start: item.c, end: item.c };
        } else {
            if (currentChunk.name === bookName && item.c === currentChunk.end + 1) {
                currentChunk.end = item.c;
            } else {
                chunks.push(currentChunk);
                currentChunk = { name: bookName, start: item.c, end: item.c };
            }
        }
    }
    if (currentChunk) chunks.push(currentChunk);

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
        container.innerHTML = '<div class="text-center p-10 flex flex-col items-center"><p class="text-gray-500 mb-4">Nenhum plano ativo.</p><button onclick="openPlanSetup()" class="bg-accent-600 text-white px-6 py-2 rounded-lg font-bold">Criar Plano Agora</button></div>';
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
        var cardClass = isDone ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/10' : 'border-bible-200 dark:border-bible-700';
        var btnClass = isDone ? 'bg-accent-600 text-white shadow-lg' : 'bg-bible-100 dark:bg-bible-700 text-bible-400 hover:bg-bible-200';
        var textClass = isDone ? 'line-through opacity-70 text-accent-700 dark:text-accent-400' : 'text-bible-800 dark:text-bible-200';

        htmlBuilder +=
            '<div class="bg-white dark:bg-bible-800 p-4 rounded-xl border ' + cardClass + ' flex items-center justify-between shadow-sm transition">' +
            '   <div class="flex-1 cursor-pointer" onclick="openPlanDayReading(' + planData.start.b + ',' + planData.start.c + ')">' +
            '       <p class="text-xs font-bold text-bible-400 uppercase">Dia ' + i + '</p>' +
            '       <h4 class="font-bold text-lg">' + planData.rangeText + '</h4>' +
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
// 9. LÓGICA DE HINÁRIOS
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
        return '<div onclick="openHymn(\'' + h.id + '\')" class="bg-white dark:bg-bible-800 p-4 rounded-xl border border-bible-200 dark:border-bible-700 cursor-pointer flex items-center gap-3 hover:border-accent-600 transition shadow-sm">' +
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

    if (hymn.fullText) {
        var parts = hymn.fullText.split(/\n\n/);
        htmlContent = parts.map(function (part) {
            var lower = part.toLowerCase();
            var isChorus = lower.includes('[coro]') || lower.includes('coro:') || lower.includes('refrão');
            var cleanText = part.replace(/\[coro\]/gi, '').replace(/coro:/gi, '').trim();

            if (isChorus) {
                return '<div class="hymn-chorus">' + cleanText.replace(/\n/g, '<br>') + '</div>';
            } else {
                return '<div class="mb-8 leading-loose">' + cleanText.replace(/\n/g, '<br>') + '</div>';
            }
        }).join('');
    } else if (hymn.chorus) {
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
// 10. QUIZ BÍBLICO (GAMIFICADO)
// ============================================================================

window.loadQuizData = async function () {
    try {
        var response = await fetch('./quiz.json');
        if (response.ok) {
            quizData = await response.json();
        }
    } catch (e) {
        console.error("Erro ao carregar quiz:", e);
    }
    document.getElementById('quiz-points').innerText = quizTotalPoints;
};

window.startQuizSession = function () {
    quizSession = { active: true, currentLevel: 'facil', streak: 0, score: 0, history: [] };
    renderQuizQuestion();
};

window.renderQuizQuestion = function () {
    var container = document.getElementById('quiz-container');

    // Filtra perguntas
    var pool = quizData.filter(function (q) {
        return q.nivel === quizSession.currentLevel && !quizSession.history.includes(q.id);
    });

    if (pool.length === 0) {
        pool = quizData.filter(function (q) { return !quizSession.history.includes(q.id); });
    }

    if (pool.length === 0) {
        container.innerHTML =
            '<div class="text-center p-8 animate-pop">' +
            '   <h3 class="font-bold text-2xl mb-2">Quiz Concluído!</h3>' +
            '   <p class="mb-4">Você é um mestre da Bíblia!</p>' +
            '   <button onclick="startQuizSession()" class="bg-accent-600 text-white px-6 py-3 rounded-xl font-bold mt-4 shadow-lg hover:scale-105 transition">Jogar Novamente</button>' +
            '</div>';
        return;
    }

    var question = pool[Math.floor(Math.random() * pool.length)];

    // Renderização com Animação
    var htmlOptions = question.opcoes.map(function (op, i) {
        var letter = ['A', 'B', 'C', 'D'][i];
        return '<button onclick="handleQuizAnswer(' + question.id + ', ' + i + ', this)" class="w-full text-left p-4 rounded-xl bg-bible-50 dark:bg-bible-700 hover:bg-bible-100 dark:hover:bg-bible-600 transition font-medium flex gap-3 group items-center relative overflow-hidden">' +
            '    <div class="w-8 h-8 rounded-full bg-white dark:bg-bible-600 flex items-center justify-center font-bold text-sm text-bible-500 group-hover:text-accent-600 shadow-sm z-10">' + letter + '</div>' +
            '    <span class="flex-1 z-10">' + op + '</span>' +
            '</button>';
    }).join('');

    container.innerHTML =
        '<div class="bg-white dark:bg-bible-800 p-6 rounded-3xl shadow-lg border border-bible-200 dark:border-bible-700 animate-slide-up">' +
        '   <div class="flex justify-between items-center mb-4">' +
        '       <span class="bg-bible-100 dark:bg-bible-900/30 text-bible-700 dark:text-bible-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">' + quizSession.currentLevel + '</span>' +
        (quizSession.streak > 1 ? '<span class="text-xs font-bold text-orange-500 animate-pulse">🔥 Combo x' + quizSession.streak + '</span>' : '') +
        '   </div>' +
        '   <h3 class="text-xl font-bold my-6 leading-relaxed">' + question.pergunta + '</h3>' +
        '   <div class="space-y-3">' + htmlOptions + '</div>' +
        '</div>';
};

window.handleQuizAnswer = function (questionId, optionIndex, btnElement) {
    document.querySelectorAll('#quiz-container button').forEach(function (b) {
        b.disabled = true;
        b.style.opacity = '0.7';
    });

    var question = quizData.find(function (x) { return x.id === questionId; });

    btnElement.style.opacity = '1';
    btnElement.classList.remove('bg-bible-50', 'dark:bg-bible-700');

    if (optionIndex === question.correta) {
        // ACERTO
        btnElement.classList.add('animate-pop', 'bg-green-100', 'border-green-500', 'text-green-800');
        triggerConfetti();

        var points = 10 + (quizSession.streak * 2);
        quizTotalPoints += points;
        quizSession.streak++;

        var scoreEl = document.getElementById('quiz-points');
        scoreEl.innerText = quizTotalPoints;
        scoreEl.parentElement.classList.add('animate-pop');
        setTimeout(function () { scoreEl.parentElement.classList.remove('animate-pop'); }, 300);

        quizSession.history.push(questionId);
        localStorage.setItem('agape_quiz_points', quizTotalPoints);

        if (quizSession.streak >= 3 && quizSession.currentLevel === 'facil') quizSession.currentLevel = 'medio';
        else if (quizSession.streak >= 5 && quizSession.currentLevel === 'medio') quizSession.currentLevel = 'dificil';

        setTimeout(renderQuizQuestion, 1500);

    } else {
        // ERRO
        btnElement.classList.add('animate-shake', 'bg-red-100', 'border-red-500', 'text-red-800');

        if (navigator.vibrate) navigator.vibrate(300);
        quizSession.streak = 0;

        setTimeout(function () {
            alert('Ah não! A resposta correta era: ' + question.opcoes[question.correta]);
            quizSession.history.push(questionId);
            renderQuizQuestion();
        }, 1000);
    }
};

function triggerConfetti() {
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        const colors = ['#f59e0b', '#ffffff', '#22c55e', '#fcd34d'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
        document.body.appendChild(confetti);
        setTimeout(function () { confetti.remove(); }, 3000);
    }
}

// ============================================================================
// 11. ESTÚDIO PRO (CANVAS 2.0)
// ============================================================================

window.openImageCreator = function () {
    var dailyText = document.getElementById('daily-text').innerText;
    var dailyRef = document.getElementById('daily-reference').innerText;
    openImageCreatorWithText(dailyText, dailyRef);
};

window.openImageCreatorFromVerse = function () {
    closeModal('modal-verse');
    openImageCreatorWithText(selectedVerse.text, selectedVerse.ref);
};

window.openImageCreatorWithText = function (text, ref) {
    currentVerseText = text.replace(/"/g, '');
    currentVerseRef = ref;

    var modal = document.getElementById('modal-image-creator');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(function () {
        drawCanvas();
    }, 100);
};

window.changeTheme = function (themeId) {
    currentThemeId = themeId;
    drawCanvas();
};

function drawCanvas() {
    var canvas = document.getElementById('image-editor-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var theme = THEMES[currentThemeId];

    canvas.width = 1080;
    canvas.height = 1920;

    // Fundo
    var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, theme.bgStart);
    gradient.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Marca D'água
    ctx.fillStyle = theme.watermark;
    ctx.font = "bold 600px " + theme.fontMain;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("”", canvas.width / 2, canvas.height / 2 - 100);

    // Texto
    ctx.fillStyle = theme.text;
    ctx.textAlign = "center";

    var fontSize = 80;
    if (currentVerseText.length > 150) fontSize = 60;
    if (currentVerseText.length > 300) fontSize = 50;

    ctx.font = "italic " + fontSize + "px " + theme.fontMain;

    var margin = 100;
    var maxWidth = canvas.width - (margin * 2);
    var lineHeight = fontSize * 1.5;

    // Word Wrap
    var words = currentVerseText.split(' ');
    var line = '';
    var lines = [];

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    var totalTextHeight = lines.length * lineHeight;
    var startY = (canvas.height - totalTextHeight) / 2;

    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], canvas.width / 2, startY + (i * lineHeight));
    }

    // Referência
    var refY = startY + (lines.length * lineHeight) + 60;
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 40px " + theme.fontSec;
    ctx.fillText(currentVerseRef.toUpperCase(), canvas.width / 2, refY);

    // Linha
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 50, refY + 50);
    ctx.lineTo(canvas.width / 2 + 50, refY + 50);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Rodapé
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.6;
    ctx.font = "30px " + theme.fontSec;
    ctx.fillText("BÍBLIA ÁGAPE • LEIAABIBLIA.APP", canvas.width / 2, canvas.height - 120);
    ctx.globalAlpha = 1.0;
}

window.shareCreatedImage = function () {
    var canvas = document.getElementById('image-editor-canvas');
    canvas.toBlob(async function (blob) {
        var file = new File([blob], 'versiculo-agape.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Bíblia Ágape',
                    text: 'Versículo do dia criado com Bíblia Ágape.'
                });
            } catch (error) { console.log('Erro ao compartilhar', error); }
        } else {
            downloadCreatedImage();
        }
    });
};

window.downloadCreatedImage = function () {
    var canvas = document.getElementById('image-editor-canvas');
    var link = document.createElement('a');
    link.download = "versiculo-agape-" + Date.now() + ".png";
    link.href = canvas.toDataURL();
    link.click();
};

// ============================================================================
// 12. GESTOS, BUSCA E UTILITÁRIOS GERAIS
// ============================================================================

window.setupSwipeGestures = function () {
    var el = document.getElementById('main-content');
    if (!el) return;

    el.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    el.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        var diff = touchStartX - touchEndX;
        if (diff < -80) goBack();
    }, { passive: true });
};

window.checkActivePlan = function () {
    if (localStorage.getItem('agape_plan')) {
        document.getElementById('active-plan-card').classList.remove('hidden');
    }
};

window.escapeHtml = function (t) {
    return t.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

window.updateStreakDisplay = function () {
    document.getElementById('streak-count-header').innerText = streakData.count;
};

window.searchBible = function () {
    showScreen('screen-search');
    setTimeout(function () {
        document.getElementById('search-input').focus();
    }, 300);
};

window.setupSearchInput = function () {
    document.getElementById('btn-search-action').onclick = performSearch;
    document.getElementById('search-input').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') performSearch();
    });
};

async function performSearch() {
    var query = document.getElementById('search-input').value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (query.length < 3) {
        document.getElementById('search-results').innerHTML = '<div class="p-10 text-center text-bible-400">Digite pelo menos 3 letras para começar a busca...</div>';
        return;
    }

    var container = document.getElementById('search-results');
    container.innerHTML = '<div class="p-10 text-center animate-pulse">Buscando em toda a Bíblia...</div>';

    setTimeout(async function () {
        if (!bibleCache[state.translation]) {
            var response = await fetch('./' + state.translation + '.json');
            bibleCache[state.translation] = await response.json();
        }

        var bib = bibleCache[state.translation];
        var results = [];
        var count = 0;

        outerLoop:
        for (var b = 0; b < bib.length; b++) {
            for (var c = 0; c < bib[b].chapters.length; c++) {
                for (var v = 0; v < bib[b].chapters[c].length; v++) {
                    var text = bib[b].chapters[c][v];
                    var normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

                    if (normalized.includes(query)) {
                        results.push({
                            b: b,
                            c: c + 1,
                            v: v + 1,
                            text: text,
                            ref: BIBLE_BOOKS[b].name + ' ' + (c + 1) + ':' + (v + 1)
                        });
                        count++;
                        if (count >= 50) break outerLoop;
                    }
                }
                if (count >= 50) break;
            }
            if (count >= 50) break;
        }

        if (results.length > 0) {
            container.innerHTML = results.map(function (r) {
                return '<div onclick="goToVerse(' + r.b + ', ' + r.c + ', ' + r.v + ')" class="bg-white dark:bg-bible-800 p-4 rounded-xl border border-bible-200 dark:border-bible-700 cursor-pointer hover:border-accent-600 transition shadow-sm">' +
                    '    <p class="font-bold text-accent-600 text-sm mb-1">' + r.ref + '</p>' +
                    '    <p class="text-sm line-clamp-2 text-bible-700 dark:text-bible-300">' + r.text + '</p>' +
                    '</div>';
            }).join('');
        } else {
            container.innerHTML = '<div class="p-10 text-center text-bible-500">Nenhum resultado encontrado.</div>';
        }
    }, 100);
}

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
        container.innerHTML = '<div class="p-10 text-center text-bible-500">Você ainda não destacou nenhum versículo.</div>';
        return;
    }

    container.innerHTML = keys.map(function (ky) {
        var p = ky.split('-');
        var bName = BIBLE_BOOKS[p[0]].name;

        return '<div onclick="goToVerse(' + p[0] + ',' + p[1] + ',' + p[2] + ')" class="bg-white dark:bg-bible-800 p-4 rounded-xl border-l-4 border-accent-500 cursor-pointer shadow-sm hover:bg-bible-50 transition">' +
            '    <p class="font-bold text-bible-800 dark:text-bible-200">' + bName + ' ' + p[1] + ':' + p[2] + '</p>' +
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
    var m = document.getElementById('modal-verse');
    m.classList.remove('hidden');
    m.classList.add('flex');
};

window.markVerse = function (colorClass) {
    if (colorClass === 'remove') delete savedMarks[selectedVerse.id];
    else savedMarks[selectedVerse.id] = colorClass;

    localStorage.setItem('agape_marks_v2', JSON.stringify(savedMarks));

    loadChapter();
    closeModal('modal-verse');
};

window.closeModal = function (id) {
    var el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('flex');
};

window.openPlanSetup = function () {
    var m = document.getElementById('modal-plan');
    m.classList.remove('hidden');
    m.classList.add('flex');
};

window.openFeedbackModal = function () {
    var m = document.getElementById('modal-feedback');
    m.classList.remove('hidden');
    m.classList.add('flex');
};

window.sendFeedbackToEmail = function () {
    var e = document.getElementById('feedback-email');
    var m = document.getElementById('feedback-text');
    var btn = document.querySelector('#modal-feedback button');

    if (!e.value.trim() || !m.value.trim()) { alert("Preencha todos os campos."); return; }

    var originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    fetch('https://formsubmit.co/agapeconnect75@gmail.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            email: e.value,
            message: m.value,
            _subject: "Novo Contato App Bíblia",
            _captcha: "false"
        })
    })
        .then(function (response) {
            if (response.ok) {
                alert("Mensagem enviada com sucesso!");
                closeModal('modal-feedback');
                e.value = '';
                m.value = '';
            } else {
                throw new Error("Erro no envio");
            }
        })
        .catch(function (error) {
            window.location.href = "mailto:agapeconnect75@gmail.com?subject=Contato App Bíblia&body=" + encodeURIComponent(m.value);
        })
        .finally(function () {
            btn.innerText = originalText;
            btn.disabled = false;
        });
};

window.exportData = function () {
    var obj = {
        meta: { app: "Bíblia Ágape", version: "V2.6.0", date: new Date().toISOString() },
        data: { ...localStorage }
    };
    var a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
    a.download = "backup_agape_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
};

window.triggerImport = function () {
    document.getElementById('import-file').click();
};

window.handleImportFile = function (e) {
    var f = e.target.files[0];
    if (!f) return;

    var r = new FileReader();
    r.onload = function (ev) {
        try {
            var json = JSON.parse(ev.target.result);
            if (json.meta.app !== "Bíblia Ágape" && json.meta.app !== "Ágape") throw new Error("Arquivo inválido");

            if (confirm("Deseja restaurar este backup? Seus dados atuais serão substituídos.")) {
                var d = json.data;
                Object.keys(d).forEach(function (k) {
                    localStorage.setItem(k, d[k]);
                });
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
    var metaTheme = document.querySelector('meta[name="theme-color"]');

    if (t === 'dark') {
        document.documentElement.classList.add('dark');
        if (metaTheme) metaTheme.setAttribute('content', '#1c1917');
    } else {
        document.documentElement.classList.remove('dark');
        if (metaTheme) metaTheme.setAttribute('content', '#fafaf9');
    }
}

window.changeFontSize = function (delta) {
    state.fontSize += delta;
    if (state.fontSize < 14) state.fontSize = 14;
    if (state.fontSize > 40) state.fontSize = 40;

    localStorage.setItem('agape_font', state.fontSize);

    document.querySelectorAll('.verse-content').forEach(function (p) {
        p.style.fontSize = state.fontSize + 'px';
    });
};

// ============================================================================
// 12. FUNCIONALIDADES NOVAS (BÚSSOLA ALEATÓRIA, PÚLPITO, NOTAS)
// ============================================================================

// --- Bússola da Alma (Categorias Agrupadas e Aleatórias) ---
window.renderCompass = function () {
    var container = document.getElementById('compass-container');
    if (!container || typeof EMOTION_DATA === 'undefined') return;

    // Agrupa categorias únicas para mostrar apenas 1 botão por sentimento
    var uniqueLabels = [];
    var seenLabels = new Set();

    EMOTION_DATA.forEach(function (item) {
        if (!seenLabels.has(item.label)) {
            seenLabels.add(item.label);
            uniqueLabels.push(item);
        }
    });

    var htmlContent = uniqueLabels.map(function (item) {
        // Ao clicar, chama handleCompassClick passando o nome da categoria
        return '<button onclick="handleCompassClick(\'' + item.label + '\')" class="flex flex-col items-center gap-2 min-w-[80px] snap-center group">' +
            '<div class="w-14 h-14 rounded-2xl bg-white dark:bg-bible-800 border border-bible-200 dark:border-bible-700 flex items-center justify-center text-2xl text-accent-600 shadow-sm group-hover:scale-110 transition duration-300">' +
            '<i class="ph-fill ' + item.icon + '"></i></div>' +
            '<span class="text-[10px] font-bold uppercase tracking-wider text-bible-500 dark:text-bible-400 group-hover:text-bible-900 dark:group-hover:text-white">' + item.label + '</span>' +
            '</button>';
    }).join('');

    container.innerHTML = htmlContent;
};

// Função que sorteia um versículo da categoria e abre o modal
window.handleCompassClick = function (label) {
    // Filtra todos os versículos que têm esse label
    var pool = EMOTION_DATA.filter(function (item) {
        return item.label === label;
    });

    if (pool.length > 0) {
        // Sorteia um índice aleatório
        var randomIndex = Math.floor(Math.random() * pool.length);
        var randomItem = pool[randomIndex];

        // Abre o modal com o item sorteado
        openCompassModal(randomItem);
    }
};

// Função para preencher e abrir o Modal da Bússola (Card)
window.openCompassModal = function (item) {
    var modal = document.getElementById('modal-compass');

    // Preenche os dados
    document.getElementById('compass-label').innerText = item.label;
    document.getElementById('compass-text').innerText = '"' + item.text + '"';

    var bookName = BIBLE_BOOKS[item.book].name;
    document.getElementById('compass-ref').innerText = bookName + ' ' + item.chap + ':' + item.verse;

    document.getElementById('compass-help').innerText = item.help;

    // Configura o botão de ação para ler o capítulo inteiro
    var btn = document.getElementById('compass-action-btn');
    btn.onclick = function () {
        goToVerse(item.book, item.chap, item.verse);
        closeModal('modal-compass');
    };

    // Exibe o modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// --- Link Inteligente Versículo do Dia ---
window.openDailyVerseReading = function () {
    var refText = document.getElementById('daily-reference').innerText.trim();
    if (!refText || refText === "...") return;

    var lastSpaceIndex = refText.lastIndexOf(' ');
    var bookName = refText.substring(0, lastSpaceIndex).trim();
    var numbers = refText.substring(lastSpaceIndex + 1).trim();
    var parts = numbers.split(':');
    var chapter = parseInt(parts[0]);
    var verse = parseInt(parts[1]);

    var bookId = BIBLE_BOOKS.findIndex(function (b) {
        return b.name.toLowerCase() === bookName.toLowerCase();
    });

    if (bookId !== -1) {
        goToVerse(bookId, chapter, verse);
        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        showScreen('screen-read');
    }
};

// --- Modo Púlpito (Foco Total) ---
window.togglePulpitMode = function () {
    state.pulpitMode = !state.pulpitMode;

    var header = document.getElementById('read-header');
    var nav = document.getElementById('reading-nav-bar');
    var exitBtn = document.getElementById('btn-exit-pulpit');

    if (state.pulpitMode) {
        header.classList.add('-translate-y-full'); // Esconde Header
        nav.classList.add('translate-y-full');     // Esconde Nav Inferior
        exitBtn.classList.remove('hidden');        // Mostra botão sair
        changeFontSize(4); // Aumenta fonte temporariamente
    } else {
        header.classList.remove('-translate-y-full');
        nav.classList.remove('translate-y-full');
        exitBtn.classList.add('hidden');
        changeFontSize(-4); // Restaura fonte original
    }
};

// --- Journaling (Sistema de Notas) ---

window.openNoteEditor = function () {
    closeModal('modal-verse');
    var m = document.getElementById('modal-note');
    m.classList.remove('hidden');
    m.classList.add('flex');

    var existingNote = savedNotes[selectedVerse.id] || "";
    document.getElementById('note-input').value = existingNote;
    document.getElementById('note-input').focus();
};

window.saveNote = function () {
    var text = document.getElementById('note-input').value.trim();

    if (text) {
        savedNotes[selectedVerse.id] = text;
    } else {
        delete savedNotes[selectedVerse.id];
    }

    localStorage.setItem('agape_notes', JSON.stringify(savedNotes));

    loadChapter();

    closeModal('modal-note');
    alert("Nota salva com sucesso!");
};

window.deleteNote = function () {
    if (confirm("Tem certeza que deseja apagar esta anotação?")) {
        delete savedNotes[selectedVerse.id];
        localStorage.setItem('agape_notes', JSON.stringify(savedNotes));

        loadChapter();
        closeModal('modal-note');
    }
};