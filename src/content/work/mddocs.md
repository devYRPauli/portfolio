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
  - { label: npm, href: https://www.npmjs.com/package/@devyrpauli/mddocs }
order: 2
---

A local-first, self-hostable Markdown editor with real-time multiplayer, inline comments, and accept-or-reject suggestions, plus an HTTP API that lets AI agents work the same document as people. Published on npm as @devyrpauli/mddocs.

## Problem

Teams want Google-Docs-style collaboration on Markdown without handing their content to a SaaS. And when an AI agent edits a document, it usually just writes to a file on disk: no comments a human can accept or reject, no shared review, no record of who changed what.

## Approach

- Made the file the database. Comments, suggestions, and authorship are stored inside the .md file and versioned by plain git, so there is no server or database to run and the full history lives in the repo. It reuses the MIT-licensed proof-sdk for the marks model and browser editor; the git workflow, CLI, collaboration server, and agent API are the new layer on top.
- Real-time multiplayer over a CRDT (Yjs): everyone on the link co-edits live, and every settled change writes back to the file and auto-commits. Share links carry a role, editor, commenter, or viewer, enforced on the server rather than hidden in the UI, so a viewer connection cannot write and a commenter cannot touch the prose.
- Gave agents the same surface people have. Over the HTTP API an agent reads the document, leaves comments and suggestions a human accepts or rejects, rewrites prose, announces presence, and subscribes to a live event stream (Server-Sent Events) of what everyone else is doing. Each agent gets its own token identity, per-agent rate limits, and standard rate-limit headers so it can throttle itself instead of hitting a wall.
- Added a repo-wide review inbox: one `mddocs status` lists every open comment and pending suggestion across all managed docs, so review does not get lost between files.

## Trade-offs

Git-native storage trades a query-optimized database for transparency and zero-infra self-hosting: the repo is the source of truth and the backup, and async collaboration is just branches and merges. The agent API mirrors the human surface exactly, so anything a person can do in the document an agent can do through a token, with no separate, weaker path bolted on for automation.
