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
order: 1
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
- **Retrieval recall@3 (hybrid FTS5 + graph + vectors):** 0.62 -> 1.00
- **Extraction F1 (golden benchmark):** heuristic 0.86, auto-detected local Qwen2.5-7B 0.95
- **Test suite:** baseline -> 134 passing

## Trade-offs

Chose a transparent heuristic core over an LLM-by-default pipeline: it is auditable and runs anywhere with no keys or model downloads. When a local model server is running, Looma auto-detects it and upgrades extraction (F1 0.95 vs 0.86 with a Q4_K_M Qwen2.5-7B), while the heuristic stays the always-available fallback. Every reconstruction carries a confidence score and shows alternatives instead of guessing.
