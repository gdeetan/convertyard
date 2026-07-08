#!/usr/bin/env node
/**
 * Runs the receipt-to-text tool against tests/ocr-fixtures/receipt-real.jpg
 * and compares the output to tests/ocr-fixtures/receipt-real.txt.
 * Prints a line-by-line diff and an overall pass/fail.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')

const FIXTURE_IMG = resolve(root, 'tests/ocr-fixtures/receipt-real.jpg')
const FIXTURE_TXT = resolve(root, 'tests/ocr-fixtures/receipt-real.txt')
const BASE_URL    = 'http://localhost:3000'

const expected = readFileSync(FIXTURE_TXT, 'utf8').trim()

console.log('─'.repeat(60))
console.log('EXPECTED (from receipt-real.txt):')
console.log(expected)
console.log('─'.repeat(60))

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ acceptDownloads: true })
const page    = await context.newPage()

console.log('→ Opening /receipt-to-text …')
await page.goto(`${BASE_URL}/receipt-to-text`, { waitUntil: 'load' })

// Wait for React to hydrate and render the dropzone
const fileInput = page.locator('input[type="file"]')
await fileInput.waitFor({ state: 'attached', timeout: 30_000 })

// Select "Formatted text (.txt)" output (should already be default)
const txtRadio = page.locator('input[type="radio"][value="txt"]')
if (await txtRadio.count()) await txtRadio.check()

// Upload the receipt fixture
console.log('→ Uploading receipt-real.jpg …')
await fileInput.setInputFiles(FIXTURE_IMG)
await page.waitForTimeout(500)

// Click Convert
const convertBtn = page.getByRole('button', { name: /convert 1/i })
await convertBtn.click()
console.log('→ Running OCR (Standard mode, may take ~10s) …')

// Wait for the individual file download button to appear
const downloadBtn = page.locator('[data-testid=result-success] a, [data-testid=result-success] button').first()
await downloadBtn.waitFor({ timeout: 120_000 })

// Intercept download
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 30_000 }),
  downloadBtn.click(),
])

const tmpPath = await download.path()
const rawActual = readFileSync(tmpPath, 'utf8').trim()

// The formatted .txt output has a header block (Vendor/Date/Total) then a
// divider then the raw OCR text then another divider. Extract just the raw text.
const divider = '─'.repeat(32)
const parts   = rawActual.split(divider).map(p => p.trim()).filter(Boolean)
// parts[0] = header block, parts[1] = raw OCR text (what we compare against)
const actual  = parts.length >= 2 ? parts[1] : rawActual

console.log('─'.repeat(60))
console.log('FULL TOOL OUTPUT:')
console.log(rawActual)
console.log('─'.repeat(60))
console.log('\nRAW TEXT SECTION (used for comparison):')
console.log(actual)
console.log('─'.repeat(60))

// --- Diff ---
const expLines = expected.split('\n')
const actLines = actual.split('\n')
const maxLen   = Math.max(expLines.length, actLines.length)

let mismatches = 0
console.log('\nLINE-BY-LINE COMPARISON:')
for (let i = 0; i < maxLen; i++) {
  const e = expLines[i] ?? '(missing)'
  const a = actLines[i] ?? '(missing)'
  if (e === a) {
    console.log(`  ✓ line ${i + 1}: "${e}"`)
  } else {
    console.log(`  ✗ line ${i + 1}:`)
    console.log(`      expected: "${e}"`)
    console.log(`      actual:   "${a}"`)
    mismatches++
  }
}

console.log('\n' + '─'.repeat(60))
if (mismatches === 0) {
  console.log('RESULT: ✓ PASS — output matches expected exactly')
} else {
  console.log(`RESULT: ✗ FAIL — ${mismatches} line(s) differ`)
}
console.log('─'.repeat(60))

await browser.close()
process.exit(mismatches === 0 ? 0 : 1)
