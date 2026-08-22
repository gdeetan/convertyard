import type { AiDetectionResult } from './ai-detector.types'
import {
  combineVerdict,
  friendlyImageError,
  pickAiScore,
  pendingVerdict,
} from './ai-detector-logic'
import { detectAiSignatures } from './exif-viewer-ai'
import { buildClassifierInput } from './ai-detector-thumbnail'
import { detectCaptionClientProfile } from './caption-workload'

// ── Load status (UI subscribes) ──────────────────────────────────────────────

export type ClassifierPhase = 'idle' | 'downloading' | 'compiling' | 'ready' | 'error'

export interface ClassifierStatus {
  phase: ClassifierPhase
  downloadPct: number
  device?: 'webgpu' | 'wasm'
  error?: string
}

let status: ClassifierStatus = { phase: 'idle', downloadPct: 0 }
const listeners = new Set<(s: ClassifierStatus) => void>()

function setStatus(partial: Partial<ClassifierStatus>): void {
  status = { ...status, ...partial }
  listeners.forEach(cb => cb(status))
}

export function getClassifierStatus(): ClassifierStatus {
  return status
}

export function subscribeClassifierStatus(cb: (s: ClassifierStatus) => void): () => void {
  listeners.add(cb)
  cb(status)
  return () => { listeners.delete(cb) }
}

// ── Worker singleton ─────────────────────────────────────────────────────────

let workerInstance: Worker | null = null
let readyPromise: Promise<void> | null = null
let readyResolve: (() => void) | null = null
let readyReject: ((err: Error) => void) | null = null

const classifyWaiters = new Map<string, {
  resolve: (preds: Array<{ label: string; score: number }>) => void
  reject: (err: Error) => void
}>()

function handleWorkerMessage(e: MessageEvent): void {
  const d = e.data as {
    type: string
    pct?: number
    device?: 'webgpu' | 'wasm'
    id?: string
    preds?: Array<{ label: string; score: number }>
    message?: string
  }
  if (d.type === 'load-progress' && d.pct != null) {
    setStatus({ phase: 'downloading', downloadPct: d.pct })
    return
  }
  if (d.type === 'compiling') {
    setStatus({ phase: 'compiling', device: d.device, downloadPct: 100 })
    return
  }
  if (d.type === 'ready') {
    setStatus({ phase: 'ready', downloadPct: 100, device: d.device })
    readyResolve?.()
    readyResolve = null
    readyReject = null
    return
  }
  if (d.type === 'result' && d.id) {
    classifyWaiters.get(d.id)?.resolve(d.preds ?? [])
    classifyWaiters.delete(d.id)
    return
  }
  if (d.type === 'error') {
    const err = new Error(d.message ?? 'Classifier failed')
    if (d.id) {
      classifyWaiters.get(d.id)?.reject(err)
      classifyWaiters.delete(d.id)
    } else {
      setStatus({ phase: 'error', error: friendlyImageError(d.message ?? 'Classifier failed') })
      readyPromise = null
      readyReject?.(err)
      readyResolve = null
      readyReject = null
    }
  }
}

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('./ai-detector-worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerInstance.addEventListener('message', handleWorkerMessage)
  }
  return workerInstance
}

function ensureReady(): Promise<void> {
  if (status.phase === 'ready' && readyPromise) return readyPromise
  if (readyPromise) return readyPromise
  readyPromise = new Promise<void>((resolve, reject) => {
    readyResolve = resolve
    readyReject = reject
  })
  if (status.phase === 'idle' || status.phase === 'error') {
    setStatus({ phase: 'downloading', downloadPct: 0, error: undefined })
  }
  getWorker().postMessage({ type: 'load' })
  return readyPromise
}

/** Kick off worker spawn + model download as soon as the page mounts. */
export function preloadClassifier(): void {
  void ensureReady().catch(() => { /* silent — retried on real use */ })
}

// ── Per-file classify via worker ─────────────────────────────────────────────

async function classifyPng(png: ArrayBuffer, tta: boolean): Promise<Array<{ label: string; score: number }>> {
  await ensureReady()
  const worker = getWorker()
  const id = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    classifyWaiters.set(id, { resolve, reject })
    worker.postMessage(
      { type: 'classify', id, mimeType: 'image/png', buffer: png, tta },
      [png],
    )
  })
}

