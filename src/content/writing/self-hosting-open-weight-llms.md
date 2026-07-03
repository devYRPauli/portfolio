---
title: Self-Hosting Open-Weight LLMs
description: Run capable models locally without sending data to a cloud API
pubDate: 2026-07-03
tags:
  - llm
  - self-hosting
---

There is a whole class of work where you cannot send the data to a cloud API: confidential records, regulated environments, anything air-gapped. The good news is that open-weight models have gotten good enough that you do not have to. Here is how I think about running them locally.

## Pick the model to fit the hardware, not the other way around

Start from the memory you actually have. A quantized model that fits comfortably in unified memory and runs fast beats a larger one that swaps and crawls. Quantization (Q5/Q6) usually costs little accuracy for a large memory win.

## Choose a serving layer on purpose

Ollama is the fastest path to a working local endpoint and great for development. vLLM gives you higher throughput and better batching when you need to serve real concurrent load. They solve different problems; do not default to one out of habit.

## Watch the context window, it is where performance goes to die

A model spilling to CPU because the context window default is too large will feel broken even on strong hardware. Set the context length deliberately to what the task needs, and enable flash attention where supported.

```bash
# Keep context lean so inference stays on the accelerator
OLLAMA_CONTEXT_LENGTH=4096
OLLAMA_FLASH_ATTENTION=1
```

## Keep the application layer hardware-agnostic

Treat the model and the inference backend as swappable. If your app talks to a clean internal interface rather than a specific runtime, you can move from one machine or model to a better one without rewriting everything above it.

## Measure before you trust

Local does not mean unverified. Build a small benchmark of real questions with known good answers and run it whenever you change the model, the quantization, or the serving config. Vibes are not a release gate.
