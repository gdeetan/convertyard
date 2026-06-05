# Homepage Spec

The homepage is the most important page on the site. It sets brand
perception in 5 seconds and converts visitors into bookmarkers. This
spec defines every section, every copy line, and every interaction.

## Structure (top to bottom)

1. Nav
2. Hero (with live demo)
3. Trust strip
4. Tool grid
5. How it works
6. Comparison table
7. Use cases
8. FAQ
9. Footer

## Section 1: Nav

**Desktop:**
- Sticky, ~64px tall, semi-transparent background with backdrop blur
- Left: ConvertYard wordmark (links to /)
- Center-right: "Tools" (megamenu trigger), "How it works", "Blog"
- Far right: small "Local-first" badge with lock icon (tooltip:
  "All processing runs in your browser")
- Border-bottom: 1px subtle line, only appears after scroll

**Mobile:**
- Same height, simplified content
- Left: wordmark
- Right: hamburger icon
- Tap hamburger: full-screen overlay with search bar, category
  accordions, "How it works", "Blog", and footer links

**Megamenu (desktop)**

When user hovers "Tools," reveal a panel below the nav:

| Images | PDF | Video & Audio | Developer | Web Tools | AI Tools |
|---|---|---|---|---|---|
| HEIC to JPG | Merge PDF | MP4 to MP3 | JSON formatter | Favicon | Alt text |
| JPG to WebP | Compress PDF | Video compressor | Base64 | OG image | Background remover |
| WebP to JPG | PDF to JPG | Video to GIF | Diff checker | QR code | Image upscaler |
| Background remover | Split PDF | Audio trimmer | JWT decoder | Color picker | Transcription |
| Image resizer | PDF to Word | Extract audio | Regex tester | Gradient | Image description |
| *See all* | *See all* | *See all* | *See all* | *See all* | *See all* |

## Section 2: Hero

**Desktop layout: 60/40 split**

Left side (60%):
```
[Eyebrow text: "ConvertYard" — small, brand color]

[H1]
Local-first conversion,
built for batches.

[Subhead, max 2 lines]
Convert thousands of images, PDFs, videos, and audio files
entirely in your browser. Nothing uploads.

[Two CTAs side-by-side]
[Primary: Browse tools →]  [Ghost: How it works]

[Trust micro-line, small text]
🔒 No accounts. No uploads. No watermarks. Clean tool UIs.
```

Right side (40%):

**Live mini-converter: JPG → WebP**

A working dropzone showing:
- "Drop a JPG to see ConvertYard in action"
- After drop: image preview, conversion happens in <500ms
- Result: "Original: 2.4 MB → WebP: 380 KB (saved 84%)"
- "Download" button + "Try another" link
- Tiny note below: "This file never left your device."

This single component does more selling than all the homepage copy.

**Mobile layout: stacked**

- H1 and subhead at top
- CTAs below
- Mini-converter below CTAs (full width)
- Skip the eyebrow text on mobile (saves vertical space)

**Copy specs:**

H1: Always two lines. Don't compress to one.
Subhead: Max 22 words. Lead with what (convert files), specify scale
(thousands), end with the wedge (nothing uploads).
Primary CTA: "Browse tools" — anchor scrolls to tool grid
Ghost CTA: "How it works" — anchor scrolls to that section

## Section 3: Trust strip

3 columns, single row on desktop, stacked on mobile.

| 🔒 | 📦 | ⚡ |
|---|---|---|
| **Nothing uploads** | **Built for batches** | **Respectful by design** |
| All processing runs via WebAssembly, on your device. | 1,000+ files at once, downloaded as a single ZIP. | No signups. No email walls. Tool UIs stay clean — minimal ads only appear below tools, never in your way. |

Background: `--color-bg-muted` to separate from hero.
Padding: generous (96px vertical desktop, 64px mobile).
Icons: simple line icons, not emoji in production. Lucide-react works.

## Section 4: Tool grid

The main content of the homepage. Shows 12–16 tools with category filters.

**Filter pills above grid:**
[All]  [Images]  [PDF]  [Video & Audio]  [Developer]  [Web Tools]  [AI Tools]

