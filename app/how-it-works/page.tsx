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

const LIBRARIES = [
  {
    name: 'libvips',
    purpose: 'Images (JPG, WebP, AVIF, PNG, HEIC, TIFF)',
    detail:
      'A high-performance image processing library, ~5× faster than ImageMagick for most operations. Compiles to ~3MB WASM.',
  },
  {
    name: 'ffmpeg.wasm',
    purpose: 'Video and audio (MP4, MP3, GIF, WebM, WAV)',
    detail:
      'The industry-standard multimedia library, compiled to WebAssembly by the ffmpeg.wasm project. Runs inside a SharedArrayBuffer worker.',
  },
  {
    name: 'pdf-lib + mupdf-wasm',
    purpose: 'PDF creation, merging, splitting, rendering',
    detail:
      'pdf-lib handles construction and modification in pure JS; mupdf-wasm handles rendering and rasterization.',
  },
  {
    name: '@huggingface/transformers',
    purpose: 'AI tools (background removal, upscaling, alt-text)',
    detail:
      'Runs ONNX models in-browser via WebAssembly and WebGPU. Models are downloaded once, then cached locally.',
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
                <p className="font-medium text-fg">Your browser reads the file</p>
                <p className="mt-1 text-sm">
                  The browser's File API reads your file into memory as an ArrayBuffer. No network
                  request is made. The data stays in your browser tab's isolated memory.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">2</span>
              <div>
                <p className="font-medium text-fg">A WASM module processes it</p>
                <p className="mt-1 text-sm">
                  The relevant WebAssembly module (libvips for images, ffmpeg for video, etc.) is
                  loaded once and cached. On first use it downloads; after that it loads
                  instantly from your browser cache. The module runs on your CPU in a sandboxed
                  Web Worker, so it can't access anything outside the tab.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">3</span>
              <div>
                <p className="font-medium text-fg">Output is handed back to the browser</p>
                <p className="mt-1 text-sm">
                  The converted file is an ArrayBuffer in memory. The browser creates a local
                  object URL (<code>blob:</code>) and serves your download from it. Nothing is
                  sent anywhere.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">4</span>
              <div>
                <p className="font-medium text-fg">Memory is freed</p>
                <p className="mt-1 text-sm">
                  After download, the object URL is revoked and the ArrayBuffers are garbage
                  collected. Your file data is gone from memory. Closing the tab is guaranteed
                  cleanup.
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
            JavaScript is fast for web UI but slow for byte-heavy operations like video encoding
            or RAW image processing. Native code (C, C++, Rust) is 10–100× faster for these
            workloads.
          </p>
          <p className="mt-4">
            WebAssembly is a binary instruction format that browsers compile to native machine
            code at load time. It runs in the same sandboxed environment as JavaScript but at
            near-native speed. The WASM security model means a library can't access your file
            system, camera, network, or anything outside the memory it's given.
          </p>
          <p className="mt-4">
            The tradeoff: WASM modules are large (libvips is ~3MB, ffmpeg.wasm is ~25MB). We
            lazy-load them on first interaction and cache aggressively, so you only pay that
            cost once.
          </p>
        </section>

        {/* Batch */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-fg">Batch conversion</h2>
          <p>
            Every tool runs conversions in a pool of Web Workers — typically 4–8, depending on
            your device's core count. Files are processed in parallel up to the worker limit, then
            queued. A 1,000-file batch on a modern laptop finishes in minutes, not hours.
          </p>
          <p className="mt-4">
            The practical limit is your device's RAM. A 1,000-file batch of 2MB images requires
            roughly 2GB of working memory at peak. Modern laptops handle this fine; older phones
            may hit limits around 100–200 files. We surface clear warnings when memory pressure
            is detected.
          </p>
        </section>

        {/* Verify */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-fg">Verify it yourself</h2>
          <p>
            Open DevTools → Network tab → filter by "XHR/Fetch." Drop a file and run a
            conversion. You'll see the WASM module load (once), and nothing else. No POST request,
            no upload, no call home.
          </p>
          <p className="mt-4">
            This is verifiable, not a promise. The source is what it is.
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
