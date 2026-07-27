---
title: TabFM Evaluation
summary: Independent evaluation that surfaced and fixed a multi-GPU crash in Google's tabular foundation model
role: Independent research - Open source
kind: Model evaluation
year: "2026"
stack:
  - Python
  - PyTorch + JAX
  - XGBoost + Optuna
  - Multi-GPU testing
links:
  - { label: GitHub, href: https://github.com/devYRPauli/tabfm-evaluation }
  - { label: Writeup, href: https://yashrajpandey.com/writing/breaking-google-tabfm/ }
  - { label: Merged fix, href: https://github.com/google-research/tabfm/pull/42 }
order: 4
---

I evaluated Google's TabFM across ten public datasets and three machines, then followed the failures far enough to find a bug in the public prediction path.

## What I wanted to know

TabFM makes a useful promise: one pretrained model can handle classification and regression on new tables without task-specific training. I wanted to know where that held up, how it compared with a tuned XGBoost baseline, and what the memory and latency costs looked like outside the authors' setup.

## What I did

- Built a reproducible benchmark across CPU, single-GPU, and dual-GPU machines.
- Compared TabFM with tuned XGBoost on ten classification and regression datasets.
- Tested context scaling, accelerator memory, and latency rather than reporting accuracy alone.
- Re-ran the strongest and weakest results across multiple seeds before treating them as real.

## What changed

The public `predict` API crashed on every multi-GPU host I tested. I traced the issue to a device-placement mismatch, wrote a focused fix and a CPU regression test, and sent it upstream. One of TabFM's authors reviewed the pull request, and Google Research merged it.

The evaluation also clarified the practical trade-off. TabFM was competitive across the benchmark and stable across seeds, but the pinned JAX path reserved roughly 17 GB even for small contexts. The later PyTorch path used much less memory and scaled to larger tables.

I was not trying to declare a winner. I wanted to turn a new research release into evidence a team could use: where it works, what it costs, and what still breaks.
