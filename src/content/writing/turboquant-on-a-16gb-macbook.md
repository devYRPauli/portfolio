---
title: "From 0% to 100%: Debugging a KV Cache Compression Algorithm on a 16GB MacBook"
description: TurboQuant on an M1 Pro - five bugs across two codebases, one coupled math fix, and 100% needle retrieval at 16K with 3.5x less KV memory
pubDate: 2026-03-27
tags:
  - llm
  - quantization
  - apple-silicon
---

## TL;DR

I took TurboQuant, a KV cache compression method from a 2025 Google Research paper (ICLR 2026), and tried to make it actually work for long-context retrieval on an Apple M1 Pro with 16GB of RAM. Every stock implementation I tried scored 0% on needle-in-a-haystack retrieval. After a lot of debugging, the fixes took it to 100% retrieval at 16,000 tokens while cutting KV cache memory by 3.5x to 4x. Along the way I found and fixed five distinct issues across two different codebases, shipped fixes upstream to two open-source forks, and then re-read the paper carefully and discovered that my own headline "bug fix" was mischaracterized. This post is the whole story, with the data.

Repo with all logs, patches, scripts, and reports: https://github.com/devYRPauli/turboquant-m1pro-evaluation

Short case study: **[TurboQuant Evaluation](/work/turboquant-evaluation/)**

---

## Why this caught my eye

Large language models keep a running "KV cache" during generation: for every token in the context, every layer stores a key vector and a value vector so the attention mechanism does not have to recompute them. This cache grows linearly with context length, and at long contexts it dwarfs the model weights themselves. On a 16GB laptop, the KV cache is often what decides whether a long prompt fits in memory at all.

TurboQuant (arXiv 2504.19874, "Online Vector Quantization with Near-optimal Distortion Rate," by Amir Zandieh, Majid Daliri, Majid Hadian, and Vahab Mirrokni) is a clever answer. It compresses the KV cache without touching model weights, without training, and without calibration data. The paper claims 3.5-bit quantization with quality neutrality and at least 4.5x compression.

What makes it elegant is a two-stage design:

1. **PolarQuant (the MSE stage).** Randomly rotate each KV vector. In high dimensions this makes the coordinate distribution approximately Gaussian, which means you can quantize each coordinate independently with a precomputed optimal scalar quantizer (Lloyd-Max centroids). No per-block scale bookkeeping needed.

2. **QJL (the inner-product stage).** MSE-optimal quantizers are biased when you use them to estimate inner products, and attention scores are inner products. So the paper adds a second stage: a 1-bit "Quantized Johnson-Lindenstrauss" transform on the quantization residual that provides an unbiased correction.

On paper it is elegant. The question was whether it holds up against a real model on real hardware. At first, it did not.

---

## The setup

Everything below ran on one machine, deliberately modest:

| Component | Spec |
|---|---|
| Machine | MacBook Pro, Apple M1 Pro, 16GB unified memory |
| Model | Qwen2.5-3B-Instruct (4-bit MLX, and Q4_K_M GGUF via Ollama) |
| Frameworks | MLX (Apple native), llama.cpp forks, Ollama |
| Task | Needle-in-a-haystack retrieval at 2K, 4K, 8K, 16K tokens |

The needle test is simple and unforgiving: bury one unique fact in a long filler passage and ask the model to retrieve it. My needle was a fabricated genomics fact ("the disease-resistance allele FROSTBLOCK-7 in the VcMYB4 locus"), chosen so it cannot be guessed from context. Scoring: 1.0 if the model recovers both the allele name and the locus, 0.5 for one, 0.0 for neither.

---

## Round 1, Part 1: the math checks out

Before touching an LLM, I validated the core claim in isolation: does a random rotation actually Gaussianize LLM KV vectors? Real KV tensors are notoriously heavy-tailed, with a few "outlier channels" dominating. If the rotation does not tame them, the whole scheme falls apart.

It works, cleanly:

| Metric | Before rotation | After rotation | Gaussian target |
|---|---|---|---|
| Per-vector excess kurtosis (mean) | 50.98 | -0.13 | 0.00 |
| Per-vector excess kurtosis (max) | 105.79 | 0.86 | ~0 |

Excess kurtosis of 51 down to essentially 0 is the algorithm doing exactly what the paper promised. The compression codec was sound. That made the next result all the more confusing.

---

## Round 1, Part 2: the 0% wall

With the math validated, I ran the full pipeline through actual generation. Baselines were perfect. TurboQuant was a catastrophe.

