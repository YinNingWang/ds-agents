# Acme · brand/

> Product identity layer. Read-only by `ds-designer` agent.
> Implementation lives in sibling `../design/`.

## Contents

| File | Required | Role |
|---|---|---|
| `brandbook.md` | **yes** | Strategy + Voice + Personality + Versioning + Anti-Impulse |
| `pillars.md` | recommended | 4 axioms / archetype / verbs / manifesto — 1-page card |
| `evolution.md` | recommended | change board with active / pending / rejected / queue states |
| `audit.md` | as needed | self-audit reports (frozen per audit date) |
| `chisel-skill.md` | as needed | brand chisel methodology meta-doc |
| `README.md` | recommended | this file |

## ds-designer contract

ds-designer (`~/.claude/agents/ds-designer.md`) expects:
- `<repo>/brand/` exists
- This folder is **read-only** by the agent
- Voice + pillars internalized before any UI work

ds-designer will never edit files here. User changes here drive subsequent re-runs of ds-designer.
