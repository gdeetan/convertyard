'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/svg-to-png'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is SVG?</h2>

          <p className="mt-4 text-base text-fg-muted">
            SVG (or <strong>Scalable Vector Graphics</strong>) is a{' '}
            <strong>vector image format developed by the W3C and released in
            2001</strong>. This is different from other raster image formats
            such as PNG and JPG because images are created from{' '}
            <strong>mathematical formulas describing lines, curves, shapes,
            and colors (fills)</strong>, rather than as a collection of pixels
            (a grid) that a browser downloads and renders. In SVG,{' '}
            <strong>each time you view an image, the browser re-creates it
            from the XML text</strong> that defines it.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            SVGs are encoded using math, so they{' '}
            <strong>scale to any size while maintaining 100% quality</strong>.
            One file can be used for a{' '}
            <strong>16×16 favicon and a 100,000×100,000 4K billboard</strong>.
            Because SVGs are made up of math, they can also be{' '}
            <strong>animated, made interactive, styled with CSS, and even
            manipulated with JavaScript</strong>. This is why{' '}
            <strong>logos, icons, charts, and just about all other graphics
            used for user interface (UI) design</strong> these days are made
            as SVGs and are the <strong>new default for web graphics</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            <strong>SVG files are generally small</strong>, especially for
            simple graphics, since a few shapes are described by only a few
            lines of text. All modern browsers, as well as all common design
            tools like <strong>Figma, Illustrator, and Inkscape</strong>, and
            almost all web frameworks, <strong>support SVG natively</strong>.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">What is PNG?</h2>

          <p className="mt-4 text-base text-fg-muted">
            PNG, or <strong>Portable Network Graphics</strong>, is a{' '}
            <strong>free format for use on the web</strong>. PNG was created
            by the <strong>PNG Development Group in 1996</strong>, shortly
            after Unisys began <strong>charging for use of GIFs due to a
            patent</strong> held by the company of Steve Wilhite, the primary
            designer of GIFs. All PNG images are saved using{' '}
            <strong>lossless compression</strong>, meaning the amount of space
            you save is what you get. PNG images use{' '}
            <strong>24-bit color (16.7 million colors)</strong> and have a{' '}
            <strong>full alpha channel</strong>, which means they can be saved
            with a <strong>transparent background</strong>. This makes PNG the
            ideal format for items like <strong>logos, icons, screenshots,
            and similar images that have sharp edges or transparent
            backgrounds</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The PNG format offers <strong>wide support</strong>, as{' '}
            <strong>nearly every browser, platform, editor, or application
            that sends images</strong> will process this{' '}
            <strong>without any special encoder needed</strong>.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert SVG to PNG?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Compatibility with systems that do not support SVG:</strong>{' '}
              There are many places where SVG uploads are prohibited, including{' '}
              <strong>Amazon product pages, eBay, print-on-demand services,
              old Microsoft Office versions, and most email programs</strong>.
              All of these systems <strong>work with PNG</strong>.
            </li>
            <li>
              <strong>Fixed-size exports for presentations and documents:</strong>{' '}
              With PNG, when you embed an image in a presentation{' '}
              (<strong>PowerPoint</strong>, etc.), in documents (<strong>Word</strong>,
              etc.), and even in PDFs on the Internet, the{' '}
              <strong>rendered size will always be fixed</strong> and the same
              as you have rendered it.
            </li>
            <li>
              <strong>Render consistently:</strong> By choosing to create a
              fixed-size raster image like PNG, you can ensure that the image
              will be <strong>rendered consistently across all platforms</strong>,
              unlike SVGs, which can sometimes render slightly differently due
              to reasons like <strong>font substitution, inconsistent filter
              application, and sometimes unexpected behavior with complex
              effects</strong>.
            </li>
            <li>
              <strong>Protect your source files:</strong>{' '}
              <strong>Text-based SVG files can be read by anyone</strong>. By
              exporting your artwork as a PNG file, you can{' '}
              <strong>protect your source files from being extracted</strong>{' '}
              by others.
            </li>
            <li>
              <strong>Thumbnails, previews, and social media:</strong>{' '}
              <strong>Facebook, LinkedIn, Twitter</strong>, and other social
              media services all use PNGs as the{' '}
              <strong>preview/Open Graph card image</strong>. We also have{' '}
              <Link href="/compress-png/" className="text-primary underline">
                Compress PNG
              </Link>
              , which <strong>reduces the file size even further</strong> for
              such uses.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I keep the SVG?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Scalable without quality loss:</strong> Your SVG logo
              can be <strong>scaled to any size without losing quality</strong>.
              In contrast, <strong>PNG logos will start to look pixelated when
              upscaled</strong>. This makes SVG your ideal choice for a{' '}
              <strong>favicon, for business cards, as well as for a bus
              wrap</strong>.
            </li>
            <li>
              Typically, <strong>simple graphics are saved as SVG</strong>;{' '}
              <strong>logos, icons, and line drawings</strong> are encoded
              into <strong>very small file sizes (usually a few KB)</strong>.
            </li>
            <li>
              <strong>Editable in vector tools:</strong> Users can edit SVG
              files in various vector software like{' '}
              <strong>Figma, Illustrator, and Inkscape</strong>. A PNG, in
              comparison, is a <strong>single-layer graphic rendered from the
              original artwork</strong>. You&rsquo;ll need a tool like the{' '}
              <Link href="/png-to-svg/" className="text-primary underline">
                PNG to SVG
              </Link>
              {' '}converter to <strong>trace the original paths from PNG</strong>.
            </li>
            <li>
              <strong>Transform to animated graphics:</strong> It&rsquo;s
              possible to <strong>animate SVG files using CSS or
              JavaScript</strong>, like adding <strong>hover or click
              events</strong>.
            </li>
            <li>
              <strong>Accessibility and SEO Benefits:</strong> Text within an
              SVG is <strong>actually real text that can be read by screen
              readers and searched for by search engines</strong>. The same
              text within a PNG is <strong>just pixels</strong>.
            </li>
          </ul>
        </section>
      }
    />
  )
}
