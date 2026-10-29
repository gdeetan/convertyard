'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/tiff-to-png'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is a TIFF file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            TIFF (or <strong>Tagged Image File Format</strong>) is a flexible
            raster image format introduced by <strong>Aldus Corporation</strong>{' '}
            in 1986 and later acquired by Adobe Systems in 1995. It was designed
            for desktop publishing and print media, and has since become the
            industry standard for <strong>scanners, medical imaging, GIS, and
            long-term image archiving</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            There are several advantages to the TIFF format. Most notably, it
            supports <strong>lossless compression</strong>, high bit depth (up
            to 32 bits per channel), CMYK color mode, and multi-channel color
            mode. TIFF files can be saved with layers and even as multi-page
            files — a single file containing several scanned pages. In addition
            to pixel data, a TIFF can carry extensive metadata, an embedded ICC
            color profile, and even vector annotations. On the other hand, TIFF
            files are <strong>very large and poorly supported</strong>. A single
            scanned page can run 20 MB and in the worst case several hundred MB,
            and almost no browser, phone, email program, or messaging app will
            open a TIFF without special viewer software. That is why TIFFs
            usually have to be converted before they can be shared.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">What is a PNG file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            PNG (<strong>Portable Network Graphics</strong>) is a lossless file
            format for single-page images, released in 1996 as a free
            alternative to GIF on the web. It is supported by{' '}
            <strong>every browser, email client, instant messaging program, and
            image viewer</strong>, with no plugins required. Saving a
            screenshot, exporting a logo or graphic, or uploading an image to a
            website — these are all PNG workflows.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            PNG supports many of the same elements as TIFF, including{' '}
            <strong>24-bit color (16 million colors) and full alpha
            transparency</strong>. However, PNG does not carry CMYK color,
            32-bit-per-channel data, or multi-page files. In most cases the
            resulting PNG will be <strong>two to ten times smaller</strong>{' '}
            than the corresponding TIFF, open immediately on every system, and
            still contain all the information of the original scan or render.
            For web use, documentation, support requests, and everyday sharing,
            PNG is the best image file to use.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert TIFF to PNG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The short answer is <strong>compatibility</strong>. You want to
            send professional images, but you also want to send them to places
            like browser tabs, Slack threads, GitHub issues, email, WordPress
            posts, and Notion documents. TIFFs do not work in any of these
            places — they show a broken thumbnail or force the recipient to
            download and open a special viewer. PNG images work everywhere.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The second reason is <strong>file size</strong>. TIFF files
            usually contain uncompressed pixel data plus color management
            information, multiple layers, and high bit depth — most of which
            is useless on screens. When converting TIFF to PNG, all this
            overhead is stripped <strong>without any loss of information or
            visible artifacts</strong>. A 180 MB TIFF archive can be reduced
            to a 15 MB PNG that displays perfectly on any monitor.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            You should convert TIFF to PNG when you need to:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Share scanned documents, receipts, or forms</strong> with
              people who do not have a TIFF viewer like Photoshop.
            </li>
            <li>
              <strong>Embed images on a website or in documentation</strong>{' '}
              where browsers need to render them natively.
            </li>
            <li>
              <strong>Share graphics on Slack, Discord, GitHub, or email</strong>{' '}
              without requiring the recipient to download an opaque file.
            </li>
            <li>
              <strong>Preserve transparency</strong> in logos, icons, and
              cutouts when moving them from a print workflow to web use.
            </li>
            <li>
              <strong>Reduce file size</strong> without any loss of image
              quality.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I keep the TIFF?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            PNG is better than TIFF for sharing your work online, but for
            actual production and long-term archival, it is still better to
            keep the original TIFFs rather than discard them for PNGs.
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Print production.</strong> CMYK color, spot channels, and
              ICC profiles for specific presses will all be lost when
              converting to PNG. PNG is sRGB only and will not survive a trip
              to a professional printer. For print workflows, keep the TIFF or
              convert to{' '}
              <Link href="/tiff-to-pdf/" className="text-primary underline">
                TIFF to PDF
              </Link>{' '}
              instead.
            </li>
            <li>
              <strong>High bit depth images.</strong> PNG tops out at 16 bits
              per channel, while TIFF supports up to 32 bits per channel. Many
              medical images are stored as 32-bit TIFFs. If you have images
              like these, keep the originals.
            </li>
            <li>
              <strong>Multi-page documents.</strong> A multi-page TIFF — a
              scanned contract, medical slides, or a map series — will be split
              into individual PNG files. In such cases keep the original TIFF,
              since the page order and single-file structure may matter.
            </li>
            <li>
              <strong>Layers and annotations.</strong> A TIFF can store layers
              and vector annotations. In PNG, all layers are flattened into a
              single raster.
            </li>
            <li>
              <strong>Long-term archive copies.</strong> TIFF is the format of
              choice for libraries, museums, and government institutions.
              Master copies should always be kept in TIFF format; derivative
              copies can be created in PNG as needed.
            </li>
          </ul>

          <p className="mt-6 text-base text-fg-muted">
            <strong>PNG for everyone else. TIFF for the archive.</strong>{' '}
            Convert to PNG for distribution and keep the original TIFF for
            reprinting, re-editing, or re-exporting. If you need a smaller web
            format than PNG, try{' '}
            <Link href="/tiff-to-webp/" className="text-primary underline">
              TIFF to WebP
            </Link>
            {' '}or{' '}
            <Link href="/tiff-to-jpg/" className="text-primary underline">
              TIFF to JPG
            </Link>
            . Going the other direction? Use{' '}
            <Link href="/png-to-tiff/" className="text-primary underline">
              PNG to TIFF
            </Link>
            .
          </p>
        </section>
      }
    />
  )
}
