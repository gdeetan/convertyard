export type BgType = 'black' | 'color' | 'image'
export type Waveform = 'none' | 'bar' | 'line'

export interface FilterSpec {
  w: number
  h: number
  bgType: BgType
  bgColor: string
  waveform: Waveform
  captions: boolean
  captionAssName: string | null
}

export interface FilterOutput {
  filter: string
  vMap: string
  aMap: string
  useComplex: boolean
  audioInputIndex: number
}

export function buildFilterComplex(spec: FilterSpec): FilterOutput {
  const { w, h, bgType, waveform, captions, captionAssName } = spec
  const size = `${w}x${h}`
  const audioIdx = 1
  const aMap = `${audioIdx}:a`
  const mode = waveform === 'bar' ? 'p2p' : 'line'

  const parts: string[] = []

  if (bgType === 'image') {
    parts.push(
      `[0:v]split=2[bgsrc][fgsrc]`,
      `[bgsrc]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=20:5,setsar=1[bgblur]`,
      `[fgsrc]scale=${w}:${h}:force_original_aspect_ratio=decrease,setsar=1[fg]`,
      `[bgblur][fg]overlay=(W-w)/2:(H-h)/2[bg]`,
    )
  } else {
    // Caller supplies lavfi color as input 0; alias to [bg].
    parts.push(`[0:v]null[bg]`)
  }

  let last = '[bg]'
  if (waveform !== 'none') {
    parts.push(`[${audioIdx}:a]showwaves=s=${size}:mode=${mode}:colors=white:scale=sqrt[waves]`)
    const overlayArgs = captions ? 'overlay=0:0' : 'overlay'
    parts.push(`${last}[waves]${overlayArgs}[waved]`)
    last = '[waved]'
  }

  if (captions && captionAssName) {
    parts.push(`${last}ass='${captionAssName}'[v]`)
    last = '[v]'
  } else if (last !== '[v]') {
    parts.push(`${last}null[v]`)
    last = '[v]'
  }

  return {
    filter: parts.join(';'),
    vMap: last,
    aMap,
    useComplex: true,
    audioInputIndex: audioIdx,
  }
}
