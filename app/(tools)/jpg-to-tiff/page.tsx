'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-tiff'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            JPG vs TIFF &mdash; Differences Explained
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            <strong className="text-fg">JPG or JPEG</strong> is the file
            format in which most photos are stored. The Joint Photographic
            Experts Group introduced JPEG in 1992 using a{' '}
            <strong className="text-fg">lossy compression</strong> method to
            encode smaller photos that are easy to send through the Internet.
            Just about every camera, smartphone, and website supports JPEG
            files. However, every time a JPEG is opened and then saved
            again, some of the image detail will get lost. This can lead to{' '}
            <strong className="text-fg">
              rapid deterioration of an image
            </strong>{' '}
            if it is constantly opened and saved in JPEG format.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            <strong className="text-fg">TIFF (Tagged Image File Format)</strong>{' '}
            is a much older and much more versatile file format. Originally
            created in 1986 for use in desktop publishing, specifically for
            scanned images. Because TIFF images are usually stored as
            so-called <strong className="text-fg">lossless files</strong>,
            they are particularly suitable for print work in{' '}
            <strong className="text-fg">CMYK color space</strong>. In
            addition to{' '}
            <strong className="text-fg">8-bit, 16-bit, or 32-bit depth</strong>,
            TIFF images can also have several layers, including an alpha
            channel. In comparison with JPEG files of corresponding size and
            image content, TIFF files of the same image can be{' '}
            <strong className="text-fg">5&ndash;20 times as large</strong>.
            Because of their sheer size, TIFF files are not suited for the
            web, and most web browsers can&rsquo;t open them.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            If you&rsquo;re uploading a photo to a website, sending it
            through email, or storing it in your mobile device, JPG is the
            better format. If you&rsquo;re sending it to a print shop,
            archiving a high-resolution print or scan, or you&rsquo;re a
            professional editor who needs full quality or color fidelity,
            then TIFF is the better format.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Side-by-Side Comparison
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">File size:</strong> In general, a
              TIFF file is 5&ndash;20 times larger than an equivalent JPG
              file. So a 3MB JPG converted to TIFF would be roughly 40 MB.
            </li>
            <li>
              <strong className="text-fg">Compression:</strong> JPG is lossy
              (adjustable quality), whereas TIFF is typically uncompressed
              or uses lossless compression methods such as LZW or ZIP.
            </li>
            <li>
              <strong className="text-fg">Color depth:</strong> JPG: 24-bit
              (8 bits per channel). TIFF: 16-bit and 32-bit per channel
              (plus CMYK, etc., which JPG cannot handle).
            </li>
            <li>
              <strong className="text-fg">Multi-page:</strong> TIFF documents
              with multiple pages are stored in one file (e.g., scanned
              books or newspapers). A JPG file is one image.
            </li>
            <li>
              <strong className="text-fg">Browser Support:</strong> JPG is
              supported by every browser on the planet. TIFF is not natively
              supported by any of the major browsers.
            </li>
            <li>
              <strong className="text-fg">Print &amp; archival:</strong> TIFF
              is the typical file format used in all print production,
              museum archiving, as well as medical applications. JPG is only
              occasionally used due to its lossy compression.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert to TIFF?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">
                Files are sent to print shops and magazines.
              </strong>{' '}
              Here, TIFF files in CMYK color space with high bit depth are
              expected.
            </li>
            <li>
              <strong className="text-fg">You&rsquo;re archiving.</strong>{' '}
              Libraries, museums, and archives use TIFF for archiving
              purposes because it is a lossless file, fully documented, and
              has been around for 40 years now.
            </li>
            <li>
              <strong className="text-fg">Scanning documents.</strong> TIFF
              files can hold a multi-page document within one file. Need a
              shareable version? Convert your{' '}
              <Link
                href="/tiff-to-pdf"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                TIFF to PDF
              </Link>
              .
            </li>
            <li>
              <strong className="text-fg">Retain quality.</strong> Converting
              a JPG image to TIFF will not bring back any detail that has
              already been lost with a JPG&rsquo;s lossy compression.
              However, a TIFF image means any re-editing and re-saving
              won&rsquo;t further decrease image quality.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why keep JPG?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">Works everywhere.</strong> JPG is a
              standard image file that works in every browser, on every
              phone, in every email program, and in every photo editor.
              TIFF typically requires specialized software to open.
            </li>
            <li>
              <strong className="text-fg">
                File size is greatly reduced.
              </strong>{' '}
              JPG files are 5 to 20 times smaller than corresponding TIFF
              files. This allows for much faster upload times and reduced
              storage and bandwidth costs. You can shrink them further with{' '}
              <Link
                href="/compress-jpg"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                Compress JPG
              </Link>
              .
            </li>
            <li>
              Converting to TIFF does not increase image quality, as TIFF
              cannot bring back detail that has been removed by JPG
              compression. TIFF only increases file size. For modern web
              formats, try{' '}
              <Link
                href="/jpg-to-webp"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                JPG to WebP
              </Link>{' '}
              instead.
            </li>
            <li>
              <strong className="text-fg">Universal compatibility.</strong>{' '}
              JPG is compatible with just about every software and device.
              Every browser, digital camera, software, and online platform
              accepts this format without the need for special plugins. If
              you need a lossless web format instead, try{' '}
              <Link
                href="/jpg-to-png"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                JPG to PNG
              </Link>
              .
            </li>
          </ul>
        </section>
      }
    />
  )
}
