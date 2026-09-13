'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { CompressVideoEngineBanner } from '@/components/tool-shell/compress-video-engine-banner'
import { config } from '@/content/tools/compress-video'

// PROMPT-40 investigation panel: renders the last [compress-video][diag]
// payload verbatim when ?debug=video-diag is present. Real iPhones make the
// Safari console painful to reach — this puts the diag line on the page.
function VideoDiagPanel() {
  const searchParams = useSearchParams()
  const enabled = searchParams.get('debug') === 'video-diag'
  const [entries, setEntries] = useState<unknown[]>([])
  useEffect(() => {
    if (!enabled) return
    const onDiag = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setEntries((prev) => [...prev.slice(-9), detail])
    }
    window.addEventListener('convertyard:video-diag', onDiag)
    return () => window.removeEventListener('convertyard:video-diag', onDiag)
  }, [enabled])
  if (!enabled) return null
  return (
    <div style={{ margin: '2rem auto', maxWidth: '900px', padding: '1rem', border: '2px dashed #d97706', background: '#fef3c7', color: '#111', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
        [debug=video-diag] Last {entries.length} diag payload(s). Newest at bottom.
      </div>
      {entries.length === 0 ? (
        <div>Waiting for a compression to finish...</div>
      ) : (
        entries.map((p, i) => (
          <pre key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '0 0 0.75rem', padding: '0.5rem', background: '#fff', border: '1px solid #d97706' }}>
            {JSON.stringify(p, null, 2)}
          </pre>
        ))
      )}
    </div>
  )
}

function CompressVideoPage() {
  return (
    <>
      <ToolShell config={config} notice={<CompressVideoEngineBanner />} />
      <VideoDiagPanel />
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<ToolShell config={config} notice={<CompressVideoEngineBanner />} />}>
      <CompressVideoPage />
    </Suspense>
  )
}
