'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { BeforeAfterCompare } from '@/components/ui/BeforeAfterCompare'
import { config } from '@/content/tools/webp-to-jpg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            WebP vs JPG &mdash; What actually changes
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            Converting WebP to JPG is a compatibility move, not a quality
            upgrade. JPG was standardized in 1992 and every app, printer,
            portal, and CMS on earth can open it. WebP is newer, more
            efficient, and better looking at the same file size &mdash; but
            plenty of upload forms, older software, and legacy tools still
            reject it.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The trade-off works in one direction: your JPG will be visibly
            identical to the source WebP but the file will get bigger, usually
            25&ndash;35%. That&rsquo;s the cost of using an older, less
            efficient compression algorithm. When you need a file that just
            works, it&rsquo;s worth it.
          </p>

          <div className="mt-8">
            <BeforeAfterCompare
              beforeSrc="/tools/webp-to-jpg/rolling-hills-before.webp"
              beforeAlt="Original WebP landscape photo"
              beforeLabel="WebP — 552 KB"
              afterSrc="/tools/webp-to-jpg/rolling-hills-after.jpg"
              afterSrcSet="/tools/webp-to-jpg/rolling-hills-after-800.jpg 800w, /tools/webp-to-jpg/rolling-hills-after.jpg 1600w"
              afterAlt="Same photo converted to JPG with ConvertYard"
              afterLabel="JPG — 1.3 MB"
              sizes="(max-width: 640px) 100vw, 1024px"
              width={1600}
              height={1066}
              aspectRatio="3 / 2"
              caption="Real conversion at quality 90: 552 KB WebP → 1.3 MB JPG. File size roughly doubles, but the JPG opens in every app, portal, and CMS. Drag the slider to check the visual difference."
            />
          </div>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Side-by-side
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">File size:</strong> JPG is typically
              25&ndash;35% larger than the WebP you started with at the same
              visual quality.
            </li>
            <li>
              <strong className="text-fg">Compatibility:</strong> JPG opens in
              every app, browser, OS, printer, and upload form. WebP still
              gets rejected by many CMSes, portals, and older software.
            </li>
            <li>
              <strong className="text-fg">Transparency:</strong> WebP supports
              transparent backgrounds. JPG doesn&rsquo;t &mdash; transparent
              pixels get filled with white during conversion.
            </li>
            <li>
              <strong className="text-fg">Animation:</strong> Animated WebPs
              only keep the first frame. JPG is a still-image format.
            </li>
            <li>
              <strong className="text-fg">Editing software:</strong> Every
              image editor made in the last 30 years opens JPG. WebP support
              in older editors is spotty.
            </li>
          </ul>
        </section>
      }
    />
  )
}
