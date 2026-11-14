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
              format created in 2001 by Josh Coalson and released through
              Xiph.Org Foundation (the same group behind Ogg Vorbis and Opus).
              It became an official Xiph.Org project in 2003 and has stayed
              open-source and royalty-free ever since, which is a big reason
              it caught on with audiophiles, musicians, and archivists
              instead of staying a niche experiment.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              As a <strong>lossless format</strong>, FLAC simply shrinks your
              audio files without compromising quality. The resulting FLAC
              file is about <strong>40&ndash;60% smaller</strong> than the
              original{' '}
              <Link href="/wav-to-mp3/" className="text-primary underline">
                WAV
              </Link>{' '}
              file. However, you can decode the audio from the FLAC file, and
              it will play exactly like the original WAV file. This is as
              opposed to MP3s, for example, which throw away parts of the
              audio in order to compress the file.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              Today FLAC is the <strong>default archival format</strong> for
              most music libraries, for music downloaded from Bandcamp, for
              HD music stores such as Qobuz and 7digital, as well as for
              lossless versions of music streamed by services such as Tidal
              and the highest-quality lossless versions available through
              Apple Music. It is supported natively by Windows 10, Android,
              and many distributions of Linux.
            </p>

            <p className="mt-6 text-base font-semibold text-fg">
              FLAC is best suited for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>Archiving your CD collection or vinyl rips without losing quality.</li>
              <li>
                All kinds of audio editing and remastering tasks that require
                a clean copy with every save.
              </li>
              <li>
                Listening on home HiFi equipment, on DACs or on quality
                headphones and actually hearing a difference.
              </li>
              <li>
                Long-term storage: FLAC is an open format, so it won&rsquo;t
                be locked behind a paywall.
              </li>
            </ul>

            <p className="mt-6 text-base font-semibold text-fg">
              FLAC isn&rsquo;t great for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                Sending large tracks by email or as messages (files are 3 to
                5 times larger than a comparable MP3 file).
              </li>
              <li>
                Playing music on old iPods, low-end speaker systems, or car
                stereos (pre-2015).
              </li>
              <li>Storing music on your phone.</li>
              <li>
                Uploading to platforms that re-encode anyway (YouTube,
                Instagram, TikTok).
              </li>
            </ul>

            <h2 className="mt-10 text-2xl font-semibold text-fg">
              What is an MP3 file?
            </h2>

            <p className="mt-4 text-base text-fg-muted">
              MP3 (short for <strong>MPEG-1 Audio Layer III</strong>) is one
              of the oldest and most recognizable audio formats. It was
              developed through the 1980s and early 90s by a team at the
              Fraunhofer Institute in Germany, led by Karlheinz Brandenburg,
              with help from AT&amp;T Bell Labs, Thomson, and others. It was
              standardized by the Moving Picture Experts Group (MPEG) in
              1993 as part of the MPEG-1 spec.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              MP3 is the format that helped shape the digital music era.
              From the days of Napster to the first iPods and early Winamp
              playlists, it has been the primary format for digital music.
              The patents that once covered MP3 were due to expire in 2017,
              but since then MP3 can be freely encoded, decoded, and even
              used to develop software without having to pay any license
              fees. It&rsquo;s free to use!
            </p>

            <p className="mt-4 text-base text-fg-muted">
              However, MP3&rsquo;s trade-off is{' '}
              <Link
                href="/blog/lossless-vs-lossy/"
                className="text-primary underline"
              >
                lossy compression
              </Link>
              , meaning quality loss because the encoding process degrades
              parts of the audio, such as frequencies masked by louder
              sounds, high treble, etc. The good news is that most users
              can&rsquo;t tell the difference from the original FLAC
              recording at{' '}
              <Link
                href="/blog/audio-bitrate-explained/"
                className="text-primary underline"
              >
                320 kbps
              </Link>
              , but at 128 kbps you&rsquo;ll notice the difference if you
              use good headphones. Once you convert FLAC to MP3, you
              won&rsquo;t be able to recover the lost data.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              Even with newer formats like AAC and Opus around, MP3 is
              still the <strong>safest format to use</strong> because of its
              universal compatibility. Every phone, laptop, car stereo,
              smart speaker, and MP3 player made in the last 25 years will
              play one without complaint.
            </p>

            <p className="mt-6 text-base font-semibold text-fg">
              MP3 is best suited for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                Loading your music to a phone, iPod (older models), or USB
                stick to listen to in your car.
              </li>
              <li>Sharing tracks through email, Discord, or messaging apps.</li>
              <li>
                Uploading recordings for podcasts, audiobooks, or voice
                platforms like Spotify.
              </li>
              <li>Any situation in which you simply need it to work on anything.</li>
            </ul>

            <p className="mt-6 text-base font-semibold text-fg">
              MP3 isn&rsquo;t good for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                Archiving master recordings (once converted to MP3,
                there&rsquo;s no way of recovering the audio quality).
              </li>
              <li>
                Re-exporting edited material numerous times, expecting
                high-quality output.
              </li>
              <li>An audiophile listening to music using high-end speakers.</li>
            </ul>

            <h2 className="mt-10 text-2xl font-semibold text-fg">
              Why convert FLAC to MP3?
            </h2>

            <p className="mt-4 text-base text-fg-muted">
              There are two reasons. The first is the{' '}
              <strong>size difference</strong>. Generally, a FLAC album will
              be around 300&ndash;500 MB, and when converted to MP3 at 320
              kbps, that size shrinks down to around 90&ndash;140 MB. If
              you&rsquo;re saving this to your iPhone with 64 GB of storage,
              that difference is enough to fit between 150 and 500 albums.
              The second is <strong>compatibility</strong>. MP3 plays on
              virtually every device ever made, while FLAC still trips up
              older car stereos, legacy MP3 players, and budget audio
              hardware.
            </p>

            <p className="mt-4 text-base text-fg-muted">
              A few situations where converting makes sense:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-fg-muted">
              <li>
                <strong>You want to listen to music on your mobile device</strong>{' '}
                (Android, iPhone, etc.). Older iPods aren&rsquo;t compatible
                with FLAC files, only MP3, AAC, or ALAC (the Apple Lossless
                Format). iPhones also don&rsquo;t support FLAC in the stock
                Music app &mdash; even if you copy the files over, they
                won&rsquo;t show up. MP3 files work on all of these devices.
              </li>
              <li>
                <strong>You want to send tracks to other people.</strong>{' '}
                FLAC files are usually far too large to send via email or
                upload to services like Dropbox.
              </li>
              <li>
                <strong>Older car stereos.</strong> Car stereos from before
                2015 typically don&rsquo;t support FLAC but will play MP3
                files.
              </li>
              <li>
                <strong>
                  You&rsquo;re uploading to a podcast host that accepts MP3
                  as the final file
                </strong>{' '}
                (Libsyn, Buzzsprout, Transistor, etc.). These hosts
                don&rsquo;t re-encode, so handing them an MP3 directly skips
                a conversion step and saves upload time. Note: this does{' '}
                <em>not</em> apply to SoundCloud or YouTube &mdash; both
                re-encode everything on their end, and the result sounds
                better when the source is lossless.
              </li>
              <li>
                <strong>
                  You want a smaller library for a Bluetooth speaker or your
                  runs.
                </strong>{' '}
                MP3 delivers very similar perceived sound quality at a
                fraction of the size, which is ideal when Bluetooth
                compression is already in the chain. You can also{' '}
                <Link
                  href="/compress-mp3/"
                  className="text-primary underline"
                >
                  compress MP3 further
                </Link>{' '}
                if you need to squeeze in more tracks.
              </li>
            </ul>

            <h2 className="mt-10 text-2xl font-semibold text-fg">
              Why keep FLAC?
            </h2>

            <p className="mt-4 text-base text-fg-muted">
              I&rsquo;d recommend converting to MP3 for distribution and
              keeping your FLACs as the <strong>&lsquo;master&rsquo; copy</strong>,
              especially if you record your own music and you want to keep
              the highest quality possible for future use.
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
              <li>
                <strong>Lossy conversion is one-way.</strong> You can go from
                FLAC to MP3, but not back. Converting a FLAC to MP3 and then
                back to FLAC will just give you a larger file containing the
                already-degraded MP3 audio.
              </li>
              <li>
                <strong>FLAC is an open format.</strong> MP3 was tied up in
                patents that restricted the format in many ways over the
                years. FLAC has been open-source since day one.
              </li>
              <li>
                <strong>Storage is cheap.</strong> A 2 TB external drive is
                currently around $60 USD and holds thousands of FLAC albums.
              </li>
              <li>
                <strong>Streaming is moving to lossless.</strong> Apple
                Music, Tidal, Amazon Music HD, and Qobuz all stream
                lossless now, so keeping FLACs means you can match that
                quality when you re-import your library.
              </li>
              <li>
                <strong>Re-encoding to future formats.</strong> Opus is
                already better than MP3 at small sizes, and there&rsquo;s
                no telling what comes next. Encode from the lossless FLAC,
                not the decade-old MP3.
              </li>
            </ul>

            <p className="mt-6 text-base text-fg-muted">
              The short version: convert to MP3 as the delivery format, and
              keep the FLAC file as the archive.
            </p>
          </section>
        }
      />
    </>
  )
}
