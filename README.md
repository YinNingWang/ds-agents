# ds-agents — Claude Code 設計系統 agent

> 給 solo founder / 小團隊用的 Claude Code agent + 跨專案 pattern。在 brand 跟 design 之間建立明確分工，讓 AI 寫 UI code 時自動 anchor 在你的品牌規則上。
>
> English version → [README.en.md](./README.en.md)

```
agents/
├── ds-designer.md      建立 + 維護 <repo>/design/guideline.md
├── ds-reviewer.md      read-only 設計 QA，對照 guideline 跑 audit
└── tdd-developer.md    TDD 方法論 + 自動載入設計 context
patterns/
├── brand-design-folder-pattern.md      <repo>/brand/ + <repo>/design/ 資料夾結構慣例
├── refactor-workflow.md                6 階段 governance（搬檔 / 重組 / consolidate docs）
├── stage-0-visual-audit-template.md    既有 codebase 對照 brand 視覺 drift 的 audit prompt
├── claude-design-handoff-recipe.md     user-side playbook：怎麼下指令給 Claude Design + 怎麼接到 Claude Code
└── claude-design-handoff-flow.md       從真實 handoff run 萃取的 33 條 pattern
skills/
└── _skill_design-handoff.md            Claude Design 端 skill spec（6-phase workflow）
example/
└── acme-product/                       fictional brand + design scaffold（給你照抄結構用）
```

---

## 概念

```
<你的產品 repo>/
├── brand/              ← 策略 / 品牌身份（ds-designer read-only）
│   ├── brandbook.md       完整 brand book（Strategy + Voice + Personality）
│   ├── pillars.md         4 axioms / archetype / verbs / manifesto 精煉版
│   ├── evolution.md       brand 變更紀錄（含 active / pending / rejected / queue）
│   ├── audit.md           自審報告（frozen by date）
│   └── chisel-skill.md    brand chisel 方法論（meta，optional）
├── design/             ← 程式碼綁定的實作層
│   ├── guideline.md       ★ Foundations / Components / Patterns / Principles 4 大段 schema
│   ├── tokens.md          ★ CSS variable + Tailwind name 完整 spec
│   ├── README.md
│   └── stage-0/           （optional）一次性 codebase audit 歷史
└── src/...
```

**兩個資料夾，職責分清楚**：

