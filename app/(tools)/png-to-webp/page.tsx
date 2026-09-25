'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-webp'

const explainer = (
  <div className="space-y-8 text-base text-fg-muted">
    <section>
      <h2 className="text-2xl font-semibold text-fg">What is PNG?</h2>
      <p className="mt-4">
        PNG (or Portable Network Graphics) is a legacy image format
        created in 1995 by the PNG Development Group as a free,
        open-source replacement for GIF. People opt for this format
        when they need clear, crisp graphic images with sharp edges,
        like logos, screenshots, or icons with a transparent
        background.
      </p>
      <p className="mt-4">
        PNG is a lossless format, meaning every pixel is encoded as it
        was drawn. Nothing looks blurry, even when users zoom in. One
        downside is that PNG files are large, and using them on
        websites takes up more space, which can increase web hosting
        costs.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">What is WebP?</h2>
      <p className="mt-4">
        WebP is a relatively new format created by Google. It was
        developed to address the issues of legacy formats like PNG.
        WebP has the same properties as PNG, but is encoded more
        efficiently, resulting in a smaller footprint (or file size).
        Like PNG, it supports transparent backgrounds. Nearly every
        major browser on Windows, Mac, Android, or iOS (Chrome,
        Safari, Firefox, or Edge) supports WebP images, so this means
        that even if you swap from PNG to WebP, nearly everyone
        browsing on your website will see these images without any
        special software.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">Why convert PNG to WebP?</h2>
      <p className="mt-4">
        The only reason is file size. A WebP file, at the same
        dimensions, even at 80% quality, can be up to 90% smaller. So
        a 2 MB PNG graphic converted to WebP will shrink down to 251
        KB, or an 88% reduction. This is a significant decrease and
        helps images load faster and use up less storage space on
        your web hosting service. You can convert PNG graphics to
        WebP to free up space on your hard drive, so save backups as
        WebP in cloud storage and pay less.
      </p>
      <p className="mt-4">
        For website owners, faster-loading pages can boost user
        engagement and rankings, since visitors are more likely to
        engage with a fast-loading website. You can load graphic
        files with a transparent background, like logos, without the
        bloat.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">When should I keep PNG instead?</h2>
      <p className="mt-4">
        Use PNG if you need to send a graphic or photo to someone who
        uses old software or a phone that cannot read WebP, or if you
        need to edit the graphic, keep the original PNG file.
        Otherwise, use WebP for images you&rsquo;ll post on your
        website.
      </p>
    </section>
  </div>
)

export default function Page() {
  return <ToolShell config={config} afterHowItWorks={explainer} />
}