| Configuration | 2K | 4K | 8K | 16K |
|---|---|---|---|---|
| Ollama baseline (Q8_0 KV) | 100% | 100% | 100% | 100% |
| MLX baseline (FP16 KV) | 100% | 100% | 100% | 100% |
| MLX TurboQuant, MSE-only 4-bit | 0% | 0% | 0% | 0% |
| MLX TurboQuant with QJL enabled | degenerate word loops at any length |

The MSE-only variant produced coherent text at tiny prompts but completely failed to retrieve the needle at any real context length: at 16K it hallucinated fake IDs like "UF-B999999999999". The moment I enabled the QJL correction stage, generation collapsed into literal word-loop degeneration ("gen gen gen gen...") even at 36 tokens.

One detail stood out: both of the independent open-source implementations I was working from (a Python prototype and an MLX package) had quietly abandoned the QJL stage in favor of MSE-only. Two separate engineers had independently concluded that the paper's second stage made things worse. That is a strong signal that something real was wrong, and it is where the investigation got interesting.

---

## The QJL detective story

The QJL stage was clearly the crime scene. Enabling it broke everything. So I dug into what the implementations actually did versus what the paper specified.

The paper's QJL (Definition 1) uses a random projection matrix S with i.i.d. Gaussian entries, and a dequantization scale of `sqrt(pi/2) / d`. The implementations followed this faithfully.

My first hypothesis, and the one I initially shipped, was that this was two bugs:

1. A Gaussian projection matrix has high variance; an orthogonal matrix would preserve norms and inner products much more tightly.
2. The scale looked wrong. For an orthonormal basis the unbiased scale is `sqrt(pi/2) / sqrt(d)`, not `sqrt(pi/2) / d`. At head dimension 128 that is a factor of `sqrt(128) = 11.3` difference.

I swapped in an orthogonal matrix (via QR decomposition) and changed the scale to `/sqrt(d)`. Generation stabilized. Retrieval started working. I wrote it up as "two implementation bugs," filed the fix upstream, and moved on.

**Then I went back and actually re-derived the math, and I was wrong about the framing.**

The paper's pairing of a Gaussian matrix with the `1/d` scale is not a bug. It is self-consistent and unbiased. Gaussian rows have norm approximately `sqrt(d)`, so the projection output is about `sqrt(d)` larger than it would be with unit-norm rows, and the `1/d` scale absorbs exactly that factor. The `sqrt(d)` "error" I thought I had found only exists relative to the orthogonal matrix I introduced in the same change. In other words, the projection change and the scale change are one coupled substitution, not two independent fixes. You cannot do one without the other, and the stock code was never carrying a scale bug.

So what actually fixed it? Not a corrected formula. A variance reduction. The paper-faithful estimator is unbiased but so noisy at head dimension 128 that attention collapses. The orthogonal variant has the same expectation but far lower variance, and that is what makes generation stable.

This distinction matters, and getting it right is the difference between "the original authors made a mistake" (false, and a bad look) and "the paper is correct in expectation, but its variance bound is loose enough that a naive implementation degenerates in practice, and here is a variance-reducing modification that fixes it" (true, and far more interesting).

### Proving it with an ablation

I did not want to just assert this. I ran a controlled ablation at 2K context, toggling each ingredient independently on the same prompt with fixed seeds:

| Projection | Scale | Damping | Generation behavior |
|---|---|---|---|
| gaussian (paper) | 1/d (paper) | 1.0 | word-loop degeneration |
| gaussian | 1/sqrt(d) | 1.0 | collapse |
| orthogonal | 1/d | 1.0 | word-loop degeneration |
| orthogonal | 1/sqrt(d) | 1.0 | semi-coherent, attends to needle |
| orthogonal | 1/sqrt(d) | 0.7 | coherent |
| gaussian (paper) | 1/d (paper) | 0.7 | word-loop degeneration |

Read the table top to bottom and the story is unambiguous. Changing only the scale (row 2) or only the matrix while keeping the mismatched scale (row 3) both still fail. Only the matched pair (row 4) escapes degeneration. That is the empirical proof that it is one coupled substitution. The third ingredient, a 0.7 damping factor on the correction term, then stabilizes semi-coherent output into fully coherent output. And damping applied to the stock Gaussian config (row 6) does nothing, which confirms damping is only useful once the projection and scale are fixed.

That damping factor of 0.7, incidentally, turns out to be almost exactly the MMSE-optimal shrinkage of `2/pi = 0.6366`. The unbiased estimator inflates reconstruction energy by a factor of `pi/2`, so shrinking the correction trades a tiny bias for a real reduction in mean squared error. The upstream maintainer later formalized this in the docstring during review.

