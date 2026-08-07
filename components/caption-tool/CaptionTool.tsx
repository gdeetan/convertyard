'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Download, RefreshCcw } from 'lucide-react'
import type { WordChunk, CaptionOptions } from '@/lib/converters/caption-types'
import { DEFAULT_CAPTION_OPTIONS } from '@/lib/converters/caption-types'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { CaptionStylePicker } from './CaptionStylePicker'
import { CaptionFontPanel } from './CaptionFontPanel'
import { CaptionEditor } from './CaptionEditor'
import { CaptionPreview } from './CaptionPreview'

type Phase = 'idle' | 'transcribing' | 'edit' | 'burning' | 'done'

const VIDEO_ACCEPTS = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska']
const VIDEO_EXTS = ['.mp4', '.mov', '.webm', '.avi', '.mkv']

function DonePanel({ resultFile, onReset }: { resultFile: File; onReset: () => void }) {
  const downloadUrl = useMemo(() => URL.createObjectURL(resultFile), [resultFile])
  useEffect(() => () => URL.revokeObjectURL(downloadUrl), [downloadUrl])

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-elevated p-8">
      <p className="text-lg font-semibold text-fg">Captions burned in</p>
      <a
        href={downloadUrl}
        download={resultFile.name}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
      >
        <Download className="h-4 w-4" />
        Download {resultFile.name}
      </a>
      <button type="button" onClick={onReset} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
        <RefreshCcw className="h-3.5 w-3.5" />
        Caption another video
      </button>
    </div>
  )
}

export function CaptionTool() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [words, setWords] = useState<WordChunk[]>([])
  const [options, setOptions] = useState<CaptionOptions>(DEFAULT_CAPTION_OPTIONS)
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeWordIdx, setActiveWordIdx] = useState(0)

  const handleDrop = useCallback(async (files: File[]) => {
    if (!files.length) return
    const file = files[0]
    setVideoFile(file)
    setPhase('transcribing')
    setProgress(0)
    setError(null)
    setStatusText('Downloading Whisper model (one-time, ~40 MB)…')

    try {
      const { transcribeToWords } = await import('@/lib/converters/caption-transcribe')
      const result = await transcribeToWords(
        file,
        'balanced',
        null,
        (pct) => {
          setProgress(Math.round(pct * 0.5))
          if (pct < 100) setStatusText(`Downloading Whisper model… ${pct}%`)
          else setStatusText('Transcribing audio…')
        },
        (pct) => setProgress(50 + Math.round(pct * 0.5)),
      )
      setWords(result)
      setPhase('edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
      setPhase('idle')
    }
  }, [])

  const handleBurn = useCallback(async () => {
    if (!videoFile || words.length === 0) return
    setPhase('burning')
    setProgress(0)
    setStatusText('Preparing ffmpeg…')
    setError(null)

    try {
      const { burnCaptions } = await import('@/lib/converters/caption-burn')

      const fontBlob: Blob | null =
        options.fontSource === 'upload' && options.uploadedFont ? options.uploadedFont :
        options.fontSource === 'system' && options.systemFontBlob ? options.systemFontBlob :
        null

      setStatusText('Burning captions into video…')
      const output = await burnCaptions(videoFile, words, options, fontBlob, (pct) => {
        setProgress(pct)
        setStatusText(`Burning captions… ${pct}%`)
      })

      setResultFile(output)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Burn failed')
      setPhase('edit')
    }
  }, [videoFile, words, options])

  function handleReset() {
    setPhase('idle')
    setVideoFile(null)
    setWords([])
    setResultFile(null)
    setProgress(0)
    setError(null)
  }

  function handleTimeUpdate(time: number) {
    const idx = words.findIndex((w) => time >= w.start && time < w.end)
    if (idx !== -1) setActiveWordIdx(idx)
  }

  function patchOptions(patch: Partial<CaptionOptions>) {
    setOptions((prev) => ({ ...prev, ...patch }))
  }

  if (phase === 'idle') {
    return (
      <>
        <Dropzone
          accepts={VIDEO_ACCEPTS}
          acceptsExt={VIDEO_EXTS}
          onAdd={handleDrop}
        />
        {error && (
          <p className="mt-3 rounded bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </>
    )
  }

  if (phase === 'transcribing' || phase === 'burning') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-elevated p-8">
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <p className="text-sm text-fg-muted">{statusText}</p>
        <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-fg-subtle/20">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-fg-subtle">{progress}%</p>
      </div>
    )
  }

  if (phase === 'done' && resultFile) {
    return <DonePanel resultFile={resultFile} onReset={handleReset} />
  }

  return (
    <div className="space-y-6">
      {videoFile && (
        <CaptionPreview
          videoFile={videoFile}
          words={words}
          options={options}
          onTimeUpdate={handleTimeUpdate}
        />
      )}

      <CaptionStylePicker
        value={options.styleId}
        onChange={(styleId) => patchOptions({ styleId })}
      />

      <CaptionFontPanel options={options} onChange={patchOptions} />

      <CaptionEditor
        words={words}
        activeIndex={activeWordIdx}
        onChange={setWords}
      />

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={handleReset} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
          <RefreshCcw className="h-3.5 w-3.5" />
          Start over
        </button>
        <button
          type="button"
          onClick={handleBurn}
          disabled={words.length === 0}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          Burn Captions into Video
        </button>
      </div>
    </div>
  )
}
