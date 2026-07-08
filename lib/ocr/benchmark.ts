export type HandwritingBenchmarkCategory =
  | 'clean-print'
  | 'mixed-print-cursive'
  | 'messy-cursive'
  | 'notebook-paper'
  | 'low-contrast'
  | 'camera-photo'
  | 'form-fill'

export type OcrRoute = 'florence' | 'trocr' | 'tesseract' | 'unknown'

export interface BenchmarkResult {
  fixture: string
  category: HandwritingBenchmarkCategory
  cer: number
  wer: number
  lineBreakAccuracy: number
  route: OcrRoute
}

export interface BenchmarkSummary {
  fixtureCount: number
  average: {
    cer: number
    wer: number
    lineBreakAccuracy: number
  }
  routeCounts: Partial<Record<OcrRoute, number>>
  byCategory: Record<HandwritingBenchmarkCategory, {
    fixtureCount: number
    average: {
      cer: number
      wer: number
      lineBreakAccuracy: number
    }
  }>
}

export function normalizeForBenchmark(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function levenshteinChars(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1]
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

function levenshteinTokens(a: string[], b: string[]): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1]
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

export function cer(predicted: string, groundTruth: string): number {
  const p = normalizeForBenchmark(predicted)
  const g = normalizeForBenchmark(groundTruth)
  if (!g.length) return 0
  return levenshteinChars(p, g) / g.length
}

export function wer(predicted: string, groundTruth: string): number {
  const p = normalizeForBenchmark(predicted).split(/\s+/).filter(Boolean)
  const g = normalizeForBenchmark(groundTruth).split(/\s+/).filter(Boolean)
  if (!g.length) return 0
  return levenshteinTokens(p, g) / g.length
}

export function lineBreakAccuracy(predicted: string, groundTruth: string): number {
  const p = predicted
    .split('\n')
    .map(line => normalizeForBenchmark(line))
    .filter(Boolean)
  const g = groundTruth
    .split('\n')
    .map(line => normalizeForBenchmark(line))
    .filter(Boolean)

  if (!g.length) return 1
  const distance = levenshteinTokens(p, g)
  return Math.max(0, 1 - (distance / g.length))
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((sum, n) => sum + n, 0) / nums.length : 0
}

export function summarizeBenchmarkResults(results: BenchmarkResult[]): BenchmarkSummary {
  const categories: HandwritingBenchmarkCategory[] = [
    'clean-print',
    'mixed-print-cursive',
    'messy-cursive',
    'notebook-paper',
    'low-contrast',
    'camera-photo',
    'form-fill',
  ]

  const byCategory = Object.fromEntries(
    categories.map(category => {
      const bucket = results.filter(r => r.category === category)
      return [category, {
        fixtureCount: bucket.length,
        average: {
          cer: avg(bucket.map(r => r.cer)),
          wer: avg(bucket.map(r => r.wer)),
          lineBreakAccuracy: avg(bucket.map(r => r.lineBreakAccuracy)),
        },
      }]
    }),
  ) as BenchmarkSummary['byCategory']

  const routeCounts = results.reduce<Partial<Record<OcrRoute, number>>>((acc, result) => {
    acc[result.route] = (acc[result.route] ?? 0) + 1
    return acc
  }, {})

  return {
    fixtureCount: results.length,
    average: {
      cer: avg(results.map(r => r.cer)),
      wer: avg(results.map(r => r.wer)),
      lineBreakAccuracy: avg(results.map(r => r.lineBreakAccuracy)),
    },
    routeCounts,
    byCategory,
  }
}
