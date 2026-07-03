---
title: Looma
summary: Local-first project memory for coding agents
role: Solo - Open source
year: "2026"
stack:
  - Python (stdlib only)
  - SQLite + FTS5
  - Local-first
  - Optional local LLM
links:
  - { label: GitHub, href: https://github.com/devYRPauli/looma }
order: 2
---

A command-line tool that turns Claude Code, Codex, and Cursor history into resumable project context, with zero third-party dependencies.

## Problem

Coding-agent transcripts pile up fast, but the moment you switch projects the context is gone. Searching old sessions to remember what you were doing, what you decided, and what is left is slow and unreliable.

## Approach

- Normalizes Claude Code, Codex, and Cursor history into vendor-agnostic events, then reconstructs structured WorkItems (features, bugfixes, refactors, migrations) instead of keyword-searching logs.
- Emits token-budgeted context packs so one agent can hand off to another without replaying the whole history.
- Built on the Python standard library only (SQLite + FTS5), with an optional local LLM extractor that inherits the same heuristic guardrails.

## Results

- **Third-party deps:** typical CLI -> 0
- **Extraction F1 (clean fixtures):** Qwen2.5-7B 0.84 -> heuristic 0.86
- **Test suite:** baseline -> 131 passing

## Trade-offs

Chose a transparent heuristic core over an LLM-by-default pipeline: it is auditable, runs anywhere with no keys, and on clean fixtures actually beat a 7B local model. Every reconstruction carries a confidence score and shows alternatives instead of guessing.
