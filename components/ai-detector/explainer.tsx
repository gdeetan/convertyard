export function AiDetectorExplainer() {
  return (
    <div>
      <h2>What is an AI image detector?</h2>
      <p>
        An AI image detector estimates whether a picture came from a generative model
        or from a camera. ConvertYard's detector runs entirely in your browser using
        CommunityForensics ViT-S (trained on millions of images across thousands of
        generators, including ChatGPT/GPT Image, Flux, Midjourney, and Stable Diffusion).
        The model downloads once (~37 MB), then later runs use the cache.
      </p>

      <h2>How does it work?</h2>
      <p>Two signals, checked in parallel:</p>
      <ol>
        <li>
          <strong>Pixel classifier.</strong> Every image is resized (shortest edge 440 px)
          and center-cropped to 384 px, then scored by a ViT-Small forensic classifier.
          It is a binary AI-vs-photo score — it does not name ChatGPT vs Grok vs Flux.
        </li>
        <li>
          <strong>Metadata signatures.</strong> We also read the file's EXIF, XMP, and
          PNG chunks for markers left by generators: Stable Diffusion's <code>parameters</code>
          chunk, ComfyUI's <code>workflow</code> chunk, Midjourney's <code>dc:creator</code> tag,
          C2PA Content Credentials from Adobe/OpenAI/Microsoft, and Software tags for
          Firefly, Imagen, Ideogram, Leonardo, and Runway.
        </li>
      </ol>
      <p>
        Metadata is a strong positive signal when present but easy to strip. The
        classifier fills that gap.
      </p>

      <h2>Which generators does it detect?</h2>
      <p>
        The pixel model was trained across thousands of generators (Community Forensics),
        which covers ChatGPT/GPT Image, DALL·E, Midjourney, Flux, Stable Diffusion,
        Imagen, Ideogram, and many others better than an SDXL-only detector. It still
        cannot reliably name the app that made the file. Metadata detection covers
        Stable Diffusion, ComfyUI, Midjourney, Firefly, Imagen, Ideogram, Leonardo,
        Runway, and C2PA Content Credentials when those tags are still in the file.
      </p>

      <h2>How accurate is it?</h2>
      <p>
        Public on-device evals of this family sit around ~90% balanced accuracy when
        generators in the test set are held out, including after JPEG recompress. It is
        not proof. Two failure modes to expect:
      </p>
      <ul>
        <li>
          <strong>False positives.</strong> Heavily edited photos, HDR composites, and
          skin-smoothed portraits sometimes trigger the classifier because they share
          statistical properties with generated images.
        </li>
        <li>
          <strong>False negatives.</strong> Screenshotting an AI image, re-encoding it as
          a JPEG at low quality, or running it through an image-to-image pass often
          erases the tell-tale signal. Combined with metadata stripping, the image can
          look real to any current detector.
        </li>
      </ul>
      <p>
        Treat the verdict as one piece of evidence, not a court verdict. The metadata
        panel and reverse-image search are still useful cross-checks.
      </p>

      <h2>Does the image leave my device?</h2>
      <p>
        No. The image is decoded in-browser, the classifier runs via
        WebAssembly/WebGPU, and the metadata is parsed locally. There is no upload,
        no telemetry on the file, and no third-party pixel service. You can verify this in
        DevTools → Network at any time.
      </p>

      <h2>What about batch?</h2>
      <p>
        Drop up to 1,000 images. The model loads once and each image is classified in
        50–500 ms depending on your hardware. Results are downloadable as a CSV so
        moderators, journalists, and stock reviewers can process large sets locally.
      </p>

      <h2>What about deepfakes?</h2>
      <p>
        The classifier catches diffusion-generated faces and portraits well. Face-swap
        deepfakes on real footage (video) are a different problem and out of scope here;
        for stills, treat a "likely AI" verdict on a portrait as a strong hint but always
        cross-check with source and reverse-image search.
      </p>
    </div>
  )
}
