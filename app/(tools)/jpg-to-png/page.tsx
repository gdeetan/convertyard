'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-png'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is a JPG file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            The JPG (or JPEG) format is one of the oldest and most recognizable,
            with <strong>universal compatibility across all devices and operating
            systems</strong>; whether it&rsquo;s made by Apple, Windows, Linux, or
            any manufacturer, or any software you can think of, it most likely
            supports JPG. It was developed in 1992 by the Joint Photographic
            Experts Group (yup, JPEG), and that&rsquo;s where it got its name.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            For the past 30 years or so, JPG has been the default format for
            smartphones, cameras, and nearly every device that processes images.
            I&rsquo;ve owned digital cameras from Sony and Canon, and they
            default to JPG when you export photos. Its biggest strength is its
            compatibility across almost every device you can think of.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, JPG&rsquo;s biggest downside is that it uses{' '}
            <strong>lossy compression</strong>, meaning that to keep file sizes
            from ballooning, it throws away small bits of color and detail every
            time you save it at a lower quality. You won&rsquo;t notice it in a
            high-resolution photo from a digital camera, but if you resize the
            photo or save it at an extremely low quality, you&rsquo;ll see
            pixelated areas that show up as block artifacts around sharp edges,
            text, or solid color areas. And this compounds every time you save
            the file.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG is best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Photographs with lots of color and gradients</li>
            <li>Sharing images on social media, email, or text</li>
            <li>Uploading photographs to websites</li>
            <li>Sending images to photo studios for printing</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Logos, screenshots, or anything that requires sharp lines or text</li>
            <li>Images that may need a transparent background</li>
            <li>Source files you plan to edit again and again</li>
            <li>Any image that requires high resolution for printing in a larger format</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is a PNG file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The PNG (or Portable Network Graphics) was released in 1996 as a
            free replacement for the older GIF format. Unlike JPG files, PNG
            uses <strong>lossless compression</strong>, meaning you can shrink a
            file without degrading pixel quality. So you can save these images
            repeatedly without losing any visual quality.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The lossless nature of PNG is what makes it an ideal option for
            images that require <strong>sharp edges like logos, screenshots, UI
            mockups, line art, or diagrams</strong>. Also, this format supports
            a full alpha channel, meaning you can save images with a transparent
            background, like icons or logos. PNG is one of the formats designers
            and developers prefer when they need an image that can sit above any
            background.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, PNG&rsquo;s downside is its file size. Typically, a
            comparable PNG file is around <strong>three to five times larger
            than the same JPG photo</strong> because PNG doesn&rsquo;t discard
            any data. If you&rsquo;re uploading a photograph on Instagram, that
            can be wasted bytes, but for a logo on your website, it can be an
            alternative, but newer formats like{' '}
            <Link href="/jpg-to-webp" className="text-primary underline">
              WebP
            </Link>{' '}
            and{' '}
            <Link href="/jpg-to-avif" className="text-primary underline">
              AVIF
            </Link>{' '}
            offer better compression for users who need max compression for
            transparent logos on websites.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            PNG is best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Logos, icons, and UI interface mockups</li>
            <li>Screenshots and software documentation</li>
            <li>Images that require a transparent background</li>
            <li>Diagrams, charts, and line art</li>
            <li>Any image you plan to edit repeatedly without losing quality</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            PNG isn&rsquo;t great for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Large photographs (landscape, people, etc.) where file size matters</li>
            <li>Email attachments or batch uploads over slow connections</li>
            <li>Situations where the receiver&rsquo;s device may not render transparency correctly</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why convert JPG to PNG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            You&rsquo;d want to convert a JPG to a PNG format because of two
            things: <strong>better quality or the need for a transparent
            background</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            For example, if you need to edit a JPG file, you could crop it, add
            text, or retouch it; every re-save chips away at the quality.
            Converting that JPG file to PNG <strong>locks the quality in place,
            so every edit done afterward will be lossless</strong>. If
            you&rsquo;ve saved an already edited JPG, you won&rsquo;t recover
            those lost pixels, but you won&rsquo;t lose any more either.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The second reason is transparency. JPG files don&rsquo;t support
            transparency. If you try to save it, a background will be added no
            matter what you do. If that is a requirement, PNG is one format that
            supports images with a transparent background. It&rsquo;s also a
            safer option if you&rsquo;re handing over an image to a graphic
            designer or sending images to a print shop &mdash; basically
            anything that requires a high-resolution version of the image.
          </p>
        </section>
      }
    />
  )
}
