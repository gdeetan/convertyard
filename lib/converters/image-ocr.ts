import { recognizePage, terminateOcrWorker, type OcrOptions, type OcrPageResult } from '@/lib/ocr/tesseract-client'
import { preprocessForOcr, preprocessForOcrDual, preprocessForScreenshot } from '@/lib/ocr/preprocessing'
import { detectLines } from '@/lib/ocr/line-detector'
import { correctWords } from '@/lib/ocr/correction-client'
import type { ConversionResult, OcrWordMeta, OcrResultMeta, ToolOptions } from '@/lib/types'
import * as XLSX from 'xlsx'
import { detectColumnBoundaries, detectRowBoundaries } from '@/lib/ocr/column-detector'
import { diagLog, diagError, diagMemory } from '@/lib/debug/mobile-diagnostics'

interface TrOcrLineResult {
  text: string
  confidence: number
}

const RECEIPT_PRIMARY_OCR: OcrOptions = { oem: 1, psm: 4, dpi: 300, preserveSpaces: true }
const RECEIPT_BLOCK_OCR: OcrOptions = { oem: 1, psm: 6, dpi: 300, preserveSpaces: true }

function toOcrWordMeta(result: OcrPageResult): OcrWordMeta[] {
  const rawWords = result.words ?? []
  return rawWords.length > 5000
    ? rawWords.map(w => ({ text: w.text, confidence: w.confidence, lineIndex: w.lineIndex }))
    : rawWords.map(w => ({ text: w.text, confidence: w.confidence, bbox: w.bbox, lineIndex: w.lineIndex }))
}

function scoreReceiptOcr(text: string, confidence: number): number {
  const repaired = repairDigitTokens(text)
  const lines = repaired.split('\n').map(l => l.trim()).filter(Boolean)
  const cleanPrices = repaired.match(/(?:[$S]\s*)?\b\d{1,5}(?:,\d{3})?[.,]\d{2}\b/g)?.length ?? 0
  const malformedPrices = repaired.match(/\d+[.,]\d+[.,]\d+|\d[.,]\d[.,]|\d{1,3}(?:[.,]\d{1,3}){3,}/g)?.length ?? 0
  const dates = repaired.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g)?.length ?? 0
  const strongLabels = repaired.match(/\b(total|subtotal|tax|amount due|amt due|balance due)\b/gi)?.length ?? 0
  const weakLabels = repaired.match(/\b(change|cash|card|visa|mastercard|qty|receipt|invoice|server|table|cashier)\b/gi)?.length ?? 0
  const itemLikeLines = lines.filter(line =>
    /[A-Za-z]{3,}/.test(line) &&
    /\b\d{1,5}(?:,\d{3})?[.,]\d{2}\b/.test(line) &&
    !/\d+[.,]\d+[.,]\d+|\d{1,3}(?:[.,]\d{1,3}){3,}/.test(line)
  ).length
  const alphaChars = (repaired.match(/[A-Za-z]/g) ?? []).length
  const digitChars = (repaired.match(/\d/g) ?? []).length
  const garbageChars = (repaired.match(/[�<>[\]{}]/g) ?? []).length
  const totalChars = Math.max(1, repaired.replace(/\s/g, '').length)
  const readableRatio = (alphaChars + digitChars) / totalChars
  const numericHeavyPenalty = digitChars > alphaChars * 2.2 ? 20 : 0
  const totalBonus = extractReceiptTotal(repaired) ? 25 : 0
  return confidence
    + Math.min(cleanPrices, 14) * 7
    + Math.min(itemLikeLines, 12) * 10
    + dates * 16
    + Math.min(strongLabels, 6) * 10
    + Math.min(weakLabels, 8) * 3
    + Math.min(lines.length, 28)
    + totalBonus
    + readableRatio * 20
    - Math.min(malformedPrices, 16) * 12
    - Math.min(garbageChars, 20) * 5
    - numericHeavyPenalty
}

async function recognizeReceiptPage(image: Blob, lang: string, allowRetry = true): Promise<OcrPageResult> {
  const primary = await recognizePage(image, lang, RECEIPT_PRIMARY_OCR)
  const primaryScore = scoreReceiptOcr(primary.text, primary.confidence)
  if (!allowRetry || primaryScore >= 120) return primary

  const block = await recognizePage(image, lang, RECEIPT_BLOCK_OCR)
  return scoreReceiptOcr(block.text, block.confidence) > primaryScore ? block : primary
}

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

// Android phones (Samsung etc.) store HEIF photos with .jpg extension and
// report type=image/jpeg. Check the ISOBMFF ftyp box magic bytes to catch them.
async function hasHeicMagicBytes(file: File): Promise<boolean> {
  try {
    const buf = await file.slice(0, 12).arrayBuffer()
    const b = new Uint8Array(buf)
    // bytes 4-7 must be 'ftyp'
    if (b[4] !== 0x66 || b[5] !== 0x74 || b[6] !== 0x79 || b[7] !== 0x70) return false
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11])
    return /^(heic|heis|heix|hevc|hevx|mif1|msf1|MiHE|MiHM|MiHS|MiHB)/.test(brand)
  } catch {
    return false
  }
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

