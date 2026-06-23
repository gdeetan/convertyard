'use client'
import type { ToolOptions } from '@/lib/types'

interface Preset {
  name: string
  icon: string
  description: string
  values: ToolOptions
}

const PRESETS: Preset[] = [
  {
    name: 'Web',
    icon: '🌐',
    description: 'Optimised for web pages: 1920px max, quality 75, strip metadata',
    values: {
      maxDimension: '1920',
      quality: 75,
      chromaSubsampling: '4:2:0',
      stripMetadata: true,
      convertToSrgb: true,
    },
  },
  {
    name: 'Email',
    icon: '📧',
    description: 'For email attachments: 1280px max, quality 70, target under 1 MB',
    values: {
      maxDimension: '1280',
      quality: 70,
      stripMetadata: true,
      maxSizeKb: 1024,
    },
  },
  {
    name: 'Social',
    icon: '📱',
    description: 'Fits Instagram, X, LinkedIn: 1920px max, quality 85',
    values: {
      maxDimension: '1920',
      quality: 85,
      stripMetadata: true,
    },
  },
  {
    name: 'Exam photo',
    icon: '🪪',
    description: 'For government / exam portals: strip metadata, target 100 KB, sRGB',
    values: {
      maxSizeKb: 100,
      stripMetadata: true,
      convertToSrgb: true,
    },
  },
  {
    name: 'Archive',
    icon: '📦',
    description: 'Maximum quality: preserve EXIF, preserve ICC, quality 95',
    values: {
      quality: 95,
      stripMetadata: false,
      convertToSrgb: false,
    },
  },
  {
    name: 'Max compression',
    icon: '🗜',
    description: 'Smallest files: 1280px max, quality 50, strip everything',
    values: {
      maxDimension: '1280',
      quality: 50,
      chromaSubsampling: '4:2:0',
      stripMetadata: true,
    },
  },
]

interface Props {
  onApply: (values: ToolOptions) => void
  verticalTargetKb?: number
}

export function ImagePresetBar({ onApply, verticalTargetKb }: Props) {
  const presets = verticalTargetKb
    ? PRESETS.map((p) =>
        p.name === 'Exam photo'
          ? {
              ...p,
              description: `Exam portal target: ${verticalTargetKb} KB — strip metadata, sRGB`,
              values: { ...p.values, maxSizeKb: verticalTargetKb },
            }
          : p,
      )
    : PRESETS

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-fg-muted">Presets:</span>
      {presets.map((preset) => (
        <button
          key={preset.name}
          type="button"
          onClick={() => onApply(preset.values)}
          title={preset.description}
          className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-medium text-fg transition-colors hover:border-primary/50 hover:text-primary"
        >
          {preset.icon} {preset.name}
        </button>
      ))}
    </div>
  )
}
