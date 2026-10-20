'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/avif-to-gif'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is an animated AVIF file?</h2>

          <p className="mt-4 text-base text-fg-muted">
            AVIF (or AV1 Image File Format) is a modern image format
            introduced in 2019 by the{' '}
            <strong>Alliance for Open Media</strong> as a royalty-free
            successor to legacy formats like JPG, PNG, and even WebP. This
            format was created to bridge the gap between GIF and JPG files.
            Not only does it support still images, but it also supports{' '}
            <strong>animation sequences</strong>, which are essentially short
            clips stored in an image container like a flipbook.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Its biggest advantage is <strong>better compression than GIF
            </strong>. An animated AVIF is around 50 to 90% smaller than a
            comparable animated GIF file using the same clip, and it supports{' '}
            <strong>full 24-bit color, alpha transparency, and HDR</strong>.
            So think of it as a GIF file on steroids. Not only is it smaller,
            but you&rsquo;ll also get better animation quality without the
            size penalty. Most modern browsers like Firefox, Chrome, Edge, and
            Safari support AVIF, so it&rsquo;s the no-brainer option if you
            need to upload short animations on a website. Unfortunately,
            outside modern browsers, AVIF has very little compatibility with
            chat apps, platforms like GitHub, email clients, or legacy
            software.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            What is a GIF file?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            One of the oldest formats for short animation clips is the GIF
            (or Graphics Interchange Format). This was introduced in 1987,
            years before the internet became mainstream, and despite its
            age, it is still the most widely used animation format today.
            Popular platforms like Slack, Discord, GitHub, email clients,
            forums, legacy software, and every image viewer developed
            supports GIF animations. Unfortunately, using this format comes
            with major trade-offs. One is that GIF files are limited to
            just <strong>256 colors per frame</strong>, so they&rsquo;re
            prone to color banding, harsh gradients, and grainy animations.
            Since GIF is an old format, how it&rsquo;s encoded isn&rsquo;t
            efficient, resulting in a bulky file size (around three to
            eight times larger than AVIF). Despite all these downsides, GIF
            has <strong>near-universal compatibility</strong> and plays on
            nearly every platform or software.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why convert AVIF to GIF?
          </h2>

          <p className="mt-4 text-base text-fg-muted">
            Three reasons: <strong>compatibility, sharing, and embedding
            </strong>. If you have an animated AVIF, maybe from a modern
            screen recorder, and you need to upload it to Slack, a GitHub
            issue, a README, or an email, GIF is the format that will work
            across those platforms, while AVIF won&rsquo;t have the same
            universal compatibility.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The second reason is if you need to share an animation with
            people who use older software or who aren&rsquo;t familiar with
            what an AVIF is. Most people with basic internet knowledge will
            be familiar with the GIF format, but not with AVIF.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The third reason is that if you need to embed GIF animations in
            documents like Word, PowerPoint, or Google Docs, they don&rsquo;t
            support the AVIF format. A GIF file will be compatible with these
            since it&rsquo;s been the default format if you need short
            animation clips. However, if quality and file size matter, and
            you want better compatibility, try converting it to an{' '}
            <Link href="/webp-to-gif/" className="text-primary underline">
              animated WebP
            </Link>{' '}
            instead. If you have a still AVIF, use the{' '}
            <Link href="/avif-to-png/" className="text-primary underline">
              AVIF to PNG
            </Link>{' '}
            or{' '}
            <Link href="/avif-to-jpg/" className="text-primary underline">
              AVIF to JPG
            </Link>{' '}
            converter — a one-frame GIF is almost always a worse output.
          </p>
        </section>
      }
    />
  )
}
