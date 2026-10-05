---
title: TabFM Evaluation
summary: Independent evaluation that surfaced and fixed a multi-GPU crash in Google's tabular foundation model
verdict:
  tried: "Crashed on multi-GPU"
  result: "fix merged by Google Research"
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
  - { label: Merged fix, href: https://github.com/google-research/tabfm/pull/42 }
mode: evaluate
order: 5
featuredOrder: 5
---
