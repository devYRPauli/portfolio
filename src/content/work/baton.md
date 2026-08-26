---
title: Baton
summary: A kit that installs a reliable code-delegation workflow into Claude Code
verdict:
  tried: "Built the delegation kit"
  result: "used it to build itself"
role: Solo - Open source
kind: Developer tool
year: "2026"
stack:
  - Bash (zero deps)
  - Claude Code
  - OpenAI Codex
  - GitHub Actions
links:
  - { label: GitHub, href: https://github.com/devYRPauli/baton }
order: 6.5
---

A standalone kit that installs an orchestrator-delegates-to-executor workflow into Claude Code. A coding agent hands implementation work to an executor CLI, and the jobs survive the session that launched them.

Baton is superseded by [Podium](/work/podium/), which adds a roster of bots and an acceptance check the runner executes. Baton still works. New work goes to Podium.

## Problem

Letting a planning model delegate code to a separate executor is good practice. The orchestrator briefs and verifies, the executor writes. The background path was the flaky part. Jobs launched, the launching session ended, and the work went with it. A background flag got stripped; a session-end hook killed jobs in flight.

Undisciplined delegation is the other failure mode. No brief, no acceptance test, no independent check, so the executor gold-plates or fails quietly.

## Approach

- **Standalone, not plugin-dependent.** A delegation skill and a detached Bash runner call the executor CLI directly. They depend on nothing but Bash and coreutils, so the kit does not inherit the reliability bugs it was built to route around.
- **Agent-driven installer.** Instead of a shell script, an agent reads `SETUP.md` and runs an interview: executor, models, effort, install scope, policy preset. It lists every file it will write and asks once before writing. The kit never reads or stores a secret.
- **Durable runner.** `baton start/status/result/list` launches detached through nohup and process reparenting, verified reparented to init so a job outlives its shell. A hard-timeout watchdog stops runaways. One line of JSONL per job makes routing auditable.
- **The models are fill-in-the-blank; the discipline is fixed.** Model and paths come from the interview. Every brief carries a smallest-diff constraint, every result is verified before it counts as done, and setup ends with a live acceptance test.
- **Built by dogfooding.** Baton was implemented task by task through the workflow it ships. The orchestrator briefed each task, the executor wrote it, and I re-tested every task before it landed.

## Trade-offs

Standalone means fewer built-in features to lean on, but no dependency on a component with known reliability bugs. macOS and Linux only, because the durability guarantee rests on nohup, ps, and reparenting. Windows is out rather than faked.

It never manages credentials, which costs some setup convenience and means the kit never touches a secret. The one-command plugin version is deferred on purpose. The agent-driven install works today, and a packaged plugin is a "when it earns it" upgrade.
