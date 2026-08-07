import { getFFmpeg } from './ffmpeg-client'

export async function burnCaptions(
  videoFile: File,
  assContent: string,
  fontBlob: Blob | null,
  onProgress: (pct: number) => void,
): Promise<File> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFFmpeg()

  const ts = Date.now()
  const inputName  = `cap_in_${ts}${getExt(videoFile.name)}`
  const assName    = `cap_subs_${ts}.ass`
  const outputName = `cap_out_${ts}.mp4`

  onProgress(5)
  await ffmpeg.writeFile(inputName, await fetchFile(videoFile))
  await ffmpeg.writeFile(assName, new TextEncoder().encode(assContent))
  onProgress(15)

  let assFilter = `ass=${assName}`

  if (fontBlob) {
    const fontBytes = new Uint8Array(await fontBlob.arrayBuffer())
    try { await ffmpeg.createDir('/capfonts') } catch { /* already exists */ }
    await ffmpeg.writeFile('/capfonts/userfont.ttf', fontBytes)
    assFilter = `ass=${assName}:fontsdir=/capfonts`
  }

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress(15 + Math.round(progress * 80))
  }
  ffmpeg.on('progress', progressHandler)

  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', assFilter,
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputName,
    ])
  } finally {
    ffmpeg.off('progress', progressHandler)
  }

  onProgress(98)
  const data = await ffmpeg.readFile(outputName) as Uint8Array<ArrayBuffer>
  const outFile = new File(
    [data],
    `captioned-${videoFile.name.replace(/\.[^.]+$/, '')}.mp4`,
    { type: 'video/mp4' },
  )

  await Promise.all([
    ffmpeg.deleteFile(inputName).catch(() => {}),
    ffmpeg.deleteFile(assName).catch(() => {}),
    ffmpeg.deleteFile(outputName).catch(() => {}),
    fontBlob ? ffmpeg.deleteFile('/capfonts/userfont.ttf').catch(() => {}) : Promise.resolve(),
  ])

  onProgress(100)
  return outFile
}

function getExt(name: string): string {
  const m = name.match(/\.[^.]+$/)
  return m ? m[0] : '.mp4'
}
