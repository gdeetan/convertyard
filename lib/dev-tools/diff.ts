export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  oldNum?: number
  newNum?: number
  text: string
  wordDiff?: Array<{ text: string; type: 'added' | 'removed' | 'unchanged' }>
}

export async function computeDiff(original: string, changed: string): Promise<DiffLine[]> {
  const { diffLines, diffWords } = await import('diff')
  const parts = diffLines(original, changed)
  const result: DiffLine[] = []
  let oldLine = 1
  let newLine = 1

  for (const part of parts) {
    const lines = part.value.split('\n')
    if (lines[lines.length - 1] === '') lines.pop()

    for (const text of lines) {
      if (part.added) {
        result.push({ type: 'added', newNum: newLine++, text })
      } else if (part.removed) {
        result.push({ type: 'removed', oldNum: oldLine++, text })
      } else {
        result.push({ type: 'unchanged', oldNum: oldLine++, newNum: newLine++, text })
      }
    }
  }

  // Word-level diffs for adjacent removed/added pairs
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].type === 'removed' && result[i + 1].type === 'added') {
      const wd = diffWords(result[i].text, result[i + 1].text)
      result[i].wordDiff = wd
        .filter(p => !p.added)
        .map(p => ({ text: p.value, type: (p.removed ? 'removed' : 'unchanged') as DiffLine['type'] }))
      result[i + 1].wordDiff = wd
        .filter(p => !p.removed)
        .map(p => ({ text: p.value, type: (p.added ? 'added' : 'unchanged') as DiffLine['type'] }))
    }
  }

  return result
}

export function toUnifiedDiff(lines: DiffLine[], filenameA = 'original', filenameB = 'changed'): string {
  const out = [`--- ${filenameA}`, `+++ ${filenameB}`]
  for (const line of lines) {
    if (line.type === 'added') out.push(`+${line.text}`)
    else if (line.type === 'removed') out.push(`-${line.text}`)
    else out.push(` ${line.text}`)
  }
  return out.join('\n')
}
