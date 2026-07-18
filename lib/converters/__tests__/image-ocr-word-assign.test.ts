import { describe, it, expect } from 'vitest'
import { assignWordsToCells } from '../image-ocr'
import type { OcrWord } from '@/lib/ocr/tesseract-client'
import type { TableCellBBox } from '@/lib/ocr/table-structure-client'

function makeWord(text: string, x0: number, y0: number, x1: number, y1: number, confidence = 95): OcrWord {
  return { text, confidence, bbox: { x0, y0, x1, y1 }, lineIndex: 0 }
}

function makeCell(row: number, col: number, xmin: number, ymin: number, xmax: number, ymax: number): TableCellBBox {
  return { row, col, xmin, ymin, xmax, ymax }
}

describe('assignWordsToCells', () => {
  it('assigns a word to the cell containing its center point', () => {
    const words = [makeWord('100%', 10, 10, 50, 30)]
    const cells = [makeCell(0, 0, 0, 0, 60, 40)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')).toEqual({ text: '100%', confidence: 95 })
  })

  it('assigns multiple words to separate cells', () => {
    const words = [
      makeWord('Apple', 5, 5, 55, 25),
      makeWord('100%', 65, 5, 115, 25),
    ]
    const cells = [
      makeCell(0, 0, 0, 0, 60, 30),
      makeCell(0, 1, 60, 0, 120, 30),
    ]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Apple')
    expect(result.get('0,1')?.text).toBe('100%')
  })

  it('joins multiple words in the same cell in left-to-right order', () => {
    const words = [
      makeWord('Hard', 5, 5, 45, 25),
      makeWord('Floor', 50, 5, 100, 25),
      makeWord('Results', 105, 5, 170, 25),
    ]
    const cells = [makeCell(0, 0, 0, 0, 200, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Hard Floor Results')
  })

  it('assigns mean confidence when multiple words land in one cell', () => {
    const words = [
      makeWord('Hello', 5, 5, 45, 25, 80),
      makeWord('World', 50, 5, 100, 25, 60),
    ]
    const cells = [makeCell(0, 0, 0, 0, 120, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.confidence).toBe(70)
  })

  it('falls back to nearest cell when word center is outside all cells', () => {
    const words = [makeWord('N/A', 130, 5, 170, 25)]
    const cells = [makeCell(0, 0, 0, 0, 100, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('N/A')
  })

  it('skips blank/whitespace-only words', () => {
    const words = [
      makeWord('   ', 5, 5, 45, 25),
      makeWord('', 50, 5, 100, 25),
      makeWord('Real', 105, 5, 160, 25),
    ]
    const cells = [makeCell(0, 0, 0, 0, 200, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Real')
  })

  it('returns empty map for empty inputs', () => {
    expect(assignWordsToCells([], [])).toEqual(new Map())
    expect(assignWordsToCells([makeWord('hi', 0, 0, 10, 10)], [])).toEqual(new Map())
  })

  it('handles words without bboxes gracefully', () => {
    const words = [{ text: 'ghost', confidence: 90, bbox: undefined as unknown as OcrWord['bbox'], lineIndex: 0 }]
    const cells = [makeCell(0, 0, 0, 0, 100, 30)]
    const result = assignWordsToCells(words, cells)
    expect(result.size).toBe(0)
  })

  it('assigns each word to the correct row in a multi-row table', () => {
    const words = [
      makeWord('Dyson', 5, 5, 55, 25),
      makeWord('100%', 65, 5, 115, 25),
      makeWord('Shark', 5, 35, 55, 55),
      makeWord('N/A', 65, 35, 115, 55),
    ]
    const cells = [
      makeCell(0, 0, 0, 0, 60, 30),
      makeCell(0, 1, 60, 0, 120, 30),
      makeCell(1, 0, 0, 30, 60, 60),
      makeCell(1, 1, 60, 30, 120, 60),
    ]
    const result = assignWordsToCells(words, cells)
    expect(result.get('0,0')?.text).toBe('Dyson')
    expect(result.get('0,1')?.text).toBe('100%')
    expect(result.get('1,0')?.text).toBe('Shark')
    expect(result.get('1,1')?.text).toBe('N/A')
  })
})
