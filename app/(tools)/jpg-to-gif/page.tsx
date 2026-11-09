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
            GIF (or <strong>Graphics Interchange Format</strong>) was introduced
            in <strong>1987</strong>. This format is used for{' '}
            <strong>short, animated clips</strong> (or more popularly known as{' '}
            <strong>memes</strong>), adding an <strong>emotional aspect to a
            message or article</strong>. The main difference between a JPG and
            a GIF file is that the latter is <strong>made up of multiple frames
            contained within a file</strong>. Another difference is that GIFs
            support only <strong>up to 256 colors</strong> and use{' '}
            <strong>older compression methods</strong>, so image encoding
            isn&rsquo;t as efficient, resulting in <strong>larger file
            sizes</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            Because GIFs only support images that have 256 colors,{' '}
            <strong>gradients that would look really good in JPGs just
            aren&rsquo;t going to look as good in a GIF format</strong>. This
            kind of gradient would look photographic, like a{' '}
            <strong>blue sky, a colorful sunset, human skin tones, or even a
            dark shadow</strong>. Such an image would contain{' '}
            <strong>thousands of individual colors</strong>, and the GIF would
            map all of those to <strong>256 colors for the entire
            image</strong>.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The difference between the colors in the gradient is so extreme
            that instead of smooth transitions between colors, there are{' '}
            <strong>large bands of solid color</strong>. Areas of the image
            that are otherwise flat will be made up of{' '}
            <strong>dots of very coarse dithering</strong>. In some cases, the
            color may even <strong>shift from the original shade</strong> and
            may not match at all in areas of the image where there are{' '}
            <strong>no suitable colors in the palette</strong>. The degree to
            which this type of problem occurs will be affected by the{' '}
            <strong>area of the image that the gradient is intended to
            cover</strong> and the element against which it will be viewed
            (for example, a <strong>full-height background sky</strong> would
            be very noticeable, whereas a <strong>gradient used for a
            button</strong> would not).
          </p>

          <p className="mt-4 text-base text-fg-muted">
            However, one huge advantage of GIFs is that they are{' '}
            <strong>supported on nearly every platform</strong>, not just
            browsers. Users can open them on{' '}
            <strong>any website, software, or email platforms</strong>; even{' '}
            <strong>legacy software</strong> supports this format.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-fg">
            Why should I convert JPG to GIF?
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
            <li>
              <strong>Transform a sequence of photos into an animated
              short:</strong> Use a sequence of JPGs to create and upload a{' '}
              <strong>short animated film</strong> to services such as{' '}
              <strong>Twitter or Tumblr</strong>. These can then be embedded on
              a blog or website. <strong>Before and after images, product
              rotations, and step-by-step guides</strong> are all made easy.
              If you have already made a video, then perhaps{' '}
              <Link href="/video-to-gif/" className="text-primary underline">
                video to GIF
              </Link>
              {' '}is the better option.
            </li>
            <li>
              When <strong>sharing animation on platforms that don&rsquo;t
              support video playback</strong>, GIFs work better in{' '}
              <strong>Slack, Discord, iMessage, Reddit, emails</strong>, and on
              many <strong>older forum websites</strong>, whereas{' '}
              <strong>MP4s are often prohibited or embed awkwardly</strong>. To
              share a GIF by converting it to a video, such as for sharing on
              Vimeo, share it with our online{' '}
              <Link href="/gif-to-mp4/" className="text-primary underline">
                GIF to MP4
              </Link>
              {' '}converter.
            </li>
            <li>
              Immediately create <strong>funny memes or reactions</strong>{' '}
              from things you captured with your phone.
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
              colors</strong>. Photos can look{' '}
              <strong>banded and pixelated with lots of noise</strong> when
              converted to GIF, especially if the photos contain{' '}
              <strong>landscapes, people, or gradients</strong>.
            </li>
            <li>
              <strong>JPG retains the fine photo detail.</strong> GIFs tend to{' '}
              <strong>&lsquo;smear&rsquo; fine photo texture</strong> because
              they can display <strong>only 256 colors</strong>.
            </li>
            <li>
              For <strong>single images, such as photos</strong>, it is
              easiest to <strong>upload JPEGs to sites, print them at stores,
              use them in photo applications</strong>, etc. If you only have
              one image that is stationary and you don&rsquo;t plan to make an
              animation out of it, then <strong>just stick with a JPG</strong>.
              For other uses, like WebP or transparent backgrounds, convert it
              to a{' '}
              <Link href="/jpg-to-webp/" className="text-primary underline">
                WebP
              </Link>
              {' '}or{' '}
              <Link href="/jpg-to-png/" className="text-primary underline">
                PNG
              </Link>
              .
            </li>
          </ul>
        </section>
      }
    />
  )
}
