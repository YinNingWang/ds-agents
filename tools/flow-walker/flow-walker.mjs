// flow-walker — generic UI-state capture harness
// ---------------------------------------------------------------------------
// Project-AGNOSTIC engine. Given a CONFIG object it drives a running web app
// through a list of UI STATES × VIEWPORTS with Playwright, screenshots each,
// and dumps a computed-geometry metrics JSON per state (getBoundingClientRect +
// getComputedStyle for every meaningful element under the configured roots).
//
// It knows NOTHING about any specific product: no routes, no mock triggers, no
// session/cookie recipes, no accessible-name strings. All of that lives in a
// per-project CONFIG module that this harness consumes. (Project-agnostic core
// + thin config — see ./README.md and the "capture harness" section of
// ../../references/figma-archivist-playbook.md.)
//
// CONFIG interface — see ./config.schema.md (mirrored in JSDoc below).
//
// RUN:
//   node flow-walker.mjs <path-to-config.mjs>
//   # or: FLOW_WALKER_CONFIG=<path> node flow-walker.mjs
// The config module must `export default` the CONFIG object.
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * @typedef {Object} Viewport
 * @property {string} tag               Used in output filenames (e.g. "desktop-1440").
 * @property {number} w                 Viewport width (px).
 * @property {number} h                 Viewport height (px).
 * @property {boolean} [isMobile]       Playwright mobile emulation. Default false.
 * @property {boolean} [hasTouch]       Default = isMobile.
 * @property {number} [deviceScaleFactor] Overrides config.deviceScaleFactor for this viewport.
 * @property {string} [userAgent]       Overrides config.userAgent for this viewport.
 *
 * @typedef {Object} ReachSignal        Optional control object a reach() may return.
 * @property {boolean} [capture]        false => skip screenshot/metrics, just log. Default true.
 * @property {string} [name]            Override output basename (e.g. append "-BOUNCED").
 * @property {string} [status]          Log status: OK|SKIP|TODO|BLOCKED|... Default OK (or SKIP when capture:false).
 * @property {string} [note]            Human note appended to the log line.
 *
 * @typedef {Object} State
 * @property {string} name              Output basename + log id (e.g. "01-login-landing").
 * @property {(page: import('@playwright/test').Page, ctx: ReachCtx) => (Promise<ReachSignal|void>)} reach
 *                                      Navigate/force the app into this state. May return a ReachSignal.
 * @property {boolean} [screenshot]     Capture a PNG. Default true.
 * @property {boolean} [metrics]        Dump metrics JSON. Default true.
 * @property {string[]} [metricsRoots]  CSS selectors to root the DOM walk. Default config.metricsRoots || ["body"].
 * @property {boolean} [fullPage]       fullPage screenshot. Default true.
 *
 * @typedef {Object} ReachCtx           Second arg passed to reach().
 * @property {import('@playwright/test').Browser} browser
 * @property {import('@playwright/test').BrowserContext} context  Fresh, per-state context.
 * @property {string} baseUrl
 * @property {string|undefined} locale
 * @property {Viewport} viewport
 * @property {Object|undefined} seed
 * @property {() => Promise<void>} applySeed  Apply config.seed (cookies + sessionStorage) to `context`.
 * @property {Config} config
 * @property {State} state
 *
 * @typedef {Object} Config
 * @property {string} baseUrl
 * @property {string} [locale]
 * @property {Viewport[]} viewports
 * @property {string} outDir            Screenshots here; metrics under outDir/metrics.
 * @property {number} [deviceScaleFactor] Default 1.
 * @property {string} [userAgent]
 * @property {string[]} [metricsRoots]  Default ["body"].
 * @property {{cookies?: Array, sessionStorage?: Object}} [seed]
 * @property {State[]} states
 */

