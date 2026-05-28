# Claude Design → Claude Code Handoff Flow

> **目的**：紀錄「在 Claude Design 跑視覺探索 → handoff 回 dev codebase」的完整 workflow，做為跨專案可重用 pattern catalog。
>
> **狀態**：`complete (Coplot Run #1, 2026-05-22)`。Pattern 1-33 已 distill 完，可直接套用於 Climby / 其他 side project。
>
> **看 user-side playbook 請走** [claude-design-handoff-recipe](./claude-design-handoff-recipe.md)（怎麼下指令 + 怎麼接 Claude Code）。
> **看 Coplot 具體 per-PR 觀察** 請走 `../side/coplot/handoff_run_log_2026-05` (vault reference)。
> **看 brand + design folder 結構** 請走 [brand-design-folder-pattern](./brand-design-folder-pattern.md)。
>
> 本檔留：**方法論 outline + Pattern 1-33 catalog + Open questions + Climby 套用評估**。

---

## 為什麼這是 pattern（不只 coplot 一次性）

- Solo founder + 多 side project 的視覺工作模式
- Claude Design 與 Claude Code 各自擅長不同層級（exploration vs integration），handoff 接縫是關鍵
- 若這套 flow 收斂出來，Climby / yen_shine / 未來 side project 都能直接套，不用每次重發明

---

## Pre-handoff Test Prompts（給 Claude Design 跑，看它能力邊界）

### Test #1 — Token-first 能力驗證

```
請設計 NetDebtCard component，需求：
- Dark mode 與 Light mode 雙版本
- 顯示一個家戶「淨資產」數字（範例：NT$ 1,284,500）
- 上方一行 label「家戶淨資產」，下方一行 trend pill「最近 3 月 +2.4%」
- 數字使用 mono + tabular-nums

請輸出：
1. 對應的 CSS variable 命名（dark/light 各一組），假設我會放進 globals.css 的 :root 與 .dark
2. Component className（Tailwind utility），不要 inline hex，只用 semantic token name
3. 列出此 component 需要哪些 shadcn primitive（如果有）

Brand 紅線：無 success green、無 streak、無 emoji、Bold 700+ 禁用、語氣 sober。
```

**判斷信號**：
- ✅ semantic token className → 能寫 token-first
- ⚠️ raw hex (`bg-[#232328]`) → 需要更明確指示
- ❌ inline style / 自創 token 名 → 要寫詳細 spec

### Test #2 — Stateful component 能力驗證（Test #1 過了再跑）

```
請設計「公私切換 segmented control」，這是 Coplot 的 first-class navigation。
兩個 state：公領域（家戶/共享）與 私領域（個人）。
公領域 active 時用 coral 系（pub-tint #FF9967 為主），
私領域 active 時用 magenta 系（priv-tint #DE81FF）。
切換時 320ms layer fade-overlap，無 bounce。
請輸出 dark + light 雙模式 className。
```

---

## Workflow Template（待 Coplot 驗證後 finalize）

```
0. Prep (in dev codebase)
   - L3 token 衝突 reconcile
   - Stack + brand 紅線 spec 文件
   - Page route 對應決定
   - Stateful component 的 state management 決議
   - branch 開好 (chore/brand-foundation → merge → feat/handoff)

1. Claude Design side
   - 帶入 stack spec + brand 紅線
   - 跑 Test prompts 確認能力
   - 跑視覺探索 + variant
   - Handoff export: API + prompt + component code

2. Claude Code integration
   - 進 feat/handoff branch
   - 補 shadcn primitives
   - 接 state management
   - 加 RSC/Client boundary
   - 過 Visual Constraints checklist
   - 過 Voice Rules checklist (microcopy)
   - typecheck + manual diff (light/dark)

3. Post-handoff
   - Reconcile brand book to v(n+1)
   - 此 pattern file backfill 結論
```

---

## Coplot Run #1 (2026-05-20 → 2026-05-22)

**本段已遷移**：完整 per-PR observation + commit ref + 出貨後遺留 → `../side/coplot/handoff_run_log_2026-05` (vault reference)

**核心結論（給跨 project 套用者快速判讀）**：
- Test prompts skip 也行：Claude Design 第一次合作就出完整 handoff 包，品質穩
- Token-first 能力 ✅、stateful component 能力 ✅、跨頁面一致性 ✅
- Dev 端守門任務不可省（見 Pattern 6）
- Workflow 標準化：per-PR branch from main，handoff snapshot 平行存（見 Pattern 3）
- 主要踩雷：Tailwind `<alpha-value>` 靜默失敗（見 Pattern 7）+ PR base 起初選錯（見 Pattern 3 修正版）

---
## Reusable patterns extracted（給 Climby / 其他 side project 直接套）

### Pattern 1 — Handoff package 結構（5 檔）

Claude Design 端應該產出固定 5 檔，命名與順序固定：

```
handoff/
├── 00 README.md         — overall plan + PR sequence + pre-decided Q&A
├── 01 Page Mapping.md   — 設計術語 ↔ codebase route 對應表
├── 02 Diff Report.md    — 結構差異（哪些頁要合併、哪些要拆、哪些要 rename route）
├── 03 Design Tokens.md  — 完整 token spec（CSS vars + Tailwind config + Provider code）
└── 04 Prompts for Claude Code.md — 按 PR 切的 copy-paste prompts
```

**Why fixed**：Founder 後續開新 session 時知道哪個檔是哪個用途，不用每次摸索結構。

### Pattern 2 — Per-PR prompt 必含七元素

每個 PR prompt 應該包含：

1. **PR scope**（一句話）
2. **Source of truth**（指向 handoff/ 哪個檔）
3. **Dependencies**（依賴哪幾個 PR 已 merge）
4. **要做的事**（編號 list，每步具體）
5. **驗收條件**（可一眼判定 pass/fail）
6. **不在 scope**（防止 over-engineering）
7. **完成後請列出**（report-back 格式固定）

