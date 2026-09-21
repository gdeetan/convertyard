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
          <h2 className="text-2xl font-semibold text-fg">WebP vs JPG</h2>

          <p className="mt-4 text-base text-fg-muted">
            Converting WebP to JPG is a compatibility exercise, and not a
            quality upgrade. JPG was a standardized format in 1992 and can be
            opened by every application, printer, portal and CMS on this
            planet. In contrast, the newer WebP format is more efficient and
            looks better than JPG while being stored at the same file size.
            However, too many upload forms, older software packages and legacy
            applications and systems still don&rsquo;t work with WebP.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            A JPG file will look identical to the WebP file you converted, but
            it will typically be 25&ndash;35% larger than the original file at
            the same quality. Unfortunately, there is no way to make a JPG
            file look better than the original WebP file, as JPG uses less
            efficient compression.
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

          <h3 className="mt-10 text-lg font-semibold text-fg">Side-by-side</h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted list-disc pl-6">
            <li>
              JPG files will be roughly 25&ndash;35% larger than the
              equivalent sized file of the WebP that you started with.
            </li>
            <li>
              <strong className="text-fg">WebP compatibility:</strong> JPGs
              open in every app, browser, OS, printer and online form; WebP
              files often are not compatible with many content management
              systems, portals and older software.
            </li>
            <li>
              <strong className="text-fg">Transparency:</strong> WebP supports
              transparency (e.g. background is cutout), JPG does not (i.e.
              transparent pixels are set to white).
            </li>
            <li>
              <strong className="text-fg">Animation:</strong> The first frame
              of an animated WebP is copied to the JPG. WebP is an animated
              image format, JPG is a still-image format.
            </li>
            <li>
              <strong className="text-fg">Editing software:</strong> Most
              image editing software from the last 30 years or so can open JPG
              files. WebP support in some of the older image editors is
              spotty at best.
            </li>
          </ul>
        </section>
      }
    />
  )
}
