'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-avif'

const BeforeAfterCompare = dynamic(
  () => import('@/components/ui/BeforeAfterCompare').then((m) => m.BeforeAfterCompare),
  { ssr: false },
)

export default function Page() {
  return (
    <ToolShell
      config={config}
      belowToolCard={
        <BeforeAfterCompare
          beforeSrc="/tools/jpg-to-avif/koruldi-before.jpg"
          beforeAlt="Original JPG mountain lake photo"
          beforeLabel="JPG — 1,697 KB"
          afterSrc="/tools/jpg-to-avif/koruldi-after.avif"
          afterAlt="Same photo converted to AVIF with ConvertYard"
          afterLabel="AVIF — 216 KB"
          width={1280}
          height={854}
          aspectRatio="1280 / 854"
          caption="Real conversion: 1,697 KB JPG → 216 KB AVIF (87% smaller) at the same visual quality. Drag the slider to compare."
        />
      }
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is a JPG file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            JPG (originally JPEG) is one of the oldest and most recognizable
            image formats in the world. It was created in 1992 by a group
            called the &lsquo;Joint Photographic Experts Group,&rsquo; and
            today nearly every digital camera, smartphone, and device that
            shoots photographs (yes, even an iPhone) uses this format.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            While this is a widely used format, it&rsquo;s not the most
            efficient. During encoding, it throws away tiny bits of detail
            your eyes likely won&rsquo;t notice. In technical terms, this is
            called{' '}
            <Link
              href="/blog/lossless-vs-lossy"
              className="text-primary underline"
            >
              lossy image compression
            </Link>
            , which helps keep JPG file sizes smaller than its fellow legacy
            formats like TIFF or BMP. However, the more you save the same JPG
            file repeatedly at a lower quality, the blurrier the image gets.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG is best for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Images of people, landscapes, or things</li>
            <li>
              Photos you want to send via email, messenger, or any social
              media platform
            </li>
            <li>
              Any file where having a smaller file size matter than
              sharp/crisp, detailed image
            </li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            JPG isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Logos and anything that involves sharp lines or graphics</li>
            <li>Anything that needs a transparent background</li>
            <li>Screenshots that have lots of text</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is an AVIF file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The AVIF (or AV1 Image File) format is one of the newer, more
            efficient, smarter image formats developed in 2019 by a group of
            tech companies called the Alliance for Open Media (think Google,
            Apple, Netflix, Amazon, etc.)
          </p>

          <p className="mt-4 text-base text-fg-muted">
            AVIF was developed to solve the inherent issues with the JPG file
            format, ensuring photos are small enough to load fast on the
            internet without compromising image quality, thanks to modern
            math. The result is an image format that looks as good as a JPG
            photo, but 50 to 90% smaller with no visible difference.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            AVIF is best for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>High quality photographs at a much smaller file size</li>
            <li>A logo or any image that needs a transparent background</li>
            <li>
              An image that shows more colors on newer screen technology
              (HDR)
            </li>
            <li>
              Short animation clips (think{' '}
              <Link href="/jpg-to-gif" className="text-primary underline">
                GIF
              </Link>{' '}
              but with smaller file size)
            </li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            AVIF isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Older browsers on{' '}
              <Link
                href="/blog/avif-browser-support"
                className="text-primary underline"
              >
                older computers, phones, or laptops
              </Link>{' '}
              that use legacy browsers
            </li>
            <li>
              Instances where you need to save files quickly (AVIF takes
              longer to encode)
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why convert a JPG to an AVIF?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The biggest reason to convert an AVIF to JPG is the file size
            savings. For example, you run a blog or e-commerce store with
            over 100 product photos. Each JPG file is 500 KB, so that&rsquo;s
            50 megabytes worth of images that your visitors download when
            they open your site. If you convert those files into an AVIF
            format, that number can drop down to 50 MB, a 90% savings. Not
            only will your site load faster, but visitors will be more likely
            to purchase, improving engagement and signaling to Google to
            reward your site with better rankings. It saves you money on
            hosting because you don&rsquo;t have to pay as much for higher
            bandwidth. So it&rsquo;s a cascading effect.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Here&rsquo;s a simple way to think about it:
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Think of JPG as packing a suitcase using a normal method.
            </li>
            <li>
              AVIF is like packing those same clothes but putting them in a
              vacuum-sealed bag. You pack the same stuff, but there&rsquo;s
              more free space.
            </li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            You&rsquo;ll have to consider converting JPG to AVIF when:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              You&rsquo;re building or revamping a website and want faster
              loading times
            </li>
            <li>
              You need to save storage space on your computer hard drive or
              cloud storage
            </li>
            <li>
              You want high-quality photos without the cost of larger file
              sizes
            </li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            You wouldn&rsquo;t want to convert JPG to AVIF when:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              You&rsquo;re emailing photos using an old phone or computer
            </li>
            <li>
              Sending a photograph to a print shop that only accepts JPG
              files
            </li>
            <li>
              You need to open a file using legacy software that doesn&rsquo;t
              support AVIF.
            </li>
          </ul>
        </section>
      }
    />
  )
}
