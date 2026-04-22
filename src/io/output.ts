import fs from "fs/promises";
import path from "path";

export interface WriteResult {
  outputPath: string;
  bytesWritten: number;
}

export async function writeOutput(
  outputPath: string,
  data: Buffer,
  overwrite = false,
): Promise<WriteResult> {
  const abs = path.resolve(process.cwd(), outputPath);

  if (!overwrite) {
    const exists = await fs
      .access(abs)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      throw new Error(
        `File already exists: ${abs}. Pass overwrite=true to replace it.`,
      );
    }
  }

  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);

  return { outputPath: abs, bytesWritten: data.length };
}
