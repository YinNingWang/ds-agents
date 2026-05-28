# Brand + Design Folder Pattern

> Cross-project structural pattern for any product repo with brand identity + design system.
> Sealed in Coplot 2026-05-27. Reusable for Climby / adn studios / yen shine / future side projects.

## TL;DR

```
<product-repo>/                  [git]
├── brand/                       ← strategic identity (read-only by ds-designer)
│   ├── README.md
│   ├── brandbook.md             ★ Brand SoT (Strategy / Voice / Personality)
│   ├── pillars.md               精煉 4 axioms card
│   ├── evolution.md             change board (active / pending / rejected / queue)
│   ├── audit.md                 self-audit reports (frozen per audit date)
│   └── chisel-skill.md          methodology meta-doc (optional)
├── design/                      ← code-coupled implementation
│   ├── README.md
│   ├── guideline.md             ★ Operational SoT (Foundations / Components / Patterns / Principles)
│   ├── tokens.md                ★ Token spec (CSS vars + Tailwind names)
│   └── stage-0/                 (optional) one-time codebase audit history
│       └── audit-coplot.md      product-specific audit run
└── src/...
```

## 為什麼是這個結構

### 兩個資料夾的職責分工

| Concern | `brand/` | `design/` |
|---|---|---|
| 抽象層 | strategic / identity | implementation |
| 更新頻率 | 季 / 半年 | 月 / PR 級 |
| 讀寫權限 | **read-only by ds-designer** · user 可寫 | ds-designer 寫 · ds-reviewer 讀 |
| 跨 project 重用 | ✅ 可整包搬走 | ❌ 跟該 product 的 codebase 綁 |
| 變動觸發 | Brand Chisel Skill / explicit user decision | Drift Protocol / Token system change |
| 牽動 | brand book v bump | guideline rev / token migration |

### 為什麼分離（vs 混合一個資料夾）

1. **不同更新節奏** — 混在一起 = 同 commit 改 brand + design，brand 變動的「strategic gravitas」被 token 修正等小事稀釋
2. **跨 project 重用** — `cp -r brand/ ~/another-project/` 直接給其他 project 當 reference 起點
3. **ds-designer agent contract** — `~/.claude/agents/ds-designer.md` step 1 hardcoded `<repo>/brand/` + `<repo>/design/`，混在一起 agent 找不到
4. **Brand Book Skill output target** — chisel 完輸出進 `<repo>/brand/`，慣例固定

## 各檔角色

### brand/

| 檔 | 必要？ | 用途 |
|---|---|---|
| `brandbook.md` | **必要** | Strategy + Voice + Personality + Anti-impulse + Governance + Versioning |
| `pillars.md` | 強烈推薦 | 4 axioms / archetype / manifesto / verbs 精煉版 — 1 page card |
| `evolution.md` | 推薦 | change board（active / pending / rejected / queue / self-review schedule）— 不只是 log |
| `audit.md` | 視情況 | 完成過自審才有；frozen per audit date |
| `chisel-skill.md` | 視情況 | brand chisel 方法論本身的 spec（meta） |
| `README.md` | 推薦 | folder purpose + cross-folder relationship 速覽 |

### design/

| 檔 | 必要？ | 用途 |
|---|---|---|
| `guideline.md` | **必要** | Operational SoT。**ds-designer agent enforce** 此檔。schema 必須是 Foundations / Components / Patterns / Principles |
| `tokens.md` | **必要** | CSS variable / Tailwind name 完整 spec。**`globals.css` source of truth**（globals.css 加 comment 指認） |
| `README.md` | 推薦 | folder purpose + ds-designer/ds-reviewer contract 速覽 |
| `stage-0/` | 視情況 | 從 existing codebase bootstrap design system 時的 audit history |

## ds-designer / ds-reviewer agent contract

兩隻 agent 期待固定的 path + schema：

### ds-designer 期待

- `ls <repo>/brand/` + `<repo>/design/`（step 1，必跑）
- `design/guideline.md` 存在 → M2 enforce mode；不存在 → M1 bootstrap mode
- `guideline.md` schema 必須是 **Foundations / Components / Patterns / Principles**
- Drift Protocol 寫 decision 進 `guideline.md` 的 `## Decisions log` 末段（append-only line items）
- 永不編輯 `brand/`（read-only）