少任何一個就會出問題。

### Pattern 3 — Branch 結構（修正版 2026-05-20）

```
main                              ← production；每個 PR 都從這裡開
  ↑
  ├─ claude-design/pr-1-tokens    ← branched from main
  ├─ claude-design/pr-2-shell     ← branched from main (含 PR-1 已 merge)
  └─ claude-design/pr-N-<topic>   ← always from latest main

claude-design/handoff-N           ← 平行的 immutable snapshot（純設計源檔）
                                    ❌ 不是 PR base
                                    ✅ 給 review 時 diff 「Design 原意 vs 整合後」
```

**核心規則**：
- **PR base = `main`**（每次先 `git pull` 拿前一個 PR）
- **`handoff-N` 是平行 archive**，不在 PR 路徑上
- 兩個概念分離：「snapshot of design intent」≠「PR base」

**這次踩雷的痛點**（Coplot PR-2，2026-05-20）：
- 起初寫的 doc 說「每個 PR 從 handoff-1 開」→ PR-2 完全沒吃到 PR-1 → 視覺看似破但 build 不噴錯（Tailwind 對未知 class 沉默）
- Recovery cost: `git merge origin/main` + 3 個跟著的修

**好處（修正版）**：handoff snapshot 永不改、PR diff 永遠清晰、PR 自動累積前面的成果、可選擇性 revert。

### Pattern 4 — Token 系統 theme × palette 矩陣

如果 product 需要支援多 palette（Climby 也許需要：不同攀岩館主題色 / 不同 user persona 配色），這個正交矩陣 pattern 直接套用：

- `:root[data-theme="light|dark"]` 控 surface / text / border / shadow
- `:root[data-palette="..."]` 控 brand-tinted vars (`pub` / `priv` / `lens` / `halo`)
- Cookie-driven SSR：layout.tsx 在 server side 讀 cookie → `<html data-theme/data-palette>` 直接帶屬性 → 零 SSR flash
- ThemeProvider client component 暴露 `useTheme()` hook 給後續 Settings 頁切換用
- DB 表存 user 偏好，login 後讀 DB 覆蓋 cookie

完整實作參考 Coplot PR-1（commit `6a7b557`） + PR-2 recovery（commit `d3fa3b9`，把 `<alpha-value>` 補回）。

**⚠ Tailwind 必踩坑**：token 一律寫 `hsl(var(--X) / <alpha-value>)`，**不要**寫 `hsl(var(--X))`。少了 `<alpha-value>` 占位符，Tailwind 3 的 opacity 修飾子（`bg-pub/15`、`text-priv/60`）通通不會生效，但 build **不會噴錯**，只會靜默失效。Coplot PR-2 為這個踩了一次大雷。

### Pattern 5 — Backward-compat aliasing 兩層

Token rename 時必須清楚區分：

- **CSS vars**：保留 alias（`--old-name: var(--new-name)`）→ 任何 `hsl(var(--old-name))` 直接 read 仍 work
- **Tailwind utility classes**：要看 grep 結果決定 keep / remove。沒人用就移除（避免 dead code），有人用就保留

策略要明文寫在 PR commit message，不可隱含。

### Pattern 6 — Dev 端的守門任務 checklist

Claude Design 出 spec 不會涵蓋的，dev 端固定要做（v2，2026-05-20 PR-2 後擴充）：

**開 branch 前**：
1. ✅ `git checkout main && git pull` — 拿到所有 merged PR
2. ✅ `git checkout -b claude-design/pr-N-<topic>` — **不從 handoff-N 開**
3. ✅ Grep 既有命名是否跟 spec 一致（例：filter mode 既有 `family|personal|all` 而 spec 寫 `shared|personal|all`，需重對映）

**寫 code 前**：
4. ✅ 確認 spec 假設的 table / column 真的存在
5. ✅ DB migration 編號 +1（看當前最大編號）
6. ✅ Token 寫法檢查：`hsl(var(--X) / <alpha-value>)` 不是 `hsl(var(--X))`
7. ✅ Tailwind color 命名不要與 utility prefix 衝突（e.g. 別用 `bg-elev`，直接叫 `elev`）

**寫 code 中**：
8. ✅ Grep 確認 deprecated utility class 是否真的沒 consumer
9. ✅ 判斷新 token 與 legacy class（如 `.dark`）並存或替換

**Commit 前**：
10. ✅ 跑 `pnpm build` / typecheck — 但 **build pass ≠ visual works**（Tailwind 對未知 class 沉默）
11. ✅ 視覺驗證（dev server 跑起來、light + dark + 至少 2 個 palette 都翻一遍）
12. ✅ DevTools `<html>` 標籤檢查 data-theme / data-palette / .dark class 是否同步
13. ✅ Console 跑 `getComputedStyle(document.documentElement).getPropertyValue('--XXX')` 驗 token 真的有值

把這個 checklist 印出來/釘在 vault MOC，每個 PR 走一遍。

### Pattern 7 — Tailwind 「靜默失敗」是最大風險

Tailwind 3 對以下情況 **靜默不報錯**，但 runtime 視覺就是壞：

- ✅ Build pass + ❌ 視覺壞的可能原因：
  1. Token 缺 `<alpha-value>` placeholder → opacity 修飾子全失效
  2. Class 名 prefix 衝突（`bg-bg-elev`）→ JIT 不認、不 generate CSS
  3. CSS var 在當前 branch 未定義（漏 merge 前一個 PR）→ 引用變空字串、bg/color 透明化
  4. `dark:` variant 與 `[data-theme]` 屬性選擇器沒同步 → 部分元素切了部分沒切
  5. 設計源檔某個 inline style 寫了 backdrop-filter + mask，dev 抄漏 → 看起來像普通漸層

