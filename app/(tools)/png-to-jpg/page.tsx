'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-jpg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is a PNG file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            A PNG (or Portable Network Graphics) format was introduced in 1996
            as a free replacement for the GIF format when they tried asking for
            royalties from software developers for using their encoder. Unlike
            JPG, PNG uses <strong>lossless compression</strong>, meaning it
            compresses files without degrading pixel data, so re-saving PNG
            files causes no quality loss. Therefore, you can open, edit, and
            re-save PNG files a hundred times and still have the same quality
            at the hundredth save.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            PNG&rsquo;s lossless nature makes it ideal for images with sharp
            lines, such as <strong>logos, screenshots, UI mockups, and anything
            that requires a lot of text, line art, or diagrams</strong>. Another
            benefit of PNG is that it supports transparent backgrounds, so you
            can save a logo without any background, and it will sit above any
            background color without an ugly box around it.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, that lossless nature is its biggest flaw. PNG files can be{' '}
            <strong>three to five times larger than an equivalent JPG
            file</strong>, which isn&rsquo;t ideal if you&rsquo;re publishing a
            photo on a website. Since it is lossless, PNG files retain the pixel
            quality of a photo with each re-save, and since it doesn&rsquo;t
            discard data, the file size doesn&rsquo;t decrease. If you&rsquo;re
            saving a logo or screenshot, the size increase isn&rsquo;t as
            significant as with a detailed landscape photograph, and if you
            upload these images to a website, they can eat up storage fast.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            PNG is best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Logos, icons, and UI mockups</li>
            <li>Screenshots or software documentation with lots of text</li>
            <li>Images with a transparent background</li>
            <li>Diagrams, charts, and line art</li>
            <li>Source files you plan to edit repeatedly without quality loss</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            PNG isn&rsquo;t great for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Large photographs with lots of detail</li>
            <li>Uploading many images to a website or CMS with size limits</li>
            <li>Emailing photos to users who use old, legacy software or with slow WIFI</li>
            <li>Sharing high-resolution photos on social media or messaging apps</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is a JPG file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            JPG (or JPEG) is one of the oldest image formats and was introduced
            in 1992 by the Joint Photographic Experts Group (that&rsquo;s where
            JPEG comes from). It offers <strong>unmatched compatibility</strong>,
            and virtually every device that processes images is compatible with
            this format: smartphones, laptops, digital cameras, software &mdash;
            all will accept JPG.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            For the past three-plus decades, nearly every digital camera and
            smartphone uses JPG as its default format (except perhaps for newer
            iPhone releases in the late 2010s that use HEIC, but still support
            JPG). Aside from its universal compatibility, JPG&rsquo;s biggest
            strength is its more efficient image compression for photographs.
            When you save a JPG file, depending on the quality setting, it
            throws away pixel data, causing subtle color shifts and a slight
            loss of sharpness (more blur) to produce an image that&rsquo;s a
            fraction of the size of a PNG.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The trade-off with using JPG is its <strong>lossy
            compression</strong>. Every time you save a JPG file, lowering the
            quality discards a tiny bit of detail, and you&rsquo;ll see images
            become more pixelated. In other words, they&rsquo;ll look fuzzier
            and blurrier than the original. Another downside is that JPG files
            don&rsquo;t support transparency. If you convert a transparent PNG
            logo into JPG, the empty pixels are flattened into a solid
            background color.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG is best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Photographs with lots of color, detail, and gradient</li>
            <li>Uploading images to websites, CMSs, and websites with size limits</li>
            <li>Emailing photos, especially to users on older or legacy software</li>
            <li>Sending photos to print shops or photo studios</li>
            <li>Sharing images on social media, messaging, and group chats</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Logos, screenshots, or anything with sharp lines and text</li>
            <li>Images that need a transparent background</li>
            <li>Source files you plan to edit repeatedly</li>
            <li>Diagrams, charts, or line art</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why convert PNG to JPG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The biggest reason to convert a PNG file to JPG is <strong>file
            size</strong>. A high-resolution PNG photograph can be roughly 10
            to 30 megabytes, and the same photo in JPG format at 85 quality
            will be under 2 MB with the same visible quality. So you&rsquo;ll
            be saving up to 28 MB of storage space for every high-resolution
            photograph you upload to a website or cloud service. This is a big
            deal for maintaining websites since you&rsquo;ll also save on web
            hosting costs. Saving to JPG also helps you send these files
            through email, since most services will have a size cap.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The second reason to convert to JPG is <strong>compatibility with
            legacy software</strong>. Some older software, like email clients
            or print-shop and document-management tools, may not support PNG or
            may freeze when opening a PNG because of its size. This will be the
            case if you&rsquo;re sending high-resolution photographs where file
            sizes will balloon to over 30 MB. So saving these files as JPGs is
            the best option, since quality won&rsquo;t suffer and the
            re-encoded image is much smaller.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Remember that converting a PNG to JPG is &ldquo;One Way&rdquo; when
            it comes to transparency, meaning JPG cannot store an alpha
            channel, so transparent pixels are flattened to a solid background
            (white by default, but users can choose any color), and this
            isn&rsquo;t reversible unless you keep a separate PNG copy as
            backup. If a small file size and transparent background is a
            necessity, convert the PNG to a{' '}
            <Link href="/png-to-webp/" className="text-primary underline">
              WebP
            </Link>{' '}
            or{' '}
            <Link href="/png-to-avif/" className="text-primary underline">
              AVIF
            </Link>{' '}
            instead.
          </p>
        </section>
      }
    />
  )
}
