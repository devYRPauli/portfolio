---
title: "From 0% to 100%: Debugging a KV Cache Compression Algorithm on a 16GB MacBook"
description: TurboQuant on an M1 Pro - needle retrieval from 0% to 100% at 16K on MLX, and four bugs fixed in two llama.cpp forks
project: turboquant-evaluation
featuredOrder: 1
verdict:
  tried: "Called it a bug fix"
  result: "variance reduction, corrected"
pubDate: 2026-03-27
updatedDate: 2026-10-05
tags:
  - llm
  - quantization
  - apple-silicon
---

## TL;DR

I took TurboQuant, a KV cache compression method from a 2025 Google Research paper (ICLR 2026), and tried to make it actually work for long-context retrieval on an Apple M1 Pro with 16GB of RAM. The stock MLX implementation scored 0% on needle-in-a-haystack retrieval, and the llama.cpp forks crashed or produced garbage. After a lot of debugging, the MLX version reached 100% retrieval at 16,000 tokens. The cache format uses 4.5 bits per element, which would be 3.4x to 3.6x smaller than FP16 with packed bits. The MLX package I used stores one byte per element, so the measured cache was only 1.29x smaller, and peak memory went up. Along the way I fixed four bugs in two llama.cpp forks and changed the QJL math in the Python reference. The QJL change was merged upstream. Three of the llama.cpp fixes are in an open pull request, and the fourth was fixed upstream independently. Then I re-read the paper carefully and discovered that my own headline "bug fix" was mischaracterized. This post is the whole story, with the data.

Repo with all logs, patches, scripts, and reports: https://github.com/devYRPauli/turboquant-m1pro-evaluation

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

The needle test is simple and unforgiving: bury one unique fact in a long filler passage and ask the model to retrieve it. My needle was a fabricated genomics fact ("the disease-resistance allele FROSTBLOCK-7 in the VcMYB4 locus"), chosen so it cannot be guessed from context. Scoring: 1.0 if the model recovers both the allele name and the locus, 0.5 for one, 0.0 for neither. The match ignores case.

---

## Round 1, Part 1: the math checks out

Before touching an LLM, I validated the core claim in isolation: does a random rotation actually Gaussianize LLM KV vectors? Real KV tensors are notoriously heavy-tailed, with a few "outlier channels" dominating. If the rotation does not tame them, the whole scheme falls apart.

It works, cleanly:

| Metric | Before rotation | After rotation | Gaussian target |
|---|---|---|---|
| Per-vector excess kurtosis (mean) | 50.98 | -0.13 | 0.00 |
| Per-vector excess kurtosis (max) | 105.79 | 0.86 | ~0 |

Excess kurtosis of 51 down to near zero is the algorithm doing exactly what the paper promised. The compression codec was sound. That made the next result all the more confusing.

---

## Round 1, Part 2: the 0% wall

With the math validated, I ran the full pipeline through actual generation. Baselines were perfect. TurboQuant was a catastrophe.

| Configuration | 2K | 4K | 8K | 16K |
|---|---|---|---|---|
| Ollama baseline (FP16 KV) | 100% | 100% | 100% | 100% |
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

The paper's pairing of a Gaussian matrix with the `1/d` scale is self-consistent and unbiased. Gaussian rows have norm approximately `sqrt(d)`, so the projection output is about `sqrt(d)` larger than it would be with unit-norm rows, and the `1/d` scale absorbs exactly that factor. The `sqrt(d)` "error" I thought I had found only exists relative to the orthogonal matrix I introduced in the same change. In other words, the projection change and the scale change are one coupled substitution, not two independent fixes. You cannot do one without the other, and the stock code was never carrying a scale bug.

So what actually fixed it was a variance reduction, not a corrected formula. The paper-faithful estimator is unbiased but so noisy at head dimension 128 that attention collapses. The orthogonal variant has the same expectation but far lower variance, and that is what makes generation stable.

This distinction matters. The wrong version is "the original authors made a mistake," which is false and a bad look. The right version is that the paper is correct in expectation, but its variance bound is loose enough that a naive implementation degenerates in practice. My change reduces that variance and fixes it. That version is true, and far more interesting.

### Testing it with an ablation

I did not want to just assert this. I ran a controlled ablation at 2K context, toggling each ingredient independently on the same prompt with fixed seeds:

