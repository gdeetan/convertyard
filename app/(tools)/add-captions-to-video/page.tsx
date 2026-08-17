import type { Metadata } from 'next'
import { CaptionTool } from '@/components/caption-tool/CaptionTool'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { meta, faq, relatedTools } from '@/content/tools/add-captions-to-video'

export const metadata: Metadata = {
  title: { absolute: meta.title },
  description: meta.description,
  alternates: { canonical: 'https://convertyard.com/add-captions-to-video/' },
  openGraph: { title: meta.title, description: meta.description },
}

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Video & Audio', href: '/video-audio' },
          { label: 'Add Captions to Video' },
        ]} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Add Captions to Video
        </h1>
        <p className="mt-2 text-base text-fg-muted">
          Drop a video, choose a language and quality (or import an SRT/VTT), fix any mistakes, pick a style, then download burned-in captions or a subtitle file.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
        <CaptionTool />
      </div>

      <section className="mt-12" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">How it works</h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
          {[
            {
              n: '1',
              label: 'Drop your video',
              desc: 'MP4, MOV, WebM, AVI, or MKV. The file stays on your device — nothing is uploaded.',
            },
            {
              n: '2',
              label: 'Transcribe or import',
              desc: 'Pick a language and quality, then Whisper runs locally — or import an SRT/VTT and skip transcription. First Balanced run downloads ~74 MB, cached after that.',
            },
            {
              n: '3',
              label: 'Edit, style, and preview',
              desc: 'Fix any transcript mistakes, pick a style (One Word, Outline, Bar, Classic, Follow), choose a font, set colors and position. The video previews your changes live.',
            },
            {
              n: '4',
              label: 'Burn and download',
              desc: 'Burn captions into the picture, or mux a soft subtitle track without re-encoding. Download the finished MP4. Files never leave your browser.',
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{step.label}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={faq} />
        </section>
      )}

      {relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={relatedTools} />
        </section>
      )}
    </div>
  )
}
