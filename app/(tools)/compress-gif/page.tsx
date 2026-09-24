'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/compress-gif'

const howToCompressGifSection = (
  <section>
    <h2 className="text-2xl font-semibold text-fg">How to Compress a GIF</h2>

    <p className="mt-4 text-base text-fg-muted">
      Compressing a GIF shrinks its file size so it fits inside Slack,
      Discord, email attachment limits, and CMS uploaders that reject
      anything over a few megabytes. The tricky part is doing that
      without turning smooth motion into a slideshow or introducing
      color banding on gradients. ConvertYard runs a WebAssembly build
      of <em>gifsicle</em> — the same optimizer most command-line tools
      use — entirely in your browser, so you can compress hundreds of
      GIFs at once without uploading a single byte.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      Unlike online GIF compressors that limit you to one file at a
      time or lock target-size mode behind a signup, this tool combines
      lossy compression, palette reduction, and frame drop in a single
      pass. Presets cover the common cases; the Advanced tab exposes
      every knob for tuning specific files.
    </p>

    <p className="mt-6 text-base text-fg-muted">
      Suggested workflow:
    </p>

    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
      <li>
        Drop 1 to 1,000 animated or static GIFs. The tool accepts
        anything with a <code>.gif</code> extension.
      </li>
      <li>
        Pick a preset — Balanced is the sweet spot for most GIFs — or
        set a target file size in KB or MB. Target-size mode
        binary-searches the lossy level in up to 6 passes to hit within
        5% of your goal.
      </li>
      <li>
        For manual control, open the Advanced tab and toggle{' '}
        <em>Use manual settings</em>. Adjust the lossy slider (0–200),
        palette size (32/64/128/256 colors), frame-drop ratio, and
        dithering.
      </li>
      <li>
        Click Compress. The batch runs in parallel across your CPU
        cores, capped at 4 concurrent files to keep memory predictable.
        Each row shows per-file progress and final % saved.
      </li>
      <li>
        Preview the compressed animation side-by-side with the original
        — both loop natively in the browser so you can spot motion or
        color artifacts before downloading.
      </li>
      <li>
        Download files individually or grab everything as a single ZIP.
      </li>
    </ol>

    <p className="mt-6 text-base text-fg-muted">
      If your GIF is really a short video clip and the <code>.gif</code>{' '}
      extension isn&rsquo;t a hard requirement, converting to modern
      video formats shrinks the file by 90%+ with better playback
      quality. Try{' '}
      <a href="/gif-to-mp4/" className="text-primary underline hover:text-primary-hover">
        GIF to MP4
      </a>{' '}
      or{' '}
      <a href="/gif-to-webp/" className="text-primary underline hover:text-primary-hover">
        GIF to WebP
      </a>{' '}
      instead — same motion, tiny fraction of the size.
    </p>
  </section>
)

export default function Page() {
  return <ToolShell config={config} afterHowItWorks={howToCompressGifSection} />
}
