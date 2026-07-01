'use client'

import { useEffect, useState } from 'react'

const KEY = 'cy-recent-tools'
const MAX = 5

export interface RecentTool {
  slug: string
  title: string
}

export function useRecentTools() {
  const [tools, setTools] = useState<RecentTool[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setTools(JSON.parse(raw))
    } catch {}
  }, [])

  function record(slug: string, title: string) {
    setTools((prev) => {
      const next = [{ slug, title }, ...prev.filter((t) => t.slug !== slug)].slice(0, MAX)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { tools, record }
}