**對策**：dev 端不能光靠 `pnpm build` 判斷成功，**必須** dev server 視覺驗收（步驟 11–13）。Claude Design 給的「驗收條件」要每條手動跑一次。

### Pattern 8 — Token rename 的 3-grep 工作流

每次 token / enum / class name rename 前：

1. `grep -rn 'old_name' src/` — 找所有 consumer
2. 區分「intentional consumer（要改）」與「backward-compat 引用（保留 + 加 alias）」
3. Rename 完再 `grep -rn 'old_name' src/` 一次，確認結果只剩 alias 區塊

漏 grep 就會出 Coplot PR-2 那種「`@/app/transactions/new/TransactionForm` 改路徑時漏一個 absolute import」的編譯錯。

### Pattern 9 — Enum rename 跨層 discipline（DB / SQL / RPC 同步）

UI 改 enum 命名時，TypeScript 與 build pipeline **抓不到 DB-side SQL 內部還在用舊命名**。Coplot PR-2 踩這個：rename `family|personal|all` → `pub|priv|all` 時改了 frontend，但 `supabase/migrations/0028_dashboard_rpc.sql` 的 `CASE p_filter_mode WHEN 'family' THEN ...` 沒同步 → frontend 送 `pub` 進 RPC 走 ELSE ≈ `all` → list 不變 + build 不報錯。

**3 種處置**（按 cost 排）：

1. **邊界映射 helper**（cost 低，PR-2 採用）
   ```ts
   export function toDbFilterMode(m: FilterMode): "family" | "personal" | "all" {
     if (m === "pub") return "family";
     if (m === "priv") return "personal";
     return "all";
   }
   ```
   送 RPC / DB-bound query 前過一層。UI 用新名、DB 用舊名、helper 是唯一接縫
2. **DB 跟著 rename**（cost 中）
   新增 migration 把 RPC body 內的 enum 字面值換掉。乾淨但需要重 deploy migration
3. **DB 端用 TEXT 不限值**（cost 高，不建議）
   失去 RPC 內部 validation

**Rename checklist 必加項**：
- [ ] grep `'<old_value>'` 在 `supabase/migrations/**/*.sql` 也跑一次
- [ ] grep `'<old_value>'` 在所有 `.rpc(` call 的參數值
- [ ] 任何 `.eq("col", "<old_value>")` 字面值

### Pattern 10 — `type X from "pkg"` 不是萬靈丹

`import { ..., type Foo } from "pkg"` 照 TypeScript spec 應該在 compile 時 erase（runtime 完全沒這個 reference）。但 **Next.js SWC pipeline 在某些 case 沒乾淨 erase**，留下 `pkg.Foo`，如果 `Foo` 在那 package 不存在 → runtime `undefined`。

Coplot PR-2 踩：`import { type LucideIcon } from "lucide-react"` 但 `lucide-react@1.14.0` 沒 export 這個 type → runtime error `Cannot read properties of undefined (reading 'default')` from React 的 component-resolve path。

**3 條 rule**：

1. **不從 package import 不存在的 type**。`node -e "console.log(typeof require('pkg').Foo)"` 先確認 export 存在
2. **package 有 `.d.ts` 但 runtime 沒對應 value 時，型別本地反推**：`type Foo = typeof someExistingExport`
3. **`@types/*` separate package 的 type import 是安全的**（runtime 本來就沒對應 module），但 package 自帶 types 時必須驗證

### Pattern 11 — 跨頁面 contract 第一次用到就抽 pattern

PR-3 v1 暴露：第一個用到 layout container / category icon / currency formatter 的頁面（Ledger），如果 inline 寫死，下個頁面（Insights / Search / Compose）就要 copy-paste 或重抽。

**規則**：以下三類東西第一次用到時直接寫 reusable pattern，**不要先 inline**：
- **Layout container**（max-width / centered wrapper）→ Tailwind token `max-w-container`
- **Icon mapping**（category name → icon component）→ 獨立 `<CategoryIcon>` component
- **Format helpers**（currency / date / 數字）→ 獨立 `src/lib/<topic>.ts` 模組

辨識訊號：「我這寫的東西，下個 surface 也會用到嗎？」如果答案是 yes（或 maybe），第一個 PR 就抽。

### Pattern 12 — `<alpha-value>` 補完要 cover _全部_ token

PR-1 只在 Coplot token 補 `<alpha-value>` placeholder；PR-2 發現 shadcn 既有 token（background / card / popover / primary / ...）沒 cover、`bg-card/50` 等失效；PR-3 v3 才補完。

**規則**：寫 Tailwind color token 一律 `hsl(var(--X) / <alpha-value>)`，**不分 brand 自有還是 shadcn 預設**。Migration 時 grep 整份 tailwind.config.ts：

```bash
grep -n "'hsl(var(--[^)]*))'" tailwind.config.ts   # 找漏網的 token
```

沒 `<alpha-value>` 的 token 都要補。

### Pattern 13 — Brand type scale 一進場就 wire Tailwind

如果 brandbook 有定義 type scale（e.g. CLAUDE.md `display 28 / h1 22 / h2 18 / h3 16 / body 15 / body-sm 13 / caption 11`），**在 PR-1 token wiring 就一起進 Tailwind config**：

```ts
// tailwind.config.ts
fontSize: {
  caption:   ['11px', { lineHeight: '1.4' }],
  'body-sm': ['13px', { lineHeight: '1.6' }],
  body:      ['16px', { lineHeight: '1.6' }],
  h3:        ['16px', { lineHeight: '1.3' }],
  h2:        ['18px', { lineHeight: '1.3' }],
  h1:        ['22px', { lineHeight: '1.3' }],
  display:   ['28px', { lineHeight: '1.3' }],
}
```

如果沒先 wire，dev 寫 component 時遇到「spec 寫 15px」會 fallback `text-[15px]` → 散布 arbitrary 值，後續 migration 變大工程。

也要預留 brand scale 之外的 hero size（balance card 44px 之類）：標 `display-xl` 補完。

