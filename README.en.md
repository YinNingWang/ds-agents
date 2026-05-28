# ds-agents — Design System Agents for Claude Code

> 中文版 → [README.md](./README.md)

Three Claude Code agents + four cross-project patterns for solo founders & small teams running a brand-aware design system.

```
agents/
├── ds-designer.md      build & enforce <repo>/design/guideline.md
├── ds-reviewer.md      read-only design QA against the guideline
└── tdd-developer.md    TDD methodology + auto-loads design context
patterns/
├── brand-design-folder-pattern.md      <repo>/brand/ + <repo>/design/ scaffold convention
├── refactor-workflow.md                6-phase governance for docs/folder reorganization
├── stage-0-visual-audit-template.md    prompt template for codebase→brand drift audit
├── claude-design-handoff-recipe.md     user-side playbook for Claude Design → Claude Code handoff
└── claude-design-handoff-flow.md       33 patterns extracted from a real handoff run
skills/
└── _skill_design-handoff.md            Claude Design-side skill spec (the 6-phase workflow)
example/
└── acme-product/                       minimal brand + design folder scaffold
```

---

## Concept

```
<your-product-repo>/
├── brand/              ← strategic identity (read-only by ds-designer)
│   ├── brandbook.md
│   ├── pillars.md
│   ├── evolution.md
│   ├── audit.md
│   └── chisel-skill.md
├── design/             ← code-coupled implementation
│   ├── guideline.md    (★ Foundations / Components / Patterns / Principles)
│   ├── tokens.md       (★ CSS variables + Tailwind names)
│   ├── README.md
│   └── stage-0/        (one-time bootstrap audit, optional)
└── src/...
```

Two folders, clear concerns:
- **brand/** = strategic identity. Updates quarterly. Read-only by agents. Portable across projects.
- **design/** = code-coupled implementation. Updates per-PR. Written by ds-designer, audited by ds-reviewer.

---

## Install

```bash
git clone https://github.com/YinNingWang/ds-agents.git ~/sandbox/ds-agents
cd ~/sandbox/ds-agents
./install.sh
```

The script copies `agents/*.md` to `~/.claude/agents/` (Claude Code user-level agents directory).

Patterns (in `patterns/`) are reference docs — read them, or copy what's useful to your vault / wiki.

---

## How to use

### First time on a new product

1. **Bootstrap brand/** — write `brand/brandbook.md` (Strategy + Voice + Personality). Use whatever method works: from-scratch chisel, Brand Book Skill, existing identity docs. Result lives under `<repo>/brand/`.

2. **(Optional) Stage 0 audit** — if there's an existing codebase with visual drift from brand, run `patterns/stage-0-visual-audit-template.md`. Output → `<repo>/design/stage-0/audit-<product>.md`.

3. **Spawn ds-designer in M1 (bootstrap) mode** — agent reads `brand/`, inventories existing tokens/styles, drafts `design/guideline.md` + `tokens.md` + `README.md`. Grilling on undefined essentials.

4. **From here**:
   - Every UI/component PR → ds-designer enforces (M2 mode)
   - Every pre-merge → ds-reviewer audits
   - Any design gap → Drift Protocol writes decision into `guideline.md` `## Decisions log`
   - Open findings → `## Open items` table tracks across sessions

### Claude Design handoff

If you also use Claude Design (cloud product) for visual exploration → handoff output to Claude Code dev:
- **User-side playbook**: `patterns/claude-design-handoff-recipe.md` (how to brief Claude Design + what to load in Claude Code)
- **Claude Design-side skill spec**: `skills/_skill_design-handoff.md` (the 6-phase workflow Claude Design runs internally)
- **Pattern catalog**: `patterns/claude-design-handoff-flow.md` (33 patterns from a real handoff run)

---

## Schema contract

`design/guideline.md` MUST use this top-level structure for ds-designer / ds-reviewer to work:

```
# <Product> Design Guideline

## How to use this

## Foundations
  (tokens architecture, theme×palette, typography, spacing, motion)

## Components
  (Button, Section, Icon, Currency, Sheet, ...)

## Patterns
  (visual constraints R1-Rn, state patterns, interactions)

## Principles
  (brand axioms pointer, voice pointer, anti-patterns, governance)

## PR Design Review Checklist

## References

## Decisions log     ← append-only, written by ds-designer Drift Protocol

## Open items        ← active backlog, written by ds-reviewer findings
```

`design/tokens.md` MUST contain CSS variable definitions + Tailwind extend snippet. It's the SoT for `globals.css`.

---

## Programmatic spawn — current state

⚠️ **Known limitation**: As of 2026-05, Claude Code's `Agent` tool `subagent_type` parameter only accepts built-in types (claude / claude-code-guide / Explore / general-purpose / Plan / statusline-setup). User-defined agents in `~/.claude/agents/` are **not** yet discoverable through `Agent` tool.

**Current workarounds**:
1. **Inline run** (recommended for read-only agents like ds-reviewer): embody the agent spec in the main Claude session and execute its steps directly.
2. **Skill wrapper**: wrap an agent spec inside `~/.claude/skills/<name>/SKILL.md` so it's invokable via the `Skill` tool. Trade-off: changes execution semantics (Skills aren't isolated subagents).
3. **Manual handoff**: open a new Claude Code session, paste the agent spec + scope, run interactively.

**Status of agents in this repo**:
- ✅ All three agents work via **inline run** in a Claude Code session.
- ❌ None work yet via `Agent` tool programmatic spawn.
- Tracking: contribute observations to `~/.claude/agents/` ecosystem; flip to programmatic when Claude Code supports user-defined `subagent_type` registration.

---

## Compatibility

- **Claude Code**: tested on `claude-opus-4-7` (1M context). Agents reference `claude-opus-4-7` and `claude-sonnet-4-6` in their frontmatter.
- **Project stack**: agnostic, but patterns include examples for Next.js + Tailwind + shadcn (the dogfood reference run).
- **Vault / wiki**: patterns reference vault wikilinks `[[...]]` in the original — sanitized to plain markdown in this repo. If you keep an Obsidian vault, you may want to maintain a private mirror with wikilinks intact.

---

## Versioning

This repo follows loose semver:
- **patch** (`v0.1.x`) — typo / wording fix
- **minor** (`v0.x.0`) — new agent / pattern / additive change
- **major** (`v1.0.0`) — schema break (e.g., guideline.md required section names change)

Currently `v0.1.0` — sealed from Coplot Run #1 dogfood (2026-05-28).

---

## Roadmap

- [ ] Skill wrappers for each agent (programmatic spawn workaround — see "Programmatic spawn" above)
- [ ] Cross-project test harness — spawn ds-reviewer against a fixed-snapshot example codebase
- [ ] More example products (different stacks: SvelteKit + Tailwind, Astro + UnoCSS, etc.)
- [ ] `Brand Book Skill` integration (auto-output into `<repo>/brand/`)
- [ ] N=2 dogfood run on a different product → distill v2 patterns

---

## Contributing

This started as one founder's design system tooling. PRs that:
- Add real reference runs (with permission) extending the pattern catalog → welcome.
- Generalize examples without losing concrete actionability → welcome.
- Add new agents that fit the brand/+design/ contract → welcome.

---

## License

MIT — see `LICENSE`.
