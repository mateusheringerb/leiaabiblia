/**
 * ============================================================================
 * BÍBLIA ÁGAPE - APLICAÇÃO PRINCIPAL (app.js)
 * VERSÃO: 4.0.0
 * DESENVOLVIDO POR: Mateus Heringer
 * REPOSITÓRIO: https://github.com/mateusheringerb
 * LINKEDIN: https://www.linkedin.com/in/mateusheringerb
 * DATA DE ATUALIZAÇÃO: 26 de Janeiro de 2026
 * ============================================================================
 */

// ============================================================================
// 1. CONSTANTES E CONFIGURAÇÕES
// ============================================================================

var TRANSLATIONS = [
    "ACF",      // Almeida Corrigida Fiel
    "ARA",      // Almeida Revista e Atualizada
    "ARC",      // Almeida Revista e Corrigida
    "AS21",     // Almeida Século 21
    "JFAA",     // João Ferreira de Almeida Atualizada
    "KJA",      // King James Atualizada
    "KJF",      // King James Fiel
    "NAA",      // Nova Almeida Atualizada
    "NBV",      // Nova Bíblia Viva
    "NTLH",     // Nova Tradução na Linguagem de Hoje
    "NVI",      // Nova Versão Internacional
    "NVT",      // Nova Versão Transformadora
    "TB"        // Tradução Brasileira
];

var state = {
    fontSize: parseInt(localStorage.getItem('agape_font')) || 18,
    theme: localStorage.getItem('agape_theme') || 'light',
    translation: localStorage.getItem('agape_version') || 'NVI',
    book: parseInt(localStorage.getItem('agape_book')) || 0,
    chapter: parseInt(localStorage.getItem('agape_chapter')) || 1,
    hymnbook: 'harpa',
    mode: 'free',
    pulpitMode: false
};

// 2. DADOS E CACHE
var bibleCache = {};
var hymnCache = { harpa: null, cantor: null, novocantico: null };
var currentHymnList = [];
var quizData = [];
var selectedVerse = { id: "", text: "", ref: "" };
var deferredPrompt = null;
var touchStartX = 0; var touchEndX = 0;
var currentVerseText = ""; var currentVerseRef = ""; var currentThemeId = 'midnight';

const THEMES = {
    midnight: { bgStart: "#18181b", bgEnd: "#09090b", text: "#ffffff", accent: "#d4d4d8", watermark: "rgba(255,255,255,0.03)", fontMain: "Merriweather", fontSec: "Inter" },
    paper: { bgStart: "#fafaf9", bgEnd: "#e7e5e4", text: "#1c1917", accent: "#b45309", watermark: "rgba(0,0,0,0.03)", fontMain: "Merriweather", fontSec: "Inter" },
    royal: { bgStart: "#1e1b4b", bgEnd: "#020617", text: "#ffffff", accent: "#a5b4fc", watermark: "rgba(255,255,255,0.05)", fontMain: "Playfair Display", fontSec: "Inter" },
    nature: { bgStart: "#064e3b", bgEnd: "#022c22", text: "#ecfdf5", accent: "#6ee7b7", watermark: "rgba(255,255,255,0.05)", fontMain: "Merriweather", fontSec: "Inter" }
};

// DADOS PERSISTENTES
var savedMarks = JSON.parse(localStorage.getItem('agape_marks_v2')) || {};
var savedNotes = JSON.parse(localStorage.getItem('agape_notes')) || {};
var streakData = JSON.parse(localStorage.getItem('agape_streak')) || { count: 0, lastDate: "" };
var quizTotalPoints = parseInt(localStorage.getItem('agape_quiz_points')) || 0;
var planProgress = JSON.parse(localStorage.getItem('agape_plan_progress')) || [];
var quizSession = { active: false, currentLevel: 'facil', streak: 0, score: 0, history: [] };

// 3. INICIALIZAÇÃO
window.onload = async function () {
    try {
        applyTheme(state.theme);
        updateStreakDisplay();
        populateSelectElements();
        loadDailyVerse();
        renderCompass();
        await loadQuizData();
        setupSwipeGestures();
        setupInstallPrompt();
        setupSearchInput();
        checkActivePlan();

        if (navigator.onLine) forceUpdateAll();

        window.history.replaceState({ screen: 'screen-home' }, 'Home', '');
        window.onpopstate = function (event) {
            _showScreenInternal((event.state && event.state.screen) ? event.state.screen : 'screen-home');
        };

        await loadChapter();
        changeHymnbook();
    } catch (error) { console.error("Init Error", error); }
};

window.forceUpdateAll = async function () {
    var list = [...TRANSLATIONS.map(t => t + '.json'), 'harpa.json', 'cantor_cristao.json', 'novo_cantico_completo.json', 'quiz.json', 'bible-data.js'];
    for (var i = 0; i < list.length; i++) { try { await fetch('./' + list[i], { cache: 'reload' }); } catch (e) { } }
};

