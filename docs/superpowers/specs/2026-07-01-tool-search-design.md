# Tool Search — Design Spec

**Date:** 2026-07-01  
**Status:** Approved

## Problem

With 60+ tools, users bounce to Google to find a ConvertYard tool by name. The homepage shows only 19 "popular" tools by default. There is no way to text-search the catalog without leaving the site.

## Solution

Add a live text-search input above the category tabs in the homepage tool grid. As the user types, the grid filters in place to show only matching tools. No new dependencies — plain `Array.filter` on title + description.

---

## Placement

- **Location:** `components/homepage/tool-grid.tsx`, above the category filter tabs
- **Scope:** Homepage only. Tool pages have a "Related tools" strip for lateral discovery.
- **Mobile:** The mobile nav (`components/site-shell/nav.tsx`) already has a non-functional search input — wire it to focus/scroll to the homepage search input when on the homepage; no-op on other pages.

---

## Behavior

### Empty state (no query)
- Shows the existing 19 popular tools (current behavior unchanged)
- Category tabs fully active
- Placeholder: `"Search 60+ tools…"`

### Active search (query length ≥ 1)
- Searches ALL tools in `tool-catalog.ts` (not just the 19 popular ones), filtering to `status: 'live'` onlyyes
- Match logic: case-insensitive substring on `title + " " + description`
- Category tabs dim (`opacity-40 pointer-events-none`) — search overrides them
- Each matching card shows a small category label above the tool name
- Match term highlighted in the title and description where it appears
- Clear (×) button appears inside the input
- Result count shown below the grid: `"4 tools match 'compress'"` or `"No tools match 'xyz' — try a shorter search"`

### Clearing search
- Clicking × or clearing the input returns to the empty state (19 popular tools, tabs restored)

### Keyboard
- `Escape` clears the query and returns focus to the input
- First result card is tabbable; user can Tab through results

---

## Implementation

### Files modified

| File | Change |
|------|--------|
| `components/homepage/tool-grid.tsx` | Add search input + filter logic |
| `components/site-shell/nav.tsx` | Wire existing mobile search input to scroll-and-focus homepage search |

### No new files, no new dependencies

The `tool-catalog.ts` `ALL_TOOLS` array is the data source. It already has `slug`, `title`, `description`, `category`, `status`.

### State

```tsx
const [query, setQuery] = useState('')
const trimmed = query.trim().toLowerCase()
```

### Filter logic

```tsx
import { ALL_TOOLS } from '@/content/tool-catalog'

const searchResults = trimmed.length === 0
  ? null  // null = show popular tools (existing behavior)
  : ALL_TOOLS.filter(
      t => t.status === 'live' &&
        (t.title.toLowerCase().includes(trimmed) ||
         t.description.toLowerCase().includes(trimmed))
    )
```

`searchResults === null` means "show popular tools". `searchResults` is an array (possibly empty) means "show search results".

### Highlight helper

```tsx
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 dark:bg-amber-900/40 rounded-sm px-px">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
```

Only highlights the first occurrence — sufficient for tool names/descriptions.

### Category label on result cards

When `searchResults` is active, each tool card renders a small category label above the title:

```tsx
{searchResults && (
  <span className="text-[10px] uppercase tracking-wide text-fg-subtle mb-0.5 block">
    {CATEGORY_LABELS[tool.category]}
  </span>
)}
```

### Mobile nav wiring

The existing search `<input>` in `nav.tsx` (mobile menu) gets an `onChange` handler that:
1. Closes the mobile menu
2. Scrolls to `#tools` on the homepage
3. Sets a URL param `?q=` that the tool grid reads on mount to pre-fill the search

This means the mobile search experience: type in nav → nav closes → page scrolls to tool grid → grid is pre-filtered.

URL param approach:
- On mount: `const params = useSearchParams(); const q = params.get('q') ?? ''; setQuery(q)`
- On query change: update URL with `router.replace` (shallow, no navigation)

---

## Edge cases

| Case | Behavior |
|------|----------|
| Query matches 0 tools | Show empty state with "No tools match 'xyz' — try a shorter search" |
| Query matches 1 tool | Show single card, count reads "1 tool matches 'xyz'" |
| Coming-soon tools | Excluded from search results (`status === 'live'` filter) |
| Very long query | Input has `maxLength={60}`, no truncation issues |
| Special characters | `String.includes()` handles them safely; no regex needed |

---

## What this does NOT do

- No fuzzy matching (typo tolerance). Substring match is sufficient for 60 tools — "webp" finds "JPG to WebP", "compr" finds "Compress PDF".
- No search on the `/tools` page (separate page, out of scope).
- No analytics on search queries.
- No server-side search index.

---

## Verification

1. `npm run build` — zero TypeScript errors
2. Homepage: type "pdf" → grid shows all PDF tools, category tabs dim
3. Homepage: type "compress" → shows "Compress PDF", "Compress Image", plus any description matches
4. Homepage: type "zzz" → empty state with "No tools match" message
5. Homepage: press Escape → query clears, popular tools return
6. Mobile: open nav → type in search input → nav closes → page scrolls to tool grid → grid pre-filtered
7. Dark mode: search input uses correct dark colors (no hardcoded colors)
