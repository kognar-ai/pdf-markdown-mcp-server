import { z } from "zod";
import { ok, err, sourceSchema, sourceBase64Schema, outputPathSchema, overwriteSchema, type ToolCtx } from "./shared.js";
import { resolveSource } from "../io/source.js";
import { writeOutput } from "../io/output.js";
import { markdownToPdfmakeBuffer } from "../converters/mdToPdfPdfmake.js";
import { markdownToPuppeteerBuffer } from "../converters/mdToPdfPuppeteer.js";
import type { Renderer } from "../config.js";

const paperFormatSchema = z
  .enum(["A4", "Letter", "Legal"])
  .optional()
  .describe("Page size. Default: A4.");

const marginSchema = z
  .number()
  .int()
  .min(0)
  .max(100)
  .optional()
  .describe("Page margin in mm. Default: 20.");

const rendererSchema = z
  .enum(["pdfmake", "puppeteer"])
  .optional()
  .describe(
    "PDF renderer. pdfmake: lightweight, pure-JS, no Chromium. puppeteer: high-fidelity HTML/CSS rendering, requires md-to-pdf optional dependency. Default: server default (pdfmake).",
  );

const cssSchema = z
  .string()
  .optional()
  .describe(
    "CSS to apply (puppeteer renderer only). Accepts a file path or an inline CSS string.",
  );

const contentSchema = z
  .string()
  .optional()
  .describe("Markdown content string (alternative to source/source_base64).");

export function registerMarkdownToPdf({ server, config }: ToolCtx) {
  server.registerTool(
    "markdown_to_pdf",
    {
      title: "Markdown to PDF",
      description:
        "Convert Markdown to a PDF file. Accepts source as a local file path, http(s) URL, file:// URI, data URI, raw base64, or inline content string. Writes the result to output_path and returns the absolute path.",
      inputSchema: {
        source: sourceSchema,
        source_base64: sourceBase64Schema,
        content: contentSchema,
        output_path: outputPathSchema,
        overwrite: overwriteSchema,
        renderer: rendererSchema,
        paper_format: paperFormatSchema,
        margin_mm: marginSchema,
        css: cssSchema,
      },
    },
    async ({ source, source_base64, content, output_path, overwrite, renderer, paper_format, margin_mm, css }) => {
      try {
        let markdown: string;

        if (content) {
          if (source || source_base64) {
            throw new Error("Provide only one of content, source, or source_base64.");
          }
          markdown = content;
        } else {
          const buffer = await resolveSource({ source, source_base64 });
          markdown = buffer.toString("utf8");
        }

        const chosenRenderer: Renderer = renderer ?? config.defaultRenderer;
        const paperFormat = paper_format ?? "A4";
        const marginMm = margin_mm ?? 20;

        let pdfBuffer: Buffer;

        if (chosenRenderer === "puppeteer") {
          pdfBuffer = await markdownToPuppeteerBuffer(markdown, { paperFormat, marginMm, css });
        } else {
          pdfBuffer = await markdownToPdfmakeBuffer(markdown, { paperFormat, marginMm });
        }

        const { outputPath, bytesWritten } = await writeOutput(
          output_path,
          pdfBuffer,
          overwrite ?? false,
        );

        return ok({ output_path: outputPath, bytes_written: bytesWritten, renderer: chosenRenderer });
      } catch (e) {
        return err(e);
      }
    },
  );
}
