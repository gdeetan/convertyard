'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/tiff-to-jpg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is a TIFF file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            TIFF (<strong>Tagged Image File Format</strong>) is a{' '}
            <strong>versatile raster image file format</strong>. Originally
            created by the <strong>Aldus Corporation in 1986</strong>, TIFF
            was <strong>sold to Adobe Systems in 1995</strong>. As a format
            originally designed for <strong>desktop publishing</strong>, TIFF
            can also be used for images that are intended for{' '}
            <strong>print</strong>. Its use extends to many fields, including{' '}
            <strong>scanners, medical images, GIS, and long-term image
            storage</strong> of all types.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Here are several advantages of the TIFF format: TIFF images can be{' '}
            <strong>compressed without losing quality</strong>. They can be
            saved with a high number of bits per channel (<strong>up to 32
            bits per channel</strong>). As opposed to other formats, TIFF
            images are often saved in <strong>CMYK color mode</strong> or in{' '}
            <strong>multi-channel color mode</strong>. The large amount of{' '}
            <strong>metadata</strong> included in the images, along with the
            embedded <strong>ICC color profile</strong> and{' '}
            <strong>vector annotations</strong>, is an additional advantage.
            However, the files are often <strong>very large and not widely
            used</strong>. A single scanned page can reach a size of{' '}
            <strong>20MB and more</strong>. In the worst case, even{' '}
            <strong>hundreds of MB</strong>. Browsers, phones, email programs,
            and messaging services usually do <strong>not support TIFF
            images</strong> without special software (plugin). That is why
            TIFF images are <strong>converted to other formats</strong>{' '}
            before they can be distributed — most commonly{' '}
            <Link href="/tiff-to-jpg/" className="text-primary underline">
              TIFF to JPG
            </Link>
            ,{' '}
            <Link href="/tiff-to-png/" className="text-primary underline">
              TIFF to PNG
            </Link>
            , or{' '}
            <Link href="/tiff-to-webp/" className="text-primary underline">
              TIFF to WebP
            </Link>
            .
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">What is a JPG file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            JPG (also known as <strong>JPEG, Joint Photographic Experts
            Group</strong>) is the <strong>most frequently used image format
            on the web</strong>. It was <strong>released in 1992</strong> and
            is supported by <strong>100% of all browsers, phones, cameras,
            email programs, and social networks</strong> currently in use.
            JPG is the <strong>default image save format</strong> for nearly
            all <strong>digital cameras</strong> and most{' '}
            <strong>smartphone models</strong>. It is therefore the default
            image format for most photographers.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Unlike TIFF, which uses <strong>lossless compression</strong>,
            JPG encodes images in a <strong>lossy format</strong>. It removes
            details of the image that the <strong>human eye can&rsquo;t
            see</strong>, so the file size is much smaller than a comparable
            TIFF image. A JPG file is typically{' '}
            <strong>10-20 times smaller</strong> than its corresponding TIFF
            file. With JPG files, you will get <strong>24-bit color (16
            million colors)</strong> and <strong>sRGB information</strong>.
            JPG files do <strong>not support transparency, multi-page
            documents, layers</strong>, or <strong>bit depth greater than 8
            bits per channel</strong>. For items such as photos, scans, and
            other information that you plan to <strong>email, post online,
            or include in a web page</strong>, the smallest and most
            compatible file would be a JPG file. (If you also want to shrink
            an existing JPG, see{' '}
            <Link href="/compress-png/" className="text-primary underline">
              Compress PNG
            </Link>
            {' '}for the equivalent lossless workflow, or convert from other
            formats via{' '}
            <Link href="/png-to-jpg/" className="text-primary underline">
              PNG to JPG
            </Link>
            {' '}and{' '}
            <Link href="/webp-to-jpg/" className="text-primary underline">
              WebP to JPG
            </Link>
            .)
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert TIFF to JPG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            Two reasons to convert your TIFF files to JPG. The first is{' '}
            <strong>file size</strong>. Most platforms these days are{' '}
            <strong>unable to display TIFF images</strong> without some
            additional software. That usually means you get to see an{' '}
            <strong>image not found icon</strong> when you try to share your
            TIFF file.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            That translates to a <strong>massive difference in file
            size</strong>. While a TIFF archive can range from{' '}
            <strong>100 MB to 180 MB</strong> or more, a JPG version of the
            same would typically range from <strong>5MB to 10MB</strong> or
            so at <strong>high quality</strong>, with{' '}
            <strong>no apparent deterioration</strong> in the images.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            You should convert TIFF to JPG when you need to:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Email scans, photos, and receipts</strong> to others who
              don&rsquo;t have TIFF viewers to open TIFF files.
            </li>
            <li>
              <strong>Upload your images to a website, blog or CMS</strong>{' '}
              that only accepts common web image formats.
            </li>
            <li>
              <strong>Share images on social media</strong> (Instagram,
              Facebook, LinkedIn, X) where <strong>TIFF files are not
              accepted</strong>.
            </li>
            <li>
              <strong>Attach large images to invoices, reports, and slide
              shows</strong> without huge file sizes.
            </li>
            <li>
              <strong>Save space on devices and cloud backups</strong> where
              maintaining high-quality TIFF files is not required.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I keep the TIFF?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            JPG is <strong>better than TIFF for putting up photos on the
            web</strong>, because JPG is smaller. But JPG is{' '}
            <strong>lossy</strong>, meaning that{' '}
            <strong>every time you save it, a little bit of the image is
            lost forever</strong>. So you would only keep TIFF versions of
            your photos if you knew you&rsquo;d <strong>never need the
            higher quality images again</strong>, and you&rsquo;d only store
            the JPG versions.
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Print production.</strong> In <strong>CMYK</strong>,
              with or without <strong>spot colors</strong>, and with an{' '}
              <strong>ICC profile</strong>, JPGs will{' '}
              <strong>lose all this information</strong>. Only{' '}
              <strong>sRGB color</strong> is stored in JPG files, and most
              professional print shops will{' '}
              <strong>reject or color-shift JPG files</strong>. Keep TIFF
              files for print purposes, or convert to{' '}
              <Link href="/tiff-to-pdf/" className="text-primary underline">
                TIFF to PDF
              </Link>
              .
            </li>
            <li>
              <strong>High bit depth images.</strong> JPG stores{' '}
              <strong>8 bits per channel</strong>. TIFF can store{' '}
              <strong>32 bits per channel or more</strong>. High bit depth
              images of <strong>medical scans, HDR photos</strong>, and even{' '}
              <strong>astrophotography</strong> should be kept in their
              original form.
            </li>
            <li>
              <strong>Multi-page documents.</strong> A multi-page TIFF (e.g.,
              a scanned contract, medical slides, a map set) will be
              converted to individual JPG files. TIFFs with multiple pages
              will be kept if <strong>page order is important</strong> and
              you need them as <strong>single files</strong>. For a merged
              PDF alternative, try{' '}
              <Link href="/tiff-to-pdf/" className="text-primary underline">
                TIFF to PDF
              </Link>
              .
            </li>
            <li>
              <strong>Transparency.</strong> A TIFF with a{' '}
              <strong>transparent background</strong> cannot be converted to
              JPG, as TIFF to JPG converts a TIFF with a transparent
              background to an <strong>RGB JPG without the
              transparency</strong>; it is better to convert{' '}
              <Link href="/tiff-to-png/" className="text-primary underline">
                TIFF to PNG
              </Link>
              {' '}or{' '}
              <Link href="/tiff-to-webp/" className="text-primary underline">
                TIFF to WebP
              </Link>
              {' '}instead.
            </li>
            <li>
              <strong>Layers and annotations.</strong> TIFF can hold{' '}
              <strong>layers as well as vector annotations</strong>, whereas
              JPG always renders these to a{' '}
              <strong>rasterized image</strong>.
            </li>
            <li>
              <strong>Master archive files.</strong> For{' '}
              <strong>long-term archiving</strong> in{' '}
              <strong>libraries, museums, and administrations</strong> in
              general, TIFF is preferred. Derivative files are{' '}
              <strong>distributed as needed in JPG</strong>.
            </li>
          </ul>

          <p className="mt-6 text-base text-fg-muted">
            In summary, <strong>distribute in JPG; keep your originals as
            TIFF</strong> files for <strong>reprinting, re-editing, or
            re-exporting</strong> as other files (e.g.,{' '}
            <Link href="/tiff-to-png/" className="text-primary underline">
              TIFF to PNG
            </Link>
            {' '}or{' '}
            <Link href="/tiff-to-webp/" className="text-primary underline">
              TIFF to WebP
            </Link>
            {' '}for <strong>transparency or lossless</strong>, or{' '}
            <Link href="/tiff-to-avif/" className="text-primary underline">
              TIFF to AVIF
            </Link>
            {' '}for the smallest modern web format). To reverse such files,
            use{' '}
            <Link href="/jpg-to-tiff/" className="text-primary underline">
              JPG to TIFF
            </Link>
            . Going from JPG to another web format? Try{' '}
            <Link href="/jpg-to-png/" className="text-primary underline">
              JPG to PNG
            </Link>
            ,{' '}
            <Link href="/jpg-to-webp/" className="text-primary underline">
              JPG to WebP
            </Link>
            ,{' '}
            <Link href="/jpg-to-avif/" className="text-primary underline">
              JPG to AVIF
            </Link>
            , or{' '}
            <Link href="/jpg-to-pdf/" className="text-primary underline">
              JPG to PDF
            </Link>
            .
          </p>
        </section>
      }
    />
  )
}
