#!/usr/bin/env node
// Handwriting OCR benchmark harness.
//
// Phase 1: fixture taxonomy + metrics on local OCR runner output.
// Current modes:
//   --mode=tesseract-node   existing Node Tesseract baseline
//   --mode=json             score a JSON file of OCR outputs from any runner
//
// Future Phase 2:
//   --mode=browser-tool     run the live /handwriting-to-text tool via Playwright

import Tesseract from 'tesseract.js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const ROOT = resolve('.')
const FIXTURES_DIR = resolve('tests/ocr-fixtures')
const MANIFEST_PATH = join(FIXTURES_DIR, 'handwriting-manifest.json')
const OUTPUT_PATH = resolve('tests/ocr-fixtures/handwriting-benchmark.latest.json')

const modeArg = process.argv.find(arg => arg.startsWith('--mode=')) ?? '--mode=tesseract-node'
const jsonArg = process.argv.find(arg => arg.startsWith('--input='))
const fixtureArg = process.argv.find(arg => arg.startsWith('--fixture='))
const MODE = modeArg.split('=')[1]
const INPUT_JSON = jsonArg ? resolve(jsonArg.split('=')[1]) : null
const FIXTURE_FILTER = fixtureArg ? fixtureArg.split('=')[1] : null

function normalizeForBenchmark(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function levenshteinChars(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1]
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function levenshteinTokens(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1]
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function cer(predicted, groundTruth) {
  const p = normalizeForBenchmark(predicted)
  const g = normalizeForBenchmark(groundTruth)
  if (!g.length) return 0
  return levenshteinChars(p, g) / g.length
}

function wer(predicted, groundTruth) {
  const p = normalizeForBenchmark(predicted).split(/\s+/).filter(Boolean)
  const g = normalizeForBenchmark(groundTruth).split(/\s+/).filter(Boolean)
  if (!g.length) return 0
  return levenshteinTokens(p, g) / g.length
}

function lineBreakAccuracy(predicted, groundTruth) {
  const p = predicted.split('\n').map(normalizeForBenchmark).filter(Boolean)
  const g = groundTruth.split('\n').map(normalizeForBenchmark).filter(Boolean)
  if (!g.length) return 1
  const distance = levenshteinTokens(p, g)
  return Math.max(0, 1 - (distance / g.length))
}

function avg(nums) {
  return nums.length ? nums.reduce((sum, n) => sum + n, 0) / nums.length : 0
}

function summarize(results) {
  const byCategory = {}
  for (const result of results) {
    byCategory[result.category] ??= []
    byCategory[result.category].push(result)
  }

  const routeCounts = {}
  for (const result of results) {
    routeCounts[result.route] = (routeCounts[result.route] ?? 0) + 1
  }

  return {
    fixtureCount: results.length,
    average: {
      cer: avg(results.map(r => r.cer)),
      wer: avg(results.map(r => r.wer)),
      lineBreakAccuracy: avg(results.map(r => r.lineBreakAccuracy)),
    },
    routeCounts,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([category, bucket]) => [
        category,
        {
          fixtureCount: bucket.length,
          average: {
            cer: avg(bucket.map(r => r.cer)),
            wer: avg(bucket.map(r => r.wer)),
            lineBreakAccuracy: avg(bucket.map(r => r.lineBreakAccuracy)),
          },
        },
      ]),
    ),
  }
}

function printCategorySummary(summary) {
  const categories = Object.entries(summary.byCategory)
    .filter(([, bucket]) => bucket.fixtureCount > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))

  if (!categories.length) return

  console.log('by-category:')
  for (const [category, bucket] of categories) {
    console.log(
      `  ${category}: n=${bucket.fixtureCount} ` +
      `CER=${(bucket.average.cer * 100).toFixed(1)}% ` +
      `WER=${(bucket.average.wer * 100).toFixed(1)}% ` +
      `lineBreak=${(bucket.average.lineBreakAccuracy * 100).toFixed(1)}%`
    )
  }
}

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
}

async function runTesseractNode(fixtures) {
  const worker = await Tesseract.createWorker('eng')
  const results = []

  for (const fixture of fixtures) {
    const imagePath = join(FIXTURES_DIR, fixture.image)
    const transcriptPath = join(FIXTURES_DIR, fixture.transcript)
    const groundTruth = readFileSync(transcriptPath, 'utf-8').trim()
    const { data } = await worker.recognize(imagePath)
    const predicted = data.text.trim()

    results.push({
      fixture: fixture.id,
      category: fixture.category,
      route: 'tesseract',
      predicted,
      groundTruth,
      cer: cer(predicted, groundTruth),
      wer: wer(predicted, groundTruth),
      lineBreakAccuracy: lineBreakAccuracy(predicted, groundTruth),
    })
  }

  await worker.terminate()
  return results
}

function scoreJson(fixtures, inputPath) {
  if (!inputPath || !existsSync(inputPath)) {
    throw new Error('--input=path/to/results.json is required for --mode=json')
  }

  const input = JSON.parse(readFileSync(inputPath, 'utf-8'))
  const byId = new Map(input.results.map(result => [result.fixture, result]))

  return fixtures.map(fixture => {
    const found = byId.get(fixture.id)
    if (!found) throw new Error(`Missing OCR result for fixture "${fixture.id}"`)
    const groundTruth = readFileSync(join(FIXTURES_DIR, fixture.transcript), 'utf-8').trim()
    const predicted = String(found.predicted ?? '').trim()
    return {
      fixture: fixture.id,
      category: fixture.category,
      route: found.route ?? 'unknown',
      predicted,
      groundTruth,
      cer: cer(predicted, groundTruth),
      wer: wer(predicted, groundTruth),
      lineBreakAccuracy: lineBreakAccuracy(predicted, groundTruth),
    }
  })
}

async function main() {
  const manifest = loadManifest()
  const fixtures = manifest.fixtures.filter(f => f.active !== false).filter(f => !FIXTURE_FILTER || f.id === FIXTURE_FILTER)
  if (!fixtures.length) throw new Error('No fixtures matched the current filter')

  let results
  if (MODE === 'tesseract-node') {
    results = await runTesseractNode(fixtures)
  } else if (MODE === 'json') {
    results = scoreJson(fixtures, INPUT_JSON)
  } else {
    throw new Error(`Unsupported mode "${MODE}". Supported: tesseract-node, json`)
  }

  const payload = {
    mode: MODE,
    generatedAt: new Date().toISOString(),
    manifestVersion: manifest.version,
    summary: summarize(results),
    results,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2))

  console.log(`mode=${MODE}`)
  console.log(`fixtures=${payload.summary.fixtureCount}`)
  console.log(`avg CER=${(payload.summary.average.cer * 100).toFixed(1)}%`)
  console.log(`avg WER=${(payload.summary.average.wer * 100).toFixed(1)}%`)
  console.log(`avg lineBreak=${(payload.summary.average.lineBreakAccuracy * 100).toFixed(1)}%`)
  console.log(`routes=${JSON.stringify(payload.summary.routeCounts)}`)
  printCategorySummary(payload.summary)
  console.log(`output=${OUTPUT_PATH.replace(ROOT + '/', '')}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
