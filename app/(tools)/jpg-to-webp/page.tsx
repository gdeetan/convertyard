'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { BeforeAfterCompare } from '@/components/ui/BeforeAfterCompare'
import { config } from '@/content/tools/jpg-to-webp'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            JPG vs WebP — Difference&rsquo;s Explained
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            JPG was the gold standard for images. Ask anyone with basic website
            knowledge, and they&rsquo;ll know JPG is the default file format.
            It was created in 1992, and most cameras, including phone cameras,
            take images in JPG format. Almost every website uses JPG images
            too. So, it&rsquo;s well known and works a treat, but the math
            behind JPG was developed over 30 years ago for totally different
            hardware than what we use these days.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The WebP image format is a more modern alternative to JPG, designed
            by Google in 2010. With more efficient compression, WebP images of
            the same quality are much smaller than equivalent JPG images. WebP
            images can also be opaque or transparent, and can contain short
            animations, such as GIFs.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            If your images will be used on a website, then WebP will load
            faster and use less bandwidth. However, if you&rsquo;re printing
            images or sending them to people with older phones and cameras,
            JPG is the safer bet.
          </p>

          <div className="mt-8">
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
          </div>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Side-by-side
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">File size:</strong> WebP is 25-80%
              smaller than an equivalent JPG file.
            </li>
            <li>
              <strong className="text-fg">Transparency:</strong> WebP supports
              it; JPG does not.
            </li>
            <li>
              <strong className="text-fg">Animation support:</strong> WebP
              supports animations (short, animated pictures, like GIFs), JPG
              does not.
            </li>
            <li>
              <strong className="text-fg">Browser Support:</strong> Modern
              browsers, including even very old ones, support WebP, but not
              older browsers.
            </li>
            <li>
              <strong className="text-fg">Photo editing software:</strong> JPG
              files open in every single photo editing program available. Most
              modern photo editing software also supports WebP files but not
              all older programs.
            </li>
          </ul>
        </section>
      }
    />
  )
}
