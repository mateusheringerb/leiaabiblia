# 🚀 Getting Started

Este projeto é agnóstico de plataforma backend, o que facilita drasticamente o setup e deploy.

## Pré-requisitos

* Qualquer navegador moderno (Chrome, Safari, Edge, Firefox).
* (Opcional) **Python 3** ou **Node.js** para rodar um servidor local.

## Instalação Local

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/mateusheringerb/leiaabiblia.git](https://github.com/mateusheringerb/leiaabiblia.git)
    cd leiaabiblia
    ```

2.  **Inicialize um servidor HTTP local:**
    
    ⚠️ **Importante:** Devido às políticas de segurança de **CORS** (Cross-Origin Resource Sharing) dos navegadores, arquivos JSON locais não podem ser carregados via JavaScript se você apenas abrir o arquivo `index.html` com duplo clique (`file://`). É necessário um servidor HTTP.

    **Opção A: Usando Python (Recomendado)**
    Se você tem Python instalado (Mac/Linux geralmente já têm):
    ```bash
    python3 -m http.server 8000
    ```

    **Opção B: Usando Node.js**
    ```bash
    npx serve .
    ```

    **Opção C: VS Code**
    Instale a extensão "Live Server", clique com o botão direito no `index.html` e selecione "Open with Live Server".

3.  **Acesse:**
    Abra seu navegador em `http://localhost:8000` (ou a porta indicada pelo seu servidor).

## Deploy

O projeto está configurado para deploy automático na **Vercel**. Basta conectar o repositório GitHub e a Vercel detectará automaticamente que é um projeto estático.