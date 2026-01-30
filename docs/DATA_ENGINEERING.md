# 🧬 Data Engineering (ETL Pipeline)

Um dos desafios críticos do projeto foi garantir a integridade dos dados dos hinários, especificamente o *Novo Cântico*, cuja fonte original possuía dados não estruturados (XMLs com mistura de estrofes e refrões).

Para solucionar isso, foi desenvolvido um pipeline de **ETL (Extract, Transform, Load)** em Python.

## O Pipeline (`crawler.py`)

O script atua como um agente de normalização de dados:

1.  **Extract (Ingestão):** * Realiza requisições HTTP sequenciais para a fonte de dados original.
    * Coleta 400 arquivos XML brutos.

2.  **Transform (Processamento):**
    * Utiliza `xml.etree.ElementTree` para parsear a árvore DOM.
    * **Heurística de Coro:** Aplica lógica condicional para identificar tags `<stanza type="chorus">`.
    * Separação lógica: Isola o texto do refrão do corpo das estrofes.

3.  **Load (Carga):**
    * Compila os dados processados em um único arquivo `novo_cantico_completo.json`.
    * Estrutura o JSON para consumo otimizado pelo Frontend JS.

### Snippet da Lógica de Transformação

```python
# Identificação semântica de partes do hino
if 'chorus' in tipo or 'coro' in tipo or 'refrão' in tipo:
    coro_texto = texto_estrofe  # Armazena separadamente
else:
    versos[str(verso_count)] = texto_estrofe # Adiciona à lista de versos