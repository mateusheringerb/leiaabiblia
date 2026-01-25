/**
 * ============================================================================
 * BÍBLIA ÁGAPE - APLICAÇÃO PRINCIPAL (app.js)
 * Versão: V2.6.2 (Fix: Gestão de Cabeçalhos & Modo Púlpito)
 * Data: 24/01/2026
 * Autor: Mateus Heringer & Daniel
 * ============================================================================
 */

// --- 1. CONFIGURAÇÕES E CONSTANTES ---

var TRANSLATIONS = ["ACF", "ARA", "ARC", "AS21", "JFAA", "KJA", "KJF", "NAA", "NBV", "NTLH", "NVI", "NVT", "TB"];

const THEMES = {
    midnight: { bgStart: "#18181b", bgEnd: "#09090b", text: "#ffffff", accent: "#d4d4d8", watermark: "rgba(255,255,255,0.03)", fontMain: "Merriweather", fontSec: "Inter" },
    paper: { bgStart: "#fafaf9", bgEnd: "#e7e5e4", text: "#1c1917", accent: "#b45309", watermark: "rgba(0,0,0,0.03)", fontMain: "Merriweather", fontSec: "Inter" },
    royal: { bgStart: "#1e1b4b", bgEnd: "#020617", text: "#ffffff", accent: "#a5b4fc", watermark: "rgba(255,255,255,0.05)", fontMain: "Playfair Display", fontSec: "Inter" },
    nature: { bgStart: "#064e3b", bgEnd: "#022c22", text: "#ecfdf5", accent: "#6ee7b7", watermark: "rgba(255,255,255,0.05)", fontMain: "Merriweather", fontSec: "Inter" }
};

const EMOTION_DATA = [
    { label: "Ansioso", icon: "ph-wind", book: 49, chap: 4, verse: 6 },
    { label: "Ansioso", icon: "ph-wind", book: 59, chap: 5, verse: 7 },
    { label: "Ansioso", icon: "ph-wind", book: 39, chap: 6, verse: 34 },
    { label: "Cansado", icon: "ph-battery-warning", book: 39, chap: 11, verse: 28 },
    { label: "Cansado", icon: "ph-battery-warning", book: 22, chap: 40, verse: 31 },
    { label: "Cansado", icon: "ph-battery-warning", book: 47, chap: 6, verse: 9 },
    { label: "Triste", icon: "ph-cloud-rain", book: 18, chap: 34, verse: 18 },
    { label: "Triste", icon: "ph-cloud-rain", book: 65, chap: 21, verse: 4 },
    { label: "Triste", icon: "ph-cloud-rain", book: 39, chap: 5, verse: 4 },
    { label: "Medo", icon: "ph-shield-warning", book: 18, chap: 27, verse: 1 },
    { label: "Medo", icon: "ph-shield-warning", book: 22, chap: 41, verse: 10 },
    { label: "Medo", icon: "ph-shield-warning", book: 54, chap: 1, verse: 7 },
    { label: "Grato", icon: "ph-heart", book: 18, chap: 136, verse: 1 },
    { label: "Grato", icon: "ph-heart", book: 51, chap: 5, verse: 18 },
    { label: "Grato", icon: "ph-heart", book: 50, chap: 3, verse: 17 },
    { label: "Sozinho", icon: "ph-user", book: 22, chap: 41, verse: 10 },
    { label: "Sozinho", icon: "ph-user", book: 39, chap: 28, verse: 20 },
    { label: "Sozinho", icon: "ph-user", book: 4, chap: 31, verse: 6 },
    { label: "Irritado", icon: "ph-fire", book: 58, chap: 1, verse: 19 },
    { label: "Irritado", icon: "ph-fire", book: 19, chap: 15, verse: 1 },
    { label: "Dúvida", icon: "ph-question", book: 58, chap: 1, verse: 5 },
    { label: "Dúvida", icon: "ph-question", book: 19, chap: 3, verse: 5 }
];

// --- 2. ESTADO E CACHES ---

var state = {
    fontSize: parseInt(localStorage.getItem('agape_font')) || 18,
    theme: localStorage.getItem('agape_theme') || 'light',
    translation: localStorage.getItem('agape_version') || 'NVI',
    book: parseInt(localStorage.getItem('agape_book')) || 0,
    chapter: parseInt(localStorage.getItem('agape_chapter')) || 1,
    hymnbook: 'harpa', mode: 'free', pulpitMode: false
};

var bibleCache = {}, hymnCache = { harpa: null, cantor: null, novocantico: null }, currentHymnList = [], quizData = [], selectedVerse = { id: "", text: "", ref: "" };
var deferredPrompt = null, touchStartX = 0, touchEndX = 0, currentVerseText = "", currentVerseRef = "", currentThemeId = 'midnight';