// ── Public analyzer ──────────────────────────────────────────────────────────

type ExifParse = (file: File, opts: Record<string, boolean>) => Promise<unknown>

type Prepared = {
  file: File
  metadataSignatures: AiDetectionResult['metadataSignatures']
  png?: ArrayBuffer
  previewDataUrl?: string
  width?: number
  height?: number
  decodeError?: string
}

async function prepareFile(file: File, parse: ExifParse): Promise<Prepared> {
  let metadataSignatures: AiDetectionResult['metadataSignatures'] = []
  try {
    const raw = (await parse(file, { xmp: true, tiff: true, icc: true, iptc: true, jfif: true, ihdr: true })) as
      | Record<string, unknown>
      | undefined
    if (raw) {
      const hasC2pa = 'jumbf' in raw || 'C2PA' in raw
      metadataSignatures = detectAiSignatures(raw, { hasC2pa })
    }
  } catch { /* metadata pass is optional */ }

  try {
    const built = await buildClassifierInput(file)
    return {
      file,
      metadataSignatures,
      png: built.png,
      previewDataUrl: built.previewDataUrl,
      width: built.width,
      height: built.height,
    }
  } catch (err) {
    return {
      file,
      metadataSignatures,
      decodeError: friendlyImageError(err),
    }
  }
}

function baseFields(p: Prepared): Pick<AiDetectionResult, 'fileName' | 'fileSize' | 'mimeType' | 'metadataSignatures' | 'thumbnailDataUrl' | 'width' | 'height'> {
  return {
    fileName: p.file.name,
    fileSize: p.file.size,
    mimeType: p.file.type,
    metadataSignatures: p.metadataSignatures,
    thumbnailDataUrl: p.previewDataUrl,
    width: p.width,
    height: p.height,
  }
}

export async function analyzeForAi(
  files: File[],
  onProgress?: (i: number, pct: number) => void,
  onResult?: (i: number, r: AiDetectionResult) => void,
): Promise<AiDetectionResult[]> {
  const results: AiDetectionResult[] = new Array(files.length)
  if (files.length === 0) return results

  const { parse } = await import('exifr')
  void ensureReady()
  const tta = detectCaptionClientProfile(
    navigator.userAgent ?? '',
    navigator.maxTouchPoints ?? 0,
    navigator.platform ?? '',
  ) === 'desktop'

  let nextPrepared = prepareFile(files[0], parse as ExifParse)
  for (let i = 0; i < files.length; i++) {
    const prepared = await nextPrepared
    if (i + 1 < files.length) nextPrepared = prepareFile(files[i + 1], parse as ExifParse)
    onProgress?.(i, 20)

    if (prepared.decodeError) {
      const r: AiDetectionResult = {
        ok: false,
        ...baseFields(prepared),
        verdict: 'error',
        errorMessage: prepared.decodeError,
      }
      results[i] = r
      onResult?.(i, r)
      onProgress?.(i, 100)
      continue
    }

    const pending: AiDetectionResult = {
      ok: true,
      ...baseFields(prepared),
      verdict: pendingVerdict(prepared.metadataSignatures),
      classifierPending: true,
    }
    results[i] = pending
    onResult?.(i, pending)
    onProgress?.(i, 40)

    try {
      const preds = await classifyPng(prepared.png!, tta)
      const aiScore = pickAiScore(preds)
      const r: AiDetectionResult = {
        ok: true,
        ...baseFields(prepared),
        aiProbability: aiScore,
        humanProbability: 1 - aiScore,
        verdict: combineVerdict(prepared.metadataSignatures, aiScore),
        classifierPending: false,
      }
      results[i] = r
      onResult?.(i, r)
      onProgress?.(i, 100)
    } catch (err) {
      const r: AiDetectionResult = {
        ok: false,
        ...baseFields(prepared),
        verdict: pending.verdict === 'likely-ai' ? 'likely-ai' : 'error',
        classifierPending: false,
        errorMessage: friendlyImageError(err),
      }
      results[i] = r
      onResult?.(i, r)
      onProgress?.(i, 100)
    }
  }

  return results
}
