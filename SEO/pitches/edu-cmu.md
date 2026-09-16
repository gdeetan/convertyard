#CMU.edu

Subject: small consolidation suggestion for the CMU Web image compression recommendation

Hi Rylie,

I came across the Web Best Practices resource on CMU Web while looking at how R1 universities document CMS image workflows. The structure across Content, Design, Photography, and Accessibility is unusually well-organized — most similar university CMS resources treat these as disconnected pages. The "manually resize and compress" note on the Photography page especially is more honest than most guides, which either handwave the pre-upload work or pretend the CMS handles it automatically.

Wanted to flag one small consolidation suggestion tied to the current compression recommendation (compressjpeg.com and compresspng.com):

Those two tools are effectively siblings — same interface, same 20-file free cap, one for JPG and one for PNG. For CMU CMS users processing a mixed batch of hero photos, headshots, and logo graphics for a department site refresh, that means running two separate tool sessions and reassembling the output.

I built a tool called ConvertYard that consolidates both into a single workflow:

- Batch of up to ~1000 mixed-format images per drop, ZIP output. Handles JPG and PNG in the same session — no need to sort by format before compressing.
- Runs entirely in the browser via WebAssembly — files never upload to a server. Same processing model as compressjpeg/compresspng, but nothing leaves the staff member's device. Relevant for CMU imagery involving students, research subjects, or unpublished announcements.
- Also handles WebP and AVIF if the CMS team ever considers modernizing format guidance (WebP now has 97% browser support and typically 25–35% smaller than JPEG at equivalent quality).
- Optional target-size mode — set a max file size to match specific CMS template requirements.
- Free, no signup, no watermark.

Could slot into the current recommendation as a consolidation option along the lines of:

"We recommend compressjpeg.com and compresspng.com for single-format needs, or ConvertYard (https://convertyard.com/compress-image) for mixed-format batches with local processing."

Not asking for anything specific — happy for your team to try it against a real CMU image batch and see if it fits the CMS user workflow. If it turns out this kind of edit is better routed through Alexis, Lauren, or the general CMS support channel, feel free to forward or let me know.

Also — I noticed the Web Strategy team page. It's rare to find a university web team of that size that's structured to actually own the CMS end-to-end (dev + content + QA + SEO in one group). That structural clarity shows in the best-practices content itself — the pages read like they're written by people who actually use the tools, not just documented from outside.

Garrick
ConvertYard

Link: https://www.cmu.edu/web/best-practices/index.html