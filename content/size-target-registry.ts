import type { SizeTargetConfig } from '@/lib/types'

import { config as compressPdfTo100kb } from './size-targets/compress-pdf-to-100kb'
import { config as compressPdfTo200kb } from './size-targets/compress-pdf-to-200kb'
import { config as compressPdfTo300kb } from './size-targets/compress-pdf-to-300kb'
import { config as compressPdfTo500kb } from './size-targets/compress-pdf-to-500kb'
import { config as compressPdfTo1mb } from './size-targets/compress-pdf-to-1mb'
import { config as compressPdfTo2mb } from './size-targets/compress-pdf-to-2mb'
import { config as compressPdfTo5mb } from './size-targets/compress-pdf-to-5mb'
import { config as compressPdfTo10mb } from './size-targets/compress-pdf-to-10mb'
import { config as compressPdfTo20mb } from './size-targets/compress-pdf-to-20mb'
import { config as compressPdfTo25mb } from './size-targets/compress-pdf-to-25mb'

export const sizeTargets: SizeTargetConfig[] = [
  compressPdfTo100kb,
  compressPdfTo200kb,
  compressPdfTo300kb,
  compressPdfTo500kb,
  compressPdfTo1mb,
  compressPdfTo2mb,
  compressPdfTo5mb,
  compressPdfTo10mb,
  compressPdfTo20mb,
  compressPdfTo25mb,
]
