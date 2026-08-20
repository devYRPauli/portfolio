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
order: 5
---

I evaluated Google's TabFM across public datasets on three machines, then followed the failures far enough to find a bug in the public prediction path.

## What I wanted to know

TabFM makes a useful promise. One pretrained model handles classification and regression on new tables with no task-specific training. Tabular data is the one domain where deep learning has repeatedly lost to gradient-boosted trees, so closing that gap with zero training would matter.

I wanted to know where the promise held, how it compared against a properly tuned baseline, and what it cost in memory and latency outside the authors' own setup.

## What I did

- Built a reproducible benchmark across CPU, single-GPU, and dual-GPU machines.
- Replaced the soft default baseline with an Optuna-tuned XGBoost: 100 trials of TPE search with 3-fold inner cross-validation, per dataset. A weak baseline makes any model look good.
- Measured context scaling, accelerator memory, and latency rather than reporting accuracy alone.
- Re-ran the strongest and weakest results across multiple seeds before treating either as real.

## What I found

The public `predict` API crashed on every multi-GPU host I tested. I traced it to a device-placement mismatch, wrote a focused fix with a CPU regression test, and sent it upstream. One of TabFM's authors reviewed it and Google Research merged it.

- TabFM beat the tuned baseline on all 10 fold-matched datasets.
- Run-to-run standard deviation was 0.0001 to 0.0006, smaller than every tree baseline I measured.
- The multi-seed check made me demote two of my own "wins" to ties, because the margins sat inside measurement noise.
- The pinned JAX path reserved roughly 17 GB even for small contexts. The later PyTorch path used far less and scaled to larger tables.

## Trade-offs

This is a subset of one benchmark on small-to-mid tables, which is where TabFM was always most likely to look good. Two datasets were too slow to finish, and I reported that rather than dropping them quietly.

I was not trying to declare a winner. I wanted to turn a new research release into evidence a team could act on: where it works, what it costs, and what still breaks.
