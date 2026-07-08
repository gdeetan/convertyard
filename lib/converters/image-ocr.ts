import { recognizePage, terminateOcrWorker } from '@/lib/ocr/tesseract-client'
import { preprocessForOcr, preprocessForOcrDual } from '@/lib/ocr/preprocessing'
import { recognizeWithTrOCR } from '@/lib/ocr/trocr-client'
import { normalizeOcrText, recognizeWithFlorenceOcr } from '@/lib/ocr/florence-ocr-client'
import { detectLines } from '@/lib/ocr/line-detector'
import { correctWords } from '@/lib/ocr/correction-client'
import type { ConversionResult, OcrWordMeta, OcrResultMeta, ToolOptions } from '@/lib/types'
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
  return text.replace(/\b[\dOlSsBb]{2,}(?:[.,]\d{1,2})?\b/g, token =>
    token.replace(/O/g, '0').replace(/l/g, '1').replace(/S/g, '5').replace(/B/g, '8')
  )
}

function repairEmail(text: string): string {
  return text
    .replace(/(\S+)\s+at\s+(\S+\.\S+)/gi, '$1@$2')
    .replace(/(\.\w{1,4}),(\w{2,3})\b/g, '$1.$2')
}

function parseReceiptText(text: string, filename: string): string {
  text = repairDigitTokens(text)
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
function parseTableFromWords(words: OcrWordMeta[]): string[][] {
  const cleanWord = (t: string) => t.replace(/\|/g, '').trim()
  const boxed = words.filter(w => w.bbox && cleanWord(w.text).length > 0)
  if (boxed.length === 0) return []

  const heights = boxed.map(w => w.bbox!.y1 - w.bbox!.y0).sort((a, b) => a - b)
  const medianH = heights[Math.floor(heights.length / 2)]

  // Row grouping: prefer Tesseract's own lineIndex (accurate, no tuning needed).
  // Fall back to Y-center clustering when lineIndex is absent (AI/TrOCR paths).
  let bands: OcrWordMeta[][]
  if (boxed.some(w => w.lineIndex !== undefined)) {
    const lineMap = new Map<number, OcrWordMeta[]>()
    for (const w of boxed) {
      const li = w.lineIndex!
      if (!lineMap.has(li)) lineMap.set(li, [])
      lineMap.get(li)!.push(w)
    }
    bands = [...lineMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, ws]) => ws.sort((a, b) => a.bbox!.x0 - b.bbox!.x0))
  } else {
    const byCenter = [...boxed].sort((a, b) =>
      (a.bbox!.y0 + a.bbox!.y1) / 2 - (b.bbox!.y0 + b.bbox!.y1) / 2
    )
    bands = []
    let lastCY = -Infinity
    for (const w of byCenter) {
      const cy = (w.bbox!.y0 + w.bbox!.y1) / 2
      if (cy > lastCY + medianH * 0.6) { bands.push([]); lastCY = cy }
      bands[bands.length - 1].push(w)
    }
    for (const b of bands) b.sort((a, b) => a.bbox!.x0 - b.bbox!.x0)
  }

  // Per-row bimodal gap threshold.
  // Sort each row's inter-word gaps; find the biggest absolute jump in the sorted list.
  // If that jump is ≥ 30% of the max gap, the row has two distinct modes
  // (in-cell word spaces vs. column separator gaps) and the threshold sits at the jump.
  // If the distribution is unimodal (all gaps similar — e.g. a sub-header row where
  // every word is its own column), threshold = 0 so every gap counts as a separator.
  function rowThreshold(band: OcrWordMeta[]): number {
    if (band.length < 2) return Infinity
    const gaps = band.slice(0, -1)
      .map((w, i) => band[i + 1].bbox!.x0 - w.bbox!.x1)
      .filter(g => g >= 0)
    if (gaps.length === 0) return Infinity
    const s = [...gaps].sort((a, b) => a - b)
    const maxG = s[s.length - 1]
    if (maxG <= 0) return 0
    let bigJump = 0, ji = 1
    for (let i = 1; i < s.length; i++) {
      const j = s[i] - s[i - 1]
      if (j > bigJump) { bigJump = j; ji = i }
    }
    if (bigJump / maxG < 0.3) return 0   // unimodal → all gaps are column separators
    return (s[ji - 1] + s[ji]) / 2       // bimodal → threshold at midpoint of jump
  }

  // Vote on column boundaries: each row contributes gap midpoints for gaps ≥ its threshold.
  const gapMids: number[] = []
  for (const band of bands) {
    const thresh = rowThreshold(band)
    for (let i = 1; i < band.length; i++) {
      const gap = band[i].bbox!.x0 - band[i - 1].bbox!.x1
      if (gap >= thresh) {
        gapMids.push((band[i - 1].bbox!.x1 + band[i].bbox!.x0) / 2)
      }
    }
  }
  gapMids.sort((a, b) => a - b)

  const clusterTol = medianH * 1.0
  const clusters: { x: number; count: number }[] = []
  for (const gx of gapMids) {
    const last = clusters[clusters.length - 1]
    if (last && gx - last.x <= clusterTol) {
      last.x = (last.x * last.count + gx) / (last.count + 1)
      last.count++
    } else {
      clusters.push({ x: gx, count: 1 })
    }
  }

  const minVotes = Math.max(2, Math.floor(bands.length * 0.2))
  const colBoundaries = clusters
    .filter(c => c.count >= minVotes)
    .map(c => c.x)
    .sort((a, b) => a - b)

  const numCols = colBoundaries.length + 1

  // Build grid using per-row threshold for cell splitting.
  // Words separated by a gap < threshold share a cell even if a column boundary
  // lies between their x0 positions (handles merged/spanning header cells).
  return bands.map(band => {
    const row = Array<string>(numCols).fill('')
    const thresh = rowThreshold(band)
    let cellCol = 0
    for (let i = 0; i < band.length; i++) {
      const w = band[i]
      const text = cleanWord(w.text)
      if (!text) continue
      const gap = i === 0 ? Infinity : w.bbox!.x0 - band[i - 1].bbox!.x1
      if (gap >= thresh) {
        cellCol = Math.min(colBoundaries.filter(b => b <= w.bbox!.x0).length, numCols - 1)
      }
      row[cellCol] = row[cellCol] ? row[cellCol] + ' ' + text : text
    }
    return row
  })
}

