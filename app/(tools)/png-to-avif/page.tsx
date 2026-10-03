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
        open-source replacement for GIF when Unisys initially wanted
        companies to pay royalties to use LZP (basically the algorithm
        that reads GIF files). This format is excellent for folks who
        want clear and crisp graphic images with sharp edges and clear
        lines, such as logos, UI, screenshots, or icons with a
        transparent background.
      </p>
      <p className="mt-4">
        PNG is a lossless format, meaning every pixel is encoded
        without any distortion. It won&rsquo;t look blurry when you
        zoom in, but a downside of fully lossless images is that they
        are large, and using them on websites can slow load times and
        take up more storage space, driving up web hosting costs.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">What is AVIF?</h2>
      <p className="mt-4">
        AVIF (or AV1 Image File Format) is a modern image format based
        on the AV1 video codec. It was designed as an alternative that
        delivers high-quality images without the bloat of older
        formats like PNG or JPG. Like PNG, AVIF supports transparent
        backgrounds. It also supports a wide color range and HDR, and
        is now supported by nearly every browser on Windows, Mac,
        Android, and iOS (Chrome, Safari, Firefox, and Edge). This
        means that you can convert PNG to AVIF and keep sharp image
        quality while reducing image size by over 95% (based on
        tests), and your visitors will see these images without any
        special software to read them.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">Why convert PNG to AVIF?</h2>
      <p className="mt-4">
        The primary reason is to reduce file size. An AVIF image with
        the same dimensions and image quality can be over 95% smaller
        than a PNG. For example, a 6.5 MB PNG, a high-resolution
        graphic converted to PNG, will be around 250 KB, or 96%
        smaller with the same visual quality. That alone makes this
        conversion worth it if you want to upload these images on a
        website. The reduction in size will make your website load
        faster and lower web hosting costs since AVIF files are much
        smaller. Your visitors will be happier because they
        won&rsquo;t have to wait as long for images to load, and
        search engines will reward your website with more organic
        traffic. AVIF supports transparent backgrounds, which is
        great for logos or icons.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">When should I keep PNG instead?</h2>
      <p className="mt-4">
        Retain the PNG file if you need to send the graphic or photo
        to someone who still uses old software, or if you want to
        print the graphic. Most print shops will only accept legacy
        formats like PNG, TIFF, or JPG. Another reason is if
        you&rsquo;re planning to edit the file and need a copy for
        future use. Otherwise, use AVIF for an image you&rsquo;ll
        upload on your website.
      </p>
    </section>
  </div>
)

export default function Page() {
  return <ToolShell config={config} afterHowItWorks={explainer} />
}