// --- in-page DOM walk --------------------------------------------------------
// Serialized into the page via page.evaluate. `roots` is an array of CSS
// selectors; every matched element roots a walk. If none match, falls back to
// document.body. Returns { viewport, count, elements[] } — each element carries
// { label, ref, box, styles{...} }. (Extractor is web-specific; a native
// platform would swap this for its view-hierarchy dump — the loop is the same.)
function collectMetricsInPage(roots) {
  const px = (v) => Math.round((parseFloat(v) || 0) * 100) / 100;
  const round = (n) => Math.round(n * 100) / 100;

  const rootSet = new Set();
  (roots && roots.length ? roots : ['body']).forEach((sel) => {
    document.querySelectorAll(sel).forEach((n) => n && rootSet.add(n));
  });
  if (rootSet.size === 0) rootSet.add(document.body);

  const seen = new Set();
  const out = [];

  const isMeaningful = (el, cs) => {
    const tag = el.tagName.toLowerCase();
    if (['input', 'button', 'textarea', 'select', 'a', 'svg', 'img', 'hr', 'label'].includes(tag)) return true;
    const directText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (directText) return true;
    if ((cs.display.includes('flex') || cs.display.includes('grid')) && px(cs.gap) > 0) return true; // gap carrier
    if (['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'].some((s) => px(cs[s]) > 0))
      return true; // divider / bordered box
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return true; // painted card/box
    return false;
  };

  const refOf = (el) => {
    if (el.dataset && el.dataset.testid) return `[data-testid="${el.dataset.testid}"]`;
    if (el.id) return `#${el.id}`;
    const al = el.getAttribute('aria-label');
    if (al) return `[aria-label="${al}"]`;
    const role = el.getAttribute('role');
    if (role) return `[role="${role}"]`;
    return null;
  };

  const labelOf = (el) => {
    const tag = el.tagName.toLowerCase();
    const id = el.dataset?.testid ? `testid=${el.dataset.testid}` : el.id ? `#${el.id}` : '';
    const al = el.getAttribute('aria-label');
    let text = '';
    const direct = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    text = (direct || (['button', 'a'].includes(tag) ? (el.textContent || '').trim() : '')).slice(0, 60);
    return [tag, id, al ? `aria="${al}"` : '', text ? `"${text}"` : ''].filter(Boolean).join(' ');
  };

  const borderOf = (cs) => {
    const side = (s) => `${px(cs[s + 'Width'])}px ${cs[s + 'Style']} ${cs[s + 'Color']}`;
    const sides = ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'];
    const vals = sides.map(side);
    if (px(cs.borderTopWidth) + px(cs.borderRightWidth) + px(cs.borderBottomWidth) + px(cs.borderLeftWidth) === 0)
      return undefined;
    if (vals.every((v) => v === vals[0])) return vals[0];
    const o = {};
    sides.forEach((s, i) => {
      if (px(cs[s + 'Width']) > 0) o[s] = vals[i];
    });
    return o;
  };

  const stylesOf = (cs) => {
    const s = {
      display: cs.display,
      padding: cs.padding,
      margin: cs.margin,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderRadius: cs.borderRadius !== '0px' ? cs.borderRadius : undefined,
    };
    if (cs.gap && cs.gap !== 'normal' && px(cs.gap) >= 0 && (cs.display.includes('flex') || cs.display.includes('grid'))) {
      if (cs.rowGap === cs.columnGap) s.gap = cs.gap;
      else s.gap = `${cs.rowGap} / ${cs.columnGap}`;
    }
    const b = borderOf(cs);
    if (b) s.border = b;
    if (s.backgroundColor === 'rgba(0, 0, 0, 0)') delete s.backgroundColor;
    return s;
  };

  const walk = (el) => {
    if (!(el instanceof Element) || seen.has(el)) return;
    seen.add(el);
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'head'].includes(tag)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && isMeaningful(el, cs)) {
      out.push({
        label: labelOf(el),
        ref: refOf(el),
        box: { x: round(r.x), y: round(r.y), width: round(r.width), height: round(r.height) },
        styles: stylesOf(cs),
      });
    }
    for (const child of el.children) walk(child);
  };

  rootSet.forEach((root) => walk(root));
  return { viewport: { w: window.innerWidth, h: window.innerHeight }, count: out.length, elements: out };
}

// --- run --------------------------------------------------------------------
const results = [];
function log(name, status, note = '') {
  results.push({ name, status, note });
  console.log(`[${status}] ${name}${note ? ' -- ' + note : ''}`);
}

