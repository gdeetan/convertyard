import Link from 'next/link'

const STEPS = [
  {
    n: '1',
    title: 'Drop your files',
    body: 'Choose files to convert, up to a thousand per batch.',
  },
  {
    n: '2',
    title: 'Convert in your browser',
    body: 'Files convert in the browser using WebAssembly. Nothing is uploaded.',
  },
  {
    n: '3',
    title: 'Download',
    body: 'Download files individually, or as a single ZIP file.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="hiw-heading"
      className="py-10 sm:py-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="hiw-heading"
          className="mb-12 text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          How it works
        </h2>

        {/* Three steps */}
        <ol className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-3" role="list">
          {STEPS.map((step) => (
            <li key={step.n} className="flex flex-col">
              <span
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {step.n}
              </span>
              <h3 className="mb-1.5 text-base font-semibold text-fg">{step.title}</h3>
              <p className="text-sm leading-relaxed text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        {/* WASM explainer */}
        <div className="rounded-xl border border-border bg-bg-muted p-6 sm:p-8">
          <p className="mb-1 text-sm font-semibold text-fg">
            Wait — how does it work without uploading?
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            By using WebAssembly it’s possible to run the same C++ code as the corresponding
            desktop apps (libvips, ffmpeg and pdf-lib) in the browser. This means that all
            processing is done on your CPU, in this tab, and no files are uploaded to any server.
          </p>
          <Link
            href="/how-it-works"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            Read the full technical explanation →
          </Link>
        </div>
      </div>
    </section>
  )
}
