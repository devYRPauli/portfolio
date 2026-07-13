---
title: World Cup 2026 Picks
summary: Self-hostable prediction pool with live leaderboards
role: Solo - Live
year: "2026"
stack:
  - Next.js (App Router)
  - TypeScript
  - Supabase (Auth + Postgres)
  - Vercel + Cron
links:
  - { label: GitHub, href: https://github.com/devYRPauli/world-cup-2026-picks }
  - { label: Live, href: https://world-cup-2026-picks.vercel.app }
order: 5
---

A prediction pool for small groups, built for the 2026 World Cup and running live through the tournament: pick match outcomes, choose group qualifiers, and compete on a leaderboard that updates as real results come in.

## Problem

Friend-group prediction pools live in spreadsheets: someone owns the file, scoring is manual, picks arrive after kickoff, and nobody trusts the standings. Hosted pool sites fix that but own your group's data and force their rules.

## Approach

- Fixtures and results sync automatically from football-data.org on a daily Vercel Cron, with manual admin editing for when the API is late; members join with an invite code.
- Fairness is enforced by the clock: match picks lock at kickoff and group qualifier picks lock when that group first plays. Group picks are two teams plus an optional third, matching the 2026 format where the best third-placed teams also advance; knockout picks are winner-only from the Round of 32 on.
- Scoring (3 points per correct outcome, 5 per qualifier that advances) is computed on read from stored results, never stored, so a scoring change takes effect instantly with nothing to recalculate.
- Three leaderboard views: total points, a knockout-only board with per-round filters, and standardized accuracy - correct picks over all decided games, so skipping a match counts the same as getting it wrong.
- Match cards show the pool's split on every game, and profiles track streaks and exact-scoreline calls - small stats that keep the group chat lively.

## Trade-offs

Compute-on-read scoring trades a little query work for zero recalculation jobs and zero stale-aggregate bugs, which is what you want when rules evolve mid-tournament. Standardized accuracy is deliberately strict: it stops members from protecting their percentage by only picking safe games.