async function cropLikelyReceiptPaper(blob: Blob): Promise<Blob> {
  if (typeof OffscreenCanvas === 'undefined') return blob
  const bmp = await createImageBitmap(blob)
  try {
    const maxProbe = 720
    const scale = Math.min(1, maxProbe / Math.max(bmp.width, bmp.height))
    const probeW = Math.max(1, Math.round(bmp.width * scale))
    const probeH = Math.max(1, Math.round(bmp.height * scale))
    const probe = new OffscreenCanvas(probeW, probeH)
    const pctx = probe.getContext('2d')
    if (!pctx) return blob
    pctx.drawImage(bmp, 0, 0, probeW, probeH)
    const data = pctx.getImageData(0, 0, probeW, probeH).data
    const colCounts = new Uint16Array(probeW)
    const rowCounts = new Uint16Array(probeH)

    for (let y = 0; y < probeH; y++) {
      for (let x = 0; x < probeW; x++) {
        const idx = (y * probeW + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        if (lum > 145 && max - min < 58) {
          colCounts[x]++
          rowCounts[y]++
        }
      }
    }

    const colThreshold = Math.max(12, Math.round(probeH * 0.14))
    let bestStart = -1
    let bestEnd = -1
    let start = -1
    for (let x = 0; x <= probeW; x++) {
      const active = x < probeW && colCounts[x] >= colThreshold
      if (active && start === -1) start = x
      if ((!active || x === probeW) && start !== -1) {
        const end = x - 1
        if (end - start > bestEnd - bestStart) {
          bestStart = start
          bestEnd = end
        }
        start = -1
      }
    }
    if (bestStart < 0 || bestEnd - bestStart < probeW * 0.18) return blob

    const rowThreshold = Math.max(8, Math.round((bestEnd - bestStart + 1) * 0.16))
    let top = 0
    let bottom = probeH - 1
    while (top < probeH && rowCounts[top] < rowThreshold) top++
    while (bottom > top && rowCounts[bottom] < rowThreshold) bottom--
    if (bottom - top < probeH * 0.35) return blob

    const padX = Math.round(probeW * 0.025)
    const padY = Math.round(probeH * 0.02)
    const sx = Math.max(0, Math.round((bestStart - padX) / scale))
    const sy = Math.max(0, Math.round((top - padY) / scale))
    const ex = Math.min(bmp.width, Math.round((bestEnd + padX) / scale))
    const ey = Math.min(bmp.height, Math.round((bottom + padY) / scale))
    const cropW = ex - sx
    const cropH = ey - sy
    const originalArea = bmp.width * bmp.height
    const cropArea = cropW * cropH
    if (
      cropW < bmp.width * 0.18 ||
      cropW > bmp.width * 0.78 ||
      cropH < bmp.height * 0.55 ||
      cropArea > originalArea * 0.78
    ) {
      return blob
    }

    const canvas = new OffscreenCanvas(cropW, cropH)
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cropW, cropH)
    ctx.drawImage(bmp, sx, sy, cropW, cropH, 0, 0, cropW, cropH)
    diagLog('receipt-paper-crop', `${bmp.width}x${bmp.height} -> ${cropW}x${cropH}`)
    return canvas.convertToBlob({ type: 'image/png' })
  } catch (err) {
    diagError('receipt-paper-crop-fail', err)
    return blob
  } finally {
    bmp.close()
  }
}

// ── Per-cell OCR helpers ──────────────────────────────────────────────────────

async function cropToBlob(
  bitmap: ImageBitmap,
  x: number, y: number, w: number, h: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(Math.max(w, 1), Math.max(h, 1))
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, x, y, w, h, 0, 0, w, h)
  return canvas.convertToBlob({ type: 'image/png' })
}

async function recognizeTablePerCell(
  binaryBlob: Blob,
  imageWidth: number,
  imageHeight: number,
  lang: string,
  colBounds: number[],
  rowBounds: number[],
): Promise<string[][] | null> {
  if (typeof OffscreenCanvas === 'undefined') return null
  const bitmap = await createImageBitmap(binaryBlob)
  const colEdges = [0, ...colBounds, imageWidth]
  const rowEdges = rowBounds
  const grid: string[][] = []

  for (let r = 0; r < rowEdges.length - 1; r++) {
    const cy = rowEdges[r]
    const ch = rowEdges[r + 1] - cy
    if (ch < 4) continue
    const rowCells: string[] = []
    for (let c = 0; c < colEdges.length - 1; c++) {
      const cx = colEdges[c]
      const cw = colEdges[c + 1] - cx
      if (cw < 4) continue
      const cellBlob = await cropToBlob(bitmap, cx, cy, cw, ch)
      const result = await recognizePage(cellBlob, lang, { oem: 1, psm: 7 })
      rowCells.push((result.text ?? '').trim())
    }
    if (rowCells.length > 0) grid.push(rowCells)
  }

  bitmap.close()
  return grid.length >= 2 ? grid : null
}

function gridToExcel(grid: string[][], sheetName: string): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet(grid)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(buf)
}

// ── Line cropping for TrOCR ───────────────────────────────────────────────────

