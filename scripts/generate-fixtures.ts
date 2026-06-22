import { PDFDocument, rgb } from "pdf-lib";
import { writeFileSync, mkdirSync } from "fs";

const DIR = "test-fixtures/pdf";
mkdirSync(DIR, { recursive: true });

async function makePdf(pages: number, withText = true) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([612, 792]);
    if (withText) {
      page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 24, color: rgb(0, 0, 0) });
    }
  }
  return doc.save();
}

async function main() {
  writeFileSync(`${DIR}/normal-10-page.pdf`, await makePdf(10));
  writeFileSync(`${DIR}/huge-500-page.pdf`, await makePdf(500));
  writeFileSync(`${DIR}/single-page.pdf`, await makePdf(1));

  writeFileSync(`${DIR}/zero-byte.pdf`, Buffer.alloc(0));

  writeFileSync(`${DIR}/not-a-pdf.pdf`, "this is just text, not a pdf");

  const valid = await makePdf(5);
  writeFileSync(`${DIR}/corrupted-truncated.pdf`, valid.slice(0, Math.floor(valid.length * 0.6)));

  console.log("Fixtures generated in", DIR);
  console.log("NOTE: manually add encrypted-password.pdf and scanned-image-only.pdf");
}

main();
