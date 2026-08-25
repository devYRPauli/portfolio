---
title: ApplyScore
summary: AI resume gap-analysis extension
role: Solo - Shipped
kind: Browser extension
year: "2026"
stack:
  - JavaScript
  - Chrome Extension APIs (MV3)
  - Shadow DOM scraping
  - LLM APIs (BYO-key)
links:
  - { label: Chrome Web Store, href: https://chromewebstore.google.com/detail/applyscore/ibecekikdjelajpnjnmapejhahgcplim }
order: 9
verdict:
  tried: "Postings hide in Shadow DOM"
  result: "8 extractors, 1 fallback"
---

A published Chrome extension that scores how well a resume matches any job posting on the web, with every claim linked to the evidence behind it.

## Problem

Most AI resume tools rewrite your bullets. They invent skills you never had and pad the result with confident language recruiters see through in seconds. The honest question, how well does this resume actually match this job, went unanswered.

Scraping job postings is also harder than it looks. Every board renders differently, several bury the description inside Shadow DOM, and single-page apps swap the posting without a page load.

## Approach

- **Read the posting anywhere.** Dedicated extractors handle LinkedIn, Greenhouse, Lever, Ashby, Workday, Amazon, Indeed, and Glassdoor, with a generic fallback for everything else. The content script pierces Shadow DOM, and a validator confirms the page really is a job posting before scoring runs.
- **Score against evidence, not vibes.** The analysis returns a confidence-weighted 0-100 fit score, the top requirements matched to the exact resume bullets that prove them, and a prioritized list of what is missing.
- **Bring your own key.** Three providers are supported: OpenAI, Anthropic, and Google. The resume is cached locally, and the key stays in the user's own storage, so the data and the model choice both stay with them.
- **Manifest V3 throughout.** A service worker handles the API calls, the popup holds settings and results, and host permissions are limited to the three provider endpoints, with wider access requested only when a board needs it.

About 2,800 lines of JavaScript across 22 files, shipped to the Chrome Web Store as v1.0.

## Trade-offs

It is a gap analyzer, not a rewriter. It will tell you what matches and what is missing, and it will never generate a resume bullet for you. That restraint is the whole point, and it is also why it will never be the tool that promises to write your application for you.

Bring-your-own-key trades one-click convenience for control. The user pays their own inference cost and picks their own provider, which rules out a frictionless install and rules out ever holding someone else's resume on a server I run.
