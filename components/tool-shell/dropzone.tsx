'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { UploadCloud, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import { fileMatchesAccept, filesFromDataTransfer } from '@/lib/utils/drop-files'
import { materializeFile, isMaterialized } from '@/lib/utils/materialize-file'

interface DropzoneProps {
  accepts: string[]          // MIME types
  acceptsExt: string[]       // e.g. ['.jpg', '.jpeg']
  onAdd: (files: File[]) => void
  disabled?: boolean
  compact?: boolean           // collapsed "add more" row
  fileCount?: number
  totalBytes?: number
  multiple?: boolean
}

type DragState = 'idle' | 'over' | 'error'

export function Dropzone({
  accepts,
  acceptsExt,
  onAdd,
  disabled = false,
  compact = false,
  fileCount = 0,
  totalBytes = 0,
  multiple = true,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState<DragState>('idle')
  const [srMsg, setSrMsg] = useState('')

  const open = () => {
    if (!disabled) inputRef.current?.click()
  }

  const validate = useCallback(
    (files: File[]): File[] => files.filter((f) => fileMatchesAccept(f, accepts, acceptsExt)),
    [accepts, acceptsExt]
  )

  const handleFiles = useCallback(
    async (raw: File[]) => {
      const typed = validate(raw)
      const valid = multiple ? typed : typed.slice(0, 1)
      const typeRejected = raw.length - typed.length
      if (valid.length > 0) {
        // Android revokes read access to content:// URIs (Viber, WhatsApp,
        // Google Photos, MediaStore camera captures) shortly after the pick.
        // Copy video bytes into a JS-owned Blob NOW while the permission is
        // still valid, so downstream WORKERFS/MEMFS/HTMLVideoElement reads
        // never hit a revoked URI. Non-video files skip this (cheap tools
        // like image converters don't need the extra memory pass).
        setSrMsg(`Reading ${valid.length} file${valid.length > 1 ? 's' : ''}…`)
        const prepared = await Promise.all(
          valid.map(async (f) => {
            if (!f.type.startsWith('video/') || isMaterialized(f)) return f
            try {
              return await materializeFile(f)
            } catch {
              // Fall through with the original file — compressVideo throws a
              // clearer message when the byte-level read finally fails.
              return f
            }
          }),
        )
        onAdd(prepared)
        setSrMsg(
          `${prepared.length} file${prepared.length > 1 ? 's' : ''} added.${typeRejected > 0 ? ` ${typeRejected} rejected (wrong type).` : ''}`
        )
      }
      if (valid.length === 0 && raw.length > 0) {
        setDrag('error')
        setSrMsg(`${typeRejected} file${typeRejected > 1 ? 's' : ''} rejected. Accepted types: ${acceptsExt.join(', ')}.`)
        setTimeout(() => setDrag('idle'), 2000)
      }
    },
    [validate, onAdd, acceptsExt, multiple]
  )

  // Paste from clipboard
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (!e.clipboardData?.files.length) return
      handleFiles(Array.from(e.clipboardData.files))
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [handleFiles])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDrag('over')
  }
  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag('idle')
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag('idle')
    if (disabled) return
    void filesFromDataTransfer(e.dataTransfer).then(handleFiles)
  }
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  const extLabel = acceptsExt.join(', ').toUpperCase()

  // ── Hidden file input (shared between both modes) ────────────────────────
  const input = (
    <input
      ref={inputRef}
      type="file"
      multiple={multiple}
      accept={[...accepts, ...acceptsExt].join(',')}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={onInputChange}
    />
  )

  // ── Screen reader live region ────────────────────────────────────────────
  const liveRegion = (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {srMsg}
    </div>
  )

  // ── Compact "add more" row ───────────────────────────────────────────────
  if (compact) {
    return (
      <>
        {input}
        {liveRegion}
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg border border-dashed border-border',
            'px-4 py-3 text-sm text-fg-muted transition-colors',
            'hover:border-primary hover:text-primary hover:bg-bg-muted',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
          aria-label={`Add more ${extLabel} files. Currently ${fileCount} file${fileCount !== 1 ? 's' : ''} (${formatBytes(totalBytes)})`}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Add more files
            <span className="ml-2 text-fg-subtle">
              {fileCount} file{fileCount !== 1 ? 's' : ''} · {formatBytes(totalBytes)}
            </span>
          </span>
        </button>
      </>
    )
  }

  // ── Full dropzone ────────────────────────────────────────────────────────
  const isError = drag === 'error'
  const isOver = drag === 'over'

  return (
    <>
      {input}
      {liveRegion}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Drop zone. Accepts ${extLabel}${multiple ? '' : ', one file'}. Press Enter or Space to open file picker, or drag and drop files or a folder here.`}
        aria-disabled={disabled}
        onClick={open}
        onKeyDown={onKeyDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4',
          'rounded-xl border-2 border-dashed p-8 text-center transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          // States
          !isOver && !isError && 'border-border bg-bg-muted hover:border-primary hover:bg-bg-elevated',
          isOver && 'border-primary bg-bg-elevated scale-[1.01]',
          isError && 'border-error bg-bg-elevated',
          disabled && 'cursor-not-allowed opacity-40 pointer-events-none'
        )}
      >
        {isError ? (
          <>
            <AlertCircle className="h-10 w-10 text-error" aria-hidden="true" />
            <p className="text-sm font-medium text-error">
              Wrong file type. Accepts: {extLabel}
            </p>
          </>
        ) : (
          <>
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl',
                'bg-bg-elevated border border-border transition-colors',
                isOver && 'border-primary bg-bg-muted'
              )}
            >
              <UploadCloud
                className={cn('h-7 w-7', isOver ? 'text-primary' : 'text-fg-muted')}
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-fg">
                {isOver ? 'Release to add' : multiple ? 'Drop files or a folder here' : 'Drop a video here'}
              </p>
              <p className="text-xs text-fg-muted">
                or{' '}
                <span className="font-medium text-primary underline underline-offset-2">
                  click to browse
                </span>
                {' '}· paste from clipboard
              </p>
            </div>
            <p className="text-xs text-fg-subtle">
              Accepts {extLabel} · {multiple ? 'Up to 1,000 files' : 'One video'}
            </p>
          </>
        )}
      </div>
    </>
  )
}
