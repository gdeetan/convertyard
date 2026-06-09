// content/text-tool-registry.ts
import { config as jsonFormatter } from './tools/json-formatter'
import { config as base64 }        from './tools/base64'
import { config as jsonToCsv }     from './tools/json-to-csv'
import type { TextToolConfig }     from '@/lib/types-text'

export const textTools: TextToolConfig[] = [jsonFormatter, base64, jsonToCsv]

export const textToolBySlug = Object.fromEntries(
  textTools.map((t) => [t.slug, t])
) as Record<string, TextToolConfig>
