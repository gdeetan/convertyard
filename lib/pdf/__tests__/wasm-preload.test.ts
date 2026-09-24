import { describe, it, expect, vi, beforeEach } from 'vitest'
import { preloadPdfWasm, __resetPreloadStateForTests } from '../wasm-preload'

describe('preloadPdfWasm', () => {
  beforeEach(() => { __resetPreloadStateForTests() })

  it('fires exactly one fetch per WASM URL even when called repeatedly', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new ArrayBuffer(1), { status: 200 })
    )
    await preloadPdfWasm()
    await preloadPdfWasm()
    await preloadPdfWasm()
    expect(spy).toHaveBeenCalledTimes(2)
    spy.mockRestore()
  })

  it('resolves cleanly when fetch rejects (never throws to caller)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    await expect(preloadPdfWasm()).resolves.toBeUndefined()
  })
})
