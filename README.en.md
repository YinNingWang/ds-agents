# ds-agents — Design System Agents for Claude Code

> Claude Code agents for solo founders / small teams. They set a clear division of labour between **brand** and **design**, so AI anchors on your brand rules whenever it writes UI code — and once a surface is finalized, archives the code back into Figma.
>
> 中文版 → [README.md](./README.md)

---

## You might have hit this problem

Every time you spin up a new side project, somewhere mid-build you wonder:

- "Where do my brand rules actually live? vault? Notion? repo root? or only in Figma comments?"
- "This component the AI wrote — are the colors and spacing from my brand, or did it just make them up?"
- "The spec changed last week and the code didn't follow — which one is authoritative now?"
- "Every new project I re-scaffold the same folders. Tedious."

These aren't the AI being weak — it just **doesn't know where your brand rules live or which one to obey**. ds-agents pins that down: a fixed folder layout + a clear division of labour between agents, so AI **anchors on your brand** whenever it writes code.

This repo distills one real run into a fixed folder structure + agent contract + universal design knowledge (`references/`). **Not design-system theory** — a grounded SOP that survived one real shipment. From the second project onwards it's copy-and-adapt.

---

## What you get after installing

- **AI writes UI aligned to your brand** — ds-designer reads your `design/guideline.md` before touching a component; no more made-up color values, spacing, radii
- **Drift gets caught** — when spec and code diverge, ds-reviewer flags it before merge (P0/P1/P2)
- **New projects start in seconds** — fixed schema + seeded universal knowledge; you only fill product-specific `<TODO>`s
- **Finalized code archives back to Figma** — once a surface is locked, rebuild the code into Figma as a design-of-record

---

## First: skill vs agent (and which this repo uses)

The two things most beginners confuse in Claude Code. In one line:

- **agent** = an **executor with its own identity and system prompt**. You (or the main session) hand it a task; it runs in isolated context and reports back. That's mainly what ds-agents is — the four: `ds-designer` / `tdd-developer` / `ds-reviewer` / `ds-figma-archivist`.
- **skill** = an **instruction / knowledge template loaded into the current session when triggered**, telling whoever's running to "follow this SOP" (some skills can also run in a subagent).

This repo **installs agents** (into `~/.claude/agents/`); it also ships a few **skill templates** (prompt templates, copy-paste when needed, not auto-installed). Which agent to call when → see "When to use which" below.

---

## Concept

```
<your-product-repo>/
├── brand/              ← strategic identity (ds-designer read-only)
│   ├── brandbook.md       full brand book (Strategy + Voice + Personality)
│   ├── pillars.md         4 axioms / archetype / verbs / manifesto (condensed)
│   ├── evolution.md       brand change log (active / pending / rejected / queue)
│   ├── audit.md           self-audit report (frozen by date, optional)
│   └── chisel-skill.md    brand chisel methodology (meta, optional)
├── design/             ← code-coupled implementation
│   ├── guideline.md       ★ Foundations / Components / Patterns / Principles
│   ├── tokens.md          ★ CSS variables + Tailwind name spec
│   ├── figma-archive.md   (when using ds-figma-archivist) this product's Figma archive answers
│   └── README.md
└── src/...
```

**Two folders, clear concerns**:

- **brand/** = strategic identity. Quarterly/half-yearly cadence. Agents **never write here**. Portable across projects as a bundle.
- **design/** = code-coupled implementation. May change per PR. ds-designer writes, ds-reviewer reads.

### Out of scope for this repo (define your own)

- **Brand content** — brand chisel is a separate tool's job (use Brand Book Skill or chisel your own). This repo does not vendor brand content.
- **Develop guideline** (PR flow / commit format / branch strategy / review checklist) — team governance, varies per team. Lives in your `<repo>/CLAUDE.md` or `CONTRIBUTING.md`.

---

## 🗺️ When to use which (at a glance)

```mermaid
flowchart LR
  A["design SoT + UI feature<br/>ds-designer"] --> C
  B["logic/data feature · refactor<br/>tdd-developer"] --> C
  B -. design gap .-> A
  C["pre-merge QA · read-only<br/>ds-reviewer"] --> D["finalized code→Figma · standalone<br/>ds-figma-archivist"]
```

- **ds-designer** — build / maintain the design SoT (`design/guideline.md`) **+ UI / component features** (M2 enforce, apply existing tokens/components). Start from zero via M1 bootstrap (seeds universal knowledge, see Schema below).
- **tdd-developer** — **logic / data features + pure refactors** (no UI, input→output, TDD); auto-escalates back to ds-designer on a design gap.
- **ds-reviewer** — pre-merge read-only QA, emits P0/P1/P2 against the guideline.
- **ds-figma-archivist** — after a surface is **finalized**, rebuilds the code back into Figma as an archive; standalone, not part of the pipeline above (mechanism below).

## 📋 skills + kickoff (what the diagram can't show)

> "Which agent when" is the diagram above. This table only lists the kickoff / skill steps the diagram can't draw.

| Situation | Use | Why |
|---|---|---|
| Just chiseled brand, bootstrapping a design system | **`ds-designer` M1 bootstrap** | interview-style guideline build, seeds universal knowledge, you only fill product-specific `<TODO>` (details in Schema) |
| Visual exploration via Claude Design, handing off to Claude Code dev | **`skills/_skill_design-handoff.md`** (feed to Claude Design) | Claude Design runs a 6-phase workflow to produce a handoff bundle for Claude Code (cross-tool, agents can't replace it) |

---

## Install

```bash
git clone https://github.com/YinNingWang/ds-agents.git ~/sandbox/ds-agents
cd ~/sandbox/ds-agents
./install.sh
```

`install.sh` installs two things:
- `agents/*.md` → `~/.claude/agents/` (Claude Code's user-level agent directory)
- `references/*.md` → `~/.claude/references/` (method playbooks + design universals the agents read at runtime)

`tools/` and `skills/` are **not** auto-installed:
- `tools/` (flow-walker capture harness) runs from the repo (`cd tools/flow-walker && npm install`)
- `skills/` are prompt templates — copy the content into an AI session when needed

> **Why `~/.claude/` holds only agents + references, not tools (intentional, not a missing step)**: things agents **read** (playbooks / universals) get installed to a fixed path so they're reachable from any cwd; the tools agents **run** (the harness) stay in the repo.

---

## Schema contract (important — this is what agents recognize)

`design/guideline.md` **MUST** use this schema for ds-designer / ds-reviewer to work:

```
# <Product> Design Guideline

## How to use this
## Foundations
  (token architecture, theme×palette, typography, spacing, motion)
## Components
  (Button, Section, Icon, Currency, Sheet…)
## Patterns
  (visual constraints R1-Rn, state patterns, interaction patterns)
## Principles
  (brand axioms pointer, voice pointer, anti-patterns, governance)
## PR Design Review Checklist
## References
## Decisions log     ← append-only, ds-designer Drift Protocol writes here
## Open items        ← active backlog, ds-reviewer findings written here
```

`design/tokens.md` **MUST** contain CSS variable definitions + Tailwind extend snippet — the source of truth for `globals.css`.

→ No manual copying: **ds-designer M1 bootstrap builds to this schema**, seeding universal knowledge from `references/ds-design-universals.md` (component principles / state patterns / anti-patterns / governance / PR checklist); you only fill product-specific `<TODO>`s.

---

## 🧭 How ds-figma-archivist works

```mermaid
flowchart LR
  You(["You / orchestrator"]) -->|spawn + scope| A["ds-figma-archivist<br/>(thin agent)"]
  subgraph reads["agent reads — never guesses"]
    PB["playbook<br/>method · the questions"]
    SoT["project SoT<br/>design/figma-archive.md · the answers"]
    DT["dev-truth<br/>screenshots + computed metrics"]
  end
  PB --> A
  SoT --> A
  DT --> A
  Code["running app<br/>(code = source of truth)"] --> FW["flow-walker<br/>harness + project config"]
  FW -->|force each UI state| DT
  A -->|use_figma| MCP["Figma MCP"]
  MCP -->|reuse DS components · write frames| FIG["Figma file<br/>(design-of-record archive)"]
  A -. build .-> CR["independent critic<br/>(objective metrics diff)"]
  CR -. divergences → fix .-> A
```

Four parts, each in its place:

- **agent (thin)** (`agents/`) — orchestrates only; reads playbook + project SoT + dev-truth, drives the Figma MCP. Holds no depth.
- **playbook** (`references/`) — universal method / questions (first principles + a Figma MCP call-shape appendix). Cross-project.
- **project SoT** (`<repo>/design/figma-archive.md`) — this product's answers (file key / components / frame sizes / decisions). Cross-session.
- **flow-walker** (`tools/`) — universal harness + project config, drives the app to produce dev-truth (screenshots + computed metrics, so metrics are *measured, not estimated*).

> playbook carries the questions, project SoT carries the answers, flow-walker supplies dev truth, the agent assembles into Figma, an independent critic verifies objectively.

---

## ⚠ One historical limitation (resolved)

> **[Update 2026-07] Largely resolved** — Claude Code now supports programmatically spawning user-defined agents via the `Agent` tool's `subagent_type` (this repo's agents are confirmed directly callable). Kept below as history / fallback reference.

Early on, Claude Code couldn't auto-spawn custom agents from the main session, so this repo's agents needed a workaround. Downgrade workarounds (mostly unneeded now):

1. **Let the main session embody it** — paste the agent content into the session and ask it to "follow this spec." Smoothest for read-only agents like ds-reviewer, which just read files and produce a report.
2. **Wrap as a skill** — put the agent spec in `~/.claude/skills/<name>/SKILL.md` and trigger via skill (semantics differ from a true subagent).
3. **Open a fresh session** — for context isolation, open a new session and paste the spec + task.

---

## Versioning

- **patch** (`v0.1.x`) — wording fixes
- **minor** (`v0.x.0`) — new agent / skill / reference / additive change
- **major** (`v1.0.0`) — schema break (e.g. required `guideline.md` section names change)

---

## Roadmap

- [ ] Cross-project test harness — run ds-reviewer against a fixed-snapshot example codebase
- [ ] Brand Book Skill integration: chisel output direct into `<repo>/brand/`
- [ ] N=2 dogfood on a different product (incl. flow-walker config) → distill v2 patterns + a universal config template

---

## Contributing

Welcome PRs:
- New agents that fit the brand/ + design/ contract
- Additions to universal design knowledge in `references/ds-design-universals.md`
- flow-walker config examples for different stacks

---

## FAQ

**Q: Do I have to run `install.sh`?**
Yes — if you want the agents callable from any project. It does just two things: copies `agents/*.md` into `~/.claude/agents/` and `references/*.md` into `~/.claude/references/`. `tools/` and `skills/` are deliberately not installed (see Install).

**Q: How are these different from Claude Code's built-in `/agents`?**
Built-ins are general assistants; these four are **bound to the `brand/` + `design/` contract** — ds-designer must read your guideline before writing code, ds-reviewer audits against it line by line. The difference is they know your brand rules.

**Q: How do I move this to the next project?**
`brand/` is portable as a bundle (strategic identity is cross-project); `design/` is per-product, rebuilt via ds-designer M1 bootstrap against the schema. The agents themselves live globally in `~/.claude/`, so no reinstall.

**Q: Do I need a brand book first?**
No. With no guideline, ds-designer runs M1 bootstrap to build it interview-style; brand chisel is a separate tool's job (see Out of scope).

---

## License

MIT — see [`LICENSE`](./LICENSE).

---

*Made for Taiwan solo / small-team product folks who run Claude Code.*
