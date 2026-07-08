// lib/ocr/tesseract-client.ts
import Tesseract from 'tesseract.js'

export interface OcrWord {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
  lineIndex: number
}

export interface OcrLineBbox {
  x0: number; y0: number; x1: number; y1: number
}

export interface OcrPageResult {
  text: string
  words: OcrWord[]
  lines: OcrLineBbox[]
  confidence: number
}

export interface OcrOptions {
  /** Tesseract OEM: 0=legacy, 1=LSTM, 3=auto. Default: 1 (LSTM only) */
  oem?: number
  /** Tesseract PSM: 3=auto, 6=single block. Default: 3 */
  psm?: number
}

let workerInstance: Tesseract.Worker | null = null
let currentLang: string | null = null
let currentOpts: string | null = null

async function getWorker(lang: string, opts: OcrOptions): Promise<Tesseract.Worker> {
  const optsKey = `${lang}:oem${opts.oem ?? 1}:psm${opts.psm ?? 3}`
  if (workerInstance && currentLang === lang && currentOpts === optsKey) return workerInstance
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
  try {
    workerInstance = await Tesseract.createWorker(lang)
    await workerInstance.setParameters({
      tessedit_ocr_engine_mode: opts.oem ?? 1,
      tessedit_pageseg_mode: opts.psm ?? 3,
    } as Record<string, unknown>)
    currentLang = lang
    currentOpts = optsKey
  } catch (err) {
    workerInstance = null
    currentLang = null
    currentOpts = null
    throw err
  }
  return workerInstance
}

export async function recognizePage(
  image: Blob,
  lang: string,
  opts: OcrOptions = {}
): Promise<OcrPageResult> {
  const worker = await getWorker(lang, opts)
  try {
    const { data } = await worker.recognize(image, {}, { blocks: true })
    const words: OcrWord[] = []
    const lines: OcrLineBbox[] = []
    let lineIndex = 0
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          lines.push(line.bbox)
          for (const w of line.words ?? []) {
            words.push({
              text: w.text,
              confidence: w.confidence,
              bbox: w.bbox,
              lineIndex,
            })
          }
          lineIndex++
        }
      }
    }
    return {
      text: data.text ?? '',
      confidence: data.confidence ?? 0,
      words,
      lines,
    }
  } catch (err) {
    const w = workerInstance
    workerInstance = null
    currentLang = null
    currentOpts = null
    await w?.terminate()
    throw err
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
    currentLang = null
    currentOpts = null
  }
}
