export function Mp3ToMp4Explainer() {
  return (
    <div>
      <h2>What is an MP3 file?</h2>
      <p>
        Originally, MP3s weren&rsquo;t developed for what you use them for
        today. An MP3 (MPEG-1 Audio Layer III) is a compressed audio format
        developed between 1982 and 1992 by the Fraunhofer Society in Germany
        to compress high-quality music into low-bandwidth digital phone lines
        (ISDN). Then, in 1995, as the digital boom began, the Fraunhofer
        Institute officially adopted the MP3 extension.
      </p>
      <p>
        But it was not until 1997 that the format really exploded. An
        Australian student had bought Fraunhofer&rsquo;s professional-grade
        MP3 encoder cheaply with a stolen credit card. He then decompiled the
        software and uploaded a cracked version to an FTP server of a US
        university under the comment &ldquo;This is freeware thanks to
        Fraunhofer.&rdquo; The cheap-encoder genie was out of the bottle.
        From then on, everyone could rip their CDs to MP3s.
      </p>

      <h2>What is an MP4 file?</h2>
      <p>
        MP4 (or MPEG-4 Part 14) is a container file format, meaning it can
        hold a video track, audio track, subtitles, and metadata. It was
        developed in 2001 by the Moving Pictures Expert Group, the same
        people who standardized the MP3 format. MP4 was built on
        Apple&rsquo;s QuickTime Format, which is why MP4 and MOV files are
        similar under the hood.
      </p>
      <p>
        Most of the videos you see online use an MP4 format. Videos on
        YouTube, TikTok Clips, or Zoom exports. The audio inside is encoded
        as AAC, a newer, more efficient version of MP3. MP4 is the default
        option for most content creators because it&rsquo;s widely
        compatible across platforms like YouTube, Facebook, and Instagram.
        All these websites accept this format.
      </p>

      <h2>Why would you convert MP3 to MP4?</h2>
      <p>
        One reason would be compatibility. Platforms like YouTube, TikTok,
        Facebook, or LinkedIn will accept a pure audio format like MP3.
        These websites only accept MP4. So if you only have an audio
        recording of your podcast and you want to upload it to any of
        these websites, you&rsquo;ll need to convert it to an MP4 format
        and add a cover image, captions, or waveforms to make it more
        interactive.
      </p>
      <p>
        If you want to expand your podcast to YouTube, which has billions
        of visits per month from users searching for content, including
        podcasts, this tool will help you upload your audio content.
      </p>
      <p>
        Adding captions is another useful feature I added to this tool,
        since audio-only podcast platforms don&rsquo;t offer it. A certain
        percentage of social media video content is watched muted, so
        captions help people stay engaged and watch your video muted.
      </p>

      <h2>What happens to your audio during conversion?</h2>
      <p>
        There are several things happening. First, the audio is re-encoded
        from MP3 to AAC at 192 kbps. AAC is a standard codec used in MP4
        and has near-universal compatibility on different devices, and
        people won&rsquo;t be able to distinguish it from MP3 in terms of
        quality.
      </p>
      <p>
        Second, a video track is added and encoded as a single-frame H.264
        stream for the whole video. It can be a still image (black screen,
        colored, or a cover image). Depending on what option you choose,
        it only adds a few megabytes to the file size.
      </p>
      <p>
        Third, captions are burned into the video if you enable them, and
        they are encoded in every frame. These will be shown with the
        video on every player without uploading another file.
      </p>

      <h2>When you should NOT convert</h2>
      <p>
        If the website you&rsquo;re uploading to only accepts MP3 format,
        like podcasts (e.g., Libsyn, Transistor, Apple, or Spotify),
        there&rsquo;s no need to convert since these platforms do not
        accept MP4.
      </p>

      <h2>How this tool is different</h2>
      <p>
        Most MP3 to MP4 converters are cloud-based, meaning you&rsquo;ll
        need to upload your MP3 file to a server, which can take several
        minutes for large files, before the conversion starts; then
        you&rsquo;ll need to download the converted file through a link.
      </p>
      <p>
        With ConvertYard, your files aren&rsquo;t uploaded. They are
        converted inside the browser using WebAssembly and WebCodecs
        &mdash; the same technology for in-browser video editing.
        There&rsquo;s no need to wait in a queue. Doing this locally means
        there are no file size limits, since nothing is uploaded. You can
        convert files over 1 gigabyte. The only limiting factor is the
        speed and memory of your device. Since it&rsquo;s local,
        there&rsquo;s no privacy risk, especially if your MP3 file
        contains music, confidential interviews, or personal recordings,
        from being leaked in the case of a data breach.
      </p>
    </div>
  )
}
