---
title: Same Weights, Same Prompt, Opposite Results - Why Local Tool Calling Breaks
description: I built willitcall, a conformance suite and public matrix for tool calling on local models. The findings that survived replication, the ones that did not, and the bug report I had to retract.
pubDate: 2026-07-21
tags:
  - local-llms
  - tool-calling
  - evals
  - reproducibility
---

## TL;DR

Tool calling is the load-bearing capability of the agent era, and on local
stacks it breaks silently: the same model, at the same quantization, with the
same prompt, can execute tool calls perfectly on one inference server and fail
completely on another. I built [willitcall](https://github.com/devYRPauli/willitcall)
to measure this: a Rust CLI that runs 50 tool-calling scenarios against any
OpenAI-compatible endpoint, and a
[public red/green matrix](https://devyrpauli.github.io/willitcall/) of
model x quant x server results where every red cell links to the full
request/response transcript that produced it.

Three findings survived replication, and one of my own headline claims did not:

1. **The servers do not decode the same way, and this explains most cross-server
   deltas.** llama.cpp compiles your tool definitions into a grammar and
   constrains decoding with it - a call naming a function you never supplied
   cannot be sampled. Ollama and mlx-lm generate unconstrained text and parse a
   tool call out of it afterwards. Same weights, opposite results, and it is a
   property of the stack, not the model.
2. **Quantization level does not order tool-calling ability** on this corpus.
   The folklore that lower quants degrade tool calling did not show up: across
   Q8_0, Q4_K_M, and Q3_K_M, seed-varied replication puts the arms within noise
   of each other. What CAN destroy a row outright is a bad conversion artifact,
   which is a different thing than a dose-response effect.
3. **There is a failure mode nobody's vocabulary covered:** a model that emits
   correct, well-formed tool calls in a format that no server parses. Those
   cells look identical to "this model cannot call tools", and that is false.

And the retraction: I filed an issue against Ollama claiming it discarded a
valid tool call. A maintainer pushed back, I recovered the actual discarded
bytes, and the model had emitted the tool's *description* where its *name*
belonged. Ollama's parser was right; my inference was wrong. I retracted the
claim publicly, and the investigation that followed produced finding number 1,
which is worth more than the bug report ever was.

## The problem

Every local inference stack claims OpenAI-compatible function calling. In
practice, support varies by model, by quantization, by chat template, and by
server, and the failures are silent. Your agent does not crash; it just never
calls the tool, or calls it with mangled arguments, and you spend an afternoon
debugging your prompt when the problem is three layers down.

Existing benchmarks did not cover this. BFCL and its descendants measure fp16
API models - a different axis entirely. What I wanted was caniuse.com for local
tool calling: pick a model, a quant, and a server, and see whether that exact
combination executes tool calls, with the evidence one click away.

So the unit of measurement in willitcall is the *combination*. A cell is a
property of the whole stack. That framing sounded like a hedge when I wrote it
into the spec. It turned out to be the main finding.

## What I built

The CLI runs a corpus of 50 scenarios in six categories: single calls across
argument shapes, parallel calls, streaming (SSE delta reassembly), tool_choice
modes, multi-turn (a tool result is fed back and the follow-up call must use a
value that only exists in that result), and negative traps - cases where the
correct behavior is to NOT call a tool. Scoring is deterministic; there is no
LLM judge, because a published failure reason has to be defensible.

Two design rules did the most work:

**A scenario that a fully correct model could fail is a bug in the scenario.**
A false red is worse than a missing test - if the matrix says a model fails and
it does not, no other cell is trustworthy. This rule caught real bugs during
development: one scenario expected the ASCII spelling of an Icelandic city when
a correct model writes it with a diacritic. Every scenario now carries a
rationale field explaining why no correct model can fail it for a reason other
than the one it tests.

**Every red cell must carry its evidence.** Result files ship full
request/response transcripts (auth-redacted, hash-verified). This rule is why
the retraction below was possible at all, and why the project survived it.

## The bug report I had to retract

Early seeding produced a striking result: a scenario where Qwen2.5-7B, served
through llama.cpp, emitted a correct tool call six times out of six - and the
same weights through Ollama returned an empty response ten times out of ten,
while still billing about 40 completion tokens. Tokens were generated and
nothing came back. I read that as Ollama's parser discarding a well-formed
call, wrote it up, and filed it upstream.

A maintainer pushed back, and they were right to. When I recovered the actual
discarded bytes (using a rebuild with a then-open logging PR), the model had
emitted the tool's *description* string in the `name` field. Not a valid call.
Ollama's parser had correctly rejected garbage; my claim was built on an
inference from the token count, not on the tokens themselves. I retitled the
issue, retracted the claim in the thread with credit to the person who
challenged it, and rewrote the case study to carry the correction.

Here is the part that mattered: if the model emitted a wrong name through
Ollama, why did the same weights emit the right name through llama.cpp, every
time?

Because llama.cpp does not give the model the chance to be wrong. It compiles
the tool definitions from your request into a GBNF grammar and constrains
decoding with it - lazily, engaging when the model starts a tool call. Under
that grammar, a function name you did not supply is not merely unlikely; it
cannot be sampled. Ollama generates unconstrained text and parses afterwards.
mlx-lm sits on the unconstrained side too (verified by reading the source:
tools reach the chat template only, there is no grammar machinery, and parse
failures are swallowed).

That is the mechanism behind the whole matrix. It favours llama.cpp
systematically, in every row, for every model. A llama.cpp-versus-Ollama delta
is not evidence that Ollama is defective or that a model is worse than
another - it is what constrained versus unconstrained decoding looks like in
a table.
The comparison that isolates the model is same-server, never cross-server. The
site now discloses this above the matrix, because without it, every reader
would misread the reds the same way I did.

The lesson generalizes past this project: **an empty response is
unattributable without the raw tokens.** Symptom-level inference - "tokens
were billed, nothing returned, therefore the server ate a valid call" - feels
rigorous and is not. Get the bytes.

## Quantization does not order tool-calling ability (and how I almost published the opposite)

The folklore says aggressive quantization degrades tool-call formatting. I
measured three models across Q8_0, Q4_K_M, and Q3_K_M on llama.cpp and the
first pass said something spicier: two of three models scored *highest* at the
lowest quant. A contrarian headline, at n=1 per arm.

Project rule: no verdict below five runs per arm. So I re-ran every arm five
times, and got the same numbers. Exactly the same numbers. Identical scores,
identical failing scenario ids, forty-five runs reproducing byte-for-byte -
which looked like the strongest replication imaginable and was actually the
weakest: the runs were greedy (temperature 0, fixed seed), so all five
"replications" were the same computation. n=5 of the same coin flip is n=1.

Replication that means anything has to vary what should not matter. Under five
seeds at temperature 0.7, the Qwen2.5-7B arms landed at 46.8, 45.4, and 46.4
of 50 - fully overlapping, nothing monotonic (the 1.5B model puts Q4_K_M
*below* Q3_K_M). The contrarian finding died. What survived is narrower and
better: on this corpus, these models, this server, quantization level simply
does not predict tool-calling ability, in either direction.

One result looks like a contradiction and is not: on mlx-lm, the 8bit
community conversion of Qwen2.5-7B scores 7/50 while the 4bit scores 46/50.
Before writing that up as a quant effect I recovered the raw generation
again - and the 8bit conversion emits doubled braces in its tool calls:

```
8bit:  <tool_call> {{"name": "get_weather", "arguments": {"city": "Boston"}}}
4bit:  <tool_call> {"name": "get_weather", "arguments": {"city": "Boston"}}
```

That is not parseable JSON, and mlx-lm is right to reject it. The model still
knows exactly which function to call with which arguments - the recovered
string is semantically perfect. This is a broken published artifact, not
gradual degradation, and it cannot be extrapolated to "8bit is worse than
4bit". The distinction matters: quantization as a dose does nothing here;
one specific conversion is simply defective.

## The failure taxonomy nobody had words for

Scoring thousands of transcripts forces vocabulary. The matrix now
distinguishes, mechanically, per response:

- **error** - the server refused or crashed. Ollama returns HTTP 400 for any
  gemma3 request carrying tools. llama.cpp returns HTTP 500 on 7-9 of 50
  scenarios for Llama-3.1-8B ("does not match the expected peg-native
  format") - replicated across two llama.cpp builds, so those rows are
  excluded from conclusions rather than counted as model failures.
- **empty_response** - no content, no tool call. Unattributable without raw
  tokens; see above. Both Ollama and mlx-lm return HTTP 200 with
  `finish_reason: "tool_calls"` and an empty message when their parser rejects
  what the model emitted - the client is told a call happened and handed
  nothing. From the API alone this is indistinguishable from the model saying
  nothing at all, which is exactly why the recovery step exists.
- **unparsed_tool_call** - the one that needed inventing. granite3.1-dense:8b
  emits well-formed calls, right function, valid arguments, in its own
  `<tool_call>[...]` format - and scores 7/50 on Ollama AND 7/50 on llama.cpp
  fed the identical blob, because nothing parses that format into tool_calls.
  Ten runs, zero variance. The 7 passes are precisely the negative traps,
  where emitting no parsed call is correct - a model doing everything right
  and scoring near zero. Without this class, those cells read as "granite
  cannot call tools", which is false. It is neither a model failure nor a
  server defect: it is an ecosystem format mismatch, a third fault domain.

Each class is assigned conservatively - crediting a model with a call it never
made is worse than leaving a cell unexplained - and the full precedence rules
live in the schema docs.

## What measuring taught me about measuring

Every wrong conclusion this project produced followed the same shape: a
pattern at n=1, generalized. The single-sample "fix" that a later replication
overturned. The second model I claimed shared granite's failure mode - and at
replication, 1 of its 86 failures matched; the rest were prose refusals. The
Ollama defect claim. The quant surprise. Four times, and each one is now a
project rule with a mechanism behind it:

- No verdict below five runs per arm, and replication must vary seeds at
  nonzero temperature - greedy repeats measure reproducibility, not truth.
- Any anomaly gets its raw tokens recovered before it gets a cause.
- A leftover inference server on the same host produced plausible-but-wrong
  error counts once, so the CLI now refuses to run when another server is
  responding (contention preflight).
- Early rows were measured on two different machines without disclosure.
  Everything published was re-measured on one host, and result files carry
  environment fields now.

None of these rules existed at the start. Every one was paid for.

## Where it stands

The matrix currently covers 32 published rows across three servers (llama.cpp,
Ollama, mlx-lm) on one measurement host, with case studies replicated at five
or more runs per arm - 90 runs across 18 arms for the quantization question
alone. Every red cell links its transcript. The corpus, the CLI, and the site
generator are one repo, and a result file from your machine is a PR away from
being a row - the scenario format is plain TOML, and the schema validates in
CI.

If you run local models for agent work, the practical takeaways are three:

1. Pick your server first. On identical weights, the decoding strategy is a
   bigger variable than the quant level.
2. Do not read a cross-server delta as a verdict on the model, and do not read
   an empty response as a verdict on anything.
3. Stop paying for Q8_0 out of tool-calling fear until someone shows a
   dose-response effect on your stack. On mine, there is none - but a single
   bad conversion can still zero a row, so test the artifact you actually
   deploy.

The project is at [github.com/devYRPauli/willitcall](https://github.com/devYRPauli/willitcall),
the matrix is at [devyrpauli.github.io/willitcall](https://devyrpauli.github.io/willitcall/),
and if a combination you care about is missing, the whole point of the design
is that you can measure it yourself and send the result.