| Projection | Scale | Damping | Generation behavior |
|---|---|---|---|
| gaussian (paper) | 1/d (paper) | 1.0 | word-loop degeneration |
| gaussian | 1/sqrt(d) | 1.0 | collapse |
| orthogonal | 1/d | 1.0 | word-loop degeneration |
| orthogonal | 1/sqrt(d) | 1.0 | semi-coherent filler text |
| orthogonal | 1/sqrt(d) | 0.7 | cleaner filler text, some stutters |
| gaussian (paper) | 1/d (paper) | 0.7 | word-loop degeneration |

Read the table top to bottom and the pattern is clear. Changing only the scale (row 2) or only the matrix while keeping the mismatched scale (row 3) both still fail. Only the matched pair (row 4) escapes degeneration. That is consistent with one coupled substitution. The third ingredient, a 0.7 damping factor on the correction term, makes the text a little cleaner. And damping applied to the stock Gaussian config (row 6) does nothing, so damping only helps once the projection and scale are fixed.

This ablation has limits. Each row is one greedy run on a synthetic 2K prompt with no chat template. The keys use 4 bits (3-bit MSE plus 1-bit QJL), not the 5 bits of the final configuration. No row actually answers the question. A rerun in October kept the same ordering, but none of the text matched the July run.

That damping factor of 0.7, incidentally, turns out to be almost exactly the MMSE-optimal shrinkage of `2/pi = 0.6366`. The unbiased estimator inflates reconstruction energy by a factor of `pi/2`, so shrinking the correction trades a tiny bias for a real reduction in mean squared error. The upstream maintainer later formalized this in the docstring during review.

---

## Keys are not values

Fixing the QJL math was necessary but not sufficient. A symmetric 4-bit allocation still failed. With 4-bit keys (3-bit MSE plus 1-bit QJL), an early probe could not find the needle even in an 800-token prompt. The clue came from a clean diagnostic in the llama.cpp path:

1. Quantize keys, keep values full precision: degenerate, repetitive output.
2. Keep keys full precision, quantize values: coherent, correct output.

Keys are far more sensitive to quantization noise than values, and the reason is structural. Attention scores are `softmax(Q K^T / sqrt(d))`. Key noise perturbs every score for every position, and in a needle task the needle's signal has to win against hundreds or thousands of filler positions. Add noise to the key inner products and the needle gets washed out. Value noise, by contrast, only affects what gets read back after attention has already decided where to look.

The fix is asymmetric bit allocation, which I called **Hybrid K5/V4**: give keys 5 bits (4-bit MSE base plus the 1-bit QJL correction) and values 4 bits (MSE only). The average is 4.5 bits per element. With packed bits that would be 3.4x to 3.6x smaller than FP16, depending on how the norms are stored. This asymmetry is not in the paper; the paper treats K and V uniformly. Retrieval needed it, but it was not enough on its own. The same K5/V4 bits with the paper's Gaussian QJL still scored 0% at every length, with degenerate text.

My round 1 post-mortem notes record the effect on reconstruction. With the fixes applied, the QJL correction dropped MSE from 0.00023 to 0.000129, a 44% reduction that matches the theoretical `2 - pi/2` (about 43%) for the undamped estimator. The notes also record 99.7% cosine similarity on real activations. I did not keep the raw output for that measurement, so the repo cannot back these two numbers.

---

## Round 2: the llama.cpp bug hunt

The MLX path proved the algorithm works. But MLX dequantization runs as slow, unfused array operations, so I moved to two llama.cpp forks for a real C++/Metal implementation. This is where the classic systems bugs lived.

**Bug 1: GGML context sizing crash.** One fork crashed instantly on startup with `GGML_ASSERT(obj_new) failed`, even with the GPU fully disabled. The first hypothesis was hardware: the logs mentioned the Metal Tensor API being unavailable on the M1 Pro's GPU family, which looked like a smoking gun. It was a red herring. The real cause was a metadata pre-allocation formula that counted one K and one V tensor per layer but did not account for the two shared rotation-matrix tensors the TurboQuant cache allocates. The fix was to reserve two extra tensor slots. A one-expression change. It was a software bug, not a hardware limitation, and disproving the hardware theory was half the work. (This same bug was later fixed independently upstream, which was a nice confirmation.)

**Bug 2: missing Metal kernels.** The other fork ran on CPU but crashed on Metal offload because the tq3_0 quantization type was missing from the Metal backend's operation allowlist and had no Flash Attention kernel instantiations. This meant writing tq3_0 quantize and dequantize helpers in the Metal shader, adding the SET_ROWS and FLASH_ATTN_EXT kernel instantiations, and registering the type in the device allowlist.

