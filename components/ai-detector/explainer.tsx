import { AiDetectorExamples } from './examples'

export function AiDetectorExplainer() {
  return (
    <div>
      <h2>What this tool does</h2>
      <p>
        Drop an image and it estimates whether the pixels came from a generator
        or a camera. The file stays in your browser. The first run downloads an
        ~87 MB classifier; after that it is cached.
      </p>
      <p>
        A 100% score is a strong hint, not proof. Don't treat it as a
        certificate.
      </p>

      <h2>How it works</h2>
      <p>Two checks run on your device:</p>
      <ol>
        <li>
          <strong>Pixels.</strong> The image is resized (shortest edge 440 px)
          and cropped to 384 px, then a small forensic classifier scores
          AI vs photograph. It does not name ChatGPT vs Flux vs Midjourney.
          Desktops average five crops; phones use the center crop.
        </li>
        <li>
          <strong>Metadata.</strong> We also read EXIF, XMP, and PNG chunks
          for leftover generator tags: Stable Diffusion <code>parameters</code>,
          ComfyUI <code>workflow</code>, Midjourney creator fields, C2PA Content
          Credentials, and Software tags from Firefly, Imagen, Ideogram,
          Leonardo, and Runway. If those tags are present, that is a strong
          AI signal on its own.
        </li>
      </ol>
      <p>
        Most images you see on social sites have already had metadata stripped.
        The pixel score is what you have left. Empty metadata does not mean
        the picture is real.
      </p>

      <h2>Examples</h2>
      <p>
        Three generated pictures, dropped locally. None of them carried
        generator tags. The classifier still marked them as AI.
      </p>
      <AiDetectorExamples />

      <h2>Where it gets it wrong</h2>
      <p>
        Public tests of this model sit around 90% at our 65% cutoff. That still
        leaves plenty of misses.
      </p>
      <ul>
        <li>
          <strong>False AI.</strong> Heavy retouching, HDR composites, beauty
          filters, and generative upscalers on a real photo can look like
          generated pixels.
        </li>
        <li>
          <strong>False photo.</strong> Screenshotting an AI image, saving it
          as a small JPEG, or running it through image-to-image can wash out
          the signal. The third example above only moved from 100% to 97%
          after a JPEG conversion — a harder recompress can hide it completely.
        </li>
      </ul>
      <p>
        If you know the origin of a file, trust that over the score. Reverse-image
        search still helps when the stakes are high.
      </p>

      <h2>What it can and cannot name</h2>
      <p>
        The pixel model covers a wide set of generators, including recent ones
        such as GPT Image, Flux 2, and Midjourney 7. It still cannot tell you
        which app made the file. Metadata can, but only when the tags were
        left in.
      </p>

      <h2>Batch</h2>
      <p>
        Drop up to 1,000 images. The model loads once. You can download results
        as CSV for a local review pass.
      </p>

      <h2>Does the file leave this tab?</h2>
      <p>
        No. Decode, classify, and metadata parse all happen in the browser.
        There is no upload and no telemetry on the file. Confirm it in
        DevTools → Network if you want.
      </p>

      <h2>Deepfakes</h2>
      <p>
        Diffusion portraits and fully generated faces are in scope. Face-swap
        video on real footage is not. For a still portrait, treat “likely AI”
        as a reason to check the source, not as a finished investigation.
      </p>
    </div>
  )
}
