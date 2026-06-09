// app/(tools)/json-formatter/page.tsx
'use client'

import { TextToolShell } from '@/components/text-tool-shell/text-tool-shell'
import { config } from '@/content/tools/json-formatter'

export default function Page() {
  return <TextToolShell config={config} />
}
