#!/usr/bin/env bash
# Full test suite. Runs against a throwaway PODIUM_HOME and a fake executor,
# so it never touches your real roster or calls a real model.
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD
PODIUM="$ROOT/bin/podium"
. test/lib.sh

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
export PODIUM_HOME="$TMP/home"
export PODIUM_CONF="$PODIUM_HOME/podium.conf"
mkdir -p "$PODIUM_HOME/bots/tester"

cat > "$PODIUM_CONF" <<CONF
podium_executor() { "$ROOT/test/fixtures/fake-executor" "\$1" "\$2" "\$3" "\$4" "\$5"; }
PODIUM_TIMEOUT=1800
PODIUM_BOTS_DIR="$PODIUM_HOME/bots"
PODIUM_JOBS_DIR="$PODIUM_HOME/jobs"
PODIUM_LOG="$PODIUM_HOME/log.jsonl"
PODIUM_DEFAULT_MODEL=fallback-model
CONF

cat > "$PODIUM_HOME/bots/tester/bot.md" <<'BOT'
---
name: tester
description: A bot that exists only for the test suite
tools: read, bash
model: test-model-1
---
You are the tester bot. Marker: TESTER_SYSTEM_PROMPT.
BOT

echo "== runner core =="
assert_eq "version prints" "$("$PODIUM" version)" "0.1.0"
assert_contains "help mentions run" "$("$PODIUM" help)" "podium run <bot>"
assert_contains "bots lists the roster" "$("$PODIUM" bots)" "tester"
assert_contains "bots shows description" "$("$PODIUM" bots)" "only for the test suite"
assert_contains "unknown bot fails loud" "$("$PODIUM" run nosuchbot "hi" 2>&1)" "unknown bot"
assert_contains "unknown command fails loud" "$("$PODIUM" frobnicate 2>&1)" "unknown command"
assert_contains "path traversal rejected" "$("$PODIUM" run ../etc "hi" 2>&1)" "invalid bot name"

echo
echo "== job lifecycle =="
id=$("$PODIUM" run tester "hello world" 2>/dev/null)
assert_ne "run returns a job id" "$id" ""
wait_settled "$id" 30 || bad "job settles" "still running after 30s"
assert_contains "status reports done" "$("$PODIUM" status "$id")" "status=done"
assert_contains "status carries the bot" "$("$PODIUM" status "$id")" "bot=tester"
assert_contains "status carries exit code" "$("$PODIUM" status "$id")" "exit_code=0"
res=$("$PODIUM" result "$id")
assert_contains "result carries the brief" "$res" "brief=hello world"
assert_contains "bot model is used" "$res" "model=test-model-1"
assert_contains "system prompt is delivered" "$res" "TESTER_SYSTEM_PROMPT"
assert_contains "list shows the job" "$("$PODIUM" list)" "$id"
assert_contains "list filters by bot" "$("$PODIUM" list --bot tester)" "$id"
assert_eq "list filters out other bots" "$("$PODIUM" list --bot nobody)" ""

echo
echo "== durability: the job outlives its launcher =="
# Launch from a subshell that exits immediately. If the worker were a child of
# that shell it would die with it; reparenting to init is what keeps it alive.
did=$(bash -c "\"$PODIUM\" run tester 'FAKE_SLEEP=4 durable' 2>/dev/null")
sleep 2
worker_pid=$(cat "$PODIUM_HOME/jobs/$did/pid" 2>/dev/null || echo "")
assert_ne "worker recorded a pid" "$worker_pid" ""
if [ -n "$worker_pid" ]; then
  ppid=$(ps -o ppid= -p "$worker_pid" 2>/dev/null | tr -d ' ')
  assert_eq "worker was reparented to init" "$ppid" "1"
  alive=$(kill -0 "$worker_pid" 2>/dev/null && echo yes || echo no)
  assert_eq "worker still alive after launcher exited" "$alive" "yes"
fi
wait_settled "$did" 30 || bad "detached job settles" "still running"
assert_contains "detached job produced output" "$("$PODIUM" result "$did")" "durable"

echo
echo "== failure and timeout =="
fid=$("$PODIUM" run tester "FAKE_FAIL please" 2>/dev/null)
wait_settled "$fid" 30 || bad "failing job settles" "still running"
assert_contains "failure is reported" "$("$PODIUM" status "$fid")" "status=failed"
assert_contains "failure keeps the exit code" "$("$PODIUM" status "$fid")" "exit_code=3"

tid=$("$PODIUM" run tester "FAKE_SLEEP=20 slow" --timeout 3 2>/dev/null)
wait_settled "$tid" 40 || bad "timed-out job settles" "still running"
assert_contains "watchdog stops runaways" "$("$PODIUM" status "$tid")" "status=timeout"

echo
echo "== memory injection =="
printf 'The user prefers tabs. Marker: MEMORY_MARKER.\n' > "$PODIUM_HOME/bots/tester/memory.md"
mid=$("$PODIUM" run tester "check memory" 2>/dev/null)
wait_settled "$mid" 30 || bad "memory job settles" "still running"
assert_contains "durable memory reaches the bot" "$("$PODIUM" result "$mid")" "system_has_memory=yes"

echo
echo "== audit log =="
log="$PODIUM_HOME/log.jsonl"
assert_eq "one log line per settled job" "$(wc -l < "$log" | tr -d ' ')" "5"
assert_contains "log records the bot" "$(head -1 "$log")" '"bot":"tester"'
assert_contains "log records timeout flag" "$(grep timeout "$log" | head -1)" '"timed_out":true'
if command -v python3 >/dev/null 2>&1; then
  valid=$(python3 -c "
import json,sys
for line in open('$log'):
    json.loads(line)
print('yes')" 2>&1)
  assert_eq "every log line is valid JSON" "$valid" "yes"
fi

echo
echo "== --wait =="
wid=$("$PODIUM" run tester "FAKE_SLEEP=2 blocking" --wait 2>/dev/null)
assert_contains "--wait returns only once settled" "$("$PODIUM" status "$wid")" "status=done"

summary
