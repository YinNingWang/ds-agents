# flow-walker CONFIG schema

A config module `export default`s one CONFIG object. The harness (`flow-walker.mjs`)
is project-agnostic; every product-specific fact lives here.

```ts
type Config = {
  baseUrl: string;              // origin the app is served on, e.g. "http://localhost:3000"
  locale?: string;              // convenience value for reach() (e.g. URL path segment). NOT applied to the browser context.
  viewports: Viewport[];        // captured for every state
  outDir: string;               // screenshots here; metrics JSON under `${outDir}/metrics`
  deviceScaleFactor?: number;   // default 1
  userAgent?: string;           // override the browser UA for all contexts (per-viewport override wins)
  metricsRoots?: string[];      // default DOM-walk roots (CSS selectors). Default ["body"] — INCLUDES chrome (header/footer)
  seed?: {                      // declarative seed applied to a context by ctx.applySeed()
    cookies?: Array<{ name: string; value: string; url?: string; domain?: string; path?: string; /* …Playwright cookie */ }>;
    sessionStorage?: Record<string, unknown>;  // non-string values are JSON.stringify'd; set via context init-script
  };
  states: State[];
};

type Viewport = {
  tag: string;                  // used in output filenames: `${tag}__${state}.png`, `${state}__${tag}.json`
  w: number;
  h: number;
  isMobile?: boolean;           // Playwright mobile emulation. Default false
  hasTouch?: boolean;           // default = isMobile
  deviceScaleFactor?: number;   // overrides config.deviceScaleFactor
  userAgent?: string;           // overrides config.userAgent
};

type State = {
  name: string;                 // output basename + log id
  reach: (page: Page, ctx: ReachCtx) => Promise<ReachSignal | void>;
  screenshot?: boolean;         // default true
  metrics?: boolean;            // default true
  metricsRoots?: string[];      // overrides config.metricsRoots for this state
  fullPage?: boolean;           // fullPage screenshot. default true
};

// ctx passed as the 2nd arg to reach()
type ReachCtx = {
  browser: Browser;
  context: BrowserContext;      // fresh, isolated per state (no cross-state cookie bleed)
  baseUrl: string;
  locale?: string;
  viewport: Viewport;
  seed?: Config["seed"];
  applySeed: () => Promise<void>;  // apply config.seed (cookies + sessionStorage) to `context`
  config: Config;
  state: State;
};

// Optional return from reach() to control capture + logging
type ReachSignal = {
  capture?: boolean;            // false => skip screenshot/metrics, just log. default true
  name?: string;                // override output basename (e.g. `${state.name}-BOUNCED`)
  status?: string;              // log status: OK | SKIP | TODO | BLOCKED | … (default OK, or SKIP when capture:false)
  note?: string;                // note appended to the log line
};
```

## Execution model

- The harness loops `viewports × states`. Each `(viewport, state)` gets a **fresh
  BrowserContext + Page** (full isolation — a login state stays anonymous even if
  a later state seeds a session).
- For each: open page → `await state.reach(page, ctx)` → screenshot (unless
  `screenshot:false` or the reach signals `capture:false`) → metrics dump (unless
  `metrics:false`).
- `reach()` owns all navigation and state-forcing (routes, form fills, mock
  triggers, waits). It may call `ctx.applySeed()` to seed cookies/sessionStorage,
  and use `ctx.context` for anything else (e.g. an app-specific session-mint
  handshake). Product-specific procedures stay in the config, never in the harness.
- A `reach()` that can't reach its state returns a `ReachSignal` (e.g.
  `{ capture:false, status:'BLOCKED', note:'…' }`) rather than throwing; a thrown
  error is logged as `ERROR`.

## Output

- Screenshot: `${outDir}/${viewport.tag}__${state.name}.png`
- Metrics:    `${outDir}/metrics/${state.name}__${viewport.tag}.json`
- Metrics JSON schema: `{ state, viewportTag, viewport:{w,h}, url, count, elements: [{ label, ref, box:{x,y,width,height}, styles:{…} }] }`
