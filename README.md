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
any render assertion fails; browser unavailability is never treated as a skipped check. Browser
discovery uses the first available executable in this order:

1. `.m4d/tools/chrome-headless-shell/chrome-headless-shell`
2. `CHROME_PATH`
3. the `chrome-headless-shell` command
4. `/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
5. `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
6. `/Applications/Chromium.app/Contents/MacOS/Chromium`
7. `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`
8. `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`
9. the `google-chrome` command
10. the `google-chrome-stable` command
11. the `chromium` command
12. the `chromium-browser` command

For a project-local installation, place the extracted headless-shell bundle contents—the
executable plus its sibling libraries and resources—in `.m4d/tools/chrome-headless-shell/`. The
executable must land at exactly
`.m4d/tools/chrome-headless-shell/chrome-headless-shell`; make it executable with:

```sh
chmod +x .m4d/tools/chrome-headless-shell/chrome-headless-shell
```

The `.m4d/tools/` directory is ignored by Git and excluded from the gate's temporary staging copy.
The gate does not download a browser. The project-local executable takes precedence over
`CHROME_PATH` and all system browsers.

The gate omits `--headless=new` only when the selected executable is itself a headless shell. To
use `CHROME_PATH` when the project-local executable is absent, set it to an absolute path:

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
node scripts/stage-site.mjs
```

The command copies both entry pages (`index.html` and `LeaseRight.html`) and every top-level
component script (`components/*.jsx`) into the `.netlify-publish/` publish folder. Only that staged
folder is deployed, so repository-only internal folders and `spec/` are deliberately excluded.

The public entry points are `/`, `/app`, and `/leaseright`; all open the
LeaseRight prototype.


## Property mapping (2026-09-30)

The Property step now leads with address search and a map. `components/property-location.jsx`
loads Google's current Places autocomplete widget lazily and requests only ID, formatted address,
and coordinates. A selected result creates a satellite map with a draggable pin; moving the pin
preserves the address and marks the location as adjusted. Manual entry remains available when
search is unconfigured, fails, or cannot find a development. Manual entries are explicitly unmapped.

The address, sponsor, place ID, and coordinates save to the existing in-memory project store.
Saved intake fields and completion progress survive navigation within the page; a reload still
resets business data. This change adds no durable backend and does not infer rents or unit counts.

Google Cloud setup: project `halogen-goods-421121` (map prospeer), credential `LeaseRight Web`.
The key is restricted to `https://leaserightbeta.netlify.app/*` and `http://localhost:4174/*`,
and to Maps JavaScript API and Places API (New). Both APIs are enabled.

The source HTML has an empty key. The dependency-free staging script injects
`LEASERIGHT_MAPS_KEY` from Netlify's production environment, or the ignored local
`.netlify/maps-key` file. It copies only public HTML and component files; this is
configuration injection, not a bundler. The restricted browser key is necessarily
visible in delivered HTML but is kept out of Git. To preview with live lookup, run
`node scripts/stage-site.mjs`, then serve `.netlify-publish` on localhost port 4174.
An empty key sends no Maps requests and retains manual entry.

Development quotas confirmed in Google Cloud: 100 map loads/day, 250 autocomplete
requests/day, and 100 place detail requests/day. These are project-wide limits.
Google free allowances are shared across the billing account; these controls are
not a guarantee of a zero-dollar account bill. Other old Cloud projects have not
been disabled; map prospeer is now actively used by this integration.

Verification on 2026-09-30: all 11 Node tests pass; static deployment allowlist,
component integrity, and model checks pass. Automated headless rendering could not
start Chrome (SIGABRT), so live Chrome testing verified a real Google result at
25 Dorrance St, Providence, its satellite map, pin dragging, save progress, and
returning to the Property step with saved fields and adjusted pin intact. A transient
Google network failure also exercised the manual fallback; a subsequent search
succeeded. Earlier simulated checks covered invalid coordinate results and mobile layout.

Published to `https://leaserightbeta.netlify.app/leaseright` on 2026-09-30
(Netlify deploy `6abd692ec41b6e9f4a6aec98`).

The repository's `graphify update .` step could not run on this machine because the `graphify`
command is unavailable. Graph artifacts remain stale pending regeneration on the canonical host.
