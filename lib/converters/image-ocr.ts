import { recognizePage, terminateOcrWorker } from '@/lib/ocr/tesseract-client'
import { preprocessForOcr } from '@/lib/ocr/preprocessing'
import { recognizeWithTrOCR } from '@/lib/ocr/trocr-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'
import * as XLSX from 'xlsx'

// ── HEIC decode ───────────────────────────────────────────────────────────────

async function decodeHeic(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/png' })
  return Array.isArray(result) ? result[0] : result
}

function isHeic(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

// ── Pre-processing: composite transparent PNG onto white ─────────────────────

async function compositePng(blob: Blob): Promise<Blob> {
  if (typeof OffscreenCanvas === 'undefined') return blob
  const bmp = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bmp.width, bmp.height)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, bmp.width, bmp.height)
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  return canvas.convertToBlob({ type: 'image/png' })
}

// ── Line cropping for TrOCR ───────────────────────────────────────────────────

async function cropLinesToBlobs(
  preprocessedBlob: Blob,
  lines: Array<{ x0: number; y0: number; x1: number; y1: number }>
): Promise<Blob[]> {
  if (lines.length === 0 || typeof OffscreenCanvas === 'undefined') return []
  const bmp = await createImageBitmap(preprocessedBlob)
  const blobs: Blob[] = []
  for (const { x0, y0, x1, y1 } of lines) {
    const w = x1 - x0
    const h = y1 - y0
    if (w <= 0 || h <= 0) continue
    const c = new OffscreenCanvas(w, h)
    c.getContext('2d')!.drawImage(bmp, x0, y0, w, h, 0, 0, w, h)
    blobs.push(await c.convertToBlob({ type: 'image/png' }))
  }
  bmp.close()
  return blobs
}

// ── PSM mapping from handwritingStyle ────────────────────────────────────────

function psmForStyle(style: string): number {
  if (style === 'print') return 6   // uniform block of text
  return 3                           // auto (handles cursive / mixed layout)
}

// ── Structured output parsers ─────────────────────────────────────────────────

function parseReceiptText(text: string, filename: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const dateMatch = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/)
  const totalMatch = text.match(/(?:total|amount|due|sum)[^\d]*(\$?[\d,]+\.\d{2})/i)
    ?? text.match(/\$?[\d,]+\.\d{2}/)
  const vendor = lines[0] ?? ''
  const date = dateMatch?.[0] ?? ''
  const total = totalMatch?.[1] ?? totalMatch?.[0] ?? ''
  const csvRow = [filename, vendor, date, total, text.replace(/\n/g, ' | ')].map(cell =>
    `"${cell.replace(/"/g, '""')}"`
  ).join(',')
  return csvRow
}

function parseBusinessCardText(text: string, filename: string): string {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.\w+/)
  const phoneMatch = text.match(/[\+\d\s\-\(\)]{7,20}/)
  const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.\w{2,}(?:\/\S*)?/)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const name = lines[0] ?? ''
  const company = lines[1] ?? ''
  const email = emailMatch?.[0] ?? ''
  const phone = phoneMatch?.[0]?.trim() ?? ''
  const url = urlMatch?.[0] ?? ''
  return [filename, name, company, email, phone, url, text.replace(/\n/g, ' | ')]
    .map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
}

