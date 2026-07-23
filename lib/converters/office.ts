import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { ToolOptions, ConversionResult } from '@/lib/types'

// ── Page size constants ───────────────────────────────────────────────────────

const PAGE_SIZES: Record<string, readonly [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalize a string so it only contains characters pdf-lib's WinAnsi fonts
 * (Helvetica, HelveticaBold, etc.) can encode.  Word documents regularly
 * contain curly quotes, em-dashes, and newlines — all of which throw
 * "WinAnsi cannot encode" without this step.
 */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\r\n\t\v\f]+/g, ' ')           // control whitespace → space
    .replace(/[‘’ʼ]/g, "'")     // curly single quotes / apostrophe
    .replace(/[“”„‟]/g, '"') // curly double quotes
    .replace(/[–—―]/g, '-')     // en-dash / em-dash / horizontal bar
    .replace(/…/g, '...')                 // ellipsis
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')    // drop anything else outside WinAnsi
    .replace(/ {2,}/g, ' ')                    // collapse runs of spaces
    .trim()
}

function getPageDimensions(options: ToolOptions, defaultSize = 'letter', defaultOrientation = 'portrait'): [number, number] {
  const sizeKey = (options.pageSize as string) ?? defaultSize
  const orientation = (options.orientation as string) ?? defaultOrientation
  const [w, h] = PAGE_SIZES[sizeKey] ?? PAGE_SIZES[defaultSize]
  return orientation === 'landscape' ? [h, w] : [w, h]
}

function getMargin(options: ToolOptions, defaultMargin = 'normal'): number {
  const m = (options.margins as string) ?? defaultMargin
  const map: Record<string, number> = {
    normal: 72,
    narrow: 36,
    wide: 108,
    none: 0,
  }
  return map[m] ?? 72
}

