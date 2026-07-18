// lib/ocr/tesseract-client.ts
import Tesseract from 'tesseract.js'
import { diagLog, diagError, diagMemory } from '@/lib/debug/mobile-diagnostics'

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
  /** DPI hint so Tesseract sizes character height expectations correctly. Default: unset */
  dpi?: number
  /** Preserve inter-word spacing — helps with tabular layouts like item/price columns. Default: false */
  preserveSpaces?: boolean
  /** Restrict recognized characters to this set (tessedit_char_whitelist). Use for numeric columns. */
  whitelist?: string
}

let workerInstance: Tesseract.Worker | null = null
let currentHardKey: string | null = null
let currentOpts: string | null = null

async function getWorker(lang: string, opts: OcrOptions): Promise<Tesseract.Worker> {
  // Hard key: params that require a new worker (engine init, lang pack load)
  const hardKey = `${lang}:oem${opts.oem ?? 1}:dpi${opts.dpi ?? 0}:sp${opts.preserveSpaces ? 1 : 0}`
  // Soft key: params updatable on a live worker via setParameters
  const softKey = `psm${opts.psm ?? 3}:wl${opts.whitelist ?? ''}`
  const fullKey = `${hardKey}:${softKey}`

  if (workerInstance && currentHardKey === hardKey) {
    if (currentOpts !== fullKey) {
      // Update PSM and whitelist without recreating the worker
      await workerInstance.setParameters({
        tessedit_pageseg_mode: opts.psm ?? 3,
        tessedit_char_whitelist: opts.whitelist ?? '',
      } as Record<string, unknown>)
      currentOpts = fullKey
    }
    return workerInstance
  }

  // Hard key changed — recreate worker
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }

  try {
    diagLog('tesseract-worker-create', lang)
    diagMemory('before-tesseract-worker')
    workerInstance = await Tesseract.createWorker(lang)
    await workerInstance.setParameters({
      tessedit_ocr_engine_mode: opts.oem ?? 1,
      tessedit_pageseg_mode: opts.psm ?? 3,
      ...(opts.dpi ? { user_defined_dpi: opts.dpi } : {}),
      ...(opts.preserveSpaces ? { preserve_interword_spaces: 1 } : {}),
      ...(opts.whitelist ? { tessedit_char_whitelist: opts.whitelist } : {}),
    } as Record<string, unknown>)
    currentHardKey = hardKey
    currentOpts = fullKey
    diagLog('tesseract-worker-ready', lang)
  } catch (err) {
    diagError('tesseract-worker-create-fail', err)
    workerInstance = null
    currentHardKey = null
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
  diagLog('tesseract-recognize-start')
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
    diagLog('tesseract-recognize-done', `words=${words.length}`)
    return {
      text: data.text ?? '',
      confidence: data.confidence ?? 0,
      words,
      lines,
    }
  } catch (err) {
    diagError('tesseract-recognize-fail', err)
    const w = workerInstance
    workerInstance = null
    currentHardKey = null
    currentOpts = null
    await w?.terminate()
    throw err
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
    currentHardKey = null
    currentOpts = null
  }
}
