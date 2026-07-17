# Figma Archivist Playbook

> Cross-project **method SoT** for the `ds-figma-archivist` agent (code → Figma archival). Project-agnostic on purpose: it holds *how to archive well*, never any one product's facts.
>
> **Project specifics** (Figma file key, node ids, DS styles, local components, frame sizes, decisions) live in that project's `<repo>/design/figma-archive.md`. This playbook holds the QUESTIONS; the project SoT holds the ANSWERS.
>
> The agent points here for depth (深度外置). Keep the agent definition thin; grow this file, not the contract.
>
> **Premise:** code is the source of truth; Figma is a downstream archive — on any code-vs-Figma conflict, code wins.

## First principles

1. **Measure, don't approximate.** Spacing, size, and color come from an exact source — the code's design tokens / Tailwind classes, or computed styles captured from the running app. A screenshot only *verifies*; it never *sources* a number. Eyeballing gaps from an image is the root of "small errors that keep coming back".
2. **A dev-truth reference is mandatory for fidelity.** Diff every build against a reference of *what the app actually ships* (a live/captured render), not against code intent and not against the Figma file's own frames (those can be stale). No dev-truth reference → **your first move is to stand up the project's capture harness config and run it** (see below) — NOT to accept MEDIUM. Cap at MEDIUM only for the specific states the harness genuinely can't reach (auth/backend-gated), and name which.
3. **Existing-instance-first — but validate against dev-truth.** Reuse the components/instances the target file already uses before searching a DS by keyword. A same-named DS component is often visually wrong; a reused instance is only as current as whoever last edited it — if it disagrees with dev-truth it is stale: flag it, don't silently clone it.
4. **Confirm scope before building.** Surface (which finalized screen/state), destination (file + page), and **target frame dimensions / breakpoint convention** are required inputs — never defaulted. The agent can't ask interactively, so the orchestrator gathers these and passes them in.
5. **Build, then an *independent* critic.** The builder self-verifying is author=critic — it spot-checks a few values and misses the rest. Gate every build behind a fresh, metrics-anchored critic that objectively diffs built geometry against the reference and lists every divergence over a small threshold. (Mirrors `ds-reviewer` ⟂ `ds-designer`.)
6. **Small atomic passes; isolate destructive ops.** The Figma plugin runtime is fragile (stale-node reads, silent property misfires). A mega-batch mixing create + delete + restyle partially fails and leaves duplicates. Do one operation-class per pass; do deletes in their own pass; reconnect the plugin to clear a stale runtime before retrying.
7. **Thin orchestration, don't reinvent.** Drive the existing Figma MCP + skills and reuse the target file's existing components before building anything new.
8. **Degrade honestly — never to zero, never silently.** An unreachable *dependency* (a skill, a resource) degrades through a fallback ladder — try, fall back, proceed-and-record — never aborts into zero output. An unreachable *quality ceiling* (pixel-parity the rebuild can't reach, when that matters more than DS-linked editable layers) is surfaced and handed to the human capture path — never shipped as a silent low-fidelity rebuild.

> **These are the floor, not the ceiling.** When a situation isn't covered here, act from the principle above it and record the new case — don't enumerate defensively.

## The capture harness (dev-truth source)

Principle 2 needs a dev-truth reference; principle 1 needs exact numbers. Both come from a **capture harness**: drive the running app through each archived state, then per state emit (a) a screenshot and (b) a metrics dump — every meaningful element's computed box + gaps + padding + type + color from the running app's computed styles (on a web surface via `getBoundingClientRect` / `getComputedStyle`; on other platforms via the equivalent inspector / view-hierarchy API).

This harness is **project-agnostic**; each project supplies a thin **config**: the state list, how to reach each state (routes, mock/query/cookie triggers, session/storage seeding), and the viewports (from the project's breakpoint convention). Harness lives cross-project alongside this playbook; config lives with the project. (Same "project-agnostic core + thin wrapper" shape as skills/workflows.) A web app supplies a DOM walk; a native app supplies its platform's view-hierarchy dump — the harness core is the same, only the extractor is per-platform.

- Walk the DOM you care about *including chrome* — a metrics walk scoped to `main` alone drops the header/footer and leaves that geometry unverifiable.
- Metrics beat screenshots for spacing precision but tell you nothing about animation or intentional navigate-away states — note what a static capture cannot represent.

**No config for this project yet? Building one is the default first move, not optional** (see Principle 2). The engine (`ds-agents/tools/flow-walker`, Playwright) is project-agnostic; you write a thin per-project config (`<repo>/scripts/flow-walker.<project>.config.mjs`) and run it (`node <ds-agents>/tools/flow-walker/flow-walker.mjs <config>`; one-time `npm install && npx playwright install chromium` in the engine dir). See flow-walker's README. Minimum viable config:

```js
export default {
  baseUrl: 'http://localhost:<port>',
  viewports: [{ tag: 'mobile', w: 375, h: 812, isMobile: true }, { tag: 'desktop', w: 1440, h: 900 }],
  outDir: '/tmp/<project>-flow-walker',
  metricsRoots: ['body'],
  states: [{ name: 'state', reach: async (page) => { await page.goto(url); await page.getByRole('…').waitFor(); } }],
};
```

Grep the app for how to reach each state (routes, mock cookies, client-side validations); `reach()` can click/fill, so interactive states (a dropdown-open, a validation error) are capturable too. A state you genuinely can't reach without a live backend/auth is the *only* legit reason to leave that state at MEDIUM.

**The harness routinely catches render↔code gaps that reading code tokens alone misses** — e.g. a chip that says `rounded-md` (6px) in code but renders `border-radius ≈ 9999px` (pill). For the diff, the **live computed value is truth**; when it disagrees with a code class, flag the gap — don't silently trust the class.

## Appendix — Figma MCP call-shape notes (externalized depth)

Implementation gotchas, kept out of the agent contract on purpose. Consult when a call misbehaves; extend as new ones surface.

- **Variant sets**: when a search returns `assetType: "component_set"`, its key is the *set* key → `importComponentSetByKeyAsync`, then `defaultVariant.createInstance()` + `setProperties({...})`. `importComponentByKeyAsync` on a set key silently 404s.
- **Local component sets**: `importComponentSetByKeyAsync` only resolves *published/library* keys; for a set that lives in the current file, use `getNodeByIdAsync`.
- **Cross-file/library components**: import by key from the other file works; the pulled instance carries a remote `mainComponent`.
- **Verify variant writes**: re-read `.variantProperties` after `setProperties` — it can silently revert.
- **Instance-swap misfires**: if `setProperties` on an `INSTANCE_SWAP` prop doesn't visually swap, fall back to `nestedInstance.swapComponent(component)`.
- **Component labels**: many button-shaped components expose no text property — walk `findAll(n => n.type === 'TEXT')` and set `.characters` (preload the font first).
- **Fonts**: `loadFontAsync` every font before creating/editing text or calling text-autoresize.
- **Style binding**: files may tokenize via shared *styles* rather than *variables* — bind with `setFillStyleIdAsync` / `setTextStyleIdAsync` / `setStrokeStyleIdAsync`. A paint-style binding is opaque (drops per-node opacity) and flips a `visible:false` fill visible — don't style-bind invisible spacer fills.
- **Dividers in auto-layout**: a `LINE` has layout height 0 and gets swallowed by a vertical auto-layout → use a 1px `RECTANGLE` with `layoutSizingHorizontal=FILL`.
- **Stale-node runtime**: `getNodeByIdAsync` can return null for nodes that `get_metadata`/`get_screenshot` clearly show — a stale plugin-runtime branch. It blocks deletes/edits of pre-existing nodes. Isolate the pass and reconnect the plugin to clear it.
- **Host quirks**: `setSharedPluginData(ns,key,val)` (ns ≥3 chars), not `setPluginData`; `await setCurrentPageAsync(page)`, not `figma.currentPage =`. `use_figma` surfaces no `console.log`/return value — persist to a temp text node and read it back if you must inspect.
- **Remote/library components can't be deleted from a consuming file**: `set.remove()` on a `remote: true` component/set (subscribed from a library) throws `"Removing this node is not allowed"`. Check `.remote` before attempting a delete. If remote, deletion is a **human** action at the source library file, or detach the library subscription (Assets → Libraries) — the plugin API can't do it and reconnecting won't help (it's a permission, not a stale-node issue). Migrating all instances off it leaves it 0-usage but still present.
- **Trust paint-style VALUES, not names**: a style named e.g. "Primary" can hold a non-primary color — real mislabels exist and silently produce wrong output when you bind by name. Read the resolved color and bind by intended semantic/value; never infer a style's color from its label.
- **Migrate instances via `swapComponent`; audit file-wide before any destructive delete**: to move instances to a new main, `instance.swapComponent(newMain)` (preserves geometry). Before deleting a component, count its instances **across all pages** (`page.loadAsync()` per page, then `findAllWithCriteria({types:['INSTANCE']})` + `getMainComponentAsync`) — do it once per page, don't `setCurrentPageAsync` in a loop. 0 instances is necessary but **not sufficient** if the component is remote (above).
