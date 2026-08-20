---
title: World Cup 2026 Picks
summary: Self-hostable prediction pool with live leaderboards
role: Solo - Live
kind: Live product
year: "2026"
stack:
  - Next.js (App Router)
  - TypeScript
  - Supabase (Auth + Postgres)
  - Vercel + Cron
links:
  - { label: GitHub, href: https://github.com/devYRPauli/world-cup-2026-picks }
  - { label: Live, href: https://world-cup-2026-picks.vercel.app }
order: 8
---

A prediction pool for small groups, built for the 2026 World Cup and running live through the tournament. Pick match outcomes, choose group qualifiers, and compete on a leaderboard that updates as real results land.

## Problem

Friend-group pools live in spreadsheets. One person owns the file, scoring is manual, picks arrive after kickoff, and nobody quite trusts the standings.

Hosted pool sites fix the mechanics. They also own your group's data and make you play by their rules.

## Approach

- **Fixtures sync themselves.** Results come from football-data.org on a daily Vercel Cron, with manual admin editing for when the API runs late. Members join with an invite code.
- **The clock enforces fairness.** Match picks lock at kickoff. Group qualifier picks lock when that group first plays, so nobody edits after seeing a result.
- **Picks match the 2026 format.** Group picks are two teams plus an optional third, because the best third-placed teams also advance. Knockout picks are winner-only from the Round of 32 on.
- **Scoring is computed on read.** Three points per correct outcome, five per qualifier that advances, calculated from stored results rather than saved. A rule change takes effect instantly with nothing to recalculate.
- **Three leaderboards.** Total points, a knockout-only board with per-round filters, and standardized accuracy, which counts correct picks over every decided game.
- **Small stats for the group chat.** Match cards show how the pool split on each game, and profiles track streaks and exact-scoreline calls.

## Trade-offs

Computing scores on read costs a little query work on every page. In exchange there are no recalculation jobs and no stale-aggregate bugs, which is what you want when the rules are still moving mid-tournament.

Standardized accuracy is strict on purpose. Skipping a match counts the same as getting it wrong, so nobody protects their percentage by only picking the safe games. It makes the number less flattering and more honest.

Self-hosting is the point, so there is no shared instance to join. Running it for your own group means deploying it yourself, which is a real barrier for anyone who does not already use Vercel and Supabase.
