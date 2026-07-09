import { loadTransformersModel, extractTableWithVlm, getVlmDevice } from '@/lib/converters/transformers-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'
import * as XLSX from 'xlsx'

// Strip markdown fences and any non-CSV preamble lines VLMs sometimes output.
// A "CSV line" is one that contains a comma or tab (our two supported separators).
function stripFences(raw: string): string {
  let cleaned = raw
    .replace(/^```(?:csv)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  // Drop leading lines that have no delimiter — they are preamble text
  const lines = cleaned.split('\n')
  const firstCsvIdx = lines.findIndex(l => l.includes(',') || l.includes('\t'))
  if (firstCsvIdx > 0) cleaned = lines.slice(firstCsvIdx).join('\n')

  return cleaned.trim()
}

// CSV/TSV parser — auto-detects comma vs tab separator, handles quoted fields.
function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  const nonEmpty = lines.filter(l => l.trim())
  if (nonEmpty.length === 0) return rows

  // Auto-detect: if the first data line has more tabs than commas, use TSV mode
  const firstLine = nonEmpty[0]
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const sep = tabCount > commaCount ? '\t' : ','

  for (const line of nonEmpty) {
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
        if (line[i] === sep) i++
      } else {
        const end = line.indexOf(sep, i)
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
      const outputName = getVlmDevice() === 'wasm' ? `${baseName} (verify output)` : baseName
      const xlsxBytes = toXlsx(rows, outputName)
      results.push(
        new File(
          [xlsxBytes as unknown as Uint8Array<ArrayBuffer>],
          `${outputName}.xlsx`,
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
