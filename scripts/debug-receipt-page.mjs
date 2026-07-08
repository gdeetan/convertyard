import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto('http://localhost:3000/receipt-to-text', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(3000)
await page.screenshot({ path: '/tmp/receipt-page.png', fullPage: true })
const inputs = await page.locator('input').all()
console.log('inputs found:', inputs.length)
for (const inp of inputs) {
  const type = await inp.getAttribute('type')
  console.log(' type:', type)
}
console.log('title:', await page.title())
await browser.close()