function newContext(browser, vp, config) {
  const ua = vp.userAgent || config.userAgent;
  return browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: vp.deviceScaleFactor ?? config.deviceScaleFactor ?? 1,
    isMobile: vp.isMobile ?? false,
    hasTouch: vp.hasTouch ?? vp.isMobile ?? false,
    ...(ua ? { userAgent: ua } : {}),
  });
}

// Apply the config's declarative seed to a context: cookies + a sessionStorage
// init-script (runs on every navigation in the context). Values that aren't
// strings are JSON-stringified.
function makeApplySeed(context, config) {
  return async () => {
    const seed = config.seed;
    if (!seed) return;
    if (seed.cookies?.length) {
      await context.addCookies(seed.cookies.map((c) => (c.url || c.domain ? c : { ...c, url: config.baseUrl })));
    }
    if (seed.sessionStorage && Object.keys(seed.sessionStorage).length) {
      await context.addInitScript((entries) => {
        for (const [k, v] of entries) {
          window.sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }, Object.entries(seed.sessionStorage));
    }
  };
}

async function capture(page, state, vp, outDir, metricsDir, config, outName) {
  if (state.screenshot !== false) {
    await page.screenshot({
      path: join(outDir, `${vp.tag}__${outName}.png`),
      fullPage: state.fullPage ?? true,
    });
  }
  if (state.metrics !== false) {
    try {
      const roots = state.metricsRoots || config.metricsRoots || ['body'];
      const metrics = await page.evaluate(collectMetricsInPage, roots);
      metrics.state = outName;
      metrics.viewportTag = vp.tag;
      metrics.url = page.url();
      writeFileSync(join(metricsDir, `${outName}__${vp.tag}.json`), JSON.stringify(metrics, null, 2));
    } catch (e) {
      log(`${vp.tag} ${outName} metrics`, 'ERROR', String(e).split('\n')[0]);
    }
  }
}

async function run(config) {
  const outDir = config.outDir;
  const metricsDir = join(outDir, 'metrics');
  mkdirSync(outDir, { recursive: true });
  mkdirSync(metricsDir, { recursive: true });

  console.log(`flow-walker -> baseUrl=${config.baseUrl} locale=${config.locale ?? '(none)'} out=${outDir}`);
  const browser = await chromium.launch();
  try {
    for (const vp of config.viewports) {
      console.log(`\n=== viewport ${vp.tag} (${vp.w}x${vp.h}) ===`);
      for (const state of config.states) {
        const id = `${vp.tag} ${state.name}`;
        const context = await newContext(browser, vp, config);
        const page = await context.newPage();
        const ctx = {
          browser,
          context,
          baseUrl: config.baseUrl,
          locale: config.locale,
          viewport: vp,
          seed: config.seed,
          applySeed: makeApplySeed(context, config),
          config,
          state,
        };
        try {
          const signal = (await state.reach(page, ctx)) || {};
          if (signal.capture === false) {
            log(id, signal.status || 'SKIP', signal.note);
          } else {
            const outName = signal.name || state.name;
            await capture(page, state, vp, outDir, metricsDir, config, outName);
            log(id, signal.status || 'OK', signal.note);
          }
        } catch (e) {
          log(id, 'ERROR', String(e).split('\n')[0]);
        } finally {
          await context.close().catch(() => {});
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n==== SUMMARY ====');
  for (const r of results) console.log(`[${r.status}] ${r.name}${r.note ? ' -- ' + r.note : ''}`);
  const ok = results.filter((r) => r.status === 'OK').length;
  console.log(`\n${ok} OK, ${results.length - ok} not-OK. Output in ${outDir}`);
}

async function loadConfig() {
  const path = process.argv[2] || process.env.FLOW_WALKER_CONFIG;
  if (!path) {
    console.error('usage: node flow-walker.mjs <path-to-config.mjs>   (or set FLOW_WALKER_CONFIG)');
    process.exit(2);
  }
  const mod = await import(pathToFileURL(resolve(path)).href);
  const config = mod.default;
  if (!config || !Array.isArray(config.states) || !Array.isArray(config.viewports) || !config.baseUrl || !config.outDir) {
    console.error(`config at ${path} must export default { baseUrl, viewports[], outDir, states[] }`);
    process.exit(2);
  }
  return config;
}

loadConfig()
  .then(run)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
