---
title: Football Hub
summary: Live standings, fixtures, and scorers across 7 competitions
verdict:
  tried: "A rate-limited free tier"
  result: "7 competitions stay live"
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
order: 10
---

A live football dashboard for seven competitions: the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, the Champions League, and the Primeira Liga. Standings, fixtures, top scorers, and detail views for teams and matches. The React frontend deploys on Vercel, the Express proxy on Render.

## Problem

Checking standings and fixtures across leagues means bouncing between apps full of ads. I wanted one fast view of the seven competitions I follow.

There was a practical constraint too. Football-Data.org's free tier is rate-limited, and the API key cannot ship to the browser, so a plain client-side app was never going to work.

## Approach

- **Three views per competition.** A standings table with a search filter, fixtures split into upcoming and results, and a top-scorers board. Clicking a team opens founding year, stadium, coach, and squad. Clicking a match opens venue, status, and a head-to-head win/draw/loss bar.
- **A proxy that holds the key.** A small Express service keeps the API key server-side and hardens the surface: Helmet headers, per-IP rate limiting at 100 requests per 15 minutes, a 10-second upstream timeout, and a whitelist of league codes so it cannot be driven as an open proxy.
- **Caching on both sides.** Responses are cached in memory for five minutes, so a burst of visitors costs the upstream a handful of requests instead of hundreds. The frontend keeps its own five-minute cache per league.
- **Failure handling end to end.** A 429 from the provider puts the UI into a 60-second cooldown with a visible countdown, then retries on its own. Timeouts surface as clean errors rather than permanent spinners.
- **Accessible by default.** Dark and light themes persist to localStorage. Tables, cards, and dialogs are keyboard-reachable with ARIA labels, and Escape closes modals.

## Trade-offs

The caching proxy adds a second deployable. It is also the difference between a demo that dies at the free tier's rate limit and a site that stays up. Five-minute freshness is the right trade for league data that changes a few times a day.

The free tier has no Champions League scorers, so that tab is hidden for the CL rather than showing an empty table.

I also dropped the modal exit animation entirely. Close animations never finished, and the leftover overlay silently ate every click on the page. Modals close instantly now, nobody notices, and the bug class is gone.