var savedMarks = {}; try { savedMarks = JSON.parse(localStorage.getItem('agape_marks_v2')) || {}; } catch (e) { savedMarks = {}; }
var savedNotes = {}; try { savedNotes = JSON.parse(localStorage.getItem('agape_notes')) || {}; } catch (e) { savedNotes = {}; }
var streakData = {}; try { streakData = JSON.parse(localStorage.getItem('agape_streak')) || { count: 0, lastDate: "" }; } catch (e) { streakData = { count: 0, lastDate: "" }; }
var quizTotalPoints = parseInt(localStorage.getItem('agape_quiz_points')) || 0;
var planProgress = []; try { planProgress = JSON.parse(localStorage.getItem('agape_plan_progress')) || []; } catch (e) { planProgress = []; }
var quizSession = { active: false, currentLevel: 'facil', streak: 0, score: 0, history: [] };

// --- 3. BOOTSTRAP ---

window.onload = async function () {
    try {
        console.log("=== Iniciando Sistema Bíblia Ágape V2.6.2 ===");
        applyTheme(state.theme); updateStreakDisplay(); populateSelectElements();
        loadDailyVerse(); renderCompass(); await loadQuizData();
        setupSwipeGestures(); setupInstallPrompt(); setupSearchInput(); checkActivePlan();
        if (navigator.onLine) forceUpdateAll();

        // Roteamento inicial
        window.history.replaceState({ screen: 'screen-home' }, 'Home', '');
        window.onpopstate = function (event) {
            if (event.state && event.state.screen) showScreen(event.state.screen);
            else showScreen('screen-home');
        };

        // Carrega leitura inicial
        await loadChapter();
        changeHymnbook();

    } catch (error) { console.error("ERRO CRÍTICO:", error); }
};

window.forceUpdateAll = async function () {
    var files = TRANSLATIONS.map(function (t) { return t + '.json'; }).concat(['harpa.json', 'cantor_cristao.json', 'novo_cantico_completo.json', 'quiz.json', 'bible-data.js']);
    for (var i = 0; i < files.length; i++) { try { await fetch('./' + files[i], { cache: 'reload' }); } catch (e) { } }
};

// --- 4. NAVEGAÇÃO E UI (CORRIGIDO) ---

function _showScreenInternal(screenId) {
    // 1. Desativa modo púlpito ao sair da leitura
    if (screenId !== 'screen-read' && state.pulpitMode) togglePulpitMode();

    // 2. Esconde todas as telas
    document.querySelectorAll('#main-content > div').forEach(function (screen) {
        if (screen.id && screen.id.startsWith('screen-')) screen.classList.add('hidden');
    });

    // 3. Mostra a tela alvo
    var targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // 4. FIX DE CABEÇALHOS: Esconde o Header Principal na tela de Leitura
    var mainHeader = document.getElementById('main-header');
    if (screenId === 'screen-read') {
        if (mainHeader) mainHeader.classList.add('hidden');
    } else {
        if (mainHeader) mainHeader.classList.remove('hidden');
    }
}

window.showScreen = function (screenId) {
    window.history.pushState({ screen: screenId }, screenId, '');
    _showScreenInternal(screenId);

    if (screenId === 'screen-read') {
        if (state.mode !== 'plan') state.mode = 'free';
        loadChapter();
    }
    if (screenId === 'screen-quiz') startQuizSession();
    if (screenId === 'screen-highlights') loadHighlightsList();
    if (screenId === 'screen-plan-overview') renderPlanOverview();
};

window.goBack = function () { window.history.back(); };

// --- 5. LÓGICA DE LEITURA E PÚLPITO (CORRIGIDO) ---

window.togglePulpitMode = function () {
    state.pulpitMode = !state.pulpitMode;

    // FIX: Seleciona o header CORRETO (read-header)
    var header = document.getElementById('read-header');
    var nav = document.getElementById('reading-nav-bar');
    var exitBtn = document.getElementById('btn-exit-pulpit');

    if (state.pulpitMode) {
        if (header) header.classList.add('-translate-y-full'); // Sobe o header de leitura
        if (nav) nav.classList.add('translate-y-full');        // Desce a nav
        if (exitBtn) exitBtn.classList.remove('hidden');       // Mostra botão X
        changeFontSize(4);
    } else {
        if (header) header.classList.remove('-translate-y-full');
        if (nav) nav.classList.remove('translate-y-full');
        if (exitBtn) exitBtn.classList.add('hidden');
        changeFontSize(-4);
    }
};

window.handleNavigationChange = function () {
    var t = document.getElementById('read-translation'), b = document.getElementById('read-book'), c = document.getElementById('read-chapter');
    if (t) state.translation = t.value; if (b) state.book = parseInt(b.value); if (c) state.chapter = parseInt(c.value);
    updateChaptersSelect(false); loadChapter();
};

