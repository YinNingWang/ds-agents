# Stage 0: Codebase Visual Audit — Prompt Template
> 用法：開新 Claude Code session 在 **產品 repo root**，把整份貼進對話，Claude Code 會跑完整 audit。
> 適用：任一已有 codebase 的產品，第一次要建 design system / 想盤點 brand → code drift 時。**每個產品各跑一次，不要混合**。
> 預期執行時間：30–60 分鐘 per product。
---
## Role
你是一個 senior design systems engineer，正在為 **{PRODUCT_NAME}** 進行 brand-to-code reconciliation 前的視覺現況稽核。
這個產品已經有實際運行的 code base。你的工作是 **盤點目前 code 裡實際使用的視覺 token、component pattern、視覺一致性風險**，產出一份結構化報告，供後續的 brand token 落地使用。
---
## Inputs
1. **Product brand book**（請先讀完）：
   - `{path-to-brand-book.md}`
   - `{path-to-designer-brief.md}`（如有）
2. **Codebase**：當前 repo
3. **Brand audit report**（缺口已標出，如有）：
   - `{path-to-brand-audit.md}` (typical location: `<repo>/brand/audit.md`)
---
## Prerequisites（進 Stage 0 前必補）
跑這份 audit 之前，下列項目必須先完成，否則 Step 4 cross-reference 會把已知衝突當新發現重複列：
1. **Brand audit 中的 gap reconciliation 已決策**（如已有 brand audit report）
2. **Source-of-truth 文件已選定**
   - 多份 brand 文件存在時，明確選定一份為 SoT；衝突項目必須先 patch
3. **Reconciled-after 版本路徑明確**
   - 將下方 Step 4 對照的 brand-book 路徑指向**已 reconcile 過**的版本，不是原始衝突版
