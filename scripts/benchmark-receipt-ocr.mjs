#!/usr/bin/env node
/**
 * Batch benchmark for /receipt-to-text against tests/ocr-fixtures/receipts.
 *
 * Usage:
 *   BASE_URL=http://localhost:3001 node scripts/benchmark-receipt-ocr.mjs
 *   BASE_URL=http://localhost:3001 node scripts/benchmark-receipt-ocr.mjs --all
 *
 * The script expects each image to have a sibling .txt file with the same base
 * name. It uploads one receipt at a time, downloads the generated text, and
 * reports fuzzy text metrics plus key field checks.
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { basename, dirname, extname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')
const fixtureDir = resolve(root, 'tests/ocr-fixtures/receipts')
const outputDir = resolve(root, 'tests/ocr-fixtures/receipts/.benchmark-output')
const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '')
const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const includeAll = process.argv.includes('--all') || process.env.RECEIPT_BENCHMARK_SUITE === 'all'
const manifestPath = join(fixtureDir, 'manifest.json')
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : { fixtures: {} }

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[|_—–-]{3,}/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function compact(text) {
  return normalizeText(text).toLowerCase().replace(/[^a-z0-9$./%]+/g, '')
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

function similarity(expected, actual) {
  const a = compact(expected)
  const b = compact(actual)
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  return 1 - levenshtein(a, b) / max
}

function extractRawToolText(output) {
  const divider = '─'.repeat(32)
  const parts = output.split(divider).map(p => p.trim()).filter(Boolean)
  return parts.length >= 2 ? parts[1] : output
}

function expectedTotal(text) {
  const lines = normalizeText(text).split('\n')
  for (const line of lines.slice().reverse()) {
    if (/\b(total|amt due|amount due)\b/i.test(line)) {
      const match = line.match(/[$]?\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/)
      if (match) return match[0].replace(/^\$/, '')
    }
  }
  const amounts = text.match(/[$]?\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/g)
  return amounts?.at(-1)?.replace(/^\$/, '') ?? ''
}

function expectedDate(text) {
  return text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/)?.[0] ?? ''
}

function lineHitRate(expected, actual) {
  const actualCompact = compact(actual)
  const lines = normalizeText(expected).split('\n').filter(line => line.length >= 3)
  if (!lines.length) return { hit: 0, total: 0, missing: [] }
  const missing = []
  let hit = 0
  for (const line of lines) {
    const c = compact(line)
    if (!c || c.length < 3 || actualCompact.includes(c)) hit++
    else missing.push(line)
  }
  return { hit, total: lines.length, missing }
}

function findFixtures() {
  const all = readdirSync(fixtureDir)
    .filter(name => imageExts.has(extname(name).toLowerCase()))
    .map(name => {
      const imagePath = join(fixtureDir, name)
      const textPath = join(fixtureDir, `${basename(name, extname(name))}.txt`)
      const id = basename(name, extname(name))
      const meta = manifest.fixtures?.[id] ?? {}
      return { name, imagePath, textPath, id, meta }
    })
    .filter(f => existsSync(f.textPath))
    .sort((a, b) => a.name.localeCompare(b.name))
  return includeAll ? all : all.filter(f => f.meta.default !== false)
}

async function runOne(context, fixture) {
  const page = await context.newPage()
  await page.goto(`${baseUrl}/receipt-to-text/`, { waitUntil: 'load' })
  const fileInput = page.locator('input[type="file"]')
  await fileInput.waitFor({ state: 'attached', timeout: 30_000 })

  const txtRadio = page.locator('input[type="radio"][value="txt"]')
  if (await txtRadio.count()) await txtRadio.check()

  await fileInput.setInputFiles(fixture.imagePath)
  const convertButton = page.getByRole('button', { name: /^convert \d+ file/i })
  await convertButton.waitFor({ state: 'visible', timeout: 30_000 })
  await convertButton.click()

  const downloadButton = page
    .locator('[data-testid="result-success"]')
    .getByRole('button', { name: /download .*receipt\.txt/i })
  await downloadButton.waitFor({ timeout: 240_000 })
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    downloadButton.click(),
  ])

  const downloaded = await download.path()
  const fullOutput = readFileSync(downloaded, 'utf8').trim()
  const rawOutput = extractRawToolText(fullOutput)
  await page.close()
  return { fullOutput, rawOutput }
}

const fixtures = findFixtures()
if (!fixtures.length) {
  console.error(`No receipt fixtures found in ${fixtureDir}`)
  process.exit(1)
}
const allFixtureCount = readdirSync(fixtureDir)
  .filter(name => imageExts.has(extname(name).toLowerCase()))
  .filter(name => existsSync(join(fixtureDir, `${basename(name, extname(name))}.txt`)))
  .length

mkdirSync(outputDir, { recursive: true })

console.log(`Receipt OCR benchmark`)
console.log(`Base URL: ${baseUrl}`)
console.log(`Fixtures: ${fixtures.length}${includeAll ? '' : `/${allFixtureCount} default suite`}`)
if (!includeAll && fixtures.length < allFixtureCount) {
  console.log(`Tip: pass --all to include mixed-language stress fixtures.`)
}
console.log('')

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ acceptDownloads: true })

const rows = []
try {
  for (const fixture of fixtures) {
    const expected = readFileSync(fixture.textPath, 'utf8').trim()
    const started = Date.now()
    process.stdout.write(`${fixture.name} ... `)

    try {
      const { fullOutput, rawOutput } = await runOne(context, fixture)
      const elapsedMs = Date.now() - started
      const lineStats = lineHitRate(expected, rawOutput)
      const sim = similarity(expected, rawOutput)
      const total = expectedTotal(expected)
      const date = expectedDate(expected)
      const actualCompact = compact(rawOutput)
      const totalFound = total ? actualCompact.includes(compact(total)) : null
      const dateFound = date ? actualCompact.includes(compact(date)) : null
      const outputPath = join(outputDir, `${basename(fixture.name, extname(fixture.name))}.actual.txt`)
      writeFileSync(outputPath, fullOutput)

      rows.push({
        name: fixture.name,
        ok: true,
        sim,
        lineRate: lineStats.total ? lineStats.hit / lineStats.total : 0,
        totalFound,
        dateFound,
        elapsedMs,
        missing: lineStats.missing.slice(0, 5),
      })

      console.log(
        `sim ${(sim * 100).toFixed(1)}%, lines ${lineStats.hit}/${lineStats.total}, ` +
        `total ${totalFound === null ? 'n/a' : totalFound ? 'yes' : 'no'}, ` +
        `date ${dateFound === null ? 'n/a' : dateFound ? 'yes' : 'no'}, ` +
        `${(elapsedMs / 1000).toFixed(1)}s`
      )
    } catch (err) {
      rows.push({
        name: fixture.name,
        ok: false,
        sim: 0,
        lineRate: 0,
        totalFound: false,
        dateFound: false,
        elapsedMs: Date.now() - started,
        missing: [],
        error: err instanceof Error ? err.message : String(err),
      })
      console.log(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
} finally {
  await browser.close()
}

const successful = rows.filter(r => r.ok)
const avg = (values) => values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
const totals = rows.filter(r => r.totalFound !== null)
const dates = rows.filter(r => r.dateFound !== null)

console.log('')
console.log('Summary')
console.log(`  Success: ${successful.length}/${rows.length}`)
console.log(`  Avg character similarity: ${(avg(successful.map(r => r.sim)) * 100).toFixed(1)}%`)
console.log(`  Avg line hit rate: ${(avg(successful.map(r => r.lineRate)) * 100).toFixed(1)}%`)
console.log(`  Totals found: ${totals.filter(r => r.totalFound).length}/${totals.length}`)
console.log(`  Dates found: ${dates.filter(r => r.dateFound).length}/${dates.length}`)
console.log(`  Actual outputs: ${outputDir}`)

const weakest = successful
  .slice()
  .sort((a, b) => a.sim - b.sim)
  .slice(0, 3)

if (weakest.length) {
  console.log('')
  console.log('Weakest fixtures')
  for (const row of weakest) {
    console.log(`  ${row.name}: ${(row.sim * 100).toFixed(1)}% similarity`)
    for (const line of row.missing) console.log(`    missing: ${line}`)
  }
}

process.exit(rows.every(r => r.ok) ? 0 : 1)
