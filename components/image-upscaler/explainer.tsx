export function ImageUpscalerExplainer() {
  return (
    <div>
      <h2>How the upscaler works</h2>
      <p>
        Try a Google search for &ldquo;image upscaler,&rdquo; and most of these
        tools will upload your photos to a server, cap you at a few images per
        day, or limit you to upscaling one or two before you need to sign up and
        pay a monthly fee to keep using them.
      </p>
      <p>
        These tools range from $9 to $500 depending on the plan you select.
        Most of these require users to upload photos to a server for their
        software to use AI to re-encode these photos (more on how image
        upscaling works below).
      </p>
      <p>
        ConvertYard&rsquo;s image upscaler works locally in your browser, so
        files aren&rsquo;t uploaded to an unknown server, there&rsquo;s no need
        to sign up, and there&rsquo;s no usage limit.
      </p>
      <p>When you open or drop a file, three things happen:</p>
      <ol>
        <li>
          The browser detects the image type, whether it&rsquo;s a photograph,
          graphic, or illustration (that is, if you leave it on auto-detect).
          The tool bases the detection on color count and flat regions. But
          for the best results, you&rsquo;ll have to specify what type of image
          it is.
        </li>
        <li>
          A model will run in your browser, locally. How fast the process is
          depends on the image type, the memory available on your computer,
          and browser GPU support. One of these will load and cache:
          <ul>
            <li>
              <strong>Real-ESRGAN v3</strong> (around 5 MB) &mdash; photos at
              4&times; on GPU browsers (WebGPU).
            </li>
            <li>
              <strong>Swin2SR</strong> &mdash; photos at 2&times;, and the 4&times;
              fallback when WebGPU isn&rsquo;t available.
            </li>
            <li>
              <strong>Real-ESRGAN anime 6B</strong> (around 18 MB) &mdash; for
              illustrations, line art, badges, or comic graphics.
            </li>
            <li>
              <strong>Lanczos + unsharp mask</strong> &mdash; for logos,
              graphics, and anything else where you don&rsquo;t want a neural
              net making decisions.
            </li>
          </ul>
        </li>
        <li>
          Optional second pass if the <strong>Restore faces</strong> option is
          turned on. The tool detects faces in the photo and runs
          <strong> GFPGAN</strong> (around 340 MB, cached after first use) over
          each detected face to clean up eyes, skin tone, and mouth.
        </li>
      </ol>
      <p>
        Everything stays inside the browser. After you open the page and the
        tools are loaded, it will keep working even if you turn off the Wi-Fi
        connection &mdash; the models are saved in the browser&rsquo;s cache.
      </p>

      <h2>Upscaling vs. enlarging: what&rsquo;s the difference?</h2>
      <p>
        One of the biggest misconceptions is that upscaling and enlarging
        images are the same thing, but in reality these are different
        processes.
      </p>
      <p>
        <strong>Image enlarging</strong> relies on pure math: the tool simply
        enlarges the pixels, spreads them over a larger grid, and fills the
        gaps by averaging &ldquo;neighbors&rdquo; (bilinear, bicubic, Lanczos).
        In layman&rsquo;s terms, it stretches the image to meet size
        requirements; it doesn&rsquo;t enhance anything. Soft edges stay soft,
        blurry details get blurrier, and small text gets bigger and fuzzier.
        This is exactly what happens when you drag a photo&rsquo;s corner in a
        document, or enlarge an image to twice its size in a basic photo
        editor.
      </p>
      <p>Here&rsquo;s an example of an enlarged image using a photo editor.</p>
      <figure className="my-6 -mx-4 sm:-mx-8 lg:-mx-20">
        <img
          src="/examples/image-upscaler/enlarge-sample.jpg"
          alt="Example of an image enlarged in a photo editor — edges stay soft and blurry"
          className="mx-auto w-full max-w-[1200px] rounded-xl"
          loading="lazy"
          decoding="async"
        />
      </figure>
      <p>
        Instead of recalculating and stretching pixels,{' '}
        <strong>upscaling</strong> uses an AI model trained on millions of
        sharp images. Instead of averaging, it &ldquo;predicts&rdquo; the
        missing detail and how it should look based on patterns it learned
        during training &mdash; like how an eyelash looks, a clean font edge,
        or the texture of a brick. The output includes detail that stays close
        to the original file.
      </p>
      <p>
        And here&rsquo;s an example of an upscaled image using ConvertYard.
      </p>
      <figure className="my-6 -mx-4 sm:-mx-8 lg:-mx-20">
        <img
          src="/examples/image-upscaler/upscale-sample.png"
          alt="Example of an image upscaled with ConvertYard — edges and texture reconstructed"
          className="mx-auto w-full max-w-[1200px] rounded-xl"
          loading="lazy"
          decoding="async"
        />
      </figure>
      <p>
        One quick way to tell if an image is upscaled or enlarged is to zoom
        in around 4&times;. The enlarged photo will have noticeably blurry
        edges, while the upscaled photo will have sharper edges and some
        recovered texture.
      </p>
      <p>
        For photographs and illustrations, this tool uses AI to upscale the
        image, meaning it will predict, enhance, and even add detail that
        wasn&rsquo;t in the original.
      </p>
      <p>
        However, for logos and graphics, it doesn&rsquo;t use AI but a
        <strong> &ldquo;Lanczos + unsharp mask&rdquo;</strong> combination,
        otherwise called a <strong>&ldquo;classic sharpening resize.&rdquo;</strong>{' '}
        It works like a classic photo enlargement but adds a sharpening filter
        at the end to boost contrast. It&rsquo;s called &ldquo;classic&rdquo;
        because this is the technique photographers and graphic artists have
        used to enlarge images for over 20 years.
      </p>

      <h2>Picking the right image type</h2>
      <p>
        I understand this tool has an auto-detect feature, and it gets it
        right most of the time. But for the best results, I suggest choosing
        the type of photo manually.
      </p>
      <ul>
        <li>
          <strong>Photo (AI):</strong> real-world photographs like landscapes,
          images of people, or places. Any photo you take on vacation falls
          into this category.
        </li>
        <li>
          <strong>Illustration (AI):</strong> graphic art like comics, anime
          stills, badges, stickers &mdash; anything with lines, text, or
          drawn art.
        </li>
        <li>
          <strong>Graphic / logo (Lanczos):</strong> UI mockups, QR codes,
          icons, anything with geometric lines or edges. This model skips AI
          because it&rsquo;s prone to creating a halo effect on tight text.
        </li>
      </ul>
      <p>
        I&rsquo;ve tested these options extensively, and honestly, use either
        Photo or Illustration for any graphic that requires text, sharp lines,
        or logos. This will produce the best results for most non-photographed
        images.
      </p>
      <p>
        So if using the Illustration mode produces a glow or halo around the
        lettering or logo, try the <strong>Graphic / logo</strong> option.
      </p>

      <h2>Choosing a scale</h2>
      <ul>
        <li>
          <strong>2&times; (fastest option):</strong> the best option for
          photos for websites. It basically doubles the image size, so a
          900&times;300 pixel wide image becomes 1800&times;600 pixels &mdash;
          perfect for headers or hero images.
        </li>
        <li>
          <strong>3&times;:</strong> this runs the 4&times; model, then uses
          Lanczos to downsize the image. It uses the 4&times; model to upscale
          the image to four times its original size, then uses Lanczos to
          downsize it to 3&times;.
        </li>
        <li>
          <strong>4&times; (recommended option):</strong> the sweet spot for
          upscaling images. Best quality-to-speed ratio, and the model is
          specifically trained to upscale images 4&times;.
        </li>
        <li>
          <strong>8&times; (slowest option):</strong> runs the 4&times; model
          once, then uses Lanczos to upsample the result to 8&times;. Because
          of the extra resize and larger output, it uses a lot of memory.
          Avoid using this unless you need the larger dimensions.
        </li>
      </ul>
      <p>
        One thing to note is that the 4&times; result is limited to 8,192
        pixels on the longest side. If you&rsquo;re working with large
        photographs or images that would exceed this, the tool will shrink the
        photo or graphic first before upscaling, which softens and in some
        cases makes the upscaled image worse. For the best results, keep the
        source image under 2,048 pixels and use a PNG source.
      </p>
      <p>
        If you&rsquo;re working with a JPG file,{' '}
        <a href="/jpg-to-png">convert it to PNG</a> first before upscaling to
        prevent any loss of pixel data.
      </p>

      <h2>Best practices by image type</h2>
      <h3>For photos</h3>
      <ol>
        <li>Start by using the 4&times; upscale and auto-detect.</li>
        <li>
          Turn on the <strong>Enhance</strong> option if the source image is
          slightly soft &mdash; it adds contrast and sharpens the edges
          without touching the skin or sky elements of the image.
        </li>
        <li>
          If you&rsquo;re upscaling selfies, ID photos, or scanned portraits,
          turn on the <strong>Restore faces</strong> option. Skip this step on
          photos that are already sharp.
        </li>
        <li>
          For photos with a lot of noise taken in low-light conditions, expect
          a softer result. The model smooths out the noise and can&rsquo;t
          invent something that wasn&rsquo;t there.
        </li>
      </ol>
      <h3>Illustrations and comics</h3>
      <ol>
        <li>
          Select <strong>Illustration</strong> mode manually if you have a
          graphic image with lots of flat color. The Auto option may work, but
          can miscategorize clear JPG files.
        </li>
        <li>
          Avoid turning on the <strong>Enhance</strong> or{' '}
          <strong>Restore faces</strong> option. These options aren&rsquo;t
          used in Illustration mode, so they won&rsquo;t affect the output.
        </li>
        <li>
          I mentioned earlier to use Illustration mode on graphic files,
          including logos or screenshots with lots of text, but if it produces
          halos or glows, try <strong>Graphic / logo</strong> instead.
        </li>
      </ol>
      <h3>Logos and UI</h3>
      <p>
        This is the last resort for any logo or images with lots of text.
        Choose this model only if the output from Illustration mode produces
        a glow or halo.
      </p>
      <ol>
        <li>Use this on logos, graphic files, or images with lots of text.</li>
        <li>
          If the source comes from a vector file, re-export it from the
          original file to a PNG, then try using this upscaler. However, if
          you have access to a graphic editor,{' '}
          <a href="/image-resizer">export it to the size you need</a> instead
          of using an upscaler.
        </li>
      </ol>
      <h3>Prints</h3>
      <ul>
        <li>
          A 500&times;500 photograph upscaled at 4&times; gives you an image
          with a 2,000&times;2,000 pixel dimension, which is good enough for a
          6&times;6 inch printout at 300 DPI. This is fine for small printouts
          (between 4R and 6R).
        </li>
        <li>
          For larger print requirements, start from a higher-resolution source
          with dimensions of at least 2,000&times;2,000 pixels, then upscale
          to 4&times;. If you need something larger, you&rsquo;ll have to pay
          for a premium tool like Topaz for larger-format prints.
        </li>
      </ul>

      <h2>Batching</h2>
      <p>
        While this tool can run{' '}
        <a href="/blog/batch-convert-images">batches of files</a>, I suggest
        processing one file at a time to prevent the browser from freezing
        because it runs out of memory. If you&rsquo;re upscaling images 2&times; or 4&times;,
        you can do up to 5 images per batch, but for 8&times;, do one image
        at a time for smaller images below 800 pixels. If you try doing 20
        images or more, you&rsquo;ll see a warning.
      </p>

      <h2>Output format</h2>
      <p>
        I recommend leaving the output format at the default setting, which
        is to match the input, unless you have a good reason to switch. For
        the best results (and I&rsquo;ve said this repeatedly), convert{' '}
        <a href="/blog/lossless-vs-lossy">lossy formats like JPG</a> into PNG
        before upscaling. Choose{' '}
        <a href="/blog/avif-vs-webp-vs-jpeg-2026">WebP</a> if a smaller file
        size is a high priority.
      </p>

      <h2>What this tool is not</h2>
      <p>
        Take note that this is a browser upscaler, not software like Topaz
        Gigapixel. These desktop apps run full-precision models that can do
        multiple passes, have dedicated denoisers, and allow more memory
        usage than a browser upscaler.
      </p>
      <p>
        A browser upscaler will provide comparable results at smaller output
        dimensions. I&rsquo;ve tested Topaz, and the results I get are similar
        to what I got from this image upscaler. The only time I&rsquo;d
        recommend using a dedicated image upscaling app is if you need a
        larger-format printout for the graphic and you don&rsquo;t have access
        to the source vector file, or you don&rsquo;t have an editor to open
        it. But if you only need an upscaled image for your website, the
        ConvertYard image upscaler is enough for the task. Try it out and let
        me know what you think.
      </p>
    </div>
  )
}
