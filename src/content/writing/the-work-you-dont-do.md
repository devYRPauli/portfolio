---
title: "The Work You Don't Do: Losing Two Optimization Competitions the Same Way"
description: I published a post-mortem naming the exact question I failed to ask, then entered another competition the same day and failed to ask it again. What actually wins these competitions, and why I keep missing it.
pubDate: 2026-08-14
tags:
  - performance
  - measurement
  - agents
---

## TL;DR

On August 5 I published a post-mortem of [mlx.fast](/writing/eight-submissions-zero-promotions), an optimization competition I lost. It contained this sentence about the week's biggest single gain:

> They asked which timing window was being billed for that compile, and I did not. That question was the whole optimization.

The same day, I cloned the repository for the next competition in the series. It is the Lighter Prover Challenge, a zero-knowledge proving benchmark. Nine days later I had one rejected submission, five measured dead ends, and no promotions. The frontier went from 3.36 to 30.74 without me.

The lever that won it moves circuit construction out of the timed process and into the untimed build job. I measured that construction at 11.24 seconds. I named it the second largest cost in my own profile. Then I spent an agent's time making it 2 seconds faster instead of asking which window was being billed for it.

- **Two competitions, zero promotions.** Both were won by people who removed work or moved it outside the measured window. Both times I tried to make the same work faster.
- **My local numbers pointed the wrong way.** My submission measured +17.8 percent locally and priced at -10.3 percent on the ranked machine. The evidence that would have predicted that was already in my data.
- **I found a real correctness trap that the public test fixture cannot expose.** The ranked run confirmed my fix was right. It was the best thing I did all week and it was worth nothing on the leaderboard.
- **Five optimizations, all measured with interleaved repeats, all negative.** One was 52 percent slower and taught me the most.

---

## The setup

