# Refactor Workflow — 6-Phase Governance

> 任何 file moves / folder reorganization / cross-file rename / docs consolidation 都走這套 6 階段。
> Sealed in Coplot 2026-05-27（design system reorg）。N=1 → 待 N=2 後可考慮 skill 化。

## When to use

✅ Trigger 條件（任一即套用）：
- 移動 ≥ 5 個檔
- 重新命名 cross-referenced files
- 整理多份 sprawled docs into structured layout
- folder structure change（不只是 add new file）

❌ Skip 條件：
- 只動 1-2 個檔且無 cross-file reference
- 純 content edit（不動 path）
- prototype 階段（沒人 ref 那些檔）

## 核心原則

### 1. Grep before move

**任何 file move 前必跑 grep report**：
```bash
grep -rn "<old-filename>" <repo-root> --include="*.md" --include="*.ts" --include="*.css"
```

→ 把每個 reference 列出 → 估 change cost → user 拍板「值不值得做」**之後**才執行 move。

→ 別開盲盒。看過幾次 grep 結果發現 ref 比想像多 5-10 倍就回頭省事多了。

### 2. Branch-then-Done

任何 refactor 一律 `git checkout -b refactor/<name>`，不在 main 直接動。詳見 `<your-vault>/.../coplot/workflow_branch_then_done.md` (private reference run, not in this repo)。

### 3. Phase 內 commit，phase 間 review

每 phase 結束 → 一個 commit → user review → 才下 phase。避免一個 commit 蓋 100 個檔。

### 4. 不 push、不 merge、不 deploy（除非明確指令）

「Done, merge」「ship」「出貨」+ 明確 verb 才動。「OK / 好 / 可以」**不算**。

## 6 階段詳述

### Phase 0 · State verify + branch

```
1. git status / git log → confirm clean state
2. git checkout -b refactor/<descriptive-name>
3. Snapshot: ls / find target files, record current line counts
```

⏱ 5 分鐘。

### Phase 1 · File moves (reversible)

```
1. mkdir new dirs
2. git mv <old> <new>（git-tracked 檔）OR plain mv（非 git-tracked）
3. Verify with ls + git status
```

⏱ 5-15 分鐘。

**不在這個 phase 改檔內容**。純結構動作。

### Phase 2 · Path reference updates

```
1. Run grep report → list affected files
2. Edit each ref one-by-one
3. Verify with re-grep（should return 0 stale refs）
```

⏱ 15-60 分鐘（取決於 ref count）。

**Hotspot pattern**：通常 80% refs 集中在 5 個 file（CLAUDE.md / README / index 檔等）→ 集中處理。

### Phase 3 · Content writing (new SoT / slim duplicates)

新建 SoT 檔 → 引用既有 / pointer to 既有 → 移除冗餘。

```
- 寫新 SoT file（如 design/guideline.md）
- Slim duplicates（如 CLAUDE.md 從 mirror table 改成 pointer）
- Add Decisions log / changelog section
```

⏱ 30 分鐘 – 2 小時。

### Phase 4 · Memory layer sync（vault / cwd-local）

```
- Update vault `_index.md` 對應 project 的條目
- Append decisions log entry（why we did this refactor）
- Update related cross-refs in vault tech/ patterns
```

⏱ 10-20 分鐘。

### Phase 5 · Verify + commit + present

```
1. Final stale-ref scan（全 0 才過關）
2. Git diff stats overview
3. Build / test verification（若涉及 runtime）
4. Commit on branch
5. Present summary for user review
6. WAIT for explicit "Done, merge"
```

⏱ 10-30 分鐘。

## Commit message convention

```
refactor(<scope>): <one-line summary>

<paragraph: why this refactor, what changed>

<bullet list: key changes>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

`<scope>` examples: `design-system`, `brand`, `docs`, `vault`, `agents`.

## Anti-patterns

| ❌ | Why |
|---|---|
| 一個 commit 蓋 50 個檔不分 phase | review 不可能；rollback 困難 |
| 移檔但沒 grep ref | 留下 broken link，下一個 session 才發現 |
| 改檔內容 + 移檔同 commit | 看不出哪個 line 是 path fix 哪個是 content edit |
| 「順手把 X 也整理一下」scope creep | refactor 失控；commit 散漫 |
| 自動 push 完才 review | user 無 review 機會 |
| Build error 還繼續 commit | 累積技債 |

## SSD Loop 應用

**[Micro] 你跑 refactor 時的真實 friction**：
- 不確定該動哪個檔 → 看 Phase 0 grep report 直接列出
- 不知道改完會不會炸 → Phase 5 verify 強迫 0 stale ref
- 半夜想 ship → Branch-then-Done 紅線擋住

**[Macro] 系統健康**：
- Phase 內 commit → git history 可讀
- Branch isolation → main 永遠 clean
- vault sync → 跨 session memory 不丟

## Coplot 是 N=1 reference run

完整 instance 見 `<your-vault>/.../coplot/brandbook_decisions_log.md` (private reference run, not in this repo) 2026-05-27 entry：
- 3 commits（f7eeb2e + 93473e2 + 6675847）
- 46 path refs across 24 files
- 5 hotspot files 占 80%
- Total ~3 小時 wall clock（含 SSD discussions）

## Promote 到 skill 的觸發條件

- N=2 reference runs completed（第二次幫 Climby / 其他 project 跑完）
- 80%+ 步驟一致
- → 抽 `~/.claude/skills/docs-reorg/SKILL.md`

在那之前，本檔 + checklist 已夠用。

## 相關

- Branch-then-Done 規範: `<your-vault>/.../coplot/workflow_branch_then_done.md` (private reference run, not in this repo)
- Brand + Design folder pattern: [brand-design-folder-pattern](./brand-design-folder-pattern.md)
- Stage 0 visual audit template: [stage-0-visual-audit-template](./stage-0-visual-audit-template.md)
- Cross-project handoff flow: [claude-design-handoff-flow](./claude-design-handoff-flow.md)
