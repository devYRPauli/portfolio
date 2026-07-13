---
title: Football Hub
summary: Live standings, fixtures, and scorers across 7 competitions
role: Solo - Open source
kind: Web application
year: "2025"
stack:
  - React 18
  - Node.js + Express
  - Framer Motion
  - Football-Data.org API
links:
  - { label: GitHub, href: https://github.com/devYRPauli/football-hub }
  - { label: Live, href: https://football-hub-six.vercel.app }
order: 8
---

A live football dashboard covering the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, the Champions League, and the Primeira Liga: standings with team search, fixtures and results, top-scorer boards, and team and match detail modals. The React frontend deploys on Vercel, the Express proxy on Render.

## Problem

Checking standings, fixtures, and scorers across multiple leagues means bouncing between apps full of ads and cruft. I wanted one fast, clean view of the seven competitions I actually follow. There was also a practical constraint: Football-Data.org's free tier is rate-limited and the API key cannot ship to the browser, so a plain client-side app was never going to work.

## Approach

- React 18 frontend with three views per competition: a standings table with a search filter, fixtures split into upcoming and results, and a top-scorers board. Clicking a team opens a modal with founding year, stadium, coach, active competitions, and squad; clicking a match opens one with venue, status, and the head-to-head record drawn as a win/draw/loss bar. Skeleton loaders cover fetches, and Framer Motion transitions are kept subtle.
- A small Express proxy holds the API key server-side and hardens the surface: Helmet security headers, per-IP rate limiting (100 requests per 15 minutes), a 10-second upstream timeout, and a whitelist of league codes plus numeric id checks so it cannot be driven as an open proxy. Responses are cached in memory for five minutes, so a burst of visitors costs the upstream API a handful of requests instead of hundreds.
- Failure handling runs end to end. If the provider returns 429, the UI enters a 60-second cooldown with a visible countdown and retries on its own; provider timeouts surface as clean errors instead of spinners. The frontend keeps its own five-minute per-league cache so hopping between tabs does not refetch.
- Dark and light themes persist to localStorage. Tables, match cards, and dialogs are keyboard-reachable with ARIA labels, and Escape closes modals.

## Trade-offs

A caching proxy adds a second deployable, but it is the difference between a demo that dies at the free tier's rate limit and a site that stays up; five-minute freshness is the right trade for league data that changes a few times a day. The free tier has no Champions League scorers, so that tab is hidden for the CL rather than showing an empty table. And after chasing an invisible-overlay bug where modal close animations never finished and silently ate every click on the page, I dropped the modal exit animation entirely: modals now close instantly, which nobody notices, and the bug class is gone.
