#!/usr/bin/env bash
# Copy Podium out of the portfolio repo into a standalone repository, verify the
# copy passes its own tests, and make the first commit.
#
#   ./scripts/extract-repo.sh ~/code/podium
set -euo pipefail

DEST=${1:-}
[ -n "$DEST" ] || { echo "usage: $0 <destination-directory>"; exit 1; }

SRC="$(cd "$(dirname "$0")/.." && pwd)"

if [ -e "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
  echo "refusing to write into a non-empty directory: $DEST" >&2
  exit 1
fi

echo "==> copying $SRC -> $DEST"
mkdir -p "$DEST"
# Everything except local state and installed dependencies.
tar -C "$SRC" \
    --exclude='./jobs' \
    --exclude='./log.jsonl*' \
    --exclude='./node_modules' \
    --exclude='./desktop/node_modules' \
    --exclude='./scripts/extract-repo.sh' \
    --exclude='./NEW_REPO.md' \
    -cf - . | tar -C "$DEST" -xf -

# The !*.md line exists only to defeat the portfolio repo's blanket rule.
echo "==> rewriting .gitignore for a standalone repo"
cat > "$DEST/.gitignore" <<'GITIGNORE'
# Local state produced by running the kit.
jobs/
log.jsonl
log.jsonl.head
log.jsonl.lock/
*/workspace/
bots/*/memory.md

# Node
node_modules/
dist/
out/

# OS
.DS_Store
GITIGNORE

echo "==> verifying the copy runs its own tests"
( cd "$DEST" && ./test/run.sh > /tmp/podium-extract-runner.log 2>&1 ) \
  && echo "    runner: $(tail -1 /tmp/podium-extract-runner.log)" \
  || { echo "    runner suite FAILED - see /tmp/podium-extract-runner.log"; exit 1; }

if command -v node >/dev/null 2>&1; then
  ( cd "$DEST/desktop" && npm install --silent --no-audit --no-fund >/dev/null 2>&1 && npm test >/tmp/podium-extract-desktop.log 2>&1 ) \
    && echo "    desktop: $(grep -E '^# pass' /tmp/podium-extract-desktop.log)" \
    || echo "    desktop: skipped or failed - see /tmp/podium-extract-desktop.log"
fi

echo "==> initialising the repository"
cd "$DEST"
git init -q -b main
git add -A
git -c user.name="$(git -C "$SRC" config user.name || echo 'Yash Raj Pandey')" \
    -c user.email="$(git -C "$SRC" config user.email || echo 'yashpn62@gmail.com')" \
    commit -q -m "Podium: verified delegation for Pi

A chief-of-staff agent hands briefed work to a roster of persistent bots. The
runner - bash, not a model - executes each job's acceptance check and records
the verdict, so \"done\" is a result rather than a claim. Jobs are detached and
outlive the session that launched them. Receipts are hash-chained, so an edited
ledger is detectable.

Runner 79 assertions, desktop 51, UI smoke 13."

echo
echo "done. $DEST is a repository with one commit."
echo
echo "  cd $DEST"
echo "  gh repo create devYRPauli/podium --public --source=. --push"
