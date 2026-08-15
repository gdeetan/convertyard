export interface BuiltinFont {
  name: string
  /** TTF name-table family. libass matches fontsdir files by this, not our UI label. */
  assName: string
  label: string
  file: string
}

export const BUILTIN_FONTS: BuiltinFont[] = [
  { name: 'Komika Axis',         assName: 'Komika Axis',           label: 'Komika Axis — Display', file: '/fonts/caption-komika-axis.ttf' },
  { name: 'Bangers',             assName: 'Bangers',               label: 'Bangers — Creator Bold',  file: '/fonts/caption-bangers.ttf' },
  { name: 'Anton',               assName: 'Anton',                 label: 'Anton — Impact Style',    file: '/fonts/caption-anton.ttf' },
  { name: 'Bebas Neue',          assName: 'Bebas Neue',            label: 'Bebas Neue — Condensed',  file: '/fonts/caption-bebas-neue.ttf' },
  { name: 'Oswald Bold',         assName: 'Oswald',                label: 'Oswald Bold',             file: '/fonts/caption-oswald-bold.ttf' },
  { name: 'Montserrat Black',    assName: 'Montserrat Thin Black', label: 'Montserrat Black',        file: '/fonts/caption-montserrat-black.ttf' },
  { name: 'Roboto Bold',         assName: 'Roboto',                label: 'Roboto Bold',             file: '/fonts/caption-roboto-bold.ttf' },
  { name: 'Lato Black',          assName: 'Lato Black',            label: 'Lato Black',              file: '/fonts/caption-lato-black.ttf' },
  { name: 'Open Sans ExtraBold', assName: 'Open Sans ExtraBold',   label: 'Open Sans ExtraBold',     file: '/fonts/caption-open-sans-extrabold.ttf' },
]

export function builtinAssFontName(uiName: string): string {
  return BUILTIN_FONTS.find((f) => f.name === uiName)?.assName ?? uiName
}

const fontCache = new Map<string, Uint8Array>()

export async function loadBuiltinFont(name: string): Promise<Uint8Array> {
  const entry = BUILTIN_FONTS.find(f => f.name === name)
  const filePath = entry?.file ?? '/fonts/caption-font.ttf'
  if (!fontCache.has(filePath)) {
    const res = await fetch(filePath)
    if (!res.ok) throw new Error(`Failed to load font "${name}": ${res.status}`)
    fontCache.set(filePath, new Uint8Array(await res.arrayBuffer()))
  }
  // ffmpeg.writeFile() transfers (detaches) the ArrayBuffer when posting to the worker.
  // Always return a copy so the cached master stays intact for subsequent burns.
  return fontCache.get(filePath)!.slice()
}
