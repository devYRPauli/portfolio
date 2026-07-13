---
title: Baton
summary: A kit that installs a reliable code-delegation workflow into Claude Code
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
  - { label: Writeup, href: https://yashrajpandey.com/writing/baton-the-tool-that-built-itself/ }
order: 1
featuredOrder: 1
---

A standalone kit that installs an orchestrator-delegates-to-executor workflow into Claude Code: a coding agent hands implementation work to an executor CLI (Codex), and the jobs survive the session that launched them. Point your agent at the repo and it interviews you, then writes a tailored delegation skill plus a detached job runner into your config.

## Problem

Letting a planning model delegate code to a separate executor model is good practice: the orchestrator briefs and verifies, the executor writes. But the background path was the flaky part. Jobs launched, the launching session ended, and the work went with it (a background flag getting stripped, a session-end hook killing in-flight jobs). Undisciplined delegation is the other failure mode: no brief, no acceptance test, no independent check, so the executor gold-plates or fails silently.

## Approach

- Standalone, not plugin-dependent. A delegation skill and a detached Bash runner call the executor CLI directly, depending on nothing but Bash and coreutils, so the kit does not inherit the reliability bugs it was built to route around and works for people who never installed a plugin.
- Agent-driven installer. Instead of a shell script, an agent reads SETUP.md and runs an interview (orchestrator model, executor, subscription or API key, models and effort, install scope, policy preset), lists every file it will write, and asks once before writing anything. The kit never reads or stores a secret; the user authenticates themselves.
- Durable runner. `baton start/status/result/list` launches detached via nohup and process reparenting (verified reparented to init, so a job outlives its shell), with a hard-timeout watchdog and one line of JSONL telemetry per job so routing and bad model snapshots are auditable.
- The models are fill-in-the-blank; the discipline is fixed. Model, effort, and paths come from the interview, but every brief carries a smallest-diff constraint, every result is verified before it is called done, and setup ends with a live acceptance test that proves the install worked before declaring success.
- Built by dogfooding. Baton was implemented task by task through the same delegation workflow it ships: the orchestrator briefed each task, the executor wrote it, and every task was re-tested and reviewed before it was committed.

## Trade-offs

Standalone over plugin-integrated: fewer built-in features to lean on, but no dependency on a component with known reliability issues, and a clean install for anyone. macOS and Linux only, because the durability guarantee rests on nohup, ps, and reparenting; Windows is out rather than faked. It never manages credentials by design, trading a bit of setup convenience for never touching a secret. The one-command plugin version is deliberately deferred: the agent-driven install works today, and a packaged plugin is a "when it earns it" upgrade, not speculative work.
