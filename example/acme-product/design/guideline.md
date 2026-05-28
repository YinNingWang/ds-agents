---
name: Acme Design Guideline
version: 1.0
schema: Foundations / Components / Patterns / Principles
last_updated: 2026-05-28
---

# Acme Design Guideline

> Operational SoT for daily UI work. Token values in `./tokens.md`; brand identity in `../brand/`.
> ds-designer enforces this file. ds-reviewer audits code against it.
>
> ⚠ This is an example scaffold. Replace each `<TODO>` with your product specifics.

## How to use this

| Task | Read |
|---|---|
| Write/change UI | Foundations · Components · Patterns |
| Microcopy | Principles → Voice |
| PR review | Components · Patterns · Principles |
| Propose new rule | ds-designer Drift Protocol → Decisions log |

---

# Foundations

## Token Architecture

`<TODO>` Document your theme / palette / token system architecture. Example: theme × palette orthogonal matrix.

## Theme Tokens

| Utility | Use |
|---|---|
| `bg-background` / `bg-card` / `bg-popover` | page / card / overlay |
| `text-text-primary` / `text-text-secondary` | text ladder |

→ Full HEX values: `./tokens.md`

## Palette Tokens

`<TODO>` List your palettes by name. Full HEX in `./tokens.md`.

## Functional Tokens

| Token | Use |
|---|---|
| `--destructive` | Delete / severe error |
| `--warning` | Warning (non-red) |
| ❌ no `success` | (or `<TODO>` if your product allows success state) |

## Typography

`<TODO>` Font stack + scale + weights + line height + tabular nums rule.

## Spacing / Radius / Motion

`<TODO>` Spacing scale (4px base?) · Radius scale · Motion timing.

---

# Components

## Section / List

`<TODO>` Component rules.

## Button

`<TODO>` Variants / sizes / states / disabled treatment.

## Icon

`<TODO>` Icon library + wrapper + stroke width.

## (More components as your product needs)

---

# Patterns

## Visual Constraints

`<TODO>` Document your R1-Rn visual constraints (derived from brand axioms).

| | Rule | Anchor axiom |
|---|---|---|
| **R1** | `<TODO>` | A · Structure |
| **R2** | `<TODO>` | D · Form |

## State Patterns

| State | Pattern |
|---|---|
| Empty (no data) | `<TODO>` |
| Error (network) | `<TODO>` |
| Loading | `<TODO>` |

---

# Principles

## Brand Axioms (4)

→ Single SoT: [`../brand/pillars.md`](../brand/pillars.md)

## Voice / Microcopy

→ Single SoT: [`../brand/brandbook.md`](../brand/brandbook.md) §2 Verbal

## Anti-Patterns

| ❌ | Anchor |
|---|---|
| `<TODO>` | `<TODO>` |
| Hardcoded hex (`bg-[#XXXXXX]`) | Token rule |

## Governance

- **Cool-off rule**: any brand rebrand impulse → 30-day cool-off
- **SoT update path**: Token change → tokens.md + globals.css simultaneously
- **Drift Protocol (ds-designer)**: gap → PAUSE → propose 2-3 options → user approve → write to guideline + append Decisions log

---

# PR Design Review Checklist

- [ ] Aligned with 4 axioms
- [ ] No hardcoded hex (`bg-[#xxx]`)
- [ ] No `dark:` variant (use `data-theme`)
- [ ] (more checks per your product)

---

# References

| Layer | Path |
|---|---|
| Brand (read-only) | [`../brand/`](../brand/) |
| Token SoT | [`./tokens.md`](./tokens.md) |
| Agents | `~/.claude/agents/ds-designer.md` · `ds-reviewer.md` |

---

# Decisions log

> Append-only. `- YYYY-MM-DD: <what> — <why>`

- 2026-05-28: Initial scaffold from ds-agents repo example — to be filled per real product

---

# Open items

> Status: `active` / `pending` / `blocked` / `parked`
> Priority: `P0` / `P1` / `P2` / `infra`

| ID | Priority | What | Where | Status | Discovered |
|---|---|---|---|---|---|
| _empty_ | — | — | — | — | — |
