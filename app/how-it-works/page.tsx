import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    "ConvertYard converts files in your browser using WebAssembly — no uploads, no servers, no waiting. Here's the technical explanation.",
  openGraph: {
    title: 'How ConvertYard works — WebAssembly, local-first file conversion',
    description:
      'Converts files in your browser using WebAssembly — no uploads, no servers, no waiting.',
    url: 'https://convertyard.com/how-it-works',
  },
  alternates: {
    canonical: 'https://convertyard.com/how-it-works',
  },
}

const LIBRARIES: {
  name: string
  purpose: string
  detail: React.ReactNode
}[] = [
  {
    name: 'libvips',
    purpose: 'Images (JPG, WebP, AVIF, PNG, HEIC, TIFF)',
    detail: (
      <>
        A fast image processing library for various image formats (JPG, WebP, AVIF, PNG,
        HEIC, …). It is{' '}
        <strong className="font-semibold text-fg">
          about 5 times faster than ImageMagick
        </strong>{' '}
        for most operations and compiled to{' '}
        <strong className="font-semibold text-fg">~3MB WASM</strong>.
      </>
    ),
  },
  {
    name: 'ffmpeg.wasm',
    purpose: 'Video and audio (MP4, MP3, GIF, WebM, WAV)',
    detail: (
      <>
        ffmpeg.wasm: ffmpeg the{' '}
        <strong className="font-semibold text-fg">
          industry standard multimedia library
        </strong>
        , now compiled to WebAssembly for use within{' '}
        <strong className="font-semibold text-fg">SharedArrayBuffer workers</strong>{' '}
        (AJA).
      </>
    ),
  },
  {
    name: 'pdf-lib + mupdf-wasm',
    purpose: 'PDF creation, merging, splitting, rendering',
    detail: (
      <>
        <strong className="font-semibold text-fg">pdf-lib</strong> handles construction
        and modification of PDFs in{' '}
        <strong className="font-semibold text-fg">pure JavaScript code</strong>.{' '}
        <strong className="font-semibold text-fg">mupdf-wasm</strong> is then used for
        rendering of PDFs to the screen, i.e.,{' '}
        <strong className="font-semibold text-fg">rasterization</strong>.
      </>
    ),
  },
  {
    name: '@huggingface/transformers',
    purpose: 'AI tools (background removal, upscaling, alt-text)',
    detail: (
      <>
        Runs ONNX models in-browser using{' '}
        <strong className="font-semibold text-fg">WebAssembly and WebGPU</strong>. Models
        are downloaded once and then{' '}
        <strong className="font-semibold text-fg">cached locally</strong> on subsequent
        uses.
      </>
    ),
  },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'How It Works' }]} />
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        How it works
      </h1>
      <p className="mb-12 text-lg text-fg-muted">
        Files never leave your device. Here's exactly what happens when you convert.
      </p>

      <div className="space-y-12 text-base leading-relaxed text-fg-muted">

        {/* Step by step */}
        <section>
          <h2 className="mb-6 text-xl font-semibold text-fg">What happens when you drop a file</h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">1</span>
              <div>
                <p className="font-medium text-fg">Your browser reads the file.</p>
                <p className="mt-1 text-sm">
                  The browser's File API reads your file into memory as an{' '}
                  <strong className="font-semibold text-fg">ArrayBuffer</strong>.{' '}
                  <strong className="font-semibold text-fg">No network request is made.</strong>{' '}
                  The data stays in your browser tab's isolated memory.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">2</span>
              <div>
                <p className="font-medium text-fg">A WASM module processes it.</p>
                <p className="mt-1 text-sm">
                  The relevant WebAssembly module (libvips for images, ffmpeg for video,
                  etc.) is{' '}
                  <strong className="font-semibold text-fg">loaded once and cached</strong>.
                  On first use, it downloads; after that, it loads instantly from your
                  browser cache. The module runs on your CPU in a{' '}
                  <strong className="font-semibold text-fg">sandboxed Web Worker</strong>,
                  so it can't access anything outside the tab.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">3</span>
              <div>
                <p className="font-medium text-fg">Output is handed back to the browser.</p>
                <p className="mt-1 text-sm">
                  The converted file is an ArrayBuffer in memory. The browser creates a{' '}
                  <strong className="font-semibold text-fg">local object URL</strong> (
                  <code>blob:</code>) and serves your download from it.{' '}
                  <strong className="font-semibold text-fg">Nothing is sent anywhere.</strong>
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">4</span>
              <div>
                <p className="font-medium text-fg">Memory is freed.</p>
                <p className="mt-1 text-sm">
                  After download, the object URL is revoked, and the ArrayBuffers are{' '}
                  <strong className="font-semibold text-fg">garbage collected</strong>.
                  Your file data is gone from memory.{' '}
                  <strong className="font-semibold text-fg">
                    Closing the tab guarantees cleanup.
                  </strong>
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Libraries */}
        <section>
          <h2 className="mb-6 text-xl font-semibold text-fg">The libraries under the hood</h2>
          <div className="space-y-4">
            {LIBRARIES.map((lib) => (
              <div key={lib.name} className="rounded-lg border border-border bg-bg-muted p-5">
                <p className="font-semibold text-fg">{lib.name}</p>
                <p className="mt-0.5 text-sm font-medium text-primary">{lib.purpose}</p>
                <p className="mt-2 text-sm">{lib.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why WASM */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-fg">Why WebAssembly, not JavaScript?</h2>
          <p>
            JavaScript is very fast for UI-level work on web pages, but it is{' '}
            <strong className="font-semibold text-fg">
              not suitable for byte-intensive tasks
            </strong>{' '}
            like video encoding, RAW image processing, etc., that have a large performance
            gap compared to native code written in languages like C, C++, or even Rust{' '}
            <strong className="font-semibold text-fg">(10–100× faster)</strong>.
          </p>
          <p className="mt-4">
            WebAssembly is a new binary instruction format that gets{' '}
            <strong className="font-semibold text-fg">
              compiled to native machine code
            </strong>{' '}
            by the browser at load time. It runs in the same sandboxed environment as
            JavaScript code, but with{' '}
            <strong className="font-semibold text-fg">near-native performance</strong>.
            The security model for WASM code is that no library can access things like the
            file system, camera, network, etc. outside of the region of memory it has been
            granted.
          </p>
          <p className="mt-4">
            The major tradeoff here is that WASM modules are large (libvips is ~3MB,
            ffmpeg.wasm is ~25MB). We{' '}
            <strong className="font-semibold text-fg">lazy-load modules</strong> in this
            context and then{' '}
            <strong className="font-semibold text-fg">aggressively cache them</strong> so
            we only pay this once for each user interaction.
          </p>
        </section>

        {/* Batch */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-fg">Batch conversion</h2>
          <p>
            In batch mode, all tools convert files in{' '}
            <strong className="font-semibold text-fg">pools of Web Workers</strong>. By
            default, there are as many Web Workers as there are CPU cores. All files of a
            tool are converted{' '}
            <strong className="font-semibold text-fg">in parallel</strong> up to the number
            of Web Workers and then put into a queue. So, a batch of 1,000 images will
            convert in a few minutes on a current laptop.
          </p>
          <p className="mt-4">
            In practice, the{' '}
            <strong className="font-semibold text-fg">RAM of your device</strong> limits
            the number of files you can batch. A 1,000-file batch of 2MB images requires
            about <strong className="font-semibold text-fg">2GB of RAM at peak</strong>.
            Modern laptops have plenty of RAM, while older phones might have problems with
            100–200 files. We then warn you when memory pressure is approaching.
          </p>
        </section>

        {/* Verify */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-fg">Verify it yourself</h2>
          <p>
            Open DevTools, switch to the{' '}
            <strong className="font-semibold text-fg">Network tab</strong>, and filter for{' '}
            <strong className="font-semibold text-fg">XHR/Fetch</strong> requests. Execute
            conversion of a file, and you will see the WASM module loading once, but that's
            all.{' '}
            <strong className="font-semibold text-fg">
              There are no POST requests, no uploads, no calls to remote servers.
            </strong>
          </p>
          <p className="mt-4">
            This is <strong className="font-semibold text-fg">verifiable</strong>. The
            source is what it is.
          </p>
        </section>

      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Try a tool →
        </Link>
        <Link
          href="/about/"
          className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          About ConvertYard
        </Link>
      </div>
    </div>
  )
}