### ds-reviewer 期待

- 同上 step 1
- 沒有 `design/guideline.md` → ABORT，要求先跑 ds-designer M1
- 沒有 `brand/` → silent skip voice checks
- 輸出 P0 / P1 / P2 severity-tagged report
- 永不 modify / 永不跑 code

## 「重 brand 起手」workflow（已有部分 brand，restructure 至此 pattern）

> 用於：你已有 brand book（透過 Brand Chisel Skill 或自己寫）散落在 repo / Notion / vault，現在想 restructure 進這個 pattern。

### Phase 0 — 盤點現況

```
- 列出所有 brand-related 檔案位置（grep / find）
- 標記每檔對應到上面哪個 file slot（brandbook / pillars / evolution / audit / chisel-skill）
- 識別 implementation-level 檔（這些屬於 design/，不是 brand/）
- 識別 deprecated 內容（搬 archive 或 evolution.md history entry）
```

### Phase 1 — 建立空骨架

```
mkdir <product-repo>/brand/
mkdir <product-repo>/design/
```

### Phase 2 — 內容遷移

按上面 「各檔角色」表格分配。實作細節走 [refactor-workflow](./refactor-workflow.md) 的 6 階段。

### Phase 3 — 對齊 agent contract

- `guideline.md` 必須 Foundations / Components / Patterns / Principles schema
- `tokens.md` 跟 `globals.css` 雙向 reference（globals.css L? 加 `Source of truth: design/tokens.md` comment）
- `## Decisions log` 末段建好（即使空也要建）

### Phase 4 — 跑 ds-reviewer 驗證

```
spawn ds-reviewer with scope <product-repo>/src/
```

預期：第一次跑會有大量 P0 / P1 finding（因為 guideline 剛 lock，existing code 沒對齊過）。
→ 進 ds-designer Drift Protocol 逐項處理 / 接受 / extend guideline。

## 跟 Brand Book Skill 的邊界

| | Brand Book Skill | 本 pattern |
|---|---|---|
| 解決什麼 | 「我沒有 brand book，幫我 chisel 出來」 | 「我有 brand book，幫我 restructure 進固定 pattern」 |
| 輸出位置 | `<repo>/brand/`（按本 pattern） | restructure 既有檔到 `<repo>/brand/` + `<repo>/design/` |
| Trigger | brand 從零建立 | brand 已存在，要對齊 ds-agent contract |
| 互補 | Chisel skill 跑完 → 本 pattern 落地 | 本 pattern 缺 brand 內容 → 回 chisel skill |

## 不適用的場景

- **超小 side project**（< 5 sketch）— brand identity 不需要這麼正式
- **prototype / spike**（< 1 週）— 過度結構化
- **內部工具**（純 admin / 內部 dashboard）— 沒有 brand 對外辨識需求

## Skip 信號

如果 `<product-repo>/` 同時符合：
- 沒 dogfood user / 沒 marketing
- 沒人會看 UI 以外
- < 100 LOC component
→ **不要套用**，直接寫 code。將來真有需求再 retroactively apply。

## Coplot 是參考實作

完整 reference instance 見：
- `/Users/ning0/Documents/K/Side project/One Book/<repo>/brand/`
- `/Users/ning0/Documents/K/Side project/One Book/<repo>/design/`
- 收斂歷史見 `<your-vault>/.../coplot/brandbook_decisions_log.md` (private reference run, not in this repo) 2026-05-27 entry

## 相關

- 重構流程: [refactor-workflow](./refactor-workflow.md)
- Brand 從零建立: `<your-vault>/.../brand_book_skill/_index.md`
- Stage 0 audit (codebase → brand drift 盤點): [stage-0-visual-audit-template](./stage-0-visual-audit-template.md)
- ds-designer agent spec: `~/.claude/agents/ds-designer.md`
- ds-reviewer agent spec: `~/.claude/agents/ds-reviewer.md`
