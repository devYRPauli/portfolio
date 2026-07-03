---
title: ApplyScore
summary: AI resume gap-analysis extension
role: Solo - Shipped
year: "2026"
stack:
  - JavaScript
  - Chrome Extension APIs
  - Shadow DOM scraping
  - LLM APIs (BYO-key)
links:
  - { label: Site, href: https://chromewebstore.google.com/detail/applyscore/ibecekikdjelajpnjnmapejhahgcplim }
order: 5
---

A published Chrome extension that scores how well a resume matches any job posting on the web, with evidence-linked gaps and no fluff.

## Problem

Most AI resume tools hallucinate skills and rewrite bullets with confident fluff that recruiters see through instantly. The honest question, how well does this resume actually match this job, went unanswered.

## Approach

- Built a universal scraper that reads job postings across LinkedIn, Greenhouse, Ashby, Lever, Workday and more, piercing Shadow DOM to work on virtually any board.
- Runs a strict, evidence-based gap analysis: a confidence-weighted 0-100 fit score, requirement-by-requirement matches linked to the exact resume bullets that prove them, and a prioritized list of what is missing.
- Privacy-first by design: the resume is cached locally and the user brings their own API key (OpenAI, Anthropic, or Google), so data and model choice stay fully in their control.

## Results

## Trade-offs

Deliberately a gap analyzer, not a rewriter. Suggesting only 1-2 targeted, non-hallucinated bullets keeps it honest; the BYO-key model trades one-click convenience for the user keeping full control of their data and cost.
