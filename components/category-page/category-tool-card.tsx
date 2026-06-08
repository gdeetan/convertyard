'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { CatalogTool } from '@/content/tool-catalog'

interface Props {
  tool: CatalogTool
}

export function CategoryToolCard({ tool }: Props) {
  const isLive = tool.status === 'live'

  const cardInner = (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-150 h-full',
        isLive
          ? 'border-border bg-bg-elevated hover:border-primary hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
          : 'border-border bg-bg-elevated opacity-60 cursor-default'
      )}
    >
      {/* Badge */}
      <div className="flex items-start justify-between gap-2 min-h-[20px]">
        <p className={cn(
          'text-sm font-semibold',
          isLive ? 'text-fg group-hover:text-primary transition-colors' : 'text-fg-muted'
        )}>
          {tool.title}
        </p>
        {!isLive && (
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-fg-subtle whitespace-nowrap">
            {tool.badge ? `${tool.badge} · Soon` : 'Soon'}
          </span>
        )}
        {tool.badge && isLive && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary whitespace-nowrap">
            {tool.badge}
          </span>
        )}
      </div>
      <p className="text-xs text-fg-muted leading-relaxed">{tool.description}</p>
    </div>
  )

  if (isLive) {
    return (
      <Link
        href={`/${tool.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xl"
      >
        {cardInner}
      </Link>
    )
  }

  return cardInner
}
