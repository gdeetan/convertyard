export interface QrOptions {
  size: number
  foreground: string
  background: string
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
}

export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  opts: QrOptions
): Promise<void> {
  const QRCode = await import('qrcode')
  await QRCode.toCanvas(canvas, text, {
    width: opts.size,
    margin: 2,
    color: { dark: opts.foreground, light: opts.background },
    errorCorrectionLevel: opts.errorCorrectionLevel,
  })
}

export async function renderQrToSvgString(text: string, opts: QrOptions): Promise<string> {
  const QRCode = await import('qrcode')
  return QRCode.toString(text, {
    type: 'svg',
    width: opts.size,
    margin: 2,
    color: { dark: opts.foreground, light: opts.background },
    errorCorrectionLevel: opts.errorCorrectionLevel,
  })
}

export async function generateQrBatch(
  items: string[],
  opts: QrOptions,
  onProgress: (index: number) => void
): Promise<Array<{ name: string; data: Uint8Array }>> {
  const QRCode = await import('qrcode')
  const results: Array<{ name: string; data: Uint8Array }> = []
  for (let i = 0; i < items.length; i++) {
    const text = items[i].trim()
    if (!text) { onProgress(i); continue }
    const dataUrl = await QRCode.toDataURL(text, {
      width: opts.size,
      margin: 2,
      color: { dark: opts.foreground, light: opts.background },
      errorCorrectionLevel: opts.errorCorrectionLevel,
    })
    const base64 = dataUrl.split(',')[1]
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    results.push({ name: `qr-${(i + 1).toString().padStart(4, '0')}.png`, data: bytes })
    onProgress(i)
  }
  return results
}
