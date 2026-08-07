import type { Metadata } from 'next'
import { CaptionTool } from '@/components/caption-tool/CaptionTool'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { meta, faq, relatedTools } from '@/content/tools/add-captions-to-video'

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
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
          Local-first caption tool. Built for creators.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
        <CaptionTool />
      </div>

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
