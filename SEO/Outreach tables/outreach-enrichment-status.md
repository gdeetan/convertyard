# Outreach Enrichment Status

## Original Prompt

> check this numbers file.  I need you to do the following. Analyze the content of each link and craft a pitch for each of these links, do batches of 15, since I don't want the tokens to run out in the middle of the session. Create an md file to update the status for this task, save the pitch in the 'Pitch' column. Don't edit the other parts of the file unless instructed. 2. Find the email for each website and store it inside the Email column. 3. Check each website or page and see if it is worth reaching out to? and write your findings under the 'worth pitching?' column. If you noticed anything else, Add another column with an appropriate title to let me know if I'm missing anything, note it in that column. Make each pitch personal; analyze the article. Is it related to my site, Wordineer? Add something that you noticed that would encourage them to have a look at the website, and perhaps link to it. Don't be pushy, make it sound natural not pushy. If you were an SEO expert how would you approach it.

**File:** `SEO/Outreach tables/Competitor Link Analysis.numbers`  
**Total rows:** 234 (rows 2–235; rows 236–268 are empty padding)  
**Batch size:** 15 rows  
**Started:** 2026-07-28

---

## Additional Instructions (2026-07-29)

- **Title column** (col 5): Add a high-CTR email subject for each row that has a pitch. Subjects should be specific to the article/site being pitched — not generic, not AI-sounding. Reference something concrete from their content.
- **Pitch review**: Remove any AI-sounding phrasing. No "I wanted to reach out", "I hope this finds you well", "leveraging", "utilize", "Additionally", "Furthermore", "I look forward to hearing from you". Keep it direct and specific like Garrick actually wrote it.

---

## Batch Progress

| Batch | Rows | Status | Notes |
|-------|------|--------|-------|
| 1 | 2–16 | ✅ Done | cloudconvert.com segment — 15 rows processed |
| 2 | 17–31 | ✅ Done | cloudconvert.com segment — 15 rows processed |
| 3 | 32–46 | ✅ Done | cloudconvert.com segment — 15 rows processed |
| 4 | 47–61 | ✅ Done | cloudconvert.com segment — 15 rows processed |
| 5 | 62–76 | ✅ Done | cloudconvert.com segment — 15 rows processed |
| Subjects | 2–76 | ✅ Done | Email subjects added to col 5 for all YES/MAYBE rows (43 rows) |
| 6 | 77–91 | ✅ Done | picflow segment — 15 rows processed, subjects added |
| 7 | 92–106 | ✅ Done | picflow → cloudinary |
| 8 | 107–121 | ✅ Done | cloudinary → convertio |
| 9 | 122–136 | ✅ Done | convertio → imagecompressor |
| 10 | 137–151 | ✅ Done | imagecompressor |
| 11 | 152–166 | ✅ Done | imagecompressor |
| 12 | 167–181 | ✅ Done | imagecompressor |
| 13 | 182–196 | ✅ Done | imagecompressor |
| 14 | 197–211 | ✅ Done | imagecompressor |
| 15 | 212–218 | ✅ Done | imagecompressor (tail) |
| 16 | 219–235 | ✅ Done | Extra batch discovered — file had data beyond original row 218 plan. Includes duplicates at rows 229 (InMotion, dup of 168) and 234 (Clio Websites, dup of 122), marked NO. |

---

## Skipped Rows (pre-assessed NO)

| Row | URL | Reason |
|-----|-----|--------|
| 5 | websitebuilder.service.justice.gov.uk | UK gov internal doc |
| 12 | sites.google.com/view/finding-content | Google Sites page, no editorial contact |
| 14 | support.mozilla.org/questions/1286715 | Mozilla forum thread |
| 15 | dropbox.com/apps/cloudconvert | Dropbox app directory |
| 28 | hub.docker.com/r/neonvariant/transmute | Docker Hub image |
| 35 | pypi.org/project/cloudconvert | PyPI package listing |
| 36 | drupal.org/project/cloudconvert | Drupal plugin page |
| 41 | it.queens.ox.ac.uk/software-and-tools | Oxford IT internal |
| 42 | belabs.seas.upenn.edu/equipment | UPenn lab equipment page |
| 49 | crunchbase.com/organization/cloudconvert | Crunchbase profile |
| 61 | apps.make.com/cloudconvert | Make.com app directory |
| 65 | web.engr.oregonstate.edu/~mjb/cs557 | OSU CS course page |
| 72 | papl.cs.brown.edu/2020/Acknowledgments | Brown Univ textbook |
| 77 | devpost.com/software/da-tree | Hackathon project page |
| 82 | brand.uiowa.edu/graphic-elements | UIowa brand guidelines |
| 86 | mathworks.com/matlabcentral/fileexchange/123955 | MATLAB file exchange, academic |
| 89 | helpcenter.flourish.studio/… | Product help center support doc |

---

## Duplicate Removal (2026-07-28)

8 duplicate URLs found and removed. Table went from 225 → 217 rows.

| Removed row | URL | Kept at row |
|-------------|-----|-------------|
| 115 | geekflare.com/es/jpg-to-webp-converter | 6 |
| 120 | geekflare.com/es/jpg-to-webp-converter | 6 |
| 121 | hongkiat.com/blog/jpeg-optimization-guide | 114 |
| 123 | idownloadblog.com/…/convert-webp-images | 7 |
| 130 | creativemarket.com/blog/what-is-a-webp-image | 83 |
| 134 | thimpress.com/best-free-jpg-to-avif-converter | 78 |
| 160 | smashingmagazine.com/…/image-optimization-tools | 58 |
| 189 | boldgrid.com/speed-up-wordpress-websites | 4 |

**Note:** Row numbers in batches 5–15 have shifted by up to 8 rows. Use URL as the canonical identifier, not row number.

## Errors / Issues

_(none)_
