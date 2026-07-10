#!/usr/bin/env node
// scripts/test-table-accuracy.mjs
// Table OCR accuracy harness — measures cell accuracy and grid fidelity per fixture.
// Runs Tesseract.js directly in Node (no dev server needed).
//
// NOTE: detectColumnBoundaries uses OffscreenCanvas which is not available in Node.
// This harness falls back to word-gap voting (the same fallback used in parseTableFromWords
// when column detection produces no result). Accuracy on bordered tables may be slightly
// lower than in-browser due to missing pixel-level column detection.
//
// Usage:
//   node scripts/test-table-accuracy.mjs              # all fixtures
//   node scripts/test-table-accuracy.mjs bordered     # filter by name prefix
//
// Write results to tests/table-fixtures/BASELINE.md.
//
// Ship gate (run after generating fixtures):
//   - Numeric cell accuracy >= 95% on bordered-clean-01 and borderless-spacing-01
//   - Grid fidelity exact (row count, col count match) on those two fixtures

import Tesseract from 'tesseract.js'
import sharp from 'sharp'
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs'
import { resolve, join, basename } from 'path'

const FIXTURES_DIR = resolve('tests/table-fixtures')
const FILTER = process.argv.slice(2).find(a => !a.startsWith('-')) ?? null

// ── Tesseract word extractor ──────────────────────────────────────────────────
// Must pass { blocks: true } as the output config to get word-level bboxes.
// Words come from data.blocks[].paragraphs[].lines[].words[].

function extractWordsFromBlocks(blocks) {
  const words = []
  for (const block of blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const w of line.words ?? []) {
          if (!w.text?.trim() || !w.bbox) continue
          words.push({
            text: w.text.trim(),
            confidence: w.confidence ?? 0,
            bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 },
          })
        }
      }
    }
  }
  return words
}

// ── Ruled-line removal ────────────────────────────────────────────────────────
// Removes horizontal and vertical ruled lines from a binary image buffer.
// This approximates the browser's removeRuledLines() preprocessing step.
// Without this, bordered table grid lines confuse Tesseract's layout engine.

async function removeRuledLines(imgBuffer) {
  const { data, info } = await sharp(imgBuffer).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels } = info
  const pixels = new Uint8Array(data)
  const stride = w * channels

  // Horizontal lines: rows where >55% of pixels are dark
  for (let y = 0; y < h; y++) {
    let darkCount = 0
    for (let x = 0; x < w; x++) darkCount += pixels[y * stride + x * channels] < 128 ? 1 : 0
    if (darkCount / w > 0.55) {
      for (let x = 0; x < w; x++) {
        for (let c = 0; c < channels; c++) pixels[y * stride + x * channels + c] = 255
      }
    }
  }

  // Vertical lines: columns where >35% of pixels are dark
  for (let x = 0; x < w; x++) {
    let darkCount = 0
    for (let y = 0; y < h; y++) darkCount += pixels[y * stride + x * channels] < 128 ? 1 : 0
    if (darkCount / h > 0.35) {
      for (let y = 0; y < h; y++) {
        for (let c = 0; c < channels; c++) pixels[y * stride + x * channels + c] = 255
      }
    }
  }

  return sharp(Buffer.from(pixels), { raw: { width: w, height: h, channels } }).png().toBuffer()
}

// ── parseTableFromWords — adapted from lib/converters/image-ocr.ts ────────────
// Node-compatible approximation. detectColumnBoundaries is skipped (no OffscreenCanvas).
// minGapPx is capped at 50px to prevent row-height bboxes from inflating it.

