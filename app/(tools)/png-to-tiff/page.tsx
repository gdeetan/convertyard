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
            <strong className="text-fg">PNG was built for the web.</strong>{' '}
            PNG is a web image format. It was created in 1996 as a free
            alternative to GIF and is now the best choice for any web image
            that is not a photo. It is <strong className="text-fg">lossless</strong>,
            supports <strong className="text-fg">transparency</strong>, and is
            opened by every browser and image viewer ever written. Screencaps,
            exported logos, free icons you download off the web &ndash;
            they&rsquo;re all probably PNGs.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            <strong className="text-fg">TIFF is a much older format</strong>,
            dating back to before the internet became mainstream. In fact,
            TIFF was first released in 1986, well before the internet was even
            thought of. A single image in TIFF format can be a lossless image
            (like a PNG), a <strong className="text-fg">multi-page document</strong>{' '}
            (like a PDF), <strong className="text-fg">CMYK images for printing</strong>,
            images saved with <strong className="text-fg">16- or 32-bit depth</strong>,
            images with layers, and images with alpha channels. TIFF files for
            the same image can be <strong className="text-fg">3&ndash;10 times bigger</strong>{' '}
            than the same image saved as a PNG file. And most web browsers
            cannot open TIFF files.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            So if you are putting images on a website, use PNG; for print,
            sending to a print shop, archiving, or sending to professionals
            who work with layers, use TIFF.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">Side-by-side</h3>

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
              up to 16 bits per channel. TIFF: 16 bits and 32 bits, as well as
              CMYK color spaces and others not supported by PNG.
            </li>
            <li>
              <strong className="text-fg">Multi-page:</strong> TIFF files can
              hold many pages in one file (for example, scanned documents),
              while PNG files are restricted to one image per file.
            </li>
            <li>
              <strong className="text-fg">Browser support:</strong> The PNG
              file is supported by all browsers, whereas the TIFF file is not
              supported by any major browser natively.
            </li>
            <li>
              <strong className="text-fg">Print &amp; archival:</strong> The
              standard file format for print production, museum archiving, and
              medical images is TIFF. PNG is extremely rare in these
              applications.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert to TIFF?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">You want to send files to a printer or publisher.</strong>{' '}
              Many print shops and magazines require files to be submitted in
              TIFF format for CMYK color and higher bit depth.
            </li>
            <li>
              <strong className="text-fg">You&rsquo;re archiving.</strong>{' '}
              Libraries and archives use TIFF for long-term preservation of
              images because it&rsquo;s lossless, well-documented, and has
              been around for 40 years or so.
            </li>
            <li>
              <strong className="text-fg">You are scanning documents.</strong>{' '}
              Multi-page TIFF keeps entire scanned documents in one file. If
              you need a shareable version instead, convert your{' '}
              <Link
                href="/tiff-to-pdf"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                TIFF to PDF
              </Link>
              .
            </li>
            <li>
              <strong className="text-fg">You need CMYK colors or higher bit depths than PNG offers</strong>{' '}
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
              <strong className="text-fg">Universally compatible.</strong> PNG
              is read by any phone, any editor, any chat app, etc., while
              TIFF is usually only opened with very specialized software.
            </li>
          </ul>
        </section>
      }
    />
  )
}
