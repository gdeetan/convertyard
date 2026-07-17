import { describe, it, expect } from 'vitest'
import { classifyColumns, correctTableCells } from '../image-ocr'

describe('classifyColumns', () => {
  it('marks column as numeric when all non-empty cells are numeric', () => {
    const grid = [
      ['100%', '66%'],
      ['99%', '84%'],
    ]
    expect(classifyColumns(grid)).toEqual([true, true])
  })

  it('marks column as numeric when >60% of non-empty cells are numeric', () => {
    const grid = [
      ['5"', '100%'],
      ['',   '99%'],
      ['',   '84%'],
      ['',   '92%'],
    ]
    // col 0: only one non-empty value '5"' — not numeric → false
    // col 1: all numeric → true
    expect(classifyColumns(grid)[1]).toBe(true)
  })

  it('marks column as non-numeric when <60% of non-empty cells are numeric', () => {
    const grid = [
      ['Dyson V10', '100%'],
      ['Dyson V11', '99%'],
      ['LG CordZero', '88%'],
    ]
    expect(classifyColumns(grid)[0]).toBe(false)
    expect(classifyColumns(grid)[1]).toBe(true)
  })

  it('treats N/A as non-numeric (does not inflate numeric count)', () => {
    const grid = [
      ['N/A', 'N/A'],
      ['N/A', 'N/A'],
      ['N/A', 'N/A'],
    ]
    expect(classifyColumns(grid)).toEqual([false, false])
  })

  it('handles empty grid', () => {
    expect(classifyColumns([])).toEqual([])
  })

  it('handles rows of different lengths', () => {
    const grid = [
      ['100%', '66%', '92%'],
      ['99%'],
    ]
    const result = classifyColumns(grid)
    expect(result[0]).toBe(true)
    expect(result[1]).toBe(true)
    expect(result[2]).toBe(true)
  })
})

describe('correctTableCells', () => {
  it('normalises N/S to N/A in numeric columns', () => {
    const grid = [['Model', 'N/S']]
    const cols = [false, true]
    expect(correctTableCells(grid, cols)[0][1]).toBe('N/A')
  })

  it('normalises N.A to N/A', () => {
    const grid = [['Model', 'N.A']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('N/A')
  })

  it('normalises N.A. to N/A', () => {
    const grid = [['Model', 'N.A.']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('N/A')
  })

  it('normalises bare NA to N/A', () => {
    const grid = [['Model', 'NA']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('N/A')
  })

  it('normalises N A (with space) to N/A', () => {
    const grid = [['Model', 'N A']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('N/A')
  })

  it('fixes O→0 inside percentage tokens', () => {
    const grid = [['Model', '1OO%']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('100%')
  })

  it('fixes l→1 inside percentage tokens', () => {
    const grid = [['Model', '96.0l%']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('96.01%')
  })

  it('strips trailing garbage after %', () => {
    const grid = [['Model', '96.00%x']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('96.00%')
  })

  it('strips leading garbage before digit in a percentage token', () => {
    const grid = [['Model', '_96%']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('96%')
  })

  it('collapses double-dot inside a number', () => {
    const grid = [['Model', '96..00%']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('96.00%')
  })

  it('does not touch cells in non-numeric columns', () => {
    const grid = [['N/S', '100%']]
    const result = correctTableCells(grid, [false, true])
    expect(result[0][0]).toBe('N/S')   // not changed — text column
    expect(result[0][1]).toBe('100%')
  })

  it('does not touch already-correct N/A', () => {
    const grid = [['Model', 'N/A']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('N/A')
  })

  it('does not touch empty cells', () => {
    const grid = [['Model', '']]
    expect(correctTableCells(grid, [false, true])[0][1]).toBe('')
  })

  it('handles grid with no numeric columns', () => {
    const grid = [['Foo', 'Bar']]
    const result = correctTableCells(grid, [false, false])
    expect(result[0]).toEqual(['Foo', 'Bar'])
  })
})
