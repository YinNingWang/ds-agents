# Acme · design/

> Code-coupled design implementation. Strategy in sibling `../brand/`.

## Contents

| File | Required | Role |
|---|---|---|
| `guideline.md` | **yes** | Operational SoT — Foundations / Components / Patterns / Principles |
| `tokens.md` | **yes** | CSS variables + Tailwind name spec (the SoT for globals.css) |
| `README.md` | recommended | this file |
| `stage-0/` | as needed | one-time codebase visual audit history |

## Schema contract

`guideline.md` MUST use these top-level sections (ds-designer requires this schema):

```
## How to use this
## Foundations
## Components
## Patterns
## Principles
## PR Design Review Checklist
## References
## Decisions log    ← append-only
## Open items       ← active backlog
```

`tokens.md` MUST contain CSS variables (in `:root[data-theme="..."]` blocks) + Tailwind extend snippet.

## Walk-in order

1. Read `guideline.md` Foundations → Components → Patterns → Principles
2. Need token HEX / full spec → `tokens.md`
3. Audit existing pages → `../../patterns/stage-0-visual-audit-template.md`
4. Rule conflict / propose new rule → trace back to `../brand/brandbook.md` + `../brand/evolution.md`
