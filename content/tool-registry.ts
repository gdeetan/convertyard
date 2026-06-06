import { config as jpgToWebp } from './tools/jpg-to-webp'
import { config as heicToJpg } from './tools/heic-to-jpg'
import { config as pngToWebp } from './tools/png-to-webp'
import { config as webpToJpg } from './tools/webp-to-jpg'
import { config as webpToPng } from './tools/webp-to-png'
import { config as heicToPng } from './tools/heic-to-png'
import type { ToolConfig } from '@/lib/types'

export const tools: ToolConfig[] = [
  jpgToWebp,
  heicToJpg,
  pngToWebp,
  webpToJpg,
  webpToPng,
  heicToPng,
]

export const toolBySlug = Object.fromEntries(
  tools.map((t) => [t.slug, t])
) as Record<string, ToolConfig>
