'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { BeforeAfterCompare } from '@/components/ui/BeforeAfterCompare'
import { config } from '@/content/tools/heic-to-jpg'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is a HEIC file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            HEIC, or{' '}
            <Link
              href="/blog/what-is-heic"
              className="text-primary underline"
            >
              High Efficiency Image Container
            </Link>
            , is an image format Apple introduced on its iPhone products in
            2017 with iOS 11. If you&rsquo;ve used an iPhone for the past 10
            years or so, chances are it is saved in this format.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Apple still supports JPG, but by default it saves all images as
            HEIC because it produces smaller file sizes than JPG. For example,
            this photo saved as an HEIC file is more than 50% smaller than
            its equivalent JPG. So if that&rsquo;s{' '}
            <Link
              href="/blog/batch-convert-images"
              className="text-primary underline"
            >
              1000 images
            </Link>
            , that adds up to 5 GB, but with an HEIC file that number goes
            down to 2.75 GB,
            or around 50% savings, so it adds up over time.
          </p>

          <div className="mt-8">
            <BeforeAfterCompare
              beforeSrc="/articles/what-is-heic/before-heic.jpg"
              beforeSrcSet="/articles/what-is-heic/before-heic-800.jpg 800w, /articles/what-is-heic/before-heic.jpg 1600w"
              beforeAlt="Original HEIC photo from iPhone, rendered for browser preview"
              beforeLabel="HEIC — 2.8 MB"
              afterSrc="/articles/what-is-heic/after-jpg.jpg"
              afterSrcSet="/articles/what-is-heic/after-jpg-800.jpg 800w, /articles/what-is-heic/after-jpg.jpg 1600w"
              afterAlt="Same photo converted from HEIC to JPG with ConvertYard"
              afterLabel="JPG — 4.5 MB"
              sizes="(max-width: 640px) 100vw, 1024px"
              width={1600}
              height={1200}
              aspectRatio="4 / 3"
              caption="Same photo — the HEIC won't open on Windows and most Android phones, the JPG does. Drag the slider to compare."
            />
          </div>

          <p className="mt-8 text-base text-fg-muted">
            Another plus for the HEIC format is that it has these features
            that JPG does not:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-base text-fg-muted">
            <li>Store multiple frames in one file (if you turn on &lsquo;Live&rsquo;)</li>
            <li>Keep more color and detail for editing</li>
            <li>It supports transparency</li>
            <li>Saves the depth information in portrait mode</li>
          </ol>

          <p className="mt-6 text-base font-semibold text-fg">
            HEIC is best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Maximizing space inside your iPhone or iPad devices</li>
            <li>
              Storing photos with a higher-quality resolution without the
              storage penalty
            </li>
            <li>Editing photos without losing detail</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            HEIC isn&rsquo;t great for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Sending photographs to your friends who don&rsquo;t have an iOS
              device and use older Android phones or laptops.
            </li>
            <li>
              Uploading to older websites, forums, or apps that only accept
              JPG formats
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What&rsquo;s the difference between HEIF and HEIC?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            I was researching the HEIC format when I came across the term
            HEIF, which I thought was a different file format. But it turns
            out that wasn&rsquo;t the case. The HEIF (High Efficiency Image
            Format) is an umbrella spec that was standardized by MPEG in
            2015. It defines how an image is structured in terms of
            metadata, multiple images, depth maps, thumbnails, etc., but it
            doesn&rsquo;t dictate which compression codec is used. That is
            the role of HEIC (High Efficiency Image Container/Coding),
            whose image data is compressed with HEVC/H.265, which Apple uses
            on iOS 11 and later models.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is a JPG file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            JPG (or JPEG) is one of the oldest image formats, perhaps the
            most recognizable one. A group called the Joint Photographic
            Experts Group (JPEG) created it in 1992, which is where it got
            its name.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            This format has been used by most smartphones, cameras, and other
            photographic devices for the last 30+ years, and even today, most
            major digital brands like Sony and Canon use JPG as the default
            file format. It&rsquo;s the safest format to use because of its
            universal compatibility with nearly all digital devices -
            computers, laptops, smartphones, tablets; virtually all of them
            can open a JPG file.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, a major trade-off is that JPG isn&rsquo;t the most
            efficient at encoding data because it throws away tiny bits of
            data to keep file sizes manageable. This, in technical terms, is
            called{' '}
            <Link
              href="/blog/lossless-vs-lossy"
              className="text-primary underline"
            >
              lossy compression
            </Link>
            . You won&rsquo;t notice it, especially
            in high resolution, but it&rsquo;s more evident when you compress
            it to a lower quality.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG is best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Sharing photos with anyone by email, text, or on social media
            </li>
            <li>Uploading photos to any website</li>
            <li>
              Printing photos in photo studios (all of them will accept JPG
              format)
            </li>
            <li>
              Sending photos to anyone on any kind of device, Android, iOS,
              new or legacy devices
            </li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Photos you want to edit and save over and over (quality will
              degrade)
            </li>
            <li>Images with sharp lines (think logos or line graphics)</li>
            <li>Anything requiring a transparent background</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why convert HEIC to JPG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            Converting HEIC to JPG will boil down to compatibility. Yes,
            newer Android devices may be able to open HEIC files, but not all
            of them. If you share a photo in HEIC format with an Android
            phone user, they{' '}
            <Link
              href="/blog/heic-to-jpg-on-windows"
              className="text-primary underline"
            >
              may not be able to open it
            </Link>
            . Printing out a photo in a studio? Good luck; most studios will
            only accept JPG files unless they use a Mac, and those studios
            will be pricier.
            Converting to JPG solves these issues because of its universal
            compatibility.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Here&rsquo;s a simple way to think about it:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              An HEIC file format is like writing a note in special code to
              your closest friends who know how to translate it.
            </li>
            <li>
              A JPG format is writing that same note in plain English that
              anyone can read.
            </li>
          </ul>
        </section>
      }
    />
  )
}
