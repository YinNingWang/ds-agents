# Claude Design Handoff Recipe

> User-side playbook：**怎麼跟 Claude Design 對話 + 怎麼在 Claude Code 端接 handoff 輸出**。
>
> 跟 `_skill_design-handoff.md`（Claude Design 內部 skill）的關係：
> - 此 recipe = **orchestrator's view**（user 怎麼餵、怎麼接、怎麼驗）
> - skill = **Claude Design's view**（agent 內部 6-phase workflow）
> - **不重複 — cross-ref**。Skill 改 → recipe 不一定動；recipe 改 → skill 不動。

---

## 0 · 怎麼用這份檔

按 Stage A → B → C → D → E 依序。
每個 Stage 有：
- **餵給 Claude Design 的 prompt template**（如適用）
- **必填 / 選填 context**
- **期待產出**
- **Claude Code 端 follow-up**

跳過 Stage A（capability probe）只在 Claude Design 已被驗證可信任的後續 project 才行。

---

## Stage A · Capability probe（第一次合作必跑）

### Purpose

驗證 Claude Design 在當前 product 的 brand / 技術棧條件下，能否 token-first 出 spec。

### A.1 · Token-first 能力測試 prompt

```
請設計 <product-specific component name>，需求：
- Dark mode 與 Light mode 雙版本
- <某個典型 surface 的 mock 數據>
- 使用 <product brand keyword e.g. mono + tabular-nums>

請輸出：
1. 對應的 CSS variable 命名（dark/light 各一組），假設我會放進 globals.css 的 :root[data-theme="..."] 區段
2. Component className（Tailwind utility），不要 inline hex，只用 semantic token name
3. 列出此 component 需要哪些 shadcn primitive（如果有）

Brand 紅線：<列 anti-pattern 5-8 條>
```

**判斷信號**：
- ✅ semantic token className（`bg-card`、`text-text-primary`）→ 能寫 token-first
- ⚠ raw hex (`bg-[#232328]`) → 需要更明確指示
- ❌ inline style / 自創 token 名 → 要寫詳細 spec

### A.2 · Stateful component 能力測試 prompt

```
請設計「<product 的 first-class navigation component>」。
兩個 state：<state1 desc> 與 <state2 desc>。
<state1> active 時用 <palette-1 tokens 描述>。
<state2> active 時用 <palette-2 tokens 描述>。
切換時 <motion timing>，無 bounce。
請輸出 dark + light 雙模式 className。
```

### A.3 · 判斷信號

| 信號 | Meaning | Action |
|---|---|---|
| ✅✅ 兩個 test 都過 | Claude Design 端可信 | Stage B 直接出完整 handoff，不再 probe |
| ✅⚠ Token 過 / Stateful 弱 | 可接複雜，但 stateful 要明確指示 | 加 spec 厚度，特別 stateful 元件 |
| ⚠⚠ 都偏弱 | 需要 manual 補 spec | dev 端要花更多時間補 detail |
| ❌ | Skip Claude Design，回 traditional design tool | — |

---

## Stage B · Spec round（給 Claude Design）

### B.1 · 必餵 context（minimum viable brief）

每個 product 第一次跑 handoff，至少提供：

| Context | 來自 |
|---|---|
| Product purpose 1-3 段 | `<repo>/brand/brandbook.md` §Strategy |
| 4 brand axioms（或對應 strategic anchors）| `<repo>/brand/pillars.md` |
| Brand voice rules（V1-V6 + Tone Matrix + Forbidden keywords）| `<repo>/brand/brandbook.md` §2 Verbal |
| Target stack（framework / CSS approach / component library）| package.json / tailwind.config / handoff prompt 通用前言 |
| 既有 token reality（若已有 design system）| `<repo>/<repo>/src/app/globals.css` snippet 或 `design/tokens.md` |
| Target surfaces 列表（page route + 預期狀態）| 一份 surface 清單表，列 route / state |
| Brand anti-pattern 紅線（5-8 條）| `<repo>/design/guideline.md` §Principles · Anti-patterns 摘要 |

### B.2 · 推薦 context（提升 spec 品質）

可選但建議：

- Stage 0 visual audit report（若已跑）→ 見 [stage-0-visual-audit-template](./stage-0-visual-audit-template.md)
- Reference / Anti-reference images / 競品 URL
- DB schema relevant tables（若 design 影響 server state）
- Phase / sprint timeline + effort budget
- 之前 PR 的「出貨後遺留」清單（若是 iteration）

