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
import { config as imageCropper } from './tools/image-cropper'
import { config as mp4ToMp3 } from './tools/mp4-to-mp3'
import { config as mp4ToWebp } from './tools/mp4-to-webp'
import { config as mp3ToMp4 } from './tools/mp3-to-mp4'
import { config as videoToGif } from './tools/video-to-gif'
import { config as videoToWebp } from './tools/video-to-webp'
import { config as backgroundRemover } from './tools/background-remover'
import { config as altTextGenerator } from './tools/alt-text-generator'
import { config as imageUpscaler } from './tools/image-upscaler'
import { config as transcription } from './tools/transcription'
import { config as imageDescription } from './tools/image-description'
import { config as rotatePdf } from './tools/rotate-pdf'
import { config as reorderPdfPages } from './tools/reorder-pdf-pages'
import { config as redactPdf } from './tools/redact-pdf'
import { config as pdfToCsv } from './tools/pdf-to-csv'
import { config as fillPdfForm } from './tools/fill-pdf-form'
import { config as wordToPdf } from './tools/word-to-pdf'
import { config as excelToPdf } from './tools/excel-to-pdf'
import { config as pdfToExcel } from './tools/pdf-to-excel'
import { config as pngToPdf } from './tools/png-to-pdf'
import { config as unlockPdf } from './tools/unlock-pdf'
import { config as protectPdf } from './tools/protect-pdf'
import { config as watermarkPdf } from './tools/watermark-pdf'
import { config as pdfToPowerpoint } from './tools/pdf-to-powerpoint'
import { config as ocrPdf } from './tools/ocr-pdf'
import { config as compressVideo } from './tools/compress-video'
import { config as extractAudio } from './tools/extract-audio'
import { config as audioTrimmer } from './tools/audio-trimmer'
import { config as m4aToMp3 } from './tools/m4a-to-mp3'
import { config as wavToMp3 } from './tools/wav-to-mp3'
import { config as amrToMp3 } from './tools/amr-to-mp3'
import { config as oggToMp3 } from './tools/ogg-to-mp3'
import { config as flacToMp3 } from './tools/flac-to-mp3'
import { config as opusToMp3 } from './tools/opus-to-mp3'
import { config as movToMp4 } from './tools/mov-to-mp4'
import { config as webmToMp4 } from './tools/webm-to-mp4'
import { config as aviToMp4 } from './tools/avi-to-mp4'
import { config as mkvToMp4 } from './tools/mkv-to-mp4'
import { config as flvToMp4 } from './tools/flv-to-mp4'
import { config as rawToPng } from './tools/raw-to-png'
import { config as pngToBmp } from './tools/png-to-bmp'
import { config as mp3ToWav } from './tools/mp3-to-wav'
import { config as aacToMp3 } from './tools/aac-to-mp3'
import { config as mp3ToOgg } from './tools/mp3-to-ogg'
import { config as mp4ToWebm } from './tools/mp4-to-webm'
import { config as mp3ToAac } from './tools/mp3-to-aac'
import { config as mp4ToMov } from './tools/mp4-to-mov'
import { config as imageToWord } from './tools/image-to-word'
import { config as exifViewer } from './tools/exif-viewer'
import { config as aiImageDetector } from './tools/ai-image-detector'
import type { AnyToolConfig } from '@/lib/types'

export const tools: AnyToolConfig[] = [
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
  imageCropper,
  mp4ToMp3,
  mp4ToWebp,
  mp3ToMp4,
  videoToGif,
  videoToWebp,
  backgroundRemover,
  altTextGenerator,
  imageUpscaler,
  transcription,
  imageDescription,
  rotatePdf,
  reorderPdfPages,
  redactPdf,
  pdfToCsv,
  fillPdfForm,
  wordToPdf,
  excelToPdf,
  pdfToExcel,
  pngToPdf,
  unlockPdf,
  protectPdf,
  watermarkPdf,
  pdfToPowerpoint,
  ocrPdf,
  compressVideo,
  extractAudio,
  audioTrimmer,
  m4aToMp3,
  wavToMp3,
  amrToMp3,
  oggToMp3,
  flacToMp3,
  opusToMp3,
  movToMp4,
  webmToMp4,
  aviToMp4,
  mkvToMp4,
  flvToMp4,
  rawToPng,
  pngToBmp,
  mp3ToWav,
  aacToMp3,
  mp3ToOgg,
  mp4ToWebm,
  mp3ToAac,
  mp4ToMov,
  imageToWord,
  exifViewer,
  aiImageDetector,
]

export const toolBySlug = Object.fromEntries(
  tools.map((t) => [t.slug, t])
) as Record<string, AnyToolConfig>