/** Split text into lines that fit within maxWidth at the given font size. */
async function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
  maxWidth: number
): Promise<string[]> {
  const safe = sanitizeForPdf(text)
  const words = safe.split(/\s+/).filter(w => w.length > 0)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate
    } else {
      if (currentLine) lines.push(currentLine)
      // If single word is too wide, push it as-is (truncation happens at draw time)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

/** Truncate text to fit within maxWidth at the given font size, adding '...' if needed. */
function truncateText(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
  maxWidth: number
): string {
  const safe = sanitizeForPdf(text)
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe
  let truncated = safe
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '...'
}

// ── wordToPdf ─────────────────────────────────────────────────────────────────

export async function wordToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = (await import('mammoth')) as any
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, 0)

    // Reject legacy .doc
    if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
      results.push(
        new Error(
          'Legacy .doc format is not supported. Re-save as .docx in Word, then convert.'
        )
      )
      onProgress?.(i, 100)
      continue
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      onProgress?.(i, 10)

      const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
      onProgress?.(i, 30)

      // Parse HTML
      const parser = new DOMParser()
      const dom = parser.parseFromString(html, 'text/html')

      // Create PDF
      const pdfDoc = await PDFDocument.create()
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const [pageW, pageH] = getPageDimensions(options, 'a4', 'portrait')
      const margin = getMargin(options, 'normal')
      const contentWidth = pageW - margin * 2

      let page = pdfDoc.addPage([pageW, pageH])
      let y = pageH - margin

      /** Ensure there's room for `needed` points; add a new page if not. */
      const ensureSpace = (needed: number) => {
        if (y - needed < margin) {
          page = pdfDoc.addPage([pageW, pageH])
          y = pageH - margin
        }
      }

      /** Draw a line of text and advance y. */
      const drawLine = (
        text: string,
        font: Awaited<ReturnType<PDFDocument['embedFont']>>,
        size: number,
        extraGapBefore = 0
      ) => {
        const lineHeight = size * 1.4
        ensureSpace(extraGapBefore + lineHeight)
        y -= extraGapBefore
        page.drawText(text, { x: margin, y, font, size, color: rgb(0, 0, 0) })
        y -= lineHeight
      }

      const elements = Array.from(dom.body.children)

      for (const el of elements) {
        const tag = el.tagName.toLowerCase()
        const rawText = sanitizeForPdf(el.textContent ?? '')

        if (tag === 'h1') {
          const lines = await wrapText(rawText, boldFont, 20, contentWidth)
          for (const line of lines) drawLine(line, boldFont, 20, 8)
        } else if (tag === 'h2') {
          const lines = await wrapText(rawText, boldFont, 16, contentWidth)
          for (const line of lines) drawLine(line, boldFont, 16, 6)
        } else if (tag === 'h3') {
          const lines = await wrapText(rawText, boldFont, 13, contentWidth)
          for (const line of lines) drawLine(line, boldFont, 13, 4)
        } else if (tag === 'p') {
          const lines = await wrapText(rawText, regularFont, 11, contentWidth)
          for (const line of lines) drawLine(line, regularFont, 11, 0)
          y -= 4 // gap after paragraph
        } else if (tag === 'ul' || tag === 'ol') {
          const items = Array.from(el.querySelectorAll('li'))
          for (let idx = 0; idx < items.length; idx++) {
            const bullet = tag === 'ul' ? '  * ' : `  ${idx + 1}. `
            const itemText = sanitizeForPdf(items[idx].textContent ?? '')
            const bulletWidth = regularFont.widthOfTextAtSize(bullet, 11)
            const lines = await wrapText(itemText, regularFont, 11, contentWidth - bulletWidth)
            for (let li = 0; li < lines.length; li++) {
              const prefix = li === 0 ? bullet : '    '
              drawLine(prefix + lines[li], regularFont, 11, 0)
            }
          }
          y -= 4
        } else if (tag === 'table') {
          const rows = Array.from(el.querySelectorAll('tr'))
          const cellFont = regularFont
          const cellFontBold = boldFont
          const cellFontSize = 8
          const cellH = 14
          const cellPad = 3

          // Determine column count
          let numCols = 0
          for (const row of rows) {
            const cells = row.querySelectorAll('td, th')
            if (cells.length > numCols) numCols = cells.length
          }
          if (numCols === 0) continue

          const colW = Math.min(contentWidth / numCols, 140)
          const tableWidth = colW * numCols

          for (let ri = 0; ri < rows.length; ri++) {
            ensureSpace(cellH)

            const cells = Array.from(rows[ri].querySelectorAll('td, th'))
            const isHeader = ri === 0

            y -= cellH

            for (let ci = 0; ci < numCols; ci++) {
              const cellX = margin + ci * colW
              const cellY = y

              // Background for header row
              if (isHeader) {
                page.drawRectangle({
                  x: cellX,
                  y: cellY,
                  width: colW,
                  height: cellH,
                  color: rgb(0.9, 0.9, 0.9),
                })
              }

              // Border
              page.drawRectangle({
                x: cellX,
                y: cellY,
                width: colW,
                height: cellH,
                borderColor: rgb(0.75, 0.75, 0.75),
                borderWidth: 0.5,
              })

              // Text
              const cellText = (cells[ci]?.textContent ?? '').trim()
              const font = isHeader ? cellFontBold : cellFont
              const truncated = truncateText(cellText, font, cellFontSize, colW - cellPad * 2)
              page.drawText(truncated, {
                x: cellX + cellPad,
                y: cellY + (cellH - cellFontSize) / 2,
                font,
                size: cellFontSize,
                color: rgb(0, 0, 0),
              })
            }

            // Draw right border of table
            page.drawLine({
              start: { x: margin + tableWidth, y: y + cellH },
              end: { x: margin + tableWidth, y },
              thickness: 0.5,
              color: rgb(0.75, 0.75, 0.75),
            })
          }

          y -= 8 // gap after table
        }
      }

      onProgress?.(i, 80)

      const pdfBytes = await pdfDoc.save()
      const baseName = file.name.replace(/\.docx?$/i, '')
      const outFile = new File([pdfBytes.buffer as ArrayBuffer], `${baseName}.pdf`, { type: 'application/pdf' })

      results.push(outFile)
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
      onProgress?.(i, 100)
    }
  }

  return results
}

// ── Packed-row unpacker ───────────────────────────────────────────────────────
// Some Excel files (e.g., pasted from web tables) store an entire column's data
// as a single space-separated string in one cell. Detect this pattern and
// reconstruct the intended 2-D table before rendering.

const NUMERIC_VALUE_RE = /^[\d.]+%?$|^\$[\d,]+\+*$/

const TEXT_SUFFIX_WORDS = new Set([
  'pro', 'max', 'pure', 'station', 'vac', 'auto', 'empty', 'iq', 'ai',
  'smart', 'ultra', 'maxv', 'aivi', 'plus', 'series', 'edition', 'robot',
])

function isStrongNameStart(tok: string): boolean {
  return (
    /^[A-Z]/.test(tok) &&       // starts with uppercase
    !/^[A-Z]\d/.test(tok) &&    // not a model code like T8, S9+, L10
    !TEXT_SUFFIX_WORDS.has(tok.toLowerCase())
  )
}

function buildTextGroups(
  tokens: string[],
  boundaryFn: (tok: string, prevWasStart: boolean) => boolean
): { groups: string[][]; headerToks: string[] } {
  const groups: string[][] = []
  const headerToks: string[] = []
  let current: string[] | null = null
  let prevWasStart = false

  for (const tok of tokens) {
    const isBoundary = boundaryFn(tok, prevWasStart)
    if (isBoundary) {
      if (current !== null) groups.push(current)
      current = [tok]
      prevWasStart = true
    } else {
      if (current === null) headerToks.push(tok)
      else current.push(tok)
      prevWasStart = false
    }
  }
  if (current !== null) groups.push(current)
  return { groups, headerToks }
}

