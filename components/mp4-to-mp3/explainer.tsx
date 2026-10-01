import Link from 'next/link'

export function Mp4ToMp3Explainer() {
  return (
    <div>
      <h2>What is an MP4?</h2>
      <p>
        MP4 is the <strong>default video format that most websites accept today</strong>.
        When you record videos on your Android phone, it saves as an MP4 file.
        It&rsquo;s one of the most efficient at encoding data and doesn&rsquo;t
        consume as much space compared to legacy formats like AVI or WMV.
        It&rsquo;s the default choice of most content creators because of its
        universal compatibility across different platforms (YouTube, Facebook,
        etc.).
      </p>
      <p>An MP4 file at its core is a container that can hold the following:</p>
      <ol>
        <li>Video tracks</li>
        <li>Audio</li>
        <li>Subtitles and metadata</li>
      </ol>
      <p>
        MP4 files support H.264 or newer HEVC (H.265) codec and AAC for audio.
        A nearly hour-long MP4 video with audio recording will be
        <strong> less than 800 MB</strong>. If you&rsquo;re storing videos as
        backup on the cloud or hard drive, the memory savings do add up.
      </p>

      <h2>What is an MP3?</h2>
      <p>
        MP3 is a file format that <strong>only stores audio tracks</strong>.
        There&rsquo;s no video or photos, just sound. This format has been the
        standard for podcasts, music, audiobooks, and voice recordings for over
        two decades.
      </p>
      <p>
        Because it stores only voice, it has a smaller file size than MP4 and
        works with nearly every modern device, including smartphones, CD
        players, old iPods, Windows, Mac, and Linux. Its small footprint makes
        it easy to send via email, messaging apps, and websites.
      </p>
      <p>
        A 30-minute recording in MP3 will take only 20 to 30 MB,
        <strong> about ten times smaller than an MP4 file</strong>.
      </p>

      <h2>What to expect</h2>
      <ol>
        <li>
          Expect the file size to drop <strong>between 85 and 95%</strong>{' '}
          depending on the settings. For example, a 767 MB MP4 file shrinks to
          104.5 MB (or an 88% drop), and that&rsquo;s with the highest bitrate
          setting. Using the default setting, the file size shrinks to 49.8 MB.
          Remember that the higher the bitrate, the larger the file size.
        </li>
        <li>
          <strong>Audio quality doesn&rsquo;t change</strong>, even with the
          default setting.
        </li>
        <li>
          The length won&rsquo;t change, so a 30-minute video will stay at 30
          minutes.
        </li>
        <li>
          Video data like subtitles, markers, and thumbnails are deleted since
          MP3 doesn&rsquo;t support these.
        </li>
        <li>
          Users can convert <strong>up to 1,000 files per batch</strong>.
          However, for larger files, keep the batches down to around 50 or
          less, especially if you&rsquo;re using an older computer with less
          memory.
        </li>
      </ol>

      <h2>Quality settings, explained simply</h2>
      <p>
        Bitrate means <strong>how much data the MP3 file stores per second</strong>.
        The higher the bitrate, the better the sound (in theory), but at the
        expense of a larger file.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm text-fg-muted">
          <thead>
            <tr className="border-b border-border text-left text-fg">
              <th className="py-2 pr-4 font-semibold">Setting</th>
              <th className="py-2 pr-4 font-semibold">Bitrate</th>
              <th className="py-2 font-semibold">Best for</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><strong>Standard</strong> <em>(default)</em></td>
              <td className="py-2 pr-4">128 kbps</td>
              <td className="py-2">Voice memos, lectures, podcasts where you only need to understand the words. Small files.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><strong>Good</strong></td>
              <td className="py-2 pr-4">192 kbps</td>
              <td className="py-2">Almost everything. Music, interviews, mixed content. Sounds the same as the source to most people.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><strong>High</strong></td>
              <td className="py-2 pr-4">256 kbps</td>
              <td className="py-2">Music you&rsquo;ll listen to on good headphones or a stereo.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><strong>Maximum</strong></td>
              <td className="py-2 pr-4">320 kbps</td>
              <td className="py-2">Max quality MP3. For archiving. Barely different from Good in blind tests.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        If you&rsquo;re not sure what option to choose, leave it on the default
        setting. It will sound fine most of the time.
      </p>

      <h2>How MP4-to-MP3 conversion actually works (the simple version)</h2>
      <p>
        Imagine an MP4 file being <strong>a box that has two containers inside</strong>:
        one for video and another for audio. Converting an MP4 file to an MP3
        format consists of two steps:
      </p>
      <ol>
        <li>
          The first step is opening the audio container and throwing away the
          video container. The first step is instant. You&rsquo;re just copying
          what&rsquo;s already there.
        </li>
        <li>
          The next step is re-encoding the audio container in MP3 format since
          MP4 uses an AAC format, which is different.
        </li>
      </ol>
      <p>
        This tool utilizes <strong>ffmpeg.wasm</strong>, a WebAssembly version
        of ffmpeg. This is the same tool that professionals use for video and
        audio encoding. The difference for ConvertYard is that this tool runs
        in your browser instead of on a server.
      </p>

      <h2>Why does &ldquo;in your browser&rdquo; matter?</h2>
      <p>
        Most free MP4 to MP3 converters upload your video to their server,
        convert it there, and send you a link to download the converted file.
        This means.
      </p>
      <ul>
        <li>Your video file is stored on someone&rsquo;s computer</li>
        <li>
          If it&rsquo;s a large video, you&rsquo;ll need to wait for the video
          to upload first before the conversion process starts.
        </li>
        <li>
          Large files (e.g., lectures or long recordings) may hit a file size
          cap
        </li>
        <li>
          Private recordings that may contain confidential information are
          uploaded to an unknown server.
        </li>
      </ul>
      <p>
        ConvertYard runs the conversion inside your browser so{' '}
        <strong>nothing is uploaded</strong>. Your MP4 files stay on your
        computer. It&rsquo;s faster, more private, and will handle large files
        if your computer has enough memory.
      </p>

      <h2>When you should NOT use this tool</h2>
      <p>
        There are instances where you shouldn&rsquo;t use this tool and other
        formats are better.
      </p>
      <ul>
        <li>
          You&rsquo;ll need to edit the audio first. If you use a{' '}
          <Link href="/mp3-to-wav">WAV format</Link> (which is lossless), you
          may want to stick to it so you don&rsquo;t lose audio quality while
          editing.
        </li>
        <li>
          You need the smallest possible audio format for a podcast recording.
          If that&rsquo;s the case, try using{' '}
          <Link href="/mp3-to-aac">ACC/M4A</Link> at 64 kpbs, which is smaller
          than an MP3 file at the same quality.
        </li>
        <li>
          If you need to store the whole video and not just the audio, try
          using the <Link href="/compress-video">Compress Video</Link> tool
          instead.
        </li>
        <li>
          Your MP4 file has no audio. This tool will return an error that says
          the video doesn&rsquo;t have an audio track.
        </li>
      </ul>
    </div>
  )
}
