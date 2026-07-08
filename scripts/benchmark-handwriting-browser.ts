#!/usr/bin/env -S npx tsx

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

import { inferRouteFromLogs } from '../lib/ocr/browser-benchmark'

type ManifestFixture = {
  id: string
  image: string
  transcript: string
  category: string
  active?: boolean
  notes?: string
}

type Manifest = {
  version: number
  fixtures: ManifestFixture[]
}

const FIXTURES_DIR = resolve('tests/ocr-fixtures')
const MANIFEST_PATH = join(FIXTURES_DIR, 'handwriting-manifest.json')
const OUTPUT_DIR = join(FIXTURES_DIR, 'captures')
const OUTPUT_PATH = join(FIXTURES_DIR, 'handwriting-browser-capture.latest.json')

const baseUrlArg = process.argv.find(arg => arg.startsWith('--base-url='))
const fixtureArg = process.argv.find(arg => arg.startsWith('--fixture='))
const engineArg = process.argv.find(arg => arg.startsWith('--engine='))
const qualityArg = process.argv.find(arg => arg.startsWith('--quality='))

const BASE_URL = baseUrlArg ? baseUrlArg.split('=')[1] : 'https://convertyard.com'
const FIXTURE_FILTER = fixtureArg ? fixtureArg.split('=')[1] : null
const ENGINE = engineArg ? engineArg.split('=')[1] : 'ai-enhanced'
const QUALITY = qualityArg ? qualityArg.split('=')[1] : 'quality'

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
}

function ensureFixtureFiles(fixtures: ManifestFixture[]) {
  const missing: string[] = []
  for (const fixture of fixtures) {
    if (!existsSync(join(FIXTURES_DIR, fixture.image))) missing.push(`${fixture.id}: missing image ${fixture.image}`)
    if (!existsSync(join(FIXTURES_DIR, fixture.transcript))) missing.push(`${fixture.id}: missing transcript ${fixture.transcript}`)
  }
  if (missing.length) {
    throw new Error(`Fixture files missing:\n${missing.join('\n')}`)
  }
}

async function selectRadio(page: import('@playwright/test').Page, text: string) {
  await page.locator('label').filter({ hasText: text }).first().click()
}

async function captureFixture(page: import('@playwright/test').Page, fixture: ManifestFixture) {
  const consoleMessages: string[] = []
  const consoleHandler = (msg: import('@playwright/test').ConsoleMessage) => {
    const text = msg.text()
    if (
      text.includes('[Florence-2]') ||
      text.includes('[TrOCR]') ||
      text.includes('[correction]')
    ) {
      consoleMessages.push(text)
    }
  }

  page.on('console', consoleHandler)

  try {
    await page.goto(`${BASE_URL.replace(/\/$/, '')}/handwriting-to-text/`, { waitUntil: 'networkidle', timeout: 120_000 })

    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles(join(FIXTURES_DIR, fixture.image))

    await selectRadio(page, ENGINE === 'ai-enhanced'
      ? 'AI-Enhanced — English only, ~262MB (may be cached)'
      : 'Standard — all languages, no download')

    if (ENGINE === 'ai-enhanced') {
      await selectRadio(page, QUALITY === 'fast'
        ? 'Fast — greedy, quicker'
        : 'Quality — beam search, slower')
    }

    await page.getByRole('button', { name: /Convert 1 file/i }).click()

    const review = page.getByLabel('Extracted text — editable')
    await review.waitFor({ timeout: 300_000 })
    const predicted = (await review.innerText()).trim()

    const route = inferRouteFromLogs(consoleMessages)

    if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })
    await page.screenshot({
      path: join(OUTPUT_DIR, `${fixture.id}.png`),
      fullPage: true,
    })

    return {
      fixture: fixture.id,
      category: fixture.category,
      route,
      predicted,
      consoleMessages,
    }
  } finally {
    page.off('console', consoleHandler)
  }
}

async function main() {
  const manifest = loadManifest()
  const fixtures = manifest.fixtures.filter(f => f.active !== false).filter(f => !FIXTURE_FILTER || f.id === FIXTURE_FILTER)
  if (!fixtures.length) throw new Error('No fixtures matched the current filter')
  ensureFixtureFiles(fixtures)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const results = []
  for (const fixture of fixtures) {
    console.log(`capturing ${fixture.id}...`)
    const result = await captureFixture(page, fixture)
    results.push(result)
    await page.goto('about:blank')
  }

  await browser.close()

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    engine: ENGINE,
    quality: QUALITY,
    results,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2))
  const byCategory = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.category] = (acc[result.category] ?? 0) + 1
    return acc
  }, {})
  const routeCounts = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.route] = (acc[result.route] ?? 0) + 1
    return acc
  }, {})
  console.log(`fixtures=${results.length}`)
  console.log(`categories=${JSON.stringify(byCategory)}`)
  console.log(`routes=${JSON.stringify(routeCounts)}`)
  console.log(`output=${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
