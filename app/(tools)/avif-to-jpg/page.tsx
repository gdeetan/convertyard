'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/avif-to-jpg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is an AVIF file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            The AVIF (or AV1 Image File) format is one of the newer image
            formats released. This format was developed in 2019 by a group of
            tech companies called the Alliance for Open Media (so think
            companies like Google, Apple, Netflix, Amazon, etc.)
          </p>

          <p className="mt-4 text-base text-fg-muted">
            It was built for one reason: to encode photos more efficiently
            than legacy formats like JPG, delivering photos that look as good
            as a JPG while being 50 to 90% smaller. It&rsquo;s more versatile,
            as it supports full alpha transparency, HDR, a wider color gamut,
            and even short animations (like GIF) in a single modern format.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            AVIF is best for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>High-quality photographs encoded in a much smaller file size</li>
            <li>
              Graphic images (like logos or icons) that need a transparent
              background
            </li>
            <li>
              Images that support more colors for newer screens (this supports
              HDR)
            </li>
            <li>Short animations (like an animated GIF, but much smaller)</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            AVIF isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Older browsers used on{' '}
              <Link
                href="/blog/avif-browser-support"
                className="text-primary underline"
              >
                older computers, phones, or laptops
              </Link>
            </li>
            <li>
              Workflows that require users to save files quickly (since AVIF
              will take longer to encode)
            </li>
            <li>
              Sending photos to email or print shops or using software that
              doesn&rsquo;t support the AVIF format
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is a JPG file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The JPG format is one of the oldest and most recognizable image
            formats used since it has near-universal compatibility. It was
            developed in 1992 by the Joint Photographic Experts Group (aka
            JPEG), and today nearly every smartphone, camera, software, CMS,
            email client, operating system, and print lab accepts it without
            any special software needed.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, this isn&rsquo;t the most efficient format since it uses{' '}
            <Link
              href="/blog/lossless-vs-lossy"
              className="text-primary underline"
            >
              lossy compression
            </Link>{' '}
            that throws away tiny image details that your eyes won&rsquo;t
            notice. But the universal compatibility is why it hasn&rsquo;t
            become obsolete. Open any image editor, browser, CMS, or any tool;
            chances are it accepts JPG.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG is best for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Photographs of people, landscapes, or products</li>
            <li>
              Photos you want to send via email, messenger, or upload to social
              media
            </li>
            <li>
              Handing off design work to platforms, clients, or print shops
              that don&rsquo;t support newer formats
            </li>
            <li>Any workflow where compatibility matters more than file size</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Any graphic that requires sharp lines, like screenshots, logos,
              or icons
            </li>
            <li>Any image that requires a transparent background</li>
            <li>Screenshots that display a lot of text</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why convert an AVIF to a JPG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The main reason to convert AVIF to JPG is compatibility. AVIF was
            created as a web-delivery format, meaning it&rsquo;s meant to be
            used on a website. Unfortunately, outside of displaying images in
            a web browser, the cracks show up. AVIF may not be compatible with
            your client&rsquo;s CMS software. The print shop you sent the
            image to may not accept AVIF for printing brochures without an
            extension. That email attachment may show up as a broken thumbnail
            on someone&rsquo;s old phone.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Converting to JPG trades a bit of file size for a format that
            works everywhere.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            You&rsquo;ll want to convert AVIF to JPG when:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Uploading to a CMS, marketplace, or client portal that rejects
              AVIF
            </li>
            <li>Sending photos to a print lab or photo book service</li>
            <li>
              Attaching images in an email, especially for recipients on older
              devices
            </li>
            <li>Importing into older design, office, or editing software</li>
            <li>Sharing with anyone who uses a legacy browser or OS</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            You wouldn&rsquo;t want to convert AVIF to JPG when:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>You&rsquo;re uploading photos to a website</li>
            <li>
              You&rsquo;re archiving originals — don&rsquo;t re-compress a
              lossy source into another lossy format
            </li>
            <li>You need transparency or HDR — JPG strips both</li>
          </ul>
        </section>
      }
    />
  )
}
