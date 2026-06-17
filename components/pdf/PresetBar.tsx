'use client'

import { cn } from '@/lib/utils/cn'
import type { ToolOptions } from '@/lib/types'

const PRESETS: Array<{ name: string; icon: string; description: string; values: ToolOptions }> = [
  {
    name: 'Email',
    icon: '📧',
    description: 'Aim for <10 MB, quality-balanced',
    values: {
      dpiMode: false,
      jpegQuality: 75,
      grayscale: false,
      subsetFonts: true,
      stripEmbedded: true,
      stripMetadata: false,
    },
  },
  {
    name: 'Web',
    icon: '🌐',
    description: 'Linearized, 150 DPI, quality 70',
    values: {
      dpiMode: true,
      targetDpi: 150,
      jpegQuality: 70,
      grayscale: false,
      linearize: true,
      stripMetadata: false,
    },
  },
  {
    name: 'Print',
    icon: '🖨️',
    description: 'Preserve quality, strip metadata only',
    values: {
      dpiMode: false,
      jpegQuality: 95,
      grayscale: false,
      stripMetadata: true,
    },
  },
  {
    name: 'Archive',
    icon: '🗄️',
    description: 'PDF/A compatible, flatten forms',
    values: {
      dpiMode: false,
      jpegQuality: 85,
      grayscale: false,
      stripAnnotations: true,
      stripFormFields: true,
      formFieldStrategy: 'flatten',
    },
  },
  {
    name: 'Maximum',
    icon: '🔥',
    description: 'Smallest possible file',
    values: {
      dpiMode: true,
      targetDpi: 72,
      jpegQuality: 40,
      grayscale: true,
      subsetFonts: true,
      removeUnusedFonts: true,
      stripMetadata: true,
      stripAnnotations: true,
      stripBookmarks: true,
      stripFormFields: true,
      formFieldStrategy: 'remove',
      stripEmbedded: true,
      stripJS: true,
      stripPrivateAppData: true,
    },
  },
]

interface PresetBarProps {
  onApply: (values: ToolOptions) => void
}

export function PresetBar({ onApply }: PresetBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-fg-muted">Presets:</span>
      {PRESETS.map(({ name, icon, description, values }) => (
        <button
          key={name}
          type="button"
          onClick={() => onApply(values)}
          title={description}
          className={cn(
            'rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-medium text-fg',
            'transition-colors hover:border-primary/50 hover:text-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
        >
          {icon} {name}
        </button>
      ))}
    </div>
  )
}
