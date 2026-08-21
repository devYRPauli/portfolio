# Podium

*A chief-of-staff orchestrator and a roster of persistent bots, running on the
subscriptions you already pay for.*

You talk to one agent. It decides what work needs to happen, hands each piece to
a specialist bot, checks the results, and comes back with an answer. Jobs are
detached, so they survive the session that launched them, and every job leaves an
audit line behind.

This is the local, inspectable version of what xAI ships as Grok Bot - minus the
$300/month and minus the black box.

## Status

v0. The runner is complete and tested (30 assertions, including a live check
that a job outlives its launching shell). The pi extension and installer are
written but have not been exercised against a live model. Treat this as a
working skeleton, not a finished product.

## How it fits together

```
  you  ──►  orchestrator (pi session, chief-of-staff prompt)
                │  roster / delegate / check / collect / remember
                ▼
            podium  ──►  detached job  ──►  executor (pi, codex, claude…)
                │                              │
                │                              └─ bot system prompt + memory
                └─ jobs/<id>/ + log.jsonl  (state and audit)
```

- **The orchestrator** is a pi session with the discipline in
  `templates/ORCHESTRATOR.md.tmpl` and the tools in
  `templates/orchestrator.ts.tmpl`.
- **A bot** is a directory: a markdown system prompt, a memory file, and a
  workspace that persists between jobs.
- **The runner** (`bin/podium`) is zero-dependency bash. It detaches each job
  via `nohup` and an exiting parent, so init adopts the worker and the job keeps
  going after you close the terminal.

## Requirements

- macOS or Linux, bash and coreutils. The durability guarantee rests on `nohup`,
  `ps`, and process reparenting, so Windows is out rather than faked.
- [pi](https://github.com/earendil-works/pi-mono) as the harness:
  `npm i -g @earendil-works/pi-coding-agent`
- An executor you have authenticated yourself. `pi /login` covers ChatGPT
  Plus/Pro (Codex), GitHub Copilot, xAI, and others on subscription.

Podium never reads, stores, or passes a credential. You run the login command.

## Install

Read `SETUP.md` first - it is short, and it describes an agent writing files into
your configuration. Then point your agent at this directory:

> Set up Podium from this repo.

It interviews you, lists every file it will write, asks once, installs, and runs
a live acceptance test.

## The runner by hand

The orchestrator drives it, but `podium` is a plain CLI:

```
$ podium bots
scout          Fast codebase recon. Returns compressed context for another bot.
implementer    Writes code against a brief. Smallest change that passes.
reviewer       Reviews a change for correctness and scope creep.

$ podium run scout "Find every place the session store is written to"
20260821-044210-31337

$ podium status 20260821-044210-31337
id=20260821-044210-31337 bot=scout model=... status=running duration_secs=6 exit_code=-

$ podium result 20260821-044210-31337
<the bot's report>

$ podium list --status done
```

Every settled job appends one line to `~/.podium/log.jsonl` - bot, model,
duration, exit code, timeout flag - so you can audit routing after the fact and
catch a bot that is quietly failing.

## Tests

```sh
./test/run.sh
```

Runs against a throwaway `PODIUM_HOME` and a fake executor. It never calls a real
model and never touches your roster.

## Boundaries

- macOS and Linux only.
- Podium never handles secrets. Authentication is you, running the command.
- Bots share your filesystem. There is no sandbox in v0; if you want one, run pi
  under [Gondolin](https://github.com/earendil-works/gondolin) or a container.
- The verification step is the orchestrator's job and it is a prompt, not a
  mechanism. It holds as well as the model holds it.