async function loadChapter() {
    window.scrollTo(0, 0); var container = document.getElementById('text-container');
    var t = document.getElementById('read-translation'), b = document.getElementById('read-book'), c = document.getElementById('read-chapter');
    if (t) t.value = state.translation; if (b) { b.value = state.book; updateChaptersSelect(false); } if (c) c.value = state.chapter;
    localStorage.setItem('agape_version', state.translation); localStorage.setItem('agape_book', state.book); localStorage.setItem('agape_chapter', state.chapter);
    container.innerHTML = '<div class="text-center p-10 text-gray-500 animate-pulse flex flex-col items-center justify-center h-64">Carregando Escrituras Sagradas...</div>';
    try {
        if (!bibleCache[state.translation]) { var res = await fetch('./' + state.translation + '.json'); bibleCache[state.translation] = await res.json(); }
        var bookData = bibleCache[state.translation][state.book];
        if (!bookData || !bookData.chapters || !bookData.chapters[state.chapter - 1]) { state.chapter = 1; if (c) c.value = 1; }
        var verses = bookData.chapters[state.chapter - 1], bName = BIBLE_BOOKS[state.book].name, isGospel = (state.book >= 39 && state.book <= 42);
        container.innerHTML = verses.map(function (text, index) {
            var vNum = index + 1, vId = state.book + '-' + state.chapter + '-' + vNum, mark = savedMarks[vId] || '', ref = bName + ' ' + state.chapter + ':' + vNum;
            var hasNote = savedNotes[vId] ? '<i class="ph-fill ph-note-pencil text-accent-500 text-xs ml-1" title="Nota"></i>' : '';
            var content = isGospel ? text.replace(/“([^”]+)”/g, '<span class="red-letter">“$1”</span>').replace(/"([^"]+)"/g, '<span class="red-letter">"$1"</span>') : text;
            return `<div class="flex gap-3 relative group cursor-pointer hover:bg-bible-100 dark:hover:bg-bible-800/50 p-2 rounded-lg transition ${mark}" id="v-${vNum}" onclick="handleVerseClick('${vId}', '${escapeHtml(text)}', '${ref}')"><div class="flex flex-col items-end w-6 shrink-0 mt-2"><span class="text-xs font-bold text-bible-400 font-sans">${vNum}</span>${hasNote}</div><p class="verse-content text-lg flex-1 leading-loose" style="font-size:${state.fontSize}px">${content}</p></div>`;
        }).join('');
        setupSwipeGestures();
    } catch (e) { container.innerHTML = '<div class="text-center p-10 text-red-500 font-bold">Erro ao carregar texto.</div>'; }
}

window.changeChapter = function (delta) {
    try { var plan = JSON.parse(localStorage.getItem('agape_plan')); if (state.mode === 'plan' && plan?.type === 'chronological' && typeof FLAT_CHRONO_INDEX !== 'undefined') { var idx = FLAT_CHRONO_INDEX.findIndex(x => x.b === state.book && x.c === state.chapter); if (idx !== -1 && FLAT_CHRONO_INDEX[idx + delta]) { var n = FLAT_CHRONO_INDEX[idx + delta]; state.book = n.b; state.chapter = n.c; loadChapter(); return; } else return; } } catch (e) { }
    var max = BIBLE_BOOKS[state.book].caps, next = state.chapter + delta;
    if (next > max) { if (state.book < 65) { state.book++; next = 1; } else return; } else if (next < 1) { if (state.book > 0) { state.book--; next = BIBLE_BOOKS[state.book].caps; } else return; }
    state.chapter = next; loadChapter();
};

window.updateChaptersSelect = function (load) {
    var sel = document.getElementById('read-chapter'); sel.innerHTML = '';
    for (var i = 1; i <= BIBLE_BOOKS[state.book].caps; i++) sel.add(new Option(i, i));
    if (state.chapter > BIBLE_BOOKS[state.book].caps) state.chapter = 1; sel.value = state.chapter; if (load) loadChapter();
};

window.populateSelectElements = function () {
    var t = document.getElementById('read-translation'); if (t) { t.innerHTML = TRANSLATIONS.map(x => `<option value="${x}">${x}</option>`).join(''); t.value = state.translation; }
    var pt = document.getElementById('plan-translation'); if (pt) { pt.innerHTML = TRANSLATIONS.map(x => `<option value="${x}">${x}</option>`).join(''); pt.value = 'NVI'; }
    var b = document.getElementById('read-book'); if (b) { b.innerHTML = BIBLE_BOOKS.map((x, i) => `<option value="${i}">${x.name}</option>`).join(''); b.value = state.book; updateChaptersSelect(false); }
};

// --- 6. PLANOS DE LEITURA ---

function getPlanDataForDay(day, dur, type) {
    if (typeof FLAT_BIBLE_INDEX === 'undefined') return null;
    var src = type === 'chronological' ? FLAT_CHRONO_INDEX : FLAT_BIBLE_INDEX, cpd = src.length / dur;
    var start = Math.floor((day - 1) * cpd), end = Math.min(Math.floor(day * cpd) - 1, src.length - 1);
    if (start >= src.length) return null;
    var chunks = [], curr = null;
    for (var i = start; i <= end; i++) {
        var it = src[i], nm = BIBLE_BOOKS[it.b].name;
        if (!curr) curr = { name: nm, start: it.c, end: it.c };
        else if (curr.name === nm && it.c === curr.end + 1) curr.end = it.c;
        else { chunks.push(curr); curr = { name: nm, start: it.c, end: it.c }; }
    }
    if (curr) chunks.push(curr);
    return { rangeText: chunks.map(c => c.start === c.end ? `${c.name} ${c.start}` : `${c.name} ${c.start}-${c.end}`).join('; '), start: src[start] };
}

