'use client'

import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/heic-to-png'

export default function Page() {
  return (
    <ToolShell
      config={config}
      afterHowItWorks={
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-fg">HEIC vs PNG</h2>

          <p className="mt-4 text-base text-fg-muted">
            Converting HEIC to PNG is mostly about compatibility. HEIC photos
            are high quality and support some animation, but outside the
            iPhone ecosystem, most apps, websites, and older operating
            systems don&rsquo;t support this format. If you need to send HEIC
            photos to a non-iPhone user, one way to do so is to convert them
            to PNG without quality loss.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">What is HEIC?</h3>

          <p className="mt-4 text-base text-fg-muted">
            The HEIC (or High-Efficiency Image Container) is Apple&rsquo;s
            default image format on their iPhone and iPad (models released in
            2017 onwards). This is built on the HEIF standard that uses the
            HEVC (H.265) video codec to compress still images, which is also
            why HEIC images support some movement. HEIC files are smaller
            compared to JPG files (around 50% smaller) at the same
            dimensions. It has the same visual quality and has features JPG
            files don&rsquo;t, like 16-bit color depth, transparency, image
            sequences (or Live Photos), and HDR.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            The issue here is licensing and compatibility. HEIC files rely on
            patented codecs, so support outside the Apple ecosystem is
            spotty. Windows users will need to use a paid extension to open
            HEIC files. There&rsquo;s no universal browser support, as some
            won&rsquo;t open HEIC files. Some CMS platforms and legacy
            editors also don&rsquo;t accept HEIC.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">What is PNG?</h3>

          <p className="mt-4 text-base text-fg-muted">
            The PNG format (or Portable Network Graphics) was introduced in
            1996 as a free, open alternative to GIF, with major browsers like
            Microsoft Internet Explorer and Firefox integrating it in 1997.
            By 2004, it received ISO/IEC international certification and
            became compatible with every browser, graphics editor, and
            operating system. That includes Mac, Linux, Windows, iOS, and
            Android.
          </p>

          <p className="mt-4 text-base text-fg-muted">
            PNG images use lossless DEFLATE compression, and they support a
            full 8-bit alpha channel, so they support images with transparent
            backgrounds like logos and graphics. If you need anything with
            sharp edges and clean transparency (UI, screenshots, logos, or
            graphics), this format is an excellent alternative. It also
            works on photographs, and since it is lossless, the quality
            doesn&rsquo;t degrade when you resave it several times.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            Why convert HEIC to PNG?
          </h3>

          <ol className="mt-4 space-y-2 text-base text-fg-muted list-decimal pl-6">
            <li>
              <strong className="text-fg">Compatibility:</strong> Most
              Windows or Android apps, websites, forms, email clients, and
              corporate software will not accept HEIC. Converting it to PNG
              will help solve this compatibility issue since nearly all
              software will accept it.
            </li>
            <li>
              <strong className="text-fg">Editing with legacy tools:</strong>{' '}
              If you&rsquo;re using an older version of Photoshop or
              Illustrator on Windows, these aren&rsquo;t compatible with the
              HEIC format. Older computers that use older image editors also
              will not open these files.
            </li>
            <li>
              <strong className="text-fg">Printing workflow:</strong>{' '}
              Printing press shops that use software like QuarkXPress or
              older RIPs are only compatible with TIFF, JPG, or PNG formats.
            </li>
            <li>
              <strong className="text-fg">
                Sharing photos to different platforms:
              </strong>{' '}
              Sending an HEIC photo to an Android user usually results in a
              &ldquo;can&rsquo;t open this file&rdquo; message. Convert it to
              a PNG format if you&rsquo;re sending to a non-iOS user.
            </li>
            <li>
              <strong className="text-fg">Lossless archive:</strong> PNG
              files are perpetually lossless, so once you convert to this
              format, there&rsquo;s no quality loss even after you re-save
              it multiple times.
            </li>
          </ol>

          <h3 className="mt-10 text-lg font-semibold text-fg">
            When not to convert
          </h3>

          <p className="mt-4 text-base text-fg-muted">
            You don&rsquo;t need to convert to PNG if you&rsquo;re sending
            photos to another iOS user (iPhone, iPad, or Mac), because HEIC
            uses 50% less space than PNG, so it takes up less storage and
            you can save more photos.
          </p>
        </section>
      }
    />
  )
}
