import type { VerticalHubConfig } from '@/lib/types'
import { upscConfig } from './verticals/upsc'
import { sscCglConfig } from './verticals/ssc-cgl'
import { neetConfig } from './verticals/neet'
import { jeeMainConfig } from './verticals/jee-main'
import { ibpsPoConfig } from './verticals/ibps-po'
import { uppscConfig } from './verticals/uppsc'
import { bpscConfig } from './verticals/bpsc'
import { mpscConfig } from './verticals/mpsc'
import { tnpscConfig } from './verticals/tnpsc'
import { kpscConfig } from './verticals/kpsc'
import { sbiConfig } from './verticals/sbi'
import { rbiGradeBConfig } from './verticals/rbi-grade-b'
import { insuranceExamsConfig } from './verticals/insurance-exams'
import { ndaCdsConfig } from './verticals/nda-cds'
import { capfSscGdConfig } from './verticals/capf-ssc-gd'
import { usDs160VisaConfig } from './verticals/us-ds-160-visa'
import { usCollegeApplicationConfig } from './verticals/us-college-application'

export const verticals: VerticalHubConfig[] = [
  upscConfig,
  sscCglConfig,
  neetConfig,
  jeeMainConfig,
  ibpsPoConfig,
  uppscConfig,
  bpscConfig,
  mpscConfig,
  tnpscConfig,
  kpscConfig,
  sbiConfig,
  rbiGradeBConfig,
  insuranceExamsConfig,
  ndaCdsConfig,
  capfSscGdConfig,
  usDs160VisaConfig,
  usCollegeApplicationConfig,
]
