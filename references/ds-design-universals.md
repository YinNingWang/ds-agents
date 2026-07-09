# Design Universals (ds-designer seed knowledge)

> Cross-project, brand-agnostic design defaults. **ds-designer M1** seeds a new `design/guideline.md` from these so a from-scratch build starts with proven universals instead of a blank page; a brand only needs to fill its `<TODO>` specifics or explicitly override a universal.
>
> "Universal — keep unless overriding": true for most products; a brand may override any single rule via ds-designer Drift Protocol (record the override + why).

## Foundations — universal recommendations

- **Numbers**: enable tabular figures (`font-feature-settings: 'tnum'`) for any column of numbers.
- **Weight**: avoid extreme weights (700+) unless the brand explicitly calls for it — heavy weight collapses hierarchy.
- **Spacing**: on a 4px or 8px base.
- **Motion**: respect `prefers-reduced-motion`. Single-pass for events (fade-in, slide-out); bidirectional only for state changes (drawer open/close).
- **Functional tokens**: `--destructive` (delete / severe error), `--warning` (non-red warning). `success` — decide per brand: some explicitly forbid a success color to avoid prescriptive UI.

## Component principles

- **Extract on first use, not second.** If "the next surface would use this too" is yes/maybe, extract the reusable component/helper now — inline-first-then-refactor accumulates copy-paste drift.
- **Form pending state is first-class.** Use the framework's pending mechanism (e.g. `useFormStatus()`) to auto-disable Save + Cancel during submit. Prevent double-submit at the UI layer, not with server idempotency keys.
- **Icon wrapper required.** Compensate stroke width for screen-physical consistency — the SVG `strokeWidth` unit is internal to the viewBox, so the same value renders thicker in a larger container.

## State patterns

| State | Pattern |
|---|---|
| Empty (no data) | Neutral observation + link to next action. No illustration / mascot. |
| Empty (no permission) | Same + permission-ask hint. |
| Error (network) | Toast, one-line description + retry. **Not a modal.** |
| Error (validation) | Inline on the field, restrained tone, no exclamation. |
| Loading (page) | Skeleton, **not** a full-screen spinner. |
| Loading (action) | Inline loader + `disabled` on the trigger. |

## Animation

- **Event feedback** (something just happened) → single-pass (fade-in, slide-in, expand-then-fade).
- **State change** (now in mode X) → bidirectional is OK (drawer open/close).
- **Event back-and-forth** (event-then-undo) → usually over-engineering; strip to single-pass.

## Anti-patterns

| ❌ | Why |
|---|---|
| Hardcoded hex (`bg-[#XXXXXX]`) | Token-rule violation; loses theme/palette portability. |
| `dark:` variant in a stack that supports `data-theme` | Mixed mechanisms drift over time — pick one. |
| Decorative emoji in product UI | Renders 3 ways across OS; doesn't inherit token color; breaks stroke/weight consistency. |
| "Same className ⇒ same screen output" | Physical-perception rule: the contract must trace to the user's eye, not the code value (icon stroke, font scaling, container size all distort). |
| Code consistency mistaken for visual consistency | Verify rendered output, not just identical code. |
| Build-pass treated as visual-pass | Token/CSS errors are often silent at compile time; visual verification in dev is required pre-merge. |
| Mock copy that violates a brand axiom | Surface the conflict; never silently choose. Three paths: A) rewrite to align, B) loosen the axiom via chisel + cool-off, C) defer the feature. |

## Governance

- **Cool-off**: any rebrand impulse → 30-day cool-off. Don't refactor the brand to fit a mock.
- **SoT update path**: a token change touches `tokens.md` + `globals.css` simultaneously — never let them drift.
- **Drift Protocol** (ds-designer): gap → PAUSE → propose 2–3 options → user approves → write the decision into the right section + append `## Decisions log`. Never invent silently.
- **Token rename**: distinguish CSS-var aliases (keep silently for safety) from utility-class names (keep or remove by grep usage). Declare the strategy in the commit message.
- **Three legs**: tokens (atoms) + components (molecules) + **process** (Decisions log + Open items + Drift Protocol). Skip the third and inconsistent decisions accumulate.
- **Layered enforcement**: hard prohibitions (agent blocks) / recommended patterns (agent suggests, deviation → Drift Protocol) / optional conventions (informational). Each rule declares its level.

## PR design-review checklist (universal core)

- [ ] Aligned with brand axioms (none violated)
- [ ] No hardcoded hex
- [ ] One theme mechanism only (`data-theme` OR `dark:`, not both)
- [ ] No decorative emoji in product UI
- [ ] Token-name change doesn't claim "same visual" without rendered verification
- [ ] Forms have a pending state on Save + Cancel
- [ ] State patterns (empty / error / loading) followed
- [ ] A11y: WCAG AA contrast, focus ring, touch target ≥ 44×44 on mobile
- [ ] + product-specific checks