function median(arr) {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

function parseTableFromWords(words) {
  const wordsWithBbox = words.filter(w => w.bbox && w.text && !/^[|!]$/.test(w.text.trim()))
  if (wordsWithBbox.length === 0) return []

  const heights = wordsWithBbox.map(w => w.bbox.y1 - w.bbox.y0)
  // Cap medianH to avoid row-height bboxes (Tesseract in Node gives block-level bboxes)
  const rawMedianH = median(heights)
  const medianH = Math.min(rawMedianH, 50)
  const minGapPx = Math.max(10, medianH * 1.2)

  // Cluster words into row bands by Y-center
  const sorted = [...wordsWithBbox].sort((a, b) => (a.bbox.y0 + a.bbox.y1) / 2 - (b.bbox.y0 + b.bbox.y1) / 2)

  const bands = []
  let currentBand = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const prevCenter = (currentBand[currentBand.length - 1].bbox.y0 + currentBand[currentBand.length - 1].bbox.y1) / 2
    const currCenter = (sorted[i].bbox.y0 + sorted[i].bbox.y1) / 2
    if (currCenter - prevCenter > minGapPx) {
      bands.push(currentBand)
      currentBand = [sorted[i]]
    } else {
      currentBand.push(sorted[i])
    }
  }
  bands.push(currentBand)

  if (bands.length === 0) return []

  // Detect column boundaries via word-gap voting
  const gapVotes = {}
  for (const band of bands) {
    const bandSorted = [...band].sort((a, b) => a.bbox.x0 - b.bbox.x0)
    for (let i = 1; i < bandSorted.length; i++) {
      const prevX1 = bandSorted[i - 1].bbox.x1
      const currX0 = bandSorted[i].bbox.x0
      const gap = currX0 - prevX1
      if (gap >= minGapPx) {
        const boundary = Math.round((prevX1 + currX0) / 2)
        const key = Math.round(boundary / 8) * 8
        gapVotes[key] = (gapVotes[key] ?? 0) + 1
      }
    }
  }

  const minVotes = Math.max(1, Math.round(0.2 * bands.length))
  const colBoundaries = Object.entries(gapVotes)
    .filter(([, v]) => v >= minVotes)
    .map(([k]) => Number(k))
    .sort((a, b) => a - b)

  const numCols = colBoundaries.length + 1

  // Assign words to cells
  const rows = bands.map(band => {
    const cells = Array.from({ length: numCols }, () => [])
    for (const w of band) {
      const colIdx = Math.min(
        colBoundaries.filter(b => b <= w.bbox.x0).length,
        numCols - 1
      )
      cells[colIdx].push(w.text)
    }
    return cells.map(c => c.join(' ').trim())
  })

  // Remove phantom columns: columns empty in >75% of rows (artifacts from border removal)
  if (rows.length > 1) {
    const emptyRates = Array.from({ length: numCols }, (_, ci) => {
      const empties = rows.filter(r => !r[ci]).length
      return empties / rows.length
    })
    const keepCols = emptyRates.map(r => r <= 0.75)
    if (keepCols.some(k => !k)) {
      return rows.map(r => r.filter((_, ci) => keepCols[ci]))
    }
  }

  return rows
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCsv(text) {
  return text.trim().split('\n').map(line =>
    line.split(',').map(c => c.trim())
  )
}

// ── Metrics ───────────────────────────────────────────────────────────────────

function isNumeric(str) {
  return /^-?\d[\d.,\s]*$/.test(str.trim())
}

function cellAccuracy(extracted, expected) {
  let total = 0, correct = 0
  const rows = Math.max(extracted.length, expected.length)
  const cols = Math.max(
    ...expected.map(r => r.length),
    ...extracted.map(r => r.length)
  )
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      total++
      const ext = (extracted[r]?.[c] ?? '').trim()
      const exp = (expected[r]?.[c] ?? '').trim()
      if (ext === exp) correct++
    }
  }
  return total === 0 ? 1 : correct / total
}

function numericCellAccuracy(extracted, expected) {
  let total = 0, correct = 0
  const rows = Math.max(extracted.length, expected.length)
  const cols = Math.max(
    ...expected.map(r => r.length),
    ...extracted.map(r => r.length)
  )
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const exp = (expected[r]?.[c] ?? '').trim()
      if (!isNumeric(exp)) continue
      total++
      const ext = (extracted[r]?.[c] ?? '').trim()
      if (ext === exp) correct++
    }
  }
  return total === 0 ? null : correct / total
}