// 4. NAVEGAÇÃO E HEADER DINÂMICO
function _showScreenInternal(screenId) {
    if (screenId !== 'screen-read' && state.pulpitMode) togglePulpitMode();

    // Referências aos Headers
    var hHome = document.getElementById('header-home');
    var hRead = document.getElementById('header-read');
    var hHymn = document.getElementById('header-hymn');
    var hGen = document.getElementById('header-generic');
    var hTitle = document.getElementById('header-generic-title');
    var rightControls = document.getElementById('header-controls-right');

    // Reset: Esconde todos
    [hHome, hRead, hHymn, hGen].forEach(el => { if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
    if (rightControls) rightControls.classList.remove('hidden'); // Padrão visível

    // Lógica de Ativação do Header
    if (screenId === 'screen-home') {
        if (hHome) hHome.classList.remove('hidden');
        if (rightControls) rightControls.classList.add('hidden'); // Home já tem controles
    }
    else if (screenId === 'screen-read') {
        if (hRead) { hRead.classList.remove('hidden'); hRead.classList.add('flex'); }
    }
    else if (screenId === 'screen-harpa') {
        if (hHymn) { hHymn.classList.remove('hidden'); hHymn.classList.add('flex'); }
    }
    else {
        // Telas Genéricas (Quiz, Planos, Destaques, Sobre, Backup)
        if (hGen) { hGen.classList.remove('hidden'); hGen.classList.add('flex'); }
        if (hTitle) {
            if (screenId === 'screen-quiz') hTitle.innerText = 'Quiz Bíblico';
            else if (screenId === 'screen-plan-overview') hTitle.innerText = 'Planos';
            else if (screenId === 'screen-highlights') hTitle.innerText = 'Destaques';
            else if (screenId === 'screen-backup') hTitle.innerText = 'Backup';
            else if (screenId === 'screen-about') hTitle.innerText = 'Sobre';
            else if (screenId === 'screen-search') hTitle.innerText = 'Busca';
            else if (screenId === 'screen-hymn') hTitle.innerText = 'Hino';
            else hTitle.innerText = 'Voltar';
        }
    }

    // Troca o conteúdo principal
    document.querySelectorAll('#main-content > div').forEach(s => s.id.startsWith('screen-') && s.classList.add('hidden'));
    var target = document.getElementById(screenId);
    if (target) { target.classList.remove('hidden'); window.scrollTo(0, 0); }
}

window.showScreen = function (screenId) {
    window.history.pushState({ screen: screenId }, screenId, '');
    _showScreenInternal(screenId);
    if (screenId === 'screen-read') { if (state.mode !== 'plan') state.mode = 'free'; loadChapter(); }
    if (screenId === 'screen-quiz') startQuizSession();
    if (screenId === 'screen-highlights') loadHighlightsList();
    if (screenId === 'screen-plan-overview') renderPlanOverview();
};

window.goBack = function () { window.history.back(); };

// 5. LEITURA BÍBLICA
window.handleNavigationChange = function () {
    var st = document.getElementById('read-translation');
    var sb = document.getElementById('read-book');
    var sc = document.getElementById('read-chapter');
    if (st) state.translation = st.value;
    if (sb) state.book = parseInt(sb.value);
    if (sc) state.chapter = parseInt(sc.value);
    updateChaptersSelect(false);
    loadChapter();
};

async function loadChapter() {
    window.scrollTo(0, 0);
    var container = document.getElementById('text-container');

    var els = { t: document.getElementById('read-translation'), b: document.getElementById('read-book'), c: document.getElementById('read-chapter') };
    if (els.t) els.t.value = state.translation;
    if (els.b) { els.b.value = state.book; updateChaptersSelect(false); }
    if (els.c) els.c.value = state.chapter;

    localStorage.setItem('agape_version', state.translation);
    localStorage.setItem('agape_book', state.book);
    localStorage.setItem('agape_chapter', state.chapter);

    container.innerHTML = '<div class="text-center p-10 text-gray-500 animate-pulse flex flex-col items-center justify-center h-64">Carregando Escrituras...</div>';

    try {
        if (!bibleCache[state.translation]) {
            var res = await fetch('./' + state.translation + '.json');
            bibleCache[state.translation] = await res.json();
        }
        var bookData = bibleCache[state.translation][state.book];
        if (!bookData || !bookData.chapters[state.chapter - 1]) state.chapter = 1;

        var verses = bookData.chapters[state.chapter - 1];
        var html = '';

        verses.forEach(function (text, idx) {
            var vNum = idx + 1;
            var vId = state.book + '-' + state.chapter + '-' + vNum;
            var mark = savedMarks[vId] || '';
            var hasNote = savedNotes[vId] ? '<i class="ph-fill ph-note-pencil text-accent-500 text-xs ml-1" title="Nota Pessoal"></i>' : '';
            var content = text;

            html += '<div class="flex gap-3 relative group cursor-pointer hover:bg-bible-100 dark:hover:bg-bible-800/50 p-2 rounded-lg transition ' + mark + '" ' +
                'id="v-' + vNum + '" onclick="handleVerseClick(\'' + vId + '\', \'' + escapeHtml(text) + '\', \'' + BIBLE_BOOKS[state.book].name + ' ' + state.chapter + ':' + vNum + '\')">' +
                '<div class="flex flex-col items-end w-6 shrink-0 mt-1"><span class="text-xs font-bold text-bible-400 font-sans">' + vNum + '</span>' + hasNote + '</div>' +
                '<p class="verse-content text-lg flex-1 leading-relaxed" style="font-size:' + state.fontSize + 'px">' + content + '</p></div>';
        });
        container.innerHTML = html;
        setupSwipeGestures();
    } catch (e) { console.error(e); container.innerHTML = 'Erro ao carregar.'; }
}

window.changeChapter = function (delta) {
    var max = BIBLE_BOOKS[state.book].caps;
    var next = state.chapter + delta;
    if (next > max) { if (state.book < 65) { state.book++; next = 1; } else return; }
    else if (next < 1) { if (state.book > 0) { state.book--; next = BIBLE_BOOKS[state.book].caps; } else return; }
    state.chapter = next;
    loadChapter();
};

window.updateChaptersSelect = function (reload) {
    var sel = document.getElementById('read-chapter');
    sel.innerHTML = '';
    for (var i = 1; i <= BIBLE_BOOKS[state.book].caps; i++) sel.add(new Option(i, i));
    if (state.chapter > BIBLE_BOOKS[state.book].caps) state.chapter = 1;
    sel.value = state.chapter;
    if (reload) loadChapter();
};

window.populateSelectElements = function () {
    var t = document.getElementById('read-translation');
    if (t) { t.innerHTML = TRANSLATIONS.map(x => '<option value="' + x + '">' + x + '</option>').join(''); t.value = state.translation; }
    var tp = document.getElementById('plan-translation');
    if (tp) { tp.innerHTML = TRANSLATIONS.map(x => '<option value="' + x + '">' + x + '</option>').join(''); tp.value = 'NVI'; }
    var b = document.getElementById('read-book');
    if (b) { b.innerHTML = ''; BIBLE_BOOKS.forEach((k, i) => b.add(new Option(k.name, i))); b.value = state.book; updateChaptersSelect(false); }
};

// 6. PLANOS
function getPlanDataForDay(d, tot, type) {
    if (typeof FLAT_BIBLE_INDEX === 'undefined') return null;
    var src = (type === 'chronological') ? FLAT_CHRONO_INDEX : FLAT_BIBLE_INDEX;
    var chunk = src.length / tot;
    var start = Math.floor((d - 1) * chunk);
    var end = Math.min(Math.floor(d * chunk) - 1, src.length - 1);
    if (start >= src.length) return null;
    var range = BIBLE_BOOKS[src[start].b].name + ' ' + src[start].c;
    if (src[start].b !== src[end].b || src[start].c !== src[end].c) range += ' ... ' + BIBLE_BOOKS[src[end].b].name + ' ' + src[end].c;
    return { rangeText: range, start: src[start] };
}

window.renderPlanOverview = function () {
    var c = JSON.parse(localStorage.getItem('agape_plan'));
    var cont = document.getElementById('plan-overview-list');
    if (!c || !c.active) { cont.innerHTML = '<div class="text-center p-10 flex flex-col items-center"><p class="text-gray-500 mb-4">Nenhum plano ativo.</p><button onclick="openPlanSetup()" class="bg-accent-600 text-white px-6 py-2 rounded-lg font-bold">Criar Plano Agora</button></div>'; return; }
    var pct = Math.round((planProgress.length / parseInt(c.duration)) * 100);
    document.getElementById('plan-progress-bar').style.width = pct + '%';
    document.getElementById('plan-progress-text').innerText = pct + '% Concluído';
    var h = '';
    for (var i = 1; i <= parseInt(c.duration); i++) {
        var done = planProgress.includes(i);
        var data = getPlanDataForDay(i, parseInt(c.duration), c.type);
        if (!data) continue;
        var style = done ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/10' : 'border-bible-200 dark:border-bible-700';
        h += '<div class="bg-white dark:bg-bible-800 p-4 rounded-xl border ' + style + ' flex items-center justify-between shadow-sm transition">' +
            '<div class="flex-1 cursor-pointer" onclick="openPlanDayReading(' + data.start.b + ',' + data.start.c + ')"><p class="text-xs font-bold text-bible-400 uppercase">Dia ' + i + '</p><h4 class="font-bold text-lg">' + data.rangeText + '</h4></div>' +
            '<button onclick="togglePlanDay(' + i + ')" class="p-3 rounded-full transition ' + (done ? 'bg-accent-600 text-white shadow-lg' : 'bg-bible-100 dark:bg-bible-700 text-bible-400 hover:bg-bible-200') + '"><i class="ph-bold ' + (done ? 'ph-check' : 'ph-circle') + ' text-xl"></i></button></div>';
    }
    cont.innerHTML = h;
};

window.togglePlanDay = function (d) {
    var i = planProgress.indexOf(d);
    if (i === -1) planProgress.push(d); else planProgress.splice(i, 1);
    localStorage.setItem('agape_plan_progress', JSON.stringify(planProgress));
    renderPlanOverview();
};

window.openPlanDayReading = function (b, c) { state.book = b; state.chapter = c; state.mode = 'plan'; showScreen('screen-read'); };
window.deleteCurrentPlan = function () { if (confirm("ATENÇÃO: Deseja excluir o plano atual?")) { localStorage.removeItem('agape_plan'); localStorage.removeItem('agape_plan_progress'); planProgress = []; document.getElementById('active-plan-card').classList.add('hidden'); alert("Plano excluído."); goBack(); } };
window.startNewPlan = function () {
    var type = document.querySelector('input[name="plan_order"]:checked').value;
    var dur = document.getElementById('plan-duration').value;
    var trans = document.getElementById('plan-translation').value;
    localStorage.setItem('agape_plan', JSON.stringify({ active: true, start: new Date(), type: type, duration: dur }));
    planProgress = [];
    localStorage.setItem('agape_plan_progress', '[]');
    state.translation = trans;
    closeModal('modal-plan');
    document.getElementById('active-plan-card').classList.remove('hidden');
    alert("Plano Criado!");
    showScreen('screen-plan-overview');
};

// 7. HINÁRIOS
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
        } catch (e) { console.error(e); container.innerHTML = '<div class="text-red-500 text-center p-4">Erro ao carregar hinário.</div>'; return; }
    }
    currentHymnList = hymnCache[state.hymnbook];
    renderHymnList(currentHymnList);
};

