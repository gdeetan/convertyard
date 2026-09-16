##CMU.edu

1. rbrown@andrew.cmu.edu ← Rylie Brown, Web Content Editor (best guess) -- SEND PITCH AUG 18 2026
2. amorrell@andrew.cmu.edu ← Alexis Morrell, Senior Digital Content Specialist (secondary)
3. lpontzer@andrew.cmu.edu ← Lauren Pontzer, Director of Web Strategy (team lead — use if #1/#2 bounce)
4. dhache@andrew.cmu.edu ← Don Haché, Customer Success Specialist (external-facing; often routes external inquiries)
5. it-help@cmu.edu — CMU IT support routing (last resort)

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

Notes:

- Called Rylie by first name. R1 university web content editors typically respond warmly to peer-professional outreach at first-name level. Do not over-formal this.
- Consolidation is the specific hook. Pointing out that compressjpeg + compresspng are two clicks of the same workflow gives editorial justification — you're saving CMU staff friction, not just adding another tool.
- Named the exact substitution copy. The suggested edit adds ConvertYard as a consolidation option while keeping compressjpeg/compresspng in the copy. Never asks CMU to remove anything.
- Soft WebP hook but explicitly framed as "if you ever consider" — respects that format guidance changes require formal review at a university this size. Doesn't push.
- "If Alexis, Lauren, or general support is a better route, feel free to forward" — soft handoff option. Multiple named contacts in the routing shows you did research, not just fired at a generic inbox.
- Compliment referenced the team's structural clarity — reads as substantive because it's true. Web Strategy team at CMU is genuinely well-organized (dev + content + QA + SEO under one director is unusual).
- Do NOT mention SEO, DA, or backlinks. Same rule.
- Follow up once at 3 weeks. If Rylie is silent, try Alexis with a light "wanted to make sure this reached the right person" bump.
- Tenth .edu pitch queued. CMU would be one of your highest-authority .edu wins if it lands — R1, extensively cited, top CS program. Worth extra care on the follow-up etiquette.

Link: https://www.cmu.edu/web/best-practices/index.html

##UCSF

1. Support form: https://pharmacy.ucsf.edu/support ← Office of Communications intake (their stated channel)
2. web@pharmacy.ucsf.edu (guess — try before form if you want email tracking) -- PITCH SENT AUG 18 2026
3. communications@pharmacy.ucsf.edu (guess)
4. LinkedIn: search "UCSF School of Pharmacy" + "Web" / "Communications" / "Digital"
5. Faculty Resources page contact — https://pharm.ucsf.edu/faculty-resources/pharmacy

Subject: batch alternative to Squoosh for the mandatory PNG→JPG conversion workflow

Hi UCSF School of Pharmacy web team,

I came across the Web Editor Help "Images" page while looking at how R1 medical schools document image workflows for microsite editors. Two things caught my attention:

- The mandatory PNG→JPG conversion rule is unusually strict compared to peer institutions, and honestly the right call — most university CMS docs handwave format guidance and let file bloat accumulate. Yours doesn't.
- Recommending Squoosh specifically (with the Browser JPEG setting) shows the team picked a tool for the right reason: local WASM processing rather than uploading to a third-party server. That matters when microsite editors handle research imagery, patient-adjacent content, or unpublished study materials.

Wanted to flag one workflow gap that follows from those two decisions:

Squoosh is excellent for tuning a single image with its slider preview, but it doesn't batch. For a microsite editor converting a full lab team photo set, a research poster gallery, or a batch of PNG figures from a manuscript, converting one file at a time in Squoosh becomes real friction — they either skip the conversion and violate the PNG rule, or spend meaningful time per file.

I built a tool called ConvertYard that fits this specific gap while honoring the same philosophy as your Squoosh recommendation:

- Runs entirely in the browser via WebAssembly — nothing uploaded, same processing model as Squoosh. Same privacy posture that made Squoosh the right tool for UCSF content.
- Batch of up to ~1000 PNGs per drop, ZIP output. Direct answer to Squoosh's single-file limitation for the exact use case your PNG rule creates.
- Handles PNG → JPG conversion natively, with per-format quality control equivalent to Squoosh's Browser JPEG setting.
- Free, no signup, no watermark.

Could slot into the current image guidance as a batch complement along the lines of:

"Convert single PNG files to JPG with Squoosh (Browser JPEG setting). For batches of PNG files, ConvertYard (https://convertyard.com/compress-image) uses the same local-browser processing with support for compressing many files at once."

Not asking for anything specific — happy for your web editor team to try it against a real UCSF PNG batch and see if it fits the workflow you document. If there's a better contact for whoever maintains the Web Editor Help pages, I'd appreciate a forward.

Also — the decision to publish a public Web Editor Help site rather than gate the documentation behind login is quietly generous. It's how tools like Squoosh get organically adopted across institutions in the first place: someone at another university finds your page while researching their own guide and learns "oh, this is what a mature CMS documentation practice looks like."

Garrick
ConvertYard

## siue.edu

Link: https://kb.siue.edu/87113

#Cornell.edu

Link: https://primo.qatar-weill.cornell.edu/discovery/fulldisplay?docid=alma991000602745306691&context=L&vid=974WCMCIQ_INST:VU1&lang=en&adaptor=Local%20Search%20Engine&tab=Everything&query=sub%2Cexact%2C%20Multimedia%20systems%20%2CAND&mode=advanced

#usu.edu
Link: https://libguides.usu.edu/engl2010engler/videoproduction

#minnstate.edu

Link: https://servicedesk.minnstate.edu/TDClient/30/Portal/KB/Article/99/Video-Note-technical-specifications-in-D2L-Brightspace

#sfsu.edu

Link: https://gcoe.sfsu.edu/cahill/editing-video-files-imovie

#uh.edu

Link: https://www.uh.edu/uhdistance/louis/cle/tool.html

## appinventor.mit.edu

Link: https://community.appinventor.mit.edu/t/server-error-could-not-upload-file-while-uploading-large-video-file/133849

## newpaltz.edu

Link: https://hawksites.newpaltz.edu/edtech/2018/05/21/shrinking-powerpoint-file-size-for-wordpress/

## videoproc.com

Link: https://www.videoproc.com/video-editor/best-video-compressor.htm 

## animatron.com

Link: https://www.animatron.com/blog/best-video-compressors/

## videobgremover.com

Link: https://videobgremover.com/blog/best-video-compressors

## icecreamapps.com

Link: https://icecreamapps.com/learn/top-video-compressors.html

## dragonfly.co.uk

Link: https://www.dragonfly.co.uk/video-production-resources/best-video-compression-software/

## fastreel.com

Link: https://www.fastreel.com/best-video-compressor.html

## ireashare.co

Link: https://www.ireashare.com/video-compressor/best-video-compressor.html

## fixthephoto.com

Link: https://fixthephoto.com/best-video-compression-software.html

## screenapp.io

Link: https://screenapp.io/blog/best-free-video-compressor

## gumlet.com
Link: https://www.gumlet.com/learn/video-compression-tools/

#Envato

Link: https://photography.tutsplus.com/articles/10-best-size-reducer-video-compression-software-free-paid-2024--cms-108386

## MyThemeshop

Link: https://mythemeshop.com/blog/best-video-compressors/

#PCMag

Link: https://www.pcmag.com/picks/the-best-video-editing-software

## on4t.com

Link: https://on4t.com/blog/best-video-compressor

site:.edu "compress video"

## Follow-up templates

### Standard bump (most targets)

Subject: Re: [original subject]

Hi [Name],

Wanted to make sure my note about ConvertYard for your image compression post didn't get lost. No pressure if it's not a fit — just following up once.

Original message below for context.

Garrick

---

### .edu bump (day 21)
---

### .edu bump (day 21)

Subject: Re: [original subject]

Hi [team / Name],

Following up on the suggestion I sent about adding a batch tool to the [page name] guide. If someone else on the team maintains that page, I'd appreciate a forward.

Original message below.

Garrick
ConvertYard

---

### Channel-switch bump (solo bloggers)

If you emailed first, try IG/X DM:

Hi [Name] — sent you an email a few days back about ConvertYard fitting into your [post name]. Wasn't sure which channel you check more. No pressure if it's not a fit.

Garrick / ConvertYard

---

## Reply protocol

1. **Positive reply → same-day response.** If they say "send benchmark" or "send outline," send within 24 hours. Delay kills momentum.
2. **"Not a fit" reply → log and move on.** Do NOT try to argue or re-pitch. Thank them briefly.
3. **Neutral / questions → answer directly, no pressure.** Give them what they asked for. Don't turn it into a new pitch.
4. **Ghosted after follow-up → status: Ghosted. Move on.** Do not send a second follow-up ever.

---