> ⚠ 若 Prerequisites 未滿足，**停止跑 Stage 0**，先回 brand-audit reconcile。
---
## Method
### Step 1: Establish stack
從 `package.json`、`tailwind.config.*`、`tsconfig.json`、global CSS 檔識別：
- Framework（React / Vue / Svelte / 其他）
- Styling 方式（Tailwind / CSS Modules / styled-components / vanilla CSS / shadcn）
- 是否有現成 design token 系統（CSS variables / Tailwind theme / TS const）
- Component library（shadcn / Radix / Headless UI / 自製 / 混合）
輸出：`## Stack Snapshot` 段落。
---
### Step 2: Extract existing tokens
從以下來源逐一抽取**當前實際使用的視覺 token**：
#### 2.1 Color
- 找所有 `#[0-9a-fA-F]{3,8}` literal hex
- 找所有 `rgb(`, `rgba(`, `hsl(`, `hsla(` 用法
- 找所有 Tailwind color class（`bg-`, `text-`, `border-` + 顏色名）
- 找所有 CSS variable `--color-*` 或 `--*-color`
- 統計每個顏色出現次數（使用 grep -c）
- 排序出 top 30 顏色，標示出現次數與檔案分佈
輸出表格欄位：`Hex/Value | Count | Used in (sample files) | 推測角色`
#### 2.2 Typography
- 找所有 `font-family` 用法
- 找所有 `font-size` 與 Tailwind text size class
- 找所有 `font-weight` 與 Tailwind font-* class
- 找所有 `line-height`, `letter-spacing`
- 統計出 font scale（實際在用幾個 size）
輸出表格：`Size | Weight | Used count | Sample context`
#### 2.3 Spacing
- 找所有 padding / margin 用法（包括 Tailwind `p-*`, `m-*`, `gap-*`, `space-*`）
- 統計出 spacing scale（實際在用幾個 value）
- 找有沒有 magic number（非 4px 倍數）
輸出 spacing scale 實際分佈圖。
#### 2.4 Border radius / borders
- 找所有 `border-radius` / `rounded-*`
- 找所有 `border-width` 與 `border` 用法
#### 2.5 Motion
- 找所有 `transition`, `animation`, `@keyframes`
- 找所有 `duration-*`, `ease-*` Tailwind class
- 找 `prefers-reduced-motion` 是否處理
---
### Step 3: Component inventory
列出所有 component 檔案（`components/**/*.{tsx,jsx,vue,svelte}` 或對應結構）。
對每個 component 標：
- 名稱
- 大致角色（atom / molecule / organism）
- 是否多處使用 vs 單次使用
- 是否內部寫死 token（hex / magic number）vs 用 design token
輸出表格：`Component | Type | Usage count | Hardcoded tokens? | Notes`
特別關注：
- **Button** 變體（primary / secondary / ghost / danger / 各 size）
- **Input / Form field**
- **Card / Container**
- **Modal / Sheet / Dialog**
- **Navigation**（top nav / side nav / tab bar）
- **Toast / Notification**
- **Table / List row**
- **Chart / Visualization**（如有）
#### 3.A Page-level Inline UI Surfaces（必補）
很多專案的 UI **不在 `components/` 裡**，而是直接寫在 `app/**/page.tsx` / `routes/**/*.tsx` 內。這些常被傳統 component inventory 漏掉。請額外掃：
- `app/**/page.tsx` / `pages/**/*.tsx` / `routes/**/*.tsx`
- `app/**/layout.tsx`
- 任何 `<button className="...">` / `<div className="...">` 直接寫 Tailwind class 的 UI block
對每個 page-level surface 列：
- **Route path**（e.g. `/`, `/analyze`, `/settle/history`）
- **Inline UI blocks**（簡短描述：「banner with 🎉」、「pending count bar」、「inline form」）
- **是否有 token 化**（vs 寫死 class）
- **未來該移到 components/ 嗎**（高重用度的應該抽出來）
輸出表格：`Route | Inline UI block | Tokenized? | Should-extract?`
---
### Step 4: Cross-reference with brand book
> ⚠ **本步驟必須以 reconciled-after 的 brand-book 為對照基準**（per Prerequisites §2）。
> 若有多份 brand 文件且存在衝突，先在 Prerequisites 階段選定 SoT；本步驟以選定後的版本為準。
> 如果 Prerequisites 沒完成，**不要跑 Step 4**，回去 reconcile。
對照 `{path-to-brand-book.md}` 與 `{path-to-brand-audit.md}`，**逐項標出**：
#### 4.1 ✓ Already aligned
Brand book 規定了 X，code 用法符合 X。
#### 4.2 ⚠ Conflict
Brand book 規定 X，code 用了 Y。列出 file:line 與建議 migration 方向。
#### 4.3 ❓ Brand silent, code populated
Code 用了 token Z，但 brand book 沒規定 Z 該長怎樣 — 需要 brand 補規。
#### 4.4 ❌ Brand populated, code missing
Brand book 規定 X，code 沒實作。標出哪些 surface 應該加。
#### 4.5 🔧 Naming inconsistency
Brand book 用 `pub-tint`，code 用 `--orange-1`（或類似情況）。列出 naming map 候選。
---
### Step 5: Patterns & smells
掃 code 找 design system 健康指標：
- **Hardcoded color count**（不透過 token 直接寫 hex）
- **Magic spacing count**（非 scale 內的數字）
- **Inline style 比例**（vs token 化）
- **不一致的 hover / focus / active state** 處理（哪些 component 漏了 focus ring）
- **A11y 風險點**：alt 漏寫 / aria-label 漏寫 / 顏色當唯一資訊載體（如只用顏色區分狀態）
- **Responsive breakpoint** 分佈（mobile / tablet / desktop 各自的 surface 覆蓋）
#### 5.A Brand Anti-Pattern Scan（必跑）
依產品的 brand book anti-pattern 清單，**明確 grep**。範例（依該產品 brand book + 對應規則）：
| 反模式 | Grep pattern | 為何違反 |
|---|---|---|
| Celebration emoji | `🎉` / `🎊` / `🥳` / `🍾` / `✨` | violates R9 Sober + axiom B |
| Success green | `bg-green-` / `text-green-` / `border-green-` / `success` 變數名 | violates axiom B（no success state） |
| Bold typography | `font-bold` / `font-extrabold` / `font-black` / `font-weight:[ ]*[789]00` | violates Typography weight rule（❌ Bold 700+ NEVER） |
| Bounce / spring motion | `animate-bounce` / `transition.*spring` / `cubic-bezier.*[><]1` / `elastic` | violates M3 |
| Scale animation | `scale-[0-9]` on hover/active 之 component | violates Interaction rule（hover 不 scale） |
| Streak / badge | `streak` / `badge` 變數名（不含 a11y aria-badge） | violates R5 |
| Urgency / coach copy | "立刻" / "馬上" / "必須" / "趕快" / "Don't miss" / 紅色驚嘆號 icon | violates V6 + R4 |
| Stock emoji 笑臉 | `😊` / `🤑` / `💰` / `👍` | violates Photography rules |
輸出格式：每個 anti-pattern 列 hit count + file:line 範例。沒 hit 也要顯式記「0 hits」（不是漏掃）。
> 📌 其他產品請依該產品的 brand book anti-pattern 清單調整 grep 表。
---
### Step 6: Risk register
列出 5–10 個 **進 Stage 2 token 落地之前** 必須處理的風險，按 severity 排：
格式：
```
[P0/P1/P2] {one-line risk} | impact: {what breaks if ignored} | mitigation: {what to do first}
```
---
### Step 7: Migration sequence proposal
> 📏 **Effort budget anchor**：先跟使用者確認此次 design system 落地的 effort budget（天數 / sprint 數）。建議的 migration order **必須 fit in 這個 budget**，超出的列為 backlog，不要硬塞。
提出建議的 component 重皮順序：
- 哪幾個 component 先做（影響面廣 / 風險低 / 高頻使用）
- 哪幾個 component 最後做（複雜 / 低頻 / 牽連大）
- 預估 component 數量 × 平均工時
輸出兩個 list：
- **In-scope（本次落地）**：順序排好，預估總工時 ≤ budget
- **Backlog（超出 budget）**：留待下一輪
---
## Output
請產生兩個檔案到 repo root：
1. **`STAGE-0-AUDIT-{product}.md`**：完整 audit 報告，包含 Step 1–7 所有產出
2. **`STAGE-0-CURRENT-TOKENS-{product}.json`**：當前 code 抽出來的 token，結構：
```json
{
  "colors": [{"value": "#FF9967", "count": 12, "files": ["...", "..."], "guessed_role": "accent-pub"}],
  "typography": {"sizes": [...], "weights": [...], "families": [...]},
  "spacing": [0, 4, 8, 12, 16, 24, 32, 48],
  "radius": [4, 8, 12, 999],
  "motion": {"durations": ["150ms", "240ms"], "easings": [...]}
}
```
---
## Hard Constraints
- **不要改任何 code** — 這是 read-only audit
- **不要建議「我幫你改」** — 報告就好
- **每個 conflict / risk 都要有 file:line 引用** — 不能空講
- **不要寫 review 的 commentary**（如「這寫得不好」）— 純事實盤點
- **如果 brand book 與 code 都沒講某項，直接列為 unknown，不要猜**
---
## Self-check before delivering
完成後，自我檢查：
- [ ] **Prerequisites §1-§3 已驗證**（G1-G4 reconciliation done、source-of-truth 已選定）
- [ ] Step 1–7 都有產出
- [ ] Color top 30 表格完整
- [ ] Component inventory 至少 cover 90% 的 component 檔案
- [ ] **Page-level Inline UI Surfaces（Step 3.A）已盤點**
- [ ] **Brand Anti-Pattern Scan（Step 5.A）已跑**（每個 pattern 都有 hit count，包含 0 hits 明示）
- [ ] Risk register 至少 5 項
- [ ] Step 7 migration order fit 在 effort budget 內，超出部分列入 backlog
- [ ] 兩個 output 檔案都產生且 well-formed
- [ ] **沒有任何 code 被修改**
- [ ] **沒有跨 brand 推測**（不引用另一個產品的決定）
---
## Variables 替換清單
開始之前把以下變數替換成實際值：
| Variable | Typical value |
|---|---|
| `{PRODUCT_NAME}` | (你的產品名) |
| `{path-to-brand-book.md}` | `<repo>/brand/brandbook.md` |
| `{path-to-designer-brief.md}` | `<repo>/brand/<designer-brief>.md`（若有） |
| `{path-to-brand-audit.md}` | `<repo>/brand/audit.md`（若有跑過 self-audit） |
---
*Template version 1.0 · 跨產品共用*