### B.3 · 期待 Claude Design 產出 5 檔（Pattern 1）

```
handoff/
├── 00 README.md           — 總覽 + PR 順序 + 已決議 Q&A
├── 01 Page Mapping.md     — 設計頁 ↔ codebase route
├── 02 Diff Report.md      — 結構差異
├── 03 Design Tokens.md    — 完整 token spec（drop-in code）
└── 04 Prompts for Claude Code.md — 按 PR 切的 copy-paste prompts
```

每個 PR 的 prompt 必含 7 元素（Pattern 2）：
1. PR scope（一句話）
2. Source of truth（指向 handoff/ 哪個檔）
3. Dependencies（依賴哪幾個 PR 已 merge）
4. 要做的事（編號 list）
5. 驗收條件（可一眼判定）
6. 不在 scope（防止 over-engineering）
7. 完成後請列出（report-back 格式）

### B.4 · ds-designer 兼容性檢核（產出後驗）

> Claude Design 產完 → 你在 Claude Code 端開新 session **不要直接給 dev**。先做 4 條檢核：

- [ ] Tokens 集中在 `03 Design Tokens.md`，不寫死在其他 PR spec
- [ ] guideline-eligible 內容（component rules / patterns / anti-patterns）能映射到 **Foundations / Components / Patterns / Principles** schema
- [ ] 沒有「未來式」頁面塞進 spec（未經明確同意，defer 的 page 不能進）
- [ ] Per-PR prompt 7 元素齊全

不符 → 回 Claude Design 補 / 自己 sanitize 後再進 Stage C。

---

## Stage C · Claude Code session 開工

### C.1 · 必載 context（Claude Code 開新 session 前）

```
1. <repo>/CLAUDE.md           ← AI auto-load（含 brand axioms + token pointer + branch-then-done）
2. <repo>/brand/              ← read-only by ds-designer，agent 必讀
3. <repo>/design/guideline.md ← 若已存在（M2 enforce mode）；不存在 → ds-designer M1 bootstrap
4. <repo>/design/tokens.md
5. 當前 PR 對應的 handoff/0X PR-N.md
6. 對應 handoff/phase4/*.jsx mock（若有）
7. 該 PR 的依賴 PR commit history（git log）
```

### C.2 · 推薦載入（精度提升）

- 前一 PR 的「出貨後遺留」清單 → 確認本 PR 沒漏接
- `brand/audit.md`（若 reconciliation 仍 active）
- 既有 component 路徑列表（`src/components/`）→ 避免重造輪子
- `design/guideline.md` `## Open items` → 順手 fix 同 scope items

### C.3 · 第一個 prompt 模板（7 元素）

```
請讀以下文件後實作 PR-N：

- <repo>/CLAUDE.md
- <repo>/brand/brandbook.md（讀 §1 Strategy + §2 Verbal）
- <repo>/design/guideline.md（讀 §Foundations + §Components 對應段 + §Open items）
- <repo>/handoff/00 README.md
- <repo>/handoff/0X PR-N.md (本 PR 完整 spec)
- <repo>/handoff/03 Design Tokens.md → 已 move 到 design/tokens.md

PR scope（一句話）：<...>
Dependencies：<已 merge 的 PR list>

要做的事：
1. <...>
2. <...>

驗收條件：
1. <...>
2. <...>

不在 scope：
- <...>

完成後請列出：
- 改動檔案 + 行數
- 任何踩到的 spec 漏洞 / mock 衝突
- 出貨後遺留（下個 PR 該接 / defer 的）

工作守則：
- Branch-then-Done（不要直接 push / merge）
- Token 一律走 Tailwind utility，無 hex 硬寫
- 遇 guideline gap → spawn ds-designer Drift Protocol
- 跑 pnpm build / typecheck 驗證

branch: claude-design/pr-N-<topic>
base: main (最新 pull)
```

### C.4 · 工作中 ds-designer Drift Protocol 觸發時機

寫 code 時遇到下列任一條件 → **PAUSE，spawn ds-designer (或 escalate user)**：
- Spec 描述跟 mock 不一致（Pattern 32）
- Mock copy 違反 brand axiom（Pattern 33）
- 需要新 token / variant / pattern 但 guideline 沒寫
- shadcn primitive 跟 brand component spec 衝突
- A11y baseline 跟 spec 衝突

