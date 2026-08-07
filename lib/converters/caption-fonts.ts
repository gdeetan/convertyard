export interface BuiltinFont {
  name: string
  label: string
  file: string
}

export const BUILTIN_FONTS: BuiltinFont[] = [
  { name: 'Komika Axis', label: 'Komika Axis — Mr. Beast',    file: '/fonts/caption-komika-axis.ttf'       },
  { name: 'Bangers',     label: 'Bangers — Creator Bold',     file: '/fonts/caption-bangers.ttf'           },
  { name: 'Anton',       label: 'Anton — Impact Style',       file: '/fonts/caption-anton.ttf'             },
  { name: 'Bebas Neue',  label: 'Bebas Neue — YouTube',       file: '/fonts/caption-bebas-neue.ttf'        },
  { name: 'Oswald Bold', label: 'Oswald Bold',                file: '/fonts/caption-oswald-bold.ttf'       },
  { name: 'Montserrat Black', label: 'Montserrat Black',      file: '/fonts/caption-montserrat-black.ttf'  },
  { name: 'Roboto Bold', label: 'Roboto Bold',                file: '/fonts/caption-roboto-bold.ttf'       },
  { name: 'Lato Black',  label: 'Lato Black',                 file: '/fonts/caption-lato-black.ttf'        },
  { name: 'Open Sans ExtraBold', label: 'Open Sans ExtraBold', file: '/fonts/caption-open-sans-extrabold.ttf' },
]

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