The [Lighter Prover Challenge](https://github.com/Layr-Labs/lighter-prover-challenge) is run by EigenLabs on the same platform as mlx.fast. You optimize a Plonky2 prover for a DEX state-transition circuit. Score is verified proving throughput in transactions per second. A trusted, code-signed verifier owns the clock. It runs your worker in a macOS sandbox, checks the final recursive proof, and writes the score. You may edit the circuit crate, the bench crate, and a vendored copy of Plonky2. The rest of the harness is protected.

Two details shaped the whole week.

Ranked scoring runs on a private fixture on an Apple M4 Pro with 48 GB. My machine is an M4 Max with 64 GB and a much larger GPU. Once again I was not measuring on the machine that scores me.

The second detail matters more. The only fixture I can run locally contains **zero active transactions**. It is 500 empty padding transactions. The ranked fixtures contain 500 real ones.

---

## A correctness trap the local fixture cannot show

Two other solvers had submissions in flight that proved the 52 per-chunk transaction proofs in parallel. I read their diffs. Both did the same thing. They pinned every chunk's `old_jump` field to the initial value and threw away the real one.

That only works if a piece of accumulator state never advances. In the circuit, a transaction counts as padding exactly when its type is zero. The accumulator advances only on active transactions. So on the public fixture the state never moves and the shortcut is correct. On the ranked fixture every transaction is active, the state moves on every one, and the chain-folding circuit constrains the link:

```rust
JumpStateTarget::connect(&mut circuit.builder, &block.jump, &current_tx.old_jump);
```

Their approach passes every local run and fails on the ranked machine.

So I built the correct version. It is a native, out-of-circuit implementation of the state transition, so every chunk gets its true value and all 52 proofs become independent. The public fixture cannot exercise it, so I validated it two ways. I wrote a randomized equivalence test against a real circuit built around the in-circuit function. I also added a runtime assertion comparing my computed value against the proof's public input.

The ranked run confirmed it. My submission returned a real score over 2,500 active transactions. Every proof verified and the assertion never fired. The part I could not test locally was right.

It was also irrelevant. Another solver reached the same problem later and solved it better. They split witness generation from proving and read the value straight out of the generated witness. The circuit's own generators produce it, so there is no second implementation to keep in sync and no transcription risk. My equivalence test existed to defend a design choice that a better design does not need.

---

## The local number pointed the wrong way

My parallel prover measured **+17.8 percent** locally. The ranked machine priced it at **-10.3 percent** against the same baseline it was built on.

I could have predicted that. Two numbers were sitting in my own profile.

The first was `user 1351s / real 116s`. That is about 11.6x parallelism across 16 cores. The CPU was already close to saturated before I added anything.

The second was a concurrency sweep of 4, 6, and 8 in-flight proofs. It came back flat: 79.3, 79.9, and 80.0 seconds.

I read that flat sweep as "4 is safely at the plateau, and it uses the least memory." It actually meant there was no headroom at all. Adding CPU concurrency to a saturated machine buys nothing locally. On a ranked host with fewer cores it costs contention, so the sign flips.

Another solver's GPU work went the other way in the same period. It measured +18.3 percent locally and priced at **+25.8 percent** on ranked. Moving work off the CPU frees the resource that is scarcer on the smaller machine. Scheduling more work onto the CPU does the opposite.

That gave me a rule I used for the rest of the week. Before spending a submission, I have to explain why a gain survives on a machine with fewer cores, not just show a local delta. The rule stopped three more bad submissions. It arrived one submission too late.

---

## Five dead ends, priced

After the rejection I stopped guessing and started pricing. Every number below is a mean of interleaved repeated rounds. Run-to-run noise on GPU-heavy builds is about 3 percent, so a single sample proves nothing.

| Change | Result |
|---|---|
| Lower the GPU Merkle threshold | 0.14 percent spread, inside noise |
| Widen the GPU buffer pool to 2 or 4 sets | 2 to 5 percent slower |
| NEON instruction scheduling in Poseidon2 | 0.35 percent slower, n=8 |
| Non-blocking GPU acquire with CPU fallback | **52 percent slower** |
| Opportunistic GPU batching | 8 percent slower |

The 52 percent one taught me the most. The GPU path allowed one user at a time. With about 25 proving threads, threads that wanted the GPU slept on a condition variable. My profile showed 17,000 samples of idle waiting. That looked like obvious waste. My fix was to let a thread that cannot get the GPU build its tree on the CPU instead.

The waiting is not waste. The GPU is so much faster for the large trees that qualify that waiting for it beats doing them on the CPU by a wide margin. I had built a story about the mechanism and the machine disagreed with me by 20 seconds.

Those five results have a shape. Widening GPU concurrency hurt. Declining GPU work hurt. Batching GPU work hurt. The GPU was compute-bound, which closes the whole offload direction. I should have worked that out after the second result, not the fifth.

---

## What actually won

At the end I went and read the winning tree, which is what I should have done at the start.

The top lever is a build script. Its own doc comment says it plainly:

> Compilation runs in the benchmark's untimed CI job, so the multi-second circuit construction here is free; the scored worker process then loads the blobs in a fraction of the build time.

The winners build the five proving circuits at **compile time**, serialize them, and embed the bytes in the binary with `include_bytes!`. The scored process deserializes instead of constructing. The same idea shows up twice more in that tree. There is a precompiled Metal shader library, so no shader compilation happens at runtime. There are precomputed dummy recursion proofs committed as binary blobs.

The second winning family is a packed field type for Apple silicon. I had ruled this out early. My reasoning was that NEON has no 64-by-64-to-128 widening multiply, while a scalar multiply plus high-multiply pair already produces one in two instructions. So a vectorized version has to lose.

Their comment shows what I got wrong:

> Multiplication interleaves both lanes in one assembly block to hide the latency of AArch64's scalar `mul` and `umulh` instructions.

They do not vectorize the multiply at all. They interleave *scalar* instructions in one assembly block to expose instruction-level parallelism. Then they wrap it in the field abstraction so it reaches the existing packed constraint-evaluation paths, which were the second largest cost in my own profile. I asked whether the instruction set could do the multiply in parallel. The useful question was whether the abstraction could expose parallelism and reach the code that matters.

My own NEON attempt used that same technique. I applied it to one layer of one hash function instead of the field type that feeds everything, and measured it at 0.35 percent slower.

---

## Where I had the answer and did not use it

Early in the week I added timing instrumentation and produced a stage breakdown of a 116.56 second run. Circuit construction came in at **11.24 seconds, 9.6 percent, the second largest line item.**

I had also read the benchmark documentation. It describes the ranked workflow in detail, including a first job that builds the candidate and a second, separate job that runs the timed benchmark. I had quoted parts of that document back to myself while reasoning about the sandbox.

Then I wrote a task brief to parallelize circuit construction across its dependency graph. It worked. It took 11.24 seconds down to 9.17. That is a 2 second gain on a line item that could have gone to zero.

At 116 seconds the work was under 10 percent of the run. As the frontier sped up and runs fell toward 30 seconds, the same fixed cost became roughly a third of the score. I made the work cheaper instead of asking whether the clock should have been running during it. I did that nine days after publishing a post-mortem whose main lesson was that exact question.

---

## Why I keep missing this

It would be easy to call this carelessness. I do not think that is what it is. The failure was the same in two competitions with different domains and a published lesson in between.

A profiler answers the question "where is the time going." That question quietly assumes the time should be going somewhere. Every tool in the performance toolchain is built to make work cheaper. None of them ask whether the work belongs inside the measured region, or whether the output needs it at all. You have to ask that yourself, before you open the profiler. Afterwards the profiler's framing is already in your head.

The two winning classes in these competitions are the two the toolchain cannot suggest.

The first is moving work out of the measured window. Precompute it, embed it, or hoist it into warmup.

The second is proving you do not need the work. In mlx.fast, the durable frontier came from a bounded pass that proves which vocabulary rows can contain the answer, then evaluates only those. The output is provably identical, so the format of everything else stops mattering.

Both come from asking what the scoring actually requires.

---

## Delegating the work, and verifying it

I ran this the way I run most substantial work now. I orchestrate, write task briefs, and delegate implementation to a coding agent, then verify the result. Two things happened that are worth reporting.

The agent reported a set of GPU correctness tests as passing. They had never run. The sandbox it worked in exposed no Metal device, and those tests fail closed with "no Metal device." The raw log said so honestly while the summary said the suite passed. I only caught it because I re-ran everything on the machine with the GPU. Three of five passed there and two failed for an unrelated reason.

The second one was better. A later change built cleanly, passed every test I could run, and produced a byte-correct 196,008 byte proof. It also aborted the process at exit. A metrics hook was running after thread-local storage had been destroyed and calling `std::thread::current()`, which panics in a context that cannot unwind. The proof was already written, so any check that only looked at the output would have called it a success. I found it because I ran the binary directly and looked at the exit status.

Neither of these is the agent being careless. They are the same class of problem as the rest of this post. A delegated task gets verified against the checks you specify. My checks did not include "the process exits cleanly" or "the GPU tests actually ran on a GPU." So I write acceptance conditions that cannot be satisfied by skipping, and I re-run the verification myself on hardware that can actually perform it.

---

## What I actually learned

- **Map the timer before you profile.** Write down which process is timed, from which instant to which instant, and what runs in an untimed build or warmup phase. Anything expensive inside the window that could live outside it is the first thing to look at, before any algorithmic work.
- **Map the output requirement too.** Separate what must be bit-identical from what only has to be provably equivalent. You cannot see the "prove you do not need the work" class until you do.
- **A flat sweep means saturation, not safety.** Three configurations tying is evidence that there is no headroom. I read it as evidence that the middle one was a safe choice.
- **Two well-reasoned negatives in a row means go back and re-read the problem statement.** I ran five. The answer was in the documentation the whole time.
- **Prefer changes that reduce work over changes that reschedule it.** Rescheduling wins are the ones that flip sign between machines.
- **Latency is a real cost in a race.** Two of my implementations were finished and correct, and someone else shipped the same idea while mine sat in the validation queue. With a one-hour queue and one submission in flight at a time, second place scores zero.
- **Write acceptance conditions that cannot be satisfied by skipping.** "Tests pass" is not one of them when the tests can skip.

---

## Where this stands

Zero promotions again. This time the field took the prover more than nine times faster while I measured.

What I have instead is a ledger. Five priced dead ends, a correctness trap confirmed on ranked hardware, a transfer rule that held in both competitions, and a written playbook that starts by mapping the timer instead of opening a profiler. The mlx.fast post ended by saying I came away with a working process instead of one built mid-race. That was true. The process I built was still aimed at the wrong question.

I would enter a third one. I would spend the first half day reading the scoring harness and writing down what it bills for, and I would not open a profiler until that document existed. Everything in this post that mattered was decided before any code was written, and that is exactly where I was not looking.

---

### Credits

The [Lighter Prover Challenge](https://github.com/Layr-Labs/lighter-prover-challenge) is run by [EigenLabs](https://www.eigenlabs.org), on the same platform as mlx.fast, with the prover and circuits from Elliot Technologies' Lighter. The techniques in "What actually won" come from public promoted submissions by solvers including i34-9, jungjipdo, Gajesh2007, exakoss, mega-dmitriy, AlexLaevski, saucegodbased, zeeshan8281, and ryanp7272. The open-notes and public-diff format is what makes this kind of analysis possible. Orchestration ran through Claude Code, with implementation delegated to GPT-5.6 models working from written briefs, and every result re-verified on my measurement machine.
