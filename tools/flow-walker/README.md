# flow-walker

A **project-agnostic capture harness**. Drive a running web app through a list of
UI states × viewports, screenshot each, and dump exact computed geometry
(`getBoundingClientRect` + `getComputedStyle`) per meaningful element.

Those outputs are the **dev-truth reference** the `ds-figma-archivist` diffs
against — see the *"The capture harness (dev-truth source)"* section of
[`../../references/figma-archivist-playbook.md`](../../references/figma-archivist-playbook.md).
"Measure, don't approximate": the archivist reads these px values instead of
eyeballing spacing from a screenshot.

## Why core + thin config

Same shape as the skills/workflows: a **project-agnostic core** plus a **thin
per-project config**. This engine holds *how to capture well* (context/viewport
setup, the DOM walk, the metrics schema, the screenshot + logging loop) and
**zero product facts** — no routes, no mock triggers, no session recipes, no
accessible-name strings. Each project supplies a config with only its own
specifics: the state list, how to reach each state, its breakpoints. One engine,
many products; the engine improves once for everyone.

The engine owns the **Playwright devDependency** — it must not leak into any
product repo. A project's config is pure data + functions that operate on the
`page` / `context` the harness passes in; it imports no Playwright.

## Install (one-time, here)

```sh
cd tools/flow-walker
npm install
npx playwright install chromium
```

## Wire a project

1. Write a config module anywhere (typically in the product repo, e.g.
   `<repo>/scripts/flow-walker.<project>.config.mjs`) that `export default`s a
   CONFIG object. See [`config.schema.md`](./config.schema.md) for the full
   interface. The config supplies the product specifics (routes, mock/query
   triggers, session seeding, viewports) as data — the harness stays
   product-agnostic.
2. Start the product's dev server.
3. Run the harness against the config:

```sh
node /abs/path/to/tools/flow-walker/flow-walker.mjs /abs/path/to/flow-walker.<project>.config.mjs
# or: FLOW_WALKER_CONFIG=/abs/path/to/config.mjs node flow-walker.mjs
```

## Output

- Screenshots: `${outDir}/${viewport.tag}__${state.name}.png`
- Metrics:     `${outDir}/metrics/${state.name}__${viewport.tag}.json`

Metrics beat screenshots for spacing precision but say nothing about animation or
intentional navigate-away states — note what a static capture can't represent.
Default DOM-walk root is `body`, so chrome (header/footer) is captured; a walk
scoped to `main` alone would leave that geometry unverifiable.
