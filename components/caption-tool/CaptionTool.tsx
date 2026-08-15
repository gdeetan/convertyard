'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Download, RefreshCcw, FileDown, FileUp } from 'lucide-react'
import type { WordChunk, CaptionOptions, CaptionStyleId } from '@/lib/converters/caption-types'
import { DEFAULT_CAPTION_OPTIONS, STYLE_PRESETS } from '@/lib/converters/caption-types'
import type { CaptionQuality } from '@/lib/converters/caption-transcribe'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { CaptionStylePicker } from './CaptionStylePicker'
import { CaptionFontPanel } from './CaptionFontPanel'
import { CaptionEditor } from './CaptionEditor'
import { CaptionPreview } from './CaptionPreview'
import { downloadFile, formatBytes } from '@/lib/utils/download'
import { captionWorkloadWarning } from '@/lib/converters/caption-workload'
import { isCancelError } from '@/lib/converters/audio-decode'
import { toTranscriptionUserMessage } from '@/lib/converters/transcription-errors'
import { probeVideoDuration } from '@/lib/converters/media-probe'

type Phase = 'idle' | 'ready' | 'transcribing' | 'edit' | 'burning' | 'done'

const QUALITY_OPTIONS: { value: CaptionQuality; label: string; hint: string }[] = [
  { value: 'fast', label: 'Fast', hint: 'Whisper Tiny · ~40 MB · quickest' },
  { value: 'balanced', label: 'Balanced', hint: 'Whisper Base · ~74 MB · recommended' },
  { value: 'accurate', label: 'Accurate', hint: 'Whisper Small · ~244 MB · best quality' },
]

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: '', label: 'Auto-detect' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ko', label: 'Korean' },
]

const MODEL_SIZE: Record<CaptionQuality, string> = {
  fast: '~40 MB',
  balanced: '~74 MB',
  accurate: '~244 MB',
}

function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      const dims = { width: video.videoWidth || 1920, height: video.videoHeight || 1080 }
      URL.revokeObjectURL(url)
      resolve(dims)
    }
    video.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 1920, height: 1080 }) }
    video.src = url
  })
}

// Estimate sensible initial maxCharsPerLine: how many average chars fit across
// the video width at the given font size (0.55 em per char is a rough average).
function smartMaxChars(videoWidth: number, fontSize: number): number {
  return Math.max(10, Math.min(80, Math.floor(videoWidth / (fontSize * 0.55))))
}

const VIDEO_ACCEPTS = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska']
const VIDEO_EXTS = ['.mp4', '.mov', '.webm', '.avi', '.mkv']

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

