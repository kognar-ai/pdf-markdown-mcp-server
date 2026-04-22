import os from "os";

export type Renderer = "pdfmake" | "puppeteer";

export interface AppConfig {
  tmpDir: string;
  defaultRenderer: Renderer;
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    let key: string;
    let val: string | undefined;
    if (eq !== -1) {
      key = a.slice(2, eq);
      val = a.slice(eq + 1);
    } else {
      key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        val = next;
        i++;
      } else {
        val = "true";
      }
    }
    out[key.replace(/-/g, "_")] = val;
  }
  return out;
}

export function parseConfig(argv: string[]): AppConfig {
  const args = parseArgs(argv);

  if (args.help || args.h) {
    console.error(
      `pdf-markdown-mcp-server

Usage:
  npx @kognar-tools/pdf-markdown-mcp-server [options]

Options (fallback to env vars):
  --tmp-dir <dir>                  Directory for temp files (PDF_MD_MCP_TMP_DIR)
  --default-renderer <renderer>    pdfmake | puppeteer (PDF_MD_MCP_DEFAULT_RENDERER, default: pdfmake)
  --help, -h                       Show this help

Tools exposed via MCP:
  pdf_to_markdown   Convert a PDF file or URL to Markdown.
  markdown_to_pdf   Convert a Markdown file, URL, or content string to PDF.

Puppeteer renderer:
  The puppeteer renderer uses Chromium (via md-to-pdf) for high-fidelity PDF output.
  It is an optional dependency. To enable it:
    npm install md-to-pdf
  Or reinstall without --omit=optional:
    npm install --include=optional
`,
    );
    process.exit(0);
  }

  const tmpDir =
    args.tmp_dir ?? process.env.PDF_MD_MCP_TMP_DIR ?? os.tmpdir();

  const rawRenderer =
    args.default_renderer ?? process.env.PDF_MD_MCP_DEFAULT_RENDERER ?? "pdfmake";

  if (rawRenderer !== "pdfmake" && rawRenderer !== "puppeteer") {
    console.error(
      `[pdf-markdown-mcp] Invalid --default-renderer: "${rawRenderer}". Must be pdfmake or puppeteer.`,
    );
    process.exit(1);
  }

  return { tmpDir, defaultRenderer: rawRenderer as Renderer };
}
