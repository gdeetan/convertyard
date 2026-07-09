import { loadTransformersModel, extractTableWithVlm } from '@/lib/converters/transformers-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'
import * as XLSX from 'xlsx'

// Strip markdown code fences that some VLMs wrap output in
function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:csv)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

// Minimal CSV parser — handles quoted fields containing commas
function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  for (const line of lines) {
    if (!line.trim()) continue
    const cells: string[] = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        i++
        let cell = ''
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            cell += '"'
            i += 2
          } else if (line[i] === '"') {
            i++
            break
          } else {
            cell += line[i++]
          }
        }
        cells.push(cell)
        if (line[i] === ',') i++
      } else {
        const end = line.indexOf(',', i)
        if (end === -1) {
          cells.push(line.slice(i).trim())
          break
        }
        cells.push(line.slice(i, end).trim())
        i = end + 1
      }
    }
    rows.push(cells)
  }

  return rows
}

function toXlsx(rows: string[][], sheetName: string): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(buf)
}

export async function imageToExcelVlm(
  files: File[],
  _opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  // Load model once before iterating files (progress reported on first file slot)
  await loadTransformersModel('table-vlm', pct => onProgress?.(0, Math.round(pct * 0.4)))

  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, i === 0 ? 40 : 5)

    try {
      const file = files[i]

      const rawCsv = await extractTableWithVlm(
        file,
        pct => onProgress?.(i, (i === 0 ? 40 : 5) + Math.round(pct * 0.55))
      )

      const cleaned = stripFences(rawCsv)
      const rows = parseCsv(cleaned)

      if (rows.length === 0) throw new Error('No table data found in image')

      const baseName = file.name.replace(/\.[^.]+$/, '')
      const xlsxBytes = toXlsx(rows, baseName)
      results.push(
        new File(
          [xlsxBytes as unknown as Uint8Array<ArrayBuffer>],
          `${baseName}.xlsx`,
          { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        )
      )

      onProgress?.(i, 100)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}
