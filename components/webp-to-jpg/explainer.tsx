import Link from 'next/link'

export function WebpToJpgExplainer() {
  return (
    <div>
      <h2>Why you&rsquo;re probably here</h2>
      <p>
        You have WebP files and something you&rsquo;re trying to use them with
        just won&rsquo;t accept them. Usually it&rsquo;s one of these:
      </p>
      <ul>
        <li>A WordPress upload or plugin throwing &ldquo;file type not permitted&rdquo;</li>
        <li>An MLS or real estate portal that only takes JPG</li>
        <li>A print shop or photo lab uploader</li>
        <li>Etsy, eBay, or a marketplace listing form</li>
        <li>
          An older version of Word, PowerPoint, or Keynote embedding images
          and not allowing WebP.
        </li>
        <li>
          A client, colleague, or teacher that specifically asked for JPG
          files to view your online work.
        </li>
        <li>A broken-image icon in your email.</li>
      </ul>
      <p>
        Converting your WebP image to JPG is the most common way to make sure
        your image file will work with business tools. Modern browsers can
        handle WebP images, but there are many tools in use today that are not
        yet modern enough to handle this image type.
      </p>

      <h2>What happens to your image</h2>
      <p>
        <strong>File size increases</strong> &mdash; up to 25% to 35% in
        comparison to the original WebP file. JPG is less efficient in terms
        of file size than WebP.
      </p>
      <p>
        <strong>The inability to preserve transparency.</strong> Transparency
        in WebP will be filled with white when converting to JPG. If you need
        to keep the transparency, use <Link href="/webp-to-png">WebP to PNG</Link> instead.
      </p>
      <p>
        <strong>Animated WebPs are rendered as single frames</strong> with the
        first frame displayed. Therefore, JPG is a poor format to convert
        animated images to.
      </p>
      <p>
        Note that you are also re-encoding the image; thus, there is a small
        amount of quality loss when converting to JPG, which is already a
        highly compressed format. However, by default, converting from WebP
        to JPG uses a quality of 90, which is not distinguishable from the
        original. To ensure the converted JPG is high enough quality, for
        images taken for reasons other than Throwaway-Instagram-post, you can
        bump the quality to 95. Typically, product shots, for example, are
        converted this way for print.
      </p>
      <p>
        EXIF data such as camera model, shoot date, GPS coordinates, and even
        color profile (i.e., sRGB) are preserved when converting to JPG and
        can be stripped with the option to &lsquo;Strip metadata&rsquo; should
        you be sharing publicly and not want images to include location
        information, for example.
      </p>

      <h2>When you should NOT convert</h2>
      <p>
        If nothing is complaining, then there is no need to convert it. WebP
        is supported by:
      </p>
      <ul>
        <li>Every modern browser (Chrome, Edge, Firefox, Safari 14+)</li>
        <li>Discord, Slack, Microsoft Teams</li>
        <li>Google Drive, Dropbox, OneDrive</li>
        <li>iOS 14+ and modern Android</li>
        <li>Notion, Figma, Canva</li>
      </ul>
      <p>
        Convert only when you hit a wall with WebP files; otherwise, your
        files will only get bigger.
      </p>

      <h2>Quality setting cheat sheet</h2>
      <ul>
        <li>
          <strong>95&ndash;100</strong> &mdash; archival, print, portfolio,
          anything getting edited further
        </li>
        <li>
          <strong>90</strong> (default) &mdash; the safe general-purpose
          setting; visually identical to the source
        </li>
        <li>
          <strong>80&ndash;85</strong> &mdash; web thumbnails, social posts,
          faster loads on image-heavy pages
        </li>
        <li>
          <strong>Below 75:</strong> For very small images where hard file
          size limits are in place, these qualities will start to look soft on
          high detail images.
        </li>
      </ul>
    </div>
  )
}
