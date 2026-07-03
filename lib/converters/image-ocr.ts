import { recognizePage, terminateOcrWorker } from '@/lib/ocr/tesseract-client'
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
    .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
    .join(',')
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
  const isPng = (f: File) => f.type === 'image/png' || /\.png$/i.test(f.name)

  const results: ConversionResult[] = []
  const combinedParts: string[] = []

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    const file = files[i]

    try {
      let blob: Blob = file

      if (isHeic(file)) {
        onProgress?.(i, 15)
        blob = await decodeHeic(file)
      }

      if (isPng(file)) {
        onProgress?.(i, 20)
        blob = await compositePng(blob)
      }

      onProgress?.(i, 30)

      const { text, confidence } = await recognizePage(blob, lang)

      onProgress?.(i, 90)

      const baseName = file.name.replace(/\.[^.]+$/, '')
      let outFile: File

      switch (mode) {
        case 'markdown': {
          const mdContent = `# ${baseName}\n\nConfidence: ${confidence.toFixed(0)}%\n\n${text.trim()}`
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
          outFile = new File([xlsxBytes], `${baseName}.xlsx`, {
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
