# Skill · Design → Codebase Handoff
> 把高保真設計稿（HTML mockup / JSX prototype / Figma export）系統性地轉成 PR 套組，
> 交給 Claude Code（或工程師）按順序實作進既有 codebase。
---
## When to invoke
- 使用者有高保真設計 + 既有 codebase，要實作落地
- 提到「轉到 Claude Code」「handoff」「PR 規劃」「設計交付」
- 多個結構性 / 視覺變更需要跨 PR 分階段做
- 需要建立設計系統並套到既有功能
---
## Workflow（6 phases）
### Phase 1 · 取得雙端 context
並行進行：
**A. 讀設計稿（current project）**
- 列出所有 distinct screens / states
- 識別「未來式」頁面（設計有、codebase 多半沒有）
- 抽出視覺系統：tokens, palette, theme, typography, layout
- 注意 state 變化機制：mode toggle, theme switch, tweaks panel
**B. 連接 codebase（GitHub 工具）**
- `github_list_repos` 確認連線；未連 → `connect_github` 後停手
- `github_get_tree` `recursive: false` 從 repo 根做總覽
- `github_read_file` 抓關鍵檔：
  - `tailwind.config.{ts,js}` / `package.json` / `components.json`
  - `globals.css` / `app/layout.tsx` (or `_app.tsx`)
  - 主頁 page.tsx + 任何設計稿提到的對應頁
**C. 確認技術棧**
明確列出：framework / 路由 / 樣式系統 / state / DB / UI lib / runtime（edge or node）。
這份資訊會出現在每個 PR prompt 的「通用前言」。
### Phase 2 · 差異盤點與決策
每個關注點寫一份文件：
**1. Page Mapping (`01 Page Mapping.md`)**
表格欄位：`設計頁 | codebase route | 檔案 | 狀態 | 處理策略 | PR`
狀態類型：`✅ 存在` / `❌ 不存在 (defer)` / `🔀 結構不同 (merge / rename)`
**2. Structural Diff Report (`02 Diff Report.md`)**
每條結構差異 D1, D2, ... 包含：
- 現況（codebase 怎麼長）
- 設計稿（要它變什麼）
- 落差
- 處理建議（含 file impact）
**3. Decision questions**
在 `00 README.md` 末尾或 `02` 內列：
- Q1, Q2, ... 每題附**預設答案**
- 標註「不回答 = 採預設」
- 常見類別：
  - 頁面是否存在 / 是否合併？
  - 三源命名（brand / codebase / design）統一用哪個？
  - Route 策略：rename + redirect / alias / new path？
  - 實作選擇：sheet vs page / hash color vs token color？
  - Scope：本次做 vs defer？
### Phase 3 · PR 排序（標準順序）
| # | PR 類型 | 為何在這個位置 |
|---|---|---|
| 1 | **Tokens refactor** | 地基，後續所有視覺都依賴 |
| 2 | **App shell / Layout** | 全域 chrome（tabs, header, FAB, mode toggle）|
| 3 | **主頁 restyle** | 流量最高的頁面，最早能驗證 token 效果 |
| 4 | **結構性 merges** | 多頁合併 / route 重組 |
| 5 | **複雜 flows** | Sheet / modal / multi-step 互動 |
| 6 | **次要頁 restyle** | Insights, analytics 等 |
| 7 | **Settings / Configuration UI** | 把 tokens 接到 user preference |
| 8 | **Onboarding** | 依賴 tokens + settings UI 完備 |
| 9 | **Edge pages 視覺對齊** | 邊緣 / 低流量頁面 |
| ∞ | **Hotfixes** | 任意時點插入 |
### Phase 4 · 每個 PR 寫一份文件
檔名：`handoff/NN PR-N <Title>.md`
固定章節：
```markdown
# PR-N · <Title>
> 一句話總結。
## Why（為什麼需要這個 PR）
## Codebase 現況
- 列出受影響的檔案 + 行數 + 簡短現況
- 給 Claude Code anchor 用
## PR scope（細分 A, B, C... 每個帶 code snippet）
### A. <子任務>
```code...```
## 影響檔案清單
| Action | 檔案 |
|---|---|
| ➕ NEW | ... |
| ✏️ EDIT | ... |
| 📁 MOVE | ... |
| ❌ NO TOUCH | ... |
## 驗收 Checklist
1. ✅ 具體可觀察項目
2. ✅ ...
## 非 scope（明確禁區）
- ❌ 不要動 ...
## 給 Claude Code 的 prompt（複製貼上）
```
請讀以下文件後實作 PR-N：
- handoff/00 README.md
- handoff/NN PR-N <Title>.md (本 PR 完整 spec)
- handoff/03 Design Tokens.md (token 使用慣例)
scope：...
完成後跑 [build command]。
branch: claude-design/pr-N-<topic>
base: main
```
```
### Phase 5 · 頂層協調文件
`handoff/` 資料夾固定包含：
- **`00 README.md`** — 總覽、決策表、PR 順序、檔案索引、已完成標記（每次更新時打 ✅）
- **`01 Page Mapping.md`** — 跨 PR 對應表
- **`02 Diff Report.md`** — 跨 PR 結構差異
- **`03 Design Tokens.md`** — 跨 PR 共用 token blueprint
- **`04+ NN PR-N ....md`** — 一 PR 一檔
- **`Hotfix-X.md`** — 小修補，可插入任何時點
### Phase 6 · 交付
1. 把所有 markdown 寫到 `handoff/` 資料夾
2. 用 `present_fs_item_for_download` 給 zip 下載卡片
3. 提供**兩個** prompt：
   - **Commit prompt**：叫 Claude Code 建 `claude-design/handoff-N` branch、commit `handoff/`、push
   - **First PR prompt**：叫 Claude Code 讀指定文件後實作 PR-1
