export function ExifViewerExplainer() {
  return (
    <div>
      <h2>What is EXIF?</h2>
      <p>
        EXIF (Exchangeable Image File Format) – Metadata embedded in Images by Cameras: EXIF
        (short for &ldquo;Exchangeable Image File Format&rdquo;) is a block of metadata that many
        Cameras, Phones, etc. add to the images they shoot. It contains lots of information, like
        the timestamp of when it was taken, where, how, with which settings the picture was shot.
        (Lobisser, 2014)
      </p>

      <h2>What metadata is in your photo?</h2>
      <ul>
        <li>Camera &amp; lens: make, model, serial number, lens model</li>
        <li>Exposure settings: ISO value, aperture value, shutter speed, focal length, Flash settings.</li>
        <li>GPS: latitude, longitude, altitude, compass direction, timestamp</li>
        <li>Software: operating system, editing app, edit history</li>
        <li>IPTC: photographer name, copyright, caption, keywords</li>
        <li>AI provenance: C2PA content credentials, Stable Diffusion prompts, Midjourney job IDs</li>
      </ul>

      <h2>Why check EXIF before sharing photos online</h2>
      <p>
        This means that a seemingly innocuous photo of your living room could contain the exact
        latitude and longitude of your home in the EXIF data, while a studio shot of an object
        could contain your full name in the copyright field of the EXIF data. Your phone&rsquo;s
        serial number can also be included in the EXIF data of photos taken with your phone,
        which means every image you post online could potentially be tracked back to you and that
        specific phone.
      </p>

      <h2>How to check if a photo is AI-generated</h2>
      <p>Look for four things:</p>
      <ol>
        <li>A C2PA / Content Credentials manifest (Adobe, OpenAI, Microsoft ship these).</li>
        <li>A PNG <code>parameters</code> or <code>workflow</code> chunk (Stable Diffusion, ComfyUI).</li>
        <li>A <code>dc:creator</code> or <code>xmp:CreatorTool</code> reference to Midjourney, DALL&middot;E, Firefly or Ideogram.</li>
        <li>The <code>Software</code> tag matching a known generator.</li>
      </ol>
      <p>
        This viewer automatically detects all four of these. Note that metadata can easily be
        stripped from an image, so absence of these indicators does not mean the image was made
        by a human.
      </p>

      <h2>Why some image URLs don&rsquo;t work</h2>
      <p>
        CORS stands for Content Options Request Security and is enforced by browsers. It is up to
        the web site whether other pages on the web can fetch images stored on that web site.
        Some image hosting web sites like Imgur, Wikipedia (user-contributed images), GitHub
        (user-uploaded images), and Unsplash allow retrieval of images uploaded by users. Most
        social media sites (Twitter images, Instagram images, images posted to Reddit, Facebook
        images) block CORS on their Content Delivery Networks (CDNs) to prevent the image from
        being downloaded by other pages or scripts.
      </p>

      <h2>EXIF vs IPTC vs XMP</h2>
      <ul>
        <li>EXIF &mdash; camera-generated technical data (exposure, GPS, timestamps).</li>
        <li>IPTC &mdash; human-authored newsroom data (byline, caption, copyright).</li>
        <li>XMP (eXtensible Metadata Platform): a &ldquo;container&rdquo; managed by Adobe, that stores edit history, comments, etc. on images; it is also used to add &ldquo;modern&rdquo; fields, like those used to track AI generated images.</li>
      </ul>

      <h2>Which formats carry EXIF</h2>
      <ul>
        <li>Full support: JPEG, HEIC/HEIF, TIFF, RAW (CR2/NEF/ARW/DNG&hellip;)</li>
        <li>Partial (via XMP chunk): PNG, WebP, AVIF</li>
        <li>None: GIF, BMP, SVG</li>
      </ul>

      <h2>How ConvertYard reads EXIF locally</h2>
      <p>
        The JavaScript library{' '}
        <a href="https://mutiny.cz/exifr/" target="_blank" rel="noopener">exifr</a>{' '}
        is used to read the EXIF information of the local file. The file bytes are read using the
        browser&rsquo;s <code>FileReader</code> API and then passed straight to the parser. No
        upload, no server round-trip, no third-party analytics on the file itself. You can verify
        this by checking the DevTools&rsquo; &rarr; Network panel.
      </p>
    </div>
  )
}