**Bug 3: norm correction.** After Metal support was in, the K-path was still producing garbage. The quantizer stored the raw RMS of each input block as its scale factor. But after Lloyd-Max quantization and the inverse rotation, the reconstructed block has a different norm than the original. Multiplying by raw RMS gives keys the wrong magnitude, which corrupts every Q-K dot product. The fix: quantize and reconstruct inside the quantizer, measure the reconstructed norm, and store `original_norm / reconstruction_norm` as the scale so decode recovers the correct magnitude.

**Bug 4: zero blocks decoding as noise.** A near-zero-energy input block was guarded with `rms = 1.0` to avoid dividing by zero. The side effect was that genuinely empty blocks decoded into structured nonzero noise, which is pure error injected into attention. The fix: detect near-zero blocks and emit a true zero block (`d = 0`, packed data zeroed) so decode returns clean zeros.

---

## The results

The table below shows memory and quality at 16K tokens on the M1 Pro, the headline configuration.

| Runner | Needle @ 16K | KV cache, stored | Peak MLX memory | Wall time | tok/s |
|---|---|---|---|---|---|
| Ollama baseline (FP16 KV) | 100% | - | - | 49.3 s | 37.5, decode only |
| MLX baseline (FP16) | 100% | 563 MB | 3,077 MB | 39.9 s | 2.0, prefill included |
| MLX Hybrid K5/V4 TurboQuant | 100% | 436 MB | 3,304 MB | 71.4 s | 1.1, prefill included |

Retrieval at 16K held at 100% with the compressed cache. The memory saving was much smaller than I first claimed. The first version of this post gave 561 MB and 158 MB for the cache. Those came from a formula that assumes packed bits. In October I measured the stored cache with the rebuilt code described below. It was 563 MB for FP16 and 436 MB for Hybrid K5/V4, only 1.29x smaller. The optiq package stores each 4-bit index and each 1-bit QJL sign in a full byte.

Peak memory went the other way: 3,304 MB with TurboQuant against 3,077 MB without. The cache hands back its keys and values in float32. Attention and the residual stream then run in float32 in every layer after the first. During the 16K prefill, those float32 buffers cost more than the smaller cache saves. In the October rebuild the Hybrid peak was 3,245 MB. When I cast the keys and values back to FP16 before attention, it dropped to 2,868 MB, which is 209 MB below the FP16 baseline. With packed bits and FP16 output, the Hybrid cache would be about 3.4x smaller than FP16. Stock optiq does neither.

The two tok/s numbers measure different things. Ollama reports its decode rate, which leaves out the prompt. The MLX number divides generated tokens by total time, and that includes the 16K prefill. By wall time, MLX FP16 finished the request in 39.9 seconds and Ollama in 49.3 seconds. Ollama's wall time also includes the HTTP call and any model load, so treat that as a rough comparison.

Retrieval accuracy across all lengths for the fixed Hybrid config:

| Context | Original run | October rebuild | Note |
|---|---|---|---|
| 2K | 0.5 | 0.5 | both recover the locus and corrupt the allele name |
| 4K | 1.0 | 0.5 | original wrote "FROstblock-7", the rebuild wrote "FRstblock-7" |
| 8K | 1.0 | 0.5 | the rebuild named only the locus |
| 16K | 1.0 | 1.0 | both facts |

I want to be honest about that 2K row, because it is the kind of thing that is tempting to round up. An earlier internal summary claimed 100% at 2K. When I went back to verify, the raw data said 0.5: the model retrieves VcMYB4 but writes "FROSTst7" instead of "FROSTBLOCK-7." Rather than trust a single old log, I rebuilt the environment in July from pinned dependency versions and re-ran it with the modified optiq files. It reproduced exactly: same 0.5, same "FROSTst7" corruption, and 100% at 4K, 8K, and 16K.

Then I found a bigger gap. I had edited the installed optiq package in place, and those edits never made it into the repo. In October I rebuilt the changes as a small module in the repo (`benchmarks/tq_patched.py`) and ran the needle test again on macOS 27. The FP16 baseline reproduced exactly, text and peak memory included. The Hybrid 2K and 16K scores reproduced too. The 4K and 8K scores dropped to 0.5, and no Hybrid response text matched the original runs. The Hybrid peak memory also moved by up to 170 MB, so the rebuild is not an exact copy of the lost files. The OS changed as well, and these runs cannot separate the two causes. So the result that reproduces from the repo is 100% at 16K. The 4K and 8K passes rest on the original runs.

