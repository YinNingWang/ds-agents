---
name: <Product> Design Guideline
version: 0.1
schema: Foundations / Components / Patterns / Principles
last_updated: <date>
---

# <Product> Design Guideline

> Operational SoT for daily UI work. Token values live in `./tokens.md`; brand identity in `../brand/`.
> ds-designer enforces this file. ds-reviewer audits code against it.
>
> ⚠ This is a **starter scaffold**. Sections marked `<TODO>` need filling per your product. Universal principles below are pre-filled and can stay as-is unless your brand explicitly overrides them.

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

`<TODO>` Document your theme / palette / token system architecture. Common pattern: theme × palette orthogonal matrix (one attribute drives surface/text/border, another drives accent/brand colors).

## Theme Tokens

`<TODO>` Map utility names to use cases. Example:

| Utility | Use |
|---|---|
| `bg-background` / `bg-card` / `bg-popover` | page / card / overlay |
| `text-text-primary` / `text-text-secondary` | text ladder |

→ Full HEX values: `./tokens.md`

## Palette Tokens (if any)

`<TODO>` List your palettes by name. Full HEX in `./tokens.md`.

## Functional Tokens

| Token | Use |
|---|---|
| `--destructive` | Delete / severe error |
| `--warning` | Warning (non-red) |
| `success` | `<TODO>` allow or forbid (some brands explicitly forbid to avoid prescriptive UI) |

## Typography

`<TODO>` Font stack + scale + weights + line height. Universal recommendations:
- Numbers: enable tabular nums (`font-feature-settings: 'tnum'`) for any column of numbers
- Avoid extreme weights (700+) unless your brand explicitly calls for it — heavy weight collapses hierarchy

## Spacing / Radius / Motion

`<TODO>` Define your scales. Universal recommendations:
- Spacing on a 4px or 8px base
- Motion respects `prefers-reduced-motion`
- Animation single-pass for events (fade-in, slide-out); bidirectional only for state changes (drawer open/close)

---

# Components

`<TODO>` Document each component your product uses. For each: variants, sizes, states, disabled treatment, a11y baseline.

Common components to cover:
- Section / List
- Button (+ text-link variant)
- Icon (library + wrapper + stroke compensation)
- Form fields (+ pending state)
- Currency / number formatting
- Sheet / Modal
- Date picker
- Toast / Banner

### Component principles (universal — keep unless overriding)

- **Extract on first use, not second.** If "the next surface would use this too" is yes/maybe, extract the reusable component / helper now. Inline-first then refactor accumulates copy-paste drift.
- **Form pending state is first-class.** Use the framework's pending mechanism (e.g., `useFormStatus()`) to auto-disable Save+Cancel during submission. Prevents double-submit at the UI layer — do not solve at server with idempotency keys.
- **Icon wrapper required.** Compensate stroke width for screen-physical consistency (the SVG `strokeWidth` unit is internal to viewBox; same value renders thicker in larger containers).

---

# Patterns

## Visual Constraints

`<TODO>` Document your R1-Rn visual constraints (derived from brand axioms). Example structure:

| | Rule | Anchor axiom |
|---|---|---|
| **R1** | `<TODO>` | A · Structure |
| **R2** | `<TODO>` | D · Form |

## State Patterns

`<TODO>` Define how each state looks. Universal recommendations:

| State | Pattern |
|---|---|
| Empty (no data) | Neutral observation + link to next action. No illustration / mascot. |
| Empty (no permission) | Same as above + permission ask hint. |
| Error (network) | Toast with one-line description + retry button. **Not modal**. |
| Error (validation) | Inline field, restrained tone, no exclamation. |
| Loading (page) | Skeleton, **not** full-screen spinner. |
| Loading (action) | Inline `<Loader/>` + `disabled` on the trigger. |

## Animation

- **Event feedback** (something just happened) → single-pass animation (fade-in, slide-in, expand-then-fade)
- **State change** (something is now in mode X) → bidirectional animation is OK (drawer open/close)
- **Event back-and-forth** (event-then-undo) → usually over-engineering; strip to single-pass

---

# Principles

## Brand Axioms

→ Single SoT: [`../brand/pillars.md`](../brand/pillars.md)

## Voice / Microcopy

→ Single SoT: [`../brand/brandbook.md`](../brand/brandbook.md) §Verbal

## Anti-Patterns (universal — keep unless overriding)

| ❌ | Reason |
|---|---|
| Hardcoded hex (`bg-[#XXXXXX]`) | Token-rule violation; loses theme/palette portability |
| `dark:` variant in stack supporting `data-theme` | Mixed mechanisms drift over time |
| Decorative emoji in product UI | Renders 3 different ways across OS; doesn't inherit token color; breaks stroke/weight consistency |
| Same className ≠ same screen output | Physical-perception rule: contract must trace to user's eye, not to code value (icon stroke, font scaling, container size all distort) |
| Code consistency mistaken for visual consistency | Verify rendered output, not just identical code |
| Build pass treated as visual pass | CSS / token errors often silent at compile time; visual verification in dev environment is required pre-merge |
| Mock copy that violates a brand axiom | Surface the conflict; never silently choose. Three paths: A) rewrite to align, B) loosen axiom via chisel + cool-off, C) defer feature |
| `<TODO>` your product-specific anti-patterns | (e.g., specific imagery, motion, copy style your brand forbids) |

## Governance

- **Cool-off rule**: any brand rebrand impulse → 30-day cool-off. Don't refactor the brand to fit a mock.
- **SoT update path**: token change → `tokens.md` + `globals.css` simultaneously. Never let them drift.
- **Drift Protocol (ds-designer)**: gap → PAUSE → propose 2–3 options → user approves → write decision into appropriate section + append `## Decisions log`. Never invent silently.
- **Token rename**: distinguish CSS var aliases (kept silently for safety) vs utility-class names (kept or removed by grep usage). Declare strategy in commit message.
- **Three legs of the design system**: tokens (atoms) + components (molecules) + **process** (Decisions log + Open items + Drift Protocol). Skipping the third leads to inconsistent decisions accumulating over time.
- **Enforcement strength is layered**: hard prohibitions (agent blocks), recommended patterns (agent suggests, deviations Drift Protocol), optional conventions (informational). Each rule should declare its level.

---

# PR Design Review Checklist

- [ ] Aligned with brand axioms (no axiom violated)
- [ ] No hardcoded hex (`bg-[#xxx]`)
- [ ] No mixed theme mechanism (use one of `data-theme` OR `dark:` variant, not both)
- [ ] No decorative emoji in product UI
- [ ] Token-name change doesn't claim "same visual" without rendered verification
- [ ] Forms have pending state on Save + Cancel
- [ ] State patterns (empty / error / loading) followed
- [ ] A11y: WCAG AA contrast, focus ring, touch target ≥ 44×44 on mobile
- [ ] `<TODO>` add product-specific checks

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
> Written by ds-designer when Drift Protocol triggers, or manually when a design call is made.

- `<date>`: Initial scaffold from ds-agents starter — universal anti-patterns + governance rules adopted as-is

---

# Open items

> Status: `active` (working) / `pending` (waiting input) / `blocked` / `parked`
> Priority: `P0` (must-fix) / `P1` (should-fix) / `P2` (nit) / `infra`

| ID | Priority | What | Where | Status | Discovered |
|---|---|---|---|---|---|
| _empty_ | — | — | — | — | — |