async function cropLinesToBlobs(
  binaryBlob: Blob,
  grayscaleBlob: Blob,
  lines: Array<{ x: number; y: number; w: number; h: number }>
): Promise<Blob[]> {
  if (lines.length === 0 || typeof OffscreenCanvas === 'undefined') return []
  // Binary bitmap used only for blank-line detection (clean 0/255 signal).
  // Grayscale bitmap is what TrOCR receives — preserves natural pixel distribution
  // that the model was trained on (binarized input causes hallucinations).
  const [binBmp, grayBmp] = await Promise.all([
    createImageBitmap(binaryBlob),
    createImageBitmap(grayscaleBlob),
  ])
  const imgW = binBmp.width
  const imgH = binBmp.height
  const blobs: Blob[] = []

  for (const { x, y, w, h } of lines) {
    if (w <= 0 || h <= 0) continue

    // Blank-line check on binary — raised to 1.5% to filter noise/pen-remnant crops
    // that cause TrOCR to hallucinate "000" or unrelated words.
    const check = new OffscreenCanvas(w, h)
    const checkCtx = check.getContext('2d')!
    checkCtx.drawImage(binBmp, x, y, w, h, 0, 0, w, h)
    const pixels = checkCtx.getImageData(0, 0, w, h).data
    let blackCount = 0
    for (let p = 0; p < pixels.length; p += 4) { if (pixels[p] < 128) blackCount++ }
    if (blackCount / (w * h) < 0.015) continue

    // Crop grayscale with horizontal padding (3% each side) for TrOCR input.
    // Tight crops starting at ink confuse encoder position embeddings on first/last chars.
    const hPad = Math.round(w * 0.03)
    const cropX = Math.max(0, x - hPad)
    const cropW = Math.min(imgW, x + w + hPad) - cropX
    const cropH = h
    const cropY = Math.max(0, Math.min(imgH - cropH, y))

    // Minimum height padding — TrOCR's ViT upscales very short crops poorly
    // (a 20px crop becomes 384px = 19× stretch, destroying character shapes).
    // Pad symmetrically with white to at least 64px instead of stretching.
    const MIN_CROP_H = 64
    const finalH = Math.max(cropH, MIN_CROP_H)
    const yOffset = Math.floor((finalH - cropH) / 2)

    const c = new OffscreenCanvas(cropW, finalH)
    const cCtx = c.getContext('2d')!
    cCtx.fillStyle = '#ffffff'
    cCtx.fillRect(0, 0, cropW, finalH)
    cCtx.drawImage(grayBmp, cropX, cropY, cropW, cropH, 0, yOffset, cropW, cropH)

    // Per-crop local contrast stretch — handles faded ink and shadows the global
    // CLAHE pass may have missed. Scan non-white pixels (< 240) for range; if
    // the spread is > 20 levels, stretch to full 0–255 so TrOCR sees clean ink.
    const imgData = cCtx.getImageData(0, 0, cropW, finalH)
    const px = imgData.data
    let lo = 255, hi = 0
    for (let p = 0; p < px.length; p += 4) {
      const v = px[p]
      if (v < 240) { if (v < lo) lo = v; if (v > hi) hi = v }
    }
    if (hi - lo > 20) {
      const range = hi - lo
      for (let p = 0; p < px.length; p += 4) {
        const s = Math.min(255, Math.round((px[p] - lo) / range * 255))
        px[p] = px[p + 1] = px[p + 2] = s
      }
      cCtx.putImageData(imgData, 0, 0)
    }

    blobs.push(await c.convertToBlob({ type: 'image/png' }))
  }

  binBmp.close()
  grayBmp.close()
  return blobs
}

// ── PSM mapping from handwritingStyle ────────────────────────────────────────

function psmForStyle(style: string): number {
  if (style === 'print') return 6   // uniform block of text
  return 3                           // auto (handles cursive / mixed layout)
}

// ── Structured output parsers ─────────────────────────────────────────────────

// Digit-context repair for structured modes — applied before regex parsing.
// Only substitutes within tokens that already look numeric (price/phone/date).
// Never uses dictionary correction on these modes.
function repairDigitTokens(text: string): string {
  // Curly braces never appear in receipts — always OCR misreads of parentheses
  text = text.replace(/\{/g, '(').replace(/\}/g, ')')
  // Fix letter↔digit confusions inside parenthesised groups like (8.5%) → (B.Sh)
  // S before h/% or before ) is almost always a misread 5 in numeric context.
  // h immediately before ) in a numeric group is almost always a misread %.
  text = text.replace(/\([^)]{1,10}\)/g, tok =>
    tok.replace(/B/g, '8')
       .replace(/S(?=[h%\d\)])/g, '5')
       .replace(/h(?=\))/g, '%')
  )
  // Fix standalone numeric-looking tokens
  return text.replace(/\b[\dOlSsBb]{2,}(?:[.,]\d{1,2})?\b/g, token =>
    token.replace(/O/g, '0').replace(/l/g, '1').replace(/S/g, '5').replace(/B/g, '8')
  )
}

