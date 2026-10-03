'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-avif'

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
        costs and slow down page loads.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">What is AVIF?</h2>
      <p className="mt-4">
        AVIF (AV1 Image File Format) is a modern image format based on
        the AV1 video codec. It was built to pack high-quality images
        into much smaller files than older formats like PNG or JPG.
        AVIF supports transparent backgrounds, wide color, and HDR,
        and it&rsquo;s now supported by every major browser on
        Windows, Mac, Android, and iOS (Chrome, Safari, Firefox, and
        Edge). This means you can swap PNG for AVIF and nearly every
        visitor to your site will see the images without any special
        software.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">Why convert PNG to AVIF?</h2>
      <p className="mt-4">
        The main reason is file size. An AVIF file, at the same
        dimensions and visually identical quality, can be up to 90%
        smaller than the original PNG. So a 2 MB PNG photo converted
        to AVIF can shrink down to around 200 KB. That&rsquo;s a huge
        decrease and helps images load faster and use less storage on
        your web host. You can also convert PNG archives to AVIF to
        free up space on your hard drive or save backups in the cloud
        for less money.
      </p>
      <p className="mt-4">
        For website owners, faster-loading pages can boost user
        engagement and search rankings, since visitors are more
        likely to stick around on a fast site. AVIF also keeps your
        transparent backgrounds, so logos and UI assets stay sharp
        without the bloat.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">When should I keep PNG instead?</h2>
      <p className="mt-4">
        Use PNG if you need to send a graphic or photo to someone
        using old software or a device that cannot read AVIF, or if
        you plan to keep editing the file. Otherwise, use AVIF for
        images you&rsquo;ll post on your website or share online.
      </p>
    </section>
  </div>
)

export default function Page() {
  return <ToolShell config={config} afterHowItWorks={explainer} />
}
