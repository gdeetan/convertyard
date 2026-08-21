import type { AiSignature, AiGenerator } from './exif-viewer.types'

/**
 * Spec §6. Absence of a match is NOT proof the image is human-authored —
 * that disclaimer lives in the UI.
 */
export function detectAiSignatures(
  raw: Record<string, unknown>,
  opts: { hasC2pa?: boolean } = {},
): AiSignature[] {
  const out: AiSignature[] = []
  const str = (k: string): string | undefined => {
    const v = raw[k]
    return typeof v === 'string' ? v : undefined
  }

  if (str('workflow')) {
    out.push({ generator: 'comfyui', detail: 'ComfyUI workflow chunk present' })
  } else if (str('parameters') || str('prompt')) {
    out.push({
      generator: 'stable-diffusion',
      detail: (str('parameters') ?? str('prompt') ?? '').slice(0, 500),
    })
  }

  const creator = str('dc:creator') ?? str('creator') ?? ''
  const creatorTool = str('xmp:CreatorTool') ?? str('CreatorTool') ?? ''
  if (/midjourney/i.test(creator) || /midjourney/i.test(creatorTool)) {
    out.push({ generator: 'midjourney' })
  }

  const haystack = `${str('Software') ?? ''} ${creatorTool}`.toLowerCase()
  const map: Array<[RegExp, AiGenerator]> = [
    [/dall[·e·\-]?e/i, 'dalle'],
    [/firefly/i, 'firefly'],
    [/imagen/i, 'imagen'],
    [/ideogram/i, 'ideogram'],
    [/leonardo/i, 'leonardo'],
    [/runway/i, 'runway'],
  ]
  for (const [re, gen] of map) {
    if (re.test(haystack) && !out.some(s => s.generator === gen)) {
      out.push({ generator: gen })
    }
  }

  if (opts.hasC2pa && out.length === 0) {
    out.push({ generator: 'c2pa-only', detail: 'Content Credentials present' })
  }

  return out
}
