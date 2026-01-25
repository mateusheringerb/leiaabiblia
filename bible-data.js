/*
 * Copyright (c) 2026 Bíblia Ágape
 * Versão: V2.1.5
 * Data: 22/01/2026
 * Autor: Mateus Heringer
 * * Descrição:
 * Dados de Livros, Ordem e Versículos (NVI)
 */


/**
 * DADOS ESTRUTURAIS DA BÍBLIA
 * Contém informações sobre livros, capítulos e a Bússola da Alma.
 */

const BIBLE_BOOKS = [
    { name: "Gênesis", caps: 50 }, { name: "Êxodo", caps: 40 }, { name: "Levítico", caps: 27 },
    { name: "Números", caps: 36 }, { name: "Deuteronômio", caps: 34 }, { name: "Josué", caps: 24 },
    { name: "Juízes", caps: 21 }, { name: "Rute", caps: 4 }, { name: "1 Samuel", caps: 31 },
    { name: "2 Samuel", caps: 24 }, { name: "1 Reis", caps: 22 }, { name: "2 Reis", caps: 25 },
    { name: "1 Crônicas", caps: 29 }, { name: "2 Crônicas", caps: 36 }, { name: "Esdras", caps: 10 },
    { name: "Neemias", caps: 13 }, { name: "Ester", caps: 10 }, { name: "Jó", caps: 42 },
    { name: "Salmos", caps: 150 }, { name: "Provérbios", caps: 31 }, { name: "Eclesiastes", caps: 12 },
    { name: "Cantares", caps: 8 }, { name: "Isaías", caps: 66 }, { name: "Jeremias", caps: 52 },
    { name: "Lamentações", caps: 5 }, { name: "Ezequiel", caps: 48 }, { name: "Daniel", caps: 12 },
    { name: "Oseias", caps: 14 }, { name: "Joel", caps: 3 }, { name: "Amós", caps: 9 },
    { name: "Obadias", caps: 1 }, { name: "Jonas", caps: 4 }, { name: "Miqueias", caps: 7 },
    { name: "Naum", caps: 3 }, { name: "Habacuque", caps: 3 }, { name: "Sofonias", caps: 3 },
    { name: "Ageu", caps: 2 }, { name: "Zacarias", caps: 14 }, { name: "Malaquias", caps: 4 },
    { name: "Mateus", caps: 28 }, { name: "Marcos", caps: 16 }, { name: "Lucas", caps: 24 },
    { name: "João", caps: 21 }, { name: "Atos", caps: 28 }, { name: "Romanos", caps: 16 },
    { name: "1 Coríntios", caps: 16 }, { name: "2 Coríntios", caps: 13 }, { name: "Gálatas", caps: 6 },
    { name: "Efésios", caps: 6 }, { name: "Filipenses", caps: 4 }, { name: "Colossenses", caps: 4 },
    { name: "1 Tessalonicenses", caps: 5 }, { name: "2 Tessalonicenses", caps: 3 }, { name: "1 Timóteo", caps: 6 },
    { name: "2 Timóteo", caps: 4 }, { name: "Tito", caps: 3 }, { name: "Filemom", caps: 1 },
    { name: "Hebreus", caps: 13 }, { name: "Tiago", caps: 5 }, { name: "1 Pedro", caps: 5 },
    { name: "2 Pedro", caps: 3 }, { name: "1 João", caps: 5 }, { name: "2 João", caps: 1 },
    { name: "3 João", caps: 1 }, { name: "Judas", caps: 1 }, { name: "Apocalipse", caps: 22 }
];

