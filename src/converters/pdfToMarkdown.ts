import { createRequire } from "module";

const require = createRequire(import.meta.url);

// @opendocsg/pdf2md is a CJS package — use createRequire for reliable ESM interop
const _mod = require("@opendocsg/pdf2md") as unknown;
const pdf2md = (
  typeof _mod === "function" ? _mod : (_mod as Record<string, unknown>).default
) as (data: Uint8Array) => Promise<string>;

export async function pdfBufferToMarkdown(buffer: Buffer): Promise<string> {
  const markdown = await pdf2md(buffer);
  return markdown;
}
