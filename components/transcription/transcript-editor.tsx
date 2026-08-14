'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Search, User, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { OutputFormat } from '@/lib/converters/transcription'

interface TranscriptEditorProps {
  file: File
  output: string
  originalOutput?: string
  outputFormat: OutputFormat
  onChange: (next: string) => void
}

// Parse "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" to seconds
function parseSrtTime(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/)
  if (!m) return null
  const [, h, mm, s, ms] = m
  return Number(h) * 3600 + Number(mm) * 60 + Number(s) + Number(ms) / 1000
}

interface Cue {
  start: number
  label: string
  index: number  // char offset in text
}

function extractCues(srt: string): Cue[] {
  const cues: Cue[] = []
  const re = /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(srt)) !== null) {
    const start = parseSrtTime(m[1])
    if (start !== null) cues.push({ start, label: m[1], index: m.index })
  }
  return cues
}

export function TranscriptEditor({
  file,
  output,
  originalOutput,
  outputFormat,
  onChange,
}: TranscriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [showFind, setShowFind] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [nextSpeaker, setNextSpeaker] = useState(1)

  const isVideo = file.type.startsWith('video/')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setMediaUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const cues = useMemo(
    () => (outputFormat === 'srt' ? extractCues(output) : []),
    [output, outputFormat]
  )

  const isEdited = originalOutput !== undefined && output !== originalOutput

  const seekTo = useCallback((seconds: number) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = seconds
    void el.play().catch(() => {})
  }, [])

  const insertSpeaker = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const label = `\n\nSpeaker ${nextSpeaker}: `
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = output.slice(0, start) + label + output.slice(end)
    onChange(next)
    setNextSpeaker((n) => (n >= 4 ? 1 : n + 1))
    requestAnimationFrame(() => {
      const caret = start + label.length
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }, [nextSpeaker, output, onChange])

  const replaceNext = useCallback(() => {
    if (!findText) return
    const el = textareaRef.current
    const from = el ? el.selectionEnd : 0
    const idx = output.indexOf(findText, from)
    const finalIdx = idx === -1 ? output.indexOf(findText, 0) : idx
    if (finalIdx === -1) return
    const next = output.slice(0, finalIdx) + replaceText + output.slice(finalIdx + findText.length)
    onChange(next)
    requestAnimationFrame(() => {
      if (!el) return
      const caret = finalIdx + replaceText.length
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }, [findText, replaceText, output, onChange])

  const replaceAll = useCallback(() => {
    if (!findText) return
    onChange(output.split(findText).join(replaceText))
  }, [findText, replaceText, output, onChange])

  const downloadSingle = useCallback(() => {
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const ext = outputFormat === 'srt' ? '.srt' : '.txt'
    const mime = outputFormat === 'srt' ? 'application/x-subrip' : 'text/plain'
    const blob = new Blob([output], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}${ext}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [file, output, outputFormat])

  const words = (output.trim().match(/\S+/g) ?? []).length

  return (
    <div className="px-4 pb-3 space-y-2">
      {/* Media player */}
      {mediaUrl && (
        isVideo ? (
          <video
            ref={audioRef as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            controls
            className="w-full max-h-48 rounded-lg bg-black"
          />
        ) : (
          <audio
            ref={audioRef as React.RefObject<HTMLAudioElement>}
            src={mediaUrl}
            controls
            className="w-full h-9"
          />
        )
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowFind((v) => !v)}
          className={cn(
            'flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
            showFind
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-bg text-fg-muted hover:border-primary hover:text-primary'
          )}
          aria-pressed={showFind}
        >
          <Search className="h-3 w-3" /> Find & replace
        </button>
        <button
          type="button"
          onClick={insertSpeaker}
          className="flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg-muted transition-colors hover:border-primary hover:text-primary"
          title="Insert speaker label at cursor"
        >
          <User className="h-3 w-3" /> Speaker {nextSpeaker}
        </button>
        <button
          type="button"
          onClick={downloadSingle}
          className="flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg-muted transition-colors hover:border-primary hover:text-primary"
        >
          <Download className="h-3 w-3" /> .{outputFormat}
        </button>
        {isEdited && originalOutput !== undefined && (
          <button
            type="button"
            onClick={() => onChange(originalOutput)}
            className="ml-auto flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg-muted transition-colors hover:border-primary hover:text-primary"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Find & replace panel */}
      {showFind && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg-muted p-2">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find"
            className="min-w-0 flex-1 rounded border border-border bg-bg px-2 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with"
            className="min-w-0 flex-1 rounded border border-border bg-bg px-2 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="button"
            onClick={replaceNext}
            disabled={!findText}
            className="rounded border border-border bg-bg px-2 py-1 text-xs text-fg-muted hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Replace next
          </button>
          <button
            type="button"
            onClick={replaceAll}
            disabled={!findText}
            className="rounded border border-border bg-bg px-2 py-1 text-xs text-fg-muted hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Replace all
          </button>
          <button
            type="button"
            onClick={() => setShowFind(false)}
            className="rounded p-1 text-fg-subtle hover:text-fg"
            aria-label="Close find & replace"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Timestamp chips — SRT only */}
      {cues.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto rounded-md border border-border bg-bg-muted p-2">
          {cues.map((cue, i) => (
            <button
              key={i}
              type="button"
              onClick={() => seekTo(cue.start)}
              className="rounded bg-bg px-1.5 py-0.5 font-mono text-[10px] text-fg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              title="Jump to this timestamp"
            >
              {cue.label}
            </button>
          ))}
        </div>
      )}

      {/* Editable transcript */}
      <textarea
        ref={textareaRef}
        value={output}
        onChange={(e) => onChange(e.target.value)}
        spellCheck
        rows={12}
        aria-label={`Transcript for ${file.name} — editable`}
        className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-fg focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      {/* Meta row */}
      <div className="flex items-center justify-between text-[11px] text-fg-subtle">
        <span>
          {words} words · {output.length} chars
          {isEdited && <span className="ml-2 text-primary">· edited</span>}
        </span>
      </div>
    </div>
  )
}
