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
      stripEmbedded: true,
      stripMetadata: false,
    },
  },
  {
    name: 'Web',
    icon: '🌐',
    description: '150 DPI, quality 70',
    values: {
      dpiMode: true,
      targetDpi: 150,
      jpegQuality: 70,
      grayscale: false,
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
      stripMetadata: false,
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
      stripMetadata: false,
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
  currentValues?: ToolOptions
}

function matchesPreset(current: ToolOptions | undefined, preset: ToolOptions): boolean {
  if (!current) return false
  for (const key of Object.keys(preset) as Array<keyof ToolOptions>) {
    if (current[key] !== preset[key]) return false
  }
  return true
}

export function PresetBar({ onApply, currentValues }: PresetBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-fg-muted">Presets:</span>
      {PRESETS.map(({ name, icon, description, values }) => {
        const isSelected =
          matchesPreset(currentValues, values) &&
          currentValues?.__presetSource === 'advanced'
        return (
          <button
            key={name}
            type="button"
            onClick={() => onApply(values)}
            title={description}
            aria-pressed={isSelected}
            className={cn(
              'rounded-full border-2 px-3 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              isSelected
                ? 'border-primary bg-bg-muted text-primary font-bold'
                : 'border-border bg-bg-elevated text-fg hover:border-primary/50 hover:text-primary'
            )}
          >
            {icon} {name}
          </button>
        )
      })}
    </div>
  )
}
