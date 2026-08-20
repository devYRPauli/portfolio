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
  - { label: Writeup, href: /writing/turboquant-on-a-16gb-macbook/ }
  - { label: Merged fix, href: https://github.com/TheTom/turboquant_plus/pull/93 }
order: 6
---

I tried to reproduce TurboQuant, a KV-cache compression method from a Google Research paper, on a 16 GB M1 Pro. Every stock implementation scored 0% on my needle-in-a-haystack test, so I treated it as a systems problem before treating it as an algorithm failure.

## What I wanted to know

TurboQuant compresses the key-value cache a model keeps during inference, so a longer context fits in a fixed memory budget. It does not touch weights, needs no training, and the paper claims roughly 4.5x compression at quality parity.

That claim is worth checking on the hardware most people actually own, rather than on a datacenter GPU.

## What I did

- Ran needle retrieval at 2K, 4K, 8K, and 16K context instead of reporting perplexity, because retrieval is what long context is for.
- Isolated each stage of the pipeline and checked the math with controlled ablations, rather than treating the codec as one black box.
- Rebuilt the environment from pinned versions whenever an old result stopped matching its raw logs.

## What I found

The failure was five separate defects across the MLX and llama.cpp paths: a mismatched projection and scale, overly symmetric bit allocation between keys and values, an incorrect norm correction, zero blocks decoding as noise, and missing Metal kernel support.

- Needle retrieval moved from 0% to 100% at 4K, 8K, and 16K.
- KV-cache memory at 16K fell from 561 MB to 158 MB, a 3.5x reduction.
- The 2K run stayed imperfect at 0.5, and the published results say so.
- Fixes were merged into the Python reference and submitted to the llama.cpp fork.

Re-reading the paper afterwards, I found my own headline "bug fix" was mischaracterized. It was not a corrected formula but a variance reduction, and I corrected the public record including the merged pull request.

## Trade-offs

Everything ran on one modest machine, deliberately. That makes the result relevant to people with the same hardware and useless as a statement about datacenter performance.

The lesson that stuck is that what looks like a model or algorithm failure often hides an ordinary systems defect. Stage-level checks are how you tell the two apart.