function normalizeReceiptOcrText(text: string): string {
  return repairDigitTokens(text)
    .split('\n')
    .map(line => line
      .replace(/(^|[\s:])S(?=\s?\d{1,5}[.,]\d{2}\b)/g, '$1$')
      .replace(/\bT[O0]T[A4][!1IL]\b/gi, 'TOTAL')
      .replace(/\bSUB[ -]?T[O0]T[A4][!1IL]\b/gi, 'SUBTOTAL')
      .replace(/\bSUBTOTA[!1IL]\b/gi, 'SUBTOTAL')
      .replace(/\bT[A4]X\b/gi, 'TAX')
      .replace(/\b(?:TTL|TT1|TTL\.?)\s*SALE\b/gi, 'Ttl Sale')
      .replace(/\bAM[TR][\w!1IL]{0,5}\b(?=\s*:?\s*(?:[$₱€£]?\s*)?\d)/gi, 'Amt Due')
      .replace(/\bAMOUNT\s+DUE\b/gi, 'Amount Due')
      .replace(/\bB[A4]L[A4]NCE\b/gi, 'BALANCE')
      .replace(/\b[VY]IS[A4]\b/gi, 'VISA')
      .replace(/(\d)\s*,\s*(\d{2})(?!\d)/g, '$1.$2')
      .replace(/(\d),(?=\d{3}\b)/g, '$1,')
      .replace(/\((\d+(?:\.\d+)?)0X\)/gi, '($1%)')
      .replace(/\s{3,}/g, '  ')
      .trimEnd()
    )
    .filter(line => line.trim().length > 0 && !/^[|_\-—=~.,:;'\s]+$/.test(line))
    .join('\n')
}

function repairEmail(text: string): string {
  return text
    .replace(/(\S+)\s+at\s+(\S+\.\S+)/gi, '$1@$2')
    .replace(/(\.\w{1,4}),(\w{2,3})\b/g, '$1.$2')
}

const RECEIPT_AMOUNT_RE = /(?:([$₱€£])\s*|\b(PHP|EGP|USD)\s*)?-?\s*(\d{1,3}(?:[,\s]\d{3})*|\d{1,6})([.,]\d{2})(?!\d)/gi

function normalizeReceiptAmount(raw: string): { display: string; value: number } | null {
  const currency = raw.match(/[$₱€£]|\b(?:PHP|EGP|USD)\b/i)?.[0] ?? ''
  let numeric = raw
    .replace(/[$₱€£]/g, '')
    .replace(/\b(?:PHP|EGP|USD)\b/gi, '')
    .replace(/[^\d.,-]/g, '')

  const lastDot = numeric.lastIndexOf('.')
  const lastComma = numeric.lastIndexOf(',')
  if (lastComma > lastDot) {
    numeric = numeric.slice(0, lastComma).replace(/[.,]/g, '') + '.' + numeric.slice(lastComma + 1)
  } else {
    numeric = numeric.replace(/,/g, '')
  }

  const value = Number(numeric)
  if (!Number.isFinite(value) || value < 0.01) return null

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const prefix = currency
    ? currency === '$' || currency === '₱' || currency === '€' || currency === '£'
      ? currency
      : `${currency.toUpperCase()} `
    : ''
  return { display: `${prefix}${formatted}`, value }
}

function receiptAmountsInLine(line: string): Array<{ display: string; value: number; raw: string }> {
  return [...line.matchAll(RECEIPT_AMOUNT_RE)]
    .map(match => {
      const amount = normalizeReceiptAmount(match[0])
      return amount ? { ...amount, raw: match[0] } : null
    })
    .filter((amount): amount is { display: string; value: number; raw: string } => Boolean(amount))
}

function extractReceiptTotal(text: string): string {
  const lines = normalizeReceiptOcrText(text).split('\n')
  const candidates: Array<{ display: string; value: number; score: number }> = []
  const preferredLabel = /\b(?:grand\s*total|total\s*due|amount\s*due|amt\s*due|balance\s*due|total)\b/i
  const weakTotalLabel = /\b(?:due|balance|payment|card|visa|mastercard|amex|bdo)\b/i
  const excludedLabel = /\b(?:subtotal|sub\s*total|tax|vat|service|discount|change|cash|tender|paid|sale|sales|fee)\b/i

  lines.forEach((line, index) => {
    const amounts = receiptAmountsInLine(line)
    if (amounts.length === 0) return

    const lowerPosition = lines.length > 1 ? index / (lines.length - 1) : 1
    for (const amount of amounts) {
      let score = lowerPosition * 30
      if (preferredLabel.test(line)) score += 120
      else if (weakTotalLabel.test(line)) score += 45
      if (excludedLabel.test(line)) score -= 80
      if (/[~\-]\s*$/.test(line)) score -= 25
      if (amount.value >= 1) score += Math.min(35, Math.log10(amount.value + 1) * 14)
      candidates.push({ display: amount.display, value: amount.value, score })
    }
  })

  const labeled = candidates
    .filter(candidate => candidate.score >= 80)
    .sort((a, b) => b.score - a.score || b.value - a.value)
  if (labeled[0]) return labeled[0].display

  const lowerHalf = candidates
    .filter(candidate => candidate.score >= 15)
    .sort((a, b) => b.score - a.score || b.value - a.value)
  return lowerHalf[0]?.display ?? ''
}

function extractReceiptFields(text: string): { vendor: string; date: string; total: string } {
  text = normalizeReceiptOcrText(text)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const dateMatch = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/)
  const vendor = lines.slice(0, 12).find(line => {
    const alpha = (line.match(/[A-Za-z]/g) ?? []).length
    const total = line.replace(/\s/g, '').length
    if (total === 0 || alpha / total < 0.45) return false
    if (/\b(?:dine\s*in|subtotal|total|tax|receipt|invoice|check|server|table|ordered)\b/i.test(line)) return false
    if (receiptAmountsInLine(line).length > 0) return false
    return true
  })
  return {
    vendor: vendor ?? lines[0] ?? '',
    date: dateMatch?.[0] ?? '',
    total: extractReceiptTotal(text),
  }
}

function parseReceiptText(text: string, filename: string): string {
  text = normalizeReceiptOcrText(text)
  const { vendor, date, total } = extractReceiptFields(text)
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [
    'Field,Value',
    `Filename,${esc(filename)}`,
    `Vendor,${esc(vendor)}`,
    `Date,${esc(date)}`,
    `Total,${esc(total)}`,
    `Raw Text,${esc(text.trim())}`,
  ].join('\n')
}

function formatReceiptAsText(text: string): string {
  text = normalizeReceiptOcrText(text)
  const { vendor, date, total } = extractReceiptFields(text)
  const divider = '─'.repeat(32)
  const header = [
    vendor ? `Vendor: ${vendor}` : null,
    date   ? `Date:   ${date}` : null,
    total  ? `Total:  ${total}` : null,
  ].filter(Boolean).join('\n')
  return `${header}\n\n${divider}\n${text.trim()}\n${divider}`
}

function parseBusinessCardText(text: string, filename: string): string {
  text = repairDigitTokens(repairEmail(text))
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

// Spatially reconstruct a table grid from word bounding boxes.
// Returns a 2D array (rows × cols) of cell strings.
function parseTableFromWords(words: OcrWordMeta[], forcedColBoundaries?: number[]): string[][] {
  // Strip pipe characters that OCR reads from table gridlines; skip pipe-only words.
  const cleanWord = (t: string) => t.replace(/\|/g, '').trim()
  const boxed = words.filter(w => w.bbox && cleanWord(w.text).length > 0)
  if (boxed.length === 0) return []

  // Median word height — unit for all spatial tolerances
  const heights = boxed.map(w => w.bbox!.y1 - w.bbox!.y0).sort((a, b) => a - b)
  const medianH = heights[Math.floor(heights.length / 2)]

  // Column separator threshold: must be larger than normal in-cell word spacing
  // (≈ 0.5 × charH) so words within a merged cell (e.g. "Hard Floor Results")
  // don't vote for column boundaries between themselves.
  const minGapPx = Math.max(12, medianH * 1.5)
  const clusterTol = medianH * 1.0

  // Group into row bands by Y-center (avoids cascading merges from y1 drift)
  const byCenter = [...boxed].sort((a, b) =>
    (a.bbox!.y0 + a.bbox!.y1) / 2 - (b.bbox!.y0 + b.bbox!.y1) / 2
  )
  const bands: OcrWordMeta[][] = []
  let lastCenterY = -Infinity
  for (const w of byCenter) {
    const cy = (w.bbox!.y0 + w.bbox!.y1) / 2
    if (cy > lastCenterY + medianH * 0.6) {
      bands.push([w])
      lastCenterY = cy
    } else {
      bands[bands.length - 1].push(w)
    }
  }
  for (const band of bands) band.sort((a, b) => a.bbox!.x0 - b.bbox!.x0)

  // If pixel-level detection already found column boundaries, use them directly.
  // Otherwise, fall back to word-gap voting.
  let colBoundaries: number[]
  if (forcedColBoundaries && forcedColBoundaries.length > 0) {
    colBoundaries = [...forcedColBoundaries].sort((a, b) => a - b)
  } else {
    // Vote on column boundaries: each row contributes the midpoint of every gap ≥ minGapPx.
    // Spanning header words (small in-cell gaps < minGapPx) cast no votes,
    // so they never create spurious column boundaries.
    const gapXs: number[] = []
    for (const band of bands) {
      for (let i = 0; i < band.length - 1; i++) {
        const gapW = band[i + 1].bbox!.x0 - band[i].bbox!.x1
        if (gapW >= minGapPx) {
          gapXs.push((band[i].bbox!.x1 + band[i + 1].bbox!.x0) / 2)
        }
      }
    }
    gapXs.sort((a, b) => a - b)

    const clusters: { x: number; count: number }[] = []
    for (const gx of gapXs) {
      const last = clusters[clusters.length - 1]
      if (last && gx - last.x <= clusterTol) {
        last.x = (last.x * last.count + gx) / (last.count + 1)
        last.count++
      } else {
        clusters.push({ x: gx, count: 1 })
      }
    }

    const minVotes = Math.max(2, Math.floor(bands.length * 0.2))
    colBoundaries = clusters
      .filter(c => c.count >= minVotes)
      .map(c => c.x)
      .sort((a, b) => a - b)
  }

  const numCols = colBoundaries.length + 1

  // Build grid. Key: if the gap from the previous word is < minGapPx, the word
  // stays in the same active cell even if a column boundary lies between them.
  // This keeps "Hard Floor Results" as one cell rather than splitting across 3 columns.
  return bands.map(band => {
    const row = Array<string>(numCols).fill('')
    let cellCol = 0
    for (let i = 0; i < band.length; i++) {
      const w = band[i]
      const text = cleanWord(w.text)
      if (!text) continue
      const gap = i === 0 ? Infinity : w.bbox!.x0 - band[i - 1].bbox!.x1
      if (gap >= minGapPx) {
        // Large gap → word starts a new cell at the column its x0 falls in
        cellCol = Math.min(colBoundaries.filter(b => b <= w.bbox!.x0).length, numCols - 1)
      }
      // Small gap → append to current cell (cellCol unchanged)
      row[cellCol] = row[cellCol] ? row[cellCol] + ' ' + text : text
    }
    return row
  })
}

function parseTableText(text: string, words?: OcrWordMeta[], forcedColBoundaries?: number[]): string {
  const grid = words && words.some(w => w.bbox)
    ? parseTableFromWords(words, forcedColBoundaries)
    : text.split('\n')
        .map(line => line.split(/\t|  +/).map(cell => cell.trim()))
        .filter(row => row.some(cell => cell.length > 0))
  return grid.map(row =>
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n')
}

function parseToExcel(text: string, sheetName: string, words?: OcrWordMeta[], forcedColBoundaries?: number[]): Uint8Array {
  const rows = words && words.some(w => w.bbox)
    ? parseTableFromWords(words, forcedColBoundaries)
    : text.split('\n')
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
  | 'json'

export async function imageOcrConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  const lang = typeof opts.language === 'string' ? opts.language : 'eng'
  const mode = (opts.outputMode as OcrMode | undefined) ?? 'text'
  const engine = (opts.recognitionEngine as string | undefined) ?? 'standard'
  const preprocessingMode = (opts.preprocessingMode as string | undefined) ?? 'document'
  const useScreenshotPath = preprocessingMode === 'screenshot'
  const style = (opts.handwritingStyle as string | undefined) ?? 'mixed'
  const quality = (opts.qualityMode as string | undefined) !== 'fast'
  const receiptModeRequested = mode === 'receipt-csv'
  // iOS Safari (WKWebView) kills the tab when Florence-2 (~262 MB) finishes
  // loading — confirmed via ?debug=1: both sessions die at model-ready, before
  // inference runs. Skip AI models on iOS and fall back to Tesseract.
  const iosDetected =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    /WebKit/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)
  const useAi = engine === 'ai-enhanced' && lang === 'eng' && !iosDetected
  if (iosDetected && engine === 'ai-enhanced') {
    diagLog(
      'ai-mode-skipped',
      receiptModeRequested
        ? 'iOS Safari — routing receipts to mobile OCR to avoid OOM'
        : 'iOS Safari — routing to Tesseract to avoid OOM'
    )
  }
  const isPng = (f: File) => f.type === 'image/png' || /\.png$/i.test(f.name)

  const results: ConversionResult[] = []
  const combinedParts: string[] = []
  const combinedWords: OcrWordMeta[][] = []

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 5)
    const file = files[i]
    diagLog('file-received', `${file.name} type=${file.type} size=${file.size}`)

    try {
      let blob: Blob = file
      const receiptMode = mode === 'receipt-csv'
      const receiptMinWidth = receiptMode && iosDetected ? 1800 : 2500
      const receiptAllowRetry = !(receiptMode && iosDetected)
      let originalReceiptBlob: Blob | null = null

      if (isHeic(file) || await hasHeicMagicBytes(file)) {
        onProgress?.(i, 10)
        diagLog('heic-decode-start', file.name)
        blob = await decodeHeic(file)
        diagLog('heic-decode-done')
      }

      if (isPng(file)) {
        onProgress?.(i, 15)
        blob = await compositePng(blob)
      }

      if (receiptMode) {
        onProgress?.(i, 17)
        originalReceiptBlob = blob
        const croppedBlob = await cropLikelyReceiptPaper(blob)
        if (croppedBlob !== blob) blob = croppedBlob
      }

      let text = ''
      let confidence = 0
      let pageWords: OcrWordMeta[] = []
      let binaryPreprocessed: Blob | undefined

      if (useAi) {
        onProgress?.(i, 20)
        diagLog('ai-mode-preprocess-start')
        diagMemory('before-preprocess')
        const { binary: binBlob, grayscale: grayBlob } = await preprocessForOcrDual(
          blob,
          receiptMode ? receiptMinWidth : undefined
        )
        diagLog('ai-mode-preprocess-done')
        let trocrLines: TrOcrLineResult[] | null = null

        let usedFlorence = false
        try {
          diagLog('florence-stage-start')
          diagMemory('before-florence')
          const { recognizeWithFlorenceOcr } = await import('@/lib/ocr/florence-ocr-client')
          onProgress?.(i, 22)
          const florenceText = await recognizeWithFlorenceOcr(
            grayBlob,
            file.name,
            p => onProgress?.(i, 22 + Math.round(p * 0.35))
          )
          if (florenceText.trim()) {
            text = florenceText
            confidence = 90
            pageWords = florenceText.split(/\s+/).filter(Boolean).map(w => ({
              text: w,
              confidence: -1 as const,
            }))
            usedFlorence = true
            diagLog('florence-stage-done', `chars=${text.length}`)
          } else {
            console.warn('[Florence-2] Empty OCR result — falling back to TrOCR')
            diagLog('florence-stage-empty', 'falling back to TrOCR')
          }
        } catch (florenceErr) {
          diagError('florence-stage-fail', florenceErr)
          console.warn('[Florence-2] OCR failed, falling back to TrOCR:', florenceErr)
        }

        if (!usedFlorence) {
          try {
            diagLog('trocr-stage-start')
            diagMemory('before-trocr')
            const { recognizeWithTrOCR } = await import('@/lib/ocr/trocr-client')
            onProgress?.(i, 57)
            const lineBoxes = await detectLines(binBlob)
            onProgress?.(i, 62)
            const lineBlobs = await cropLinesToBlobs(binBlob, grayBlob, lineBoxes)
            const { text: aiText, lines: aiLines } = await recognizeWithTrOCR(
              lineBlobs,
              p => onProgress?.(i, 62 + Math.round(p * 0.25)),
              quality
            )
            trocrLines = aiLines
            text = aiText
            confidence = aiLines.length > 0
              ? Math.round(aiLines.reduce((s, l) => s + l.confidence, 0) / aiLines.length * 100)
              : 0

            pageWords = aiLines.flatMap(l =>
              l.text.split(/\s+/).filter(Boolean).map(w => ({
                text: w,
                confidence: -1 as const,
              }))
            )

            let usedTesseractFallback = false
            if (!text.trim()) {
              console.warn('[TrOCR] No text extracted from line crops — falling back to Tesseract')
              onProgress?.(i, 80)
              const fallback = receiptMode
                ? await recognizeReceiptPage(binBlob, lang, receiptAllowRetry)
                : await recognizePage(binBlob, lang, { oem: 1, psm: psmForStyle(style) })
              text = fallback.text
              confidence = fallback.confidence
              pageWords = toOcrWordMeta(fallback)
              usedTesseractFallback = true
            }

            if (mode === 'json' && !usedTesseractFallback) {
              onProgress?.(i, 90)
              const baseName = file.name.replace(/\.[^.]+$/, '')
              const jsonContent = JSON.stringify(
                {
                  lines: aiLines.map(l => ({
                    text: l.text,
                    confidence: l.confidence,
                    flagged: l.confidence < 0.7,
                  })),
                },
                null,
                2
              )
              results.push(new File([jsonContent], `${baseName}.json`, { type: 'application/json' }))
              onProgress?.(i, 100)
              continue
            }
          } catch (trocErr) {
            diagError('trocr-stage-fail', trocErr)
            console.warn('[TrOCR] Model unavailable, falling back to Tesseract:', trocErr)
            onProgress?.(i, 65)
            const result = receiptMode
              ? await recognizeReceiptPage(binBlob, lang, receiptAllowRetry)
              : await recognizePage(binBlob, lang, { oem: 1, psm: psmForStyle(style) })
            ;({ text, confidence } = result)
            pageWords = toOcrWordMeta(result)
          }
        }

        if (mode === 'json' && trocrLines) {
          onProgress?.(i, 90)
          const baseName = file.name.replace(/\.[^.]+$/, '')
          const jsonContent = JSON.stringify(
            {
              lines: trocrLines.map(l => ({
                text: l.text,
                confidence: l.confidence,
                flagged: l.confidence < 0.7,
              })),
            },
            null,
            2
          )
          results.push(new File([jsonContent], `${baseName}.json`, { type: 'application/json' }))
          onProgress?.(i, 100)
          continue
        }

        if (receiptMode) {
          try {
            onProgress?.(i, 84)
            const receiptResult = await recognizeReceiptPage(binBlob, lang)
            let bestResult = receiptResult
            let bestScore = scoreReceiptOcr(receiptResult.text, receiptResult.confidence)

            if (!iosDetected && originalReceiptBlob && originalReceiptBlob !== blob) {
              const originalBinary = await preprocessForOcr(originalReceiptBlob, receiptMinWidth)
              const originalResult = await recognizeReceiptPage(originalBinary, lang, receiptAllowRetry)
              const originalScore = scoreReceiptOcr(originalResult.text, originalResult.confidence)
              if (originalScore > bestScore) {
                bestResult = originalResult
                bestScore = originalScore
              }
            }

            const aiScore = scoreReceiptOcr(text, confidence)
            if (bestScore > aiScore) {
              diagLog('receipt-ocr-selected', `local=${bestScore.toFixed(1)} ai=${aiScore.toFixed(1)}`)
              text = bestResult.text
              confidence = bestResult.confidence
              pageWords = toOcrWordMeta(bestResult)
            } else {
              diagLog('receipt-ai-selected', `ai=${aiScore.toFixed(1)} local=${bestScore.toFixed(1)}`)
            }
          } catch (receiptVerifyErr) {
            diagError('receipt-ocr-verify-fail', receiptVerifyErr)
          }
        }
      } else {
        // Standard path: preprocess → Tesseract with OEM/PSM tuning
        onProgress?.(i, 20)
        binaryPreprocessed = useScreenshotPath
          ? await preprocessForScreenshot(blob)
          : await preprocessForOcr(blob, receiptMode ? receiptMinWidth : undefined)
        onProgress?.(i, 30)
        const tableMode = mode === 'excel' || mode === 'table-csv'
        let result = receiptMode
          ? await recognizeReceiptPage(binaryPreprocessed, lang, receiptAllowRetry)
          : await recognizePage(binaryPreprocessed, lang, {
              oem: 1,
              psm: tableMode ? 6 : (useScreenshotPath ? 6 : psmForStyle(style)),
            });
        if (receiptMode && !iosDetected && originalReceiptBlob && originalReceiptBlob !== blob) {
          const originalBinary = await preprocessForOcr(originalReceiptBlob, receiptMinWidth)
          const originalResult = await recognizeReceiptPage(originalBinary, lang, receiptAllowRetry)
          if (
            scoreReceiptOcr(originalResult.text, originalResult.confidence) >
            scoreReceiptOcr(result.text, result.confidence)
          ) {
            result = originalResult
          }
        }
        ({ text, confidence } = result)
        pageWords = toOcrWordMeta(result)
      }

      // For table/excel modes: AI engines (Florence, TrOCR) produce no bbox data,
      // so spatial grid reconstruction never runs. Run a Tesseract pass here to
      // get word positions — Tesseract always returns bboxes regardless of engine.
      if (useAi && (mode === 'excel' || mode === 'table-csv')) {
        try {
          const layoutBlob = await preprocessForOcr(blob)
          const layoutResult = await recognizePage(layoutBlob, lang, { oem: 1, psm: 6 })
          const rawLayout = layoutResult.words ?? []
          if (rawLayout.some(w => w.bbox)) {
            pageWords = rawLayout.map(w => ({
              text: w.text, confidence: w.confidence, bbox: w.bbox, lineIndex: w.lineIndex,
            }))
          }
        } catch (layoutErr) {
          console.warn('[image-to-excel] Tesseract layout pass failed, using AI words:', layoutErr)
        }
      }

      // Detect column boundaries from image pixels for table/excel modes.
      // Tries Hough gridline detection first, then vertical projection profile.
      // If neither finds signal, parseTableFromWords uses word-gap voting.
      let detectedColBoundaries: number[] | undefined
      let perCellGrid: string[][] | null = null
      if (mode === 'excel' || mode === 'table-csv') {
        try {
          const layoutBlobForCols = useAi
            ? await preprocessForOcr(blob)
            : (binaryPreprocessed ?? await preprocessForOcr(blob))
          const bmp = await createImageBitmap(layoutBlobForCols)
          const W = bmp.width
          const H = bmp.height
          bmp.close()
          const cols = await detectColumnBoundaries(layoutBlobForCols, W, H)
          if (cols) detectedColBoundaries = cols

          // Attempt per-cell OCR: detect row boundaries → crop + OCR each cell
          const rows = await detectRowBoundaries(layoutBlobForCols, W, H)
          if (cols && rows) {
            const grid = await recognizeTablePerCell(layoutBlobForCols, W, H, lang, cols, rows)
            if (grid) perCellGrid = grid
          }
        } catch (colErr) {
          console.warn('[column-detector] Detection failed, using word-gap voting:', colErr)
        }
      }

      const { normalizeOcrText } = await import('@/lib/ocr/florence-ocr-client')
      text = normalizeOcrText(text)
      if (receiptMode) text = normalizeReceiptOcrText(text)

      onProgress?.(i, 90)

      // Apply dictionary correction for English text-output modes
      const doCorrect = opts.autoCorrect === true
        && lang === 'eng'
        && (mode === 'text' || mode === 'markdown' || mode === 'combined')
      if (doCorrect && pageWords.length > 0) {
        try {
          pageWords = await correctWords(pageWords, useAi)
          // Rebuild text from corrected words, preserving line structure
          const lines = text.split('\n')
          let wi = 0
          text = lines.map(line => {
            const tokens = line.split(/(\s+)/)
            return tokens.map(token => {
              if (/^\s+$/.test(token) || token === '') return token
              const corrected = pageWords[wi]?.corrected ?? pageWords[wi]?.text ?? token
              wi++
              return corrected
            }).join('')
          }).join('\n')
        } catch (corrErr) {
          console.warn('[correction] Correction failed, using raw OCR output:', corrErr)
        }
      }

      const baseName = file.name.replace(/\.[^.]+$/, '')
      let outFile: File

      // Helper: build OcrResultMeta for text-output modes
      const makeOcrMeta = (previewText = text, words = pageWords): OcrResultMeta => ({
        kind: 'ocr',
        words,
        lines: previewText.split('\n').filter(l => l.trim().length > 0),
        sourceIndex: i,
      })

      switch (mode) {
        case 'markdown': {
          const mdContent = `# ${baseName}\n\nConfidence: ${confidence!.toFixed(0)}%\n\n${text.trim()}`
          outFile = new File([mdContent], `${baseName}.md`, { type: 'text/markdown' })
          results.push({ file: outFile, ocrMeta: makeOcrMeta() })
          onProgress?.(i, 100)
          continue
        }
        case 'receipt-csv': {
          const fmt = (opts.receiptFormat as string | undefined) ?? 'txt'
          let previewText: string
          if (fmt === 'csv') {
            const csv = parseReceiptText(text, file.name)
            previewText = csv
            outFile = new File([csv], `${baseName}-receipt.csv`, { type: 'text/csv' })
          } else {
            const formatted = formatReceiptAsText(text)
            previewText = formatted
            outFile = new File([formatted], `${baseName}-receipt.txt`, { type: 'text/plain' })
          }
          results.push({ file: outFile, ocrMeta: makeOcrMeta(previewText, []) })
          onProgress?.(i, 100)
          continue
        }
        case 'card-csv': {
          const header = i === 0 ? 'filename,name,company,email,phone,url,raw_text\n' : ''
          const row = parseBusinessCardText(text, file.name)
          const csv = header + row + '\n'
          outFile = new File([csv], `${baseName}-contact.csv`, { type: 'text/csv' })
          break
        }
        case 'table-csv': {
          const csv = perCellGrid
            ? perCellGrid.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
            : parseTableText(text, pageWords, detectedColBoundaries)
          outFile = new File([csv], `${baseName}.csv`, { type: 'text/csv' })
          break
        }
        case 'excel': {
          const xlsxBytes = perCellGrid
            ? gridToExcel(perCellGrid, baseName)
            : parseToExcel(text, baseName, pageWords, detectedColBoundaries)
          outFile = new File([xlsxBytes as unknown as Uint8Array<ArrayBuffer>], `${baseName}.xlsx`, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          break
        }
        case 'json': {
          // Standard mode: single-line envelope matching AI path schema for consistent parsing
          const jsonContent = JSON.stringify(
            {
              lines: pageWords.length > 0
                ? pageWords.map(w => ({
                    text: w.text,
                    ...(w.corrected ? { corrected: w.corrected } : {}),
                    confidence: Math.round(w.confidence),
                    flagged: w.confidence !== -1 && w.confidence < 70,
                  }))
                : [{
                    text: text.trim(),
                    confidence: Math.round(confidence! / 100 * 10) / 10,
                    flagged: confidence! < 70,
                  }],
            },
            null,
            2
          )
          outFile = new File([jsonContent], `${baseName}.json`, { type: 'application/json' })
          break
        }
        case 'combined': {
          combinedParts.push(`=== ${file.name} ===\n${text.trim()}`)
          combinedWords.push(pageWords)
          onProgress?.(i, 100)
          results.push(new File([''], `${file.name}.placeholder`))
          continue
        }
        default: {
          outFile = new File([text.trim()], `${baseName}.txt`, { type: 'text/plain' })
          results.push({ file: outFile, ocrMeta: makeOcrMeta() })
          onProgress?.(i, 100)
          continue
        }
      }

      results.push(outFile)
      onProgress?.(i, 100)
    } catch (err) {
      diagError('image-ocr-outer-catch', err)
      onProgress?.(i, 100)
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  if (mode === 'combined' && combinedParts.length > 0) {
    const merged = combinedParts.join('\n\n---\n\n')
    const combinedFile = new File([merged], 'extracted-text.txt', { type: 'text/plain' })
    const allWords = combinedWords.flat()
    const combinedResult: ConversionResult = {
      file: combinedFile,
      ocrMeta: {
        kind: 'ocr',
        words: allWords,
        lines: merged.split('\n').filter(l => l.trim().length > 0),
        sourceIndex: 0,
      },
    }
    return results.map((r, i) => {
      if (r instanceof File && r.name.endsWith('.placeholder')) {
        return i === 0 ? combinedResult : new File([''], 'combined-in-first-file.skip')
      }
      return r
    })
  }

  await terminateOcrWorker().catch(() => {})
  return results
}
