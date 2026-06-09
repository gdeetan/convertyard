// app/(tools)/base64/page.tsx
'use client'

import { TextToolShell } from '@/components/text-tool-shell/text-tool-shell'
import { config } from '@/content/tools/base64'

export default function Page() {
  return <TextToolShell config={config} />
}
