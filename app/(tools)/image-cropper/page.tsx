'use client'
import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/image-cropper'

export default function Page() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Link
          href="/for"
          className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm transition-colors hover:bg-primary/10"
        >
          <span className="font-medium text-fg">Preparing for UPSC, NEET, SSC CGL, or IBPS?</span>
          <span className="font-medium text-primary">See exam upload kits →</span>
        </Link>
      </div>
      <ToolShell config={config} />
    </>
  )
}