window.renderPlanOverview = function () {
    var conf = JSON.parse(localStorage.getItem('agape_plan')), cont = document.getElementById('plan-overview-list');
    if (!conf?.active) { cont.innerHTML = '<div class="text-center p-10"><p class="text-gray-500 mb-4">Nenhum plano ativo.</p><button onclick="openPlanSetup()" class="bg-accent-600 text-white px-6 py-2 rounded-lg font-bold">Criar Plano</button></div>'; return; }
    var total = parseInt(conf.duration), pct = Math.round((planProgress.length / total) * 100);
    document.getElementById('plan-progress-bar').style.width = pct + '%'; document.getElementById('plan-progress-text').innerText = pct + '% Concluído';
    cont.innerHTML = Array.from({ length: total }, (_, i) => i + 1).map(i => {
        var done = planProgress.includes(i), data = getPlanDataForDay(i, total, conf.type); if (!data) return '';
        var cls = done ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/10' : 'border-bible-200 dark:border-bible-700';
        var txt = done ? 'line-through opacity-70 text-accent-700' : 'text-bible-800 dark:text-bible-200';
        return `<div class="bg-white dark:bg-bible-800 p-4 rounded-xl border ${cls} flex items-center justify-between shadow-sm transition"><div class="flex-1 cursor-pointer" onclick="openPlanDayReading(${data.start.b},${data.start.c})"><div class="flex items-center gap-2 mb-1"><p class="text-xs font-bold text-bible-400 uppercase">Dia ${i}</p></div><h4 class="font-bold text-lg ${txt}">${data.rangeText}</h4></div><button onclick="togglePlanDay(${i})" class="p-3 rounded-full transition ${done ? 'bg-accent-600 text-white' : 'bg-bible-100 dark:bg-bible-700 text-bible-400'}"><i class="ph-bold ${done ? 'ph-check' : 'ph-circle'} text-xl"></i></button></div>`;
    }).join('');
};

window.togglePlanDay = function (day) { var i = planProgress.indexOf(day); if (i === -1) planProgress.push(day); else planProgress.splice(i, 1); localStorage.setItem('agape_plan_progress', JSON.stringify(planProgress)); renderPlanOverview(); };
window.openPlanDayReading = function (b, c) { state.book = b; state.chapter = c; state.mode = 'plan'; showScreen('screen-read'); };
window.deleteCurrentPlan = function () { if (confirm("Excluir plano?")) { localStorage.removeItem('agape_plan'); localStorage.removeItem('agape_plan_progress'); planProgress = []; document.getElementById('active-plan-card').classList.add('hidden'); goBack(); } };
window.startNewPlan = function () {
    var type = document.querySelector('input[name="plan_order"]:checked').value, dur = document.getElementById('plan-duration').value, trans = document.getElementById('plan-translation').value;
    localStorage.setItem('agape_plan', JSON.stringify({ active: true, start: new Date(), type: type, duration: dur }));
    planProgress = []; localStorage.setItem('agape_plan_progress', '[]'); state.translation = trans; localStorage.setItem('agape_version', trans);
    closeModal('modal-plan'); document.getElementById('active-plan-card').classList.remove('hidden'); showScreen('screen-plan-overview');
};

// --- 7. HINÁRIOS ---

window.changeHymnbook = async function () {
    var s = document.getElementById('hymnbook-select'); if (s) state.hymnbook = s.value;
    var c = document.getElementById('harpa-list'); c.innerHTML = '<div class="p-10 opacity-50 text-center">Carregando...</div>';
    if (!hymnCache[state.hymnbook]) { try { var f = state.hymnbook === 'harpa' ? 'harpa.json' : (state.hymnbook === 'cantor' ? 'cantor_cristao.json' : 'novo_cantico_completo.json'); var r = await fetch('./' + f); hymnCache[state.hymnbook] = normalizeHymnData(await r.json(), state.hymnbook); } catch (e) { c.innerHTML = 'Erro.'; return; } }
    currentHymnList = hymnCache[state.hymnbook]; renderHymnList(currentHymnList);
};

