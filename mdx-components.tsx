// mdx-components.tsx
import type { MDXComponents } from 'mdx/types'
import type { ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }: ComponentPropsWithoutRef<'h2'>) => (
      <h2 className="mt-10 mb-4 text-2xl font-bold text-fg">{children}</h2>
    ),
    h3: ({ children }: ComponentPropsWithoutRef<'h3'>) => (
      <h3 className="mt-8 mb-3 text-xl font-semibold text-fg">{children}</h3>
    ),
    p: ({ children }: ComponentPropsWithoutRef<'p'>) => (
      <p className="mb-5 leading-7 text-fg-subtle">{children}</p>
    ),
    ul: ({ children }: ComponentPropsWithoutRef<'ul'>) => (
      <ul className="mb-5 ml-6 list-disc space-y-2 text-fg-subtle">{children}</ul>
    ),
    ol: ({ children }: ComponentPropsWithoutRef<'ol'>) => (
      <ol className="mb-5 ml-6 list-decimal space-y-2 text-fg-subtle">{children}</ol>
    ),
    li: ({ children }: ComponentPropsWithoutRef<'li'>) => (
      <li className="leading-7">{children}</li>
    ),
    a: ({ href, children }: ComponentPropsWithoutRef<'a'>) => (
      <Link
        href={href ?? '#'}
        className="text-primary underline decoration-primary/40 hover:decoration-primary transition-colors"
      >
        {children}
      </Link>
    ),
    strong: ({ children }: ComponentPropsWithoutRef<'strong'>) => (
      <strong className="font-semibold text-fg">{children}</strong>
    ),
    em: ({ children }: ComponentPropsWithoutRef<'em'>) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }: ComponentPropsWithoutRef<'code'>) => (
      <code className="rounded bg-bg-elevated px-1.5 py-0.5 text-sm font-mono text-fg border border-border">
        {children}
      </code>
    ),
    blockquote: ({ children }: ComponentPropsWithoutRef<'blockquote'>) => (
      <blockquote className="mb-5 border-l-4 border-primary pl-4 text-fg-subtle italic">
        {children}
      </blockquote>
    ),
    table: ({ children }: ComponentPropsWithoutRef<'table'>) => (
      <div className="mb-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: ComponentPropsWithoutRef<'thead'>) => (
      <thead className="bg-bg-elevated">{children}</thead>
    ),
    th: ({ children }: ComponentPropsWithoutRef<'th'>) => (
      <th className="px-4 py-3 text-left font-semibold text-fg border-b border-border">
        {children}
      </th>
    ),
    td: ({ children }: ComponentPropsWithoutRef<'td'>) => (
      <td className="px-4 py-3 text-fg-subtle border-b border-border last:border-b-0">
        {children}
      </td>
    ),
    hr: () => <hr className="my-10 border-border" />,
    ...components,
  }
}