// LISTA DE VERSÍCULOS DIÁRIOS (TEXTO NVI COMPLETO)
const DAILY_VERSES_POOL = [
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "O Senhor é o meu pastor; de nada terei falta.", ref: "Salmos 23:1" },
    { text: "Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna.", ref: "João 3:16" },
    { text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.", ref: "Mateus 6:33" },
    { text: "Mil poderão cair ao seu lado; dez mil, à sua direita, mas nada o atingirá.", ref: "Salmos 91:7" },
    { text: "O Senhor é a minha luz e a minha salvação; de quem terei temor? O Senhor é o meu forte refúgio; de quem terei medo?", ref: "Salmos 27:1" },
    { text: "Espere no Senhor. Seja forte! Coragem! Espere no Senhor.", ref: "Salmos 27:14" },
    { text: "Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.", ref: "Isaías 41:10" },
    { text: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu lhes darei descanso.", ref: "Mateus 11:28" },
    { text: "Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.", ref: "Salmos 46:1" },
    { text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento;", ref: "Provérbios 3:5" },
    { text: "Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.", ref: "Isaías 40:31" },
    { text: "Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.", ref: "Josué 1:9" },
    { text: "Porque sou eu que conheço os planos que tenho para vocês', diz o Senhor, 'planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.", ref: "Jeremias 29:11" },
    { text: "Alegrem-se sempre no Senhor. Novamente direi: alegrem-se!", ref: "Filipenses 4:4" },
    { text: "A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho.", ref: "Salmos 119:105" },
    { text: "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.", ref: "Romanos 8:28" },
    { text: "Que diremos, pois, diante dessas coisas? Se Deus é por nós, quem será contra nós?", ref: "Romanos 8:31" },
    { text: "O amigo ama em todos os momentos; é um irmão na adversidade.", ref: "Provérbios 17:17" },
    { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", ref: "1 Coríntios 13:4" },
    { text: "Pois vocês são salvos pela graça, por meio da fé, e isto não vem de vocês, é dom de Deus.", ref: "Efésios 2:8" },
    { text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.", ref: "1 Pedro 5:7" },
    { text: "A alegria do coração transparece no rosto, mas o coração angustiado oprime o espírito.", ref: "Provérbios 15:13" },
    { text: "Deleite-se no Senhor, e ele atenderá aos desejos do seu coração.", ref: "Salmos 37:4" },
    { text: "Clame a mim e eu responderei e lhe direi coisas grandiosas e insondáveis que você não conhece.", ref: "Jeremias 33:3" },
    { text: "O Senhor o abençoe e o guarde;", ref: "Números 6:24" },
    { text: "Mesmo quando eu andar por um vale de trevas e morte, não temerei perigo algum, pois tu estás comigo; a tua vara e o teu cajado me protegem.", ref: "Salmos 23:4" },
    { text: "Pois nada é impossível para Deus.", ref: "Lucas 1:37" },
    { text: "E a paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.", ref: "Filipenses 4:7" },
    { text: "Combati o bom combate, terminei a corrida, guardei a fé.", ref: "2 Timóteo 4:7" },
    { text: "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados por causa delas, pois o Senhor, o seu Deus, vai com vocês; nunca os deixará, nunca os abandonará.", ref: "Deuteronômio 31:6" },
    { text: "O Senhor lutará por vocês; tão somente acalmem-se.", ref: "Êxodo 14:14" },
    { text: "Levanto os meus olhos para os montes e pergunto: De onde me vem o socorro? O meu socorro vem do Senhor, que fez os céus e a terra.", ref: "Salmos 121:1-2" },
    { text: "Acima de tudo, guarde o seu coração, pois dele depende toda a sua vida.", ref: "Provérbios 4:23" },
    { text: "A resposta calma desvia a fúria, mas a palavra ríspida desperta a ira.", ref: "Provérbios 15:1" },
    { text: "Vistam toda a armadura de Deus, para poderem ficar firmes contra as ciladas do diabo.", ref: "Efésios 6:11" },
    { text: "Jesus Cristo é o mesmo, ontem, hoje e para sempre.", ref: "Hebreus 13:8" },
    { text: "Aquele que habita no abrigo do Altíssimo e descansa à sombra do Todo-poderoso pode dizer ao Senhor: Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio.", ref: "Salmos 91:1-2" },
    { text: "Deem graças ao Senhor, porque ele é bom. O seu amor dura para sempre!", ref: "Salmos 136:1" },
    { text: "Respondeu Jesus: 'Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai, a não ser por mim'.", ref: "João 14:6" },
    { text: "Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta lhes será aberta.", ref: "Mateus 7:7" },
    { text: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens,", ref: "Colossenses 3:23" },
    { text: "Bem-aventurados os pacificadores, pois serão chamados filhos de Deus.", ref: "Mateus 5:9" },
    { text: "O temor do Senhor é o princípio da sabedoria, e o conhecimento do Santo é entendimento.", ref: "Provérbios 9:10" },
    { text: "Não se perturbe o coração de vocês. Creiam em Deus; creiam também em mim.", ref: "João 14:1" },
    { text: "Pois o meu jugo é suave e o meu fardo é leve.", ref: "Mateus 11:30" },
    { text: "Graças ao grande amor do Senhor é que não somos consumidos, pois as suas misericórdias são inesgotáveis.", ref: "Lamentações 3:22" },
    { text: "Sim, coisas grandiosas fez o Senhor por nós, por isso estamos alegres.", ref: "Salmos 126:3" },
    { text: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.", ref: "Romanos 12:12" },
    { text: "Cresçam, porém, na graça e no conhecimento de nosso Senhor e Salvador Jesus Cristo.", ref: "2 Pedro 3:18" }
];

/**
 * CONFIGURAÇÃO DA ORDEM CRONOLÓGICA DETALHADA
 * Mapeia a sequência histórica exata, permitindo quebra de livros.
 * Formato: { b: ID_DO_LIVRO, start: CAP_INICIAL, end: CAP_FINAL }
 */
const CHRONO_SEQUENCE = [
    { b: 0, start: 1, end: 11 },   // Gênesis 1-11
    { b: 17, start: 1, end: 42 },  // Jó
    { b: 0, start: 12, end: 50 },  // Gênesis 12-50
    { b: 1, start: 1, end: 40 },   // Êxodo
    { b: 2, start: 1, end: 27 },   // Levítico
    { b: 3, start: 1, end: 36 },   // Números
    { b: 4, start: 1, end: 34 },   // Deuteronômio
    { b: 5, start: 1, end: 24 },   // Josué
    { b: 6, start: 1, end: 21 },   // Juízes
    { b: 7, start: 1, end: 4 },    // Rute
    { b: 8, start: 1, end: 31 },   // 1 Samuel
    { b: 9, start: 1, end: 24 },   // 2 Samuel
    { b: 18, start: 1, end: 150 }, // Salmos
    { b: 10, start: 1, end: 4 },   // 1 Reis 1-4
    { b: 19, start: 1, end: 31 },  // Provérbios
    { b: 20, start: 1, end: 12 },  // Eclesiastes
    { b: 21, start: 1, end: 8 },   // Cantares
    { b: 10, start: 5, end: 22 },  // 1 Reis 5-22
    { b: 11, start: 1, end: 14 },  // 2 Reis 1-14
    { b: 28, start: 1, end: 3 },   // Joel
    { b: 31, start: 1, end: 4 },   // Jonas
    { b: 29, start: 1, end: 9 },   // Amós
    { b: 11, start: 15, end: 17 }, // 2 Reis 15-17
    { b: 27, start: 1, end: 14 },  // Oseias
    { b: 11, start: 18, end: 19 }, // 2 Reis 18-19
    { b: 22, start: 1, end: 39 },  // Isaías 1-39
    { b: 11, start: 20, end: 20 }, // 2 Reis 20
    { b: 22, start: 40, end: 66 }, // Isaías 40-66
    { b: 32, start: 1, end: 7 },   // Miqueias
    { b: 33, start: 1, end: 3 },   // Naum
    { b: 35, start: 1, end: 3 },   // Sofonias
    { b: 34, start: 1, end: 3 },   // Habacuque
    { b: 30, start: 1, end: 1 },   // Obadias
    { b: 23, start: 1, end: 39 },  // Jeremias 1-39
    { b: 11, start: 25, end: 25 }, // 2 Reis 25
    { b: 23, start: 40, end: 52 }, // Jeremias 40-52
    { b: 11, start: 25, end: 25 }, // 2 Reis 25 (Repetição Contextual)
    { b: 24, start: 1, end: 5 },   // Lamentações
    { b: 12, start: 1, end: 29 },  // 1 Crônicas
    { b: 13, start: 1, end: 32 },  // 2 Crônicas 1-32
    { b: 13, start: 33, end: 36 }, // 2 Crônicas 33-36
    { b: 11, start: 21, end: 24 }, // 2 Reis 21-24
    { b: 25, start: 1, end: 48 },  // Ezequiel
    { b: 26, start: 1, end: 12 },  // Daniel
    { b: 16, start: 1, end: 10 },  // Ester
    { b: 14, start: 1, end: 4 },   // Esdras 1-4
    { b: 36, start: 1, end: 2 },   // Ageu
    { b: 37, start: 1, end: 14 },  // Zacarias
    { b: 14, start: 5, end: 10 },  // Esdras 5-10
    { b: 15, start: 1, end: 13 },  // Neemias
    { b: 38, start: 1, end: 4 },   // Malaquias
    { b: 39, start: 1, end: 28 },  // Mateus
    { b: 40, start: 1, end: 16 },  // Marcos
    { b: 41, start: 1, end: 24 },  // Lucas
    { b: 42, start: 1, end: 21 },  // João
    { b: 43, start: 1, end: 11 },  // Atos 1-11
    { b: 58, start: 1, end: 5 },   // Tiago
    { b: 43, start: 12, end: 14 }, // Atos 12-14
    { b: 47, start: 1, end: 6 },   // Gálatas
    { b: 43, start: 15, end: 18 }, // Atos 15-18
    { b: 51, start: 1, end: 5 },   // 1 Tessalonicenses
    { b: 52, start: 1, end: 3 },   // 2 Tessalonicenses
    { b: 43, start: 19, end: 19 }, // Atos 19
    { b: 45, start: 1, end: 16 },  // 1 Coríntios
    { b: 43, start: 20, end: 20 }, // Atos 20
    { b: 46, start: 1, end: 13 },  // 2 Coríntios
    { b: 44, start: 1, end: 16 },  // Romanos
    { b: 43, start: 21, end: 28 }, // Atos 21-28
    { b: 48, start: 1, end: 6 },   // Efésios
    { b: 49, start: 1, end: 4 },   // Filipenses
    { b: 50, start: 1, end: 4 },   // Colossenses
    { b: 57, start: 1, end: 13 },  // Hebreus
    { b: 56, start: 1, end: 1 },   // Filemom
    { b: 59, start: 1, end: 5 },   // 1 Pedro
    { b: 60, start: 1, end: 3 },   // 2 Pedro
    { b: 53, start: 1, end: 6 },   // 1 Timóteo
    { b: 55, start: 1, end: 3 },   // Tito
    { b: 54, start: 1, end: 4 },   // 2 Timóteo
    { b: 61, start: 1, end: 5 },   // 1 João
    { b: 62, start: 1, end: 1 },   // 2 João
    { b: 63, start: 1, end: 1 },   // 3 João
    { b: 64, start: 1, end: 1 },   // Judas
    { b: 65, start: 1, end: 22 }   // Apocalipse
];

// Gera Índice Bíblico (Padrão)
const FLAT_BIBLE_INDEX = [];
BIBLE_BOOKS.forEach((book, bIndex) => {
    for (let c = 1; c <= book.caps; c++) FLAT_BIBLE_INDEX.push({ b: bIndex, c: c });
});

// Gera Índice Cronológico (Detalhado)
const FLAT_CHRONO_INDEX = [];
CHRONO_SEQUENCE.forEach(item => {
    for (let c = item.start; c <= item.end; c++) {
        FLAT_CHRONO_INDEX.push({ b: item.b, c: c });
    }
});



// BÚSSOLA DA ALMA - DADOS COMPLETOS COM TEXTO E EXPLICAÇÃO
const EMOTION_DATA = [
    // --- ANSIOSO ---
    {
        label: "Ansioso",
        icon: "ph-wind",
        book: 49,
        chap: 4,
        verse: 6,
        text: "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus.",
        help: "A ansiedade tenta prever um futuro que pertence a Deus. Troque a preocupação pela oração. Fale com Ele agora."
    },
    {
        label: "Ansioso",
        icon: "ph-wind",
        book: 59,
        chap: 5,
        verse: 7,
        text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.",
        help: "Você não foi feito para carregar esse peso sozinho. Deus está pedindo para você entregar essa carga a Ele."
    },
    {
        label: "Ansioso",
        icon: "ph-wind",
        book: 39,
        chap: 6,
        verse: 34,
        text: "Portanto, não se preocupem com o amanhã, pois o amanhã trará as suas próprias preocupações. Basta a cada dia o seu próprio mal.",
        help: "Viva o hoje. Deus já está no seu amanhã preparando o caminho. Foque no que você pode fazer agora."
    },

    // --- CANSADO ---
    {
        label: "Cansado",
        icon: "ph-battery-warning",
        book: 39,
        chap: 11,
        verse: 28,
        text: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu lhes darei descanso.",
        help: "O descanso que sua alma precisa não é apenas sono, é a presença de Jesus. Pare um pouco e respire nEle."
    },
    {
        label: "Cansado",
        icon: "ph-battery-warning",
        book: 22,
        chap: 40,
        verse: 31,
        text: "Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.",
        help: "Sua força natural tem limite, mas a força de Deus é inesgotável. Espere nEle e sinta essa renovação."
    },

    // --- TRISTE ---
    {
        label: "Triste",
        icon: "ph-cloud-rain",
        book: 18,
        chap: 34,
        verse: 18,
        text: "O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido.",
        help: "A tristeza pode doer, mas ela atrai a presença de Deus. Ele não está longe; Ele está mais perto do que nunca."
    },
    {
        label: "Triste",
        icon: "ph-cloud-rain",
        book: 65,
        chap: 21,
        verse: 4,
        text: "Ele enxugará dos seus olhos toda lágrima. Não haverá mais morte, nem tristeza, nem choro, nem dor...",
        help: "Essa dor é passageira. Deus tem um futuro onde a alegria será a única realidade. Confie nessa promessa."
    },

    // --- MEDO ---
    {
        label: "Com Medo",
        icon: "ph-shield-warning",
        book: 18,
        chap: 27,
        verse: 1,
        text: "O Senhor é a minha luz e a minha salvação; de quem terei temor? O Senhor é o meu forte refúgio; de quem terei medo?",
        help: "O medo diminui quando percebemos o tamanho do nosso Deus. Com Ele ao seu lado, nada pode te destruir."
    },
    {
        label: "Com Medo",
        icon: "ph-shield-warning",
        book: 22,
        chap: 41,
        verse: 10,
        text: "Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus.",
        help: "Você não está caminhando sozinho no escuro. A mão de Deus está segurando a sua agora mesmo."
    },

    // --- GRATO ---
    {
        label: "Grato",
        icon: "ph-heart",
        book: 18,
        chap: 136,
        verse: 1,
        text: "Deem graças ao Senhor, porque ele é bom. O seu amor dura para sempre!",
        help: "A gratidão é a chave que abre novas portas. Reconhecer a bondade de Deus multiplica a alegria."
    },
    {
        label: "Grato",
        icon: "ph-heart",
        book: 51,
        chap: 5,
        verse: 18,
        text: "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.",
        help: "Até nos dias comuns existem milagres escondidos. Agradeça pelo fôlego, pela vida e pela salvação."
    },

    // --- SOZINHO ---
    {
        label: "Sozinho",
        icon: "ph-user",
        book: 39,
        chap: 28,
        verse: 20,
        text: "E eu estarei sempre com vocês, até o fim dos tempos.",
        help: "A solidão é uma mentira. Jesus prometeu estar com você em cada segundo, até o último dia."
    },
    {
        label: "Sozinho",
        icon: "ph-user",
        book: 22,
        chap: 49,
        verse: 15,
        text: "Será que uma mãe pode esquecer do seu bebê? [...] Embora ela possa esquecê-lo, eu não me esquecerei de você!",
        help: "Mesmo que pessoas falhem, o amor de Deus é perfeito e constante. Você é inesquecível para Ele."
    },

    // --- IRRITADO ---
    {
        label: "Irritado",
        icon: "ph-fire",
        book: 58,
        chap: 1,
        verse: 19,
        text: "Todos devem ser prontos para ouvir, tardios para falar e tardios para irar-se.",
        help: "A raiva muitas vezes esconde uma dor ou frustração. Respire fundo. Não deixe a ira controlar suas palavras."
    },
    {
        label: "Irritado",
        icon: "ph-fire",
        book: 19,
        chap: 15,
        verse: 1,
        text: "A resposta calma desvia a fúria, mas a palavra ríspida desperta a ira.",
        help: "Você tem o poder de mudar a atmosfera agora. Escolha a paz em vez de vencer a discussão."
    },

    // --- DÚVIDA ---
    {
        label: "Com Dúvidas",
        icon: "ph-question",
        book: 58,
        chap: 1,
        verse: 5,
        text: "Se algum de vocês tem falta de sabedoria, peça-a a Deus, que a todos dá livremente...",
        help: "Não tenha medo das suas perguntas. Leve-as a Deus. Ele ama dar sabedoria a quem pede com sinceridade."
    },
    {
        label: "Com Dúvidas",
        icon: "ph-question",
        book: 57,
        chap: 11,
        verse: 1,
        text: "Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.",
        help: "A fé não é um sentimento, é uma decisão de confiar em quem Deus é, mesmo quando não entendemos o que Ele faz."
    }
];