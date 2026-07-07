#!/usr/bin/env node
// scripts/test-ocr-accuracy.mjs
// OCR accuracy harness — measures CER and WER per fixture.
// Runs Tesseract.js directly in Node (no dev server needed; no preprocessing).
// Usage:
//   node scripts/test-ocr-accuracy.mjs              # all fixtures
//   node scripts/test-ocr-accuracy.mjs scan-clean   # specific fixture
//
// Pass --correct to apply dictionary correction (requires Phase 2 complete).
// Record results in tests/ocr-fixtures/BASELINE.md.

import Tesseract from 'tesseract.js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join, basename } from 'path'

const FIXTURES_DIR = resolve('tests/ocr-fixtures')
const CORRECT = process.argv.includes('--correct')
// argv[0] = node, argv[1] = script path, argv[2+] = user args
const FILTER = process.argv.slice(2).find(a => !a.startsWith('-')) ?? null

// ── Metrics ──────────────────────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
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
  const a = predicted.toLowerCase().replace(/\s+/g, ' ').trim()
  const b = groundTruth.toLowerCase().replace(/\s+/g, ' ').trim()
  if (b.length === 0) return 0
  return levenshtein(a, b) / b.length
}

function wer(predicted, groundTruth) {
  const pWords = predicted.toLowerCase().split(/\s+/).filter(Boolean)
  const gWords = groundTruth.toLowerCase().split(/\s+/).filter(Boolean)
  if (gWords.length === 0) return 0
  const gSet = new Set(gWords)
  const matched = pWords.filter(w => gSet.has(w)).length
  return 1 - Math.min(matched, gWords.length) / gWords.length
}

// ── Dictionary correction (basic, for --correct mode) ────────────────────────

const CONFUSION_PAIRS = [
  ['rn', 'm'], ['cl', 'd'], ['li', 'h'], ['vv', 'w'],
  ['0', 'O'], ['O', '0'], ['1', 'l'], ['l', '1'],
  ['5', 'S'], ['S', '5'], ['8', 'B'], ['B', '8'],
  ['ii', 'u'], ['nn', 'm'],
]

let dictWords = null

async function loadDict() {
  if (dictWords) return dictWords
  const dictPath = resolve('public/dicts/en.txt')
  if (!existsSync(dictPath)) {
    console.warn('[correction] Dictionary not found at public/dicts/en.txt — skipping correction')
    return null
  }
  const lines = readFileSync(dictPath, 'utf-8').split('\n').filter(Boolean)
  dictWords = new Set(lines.map(w => w.trim().toLowerCase()))
  console.log(`[correction] Loaded ${dictWords.size} words from dictionary`)
  return dictWords
}

function applyConfusionPairs(word) {
  const lower = word.toLowerCase()
  const candidates = new Set()
  for (const [from, to] of CONFUSION_PAIRS) {
    let idx = lower.indexOf(from)
    while (idx !== -1) {
      candidates.add(lower.slice(0, idx) + to + lower.slice(idx + from.length))
      idx = lower.indexOf(from, idx + 1)
    }
  }
  return Array.from(candidates)
}

function correctText(text, dict) {
  if (!dict) return text
  return text.split(/(\s+)/).map(token => {
    if (/^\s+$/.test(token)) return token
    const stripped = token.replace(/^[^a-zA-Z]+/, '').replace(/[^a-zA-Z]+$/, '')
    if (!stripped || /[0-9@/#./]/.test(token) || dict.has(stripped.toLowerCase())) return token
    const candidates = applyConfusionPairs(stripped).filter(c => dict.has(c))
    if (candidates.length === 1) {
      const orig = stripped[0] === stripped[0].toUpperCase()
        ? candidates[0][0].toUpperCase() + candidates[0].slice(1)
        : candidates[0]
      return token.replace(stripped, orig)
    }
    return token
  }).join('')
}

// ── Runner ────────────────────────────────────────────────────────────────────

function listFixtures() {
  return readdirSync(FIXTURES_DIR)
    .filter(f => /\.(png|jpe?g)$/i.test(f))
    .filter(f => !FILTER || basename(f, /\.[^.]+$/.exec(f)?.[0] ?? '') === FILTER)
    .map(f => {
      const name = f.replace(/\.[^.]+$/, '')
      const txtPath = join(FIXTURES_DIR, `${name}.txt`)
      const groundTruth = existsSync(txtPath)
        ? readFileSync(txtPath, 'utf-8').trim()
        : null
      return { name, imagePath: join(FIXTURES_DIR, f), groundTruth }
    })
    .filter(f => f.groundTruth !== null)
}

async function main() {
  const fixtures = listFixtures()
  if (fixtures.length === 0) {
    console.error('No fixtures found in', FIXTURES_DIR)
    process.exit(1)
  }

  const dict = CORRECT ? await loadDict() : null
  const worker = await Tesseract.createWorker('eng')
  const results = []

  console.log(`\nOCR Accuracy Harness — ${CORRECT ? 'WITH correction' : 'raw baseline'}`)
  console.log('─'.repeat(72))

  for (const { name, imagePath, groundTruth } of fixtures) {
    process.stdout.write(`Processing ${name}... `)
    const { data } = await worker.recognize(imagePath)
    let predicted = data.text.trim()
    if (CORRECT && dict) predicted = correctText(predicted, dict)

    const cerScore = cer(predicted, groundTruth)
    const werScore = wer(predicted, groundTruth)
    results.push({ name, cer: cerScore, wer: werScore })

    console.log(`CER: ${(cerScore * 100).toFixed(1).padStart(5)}%  WER: ${(werScore * 100).toFixed(1).padStart(5)}%`)
    if (process.env.VERBOSE) {
      console.log(`  GT:  ${groundTruth.slice(0, 80)}`)
      console.log(`  OCR: ${predicted.slice(0, 80)}`)
    }
  }

  await worker.terminate()

  console.log('─'.repeat(72))
  const avgCer = results.reduce((s, r) => s + r.cer, 0) / results.length
  const avgWer = results.reduce((s, r) => s + r.wer, 0) / results.length
  console.log(`Average  CER: ${(avgCer * 100).toFixed(1).padStart(5)}%  WER: ${(avgWer * 100).toFixed(1).padStart(5)}%`)
  console.log('\nRecord these numbers in tests/ocr-fixtures/BASELINE.md')
}

main().catch(err => { console.error(err); process.exit(1) })
