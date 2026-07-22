# Conversion Presets — Design Spec

**Date:** 2026-07-22  
**Status:** Approved  
**Motivation:** ProductHunt feedback — users doing the same batch conversion settings repeatedly (e.g. "PDF to 300dpi JPG for client work") want to save and reapply those settings without re-tweaking every time.

---

## Decisions

| Question | Decision |
|---|---|
| Scope | Per-tool (isolated by slug) |
| Naming | User supplies a free-text name at save time |
| Cap | 5 presets per tool, delete by X on chip |
| UI placement | Above the options panel |
| Opt-in | Per-tool via `enablePresets?: true` on `ToolConfig` |
| Storage | `localStorage` |
| Existing tools | Unaffected — flag is opt-in |

---

## Data Model

Storage key: `cy-presets-v1:{slug}` (e.g. `cy-presets-v1:pdf-to-jpg`)  
Value: JSON array, max 5 entries, newest first.

```ts
type SavedPreset = {
  id: string        // crypto.randomUUID()
  name: string      // user-supplied, trimmed, max 40 chars
  values: ToolOptions  // Record<string, unknown>
  savedAt: number   // Date.now()
}
```

**Serialization rules:**
- All option types serialize cleanly: slider, toggle, dropdown, radio, number, color-picker, number-with-chips
- `image-upload` values (File | null) are excluded on save — they can't be serialized to JSON
- If localStorage throws (private browsing, quota), `save` silently no-ops; UI stays functional

---

## Hook: `lib/hooks/use-user-presets.ts`

```ts
function useUserPresets(slug: string): {
  presets: SavedPreset[]
  save: (name: string, values: ToolOptions) => void
  remove: (id: string) => void
}
```

- Reads from localStorage once on mount
- `save`: strips File/null values, prepends new preset, trims array to 5, writes back
- `remove`: filters by id, writes back
- All localStorage access wrapped in try/catch — silent fallback to empty array

---

## Component: `components/tool-shell/user-preset-bar.tsx`

Props:
```ts
interface UserPresetBarProps {
  slug: string
  currentValues: ToolOptions
  onApply: (values: ToolOptions) => void
}
```

### States

**No saved presets:**
```
[Save current settings]   ← subtle button
No saved presets yet.
```

**Has presets:**
```
Presets:  [Client work 300dpi ×]  [Screen PDF ×]  [Save current]
```

**Saving (inline):**
```
Presets:  [Client work 300dpi ×]  [___________ input___] [Save] [Cancel]
```

### Behavior

- **Apply**: `onApply` called with `preset.values` — merged in `ToolShell` via `setOptions(prev => ({ ...prev, ...preset.values }))`. Options not in the preset keep their current value.
- **Delete (×)**: removes immediately, no confirmation
- **Save flow**: "Save current" button → inline input auto-focuses → Enter or "Save" button confirms → name trimmed, capped at 40 chars → added to front of list
- **At cap (5)**: "Save current" is hidden; UI shows "5/5 — delete one to save more"

---

## ToolConfig change

```ts
// lib/types.ts
interface ToolConfig {
  // ... existing fields ...
  enablePresets?: true   // opt-in; omitting = no presets UI shown
}
```

---

## ToolShell change

Single new block in `components/tool-shell/tool-shell.tsx`, inside the "Idle: files present" section, above `<OptionsPanel>`:

```tsx
{config.enablePresets && (config.options?.length ?? 0) > 0 && (
  <UserPresetBar
    slug={config.slug}
    currentValues={options}
    onApply={handlePresetApply}
  />
)}
```

`handlePresetApply` already exists in ToolShell (used by the PDF `PresetBar`):
```ts
const handlePresetApply = useCallback((values: ToolOptions) => {
  setOptions(prev => ({ ...prev, ...values }))
  setAdvancedOpen(true)
}, [])
```

No other changes to ToolShell. No existing tool is affected.

---

## Files to create/modify

| File | Action |
|---|---|
| `lib/hooks/use-user-presets.ts` | Create |
| `components/tool-shell/user-preset-bar.tsx` | Create |
| `lib/types.ts` | Add `enablePresets?: true` to `ToolConfig` |
| `components/tool-shell/tool-shell.tsx` | Add one conditional block |

Enabling for a specific tool (example):
```ts
// content/tools/pdf-to-jpg.ts
export const pdfToJpg: ToolConfig = {
  // ...
  enablePresets: true,
}
```

---

## What this does NOT do

- No cross-tool preset sharing
- No export/import of presets
- No cloud sync
- No preset applied on page load automatically (user must click)
- No undo for delete
