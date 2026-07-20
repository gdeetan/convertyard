import { recognizePage } from '@/lib/ocr/tesseract-client'
import { preprocessForOcr, preprocessForScreenshot } from '@/lib/ocr/preprocessing'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import type { ToolOptions, ConversionResult, OcrResultMeta } from '@/lib/types'

const PSM_MAP: Record<string, number> = {
  auto: 3,
  document: 3,
  singleColumn: 4,
  sparse: 11,
}

export async function convertImageToWord(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const lang = (opts.language as string | undefined) ?? 'eng'
  const psm = PSM_MAP[(opts.ocrMode as string | undefined) ?? 'auto'] ?? 3
  const fontFamily = (opts.fontFamily as string | undefined) ?? 'Calibri'
  // docx size is in half-points
  const fontSize = ((opts.fontSize as number | undefined) ?? 11) * 2
  const isScreenshot = (opts.imageType as string | undefined) === 'screenshot'

  return Promise.all(
    files.map(async (file, i): Promise<ConversionResult> => {
      try {
        onProgress?.(i, 0)

        const blob = new Blob([await file.arrayBuffer()], { type: file.type })
        const preprocessed = isScreenshot
          ? await preprocessForScreenshot(blob)
          : await preprocessForOcr(blob)
        onProgress?.(i, 40)

        const ocr = await recognizePage(preprocessed, lang, { oem: 1, psm, dpi: 300 })
        onProgress?.(i, 80)

        const lines = ocr.text.split('\n')
        const paragraphs = lines.map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line, font: fontFamily, size: fontSize })],
            })
        )

        const doc = new Document({ sections: [{ children: paragraphs }] })
        const docBlob = await Packer.toBlob(doc)

        const baseName = file.name.replace(/\.[^.]+$/, '')
        const outFile = new File(
          [docBlob],
          `${baseName}.docx`,
          { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        )

        const ocrMeta: OcrResultMeta = {
          kind: 'ocr',
          words: ocr.words.map((w) => ({
            text: w.text,
            confidence: w.confidence,
            bbox: w.bbox,
            lineIndex: w.lineIndex,
          })),
          lines: lines.filter((l) => l.trim().length > 0),
          sourceIndex: i,
        }

        onProgress?.(i, 100)
        return { file: outFile, ocrMeta }
      } catch (err) {
        return err instanceof Error ? err : new Error(String(err))
      }
    })
  )
}
