---
title: Football Hub
summary: Live standings, fixtures, and scorers across 7 competitions
role: Solo - Open source
year: "2025"
stack:
  - React 18
  - Node.js + Express
  - Framer Motion
  - Football-Data.org API
links:
  - { label: GitHub, href: https://github.com/devYRPauli/football-hub }
  - { label: Live, href: https://football-hub-six.vercel.app }
order: 5
---

A live football dashboard covering the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, the Champions League, and the Primeira Liga: standings, fixtures with scores, and top-scorer boards, with team and match detail modals.

## Problem

Checking standings, fixtures, and scorers across multiple leagues means bouncing between apps full of ads and cruft. I wanted one fast, clean view of the seven competitions I actually follow.

## Approach

- React 18 frontend with three views per competition (standings, fixtures, top scorers), team modals with squad, coach, and stadium detail, and match modals with head-to-head stats.
- A small Node.js and Express backend proxies Football-Data.org, adding response caching (5-minute TTL), rate limiting, and security headers - so the API key never reaches the client and the free-tier quota survives real usage.
- Light and dark themes with persistent preference, full keyboard navigation with ARIA labels, and Framer Motion transitions kept subtle.

## Trade-offs

A caching proxy adds a second deployable, but it is the difference between a demo that dies at the free API tier's rate limit and a site that stays up; five-minute freshness is the right trade for league data that changes a few times a day.
