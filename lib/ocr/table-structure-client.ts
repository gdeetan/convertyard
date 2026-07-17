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

let tatrWorker: Worker | null = null
let tatrReady = false

export function detectTableStructure(
  imageBlob: Blob,
  onProgress?: (pct: number) => void,
): Promise<TatrDetection[]> {
  return import('@/lib/converters/transformers-client').then(({ loadTransformersModel: _load }) => {
    void _load
    return new Promise<TatrDetection[]>((resolve, reject) => {
      if (!tatrWorker) {
        tatrWorker = new Worker(
          new URL('@/lib/converters/transformers-worker.ts', import.meta.url),
          { type: 'module' }
        )
        tatrReady = false
        tatrWorker.addEventListener('error', () => { tatrWorker = null; tatrReady = false })
      }

      const w = tatrWorker
      const id = crypto.randomUUID()

      const inferHandler = (e: MessageEvent) => {
        const d = e.data
        if (d.id !== id) return
        if (d.type === 'infer-progress') {
          onProgress?.(d.progress as number)
        } else if (d.type === 'infer-result') {
          w.removeEventListener('message', inferHandler)
          try { resolve(JSON.parse(d.result as string) as TatrDetection[]) }
          catch { resolve([]) }
        } else if (d.type === 'error') {
          w.removeEventListener('message', inferHandler)
          tatrWorker = null; tatrReady = false
          reject(new Error(d.message as string))
        }
      }
      w.addEventListener('message', inferHandler)

      const doInfer = () => {
        imageBlob.arrayBuffer().then(buffer => {
          w.postMessage(
            { type: 'infer', id, modelType: 'table-structure', buffer, mimeType: imageBlob.type || 'image/png', opts: {} },
            [buffer]
          )
        }).catch(reject)
      }

      if (tatrReady) {
        doInfer()
      } else {
        const readyHandler = (e: MessageEvent) => {
          if (e.data.type === 'model-ready' && e.data.modelType === 'table-structure') {
            w.removeEventListener('message', readyHandler)
            tatrReady = true
            doInfer()
          } else if (e.data.type === 'error' && !e.data.id) {
            w.removeEventListener('message', readyHandler)
            tatrWorker = null; tatrReady = false
            reject(new Error(e.data.message as string))
          }
        }
        w.addEventListener('message', readyHandler)
        w.postMessage({ type: 'load', modelType: 'table-structure' })
      }
    })
  })
}
