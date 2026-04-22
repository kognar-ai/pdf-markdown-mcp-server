<p align="center">
  <img src="https://kognar.com/assets/img/logo_kognar_white.svg" width="200" alt="Kognar"/>
</p>

# @kognar/pdf-markdown-mcp-server

MCP server da Kognar para conversão **PDF → Markdown** e **Markdown → PDF** via STDIO.

Compatível com Claude Desktop, Claude Code e qualquer cliente MCP que suporte o protocolo sobre STDIO.

---

## Instalação rápida

```bash
npx -y @kognar/pdf-markdown-mcp-server --help
```

---

## Configuração no Claude Desktop

Adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pdf-markdown": {
      "command": "npx",
      "args": ["-y", "@kognar/pdf-markdown-mcp-server"]
    }
  }
}
```

Com opções personalizadas:

```json
{
  "mcpServers": {
    "pdf-markdown": {
      "command": "npx",
      "args": [
        "-y",
        "@kognar/pdf-markdown-mcp-server",
        "--default-renderer", "pdfmake",
        "--tmp-dir", "/tmp/pdf-md"
      ]
    }
  }
}
```

---

## Opções de inicialização

| Flag | Env | Padrão | Descrição |
|---|---|---|---|
| `--default-renderer` | `PDF_MD_MCP_DEFAULT_RENDERER` | `pdfmake` | Renderer padrão para Markdown → PDF (`pdfmake` ou `puppeteer`) |
| `--tmp-dir` | `PDF_MD_MCP_TMP_DIR` | `/tmp` (OS) | Diretório para arquivos temporários |
| `--help`, `-h` | — | — | Exibe ajuda e encerra |

---

## Tools disponíveis

### `pdf_to_markdown`

Converte um arquivo PDF em Markdown.

**Argumentos:**

| Argumento | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `source` | string | sim¹ | Caminho local, URL http(s), URI `file://`, ou `data:...;base64,...` |
| `source_base64` | string | sim¹ | Conteúdo do PDF codificado em base64 puro |
| `output_path` | string | sim | Caminho do arquivo `.md` de saída |
| `overwrite` | boolean | não | Sobrescrever arquivo existente (padrão: `false`) |

¹ Forneça `source` **ou** `source_base64` (nunca os dois).

**Retorno:**

```json
{ "output_path": "/absolute/path/to/file.md", "bytes_written": 1234 }
```

**Exemplos:**

```
# Arquivo local
pdf_to_markdown(source="/Users/me/doc.pdf", output_path="./doc.md")

# URL pública
pdf_to_markdown(source="https://example.com/paper.pdf", output_path="./paper.md")

# Base64
pdf_to_markdown(source_base64="JVBERi0x...", output_path="./out.md")
```

> **Limitação:** PDFs baseados em imagens (scaneados) não possuem camada de texto e serão convertidos com conteúdo vazio ou incompleto. Para OCR, utilize um serviço externo antes da conversão.

---

### `markdown_to_pdf`

Converte Markdown em um arquivo PDF.

**Argumentos:**

| Argumento | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `source` | string | sim¹ | Caminho local, URL http(s), URI `file://`, ou `data:...;base64,...` |
| `source_base64` | string | sim¹ | Conteúdo Markdown codificado em base64 puro |
| `content` | string | sim¹ | Conteúdo Markdown como string direta |
| `output_path` | string | sim | Caminho do arquivo `.pdf` de saída |
| `overwrite` | boolean | não | Sobrescrever arquivo existente (padrão: `false`) |
| `renderer` | string | não | `pdfmake` (padrão) ou `puppeteer` |
| `paper_format` | string | não | `A4` (padrão), `Letter` ou `Legal` |
| `margin_mm` | number | não | Margem em mm (padrão: `20`) |
| `css` | string | não | Caminho para arquivo CSS ou CSS inline (somente `puppeteer`) |

¹ Forneça apenas um: `content`, `source` ou `source_base64`.

**Retorno:**

```json
{ "output_path": "/absolute/path/to/file.pdf", "bytes_written": 45678, "renderer": "pdfmake" }
```

**Exemplos:**

```
# Conteúdo inline com pdfmake
markdown_to_pdf(content="# Olá\n\n- Item 1\n- Item 2", output_path="./out.pdf")

# Arquivo local com puppeteer (alta fidelidade)
markdown_to_pdf(source="./README.md", output_path="./README.pdf", renderer="puppeteer")

# Com CSS customizado
markdown_to_pdf(content="# Doc", output_path="./styled.pdf", renderer="puppeteer", css="./style.css")
```

---

## Renderers: pdfmake vs puppeteer

| Característica | pdfmake | puppeteer |
|---|---|---|
| Peso | Leve (~5MB) | Pesado (~200MB Chromium) |
| Fidelidade | Boa (sem CSS) | Alta (HTML/CSS completo) |
| Tabelas | Suportadas | Suportadas |
| Imagens | Exibidas como `[image: alt]` | Renderizadas |
| Syntax highlight | Não | Sim (via CSS) |
| Chromium necessário | Não | Sim |
| Velocidade | Rápido | Mais lento (cold start) |

### Ativar o renderer puppeteer

O `md-to-pdf` é uma dependência opcional. Para ativá-lo:

```bash
# Na instalação local do servidor
npm install md-to-pdf

# Ou ao instalar sem omitir opcionais
npm install --include=optional
```

Para evitar o download do Chromium (se já tiver Chrome instalado):

```bash
PUPPETEER_EXECUTABLE_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  node dist/index.js --default-renderer puppeteer
```

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo dev (sem build)
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Testar com MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## Licença

[AGPL-3.0-only](./LICENSE) © Kognar
