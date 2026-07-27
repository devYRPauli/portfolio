---
title: TurboQuant Evaluation
summary: Reproduced and debugged KV-cache compression on a 16 GB M1 Pro
role: Independent research - Open source
kind: Systems evaluation
year: "2026"
stack:
  - Python + MLX
  - C++ + Metal
  - llama.cpp
  - Long-context evaluation
links:
  - { label: GitHub, href: https://github.com/devYRPauli/turboquant-m1pro-evaluation }
  - { label: Writeup, href: https://yashrajpandey.com/writing/turboquant-on-a-16gb-macbook/ }
order: 5
---

I tried to reproduce TurboQuant, a KV-cache compression method from Google Research, on a 16 GB M1 Pro. The stock implementations returned 0% on my needle-in-a-haystack test, so I treated the result as a systems problem before treating it as an algorithm failure.

## What I found

The failures came from five separate issues across MLX and llama.cpp paths. They included a mismatched projection and scale, overly symmetric bit allocation for keys and values, incorrect norm correction, zero blocks decoding as noise, and missing Metal support.

I isolated the stages, checked the math with controlled ablations, and rebuilt the environment from pinned versions when an old result did not match the raw logs.

## Results

- Needle retrieval moved from 0% to 100% at 4K, 8K, and 16K context.
- KV-cache memory at 16K fell from 561 MB to 158 MB, a 3.5x reduction.
- The 2K run remained imperfect at 0.5, and the published results say so.
- Fixes were merged into the Python reference and submitted to the llama.cpp implementation.

The lesson that stuck with me is that what looks like a model or algorithm failure often hides an ordinary systems defect. Stage-level checks are how you tell the difference.
