import { config as jpgToWebp } from './tools/jpg-to-webp'
import type { ToolConfig } from '@/lib/types'

export const tools: ToolConfig[] = [jpgToWebp]

export const toolBySlug = Object.fromEntries(
  tools.map((t) => [t.slug, t])
) as Record<string, ToolConfig>
