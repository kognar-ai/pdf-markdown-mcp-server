import { createRequire } from "module";
import MarkdownIt from "markdown-it";
import type { Readable } from "stream";

const require = createRequire(import.meta.url);

interface PdfPrinterInstance {
  createPdfKitDocument(def: unknown, opts?: unknown): Readable & { end(): void };
}

const PdfPrinterCtor = require("pdfmake") as {
  new(fonts: Record<string, unknown>): PdfPrinterInstance;
};

const _vfsRaw = require("pdfmake/build/vfs_fonts.js") as Record<string, unknown>;
const vfs = (
  (_vfsRaw.pdfMake as Record<string, unknown> | undefined)?.vfs ??
  (_vfsRaw.default as Record<string, unknown> | undefined)?.vfs ??
  _vfsRaw
) as Record<string, string>;

const fonts = {
  Roboto: {
    normal: Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
    bold: Buffer.from(vfs["Roboto-Medium.ttf"], "base64"),
    italics: Buffer.from(vfs["Roboto-Italic.ttf"], "base64"),
    bolditalics: Buffer.from(vfs["Roboto-MediumItalic.ttf"], "base64"),
  },
};

const printer = new PdfPrinterCtor(fonts);

interface Token {
  type: string;
  tag: string;
  content: string;
  children: Token[] | null;
  attrGet(name: string): string | null;
}

export interface PdfmakeOptions {
  paperFormat?: "A4" | "Letter" | "Legal";
  marginMm?: number;
}

type ContentItem = Record<string, unknown> | string;
type InlineSpan = Record<string, unknown>;

export async function markdownToPdfmakeBuffer(
  markdown: string,
  options: PdfmakeOptions = {},
): Promise<Buffer> {
  const { paperFormat = "A4", marginMm = 20 } = options;
  const mm = (n: number) => Math.round(n * 2.8346);

  const mdi = new MarkdownIt({ html: false, linkify: true, typographer: true });
  const tokens = mdi.parse(markdown, {});

  const content = new PdfmakeRenderer(tokens).render();

  const docDefinition = {
    pageSize: paperFormat,
    pageMargins: [mm(marginMm), mm(marginMm + 5), mm(marginMm), mm(marginMm + 5)],
    defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.4 },
    styles: {
      h1: { fontSize: 24, bold: true, marginBottom: 8, marginTop: 12 },
      h2: { fontSize: 20, bold: true, marginBottom: 6, marginTop: 10 },
      h3: { fontSize: 16, bold: true, marginBottom: 5, marginTop: 8 },
      h4: { fontSize: 14, bold: true, marginBottom: 4, marginTop: 6 },
      h5: { fontSize: 12, bold: true, marginBottom: 3, marginTop: 4 },
      h6: { fontSize: 11, bold: true, marginBottom: 3, marginTop: 4 },
      code: { fontSize: 9, color: "#c7254e", background: "#f9f2f4" },
      codeblock: { fontSize: 9, lineHeight: 1.3, background: "#f5f5f5", margin: [0, 4, 0, 8] },
      blockquote: { italics: true, color: "#555555", margin: [16, 0, 0, 0] },
    },
    content,
  };

  const doc = printer.createPdfKitDocument(docDefinition);
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

class PdfmakeRenderer {
  private tokens: Token[];
  private i = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  render(): ContentItem[] {
    this.i = 0;
    const content: ContentItem[] = [];
    while (this.i < this.tokens.length) {
      this.consumeBlock(content);
    }
    return content;
  }

  private consumeBlock(target: ContentItem[]): void {
    if (this.i >= this.tokens.length) return;
    const t = this.tokens[this.i];

    switch (t.type) {
      case "heading_open":
        this.consumeHeading(target);
        break;
      case "paragraph_open":
        this.consumeParagraph(target);
        break;
      case "fence":
      case "code_block":
        target.push({ text: t.content.trimEnd(), style: "codeblock" });
        this.i++;
        break;
      case "hr":
        target.push({
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#aaaaaa" }],
          margin: [0, 8, 0, 8],
        });
        this.i++;
        break;
      case "bullet_list_open":
        this.consumeList(target, false);
        break;
      case "ordered_list_open":
        this.consumeList(target, true);
        break;
      case "blockquote_open":
        this.consumeBlockquote(target);
        break;
      case "table_open":
        this.consumeTable(target);
        break;
      default:
        this.i++;
        break;
    }
  }

  private consumeHeading(target: ContentItem[]): void {
    const level = parseInt(this.tokens[this.i].tag.slice(1), 10);
    this.i++;
    const inline = this.tokens[this.i];
    this.i++;
    this.i++;
    target.push({ text: this.renderInline(inline?.children ?? []), style: `h${level}` });
  }

