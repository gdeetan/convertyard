import type { VerticalHubConfig } from '@/lib/types'
import { upscConfig } from './verticals/upsc'
import { sscCglConfig } from './verticals/ssc-cgl'
import { neetConfig } from './verticals/neet'
import { jeeMainConfig } from './verticals/jee-main'
import { ibpsPoConfig } from './verticals/ibps-po'

export const verticals: VerticalHubConfig[] = [
  upscConfig,
  sscCglConfig,
  neetConfig,
  jeeMainConfig,
  ibpsPoConfig,
]
