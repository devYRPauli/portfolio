---
title: TurboQuant on Apple Silicon
summary: CPU-only LLM quantization study
role: Solo - Open source
year: "2026"
stack:
  - MLX
  - llama.cpp (Metal)
  - Apple Silicon (M1 Pro)
  - Python
links:
  - { label: GitHub, href: https://github.com/devYRPauli/turboquant-m1pro-evaluation }
order: 4
---

Independent evaluation of TurboQuant (arXiv 2504.19874) ported to run on Apple Silicon. Open source and reproducible.

## Problem

TurboQuant is a near-optimal LLM weight and activation quantization method, but the reference path assumed dedicated GPU hardware. The open question: can it run, and hold long-context accuracy, on consumer Apple Silicon with no GPU?

## Approach

- Worked from a CPU-only fork on an M1 Pro (16GB) and fixed five implementation bugs that were blocking correct inference.
- Ran a two-round study: an MLX path and a separate llama.cpp Metal path, each benchmarked on long-context needle-in-a-haystack retrieval.
- Published the full evaluation, the bug fixes, and reproducible results as an open-source repository, with writeups on LinkedIn and X.

## Results

- **Needle retrieval @ 16K:** 0% -> 100%
- **KV cache memory:** baseline -> significantly reduced
- **Bugs fixed in fork:** 5 blocking -> 0

## Trade-offs

A CPU-only target trades raw throughput for accessibility: the point was proving strong quantization and long-context accuracy are reachable on hardware anyone has on their desk, not winning a latency benchmark. Reflects how I approach AI infrastructure: take a research-grade method, get it actually running on accessible hardware, measure it honestly, and share it.