  private consumeParagraph(target: ContentItem[]): void {
    this.i++;
    const inline = this.tokens[this.i];
    this.i++;
    this.i++;
    target.push({ text: this.renderInline(inline?.children ?? []), marginBottom: 6 });
  }

  private consumeList(target: ContentItem[], ordered: boolean): void {
    const closeType = ordered ? "ordered_list_close" : "bullet_list_close";
    this.i++;
    const items: ContentItem[] = [];

    while (this.i < this.tokens.length && this.tokens[this.i].type !== closeType) {
      if (this.tokens[this.i].type === "list_item_open") {
        items.push(this.consumeListItem());
      } else {
        this.i++;
      }
    }
    this.i++;

    target.push(ordered ? { ol: items, marginBottom: 6 } : { ul: items, marginBottom: 6 });
  }

  private consumeListItem(): ContentItem {
    this.i++;
    const itemContent: ContentItem[] = [];

    while (this.i < this.tokens.length && this.tokens[this.i].type !== "list_item_close") {
      this.consumeBlock(itemContent);
    }
    this.i++;

    if (itemContent.length === 1) return itemContent[0];
    return { stack: itemContent };
  }

  private consumeBlockquote(target: ContentItem[]): void {
    this.i++;
    const inner: ContentItem[] = [];

    while (this.i < this.tokens.length && this.tokens[this.i].type !== "blockquote_close") {
      this.consumeBlock(inner);
    }
    this.i++;

    target.push({ stack: inner, style: "blockquote", marginBottom: 6 });
  }

  private consumeTable(target: ContentItem[]): void {
    this.i++;
    const body: ContentItem[][] = [];
    let headerRows = 0;
    let inThead = false;

    while (this.i < this.tokens.length && this.tokens[this.i].type !== "table_close") {
      const t = this.tokens[this.i];
      switch (t.type) {
        case "thead_open":
          inThead = true;
          this.i++;
          break;
        case "thead_close":
          inThead = false;
          this.i++;
          break;
        case "tbody_open":
        case "tbody_close":
          this.i++;
          break;
        case "tr_open": {
          this.i++;
          const row: ContentItem[] = [];
          while (this.i < this.tokens.length && this.tokens[this.i].type !== "tr_close") {
            const cell = this.tokens[this.i];
            if (cell.type === "th_open" || cell.type === "td_open") {
              const isHeader = cell.type === "th_open";
              this.i++;
              const inline = this.tokens[this.i];
              this.i++;
              this.i++;
              row.push({
                text: this.renderInline(inline?.children ?? []),
                ...(isHeader ? { bold: true, fillColor: "#e8e8e8" } : {}),
                margin: [4, 4, 4, 4],
              });
            } else {
              this.i++;
            }
          }
          this.i++;
          body.push(row);
          if (inThead) headerRows++;
          break;
        }
        default:
          this.i++;
          break;
      }
    }
    this.i++;

    if (body.length > 0 && body[0].length > 0) {
      target.push({
        table: { headerRows, body },
        layout: "lightHorizontalLines",
        marginBottom: 8,
      });
    }
  }

  private renderInline(tokens: Token[]): unknown {
    type Style = {
      bold?: boolean;
      italics?: boolean;
      decoration?: string;
      link?: string;
      color?: string;
    };
    const stack: Style[] = [{}];
    const spans: InlineSpan[] = [];

    for (const t of tokens) {
      const cur = { ...stack[stack.length - 1] };
      switch (t.type) {
        case "text":
          spans.push({ text: t.content, ...cur });
          break;
        case "softbreak":
          spans.push({ text: " " });
          break;
        case "hardbreak":
          spans.push({ text: "\n" });
          break;
        case "code_inline":
          spans.push({ text: t.content, style: "code" });
          break;
        case "strong_open":
          stack.push({ ...cur, bold: true });
          break;
        case "em_open":
          stack.push({ ...cur, italics: true });
          break;
        case "s_open":
          stack.push({ ...cur, decoration: "lineThrough" });
          break;
        case "link_open": {
          const href = t.attrGet("href") ?? "";
          stack.push({ ...cur, link: href, color: "#0066cc", decoration: "underline" });
          break;
        }
        case "strong_close":
        case "em_close":
        case "s_close":
        case "link_close":
          if (stack.length > 1) stack.pop();
          break;
        case "image": {
          const alt = t.attrGet("alt") ?? t.content ?? "image";
          spans.push({ text: `[image: ${alt}]`, italics: true, color: "#888888" });
          break;
        }
      }
    }

    if (spans.length === 0) return "";
    if (spans.length === 1 && Object.keys(spans[0]).length === 1 && "text" in spans[0]) {
      return spans[0].text;
    }
    return spans;
  }
}
