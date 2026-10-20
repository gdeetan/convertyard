'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/heic-to-webp'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            HEIC vs WebP — Difference&rsquo;s Explained
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            HEIC and WebP are both modern image formats designed to replace
            JPG, but they come from different worlds. HEIC is Apple&rsquo;s
            default camera format — it&rsquo;s what every iPhone has been
            saving photos as since iOS 11 (2017). WebP is Google&rsquo;s
            open web format, built for the browser. Both compress better
            than JPG, but only one of them opens cleanly outside its home
            ecosystem.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            HEIC files are typically 40–50% smaller than the same photo
            saved as JPG. The catch is support: Windows, Android, most
            CMS platforms, and almost every website on the internet
            can&rsquo;t read HEIC without extra software. WebP solves
            that. It&rsquo;s supported by every modern browser, works in
            WordPress, Shopify, and Squarespace out of the box, and is
            still 25–35% smaller than JPG at matching quality.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            If you&rsquo;re uploading iPhone photos to a website, sending
            them to someone on Windows, or publishing them anywhere
            outside the Apple ecosystem, converting HEIC to WebP is the
            path of least resistance — smaller than JPG, universally
            readable, and no quality penalty you&rsquo;ll see with the
            naked eye.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            What is HEIC?
          </h3>

          <p className="mt-4 text-base text-fg-muted">
            HEIC stands for High Efficiency Image Container. It&rsquo;s
            Apple&rsquo;s implementation of the HEIF standard, built on
            the same compression math (HEVC) that powers 4K video. Every
            iPhone from the 7 onward saves photos as HEIC by default
            because it halves the file size versus JPG while keeping the
            same visual quality.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            HEIC also stores things JPG can&rsquo;t: Live Photo motion,
            depth maps for Portrait mode, Burst sequences, and multiple
            exposures in a single file. The downside is that outside of
            Apple devices, HEIC support is spotty. Windows needs a paid
            codec, Android support varies by phone, and most websites
            reject HEIC uploads outright.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            What is WebP?
          </h3>

          <p className="mt-4 text-base text-fg-muted">
            WebP is an image format Google released in 2010 to make the
            web faster. It supports both lossy and lossless compression,
            transparency (like PNG), and short animations (like GIF) —
            all in one format, all at smaller file sizes than the
            alternatives.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Browser support is universal in 2026. Chrome, Edge, Firefox,
            Safari (since version 14, 2020), and every mobile browser
            render WebP natively. That&rsquo;s why it&rsquo;s the default
            image format for Google&rsquo;s own products and the
            recommended format for Core Web Vitals-focused sites.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert HEIC to WebP?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">Universal compatibility:</strong>{' '}
              WebP works everywhere HEIC doesn&rsquo;t — Windows, Android,
              Linux, every browser, every CMS.
            </li>
            <li>
              <strong className="text-fg">Smaller than JPG:</strong> WebP is
              25–35% smaller than JPG at matching quality, so you keep most
              of the HEIC size advantage.
            </li>
            <li>
              <strong className="text-fg">Web-ready:</strong> WordPress,
              Shopify, Squarespace, and Webflow accept WebP uploads without
              plugins. HEIC usually gets rejected.
            </li>
            <li>
              <strong className="text-fg">Faster page loads:</strong>{' '}
              Smaller images mean better LCP scores and lower bandwidth
              bills — a direct SEO and UX win.
            </li>
            <li>
              <strong className="text-fg">Transparency and animation:</strong>{' '}
              WebP supports both, so it can replace PNGs and short GIFs in
              addition to iPhone photos.
            </li>
            <li>
              <strong className="text-fg">No Apple lock-in:</strong> Once a
              photo is WebP, anyone can open it — no codec packs, no
              iCloud, no Apple device required.
            </li>
          </ul>
        </section>
      }
    />
  )
}
