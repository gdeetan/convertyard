// lib/ocr/tesseract-client.ts
import Tesseract from 'tesseract.js'

export interface OcrWord {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export interface OcrPageResult {
  text: string
  words: OcrWord[]
  confidence: number
}

let workerInstance: Tesseract.Worker | null = null
let currentLang: string | null = null

async function getWorker(lang: string): Promise<Tesseract.Worker> {
  if (workerInstance && currentLang === lang) return workerInstance
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
  try {
    workerInstance = await Tesseract.createWorker(lang)
    currentLang = lang
  } catch (err) {
    workerInstance = null
    currentLang = null
    throw err
  }
  return workerInstance
}

export async function recognizePage(
  image: Blob,
  lang: string
): Promise<OcrPageResult> {
  const worker = await getWorker(lang)
  try {
    const { data } = await worker.recognize(image, {}, { blocks: true })
    const words: OcrWord[] = []
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          for (const w of line.words ?? []) {
            words.push({
              text: w.text,
              confidence: w.confidence,
              bbox: w.bbox,
            })
          }
        }
      }
    }
    return {
      text: data.text ?? '',
      confidence: data.confidence ?? 0,
      words,
    }
  } catch (err) {
    workerInstance = null
    currentLang = null
    throw err
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
    currentLang = null
  }
}
