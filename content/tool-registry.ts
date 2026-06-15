import { config as mergePdf } from './tools/merge-pdf'
import { config as compressPdf } from './tools/compress-pdf'
import { config as pdfToJpg } from './tools/pdf-to-jpg'
import { config as pdfToPng } from './tools/pdf-to-png'
import { config as pdfToText } from './tools/pdf-to-text'
import { config as pdfToWord } from './tools/pdf-to-word'
import { config as jpgToPdf } from './tools/jpg-to-pdf'
import { config as splitPdf } from './tools/split-pdf'
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
import { config as compressImage } from './tools/compress-image'
import { config as imageResizer } from './tools/image-resizer'
import { config as mp4ToMp3 } from './tools/mp4-to-mp3'
import { config as mp3ToMp4 } from './tools/mp3-to-mp4'
import { config as backgroundRemover } from './tools/background-remover'
import { config as altTextGenerator } from './tools/alt-text-generator'
import { config as rotatePdf } from './tools/rotate-pdf'
import { config as reorderPdfPages } from './tools/reorder-pdf-pages'
import type { ToolConfig } from '@/lib/types'

export const tools: ToolConfig[] = [
  mergePdf,
  compressPdf,
  pdfToJpg,
  pdfToPng,
  pdfToText,
  pdfToWord,
  jpgToPdf,
  splitPdf,
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
  compressImage,
  imageResizer,
  mp4ToMp3,
  mp3ToMp4,
  backgroundRemover,
  altTextGenerator,
  rotatePdf,
  reorderPdfPages,
]

export const toolBySlug = Object.fromEntries(
  tools.map((t) => [t.slug, t])
) as Record<string, ToolConfig>
