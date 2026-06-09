// app/(tools)/json-to-csv/page.tsx
'use client'

import { TextToolShell } from '@/components/text-tool-shell/text-tool-shell'
import { config } from '@/content/tools/json-to-csv'

export default function Page() {
  return <TextToolShell config={config} />
}
