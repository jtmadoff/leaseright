# LeaseRight Prototype

This is the confirmed Netlify Drop-era LeaseRight prototype.

## Source of truth

- Canonical local folder: `/Users/jmad/HomeBase/Prospeer/Projects/Active/LeaseRight`
- Primary app file: `LeaseRight.html`
- Component directory: `components/`
- Product, business, and implementation documents: `spec/`
- Canonical business recommendation: `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md`
- Hosting target: Netlify static deploy

This project is intentionally a static HTML prototype. It uses React UMD and Babel in the browser,
so deployment does not bundle or compile the app before it is served.

## Component loading and cache busting

`LeaseRight.html` loads each local file in `components/` with a versioned query string such as
`components/app.jsx?v=20260901-property-step`. The browser still resolves the file before `?v=`;
the suffix changes the resource URL so a deploy does not reuse a stale cached component. When a
component changes, update its matching `?v=` value in `LeaseRight.html`.

## Local preview

Run a static server from this folder:

```sh
python3 -m http.server 4174
```

Then open:

```text
http://localhost:4174/LeaseRight.html
```

## Verification

Run the primary, dependency-free unit-test suite:

```sh
npm test --offline --script-shell=/bin/sh
```

The seven Node tests cover exact selector outputs, checked-in seed reference integrity, the selector
self-test, and the prototype validator's missing-script failure path. The suite then validates every
local script reference in both HTML entry points. It requires no install step, network access, or
browser. The `package.json` manifest exists only to declare this test command; it adds no runtime or
build dependency.

The declared project gate in `.m4d/project.json` runs the unit tests first, followed by the existing
browser render check:

```sh
npm test --offline --script-shell=/bin/sh && node .m4d/check.mjs
```

The second check runs the Netlify staging command; enforces a strict publish allowlist of `index.html`,
`LeaseRight.html`, and files under `components/`; and confirms that all twelve component scripts are
published byte-identically, referenced by `LeaseRight.html`, cache-busted with a query string, and
resolvable. A component script reference without a cache-bust query string fails the gate. It also
runs `resolveRefs(SEED)` and `Selectors.__selfTest()` in Node. Those model self-checks are a
verification-time guarantee, not a browser guarantee. `.m4d/project.json` gives the complete gate a
three-minute timeout.

The gate then runs the headless-browser render check. It fails if no browser can be started or if
any render assertion fails; browser unavailability is never treated as a skipped check. Discovery
checks `CHROME_PATH`, the standard macOS Chrome, Chromium, Edge, and Brave application locations,
the standard macOS Chrome for Testing location, and the `chrome-headless-shell`, `google-chrome`,
`google-chrome-stable`, `chromium`, and `chromium-browser` commands. The gate omits
`--headless=new` only when the selected executable is itself a headless shell. To use a different
executable, set `CHROME_PATH` to its absolute path:

```sh
CHROME_PATH="/absolute/path/to/chromium" node .m4d/check.mjs
```

The browser check verifies that the app mounts, component requests return successfully, and no
browser errors are reported. It does not exercise the first-user journey. To smoke-test that
journey, run the local preview, open
`LeaseRight.html`, start a project, choose a project stage, and continue to property intake. Confirm
that required property fields gate the next section and that completing the Model flow unlocks
Scenarios, Review, and Launch in order.

## Deployment

Netlify runs this staging command before publishing:

```sh
mkdir -p .netlify-publish/components && cp index.html LeaseRight.html .netlify-publish/ && cp components/*.jsx .netlify-publish/components/
```

The command copies both entry pages (`index.html` and `LeaseRight.html`) and every top-level
component script (`components/*.jsx`) into the `.netlify-publish/` publish folder. Only that staged
folder is deployed, so repository-only internal folders and `spec/` are deliberately excluded.

The public entry points are `/`, `/app`, and `/leaseright`; all open the
LeaseRight prototype.
