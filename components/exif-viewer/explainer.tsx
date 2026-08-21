export function ExifViewerExplainer() {
  return (
    <div>
      <h2>What is EXIF?</h2>
      <p>
        EXIF (Exchangeable Image File Format) is a block of metadata that most cameras and
        phones embed inside photos. It records how, when, and where the picture was taken —
        camera model, lens, shutter speed, ISO, timestamp, and often GPS coordinates. It rides
        along with the image bytes in JPEG, HEIC, TIFF, and RAW files; PNG, WebP, and AVIF can
        carry a partial equivalent via XMP.
      </p>

      <h2>What metadata is in your photo?</h2>
      <ul>
        <li><strong>Camera & lens:</strong> make, model, serial number, lens model</li>
        <li><strong>Exposure:</strong> ISO, aperture, shutter speed, focal length, flash setting</li>
        <li><strong>GPS:</strong> latitude, longitude, altitude, compass direction, timestamp</li>
        <li><strong>Software:</strong> operating system, editing app, edit history</li>
        <li><strong>IPTC:</strong> photographer name, copyright, caption, keywords</li>
        <li><strong>AI provenance:</strong> C2PA content credentials, Stable Diffusion prompts, Midjourney job IDs</li>
      </ul>

      <h2>Why check EXIF before sharing photos online</h2>
      <p>
        A photo of your living room can quietly include the exact latitude and longitude of your
        home. A studio shot may embed your full name in the copyright field. A phone photo often
        carries a device serial number that ties every image you post back to one specific
        handset. Checking EXIF takes a second; recovering from a leak does not.
      </p>

      <h2>How to check if a photo is AI-generated</h2>
      <p>Look for four things:</p>
      <ol>
        <li>A <strong>C2PA / Content Credentials</strong> manifest (Adobe, OpenAI, Microsoft ship these).</li>
        <li>A PNG <code>parameters</code> or <code>workflow</code> chunk (Stable Diffusion, ComfyUI).</li>
        <li>A <code>dc:creator</code> or <code>xmp:CreatorTool</code> mentioning Midjourney, DALL·E, Firefly, Ideogram.</li>
        <li>The <code>Software</code> tag matching a known generator.</li>
      </ol>
      <p>
        This viewer flags all four automatically. Remember: metadata is easy to strip, so the
        absence of AI markers is not proof a human made the image.
      </p>

      <h2>Why some image URLs don't work</h2>
      <p>
        Browsers enforce CORS: a site can choose whether other pages are allowed to fetch its
        images programmatically. Photo hosts like Imgur, Wikipedia, GitHub user-content, and
        Unsplash allow it. Social platforms like Twitter, Instagram, Reddit, and Facebook block
        it to protect their CDNs. When a URL fails, save the image manually and drop the file —
        the analysis is the same either way, and the file never leaves your browser.
      </p>

      <h2>EXIF vs IPTC vs XMP</h2>
      <ul>
        <li><strong>EXIF</strong> — camera-generated technical data (exposure, GPS, timestamps).</li>
        <li><strong>IPTC</strong> — human-authored newsroom data (byline, caption, copyright).</li>
        <li><strong>XMP</strong> — Adobe's extensible container; carries edit history and modern fields like AI provenance.</li>
      </ul>

      <h2>Which formats carry EXIF</h2>
      <ul>
        <li><strong>Full support:</strong> JPEG, HEIC/HEIF, TIFF, RAW (CR2/NEF/ARW/DNG…)</li>
        <li><strong>Partial (via XMP chunk):</strong> PNG, WebP, AVIF</li>
        <li><strong>None:</strong> GIF, BMP, SVG</li>
      </ul>

      <h2>How ConvertYard reads EXIF locally</h2>
      <p>
        We use <a href="https://mutiny.cz/exifr/" target="_blank" rel="noopener">exifr</a>, a
        pure-JavaScript parser that runs inside your browser tab. The file's bytes are read by
        the browser's <code>FileReader</code> API and handed straight to the parser — no upload,
        no server round-trip, no third-party analytics on the file itself. You can verify this
        in DevTools → Network at any time.
      </p>
    </div>
  )
}
