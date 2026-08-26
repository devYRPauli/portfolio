---
title: Podium
summary: Verified delegation for coding agents, where a shell command decides whether the work landed
verdict:
  tried: "The bot reports done"
  result: "the runner decides"
role: Solo - Open source
kind: Developer tool
year: "2026"
stack:
  - Bash (zero deps)
  - Claude Code plugin
  - OpenAI Codex
  - JSONL ledger
links:
  - { label: GitHub, href: https://github.com/devYRPauli/podium }
order: 3
featuredOrder: 3
---

One agent hands briefed work to a roster of bots. Every job carries an acceptance check that the runner executes, and the runner decides the verdict. Jobs outlive the session that launched them, and every settled job leaves a receipt.

## Problem

A delegating agent asks a bot to do a task. The bot reports that it is done. That report is the weakest link, because the bot is grading its own work.

The failure is quiet. A job runs to completion, exits cleanly, and claims success. Nothing ever confirmed it changed a line. A week later that job looks exactly like one that genuinely passed.

I built Baton first. It fixed durability, so jobs stopped dying with the session that launched them. It did not fix trust. The orchestrator still took the executor at its word.

## Approach

- **Four verdicts that never collapse into each other.** `verified` means a check ran and exited 0. `failed_check` means a check ran and failed, so the job is rejected whatever the bot claimed. `check_timeout` means the check hung and was stopped. `unverified` means no check passed. Only the first is a pass.
- **The runner executes the check.** The acceptance command is part of the job, and a shell exit code settles it. A model cannot talk its way to `verified`.
- **Unverified work stays visible.** `podium ledger --unverified` lists every job that nothing confirmed, and jobs never age off that list.
- **Receipts, with an audit.** Each settled job writes a receipt, and `podium audit` detects one that changed after the fact.
- **The install proves itself.** `podium init` runs two canary jobs instead of printing a success message.

## Results

Four heavy jobs took 1,248 seconds of work and 359 seconds of wall time, a 3.5x speedup. Eight concurrent jobs took 822 seconds of work and about 187 seconds of wall time, a 4.4x speedup.

The number I care about more is on the unverified list. Running the roster against real work surfaced jobs that reported success and proved nothing. The old workflow counted those as done.

## Trade-offs

A job is only as good as its acceptance check. Podium enforces that a check ran and passed. It cannot tell you the check was worth running. A weak check earns a real `verified`, so writing good checks is still my job.

macOS and Linux only. The durability guarantee rests on process reparenting, so Windows is out rather than faked.

Podium supersedes Baton. Baton still works and I left it up, but new work goes here. I shipped a second tool because the fix was a different idea, and patching Baton would have hidden that.