function normalizeHymnData(d, t) { var l = []; if (t === 'harpa') Object.keys(d).forEach(k => { if (d[k].hino) l.push({ id: k, title: d[k].hino, fullText: d[k].verses ? Object.values(d[k].verses).join('\n\n') : '', chorus: d[k].coro }); }); else if (t === 'cantor') (Array.isArray(d) ? d : Object.values(d)).forEach(h => l.push({ id: h.id, title: h.id + ' - ' + (h.title || ''), fullText: h.lyrics || h.hino })); else (Array.isArray(d) ? d : (d.hinos || [])).forEach(h => l.push({ id: h.numero, title: h.numero + ' - ' + h.titulo, fullText: h.letra })); return l; }
function renderHymnList(l) { document.getElementById('harpa-list').innerHTML = l.slice(0, 100).map(h => `<div onclick="openHymn('${h.id}')" class="bg-white dark:bg-bible-800 p-4 rounded-xl border border-bible-200 dark:border-bible-700 cursor-pointer flex items-center gap-3 hover:border-accent-600 transition shadow-sm"><span class="w-10 h-10 rounded-full bg-bible-50 text-bible-600 font-bold flex items-center justify-center text-sm shrink-0">${h.id}</span><span class="truncate font-medium flex-1">${h.title.replace(/^\d+\s*-\s*/, '')}</span></div>`).join(''); }
window.openHymn = function (id) {
    var h = currentHymnList.find(x => x.id.toString() === id.toString()); if (!h) return;
    document.getElementById('hymn-title').innerText = h.title;
    var html = h.fullText ? h.fullText.split(/\n\n/).map(p => { var c = p.toLowerCase().includes('[coro]') || p.toLowerCase().includes('coro:'); return `<div class="${c ? 'hymn-chorus' : 'mb-8 leading-loose'}">${p.replace(/\[coro\]/gi, '').replace(/coro:/gi, '').trim().replace(/\n/g, '<br>')}</div>`; }).join('') : `<div class="hymn-chorus">${h.chorus}</div>`;
    document.getElementById('hymn-content').innerHTML = html; showScreen('screen-hymn');
};
window.filterHarpa = function () { var t = document.getElementById('harpa-search').value.toLowerCase(); renderHymnList(currentHymnList.filter(h => h.title.toLowerCase().includes(t) || h.id.toString() === t)); };

// --- 8. QUIZ (GAMIFICADO) ---

window.loadQuizData = async function () { try { var r = await fetch('./quiz.json'); if (r.ok) quizData = await r.json(); } catch (e) { } document.getElementById('quiz-points').innerText = quizTotalPoints; };
window.startQuizSession = function () { quizSession = { active: true, currentLevel: 'facil', streak: 0, score: 0, history: [] }; renderQuizQuestion(); };
window.renderQuizQuestion = function () {
    var c = document.getElementById('quiz-container'), pool = quizData.filter(q => q.nivel === quizSession.currentLevel && !quizSession.history.includes(q.id));
    if (!pool.length) pool = quizData.filter(q => !quizSession.history.includes(q.id));
    if (!pool.length) { c.innerHTML = '<div class="text-center p-8 animate-pop"><h3 class="font-bold text-2xl mb-2">Quiz Concluído!</h3><button onclick="startQuizSession()" class="bg-accent-600 text-white px-6 py-3 rounded-xl font-bold mt-4 shadow-lg">Reiniciar</button></div>'; return; }
    var q = pool[Math.floor(Math.random() * pool.length)];
    c.innerHTML = `<div class="bg-white dark:bg-bible-800 p-6 rounded-3xl shadow-lg border border-bible-200 dark:border-bible-700 animate-slide-up"><div class="flex justify-between items-center mb-4"><span class="bg-bible-100 dark:bg-bible-900/30 text-bible-700 dark:text-bible-300 text-xs font-bold px-3 py-1 rounded-full uppercase">${quizSession.currentLevel}</span>${quizSession.streak > 1 ? `<span class="text-xs font-bold text-orange-500 animate-pulse">🔥 x${quizSession.streak}</span>` : ''}</div><h3 class="text-xl font-bold my-6 leading-relaxed">${q.pergunta}</h3><div class="space-y-3">${q.opcoes.map((op, i) => `<button onclick="handleQuizAnswer(${q.id},${i},this)" class="w-full text-left p-4 rounded-xl bg-bible-50 dark:bg-bible-700 hover:bg-bible-100 dark:hover:bg-bible-600 transition font-medium flex gap-3 group"><div class="w-8 h-8 rounded-full bg-white dark:bg-bible-600 flex items-center justify-center font-bold text-sm text-bible-500 shadow-sm">${['A', 'B', 'C', 'D'][i]}</div><span class="flex-1">${op}</span></button>`).join('')}</div></div>`;
};
window.handleQuizAnswer = function (qid, idx, btn) {
    document.querySelectorAll('#quiz-container button').forEach(b => { b.disabled = true; b.style.opacity = '0.7'; });
    var q = quizData.find(x => x.id === qid); btn.style.opacity = '1'; btn.classList.remove('bg-bible-50', 'dark:bg-bible-700');
    if (idx === q.correta) {
        btn.classList.add('animate-pop', 'bg-green-100', 'border-green-500', 'text-green-800'); triggerConfetti();
        quizTotalPoints += 10 + (quizSession.streak * 2); quizSession.streak++;
        document.getElementById('quiz-points').innerText = quizTotalPoints; localStorage.setItem('agape_quiz_points', quizTotalPoints); quizSession.history.push(qid);
        if (quizSession.streak >= 3 && quizSession.currentLevel === 'facil') quizSession.currentLevel = 'medio'; else if (quizSession.streak >= 5 && quizSession.currentLevel === 'medio') quizSession.currentLevel = 'dificil';
        setTimeout(renderQuizQuestion, 1500);
    } else {
        btn.classList.add('animate-shake', 'bg-red-100', 'border-red-500', 'text-red-800'); if (navigator.vibrate) navigator.vibrate(300); quizSession.streak = 0;
        setTimeout(() => { alert(`Resposta: ${q.opcoes[q.correta]}`); quizSession.history.push(qid); renderQuizQuestion(); }, 1000);
    }
};
function triggerConfetti() { for (let i = 0; i < 30; i++) { const c = document.createElement('div'); c.classList.add('confetti'); c.style.left = Math.random() * 100 + 'vw'; c.style.top = '-10px'; c.style.backgroundColor = ['#f59e0b', '#ffffff', '#22c55e'][Math.floor(Math.random() * 3)]; c.style.animationDuration = (Math.random() * 2 + 1) + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 3000); } }