function parseTableText(text: string, words?: OcrWordMeta[]): string {
  const grid = words && words.some(w => w.bbox)
    ? parseTableFromWords(words)
    : text.split('\n')
        .map(line => line.split(/\t|  +/).map(cell => cell.trim()))
        .filter(row => row.some(cell => cell.length > 0))
  return grid.map(row =>
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n')
}

function parseToExcel(text: string, sheetName: string, words?: OcrWordMeta[]): Uint8Array {
  const rows = words && words.some(w => w.bbox)
    ? parseTableFromWords(words)
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
  const useAi = engine === 'ai-enhanced' && lang === 'eng'
  const isPng = (f: File) => f.type === 'image/png' || /\.png$/i.test(f.name)

  const results: ConversionResult[] = []
  const combinedParts: string[] = []
  const combinedWords: OcrWordMeta[][] = []

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

      let text = ''
      let confidence = 0
      let pageWords: OcrWordMeta[] = []

      if (useAi) {
        onProgress?.(i, 20)
        const { binary: binBlob, grayscale: grayBlob } = await preprocessForOcrDual(blob)

        // Primary: Florence-2 full-page OCR — handles decorated/colored backgrounds
        // without needing line segmentation. Falls back to TrOCR if empty.
        let usedFlorence = false
        try {
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
          } else {
            console.warn('[Florence-2] Empty OCR result — falling back to TrOCR')
          }
        } catch (florenceErr) {
          console.warn('[Florence-2] OCR failed, falling back to TrOCR:', florenceErr)
        }

        if (!usedFlorence) {
          // TrOCR line-by-line pipeline
          try {
            onProgress?.(i, 57)
            const lineBoxes = await detectLines(binBlob)
            onProgress?.(i, 62)
            const lineBlobs = await cropLinesToBlobs(binBlob, grayBlob, lineBoxes)
            const { text: aiText, lines: aiLines } = await recognizeWithTrOCR(
              lineBlobs,
              p => onProgress?.(i, 62 + Math.round(p * 0.25)),
              quality
            )
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
              continue // json in AI mode: emitted above — skip shared switch
            }
          } catch (trocErr) {
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
      } else {
        // Standard path: preprocess → Tesseract with OEM/PSM tuning
        onProgress?.(i, 20)
        const preprocessed = await preprocessForOcr(blob)
        onProgress?.(i, 30)
        const result = await recognizePage(preprocessed, lang, {
          oem: 1,
          psm: psmForStyle(style),
        });
        ({ text, confidence } = result)
        // Collect word metadata; drop bboxes above 5000-word threshold to cap memory
        const rawWords = result.words ?? []
        pageWords = rawWords.length > 5000
          ? rawWords.map(w => ({ text: w.text, confidence: w.confidence, lineIndex: w.lineIndex }))
          : rawWords.map(w => ({ text: w.text, confidence: w.confidence, bbox: w.bbox, lineIndex: w.lineIndex }))
      }

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
          const csv = parseTableText(text, pageWords)
          outFile = new File([csv], `${baseName}.csv`, { type: 'text/csv' })
          break
        }
        case 'excel': {
          const xlsxBytes = parseToExcel(text, baseName, pageWords)
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
