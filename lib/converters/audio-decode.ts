/** Mix a decoded AudioBuffer-like object down to mono PCM. */
export function mixToMono(buffer: {
  numberOfChannels: number
  length: number
  getChannelData: (channel: number) => Float32Array
}): Float32Array {
  if (buffer.numberOfChannels <= 1) {
    return buffer.getChannelData(0).slice()
  }
  const left = buffer.getChannelData(0)
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left
  const mono = new Float32Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    mono[i] = (left[i] + right[i]) / 2
  }
  return mono
}

/** Decode any browser-supported media file to 16 kHz mono PCM. */
export async function decodeAudioViaWebAudio(file: File, sampleRate = 16000): Promise<Float32Array> {
  const audioCtx = new AudioContext({ sampleRate })
  try {
    const buffer = await audioCtx.decodeAudioData(await file.arrayBuffer())
    if (!buffer.length) throw new Error('Decoded audio is empty')
    return mixToMono(buffer)
  } finally {
    await audioCtx.close()
  }
}

export class CaptionCancelledError extends Error {
  constructor(message = 'Cancelled') {
    super(message)
    this.name = 'CaptionCancelledError'
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new CaptionCancelledError()
}

export function isCancelError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = (err as { name?: string }).name
  const message = (err as { message?: string }).message ?? ''
  return (
    name === 'AbortError' ||
    name === 'CaptionCancelledError' ||
    /terminat/i.test(message) ||
    /aborted/i.test(message)
  )
}
