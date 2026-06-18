'use client'

import { useEffect } from 'react'

export default function ToolError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[tool error]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
      <p className="text-2xl font-bold text-fg mb-2">Something went wrong</p>
      <p className="text-sm text-fg-muted mb-6">
        {error.message || 'An unexpected error occurred while loading this tool.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-fg hover:bg-primary-hover transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
