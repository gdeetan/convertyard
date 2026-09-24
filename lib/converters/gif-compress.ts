import gifsicle from 'gifsicle-wasm-browser'
import type { ToolOptions, ConversionResult, CompressionMeta } from '@/lib/types'

// Preset → gifsicle flags. Balanced is the default sweet spot.
// Extreme drops every other frame — flagged in UI.
type Preset = 'light' | 'balanced' | 'strong' | 'extreme'

interface PresetFlags {
  optimize: 1 | 2 | 3
  lossy: number
  colors: number
  frameStride: 1 | 2 | 3
}

const PRESETS: Record<Preset, PresetFlags> = {
  light:    { optimize: 3, lossy: 30,  colors: 256, frameStride: 1 },
  balanced: { optimize: 3, lossy: 80,  colors: 256, frameStride: 1 },
  strong:   { optimize: 3, lossy: 140, colors: 128, frameStride: 1 },
  extreme:  { optimize: 3, lossy: 180, colors: 64,  frameStride: 2 },
}

function coerceInt(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? n : fallback
}

function resolveFlags(opts: ToolOptions): PresetFlags {
  const advanced = opts.advanced === true || opts.mode === 'advanced'
  if (advanced) {
    return {
      optimize: 3,
      lossy: Math.max(0, Math.min(200, coerceInt(opts.lossy, 80))),
      colors: [32, 64, 128, 256].includes(coerceInt(opts.colors, 256))
        ? coerceInt(opts.colors, 256) as 32 | 64 | 128 | 256
        : 256,
      frameStride: ([1, 2, 3].includes(coerceInt(opts.frameStride, 1))
        ? coerceInt(opts.frameStride, 1)
        : 1) as 1 | 2 | 3,
    }
  }
  const preset = (typeof opts.preset === 'string' ? opts.preset : 'balanced') as Preset
  return PRESETS[preset] ?? PRESETS.balanced
}

// Build a gifsicle CLI string. Frame drop uses `#0 #2 #4 ...` selectors.
function buildCommand(
  inputName: string,
  outputPath: string,
  flags: PresetFlags,
  frameCount: number | null,
  dither: boolean,
): string {
  const parts: string[] = [`-O${flags.optimize}`, `--lossy=${flags.lossy}`, `--colors=${flags.colors}`]
  if (dither) parts.push('--dither')
  parts.push(inputName)
  if (flags.frameStride > 1 && frameCount && frameCount > 1) {
    const keep: string[] = []
    for (let i = 0; i < frameCount; i += flags.frameStride) keep.push(`#${i}`)
    parts.push(...keep)
  }
  parts.push('-o', outputPath)
  return parts.join(' ')
}

