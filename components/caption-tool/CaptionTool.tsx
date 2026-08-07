'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Download, RefreshCcw, UploadCloud, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { WordChunk, CaptionOptions } from '@/lib/converters/caption-types'
import { DEFAULT_CAPTION_OPTIONS } from '@/lib/converters/caption-types'
import { CaptionStylePicker } from './CaptionStylePicker'
import { CaptionFontPanel } from './CaptionFontPanel'
import { CaptionEditor } from './CaptionEditor'
import { CaptionPreview } from './CaptionPreview'

type Phase = 'idle' | 'transcribing' | 'edit' | 'burning' | 'done'

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

const VIDEO_ACCEPTS = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska']

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
  const [drag, setDrag] = useState<'idle' | 'over' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    if (!file.type.startsWith('video/')) {
      setError('Please drop a video file.')
      return
    }
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
      const { buildASS } = await import('@/lib/converters/caption-ass-builder')
      const { burnCaptions } = await import('@/lib/converters/caption-burn')

      const fontBlob: Blob | null =
        options.fontSource === 'upload' && options.uploadedFont ? options.uploadedFont :
        options.fontSource === 'system' && options.systemFontBlob ? options.systemFontBlob :
        null

      const fontName =
        options.fontSource === 'builtin' ? options.builtinFont :
        options.fontSource === 'system' ? options.systemFontFamily : 'Arial'

      const assContent = buildASS(words, options, fontName)

      setStatusText('Burning captions into video…')
      const output = await burnCaptions(videoFile, assContent, fontBlob, (pct) => {
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
    const isOver = drag === 'over'
    const isError = drag === 'error'
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={VIDEO_ACCEPTS.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => { if (e.target.files) { handleDrop(e.target.files); e.target.value = '' } }}
        />
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop zone. Accepts MP4, MOV, WebM, AVI, MKV. Press Enter or Space to open file picker, or drag and drop files here."
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
          onDragOver={(e) => { e.preventDefault(); setDrag('over') }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag('idle') }}
          onDrop={(e) => {
            e.preventDefault()
            setDrag('idle')
            const files = Array.from(e.dataTransfer.files)
            const valid = files.filter(f => f.type.startsWith('video/'))
            if (valid.length === 0 && files.length > 0) {
              setDrag('error')
              setTimeout(() => setDrag('idle'), 2000)
              return
            }
            handleDrop(e.dataTransfer.files)
          }}
          className={cn(
            'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4',
            'rounded-xl border-2 border-dashed p-8 text-center transition-all duration-150',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            !isOver && !isError && 'border-border bg-bg-muted hover:border-primary hover:bg-bg-elevated',
            isOver && 'border-primary bg-bg-elevated scale-[1.01]',
            isError && 'border-error bg-bg-elevated',
          )}
        >
          {isError ? (
            <>
              <AlertCircle className="h-10 w-10 text-error" aria-hidden="true" />
              <p className="text-sm font-medium text-error">Wrong file type. Accepts: MP4, MOV, WebM, AVI, MKV</p>
            </>
          ) : (
            <>
              <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl',
                'bg-bg-elevated border border-border transition-colors',
                isOver && 'border-primary bg-bg-muted',
              )}>
                <UploadCloud className={cn('h-7 w-7', isOver ? 'text-primary' : 'text-fg-muted')} aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-fg">
                  {isOver ? 'Release to add' : 'Drop files here'}
                </p>
                <p className="text-xs text-fg-muted">
                  or <span className="font-medium text-primary underline underline-offset-2">click to browse</span>
                </p>
              </div>
              <p className="text-xs text-fg-subtle">Accepts MP4, MOV, WebM, AVI, MKV · Files never leave your browser</p>
              {error && <p className="rounded bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
            </>
          )}
        </div>
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
