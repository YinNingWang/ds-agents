# ds-agents — Design System Agents for Claude Code

> 中文版 → [README.md](./README.md)

Three Claude Code agents + a starter scaffold + two skills for solo founders & small teams running a brand-aware design system.

---

## 🚀 Quick start

### 1. `agents/` — three agents (install or load on demand)

- **`ds-designer.md`** → builds & maintains `<repo>/design/guideline.md`. Spawn when bootstrapping or maintaining a design system.
- **`ds-reviewer.md`** → read-only design QA. Spawn after a feature is built / pre-merge.
- **`tdd-developer.md`** → engineering agent with TDD discipline + auto-loads design context. Used during daily feature work. PAUSEs and escalates to ds-designer when it hits a design gap. ⚠ Note: borrowed from an RD colleague's setup, **not yet personally dogfooded — treat as experimental**.

### 2. `skills/` — two prompts you paste into an AI session

- **`_skill_design-handoff.md`** → paste into **Claude Design**. It produces a complete PRD handoff bundle: asks where your codebase is, reads the stack and naming conventions, then produces a `handoff.zip` tailored to that codebase for Claude Code to consume.
- **`stage-0-visual-audit.md`** → paste into **Claude Code**. Audits brand-vs-code visual drift in an existing codebase. **Only useful when "codebase + brand already exist" and you want to find the gap**.

### 3. `starter/` — initial design system scaffold

When bootstrapping from zero, **copy the entire `starter/` folder into your repo** (rename to your product), then let ds-designer modify and extend. Pre-loaded with universal anti-patterns + governance scaffold so you don't reinvent the wheel.

---

## 📋 When to use what

| Situation | Use | Why |
|---|---|---|
| Just chiseled brand, bootstrapping design system | **`starter/` (copy in)** or **`ds-designer` M1 bootstrap** | starter = fast (5 min copy + edit); M1 = interview-style (30-60 min, more tailored) |
| Existing codebase + brand exists, want to see drift | **`skills/stage-0-visual-audit.md`** (paste into Claude Code session) | One-time audit, produces drift report; feed result into ds-designer |
| Design SoT exists, writing a feature | **`tdd-developer`** | Step 0 auto-reads guideline, TDD writes + applies established tokens / components |
| Mid-implementation hits a design gap | **`tdd-developer` auto-escalates → `ds-designer` Drift Protocol** | tdd-developer doesn't invent design decisions; PAUSE → ds-designer proposes options → you decide → written to guideline + Decisions log → tdd-developer resumes |
| PR pre-merge / want to audit an existing component | **`ds-reviewer`** | Read-only, produces P0/P1/P2 report, never modifies code |
| Visual exploration via Claude Design, handing off to Claude Code dev | **`skills/_skill_design-handoff.md`** (paste into Claude Design) | Claude Design runs the 6-phase workflow to produce a handoff bundle |
| Pure refactor of existing code (no UI change) | **`tdd-developer` only** | No design change, no need for ds-designer / ds-reviewer |

---

## Why this repo exists