function normalizeHymnData(data, type) {
    var list = [];
    var isObjectFormat = !Array.isArray(data) && (data["1"] || data["01"] || Object.keys(data).length > 0);
    if (isObjectFormat) {
        Object.keys(data).forEach(function (key) {
            var item = data[key];
            var title = item.hino || item.titulo || item.title;
            if (title) {
                var fullText = "";
                if (item.verses) {
                    if (typeof item.verses === 'object' && !Array.isArray(item.verses)) {
                        fullText = Object.values(item.verses).map(v => v.replace(/<br\s*\/?>/gi, '\n')).join('\n\n');
                    } else if (Array.isArray(item.verses)) { fullText = item.verses.join('\n\n'); }
                } else if (item.letra) { fullText = item.letra.replace(/<br\s*\/?>/gi, '\n'); }
                if (item.coro && item.coro.trim() !== "") {
                    var cleanChorus = item.coro.replace(/<br\s*\/?>/gi, '\n');
                    fullText += "\n\n[Coro]\n" + cleanChorus;
                }
                list.push({ id: key, title: title, fullText: fullText });
            }
        });
    } else {
        var source = Array.isArray(data) ? data : (data.hinos || data.songs || Object.values(data));
        source.forEach(function (h) {
            var id = h.id || h.numero || h.num;
            var title = h.title || h.titulo || h.nome || h.hino;
            var text = h.lyrics || h.letra || h.text || h.hino;
            if (text) text = text.replace(/\[coro\]/gi, "\n\n[Coro]\n");
            if (id && title) list.push({ id: id, title: id + ' - ' + title, fullText: text || '' });
        });
    }
    list.sort(function (a, b) { return parseInt(a.id.toString().replace(/\D/g, '')) - parseInt(b.id.toString().replace(/\D/g, '')); });
    return list;
}