---

## Keys are not values

Fixing the QJL math was necessary but not sufficient. A symmetric 4-bit allocation still failed at 2K. The clue came from a clean diagnostic in the llama.cpp path:

1. Quantize keys, keep values full precision: degenerate, repetitive output.
2. Keep keys full precision, quantize values: coherent, correct output.

Keys are far more sensitive to quantization noise than values, and the reason is structural. Attention scores are `softmax(Q K^T / sqrt(d))`. Key noise perturbs every score for every position, and in a needle task the needle's signal has to win against hundreds or thousands of filler positions. Add noise to the key inner products and the needle gets washed out. Value noise, by contrast, only affects what gets read back after attention has already decided where to look.

The fix is asymmetric bit allocation, which I called **Hybrid K5/V4**: give keys 5 bits (4-bit MSE base plus the 1-bit QJL correction) and values 4 bits (MSE only). Average rate 4.5 bits per element, still roughly 3.5x smaller than FP16. This asymmetry is not in the paper; the paper treats K and V uniformly. It was the single most important configuration choice for retrieval.

With correct QJL math plus Hybrid K5/V4, the MSE improvement was measurable: the QJL correction dropped reconstruction MSE from 0.00023 to 0.000129 (a 44% reduction, which matches the theoretical `pi/2 - 1` for the undamped estimator) and lifted cosine similarity to 99.7% on real activations.

---

## Round 2: the llama.cpp bug hunt

The MLX path proved the algorithm works. But MLX dequantization is slow Python, so I moved to two llama.cpp forks for a real C++/Metal implementation. This is where the classic systems bugs lived.

**Bug 1: GGML context sizing crash.** One fork crashed instantly on startup with `GGML_ASSERT(obj_new) failed`, even with the GPU fully disabled. The first hypothesis was hardware: the logs mentioned the Metal Tensor API being unavailable on the M1 Pro's GPU family, which looked like a smoking gun. It was a red herring. The real cause was a metadata pre-allocation formula that counted one K and one V tensor per layer but did not account for the two shared rotation-matrix tensors the TurboQuant cache allocates. The fix was to reserve two extra tensor slots. A one-expression change. It was a software bug, not a hardware limitation, and disproving the hardware theory was half the work. (This same bug was later fixed independently upstream, which was a nice confirmation.)

**Bug 2: missing Metal kernels.** The other fork ran on CPU but crashed on Metal offload because the tq3_0 quantization type was missing from the Metal backend's operation allowlist and had no Flash Attention kernel instantiations. This meant writing tq3_0 quantize and dequantize helpers in the Metal shader, adding the SET_ROWS and FLASH_ATTN_EXT kernel instantiations, and registering the type in the device allowlist.

**Bug 3: norm correction.** After Metal support was in, the K-path was still producing garbage. The quantizer stored the raw RMS of each input block as its scale factor. But after Lloyd-Max quantization and the inverse rotation, the reconstructed block has a different norm than the original. Multiplying by raw RMS gives keys the wrong magnitude, which corrupts every Q-K dot product. The fix: quantize and reconstruct inside the quantizer, measure the reconstructed norm, and store `original_norm / reconstruction_norm` as the scale so decode recovers the correct magnitude.

**Bug 4: zero blocks decoding as noise.** A near-zero-energy input block was guarded with `rms = 1.0` to avoid dividing by zero. The side effect was that genuinely empty blocks decoded into structured nonzero noise, which is pure error injected into attention. The fix: detect near-zero blocks and emit a true zero block (`d = 0`, packed data zeroed) so decode returns clean zeros.

---

## The results

Here is the full memory-and-quality picture on the M1 Pro at 16K tokens, the headline configuration:

| Runner | Needle @ 16K | KV cache size | tok/s |
|---|---|---|---|
| Ollama baseline (Q8_0) | 100% | 561 MB | 37.5 |
| MLX baseline (FP16) | 100% | 561 MB | 2.0 |
| MLX Hybrid K5/V4 TurboQuant | 100% | 158 MB | 1.1 |

The KV cache dropped from 561 MB to 158 MB, a 3.5x reduction, with zero loss in retrieval accuracy at 16K. That is the whole promise of the paper, delivered on a 16GB laptop.

Retrieval accuracy across all lengths for the fixed Hybrid config:

| Context | Needle score | Note |
|---|---|---|
| 2K | 0.5 | recovers locus, corrupts the allele name |
| 4K | 1.0 | both facts |
| 8K | 1.0 | both facts |
| 16K | 1.0 | both facts |

