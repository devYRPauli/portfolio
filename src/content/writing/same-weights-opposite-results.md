---
title: Same Weights, Same Prompt, Opposite Results - Why Local Tool Calling Breaks
description: I built willitcall, a conformance suite and public matrix for tool calling on local models. The findings that held up, and the one I retracted.
project: willitcall
verdict:
  tried: "Blamed Ollama's parser"
  result: "decoding differs, claim retracted"
pubDate: 2026-07-21
updatedDate: 2026-10-05
tags:
  - local-llms
  - tool-calling
  - evals
  - reproducibility
---

## TL;DR

Tool calling on local stacks fails silently. The same model, at the same
quantization, with the same prompt, can make a correct call on one inference
server and return nothing on another. I built [willitcall](https://github.com/devYRPauli/willitcall)
to measure this. It is a Rust CLI that runs 50 tool-calling scenarios against
any OpenAI-compatible endpoint. It also publishes a
[public red/green matrix](https://devyrpauli.github.io/willitcall/) of
model x quant x server results, where every red cell links to the full
request/response transcript that produced it.

Three findings held up, and one of my own headline claims did not:

1. **The servers do not decode the same way.** llama.cpp compiles your tool
   definitions into a grammar and constrains decoding with it, so the model
   cannot sample a function name you did not supply. Ollama on its Go template
   path generates free text and parses a tool call out of it afterwards, and
   so does mlx-lm. On one scenario, the same Qwen2.5-7B weights made the right
   call 6 times out of 6 on llama.cpp and returned nothing 10 times out of 10
   on Ollama.
2. **Quantization level did not order tool-calling ability** on this corpus.
   The folklore says lower quants degrade tool calling. On Qwen2.5-7B,
   seed-varied runs put Q8_0, Q4_K_M, and Q3_K_M within noise of each other.
   On Qwen2.5-1.5B, Q8_0 led, but Q4_K_M scored below Q3_K_M. What CAN destroy
   a row outright is a bad conversion artifact, which is a different thing
   from a dose-response effect.
3. **There is a failure mode I did not have a name for:** a model that emits
   correct, well-formed tool calls in a format that the servers do not parse.
   Those cells look identical to "this model cannot call tools", and that is
   false.

I also had to retract a claim. I filed an issue against Ollama claiming it
discarded a valid tool call. Another user pushed back. I recovered the discarded bytes,
and the model had emitted the tool's *description* where its *name* belonged.
Ollama's parser had rejected a bad call, so my inference was wrong. I
retracted the claim publicly. The investigation that followed produced
finding 1, which turned out to matter more than the bug report.

## The problem

Every local inference stack claims OpenAI-compatible function calling. In
practice, support varies by model, by quantization, by chat template, and by
server, and the failures are silent. Your agent does not crash; it just never
calls the tool, or calls it with mangled arguments, and you spend an afternoon
debugging your prompt when the problem is three layers down.

Existing benchmarks did not cover this. BFCL and similar benchmarks score a
model on one serving setup. They do not vary the quant or the inference
server. What I wanted was caniuse.com for local tool calling: pick a model, a
quant, and a server, and see whether that exact combination executes tool
calls, with the evidence one click away.

So the unit of measurement in willitcall is the *combination*. A cell is a
property of the whole stack. When I wrote that into the spec it felt like a
hedge. By the end it was the main finding.

## What I built

The CLI runs a corpus of 50 scenarios in six categories: single calls across
argument shapes, parallel calls, streaming (SSE delta reassembly), tool_choice
modes, multi-turn, and negative traps. A multi-turn case feeds a tool result
back, and the follow-up call must use a value that only exists in that result.
Most negative traps are cases where the correct behavior is to NOT call a
tool. The other two check that an awkward argument comes through intact: a
256-character token, and a city name with an umlaut. Scoring is
deterministic; there is no LLM judge, because a published failure reason has
to be defensible.

Two design rules did the most work:

**A scenario that a fully correct model could fail is a bug in the scenario.**
A false red is worse than a missing test - if the matrix says a model fails and
it does not, no other cell is trustworthy. This rule caught real bugs during
development. In one, the prompt asked for the weather in Munich, spelled in
German with an umlaut. A model that wrote the umlaut as a plain u plus a
combining mark (the NFD form) failed, though its text was correct. The scorer
now compares strings in NFC. Every scenario also carries a rationale field
explaining why no correct model can fail it for a reason other than the one
it tests.

**Every red cell must carry its evidence.** Result files ship full
request/response transcripts (auth-redacted, hash-verified). This rule is why
the retraction below was possible at all.

## The bug report I had to retract

Early seeding produced a striking result. Qwen2.5-7B, served through
llama.cpp, emitted a correct tool call six times out of six. The same weights
through Ollama returned an empty response ten times out of ten, while still
billing about 40 completion tokens. Tokens were generated and nothing came
back. I read that as Ollama's parser discarding a well-formed call, wrote it
up, and [filed it upstream](https://github.com/ollama/ollama/issues/17274).

Another user in the thread pushed back, and they were right to. I built Ollama
0.32.1 with an open upstream PR,
[#17284](https://github.com/ollama/ollama/pull/17284), which returns the
buffered output as content when no tool call parses. That recovered the
discarded bytes. The model had emitted the tool's *description* string in the
`name` field. That was not a valid call, and Ollama's parser was right to
reject it. My claim rested on an inference from the token count, not on the
tokens themselves. I retitled the issue, retracted the claim in the thread
with credit to the person who challenged it, and rewrote the case study to
carry the correction.

The issue is still open, because the silent drop is real. When no tool call
parses, Ollama returns empty content and no error, and the generated text is
gone. In September 2026 I reran the request from the issue on Ollama 0.34.0,
against qwen2.5:0.5b with its default Go template. It still generated 40
tokens and returned nothing. A collaborator on the issue pointed out that the
Jinja template route uses constrained generation. With `OLLAMA_GO_TEMPLATE=0`
set on the server, the same request returned the tool call.

That left a question. If the model emitted a wrong name through Ollama, why
did the same weights emit the right name through llama.cpp every time?

The answer is that llama.cpp does not give the model the chance to be wrong.
It compiles the tool definitions from your request into a GBNF grammar and
constrains decoding with it. The grammar is lazy, so it engages when the model
starts a tool call. Under that grammar, the model cannot sample a function
name you did not supply. Ollama, on its Go template path, generates
unconstrained text and parses it afterwards. mlx-lm is unconstrained too. I
checked its source. The tools reach only the chat template, and there is no
grammar code. A failed parse is dropped without an error.

So a llama.cpp-versus-Ollama delta mixes the model with the way each server
decodes. It does not always favor llama.cpp. Llama-3.1-8B at Q4_K_M passed 20
of 50 on llama.cpp, with 9 HTTP 500 errors. Ollama's Q4_K_M conversion of the
same model passed 36. The two models I served from the identical blob on both
servers, granite3.1-dense and phi4-mini, scored 7 of 50 on each. To compare
models, compare them on one server. The site now says this above the matrix,
because without it, every reader would misread the reds the same way I did.

The main lesson is that **you cannot attribute an empty response without the
raw tokens.** My inference was "tokens were billed and nothing came back, so
the server ate a valid call". It felt rigorous at the time, but it was a
guess. Get the bytes.

## Quantization level did not order the results (and how I almost published the opposite)

The folklore says aggressive quantization degrades tool-call formatting. I
measured three models across Q8_0, Q4_K_M, and Q3_K_M on llama.cpp. The first
pass said the opposite: two of the three models scored *highest* at the
lowest quant. That would have made a good contrarian headline, except it was
n=1 per arm.

My own rule is no verdict below five runs per arm. So I reran every arm five
times, and every arm gave the same score again, with the same failing
scenario ids. That looked like strong replication, but it was not. The runs
were greedy (temperature 0, fixed seed), so the five runs of an arm were the
same computation five times. They showed that the setup is deterministic, and
nothing more.

So I reran every arm with five seeds at temperature 0.7. The Qwen2.5-7B arms
averaged 46.8, 45.4, and 46.4 of 50 at Q8_0, Q4_K_M, and Q3_K_M, and their
ranges overlapped. On Qwen2.5-1.5B, Q8_0 led at 41.0 of 50. Q4_K_M averaged
37.4, below Q3_K_M at 38.8, so the order did not follow the bit width. I left
Llama-3.1-8B out, because llama.cpp returns HTTP 500 errors on part of its
corpus (see below). So the contrarian result did not hold up. On this corpus
and this server, a lower quant did not make tool calling steadily worse. The
one gap was on the 1.5B model, where Q8_0 led.

One mlx-lm result looks like a quant effect. The 8-bit community conversion of
Qwen2.5-7B scores 7/50, and the 4-bit conversion scores 46/50. Five greedy
repeats of each gave the same scores, which shows only that the runs are
deterministic. Before I called it a quant effect, I recovered the raw
generation again. The 8-bit conversion emits doubled braces in its tool calls:

```
8bit:  <tool_call> {{"name": "get_weather", "arguments": {"city": "Boston"}}}
4bit:  <tool_call> {"name": "get_weather", "arguments": {"city": "Boston"}}
```

That is not valid JSON, and mlx-lm is right to reject it. Apart from the extra
braces, the recovered call names the right function with the right arguments.
So this is one broken published conversion, not a gradual loss from
quantization. It does not show that 8-bit is worse than 4-bit. The cause rests
on the recovered output, not on the repeat runs.

## The failure modes I had to name myself

After scoring thousands of transcripts, I needed better labels than pass and
fail. The matrix now labels each response by fixed rules:

- **error** - the server rejected the request or failed on it. Ollama returns
  HTTP 400 for any gemma3 request that carries tools. In greedy runs,
  llama.cpp returns HTTP 500 on 7 to 9 of the 50 scenarios for Llama-3.1-8B
  ("does not match the expected peg-native format"). That replicated on two
  llama.cpp builds, so I leave those rows out of conclusions instead of
  counting them as model failures.
- **empty_response** - no content and no tool call. You cannot tell who caused
  it without the raw tokens (see above). When the parser rejects what the
  model emitted, both Ollama and mlx-lm still return HTTP 200. mlx-lm usually
  reports `finish_reason: "tool_calls"` with an empty message, so the client
  is told a call happened and gets nothing. Ollama reports `"stop"` (or
  `"length"`) with empty content. From the API alone, both look the same as a
  model that said nothing, which is why the recovery step exists.
- **unparsed_tool_call** - the one I had to invent. granite3.1-dense:8b emits
  well-formed calls with the right function and valid arguments, in its own
  `<tool_call>[...]` format. It scores 7/50 on Ollama, and 7/50 on llama.cpp
  fed the identical blob, because neither server parses that format into
  tool_calls. Five greedy repeats on each server gave the same score. The 7
  passes are the seven scenarios where making no call is correct. So a model
  that calls tools correctly scores near zero. Without this class, those cells
  read as "granite cannot call tools", which is false. The fault is in neither
  the model nor the server alone. The model's call format does not match what
  the servers parse.

Each class is assigned conservatively. Crediting a model with a call it never
made is worse than leaving a cell unexplained. The full precedence rules are
in the schema docs.

## Rules I learned the hard way

Every wrong conclusion in this project had the same shape. I saw a pattern
once and generalized it. That happened four times. A later replication
overturned a single-sample "fix". I claimed a second model shared granite's
failure mode, and at replication 1 of its 86 failures matched; the rest were
prose refusals. The other two were the Ollama defect claim and the quant
surprise. Each one is now a project rule with a mechanism behind it:

- No verdict below five runs per arm. Replication must vary the seed at a
  nonzero temperature, because greedy repeats only show that the setup is
  deterministic.
- I recover the raw tokens of any anomaly before I name a cause.
- A leftover inference server on the same host produced plausible-but-wrong
  error counts once, so the CLI now refuses to run when another server is
  responding (contention preflight).
- Early rows were measured on two different machines without disclosure.
  Everything published was re-measured on one host, and result files carry
  environment fields now.

None of these rules existed at the start. Each one exists because I got
something wrong first.

## The comparison I built the project for, and could not make

Two and a half weeks in, I went to group the matrix by model so you could see
one model across three servers. I could not. The schema had no way to say
which model a row measured.

Each result stored a field called `model_id`. It held whatever string the
server happened to use. Ollama wrote a tag like `qwen3:8b`. llama.cpp wrote a
Hugging Face reference, or an absolute file path when I served a raw blob.
mlx-lm wrote a repository id. All 32 rows held different values, so nothing
joined. phi4-mini is measured on all three servers, and the schema saw three
unrelated rows.

The whole premise of the project is that a cell is a property of the stack, so
the interesting question is what happens to one model across servers. I had
been unable to ask it since the beginning and had not noticed, because the site
labeled its rows from the result file names. The labels looked right, but no
data behind them said which model a row measured.

The fix was a new schema version. A row now records the checkpoint it measured,
the artifact that produced it, and how confident I am in each. Identity comes
from a registry I check in, never from a file name, and every value cites the
evidence it came from. Of the 32 rows, 1 is verified, 27 are declared, and 4
are unresolved. The unresolved ones stay in the matrix, labeled as unverified
artifacts, and are excluded from any grouping rather than guessed at.

Recovering the identities was the interesting part. Ollama had been
deregistered on the measurement host. But 14 manifests and 54 blobs were still
on disk, and 12 of those blobs carry their own provenance in the GGUF header.
For the hermes3:8b blob, `general.name` says "Hermes 3 Llama 3.1 8B" and
`general.organization` says "NousResearch". That is what the measured bytes
say about themselves, which beats anything I could infer later. The manifests
also gave me the quantization for the Ollama rows, which had been null for all
14 of them. Two of the rows I had assumed were Q4_K_M are Q4_0.

Two other things were wrong and had been on the public site for weeks.

gemma3 is refused outright by Ollama, so both its rows are 50 errors and zero
measurements. The site painted them the same red as a model that ran and failed
everything, and read out the same label to a screen reader. A combination I
could not measure looked exactly like a combination that failed.

The decode-mode bands were worse, because they contradicted a rule I had
written myself. The site sorted rows into constrained and unconstrained
decoding, which is the mechanism this whole article is about. It decided which
band a row belonged to by matching the server name string. Only 6 of 32 runs
had actually recorded their decode mode. My own README says that a missing flag
means unverified, not unconstrained, and the page ignored that for 26 rows.
Each row now says whether its decode mode was recorded by the run or resolved
from a documented mapping, and the mapping cites where each server's behavior
is established.

The pattern here is the same one as the retraction, one level up. I trusted a
label instead of the thing it named. The file name looked like an identity, the
server name looked like a decode mode, and both were close enough to correct
that nothing broke loudly.

## Where it stands

The matrix currently covers 32 published rows across three servers (llama.cpp,
Ollama, mlx-lm) on one measurement host. The case studies are replicated at
five or more runs per arm, with 90 runs across 18 arms for the quantization
question alone. The replication runs are in the repo, under
[docs/case-studies/evidence/replication](https://github.com/devYRPauli/willitcall/tree/main/docs/case-studies/evidence/replication).
Every red cell links its transcript. The corpus, the CLI, and the site
generator are one repo, and a result file from your machine is a PR away from
being a row. The scenario format is plain TOML, and the schema validates in
CI.

The site also publishes the whole result set as JSON and CSV, so you do not
have to scrape the page to check my arithmetic.

If you run local models for agent work, these are the practical takeaways:

1. Test on the server you will deploy. On identical weights, the way the
   server decodes can decide whether a call works at all.
2. Do not read a cross-server delta as a verdict on the model, and do not read
   an empty response as a verdict on anything.
3. Measure before you pay for Q8_0. On my runs the 7B quants were within
   noise, and Q8_0 led only on the 1.5B model. A single bad conversion can
   still drop a row to 7 of 50, so test the exact artifact you deploy.

The project is at [github.com/devYRPauli/willitcall](https://github.com/devYRPauli/willitcall),
the matrix is at [devyrpauli.github.io/willitcall](https://devyrpauli.github.io/willitcall/),
and if a combination you care about is missing, the whole point of the design
is that you can measure it yourself and send the result.
