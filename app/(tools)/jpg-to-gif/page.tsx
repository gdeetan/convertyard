'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-gif'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">What is JPG?</h2>

          <p className="mt-4 text-base text-fg-muted">
            JPG (or JPEG) is a <strong>photo image format introduced in 1992</strong>.
            It&rsquo;s a <strong>very popular image format</strong> for use on the
            web, in <strong>phone galleries, and on cameras</strong>. The JPG
            format uses <strong>lossy compression</strong>, which means that a
            small amount of the image is eliminated to form a{' '}
            <strong>smaller file</strong>. This is <strong>great for photos but
            not as suitable for sharp graphics and text</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            It is a <strong>single image</strong> and does{' '}
            <strong>not support any form of animation, transparent backgrounds,
            or multiple frames</strong> in an image. All{' '}
            <strong>cameras, browsers, phones, and chat programs</strong>{' '}
            support JPG files.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">What is GIF?</h2>

          <p className="mt-4 text-base text-fg-muted">
            GIF stands for <strong>Graphics Interchange Format</strong> and has
            been around <strong>since 1987</strong>. Typically used for{' '}
            <strong>short animated images (or &lsquo;loops&rsquo;)</strong>, GIF
            files can also be used to add an <strong>emotional reaction to a
            message or form part of a meme</strong>. GIFs are different from JPG
            files in that GIFs can contain <strong>multiple frames within a
            single file</strong>, allowing the file to be animated.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            GIFs are <strong>limited to 256 colors</strong> and use{' '}
            <strong>older compression methods</strong>, resulting in{' '}
            <strong>lower-quality photos</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Because GIF only supports images with 256 colors,{' '}
            <strong>photo-quality gradients are normally verboten</strong>. A
            gradient of this type could be a <strong>sky, a sunset, even the
            colors of human skin, a dark shadow</strong>. Such an image would
            contain <strong>thousands of individually distinct colors</strong>,
            which a GIF would map to <strong>256 colors for the entire
            image</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            This results in <strong>extremely visible banding between the
            colors in the gradient</strong>, rather than a smooth transition.
            Instead, the gradient will be <strong>dotty with grainy
            dithering</strong> in otherwise flat regions of the image, and it
            may even <strong>shift in color somewhat from the original</strong>{' '}
            in regions of the image where there are no close matches in the
            palette. But the <strong>greater the area of the image</strong>{' '}
            that the gradient is supposed to fill (for example, a{' '}
            <strong>full-frame sky</strong> as opposed to a gradient used on a
            button), the <strong>greater the impact</strong> of this sort of
            problem.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, GIFs are <strong>supported by every application</strong>:
            all browsers, all mobile phones, all instant messengers and email
            clients, even all <strong>old web forums</strong>.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert JPG to GIF?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Turn a sequence of photos into a short animation:</strong>{' '}
              A sequence of JPGs can easily be transformed into a{' '}
              <strong>short animated clip</strong> and then be uploaded to, for
              example, <strong>Twitter or Tumblr</strong> and then be embedded
              on a blog or website. <strong>Before-and-after images, product
              rotations and step-by-step instructions</strong> are no problem.
              Already have a clip? Try{' '}
              <Link href="/video-to-gif/" className="text-primary underline">
                video to GIF
              </Link>
              {' '}instead.
            </li>
            <li>
              <strong>Share animations in places where video would not be
              compatible.</strong> Slack, Discord, iMessage, Reddit, email, and
              old websites for forums all play GIFs within the communication
              medium, whereas <strong>MP4s are often blocked or embedded
              awkwardly</strong>. Going the other direction? Use{' '}
              <Link href="/gif-to-mp4/" className="text-primary underline">
                GIF to MP4
              </Link>
              .
            </li>
            <li>
              Immediately create <strong>funny memes, or reactions</strong> to
              things you have captured with your phone.
            </li>
            <li>
              <strong>Works on anything.</strong> Even{' '}
              <strong>old phones, browsers, and email clients</strong> will
              play GIFs.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I keep the JPG?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Smaller file size for one picture:</strong> A JPG file
              for one picture is <strong>much smaller than a GIF file</strong>{' '}
              for that same image. JPG is meant for{' '}
              <strong>images</strong>, and GIF is meant for{' '}
              <strong>simple graphics like logos or cartoons</strong>. If you
              already have a large GIF, shrink it with{' '}
              <Link href="/compress-gif/" className="text-primary underline">
                Compress GIF
              </Link>
              .
            </li>
            <li>
              JPG supports a <strong>full color range (millions of
              colors)</strong>, whereas GIF is <strong>limited to 256
              colors</strong>. Photos will look{' '}
              <strong>banded, dirty, or pixelated</strong> when converted to
              GIF, for example, <strong>skies, human skin tones,
              gradients</strong>, etc.
            </li>
            <li>
              <strong>JPG retains the fine photo detail.</strong> GIFs tend to{' '}
              <strong>&lsquo;smear&rsquo; fine photo texture</strong> because
              they can display <strong>only 256 colors</strong>.
            </li>
            <li>
              The <strong>photo format that everyone uses for single
              images</strong>: sites, printers, photo applications, etc. So if
              you only have one still image and you don&rsquo;t need to make an
              animation, then <strong>just keep it as a JPG</strong>. You might
              also consider converting it to{' '}
              <Link href="/jpg-to-webp/" className="text-primary underline">
                WebP
              </Link>
              {' '}or{' '}
              <Link href="/jpg-to-png/" className="text-primary underline">
                PNG
              </Link>
              {' '}for other uses.
            </li>
          </ul>
        </section>
      }
    />
  )
}
