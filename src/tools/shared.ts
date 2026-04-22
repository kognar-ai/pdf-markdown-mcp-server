import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config.js";

export type ToolCtx = { server: McpServer; config: AppConfig };

export function ok(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function err(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

export const sourceSchema = z
  .string()
  .optional()
  .describe(
    "File path (absolute or relative), http(s) URL, file:// URI, or data:...;base64,... data URI.",
  );

export const sourceBase64Schema = z
  .string()
  .optional()
  .describe("Raw base64-encoded file content (alternative to source).");

export const outputPathSchema = z
  .string()
  .describe("Output file path (absolute or relative to CWD).");

export const overwriteSchema = z
  .boolean()
  .optional()
  .describe("Overwrite the output file if it already exists. Default: false.");