### Pattern 14 — next/font/google 必加 `latin-ext` subset

Default `subsets: ["latin"]` 只含 ASCII + Latin-1 + 部分 currency（含 €、£、¥）。**但 ₩ / ₫ / ₱ / 等多數 currency symbol 在 U+20A0–20AB**，需要 `latin-ext` subset。

```tsx
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono" });
```

漏了會 fallback 到 system font（macOS 常 fallback 到 Hiragino Sans Korean）→ 一顆字突然變超大、整行排版亂掉。**遇到任何國際化 / 多幣別 app 必加**。

### Pattern 15 — Currency symbol 拆 sans/mono 兩個 font 渲染

即使字型 subset 包了 ₩，**mono font 內的 currency symbol glyph 常與 0-9 metrics 不一致**（JetBrains Mono、Roboto Mono 都會踩）。

**架構**：

```ts
// formatter returns 3 parts
formatPrimary(amount, currency, base)
  → { code: 'EUR' | null, symbol: '€', number: '43.5' }
```

```tsx
<p className="font-mono tabular-nums">
  {code && <span className="font-sans text-caption">{code}</span>}
  <span className="font-sans">{symbol}</span>      {/* Unicode 覆蓋廣的 sans */}
  {number}                                          {/* mono 等寬數字 */}
</p>
```

Symbol 跟數字本來就不該共用 font。**這是業界 fintech UI 常見作法、不是 hack**。

### Pattern 16 — `space-y-*` / `divide-y` specificity 雷

Tailwind 的 `space-y-N` 編譯成 `.space-y-N > :not([hidden]) ~ :not([hidden]) { margin-top: ... }`，specificity (0, 2, 1)。**子元素 utility `mt-X` (0, 1, 0) 蓋不過。**

```tsx
{/* ❌ 想設第二個 child 多一點 margin，蓋不過 */}
<div className="space-y-2">
  <p>label</p>
  <Hero className="mt-3" />   {/* 仍然是 8px，不是 12px */}
</div>

{/* ✅ 顯式 per-child margin */}
<div>
  <p>label</p>
  <Hero className="mt-3" />   {/* 真正 12px */}
</div>
```

`space-y-*` 是父層批次設 margin 的便利語法、**不適合需要 per-child 微調的版面**。寫 hero / dashboard / form 等複雜 vertical rhythm 時，**預設別用 space-y**。

### Pattern 17 — Real toast = URL param + client component + auto-fade + URL cleanup

Form actions / search params trigger 「成功」訊息很自然（`?added=1` 等），但 inline RSC banner 會卡在頁面內：

- 不會自己消失（query param 還在）
- 需要 user 動作清掉（refresh / 手動切頁面 / 程式清 param）
- 不能跨頁顯示（每個 page 都得寫一份）

**正確 toast pattern**：

```tsx
// AppShell render 一次的 client component
"use client";
const SEARCH_KEYS = ["added", "settled", "updated", "deleted", "welcome"];

export function Toaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const triggered = SEARCH_KEYS.find(k => searchParams.get(k));
    if (!triggered) { setVisible(false); return; }
    setMessage(MESSAGES[triggered]);
    setVisible(true);

    const hideAt = setTimeout(() => setVisible(false), 2700);
    const cleanAt = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      SEARCH_KEYS.forEach(k => next.delete(k));
      router.replace(`${pathname}${next.toString() ? "?" + next : ""}`, { scroll: false });
    }, 3000);

    return () => { clearTimeout(hideAt); clearTimeout(cleanAt); };
  }, [searchParams, router, pathname]);
  ...
}
```

關鍵：
- 2.7s 顯示 + 0.3s opacity fade-out → 3.0s `router.replace` 清 param
- `{ scroll: false }` 避免 scroll 位置跳掉
- 全 app 一個 component（放 AppShell），每個 page 不用各自 render
- aria-live="polite" + role="status"

完整實作見 Coplot `src/components/shell/Toaster.tsx`。

### Pattern 18 — Cross-surface dismissible banner

同個 UI（如「邀請伴侶」banner）出現在多個頁面，dismiss 行為需要 per-surface 不同：

- **首頁**：可以「稍後再說」（dismiss）→ banner 在所有 routes 隱藏直到觸發條件改變
- **Settings / More**：banner 是「之後再說」的目的地、再讓 user dismiss 就是死循環 → 永遠顯示

**乾淨解**：component 加 `dismissible?: boolean` prop (default true)
- `true`：讀 `localStorage` flag、顯示「稍後再說」button
- `false`：跳過兩者，永遠顯示

```tsx
<InviteBanner dismissible />              {/* Ledger 默認 */}
<InviteBanner dismissible={false} />     {/* Settings/More */}
```

`localStorage` key 用 component-specific（e.g. `coplot.invite_banner_dismissed`）跨 route 持久；配對成功觸發 component 根本不 render，flag 自然失效（不需主動清）。

### Pattern 19 — Derived effective state 不寫 cookie

User 偏好（filter mode / theme / etc）存 cookie 是 source of truth。但有些狀態組合下，user 偏好需要被 override（如未配對 user cookie 是 pub → 看不到任何資料）。

**反 pattern**：在 effect 裡強制改 cookie。
- 副作用：配對成功後 cookie 已被改掉、user 原偏好丟失。

**正解**：page render 時 derive effective state、cookie 不動：

```ts
export function effectiveFilterMode(raw: FilterMode, isPaired: boolean): FilterMode {
  return !isPaired && raw !== "priv" ? "priv" : raw;
}
```

```tsx
// page.tsx
const mode = effectiveFilterMode(getFilterMode(), membership.isPaired);
```

配對狀態改變的瞬間，effective mode 自然 recompute、cookie 仍是 raw user 偏好。

更廣的 principle：**任何 derived state 不寫 storage**。Storage 只存 user explicit choice、derive 由 render 邏輯做。

