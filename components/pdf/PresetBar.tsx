'use client'

import { cn } from '@/lib/utils/cn'
import type { ToolOptions } from '@/lib/types'

const PRESETS: Record<string, ToolOptions> = {
  Email: {
    dpiMode: true, targetDpi: 96, jpegQuality: 55, grayscale: false,
    stripMetadata: true, stripAnnotations: false, stripBookmarks: false,
    stripEmbedded: false, stripJS: false,
  },
  Web: {
    dpiMode: true, targetDpi: 120, jpegQuality: 65, grayscale: false,
    stripMetadata: true, stripAnnotations: false, stripBookmarks: false,
    stripEmbedded: false, stripJS: false,
  },
  Print: {
    dpiMode: true, targetDpi: 200, jpegQuality: 80, grayscale: false,
    stripMetadata: false, stripAnnotations: false, stripBookmarks: false,
    stripEmbedded: false, stripJS: false,
  },
  Archive: {
    dpiMode: false, targetDpi: 150, jpegQuality: 70, grayscale: false,
    stripMetadata: false, stripAnnotations: false, stripBookmarks: false,
    stripEmbedded: false, stripJS: false,
  },
  Maximum: {
    dpiMode: true, targetDpi: 72, jpegQuality: 40, grayscale: true,
    stripMetadata: true, stripAnnotations: true, stripBookmarks: true,
    stripEmbedded: true, stripJS: true,
  },
}

interface PresetBarProps {
  onApply: (values: ToolOptions) => void
}

export function PresetBar({ onApply }: PresetBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-fg-muted">Presets:</span>
      {Object.entries(PRESETS).map(([name, values]) => (
        <button
          key={name}
          type="button"
          onClick={() => onApply(values)}
          className={cn(
            'rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-medium text-fg',
            'transition-colors hover:border-primary/50 hover:text-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