function DonePanel({
  resultFile,
  onReset,
  onAdjust,
}: {
  resultFile: File
  onReset: () => void
  onAdjust: () => void
}) {
  const downloadUrl = useMemo(() => URL.createObjectURL(resultFile), [resultFile])
  useEffect(() => () => URL.revokeObjectURL(downloadUrl), [downloadUrl])

  return (
    <div className="space-y-4">
      <video src={downloadUrl} controls playsInline className="w-full rounded-xl bg-black" />
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-semibold text-fg">Captions burned in</p>
        <a
          href={downloadUrl}
          download={resultFile.name}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          Download {resultFile.name}
        </a>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={onAdjust} className="text-sm font-medium text-primary hover:underline">
            Adjust captions and re-burn
          </button>
          <button type="button" onClick={onReset} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
            <RefreshCcw className="h-3.5 w-3.5" />
            Caption another video
          </button>
        </div>
      </div>
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
  const [videoDims, setVideoDims] = useState<{ width: number; height: number } | null>(null)
  const [quality, setQuality] = useState<CaptionQuality>('balanced')
  const [language, setLanguage] = useState('en')
  const [timestampsEstimated, setTimestampsEstimated] = useState(false)
  const [durationSec, setDurationSec] = useState(0)
  const [seekTime, setSeekTime] = useState(0)
  const [seekNonce, setSeekNonce] = useState(0)
  const importRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const workloadWarning = videoFile && videoDims
    ? captionWorkloadWarning({
        durationSec,
        width: videoDims.width,
        height: videoDims.height,
        bytes: videoFile.size,
      })
    : null

  const applyVideoFile = useCallback((file: File) => {
    setVideoFile(file)
    setWords([])
    setResultFile(null)
    setTimestampsEstimated(false)
    setError(null)
    setDurationSec(0)
    setPhase('ready')
    getVideoDimensions(file).then((dims) => {
      setVideoDims(dims)
      setOptions((prev) => ({ ...prev, maxCharsPerLine: smartMaxChars(dims.width, prev.fontSize) }))
    })
    probeVideoDuration(file).then(setDurationSec)
    import('@/lib/converters/ffmpeg-client').then(({ getSingleThreadFFmpeg }) => {
      getSingleThreadFFmpeg().catch(() => { /* burn click will surface errors */ })
    })
  }, [])

  const handleDrop = useCallback((files: File[]) => {
    if (!files.length) return
    applyVideoFile(files[0])
  }, [applyVideoFile])

  const handleTranscribe = useCallback(async () => {
    if (!videoFile) return
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setPhase('transcribing')
    setProgress(0)
    setError(null)
    setStatusText(`Downloading Whisper model (one-time, ${MODEL_SIZE[quality]})…`)

    try {
      const { transcribeToWords } = await import('@/lib/converters/caption-transcribe')
      const result = await transcribeToWords(
        videoFile,
        quality,
        language || null,
        (pct) => {
          setProgress(Math.round(pct * 0.5))
          if (pct < 100) setStatusText(`Downloading Whisper model… ${pct}%`)
          else setStatusText('Extracting audio…')
        },
        (pct) => {
          setProgress(50 + Math.round(pct * 0.5))
          setStatusText('Transcribing audio…')
        },
        ac.signal,
      )
      if (ac.signal.aborted) return
      if (result.words.length === 0) {
        setError('No speech detected. Try Accurate, set the language, or import an SRT/VTT.')
        setPhase('ready')
        return
      }
      setWords(result.words)
      setTimestampsEstimated(result.timestampsEstimated)
      setPhase('edit')
    } catch (err) {
      if (isCancelError(err) || ac.signal.aborted) {
        setPhase('ready')
        return
      }
      setError(toTranscriptionUserMessage(err))
      setPhase('ready')
    }
  }, [videoFile, quality, language])

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const { parseSubtitleText } = await import('@/lib/converters/caption-subtitles')
      const imported = parseSubtitleText(text)
      setWords(imported)
      setTimestampsEstimated(false)
      setError(null)
      setPhase('edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that subtitle file.')
    }
  }, [])

  const handleExport = useCallback(async (format: 'srt' | 'vtt') => {
    if (words.length === 0 || !videoFile) return
    const { buildCaptionSRT, buildCaptionVTT } = await import('@/lib/converters/caption-subtitles')
    const text = format === 'srt' ? buildCaptionSRT(words) : buildCaptionVTT(words)
    const mime = format === 'srt' ? 'application/x-subrip' : 'text/vtt'
    downloadFile(new File([text], `${baseName(videoFile.name)}.${format}`, { type: mime }))
  }, [words, videoFile])

  const handleSoftCaptions = useCallback(async () => {
    if (!videoFile || words.length === 0 || timestampsEstimated) return
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setPhase('burning')
    setProgress(0)
    setStatusText('Muxing soft captions…')
    setError(null)
    try {
      const { muxSoftCaptions } = await import('@/lib/converters/caption-soft')
      const output = await muxSoftCaptions(videoFile, words, (pct) => {
        setProgress(Math.max(0, Math.min(100, Math.round(pct))))
        setStatusText(`Muxing soft captions… ${Math.round(pct)}%`)
      }, ac.signal)
      if (ac.signal.aborted) return
      setResultFile(output)
      setPhase('done')
    } catch (err) {
      if (isCancelError(err) || ac.signal.aborted) {
        setPhase('edit')
        return
      }
      setError(err instanceof Error ? err.message : 'Soft captions failed')
      setPhase('edit')
    }
  }, [videoFile, words, timestampsEstimated])

  const handleBurn = useCallback(async () => {
    if (!videoFile || words.length === 0 || timestampsEstimated) return
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
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

      setStatusText('Encoding captions…')
      const output = await burnCaptions(
        videoFile, words, options, fontBlob,
        (pct) => {
          const safePct = Math.max(0, Math.min(100, Math.round(pct)))
          setProgress(safePct)
          setStatusText(`Encoding captions… ${safePct}%`)
        },
        videoDims ?? undefined,
        ac.signal,
      )

      if (ac.signal.aborted) return
      setResultFile(output)
      setPhase('done')
    } catch (err) {
      if (isCancelError(err) || ac.signal.aborted) {
        setPhase('edit')
        return
      }
      setError(err instanceof Error ? err.message : (err != null ? String(err) : 'Burn failed'))
      setPhase('edit')
    }
  }, [videoFile, words, options, videoDims, timestampsEstimated])

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
    setPhase((current) => current === 'burning' ? 'edit' : current === 'transcribing' ? 'ready' : current)
    void import('@/lib/converters/ffmpeg-client').then(({ resetFFmpeg, resetSingleThreadFFmpeg }) => {
      void resetFFmpeg()
      void resetSingleThreadFFmpeg()
    })
    void import('@/lib/converters/transcription-client').then(({ abortTranscription }) => {
      abortTranscription()
    })
  }, [])

  function handleReset() {
    handleCancel()
    setPhase('idle')
    setVideoFile(null)
    setWords([])
    setResultFile(null)
    setProgress(0)
    setError(null)
    setTimestampsEstimated(false)
    setDurationSec(0)
  }

  function handleSeek(time: number) {
    setSeekTime(time)
    setSeekNonce((n) => n + 1)
    setActiveWordIdx(words.findIndex((w) => time >= w.start && time < w.end))
  }

  function handleTimeUpdate(time: number) {
    const idx = words.findIndex((w) => time >= w.start && time < w.end)
    if (idx !== -1) setActiveWordIdx(idx)
  }

  function patchOptions(patch: Partial<CaptionOptions>) {
    setOptions((prev) => ({ ...prev, ...patch }))
  }

  function handleStyleChange(styleId: CaptionStyleId) {
    patchOptions({ styleId, ...STYLE_PRESETS[styleId] })
  }

  const importInput = (
    <input
      ref={importRef}
      type="file"
      accept=".srt,.vtt,text/vtt,application/x-subrip"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (file) void handleImportFile(file)
      }}
    />
  )

  if (phase === 'idle') {
    return (
      <>
        <Dropzone
          accepts={VIDEO_ACCEPTS}
          acceptsExt={VIDEO_EXTS}
          onAdd={handleDrop}
          multiple={false}
        />
        {error && (
          <p className="mt-3 rounded bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </>
    )
  }

  if (phase === 'ready' && videoFile) {
    return (
      <div className="space-y-4">
        {importInput}
        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-sm font-medium text-fg">{videoFile.name}</p>
          <p className="mt-0.5 text-xs text-fg-muted">{formatBytes(videoFile.size)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="caption-quality" className="mb-1.5 block text-sm font-medium text-fg">
              Transcription quality
            </label>
            <select
              id="caption-quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value as CaptionQuality)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {QUALITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.hint}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="caption-language" className="mb-1.5 block text-sm font-medium text-fg">
              Language
            </label>
            <select
              id="caption-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value || 'auto'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {workloadWarning && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            {workloadWarning}
          </p>
        )}

        <p className="text-xs text-fg-muted">
          Set the spoken language for better accuracy. Or skip Whisper and import an existing SRT or VTT.
        </p>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button type="button" onClick={handleReset} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
            <RefreshCcw className="h-3.5 w-3.5" />
            Start over
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-fg hover:bg-bg-muted"
            >
              <FileUp className="h-4 w-4" />
              Import SRT / VTT
            </button>
            <button
              type="button"
              onClick={() => void handleTranscribe()}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Transcribe
            </button>
          </div>
        </div>
      </div>
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
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-fg-muted hover:text-fg"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (phase === 'done' && resultFile) {
    return (
      <DonePanel
        resultFile={resultFile}
        onReset={handleReset}
        onAdjust={() => setPhase('edit')}
      />
    )
  }

  return (
    <div className="space-y-6">
      {importInput}
      {videoFile && (
        <CaptionPreview
          videoFile={videoFile}
          words={words}
          options={options}
          onTimeUpdate={handleTimeUpdate}
          seekTime={seekTime}
          seekNonce={seekNonce}
        />
      )}

      {timestampsEstimated && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Whisper returned text but no word timings. Import an SRT/VTT to place captions, or transcribe again with a different quality.
        </p>
      )}

      <CaptionStylePicker
        value={options.styleId}
        onChange={handleStyleChange}
      />

      <CaptionFontPanel options={options} onChange={patchOptions} />

      <CaptionEditor
        words={words}
        activeIndex={activeWordIdx}
        onChange={setWords}
        onSeek={handleSeek}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg hover:bg-bg-muted"
        >
          <FileUp className="h-3.5 w-3.5" />
          Import SRT / VTT
        </button>
        <button
          type="button"
          onClick={() => void handleExport('srt')}
          disabled={words.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg hover:bg-bg-muted disabled:opacity-50"
        >
          <FileDown className="h-3.5 w-3.5" />
          Download SRT
        </button>
        <button
          type="button"
          onClick={() => void handleExport('vtt')}
          disabled={words.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg hover:bg-bg-muted disabled:opacity-50"
        >
          <FileDown className="h-3.5 w-3.5" />
          Download VTT
        </button>
      </div>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={handleReset} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
          <RefreshCcw className="h-3.5 w-3.5" />
          Start over
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSoftCaptions()}
            disabled={words.length === 0 || timestampsEstimated}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-fg hover:bg-bg-muted disabled:opacity-50"
          >
            Soft captions (no re-encode)
          </button>
          <button
            type="button"
            onClick={() => void handleBurn()}
            disabled={words.length === 0 || timestampsEstimated}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Burn Captions into Video
          </button>
        </div>
      </div>
    </div>
  )
}