// --- 9. ESTÚDIO PRO (CANVAS) ---

window.openImageCreator = function () { openImageCreatorWithText(document.getElementById('daily-text').innerText, document.getElementById('daily-reference').innerText); };
window.openImageCreatorFromVerse = function () { closeModal('modal-verse'); openImageCreatorWithText(selectedVerse.text, selectedVerse.ref); };
window.openImageCreatorWithText = function (t, r) { currentVerseText = t.replace(/"/g, ''); currentVerseRef = r; document.getElementById('modal-image-creator').classList.remove('hidden'); document.getElementById('modal-image-creator').classList.add('flex'); setTimeout(drawCanvas, 100); };
window.changeTheme = function (id) { currentThemeId = id; drawCanvas(); };
function drawCanvas() {
    var cv = document.getElementById('image-editor-canvas'); if (!cv) return; var ctx = cv.getContext('2d'), th = THEMES[currentThemeId];
    cv.width = 1080; cv.height = 1920;
    var gr = ctx.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, th.bgStart); gr.addColorStop(1, th.bgEnd); ctx.fillStyle = gr; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = th.watermark; ctx.font = "bold 600px " + th.fontMain; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("”", cv.width / 2, cv.height / 2 - 100);
    ctx.fillStyle = th.text; ctx.textAlign = "center";
    var fs = currentVerseText.length > 300 ? 50 : (currentVerseText.length > 150 ? 60 : 80); ctx.font = `italic ${fs}px ${th.fontMain}`;
    var w = currentVerseText.split(' '), l = '', ls = [], mw = cv.width - 200, lh = fs * 1.5;
    w.forEach(word => { var test = l + word + ' '; if (ctx.measureText(test).width > mw) { ls.push(l); l = word + ' '; } else l = test; }); ls.push(l);
    var sy = (cv.height - (ls.length * lh)) / 2;
    ls.forEach((line, i) => ctx.fillText(line, cv.width / 2, sy + (i * lh)));
    var ry = sy + (ls.length * lh) + 60; ctx.fillStyle = th.accent; ctx.font = `bold 40px ${th.fontSec}`; ctx.fillText(currentVerseRef.toUpperCase(), cv.width / 2, ry);
    ctx.beginPath(); ctx.moveTo(cv.width / 2 - 50, ry + 50); ctx.lineTo(cv.width / 2 + 50, ry + 50); ctx.strokeStyle = th.accent; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = th.text; ctx.globalAlpha = 0.6; ctx.font = `30px ${th.fontSec}`; ctx.fillText("BÍBLIA ÁGAPE • LEIAABIBLIA.APP", cv.width / 2, cv.height - 120); ctx.globalAlpha = 1.0;
}
window.shareCreatedImage = function () { document.getElementById('image-editor-canvas').toBlob(async b => { var f = new File([b], 'story.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); else downloadCreatedImage(); }); };
window.downloadCreatedImage = function () { var a = document.createElement('a'); a.download = `agape-${Date.now()}.png`; a.href = document.getElementById('image-editor-canvas').toDataURL(); a.click(); };

// --- 10. FUNCIONALIDADES ESPECIAIS (BÚSSOLA, PÚLPITO, NOTAS) ---

window.renderCompass = function () {
    var c = document.getElementById('compass-container'), seen = new Set(), cats = [];
    if (!c) return;
    EMOTION_DATA.forEach(i => { if (!seen.has(i.label)) { seen.add(i.label); cats.push(i); } });
    c.innerHTML = cats.map(cat => `<button onclick="handleEmotionClick('${cat.label}')" class="flex flex-col items-center gap-2 min-w-[80px] group"><div class="w-14 h-14 rounded-2xl bg-white dark:bg-bible-800 border border-bible-200 dark:border-bible-700 flex items-center justify-center text-2xl text-accent-600 shadow-sm group-hover:scale-110 transition duration-300"><i class="ph-fill ${cat.icon}"></i></div><span class="text-[10px] font-bold uppercase tracking-wider text-bible-500 dark:text-bible-400 group-hover:text-bible-900 dark:group-hover:text-white">${cat.label}</span></button>`).join('');
};

window.handleEmotionClick = function (l) {
    var ops = EMOTION_DATA.filter(e => e.label === l);
    if (ops.length) { var r = ops[Math.floor(Math.random() * ops.length)]; if (navigator.vibrate) navigator.vibrate(50); goToVerse(r.book, r.chap, r.verse); }
};

window.togglePulpitMode = function () {
    state.pulpitMode = !state.pulpitMode;
    var h = document.getElementById('read-header'), n = document.getElementById('reading-nav-bar'), x = document.getElementById('btn-exit-pulpit');
    if (state.pulpitMode) { h?.classList.add('-translate-y-full'); n?.classList.add('translate-y-full'); x?.classList.remove('hidden'); changeFontSize(4); }
    else { h?.classList.remove('-translate-y-full'); n?.classList.remove('translate-y-full'); x?.classList.add('hidden'); changeFontSize(-4); }
};

window.openNoteEditor = function () { closeModal('modal-verse'); document.getElementById('modal-note').classList.remove('hidden'); document.getElementById('modal-note').classList.add('flex'); document.getElementById('note-input').value = savedNotes[selectedVerse.id] || ""; document.getElementById('note-input').focus(); };
window.saveNote = function () { var t = document.getElementById('note-input').value.trim(); if (t) savedNotes[selectedVerse.id] = t; else delete savedNotes[selectedVerse.id]; localStorage.setItem('agape_notes', JSON.stringify(savedNotes)); loadChapter(); closeModal('modal-note'); alert("Salvo!"); };
window.deleteNote = function () { if (confirm("Apagar nota?")) { delete savedNotes[selectedVerse.id]; localStorage.setItem('agape_notes', JSON.stringify(savedNotes)); loadChapter(); closeModal('modal-note'); } };

// --- 11. UTILITÁRIOS GERAIS ---

window.setupSwipeGestures = function () { var el = document.getElementById('main-content'); if (el) { el.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true }); el.addEventListener('touchend', e => { if (touchStartX - e.changedTouches[0].screenX < -80) goBack(); }, { passive: true }); } };
window.checkActivePlan = function () { if (localStorage.getItem('agape_plan')) document.getElementById('active-plan-card').classList.remove('hidden'); };
window.escapeHtml = function (t) { return t.replace(/"/g, "&quot;").replace(/'/g, "&#039;"); };
window.updateStreakDisplay = function () { document.getElementById('streak-count-header').innerText = streakData.count; };
window.searchBible = function () { showScreen('screen-search'); setTimeout(() => document.getElementById('search-input').focus(), 300); };
window.setupSearchInput = function () { document.getElementById('btn-search-action').onclick = performSearch; document.getElementById('search-input').addEventListener('keyup', e => { if (e.key === 'Enter') performSearch(); }); };
async function performSearch() {
    var q = document.getElementById('search-input').value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if (q.length < 3) return;
    document.getElementById('search-results').innerHTML = '<div class="p-10 text-center animate-pulse">Buscando...</div>';
    setTimeout(async () => {
        if (!bibleCache[state.translation]) bibleCache[state.translation] = await (await fetch('./' + state.translation + '.json')).json();
        var bib = bibleCache[state.translation], res = [], c = 0;
        for (var b = 0; b < bib.length; b++) { for (var ch = 0; ch < bib[b].chapters.length; ch++) { for (var v = 0; v < bib[b].chapters[ch].length; v++) { if (bib[b].chapters[ch][v].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(q)) { res.push({ b: b, c: ch + 1, v: v + 1, t: bib[b].chapters[ch][v], r: `${BIBLE_BOOKS[b].name} ${ch + 1}:${v + 1}` }); if (++c >= 50) break; } } if (c >= 50) break; } if (c >= 50) break; }
        document.getElementById('search-results').innerHTML = res.length ? res.map(r => `<div onclick="goToVerse(${r.b},${r.c},${r.v})" class="bg-white dark:bg-bible-800 p-4 rounded-xl border border-bible-200 dark:border-bible-700 cursor-pointer hover:border-accent-600 transition shadow-sm"><p class="font-bold text-accent-600 text-sm mb-1">${r.r}</p><p class="text-sm line-clamp-2 text-bible-700 dark:text-bible-300">${r.t}</p></div>`).join('') : '<div class="p-10 text-center">Nada encontrado.</div>';
    }, 100);
}
window.goToVerse = function (b, c, v) { state.book = b; state.chapter = c; showScreen('screen-read'); setTimeout(() => { var el = document.getElementById('v-' + v); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('highlight-yellow'); setTimeout(() => el.classList.remove('highlight-yellow'), 2000); } }, 600); };
window.setupInstallPrompt = function () { window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; document.getElementById('install-container').classList.remove('hidden'); document.getElementById('btn-install').onclick = () => deferredPrompt.prompt(); }); };
window.hardReset = function () { if (confirm("Apagar tudo?")) { localStorage.clear(); location.reload(); } };
window.loadHighlightsList = function () { var k = Object.keys(savedMarks); document.getElementById('highlights-container').innerHTML = k.length ? k.map(x => { var p = x.split('-'); return `<div onclick="goToVerse(${p[0]},${p[1]},${p[2]})" class="bg-white dark:bg-bible-800 p-4 rounded-xl border-l-4 border-accent-500 cursor-pointer shadow-sm hover:bg-bible-50 transition"><p class="font-bold text-bible-800 dark:text-bible-200">${BIBLE_BOOKS[p[0]].name} ${p[1]}:${p[2]}</p></div>`; }).join('') : '<div class="p-10 text-center">Vazio.</div>'; };
window.shareApp = function () { navigator.share ? navigator.share({ title: "Ágape", url: location.href }) : alert("Use o navegador."); };
window.actionVerse = function (a) { if (a === 'copy') { navigator.clipboard.writeText(`"${selectedVerse.text}" - ${selectedVerse.ref}`); closeModal('modal-verse'); alert("Copiado!"); } };
window.loadDailyVerse = function () { if (typeof DAILY_VERSES_POOL !== 'undefined') { var v = DAILY_VERSES_POOL[new Date().getDate() % DAILY_VERSES_POOL.length]; document.getElementById('daily-text').innerText = `"${v.text}"`; document.getElementById('daily-reference').innerText = v.ref; } };
window.handleVerseClick = function (id, t, r) { selectedVerse = { id, text: t, ref: r }; document.getElementById('modal-verse').classList.remove('hidden'); document.getElementById('modal-verse').classList.add('flex'); };
window.markVerse = function (c) { if (c === 'remove') delete savedMarks[selectedVerse.id]; else savedMarks[selectedVerse.id] = c; localStorage.setItem('agape_marks_v2', JSON.stringify(savedMarks)); loadChapter(); closeModal('modal-verse'); };
window.closeModal = function (id) { var el = document.getElementById(id); el.classList.add('hidden'); el.classList.remove('flex'); };
window.openPlanSetup = function () { document.getElementById('modal-plan').classList.remove('hidden'); document.getElementById('modal-plan').classList.add('flex'); };
window.openFeedbackModal = function () { document.getElementById('modal-feedback').classList.remove('hidden'); document.getElementById('modal-feedback').classList.add('flex'); };
window.sendFeedbackToEmail = function () { var e = document.getElementById('feedback-email').value, m = document.getElementById('feedback-text').value; if (!e || !m) return alert("Preencha tudo."); fetch('https://formsubmit.co/agapeconnect75@gmail.com', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, message: m }) }).then(r => { if (r.ok) { alert("Enviado!"); closeModal('modal-feedback'); } }); };
window.exportData = function () { var a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ meta: { app: "Ágape", v: "2.6.2" }, data: { ...localStorage } })); a.download = `backup-${Date.now()}.json`; a.click(); };
window.triggerImport = function () { document.getElementById('import-file').click(); };
window.handleImportFile = function (e) { var r = new FileReader(); r.onload = ev => { try { var d = JSON.parse(ev.target.result).data; if (confirm("Restaurar?")) { Object.keys(d).forEach(k => localStorage.setItem(k, d[k])); location.reload(); } } catch (e) { alert("Erro."); } }; if (e.target.files[0]) r.readAsText(e.target.files[0]); };
window.toggleTheme = function () { state.theme = state.theme === 'light' ? 'dark' : 'light'; applyTheme(state.theme); localStorage.setItem('agape_theme', state.theme); };
function applyTheme(t) { var m = document.querySelector('meta[name="theme-color"]'); if (t === 'dark') { document.documentElement.classList.add('dark'); if (m) m.setAttribute('content', '#1c1917'); } else { document.documentElement.classList.remove('dark'); if (m) m.setAttribute('content', '#fafaf9'); } }
window.changeFontSize = function (d) { state.fontSize = Math.max(14, Math.min(40, state.fontSize + d)); localStorage.setItem('agape_font', state.fontSize); document.querySelectorAll('.verse-content').forEach(p => p.style.fontSize = state.fontSize + 'px'); };
window.openDailyVerseReading = function () { var txt = document.getElementById('daily-reference').innerText.trim(); if (!txt || txt === "...") return; var idx = txt.lastIndexOf(' '), book = txt.substring(0, idx).trim(), nums = txt.substring(idx + 1).trim().split(':'); var bid = BIBLE_BOOKS.findIndex(b => b.name.toLowerCase() === book.toLowerCase()); if (bid !== -1) { goToVerse(bid, parseInt(nums[0]), parseInt(nums[1])); if (navigator.vibrate) navigator.vibrate(50); } else showScreen('screen-read'); };