On speed: the MLX TurboQuant path is slow (1.1 tok/s at 16K, against 2.0 for FP16 on the same measure). It dequantizes the full cache at every step, with 128x128 matrix multiplies in unfused MLX operations. This is not fundamental. For reference, an M5 Max running the turbo3 path in TheTom's llama.cpp fork still showed the same structural slowdown (13x to 35x slower than Q8_0 depending on model), which points to the O(d^2) dequantization, not the hardware. The obvious next step is a fast Walsh-Hadamard transform at O(d log d), but that is future work. The point of this project was to check the quality claim. On MLX it held at 16K in every run, and at 4K and 8K in the original runs. The memory saving needs packed bits and FP16 output, and stock optiq has neither.

---

## Verifying instead of trusting

Three things in this project could easily have been wrong and gone unnoticed, so I built explicit checks for them:

1. **The 2K number.** Reproduced in July from a clean, rebuilt environment, with the same scores and the same output text. This is why the tables above say 0.5 and not 100%. The October rebuild kept the 0.5 but not the text, and it lost the 4K and 8K passes.

2. **The QJL framing.** Ablated ingredient by ingredient, which is what let me correct my own "two bugs" story into the accurate "one coupled variance-reducing substitution" story before the wrong version stuck.

3. **The memory claim.** This one I got wrong first. The first version of this post quoted a formula. When I measured it, the stored cache was only 1.29x smaller and peak memory was higher.

I mention this because it is the part I am most proud of. The flashy result is 0% to 100%. The result I actually care about is catching my own mischaracterization. I re-read the source, ran a controlled experiment, and then corrected the public record. That included a clarification comment on the merged upstream pull request, whose commit message carried the wrong framing.

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

4. **Keys and values are not interchangeable.** Asymmetric bit allocation was not in the paper, and retrieval needed it. It only worked together with the orthogonal QJL change. The same bits with the paper's Gaussian QJL still scored 0%.

5. **Re-read the source and be willing to overturn your own conclusion.** My first writeup called the fix two bugs. It was one coupled substitution, and the stock code was faithful to the paper. Catching that required going back to the math and running an ablation, and it is the difference between an accurate technical story and a wrong one that happens to sound impressive.

6. **Keep the code that produced the number.** I edited the installed package in place and never copied the edits out. When I later had to rebuild them, two of the four needle results did not come back.

The stock MLX implementation scored 0%. The finished configuration scores 100% at 16K on a 16GB laptop, and that result reproduces from the repo. The format is 4.5 bits per element, but stock optiq stores a byte per element and returns float32. On MLX the stored cache was only 1.29x smaller, and the peak went up.

---

## Update, October 5

The first version of this post said TurboQuant cut KV cache memory by 3.5x to 4x, and that every number was reproducible from the repo. I had not measured the memory. The 3.6x figure is a calculation, and measured peak memory was 7% higher with TurboQuant. The repo also does not hold the modified optiq package yet. I changed the TL;DR, the results section, and the closing paragraph to match.

Later the same day I finished the repo work behind those corrections. I rebuilt the lost optiq changes in `benchmarks/tq_patched.py` and reran the needle test. The 16K result reproduced, but 4K and 8K dropped to 0.5. I also measured the cache. It was only 1.29x smaller than FP16, and the higher peak comes from float32 output. The Ollama tok/s figure covers decode only, while the MLX figures include the prefill. I updated the affected sections again to match.

---

## Links and credits

* Full evaluation repo (logs, patches, scripts, reports): https://github.com/devYRPauli/turboquant-m1pro-evaluation
* Paper: Zandieh, A., Daliri, M., Hadian, M., Mirrokni, V. "TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate." arXiv 2504.19874. ICLR 2026 (poster).
* Paper authors: Amir Zandieh (Google Research), Majid Daliri (New York University), Majid Hadian (Google DeepMind), Vahab Mirrokni (Google Research)
* Aaryan Kapoor: llama.cpp fork with the tq3_0 implementation
* Tom Turney (TheTom): turboquant_plus Python prototype and llama-cpp-turboquant fork
* Prince Canuma (Blaizzy): MLX implementation reference and community benchmarks