Active filter has filled background, others have ghost style. Filter
state lives in URL hash (`#images`) so it's shareable.

**Card layout:**

Each card:
```
┌─────────────────────────────┐
│ [Icon]      [Category Badge]│
│                             │
│ JPG to WebP                 │
│ Convert and compress.       │
│ Up to 1,000 files at once.  │
│                             │
│                       →     │
└─────────────────────────────┘
```

- Icon: simple representation of the format (or generic file icon)
- Category badge: small pill in muted color
- Title: H3, font-medium
- Description: one line, max 12 words
- Arrow on hover indicates clickability
- Entire card clickable, hover-state lifts subtly (translate-y -2px,
  shadow-md)

**Grid:**
- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1 column (full width)
- Uniform card heights via grid-auto-rows

**Default content (12 tools to launch with):**

1. HEIC to JPG (Images)
2. JPG to WebP (Images)
3. PNG to WebP (Images)
4. WebP to JPG (Images)
5. Background remover (Images, "AI" badge)
6. Bulk image compressor (Images)
7. Merge PDF (PDF)
8. Compress PDF (PDF)
9. PDF to JPG (PDF)
10. MP4 to MP3 (Video & Audio)
11. JSON formatter (Developer)
12. Alt text generator (AI)

Below grid: "View all 60+ tools →" link (links to /tools page once
that exists).

## Section 5: How it works

Three-step explainer of the wedge.

**Layout:** 3 columns desktop, stacked mobile.

```
[1]                  [2]                  [3]
Drop your files      Convert in your      Download
                     browser
                     
Click or drag,       Real WebAssembly.    Single file or ZIP,
one file or a        Your files never     instantly ready.
thousand.            leave your device.
```

Below the three steps:

> **Wait — how does it work without uploading?**
>
> WebAssembly lets us run the same C++ libraries that desktop apps use
> (libvips, ffmpeg, pdf-lib) directly inside your browser. The same
> code that powers Photoshop's CLI runs in this tab, on your CPU,
> without sending your file anywhere.
>
> [Read the full technical explanation →]

This paragraph builds credibility with technical visitors who want
proof. Link goes to a longer article that explains the architecture.

**Key visual:** a small animated graphic showing a file entering the
browser, processing happening (with a "Network: 0 requests" indicator),
and the converted file leaving. This is the most persuasive single
asset on the homepage.

## Section 6: Comparison table

Honest, factual. Don't name competitors.

|  | **ConvertYard** | **Typical online converters** |
|---|---|---|
| Files uploaded to a server | Never | Always |
| Maximum batch size | 1,000+ | 5–20 |
| Account required | No | Often |
| Works offline after first load | Yes | No |
| Watermarks on output | Never | Sometimes |
| Ads above the fold | Never | Usually |
| Ads in the conversion flow | Never | Usually |

Visual style: clean table, alternating row backgrounds, checkmarks
green and Xs muted red. ConvertYard column has subtle brand-color
left border.

## Section 7: Use cases

3 audience blocks. Photo on each (illustration, not stock photo).

**For photographers**
Convert hundreds of HEIC or RAW files from a shoot without uploading
client work to anyone's servers. Batch compress, resize, and rename
in one pass.

**For developers**
Clean, fast tools that respect your time. Shareable URLs for state.
API access coming soon.

**For sensitive files**
Contracts, medical records, financial documents. They stay on your
device, end of story.

Each block has a "See the tools →" link that filters the tool grid
above by relevant tag.

## Section 8: FAQ

Accordion-style, 8 questions, with FAQPage schema markup.

1. **How can conversion happen without uploading?**
   ConvertYard uses WebAssembly to run conversion libraries directly
   in your browser. Your files are processed locally by your CPU and
   never sent to any server.

2. **Is there a file size limit?**
   It depends on your device's memory. Most browsers can handle files
   up to ~2GB. We surface a clear warning when a file is too large.

3. **What's the maximum batch size?**
   We've tested up to 1,000+ files per batch. The practical limit
   depends on your device. Older phones may handle fewer; modern
   laptops handle thousands.

