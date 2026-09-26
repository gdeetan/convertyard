'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/svg-to-webp'

const explainer = (
  <div className="space-y-8 text-base text-fg-muted">
    <section>
      <h2 className="text-2xl font-semibold text-fg">What is SVG?</h2>
      <p className="mt-4">
        <strong>SVG</strong> (or Scalable Vector Graphics), unlike a
        photograph, isn&rsquo;t made of pixels. It is basically a text
        file (an <strong>XML-based vector graphic format</strong>, to be
        specific) with instructions like &ldquo;draw a circle
        here,&rdquo; or &ldquo;draw a line there,&rdquo; or &ldquo;write
        this here,&rdquo; and with these instructions, a graphic image
        is created, which is why these files are <strong>tiny compared
        to other formats</strong>.
      </p>
      <p className="mt-4">
        And because the browser draws these lines, it <strong>maintains
        the sharp lines at any zoom level</strong>. A simple logo with
        two colors might only be <strong>2 KB</strong>. However, the
        size jumps as the graphic gets more complex, especially if you
        trace from a pixel-based format like{' '}
        <Link href="/png-to-webp" className="text-primary underline underline-offset-2 hover:no-underline">
          PNG
        </Link>
        .
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">What is WebP?</h2>
      <p className="mt-4">
        Google created the <strong>WebP</strong> format in{' '}
        <strong>2010</strong> to solve the compression issue for JPG
        images. And like{' '}
        <Link href="/jpg-to-webp" className="text-primary underline underline-offset-2 hover:no-underline">
          JPG
        </Link>{' '}
        or PNG, this format stores pixel data. Major browsers across
        platforms like iOS, Android, Windows, and Mac support WebP
        files, and it has slowly become the <strong>de facto format
        website owners use to compress images so their sites load
        fast</strong>.
      </p>
      <p className="mt-4">
        WebP has two formats: <strong>lossy</strong> and{' '}
        <strong>lossless</strong>. Lossy is the format JPG uses, which
        throws away small details to make the file size smaller. This
        is <strong>excellent for photographs, portrait shots, or
        landscapes</strong> where a little loss of detail will not be
        noticeable at 60 to 80% quality.
      </p>
      <p className="mt-4">
        Lossless keeps every pixel, so even if you zoom in on an image,
        quality loss is minimal. This format is <strong>great for
        graphic files like logos, icons, or screenshots</strong>, where
        pixel loss is amplified, and you need to keep every detail
        intact for the image to stay sharp.
      </p>
      <p className="mt-4">
        WebP also supports <strong>transparent backgrounds, animations
        (like GIFs), and 24-bit color</strong>.
      </p>
      <p className="mt-4">
        However, WebP was created mainly to reduce file size. A WebP
        file with the same dimensions as a JPG or PNG format will be{' '}
        <strong>between 30 and 90% smaller</strong>, sometimes more if
        you&rsquo;re more aggressive with the quality slider. This
        means <strong>faster-loading websites and lower web hosting
        costs</strong>. If you want to shrink WebP files even further,
        you can{' '}
        <Link href="/compress-image" className="text-primary underline underline-offset-2 hover:no-underline">
          compress images
        </Link>{' '}
        in the same browser session.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">Why do I need to convert SVG files to WebP?</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5">
        <li>
          <strong>Incompatibility:</strong> You&rsquo;re using a CMS
          (like WordPress) or software that doesn&rsquo;t accept SVG
          files.
        </li>
        <li>
          <strong>You need fixed dimensions:</strong> Since SVG files
          can scale to any size, using them on social media or as
          website thumbnails won&rsquo;t be practical. Locking it to a
          fixed size like WebP is a better option for distributing
          images on different platforms that require specific
          dimensions.
        </li>
        <li>
          <strong>Complex photographs:</strong> SVG can maintain its
          tiny footprint only for simple graphics like a two-color logo
          or icon, but if the image needs complex lines, gradient
          backgrounds, or intricate details, it will be much larger
          than a WebP equivalent.
        </li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-fg">When should I keep the SVG files?</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5">
        <li>
          <strong>Logos and icons:</strong> SVG files are best used as
          logos or icons for a website. They stay <strong>sharp on
          every screen</strong>, like laptops, Retina displays, phones,
          and 4K monitors. Whereas you&rsquo;ll need several WebP file
          versions (different dimensions) to match that versatility.
        </li>
        <li>
          <strong>Small file size:</strong> An SVG file can be as small
          as <strong>2 or 3 KB</strong>, especially for graphics that
          require less than 8 colors.
        </li>
        <li>
          <strong>You want the graphic to be searchable or
          readable:</strong> Text inside an SVG graphic is readable,
          and you can highlight it like standard text. Text inside a
          WebP file is pixels and not readable.
        </li>
      </ol>
    </section>
  </div>
)

export default function Page() {
  return <ToolShell config={config} afterHowItWorks={explainer} />
}
