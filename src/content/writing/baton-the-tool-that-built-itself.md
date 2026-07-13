---
title: "Baton: I Built a Tool for Delegating Code to an AI, Then Used It to Build Itself"
description: A standalone kit that installs a reliable orchestrator-delegates-to-executor workflow into Claude Code - and the dogfooding loop that wrote it
pubDate: 2026-07-13
tags:
  - ai-agents
  - developer-tools
  - claude-code
---

## TL;DR

I kept hitting the same wall when I let a planning model hand coding work to a separate executor model (OpenAI's Codex): the background jobs died. The session that launched them ended, and the work went with it. So I built **Baton**, a small kit that installs a reliable delegate-code-to-an-executor workflow into any Claude Code setup. You point your agent at the repo, it interviews you, and it writes a tailored delegation skill plus a detached job runner into your config. The core promise is in the name: it does not drop the baton. Jobs survive the session ending, and their results stay retrievable.

The part I like most is how it was built. Baton is a tool for delegating code to an AI executor, and I built it by delegating its own code to an AI executor, one task at a time, verifying every task myself before it landed. The tool built itself, under supervision.

Repo: **[github.com/devYRPauli/baton](https://github.com/devYRPauli/baton)** (MIT, CI green on macOS and Linux)

---

## Why I built this

The setup I wanted is simple to state: a capable planning model acts as the orchestrator (it writes the brief, reviews the diff, and verifies the result), and a strong coding model acts as the executor (it writes the code in its own runtime). The orchestrator should not write the application code itself; it should delegate and check.

That division works right up until you send a long job to the background. In practice the background path was the flaky part. A job would launch, the launching session would end, and nothing was retrievable afterward. Some of this traces to known upstream behavior (a background flag getting stripped, a session-end hook killing in-flight jobs), but the root problem is general: a background process whose lifetime is tied to the agent session is not actually durable.

I did not want a clever prompt. I wanted a job runner that a coding agent could hand work to and trust, plus a small amount of discipline around it so the delegation was worth doing at all.

---

## The design decisions

Before writing anything, I settled the questions that are expensive to change later. Two mattered most.

**Standalone, not plugin-dependent.** My personal workflow routes through an official Codex plugin, but that plugin is exactly where the background bugs live. For something other people would install, tying it to a component with known reliability issues is the wrong foundation. Baton calls the executor CLI directly and depends on nothing but bash and coreutils. It coexists with the plugin but never requires it.

**Template the models, hard-code the invariants.** The kit is meant to be shared, and model names go stale fast. "Use this specific model at this specific effort" is my opinion for this month, not a durable design. So the installer fills in model, effort, and paths from an interview, while the things that are actually the product stay fixed text: every brief ends with a smallest-diff constraint, every result is verified before it is called done, and a detached job is confirmed alive before anyone assumes it is running. If those were optional, you could interview your way into a kit that just runs an executor sometimes.

I ran the design past a stronger reasoning model as a critic before committing. The sharpest note it gave me: make the installer verify itself. An installer that does not prove it worked is precisely the failure mode the tool exists to prevent. That became a rule - the last thing setup does is run a live job end to end and show you the real output before it declares success.

The rest fell out of those: an agent-driven `SETUP.md` installer instead of a shell script (the interview needs judgment a script cannot fake), a per-scope config that defines the executor invocation as a small shell function (which is what lets you swap in a non-Codex executor), and two policy presets so the kit is not opinionated about other people's API bills - quality-first for maximum effort, balanced for a lighter default.

---

## Dogfooding: building Baton with Baton

Here is the loop I used to build it, which is the same loop the tool ships.

I wrote a spec, then an implementation plan broken into eight small test-driven tasks. Then, task by task, my orchestrator wrote a tight brief (the files to touch, the acceptance test, and a hard "smallest diff, no incidental changes" constraint) and handed it to the Codex executor through a detached runner. The executor implemented the task and ran the tests in its own runtime. When it came back, I did not take its word for it. I re-ran the tests myself, read the diff, and only then committed.

Every task carried the same non-negotiable: return paths and a concise summary, never a wall of logs. The orchestrator plans and checks; the executor writes. I never hand-wrote the runner's bash.

The tasks, each an independently testable slice:

| Task | Deliverable |
|---|---|
| 1 | A dependency-free bash test harness and a fake-executor fixture |
| 2 | Runner core: config sourcing, version, help, model validation |
| 3 | start / status / result, with detached execution |
| 4 | A timeout watchdog, single-line telemetry, and list |
| 5 | The config template with the executor-function slot |
| 6 | The skill template with the invariants as fixed text |
| 7 | The agent-driven SETUP.md installer |
| 8 | README and a how-it-works writeup |

The final runner is a plain CLI you can also use by hand:

```
$ baton start "refactor the parser per the brief"
20260713-105451-23816232

$ baton status 20260713-105451-23816232
id=... status=running duration_secs=3 exit_code=-

$ baton status 20260713-105451-23816232
id=... status=done duration_secs=41 exit_code=0

$ baton result 20260713-105451-23816232
<the executor's output>
```

---

## Proving it survives

The whole point of Baton is durability, so a passing unit test was not enough. I wanted to see a job outlive the thing that launched it.

The mechanism is a detached runner started with `nohup` and disowned, so the operating system reparents it to init. I checked this live: after launching a job, the runner process reported a parent process ID of 1. It was no longer a child of my shell. That is the property that matters. Kill the session, close the terminal, the job keeps going and its result is still there.

Then I ran the full install flow against a fake executor, exactly as `SETUP.md` describes it: render the templates, install into a throwaway scope, and run the acceptance test. Rendered files had zero unfilled slots, the installed runner launched a job, reached done, returned the right output, and wrote one well-formed telemetry line. Finally I let CI run the suite on both macOS and Linux, since the kit claims both. Both are green.

That is the ethos I try to hold on every project: the tool does not get to say it works. The evidence does.

---

## Two bugs, and they were mine

The best beat in the build was not a bug in the generated code. It was a bug in my plan.

Two tasks failed their tests on the first pass. When I dug in, the executor had implemented my plan faithfully, character for character. The plan was wrong.

The first: my config template rendered filesystem paths without quotes. On any path containing a space (which includes the very directory this project lives in), sourcing the config broke. A real robustness bug, and it was sitting in the spec I wrote.

The second: a test asserted a lowercase word that appeared in the template only capitalized. The invariant was present; my assertion was needlessly case-sensitive.

Both were two-line fixes, and I fixed them in the plan as well as the code so the two stay in sync. The lesson is one I keep relearning: when delegated work fails, check your own instructions before you blame the worker. A faithful executor will implement your mistakes exactly.

---

## How you use it

You do not run a script. You read `SETUP.md` first (it is short, and it is a stranger's repo telling your agent to write files, so you should), then you tell your agent to set up Baton from the repo. The agent detects your executor, asks whether you are on a subscription or an API key (and has you authenticate yourself - the kit never touches your credentials), asks which models to use and at what effort, picks a policy preset, and chooses global or project scope. It lists every file it will write and asks once before writing anything. Then it installs and runs that live acceptance test.

After that, "delegate this to the executor" just works, with a brief, a durable run, and a verification step, every time.

---

## Honest limitations

- **macOS and Linux only.** The runner leans on `nohup`, `ps`, and process reparenting. Windows is not supported and I did not pretend otherwise.
- **Verified with a fake executor, not yet battle-tested by a stranger.** I proved the mechanics end to end (survival, render, install, acceptance) with a stand-in executor and cross-platform CI. A first real-world install by someone who is not me, against a live executor, is the next validation I want.
- **The one-command plugin version is deliberately deferred.** The agent-driven install works today. A packaged plugin is a "when it earns it" upgrade, not something I built speculatively.
- **It never manages your secrets, by design.** That is a feature, but it means auth is on you.

---

## What I took away

1. **Decide the expensive-to-reverse things first.** Standalone-versus-plugin and template-versus-fixed shaped everything downstream. Getting them right early meant the eight build tasks were mechanical.
2. **Make the installer prove itself.** The most valuable rule in the whole design is that setup ends with a live job, not a claim. It doubles as the demo.
3. **A faithful executor implements your mistakes exactly.** Both build failures were my plan, not the generated code. Delegation makes the quality of your brief the ceiling on the result.
4. **Durability is a property you can point at.** "Jobs survive the session" is not a vibe; it is a parent process ID of 1. Find the observable version of your claim and check it.
5. **The orchestrator should not write the code.** Keeping the planning model out of the implementation, and making it verify instead, is the discipline Baton packages - and it is the discipline that built Baton.

The stock background path dropped jobs on the floor. The finished kit hands work to an executor, keeps custody of it through the session ending, and proves the handoff landed - and it wrote its own runner while I watched.

---

## Links

- Repository: **[github.com/devYRPauli/baton](https://github.com/devYRPauli/baton)**
- Built with Claude Code as the orchestrator and OpenAI Codex as the executor, through the delegation workflow the repo installs.
