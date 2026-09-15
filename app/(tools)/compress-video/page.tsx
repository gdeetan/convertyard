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

const howToCompressSection = (
  <section className="mt-4">
    <h2 className="text-2xl font-semibold text-fg">How to Compress Videos?</h2>

    <p className="mt-4 text-base text-fg-muted">
      In layman&rsquo;s terms, compressing a video means shrinking its file size
      to save storage space and make it easier to share or upload without
      degrading playback quality. There&rsquo;s a delicate balance at play
      here.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      With ConvertYard, the compression happens in the browser. Open or
      drag/drop the video, pick a target size and quality, wait for it to
      compress, then download the compressed version. One difference between
      this tool and most I&rsquo;ve seen online is that it works in your
      browser. I tested it with WiFi turned off, and{' '}
      <strong className="text-fg">
        it compressed even large MP4 files over 2 Gigabytes
      </strong>
      .
    </p>

    <p className="mt-4 text-base text-fg-muted">
      One issue with cloud-based video compressors is twofold. First is the
      privacy issue. Even though they promise to delete the videos after a
      certain time period, there is always a risk of a data breach or a leak,
      and if you&rsquo;re working on a client project or something that,
      let&rsquo;s say, you don&rsquo;t want to fall into the wrong hands, it
      will stay on the internet forever.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      The second issue is that larger videos take longer to process because you
      have to upload them before the compression process starts. That depends
      on your internet speed; if you have a choppy connection, compressing a
      500 MB to 1 GB file will take a long time.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      Here&rsquo;s the basic workflow using ConvertYard.
    </p>

    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
      <li>
        Open or Drag/Drop a video file into the converter (supports MP4, MOV,
        WebM, AVI, MKV)
      </li>
      <li>
        There are several options - the easiest is choosing the &lsquo;file
        size target&rsquo; or a smaller resolution (720p, 480p, or 320p).
      </li>
      <li>Click Compress, and the process happens locally in the browser.</li>
      <li>Download the ZIP or file.</li>
    </ol>

    <p className="mt-4 text-base text-fg-muted">
      <strong className="text-fg">
        Most videos shrink 50–90% with no visible quality loss
      </strong>
      , especially if the original was recorded on a phone at a high bitrate.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      I&rsquo;ve tested compressing large videos (over 6 gigabytes of raw
      camera footage) on a desktop (on a Mac laptop) using Chrome, and it took
      about 5 to 8 minutes to compress that one file at 1080p. The result?{' '}
      <strong className="text-fg">
        The original 6.4 GB video file is compressed to 300 MB, or over 85%
        compression at 1080p
      </strong>
      . With the H.265 compression turned on,{' '}
      <strong className="text-fg">
        it increased the compression to 97% (205 MB file)
      </strong>{' '}
      without degrading quality.
    </p>

    <h3 className="mt-10 text-lg font-semibold text-fg">
      Compressing videos from an iPhone
    </h3>

    <p className="mt-4 text-base text-fg-muted">
      Videos shot with an iPhone are typically recorded in HEVC (H.265) within
      a .MOV wrapper. The high bitrate for these videos (especially for 4K)
      results in high-quality videos but larger file sizes.{' '}
      <strong className="text-fg">
        A single minute-long 4K video can be as much as 400 MB
      </strong>
      .
    </p>

    <p className="mt-4 text-base text-fg-muted">A few things worth noting.</p>

    <ol className="mt-4 list-decimal space-y-3 pl-6 text-base text-fg-muted">
      <li>
        <strong className="text-fg">
          Safari will refresh if you try to compress a large video (over 400
          MB)
        </strong>
        , especially if you choose the original or 1080p resolution. In my
        tests, it handles anything under 400 MB as long as you choose the 720p
        resolution. One option I&rsquo;ve built into the tool is using the
        target size. If you want better quality, choose the larger size options
        (100 or 200 MB), or go with the smaller sizes if you want to target a
        specific size (like 25 MB on Gmail).
      </li>
      <li>
        On desktop,{' '}
        <strong className="text-fg">
          Safari handles larger files better (up to 1 GB without
          auto-refreshing)
        </strong>
        . If you want to compress larger videos on mobile, use other browsers
        like{' '}
        <strong className="text-fg">
          Chrome, which can handle larger files (up to 1.5 GB on mobile)
        </strong>{' '}
        without refreshing.
      </li>
      <li>
        You&rsquo;ll notice that Safari on iOS disables the original resolution
        and 1080p because of the refresh issue, so use 720p.
      </li>
      <li>
        Unfortunately, you cannot compress with an H.265 video codec on Safari
        for larger files, even those over 50 MB, because the browser will crash
        or refresh. For maximum compression, use the target size feature. The
        purpose of the H.265 codec is simply to further reduce file size
        without degrading quality, so using the target size solves the issue if
        you&rsquo;re targeting a range.
      </li>
    </ol>

    <h3 className="mt-10 text-lg font-semibold text-fg">
      Compressing videos from an Android
    </h3>

    <p className="mt-4 text-base text-fg-muted">
      Modern Android phones record in H.264 or H.265 using an MP4 file format.
      However, manufacturers like Samsung, Google, and OnePlus use different
      encoding algorithms. Fortunately, compressing videos on an Android phone
      allows for more leeway with larger files.{' '}
      <strong className="text-fg">
        I&rsquo;ve tested files over 1 GB without the browser crashing
      </strong>
      , and that&rsquo;s with an older Samsung phone over 5 years old.
    </p>
  </section>
)

function CompressVideoPage() {
  return (
    <>
      <ToolShell
        config={config}
        notice={<CompressVideoEngineBanner />}
        afterHowItWorks={howToCompressSection}
      />
      <VideoDiagPanel />
    </>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <ToolShell
          config={config}
          notice={<CompressVideoEngineBanner />}
          afterHowItWorks={howToCompressSection}
        />
      }
    >
      <CompressVideoPage />
    </Suspense>
  )
}
