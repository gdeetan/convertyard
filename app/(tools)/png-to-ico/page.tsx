'use client'
import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/png-to-ico'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is a PNG file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            PNG (Portable Network Graphics) is an image format similar to{' '}
            <Link href="/jpg-to-gif" className="text-primary underline">
              JPG or GIF
            </Link>
            . A group of developers created it in 1996 as a free image format
            that anyone can use without paying a license fee.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            One huge advantage of PNG files is that they&rsquo;re{' '}
            <Link
              href="/blog/lossless-vs-lossy"
              className="text-primary underline"
            >
              lossless
            </Link>
            , so images stay sharp. If you choose the PNG format, it&rsquo;s
            encoded so that none of the detail is discarded. Every pixel stays
            where it should be. That&rsquo;s why a PNG image still looks sharp
            even after you compress it.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            This format also supports something called transparency, which
            means that part of the image is &lsquo;transparent&rsquo; or
            something you can see through. For example, if you have a
            predominantly black penguin logo, you can save it so only the
            penguin shows without a background, and place it on any graphic
            seamlessly because no background color gets in the way.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            Choose PNG for images like:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Logos or icons</li>
            <li>Screenshots (anything with lots of text)</li>
            <li>Simple drawings or cartoons</li>
            <li>Any image that needs a transparent background</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            PNG isn&rsquo;t great for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>
              Photography shots with lots of detail (landscape, groups of
              people, etc.)
            </li>
            <li>
              Anything you want to load fast (since it&rsquo;s a lossless
              format)
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is an ICO file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            ICO is short for ICON: a special format developed by Microsoft for
            Windows all the way back in 1985 (I bet most of you weren&rsquo;t
            born yet). Its purpose is to hold tiny graphics that the computer
            reads and displays, such as icons in your application, in the
            folder on your desktop, favicons, basically anything that shows a
            logo of something.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            What makes the ICO format unique from PNG or most other graphic
            formats is that it holds images (more of graphic files) of various
            sizes of the same image in one file. So a single ICO file can hold
            a 16 x 16, 32 x 32, 64 x 64, all the way up to 128 px, depending
            on how you&rsquo;ll use it. The small logos you see in your
            browser beside the URL are an example of an ICO file. ConvertYard
            lets users convert a PNG into four ICO sets: Large only (single
            128 px file), Full Set (16 to 128 px), Web Favicon (16 to 48 px),
            and Apple Shortcut (16 and 32 px).
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            ICO files are best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Website icons (or favicons)</li>
            <li>Logos</li>
            <li>Windows shortcut icons for software</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            Don&rsquo;t use ICO files for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Regular images</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            PNG vs ICO - What&rsquo;s the Difference?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            The biggest difference between these image formats is that PNG
            files hold a single image while the ICO format can hold different
            sizes of the same graphic. So when you&rsquo;re converting a PNG
            file to an ICO file, you&rsquo;re turning that single image (or
            graphic) into a format that holds multiple sizes.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            There&rsquo;s a new alternative format for PNG files, called
            APNG, that works like a GIF and supports movement (similar to the
            ones used for memes).
          </p>
        </section>
      }
    />
  )
}
