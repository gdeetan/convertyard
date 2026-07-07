// scripts/generate-ocr-fixtures.ts
// Generates OCR test fixture images by rendering HTML to screenshots via Playwright.
// Run once: npx tsx scripts/generate-ocr-fixtures.ts
// Commit the generated images + .txt files to tests/ocr-fixtures/

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const DIR = 'tests/ocr-fixtures'
mkdirSync(DIR, { recursive: true })

const FIXTURES: Array<{
  name: string
  groundTruth: string
  html: string
  format: 'png' | 'jpeg'
}> = [
  {
    name: 'scan-clean',
    format: 'png',
    groundTruth: 'The quick brown fox jumps over the lazy dog.\nThis is a simple test of optical character recognition.\nThe year is 2024 and technology continues to advance.',
    html: `<!DOCTYPE html><html><body style="font: 18px Georgia; padding: 40px; background: #fff; color: #000; max-width: 600px; margin: 0">
      <p style="margin: 0 0 12px">The quick brown fox jumps over the lazy dog.</p>
      <p style="margin: 0 0 12px">This is a simple test of optical character recognition.</p>
      <p style="margin: 0">The year is 2024 and technology continues to advance.</p>
    </body></html>`,
  },
  {
    name: 'scan-names',
    format: 'png',
    groundTruth: 'iPhone 15, SKU X9-4471, Dr. Nkemelu\nOrder #88234 — $149.99\nShipping to: O\'Brien, CO 80211\nTracking: FX-9921-DELTA',
    html: `<!DOCTYPE html><html><body style="font: 16px 'Courier New', monospace; padding: 40px; background: #fff; color: #000; margin: 0">
      <p style="margin: 0 0 10px">iPhone 15, SKU X9-4471, Dr. Nkemelu</p>
      <p style="margin: 0 0 10px">Order #88234 — $149.99</p>
      <p style="margin: 0 0 10px">Shipping to: O'Brien, CO 80211</p>
      <p style="margin: 0">Tracking: FX-9921-DELTA</p>
    </body></html>`,
  },
  {
    name: 'receipt-real',
    format: 'jpeg',
    groundTruth: "TRADER JOSE'S MARKET\n123 Main St, Portland OR\nDate: 12/14/2024\nSubtotal: $47.83\nTax (8.5%): $4.07\nTotal: $51.90\nThank you for shopping with us!",
    html: `<!DOCTYPE html><html><body style="font: 14px 'Courier New', monospace; padding: 30px; background: #fafafa; color: #111; width: 320px; margin: 0">
      <div style="text-align:center; font-weight:bold; font-size:16px; margin-bottom:4px">TRADER JOSE'S MARKET</div>
      <div style="text-align:center; margin-bottom:10px">123 Main St, Portland OR</div>
      <div style="margin-bottom:4px">Date: 12/14/2024</div>
      <hr style="border: none; border-top: 1px solid #ccc; margin: 8px 0"/>
      <div style="margin-bottom:4px">Subtotal: $47.83</div>
      <div style="margin-bottom:4px">Tax (8.5%): $4.07</div>
      <div style="font-weight:bold; margin-bottom:10px">Total: $51.90</div>
      <div style="text-align:center">Thank you for shopping with us!</div>
    </body></html>`,
  },
  {
    name: 'photo-printed',
    format: 'jpeg',
    groundTruth: 'Meeting Notes — Project Alpha\nDate: October 15, 2024\nAction items:\n1. Review the proposal by Friday\n2. Schedule follow-up with the team\n3. Update the project timeline',
    html: `<!DOCTYPE html><html><body style="font: 16px Arial, sans-serif; padding: 40px; background: #fff; color: #222; max-width: 500px; margin: 0">
      <h2 style="margin: 0 0 4px; font-size: 18px">Meeting Notes — Project Alpha</h2>
      <p style="color:#666; margin: 0 0 16px; font-size:14px">Date: October 15, 2024</p>
      <p style="margin: 0 0 8px; font-weight: bold">Action items:</p>
      <ol style="margin: 0; padding-left: 20px">
        <li style="margin-bottom: 6px">Review the proposal by Friday</li>
        <li style="margin-bottom: 6px">Schedule follow-up with the team</li>
        <li>Update the project timeline</li>
      </ol>
    </body></html>`,
  },
  {
    name: 'photo-lowres',
    format: 'jpeg',
    groundTruth: 'Invoice #1042\nClient: Acme Corp\nAmount Due: $320.00\nDue Date: Nov 30, 2024',
    html: `<!DOCTYPE html><html><body style="font: 12px Arial, sans-serif; padding: 20px; background: #fff; color: #333; width: 240px; margin: 0">
      <div style="margin-bottom: 6px">Invoice #1042</div>
      <div style="margin-bottom: 6px">Client: Acme Corp</div>
      <div style="margin-bottom: 6px">Amount Due: $320.00</div>
      <div>Due Date: Nov 30, 2024</div>
    </body></html>`,
  },
]

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const f of FIXTURES) {
    await page.setContent(f.html, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(200)

    const buf = await page.screenshot({
      type: f.format === 'jpeg' ? 'jpeg' : 'png',
      ...(f.format === 'jpeg' ? { quality: 90 } : {}),
      fullPage: true,
    })
    const ext = f.format === 'jpeg' ? 'jpg' : 'png'
    writeFileSync(`${DIR}/${f.name}.${ext}`, buf)
    writeFileSync(`${DIR}/${f.name}.txt`, f.groundTruth)
    console.log(`Generated ${f.name}.${ext} (${buf.length} bytes)`)
  }

  await browser.close()
  console.log(`\nDone. Commit files in ${DIR}`)
}

main().catch(err => { console.error(err); process.exit(1) })
