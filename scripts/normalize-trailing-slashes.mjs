#!/usr/bin/env node
// One-shot sweep: normalize internal href values to include a trailing slash.
// Matches the `trailingSlash: true` setting in next.config.ts so internal
// clicks don't hit a Cloudflare Pages 301 redirect to add the slash.
//
// Usage: node scripts/normalize-trailing-slashes.mjs
// Review with: git diff
// Delete this script after merging.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'components', 'content', 'lib']
const EXTS = new Set(['.tsx', '.ts', '.mdx', '.md'])
const FILE_EXT_RE = /\.[a-z0-9]{2,5}$/i // skip /foo.xml, /logo.svg, etc.

// Match: href="/..."  or  href='/...'
// Capture: opening quote, path (no quote, no backtick, no $, no space inside)
const HREF_RE = /\bhref=(["'])(\/[^"'`$\s<>]*)\1/g

function shouldSkip(path) {
  if (path === '/') return true
  if (path.startsWith('//')) return true // protocol-relative
  if (path.endsWith('/')) return true
  // Split off anchor / query so we test the base path only
  const base = path.split(/[?#]/)[0]
  if (base === '' || base === '/') return true
  if (base.endsWith('/')) return true
  const lastSegment = base.split('/').pop() || ''
  if (FILE_EXT_RE.test(lastSegment)) return true
  return false
}

function addTrailingSlash(path) {
  // Preserve ?query and #hash: /foo?x=1  → /foo/?x=1
  //                           /foo#top   → /foo/#top
  const qIdx = path.indexOf('?')
  const hIdx = path.indexOf('#')
  let splitIdx = -1
  if (qIdx !== -1 && hIdx !== -1) splitIdx = Math.min(qIdx, hIdx)
  else if (qIdx !== -1) splitIdx = qIdx
  else if (hIdx !== -1) splitIdx = hIdx
  if (splitIdx === -1) return path + '/'
  return path.slice(0, splitIdx) + '/' + path.slice(splitIdx)
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next' || entry === 'out') continue
      yield* walk(full)
    } else if (EXTS.has(extname(entry))) {
      yield full
    }
  }
}

let filesTouched = 0
let totalReplacements = 0
const touched = []

for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir)
  try { statSync(abs) } catch { continue }
  for (const file of walk(abs)) {
    const src = readFileSync(file, 'utf8')
    let count = 0
    const out = src.replace(HREF_RE, (match, quote, path) => {
      if (shouldSkip(path)) return match
      count++
      const next = addTrailingSlash(path)
      return `href=${quote}${next}${quote}`
    })
    if (count > 0) {
      writeFileSync(file, out)
      filesTouched++
      totalReplacements += count
      touched.push({ file: file.replace(ROOT + '/', ''), count })
    }
  }
}

touched.sort((a, b) => b.count - a.count)
for (const t of touched) {
  console.log(`${String(t.count).padStart(4)}  ${t.file}`)
}
console.log('---')
console.log(`Files touched:     ${filesTouched}`)
console.log(`Total replacements: ${totalReplacements}`)
