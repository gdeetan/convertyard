import Link from 'next/link'

export function MarketingContent() {
  return (
    <div className="mx-auto mt-10 w-full max-w-4xl px-4 sm:mt-14">
      {/* Comparison table */}
      <section className="mb-14">
        <h2 className="mb-4 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          How ConvertYard is different
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
                <th className="px-4 py-3 font-semibold"></th>
                <th className="px-4 py-3 font-semibold">ConvertYard</th>
                <th className="px-4 py-3 font-semibold">Most online converters</th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-gray-100">
              <ComparisonRow label="Are files uploaded?" us="No. Never." them="Yes" />
              <ComparisonRow label="Watermark on your PDF?" us="No" them="Yes (pay to remove)" />
              <ComparisonRow label="Sign up needed?" us="No" them="Often" />
              <ComparisonRow label="Convert many files at once?" us="Yes" them="Sometimes" />
              <ComparisonRow label="Combine a folder into one PDF?" us="Yes" them="No" />
              <ComparisonRow label="Tables, task lists, callouts" us="Yes" them="Some" />
              <ComparisonRow label="Math and diagrams in preview" us="Yes" them="Rare" />
              <ComparisonRow label="Works without internet?" us="Yes (after page loads)" them="No" />
              <ComparisonRow label="Cost" us="Free" them="Free with limits" />
            </tbody>
          </table>
        </div>
      </section>

      {/* Who uses this tool */}
      <section className="mb-14">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Who uses this tool
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <UserGroup title="Developers">
            Don&apos;t build a whole docs website just to send a single spec to a client. Convert
            your README, changelog, or API docs to a PDF format to send to your colleagues, boss,
            or client.
          </UserGroup>
          <UserGroup title="Consultants and freelancers">
            Maintain safety when working under an NDA by converting client notes and reports
            without sending them through a stranger&apos;s server. Your files will always remain on
            your computer.
          </UserGroup>
          <UserGroup title="Students">
            Export your class notes from Markdown format to produce a printable study guide. You
            can even add a cover page with your name, the class, and the date.
          </UserGroup>
          <UserGroup title="Writers">
            You likely write in Markdown in tools like iA Writer, Ulysses, or even in your own
            Obsidian notes. That means you can now easily export those to PDF as well, to get a
            proper print version of your notes without having to bother with copy-pasting them
            into Google Docs to get the formatting right.
          </UserGroup>
          <UserGroup title="Anyone with a folder of notes" full>
            Whether it is your meeting notes, your research, your favorite recipes, or even that
            first draft of your book, throw the whole folder at it and get a single PDF file back.
            We can even add a cover page and table of contents for you!
          </UserGroup>
        </div>
      </section>

      {/* What people use it for */}
      <section className="mb-14">
        <h2 className="mb-3 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          What people use it for
        </h2>
        <p className="mb-5 text-gray-700">
          In simple terms, here are the most common ways that people use this tool.
        </p>
        <ul className="space-y-3 text-gray-700">
          <li>
            <strong>GitHub README to PDF.</strong> Export your repository README to PDF to share
            with people who are not GitHub users.
          </li>
          <li>
            <strong>Export a folder of Obsidian notes as one PDF.</strong> Drop the folder. Get
            one clean file.{' '}
            <Link href="/blog/convert-obsidian-vault-to-pdf/" className="text-blue-700 underline">
              Read the full guide.
            </Link>
          </li>
          <li>
            <strong>Save ChatGPT / Claude replies with formatting preserved.</strong> No more
            having to take screenshots of code tables and math.{' '}
            <Link href="/blog/export-chatgpt-to-pdf/" className="text-blue-700 underline">
              See how.
            </Link>
          </li>
          <li>
            <strong>API documentation.</strong> Send PDF documentation to a client instead of
            linking to a docs site.
          </li>
          <li>
            <strong>Convert a Markdown resume to PDF.</strong> Choose from a variety of themes and
            download a PDF ready for application.{' '}
            <Link href="/blog/markdown-resume-to-pdf/" className="text-blue-700 underline">
              Learn more.
            </Link>
          </li>
          <li>
            <strong>Convert meeting notes into a handoff document.</strong> Add a cover page and a
            table of contents in one click.
          </li>
          <li>
            <strong>Save a research thread for future reference.</strong> Save your work in a PDF
            that you can open 10 years from now without any special software.
          </li>
          <li>
            <strong>Create a study packet.</strong> Combine your notes from a semester into one
            printable file.
          </li>
        </ul>
      </section>

      {/* Convert in three steps */}
      <section className="mb-14">
        <h2 className="mb-3 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Convert in three steps
        </h2>
        <p className="mb-6 text-gray-700">It only takes a few seconds.</p>
        <ol className="space-y-6">
          <Step number={1} title="Add your Markdown.">
            Use the <strong>Editor</strong> tab above to paste in or write your Markdown. You can
            see a live preview of your work to the right of the Editor tab. Alternatively, use the{' '}
            <strong>Batch</strong> tab above to add one or more files (or even a whole folder full
            of files).
          </Step>
          <Step number={2} title="Pick your options.">
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Choose a <strong>theme</strong>: Modern (Helvetica), Classic (Times), or Mono
                (Courier).
              </li>
              <li>
                Choose a <strong>page size</strong>: A4 or Letter.
              </li>
              <li>You can add a cover page for your title page.</li>
              <li>
                Enable a <strong>table of contents</strong> to link together headings throughout
                your document.
              </li>
              <li>
                In Batch mode, enable <strong>Combine into one PDF</strong> to generate a single
                document from many files.
              </li>
            </ul>
          </Step>
          <Step number={3} title="Download your PDF.">
            Click the download button to save the generated PDF file directly to your computer.
            Remember, the Markdown text is never uploaded to the server. Thus, it is never stored
            on our servers.
          </Step>
        </ol>
        <p className="mt-6 text-sm text-gray-600">
          All documents &mdash; 1 or 500 &mdash; are processed the same way: 3 steps to generate
          your output.
        </p>
      </section>

      {/* What Markdown features work */}
      <section className="mb-14">
        <h2 className="mb-3 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          What Markdown features work
        </h2>
        <p className="mb-6 text-gray-700">
          Everything you need in a Markdown tool, plus a few sweet extras that the rest of the
          converters are missing.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureBlock title="The basics">
            <li>Headings (H1 through H6)</li>
            <li>Bold, italic, and strikethrough</li>
            <li>Bullet lists and numbered lists</li>
            <li>Blockquotes</li>
            <li>Links and images</li>
            <li>Horizontal rules</li>
          </FeatureBlock>
          <FeatureBlock title="GitHub Flavored Markdown">
            <li>Tables with column alignment</li>
            <li>
              Task lists: <code className="rounded bg-gray-100 px-1 text-xs">- [x] done</code>,{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">- [ ] to do</code>
            </li>
            <li>Fenced code blocks with syntax highlighting</li>
            <li>Autolinks (a plain URL becomes a clickable link)</li>
          </FeatureBlock>
          <FeatureBlock title="The extras">
            <li>
              <strong>Cover page</strong> from YAML front-matter at the top of the file &mdash; we
              generate the cover for you.
            </li>
            <li>
              <strong>Table of contents.</strong> Built from your headings. Can be turned on/off.
            </li>
            <li>
              <strong>GitHub-style callouts:</strong>{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">&gt; [!NOTE]</code>,{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">&gt; [!TIP]</code>,{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">&gt; [!WARNING]</code>,{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">&gt; [!DANGER]</code> render as
              colored boxes.
            </li>
            <li>
              <strong>Math.</strong> Inline{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">$E = mc^2$</code> and block{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">$$E = mc^2$$</code>. Rendered
              with KaTeX.
            </li>
            <li>
              <strong>Diagrams</strong> in the preview. Draw flow charts inside a{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">mermaid</code> code block.
            </li>
            <li>
              <strong>Page breaks.</strong> Use{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">&lt;!-- pagebreak --&gt;</code>{' '}
              on a line by itself to force a new page in the PDF.
            </li>
            <li>
              <strong>Three themes.</strong> Modern (Helvetica), Classic (Times), Mono (Courier).
            </li>
          </FeatureBlock>
        </div>
        <p className="mt-5 text-sm text-gray-600">
          Until it is actually implemented in the tool (and possibly not at all), every feature
          not listed here will simply export as plain text without trying to implement part of the
          feature for you.
        </p>
      </section>

      {/* Your files stay on your computer */}
      <section className="mb-14 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
        <h2 className="mb-3 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Your files stay on your computer
        </h2>
        <p className="mb-4 text-gray-700">
          All your files stay on your computer. We run the conversion fully in your web browser
          using WebAssembly. No files are uploaded. None of your files are stored on any servers.
          Even after the page has loaded, you can turn off your internet connection and it still
          works fine.
        </p>
        <p className="mb-3 text-gray-700">
          That is why we can offer things some other tools cannot:
        </p>
        <ul className="space-y-3 text-gray-700">
          <li>
            <strong>No watermark.</strong> Unlike other free markdown to pdf tools (e.g.
            markdowntopdf.com) which add watermarks to exported PDFs unless you pay for a
            subscription (&pound;5/24 hours, &pound;19/year etc.) we do not apply watermarks on
            any conversion.
          </li>
          <li>
            <strong>No signup required, ever.</strong>
          </li>
          <li>
            <strong>No file-size or file-count limits.</strong> You can convert 1 file or 500
            files. Same tool. Same price.
          </li>
          <li>
            <strong>True batch mode.</strong> Simply throw one or more files into the folder on
            the left, then click the &ldquo;Combine selected files&rdquo; button on the top right.
            The resulting PDF will have a cover page and a table of contents. Most converters can
            only handle one file at a time.
          </li>
        </ul>
        <p className="mt-5 text-sm text-gray-600">
          You can easily test out the network claim above as well. Open up the developer tools
          (F12 in most browsers) for the browser you are testing from. Switch to the
          &ldquo;Network&rdquo; tab and then test out converting a file above. You will see{' '}
          <strong>no upload</strong> in the console.
        </p>
      </section>
    </div>
  )
}

function ComparisonRow({ label, us, them }: { label: string; us: string; them: string }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-gray-900">{label}</td>
      <td className="px-4 py-3 text-emerald-700">{us}</td>
      <td className="px-4 py-3 text-gray-600">{them}</td>
    </tr>
  )
}

function UserGroup({
  title,
  children,
  full = false,
}: {
  title: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-700">{children}</p>
    </div>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
        <div className="text-gray-700">{children}</div>
      </div>
    </li>
  )
}

function FeatureBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-gray-900">{title}</h3>
      <ul className="space-y-1.5 pl-5 text-sm text-gray-700 [&>li]:list-disc [&>li]:marker:text-gray-400">
        {children}
      </ul>
    </div>
  )
}