function parseTableText(text: string): string {
  const rows = text.split('\n')
    .map(line => line.split(/\t|  +/).map(cell => cell.trim()))
    .filter(row => row.some(cell => cell.length > 0))
  return rows.map(row =>
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n')
}

function parseToExcel(text: string, sheetName: string): Uint8Array {
  const rows = text.split('\n')
    .map(line => line.split(/\t|  +/).map(cell => cell.trim()))
    .filter(row => row.some(cell => cell.length > 0))
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(buf)
}

// ── Main converter ────────────────────────────────────────────────────────────

export type OcrMode =
  | 'text'
  | 'markdown'
  | 'combined'
  | 'receipt-csv'
  | 'card-csv'
  | 'table-csv'
  | 'excel'

export async function imageOcrConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  const lang = typeof opts.language === 'string' ? opts.language : 'eng'
  const mode = (opts.outputMode as OcrMode | undefined) ?? 'text'
  const engine = (opts.recognitionEngine as string | undefined) ?? 'standard'
  const style = (opts.handwritingStyle as string | undefined) ?? 'mixed'
  const useAi = engine === 'ai-enhanced' && lang === 'eng'
  const isPng = (f: File) => f.type === 'image/png' || /\.png$/i.test(f.name)

  const results: ConversionResult[] = []
  const combinedParts: string[] = []

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    const file = files[i]

    try {
      let blob: Blob = file

      if (isHeic(file)) {
        onProgress?.(i, 10)
        blob = await decodeHeic(file)
      }

      if (isPng(file)) {
        onProgress?.(i, 15)
        blob = await compositePng(blob)
      }

      // Preprocessing: grayscale, contrast, binarize, deskew, upscale
      onProgress?.(i, 20)
      blob = await preprocessForOcr(blob)

      let text: string
      let confidence: number

      if (useAi) {
        // AI path: Tesseract layout analysis only → TrOCR per line
        onProgress?.(i, 25)
        const { lines, confidence: conf } = await recognizePage(blob, lang, { oem: 1, psm: 3 })
        confidence = conf
        onProgress?.(i, 40)
        const lineBlobs = await cropLinesToBlobs(blob, lines)
        if (lineBlobs.length > 0) {
          text = await recognizeWithTrOCR(
            lineBlobs,
            p => onProgress?.(i, 40 + Math.round(p * 0.5))
          )
        } else {
          // Fallback: no lines detected, run TrOCR on the whole image
          const { recognizeWithTrOCR: fullRun } = await import('@/lib/ocr/trocr-client')
          text = await fullRun([blob], p => onProgress?.(i, 40 + Math.round(p * 0.5)))
        }
      } else {
        // Standard path: enhanced Tesseract with OEM/PSM tuning
        onProgress?.(i, 30)
        const result = await recognizePage(blob, lang, {
          oem: 1,
          psm: psmForStyle(style),
        });
        ({ text, confidence } = result)
      }

      onProgress?.(i, 90)

      const baseName = file.name.replace(/\.[^.]+$/, '')
      let outFile: File

      switch (mode) {
        case 'markdown': {
          const mdContent = `# ${baseName}\n\nConfidence: ${confidence!.toFixed(0)}%\n\n${text.trim()}`
          outFile = new File([mdContent], `${baseName}.md`, { type: 'text/markdown' })
          break
        }
        case 'receipt-csv': {
          const header = i === 0 ? 'filename,vendor,date,total,raw_text\n' : ''
          const row = parseReceiptText(text, file.name)
          const csv = header + row + '\n'
          outFile = new File([csv], `${baseName}-receipt.csv`, { type: 'text/csv' })
          break
        }
        case 'card-csv': {
          const header = i === 0 ? 'filename,name,company,email,phone,url,raw_text\n' : ''
          const row = parseBusinessCardText(text, file.name)
          const csv = header + row + '\n'
          outFile = new File([csv], `${baseName}-contact.csv`, { type: 'text/csv' })
          break
        }
        case 'table-csv': {
          const csv = parseTableText(text)
          outFile = new File([csv], `${baseName}.csv`, { type: 'text/csv' })
          break
        }
        case 'excel': {
          const xlsxBytes = parseToExcel(text, baseName)
          outFile = new File([xlsxBytes as unknown as Uint8Array<ArrayBuffer>], `${baseName}.xlsx`, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          break
        }
        case 'combined': {
          combinedParts.push(`=== ${file.name} ===\n${text.trim()}`)
          onProgress?.(i, 100)
          results.push(new File([''], `${file.name}.placeholder`))
          continue
        }
        default: {
          outFile = new File([text.trim()], `${baseName}.txt`, { type: 'text/plain' })
          break
        }
      }

      results.push(outFile)
      onProgress?.(i, 100)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  if (mode === 'combined' && combinedParts.length > 0) {
    const merged = combinedParts.join('\n\n---\n\n')
    const combinedFile = new File([merged], 'extracted-text.txt', { type: 'text/plain' })
    return results.map((r, i) => {
      if (r instanceof File && r.name.endsWith('.placeholder')) {
        return i === 0 ? combinedFile : new File([''], 'combined-in-first-file.skip')
      }
      return r
    })
  }

  await terminateOcrWorker().catch(() => {})
  return results
}
