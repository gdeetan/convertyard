# Text to HTML Converter — Design Spec

**Date:** 2026-08-11  
**Slug:** `text-to-html`  
**Section:** Developer Utilities  
**Status:** Approved

---

## Overview

A browser-based text-to-HTML converter for developers. Accepts Markdown or plain text via paste/type, auto-detects format, and outputs a full HTML document with GitHub-style CSS. Features a split-pane UI: raw HTML on the left, live iframe preview on the right. Pure JS — no WASM, no uploads.

---

## Architecture

Custom page implementation (not `TextToolShell` or `ToolShell`). The split-pane + iframe UX is incompatible with either shell. Follows the regex-tester precedent.

**Files:**
```
app/(tools)/text-to-html/page.tsx   — full page component (self-contained)
lib/converters/text-to-html.ts      — conversion logic
```

**Dependencies:**
- `marked` — Markdown parser (~45kb). Check if already present via markdown-to-pdf before adding.
- `highlight.js` (HTML language pack only) — syntax highlighting for the raw HTML panel. Loaded lazily on first conversion.

**Data flow:**
```
user types/pastes input
  → auto-detect format (or use toggle override)
  → run converter (debounced 300ms)
  → update htmlString state
      → left panel: syntax-highlighted raw HTML
      → right panel: iframe srcdoc={htmlString}
```

No "Convert" button. Conversion is live/reactive.

---

## Input

- Single `<textarea>`, full-width, ~12 rows
- Paste or type only — no file upload (text tool, not file tool)
- Placeholder: `Paste Markdown or plain text here…`

---

## Format Detection

Auto-detection is heuristic, content-based (no file extension available):

```
if content matches /^#{1,6} |^\*\*|^\[.+\]\(|^```/m  → Markdown mode
else                                                    → Plain Text mode
```

A **Format toggle pill** (`Markdown` / `Plain Text`) sits above the output panels. It reflects the auto-detected mode and can be clicked to override. Overriding locks the mode until the input changes significantly or the user clicks again.

---

## Conversion Logic

### Markdown mode
- Strip YAML frontmatter (`---` blocks) before parsing
- Run `marked` with default options
- Output is the converted HTML body content

### Plain Text mode
- Escape `<`, `>`, `&` as HTML entities
- Double newlines → `<p>` tags
- Single newlines → `<br>`
- No auto-linking URLs in v1

---

## Output Document Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{first H1 extracted from input, or "Document"}</title>
  <style>/* github-markdown-css inlined, ~8kb minified */</style>
</head>
<body class="markdown-body">
  {converted content}
</body>
</html>
```

- `<title>` auto-extracted from the first `# H1` in the input (stripped of `#` and trimmed)
- GitHub CSS sourced from `github-markdown-css` package, inlined at build time as a string constant
- Output is a self-contained, deployable HTML file

---

## UI Layout

```
┌─────────────────────────────────────────────┐
│  [Input textarea — full width, ~12 rows]    │
├──────────────────┬──────────────────────────┤
│  [Format: Markdown ▾]        [Clear]        │
├──────────────────┬──────────────────────────┤
│  Raw HTML        │  Preview                 │
│  ─────────────── │  ──────────────────────  │
│  <pre> with      │  <iframe srcdoc>         │
│  syntax hl       │  sandboxed               │
│                  │                          │
│  [Copy] [Download] │                        │
└──────────────────┴──────────────────────────┘
```

- Desktop: two equal columns side by side
- Mobile: stacked (input → controls → raw HTML → preview)
- Trust badge below input: `🔒 Runs entirely in your browser.`

### Left panel — Raw HTML
- `<pre><code>` with highlight.js HTML highlighting (lazy-loaded)
- Copy button (top-right): copies full HTML string to clipboard
- Download button: saves as `output.html` (filename not available since no file upload)

### Right panel — Preview
- `<iframe srcdoc={htmlString}>`
- `sandbox="allow-same-origin"` — scripts disabled in preview for security
- iframe height: auto-sized to content via `contentDocument.body.scrollHeight` after load
- Scrollable if content overflows

---

## Controls

- **Format toggle pill** — `Markdown` / `Plain Text`, auto-detected, clickable override
- **Clear button** — resets input and output
- No other options in v1

---

## SEO

| Field | Value |
|---|---|
| Slug | `text-to-html` |
| Title tag | `Text to HTML Converter — ConvertYard` |
| H1 | `Text to HTML Converter` |
| Subtitle | `Local-first conversion. Built for developers.` |
| Meta description | `Convert Markdown or plain text to HTML in your browser. Live preview with GitHub styling. Files never leave your device.` (143 chars) |
| Category | Developer Utilities (`/developer`) |

### FAQ Entries (6)

1. **Does this support Markdown?** Yes — paste any Markdown and the tool auto-detects it. Headers, lists, links, code blocks, and tables are all supported via the `marked` parser.
2. **What's the difference between Markdown and plain text mode?** Markdown mode parses formatting syntax (`#`, `**`, `` ` ``, etc.) into HTML elements. Plain text mode wraps paragraphs in `<p>` tags and escapes special characters — no formatting interpreted.
3. **Are my files uploaded anywhere?** No. Conversion runs entirely in your browser using JavaScript. Nothing is sent to a server.
4. **Can I use the HTML output directly on a website?** Yes. The output is a complete HTML document with a `<!DOCTYPE html>` declaration and inlined CSS — ready to open in a browser or deploy as a static page.
5. **Why is the preview sandboxed (scripts disabled)?** The iframe preview disables script execution for security. The raw HTML output includes no scripts by default, but if your Markdown contained `<script>` tags they'd be visible in the code panel and absent from the preview.
6. **What CSS theme does the output use?** The GitHub Markdown CSS theme — the same stylesheet GitHub uses to render README files. It's inlined directly in the `<head>` so the output file is fully self-contained.

---

## Out of Scope (v1)

- File upload / batch processing (this is a text tool, not a file tool)
- URL auto-linking in plain text mode
- Custom CSS input
- Fragment-only output toggle
- Table of contents generation
- Syntax highlighting inside code blocks in the preview
