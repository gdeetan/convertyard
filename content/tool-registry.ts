import { config as jpgToWebp } from './tools/jpg-to-webp'
import { config as heicToJpg } from './tools/heic-to-jpg'
import { config as pngToWebp } from './tools/png-to-webp'
import { config as webpToJpg } from './tools/webp-to-jpg'
import { config as webpToPng } from './tools/webp-to-png'
import { config as heicToPng } from './tools/heic-to-png'
import { config as jpgToAvif } from './tools/jpg-to-avif'
import { config as avifToJpg } from './tools/avif-to-jpg'
import { config as pngToAvif } from './tools/png-to-avif'
import { config as avifToPng } from './tools/avif-to-png'
import { config as imageCompressor } from './tools/image-compressor'
import { config as imageResizer } from './tools/image-resizer'
import type { ToolConfig } from '@/lib/types'

export const tools: ToolConfig[] = [
  jpgToWebp,
  heicToJpg,
  pngToWebp,
  webpToJpg,
  webpToPng,
  heicToPng,
  jpgToAvif,
  avifToJpg,
  pngToAvif,
  avifToPng,
  imageCompressor,
  imageResizer,
]

export const toolBySlug = Object.fromEntries(
  tools.map((t) => [t.slug, t])
) as Record<string, ToolConfig>
