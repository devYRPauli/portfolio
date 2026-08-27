---
title: I Tried to Break Google's New Tabular Foundation Model. Then I Fixed It.
description: An independent, reproducible evaluation of TabFM - what held up, what did not, and the bug fix that got merged into Google's repo
project: tabfm-evaluation
verdict:
  tried: "Won on 10 datasets"
  result: "demoted 2 of my own wins to ties"
pubDate: 2026-07-01
updatedDate: 2026-07-07
tags:
  - evals
  - reproducibility
---

## TL;DR

Google Research released **TabFM** on 2026-06-30, a zero-shot foundation model for tabular data: no training, no tuning, you hand it your table and it predicts. The claim is that a single pre-trained model can match or beat tuned gradient-boosted trees out of the box. That is a big claim, so I ran an independent reproduction across three machines.

What I found:

- On small-to-mid tables, TabFM **beat a properly Optuna-tuned XGBoost on all 10 fold-matched datasets**, zero-shot. On the anchor dataset the gap actually *widened* under tuning (0.877 vs 0.821 accuracy).
- But I held myself to the same bar I'd hold the authors to. A multi-seed check forced me to **demote two "wins" to ties** because the margins were smaller than measurement noise.
- The advertised "22.75 GB GPU footprint" turned out to be **mostly an XLA allocator artifact**; the real footprint is ~16.95 GB, and disabling preallocation roughly **doubled the usable context** (from ~10k rows to ~20k).
- **Update (2026-07-07):** after a TabFM author mentioned the repo now enables bf16 + activation chunking, I benchmarked the PyTorch backend at current `main`. On the same 4090 it holds a **3-7 GB working set (vs the JAX pin's flat ~17 GB), fits 40k rows where JAX OOMs at ~20k, and runs 2-4x faster at large context.** Details in the hardware section.
- Along the way I found a bug that **crashes `predict` on any machine with two or more GPUs**. I root-caused it, wrote a fix and a regression test, and the PR was **merged into `google-research/tabfm` by one of TabFM's own authors**.

Everything below is seeded, pinned, and reproducible: **[github.com/devYRPauli/tabfm-evaluation](https://github.com/devYRPauli/tabfm-evaluation)**

Short case study: **[TabFM Evaluation](/work/tabfm-evaluation/)**

---

## How this started

I read the TabFM launch post the day it went up. The pitch is genuinely interesting: tabular data is the one domain where deep learning has repeatedly lost to gradient-boosted trees, and here was a foundation-model approach claiming to close that gap with *zero* training on your data. It learns in-context, the way a large language model does, except the "context" is your training rows.

My first instinct with a claim like that is not to believe it and not to dismiss it, but to reproduce it. Benchmarks in papers and blog posts are run by people who want their method to look good. That reflects incentives rather than dishonesty. An independent reproduction is the only way to know which parts hold up when someone with no stake in the outcome runs them.

So I set three rules for myself before writing a line of code:

1. **The source code is ground truth, not the blog post.** Where they disagree, the code wins.
2. **Every result is seeded and reproducible.** No cherry-picked runs.
3. **Negative results are results.** If it loses, or ties, or fails, that gets reported as plainly as a win.

That third rule turned out to matter the most.

---

## What TabFM actually is (read from the code, not the marketing)

Before benchmarking anything, I wanted to know exactly what I was testing. A few facts I verified directly from the source:

- **It is in-context learning, not training.** Calling `fit()` does *not* update the network. Your training rows become context for a single forward pass at predict time. This is why it is "zero-shot."
- **The default forward pass is a 32-member ensemble.** That detail matters enormously for the memory story later.
- **There is a hard cap of `max_classes = 10`.** Good to know before you throw a 20-class problem at it.
- **Two weight repos exist.** The JAX Orbax checkpoint is canonical; the PyTorch one is a converted `state_dict` that I validated matches within 1e-4. I used the JAX backend.
- **Two licenses.** The code is Apache-2.0; the pretrained weights are non-commercial. They govern different artifacts, which is easy to miss.

Pinned stack for the whole study: commit `b6ea70b`, JAX 0.10.2, Flax 0.12.7, Python 3.12.

---

## The setup: three machines, and one that I set on fire

I ran this across three machines, each with one job:

| Machine | Spec | Role |
|---|---|---|
| MacBook Pro | M1 Pro, 16 GB | Orchestration only |
| Mac Studio | M4 Max, 64 GB | CPU reference |
| Workstation | Threadripper PRO 5955WX, 128 GB, 2x RTX 4090 | GPU reference |

The MacBook is "orchestration only" for a reason I learned the hard way. Early on I ran the full model on the 16 GB laptop. The 32-member ensemble needs a ~17 GB working set. macOS tried to cover the gap with swap, wrote about 39 GB of it, and the machine restarted itself.

That incident produced the most useful piece of infrastructure in the whole project: a `safe_run.sh` watchdog that preflights free memory and disk, then kills any job before its resident set, system swap, or free disk crosses a limit. I would rather lose a job than restart the machine. Every heavy run after that went through it. The lesson generalizes: **when you are probing the limits of a model's resource use, build the kill-switch before you need it.**

---

## Phases 0 to 2: does it even reproduce?

Before the headline benchmark, three checks:

**Phase 1 - conformance and determinism.** The scikit-learn contract holds, and predictions are **bit-exact deterministic** under a fixed seed, on both the Studio CPU and the 4090 GPU. CPU and GPU agree numerically. Good - a model whose outputs drift run-to-run is not one you can benchmark honestly.

**Phase 2 - known-answer sanity.** Before trusting it on real data, I checked it can learn things I already know the answer to. It nails XOR (accuracy 1.00), accuracy climbs from 0.69 to 0.98 as I feed it more context rows, and it recovers a monotone function at R2 0.997. It genuinely learns from context rather than matching noise.

**A caught harness bug.** My first sanity layer looked broken until I found the bug was *mine*: the synthetic-data generator was drawing a fresh labeling function for train versus test. Fixing my own harness before blaming the model is a recurring theme. Most of my "the model is wrong" moments turned out to be "my measurement is wrong" moments.

---

## Phase 3: the actual benchmark

The benchmark is **TabArena** (OpenML Study 457), a curated tabular suite. I used a 13-dataset subset spanning 748 to 150,000 rows, 9 classification and 4 regression tasks, on the official repeat-0 folds, 3 folds each.

Baselines: TabFM's default and `.ensemble()` presets, versus XGBoost, random forest, a logistic/ridge floor, and TabPFN (another tabular foundation model). Metrics: accuracy, ROC AUC, log loss for classification; RMSE and R2 for regression.

**The comparison is fold-matched** - TabFM and a baseline are only compared on folds where *both* produced a result. This one discipline prevents a huge class of benchmark lies, where a method looks good only because it quietly skipped the hard folds.

The first pass was clearly favorable to TabFM. It matched or beat every baseline on the primary metric, zero-shot: churn 0.979 vs 0.956 XGBoost, maternal-health 0.877 vs 0.842 random forest, diamonds R2 0.985. Against TabPFN it was directionally ahead but by hair-thin margins (MIC 0.891 vs 0.889).

I published that, and the pushback arrived quickly.

---

## The pushback: three critiques, and how I chased each one down

The feedback was specific and correct. Three critiques stuck, and rather than defend the first draft I spent real compute closing each one. The honest answers made the story *more* interesting, not less.

### Critique 1: "Your tree baseline was too soft."

Fair. My first XGBoost was lightly tuned. So I replaced it with an **Optuna-tuned XGBoost: 100 trials of TPE search with 3-fold inner cross-validation, per dataset.** That is a real tuning budget, the kind a strong practitioner would actually use.

TabFM still beat it on **all 10 fold-matched datasets**:

| Dataset | Metric | TabFM | Optuna-XGBoost | Delta |
|---|---|---|---|---|
| maternal_health_risk | acc | 0.877 | 0.821 | **+0.055** |
| houses | R2 | 0.898 | 0.856 | +0.043 |
| wine_quality | R2 | 0.549 | 0.518 | +0.031 |
| students_dropout | acc | 0.800 | 0.772 | +0.028 |
| churn | acc | 0.979 | 0.955 | +0.023 |
| credit-g | acc | 0.779 | 0.758 | +0.021 |
| concrete | R2 | 0.950 | 0.934 | +0.016 |
| blood-transfusion | acc | 0.801 | 0.787 | +0.013 |
| diamonds | R2 | 0.985 | 0.982 | +0.002 (2 folds) |
| MIC | acc | 0.891 | 0.890 | +0.001 |

The headline: **on the anchor dataset (maternal-health), proper tuning did not close the gap - it widened it** (+0.055, the largest margin of all). Eight of the ten margins are substantive (+0.013 to +0.055). But look at the bottom two rows. Those tiny margins set up critique 2.

### Critique 2: "A single seed is noise, not a result."

Also fair. My first run used one seed. So I re-ran **both TabFM and the baselines at three seeds** on the thin-margin datasets and measured the run-to-run spread on each side.

The result cut both ways. First, the good news: **TabFM is remarkably stable.** Its run-to-run standard deviation is 0.0001 to 0.0006 - smaller than *every* tree baseline (the tuned XGBoost drifts up to 0.005, random forest up to 0.004). So the thin margins are not a TabFM-noise artifact; TabFM sits stably where it sits.

| Dataset | Method | Seed 0 | Seed 1 | Seed 2 | Std |
|---|---|---|---|---|---|
| MIC | **TabFM** | 0.8911 | 0.8917 | 0.8917 | **0.0003** |
| MIC | xgboost_optuna | 0.8899 | 0.8882 | 0.8876 | 0.0010 |
| concrete | **TabFM** | 0.9503 | 0.9500 | 0.9502 | **0.0001** |
| concrete | xgboost_heavy | 0.9365 | 0.9335 | 0.9307 | 0.0024 |
| blood | **TabFM** | 0.8008 | 0.8021 | 0.8021 | **0.0006** |
| blood | xgboost_heavy | 0.7754 | 0.7660 | 0.7781 | 0.0051 |

Now the catch. Being stable does not mean the thin wins are real. When a margin is +0.001 and sits within test-set granularity, you cannot claim it. So I **demoted the two thinnest results to ties**:

- **concrete vs TabPFN (+0.0011): a genuine near-tie.** Reported as a tie.
- **MIC vs TabPFN (+0.0022) and vs Optuna (+0.0029):** too close to call a win. Ties. (Optuna on MIC actually got slightly *worse* across seeds, 0.890 to 0.889.)
- **blood-transfusion (+0.0089) and concrete vs Optuna (+0.0157):** comfortably outside the noise. Real edges.

I also hit a wall I could not climb: **TabPFN would not run at seeds 1 and 2.** It hangs on a C-level network call in my environment no matter how I invoke it (backgrounded, pseudo-TTY, real TTY - all hang). Rather than pretend, I documented the gap: the two TabPFN margins rest on TabFM's measured variance plus TabPFN's single seed-0 point. An unmeasured thing reported as unmeasured is worth more than a number I made up.

### Critique 3: "Your 22.75 GB memory number is an XLA artifact."

This one was the most fun to chase down. My Phase 4 hardware sweep reported GPU peak memory pinned at a suspiciously flat ~22.75 GB across every context size. A commenter pointed out that I had not disabled XLA preallocation, so I was almost certainly measuring XLA's preallocated *pool*, not the model's live working set.

They were right, and the truth was more nuanced than either "real" or "artifact." I re-ran with `XLA_PYTHON_CLIENT_PREALLOCATE=false` on an otherwise-empty card:

| Context (n_train) | Prealloc ON | Prealloc OFF |
|---|---|---|
| 100 | 22752 MiB | 16953 MiB |
| 1000 | 22754 MiB | 16955 MiB |
| 5000 | 22756 MiB | 16957 MiB |
| 10000 | 22779 MiB | 16957 MiB |
| 20000 | (OOM) | 16955 MiB (fits) |
| 30000 | (OOM) | OOM |

So: **~5.8 GB of the original 22.75 GB was pure pool padding** (the artifact the commenter suspected). But the remaining **~16.95 GB is a real, large, and genuinely flat footprint** - it grows only ~4 MiB from 100 rows to 20,000, because the 32-member ensemble's fixed cost dominates. Latency is identical between the two runs, confirming it is the same workload measured with a different allocator.

The practical payoff: disabling preallocation **roughly doubled the usable context ceiling on a 24 GB card, from ~10k rows to ~20k**, and proved the original ">10k OOMs" was the pool, not the model. That is an actionable finding for anyone running TabFM on a single GPU.

### The hardware picture, completed

For completeness I finished the CPU curve on the Studio too. The full latency-vs-context story:

| n_train | GPU latency | CPU latency | Speedup |
|---|---|---|---|
| 100 | 2.3 s | 32.5 s | 14x |
| 1000 | 4.6 s | 147.3 s | 32x |
| 2000 | 8.9 s | 346.0 s | 39x |
| 5000 | 31.1 s | 1299.2 s | 42x |

The GPU is 14x to 42x faster where it fits, and the gap *widens* with context. There is no speed crossover - the GPU is always faster where it fits, and simply stops fitting past its memory ceiling. The CPU can hold far more context (64 GB unified memory), but at ~21 minutes per single prediction at 5,000 rows, it is impractical at scale. This matches exactly why the largest TabArena datasets (78k and 150k rows) could not be benchmarked exhaustively.

### Update: the PyTorch backend changed the memory story

After I published, one of TabFM's authors reached out to say the repo had recently been updated to enable **bf16 computation and activation chunking** for speed and memory, and asked whether my eval predated the change. It did - and the honest answer has two halves. The accuracy numbers are untouched: those changes are **PyTorch-backend-only** and post-date my pinned commit, and the JAX backend I used already computed in bfloat16, so nothing above moves. But it raised an obvious question I hadn't measured: what does the *updated* backend actually do to the hardware envelope?

So I ran the sweep again on the same 4090, this time on the **PyTorch backend at current `main`**, chunking on. The chunking is the whole story:

| Context (n_train) | JAX pin (b6ea70b) | PyTorch main (chunked) | Latency: JAX -> PyTorch |
|---|---|---|---|
| 100 | ~17 GB | 3.1 GB | 2.07 s -> 1.84 s |
| 1000 | ~17 GB | 3.3 GB | 4.36 s -> 3.02 s |
| 5000 | ~17 GB | 3.9 GB | 31.6 s -> 14.1 s |
| 10000 | ~17 GB | 4.1 GB | 107.3 s -> 34.5 s |
| 20000 | ~17 GB (near ceiling) | 5.0 GB | 384.1 s -> 87.8 s |
| 40000 | OOM (>24 GB) | 7.0 GB | - -> 245.4 s |

Two caveats I want to be explicit about, because the numbers look almost too good. First, the memory columns are **not the same metric**: the JAX figure is `nvidia-smi` (masked by XLA preallocation), while the PyTorch figure is `torch.cuda.max_memory_allocated` (the device-authoritative live working set). So "17 GB vs 3 GB" mixes two different metrics. The honest framing is "flat ~17 GB and OOM around 20-30k" versus "3-7 GB and comfortably fits 40k." Second, this compares two *code states* (my older JAX pin against today's chunked PyTorch main), not JAX-vs-PyTorch as languages.

With those caveats stated, the practical result is real and it is large: on a single 24 GB card the updated PyTorch backend **fits roughly twice the context and runs 2-4x faster at scale.** My original "distrust flat numbers" finding still stands for the JAX backend - but the maintainers' chunking work is exactly the fix that flattens the memory wall for good. That is the best possible outcome for a reproduction to surface: not just a verdict on the old state, but a measured confirmation that the new state is better.

---

## The bug hunt, and the fix that got merged

Reproducing a model end-to-end means running it in configurations the authors may not have. On the dual-4090 workstation, the very first `predict` call crashed:

```
IndivisibleError: array axis 0 is partitioned 2 times,
but the dimension size is 1
```

I traced it. With more than one GPU visible and no user-configured device mesh, `predict` defaults to a batch of size 1. The JAX forward path correctly derives a "no sharding" plan for that case - but then, on first compile, it **unconditionally rebuilds the data sharding over every visible device**, discarding the plan it just made. A batch of size 1 gets forced into a 2-way shard, and JAX refuses. A sibling bug (with a divisible batch, the model weights sit on device 0 while inputs are scattered across all devices) has the same root cause.

The net effect: **TabFM's `predict` does not work through the public API on any multi-GPU host** unless you pin a single device. The advertised auto-sharding was broken at that commit.

Two things made this a clean contribution instead of a bug report:

1. **I reproduced it without a GPU.** JAX's `--xla_force_host_platform_device_count=2` simulates multiple devices on CPU, which triggers the exact same crash. That let me build a **regression test that runs in CI with no GPU at all** - the kind of test a maintainer actually wants.
2. **I verified against current `main`, not my pinned commit.** A separate bug I found (`predict` returning an object-dtype array that breaks sklearn metrics) turned out to already be fixed upstream. Checking first saved me from filing a stale duplicate.

The fix itself is small: remove the buggy override so the forward path uses the sharding it already correctly derived. Replicated when there is no mesh, properly sharded when the user configures one. I verified the full red-to-green cycle on simulated devices, confirmed all 36 existing tests still passed, and checked that the single-device path (the common case) was untouched.

The pull request was **merged into `google-research/tabfm`, approved by one of TabFM's own authors.**

That is the outcome I care about most. A careful reproduction is not about passing a verdict on someone else's work. Trying to break a system is the deepest way to understand it, and the best thing you can leave behind is a patch that makes the tool better for the next person who uses it.

---

## What I actually learned

- **Always compare on matched folds.** The single biggest source of misleading benchmarks is quietly dropping the folds where your method struggles.
- **Measure your own noise before claiming a win.** A +0.001 margin is a rounding error until you have shown your run-to-run spread is smaller than it. Sometimes the honest answer is "tie."
- **Distrust flat numbers.** A metric that does not move across a 100x change in input is usually measuring the harness, not the model. The flat 22.75 GB was half real, half allocator.
- **Reproduce configurations the authors might not have.** The multi-GPU crash only shows up on a multi-GPU box. That is exactly what independent reproduction is for.
- **Fix your harness before you blame the model.** Most of my "the model is broken" moments were my measurement being broken.
- **Build the kill-switch before you probe the limits.** One restarted laptop is a good teacher.

---

## Honest limitations

No evaluation is complete, and I would rather list the gaps than pretend there are none:

- **9 of 13 target datasets are fully scored.** Bioresponse (1,777 features) is a genuine TabFM failure on high-dimensional data. SDSS17 (78k rows) and GiveMeSomeCredit (150k rows) were impractically slow to finish - reported as findings, not hidden.
- **The seed study varies the model seed on fixed folds**, not the data resample, and TabPFN's own variance is unmeasured (the network hang).
- **This is a subset of TabArena on which TabFM was always most likely to shine** - small-to-mid tables. It is not the full 51-task suite.

---

## Reproduce it yourself

Everything is seeded (`SEED=0`), pinned to commit `b6ea70b`, and every per-run result JSON is committed to the repo. The harness runs per-dataset from the command line; the three-machine orchestration is documented but not required.

**Repository: [github.com/devYRPauli/tabfm-evaluation](https://github.com/devYRPauli/tabfm-evaluation)**

---

### Credits

TabFM is by Google Research (Weihao Kong and Abhimanyu Das, introduced 2026-06-30). The benchmark is TabArena (OpenML Study 457) by the TabArena team. Baselines include TabPFN by Prior Labs, XGBoost, and scikit-learn. This was an independent third-party evaluation; all credit for the model belongs to its authors.
