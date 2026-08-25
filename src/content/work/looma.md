---
title: Looma
summary: Local-first project memory for coding agents
verdict:
  tried: "Recall@3 0.62"
  result: "1.00, on 0 third-party dependencies"
role: Solo - Open source
kind: AI infrastructure
year: "2026"
stack:
  - Python (stdlib only)
  - SQLite + FTS5
  - Local-first
  - Optional local LLM
links:
  - { label: GitHub, href: https://github.com/devYRPauli/looma }
  - { label: PyPI, href: https://pypi.org/project/looma/ }
order: 4
featuredOrder: 4
---

A command-line tool that turns Claude Code, Codex, and Cursor history into resumable project context, with zero third-party dependencies.

## Problem

Coding-agent transcripts pile up fast. The moment you switch projects the context is gone, and getting it back means scrolling old sessions to remember what you were doing, what you decided, and what is still open.

Keyword search does not solve this. The useful unit is not a matching line, it is the piece of work that line belonged to.

## Approach

- **Reconstruct work, not text.** Looma normalizes Claude Code, Codex, and Cursor history into vendor-agnostic events, then rebuilds structured items: active work, decisions, blockers, commits, files in flight, and likely next steps.
- **Hand off in a budget.** It emits token-budgeted context packs, so one agent can pick up from another without replaying the whole history.
- **Standard library only.** SQLite and FTS5 do the storage and search. Nothing else. It installs and runs anywhere Python 3.10 runs, with no keys and no model download.
- **Upgrade if a model is there.** When a local LLM server is already running, Looma detects it and uses it for extraction. The heuristic path stays as the always-available fallback and keeps the same guardrails.

## Results

- **Third-party dependencies:** typical CLI -> 0
- **Retrieval recall@3** (hybrid FTS5 + graph + vectors): 0.62 -> 1.00
- **Extraction F1** on a golden benchmark: heuristic 0.86, local Qwen2.5-7B 0.95
- **Test suite:** baseline -> 134 passing
- Published to PyPI, currently v2.1.5

## Trade-offs

I chose a transparent heuristic core over an LLM-by-default pipeline. It is auditable and it runs with no keys, which matters for a tool that reads your entire working history. The cost is accuracy: 0.86 F1 against 0.95 when a local model is available.

Every reconstruction carries a confidence score and shows its alternatives rather than guessing. That makes the output longer and less tidy than a single confident answer, which I think is the right way round for a memory tool.
