<p align="center">
  <img src="https://kognar.com/assets/img/logo_kognar_white.svg" width="200" alt="Kognar"/>
</p>

# @kognar/pdf-markdown-mcp-server

Kognar's MCP server for bidirectional **PDF → Markdown** and **Markdown → PDF** conversion over STDIO.

Compatible with Claude Desktop, Claude Code, Kognar Platform, and any MCP client that supports the STDIO protocol.

---

## Quick start

```bash
npx -y @kognar/pdf-markdown-mcp-server --help
```

---

## Kognar Platform

Open the **Add MCP Server** dialog and fill in the fields as shown below:

| Field | Value |
|---|---|
| **Name** | `PDF-Markdown` |
| **Transport** | Stdio (local) |
| **Command** | `npx` |
| **Arguments** | `-y @kognar/pdf-markdown-mcp-server --default-renderer pdfmake` |
| **Working directory** | your project directory |
| **Enabled** | ✓ |
| **Auto-connect on startup** | ✓ |

To use the puppeteer renderer (high-fidelity, requires Chromium), change the arguments to:

```
-y @kognar/pdf-markdown-mcp-server --default-renderer puppeteer
```

---

## Claude Desktop

Add to your `claude_desktop_config.json`:

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

With custom options:

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

## Startup options

| Flag | Env var | Default | Description |
|---|---|---|---|
| `--default-renderer` | `PDF_MD_MCP_DEFAULT_RENDERER` | `pdfmake` | Default renderer for Markdown → PDF (`pdfmake` or `puppeteer`) |
| `--tmp-dir` | `PDF_MD_MCP_TMP_DIR` | OS temp dir | Directory for temporary files |
| `--help`, `-h` | — | — | Show help and exit |

---

## Available tools

### `pdf_to_markdown`

Converts a PDF file to Markdown.

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `source` | string | yes¹ | Local file path, http(s) URL, `file://` URI, or `data:...;base64,...` data URI |
| `source_base64` | string | yes¹ | Raw base64-encoded PDF content |
| `output_path` | string | yes | Output `.md` file path |
| `overwrite` | boolean | no | Overwrite existing file (default: `false`) |

¹ Provide `source` **or** `source_base64` — not both.

**Response:**

```json
{ "output_path": "/absolute/path/to/file.md", "bytes_written": 1234 }
```

**Examples:**

```
# Local file
pdf_to_markdown(source="/Users/me/doc.pdf", output_path="./doc.md")

# Public URL
pdf_to_markdown(source="https://example.com/paper.pdf", output_path="./paper.md")

# Raw base64
pdf_to_markdown(source_base64="JVBERi0x...", output_path="./out.md")
```

> **Limitation:** Image-based (scanned) PDFs have no text layer and will produce empty or incomplete output. For OCR, pre-process the PDF with an external service before converting.

---

### `markdown_to_pdf`

Converts Markdown to a PDF file.

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `source` | string | yes¹ | Local file path, http(s) URL, `file://` URI, or `data:...;base64,...` data URI |
| `source_base64` | string | yes¹ | Raw base64-encoded Markdown content |
| `content` | string | yes¹ | Inline Markdown string |
| `output_path` | string | yes | Output `.pdf` file path |
| `overwrite` | boolean | no | Overwrite existing file (default: `false`) |
| `renderer` | string | no | `pdfmake` (default) or `puppeteer` |
| `paper_format` | string | no | `A4` (default), `Letter`, or `Legal` |
| `margin_mm` | number | no | Page margin in mm (default: `20`) |
| `css` | string | no | CSS file path or inline CSS string (puppeteer renderer only) |

¹ Provide exactly one of `content`, `source`, or `source_base64`.

**Response:**

```json
{ "output_path": "/absolute/path/to/file.pdf", "bytes_written": 45678, "renderer": "pdfmake" }
```

**Examples:**

```
# Inline content with pdfmake
markdown_to_pdf(content="# Hello\n\n- Item 1\n- Item 2", output_path="./out.pdf")

# Local file with puppeteer (high-fidelity)
markdown_to_pdf(source="./README.md", output_path="./README.pdf", renderer="puppeteer")

# With custom CSS
markdown_to_pdf(content="# Doc", output_path="./styled.pdf", renderer="puppeteer", css="./style.css")
```

---

## Renderers: pdfmake vs puppeteer

| Feature | pdfmake | puppeteer |
|---|---|---|
| Size | Lightweight (~5 MB) | Heavy (~200 MB Chromium) |
| Fidelity | Good (no CSS) | High (full HTML/CSS) |
| Tables | Supported | Supported |
| Images | Rendered as `[image: alt]` | Fully rendered |
| Syntax highlighting | No | Yes (via CSS) |
| Chromium required | No | Yes |
| Speed | Fast | Slower (cold start) |

### Enabling the puppeteer renderer

`md-to-pdf` is an optional dependency. To enable it:

```bash
# Install locally
npm install md-to-pdf

# Or reinstall without omitting optionals
npm install --include=optional
```

To skip the Chromium download if you already have Chrome installed:

```bash
PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  node dist/index.js --default-renderer puppeteer
```

---

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (no build required)
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## License

[AGPL-3.0-only](./LICENSE) © Kognar
