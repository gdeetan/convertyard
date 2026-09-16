# Lawyerist pitch — Original draft has fatal problems; Path B rewrite outlined

**Reference article:** "Workflows for Going Paperless" (Part 2 of 3 based on URL)
**URL:** https://lawyerist.com/news/going-paperless-workflow-part-2-of-3/
**Author:** Todd N. Hendrickson (trial lawyer, ~25 years med-mal/personal injury, St. Louis — his `/author/todd-hendrickson/` page 404s, so he's no longer active on the site)
**Original published:** February 22, 2013
**Last updated:** February 3, 2020 (5+ years stale, 12 years since origin)

## What the article actually covers (verified)

1. **Incoming paper:** scan everything, name with `YYYYMMDD.description` format for chronological sorting
2. **Outgoing paper:** print/save to PDF instead of print-scan
3. **Digital signatures:** HelloSign, DocuSign, or signature font in Word
4. **File templates:** pre-populated folders per client/matter

**Not covered:** OCR (barely mentioned), **compression** (not a section at all), Smallpdf, ILovePDF, PDF Candy.

## Four fatal problems with the original draft

### 1. Wrong author greeting

Pitch says "Hi Sam." Article author is **Todd Hendrickson**. "Sam" is likely Sam Glover — Lawyerist's founder — who stepped back from active editorial role years ago. Current leadership: Stephanie Everett (CEO). Wrong-name greeting to a founder-who-left is worse than a generic team greeting.

### 2. Fabricated tool list

Pitch names Smallpdf, ILovePDF, and PDF Candy as tools "your article" recommends. **None of them appear in Todd's article.** Same fabrication pattern that killed the KeyCDN, Speckyboy, and (original) SlashGear pitch drafts.

### 3. Fabricated compression step

Pitch says "the workflow cleanly: scan, OCR, compress, file" and hooks on "what happens during the compression step." Todd's actual workflow: scan → name → print-to-PDF → sign. Compression isn't in the article. The hook lands on air.

### 4. Todd Hendrickson has left Lawyerist

`/author/todd-hendrickson/` returns 404. Even if the pitch content were correct, he's not there to receive it.

## The underlying angle IS genuinely valuable

Attorneys uploading privileged documents to third-party PDF processors is a real legal ethics concern:
- **ABA Model Rule 1.6(c):** "A lawyer shall make reasonable efforts to prevent the inadvertent or unauthorized disclosure of, or unauthorized access to, information relating to the representation of a client."
- Multiple state bar ethics opinions on cloud/third-party tool use (NY 842, CA Formal Opinion 2010-179, TX Opinion 680, PA Formal Opinion 2011-200, others)
- Client confidentiality applies to how documents are *processed*, not just how they're stored

That's a real Lawyerist-fit angle. But it needs a different vehicle than a fabricated hook on Todd's 12-year-old article.

## Path B: pitch a NEW article, correctly framed

**Working title:** *"The Third-Party Upload Trap: Client Confidentiality and 'Free' PDF Tools Under Model Rule 1.6"*

**Angle:** many attorneys don't realize that free web-based PDF compression, conversion, and OCR tools upload the client document to a third-party server. This isn't a hypothetical exposure — Smallpdf, ILovePDF, PDF Candy, and most of the "free PDF tools" category all process files server-side. For firms handling privileged documents, that's a Model Rule 1.6(c) reasonable-efforts question that most bar CLEs haven't caught up with.

**Structure (~1,500-2,000 words):**

1. The workflow moment where this happens — attorney needs to compress a 45MB scanned deposition, opens Google, finds Smallpdf, drops the file in
2. What actually happens on those servers — file uploaded, processed, held for X hours before deletion (each service varies), often behind third-party cloud infrastructure the attorney has never vetted
3. The Model Rule 1.6(c) analysis — reasonable efforts, factors from Comment 18, key state opinions
4. Practical checklist: how to identify tools that process client-side vs. server-side (Terms of Service red flags, network request analysis, developer tools inspection)
5. Local-first alternatives — desktop apps (Adobe Acrobat, PDF Expert), browser-based tools running via WebAssembly (nothing uploaded), CLI tools (Ghostscript, qpdf, cpdf)
6. What to tell your paralegal / clerk / junior associate — a two-sentence firm policy on file-processing tools

**How ConvertYard fits:** one line in the "browser-based local-first" bullet of section 5, alongside desktop and CLI options. Not the article's subject.

## Submission channel

**Contact form only:** https://lawyerist.com/about/contact/
- No public write-for-us page
- No direct editorial email
- Form fields: name, phone, email, company, org type (Law Firm, Corporate Legal, etc.), "How can we help?"

**Short pitch to send via the form:**

Hi Lawyerist editorial team,

I'd like to pitch a compliance-focused piece on a widely-overlooked Model Rule 1.6(c) exposure: attorneys using free web-based PDF tools (Smallpdf, ILovePDF, PDF Candy, most of the "free PDF" category) that upload client documents to third-party servers for processing.

Most of the discussion on cloud/third-party tools in state bar ethics opinions (NY 842, CA 2010-179, TX 680, PA 2011-200) predates the current generation of these processors and none of it has been consolidated into a practical checklist for small-firm workflows.

Working title: *"The Third-Party Upload Trap: Client Confidentiality and 'Free' PDF Tools Under Model Rule 1.6."* 1,500-2,000 words. Fits your Healthy Systems tag and complements Todd Hendrickson's earlier paperless-workflow series without duplicating it.

Background: I build browser-based document processing tools (convertyard.com) — everything runs client-side, no upload, which is what put the compliance angle on my radar. I'm not an attorney but I've been researching this specifically for legal-industry users; happy to co-author with a practicing attorney if the ethics analysis needs a bar-admitted co-signer.

Would this fit your calendar? Happy to send a full outline if the angle is a fit.

— Garrick Dee Tan
convertyard.com
gdtwebmaster@gmail.com

## Notes for follow-up

- **The "not an attorney but researched this" disclosure is critical.** Lawyerist's audience is attorneys; they will spot a non-lawyer trying to write about ethics rules and will reject if you don't acknowledge it upfront. The co-author offer with a bar-admitted attorney is the credibility bridge.
- If they accept but insist on an attorney co-author, find one. This is one of the rare pitches where offering to co-author with a subject-matter expert actually helps. Options: your own attorney, a law-school classmate contact, or a Lawyerist Lab member (Lawyerist runs a coaching program — some Lab members might be interested).
- If they say no or don't reply in 3 weeks: one polite nudge via the form. After that, drop it and consider pitching the same angle to Above the Law, Attorney at Work, or Legal IT Insider instead.
- Do NOT try to sneak ConvertYard placement upfront. The pitch's value is the compliance analysis; ConvertYard is one bullet in a checklist. Push for anchor text upfront and you'll get rejected.

## Where this ranks

**High value (send now):**
1. Cloudways ✓ (sent)
2. iGeeksBlog
3. Windows Latest
4. SlashGear
5. Shutterbug

**Medium value:**
6. AppleToolBox
7. Redmond Pie
8. freeCodeCamp
9. KeyCDN
10. Speckyboy (Path B new-article path)
11. **Lawyerist (Path B new-article path with attorney co-author; different vertical from image tools — genuinely differentiated audience worth targeting)**

**Skip:**
12. Phoblographer
13. ImprovePhotography
14. ExpertPhotography
15. Buffer
16. Sprout Social
17. CSS-Tricks
18. Shopify
19. WP Engine
20. ImageKit
21. Noupe
22. SiteGround KB

## Broader observation

Lawyerist is the first pitch you've researched in this batch that hits a **new vertical (legal industry)** rather than another design/dev/hosting publication. The compliance angle for local-first PDF processing has genuine, defensible differentiation that doesn't exist in the design/dev outreach:

- Lawyers are a regulated profession with real compliance obligations
- The competition (Smallpdf et al.) don't market to lawyers with compliance framing
- Legal industry publications (Lawyerist, Above the Law, Attorney at Work) publish this style of ethics-focused practitioner content regularly
- A single legal industry placement is worth more than three general-tech backlinks in terms of trust for professional users

**Consider making legal-industry publications a distinct outreach track**, separate from the image-conversion-focused design/dev pitches. Different pitch template, different value proposition (compliance, not workflow), different target authors (practicing attorneys writing on legal tech, not developers writing about image formats).
