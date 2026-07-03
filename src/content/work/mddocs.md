---
title: mddocs
summary: Git-native collaborative Markdown, with an agent API
role: Solo - Open source
year: "2026"
stack:
  - TypeScript
  - Node.js
  - Yjs (CRDT)
  - Git
  - Server-Sent Events
links:
  - { label: GitHub, href: https://github.com/devYRPauli/mddocs }
order: 3
---

A local-first, self-hostable Markdown editor: real-time multiplayer, comments, and accept/reject suggestions, plus a first-class HTTP API for AI agents. Published on npm.

## Problem

Teams want Google-Docs-style collaboration on Markdown without handing their content to a SaaS, and the AI agents that edit documents are usually bolted on as second-class clients with no real API.

## Approach

- Built a git-native editor where every change is a commit, so there is no central database to run and the full history lives in the repo.
- Real-time multiplayer, inline comments, and accept/reject suggestion review backed by a CRDT (Yjs) model that merges concurrent edits without conflicts.
- Shipped a first-class agent HTTP API: per-agent tokens, rate-limit headers, and a Server-Sent Events stream, so automated writers are first-class collaborators.

## Results

## Trade-offs

Git-native storage trades a query-optimized database for transparency and zero-infra self-hosting: the repo is the source of truth and the backup. The agent API mirrors the human surface exactly, so anything a person can do, an agent can do through tokens and rate limits.
