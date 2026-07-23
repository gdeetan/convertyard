// Tests sanitizePdfText logic extracted from pdf.ts
// Run: node scripts/test-sanitize-pdf-text.mjs

const WINI_UNICODE_MAP = {
  ' ': ' ', '​': '', '‌': '', '‍': '', '﻿': '',
  ' ': ' ', ' ': ' ',
  '‘': "'", '’': "'", '‚': "'", '‛': "'",
  '“': '"', '”': '"', '„': '"', '‟': '"',
  '‹': '<', '›': '>',
  '‐': '-', '‑': '-', '‒': '-', '–': '-', '—': '--',
  '―': '--', '−': '-',
  '…': '...',
  '←': '<-', '↑': '^', '→': '->', '↓': 'v',
  '⇐': '<=', '⇒': '=>', '⇔': '<=>',
  '➔': '->', '➡': '->',
  '·': '.', '⋅': '.', '∙': '.',
  '×': 'x', '⋆': '*', '∗': '*',
  '÷': '/',
  '≠': '!=', '≤': '<=', '≥': '>=',
  '∞': 'inf', '≈': '~=', '≡': '===',
  '±': '+/-', '′': "'", '″': '"',
  '²': '2', '³': '3', '¹': '1',
  '⁰': '0', '⁴': '4', '⁵': '5', '⁶': '6',
  '⁷': '7', '⁸': '8', '⁹': '9',
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
  'ε': 'epsilon', 'η': 'eta', 'θ': 'theta', 'λ': 'lambda',
  'μ': 'mu', 'ν': 'nu', 'π': 'pi', 'ρ': 'rho',
  'σ': 'sigma', 'τ': 'tau', 'φ': 'phi', 'ψ': 'psi',
  'ω': 'omega', 'Δ': 'Delta', 'Ω': 'Omega', 'Σ': 'Sigma',
  'Π': 'Pi', 'Φ': 'Phi', 'Ψ': 'Psi',
  '•': '*', '‣': '>', '●': '*', '▪': '*',
  '✓': 'v', '✔': 'v', '✘': 'x', '✗': 'x',
  '✅': 'v', '❌': 'x',
  '©': '(c)', '®': '(R)', '™': '(TM)',
  '°': 'deg',
  '€': 'EUR', '£': 'GBP', '¥': 'JPY',
  '№': 'No.',
  '«': '<<', '»': '>>',
  '†': '+', '‡': '++', '‰': '%',
  '─': '-', '━': '-', '│': '|', '┃': '|',
  '┌': '+', '┐': '+', '└': '+', '┘': '+',
  '├': '+', '┤': '+', '┬': '+', '┴': '+', '┼': '+',
  '═': '=', '║': '|', '╔': '+', '╗': '+',
  '╚': '+', '╝': '+',
}

const WINI_EXTENDED = new Set([
  0x0152, 0x0153, 0x0160, 0x0161, 0x0178, 0x017D, 0x017E,
  0x0192, 0x02C6, 0x02DC, 0x2013, 0x2014, 0x2018, 0x2019,
  0x201A, 0x201C, 0x201D, 0x201E, 0x2020, 0x2021, 0x2022,
  0x2026, 0x2030, 0x2039, 0x203A, 0x20AC, 0x2122,
])

function sanitizePdfText(s) {
  let result = s.replace(/[\r\n\t]/g, ' ').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
  for (const [from, to] of Object.entries(WINI_UNICODE_MAP)) {
    if (result.includes(from)) result = result.split(from).join(to)
  }
  return Array.from(result).filter(ch => {
    const cp = ch.codePointAt(0)
    return (cp >= 0x20 && cp <= 0x7E) || (cp >= 0xA0 && cp <= 0xFF) || WINI_EXTENDED.has(cp)
  }).join('')
}

const tests = [
  // The exact errors reported
  { input: 'Use → for arrows', expected_contains: '->' },
  { input: 'newline\nembedded', no_contains: '\n' },
  { input: 'tab\there', no_contains: '\t' },
  // Smart quotes
  { input: '“Hello”', expected_contains: '"Hello"' },
  { input: "it’s fine", expected_contains: "it's fine" },
  // Dashes
  { input: 'em—dash', expected_contains: 'em--dash' },
  { input: 'en–dash', expected_contains: 'en-dash' },
  // Ellipsis
  { input: 'wait…', expected_contains: 'wait...' },
  // Arrows
  { input: '← back', expected_contains: '<- back' },
  { input: '↑ up', expected_contains: '^ up' },
  { input: '↓ down', expected_contains: 'v down' },
  { input: '⇒ implies', expected_contains: '=> implies' },
  // Math
  { input: '2 ≠ 3', expected_contains: '2 != 3' },
  { input: 'x ≤ y', expected_contains: 'x <= y' },
  { input: 'x ≥ y', expected_contains: 'x >= y' },
  { input: '∞ loop', expected_contains: 'inf loop' },
  { input: '2² + 3³', expected_contains: '22 + 33' },
  // Greek
  { input: 'π = 3.14', expected_contains: 'pi = 3.14' },
  { input: 'α-β test', expected_contains: 'alpha-beta test' },
  // Checkmarks
  { input: '✓ done', expected_contains: 'v done' },
  { input: '✗ fail', expected_contains: 'x fail' },
  // Box drawing (code blocks)
  { input: '┌──┐', expected_contains: '+--+' },
  // Emoji (should be stripped)
  { input: 'hello 🎉 world', no_contains: '🎉' },
  { input: 'emoji 😀 here', expected_contains: 'emoji  here' },
  // CJK (should be stripped)
  { input: '中文 text', no_contains: '中' },
  // Zero-width chars
  { input: 'a​b', no_contains: '​' },
  // Normal Latin chars preserved
  { input: 'Hello, World! 123', expected: 'Hello, World! 123' },
  { input: 'café naïve résumé', expected: 'café naïve résumé' },
  // Copyright / TM (actual WinAnsi chars)
  { input: '© 2024', expected_contains: '(c) 2024' },
  { input: 'Brand™', expected_contains: 'Brand(TM)' },
  // Bullet (mapped to *)
  { input: '• item', expected_contains: '* item' },
  // Control chars stripped
  { input: 'a\x01b\x1Fc', expected: 'abc' },
  // Mixed real-world markdown content
  { input: 'Step 1 → Step 2 → Step 3', expected_contains: 'Step 1 -> Step 2 -> Step 3' },
  { input: '"Smart quotes" and ‘single’', expected_contains: '"Smart quotes" and \'single\'' },
]

let pass = 0, fail = 0
for (const t of tests) {
  const out = sanitizePdfText(t.input)
  let ok = true
  let reason = ''
  if (t.expected !== undefined && out !== t.expected) {
    ok = false; reason = `expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(out)}`
  }
  if (t.expected_contains && !out.includes(t.expected_contains)) {
    ok = false; reason = `expected to contain ${JSON.stringify(t.expected_contains)}, got ${JSON.stringify(out)}`
  }
  if (t.no_contains && out.includes(t.no_contains)) {
    ok = false; reason = `expected NOT to contain ${JSON.stringify(t.no_contains)}, got ${JSON.stringify(out)}`
  }
  if (ok) {
    console.log(`  PASS  ${JSON.stringify(t.input).slice(0, 50)} → ${JSON.stringify(out).slice(0, 50)}`)
    pass++
  } else {
    console.log(`  FAIL  ${JSON.stringify(t.input).slice(0, 50)} — ${reason}`)
    fail++
  }
}
console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
