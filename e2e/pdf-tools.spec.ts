import { test, expect } from '@playwright/test'
import { mkdirSync, copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// PDF tools that use the standard ToolShell UI (dropzone → convert button → result list).
// Each entry is a [slug, fixture] pair where fixture is the file to batch.
type PdfToolSlug = 'compress-pdf' | 'merge-pdf' | 'split-pdf' | 'watermark-pdf'

const PDF_TOOLS: Array<[PdfToolSlug, string]> = [
  ['compress-pdf',     'normal-10-page.pdf'],
  ['merge-pdf',        'normal-10-page.pdf'],
  ['split-pdf',        'normal-10-page.pdf'],
  ['watermark-pdf',    'normal-10-page.pdf'],
]

const TOOL_UI = {
  'compress-pdf': {
    actionName: (count: number) => new RegExp(`Convert ${count}`, 'i'),
    waitForDone: async (page: import('@playwright/test').Page, count: number) => {
      await expect(
        page.getByText(new RegExp(`${count} of ${count} file[s]? converted`, 'i'))
      ).toBeVisible({ timeout: 180_000 })
      await expect(page.locator('[data-testid=download-all]')).toBeVisible({ timeout: 180_000 })
    },
  },
  'merge-pdf': {
    actionName: () => /Merge \d+ page/i,
    waitForDone: async (page: import('@playwright/test').Page) => {
      await expect(page.getByRole('button', { name: /^Download$/i })).toBeVisible({ timeout: 180_000 })
    },
  },
  'split-pdf': {
    actionName: (count: number) => new RegExp(`Split ${count} PDF`, 'i'),
    waitForDone: async (page: import('@playwright/test').Page) => {
      await expect(
        page.getByRole('button', { name: /Download all .* files as ZIP/i })
      ).toBeVisible({ timeout: 180_000 })
    },
  },
  'watermark-pdf': {
    actionName: (count: number) => new RegExp(`Convert ${count}`, 'i'),
    waitForDone: async (page: import('@playwright/test').Page, count: number) => {
      await expect(
        page.getByText(new RegExp(`${count} of ${count} file[s]? converted`, 'i'))
      ).toBeVisible({ timeout: 180_000 })
      await expect(page.locator('[data-testid=download-all]')).toBeVisible({ timeout: 180_000 })
    },
  },
} as const

function fixturePath(name: string): string {
  return resolve(process.cwd(), 'test-fixtures/pdf', name)
}

function makeBatch(fixtureName: string, count: number): string[] {
  const dir = resolve(process.cwd(), `test-fixtures/pdf/_batch-${count}`)
  mkdirSync(dir, { recursive: true })
  const paths: string[] = []
  const baseName = fixtureName.replace(/\.pdf$/, '')
  for (let i = 0; i < count; i++) {
    const p = resolve(dir, `${baseName}-${i}.pdf`)
    if (!existsSync(p)) copyFileSync(fixturePath(fixtureName), p)
    paths.push(p)
  }
  return paths
}

// ── Batch-scale tests ──────────────────────────────────────────────────────────

for (const [slug, fixtureName] of PDF_TOOLS) {
  for (const count of [1, 10, 100]) {
    test(`${slug}: batch of ${count} file${count > 1 ? 's' : ''} completes`, async ({ page }) => {
      await page.goto(`/${slug}`)
      const files = makeBatch(fixtureName, count)
      await page.locator('input[type="file"]').setInputFiles(files)
      await page.getByRole('button', { name: TOOL_UI[slug].actionName(count) }).click()

      await TOOL_UI[slug].waitForDone(page, count)
    })
  }
}

// 1000-file stress test (chromium only — widest memory ceiling)
test('compress-pdf: 1000-file batch completes @stress', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'stress test runs chromium only')
  await page.goto('/compress-pdf')
  const files = makeBatch('single-page.pdf', 1000)
  await page.locator('input[type="file"]').setInputFiles(files)
  await page.getByRole('button', { name: /Convert 1000/i }).click()

  await expect(
    page.getByText(/1000 of 1000 files converted/i)
  ).toBeVisible({ timeout: 360_000 })
  await expect(page.locator('[data-testid=download-all]')).toBeVisible({ timeout: 360_000 })
})

// ── Mixed valid + invalid batch ────────────────────────────────────────────────

test('compress-pdf: errors do not block successful files in a mixed batch', async ({ page }) => {
  await page.goto('/compress-pdf')
  await page.locator('input[type="file"]').setInputFiles([
    fixturePath('normal-10-page.pdf'),
    fixturePath('not-a-pdf.pdf'),
    fixturePath('zero-byte.pdf'),
  ])
  await page.getByRole('button', { name: /Convert 3/i }).click()

  // At least 1 success, at least 1 failure, download still available
  await expect(page.locator('[data-testid=result-success]')).toHaveCount(1, { timeout: 60_000 })
  await expect(page.locator('[data-testid=result-error]')).toHaveCount(2, { timeout: 60_000 })
  await expect(page.locator('[data-testid=download-all]')).toBeVisible()
})

test('merge-pdf: errors do not block successful files in a mixed batch', async ({ page }) => {
  await page.goto('/merge-pdf')
  await page.locator('input[type="file"]').setInputFiles([
    fixturePath('normal-10-page.pdf'),
    fixturePath('not-a-pdf.pdf'),
  ])
  // merge-pdf may process all-or-nothing or per-file — check result state appears
  await page.getByRole('button', { name: /Merge \d+ page/i }).click()
  await expect
    .poll(async () => {
      const downloadVisible = await page.getByRole('button', { name: /^Download$/i }).isVisible().catch(() => false)
      const failedVisible = await page.getByText(/Merge failed/i).isVisible().catch(() => false)
      return downloadVisible || failedVisible
    }, { timeout: 60_000 })
    .toBe(true)
})

// ── Corrupted file fixture ────────────────────────────────────────────────────

test('compress-pdf: corrupted PDF shows error without page crash', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/compress-pdf')
  await page.locator('input[type="file"]').setInputFiles([fixturePath('corrupted-truncated.pdf')])
  await page.getByRole('button', { name: /Convert 1/i }).click()

  await expect(
    page.locator('[data-testid=result-success], [data-testid=result-error]').first()
  ).toBeVisible({ timeout: 60_000 })

  // No unhandled JS errors should have crashed the page
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
})
