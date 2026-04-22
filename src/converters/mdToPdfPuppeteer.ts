import fs from "fs/promises";

export interface PuppeteerOptions {
  paperFormat?: "A4" | "Letter" | "Legal";
  marginMm?: number;
  css?: string;
}

export async function markdownToPuppeteerBuffer(
  markdown: string,
  options: PuppeteerOptions = {},
): Promise<Buffer> {
  let mdToPdf: typeof import("md-to-pdf").mdToPdf;
  try {
    const mod = await import("md-to-pdf");
    mdToPdf = mod.mdToPdf;
  } catch {
    throw new Error(
      "The puppeteer renderer requires md-to-pdf (optional dependency).\n" +
        "Install it with: npm install md-to-pdf\n" +
        "Or use the pdfmake renderer instead (renderer=pdfmake).",
    );
  }

  const { paperFormat = "A4", marginMm = 20, css } = options;
  const margin = `${marginMm}mm`;

  let stylesheetOpt: Record<string, string> = {};
  if (css) {
    const isFile = await fs
      .access(css)
      .then(() => true)
      .catch(() => false);
    stylesheetOpt = isFile ? { stylesheet: css } : { css };
  }

  const result = await mdToPdf(
    { content: markdown },
    {
      pdf_options: {
          format: paperFormat,
          margin: { top: margin, right: margin, bottom: margin, left: margin },
        },
      ...stylesheetOpt,
    },
  );

  if (!result.content) {
    throw new Error("Puppeteer renderer returned no content. Is Chromium available?");
  }

  return result.content;
}
