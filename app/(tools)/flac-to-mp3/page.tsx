'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/flac-to-mp3'

export default function Page() {
  const [engineReady, setEngineReady] = useState(false)

  useEffect(() => {
    import('@/lib/converters/ffmpeg-client').then(({ preloadFFmpeg, getFFmpeg }) => {
      preloadFFmpeg()
      getFFmpeg()
        .then(() => setEngineReady(true))
        .catch(() => setEngineReady(true))
    })
  }, [])

  return (
    <>
      {!engineReady && (
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
            Preparing audio converter… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell
        config={config}
        afterHowItWorks={
          <section className="mt-4">
            <h2 className="text-2xl font-semibold text-fg">What is a FLAC file?</h2>

            <p className="mt-4 text-base text-fg-muted">
              FLAC, or <strong>Free Lossless Audio Codec</strong>, is an audio
              format created in <strong>2001 by Josh Coalson</strong> and
              released through <strong>Xiph.Org Foundation</strong> (the same
              group behind Ogg Vorbis and Opus). It became an official Xiph.Org
              project in 2003 and has stayed <strong>open-source and
              royalty-free</strong> ever since, which is a big reason it caught
              on with audiophiles, musicians, and archivists instead of staying
              a niche experiment.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              As a <strong>lossless format</strong>, FLAC simply shrinks your
              audio files <strong>without compromising quality</strong>. The
              resulting FLAC file is about <strong>40-60% smaller</strong> than
              the original{' '}
              <Link href="/wav-to-mp3/" className="text-primary underline">
                WAV
              </Link>{' '}
              file. However, you can decode the audio from the FLAC file, and
              it will play <strong>exactly like the original WAV file</strong>.
              This is as opposed to MP3s, for example, which throw away parts
              of the audio in order to compress the file.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              Today FLAC is the <strong>default archival format</strong> for
              most music libraries, for music downloaded from{' '}
              <strong>Bandcamp</strong>, for HD music stores such as{' '}
              <strong>Qobuz and 7digital</strong>, as well as for lossless
              versions of music streamed by services such as{' '}
              <strong>Tidal</strong> and the highest quality lossless versions
              available through <strong>Apple Music</strong>. It is supported
              natively by <strong>Windows 10, Android, and many
              distributions of Linux</strong>.
            </p>

            <p className="mt-6 text-base font-semibold text-fg">
              FLAC is best suited for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                <strong>Archiving your CD collection or vinyl rips</strong>{' '}
                without losing quality.
              </li>
              <li>
                All kinds of <strong>audio editing and remastering</strong>{' '}
                tasks that require a clean copy with every save.
              </li>
              <li>
                Listening on <strong>home HiFi equipment</strong>, on DACs or
                on quality headphones and actually hearing a difference.
              </li>
              <li>
                <strong>Long-term storage</strong>: FLAC is an open format, so
                it won&rsquo;t be locked behind a paywall.
              </li>
            </ul>

            <p className="mt-6 text-base font-semibold text-fg">
              FLAC isn&rsquo;t great for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                Sending large tracks by email or as messages (files are{' '}
                <strong>3 to 5 times larger</strong> than a comparable MP3
                file).
              </li>
              <li>
                Playing music on <strong>old iPods, low-end speaker systems,
                or car stereos (pre-2015)</strong>.
              </li>
              <li>Storing music on your phone.</li>
              <li>
                Uploading to platforms that <strong>re-encode anyway</strong>{' '}
                (YouTube, Instagram, TikTok).
              </li>
            </ul>

            <h2 className="mt-10 text-2xl font-semibold text-fg">
              What is an MP3 file?
            </h2>

            <p className="mt-4 text-base text-fg-muted">
              MP3 (short for <strong>MPEG-1 Audio Layer III</strong>) is one
              of the <strong>oldest and most recognizable</strong> audio
              formats. It was developed through the 1980s and early 90s by a
              team at the <strong>Fraunhofer Institute</strong> in Germany,
              led by <strong>Karlheinz Brandenburg</strong>, with help from
              AT&amp;T Bell Labs, Thomson, and others. It was standardized by
              the <strong>Moving Picture Experts Group (MPEG)</strong> in
              1993 as part of the MPEG-1 spec.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              MP3 is the format that <strong>helped shape the digital music
              era</strong>. From the days of <strong>Napster</strong> to the
              first iPods and early Winamp playlists, it has been the primary
              format for digital music. The patents that once covered MP3
              were due to <strong>expire in 2017</strong>, but since then MP3
              can be freely encoded, decoded, and even used to develop
              software without having to pay any license fees.{' '}
              <strong>It&rsquo;s free to use!</strong>
            </p>

            <p className="mt-4 text-base text-fg-muted">
              However, MP3&rsquo;s trade-off is{' '}
              <Link
                href="/blog/lossless-vs-lossy/"
                className="text-primary underline"
              >
                lossy compression
              </Link>
              , meaning <strong>quality loss</strong> because the encoding
              process degrades parts of the audio, such as frequencies masked
              by louder sounds, high treble, etc. The good news is that most
              users can&rsquo;t tell the difference from the original FLAC
              recording at{' '}
              <Link
                href="/blog/audio-bitrate-explained/"
                className="text-primary underline"
              >
                320 kbps
              </Link>
              , but at <strong>128 kbps</strong> you&rsquo;ll notice the
              difference if you use good headphones. Once you convert FLAC to
              MP3, you <strong>won&rsquo;t be able to recover the lost
              data</strong>.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              Even with newer formats like AAC and Opus around, MP3 is still
              the <strong>safest format to use</strong> because of its{' '}
              <strong>universal compatibility</strong>. Every phone, laptop,
              car stereo, smart speaker, and MP3 player made in the last{' '}
              <strong>25 years</strong> will play one without complaint.
            </p>

            <p className="mt-6 text-base font-semibold text-fg">
              MP3 is best suited for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                Loading your music to a <strong>phone, iPod (older models),
                or USB stick</strong> to listen to in your car.
              </li>
              <li>
                Sharing tracks through <strong>email, Discord, or messaging
                apps</strong>.
              </li>
              <li>
                Uploading recordings for <strong>podcasts, audiobooks, or
                voice platforms like Spotify</strong>.
              </li>
              <li>
                Any situation in which you simply need it to{' '}
                <strong>work on anything</strong>.
              </li>
            </ul>

            <p className="mt-6 text-base font-semibold text-fg">
              MP3 isn&rsquo;t good for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                <strong>Archiving master recordings</strong> (once converted
                to MP3, there&rsquo;s no way of recovering the audio quality).
              </li>
              <li>
                <strong>Re-exporting edited material numerous times</strong>,
                expecting high-quality output.
              </li>
              <li>
                An <strong>audiophile</strong> listening to music using
                high-end speakers.
              </li>
            </ul>

            <h2 className="mt-10 text-2xl font-semibold text-fg">
              Why convert FLAC to MP3?
            </h2>

            <p className="mt-4 text-base text-fg-muted">
              There are two reasons. The first is the{' '}
              <strong>size difference</strong>. Generally, an FLAC album will
              be around <strong>300 to 300 MB</strong>, and when converted to
              MP3 at 320 kbps, that size shrinks down to around{' '}
              <strong>90-140 MB</strong>. If you&rsquo;re saving this to your
              iPhone with 64 GB of storage, that difference is enough to fit{' '}
              <strong>between 150 and 500 albums</strong>. The second is{' '}
              <strong>compatibility</strong>. MP3 is{' '}
              <strong>universally compatible</strong> with nearly every
              device without the need for a special encoder, while FLAC
              doesn&rsquo;t have the same compatibility.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              A few situations where converting makes sense:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                <strong>You want to listen to music on your mobile
                device</strong>{' '}
                (Android, iPhone, etc.) Older iPods aren&rsquo;t compatible
                with FLAC files, but only MP3, AAC, or ALAC (which is the
                Apple Lossless Format). iPhones also don&rsquo;t support FLAC
                files, and even if you copy these files, you will not see
                them when you open the default Music app. MP3 files will be
                compatible with these devices.
              </li>
              <li>
                <strong>You want to send tracks to other people.</strong>{' '}
                FLAC files are usually far too large to send via email or
                upload to services like Dropbox.
              </li>
              <li>
                <strong>Older car stereos:</strong> Car stereos before 2015
                typically don&rsquo;t support FLAC but will play MP3 files.
              </li>
              <li>
                <strong>You&rsquo;re uploading files to a platform that
                re-encodes them</strong> (e.g., SoundCloud, YouTube, most
                podcast hosting sites). It&rsquo;s just a waste of bandwidth
                uploading a large Lossless file to be re-compressed on the
                other end.
              </li>
              <li>
                <strong>You have a smaller music library for use with your
                Bluetooth speaker or for your runs.</strong> MP3 will
                actually provide you with very similar sound quality while
                maintaining a smaller library size.
              </li>
            </ul>

            <h2 className="mt-10 text-2xl font-semibold text-fg">
              Why keep FLAC?
            </h2>

            <p className="mt-4 text-base text-fg-muted">
              I&rsquo;d recommend converting to MP3 for distribution and
              keeping your FLACs as the{' '}
              <strong>&lsquo;master&rsquo; copy</strong>, especially if you
              record your own music and you want to keep the{' '}
              <strong>highest quality possible</strong> for future use.
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
              <li>
                <strong>Lossy audio files can only be converted from a
                higher to a lower quality</strong> (e.g., from FLAC to MP3).
                They cannot be reversed (i.e., converted back to FLAC from
                MP3). Consequently, converting a FLAC file to MP3 and then
                back to FLAC will result in a larger file consisting of the
                degraded MP3 audio.
              </li>
              <li>
                <strong>The FLAC format is open</strong>, and others (MP3,
                for example) have been subject to Patents that restricted
                the format in many ways over the years. The FLAC format has
                been <strong>Open Source since day one</strong>.
              </li>
              <li>
                <strong>There is cheap storage available.</strong> A 2 TB
                external drive is currently available for around{' '}
                <strong>$60 USD</strong> and would hold thousands of FLAC
                albums.
              </li>
              <li>
                <strong>Streaming services are slowly but surely switching
                to lossless.</strong> Services such as{' '}
                <strong>Apple Music, Tidal, Amazon Music HD, and
                Qobuz</strong> are now streaming high-quality audio to their
                subscribers. This means you can now re-import your entire
                library of high-quality audio in FLAC format.
              </li>
              <li>
                <strong>The opportunity to re-encode to a future file
                format.</strong> Today&rsquo;s small Opus file is already
                better than MP3, but there&rsquo;s no knowing what the
                future will bring. Encode from the lossless FLAC, not the
                decade-old MP3 file.
              </li>
            </ul>

            <p className="mt-6 text-base text-fg-muted">
              <strong>The short version:</strong> convert to MP3 as the{' '}
              <strong>delivery format</strong>, and keep the FLAC file as
              the <strong>archive</strong>.
            </p>
          </section>
        }
      />
    </>
  )
}
