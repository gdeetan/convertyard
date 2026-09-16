'use client'
import { Suspense, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/compress-image'
import { verticals } from '@/content/vertical-registry'
import type { ToolOptions } from '@/lib/types'

const BeforeAfterCompare = dynamic(
  () => import('@/components/ui/BeforeAfterCompare').then((m) => m.BeforeAfterCompare),
  { ssr: false },
)

const howToCompressSection = (
  <section>
    <h2 className="text-2xl font-semibold text-fg">How to Compress an Image</h2>

    <p className="mt-4 text-base text-fg-muted">
      Compressing an image shrinks its size so it loads faster and uses
      less storage, helping the webpage rank higher. The challenge is
      shrinking the image without degrading its quality. One difference
      between ConvertYard and most online image compressors is that it
      works locally. There&rsquo;s no free-tier limitation because I
      don&rsquo;t have to pay for storage. Select or drop the file you
      want to compress, choose a quality or target size, and download the
      ZIP file.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      I&rsquo;ve added other advanced options such as optional batch
      resizing, which reduces a step in your workflow, especially for a
      large batch of images that you want to upload to a CMS like
      WordPress.
    </p>

    <p className="mt-4 text-base text-fg-muted">
      So here&rsquo;s the suggested workflow if you&rsquo;re using
      ConvertYard:
    </p>

    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-fg-muted">
      <li>
        Select/drop a batch of images. It supports JPG, PNG, WebP, AVIF,
        GIF, and SVG.
      </li>
      <li>
        Choose a quality setting. The default is 80, which is the sweet
        spot for most photographs. Another option is setting a max file
        size if you need to meet a specific limit. For example, 100 KB for
        a job application or 2 MB for a CMS upload.
      </li>
      <li>
        You can resize the whole batch under the &lsquo;Resize on
        compress&rsquo; section, which is split into two options: a preset
        option or a custom width if you have a specific requirement not
        available in the presets.
      </li>
      <li>
        Click &lsquo;Compress&rsquo; to start the process of shrinking the
        files. Users will see a before-and-after split screen of the
        photos, which they can move to check the % file size saved and the
        compressed output.
      </li>
      <li>
        Once you&rsquo;re satisfied with the image, download the files
        individually or as a single ZIP file.
      </li>
    </ol>
  </section>
)

const compareDemo = (
  <BeforeAfterCompare
    beforeSrc="/tools/compress-image/cargo-before.png"
    beforeAlt="Original PNG cargo illustration before compression"
    beforeLabel="PNG — 146 KB"
    afterSrc="/tools/compress-image/cargo-after.png"
    afterAlt="Same PNG after ConvertYard compression"
    afterLabel="PNG — 54 KB (63% smaller)"
    width={1888}
    height={1653}
    aspectRatio="1888 / 1653"
    caption="Real-word test with Convertyard's image compression tool: 146 KB PNG → 54 KB PNG (63% smaller) at the same 1888 × 1653 resolution. Drag the slider to compare."
  />
)

function CompressImagePage() {
  const searchParams = useSearchParams()
  const verticalSlug = searchParams.get('vertical')

  const initialOptions = useMemo<ToolOptions | undefined>(() => {
    if (!verticalSlug) return undefined
    const vert = verticals.find((v) => v.slug === verticalSlug)
    if (!vert) return undefined
    // Find the first compress-image preset for this vertical
    const preset = vert.toolPresets.find((p) => p.toolSlug === 'compress-image')
    if (!preset?.targetBytes) return undefined
    const targetKb = Math.round(preset.targetBytes / 1024)
    return {
      maxSizeKb: targetKb,
      stripMetadata: true,
      convertToSrgb: true,
    }
  }, [verticalSlug])

  return <ToolShell config={config} initialOptions={initialOptions} afterHowItWorks={howToCompressSection} beforeFaq={compareDemo} />
}

export default function Page() {
  return (
    <Suspense fallback={<ToolShell config={config} afterHowItWorks={howToCompressSection} beforeFaq={compareDemo} />}>
      <CompressImagePage />
    </Suspense>
  )
}
