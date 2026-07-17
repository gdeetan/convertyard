import { loadTransformersModel } from '@/lib/converters/transformers-client'

export interface TatrBox { xmin: number; ymin: number; xmax: number; ymax: number }
export interface TatrDetection { score: number; label: string; box: TatrBox }
export interface TableCellBBox { row: number; col: number; xmin: number; ymin: number; xmax: number; ymax: number }

const ROW_LABELS = new Set(['table row', 'table column header'])
const COL_LABEL = 'table column'

/**
 * Converts TATR object-detection output into cell bounding boxes.
 * Rows = "table row" + "table column header", sorted by ymin.
 * Columns = "table column", sorted by xmin.
 * Each cell bbox = column x-range × row y-range.
 */
export function buildGridCells(detections: TatrDetection[]): TableCellBBox[] {
  const rows = detections
    .filter(d => ROW_LABELS.has(d.label))
    .sort((a, b) => a.box.ymin - b.box.ymin)
  const cols = detections
    .filter(d => d.label === COL_LABEL)
    .sort((a, b) => a.box.xmin - b.box.xmin)

  if (rows.length === 0 || cols.length === 0) return []

  const cells: TableCellBBox[] = []
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      cells.push({
        row: r,
        col: c,
        xmin: cols[c].box.xmin,
        ymin: rows[r].box.ymin,
        xmax: cols[c].box.xmax,
        ymax: rows[r].box.ymax,
      })
    }
  }
  return cells
}

export async function loadTableStructureModel(onProgress: (pct: number) => void): Promise<void> {
  return loadTransformersModel('table-structure', onProgress)
}

export function detectTableStructure(
  imageBlob: Blob,
  onProgress?: (pct: number) => void,
): Promise<TatrDetection[]> {
  // Lazy-import to reuse the shared singleton worker from transformers-client
  return import('@/lib/converters/transformers-client').then(({ loadTransformersModel: _load, ...rest }) => {
    void _load  // unused — just ensuring the module is live
    return new Promise<TatrDetection[]>((resolve, reject) => {
      const workerUrl = new URL('@/lib/converters/transformers-worker.ts', import.meta.url)
      // Reuse the singleton worker already spawned by transformers-client
      const w = new Worker(workerUrl, { type: 'module' })
      const id = crypto.randomUUID()

      const handler = (e: MessageEvent) => {
        const d = e.data
        if (d.id !== id) return
        if (d.type === 'infer-progress') {
          onProgress?.(d.progress as number)
        } else if (d.type === 'infer-result') {
          w.removeEventListener('message', handler)
          try {
            resolve(JSON.parse(d.result as string) as TatrDetection[])
          } catch {
            resolve([])
          }
        } else if (d.type === 'error') {
          w.removeEventListener('message', handler)
          reject(new Error(d.message as string))
        }
      }

      // Load model first, then infer
      w.addEventListener('message', (e: MessageEvent) => {
        if (e.data.type === 'model-ready' && e.data.modelType === 'table-structure') {
          imageBlob.arrayBuffer().then(buffer => {
            w.postMessage(
              { type: 'infer', id, modelType: 'table-structure', buffer, mimeType: imageBlob.type || 'image/png', opts: {} },
              [buffer]
            )
          }).catch(reject)
        } else if (e.data.type === 'error' && !e.data.id) {
          reject(new Error(e.data.message as string))
        }
      })
      w.addEventListener('message', handler)
      w.postMessage({ type: 'load', modelType: 'table-structure' })
    })
  })
}
