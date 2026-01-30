# 🏗 Arquitetura do Sistema

O sistema opera em uma arquitetura **Client-Side** pura, desacoplada de backends dinâmicos para maximizar a segurança, privacidade e performance.

## Fluxo de Dados

```mermaid
graph TD
    A[User Client] -->|Request| B(Service Worker)
    B -->|Cache Hit| C[Local Cache Storage]
    B -->|Cache Miss| D[Static JSON DB]
    D --> E{Render Engine JS}
    E -->|Normalize| F[DOM Injection]
    E -->|Regex Analysis| G[Hymn Parser]
```

## Tech Stack

A escolha tecnológica priorizou a longevidade do código e a redução de dependências externas (`node_modules` zero para runtime).

### 🛠 Tech Stack & Decisões de Arquitetura

| Camada | Tecnologia | Motivação da Escolha |
| :--- | :--- | :--- |
| **Core** | ![JS](https://img.shields.io/badge/-Vanilla%20JS-F7DF1E?logo=javascript&logoColor=black) | Escolhido para eliminar o *overhead* de frameworks (React/Vue), garantindo um bundle inicial < 50KB e performance nativa em dispositivos low-end. |
| **Estilização** | ![Tailwind](https://img.shields.io/badge/-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white) | Permite estilização *utility-first*, facilitando a manutenção e garantindo um CSS final minúsculo através do *purge* de classes não utilizadas. |
| **Dados** | ![JSON](https://img.shields.io/badge/-Static%20JSON-000?logo=json&logoColor=white) | Arquitetura *Serverless* real. Acesso aos dados com complexidade O(1) e zero latência de rede após o cache inicial. |
| **Engenharia** | ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | Utilizado no pipeline ETL (Crawler) pela sua robustez em manipulação de strings e bibliotecas de parsing XML (`xml.etree`). |
| **Imagens** | **Canvas API** | Geração de imagens *client-side* para evitar custos de servidor e garantir privacidade total do usuário. |

## Estrutura de Diretórios

```Bash
/
├── index.html              # Entry point (SPA Shell)
├── app.js                  # Lógica Core (Router, Controller, Renderer)
├── bible-data.js           # Metadados estáticos (Índices)
├── crawler.py              # Script ETL (Data Engineering)
├── sw.js                   # Service Worker (PWA Offline Controller)
├── docs/                   # Documentação Técnica
│   ├── ARCHITECTURE.md
│   ├── DATA_ENGINEERING.md
│   └── GETTING_STARTED.md
└── *.json                  # Bancos de Dados Estáticos (Sharded by Version)
```