### Pattern 20 — 程式碼一致 ≠ 視覺一致（鎖到「物理量」而非「token 值」）

PR-4 v8 把所有 lucide icon `strokeWidth` overrides 拿掉、用 default = 2，**程式上完全一致**。但因為 `strokeWidth` 是 SVG viewBox（0–24）內部單位，渲染到不同容器大小時螢幕線寬不同：

```
14px 容器 × stroke=2 / 24 = 螢幕 1.17 px
20px 容器 × stroke=2 / 24 = 螢幕 1.67 px
28px 容器 × stroke=2 / 24 = 螢幕 2.33 px  ← 視覺粗了快兩倍
```

解：`<Icon icon={...} size="...">` wrapper 反向算 `strokeWidth = 24 × 1.5 / containerPx`，鎖**螢幕物理 1.5 px**。

**原則**：DS 合約要鎖到「使用者眼睛看到的物理量」，不是「token 名稱 / className / strokeWidth 數值」。任何 contract 都該 trace 到最終物理結果。

**注意：造型 / 背景對視覺粗細的影響無法靠程式解** — Bell 比 Plus 線多就是會視覺重；pub solid 背景 + Plus 就是會比 card 灰底重。這部分要靠設計收口（icon 挑選、背景對比規則），不該嘗試用程式 enforce 所有視覺一致性。**程式可鎖 / 設計收口 是兩條線**。

完整實作見 Coplot `src/components/Icon.tsx`。

### Pattern 21 — 孤兒 server action audit

「Server action 寫好但沒接 UI 入口」= hidden capability，DB / 後端 / 排程都有用，但使用者打不到。

Coplot 案例：`toggleNotifyOnDueAction(ruleId, nextValue)` 早就在 `actions.ts`、`notify_on_due` column 有、cron 在用、create form 有勾 — 但 list 上的 toggle UI 被改成 pause/resume 後 notify 入口消失，server action 變成「孤兒」。

**Audit 手法**：

```bash
# 找出所有 server action
grep -rn "^export async function" src/**/actions.ts

# 對每個 action 名字反查有沒有 component 呼叫
grep -rn "toggleNotifyOnDueAction(" src/
```

沒呼叫的：要不補 UI 入口、要不刪掉 — 不該長期擺著（會誤導未來工程師以為「這個功能還在用」）。

**補 UI 接既有 action 的價值**：成本極低（Coplot 案例 18 行 UI），risk 趨近零（沒碰後端 / DB / cron）。**「孤兒 server action」常常是最低成本的 product win**。

### Pattern 22 — DS 合約三層 enforcement 強度

當你決定一個 DS 合約時，要明確選 enforcement 強度，對應「違反成本」：

| 強度 | 工具 | 例子 | 違反方式 |
|---|---|---|---|
| 最強 | Component | `<PrimaryButton>` `<Icon>` `<UserAvatar>` | 不 import 它就用不到合約 |
| 中 | className constant | `PRIMARY_CTA_CLASS` | 可以選擇用 / 不用 |
| 中 | Helper function | `formatAmount()` `formatHero()` | 同上 |
| 弱 | Library default | lucide stroke = 2 | 完全靠開發者紀律 |
| 文字 | CLAUDE.md / brandbook | 「44px CTA」 | 完全靠紀律 + review |

**選錯強度的 cost**：v8 Coplot 試了「移除 strokeWidth override → 靠 lucide default」是「弱 enforcement + 沒解到根本問題」雙錯。v9 退回 Wrapper（最強 enforcement）。

**原則**：

- 違反會直接造成視覺 / 行為錯誤的 → Component
- 違反有彈性、特殊 case 可豁免的 → className constant 或 helper
- 不違反也不會出錯的事實規範 → 文字（如 spacing token 命名）

### Pattern 23 — 動畫單向 vs 雙向

Coplot PendingHighlight v7 原本「ring 散開 → 縮回 → 消失」雙向，使用者覺得困惑（看不出是什麼事件結束 / 開始）。改 single-pass「expand + fade out」後語意乾淨。

**原則**：

- **動畫描述「事件發生」** → 單向（淡入 / 滑入 / 散開）
- **動畫描述「狀態切換」** → 可雙向（drawer open/close、modal in/out）
- **動畫描述「事件來回」** → ❌ 通常是過度設計

實作建議：transient feedback（高亮某個 surface、確認某個 action 完成）一律單向、播完即 unmount，不要寫「狀態回到初始」的邏輯 — 那是 state 切換，不是事件。

完整實作見 Coplot `src/app/(app)/recurring/PendingHighlight.tsx`。

### Pattern 24 — DB enum vs UI capability：跨 schema 邊界要拆 PR

當 UI 想引入新 capability，但底層 DB enum / schema 不支援時，**絕不在 visual PR 裡偷塞 schema 改動**。

Coplot PR-5 案例：sheet 加 Income chip 看似純視覺，但 `createTransactionAction` 寫死 `type: "expense"`，且 DB `transaction_type` enum 沒 `'income'` value。若 UI 提交 `type=income` → Postgres 直接 runtime error（unknown enum value）。

**規則**：

1. UI capability 跨 enum / RLS / RPC 邊界時，**先 grep migrations / actions 確認 schema**
2. 若 schema 不支援 → **stop + 告知 user**，給三個選項：
   - A：UI 留 visual only，標記為 "deferred to schema migration PR"
   - B：本 PR 加 enum migration（簡單 case 如 ADD VALUE，forward-compatible）
   - C：放棄這個 capability（confirm with user）
3. 若 user 選 A → 留註解標明，避免未來工程師以為 "Income chip works" 而誤用

**Audit pattern**：每次新 chip / button 加入，問：「這個 field 在 DB 裡的可選值是什麼？」如果不知道 → 先 grep `CREATE TYPE` / `CHECK` / enum 定義。

