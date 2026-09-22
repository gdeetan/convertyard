export function CompressPdfExplainer() {
  return (
    <div>
      <h2>How to Compress PDF Files?</h2>
      <p>
        Before we start talking about compressing PDF files, we have to
        understand what a PDF file is and how it&rsquo;s constructed. Think of
        a PDF file as a container that contains different elements: text,
        images, and structure (these are fonts, metadata, bookmarks, fields,
        hidden data from the PDF editor).
      </p>

      <h2>What does &ldquo;Compressing&rdquo; a PDF actually mean?</h2>
      <p>
        So compressing a PDF entails shrinking that container without changing
        what the reader sees, and there are three levels to achieve optimal
        compression.
      </p>
      <ol>
        <li>
          <strong>Shrink the images.</strong> Photos are always the biggest
          chunk of a PDF&rsquo;s size. Re-saving them at a lower quality or
          smaller resolution is the biggest lever we can pull to shrink the
          file size.
        </li>
        <li>
          <strong>Strip what nobody reads.</strong> These include the author
          name, editing history, thumbnail, fonts that aren&rsquo;t used, or
          hidden attachments. Deleting this won&rsquo;t affect what the user
          sees.
        </li>
        <li>
          <strong>Rewriting the file cleanly.</strong> A PDF file collects
          junk during repeated edits. So rebuilding the internal structure
          removes any gaps or duplicates.
        </li>
      </ol>
      <p>
        That&rsquo;s the simplest explanation of how PDF compression works,
        and nearly every tool on the internet pulls one of these levers.
      </p>

      <h2>What to look for before compressing a PDF file?</h2>
      <p>Before compressing a PDF, here are the things to consider.</p>
      <p>
        <strong>Do you need the text to be searchable or selectable?</strong>{' '}
        For most users, the answer would be yes. So keep it as text.
      </p>
      <p>
        <strong>Do you need it compressed to a specific size?</strong> File
        attachments using email usually cap at 25 MB. Government portals often
        cap between 2 and 5 MB. If this is the case, choose a target size;
        don&rsquo;t guess.
      </p>
      <p>
        <strong>How is it viewed?</strong> On smartphones, PDF files at 150
        DPI look similar to 300 DPI. However, if you print it, the difference
        will be noticeable.
      </p>
      <p>
        If the file you&rsquo;ll send is only read on screen and emailed, you
        can choose a lower resolution (150 DPI is a good compromise). If
        it&rsquo;s going to be printed out, it should be at least 300 DPI.
      </p>

      <h2>How does ConvertYard compress your PDF?</h2>
      <p>
        ConvertYard compresses PDF files in the browser. This means that
        nothing is uploaded to a server; nothing leaves your computer. When
        you open or drop a PDF file, here&rsquo;s what happens:
      </p>
      <ol>
        <li>WebAssembly processes the PDF file within the browser.</li>
        <li>
          It rewrites the internal structure to remove any excess space
          (that&rsquo;s equivalent to bytes).
        </li>
        <li>
          Metadata is stripped by default (this means the author name, title,
          and editing history are deleted).
        </li>
        <li>
          If you choose this option, it re-encodes the images at a lower
          quality.
        </li>
        <li>Rewrite the new PDF file, ready for download.</li>
      </ol>
      <p>
        If by any chance the compressed version has a larger file size than
        the original (this happens if the original file uses compressed images
        or is optimized), we return the original file instead. You don&rsquo;t
        get a worse PDF file than what you have.
      </p>

      <h2>What to expect from this compressor?</h2>
      <ol>
        <li>
          <strong>Scanned documents or image-heavy PDFs:</strong> expect
          around 40 to 80% compression. This is where this compressor excels.
        </li>
        <li>
          <strong>Exported reports with charts and photos:</strong> expect
          around 20 to 50% reduction.
        </li>
        <li>
          <strong>Text-only PDF:</strong> expect around 0 to 15%. There&rsquo;s
          not much to compress here.
        </li>
        <li>
          <strong>Already-compressed PDFs:</strong> expect little or no
          change. If it&rsquo;s already compressed, there&rsquo;s nothing left
          to squeeze unless you want the images to be heavily pixelized.
        </li>
      </ol>
      <p>
        Compression will take a few seconds on smaller files, and a few
        minutes with larger files. You can compress PDF batches of up to 100.
      </p>

      <h2>Basic Features</h2>
      <p>
        <strong>Compression level: Low, Medium, High, Aggressive.</strong> Low
        is the safest option but offers the least compression. Medium is the
        default option. High will re-encode images at 30% quality. Aggressive
        flattens the PDF file and turns every page into an image, so text
        will not be searchable. Best used for scanned PDF files.
      </p>
      <p>
        <strong>Target size mode:</strong> KB or MB with presets between 100
        KB and 10 MB. For example, if you choose a 2 MB compression, the page
        runs multiple compression cycles and automatically stops when it
        reaches the target. This works well on image-heavy PDFs, but not as
        well on text-heavy PDFs.
      </p>
      <p>
        <strong>Batch compression:</strong> Users can compress between 1 and
        1,000 files per batch. PDFs can be downloaded individually or as a
        batch (ZIP file).
      </p>

      <h2>Advanced Features: If You Need More Control</h2>
      <p>
        <strong>Custom DPI:</strong> Force downgrade to a specific resolution.
        72 DPI for email attachments. 150 DPI for viewing on screen only. 300
        DPI for print quality.
      </p>
      <p>
        <strong>JPG Quality Slider:</strong> Choose between 10 and 95 for
        embedded images. 70 is the sweet spot to balance compression without
        losing quality.
      </p>
      <p>
        <strong>Grayscale:</strong> Turns a colored PDF into black/white (or
        grayscale). Cuts image size by around 60%.
      </p>
      <p>
        <strong>Strip options:</strong> Remove metadata, annotations,
        bookmarks, embedded files, or JavaScript.
      </p>
      <p>
        <strong>Remove unused fonts:</strong> Removes any font that isn&rsquo;t
        used by the PDF file. Doesn&rsquo;t affect readability of the file.
      </p>
      <p>
        <strong>Flatten or remove form fields:</strong> Flattening or removing
        the form fields will not affect the way the PDF file looks, but the
        file can&rsquo;t be edited anymore. This option will remove the
        fields.
      </p>
      <p>
        <strong>Strip private app data:</strong> Removes any data left behind
        by Photoshop, Illustrator, Word, and other tools.
      </p>

      <h2>Why are file uploads risky for PDFs?</h2>
      <p>
        Here are some examples: Tax returns that have your Social Security
        Number. Medical records. Signed contracts with your signature. A
        passport with your photo, birthday, and passport number &mdash;
        information hackers can use to steal your identity. Signed contracts
        with your signature. Scanned documents you sent to your landlord.
      </p>
      <p>
        When you upload these types of files into a &ldquo;free online PDF
        compressor,&rdquo; they are dropped into a server owned by a company
        you don&rsquo;t know. These websites don&rsquo;t disclose where they
        store uploaded PDFs. Some give you that option to delete the PDF
        files, but most users won&rsquo;t bother.
      </p>
      <p>
        <strong>Who can read it?</strong> A number of people, including
        server admins, third-party analytics tools, basically, anyone with
        enough credentials to open these files. The marketing copy on the
        website says &ldquo;secure,&rdquo; but that&rsquo;s only a claim, not
        a guarantee.
      </p>
      <p>
        <strong>How long does it stay uploaded?</strong> That would depend on
        the website. Some say files are deleted after an hour. Others? Thirty
        minutes. It varies. However, one thing they don&rsquo;t disclose is
        whether they automatically back it up for redundancy. This may also
        include these PDF files. Again, these aren&rsquo;t disclosed.
      </p>
      <p>
        <strong>Where does it end up?</strong> Data is usually stored on
        multiple servers distributed across different data centers. This is
        to serve data at the shortest possible distance for efficiency. This
        redundancy helps with the website&rsquo;s core files, but it
        doesn&rsquo;t protect PDF files: if a misconfigured cloud bucket
        exposes your data, hackers can access it. Try searching for
        &ldquo;PDF converter data leak&rdquo; to see what I mean.
      </p>
      <p>
        <strong>Who&rsquo;s training on it?</strong> Most people don&rsquo;t
        realize that there may be some free tools that are quietly passing
        your uploads directly into AI training pipelines. Your PDF contract
        may be in a model&rsquo;s next training set.
      </p>
      <p>
        PDFs are worse than images because of the type of data that could
        leak. A photo of your logo for a client could be copied by another
        graphic artist. The worst-case scenario is that you create another
        design. A leaked tax return can lead to identity theft. A leaked NDA
        is a lawsuit waiting to happen. The stakes are higher and costlier.
        Every upload is a risk that could cost you thousands of dollars.
      </p>
      <p>
        ConvertYard sidesteps all this because it doesn&rsquo;t upload
        anything. The PDF opens, compresses, and saves inside the browser.
        Once you close the tab, the file disappears. Want proof? Open Google
        Chrome, select &lsquo;more tools&rsquo; &gt; &lsquo;developer
        tools&rsquo;, and choose the network tab. Run a compression and watch
        for a request that carries a file. You won&rsquo;t see any. Do the
        same with a cloud-based compressor.
      </p>
      <p>
        So if a document is sensitive enough that you&rsquo;d need to shred
        the hard copy, then it&rsquo;s sensitive enough that you
        shouldn&rsquo;t upload the PDF version.
      </p>
    </div>
  )
}
