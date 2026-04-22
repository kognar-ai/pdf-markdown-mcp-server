#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parseConfig } from "./config.js";
import { registerPdfToMarkdown } from "./tools/pdfToMarkdown.js";
import { registerMarkdownToPdf } from "./tools/markdownToPdf.js";

async function main() {
  const config = parseConfig(process.argv.slice(2));

  const server = new McpServer({
    name: "pdf-markdown-mcp-server",
    version: "0.1.0",
  });

  const ctx = { server, config };
  registerPdfToMarkdown(ctx);
  registerMarkdownToPdf(ctx);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[pdf-markdown-mcp] ready on stdio");
}

main().catch((e) => {
  console.error("[pdf-markdown-mcp] fatal:", e);
  process.exit(1);
});
