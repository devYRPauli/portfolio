---
title: TurboQuant Evaluation
summary: Reproduced and debugged KV-cache compression on a 16 GB M1 Pro
verdict:
  tried: "0% needle retrieval"
  result: "100% at 16K on MLX"
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
  - { label: Merged fix, href: https://github.com/TheTom/turboquant_plus/pull/93 }
mode: evaluate
order: 6
---
