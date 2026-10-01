const ZERO = '00:00:00'
const norm = (v: string | undefined) => (typeof v === 'string' && v.length > 0 ? v : ZERO)

export function buildTrimArgs(start: string | undefined, end: string | undefined): string[] {
  const s = norm(start)
  const e = norm(end)
  const args: string[] = []
  if (s !== ZERO) args.push('-ss', s)
  if (e !== ZERO) args.push('-to', e)
  return args
}
