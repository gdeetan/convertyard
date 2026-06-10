// types/mdx.d.ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'

  export interface ArticleFAQItem {
    q: string
    a: string
  }

  export interface ArticleMeta {
    title: string
    description: string
    lastUpdated: string
    faq: ArticleFAQItem[]
    relatedTools: string[]
  }

  export const meta: ArticleMeta
  const MDXComponent: ComponentType
  export default MDXComponent
}
