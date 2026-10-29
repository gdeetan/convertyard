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
            TIFF (<strong>Tagged Image File Format</strong>) is a flexible
            raster image file format developed by{' '}
            <strong>Aldus Corporation</strong> in 1986 and later sold (in 1995)
            to Adobe Systems. As a desktop publishing format, it is also
            suitable for print and is widely used for <strong>scanners, medical
            imaging, GIS, and long-term storage</strong> of all kinds of images.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            There are several advantages to the TIFF format. For one, TIFF
            images can be <strong>compressed losslessly</strong>, and they can
            be created with a high number of bits per channel (up to 32 bits
            per channel). Also, TIFF is often used to save images in{' '}
            <strong>CMYK color mode</strong>, as well as in multi-channel color
            mode. In addition to the actual pixel data in the image, TIFF files
            can also include a large amount of metadata, as well as an embedded
            ICC color profile, and even vector annotations. However, TIFF files
            are generally <strong>very large and not widely supported</strong>.
            A single scanned page can be <strong>up to 20MB</strong> in size,
            and in the worst case even a few hundred MB. In most cases,
            browsers, phones, email programs, and messaging apps don&rsquo;t
            support TIFF files without special software (or a plugin). Because
            of this, TIFF files are usually <strong>converted to other
            formats</strong> before they can be shared with others.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">What is a PNG file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            PNG (<strong>Portable Network Graphics</strong>) is a free format
            for single-page images, similar to GIF, and was introduced to the
            web in 1996. The biggest advantage of PNG is that it is supported
            by <strong>100% of all browsers, email programs, IM programs, and
            image viewers</strong> on the web today. This means that you can
            save a screenshot, export a logo or other graphic, send graphic
            mockups through email, or upload an image to a website all using
            the PNG file type.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Similar to TIFF, PNG files can contain <strong>24-bit color (16
            million colors) and even full alpha transparency</strong>. But
            unlike TIFF files, PNG files do not contain CMYK color information,
            32-bit-per-channel data, or multi-page files. The resulting PNG
            files are typically <strong>two to ten times smaller</strong> than
            their corresponding TIFF files and immediately open on any system.
            For web use, documentation, support requests, and general image
            sharing, PNG files are the best option.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert TIFF to PNG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            Two reasons to convert your TIFF images to PNG are{' '}
            <strong>compatibility and size</strong>. Most web platforms don&rsquo;t
            support TIFF files because they&rsquo;re large and require special
            software to decode. You&rsquo;ll end up seeing an{' '}
            <strong>image not found icon</strong>, and it&rsquo;s not practical
            to use this format on the web because it eats up storage space
            quickly.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Which brings me to the second reason. The <strong>file size is
            also dramatically reduced</strong> by removing all unnecessary
            information (uncompressed pixel data, color management data, all
            layers, etc.) that is not required for screen display. While a TIFF
            archive may be <strong>180 MB</strong> in size, the corresponding
            PNG files will typically only be around <strong>15 MB</strong> in
            size.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            You should convert TIFF to PNG when you need to:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Share scanned documents, receipts, or forms</strong> with
              others who do not have TIFF viewer software such as Adobe
              Photoshop.
            </li>
            <li>
              <strong>Embed images on a website or in documentation</strong>{' '}
              where the images will be rendered by the browser.
            </li>
            <li>
              <strong>Share graphics</strong> (like logos, icons, or cutouts) on
              platforms such as Slack, Discord, GitHub issues, or even email,
              without forcing recipients to download and open up a TIFF file in
              some opaque viewer.
            </li>
            <li>
              <strong>Preserve transparency</strong> in logos, icons, and
              cutouts for use in a web workflow originally created for print.
            </li>
            <li>
              <strong>Reduce file size</strong> without losing any image
              quality.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I keep the TIFF?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The PNG format is <strong>better than TIFF for sharing graphic
            images online</strong>. Only store TIFF as is if you need to save
            a copy of the original image as backup.
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Print production.</strong> All color management, such as
              CMYK color, spot channels, and ICC profiles, will be{' '}
              <strong>lost when you export to PNG</strong>. PNG only contains
              sRGB color information and will most likely get destroyed when
              sent to a professional print shop. Export to TIFF or convert to{' '}
              <Link href="/tiff-to-pdf/" className="text-primary underline">
                TIFF to PDF
              </Link>{' '}
              for print production.
            </li>
            <li>
              <strong>High bit depth images.</strong> While PNG can store up to{' '}
              <strong>16 bit/channel</strong> images, TIFF can store up to{' '}
              <strong>32 bit/channel</strong> images. Many medical images are
              saved as 32-bit TIFFs. Keep the originals of these types of
              images.
            </li>
            <li>
              <strong>Multi-page documents.</strong> A multi-page TIFF (e.g., a
              scanned contract, medical slides, a map) will be split into
              individual PNG files. In these cases, it is best to keep the
              original TIFF files, since the <strong>page order and
              single-file nature</strong> could be important.
            </li>
            <li>
              <strong>Layers and annotations.</strong> TIFF can hold{' '}
              <strong>layers and vector-based annotations</strong>. PNG will
              always flatten a TIFF with layers to a single raster image layer.
            </li>
            <li>
              <strong>Master archive files.</strong> TIFF files are the
              preferred file format for <strong>long-term archives at
              libraries, museums, and government departments and
              institutions</strong>. Derivative files can be distributed as
              required as PNG files.
            </li>
          </ul>

          <p className="mt-6 text-base text-fg-muted">
            The rule of thumb is to use <strong>PNG for distribution and TIFF
            for the archive</strong>. Convert to PNG for distribution and keep
            the original TIFF for reprinting, re-editing, or re-exporting. If
            you need a smaller web format than PNG, try{' '}
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
