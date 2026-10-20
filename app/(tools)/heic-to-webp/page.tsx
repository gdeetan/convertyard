'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/heic-to-webp'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            HEIC vs WebP — Differences Explained
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The two formats for replacing JPG are from different worlds.{' '}
            <Link href="/blog/what-is-heic" className="text-primary underline">
              HEIC
            </Link>{' '}
            is Apple&rsquo;s format for storing photos taken with the camera
            of an iPhone (since <strong className="text-fg">iOS 11</strong>,
            which was released in 2017), and WebP is Google&rsquo;s open web
            format for the browser. Both compress images much better than
            JPG, but only one opens without problems across different web
            platforms, while the other works only within the ecosystem it
            was created for.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Compressed HEIC images are{' '}
            <strong className="text-fg">30-50% smaller</strong> than similar
            images saved as JPG files. However, support for HEIC images is
            usually limited to Apple devices; Windows servers, CMS systems,
            and websites can all struggle to open HEIC images without
            additional software. In contrast, WebP images are supported by{' '}
            <strong className="text-fg">all modern web browsers</strong>,
            work &ldquo;out of the box&rdquo; in WordPress, Shopify, and
            Squarespace sites, and are{' '}
            <strong className="text-fg">35-60% smaller</strong> than
            comparable JPG images at the same image quality and dimensions.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            If you&rsquo;re uploading iPhone photos to a website, sending
            HEIC images to someone running Windows, or switching between
            Apple and non-Apple platforms, then converting to WebP is the
            best way to go &ndash; it&rsquo;s smaller than JPG, has better
            compatibility, and has{' '}
            <strong className="text-fg">minimal visual quality loss</strong>.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">What is HEIC?</h3>

          <p className="mt-4 text-base text-fg-muted">
            HEIC stands for{' '}
            <strong className="text-fg">High Efficiency Image Container</strong>.
            Apple&rsquo;s implementation of HEIF (the HEIF standard) is
            HEIC, and it&rsquo;s compressed using the same math that Apple
            uses to compress 4K video into HEVC containers. So, every
            iPhone from the{' '}
            <strong className="text-fg">iPhone 7 onward</strong> captures
            photos in HEIC by default. They&rsquo;re around half the size
            of JPGs and look fantastic.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            HEIC saves everything JPG can&rsquo;t, like motion in a Live
            Photo (basically a very short animation), the depth data in a
            Portrait photo, a burst mode, or even several exposure shots of
            a single scene in one container. But outside of Apple devices,
            HEIC support is often restricted to third-party Windows codecs
            or only partially implemented on Android devices. If you
            specifically need the Windows-friendly route, use the{' '}
            <Link href="/heic-to-jpg" className="text-primary underline">
              HEIC to JPG converter
            </Link>{' '}
            instead. Most web forms even today don&rsquo;t support HEIC
            files.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">What is WebP?</h3>

          <p className="mt-4 text-base text-fg-muted">
            WebP is an image format released by{' '}
            <strong className="text-fg">Google in 2010</strong> to help make
            the web faster. It supports all kinds of compression (including
            lossless), transparency (like PNG), and short animated movies
            (like GIF). The result is extremely small images (compared to
            JPG). If you&rsquo;re weighing WebP against newer formats, this{' '}
            <Link
              href="/blog/avif-vs-webp-vs-jpeg-2026"
              className="text-primary underline"
            >
              AVIF vs WebP vs JPEG comparison
            </Link>{' '}
            breaks down where each one wins.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            All major browsers, including{' '}
            <strong className="text-fg">Chrome, Edge, Firefox</strong>, and
            mobile browsers, have been able to natively render WebP images
            since 2016. It&rsquo;s the default image format used by Google
            in its own products and is highly recommended for use in all
            images on websites optimized for{' '}
            <strong className="text-fg">Core Web Vitals</strong>.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert HEIC to WebP?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">Universal compatibility:</strong>{' '}
              WebP works on every platform HEIC doesn&rsquo;t, including
              Windows, Android, and Linux, as well as all browsers and
              CMSs.
            </li>
            <li>
              <strong className="text-fg">Smaller than JPG:</strong> WebP
              saves between <strong className="text-fg">25% and 35%</strong>{' '}
              compared to JPG when compressed to the same quality as HEIC
              &mdash; the same tradeoff you&rsquo;d get going from{' '}
              <Link href="/jpg-to-webp" className="text-primary underline">
                JPG to WebP
              </Link>{' '}
              directly.
            </li>
            <li>
              <strong className="text-fg">Web-ready:</strong> WordPress,
              Shopify, Squarespace, and Webflow will work with WebP images
              uploaded directly to the CMS without requiring a plugin to
              open HEIC images.
            </li>
            <li>
              <strong className="text-fg">Faster page loads:</strong> Images
              load faster online, leading to improved LCP scores, reduced
              bandwidth usage, and therefore better SEO and user
              experience &mdash; especially when you&rsquo;re{' '}
              <Link
                href="/blog/batch-convert-images"
                className="text-primary underline"
              >
                batch-converting hundreds of photos
              </Link>{' '}
              at once.
            </li>
            <li>
              <strong className="text-fg">Transparency and animation:</strong>{' '}
              In addition to HEIC images of your iPhone photos, WebP also
              supports PNG transparency and short GIF animations, which you
              can replace with WebP images as well. If you need lossless
              transparency specifically, try the{' '}
              <Link href="/heic-to-png" className="text-primary underline">
                HEIC to PNG converter
              </Link>
              .
            </li>
            <li>
              <strong className="text-fg">No Apple lock-in:</strong> Photos
              in WebP can be opened by anyone, just like any other photo
              &mdash; no need for codec packs, or to have been stored in
              iCloud or uploaded from an Apple device. For an even smaller
              next-gen option, see the{' '}
              <Link href="/heic-to-avif" className="text-primary underline">
                HEIC to AVIF converter
              </Link>
              .
            </li>
          </ul>
        </section>
      }
    />
  )
}
