'use client'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/compress-png'

const howToCompressPngSection = (
  <section>
    <div>
      <p className="text-base text-fg-muted">
        Compress bulky PNG files to a more manageable size without
        uploading files to an unknown server. Open or drop one PNG file
        or up to a thousand per batch, select a preset or enter a target
        size, compress, then download. Transparency will be preserved
        (for transparent PNGs).
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-fg">
        What is a PNG file?
      </h2>
      <p className="mt-4 text-base text-fg-muted">
        A PNG file (Portable Network Graphics) is an image format created
        as a free alternative to{' '}
        <a href="/compress-gif/" className="text-primary underline hover:text-primary-hover">GIF</a>{' '}
        after Unisys announced it would charge royalties for software
        that read or processed LZW (a compression algorithm GIF files
        used). Basically, every browser, graphics software, or website
        would owe money to Unisys if it used a GIF file.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        PNG files are lossless, meaning every pixel is stored as is.
        There&rsquo;s no quality loss even after saving them again and
        again, unlike JPG files, which get blurrier with each re-save
        because a small portion of the pixels get distorted. Another
        advantage of PNG over lossy formats like JPG is that it supports
        transparent backgrounds. This is great for logos, icons,
        screenshots, and anything that needs crisp, clear graphic lines
        or text with no distortion.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        Unfortunately, PNG&rsquo;s lossless nature means larger file
        sizes. For example, a screenshot that&rsquo;s around 180 KB could
        balloon to over 1.5 MB if saved as a PNG file. A whole folder of
        UI screenshots for a knowledge base for a software company would
        mean hundreds of megabytes, if not gigabytes, of storage wasted,
        which adds up to higher hosting costs, in addition to
        slow-loading websites that get penalized by Google.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        This tool aims to address that.
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-fg">
        How to compress PNG files?
      </h2>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>
          <strong>Open or drop PNG files:</strong> You can open a single
          PNG file or batches of up to 1,000 files. For larger PNG files,
          lower that number to 100&ndash;200.
        </li>
        <li>
          <strong>Choose a preset:</strong> The balanced option is a good
          starting point for most PNG files. If you need more compression,
          choose Strong. If you have a target size in mind, switch to
          &ldquo;Target size&rdquo; and enter your target number.
        </li>
        <li>
          <strong>Preview result:</strong> You can see a preview of how
          the image would look before it&rsquo;s compressed. If
          you&rsquo;re happy with the results, proceed and compress the
          files.
        </li>
        <li>
          <strong>Download:</strong> You can download the files
          individually or everything at once as a ZIP file.
        </li>
      </ol>
      <p className="mt-4 text-base text-fg-muted">
        Nothing is uploaded to a server, so you can compress project files
        or confidential screenshots without worrying about anyone stealing
        your ideas.
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-fg">What to expect</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-fg-muted">
        <li>
          Typically, PNG files will compress between 60 and 80% using the
          Balanced preset. The biggest beneficiaries would be screenshots
          or UI images at the higher end of that range. Unfortunately,
          photographs or images with more complex graphics compress less.
        </li>
        <li>
          Images with fewer colors will compress by 85% or more without
          visual degradation.
        </li>
        <li>
          PNG files with a transparent background will be preserved by
          default, as well as the dimensions, unless specified. So a
          2,000 &times; 2,000 pixel PNG file will retain the same
          dimensions but at a smaller file size.
        </li>
        <li>
          This tool will work even on PNG files a few hundred megabytes,
          but that would depend on how much memory your system has. If
          your computer has less memory, the browser may stall, which can
          also happen with graphics software like Adobe.
        </li>
        <li>
          After compressing, you&rsquo;ll see the total number of KB
          saved, average percentage, and the number of files processed.
        </li>
      </ul>

      <h2 className="mt-8 text-2xl font-semibold text-fg">
        The compression options (explainer)
      </h2>
      <p className="mt-4 text-base text-fg-muted">
        There are four presets available. Choose one and compress. In
        most cases, you don&rsquo;t need to touch anything else.
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
              <td className="px-4 py-3 align-top">Small size drop, no visible change.</td>
              <td className="px-4 py-3 align-top">When you need to preserve the original quality as closely as possible.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-3 align-top"><strong className="text-fg">Balanced</strong> <em>(default)</em></td>
              <td className="px-4 py-3 align-top">Big size drop, still looks great.</td>
              <td className="px-4 py-3 align-top">Almost every situation. Start here.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-3 align-top"><strong className="text-fg">Strong</strong></td>
              <td className="px-4 py-3 align-top">Smaller file, uses fewer colors. Faint banding on smooth gradients.</td>
              <td className="px-4 py-3 align-top">When Balanced isn&rsquo;t small enough.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 align-top"><strong className="text-fg">Extreme</strong></td>
              <td className="px-4 py-3 align-top">Aggressive palette reduction. Visible banding on photos and gradients.</td>
              <td className="px-4 py-3 align-top">When you really need it tiny and can accept the tradeoff.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 text-xl font-semibold text-fg">Target size mode</h3>
      <p className="mt-4 text-base text-fg-muted">
        Only switch to &ldquo;Target size&rdquo; mode if you need to
        compress the PNG file to a specific file size in KB or MB. The
        default range is 256 KB to 8 MB. You can type a custom number in
        KB or MB.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        <em>Disclaimer:</em> This feature doesn&rsquo;t guarantee the
        tool will compress PNG files to this exact size, but it tries to
        get as close as possible. Doing this helps maintain quality while
        compressing the file. It&rsquo;s useful if you need to meet an
        upload limit, like Slack&rsquo;s 25 MB message cap or an email
        attachment limit.
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-fg">
        Manual controls (for users who love to tweak)
      </h2>
      <p className="mt-4 text-base text-fg-muted">
        Turn on the &ldquo;Manual settings&rdquo; tab if you want full
        control. Here&rsquo;s a brief explanation of what each one means.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>
          <strong>Quality (0&ndash;100):</strong> The higher the setting,
          the better the image quality, but at the cost of file size.
          The lower the setting, the higher the compression but at the
          expense of image quality. The sweet spot for most PNG files is
          between 65 and 80. Anything lower than 40, and you&rsquo;ll
          start to see patchy areas.
        </li>
        <li>
          <strong>Palette size (16&ndash;256 colors):</strong> PNG files
          can store up to 256 distinct colors. Fewer colors translate to
          a smaller file size, but smooth gradients won&rsquo;t be as
          smooth and will turn into stripes. For the best quality, leave
          it at 256 for logos or more complex illustrations.
        </li>
        <li>
          <strong>Preserve transparency:</strong> It is self-explanatory.
          Leave it on to retain the transparent background. If you want
          more compression and a flat background, turn it off.
        </li>
        <li>
          <strong>Strip metadata:</strong> This feature removes EXIF
          data, color profiles, and other text data stored (like the
          software used to create the graphic). This saves additional
          space, and I suggest turning it on if you&rsquo;re sharing the
          PNG file on a website.
        </li>
      </ol>

      <h2 className="mt-8 text-2xl font-semibold text-fg">
        How does PNG compression actually work?
      </h2>
      <p className="mt-4 text-base text-fg-muted">
        PNG compression has two layers, and this tool uses both.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        The first layer is called &ldquo;Palette quantization
        (lossy).&rdquo; Typically, a PNG file stores millions of possible
        colors per pixel, and most images don&rsquo;t need to use all of
        them. Quantization reviews the image, selects the 256 (or fewer)
        colors that best represent it, then rewrites every pixel to use
        each one of those colors. If done properly, you won&rsquo;t
        notice the difference. This is where most file savings come from,
        usually chopping 60 to 80% off the original file size.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        The second layer is called Zlib re-encoding (lossless). After the
        first layer (or the quantization process), the file is still
        valid PNG data, but it&rsquo;s still not as compact as it could
        be. A second pass inspects the file and tries dozens of
        compression strategies, and chooses the smallest result.
        There&rsquo;s no pixel change, and this typically shaves another
        5&ndash;15% of unnecessary bloat.
      </p>
      <p className="mt-4 text-base text-fg-muted">
        This tool uses WebAssembly builds of &ldquo;pngquant&rdquo;
        (layer 1) and &ldquo;oxipng&rdquo; (layer 2), which is the same
        stack that tools like ImageOptim, TinyPNG, and Squoosh.app use.
        The only difference is that ConvertYard runs it in your browser
        and not on another server.
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-fg">
        Why &ldquo;in your browser&rdquo; matters
      </h2>
      <p className="mt-4 text-base text-fg-muted">
        Most free PNG compressors I tested upload your file to a server,
        compress it there, then provide a link to download it. So this
        means:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
        <li>Your PNG files are uploaded to a stranger&rsquo;s computer (at least temporarily).</li>
        <li>You&rsquo;ll need to wait for the files to upload first before compression (which takes longer if you&rsquo;re compressing larger files).</li>
        <li>Since these websites rely on a server to process images, they have a size cap (usually 5 to 10 MB per file).</li>
        <li>Your files are exposed if there is a data breach or leak.</li>
      </ol>
      <p className="mt-4 text-base text-fg-muted">
        ConvertYard runs the whole system inside the browser. Files
        aren&rsquo;t uploaded to a server. It processes larger files
        faster because you don&rsquo;t have to wait for the upload to
        finish, which is great if you have a slower connection. And
        there&rsquo;s no limit on how many PNG files you can compress as
        long as your computer&rsquo;s memory can handle it. For larger
        PNG files, I would recommend limiting it to 100 to 200 per batch,
        lower for high-resolution files.
      </p>
    </div>
  </section>
)

export default function Page() {
  return <ToolShell config={config} afterHowItWorks={howToCompressPngSection} />
}
