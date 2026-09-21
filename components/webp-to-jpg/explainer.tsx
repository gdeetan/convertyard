import Link from 'next/link'

export function WebpToJpgExplainer() {
  return (
    <div>
      <h2>Why you&rsquo;re probably here</h2>
      <p>
        You have WebP files and something you&rsquo;re trying to use them with just won&rsquo;t
        accept them. Usually it&rsquo;s one of these:
      </p>
      <ul>
        <li>A WordPress upload or plugin throwing &ldquo;file type not permitted&rdquo;</li>
        <li>An MLS or real estate portal that only takes JPG</li>
        <li>A print shop or photo lab uploader</li>
        <li>Etsy, eBay, or a marketplace listing form</li>
        <li>An older version of Word, PowerPoint, or Keynote refusing to embed the image</li>
        <li>A client, colleague, or teacher who asked for JPG specifically</li>
        <li>An email client showing a broken-image icon instead of your attachment</li>
      </ul>
      <p>
        WebP is more efficient and modern browsers handle it fine, but a surprising number of
        business tools still don&rsquo;t. Converting to JPG makes the file work everywhere, at the
        cost of a bigger file. That trade is worth it when you&rsquo;re stuck.
      </p>

      <h2>What happens to your image</h2>
      <p>
        <strong>File size goes up.</strong> Usually 25&ndash;35% larger than the WebP you started
        with. JPG is older and less efficient &mdash; that&rsquo;s expected, not a bug.
      </p>
      <p>
        <strong>Transparency gets filled.</strong> JPG can&rsquo;t hold transparent pixels. Any
        transparent areas in your WebP become solid white in the JPG. If you need to keep
        transparency, use <Link href="/webp-to-png">WebP to PNG</Link> instead.
      </p>
      <p>
        <strong>Animation gets flattened.</strong> Animated WebPs only keep the first frame. JPG
        is a still-image format.
      </p>
      <p>
        <strong>Quality drops a little.</strong> You&rsquo;re re-encoding an already-compressed
        file, so there&rsquo;s a small generational loss. At the default quality (90) it&rsquo;s
        invisible to the eye. Bump to 95 if the source matters &mdash; product photography,
        portfolio work, anything that&rsquo;ll be printed large.
      </p>
      <p>
        <strong>EXIF metadata carries over.</strong> Camera model, date, GPS coordinates, color
        profile &mdash; all preserved unless you turn on &ldquo;Strip metadata.&rdquo; Turn it on
        if you&rsquo;re sharing publicly and don&rsquo;t want the location baked into the file.
      </p>

      <h2>When you should NOT convert</h2>
      <p>If nothing is complaining, don&rsquo;t convert. WebP is supported by:</p>
      <ul>
        <li>Every modern browser (Chrome, Edge, Firefox, Safari 14+)</li>
        <li>Discord, Slack, Microsoft Teams</li>
        <li>Google Drive, Dropbox, OneDrive (they&rsquo;ll preview and share fine)</li>
        <li>iOS 14+ and modern Android</li>
        <li>Notion, Figma, Canva</li>
      </ul>
      <p>
        Converting &ldquo;just in case&rdquo; only makes your files bigger. Convert when you hit
        an actual wall.
      </p>

      <h2>Quality setting cheat sheet</h2>
      <ul>
        <li>
          <strong>95&ndash;100</strong> &mdash; archival, print, portfolio, anything getting
          edited further
        </li>
        <li>
          <strong>90</strong> (default) &mdash; the safe general-purpose setting; visually
          identical to the source
        </li>
        <li>
          <strong>80&ndash;85</strong> &mdash; web thumbnails, social posts, faster loads on
          image-heavy pages
        </li>
        <li>
          <strong>Below 75</strong> &mdash; only if you need a hard file-size cap; expect visible
          softness on detailed images
        </li>
      </ul>
    </div>
  )
}
