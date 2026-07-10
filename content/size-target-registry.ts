import type { SizeTargetConfig } from '@/lib/types'

import { config as compressImageTo10kb } from './size-targets/compress-image-to-10kb'
import { config as compressImageTo20kb } from './size-targets/compress-image-to-20kb'
import { config as compressImageTo50kb } from './size-targets/compress-image-to-50kb'
import { config as compressImageTo100kb } from './size-targets/compress-image-to-100kb'
import { config as compressImageTo200kb } from './size-targets/compress-image-to-200kb'
import { config as compressImageTo300kb } from './size-targets/compress-image-to-300kb'
import { config as compressImageTo500kb } from './size-targets/compress-image-to-500kb'
import { config as compressImageTo1mb } from './size-targets/compress-image-to-1mb'
import { config as compressImageTo2mb } from './size-targets/compress-image-to-2mb'
import { config as compressImageTo5mb } from './size-targets/compress-image-to-5mb'
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
import { config as compressVideoTo10mb }  from './size-targets/compress-video-to-10mb'
import { config as compressVideoTo25mb }  from './size-targets/compress-video-to-25mb'
import { config as compressVideoTo50mb }  from './size-targets/compress-video-to-50mb'
import { config as compressVideoTo100mb } from './size-targets/compress-video-to-100mb'
import { config as compressVideoTo200mb } from './size-targets/compress-video-to-200mb'
import { config as compressVideoTo500mb } from './size-targets/compress-video-to-500mb'
import { config as compressVideoTo1gb }   from './size-targets/compress-video-to-1gb'

export const sizeTargets: SizeTargetConfig[] = [
  compressImageTo10kb,
  compressImageTo20kb,
  compressImageTo50kb,
  compressImageTo100kb,
  compressImageTo200kb,
  compressImageTo300kb,
  compressImageTo500kb,
  compressImageTo1mb,
  compressImageTo2mb,
  compressImageTo5mb,
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
  compressVideoTo10mb,
  compressVideoTo25mb,
  compressVideoTo50mb,
  compressVideoTo100mb,
  compressVideoTo200mb,
  compressVideoTo500mb,
  compressVideoTo1gb,
]