function tryUnpackTextTokens(
  tokens: string[],
  numDataRows: number
): { header: string; values: string[] } | null {
  // Pass 1: strong uppercase-start tokens that aren't model codes or generic words
  let { groups, headerToks } = buildTextGroups(tokens, (tok) => isStrongNameStart(tok))
  if (groups.length === numDataRows) {
    return { header: headerToks.join(' '), values: groups.map(g => g.join(' ')) }
  }

  // Collect brand names discovered in pass 1 for case-insensitive matching
  const knownBrands = new Set(groups.map(g => g[0].toLowerCase()))
  ;({ groups, headerToks } = buildTextGroups(tokens, (tok) =>
    isStrongNameStart(tok) || knownBrands.has(tok.toLowerCase())
  ))
  if (groups.length === numDataRows) {
    return { header: headerToks.join(' '), values: groups.map(g => g.join(' ')) }
  }

  // Pass 3: also treat digit-only tokens as boundaries IF they don't immediately
  // follow a group start (digit-after-start = model number, not a new brand)
  ;({ groups, headerToks } = buildTextGroups(tokens, (tok, prevWasStart) =>
    isStrongNameStart(tok) ||
    knownBrands.has(tok.toLowerCase()) ||
    (/^\d+$/.test(tok) && !prevWasStart)
  ))
  if (groups.length === numDataRows) {
    return { header: headerToks.join(' '), values: groups.map(g => g.join(' ')) }
  }

  return null
}

function unpackPackedSheet(data: string[][]): string[][] {
  if (data.length !== 1 || data[0].length < 2) return data

  const row = data[0]
  const numCols = row.length

  type ColInfo = { header: string; values: string[]; isNumeric: boolean } | null
  const parsed: ColInfo[] = []

  for (let ci = 0; ci < numCols; ci++) {
    const text = String(row[ci] ?? '').replace(/[\r\n\t]+/g, ' ').trim()
    if (!text) { parsed.push(null); continue }

    const tokens = text.split(/\s+/).filter(t => t.length > 0)
    if (tokens.length < 2) { parsed.push(null); continue }

    const firstNumIdx = tokens.findIndex(t => NUMERIC_VALUE_RE.test(t))
    if (firstNumIdx > 0) {
      const valTokens = tokens.slice(firstNumIdx)
      const numericRatio = valTokens.filter(t => NUMERIC_VALUE_RE.test(t)).length / valTokens.length
      if (numericRatio >= 0.8) {
        parsed.push({ header: tokens.slice(0, firstNumIdx).join(' '), values: valTokens, isNumeric: true })
        continue
      }
    }
    parsed.push({ header: '', values: tokens, isNumeric: false })
  }

  const numericCols = parsed.filter((p): p is NonNullable<ColInfo> => p?.isNumeric === true)
  if (numericCols.length < 1) return data

  const valueCounts = numericCols.map(p => p.values.length)
  const numDataRows = Math.max(...valueCounts)
  const minCount = Math.min(...valueCounts)
  if (numDataRows < 2 || numDataRows - minCount > 3) return data

  // Unpack text columns using the target row count
  for (let ci = 0; ci < numCols; ci++) {
    const p = parsed[ci]
    if (!p || p.isNumeric) continue

    const unpacked = tryUnpackTextTokens(p.values, numDataRows)
    if (unpacked) {
      parsed[ci] = { header: unpacked.header, values: unpacked.values, isNumeric: false }
    } else {
      // Couldn't reconstruct — use the first word as header and blank out data rows
      parsed[ci] = {
        header: String(row[ci] ?? '').split(/\s+/)[0] ?? '',
        values: Array(numDataRows).fill(''),
        isNumeric: false,
      }
    }
  }

  const headers = parsed.map((p, ci) => p?.header ?? String(row[ci] ?? '').split(/\s+/)[0] ?? '')
  const reconstructed: string[][] = [headers]
  for (let ri = 0; ri < numDataRows; ri++) {
    reconstructed.push(parsed.map(p => (!p ? '' : p.values[ri] ?? '')))
  }
  return reconstructed
}

// ── excelToPdf ────────────────────────────────────────────────────────────────

