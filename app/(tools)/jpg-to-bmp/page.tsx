'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-bmp'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">
            JPG vs BMP &mdash; Differences Explained
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            <strong className="text-fg">JPG</strong>, or Joint Photographic
            Experts Group, is the default photo format across all platforms.
            It uses <strong className="text-fg">lossy compression</strong>,
            which keeps file sizes relatively small without compromising too
            much on quality. Most digital cameras and mobile devices shoot in
            JPG format, and all websites accept this format when you upload
            it. When you want a photo for the web that is of reasonable size
            and opens everywhere, JPG is the default choice.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            <strong className="text-fg">BMP (Bitmap)</strong> is a very old
            and simple image format. It was created by Microsoft for use with
            Windows in the late 1980s. The BMP format stores every pixel in
            an image as <strong className="text-fg">raw, uncompressed data</strong>.
            This makes BMP images 100% lossless and easy to read, but the
            files can grow to enormous sizes. In comparison to JPG images of
            similar size and content, BMP files can be{' '}
            <strong className="text-fg">10 to 50 times as large</strong>.
            This format doesn&rsquo;t have modern features such as good
            compression, metadata support, or color profiles. In essence,
            BMP is a raw pixel dump, surrounded by a small header.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            If you&rsquo;re uploading images online, emailing them, or just
            storing them on your phone, JPG is the better option, since
            it&rsquo;s smaller and is universally compatible. If you need an
            uncompressed image for legacy Windows software, or a specific
            technical workflow that requires it, opt for the BMP format.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Side-by-Side Comparison
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              <strong className="text-fg">File size:</strong> The size of BMP
              files can be 10 to 50 times larger than an equivalent JPG file.
              This means that a 2MB JPG file can easily become a 40MB BMP
              file.
            </li>
            <li>
              <strong className="text-fg">Compression:</strong> JPG uses
              lossy compression and allows users to adjust quality. BMP
              stores all the pixel information in the file without any
              compression.
            </li>
            <li>
              <strong className="text-fg">Transparency:</strong> Neither JPG
              nor BMP support transparency in a reliable way. There is an
              alpha-enabled version of BMP files, but it is so rarely used
              that most applications just won&rsquo;t work with them.
            </li>
            <li>
              <strong className="text-fg">Color depth:</strong> The JPG file
              only supports 24-bit color (8 bits per channel), whereas BMP
              files can be saved with 1-, 4-, 8-, 16-, 24-, or 32-bit depth.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert to BMP?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              If you&rsquo;re using{' '}
              <strong className="text-fg">legacy Windows software</strong>{' '}
              that only works with BMP files.
            </li>
            <li>
              You need to provide your program with a{' '}
              <strong className="text-fg">raw, uncompressed pixel source</strong>.
              This is often the case for image processing programs (also as
              part of larger programs or scripts), embedded systems, special
              scanners (e.g., flatbed scanners), or test environments.
            </li>
            <li>
              Converting a JPG to BMP helps to{' '}
              <strong className="text-fg">
                &lsquo;lock down&rsquo; the image
              </strong>{' '}
              and prevent any further lossy compression from occurring,
              helping to remove artifacts that have occurred in the
              compression process.
            </li>
            <li>
              You are creating an{' '}
              <strong className="text-fg">icon or a sprite</strong> that will
              be used in a certain application, and this software only
              accepts a BMP format.
            </li>
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why keep JPG?
          </h3>

          <ul className="mt-4 space-y-2 text-base text-fg-muted">
            <li>
              JPG is the{' '}
              <strong className="text-fg">gold standard for photos</strong>{' '}
              and is supported by every browser, digital camera, and photo
              editing software. Basically, you can store photos in this
              format and don&rsquo;t have to worry about the file not
              opening.
            </li>
            <li>
              <strong className="text-fg">Small Files.</strong> A JPG file is
              10&ndash;50 times the size of a BMP file for the same image.
              This results in faster websites and lower storage costs. You
              can shrink them further with{' '}
              <Link
                href="/compress-jpg"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                Compress JPG
              </Link>
              .
            </li>
            <li>
              It&rsquo;s{' '}
              <strong className="text-fg">universally compatible</strong>.
              Every ancient flip phone as well as the latest DSLR camera
              imports JPG.
            </li>
            <li>
              Converting to BMP does not improve image quality. Like with
              BMP vs. GIF, BMP will not restore any information that JPG
              already removed through compression. Instead, it will simply
              blow up the file size. For a modern web format, try{' '}
              <Link
                href="/jpg-to-webp"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                JPG to WebP
              </Link>{' '}
              or{' '}
              <Link
                href="/jpg-to-png"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                JPG to PNG
              </Link>{' '}
              instead.
            </li>
          </ul>
        </section>
      }
    />
  )
}