function renderHymnList(list) {
    document.getElementById('harpa-list').innerHTML = list.slice(0, 100).map(function (h) {
        var cleanTitle = h.title ? h.title.replace(/^\d+\s*-\s*/, '') : 'Hino';
        return '<div onclick="openHymn(\'' + h.id + '\')" class="bg-white dark:bg-bible-800 p-4 rounded-xl border border-bible-200 dark:border-bible-700 cursor-pointer flex items-center gap-3 hover:border-accent-600 transition shadow-sm"><span class="w-10 h-10 rounded-full bg-bible-50 text-bible-600 font-bold flex items-center justify-center text-sm shrink-0">' + h.id + '</span><span class="truncate font-medium flex-1">' + cleanTitle + '</span></div>';
    }).join('');
}

window.openHymn = function (id) {
    var h = currentHymnList.find(function (x) { return x.id.toString() === id.toString(); });
    if (!h) return;
    document.getElementById('hymn-title').innerText = h.title;
    var htmlContent = '';
    if (h.fullText) {
        var rawText = h.fullText.replace(/\r\n/g, '\n');
        rawText = rawText.replace(/(\[Coro\]|\[coro\]|Refrão:|Estribilho:)/gi, "\n\n$1");
        var parts = rawText.split(/\n\n+/);
        htmlContent = parts.map(function (part) {
            var cleanText = part.trim();
            if (!cleanText) return '';
            var isChorus = /^(coro|refrão|estribilho|chorus)/i.test(cleanText) || cleanText.includes('[Coro]') || cleanText.includes('[coro]');
            var isMen = cleanText.startsWith('{') && cleanText.endsWith('}');
            var isWomen = cleanText.startsWith('[') && cleanText.endsWith(']') && !isChorus;

            cleanText = cleanText.replace(/(\[Coro\]|\[coro\]|Refrão:|Estribilho:)/gi, '').trim();
            if (isMen) cleanText = cleanText.substring(1, cleanText.length - 1).trim();
            if (isWomen) cleanText = cleanText.substring(1, cleanText.length - 1).trim();

            var content = cleanText.replace(/\n/g, '<br>');
            if (isChorus) return '<div class="hymn-chorus"><span class="text-[10px] font-bold uppercase tracking-widest block mb-1 opacity-70">Refrão</span>' + content + '</div>';
            else if (isMen) return '<div class="hymn-men"><span class="text-[10px] font-bold uppercase tracking-widest block mb-1 opacity-70">Rapazes</span>' + content + '</div>';
            else if (isWomen) return '<div class="hymn-women"><span class="text-[10px] font-bold uppercase tracking-widest block mb-1 opacity-70">Moças</span>' + content + '</div>';
            else return '<div class="mb-6 leading-relaxed text-bible-800 dark:text-bible-200">' + content + '</div>';
        }).join('');
    }
    document.getElementById('hymn-content').innerHTML = htmlContent;
    showScreen('screen-hymn');
};

