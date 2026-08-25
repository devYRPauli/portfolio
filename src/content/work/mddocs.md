---
title: mddocs
summary: Git-native collaborative Markdown, with an agent API
verdict:
  tried: "An agent suggests"
  result: "a person accepts or rejects, in git"
role: Solo - Open source
kind: Collaboration tool
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
order: 7
---

A local-first, self-hostable Markdown editor with real-time multiplayer, inline comments, and accept-or-reject suggestions, plus an HTTP API that lets AI agents work the same document as people.

## Problem

Teams want Google-Docs-style collaboration on Markdown without handing their content to a SaaS.

There is a second gap. When an AI agent edits a document it usually just writes to a file on disk. No comments a human can accept or reject, no shared review, no record of who changed what.

## Approach

- **The file is the database.** Comments, suggestions, and authorship all live inside the `.md` file and are versioned by plain git. There is no server or database to run, and the full history lives in the repo.
- **Multiplayer over a CRDT.** Everyone on the link co-edits live through Yjs. Every settled change writes back to the file and auto-commits.
- **Roles enforced on the server.** Share links carry a role: editor, commenter, or viewer. The server enforces it rather than hiding it in the UI, so a viewer connection cannot write and a commenter cannot touch the prose.
- **Agents get the human surface.** Over the HTTP API an agent reads the document, leaves comments and suggestions a person accepts or rejects, rewrites prose, and subscribes to a live event stream of what everyone else is doing. Each agent carries its own token identity and rate limits.
- **One review inbox.** `mddocs status` lists every open comment and pending suggestion across all managed docs, so review does not get lost between files.

It reuses the MIT-licensed proof-sdk for the marks model and browser editor. The git workflow, CLI, collaboration server, and agent API are the new layer on top.

## Trade-offs

Git-native storage gives up a query-optimized database. What it buys is transparency and zero-infra self-hosting: the repo is both the source of truth and the backup, and async collaboration is just branches and merges. Finding "every comment by this person last month" means walking the history rather than running a query.

The agent API mirrors the human surface exactly. Anything a person can do in a document, an agent can do through a token. That is deliberate, because the alternative is a weaker automation path bolted on the side, and those always drift out of sync with the real one.
