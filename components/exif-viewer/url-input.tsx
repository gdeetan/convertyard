'use client'
import { useState } from 'react'
import { fetchImageAsFile, type FetchImageError } from '@/lib/converters/exif-viewer-url'

interface Props { onFiles: (files: File[]) => void; disabled: boolean }

export function UrlInput({ onFiles, disabled }: Props) {
  const [url, setUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFetch() {
    if (!url.trim() || pending) return
    setPending(true); setError(null)
    const r = await fetchImageAsFile(url.trim())
    setPending(false)
    if (r instanceof File) {
      setUrl('')
      onFiles([r])
    } else {
      setError(errorMessage(r))
    }
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          type="url"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Or paste an image URL (imgur, wikipedia, github, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleFetch() }}
          disabled={disabled || pending}
        />
        <button
          type="button"
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          onClick={handleFetch}
          disabled={disabled || pending || url.trim().length === 0}
        >
          {pending ? 'Fetching…' : 'Fetch'}
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Works with hosts that allow direct downloads. Twitter/Instagram/Reddit block this — save the image and drop it here instead.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function errorMessage(e: FetchImageError): string {
  switch (e.kind) {
    case 'invalid-url':   return 'That does not look like a valid http(s) URL.'
    case 'cors-blocked':  return 'This host blocks direct downloads for privacy. Right-click the image → Save image as… → drop the file here.'
    case 'not-an-image':  return `That URL returned ${e.contentType}, not an image.`
    case 'too-large':     return `That image is ${(e.bytes / (1024 * 1024)).toFixed(1)} MB — over the 100 MB limit.`
    case 'other':         return e.message
  }
}
