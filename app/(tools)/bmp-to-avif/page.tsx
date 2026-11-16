'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/bmp-to-avif'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is BMP?</h2>

          <p className="mt-4 text-base text-fg-muted">
            BMP (or <strong>Bitmap Image File</strong>) format was{' '}
            <strong>introduced by Microsoft for Windows in 1986</strong>. BMP
            files are <strong>simple to read</strong>, as they are stored as a{' '}
            <strong>grid of pixels with very little compression</strong>.
            Therefore, <strong>BMP files are large</strong>. For many years,
            BMP was the <strong>default image file</strong> for images to be
            passed from program to program within Windows.{' '}
            <strong>Paint, early screenshot utilities, and icon editors</strong>{' '}
            all used BMP natively.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            BMP is essentially a <strong>raw pixel data stream with a small
            header on top</strong>. BMP images can be created in{' '}
            <strong>1-bit, 8-bit, 24-bit, or 32-bit color modes</strong>. The
            latest versions of the file format even include an{' '}
            <strong>alpha channel for transparency</strong>. BMP images can be{' '}
            <strong>uncompressed or use optional compression</strong>. However,{' '}
            <strong>almost all BMP images are sent as uncompressed files</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            BMP is still used by <strong>old Windows programs, industrial
            scanners, in the medical field, and in very old business
            applications</strong>. On the web, browsers can open BMP files, but
            they are <strong>rarely served</strong> because they are very large
            and <strong>better options are available</strong>, such as{' '}
            <Link href="/bmp-to-png/" className="text-primary underline">
              PNG
            </Link>
            .
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">What is AVIF?</h2>

          <p className="mt-4 text-base text-fg-muted">
            AVIF, or <strong>AV1 Image File Format</strong>, is a{' '}
            <strong>relatively new image file format introduced in 2019</strong>.
            AVIF was created by the <strong>Alliance for Open Media</strong>,
            which includes companies like{' '}
            <strong>Google, Mozilla, Netflix, Apple, Microsoft, and Amazon</strong>.
            It is based on the same video codec used by <strong>AV1</strong>,
            which powers <strong>high-quality videos on YouTube and Netflix</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            AVIF uses <strong>advanced compression</strong> to create files
            that are <strong>50-80% smaller than JPEG</strong> while preserving
            the same level of image quality. This new image format can
            effectively render <strong>flat colors, gradients, and fine
            details</strong>, and it supports a <strong>full alpha channel,
            HDR, wide color gamut, 12-bit depth, and animation</strong>. AVIF
            is <strong>supported by all major browsers since 2024</strong>{' '}
            (Chrome, Firefox, Safari, Edge).
          </p>

          <p className="mt-4 text-base text-fg-muted">
            AVIF is a <strong>modern, royalty-free image format specifically
            designed for the web</strong>. AVIF is <strong>quickly becoming
            the image format of choice for fast websites</strong>. If you have
            images in other formats, you can also convert them with{' '}
            <Link href="/jpg-to-avif/" className="text-primary underline">
              JPG to AVIF
            </Link>
            .
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert BMP to AVIF?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Smaller file size:</strong> A{' '}
              <strong>24-bit 1920×1080 BMP file is around 6MB</strong> in size,
              whereas the <strong>same AVIF image is typically less than
              200KB</strong> in size. For <strong>online distribution</strong>,
              this difference is <strong>enormous</strong>.
            </li>
            <li>
              <strong>Better for the web:</strong> BMPs can be opened by
              browsers, but for use with{' '}
              <strong>CDNs, image optimizers, and content management
              systems</strong>, modern formats like <strong>AVIF are far
              better</strong> for users.
            </li>
            <li>
              <strong>Transparency support:</strong> The{' '}
              <strong>transparent alpha channel in AVIF is cleaner and has
              better support</strong> than the transparent alpha channel in
              BMP. This makes AVIF better for things like{' '}
              <strong>logos, product shots, and other overlays</strong> that
              have transparency in them.
            </li>
            <li>
              The <strong>quality level can be set when converting to
              AVIF</strong>, thus one can <strong>trade off between size and
              quality</strong>. BMP is always uncompressed, so{' '}
              <strong>you can&rsquo;t control quality</strong>. If you need to
              shrink an image further, try{' '}
              <Link href="/compress-image/" className="text-primary underline">
                Compress Image
              </Link>
              .
            </li>
            <li>
              <strong>Future-proof:</strong> AVIF is{' '}
              <strong>under active development by several of the web&rsquo;s
              biggest names</strong>. Unlike BMP, which{' '}
              <strong>hasn&rsquo;t significantly changed in decades</strong>,
              AVIF is <strong>designed for lightweight image encoding</strong>.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I keep the BMP?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Legacy software:</strong> The <strong>older Windows
              software, industrial software</strong>, etc., that{' '}
              <strong>reads BMP directly</strong> is to be worked with as part
              of the workflow.
            </li>
            <li>
              <strong>You want uncompressed pixels for editing:</strong> As
              stated above, BMP stores <strong>all the pixels of the image
              exactly as they have been captured</strong>, so this makes it a
              very good <strong>interim file for transfer to and from
              packages</strong> that you are using for image editing.{' '}
              <strong>PNG or TIFF files</strong> would also be suitable for
              this, though — if a PNG works better, convert via{' '}
              <Link href="/bmp-to-png/" className="text-primary underline">
                BMP to PNG
              </Link>
              .
            </li>
            <li>
              <strong>You&rsquo;re archiving the raw output from your scanner
              or camera:</strong> <strong>No decoder artifacts, no loss of
              generations</strong>, just what you shot or scanned, stored
              safely.
            </li>
            <li>
              <strong>You need maximum compatibility with old systems.</strong>{' '}
              A lot of <strong>old software will work just fine with BMP
              files</strong>, whereas more recent formats might cause problems
              with <strong>very old operating systems or even old hardware</strong>.
            </li>
          </ul>
        </section>
      }
    />
  )
}
