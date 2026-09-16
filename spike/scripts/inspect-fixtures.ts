import { PDFDocument } from "pdf-lib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = "fixtures/pdf-scan-codec-spike";
const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf")).sort();

async function main() {
const rows: Array<Record<string, string | number>> = [];

for (const f of files) {
  const full = join(dir, f);
  const bytes = statSync(full).size;
  try {
    const doc = await PDFDocument.load(readFileSync(full), { updateMetadata: false, ignoreEncryption: true });
    const pages = doc.getPages();
    const first = pages[0];
    const { width, height } = first.getSize();
    rows.push({
      file: f,
      MB: (bytes / 1024 / 1024).toFixed(2),
      pages: pages.length,
      firstPage: `${Math.round(width)}x${Math.round(height)}pt`,
      bytesPerPage: Math.round(bytes / pages.length),
      title: doc.getTitle() ?? "",
      producer: doc.getProducer() ?? "",
    });
  } catch (e) {
    rows.push({ file: f, MB: (bytes / 1024 / 1024).toFixed(2), pages: -1, firstPage: "ERROR", bytesPerPage: 0, title: "", producer: String((e as Error).message).slice(0, 80) });
  }
}

console.table(rows);
}
main();
