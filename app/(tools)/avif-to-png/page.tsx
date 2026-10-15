'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/avif-to-png'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is an AVIF file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            The AVIF (or AV1 Image File Format) is a relatively new image
            format introduced in 2019 by the <strong>Alliance for Open Media
            </strong>, a nonprofit backed by Google, Netflix, Mozilla, Amazon,
            and Cisco to develop royalty-free video and image formats like
            this. One reason AVIF was developed is to replace JPG, PNG, and
            even WebP as the internet&rsquo;s de facto image format.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            AVIF&rsquo;s biggest strength is its <strong>compression, between
            50 and 90% smaller than a comparable JPG image</strong>, and
            around <strong>20 to 30% smaller than WebP</strong> with similar
            visual quality. Another advantage is that AVIF supports{' '}
            <strong>alpha transparency</strong>, meaning you can save images
            like logos or icons with a transparent background. It also
            supports HDR, wide color gamuts (such as Display P3 and REC 2020),
            10- and 12-bit color depth, and both lossy and lossless modes.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, its biggest downside is <strong>compatibility outside
            major browsers</strong>. While AVIF is compatible with newer
            versions of modern browsers (Chrome, Edge, Firefox, Safari), most
            software doesn&rsquo;t recognize this format. If you use legacy
            software, you may need an extension to open it, which isn&rsquo;t
            the case for most apps. Older Photoshop versions don&rsquo;t
            support AVIF, so you can&rsquo;t open it. Most print shops accept
            legacy formats like PNG, TIFF, or JPG but not newer formats like
            AVIF, so that&rsquo;s one reason to convert AVIF to a legacy
            format like PNG.
          </p>

          <p className="mt-6 text-base font-semibold text-fg">
            AVIF is best suited for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Serving images to upload on websites</li>
            <li>High-resolution images used for the hero section, product photos, etc.</li>
            <li>Transparent logos and icons minus the bulk</li>
            <li>HDR photography where you want to preserve wide color and dynamic range</li>
          </ul>

          <p className="mt-6 text-base font-semibold text-fg">
            AVIF isn&rsquo;t good for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
            <li>Editing in legacy photo editing software without plugin support</li>
            <li>Sending to print shops or clients still on legacy software</li>
            <li>Uploading to older platforms (older CMSes, forums, marketplaces) that don&rsquo;t support AVIF</li>
            <li>Embedding in documents (Word, PowerPoint, PDFs) where support is spotty</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is a PNG file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            PNG (Portable Network Graphics) was introduced in 1996 as a GIF
            alternative when GIF wanted to charge a royalty to every software
            for using their encoder. Unlike AVIF, which supports lossy and
            lossless formats, PNG supports <strong>lossless compression</strong>,
            meaning every pixel is preserved without quality loss even after
            re-saving repeatedly.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            It&rsquo;s that lossless property that makes PNG the default
            option for graphic artists for saving assets such as{' '}
            <strong>logos, screenshots, UI mockups, line art, or diagrams
            </strong>. PNG also supports a full alpha channel, meaning it can
            save images with a transparent background (e.g., logos or icons).
            I&rsquo;d say PNG is better than GIF for transparency because it
            doesn&rsquo;t have the harsh edges GIFs can produce. Nearly every
            image-processing or editing program supports PNG, so you can send
            graphic files like UI mockups, logos, and illustrations to a
            print shop, and they will accept the format.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, the biggest tradeoff is <strong>file size</strong>. A
            PNG file is around <strong>three to eight times larger than an
            AVIF equivalent</strong> (that&rsquo;s for photographs) since PNG
            is lossless and no pixels are degraded. The difference is more or
            less the same for graphic files like logos or icons. If you need
            to upload the image to a website, then keep the AVIF format, but
            if you need to edit or send the file for print, then convert to a
            PNG format. If you want to go the other way, you can use our{' '}
            <Link href="/png-to-avif" className="text-primary underline">
              PNG to AVIF converter
            </Link>
            .
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
            <li>Large photographs with lots of intricate details</li>
            <li>HDR or wide-gamut source material (PNG is 8-bit sRGB in practice)</li>
            <li>Uploading images to a website (it takes too much space)</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why convert AVIF to PNG?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            There are three reasons: <strong>compatibility, quality, and
            transparency</strong>. AVIF is an excellent format for uploading
            images to a website because it&rsquo;s a fraction of the size of
            a PNG, so it takes up less space and loads fast. However, if you
            need to edit the image in an older version of Photoshop, or drop
            the file into a Word document, send it to a print shop, or upload
            it to a platform that doesn&rsquo;t support AVIF, PNG is the
            safer option for these situations. If JPG works for your use
            case, you can also try our{' '}
            <Link href="/avif-to-jpg" className="text-primary underline">
              AVIF to JPG converter
            </Link>
            .
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The second reason is <strong>quality</strong>. Since PNG is a
            lossless format, there won&rsquo;t be any pixel degradation when
            you convert it. You&rsquo;ll see that in the side-by-side preview
            that even if you lower the quality to 1, the PNG side
            doesn&rsquo;t degrade, because it doesn&rsquo;t throw away pixel
            data. So if you have image assets like icons or graphic files you
            need to catalog, then PNG is the better format for this.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The third reason is that PNG files support{' '}
            <strong>transparency</strong>. If you have a transparent AVIF
            file, converting it to PNG will preserve that transparency, which
            matters if you need to use a logo or icon for a presentation and
            compose that presentation in software you know will support PNG,
            but may not support an AVIF format without plugins.
          </p>
        </section>
      }
    />
  )
}