### Pattern 25 — Process 也是 design system：Skills 是 DS 第三條腿

傳統 design system 收兩件事：
1. **Component**（怎麼長 — `<PrimaryButton>` / `<Icon>` / `<UserAvatar>`）
2. **Rule**（怎麼用 — CLAUDE.md / brandbook / interaction floor）

Coplot PR-5 補上第三條：
3. **Skill**（怎麼決策 — Claude Code skills，trigger phrase + template + workflow）

具體：`component-handoff` skill 把「下次想換 lib / 統一元件 / 引入新 component pattern」這個對話模式收口成可觸發 process。trigger phrase 涵蓋「需要安裝什麼 / 想換成 X / 統一 …」等。觸發後 skill 主動 pre-fill template（從 CLAUDE.md / 對話脈絡 / package.json / brand axioms 四個 source 抓），未填處標 `[?]`，等 user 填完轉 engineering review。

**為什麼這是 DS contract 而不是「個別 skill」**：
- 過去 5 個 PR 每次都重新發明這個對話流程 — 證明它是 recurring pattern
- 沒寫進 skill 一定 drift（跟 Pattern 22 「沒寫進 DS 就 drift」原則一致）
- 觸發、預填、輸出格式三件事是 contract，不是 individual preference

**範式**：當對話模式累積 ≥3 次重複，就該檢查能否收成 skill。Pre-fill source order = chisel skill 可重用的 standard。

### Pattern 26 — Emoji 違反物理量 contract

Pattern 20 講「DS 合約要鎖物理量而非 token 值」（icon stroke = 螢幕 1.5 px）。Emoji 是這條規則的延伸 case：

| 維度 | Lucide icon | Emoji |
|---|---|---|
| 渲染來源 | inline SVG，路徑可控 | OS font，三套詮釋 (Apple / Google / MS) |
| Color | inherit CSS `color`（可走 token）| 固定字型 glyph 色 |
| Stroke 補償 | 透過 `<Icon>` wrapper 反算 | 完全不參與 |
| Theme 切換 | 自動 | 失效 |
| 跨 OS 一致 | ✓ | ❌ |

**結論**：emoji 不存在於 in-app surface（DS contract enforce）。

**例外標明**：跨平台 message template（LINE Flex / push notification / email）—— 那些 surface 無 inline SVG 能力，emoji 仍允許。In-app（web / native shell）零容忍。

**User 輸入內容**（description / note）不在此規範 — emoji 來自 user 端，UI 不主動 strip（保留 user 意圖）。

**Audit pattern**：grep emoji Unicode range（`U+1F300–1F9FF` + 部分 `U+2600–27BF`）→ 列出來逐一檢視。

### Pattern 27 — Form pending state 是防呆 first-class

Server action 提交慢時，使用者連點 Save → 同 form 提交多次 → DB 重複 insert。這在金融場景特別痛（Coplot dogfood 實測：一筆週期交易連點 5 次出 5 筆）。

**錯誤思路**：server-side dedup（idempotency key / 5 秒內 same desc 拒絕）— 複雜、要動 server action 邏輯、scope creep。

**正確思路**：`useFormStatus()` 在 form 內子孫 component 拿 pending state → 自動 disable + spinner + label 切換。**第一次點下 → pending=true → button disabled → 後續點擊事件不發出**。1 行邏輯解 1 個 critical bug。

**結構要求**：要讓 useFormStatus 拿到 pending，**form 必須包住 Save button + Cancel button**。常見錯誤：title bar 在 form 外面用 `form="…"` attribute 連結 — useFormStatus 拿不到。

**Cancel 也要 disable**：pending 期間使用者按 Cancel → 動作已送出後再 cancel UI 沒意義，反而造成混亂。Cancel 也讀 pending → 變 disabled。

實作見 Coplot `src/components/compose/ComposeForm.tsx` 的 `SaveButton` + `CancelButton`。

### Pattern 28 — RSC client boundary：function / value 不能從 `"use client"` 跨過去

Next.js App Router 規則：被 `"use client"` 標記的 file，**所有 export** 都會被當作 client reference。Server component (RSC) 從 client file import 進來時：

- **Component** → 拿到 `<ClientReference>` wrapper，render 時 Next.js 內部處理 hydration ✓
- **Function** → 拿到 `<ClientReference>` wrapper，**call 它會 runtime error**「is not a function」❌
- **Constant / value** → 同上，拿到 wrapper 不是真值
- **Type-only import** (`import type ...`) → 完全 OK，compile time erase，runtime 無痕跡

PR-5b 案例：`LedgerFilterChips.tsx` 是 `"use client"`，同檔 export 了 `parseLens(url) → Lens`。`page.tsx` (RSC) `import { parseLens } from "@/components/LedgerFilterChips"` → runtime 爆「parseLens is not a function」。

**解法**：把 type + 純 function 抽到中性 module（不含 `"use client"`），server / client 都能 import。

```ts
// src/lib/lens.ts — 沒有 "use client"
export type Lens = "all" | "expense" | "income" | "by-me" | "by-partner";
export function parseLens(raw: string | null | undefined): Lens { ... }

// src/components/LedgerFilterChips.tsx — "use client"
import type { Lens } from "@/lib/lens";  // type-only OK 即使從 client 端

// src/app/(app)/page.tsx — RSC
import { parseLens } from "@/lib/lens";        // value，從中性 module 來
import { LedgerFilterChips } from "@/components/LedgerFilterChips";  // component，OK
```

**Audit pattern**：每個 `"use client"` file 開頭，問自己「這個檔的 export 會不會被 server 端 import 為 value？」如果會，把那個 value 搬走。

**跟 Pattern 10 的關係**：Pattern 10 講「import type 從 package 內可能 SWC 沒乾淨 erase」— 那是 type import 的雷。Pattern 28 是反向：「value import 跨 client boundary 一定壞」。兩條合起來看：**跨 boundary 的 import，type 用 `import type`、value 走中性 module，never both from same `"use client"` file**。