Running multiple side projects as a solo founder, the recurring pain points are:
- Brand docs scatter (vault / Notion / repo root / Figma comments)
- Design system drifts from brand (spec changes don't sync to code, or vice versa)
- Each new project reinvents the structure

This repo distills one real run into: fixed folder structure + agent contract + starter scaffold + universal anti-patterns. From the second project onwards, it's a copy-and-adapt job.

**Not a design system theory**. A grounded SOP that survived one real shipment.

---

## Concept

```
<your-product-repo>/
├── brand/              ← strategic identity (ds-designer read-only)
│   ├── brandbook.md       full brand book (Strategy + Voice + Personality)
│   ├── pillars.md         4 axioms / archetype / verbs / manifesto (1-page card)
│   ├── evolution.md       change log (active / pending / rejected / queue)
│   ├── audit.md           self-audit report (frozen by date, optional)
│   └── chisel-skill.md    chisel methodology meta-doc (optional)
├── design/             ← code-coupled implementation
│   ├── guideline.md       ★ Foundations / Components / Patterns / Principles
│   ├── tokens.md          ★ CSS variables + Tailwind name spec
│   ├── README.md
│   └── stage-0/           (optional) one-time codebase audit history
└── src/...
```

**Two folders, clear concerns**:

- **brand/** = strategic identity. Quarterly/half-yearly cadence. Agents **never write here**. Portable across projects.
- **design/** = code-coupled implementation. Per-PR cadence. ds-designer writes, ds-reviewer reads.

### Out of scope for this repo (define your own)

- **Brand content** — that's a separate tool's job (use Brand Book Skill or chisel your own). This repo does not vendor brand content.
- **Develop guideline** (PR flow / commit format / branch strategy / review checklist) — team governance, varies per team. Lives in your `<repo>/CLAUDE.md` or `CONTRIBUTING.md`.

---

## Install

```bash
git clone https://github.com/YinNingWang/ds-agents.git ~/sandbox/ds-agents
cd ~/sandbox/ds-agents
./install.sh
```

`install.sh` copies `agents/*.md` into `~/.claude/agents/` (Claude Code's user-level agent directory).

`skills/` and `starter/` are **not** auto-installed:
- `skills/` are prompt templates — copy contents into an AI session when needed
- `starter/` is a scaffold — copy the whole folder into your repo when needed

---

## Schema contract

`design/guideline.md` MUST use this top-level structure for ds-designer / ds-reviewer to work:

```
# <Product> Design Guideline

## How to use this
## Foundations
## Components
## Patterns
## Principles
## PR Design Review Checklist
## References
## Decisions log     ← append-only, ds-designer Drift Protocol writes here
## Open items        ← active backlog, ds-reviewer findings written here
```

`design/tokens.md` MUST contain CSS variable definitions + Tailwind extend snippet — the source of truth for `globals.css`.

→ `starter/design/guideline.md` already follows this schema + has universal anti-patterns baked in. Copy and adapt.

---

## ⚠ One current inconvenience

**Plain version**: In theory, Claude Code should be able to programmatically spawn your custom agents from the main session — but it doesn't yet. So the three agents in this repo **can't be invoked via the `Agent` tool with one click**. You'll need a small workaround.

The detail: Claude Code's 6 built-in agents (claude / Explore / Plan, etc.) are callable programmatically, but agents you place in `~/.claude/agents/` yourself (including this repo's three) currently can't be auto-spawned that way.

**Three workarounds** (all functional, just a bit manual):

1. **Simplest · let the main session embody it**
   In a Claude Code session, paste the agent's content and ask the main session to "follow this spec." This works **best for read-only agents like ds-reviewer**, which don't need context isolation.

2. **Wrap as a skill**
   Put the agent spec inside `~/.claude/skills/<name>/SKILL.md` and invoke via a skill trigger.
   Trade-off: execution semantics differ from a true subagent (skills aren't isolated processes).

3. **Open a fresh session**
   For context isolation, open a new Claude Code session and paste the agent spec + what you want it to do.

**Will future migration hurt?**
No. When Claude Code supports user-defined agent programmatic spawn, the existing agent specs **don't need to change** — you can flip the invocation method without rewriting anything.

---

## Versioning

- **patch** (`v0.1.x`) — typo / wording fix
- **minor** (`v0.x.0`) — new agent / skill / starter / additive change
- **major** (`v1.0.0`) — schema break

Currently `v0.2.0` — sealed from a single dogfood reference run.

---

## Roadmap

- [ ] Skill wrapper per agent (programmatic-spawn workaround)
- [ ] Cross-project test harness — run ds-reviewer against a fixed-snapshot example codebase
- [ ] More starter scaffolds (different stacks: SvelteKit + Tailwind, Astro + UnoCSS, etc.)
- [ ] Brand Book Skill integration (chisel output direct into `<repo>/brand/`)
- [ ] N=2 dogfood run on a different product → distill v2 patterns

---

## Contributing

Welcome PRs:
- Starter scaffold variants for different stacks
- New agents that fit the brand/+design/ contract
- Additions to universal anti-patterns / governance in the starter

---

## License

MIT — see [`LICENSE`](./LICENSE).

---

*Made for Taiwan solo / small-team product folks who run Claude Code.*
