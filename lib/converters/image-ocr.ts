import { recognizePage, terminateOcrWorker } from '@/lib/ocr/tesseract-client'
import { preprocessForOcr, preprocessForOcrDual } from '@/lib/ocr/preprocessing'
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

function repairEmail(text: string): string {
  return text
    .replace(/(\S+)\s+at\s+(\S+\.\S+)/gi, '$1@$2')
    .replace(/(\.\w{1,4}),(\w{2,3})\b/g, '$1.$2')
}

function extractReceiptTotal(text: string): string {
  // Scan lines in reverse — the grand total is usually near the bottom.
  // Prefer a line containing "total" but NOT "subtotal".
  for (const line of text.split('\n').reverse()) {
    if (/\btotal\b/i.test(line) && !/subtotal/i.test(line)) {
      const m = line.match(/\$[\d,]+\.\d{2}/)
      if (m) return m[0]
    }
  }
  // Fallback: any labeled amount (amount due, balance, sum)
  const labeled = text.match(/(?:amount\s*due|balance\s*due|amount|due|sum)[^\d$]*(\$[\d,]+\.\d{2})/i)
  if (labeled) return labeled[1]
  // Last resort: last dollar figure in the document
  const all = text.match(/\$[\d,]+\.\d{2}/g)
  return all?.[all.length - 1] ?? ''
}

function extractReceiptFields(text: string): { vendor: string; date: string; total: string } {
  text = repairDigitTokens(text)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const dateMatch = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/)
  return {
    vendor: lines[0] ?? '',
    date: dateMatch?.[0] ?? '',
    total: extractReceiptTotal(text),
  }
}

function parseReceiptText(text: string, filename: string): string {
  text = repairDigitTokens(text)
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
  text = repairDigitTokens(text)
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
  const style = (opts.handwritingStyle as string | undefined) ?? 'mixed'
  const quality = (opts.qualityMode as string | undefined) !== 'fast'
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
    diagLog('ai-mode-skipped', 'iOS Safari — routing to Tesseract to avoid OOM')
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

      if (isHeic(file)) {
        onProgress?.(i, 10)
        diagLog('heic-decode-start', file.name)
        blob = await decodeHeic(file)
        diagLog('heic-decode-done')
      }

      if (isPng(file)) {
        onProgress?.(i, 15)
        blob = await compositePng(blob)
      }

      let text = ''
      let confidence = 0
      let pageWords: OcrWordMeta[] = []
      let binaryPreprocessed: Blob | undefined

      if (useAi) {
        onProgress?.(i, 20)
        diagLog('ai-mode-preprocess-start')
        diagMemory('before-preprocess')
        const { binary: binBlob, grayscale: grayBlob } = await preprocessForOcrDual(blob)
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
              const fallback = await recognizePage(binBlob, lang, { oem: 1, psm: psmForStyle(style) })
              text = fallback.text
              confidence = fallback.confidence
              const rawWords = fallback.words ?? []
              pageWords = rawWords.length > 5000
                ? rawWords.map(w => ({ text: w.text, confidence: w.confidence, lineIndex: w.lineIndex }))
                : rawWords.map(w => ({ text: w.text, confidence: w.confidence, bbox: w.bbox, lineIndex: w.lineIndex }))
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
            const result = await recognizePage(binBlob, lang, { oem: 1, psm: psmForStyle(style) })
            ;({ text, confidence } = result)
            const rawWords = result.words ?? []
            pageWords = rawWords.length > 5000
              ? rawWords.map(w => ({ text: w.text, confidence: w.confidence, lineIndex: w.lineIndex }))
              : rawWords.map(w => ({ text: w.text, confidence: w.confidence, bbox: w.bbox, lineIndex: w.lineIndex }))
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
      } else {
        // Standard path: preprocess → Tesseract with OEM/PSM tuning
        onProgress?.(i, 20)
        binaryPreprocessed = await preprocessForOcr(blob, mode === 'receipt-csv' ? 2500 : undefined)
        onProgress?.(i, 30)
        const tableMode = mode === 'excel' || mode === 'table-csv'
        const receiptMode = mode === 'receipt-csv'
        const result = await recognizePage(binaryPreprocessed, lang, {
          oem: 1,
          psm: tableMode ? 6 : receiptMode ? 4 : psmForStyle(style),
          ...(receiptMode ? { dpi: 300, preserveSpaces: true } : {}),
        });
        ({ text, confidence } = result)
        // Collect word metadata; drop bboxes above 5000-word threshold to cap memory
        const rawWords = result.words ?? []
        pageWords = rawWords.length > 5000
          ? rawWords.map(w => ({ text: w.text, confidence: w.confidence, lineIndex: w.lineIndex }))
          : rawWords.map(w => ({ text: w.text, confidence: w.confidence, bbox: w.bbox, lineIndex: w.lineIndex }))
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
      const makeOcrMeta = (): OcrResultMeta => ({
        kind: 'ocr',
        words: pageWords,
        lines: text.split('\n').filter(l => l.trim().length > 0),
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
          if (fmt === 'csv') {
            const csv = parseReceiptText(text, file.name)
            outFile = new File([csv], `${baseName}-receipt.csv`, { type: 'text/csv' })
          } else {
            const formatted = formatReceiptAsText(text)
            outFile = new File([formatted], `${baseName}-receipt.txt`, { type: 'text/plain' })
          }
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