**不 PAUSE 直接寫 → 累積技債**。

---

## Stage D · PR review + iterate

### D.1 · 三方 SoT 對齊（Pattern 32）

PR review 時對照 **三個 source**：

```
PR-N review checklist：
  [ ] 讀 handoff/0X PR-N.md (spec text)
  [ ] grep handoff/phase4/ 找對應 mock JSX
  [ ] 對照兩者 — 有衝突列表給 user
  [ ] grep handoff_run_log_*.md 前一 PR「出貨後遺留」→ 標哪些在 scope
  [ ] confirm 後才 merge
```

### D.2 · Brand axiom vs Mock 衝突 reconcile（Pattern 33）

| Path | Trade-off |
|---|---|
| A · Reword 為純 observation | 保留資訊，拿掉建議語氣，axiom 不動 |
| B · 鬆綁 axiom | 觸發 30-day cool-off + 寫進 brand/evolution.md |
| C · Feature 移後 | 留 backlog，PR 不實作 |

**不要替 user 偷選 path** — 三條路列給 user 拍板。

### D.3 · 出貨後遺留紀錄格式

PR done → 在 `vault 30_resources/side/<project>/handoff_run_log_<date>.md` 加：

```markdown
### PR-N 出貨後遺留

- [ ] <item 1> (next PR / defer / parked)
- [ ] <item 2>

### PR-N commit reference

- Branch: claude-design/pr-N-<topic>
- Commit: <hash>
- Files changed: <count>
```

---

## Stage E · Wrap-up

### E.1 · brand/evolution.md 寫入時機

如 PR 過程中觸發了 **Path B (鬆綁 axiom)** 或發現 brand contract 缺口：
- 在 `<repo>/brand/evolution.md` Observation Queue 加 entry
- 註明 N 個 dogfood signal 觸發後升 active

### E.2 · design/guideline.md Decisions log 寫入時機

如 ds-designer Drift Protocol 觸發完成：
- Append 一行 `- YYYY-MM-DD: <what> — <why>` 到 §Decisions log
- 若衍生 follow-up item → 加進 §Open items

### E.3 · vault project handoff_run_log_XX.md 寫入時機

每 PR done 後（per D.3 格式）。

### E.4 · 跨 project pattern promote

如本次 handoff 發現新 reusable pattern：
- 加進 [claude-design-handoff-flow](./claude-design-handoff-flow.md) §Pattern catalog
- 若是 brand-level pattern → 進 [brand-design-folder-pattern](./brand-design-folder-pattern.md)
- 若是 refactor governance → 進 [refactor-workflow](./refactor-workflow.md)

---

## 跟 `_skill_design-handoff.md` 的整合

`_skill_design-handoff.md`（住 Claude Design 端 / ds-agents repo）= Claude Design 內部 6-phase workflow，當 user 跟 Claude Design 說「幫我做 handoff」就跑這隻 skill。

此 recipe（住 vault tech/）= user 端的 orchestration playbook：
- skill 跑**之前**：怎麼準備 brief（Stage A + B.1-B.2）
- skill 跑**之後**：怎麼驗（Stage B.4）+ 怎麼接到 Claude Code（Stage C-E）

**Cross-ref，不重複內容**。skill 的 Phase 1-6 描述了 Claude Design 內部做什麼；recipe Stage A-E 描述 user 怎麼包進 workflow。

兩邊互相 link：
- skill 內 §Mini-checklist 可加一行「跑此 skill 前，user 應該已 prepare per [claude-design-handoff-recipe](./claude-design-handoff-recipe.md) Stage B.1」
- recipe Stage B 內 cross-ref skill spec

---

## 相關

- Pattern catalog + Coplot reference: [claude-design-handoff-flow](./claude-design-handoff-flow.md)
- Brand + design folder structure: [brand-design-folder-pattern](./brand-design-folder-pattern.md)
- Refactor governance（branch / phase / verify）: [refactor-workflow](./refactor-workflow.md)
- Coplot Run #1 detailed log: `<your-vault>/.../coplot/handoff_run_log_2026-05.md` (private reference run, not in this repo)
- Claude Design 端 skill spec: `~/Documents/K/Claude code/ds-agents/_skill_design-handoff.md`
