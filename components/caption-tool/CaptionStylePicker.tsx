'use client'

import { CAPTION_STYLES } from '@/lib/converters/caption-types'
import type { CaptionStyleId } from '@/lib/converters/caption-types'
import { cn } from '@/lib/utils/cn'

interface Props {
  value: CaptionStyleId
  onChange: (id: CaptionStyleId) => void
}

const STYLE_PREVIEWS: Record<CaptionStyleId, React.ReactNode> = {
  mrbeast: (
    <div className="flex h-12 items-center justify-center bg-black">
      <span className="text-2xl font-black text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        WORD
      </span>
    </div>
  ),
  tiktok: (
    <div className="flex h-12 items-center justify-center bg-black">
      <span className="text-xl font-black uppercase text-white" style={{ WebkitTextStroke: '2px black', textShadow: '0 0 8px black' }}>
        CAPTION
      </span>
    </div>
  ),
  netflix: (
    <div className="flex h-12 items-center justify-center bg-black">
      <span className="rounded bg-black/70 px-2 py-0.5 text-sm text-white">
        Caption text here
      </span>
    </div>
  ),
  classic: (
    <div className="flex h-12 items-end justify-center bg-black pb-1">
      <span className="text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
        Caption text here
      </span>
    </div>
  ),
  karaoke: (
    <div className="flex h-12 items-end justify-center bg-black pb-1">
      <span className="text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
        Caption <span className="text-yellow-400">active</span> word
      </span>
    </div>
  ),
}

export function CaptionStylePicker({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-fg">Caption style</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CAPTION_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={cn(
              'flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all',
              value === style.id
                ? 'border-primary shadow-md'
                : 'border-border hover:border-fg-subtle',
            )}
          >
            <div className="w-full overflow-hidden rounded-t-[10px]">
              {STYLE_PREVIEWS[style.id]}
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold text-fg">{style.label}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-fg-muted">{style.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