export async function excelToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const XLSX = await import('xlsx')
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, 0)

    try {
      const arrayBuffer = await file.arrayBuffer()
      onProgress?.(i, 10)

      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
      onProgress?.(i, 20)

      const pdfDoc = await PDFDocument.create()
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const [pageW, pageH] = getPageDimensions(options, 'letter', 'landscape')
      const margin = getMargin(options, 'normal')
      const contentWidth = pageW - margin * 2

      const cellH = 14
      const fontSize = 7.5
      const cellPad = 3

      const headerFontSize = 11
      const headerLineH = headerFontSize * 1.4

      for (let si = 0; si < workbook.SheetNames.length; si++) {
        const sheetName = workbook.SheetNames[si]
        const ws = workbook.Sheets[sheetName]
        const rawData: string[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: '',
          raw: false,
        }) as string[][]
        const data = unpackPackedSheet(rawData)

        // Add a new page for each sheet
        // eslint-disable-next-line prefer-const
        let page = pdfDoc.addPage([pageW, pageH])
        let y = pageH - margin

        page.drawText(sheetName, {
          x: margin,
          y,
          font: boldFont,
          size: headerFontSize,
          color: rgb(0, 0, 0),
        })
        y -= headerLineH + 4

        if (data.length === 0) {
          page.drawText('(No data in this sheet)', {
            x: margin,
            y: y - 4,
            font: regularFont,
            size: 9,
            color: rgb(0.5, 0.5, 0.5),
          })
          continue
        }

        const numCols = data.reduce((max, row) => Math.max(max, row.length), 0)
        if (numCols === 0) {
          page.drawText('(No data in this sheet)', {
            x: margin,
            y: y - 4,
            font: regularFont,
            size: 9,
            color: rgb(0.5, 0.5, 0.5),
          })
          continue
        }

        // Measure max content width per column (single pass) so column widths are
        // proportional to the widest text in each column, not just divided equally.
        const rawWidths = Array.from({ length: numCols }, (_, ci) => {
          let maxW = cellPad * 2 + 8 // absolute minimum
          for (const row of data) {
            const text = String(row[ci] ?? '').replace(/[\r\n\t]+/g, ' ').trim()
            if (!text) continue
            const w = regularFont.widthOfTextAtSize(text, fontSize) + cellPad * 2
            if (w > maxW) maxW = w
          }
          // Also measure header text (bold)
          const headerText = String(data[0]?.[ci] ?? '').replace(/[\r\n\t]+/g, ' ').trim()
          if (headerText) {
            const hw = boldFont.widthOfTextAtSize(headerText, fontSize) + cellPad * 2
            if (hw > maxW) maxW = hw
          }
          return maxW
        })

        // Scale all columns proportionally so they fill exactly contentWidth.
        // Cap any single column at 40% of contentWidth to prevent one wide column
        // from squashing everything else.
        const cap = contentWidth * 0.4
        const capped = rawWidths.map(w => Math.min(w, cap))
        const totalCapped = capped.reduce((s, w) => s + w, 0)
        const colWidths = capped.map(w => (w / totalCapped) * contentWidth)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const drawRow = (pg: any, row: string[], rowY: number, isHeader: boolean) => {
          let cellX = margin
          for (let ci = 0; ci < numCols; ci++) {
            const cw = colWidths[ci]
            if (isHeader) {
              pg.drawRectangle({ x: cellX, y: rowY, width: cw, height: cellH, color: rgb(0.9, 0.9, 0.9) })
            }
            pg.drawRectangle({ x: cellX, y: rowY, width: cw, height: cellH, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 0.5 })
            const cellText = String(row[ci] ?? '').replace(/[\r\n\t]+/g, ' ').trim()
            const font = isHeader ? boldFont : regularFont
            const truncated = truncateText(cellText, font, fontSize, Math.max(cw - cellPad * 2, 1))
            pg.drawText(truncated, { x: cellX + cellPad, y: rowY + (cellH - fontSize) / 2, font, size: fontSize, color: rgb(0, 0, 0) })
            cellX += cw
          }
        }

        for (let ri = 0; ri < data.length; ri++) {
          if (y - cellH < margin) {
            // Overflow to a new page — repeat the sheet name (marked continued) and header row for context
            page = pdfDoc.addPage([pageW, pageH])
            y = pageH - margin
            page.drawText(`${sheetName} (continued)`, { x: margin, y, font: boldFont, size: headerFontSize, color: rgb(0, 0, 0) })
            y -= headerLineH + 4
            y -= cellH
            drawRow(page, data[0], y, true)
            if (ri === 0) continue
          }
          y -= cellH
          drawRow(page, data[ri], y, ri === 0)
        }

        onProgress?.(i, 20 + Math.round(((si + 1) / workbook.SheetNames.length) * 70))
      }

      const pdfBytes = await pdfDoc.save()
      const baseName = file.name.replace(/\.(xlsx?|ods|csv)$/i, '')
      const outFile = new File([pdfBytes.buffer as ArrayBuffer], `${baseName}.pdf`, { type: 'application/pdf' })

      results.push(outFile)
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
      onProgress?.(i, 100)
    }
  }

  return results
}
