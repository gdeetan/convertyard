'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/webp-to-png'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">WebP vs PNG</h2>

          <p className="mt-4 text-base text-fg-muted">
            Converting WebP to PNG is purely for compatibility. It&rsquo;s not
            a quality upgrade since WebP can be utilized as a lossless format.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">What is WebP?</h3>

          <p className="mt-4 text-base text-fg-muted">
            WebP is a relatively new image format developed by Google in 2010
            to help solve the JPG issue of pixel degradation during saving. It
            uses video compression technology, so it supports animated images
            as a smaller alternative to a GIF file. WebP encodes pixels more
            efficiently than older formats like PNG and JPG, and produces an
            image file that&rsquo;s over 90% smaller with no noticeable
            difference in image quality.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            It was not until 2020 that WebP achieved near-universal
            compatibility, with major web browsers supporting it.
            Unfortunately, not all platforms accept WebP, which is one reason
            converting it to PNG can be a better alternative if you want to
            maintain quality, since PNG is lossless.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">What is PNG?</h3>

          <p className="mt-4 text-base text-fg-muted">
            PNG was released as a free GIF alternative in 1996, and major
            browsers like Microsoft Internet Explorer and Firefox integrated
            it in 1997. It became an ISO/IEC international standard in 2004
            and is compatible with every browser, graphics editor, and smart
            device across platforms like Linux, Windows, and Mac.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            It uses lossless DEFLATE compression and supports a full 8-bit
            alpha channel, meaning it supports images with a transparent
            background, like logos or graphics. PNG is a good option if you
            have a graphic: UI, screenshots, logos, anything that requires
            sharp edges or clean transparency.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert WebP to PNG?
          </h3>

          <ol className="mt-4 space-y-2 text-base text-fg-muted list-decimal pl-6">
            <li>
              <strong className="text-fg">Compatibility:</strong> Older CMS
              platforms, email clients, online forms, and corporate software
              often reject images in WebP format but accept PNG.
            </li>
            <li>
              <strong className="text-fg">Editing with legacy tools:</strong>{' '}
              If you&rsquo;re using old paid software like an older version of
              Photoshop, Figma plugins, or desktop editors, they may not
              support WebP, but PNG is universally compatible.
            </li>
            <li>
              <strong className="text-fg">Print workflow:</strong> Print shops
              that use layout software like InDesign, QuarkXPress, or older
              RIPs require images to be in TIFF, PNG, or JPG formats, and
              often don&rsquo;t accept WebP.
            </li>
            <li>
              <strong className="text-fg">
                Lossless version for the archive:
              </strong>{' '}
              The PNG format is lossless, so even if you save it multiple
              times, there is no loss in quality.
            </li>
          </ol>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            When not to convert?
          </h3>

          <p className="mt-4 text-base text-fg-muted">
            If you&rsquo;re uploading images to a CMS like WordPress,
            there&rsquo;s no need to use PNG, since most web browsers support
            WebP. It&rsquo;s around two to five times smaller than an
            equivalent PNG file with no noticeable quality loss. And your
            website will load faster and not eat up as much storage space.
          </p>
        </section>
      }
    />
  )
}
