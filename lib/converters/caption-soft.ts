import { getFFmpeg } from './ffmpeg-client'
import type { WordChunk } from './caption-types'
import { buildCaptionSRT } from './caption-subtitles'
import { throwIfAborted } from './audio-decode'

function getExt(name: string): string {
  const m = name.match(/\.[^.]+$/)
  return m ? m[0] : '.mp4'
}

/** Mux an SRT track into the video without re-encoding picture or audio. */
export async function muxSoftCaptions(
  videoFile: File,
  words: WordChunk[],
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<File> {
  throwIfAborted(signal)
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFFmpeg()
  throwIfAborted(signal)

  const ts = Date.now()
  const inputName = `soft_in_${ts}${getExt(videoFile.name)}`
  const srtName = `soft_${ts}.srt`
  const outputName = `soft_out_${ts}.mp4`

  onProgress(10)
  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))
  await ffmpeg.writeFile(srtName, new TextEncoder().encode(buildCaptionSRT(words)))
  throwIfAborted(signal)
  onProgress(30)

  const logs: string[] = []
  const logHandler = ({ message }: { message: string }) => { logs.push(message) }
  ffmpeg.on('log', logHandler)

  try {
    const exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-i', srtName,
      '-map', '0',
      '-map', '1',
      '-c', 'copy',
      '-c:s', 'mov_text',
      '-movflags', '+faststart',
      outputName,
    ])
    throwIfAborted(signal)
    if (exitCode !== 0) {
      throw new Error(`Could not mux soft captions. ${logs.slice(-8).join(' | ')}`)
    }
    onProgress(90)
    const data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
    if (!data || data.length === 0) throw new Error('Soft-caption mux produced an empty file')
    onProgress(100)
    return new File(
      [data],
      `captioned-${videoFile.name.replace(/\.[^.]+$/, '')}.mp4`,
      { type: 'video/mp4' },
    )
  } finally {
    ffmpeg.off('log', logHandler)
    await Promise.all([
      ffmpeg.deleteFile(inputName).catch(() => {}),
      ffmpeg.deleteFile(srtName).catch(() => {}),
      ffmpeg.deleteFile(outputName).catch(() => {}),
    ])
  }
}
