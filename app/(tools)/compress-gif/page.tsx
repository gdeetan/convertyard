'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/compress-gif'

const howToCompressGifSection = (
  <section>
    <h2 className="text-2xl font-semibold text-fg">How to Compress a GIF</h2>

    <p className="mt-4 text-base text-fg-muted">
      Compressing a GIF shrinks its file size so it fits inside Slack,
      Discord, email attachment limits, and CMS uploaders that reject
      anything over a few megabytes. The tricky part is doing that
      without turning smooth motion into a slideshow or introducing
      color banding on gradients. ConvertYard runs a WebAssembly build
      of <em>gifsicle</em> — the same optimizer most command-line tools
      use — entirely in your browser, so you can compress hundreds of
      GIFs at once without uploading a single byte.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      Unlike online GIF compressors that limit you to one file at a
      time or lock target-size mode behind a signup, this tool combines
      lossy compression, palette reduction, and frame drop in a single
      pass. Presets cover the common cases; the Advanced tab exposes
      every knob for tuning specific files.
    </p>

    <p className="mt-6 text-base text-fg-muted">
      Suggested workflow:
    </p>

    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
      <li>
        Drop 1 to 1,000 animated or static GIFs. The tool accepts
        anything with a <code>.gif</code> extension.
      </li>
      <li>
        Pick a preset — Balanced is the sweet spot for most GIFs — or
        set a target file size in KB or MB. Target-size mode
        binary-searches the lossy level in up to 6 passes to hit within
        5% of your goal.
      </li>
      <li>
        For manual control, open the Advanced tab and toggle{' '}
        <em>Use manual settings</em>. Adjust the lossy slider (0–200),
        palette size (32/64/128/256 colors), frame-drop ratio, and
        dithering.
      </li>
      <li>
        Click Compress. The batch runs in parallel across your CPU
        cores, capped at 4 concurrent files to keep memory predictable.
        Each row shows per-file progress and final % saved.
      </li>
      <li>
        Preview the compressed animation side-by-side with the original
        — both loop natively in the browser so you can spot motion or
        color artifacts before downloading.
      </li>
      <li>
        Download files individually or grab everything as a single ZIP.
      </li>
    </ol>

    <p className="mt-6 text-base text-fg-muted">
      If your GIF is really a short video clip and the <code>.gif</code>{' '}
      extension isn&rsquo;t a hard requirement, converting to modern
      video formats shrinks the file by 90%+ with better playback
      quality. Try{' '}
      <a href="/gif-to-mp4/" className="text-primary underline hover:text-primary-hover">
        GIF to MP4
      </a>{' '}
      or{' '}
      <a href="/gif-to-webp/" className="text-primary underline hover:text-primary-hover">
        GIF to WebP
      </a>{' '}
      instead — same motion, tiny fraction of the size.
    </p>

    <div className="mt-12 border-t border-border pt-8">
      <p className="text-base text-fg-muted">
        Compress large GIF animations to a more manageable size. Select
        or drag/drop files, select a compression level or a target size,
        then download. Everything is compressed in the browser. Nothing
        is uploaded.
      </p>

      <h3 className="mt-8 text-xl font-semibold text-fg">
        What is a GIF and what does this tool do?
      </h3>
      <p className="mt-4 text-base text-fg-muted">
        GIF functions like a flipbook. Basically, it&rsquo;s a bunch of
        photos stitched together that play in a loop. And that flipbook
        can get huge, especially with more images and colors added.
        Large GIFs look nice, but their file size can make it difficult
        to share on social media or even on your website.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        This is where this tool comes into play. It reduces the quality
        of the images that make up the loop and reduces the number of
        colors encoded in the file to reduce the file size, so you can
        send these files through apps like Discord, as attachments
        through email, add them to a post on your WordPress-powered
        website, or send them as a text message.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        You can batch compress these files, up to 1,000 per batch.
      </p>

      <h3 className="mt-8 text-xl font-semibold text-fg">What to expect?</h3>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>
          Animated GIFs will be compressed between 30 and 80%, based on
          tests. But take note that at 80% compression, there will be
          noticeable quality loss.
        </li>
        <li>
          Non-animated (or still) GIFs will be compressed between 30 and
          60%. Again, these are based on my tests, and the aggressive
          option will have noticeable quality degradation.
        </li>
        <li>Animation will play at the same speed (no frames are removed).</li>
        <li>
          Users will see a side-by-side preview before the compression,
          so they can adjust the settings and preview the result.
        </li>
        <li>
          If you need more compression, I suggest using the WebP file
          format, which offers better compression. Check the{' '}
          <a href="/gif-to-webp/" className="text-primary underline hover:text-primary-hover">
            GIF-to-WebP converter
          </a>.
        </li>
      </ol>

      <h3 className="mt-8 text-xl font-semibold text-fg">
        The compression options (explainer)
      </h3>
      <p className="mt-4 text-base text-fg-muted">
        There are four presets. Select one and go. There&rsquo;s no need
        to touch anything else.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-bg-subtle">
            <tr>
              <th className="border-b border-border px-4 py-3 font-semibold text-fg">Preset</th>
              <th className="border-b border-border px-4 py-3 font-semibold text-fg">What it does</th>
              <th className="border-b border-border px-4 py-3 font-semibold text-fg">When to use it</th>
            </tr>
          </thead>
          <tbody className="text-fg-muted">
            <tr className="border-b border-border">
              <td className="px-4 py-3 align-top"><strong className="text-fg">Light</strong></td>
              <td className="px-4 py-3 align-top">Barely touches the GIF. You won&rsquo;t see any change.</td>
              <td className="px-4 py-3 align-top">When quality matters more than size.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-3 align-top"><strong className="text-fg">Balanced</strong> <em>(default)</em></td>
              <td className="px-4 py-3 align-top">Big size drop, still looks great.</td>
              <td className="px-4 py-3 align-top">Almost every situation. Start here.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-3 align-top"><strong className="text-fg">Strong</strong></td>
              <td className="px-4 py-3 align-top">Smaller file, uses fewer colors. Slight banding on smooth gradients.</td>
              <td className="px-4 py-3 align-top">When Balanced isn&rsquo;t small enough.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top"><strong className="text-fg">Extreme</strong></td>
              <td className="px-4 py-3 align-top">Drops every other frame so the file is much smaller. Motion looks a little choppier.</td>
              <td className="px-4 py-3 align-top">When you really need it tiny and choppy motion is okay.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-base text-fg-muted">
        Another option is selecting a target size if you need to
        compress a GIF to a specific number. Select a preset between
        256 KB and 8 MB, or type a custom size.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        <em>Disclaimer:</em> This doesn&rsquo;t guarantee that the tool
        will compress the file to that exact size, but it tries to get
        close to it. That&rsquo;s how this compressor was programmed to
        maintain GIF quality.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        This is handy if you need to use platforms like Slack (8 MB free
        plan limit) or Discord (10 MB per file limit), or send the GIF
        file as an email attachment (10 to 25 MB depending on provider
        and server settings).
      </p>

      <h3 className="mt-8 text-xl font-semibold text-fg">
        Manual controls (for users who love to tweak)
      </h3>
      <p className="mt-4 text-base text-fg-muted">
        Turn on the &ldquo;manual settings&rdquo; if you want full
        control of the compression. Here&rsquo;s what each slider does
        in plain English.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>
          <strong>Lossy level (0&ndash;200):</strong> Think of this
          setting as a compressor dial. A higher number equates to a
          smaller file size. However, anything past 140, you&rsquo;ll
          see blocky patches in smooth areas like gradients. The sweet
          spot for compression and quality is 80.
        </li>
        <li>
          <strong>Palette size (32&ndash;256 colors):</strong> GIF files
          can use a maximum of 256 colors. Fewer colors mean a smaller
          file, but the smooth transitions can turn into pixelated
          stripes. Select 256 if you want to maintain image quality.
          Lowering it to 32 will make it look like an old poster.
        </li>
        <li>
          <strong>Frame drop:</strong> As I said in the intro, GIFs
          function like flipbooks. Removing every other image in this
          flipbook reduces the file size by half. The animation plays
          at roughly the same speed, but the movement isn&rsquo;t as
          smooth &mdash; it skips.
        </li>
        <li>
          <strong>Dither:</strong> Using fewer colors can create ugly
          spots, usually on the hands, skin, sky, or shadows. Dither
          sprinkles tiny dots into these areas to hide those ugly
          spots. File size will be bigger, but the gradients will look
          smoother.
        </li>
      </ol>

      <h3 className="mt-8 text-xl font-semibold text-fg">
        How does GIF compression actually work?
      </h3>
      <p className="mt-4 text-base text-fg-muted">
        To understand GIF compression, let&rsquo;s first look at the
        components of a GIF.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>Frames (or pictures)</li>
        <li>Color palette (or colors it&rsquo;s allowed to use)</li>
        <li>Frame rate (how long each photo stays on screen)</li>
      </ol>
      <p className="mt-4 text-base text-fg-muted">
        To compress an animated GIF, we need to squeeze one or more of
        these:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>
          <strong>Reuse pixels across all frames:</strong> In most
          animations, there are portions of an image that don&rsquo;t
          change (like the background). So we tell the file to
          &ldquo;keep whatever is there before&rdquo; instead of
          storing the pixels again. This is called &ldquo;lossy
          interframe compression,&rdquo; and it&rsquo;s where the most
          file savings come from.
        </li>
        <li>
          <strong>Use fewer colors:</strong> GIF selects from a color
          palette. Reducing 256 to 128 colors cuts the file size in
          half. Choosing a lower setting offers more savings, but the
          image starts to look clunky.
        </li>
        <li>
          <strong>Drop some frames:</strong> For example, the animated
          GIF has 30 frames; retaining only 15 of them cuts the file
          size in half. The animation will run at the same speed, but
          has fewer pages on the &ldquo;flipbook.&rdquo;
        </li>
      </ol>
      <p className="mt-4 text-base text-fg-muted">
        Under the hood, this tool uses a WebAssembly version of
        &ldquo;gifsicle.&rdquo; It&rsquo;s the same code most
        professional GIF optimizers use. The only difference is that
        this one runs in the browser instead of on a server.
      </p>

      <h3 className="mt-8 text-xl font-semibold text-fg">
        Why does &ldquo;in your browser&rdquo; matter?
      </h3>
      <p className="mt-4 text-base text-fg-muted">
        Most free GIF compressors I see online upload your files to the
        server, compress them there, then you download the compressed
        version, and this means:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>Your animation is stored on a stranger&rsquo;s computer.</li>
        <li>You have to wait for the file to upload, then download.</li>
        <li>Large files hit a file size cap.</li>
        <li>Your files are exposed in case of a data breach.</li>
      </ol>
      <p className="mt-4 text-base text-fg-muted">
        ConvertYard compresses GIF animations inside the browser. So
        nothing is uploaded to a server. It&rsquo;s faster and works on
        larger files as long as your computer&rsquo;s video processor
        memory can handle (usually a few hundred megabytes).
      </p>
    </div>
  </section>
)

export default function Page() {
  return <ToolShell config={config} afterHowItWorks={howToCompressGifSection} />
}