I want to be honest about that 2K row, because it is the kind of thing that is tempting to round up. An earlier internal summary claimed 100% at 2K. When I went back to verify, the raw data said 0.5: the model retrieves VcMYB4 but writes "FROSTst7" instead of "FROSTBLOCK-7." Rather than trust a single old log, I rebuilt the entire environment from pinned dependency versions and re-ran it. It reproduced exactly: same 0.5, same "FROSTst7" corruption, while 4K, 8K, and 16K reproduced at 100%. So the honest headline is "100% at 4K and above," not "100% everywhere." Interestingly, retrieval is harder at 2K here than at 4K, likely a quirk of where the needle lands relative to the filler at that specific length.

On speed: the MLX path is slow (1.1 tok/s at 16K) because dequantization is unoptimized Python doing a full 128x128 matrix multiply per block. This is not fundamental. For reference, an M5 Max running the C++ tq3_0 path still showed the same structural slowdown (13x to 35x slower than Q8_0 depending on model), which tells you the bottleneck is the O(d^2) dequantization, not the hardware. The obvious next step is a fast Walsh-Hadamard transform at O(d log d), but that is future work. The point of this project was to prove the quality claim, and the memory savings, are real. Both are.

---

## Verifying instead of trusting

Two things in this project could easily have been wrong and gone unnoticed, so I built explicit checks for both:

1. **The 2K number.** Reproduced from a clean, independently rebuilt environment. Byte-identical result. This is why the tables above say 0.5 and not 100%.

2. **The QJL framing.** Ablated ingredient by ingredient, which is what let me correct my own "two bugs" story into the accurate "one coupled variance-reducing substitution" story before the wrong version stuck.

I mention this because it is the part I am most proud of. The flashy result is 0% to 100%. The result I actually care about is catching my own mischaracterization by re-reading the source and running a controlled experiment, then correcting the public record, including a clarification comment on the merged upstream pull request whose commit message carried the wrong framing.

---

## What went back upstream

This was not a private exercise. The fixes are open-source contributions:

1. **QJL orthogonal projection + matched scale + shrinkage:** merged into the turboquant_plus Python reference on 2026-05-28. The maintainer's review added the closed-form MMSE derivation to the docstring.

2. **tq3_0 norm correction, zero-block handling, and full Metal GPU support:** submitted as a pull request to the Aaryan Kapoor llama.cpp fork.

3. **GGML context sizing:** the same bug was independently fixed upstream, confirming the diagnosis.

There is also a broader community discussion tracking TurboQuant work in llama.cpp at https://github.com/ggml-org/llama.cpp/discussions/20969

---

## What I took away

1. **Validate the component before the system.** Confirming the rotation Gaussianized the KV distribution (kurtosis 51 to 0) up front meant that when generation failed, I knew the codec was fine and the bug was elsewhere. That saved a lot of flailing.

2. **A paper being correct in expectation does not mean a naive implementation works.** TurboQuant's QJL is unbiased exactly as written. It still degenerates in practice because the variance bound is loose at real head dimensions. The gap between "unbiased" and "usable" was the entire project.

3. **Debug the diagnosis, not just the symptom.** The GGML crash looked like a hardware incompatibility. It was a counting error in a size formula. The Metal log line was real but irrelevant. Chasing the wrong signal there would have cost days.

4. **Keys and values are not interchangeable.** Asymmetric bit allocation was not in the paper and was the biggest single lever for retrieval quality.

5. **Re-read the source and be willing to overturn your own conclusion.** My first writeup called the fix two bugs. It was one coupled substitution, and the stock code was faithful to the paper. Catching that required going back to the math and running an ablation, and it is the difference between an accurate technical story and a wrong one that happens to sound impressive.

The stock implementations scored 0%. The finished configuration scores 100% at 16K while using 3.5x less KV memory, on a 16GB laptop, with every number reproducible from the repo.

---

## Links and credits

* Full evaluation repo (logs, patches, scripts, reports): https://github.com/devYRPauli/turboquant-m1pro-evaluation
* Paper: Zandieh, A., Daliri, M., Hadian, M., Mirrokni, V. "TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate." arXiv 2504.19874. ICLR 2026 (poster).
* Paper authors: Amir Zandieh (Google Research), Majid Daliri (New York University), Majid Hadian (Google DeepMind), Vahab Mirrokni (Google Research)
* Aaryan Kapoor: llama.cpp fork with the tq3_0 implementation
* Tom Turney (TheTom): turboquant_plus Python prototype and llama-cpp-turboquant fork
* Prince Canuma (Blaizzy): MLX implementation reference and community benchmarks