4. **Do you store any data about my files?**
   No. We never see your files, so we can't store anything. We use
   privacy-first analytics (Cloudflare Web Analytics) that doesn't
   use cookies or track individuals.

5. **Do you show ads?**
   Yes, minimal display ads appear below tools and within articles.
   They never appear inside the conversion flow, above the fold, or
   anywhere they'd get in your way. Your files are still processed
   entirely locally — ads and file processing are completely separate.
   We use Google AdSense and may add other ad networks (e.g.,
   Mediavine) as the site grows.

6. **Do you use Google Analytics or cookies?**
   Yes — the site uses Google Analytics to understand which tools are
   popular and improve them. Ad networks may also set cookies for ad
   delivery. This is standard for content sites. None of it touches
   your files, which are processed entirely in your browser. We show
   a cookie consent banner to visitors in regulated regions.

7. **Does it work offline?**
   Yes, after your first visit. Once the tool's WebAssembly module
   is cached, it works without internet.

8. **Why is this free?**
   Tools should be free, so they are. The site is supported by
   minimal display ads below tools and on articles. Tool UIs
   themselves stay clean — no ads in the conversion flow, ever.
   We may also add a paid API tier in the future for developers.

9. **Do I need to create an account?**
   No. There's no signup, no email wall, no login. Open a tool, use
   it, leave.

10. **Are there watermarks on output files?**
    Never. Your output files are identical to what you'd get from
    desktop software.

Below FAQ: "Still have questions? Email hello@convertyard.com" with
mailto link.

## Section 9: Footer

See `DESIGN-SYSTEM.md` for component spec. Content:

**Column 1: Tools**
- Image converters
- Image editing
- PDF tools
- Video & audio
- Developer tools
- Web tools
- AI tools
- View all tools →

**Column 2: Resources**
- How it works
- Blog
- API (coming soon)
- GitHub (if OSS components)

**Column 3: Company**
- About
- Contact
- Press kit

**Column 4: Legal**
- Privacy
- Terms

**Bottom strip:**
ConvertYard wordmark · Local-first conversion, built for batches.
Your files stay on your device. Always.
Files processed locally in your browser. We never see them.
© {year} ConvertYard

## Copy voice — homepage-specific rules

- **Direct over clever.** "Convert thousands of files" beats "Unleash
  the power of conversion."
- **Facts over claims.** "Files never leave your browser" (verifiable)
  beats "We respect your privacy" (claim).
- **Numbers add credibility.** "1,000+ files," "saved 84%," "60+ tools."
  Use them.
- **Active voice always.** "We never see your files," not "Your files
  are never seen."
- **No marketing-speak.** Avoid: leverage, unlock, empower, seamless,
  revolutionary, game-changing, AI-powered (only when literally true).

## Performance targets for homepage

- LCP: <1.2s (homepage should be the fastest page on the site)
- TTI: <1.5s
- CLS: 0
- Initial JS: <60kb gzipped (no WASM loaded until hero converter is
  interacted with)
- Total page weight on first load: <300kb (excluding lazy-loaded WASM)

## Mobile-specific notes

- Hero converter is full-width below CTAs
- Trust strip becomes 1 column, stacked
- Tool grid is 1 column
- Comparison table: convert to side-by-side cards instead of table
- FAQ accordion items are full-width tappable
- All touch targets ≥44×44px
- Sticky CTA at bottom of viewport on scroll: "Browse tools" — appears
  after user scrolls past hero (optional, A/B test)

## Things to A/B test post-launch

- Hero converter format (JPG→WebP vs HEIC→JPG)
- Primary CTA copy ("Browse tools" vs "Start converting" vs "See all
  tools")
- Trust strip order (which proof point first)
- Tool grid default tab (All vs Images)
- Whether to add a video/animated explainer below hero

## What ships in v1, what waits

**Ships at launch:**
- All sections above
- 12 tools in grid
- Live hero converter
- Full FAQ with schema
- Comparison table

**Waits for later:**
- Blog (month 2)
- Use case audience blocks (can ship with placeholder if needed)
- Animated "how it works" graphic (static version first, animate later)
- API mentions (only when API is real)
