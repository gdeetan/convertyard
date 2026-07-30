import React from 'react'

export function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return React.createElement(
    React.Fragment,
    null,
    text.slice(0, idx),
    React.createElement(
      'mark',
      { className: 'rounded-sm bg-amber-100 px-px dark:bg-amber-900/40' },
      text.slice(idx, idx + query.length)
    ),
    text.slice(idx + query.length)
  )
}
