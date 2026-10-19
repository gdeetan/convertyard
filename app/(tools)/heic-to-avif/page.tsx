'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/heic-to-avif'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            HEIC vs AVIF — Differences Explained
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            As Apple&rsquo;s default image file type on iPhone since{' '}
            <strong className="text-fg">iOS 11 (2017)</strong>,{' '}
            <strong className="text-fg">HEIC</strong> stands for{' '}
            <strong className="text-fg">High Efficiency Image Container</strong>.
            HEIC images are stored as{' '}
            <strong className="text-fg">HEVC (H.265) video files</strong> and
            therefore enjoy the same high image quality at reduced file size
            compared to JPEG (<strong className="text-fg">around 30 to 50%</strong>,
            based on tests). Image quality is preserved at half the file size,
            and even 16-bit images, transparent images,{' '}
            <strong className="text-fg">Live Photos</strong>, and burst images
            can be stored in a single HEIC file. We are storing those iPhone
            images online and therefore look at the HEIC file type below.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            These images are also{' '}
            <strong className="text-fg">
              restricted to the Apple ecosystem
            </strong>{' '}
            and are patent-licensed through{' '}
            <strong className="text-fg">MPEG-LA</strong>, which hinders most
            non-Apple software, including web browsers (outside of Apple
            Safari), Android-powered devices, older versions of Windows, and
            applications used for editing images, as well as content
            management systems that enable the uploading of web content.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            <strong className="text-fg">AVIF (AV1 Image File Format)</strong>{' '}
            is an image file format developed by the{' '}
            <strong className="text-fg">Alliance for Open Media</strong> in
            2019 (backed by large companies like Google and Amazon as a
            non-profit). The format is based on the{' '}
            <strong className="text-fg">royalty-free video codec AV1</strong>,
            which is already used by a lot of large media companies like
            Netflix, YouTube, and Twitch. For still images, AVIF uses the
            intra-frame compression of AV1 to create files that are{' '}
            <strong className="text-fg">up to 20-30% smaller</strong> than
            equivalent HEIC files at the same quality. The format supports
            all features of HEIC, like{' '}
            <strong className="text-fg">transparency, HDR, wide gamut color</strong>,
            and 10/12 bit depth. Importantly for many web developers, it is
            now supported by{' '}
            <strong className="text-fg">all major browsers</strong> including
            Chrome, Edge, Firefox, Safari (16.4+) and Opera &ndash; covering
            more than 90% of all web usage.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            To share the photos you take with your iPhone,{' '}
            <Link
              href="/heic-to-avif"
              className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
            >
              convert them to AVIF
            </Link>
            . They&rsquo;ll have the same quality as your HEIC photos and be
            of similar size. But you can freely distribute them online, and
            anyone with a web browser can open them. They&rsquo;ll work in
            your WordPress, Ghost, or Shopify site; they&rsquo;ll be even
            faster to download than a JPG that your site would convert to
            for you.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            HEIC remains the best choice for storing your iPhone&rsquo;s
            photos within Apple&rsquo;s own ecosystem of apps, including
            iWorks apps like iPhoto and iMovie, as well as in iCloud,
            iMessage, and your Photos app.{' '}
            <strong className="text-fg">
              AVIF is best for when you actually share the images
            </strong>
            , however.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert HEIC to AVIF?
          </h3>

          <p className="mt-4 text-base text-fg-muted">
            The biggest reason is{' '}
            <strong className="text-fg">compatibility</strong>. HEIC will not
            work outside Apple&rsquo;s ecosystem, especially if you plan to
            upload your iPhone photographs on a website. AVIF has better
            browser support and offers better compression, so it loads faster
            than HEIC.
          </p>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">Universal browser support:</strong>{' '}
              AVIF works in Chrome, Edge, Firefox, Safari 16.4+ and Opera.
              HEIC images, on the other hand, only work in Apple applications
              and need to be converted to JPEG (or other formats) &mdash; for
              example with our{' '}
              <Link
                href="/heic-to-jpg"
                className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
              >
                HEIC to JPG converter
              </Link>{' '}
              &mdash; in order to work on websites, blogs, etc.
            </li>
            <li>
              <strong className="text-fg">Smaller files than HEIC:</strong>{' '}
              Typically 20-30% smaller than HEIC images of similar perceived
              quality, which means{' '}
              <strong className="text-fg">faster page loads</strong>, less
              bandwidth, better Core Web Vitals, and lower costs for your
              CDN.
            </li>
            <li>
              <strong className="text-fg">
                Non-Apple users are just fine:
              </strong>{' '}
              Unlike HEIC, AVIF images will open up on Android phones and
              Windows (or Linux) laptops as well as within image editors
              &mdash; all without forcing a file re-save as JPG.
            </li>
            <li>
              <strong className="text-fg">
                CMS and upload compatibility:
              </strong>{' '}
              AVIF is encoded not only in all browsers but is also supported
              by most CMS and upload services like WordPress, Ghost, Shopify,
              Webflow, and Squarespace. HEIC, on the other hand, is supported
              only by WordPress and needs to be converted first (which would
              then encode it into a suboptimal-quality JPG). If you still
              need JPG for a legacy CMS, use our{' '}
              <Link
                href="/heic-to-jpg"
                className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
              >
                HEIC to JPG tool
              </Link>
              .
            </li>
            <li>
              <strong className="text-fg">
                Royalty-free &amp; future-proof:
              </strong>{' '}
              AVIF is built on the open-source video codec library{' '}
              <strong className="text-fg">AV1</strong>, backed by Google,
              Netflix, Amazon, Microsoft, Apple, Mozilla, and many more;
              HEIC is licensed by MPEG-LA, so many platforms refuse to
              support it for now.
            </li>
            <li>
              <strong className="text-fg">Preserves advantages of HEIC:</strong>{' '}
              Like HEIC, AVIF maintains support for transparent, HDR, wide
              color gamut images as well as images with 10/12-bit depth. If
              you want AVIF-level compression on existing JPG assets, try our{' '}
              <Link
                href="/jpg-to-avif"
                className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
              >
                JPG to AVIF converter
              </Link>{' '}
              as well.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            When should I keep HEIC?
          </h3>

          <p className="mt-4 text-base text-fg-muted">
            If you&rsquo;re not sharing or uploading photos to a website or a
            non-iOS user, then{' '}
            <strong className="text-fg">keep the HEIC format</strong>{' '}
            (there&rsquo;s no need to convert to AVIF).
          </p>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">Staying inside Apple:</strong> If
              the photo is stored in iCloud Photos, sent in Messages, shared
              by AirDrop, or even just remains within the Photos app on your
              iPhone or Mac (and will never leave Apple&rsquo;s ecosystem),
              then HEIC is the optimal format, and there is no conversion
              cost as HEIC is rendered natively by iOS and macOS alike.
            </li>
            <li>
              <strong className="text-fg">
                Live Photos and burst sequences:
              </strong>{' '}
              HEIC supports the storing of multiple frames (including the
              short video sequence behind a Live Photo) in a single file.
              AVIF is a still image format, and by converting HEIC photos to
              AVIF,{' '}
              <strong className="text-fg">
                the Live Photos and burst sequences will be flattened to
                single frames
              </strong>
              .
            </li>
            <li>
              <strong className="text-fg">
                Editing a photo on an iPhone or Mac:
              </strong>{' '}
              As with capturing images, the majority of editing tasks
              involving photos on an iPhone or Mac can be completed using
              Photos and a variety of other apps, including Pixelmator,
              Affinity Photo, and Final Cut, to name a few. As long as the
              images are opened in these applications on an iPhone or Mac,
              the need to convert HEIC images to AVIF prior to editing is
              unnecessary, and images should be converted at export time
              instead.
            </li>
            <li>
              <strong className="text-fg">Printing:</strong> Print labs and
              other photo services such as photo-book makers usually expect{' '}
              <strong className="text-fg">JPG or TIFF</strong> files and not
              AVIF files. For print, use our{' '}
              <Link
                href="/heic-to-jpg"
                className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
              >
                HEIC to JPG converter
              </Link>{' '}
              instead.
            </li>
            <li>
              <strong className="text-fg">Archiving originals:</strong> The
              HEIC file as captured by your camera is your original.{' '}
              <strong className="text-fg">
                Any lossy encoding (even AVIF) of this file will result in
                you losing some information
              </strong>
              , and you can never get it back. Make copies to work with and
              then encode those.
            </li>
          </ul>

          <p className="mt-6 text-base text-fg-muted">
            So, the rule of thumb for now is to{' '}
            <strong className="text-fg">
              convert photos that you intend to send to the web or to share
              outside of the Apple Ecosystem to AVIF
            </strong>
            . If not, there&rsquo;s no need to convert. Need a different
            output? Try our{' '}
            <Link
              href="/heic-to-webp"
              className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
            >
              HEIC to WebP
            </Link>
            ,{' '}
            <Link
              href="/heic-to-png"
              className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
            >
              HEIC to PNG
            </Link>
            , or{' '}
            <Link
              href="/heic-to-jpg"
              className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
            >
              HEIC to JPG
            </Link>{' '}
            tools.
          </p>
        </section>
      }
    />
  )
}