### Pattern 29 — Schema migration safety：non-backwards-compatible 改動必須 migration-first

**問題模式**（跨 project 通用）：

```
code 期待 schema X → schema 還沒到 X → query 失敗 → UI 顯空 → user panic 以為資料消失
```

實際 DB rows 完好，只是 query 爆。同樣模式：INSERT 帶不存在的 column → server action 卡 pending。

PR-5b dogfood 撞過：3 條 migration（0030/0031/0032）沒 apply，code 已 deploy → `getRecurringRules` SELECT `tx_type` 失敗、helper return `[]`、rules 列表顯「0 條規則」。詳細 incident 看 `log_2026-05-22_pg_enum_migration_chain` (vault reference)。

**規則**：

1. **Non-backwards-compatible schema 改動**（new column without DEFAULT / DROP COLUMN / RENAME / 新 enum value 且 code 立刻引用 / RPC signature 變）→ **強制 migration-first**：先 apply schema，再 deploy code。順序錯 = UI 看似資料消失 / 寫入卡死
2. **Backwards-compatible 改動**（ADD COLUMN with DEFAULT、ADD VALUE to enum 但 code 還沒引用、CREATE OR REPLACE FUNCTION 邏輯擴充）→ 順序可逆，**但 PR 仍要 explicit 標記**「⚠ schema migration included」+ 列出檔名，避免 reviewer 漏看
3. **PR description / commit message** 一律標 `⚠️ 包含 schema migration: <檔名>` + 是否 backwards-compat。AI 助手在「PR done」前主動 confirm `migration apply` 狀態 — 別等 user 撞到 panic
4. **Destructive migrations**（DROP / RENAME）= 高風險 backwards-incompatible，加 backup + 雙寫過渡

**Project-specific apply 方式**：由各 project CLAUDE.md 的 `Schema Migrations` section 定義（commands / runner / 禁用工具）。AI 助手動 schema 前一律先 grep project CLAUDE.md 找該 section，沒有就主動建議 lock 一個。

**Coplot 實作**：見 `<repo>/CLAUDE.md § Schema Migrations`（commands、idempotency guards 必加、PG enum chain 拆檔規則、Studio / Supabase CLI 禁用）+ `log_2026-05-22_pg_enum_migration_chain` (vault reference) postmortem（incident 完整 + SSD loop + tracking-table 決定不加的 trade-off）。

**跟 Pattern 24 的關係**：Pattern 24 講「UI capability 跨 enum / schema 邊界要拆 PR」（**該不該動 schema**）；Pattern 29 講「**已決定動 schema 後，怎麼安全 apply**」。一前一後配套。

### Pattern 30 — Annotation visual weight 配合「重要度 × 距離」

不是所有 inline annotation 都該 banner with bg。三層 weight：

| 視覺強度 | 樣式 | 用途 |
|---|---|---|
| 強（bg-card + multi-line）| 整段 banner | Critical hint / 法規告知 / 大幅 state change |
| 中（無 bg + AlertCircle icon + 1 line）| Inline 灰字 caption | Contextual reminder（「不可改」「不溯及既往」）|
| 弱（inline 灰字無 icon）| Pure caption | Auxiliary info（「依過去紀錄帶入」「點上方叫鍵盤」）|

**距離原則**：annotation 應該放**靠近被註解的物件**（max 1 chip row 內）。Banner 上方對「全 sheet 都適用的 hint」OK；對「只跟某幾個 chip 相關的 hint」就應該下放 inline 接在物件後面。

**Coplot PR-5c 案例**：「已記為支出/個人（建立後無法變更）」原本放頂部 banner（合併 + bg-card），user 看不清楚是註解誰 → 改放 chip row 1（含支出/個人 chip）的下一行 inline caption「! 建立後無法變更」，閱讀路徑從「看頂部 banner → 視線回到 chip 找對應」（兩跳）變「看到 chip → 視線往下一行 → 看到註解」（零跳）。

**Audit pattern**：每個 annotation 問三件事 — 1) 重要度？（critical / contextual / auxiliary）2) 註解誰？（某 chip / 某 region / 整 sheet）3) 距離？（>1 row 太遠）。配對到正確的 weight + 位置。

### Pattern 31 — Server action `redirect()` 在 client try/catch 內要 swallow `NEXT_REDIRECT`

Next.js server action 用 `redirect()` 是透過 throw `NEXT_REDIRECT` Error 觸發 navigation。在 client 端 `await + try/catch` 該 action：

```ts
try {
  await deleteAction();  // 內部 redirect
} catch (e) {
  const msg = e instanceof Error ? e.message : "";
  if (!msg.includes("NEXT_REDIRECT")) {
    alert(`刪除失敗：${msg}`);  // 只 alert 真錯誤
  }
  // 不要 setState — redirect 已 navigate，component 已 unmount
}
```

否則 user 看到「刪除失敗：NEXT_REDIRECT」實際上刪除成功 + 已 navigate，誤導 + scary。

**根因**：Next.js `redirect()` 借用 throw 機制做 control flow（不是真 error）。client 端不該攔，但若用 try/catch（為了真正錯誤處理）就要 distinguish.

**Audit pattern**：grep client component 內 `try.*await.*Action` → 確認 catch 內有處理 `NEXT_REDIRECT`。沒處理 = 潛在 false alarm。

### Pattern 32 — Pre-PR spec scope clarification（**三方 SoT 對齊**：spec / mock / backlog）

開 PR 前必須對齊**三個 source of truth**，常見誤踩是只看其中一兩個：

