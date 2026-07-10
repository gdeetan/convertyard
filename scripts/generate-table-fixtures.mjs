#!/usr/bin/env node
// scripts/generate-table-fixtures.mjs
// Generates synthetic table fixture PNGs using Playwright.
// All output goes to tests/table-fixtures/.
//
// Usage: node scripts/generate-table-fixtures.mjs
//
// Fixtures produced are SYNTHETIC (HTML rendered to PNG). Real screenshots
// should replace at least 4 of these before shipping. See tests/table-fixtures/README.md.

import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../tests/table-fixtures')

const FIXTURES = [
  {
    name: 'bordered-clean-01',
    html: `
      <table border="1" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        <thead>
          <tr style="background:#f0f0f0;font-weight:bold;">
            <th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Widget A</td><td>100</td><td>12.50</td><td>1250.00</td></tr>
          <tr><td>Widget B</td><td>50</td><td>8.75</td><td>437.50</td></tr>
          <tr><td>Widget C</td><td>200</td><td>3.25</td><td>650.00</td></tr>
          <tr><td>Gadget X</td><td>75</td><td>24.00</td><td>1800.00</td></tr>
          <tr><td>Gadget Y</td><td>30</td><td>49.99</td><td>1499.70</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    name: 'borderless-spacing-01',
    html: `
      <table cellpadding="10" cellspacing="0"
             style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        <thead>
          <tr style="border-bottom:2px solid #333;font-weight:bold;">
            <th style="text-align:left;padding-right:40px;">Name</th>
            <th style="text-align:left;padding-right:40px;">Department</th>
            <th style="text-align:right;padding-right:40px;">Salary</th>
            <th style="text-align:right;">Start Year</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding-right:40px;">Alice Johnson</td><td style="padding-right:40px;">Engineering</td><td style="text-align:right;padding-right:40px;">95000</td><td style="text-align:right;">2019</td></tr>
          <tr><td style="padding-right:40px;">Bob Smith</td><td style="padding-right:40px;">Marketing</td><td style="text-align:right;padding-right:40px;">72000</td><td style="text-align:right;">2021</td></tr>
          <tr><td style="padding-right:40px;">Carol White</td><td style="padding-right:40px;">Design</td><td style="text-align:right;padding-right:40px;">88000</td><td style="text-align:right;">2020</td></tr>
          <tr><td style="padding-right:40px;">David Lee</td><td style="padding-right:40px;">Engineering</td><td style="text-align:right;padding-right:40px;">105000</td><td style="text-align:right;">2018</td></tr>
          <tr><td style="padding-right:40px;">Eva Martinez</td><td style="padding-right:40px;">Product</td><td style="text-align:right;padding-right:40px;">91000</td><td style="text-align:right;">2022</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    name: 'numeric-dense-01',
    html: `
      <table border="1" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-family:'Courier New',monospace;font-size:13px;">
        <thead>
          <tr style="background:#e0e0e0;font-weight:bold;">
            <th>Quarter</th><th>Revenue</th><th>Expenses</th><th>Profit</th><th>Margin</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Q1 2024</td><td>1250000</td><td>875000</td><td>375000</td><td>30.0</td></tr>
          <tr><td>Q2 2024</td><td>1380000</td><td>920000</td><td>460000</td><td>33.3</td></tr>
          <tr><td>Q3 2024</td><td>1195000</td><td>810000</td><td>385000</td><td>32.2</td></tr>
          <tr><td>Q4 2024</td><td>1520000</td><td>980000</td><td>540000</td><td>35.5</td></tr>
          <tr style="font-weight:bold;background:#f5f5f5;"><td>Total</td><td>5345000</td><td>3585000</td><td>1760000</td><td>32.9</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    name: 'repeated-values-01',
    html: `
      <table border="1" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        <thead>
          <tr style="background:#f0f0f0;font-weight:bold;">
            <th>Item</th><th>Category</th><th>Price</th><th>Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Product A</td><td>Electronics</td><td>299.99</td><td>50</td></tr>
          <tr><td>Product B</td><td>Electronics</td><td>299.99</td><td>75</td></tr>
          <tr><td>Product C</td><td>Electronics</td><td>299.99</td><td>30</td></tr>
          <tr><td>Product D</td><td>Electronics</td><td>149.99</td><td>100</td></tr>
          <tr><td>Product E</td><td>Electronics</td><td>149.99</td><td>200</td></tr>
          <tr><td>Product F</td><td>Electronics</td><td>149.99</td><td>85</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    name: 'merged-header-01',
    html: `
      <table border="1" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        <thead>
          <tr style="background:#d0d0d0;font-weight:bold;">
            <th rowspan="2">Region</th>
            <th colspan="4" style="text-align:center;">Quarterly Sales</th>
          </tr>
          <tr style="background:#e8e8e8;font-weight:bold;">
            <th>Q1 Sales</th><th>Q2 Sales</th><th>Q3 Sales</th><th>Q4 Sales</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>North</td><td>42500</td><td>38900</td><td>51200</td><td>67800</td></tr>
          <tr><td>South</td><td>31000</td><td>29500</td><td>35600</td><td>41200</td></tr>
          <tr><td>East</td><td>55000</td><td>61000</td><td>58900</td><td>72400</td></tr>
          <tr><td>West</td><td>28000</td><td>32100</td><td>29700</td><td>38500</td></tr>
        </tbody>
      </table>
    `,
  },
]

async function main() {
  const browser = await chromium.launch()
  // 3x device scale factor — Tesseract needs characters at least 20-30px tall
  const page = await browser.newPage({ deviceScaleFactor: 3 })

  for (const { name, html } of FIXTURES) {
    const outPath = `${OUT_DIR}/${name}.png`

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body style="margin:20px;background:white;">
        ${html}
      </body>
      </html>
    `)

    await page.waitForLoadState('domcontentloaded')
    const table = page.locator('table')
    await table.screenshot({ path: outPath })

    console.log(`✓ ${name}.png`)
  }

  await browser.close()
  console.log(`\nAll ${FIXTURES.length} fixtures written to tests/table-fixtures/`)
  console.log('NOTE: These are SYNTHETIC. Replace with real screenshots before shipping.')
}

main().catch(err => { console.error(err); process.exit(1) })
