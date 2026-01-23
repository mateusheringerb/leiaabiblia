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
```

### 📸 Screenshots
Aqui está uma visão geral das principais funcionalidades do aplicativo:

| **Home / Leitura** | **Modo Noturno (Dark)** | **Quiz Bíblico** |
|:---:|:---:|:---:|
| <img src="https://i.imgur.com/p7ERmA5.png" alt="Home Screen" width="250"/> | <img src="https://i.imgur.com/5XcnjA3.png" alt="Dark Mode" width="250"/> | <img src="https://i.imgur.com/5C3ymk5.png" alt="Quiz" width="250"/> |

| **Plano de Leitura** | **Backup & Restauração** |
|:---:|:---:|
| <img src="https://i.imgur.com/1bi80XO.png" alt="Plano de Leitura" width="250"/> | <img src="https://i.imgur.com/4jw47kx.png" alt="Backup" width="250"/> |

---


### 👨‍💻 Autor
**Mateus Vitor Heringer Barcellos**
<div>Estudante de Análise e Desenvolvimento de Sistemas focado em criar soluções eficientes.</div>

### 📄 Licença
Este projeto está sob a licença MIT - veja o arquivo [LICENSE](./LICENSE) detalhes.
