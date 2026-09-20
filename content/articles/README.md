# Articles as files

Put each article here as `<slug>.md` (English) and optionally `<slug>.zh.md` (Chinese).
The slug becomes the address: `content/articles/clouthaus-klcc-review.md` → https://shyanyee.com/blog/clouthaus-klcc-review

Front-matter (between the `---` lines) then the markdown body:

```
---
title: CloutHaus KLCC Review: Price PSF, Layouts & Agent's Verdict
metaDescription: One sentence for Google (under 160 characters).
summary: Two or three sentences shown above the article.
category: Reviews            # Reviews | Guides | Investment | Market Outlook | Financials | Financing
image: https://lh3.googleusercontent.com/d/<drive-id>=w1600
publishedOn: 2026-09-21
updatedOn: 2026-09-21        # change this only when the content really changes
relatedProjectIds: clouthaus, orion-residence   # ids from src/projectsFallback.json
relatedSlugs: freehold-vs-leasehold
tags: klcc, freehold, review
faqs:
  - q: Is CloutHaus freehold?
    a: Yes. ...
---
# Heading
Body text. Tables, lists, images, links and {{youtube:VIDEO_ID}} all work.
```

`npm run build` picks the files up automatically (they are compiled into `src/data/articles.generated.ts`).