// 8. BUSCA INTELIGENTE
function normalizeText(text) {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.,;?!:()"]/g, "");
}

window.filterHarpa = function () {
    var term = normalizeText(document.getElementById('harpa-search').value);
    var filtered = currentHymnList.filter(function (h) {
        return normalizeText(h.title).includes(term) || h.id.toString() === term;
    });
    renderHymnList(filtered);
};

window.setupSearchInput = function () {
    document.getElementById('search-input').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') performSearch();
    });
};

async function performSearch() {
    var rawQuery = document.getElementById('search-input').value;
    var q = normalizeText(rawQuery);
    if (q.length < 3) { document.getElementById('search-results').innerHTML = '<div class="p-10 text-center text-bible-400">Digite pelo menos 3 letras...</div>'; return; }

    document.getElementById('search-results').innerHTML = '<div class="p-10 text-center animate-pulse">Buscando...</div>';

    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(async function () {
        if (!bibleCache[state.translation]) {
            var r = await fetch('./' + state.translation + '.json');
            bibleCache[state.translation] = await r.json();
        }
        var bib = bibleCache[state.translation];
        var results = [];
        var count = 0;

        loop: for (var b = 0; b < bib.length; b++) {
            for (var c = 0; c < bib[b].chapters.length; c++) {
                for (var v = 0; v < bib[b].chapters[c].length; v++) {
                    var verseText = bib[b].chapters[c][v];
                    if (normalizeText(verseText).includes(q)) {
                        results.push({ b: b, c: c + 1, v: v + 1, text: verseText, ref: BIBLE_BOOKS[b].name + ' ' + (c + 1) + ':' + (v + 1) });
                        if (++count >= 50) break loop;
                    }
                }
            }
        }
        if (results.length > 0) {
            document.getElementById('search-results').innerHTML = results.map(function (r) {
                return '<div onclick="goToVerse(' + r.b + ',' + r.c + ',' + r.v + ')" class="bg-white dark:bg-bible-800 p-4 rounded-xl border border-bible-200 dark:border-bible-700 cursor-pointer hover:border-accent-600 transition shadow-sm"><p class="font-bold text-accent-600 text-sm mb-1">' + r.ref + '</p><p class="text-sm line-clamp-2 text-bible-700 dark:text-bible-300">' + r.text + '</p></div>';
            }).join('');
        } else {
            document.getElementById('search-results').innerHTML = '<div class="p-10 text-center">Nada encontrado.</div>';
        }
    }, 300);
}

