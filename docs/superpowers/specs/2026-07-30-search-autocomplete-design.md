# Search Autocomplete Dropdown — Design Spec

**Date:** 2026-07-30  
**Status:** Approved

## Problem

The current search experience has two weak spots:

1. **Desktop nav:** No search at all. Users must navigate to `/tools` to search.
2. **`/tools` page search + mobile nav search:** Results appear as a card grid below the input (or redirect on Enter), not as an instant dropdown. Reaching a tool requires reading through cards and clicking. Goal state: type a few chars → see the tool name → tap → done.

## Solution

Build a shared `ToolSearchCombobox` component and deploy it in three places:
- Desktop nav (behind an expandable search icon)
- Mobile nav (replacing the current Enter-to-redirect input)
- `/tools` page (replacing the inline card-results pattern)

---

## Component: `components/ui/tool-search-combobox.tsx`

### Props

```ts
interface ToolSearchComboboxProps {
  placeholder?: string       // default: "Search tools…"
  onNavigate?: () => void    // called after user selects a result (e.g. close mobile menu)
  autoFocus?: boolean        // focus input on mount (desktop nav expansion)
  className?: string
  // Optional controlled mode — used by /tools page to sync query with the card grid
  value?: string
  onChange?: (value: string) => void
}
```

When `value`/`onChange` are provided the component operates in controlled mode (the tools page uses this). Otherwise it manages its own internal query state (nav uses this).

### Data source

Filters `ALL_TOOLS` from `@/content/tool-catalog` where `status === 'live'`.  
Match on `tool.title` and `tool.description` (case-insensitive substring).  
Sort: title matches ranked above description-only matches.  
Cap display at **8 results**.

### Dropdown row anatomy

```
  HEIC to JPG          Images
  JPG to WebP          Images
  PNG to WebP          Images
```

Left: tool title with matched substring **bold/highlighted** (same `highlight()` helper as today).  
Right: small muted category label (e.g. `Images`, `PDF`, `Developer`).

### Keyboard behaviour

| Key | Action |
|-----|--------|
| `↓` / `↑` | Move active result up/down |
| `Enter` | Navigate to active result (or first result if none active) |
| `Escape` | Close dropdown, clear input, return focus to trigger |
| `Tab` | Close dropdown, move focus normally |

### Mouse behaviour

- Hover highlights a row.
- Click navigates to that tool via `router.push(slug)`, then calls `onNavigate?.()`.
- Click outside the combobox closes the dropdown (no navigation).

### Empty state

When query is non-empty and 0 results: show `No tools match "…"` inside the dropdown panel.

### Accessibility

- Input has `role="combobox"`, `aria-expanded`, `aria-controls` pointing to the listbox.
- Dropdown has `role="listbox"`; each row is `role="option"` with `aria-selected`.
- Active descendant tracked via `aria-activedescendant`.

---

## Nav — Desktop

**File:** `components/site-shell/nav.tsx`

A search icon button (`<Search />`) is added to the desktop nav, to the left of the "Local-first" badge. State: `searchOpen: boolean`.

- When `searchOpen === false`: show the icon button.
- When `searchOpen === true`: icon button hides, `ToolSearchCombobox` renders in its place (width ~280px) with `autoFocus`.
- Clicking outside the expanded search bar (or pressing Escape) sets `searchOpen = false`.
- The combobox's `onNavigate` also sets `searchOpen = false`.

No layout shift — the icon and the expanded bar occupy the same flex slot.

---

## Nav — Mobile

**File:** `components/site-shell/nav.tsx`

The existing search `<input>` in the mobile menu scrollable area is replaced with `<ToolSearchCombobox>`.

- `onNavigate` calls `closeMobileMenu()`.
- Dropdown renders inside the scrollable mobile menu panel, positioned below the input.
- No redirect-on-Enter behaviour — selecting a result navigates directly.

---

## `/tools` Page

**File:** `components/tools-page/tools-search.tsx`

The existing `<input>` is replaced with `<ToolSearchCombobox>`. The dropdown gives instant jump-to-tool. The card grid below continues to filter reactively from the same query state — lifted up so both the combobox and the grid share it.

Concretely:
- `ToolsSearch` owns `query` state.
- Passes `query` / `setQuery` down to `ToolSearchCombobox` (or combobox calls a shared setter).
- The grid filters as before whenever `query` changes.
- The dropdown overlays the grid (z-indexed above it) when open.

The "X results match" count line stays; the card grid stays. Dropdown is additive, not a replacement for the grid.

---

## Shared highlight helper

The existing `highlight()` function in `tools-search.tsx` moves to `lib/utils/highlight.tsx` so the combobox can import it without circular deps.

---

## Files changed

| File | Change |
|------|--------|
| `components/ui/tool-search-combobox.tsx` | **New** — shared combobox component |
| `lib/utils/highlight.tsx` | **New** — extracted highlight helper |
| `components/site-shell/nav.tsx` | Add desktop search icon + expansion; replace mobile search input |
| `components/tools-page/tools-search.tsx` | Replace input with combobox; lift query state |

---

## Out of scope

- Cmd+K global shortcut (can be added later as an enhancement)
- Search result icons per tool
- Search history / recent tools
- Fuzzy matching (substring is sufficient for the current catalog size)