- **brand/** = 策略身份。季 / 半年才更新一次。agent **不會寫**。跨 project 可整包搬走。
- **design/** = 程式碼綁定的實作層。每個 PR 都可能動。ds-designer 寫，ds-reviewer 讀。

---

## 安裝

```bash
git clone https://github.com/YinNingWang/ds-agents.git ~/sandbox/ds-agents
cd ~/sandbox/ds-agents
./install.sh
```

`install.sh` 會把 `agents/*.md` 複製到 `~/.claude/agents/`（Claude Code 的 user-level agent 目錄）。

`patterns/` 是參考文件，**不會自動安裝**。讀完後決定哪些要套用 / 複製到你自己的 vault / wiki。

---

## 怎麼用

### 一個新 product 起手

1. **先有 brand/** — 寫 `brand/brandbook.md`（Strategy + Voice + Personality）。怎麼來都行：自己 chisel、用 Brand Book Skill、既有 brand 文件搬進來。輸出位置固定 `<repo>/brand/`。

2. **（選做）跑 Stage 0 audit** — 如果已有 codebase 且視覺跟 brand 有 drift，把 `patterns/stage-0-visual-audit-template.md` 整份貼進 Claude Code session，跑完輸出存 `<repo>/design/stage-0/audit-<產品名>.md`。

3. **Spawn ds-designer 進 M1 (bootstrap) mode** — agent 讀 `brand/`、盤點既有 token / style、起草 `design/guideline.md` + `tokens.md` + `README.md`。途中會逼問你 undefined 的關鍵 essentials。

4. **建好之後的日常**：
   - 每個 UI / component PR → ds-designer enforce（M2 mode）
   - 每個 pre-merge → ds-reviewer audit
   - 任何設計 gap → Drift Protocol 把 decision 寫進 `guideline.md` `## Decisions log`
   - 未決開放項 → `## Open items` table 跨 session 追蹤

### Claude Design handoff（你同時用 Claude Design 雲端做視覺探索）

如果你也用 Claude Design 跑視覺探索，產出要交給 Claude Code dev：
- **User-side playbook**：`patterns/claude-design-handoff-recipe.md`（怎麼餵 brief 給 Claude Design + Claude Code 開 session 前該載什麼）
- **Claude Design-side skill spec**：`skills/_skill_design-handoff.md`（Claude Design 跑這個 skill 的 6-phase workflow）
- **Pattern catalog**：`patterns/claude-design-handoff-flow.md`（33 條從真實 handoff run 萃取的 pattern）

---

## Schema 合約（重要 — agent 認的是這個）

`design/guideline.md` **必須**用以下 schema，ds-designer / ds-reviewer 才能 work：

```
# <產品名> Design Guideline

## How to use this

## Foundations
  （token 架構、theme×palette、typography、spacing、motion）

## Components
  （Button、Section、Icon、Currency、Sheet…）

## Patterns
  （visual constraints R1-Rn、state pattern、互動 pattern）

## Principles
  （brand axioms pointer、voice pointer、anti-patterns、governance）

## PR Design Review Checklist

## References

## Decisions log     ← append-only，ds-designer Drift Protocol 寫入
## Open items        ← 活躍 backlog，ds-reviewer findings 寫入
```

`design/tokens.md` **必須**包含 CSS variable 定義 + Tailwind extend snippet — 它是 `globals.css` 的 source of truth。

---

## ⚠ 已知限制 · agent 程式化呼叫

截至 2026-05，Claude Code 的 `Agent` tool 的 `subagent_type` 參數 **只接受 6 個 built-in**（claude / claude-code-guide / Explore / general-purpose / Plan / statusline-setup）。
`~/.claude/agents/` 下的 user-defined agent **目前無法**透過 `Agent` tool 程式化 spawn。

**目前可用的 3 條 workaround**：

1. **Inline run（推薦給 read-only agent，例如 ds-reviewer）**：
   主 Claude session 直接讀 agent spec、內化、按 spec 步驟執行。

2. **Skill wrapper**：
   把 agent spec 包進 `~/.claude/skills/<name>/SKILL.md`，透過 `Skill` tool 呼叫。trade-off：執行 semantics 不同（skill 不是隔離的 subagent）。

3. **Manual handoff**：
   開新 Claude Code session，把 agent spec + scope 貼進去，互動執行。

**本 repo 三隻 agent 的目前狀態**：
- ✅ Inline run 全部可用
- ❌ Agent tool 程式化 spawn 不行
- 等 Claude Code 之後支援 user-defined agent 註冊到 `subagent_type`，就能無痛切過去

---

## 相容性

- **Claude Code**：dogfood 跑在 `claude-opus-4-7`（1M context）。agent 自己的 frontmatter 寫 model（opus-4-7 / sonnet-4-6）
- **產品技術棧**：本身 stack-agnostic，但 patterns 用 Next.js + Tailwind + shadcn 當範例（reference run 的棧）
- **Vault / wiki**：原始 patterns 用 Obsidian wikilink `[[...]]`，repo 內已 sanitize 成純 markdown。如果你維護 Obsidian vault，可以另外存一份 wikilink 版

---

## 版本管理

repo 走寬鬆 semver：

- **patch** (`v0.1.x`) — 字句修
- **minor** (`v0.x.0`) — 新 agent / pattern / additive 改動
- **major** (`v1.0.0`) — schema 破壞（例如 guideline.md 章節名要求變動）

目前 `v0.1.0` — sealed from reference run dogfood（2026-05-28）。

---

## Roadmap

- [ ] 每隻 agent 各包一個 Skill wrapper（程式化 spawn workaround，見「已知限制」段）
- [ ] Cross-project 測試 harness — 用固定 snapshot 的範例 codebase 跑 ds-reviewer
- [ ] 更多 example product（不同 stack：SvelteKit + Tailwind、Astro + UnoCSS 等）
- [ ] Brand Book Skill 整合（chisel 完直接輸出進 `<repo>/brand/`）
- [ ] N=2 dogfood run 在不同 product → 萃出 v2 patterns

---

## 為什麼有這個 repo

solo founder 跑多個 side project 時，最痛的點是：
- brand 文件散落（vault / Notion / repo root / Figma 註解都有）
- design system 跟 brand 反覆 drift（spec 改了 code 沒同步、或反過來）
- 每個新 project 都要重新發明結構

這個 repo 把跑過一次的真實流程 distill 出來：固定 folder 結構 + agent contract + governance pattern。從第二個 project 開始就可以直接套用。

**這不是設計系統理論**。是「實際跑過後留下的接地氣 SOP」。

---

## 貢獻

歡迎的 PR：
- 加上你自己 product 的 reference run（脫敏後）擴充 pattern catalog
- 把 example 泛化到不同 stack 但保留具體 actionability
- 新增符合 brand/+design/ 合約的 agent

---

## License

MIT — 見 [`LICENSE`](./LICENSE)。

---

*Made for Taiwan solo / small-team product folks who run Claude Code. 給用 Claude Code 的台灣個人 / 小團隊 product 開發者。*
