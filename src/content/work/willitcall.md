---
title: willitcall
summary: The caniuse of local-model tool calling
role: Solo - Live
kind: Conformance suite + public matrix
year: "2026"
stack:
  - Rust
  - GitHub Actions
  - GitHub Pages
  - llama.cpp / Ollama / mlx-lm
links:
  - { label: Matrix, href: https://devyrpauli.github.io/willitcall/ }
  - { label: Repo, href: https://github.com/devYRPauli/willitcall }
  - { label: Analysis, href: /writing/same-weights-opposite-results/ }
order: 1
featuredOrder: 1
---

A conformance suite and public red/green matrix answering "will this model, at
this quantization, on this server, actually execute tool calls?" - because on
local stacks the answer varies by all three, and the failures are silent.

## Problem

Every local inference stack claims OpenAI-compatible function calling. In
practice the same weights can call tools perfectly on one server and fail
completely on another, and existing benchmarks (BFCL et al.) measure fp16 API
models - not the quant x server x template axis where local breakage lives.
Nobody published the combined matrix.

## What it is

- A Rust CLI that runs 50 declarative tool-calling scenarios (single, parallel,
  streaming, tool_choice modes, multi-turn, negative traps) against any
  OpenAI-compatible endpoint, with deterministic scoring and no LLM judge.
- A static matrix site fed by result-file PRs, where every red cell links the
  full request/response transcript that produced it.
- A methodology that got paid for in public: no verdict below five runs per
  arm, seed-varied replication (greedy repeats are not replication), raw-token
  recovery before any cause is attributed, and one retracted upstream bug
  report that turned into the project's central finding - llama.cpp
  grammar-constrains tool-call decoding while Ollama and mlx-lm parse
  unconstrained output after the fact, so cross-server deltas are stack
  properties, not model properties.

## Standing

32 published rows across three servers on a single disclosed measurement host;
case studies replicated at 5+ runs per arm; three candidate upstream issues
documented with committed evidence.