function gridFidelity(extracted, expected) {
  const expRows = expected.length
  const expCols = expected[0]?.length ?? 0
  const extRows = extracted.length
  const extCols = extracted[0]?.length ?? 0
  return {
    expectedRows: expRows, extractedRows: extRows, rowMatch: extRows === expRows,
    expectedCols: expCols, extractedCols: extCols, colMatch: extCols === expCols,
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

function listFixtures() {
  if (!existsSync(FIXTURES_DIR)) {
    console.error('Fixtures directory not found:', FIXTURES_DIR)
    console.error('Run: node scripts/generate-table-fixtures.mjs')
    process.exit(1)
  }

  return readdirSync(FIXTURES_DIR)
    .filter(f => /\.(png|jpe?g)$/i.test(f))
    .filter(f => !FILTER || basename(f, /\.[^.]+$/.exec(f)?.[0] ?? '').startsWith(FILTER))
    .map(f => {
      const name = f.replace(/\.[^.]+$/, '')
      const csvPath = join(FIXTURES_DIR, `${name}.expected.csv`)
      const groundTruth = existsSync(csvPath) ? readFileSync(csvPath, 'utf-8') : null
      return { name, imagePath: join(FIXTURES_DIR, f), groundTruth }
    })
    .filter(f => f.groundTruth !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ── Ship gate ─────────────────────────────────────────────────────────────────

const GATED_FIXTURES = ['bordered-clean-01', 'borderless-spacing-01']
const NUMERIC_GATE = 0.95

async function main() {
  const fixtures = listFixtures()
  if (fixtures.length === 0) {
    console.error('No fixtures with .expected.csv files found in', FIXTURES_DIR)
    console.error('Run: node scripts/generate-table-fixtures.mjs')
    process.exit(1)
  }

  const worker = await Tesseract.createWorker('eng')
  const results = []

  console.log('\nTable OCR Accuracy Harness')
  console.log('Engine: Tesseract word-gap voting (no OffscreenCanvas column detection in Node)')
  console.log('─'.repeat(80))
  console.log('Fixture'.padEnd(28) + 'Cell%'.padStart(7) + 'Num%'.padStart(7) + 'GridOK'.padStart(8) + 'Rows'.padStart(8) + 'Cols'.padStart(8))
  console.log('─'.repeat(80))

  for (const { name, imagePath, groundTruth } of fixtures) {
    const expected = parseCsv(groundTruth)
    // Preprocess: grayscale → threshold → remove ruled lines.
    // Approximates the browser's Sauvola binarization + removeRuledLines() step.
    const binary = await sharp(imagePath)
      .grayscale()
      .blur(0.3)
      .threshold(210)
      .png()
      .toBuffer()
    const preprocessed = await removeRuledLines(binary)

    const { data } = await worker.recognize(preprocessed, {}, { blocks: true })
    const words = extractWordsFromBlocks(data.blocks)

    const extracted = parseTableFromWords(words)

    const cellAcc = cellAccuracy(extracted, expected)
    const numAcc = numericCellAccuracy(extracted, expected)
    const grid = gridFidelity(extracted, expected)
    const gridOk = grid.rowMatch && grid.colMatch

    results.push({ name, cellAcc, numAcc, grid, gridOk, extracted, expected })

    const numStr = numAcc !== null ? (numAcc * 100).toFixed(1) + '%' : 'N/A'
    const gridStr = gridOk ? '✓' : `✗ ${grid.extractedRows}r×${grid.extractedCols}c vs ${grid.expectedRows}r×${grid.expectedCols}c`
    console.log(
      name.padEnd(28) +
      ((cellAcc * 100).toFixed(1) + '%').padStart(7) +
      numStr.padStart(7) +
      (gridOk ? '  ✓' : '  ✗').padStart(8) +
      String(grid.extractedRows).padStart(8) +
      String(grid.extractedCols).padStart(8)
    )
    if (!gridOk) {
      console.log(`  expected ${grid.expectedRows}r × ${grid.expectedCols}c, got ${grid.extractedRows}r × ${grid.extractedCols}c`)
    }
    if (process.env.VERBOSE) {
      console.log('  Expected:', expected.slice(0, 3))
      console.log('  Extracted:', extracted.slice(0, 3))
    }
  }

  await worker.terminate()

  // Ship gate check
  console.log('\n─'.repeat(80))
  let gatePass = true
  const gateResults = []
  for (const name of GATED_FIXTURES) {
    const r = results.find(x => x.name === name)
    if (!r) {
      console.log(`⚠ GATE: ${name} fixture missing — generate it first`)
      gatePass = false
      gateResults.push({ name, status: 'MISSING' })
      continue
    }
    const numOk = r.numAcc !== null && r.numAcc >= NUMERIC_GATE
    const gridOk = r.gridOk
    const pass = numOk && gridOk
    if (!pass) gatePass = false
    const status = pass ? 'PASS' : 'FAIL'
    const numStr = r.numAcc !== null ? (r.numAcc * 100).toFixed(1) + '%' : 'N/A'
    console.log(`${status === 'PASS' ? '✓' : '✗'} GATE ${name}: numeric=${numStr} (need ≥${NUMERIC_GATE * 100}%), grid=${r.gridOk ? 'exact' : 'MISMATCH'} → ${status}`)
    gateResults.push({ name, status, numAcc: r.numAcc, gridOk: r.gridOk })
  }

  // Write BASELINE.md
  const baseline = buildBaseline(results, gateResults, gatePass)
  const baselinePath = join(FIXTURES_DIR, 'BASELINE.md')
  writeFileSync(baselinePath, baseline)
  console.log(`\nBaseline written to ${baselinePath}`)

  if (!gatePass) {
    console.log('\n✗ SHIP GATE FAILED — do not merge until gate passes')
    process.exit(1)
  } else {
    console.log('\n✓ SHIP GATE PASSED')
  }
}

function buildBaseline(results, gateResults, gatePass) {
  const now = new Date().toISOString().slice(0, 10)
  const lines = [
    '# Table OCR Accuracy Baseline',
    '',
    `Generated: ${now}`,
    'Engine: Tesseract.js with word-gap voting (Node — no OffscreenCanvas column detection)',
    '',
    '## Results',
    '',
    '| Fixture | Cell% | Numeric% | Grid Fidelity | Rows | Cols |',
    '|---|---|---|---|---|---|',
  ]

  for (const r of results) {
    const numStr = r.numAcc !== null ? (r.numAcc * 100).toFixed(1) + '%' : 'N/A'
    const gridStr = r.gridOk
      ? `✓ ${r.grid.expectedRows}×${r.grid.expectedCols}`
      : `✗ got ${r.grid.extractedRows}×${r.grid.extractedCols}, expected ${r.grid.expectedRows}×${r.grid.expectedCols}`
    lines.push(`| ${r.name} | ${(r.cellAcc * 100).toFixed(1)}% | ${numStr} | ${gridStr} | ${r.grid.extractedRows} | ${r.grid.extractedCols} |`)
  }

  lines.push('', '## Ship Gate', '')
  for (const g of gateResults) {
    const icon = g.status === 'PASS' ? '✓' : g.status === 'MISSING' ? '⚠' : '✗'
    const detail = g.status === 'MISSING' ? 'fixture missing' :
      `numeric=${g.numAcc !== null ? (g.numAcc * 100).toFixed(1) + '%' : 'N/A'}, grid=${g.gridOk ? 'exact' : 'mismatch'}`
    lines.push(`- ${icon} \`${g.name}\`: ${detail} → **${g.status}**`)
  }

  lines.push('', `**Overall gate: ${gatePass ? 'PASS ✓' : 'FAIL ✗'}**`)
  lines.push('', '## Notes', '', '- No OffscreenCanvas in Node — column detection uses word-gap voting fallback', '- In-browser accuracy will be equal or higher due to pixel-level column detection')
  return lines.join('\n') + '\n'
}

main().catch(err => { console.error(err); process.exit(1) })
