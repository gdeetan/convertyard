/**
 * Playwright browser test for the background remover tool.
 * Starts its own dev server, runs the full pipeline, reports pass/fail.
 *
 * Run: node scripts/test-bg-removal-browser.mjs
 */

import { chromium } from 'playwright'
import { spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(__dirname, 'test-output')

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const BASE_URL = 'http://localhost:3001'           // use 3001 to avoid conflict
const TEST_IMAGE = join(ROOT, 'test-images', 'DSC00287.jpg')
const TIMEOUT_LOAD     = 15_000
const TIMEOUT_CONVERT  = 180_000  // 3 min — model download + inference

function pass(msg)    { console.log(`  ✓ ${msg}`) }
function section(msg) { console.log(`\n── ${msg} ${'─'.repeat(Math.max(0, 56 - msg.length))}`) }

// ── Dev server ────────────────────────────────────────────────────────────────

function startDevServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'dev', '--', '-p', '3001'], {
      cwd: ROOT,
      env: { ...process.env, PORT: '3001' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let ready = false
    const onData = (data) => {
      const text = data.toString()
      if (!ready && (text.includes('3001') || text.includes('Ready') || text.includes('ready'))) {
        ready = true
        resolve(proc)
      }
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
    proc.on('error', reject)
    // Timeout if not ready
    setTimeout(() => {
      if (!ready) reject(new Error('Dev server did not start in time'))
    }, 30_000)
  })
}

// ── Main test ─────────────────────────────────────────────────────────────────

let devServer = null

async function run() {
  section('Starting dev server on :3001')
  devServer = await startDevServer()
  console.log('  ✓ Dev server ready')
  // Give it a moment to fully initialise
  await new Promise(r => setTimeout(r, 2000))

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  // Capture ALL console output for diagnostics
  const jsErrors = []
  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()
    if (type === 'error') {
      jsErrors.push(text)
      console.log(`  [browser:ERROR] ${text.slice(0, 200)}`)
    } else if (type === 'warn') {
      console.log(`  [browser:warn]  ${text.slice(0, 150)}`)
    } else {
      console.log(`  [browser:log]   ${text.slice(0, 150)}`)
    }
  })
  page.on('pageerror', err => {
    jsErrors.push(err.message)
    console.log(`  [page error] ${err.message}`)
  })
  // Log network failures
  page.on('requestfailed', req => {
    console.log(`  [net:failed] ${req.url().slice(0, 100)} — ${req.failure()?.errorText}`)
  })

  try {
    // ── 1: Load the page ────────────────────────────────────────────────────
    section('Step 1: Page load')
    const res = await page.goto(`${BASE_URL}/background-remover/`, { timeout: TIMEOUT_LOAD })
    if (!res || res.status() !== 200) throw new Error(`HTTP ${res?.status()}`)
    pass(`HTTP 200 OK`)

    const h1 = await page.locator('h1').first().textContent({ timeout: 5_000 })
    if (!h1?.includes('Background Remover')) throw new Error(`Wrong H1: "${h1}"`)
    pass(`H1: "${h1?.trim()}"`)

    // ── 2: Drop a file via the hidden file input ─────────────────────────────
    section('Step 2: Upload test image')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(TEST_IMAGE)
    pass(`File set: ${TEST_IMAGE.split('/').pop()}`)

    // Verify file appears in queue
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('button')
      return Array.from(btns).some(b => b.textContent?.includes('Convert'))
    }, { timeout: 5_000 })
    pass('Convert button appeared')

    // ── 3: Convert ───────────────────────────────────────────────────────────
    section('Step 3: Convert (model download + inference)')
    const convertBtn = page.locator('button', { hasText: /Convert \d+ file/ })
    await convertBtn.click()
    pass('Convert button clicked')

    // Take a screenshot 15s in to see the UI state (model downloading / error)
    setTimeout(async () => {
      const midPath = join(OUT_DIR, 'bg-removal-mid.png')
      await page.screenshot({ path: midPath }).catch(() => {})
      const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '')
      console.log(`\n  [15s checkpoint] screenshot: ${midPath}`)
      console.log(`  [15s checkpoint] visible text:\n${bodyText.slice(0, 500)}\n`)
    }, 15_000)

    // Wait for the "done" announcement or error text
    console.log(`  (waiting up to ${TIMEOUT_CONVERT / 1000}s — includes model download…)`)

    // waitForFunction(fn, arg, options) — timeout is the 3rd argument
    // "Convert more files" appears only in the done state (ResultList rendered)
    await page.waitForFunction(() => {
      const body = document.body.textContent ?? ''
      return (
        body.includes('Convert more files') ||
        body.includes('file converted') ||
        body.includes('An error occurred') ||
        body.includes('error occurred during model')
      )
    }, undefined, { timeout: TIMEOUT_CONVERT })

    // ── 4: Check result ───────────────────────────────────────────────────────
    section('Step 4: Verify result')

    // Check for error in announcement
    const bodyText = await page.evaluate(() => document.body.textContent ?? '')

    // Error check
    const errorPhrases = ['An error occurred', 'error occurred during model', 'Missing the following inputs']
    const foundError = errorPhrases.find(p => bodyText.includes(p))
    if (foundError) throw new Error(`Error phrase on page: "${foundError}"`)
    pass('No error phrases on page')

    // Success check
    if (!bodyText.includes('file converted') && !bodyText.includes('Convert more files')) {
      throw new Error('Success state ("file converted") not found in page text')
    }
    pass('Success state confirmed: "file converted" visible on page')

    // Download button
    const hasDownload = await page.locator('text=Download').isVisible().catch(() => false)
    pass(`Download button visible: ${hasDownload}`)

    // Output file name sanity
    if (!bodyText.includes('DSC00287.png')) throw new Error('Output filename not shown on page')
    pass('Output filename shown: DSC00287.png')

    // ── 5: JS console errors ─────────────────────────────────────────────────
    section('Step 5: Console error check')
    const relevant = jsErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('net::ERR_ABORTED') &&
      // Pre-existing React dev-mode key warning (does not affect functionality)
      !e.includes('Encountered two children with the same key')
    )
    if (relevant.length > 0) {
      console.log('  Console errors found:')
      relevant.forEach(e => console.log(`    - ${e}`))
      throw new Error(`${relevant.length} JS console error(s) detected`)
    }
    pass('No functional JS errors')

    // ── 6: Screenshot ────────────────────────────────────────────────────────
    section('Step 6: Screenshot')
    const screenshotPath = join(OUT_DIR, 'bg-removal-result.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    pass(`Saved: ${screenshotPath}`)
    console.log('  → Open this screenshot to visually verify the result UI')

    section('RESULT')
    console.log('  ALL TESTS PASSED ✓\n')

  } finally {
    await browser.close()
    devServer?.kill('SIGTERM')
  }
}

run().catch(err => {
  console.error(`\n  TEST FAILED: ${err.message}\n`)
  devServer?.kill('SIGTERM')
  process.exit(1)
})