// Probe frame count by asking gifsicle --info. Cheap; needed for --frame selectors.
async function probeFrameCount(file: File): Promise<number | null> {
  try {
    const buf = await file.arrayBuffer()
    const out = await gifsicle.run({
      input: [{ file: buf, name: 'in.gif' }],
      command: ['--info in.gif -o /out/info.txt'],
    })
    const infoFile = out?.[0]?.file
    if (!infoFile) return null
    const text = new TextDecoder().decode(infoFile)
    // "  loop forever" + "  + image #0 ..." lines — count '+ image #'
    const matches = text.match(/\+ image #/g)
    return matches ? matches.length : null
  } catch {
    return null
  }
}

async function runOnce(
  file: File,
  flags: PresetFlags,
  frameCount: number | null,
  dither: boolean,
): Promise<File> {
  const buf = await file.arrayBuffer()
  const command = buildCommand('in.gif', '/out/out.gif', flags, frameCount, dither)
  const out = await gifsicle.run({
    input: [{ file: buf, name: 'in.gif' }],
    command: [command],
  })
  const outFile = out?.[0]?.file
  if (!outFile) throw new Error('gifsicle returned no output')
  const outName = file.name.replace(/\.gif$/i, '') + '-compressed.gif'
  return new File([outFile.buffer as ArrayBuffer], outName, { type: 'image/gif' })
}

// Binary-search lossy level to hit target size (±5%). Up to 6 iterations.
async function compressToTarget(
  file: File,
  targetBytes: number,
  baseFlags: PresetFlags,
  frameCount: number | null,
  dither: boolean,
): Promise<{ file: File; meta: CompressionMeta }> {
  if (file.size <= targetBytes) {
    return {
      file,
      meta: {
        originalBytes: file.size,
        targetBytes,
        achievedBytes: file.size,
        reachedTarget: true,
        isUnchanged: true,
        iterationsUsed: 0,
        appliedSettings: 'Already at or below target size — original returned.',
      },
    }
  }
  let lo = 20
  let hi = 200
  let best: File | null = null
  let bestDelta = Infinity
  let iterationsUsed = 0
  let bestLossy = baseFlags.lossy
  for (let iter = 0; iter < 6; iter++) {
    iterationsUsed++
    const mid = Math.round((lo + hi) / 2)
    const attempt = await runOnce(
      file,
      { ...baseFlags, lossy: mid },
      frameCount,
      dither,
    )
    const delta = Math.abs(attempt.size - targetBytes)
    if (delta < bestDelta) {
      bestDelta = delta
      best = attempt
      bestLossy = mid
    }
    const within = Math.abs(attempt.size - targetBytes) / targetBytes <= 0.05
    if (within) break
    if (attempt.size > targetBytes) lo = mid + 1
    else hi = mid - 1
    if (lo >= hi) break
  }
  const finalFile = best ?? (await runOnce(file, baseFlags, frameCount, dither))
  return {
    file: finalFile,
    meta: {
      originalBytes: file.size,
      targetBytes,
      achievedBytes: finalFile.size,
      reachedTarget: finalFile.size <= targetBytes * 1.05,
      isUnchanged: false,
      iterationsUsed,
      appliedSettings: `lossy=${bestLossy}, colors=${baseFlags.colors}${baseFlags.frameStride > 1 ? `, keep every ${baseFlags.frameStride}${baseFlags.frameStride === 2 ? 'nd' : 'rd'} frame` : ''}`,
    },
  }
}

// Concurrency limiter — cap parallel gifsicle calls to protect memory.
async function withLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      await fn(items[i], i)
    }
  })
  await Promise.all(workers)
}

export async function gifCompress(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void,
): Promise<ConversionResult[]> {
  const flags = resolveFlags(opts)
  const dither = opts.dither === true
  const targetKb = coerceInt(opts.maxSizeKb, 0)
  const targetBytes = targetKb > 0 ? targetKb * 1024 : 0

  const results: ConversionResult[] = new Array(files.length)

  const hw = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
    ? Math.max(1, Math.min(4, navigator.hardwareConcurrency - 1))
    : 2

  await withLimit(files, hw, async (file, i) => {
    if (!file.type.match(/gif/i) && !file.name.match(/\.gif$/i)) {
      const err = new Error(`${file.name}: not a GIF`)
      results[i] = err
      onProgress?.(i, 100)
      onResult?.(i, err)
      return
    }
    try {
      onProgress?.(i, 5)
      const frameCount = flags.frameStride > 1 ? await probeFrameCount(file) : null
      onProgress?.(i, 30)

      let result: ConversionResult
      if (targetBytes > 0) {
        result = await compressToTarget(file, targetBytes, flags, frameCount, dither)
      } else {
        const out = await runOnce(file, flags, frameCount, dither)
        if (out.size >= file.size) {
          result = {
            file,
            notice: 'Already optimized — original file returned (no size reduction possible at these settings).',
          }
        } else {
          result = out
        }
      }
      onProgress?.(i, 100)
      results[i] = result
      onResult?.(i, result)
    } catch (err) {
      const error = new Error(`${file.name}: ${err instanceof Error ? err.message : 'compression failed'}`)
      results[i] = error
      onProgress?.(i, 100)
      onResult?.(i, error)
    }
  })

  return results
}
