---
title: "Eight Submissions, Zero Promotions: A Week Inside mlx.fast on the Wrong Hardware"
description: What I learned competing in an open ML-optimization competition where the ranked machine was an M5 Max and mine was not - the oracle I found, the levers I priced dead, and why measurement bandwidth decided everything
pubDate: 2026-08-05
updatedDate: 2026-08-14
tags:
  - performance
  - measurement
---

## TL;DR

[mlx.fast](https://mlx.fast/) is an open autoresearch competition: make a 21.6 GB mixture-of-experts model decode faster on Apple silicon without changing a single output token. Score is `decode_speedup^0.75 * prefill_speedup^0.25`, judged on an M5 Max. My dev machine was an M4 Max, which cannot execute the M5-only kernel family that dominates the score.

I competed for a week. The results:

- **Eight submissions, zero promotions.** Three failed on my own avoidable mistakes, the rest were priced negative or killed by an infrastructure lottery. The frontier moved from 1.84 to 2.55 while I watched.
- I found that the field-wide belief that non-M5 machines "diverge from the golden traces because of silicon" was wrong. **The divergence is one shipped fusion kernel.** Ablate one flag and my M4 matched the M5 golden on all 130 checked steps. Every solver without an M5 had been verifying blind for no reason.
- I built a ledger of what transfers between Apple silicon generations and what does not. Local timing did not just fail to predict ranked results - **it pointed the wrong way on five separate occasions**, for me and for competitors with better hardware than mine.
- The competition was decided by measurement bandwidth. The leaders priced 3-5 candidates a day against the ranked machine. I priced about one a day against an instrument that lied.

Everything below is from the public record: submission ids, public run logs, and published solver notes. The full appendix - the oracle recipe, the transfer ledger, the dead-lever list, and the verification protocol - is in [this gist](https://gist.github.com/devYRPauli/61279a20fd5f8378af1b0c856569621c).

---

## How this started

Phil from EigenLabs emailed me an early invite based on my mlx contributions. The pitch: a live leaderboard, every promoted optimization becomes the new baseline, all submission notes are public so the field builds on each other's work. The previous competition in the series had 100+ people beating an unpublished Google quantum circuit in 72 hours.

The target model is Laguna XS 2.1, a 40-layer MoE with 256 routed experts per layer, quantized to NVFP4. Submissions run a gauntlet: an LLM reviews your diff for benchmark bypasses, a behavior gate replays a teacher-forced trace and requires token-exact output against a golden generated on the ranked M5 Max, and then a paired timing run prices you against the current baseline. Anything that changes even one token fails.

I had a Mac Studio with an M4 Max. That mattered more than I understood at the start.

---

## The first thing I hit: my machine could not reproduce the answers

Out of the box, the public correctness trace failed on my machine at step 0: expected token 5991, actual 8550. Other solvers' notes reported the same on M3 Ultra and M1 Max. The accepted explanation was silicon divergence - different Apple GPU generations round differently, so only the M5 can verify correctness, and everyone else ships on faith.

I did not want to ship on faith, so I bisected the shipped optimization flags instead. The divergence came down to a single JIT-compiled prefill fusion kernel. With that one flag ablated, my M4 matched the M5 golden on all 130 checked steps, bit for bit.

That gave me a real verification instrument on hardware that supposedly could not have one, and it is the finding from this week that other solvers actually adopted. The lesson is the same one I keep re-learning: a difference everyone attributes to the platform is worth one afternoon of bisection before you believe it.

---

## My first three submissions, and what they cost me

I want to report these plainly because they were all avoidable.

**Submission 1** re-quantized a weight window. The rules document said, in a section I had not read carefully enough, that the quantization envelope was frozen - even if the output stays correct. The reviewer rejected it and quoted my own code comment back to me as evidence. One grep would have prevented it.

**Submission 2** changed GEMM tile geometry. Before submitting, I ran an adversarial review, and the reviewer warned that my bit-exactness argument did not cover the split-K path on the M5's kernel family. I recorded the objection as a caveat and submitted anyway. The behavior gate failed exactly there: expected 5991, actual 31807. A flagged unverified correctness precondition is not a caveat. It is a blocker. This rule is now written down where I cannot miss it.

**Submission 3** was correctly narrowed and passed every gate. The ranked machine priced it at -2.05 percent. A clean, honest negative.

After that, my process got strict: read the policy first, classify every change by whether my hardware can actually verify it, run two independent adversarial reviews before submitting, and treat any unresolved objection as a stop. My next five submissions all passed the static review and the behavior gate. None of the failures that followed were process failures. They were something else.

---

## The telemetry wall

At the frontier's speed, the benchmark's telemetry-validity gate sampled GPU state every 100 ms and required at least five valid samples. A fast candidate finishes its measured window in about one second, which yields exactly four. The result: roughly 90 percent of all submissions field-wide were rejected with no information about the payload at all. In one 24-hour stretch I audited, 24 of 26 classified failures were this single failure mode, across ten different solvers.

Four of my submissions died there, each one having already passed every correctness gate. The only available response was resubmitting the identical payload as a fresh draw. A competitor had a tested one-line fix ready (halve the sampling interval), but repository permissions blocked the pull request, so the whole field kept rolling dice. I emailed the operator about it. The fix had not landed by the time I stopped.

---

## What local measurement is actually worth across silicon generations

This is the table I wish I had on day one. Every row is an officially priced result from the ranked M5, compared against careful local measurement - mine or a competitor's published numbers:

| Change | Local evidence | Ranked M5 pricing |
|---|---|---|
| My fused-QKV change | +2.97 percent prefill, 4/4 paired runs | -1.64 percent |
| My expert-scheduling change (EG256) | promotion-capable diagnostics on the prior tree | -1.14 percent |
| Competitor's KV-cache write fusion | 17/17 local paired wins | -18.9 percent |
| Competitor's paired self-validation | +0.58 percent claimed | -1.62 percent |
| Competitor's dequant instruction cut | +8.9 percent at kernel level on M1 Max | -0.69 percent |

The pattern that emerged from the field's collective pricing: instruction-count cuts and byte cuts transfer between silicon generations. Dispatch-count cuts and anything whose benefit depends on scheduling context do not. The M5's memory system behaves differently enough that a fusion which wins on every other machine can lose by 19 percent there.

There was a second, subtler version of the problem. The frontier moved 4-8 times a day, and each promotion changed the tree your change lands in. I watched one four-line scheduling change get promoted, then priced at -1.14 percent two promotions later, then effectively promoted again in a different tree context. My own held patches flipped sign across trees three times. A pricing is not a property of a change. It is a property of a change in a tree, and the tree does not sit still.

---

## The one that stung

My best submission was a de-confounding find. A concatenated QKV weight bank had shipped disabled for weeks, justified by an old ablation showing "a mild prefill cost with no decode gain." Reading the code showed the ablation was confounded: enabling the bank silently kicked decode off its fast path, so the historical A/B compared the bank's prefill win bundled with an unrelated decode loss. Scoped per-phase, the change measured +2.97 percent prefill locally with all four paired runs agreeing.

It passed the static review. It passed the token-exact behavior gate on the M5. Two independent adversarial reviews found no blocker, and the split-K trap from submission 2 was provably absent - both reviewers traced the dispatch arithmetic to the exact strict inequality.

The ranked machine priced it at -1.64 percent.

The mechanism argument was fine. The correctness argument was fine. The performance model was an M4 model, and the M5 is not an M4. By then I had also watched my local signal for this change decay from -2.97 percent to -0.4 percent as two competitor promotions landed around it, which was the warning I chose to submit through anyway. An official pricing has value even when it is negative, and I published mine. But that one was the week's ceiling, and it was below zero.

---

## Killing ideas cheaply

The second half of the week went better than the first, not in score but in cost per dead end. Three examples:

- **Software-pipelining the quantized matrix-vector kernels.** A competitor had landed exactly this pattern on the attention kernel for +6-9 percent at kernel level. I applied it to the adjacent unmined kernel family. A timed microbenchmark at all nine real shapes came back flat to negative - that kernel's weight stream already saturates memory bandwidth, so there was no latency to hide. The idea died in one evening, before submission, because I measured at the right granularity.
- **llama.cpp-style weight repacking.** A read-only audit of the actual per-lane access pattern showed the shipped layout is already contiguous at the SIMD load level. The repack would reorder without reducing transactions. That one died in an afternoon of reading, with zero code written.
- **A Cauchy-Schwarz pre-filter for the vocabulary projection.** The frontier's winning structure proves which of 100,352 vocab rows can contain the argmax and exact-evaluates only those (median retained set: 13 rows). My idea was a level-zero bound to skip reading most rows entirely. An empirical harness on 128 real decode steps returned a pruning rate of exactly zero: in 2048 dimensions the norm-product bound sat 25-80 percent above the real logits on every step. High-dimensional bounds are looser than intuition says. That one died in 22 minutes of compute.

None of these produced a submission. All of them produced a number, and the numbers are in my public notes so nobody has to re-run them.

---

## What actually won, while I was doing all this

The week's biggest single gain (+3.14 percent) was not a kernel at all. A solver profiled the measured window and noticed a 16.7 ms one-time pipeline compile being charged inside a 210 ms prefill window, and moved it into warmup. I had observed the same mechanic two days earlier in my own logs and filed it as measurement contamination. They asked which timing window was being billed for that compile, and I did not. That question was the whole optimization.

The most durable gains came from certified work elimination on the vocabulary projection - closed-form bounds proving the answer cannot change, then deleting the work the bound makes unnecessary. The solvers who own that structure iterated its format three times in the week (2112 to 1600 to 1344 bytes per row), each step verified by exhaustive bit-comparison and priced on ranked hardware within a day.

And one competitor took +2.19 percent by doing archaeology: the promotion race moves so fast that promotions kept silently reverting each other's validated work, and they diffed the tree, found the wreckage, and restored it. I ran the same sweep twice later in the week. Both times the tree came back clean, which is its own lesson - by then, everyone had learned to scan.

---

## What I actually learned

- **Bisect before you believe a platform explanation.** The "silicon divergence" was one kernel. The whole field had worked around it instead of finding it.
- **A flagged unverified correctness precondition is a blocker, not a caveat.** My only behavior-gate failure came from ignoring my own reviewer.
- **Classify every change by whether your hardware can verify it, before you build it.** I eventually kept a table: custom kernels yes, host-side code yes, M5-only kernel paths no. Work in the last column is guessing.
- **Measure at the granularity where the effect lives.** End-to-end timing hid a kernel-level null; a microbenchmark exposed it in minutes.
- **Pricings expire.** Re-verify every held patch after every upstream change. Mine flipped sign three times in five days.
- **Publish negative results, but understand what you are giving away.** I published a pricing plus the mechanism hypothesis behind it, and a competitor executed the obvious composite from my own synthesis within hours, for a promotion. Raw data helps the field; synthesis is a move you hand to whoever is fastest.
- **Measurement bandwidth beats idea quality.** I independently found several mechanisms that later won for others. Finding them was never the bottleneck. Pricing them was.

---

## Where this stands

The competition is open-ended and the frontier is still moving. I have paused rather than quit: my verification tooling, the shelved patches, and the full ledger are ready if a pricing channel opens up for solvers without ranked hardware - I have asked the operators for exactly that. If the platform resets or migrates models, the early cheap optimizations reappear, and this time I would be starting with a working process instead of building one mid-race.

Zero promotions is the honest headline. But I came out with a correctness oracle the field uses, a transfer ledger I have not seen anyone else write down, and a much sharper sense of what independent verification is worth when you are the one without the reference machine. I have been on the other side of this - my TabFM evaluation was exactly the reference-machine role - and it is useful to have now felt both sides of that asymmetry.

---

## Update, August 14

My last submission here was July 31. The mlx.fast frontier has since reached 2.62.

I cloned the repository for the next competition in the same series on the day this post went up, and I lost that one the same way. The lever that won it moves work out of the timed window, which is the question this post ends by saying I did not ask. That write-up is [The Work You Don't Do](/writing/the-work-you-dont-do).

That post also carries something this one does not. I went back and read the winning submission notes properly, and most of what is in them is ordinary performance craft rather than anything competition-specific: why multiply count is the wrong cost model, why SIMD is usually the wrong tool for 64-bit integer math on AArch64, how to structure GPU offload so it can fail safely, and how to build a differential mode once and verify every later optimization cheaply. Reading the winners' notes was worth more than the week I spent generating my own candidates.

---

### Credits

[mlx.fast](https://mlx.fast/) is run by [EigenLabs](https://www.eigenlabs.org) (thanks to Phil Burgess for the early invite); the public challenge repo is [Layr-Labs/mlxfast-challenge](https://github.com/Layr-Labs/mlxfast-challenge). The findings above build on public submission notes from solvers including lBroth, zuiris, a-github-name, GumbiiDigital, EternaPeptix, AdeliyaLeleytner, ivanfioravanti, davidtai, and yoyo930021 - the open-notes format is what made this kind of analysis possible at all. Orchestration for my experiments ran through Claude Code, with implementation and review passes split across Claude and GPT-5.6 models working from independent briefs.
