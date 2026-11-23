'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-tiff'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            PNG vs TIFF &mdash; Differences Explained
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The <strong className="text-fg">PNG format</strong> is typically
            used for web images that are not photographs. A free alternative
            to the GIF image format that was introduced in 1996, PNG is a{' '}
            <strong className="text-fg">lossless web image format</strong>{' '}
            that supports <strong className="text-fg">transparent sections</strong>.
            All of the popular web browsers as well as most image editing
            programs support PNG. Of the many screenshots, logos, and icons
            that you download from the web, the majority of them are likely
            to be PNG files.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            <strong className="text-fg">TIFF is a much older format</strong>,
            dating back to before the internet was mainstream. This format
            was first released in 1986 and is very versatile. Even a single
            image can be saved as a lossless image file (like a PNG) or as a{' '}
            <strong className="text-fg">multi-page file</strong> (like a
            PDF). TIFF images can be saved as{' '}
            <strong className="text-fg">CMYK color images for printing</strong>{' '}
            purposes. Also, images can be saved with{' '}
            <strong className="text-fg">16- or 32-bit depth</strong>. TIFF
            images can be saved with layers and with an alpha channel. TIFF
            files for the same image can be{' '}
            <strong className="text-fg">3&ndash;10 times larger</strong> than
            the same image saved as a PNG file. Also, most browsers
            don&rsquo;t support the TIFF format, so you can&rsquo;t open it.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            For uploading images like logos, UI interfaces, or icons, PNG
            will be the better option, since all web browsers support it. For
            archiving, or if you need to send a photo to a print shop, or
            send a graphic to professional designers, TIFF would be the
            better option.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Side-by-Side Comparison
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">File size:</strong> A PNG file is
              normally 3&ndash;10 times smaller than the corresponding
              uncompressed TIFF file. Even after LZW compression, the
              file-size difference is still considerable.
            </li>
            <li>
              <strong className="text-fg">Transparency:</strong> Both support
              alpha transparency.
            </li>
            <li>
              <strong className="text-fg">Color depth:</strong> PNG supports
              up to 16 bits per channel. TIFF supports files with up to 16
              or even 32 bits per channel, as well as CMYK color spaces and
              many others, which are not supported by PNG.
            </li>
            <li>
              <strong className="text-fg">Multi-page:</strong> TIFF files can
              contain multiple pages within a single file (e.g., a scan of a
              book). PNG files are restricted to a single page within a file.
            </li>
            <li>
              <strong className="text-fg">Browser support:</strong> Unlike
              the PNG file, which is supported by all browsers, the TIFF
              file is not natively supported by any of the major browsers.
            </li>
            <li>
              <strong className="text-fg">Print &amp; archival:</strong> TIFF
              is the standard file format for print production, museum
              archiving as well as for medical images. PNG is rarely used
              for these applications.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert to TIFF?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">You need to send files to a printer or publisher.</strong>{' '}
              Most print shops and magazines require files to be delivered in
              TIFF format (for CMYK color) with high bit depth.
            </li>
            <li>
              <strong className="text-fg">You are archiving.</strong> TIFF
              images are used by libraries and archives for long-term image
              preservation because they are lossless, well-documented, and
              have been around for some 40 years.
            </li>
            <li>
              <strong className="text-fg">You are scanning documents.</strong>{' '}
              Multi-page TIFF keeps the whole document in one file. If you
              need a shareable version instead, convert your{' '}
              <Link
                href="/tiff-to-pdf"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                TIFF to PDF
              </Link>
              .
            </li>
            <li>
              <strong className="text-fg">You need to work with CMYK colors or higher bit depths than PNG offers</strong>{' '}
              (max. 16-bit). PNG is RGB only. With TIFF, you can achieve even
              more.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">Why keep PNG?</h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">Works on the web.</strong> PNG loads
              in all browsers, whereas TIFF does not load in any. For even
              smaller web files, convert{' '}
              <Link
                href="/png-to-webp"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                PNG to WebP
              </Link>
              .
            </li>
            <li>
              <strong className="text-fg">PNG is already lossless</strong>, so
              there is no value added by converting it to TIFF &mdash; only
              file size!
            </li>
            <li>
              <strong className="text-fg">Smaller files with the same image.</strong>{' '}
              PNG is 3&ndash;10 times smaller than TIFF for screenshots,
              logos, UI elements, and graphics. You can shrink them further
              with{' '}
              <Link
                href="/compress-png"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                Compress PNG
              </Link>
              .
            </li>
            <li>
              <strong className="text-fg">It is universally compatible.</strong>{' '}
              PNG is read by any phone, any editor, any chat app, etc.,
              while TIFF is usually only opened with very specialized
              software.
            </li>
          </ul>
        </section>
      }
    />
  )
}