---
## 核心原則
1. **Token 是地基** — 任何「設計與 codebase tokens 不對等」一定是 PR-1
2. **保留 deep link** — route 合併 / 改名 → 一律加 redirect，舊書籤不能壞
3. **Server logic 不碰** — 視覺 PR 明確禁止動 actions / queries / business logic
4. **命名統一以最 anchored 為準** — brand tokens > codebase 內部命名 > design 命名
5. **每 PR 都有「非 scope」section** — 防止 Claude Code 過度發揮
6. **未來式頁面 → 預設 defer** — 沒有得到使用者明確同意，不要把不存在於 codebase 的功能塞進交接
7. **placeholder vs real data 分兩個 prompt** — 視覺規格與資料 contract 分開講
8. **Hotfix 是 first-class** — 寫 PR 過程中看到小 bug，獨立 hotfix 文件，不要塞進 PR 膨脹 scope
---
## 反 pattern
| 反 pattern | 為什麼壞 |
|---|---|
| 一次把整套設計丟給 Claude Code | Context 爆，沒 review 點，難 debug |
| 視覺重塑 + 結構合併混在同 PR | 難 review、難 revert |
| 自己腦補 codebase 結構 | 一定要 read，不要猜 |
| 跳過 diff report | 使用者無法做決策 |
| 視覺 PR 動 server action | 高 regression 風險 |
| 單檔超長 PR | 拆 |
| 無「非 scope」聲明 | Claude Code 會發揮過頭 |
---
## 決策題標準模板
```markdown
| # | 問題 | 預設 |
|---|---|---|
| Q1 | <現狀解釋 + 選項> | <預設選項，加粗> |
> 不回答 = 採預設。
```
每題必須含：現狀說明、選項、預設。預設要是「最低風險、最不會卡住流程」的方向。
---
## Iteration cycle
當使用者回報某 PR 完成：
1. `github_get_tree` 抓 repo 最新狀態
2. 對照該 PR 的驗收 checklist 一條一條看
3. 找漏 / 找退步 / 找 scope 外的改動
4. 認可完成 → 在 `00 README.md` 打 ✅ → 給下一個 PR prompt
5. 不認可 → 寫 follow-up fix doc
當使用者中途改主意（如「步驟改為 6 步」）：
1. 更新受影響的 PR 文件（標 v2 / 修訂版）
2. 在 `00 README.md` 註記哪個版本是 current
3. 重新打包 zip 給 download
---
## Mini-checklist (skill 開頭就跑)
跑這個 skill 之前先問 / 確認自己知道：
- [ ] 有 codebase 嗎？在哪（GitHub URL or 路徑）？我有 access 嗎？
- [ ] 主要技術棧是什麼？
- [ ] 設計稿在哪？哪個是最新版？
- [ ] 使用者希望 defer 哪些「未來式」內容？
- [ ] Build / test command 是什麼（給 Claude Code 驗收用）？
- [ ] 命名 / Token 系統有沒有既定規則？
未確認的項目 → questions_v2 一次問完，再開工。
---
## 範例（成功案例）
可參考使用者本地跑過的 `handoff/` 結構作為 template — 通常包含：
- 5–10 份核心文件（README + Page Mapping + Diff Report + Design Tokens + Prompts + N 個 PR + Hotfix）
- 跨 PR 分階段實作（每 PR 一份 spec 檔）
- 完成各 PR 後使用者驗證 → 修補或下個 PR
- 中途使用者改 scope（如 N→M 步）→ 修訂 v2
skill 跑前先問使用者有沒有 reference run 可比照，沒有就照 Phase 1–6 從零跑。
