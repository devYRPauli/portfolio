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
  - { label: GitHub, href: https://github.com/devYRPauli/willitcall }
  - { label: Live matrix, href: https://devyrpauli.github.io/willitcall/ }
  - { label: Writeup, href: /writing/same-weights-opposite-results/ }
order: 2
featuredOrder: 2
---

A conformance suite and public red/green matrix that answers one question: will this model, at this quantization, on this server, actually execute tool calls?

## Problem

Every local inference stack advertises OpenAI-compatible function calling. In practice the same weights can call tools perfectly on one server and fail completely on another, and the failure is silent. Your agent does not crash. It just never calls the tool, and you spend an afternoon blaming your prompt.

Existing benchmarks do not help, because they measure fp16 API models. The breakage lives on the quant x server x template axis, and nobody had published that matrix.

## What it is

- **A Rust CLI** that runs 50 declarative scenarios against any OpenAI-compatible endpoint: single and parallel calls, streaming, tool_choice modes, multi-turn, and negative traps where the right answer is to call nothing. Scoring is deterministic, with no LLM judge, because a published failure reason has to be defensible.
- **A public matrix** fed by result-file pull requests, where every red cell links the full request and response transcript that produced it.
- **A method built out of my own mistakes.** No verdict below five runs per arm. Replication varies the seed, because greedy repeats measure reproducibility rather than truth. Raw tokens get recovered before any cause is assigned.

## Results

- 32 published rows across three servers on one disclosed measurement host.
- Case studies replicated at five or more runs per arm, 90 runs across 18 arms for the quantization question alone.
- Three candidate upstream issues documented with committed evidence.

The central finding came out of a bug report I had to retract. llama.cpp grammar-constrains tool-call decoding, while Ollama and mlx-lm parse unconstrained output afterwards. Cross-server differences are properties of the stack, not the model, and I had publicly blamed the model first.

## Trade-offs

One measurement host keeps the comparison clean and makes the matrix narrow. Widening it needs other people's results, which is why a run from your machine is a pull request away from being a row.

Deterministic scoring rules out grading nuance an LLM judge could catch. I would rather under-report a pass than publish a red cell I cannot defend with a transcript.