| Source | 位置 | 內容 | 風險 |
|---|---|---|---|
| **Spec** | `handoff/0X PR-N.md` | 文字 spec + code 範例 | spec 寫的人可能沒同步 mock |
| **Mock** | `handoff/phase4/*.jsx` 或設計檔 | Visual layout，最終視覺 | 跟 spec text 可能脫節 |
| **Backlog** | `vault/...handoff_flow.md` 出貨後遺留表 | 跨 PR 計畫 | 容易誤期待 PR-N 順手做 |

**Coplot 兩次踩到的 case**：

**Case 1（PR-6 開工初版，2026-05-22）— Backlog 誤期待**
- Backlog 寫「PR-6 Insights 一起做」shadcn date picker / income trend
- spec 明寫 ❌ 不在 scope
- AI 助手沒區分，差點塞進 PR-6
- 解：對照 backlog vs spec，**沒進 spec 的不做**

**Case 2（PR-6 出貨後驗 mock，2026-05-22）— Spec / Mock 嚴重脫節**
- Spec D 寫「全部用 dominant 色」（單色策略）
- Mock 用 6 色固定 mapping（多色策略）
- Spec 沒提 FOR YOU section
- Mock 有 3 條 insight cards
- 我只讀 spec 直接寫，**沒回頭驗 mock 視覺**
- 出貨後 user 對比 mock 截圖 → 視覺落差超大 → PR-6 v2 follow-up 重做

**規則**（compose / handoff skill 的 pre-fill template 加這 3 條）：

1. **三 source 都要讀**：spec text + mock JSX/設計檔 + 該 PR 之前的 backlog entry
2. **衝突主動 raise**：spec ≠ mock 時不要選一邊，**列出衝突 + 請 user 裁決**
3. **Backlog ≠ Spec**：backlog 是「未來想做」，spec 是「這 PR 明確做」。沒進 spec 的不做

**Audit pattern**：
```
PR-N 開工前 checklist：
  [ ] 讀 handoff/0X PR-N.md (spec)
  [ ] grep handoff/phase4/ 找對應 mock JSX (e.g. P4InsightsScreen)
  [ ] 對照兩者 — 有衝突列表給 user
  [ ] grep handoff_flow.md PR-(N-1) "出貨後遺留" → 標哪些在 scope / 哪些不在
  [ ] confirm 後才開工
```

跟 Pattern 22 (DS 合約 enforcement) 互補 — 22 講「規則層 SoT」，32 講「scope 來源 SoT」。

### Pattern 33 — Brand axiom vs Design mock 衝突的 reconcile process

設計 mock 可能用了違反 brand axiom 的 copy / pattern，這時不該照 mock 寫，也不該直接把 axiom 改成允許 — 要走 explicit reconcile：

**Coplot PR-6 案例**：

| Mock copy | Axiom 衝突 |
|---|---|
| 「教育類別連續 3 個月增加，**建議檢視**」 | Axiom B「不下結論、不建議、不警告」 |
| 「夏季旅行還缺 NT$ 41,600，按目前速度**可在 6 月達標**」 | Axiom B「prescriptive coach」「演進度條」 |
| 「咖啡支出比上月增加 38%，**要不要設個提醒**？」 | Axiom B 同上 |

→ Mock 文案 = prescriptive coach 口氣
→ Axiom B = pattern-surfacing mirror only

**Reconcile 三條路**（不該無預警選一條）：

**Path A — Reword 為純 observation**：保留資訊但拿掉建議語氣
```
「教育類別連續 3 個月增加，建議檢視」
→ 「教育類別 5/4/3 月都比前月高」
```
保 axiom，犧牲 mock 文案。

**Path B — 鬆綁 axiom**：explicit chisel session 把 B 從「不下結論」改成「可給 observation 級提示」
→ 觸發 brand 30-day cool-off
→ 寫進 `brandbook_decisions_log` (vault reference)

**Path C — 該 feature 移後**：等 axiom 決定再做
→ Insights v2 / FOR YOU section 留 backlog，PR-6 v1 不實作

**規則**：
1. AI 助手實作前 **explicit raise**「mock copy 跟 axiom 衝突」
2. 不替 user 偷選 path — 三條路列給 user 決定
3. 選 B 路徑（鬆綁 axiom）一定寫進 brand decisions log + 觸發 cool-off
4. 選 A 路徑（reword）也要 explicit 紀錄哪些 mock copy 被改寫，避免 mock vs 實作 diff 累積

**Audit pattern**：每個 PR 讀 mock 時，highlight 動詞 / 形容詞層級的 copy（「建議」「該」「快」「必」「應」「可」「達標」等），對照 brand voice keywords forbidden list + axiom statements。撞到就 raise。

跟 Pattern 26 (emoji 禁令) + Pattern 23 (動畫單向) 同屬「brand contract enforcement」line — Mock 不是 brand SoT，brand book 是。

---

## Climby 潛在套用評估

待 Coplot 第一次跑完後，根據以下維度評估 Climby 是否比照走：

| 維度 | Climby 適配性 |
|---|---|
| 是否有成熟 brandbook | ? |
| 視覺 surface 數量 / 複雜度 | ? |
| 是否已有 dev codebase 雛形 | ? |
| Stateful component 比重 | ? |
| Founder 時間預算 | ? |

---

## Open questions（待經驗回答）

- Claude Design 能否處理 multi-component 一致性（不是單一 component），還是要分 surface 餵？
- Handoff 出來的 code 是否能直接吃 `tailwind.config.ts` 的 semantic token，還是要手動 rewire？
- 兩邊（Design / Code）對 RSC 邊界的理解差距有多大？
- 同一個 design session 跑多次 iteration 後，Claude Design 是否會 drift 離 brand 紅線？
- Token export 格式是否穩定可解析（要不要寫 adapter）？

---

## 回饋去向

跑完一輪後：
- 此檔結論段填好
- 觸發 `../side/coplot/brandbook_decisions_log` (vault reference) 新 entry（如果有發現新 brand 衝突）
- 如果 pattern 穩定 → 提升為 SKILL 形式（candidate name: `claude-design-handoff` skill）
