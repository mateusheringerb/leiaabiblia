# 📖 Bíblia Ágape (Leia a Bíblia)

![Version](https://img.shields.io/badge/version-2.1.5-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> Uma Aplicação Web Progressiva (PWA) completa para leitura bíblica, hinários, planos de estudo e gamificação.

---

## 💻 Sobre o Projeto

O **Bíblia Ágape** (ou *Leia a Bíblia*) é uma aplicação web desenvolvida com foco em **Mobile First** e performance. O objetivo foi criar uma ferramenta robusta de leitura cristã que funcionasse 100% offline, utilizando tecnologias web modernas sem a dependência de frameworks pesados.

O projeto implementa uma arquitetura **SPA (Single Page Application)** "vanilla", onde o roteamento e a renderização de componentes são gerenciados via JavaScript puro, garantindo leveza e controle total sobre o ciclo de vida da aplicação.

### ✨ Funcionalidades Principais

* **📖 Leitura Multiversão:** Suporte a 13 traduções (NVI, ACF, ARA, KJA, etc.) com troca instantânea.
* **📱 PWA (Progressive Web App):** Instalável no celular, funciona offline e gerencia cache via Service Worker.
* **📅 Planos de Leitura:** Gestão completa de planos (Bíblico ou Cronológico) com duração de 3 a 12 meses e barra de progresso.
* **🎶 Hinários Completos:** Harpa Cristã, Cantor Cristão e Novo Cântico (com destaque inteligente para Coros).
* **🎨 Editor de Stories (Canvas):** Ferramenta nativa para criar imagens com versículos, permitindo personalização de fundos e compartilhamento direto.
* **🎮 Gamificação:** Sistema de "Streak" (dias consecutivos), Quiz Bíblico com dificuldade progressiva e pontuação persistente.
* **🔍 Busca Profunda:** Algoritmo de pesquisa otimizado para encontrar versículos em toda a Bíblia.
* **⚙️ Personalização:** Tema Escuro/Claro (Dark Mode), ajuste de tamanho de fonte e sistema de destaques (marca-texto).

---

## 🛠 Tecnologias Utilizadas

O projeto foi construído utilizando a "tríade fundamental" da web, focando em otimização e manipulação direta do DOM.

* **Frontend:**
    * **HTML5** (Semântico e acessível).
    * **CSS3** + **Tailwind CSS** (Via CDN para estilização utilitária rápida).
    * **JavaScript (ES6+)** (Lógica de SPA, State Management local e manipulação de Canvas).
* **Assets & UI:**
    * **Phosphor Icons** (Ícones vetoriais).
    * **Google Fonts** (Inter e Merriweather).
* **Dados & Armazenamento:**
    * **JSON:** Estrutura de dados para livros, versões bíblicas e hinários.
    * **LocalStorage:** Persistência de configurações, progresso de leitura e marcações.
    * **Service Workers:** Cacheamento de assets para funcionamento offline.

---

## 🚀 Como Executar o Projeto

Como o projeto é estático (não depende de um backend Node.js ou PHP), você pode rodá-lo facilmente em qualquer servidor web local.

### Pré-requisitos
* Um editor de código (recomendado: VS Code).
* Extensão **Live Server** (VS Code) ou Python instalado.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/mateusheringerb/leiaabiblia.git](https://github.com/mateusheringerb/leiaabiblia.git)
    cd leiaabiblia
    ```

2.  **Execute a aplicação:**

    * **Opção A (VS Code):** Abra o arquivo `index.html`, clique com o botão direito e selecione "Open with Live Server".
    * **Opção B (Python):**
        ```bash
        python -m http.server 8000
        ```
        Acesse `http://localhost:8000` no navegador.

---

## 📂 Estrutura de Arquivos

```text
leiaabiblia/
├── app.js               # Lógica principal (Router, State, Events)
├── index.html           # Estrutura base da SPA
├── styles.css           # Estilos globais e animações
├── sw.js                # Service Worker (Cache & Offline)
├── bible-data.js        # Metadados dos livros bíblicos
├── [VERSOES].json       # Arquivos JSON das traduções (NVI, ARA, etc.)
├── harpa.json           # Dados dos hinários
├── quiz.json            # Banco de perguntas do Quiz
└── assets/              # Imagens, ícones e favicon
📸 Screenshots(Você pode adicionar prints das telas aqui para valorizar o repositório)Home / LeituraModo NoturnoEditor de Stories<img src="https://www.google.com/search?q=https://via.placeholder.com/200x400%3Ftext%3DHome" alt="Home" width="200"/><img src="https://www.google.com/search?q=https://via.placeholder.com/200x400/1f2937/ffffff%3Ftext%3DDark%2BMode" alt="Dark Mode" width="200"/><img src="https://www.google.com/search?q=https://via.placeholder.com/200x400%3Ftext%3DEditor" alt="Editor" width="200"/>👨‍💻 Autor<div align="center">Mateus Heringer BarcellosEstudante de Análise e Desenvolvimento de Software focado em criar soluções web eficientes.</div>📄 LicençaEste projeto está sob a licença MIT - veja o arquivo LICENSE para detalhes.
### 💡 Dicas Adicionais para o seu Repositório:

1.  **Adicione Screenshots reais:** No espaço onde coloquei os links "placeholder", tire prints do seu app rodando (pode ser no celular ou usando a inspeção do navegador em modo mobile) e suba numa pasta `screenshots` no GitHub. Isso aumenta muito a visibilidade.
2.  **Deploy:** Como o app é estático, recomendo fortemente ativar o **GitHub Pages** nas configurações do repositório. Assim, você terá um link `mateusheringerb.github.io/leiaabiblia` para colocar no seu LinkedIn e currículo.