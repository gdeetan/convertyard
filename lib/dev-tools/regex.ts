export interface RegexMatch {
  index: number
  end: number
  value: string
  groups: Record<string, string>
}

export interface RegexSegment {
  text: string
  matched: boolean
  matchIndex: number
}

export interface RegexResult {
  matches: RegexMatch[]
  segments: RegexSegment[]
  error?: string
}

export function testRegex(pattern: string, flags: string, testString: string): RegexResult {
  const emptySegments: RegexSegment[] = testString
    ? [{ text: testString, matched: false, matchIndex: -1 }]
    : []

  if (!pattern) {
    return { matches: [], segments: emptySegments }
  }

  let re: RegExp
  try {
    re = new RegExp(pattern, flags)
  } catch (e) {
    return {
      matches: [],
      error: e instanceof Error ? e.message : 'Invalid regex',
      segments: emptySegments,
    }
  }

  const matches: RegexMatch[] = []
  const isGlobal = flags.includes('g') || flags.includes('y')

  if (isGlobal) {
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(testString)) !== null) {
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        value: m[0],
        groups: (m.groups ?? {}) as Record<string, string>,
      })
      if (m[0].length === 0) re.lastIndex++
    }
  } else {
    const m = re.exec(testString)
    if (m) {
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        value: m[0],
        groups: (m.groups ?? {}) as Record<string, string>,
      })
    }
  }

  const segments: RegexSegment[] = []
  let cursor = 0
  for (let i = 0; i < matches.length; i++) {
    const { index, end } = matches[i]
    if (index > cursor) {
      segments.push({ text: testString.slice(cursor, index), matched: false, matchIndex: -1 })
    }
    segments.push({ text: testString.slice(index, end), matched: true, matchIndex: i })
    cursor = end
  }
  if (cursor < testString.length) {
    segments.push({ text: testString.slice(cursor), matched: false, matchIndex: -1 })
  }
  if (segments.length === 0 && testString.length > 0) {
    segments.push({ text: testString, matched: false, matchIndex: -1 })
  }

  return { matches, segments }
}

export const QUICK_PATTERNS = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { label: 'URL', pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]*)?', flags: 'g' },
  { label: 'IPv4', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', flags: 'g' },
  { label: 'Hex color', pattern: '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b', flags: 'g' },
  { label: 'US phone', pattern: '\\(?\\d{3}\\)?[\\s.\\-]?\\d{3}[\\s.\\-]?\\d{4}', flags: 'g' },
  { label: 'ISO date', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g' },
] as const
