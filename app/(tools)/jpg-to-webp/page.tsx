'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { BeforeAfterCompare } from '@/components/ui/BeforeAfterCompare'
import { config } from '@/content/tools/jpg-to-webp'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <>
          <BeforeAfterCompare
            beforeSrc="/tools/jpg-to-webp/rolling-hills-before.jpg"
            beforeSrcSet="/tools/jpg-to-webp/rolling-hills-before-800.jpg 800w, /tools/jpg-to-webp/rolling-hills-before.jpg 1600w"
            beforeAlt="Original JPG landscape photo"
            beforeLabel="JPG — 24 MB"
            afterSrc="/tools/jpg-to-webp/rolling-hills-after.webp"
            afterSrcSet="/tools/jpg-to-webp/rolling-hills-after-800.webp 800w, /tools/jpg-to-webp/rolling-hills-after.webp 1600w"
            afterAlt="Same photo converted to WebP with ConvertYard"
            afterLabel="WebP — 6.1 MB"
            sizes="(max-width: 640px) 100vw, 1024px"
            width={1600}
            height={1066}
            aspectRatio="3 / 2"
            caption="Real conversion: 24 MB JPG → 6.1 MB WebP (74% smaller) at the same visual quality. Drag the slider to compare."
          />

          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-fg">
              JPG vs WebP — the simple version
            </h2>

            <p className="mt-4 text-base text-fg-muted">
              JPG is the old standard. It has been around since 1992, and almost
              every camera, phone, and website still uses it. It works, but the
              math behind it is over three decades old — it was designed for
              hardware that is nothing like what we carry in our pockets today.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              WebP is the newer format, built by Google in 2010 for the modern
              web. It uses smarter compression, so the same photo comes out
              looking the same to your eyes, but the file is much smaller. It
              also supports transparent backgrounds and short animations, which
              JPG cannot do.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              The short answer: if you are putting images on a website, WebP
              loads faster and saves bandwidth. If you are printing a photo or
              sending it to someone on an older device, JPG is still the safer
              choice.
            </p>

            <h3 className="mt-8 text-lg font-semibold text-fg">
              Side-by-side
            </h3>

            <ul className="mt-4 space-y-2 text-base text-fg-muted">
              <li>
                <strong className="text-fg">File size:</strong> WebP is usually
                25–75% smaller than JPG at the same visual quality.
              </li>
              <li>
                <strong className="text-fg">Transparency:</strong> WebP
                supports it, JPG does not.
              </li>
              <li>
                <strong className="text-fg">Animation:</strong> WebP can hold
                short animations, like a GIF. JPG cannot.
              </li>
              <li>
                <strong className="text-fg">Browser support:</strong> Every
                modern browser reads WebP. Very old browsers may not.
              </li>
              <li>
                <strong className="text-fg">Editing software:</strong> JPG
                opens in everything. WebP is supported by most modern editors,
                but not all older ones.
              </li>
            </ul>

            <h3 className="mt-8 text-lg font-semibold text-fg">
              What we saw in our own tests
            </h3>

            <p className="mt-4 text-base text-fg-muted">
              {/* TODO: fill in test results here */}
            </p>
          </section>
        </>
      }
    />
  )
}