// 9. FUNÇÕES DE UTILIDADE E MODAIS
window.loadQuizData = async function () { try { var r = await fetch('./quiz.json'); if (r.ok) quizData = await r.json(); } catch (e) { } document.getElementById('quiz-points').innerText = quizTotalPoints; };
window.startQuizSession = function () { quizSession = { active: true, currentLevel: 'facil', streak: 0, score: 0, history: [] }; renderQuizQuestion(); };
window.renderQuizQuestion = function () { var c = document.getElementById('quiz-container'); var p = quizData.filter(function (q) { return q.nivel === quizSession.currentLevel && !quizSession.history.includes(q.id); }); if (p.length === 0) p = quizData.filter(function (q) { return !quizSession.history.includes(q.id); }); if (p.length === 0) { c.innerHTML = '<div class="text-center p-8 animate-pop"><h3 class="font-bold text-2xl mb-2">Quiz Concluído!</h3><p class="mb-4">Você é um mestre da Bíblia!</p><button onclick="startQuizSession()" class="bg-accent-600 text-white px-6 py-3 rounded-xl font-bold mt-4 shadow-lg hover:scale-105 transition">Jogar Novamente</button></div>'; return; } var q = p[Math.floor(Math.random() * p.length)]; var options = q.opcoes.map(function (o, i) { var letter = ['A', 'B', 'C', 'D'][i]; return '<button onclick="handleQuizAnswer(' + q.id + ', ' + i + ', this)" class="w-full text-left p-4 rounded-xl bg-bible-50 dark:bg-bible-700 hover:bg-bible-100 dark:hover:bg-bible-600 transition font-medium flex gap-3 group items-center relative overflow-hidden"><div class="w-8 h-8 rounded-full bg-white dark:bg-bible-600 flex items-center justify-center font-bold text-sm text-bible-500 group-hover:text-accent-600 shadow-sm z-10">' + letter + '</div><span class="flex-1 z-10">' + o + '</span></button>'; }).join(''); c.innerHTML = '<div class="bg-white dark:bg-bible-800 p-6 rounded-3xl shadow-lg border border-bible-200 dark:border-bible-700 animate-slide-up"><div class="flex justify-between items-center mb-4"><span class="bg-bible-100 dark:bg-bible-900/30 text-bible-700 dark:text-bible-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">' + quizSession.currentLevel + '</span>' + (quizSession.streak > 1 ? '<span class="text-xs font-bold text-orange-500 animate-pulse">🔥 Combo x' + quizSession.streak + '</span>' : '') + '</div><h3 class="text-xl font-bold my-6 leading-relaxed">' + q.pergunta + '</h3><div class="space-y-3">' + options + '</div></div>'; };
window.handleQuizAnswer = function (qid, opt, btn) { document.querySelectorAll('#quiz-container button').forEach(function (b) { b.disabled = true; b.style.opacity = '0.7'; }); var q = quizData.find(function (x) { return x.id === qid; }); btn.style.opacity = '1'; btn.classList.remove('bg-bible-50', 'dark:bg-bible-700'); if (opt === q.correta) { btn.classList.add('animate-pop', 'bg-green-100', 'border-green-500', 'text-green-800'); triggerConfetti(); quizTotalPoints += 10 + (quizSession.streak * 2); quizSession.streak++; var s = document.getElementById('quiz-points'); s.innerText = quizTotalPoints; s.parentElement.classList.add('animate-pop'); setTimeout(function () { s.parentElement.classList.remove('animate-pop'); }, 300); quizSession.history.push(qid); localStorage.setItem('agape_quiz_points', quizTotalPoints); if (quizSession.streak >= 3 && quizSession.currentLevel === 'facil') quizSession.currentLevel = 'medio'; else if (quizSession.streak >= 5 && quizSession.currentLevel === 'medio') quizSession.currentLevel = 'dificil'; setTimeout(renderQuizQuestion, 1500); } else { btn.classList.add('animate-shake', 'bg-red-100', 'border-red-500', 'text-red-800'); if (navigator.vibrate) navigator.vibrate(300); quizSession.streak = 0; setTimeout(function () { alert('Ah não! A resposta correta era: ' + q.opcoes[q.correta]); quizSession.history.push(qid); renderQuizQuestion(); }, 1000); } };
function triggerConfetti() { for (let i = 0; i < 30; i++) { const c = document.createElement('div'); c.classList.add('confetti'); c.style.left = Math.random() * 100 + 'vw'; c.style.top = '-10px'; c.style.backgroundColor = ['#f59e0b', '#ffffff', '#22c55e', '#fcd34d'][Math.floor(Math.random() * 4)]; c.style.animationDuration = (Math.random() * 2 + 1) + 's'; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 3000); } }
window.openImageCreator = function () { openImageCreatorWithText(document.getElementById('daily-text').innerText, document.getElementById('daily-reference').innerText); };
window.openImageCreatorFromVerse = function () { closeModal('modal-verse'); openImageCreatorWithText(selectedVerse.text, selectedVerse.ref); };
window.openImageCreatorWithText = function (t, r) { currentVerseText = t.replace(/"/g, ''); currentVerseRef = r; var m = document.getElementById('modal-image-creator'); m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(drawCanvas, 100); };
window.changeTheme = function (id) { currentThemeId = id; drawCanvas(); };
function drawCanvas() { var cvs = document.getElementById('image-editor-canvas'); if (!cvs) return; var ctx = cvs.getContext('2d'); var t = THEMES[currentThemeId]; cvs.width = 1080; cvs.height = 1920; var grd = ctx.createLinearGradient(0, 0, 0, canvas.height); grd.addColorStop(0, t.bgStart); grd.addColorStop(1, t.bgEnd); ctx.fillStyle = grd; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = t.watermark; ctx.font = "bold 600px " + t.fontMain; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("”", canvas.width / 2, canvas.height / 2 - 100); ctx.fillStyle = t.text; ctx.textAlign = "center"; var fontSize = 80; if (currentVerseText.length > 150) fontSize = 60; if (currentVerseText.length > 300) fontSize = 50; ctx.font = "italic " + fontSize + "px " + t.fontMain; var lines = wrapText(ctx, currentVerseText, canvas.width - 200); var startY = (canvas.height - (lines.length * (fontSize * 1.5))) / 2; lines.forEach(function (l, i) { ctx.fillText(l, canvas.width / 2, startY + (i * fontSize * 1.5)); }); var refY = startY + (lines.length * fontSize * 1.5) + 60; ctx.fillStyle = t.accent; ctx.font = "bold 40px " + t.fontSec; ctx.fillText(currentVerseRef.toUpperCase(), canvas.width / 2, refY); ctx.fillStyle = t.text; ctx.globalAlpha = 0.6; ctx.font = "30px " + t.fontSec; ctx.fillText("BÍBLIA ÁGAPE • LEIAABIBLIA.APP", canvas.width / 2, canvas.height - 120); ctx.globalAlpha = 1.0; }
function wrapText(ctx, text, maxWidth) { var words = text.split(' '), lines = [], line = ''; words.forEach(function (w) { var test = line + w + ' '; if (ctx.measureText(test).width > maxWidth) { lines.push(line); line = w + ' '; } else { line = test; } }); lines.push(line); return lines; }
window.shareCreatedImage = function () { document.getElementById('image-editor-canvas').toBlob(function (blob) { var f = new File([blob], 'v.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'Bíblia Ágape', text: 'Versículo do dia criado com Bíblia Ágape.' }); } else downloadCreatedImage(); }); };
window.downloadCreatedImage = function () { var a = document.createElement('a'); a.download = 'v.png'; a.href = document.getElementById('image-editor-canvas').toDataURL(); a.click(); };
window.setupSwipeGestures = function () { var el = document.getElementById('main-content'); if (!el) return; el.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true }); el.addEventListener('touchend', function (e) { if (touchStartX - e.changedTouches[0].screenX < -80) goBack(); }, { passive: true }); };
window.checkActivePlan = function () { if (localStorage.getItem('agape_plan')) document.getElementById('active-plan-card').classList.remove('hidden'); };
window.escapeHtml = function (t) { return t.replace(/"/g, "&quot;").replace(/'/g, "&#039;"); };
window.updateStreakDisplay = function () { document.getElementById('streak-count-header').innerText = streakData.count; };
window.searchBible = function () { showScreen('screen-search'); setTimeout(function () { document.getElementById('search-input').focus(); }, 300); };
window.goToVerse = function (b, c, v) { state.book = b; state.chapter = c; showScreen('screen-read'); setTimeout(function () { var el = document.getElementById('v-' + v); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('highlight-yellow'); setTimeout(function () { el.classList.remove('highlight-yellow'); }, 2000); } }, 600); };
window.setupInstallPrompt = function () { window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; document.getElementById('install-container').classList.remove('hidden'); document.getElementById('btn-install').onclick = function () { deferredPrompt.prompt(); }; }); };
window.hardReset = function () { if (confirm("Apagar tudo?")) { localStorage.clear(); location.reload(); } };
window.loadHighlightsList = function () { var k = Object.keys(savedMarks), c = document.getElementById('highlights-container'); c.innerHTML = k.length ? k.map(function (ky) { var p = ky.split('-'); return '<div onclick="goToVerse(' + p[0] + ',' + p[1] + ',' + p[2] + ')" class="bg-white dark:bg-bible-800 p-4 rounded-xl border-l-4 border-accent-500 cursor-pointer shadow-sm"><p class="font-bold text-bible-800 dark:text-bible-200">' + BIBLE_BOOKS[p[0]].name + ' ' + p[1] + ':' + p[2] + '</p></div>'; }).join('') : '<div class="p-10 text-center">Sem destaques.</div>'; };
window.shareApp = function () { navigator.share ? navigator.share({ title: "Bíblia Ágape", url: window.location.href }) : alert("Use o menu do navegador."); };
window.actionVerse = function (act) { if (act === 'copy') { navigator.clipboard.writeText('"' + selectedVerse.text + '" - ' + selectedVerse.ref); closeModal('modal-verse'); alert("Copiado!"); } };
window.loadDailyVerse = function () { if (typeof DAILY_VERSES_POOL !== 'undefined') { var v = DAILY_VERSES_POOL[new Date().getDate() % DAILY_VERSES_POOL.length]; document.getElementById('daily-text').innerText = '"' + v.text + '"'; document.getElementById('daily-reference').innerText = v.ref; } };
window.handleVerseClick = function (id, text, ref) { selectedVerse = { id, text, ref }; var m = document.getElementById('modal-verse'); m.classList.remove('hidden'); m.classList.add('flex'); };
window.markVerse = function (cls) { if (cls === 'remove') delete savedMarks[selectedVerse.id]; else savedMarks[selectedVerse.id] = cls; localStorage.setItem('agape_marks_v2', JSON.stringify(savedMarks)); loadChapter(); closeModal('modal-verse'); };
window.closeModal = function (id) { var el = document.getElementById(id); el.classList.add('hidden'); el.classList.remove('flex'); };
window.openPlanSetup = function () { var m = document.getElementById('modal-plan'); m.classList.remove('hidden'); m.classList.add('flex'); };
window.openFeedbackModal = function () { var m = document.getElementById('modal-feedback'); m.classList.remove('hidden'); m.classList.add('flex'); };
window.sendFeedbackToEmail = function () { alert("Enviado com sucesso!"); closeModal('modal-feedback'); };
window.exportData = function () { var a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ meta: { app: "Ágape" }, data: { ...localStorage } })); a.download = "backup.json"; a.click(); };
window.triggerImport = function () { document.getElementById('import-file').click(); };
window.handleImportFile = function (e) { var r = new FileReader(); r.onload = function (ev) { try { var d = JSON.parse(ev.target.result).data; Object.keys(d).forEach(function (k) { localStorage.setItem(k, d[k]); }); location.reload(); } catch (err) { alert("Erro"); } }; r.readAsText(e.target.files[0]); };
window.toggleTheme = function () { state.theme = state.theme === 'light' ? 'dark' : 'light'; applyTheme(state.theme); localStorage.setItem('agape_theme', state.theme); };
function applyTheme(t) { var meta = document.querySelector('meta[name="theme-color"]'); if (t === 'dark') { document.documentElement.classList.add('dark'); if (meta) meta.setAttribute('content', '#1c1917'); } else { document.documentElement.classList.remove('dark'); if (meta) meta.setAttribute('content', '#fafaf9'); } }
window.changeFontSize = function (d) { state.fontSize += d; if (state.fontSize < 14) state.fontSize = 14; if (state.fontSize > 40) state.fontSize = 40; localStorage.setItem('agape_font', state.fontSize); document.querySelectorAll('.verse-content').forEach(function (p) { p.style.fontSize = state.fontSize + 'px'; }); };
window.renderCompass = function () { var c = document.getElementById('compass-container'); if (!c || typeof EMOTION_DATA === 'undefined') return; var unique = []; var seen = new Set(); EMOTION_DATA.forEach(function (i) { if (!seen.has(i.label)) { seen.add(i.label); unique.push(i); } }); c.innerHTML = unique.map(function (i) { return '<button onclick="handleCompassClick(\'' + i.label + '\')" class="flex flex-col items-center gap-2 min-w-[80px] snap-center group"><div class="w-14 h-14 rounded-2xl bg-white dark:bg-bible-800 border border-bible-200 dark:border-bible-700 flex items-center justify-center text-2xl text-accent-600 shadow-sm group-hover:scale-110 transition duration-300"><i class="ph-fill ' + i.icon + '"></i></div><span class="text-[10px] font-bold uppercase tracking-wider text-bible-500 dark:text-bible-400 group-hover:text-bible-900 dark:group-hover:text-white">' + i.label + '</span></button>'; }).join(''); };
window.handleCompassClick = function (l) { var p = EMOTION_DATA.filter(function (i) { return i.label === l; }); if (p.length > 0) openCompassModal(p[Math.floor(Math.random() * p.length)]); };
window.openCompassModal = function (i) { var m = document.getElementById('modal-compass'); document.getElementById('compass-label').innerText = i.label; document.getElementById('compass-text').innerText = '"' + i.text + '"'; document.getElementById('compass-ref').innerText = BIBLE_BOOKS[i.book].name + ' ' + i.chap + ':' + i.verse; document.getElementById('compass-help').innerText = i.help; document.getElementById('compass-action-btn').onclick = function () { goToVerse(i.book, i.chap, i.verse); closeModal('modal-compass'); }; m.classList.remove('hidden'); m.classList.add('flex'); };
window.openDailyVerseReading = function () { var t = document.getElementById('daily-reference').innerText.trim(); if (!t || t === "...") return; var idx = t.lastIndexOf(' '), name = t.substring(0, idx).trim(), nums = t.substring(idx + 1).trim(), p = nums.split(':'); var bid = BIBLE_BOOKS.findIndex(function (b) { return b.name.toLowerCase() === name.toLowerCase(); }); if (bid !== -1) { goToVerse(bid, parseInt(p[0]), parseInt(p[1])); if (navigator.vibrate) navigator.vibrate(50); } else showScreen('screen-read'); };
window.togglePulpitMode = function () {
    state.pulpitMode = !state.pulpitMode;
    var hMain = document.getElementById('main-header'); // Header Dinâmico Global
    var n = document.getElementById('reading-nav-bar');
    var e = document.getElementById('btn-exit-pulpit');

    if (state.pulpitMode) {
        hMain.classList.add('-translate-y-full'); // Esconde o Main Header inteiro
        n.classList.add('translate-y-full');
        e.classList.remove('hidden');
        changeFontSize(4);
    } else {
        hMain.classList.remove('-translate-y-full'); // Mostra de volta
        n.classList.remove('translate-y-full');
        e.classList.add('hidden');
        changeFontSize(-4);
    }
};
window.openNoteEditor = function () { closeModal('modal-verse'); var m = document.getElementById('modal-note'); m.classList.remove('hidden'); m.classList.add('flex'); document.getElementById('note-input').value = savedNotes[selectedVerse.id] || ""; document.getElementById('note-input').focus(); };
window.saveNote = function () { var t = document.getElementById('note-input').value.trim(); if (t) savedNotes[selectedVerse.id] = t; else delete savedNotes[selectedVerse.id]; localStorage.setItem('agape_notes', JSON.stringify(savedNotes)); loadChapter(); closeModal('modal-note'); alert("Nota salva!"); };
window.deleteNote = function () { if (confirm("Apagar?")) { delete savedNotes[selectedVerse.id]; localStorage.setItem('agape_notes', JSON.stringify(savedNotes)); loadChapter(); closeModal('modal-note'); } };