import { ok, err, sourceSchema, sourceBase64Schema, outputPathSchema, overwriteSchema, type ToolCtx } from "./shared.js";
import { resolveSource } from "../io/source.js";
import { writeOutput } from "../io/output.js";
import { pdfBufferToMarkdown } from "../converters/pdfToMarkdown.js";

export function registerPdfToMarkdown({ server }: ToolCtx) {
  server.registerTool(
    "pdf_to_markdown",
    {
      title: "PDF to Markdown",
      description:
        "Convert a PDF file to Markdown. Accepts a local file path, http(s) URL, file:// URI, data URI, or raw base64 content. Writes the result to output_path and returns the absolute path.",
      inputSchema: {
        source: sourceSchema,
        source_base64: sourceBase64Schema,
        output_path: outputPathSchema,
        overwrite: overwriteSchema,
      },
    },
    async ({ source, source_base64, output_path, overwrite }) => {
      try {
        const buffer = await resolveSource({ source, source_base64 });
        const markdown = await pdfBufferToMarkdown(buffer);
        const { outputPath, bytesWritten } = await writeOutput(
          output_path,
          Buffer.from(markdown, "utf8"),
          overwrite ?? false,
        );
        return ok({ output_path: outputPath, bytes_written: bytesWritten });
      } catch (e) {
        return err(e);
      }
    },
  );
}
