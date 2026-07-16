#!/usr/bin/env bash
# install.sh — install ds-agents into ~/.claude/
#   agents/*.md      → ~/.claude/agents/       (skip-on-diff, protects local edits)
#   references/*.md  → ~/.claude/references/   (overwrite, the method playbooks agents Read at runtime)
# tools/ is NOT installed — those are run from the repo, not read by an agent.
#
# Idempotent. Run again to re-sync after pulling repo updates.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$HOME/.claude/agents"

if [ ! -d "$SCRIPT_DIR/agents" ]; then
  echo "Error: agents/ folder not found relative to install.sh"
  exit 1
fi

mkdir -p "$TARGET"

echo "Installing agents to $TARGET"

for f in "$SCRIPT_DIR/agents/"*.md; do
  name=$(basename "$f")
  if [ -f "$TARGET/$name" ]; then
    if ! diff -q "$f" "$TARGET/$name" > /dev/null; then
      echo "  ⚠  $name already exists with differences. Skipping. Diff with:"
      echo "       diff '$f' '$TARGET/$name'"
      echo "     To overwrite: cp '$f' '$TARGET/$name'"
    else
      echo "  ✓  $name (unchanged)"
    fi
  else
    cp "$f" "$TARGET/$name"
    echo "  ✓  $name (installed)"
  fi
done

# --- references: method playbooks the agents Read at runtime (must be reachable
#     from any cwd, so they install to a fixed path the agent references absolutely) ---
if [ -d "$SCRIPT_DIR/references" ]; then
  REF_TARGET="$HOME/.claude/references"
  mkdir -p "$REF_TARGET"
  echo ""
  echo "Installing references to $REF_TARGET"
  for f in "$SCRIPT_DIR/references/"*.md; do
    [ -e "$f" ] || continue
    name=$(basename "$f")
    cp "$f" "$REF_TARGET/$name"   # overwrite: keep in sync with the repo
    echo "  ✓  $name"
  done
fi

echo ""
echo "Done. Agents available at $TARGET"
