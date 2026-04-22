import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export interface SourceArgs {
  source?: string;
  source_base64?: string;
}

export async function resolveSource(args: SourceArgs): Promise<Buffer> {
  const { source, source_base64 } = args;

  if (!source && !source_base64) {
    throw new Error(
      "Provide source (path, http(s) URL, file:// URI, or data:...;base64,... URI) or source_base64 (raw base64 content).",
    );
  }
  if (source && source_base64) {
    throw new Error("Provide only one of source or source_base64, not both.");
  }

  if (source_base64) {
    return Buffer.from(source_base64, "base64");
  }

  const s = source!;

  if (s.startsWith("data:")) {
    const commaIdx = s.indexOf(",");
    if (commaIdx === -1) throw new Error("Invalid data URI: missing comma.");
    const meta = s.slice(5, commaIdx);
    const payload = s.slice(commaIdx + 1);
    return meta.includes(";base64")
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload));
  }

  if (s.startsWith("file://")) {
    const fsPath = fileURLToPath(s);
    return fs.readFile(fsPath);
  }

  if (s.startsWith("http://") || s.startsWith("https://")) {
    const resp = await fetch(s);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} ${resp.statusText} fetching: ${s}`);
    }
    return Buffer.from(await resp.arrayBuffer());
  }

  const absPath = path.resolve(process.cwd(), s);
  return fs.readFile(absPath);
}
