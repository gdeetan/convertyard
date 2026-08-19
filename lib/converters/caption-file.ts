const MIME_EXT: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'video/x-matroska': '.mkv',
  'video/x-msvideo': '.avi',
  'video/3gpp': '.3gp',
  'video/3gpp2': '.3g2',
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/webm': '.webm',
}

export function safeCaptionExt(ext: string, mime = ''): string {
  const lower = ext.toLowerCase()
  if (/^\.[a-z0-9]{1,8}$/.test(lower)) return lower
  return MIME_EXT[mime] ?? '.mp4'
}

/** MEMFS name with a safe extension. Extension-less names fail ffmpeg probe. */
export function captionFfmpegInputName(fileName: string, now = Date.now(), mime = ''): string {
  const m = fileName.match(/\.[^.]+$/)
  return `cap_in_${now}${safeCaptionExt(m ? m[0] : '', mime)}`
}

/** Build a File that later reads do not depend on the Android picker grant. */
export function captionFileFromBytes(buf: ArrayBuffer, source: { name: string; type: string }): File {
  if (buf.byteLength < 32) throw new Error('Could not read the video file')
  const name = source.name && /\.[^.]+$/.test(source.name)
    ? source.name
    : `video${safeCaptionExt('', source.type)}`
  return new File([buf], name, { type: source.type || 'video/mp4' })
}

/** Android gallery pickers often hand back a lazy blob. Copy it first. */
export async function materializeCaptionFile(file: File): Promise<File> {
  return captionFileFromBytes(await file.arrayBuffer(), file)
}
