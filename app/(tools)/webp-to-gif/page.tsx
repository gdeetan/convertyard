'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/webp-to-gif'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is WebP?</h2>

          <p className="mt-4 text-base text-fg-muted">
            WebP is an <strong>image format introduced by Google in 2010</strong>,
            similar to <strong>JPG, PNG, and GIF</strong> formats. It can contain
            images, including <strong>transparent and animated versions</strong>.
            The images are <strong>encoded more efficiently</strong>, so the files
            are <strong>much smaller</strong> compared to the previously mentioned
            image formats.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Unfortunately, <strong>many applications outside of the browser have
            yet to implement support for WebP</strong>. This is typically the
            reason WebP needs to be converted to another format — commonly{' '}
            <Link href="/webp-to-jpg/" className="text-primary underline">
              WebP to JPG
            </Link>
            ,{' '}
            <Link href="/webp-to-png/" className="text-primary underline">
              WebP to PNG
            </Link>
            , or WebP to GIF for animated clips.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">What is GIF?</h2>

          <p className="mt-4 text-base text-fg-muted">
            GIF has been around <strong>since 1987</strong> and is encoded{' '}
            <strong>less efficiently than a WebP</strong> (older software
            technology), resulting in <strong>large files with limited colors
            (256 max)</strong>. But, for better or worse,{' '}
            <strong>every application can open GIF files</strong>. GIFs are
            supported by <strong>all browsers, all phones, all chat apps, all
            email clients, all old forums</strong>, etc.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The main reason GIFs are used for <strong>short looping clips,
            reactions, and memes</strong> is that <strong>they work
            everywhere</strong>.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert WebP to GIF?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Works everywhere:</strong> Slack, Discord, iMessage,
              Reddit, email, and other services all work with GIFs; animated
              WebP is <strong>somewhat hit or miss</strong>, though.
            </li>
            <li>
              <strong>Older sites and tools often work fine with GIF but not
              WebP.</strong> Legacy forums, older CMSes, and wikis in particular
              often don&rsquo;t support WebP but work with GIF.
            </li>
            <li>
              <strong>Send an animated GIF to anyone</strong>, even people with{' '}
              <strong>old phones or email clients</strong>, and it will show up
              as a working image.
            </li>
            <li>
              The use of <strong>GIFs in meme and reaction apps</strong>, such
              as including your clip in a <strong>sticker pack or reaction
              library</strong>.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I keep the WebP?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Much smaller file size.</strong> An animated WebP is{' '}
              <strong>often half the size</strong> of the equivalent GIF, and
              often <strong>even smaller</strong>.
            </li>
            <li>
              <strong>More colors encoded:</strong> GIF is{' '}
              <strong>limited to 256 colors</strong>. This results in{' '}
              <strong>low-quality colors</strong> such as{' '}
              <strong>dirty-looking gradients and pixelated images</strong>.
              WebP shows the <strong>full color range</strong>.
            </li>
            <li>
              <strong>Softer transparency edges.</strong> GIF transparency is{' '}
              <strong>either fully on or off</strong>, which can result in{' '}
              <strong>harsh edges</strong>. WebP properly handles such edges.
            </li>
            <li>
              It&rsquo;s <strong>great for your own website</strong> if you can
              control where it&rsquo;s used and all your visitors are using{' '}
              <strong>modern browsers</strong>. Going the other direction? Try{' '}
              <Link href="/gif-to-webp/" className="text-primary underline">
                GIF to WebP
              </Link>
              {' '}to shrink existing GIFs.
            </li>
          </ul>
        </section>
      }
    />
  )
}
