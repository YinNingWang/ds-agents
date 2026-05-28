#!/usr/bin/env bash
# install.sh — copy ds-agents to ~/.claude/agents/
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

echo ""
echo "Done. Agents available at $TARGET"
echo ""
echo "Note: as of 2026-05, user-level agents are not yet callable via the"
echo "Agent tool subagent_type. They run via inline embodiment or Skill wrapper."
echo "See README.md §'Programmatic spawn' for details."
