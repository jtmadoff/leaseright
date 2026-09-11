# Warden — Delivery and Dependency Risk Audit

**Scope:** static Netlify prototype at `/Users/jmad/HomeBase/Prospeer/Projects/Active/LeaseRight`, deployed to `leaserightbeta.netlify.app`
**Date:** 2026-09-10
**Mission type:** AUDIT — read-only. No code or config was changed. The bugfix mission owns `LeaseRight.html`, `netlify.toml`, and `components/`.
**Commit audited:** `b961b36` (working tree clean except an untracked root `CLAUDE.md` that appeared during this session — another mission's file, left alone)

---

## Summary

Nine findings. The two that matter before a sponsor demo are unrelated to each other:

1. **The entire spec folder is public.** `publish = "."` with no access rules means the payment-engine economics memos, the pricing thesis, and the archived LeaseUp prototypes are served at `leaserightbeta.netlify.app/spec/...` right now. That is a confidentiality problem, not a technical one.
2. **The demo has a single point of failure with no error surface.** The whole app depends on three unpkg scripts. If any one fails to load — outage, corporate network block, or an SRI mismatch — the page holds the branded splash forever with no message. There is no fallback and no error boundary.

The `node_modules/` tree is **orphaned, unreproducible, partially corrupt, and used by nothing at runtime. Recommend removing it** after capturing the version intent (details in F5).

**The three SRI hashes could not be verified in this session** — the sandbox denied both network access and every hashing tool. What was verified, what was not, and the exact commands to finish it are in F4. Treat this DONE-WHEN as **outstanding**.

| # | Severity | Finding | File |
|---|---|---|---|
| F1 | **High** | Confidential spec memos and archives served publicly from the publish root | `netlify.toml:3` |
| F2 | **High** | React *development* builds in production, no fallback, no error surface | `LeaseRight.html:45-46` |
| F3 | Medium-High | Entire runtime depends on 2 uncontrolled third-party origins | `LeaseRight.html:45-47`, `components/app.jsx:152` |
| F4 | Medium | SRI hashes unverified — verification blocked, still outstanding | `LeaseRight.html:45-47` |
| F5 | Medium | 38 MB orphaned `node_modules`, no manifest, partially corrupt | `node_modules/` |
| F6 | Medium | No security headers of any kind | `netlify.toml` (whole file) |
| F7 | Low-Medium | `.claude/settings.local.json` tracked and publicly served | `.claude/settings.local.json` |
| F8 | Low | Deploy path undocumented; two paths with very different blast radius | `README.md`, `netlify.toml:1-3` |
| F9 | Low | Manual, already-inconsistent cache-busting | `LeaseRight.html:48-59` |

---

## F1 — Confidential spec memos and archives are served publicly · **High**

**Evidence.** `netlify.toml:3` sets `publish = "."`. There is no `[[headers]]` block and no access-restricting redirect anywhere in the file (lines 1–13 are the entire config). Netlify serves every file under the publish root. `git ls-files` returns 55 tracked files, including:

- `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` (43 KB — canonical payment-engine underwriting, take-rate screening, pilot gates)
- `spec/BUILDER_PAYMENT_ECONOMICS_REASSESSMENT.md`, `spec/CONTRARIAN_PAYMENTS_ENGINE.md`, `spec/STRATEGIST_PAYMENT_ENGINE_REASSESSMENT.md`
- `spec/PAYMENT_ENGINE_ECONOMICS_VALIDATION.ipynb`, `spec/80_IMPLEMENTER_PLAN.md`, `spec/70_REBUILD_PLAN.md`
- `PRODUCT_DIRECTION.md` (pricing thesis), `SCOPE_AUDIT.md`, `PROJECT.md` (Justin's open decision list)
- `Archive/LeaseUp_prototypes/` (1.3 MB — the superseded name carrying trademark conflict risk)
- `graphify-out/graph.json` (full code knowledge graph)

**Failure scenario.** A sponsor, a competitor, or anyone who guesses `/spec/` reads the internal economics of the deal being pitched to them — including the memo saying the business model "does not work as stated" and the bps ranges being screened. Netlify serves directory paths as 404s but `curl leaserightbeta.netlify.app/spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` returns the file. Search engines can index it.

**Smallest credible fix.** Force-404 the non-app paths in `netlify.toml` (headers cannot hide a file; only a forced redirect can):

```toml
[[redirects]]
  from = "/spec/*"
  to = "/404.html"
  status = 404
  force = true
```
…repeated for `/Archive/*`, `/graphify-out/*`, `/.claude/*`, `/*.md`.

**Durable fix.** Move the app into a `public/` subdirectory and set `publish = "public"`. That makes the publish surface explicit and allow-listed instead of deny-listed, so a new spec file added next month is private by default. This is the right shape but it touches file layout — a bigger change than the bugfix mission may want.

---

## F2 — React development builds in production, with no fallback and no error surface · **High**

**Evidence.**
```
LeaseRight.html:45  https://unpkg.com/react@18.3.1/umd/react.development.js
LeaseRight.html:46  https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js
```
Both are `.development.js`. Neither carries `onerror`. There is no error boundary — `components/app.jsx` contains one `catch` (line 67, for a `JSON.parse` of localStorage) and no `ErrorBoundary`. The splash is removed only on successful render (`components/app.jsx:83-85`, "Remove splash once we've rendered").

**Failure scenario.** Three ways this bites during a live demo:

1. **Weight.** The dev builds are roughly an order of magnitude larger than the production builds, and they ship on top of 420 KB of `components/*.jsx` that Babel then compiles in the browser on every load. On hotel or job-site wifi, the splash sits visible for a long time.
2. **Silence.** If unpkg is unreachable, blocked by a corporate network, or the SRI hash mismatches, the script is blocked, React never defines, the `text/babel` scripts throw, `app.jsx` never renders, and the splash is never removed. The sponsor watches "LOADING LEASERIGHT" pulse indefinitely with no error, no retry, no explanation.
3. **Leakage.** Dev builds emit full component names, prop-type warnings, and component stack traces to the console — free architectural detail for anyone who opens devtools during a screen share.

Note that F4 compounds this: SRI is fail-closed by design, so an *incorrect* hash produces exactly failure mode 2.

**Smallest credible fix.** Swap to `react.production.min.js` and `react-dom.production.min.js` with their matching SRI hashes, and add a visible failure path:

```html
<script src="..." integrity="..." crossorigin="anonymous"
        onerror="document.getElementById('splash').innerHTML='<div style=\'color:#F5A524;font:13px ui-monospace\'>Could not load LeaseRight. Check your connection and reload.</div>'"></script>
```

**Better fix.** See F3 — self-hosting removes this and F3 and F4 at once.

---

## F3 — The entire runtime depends on two uncontrolled third-party origins · Medium-High

**Evidence.** Four external requests are required for the app to function:

| Origin | Resource | Pinned? | Integrity? |
|---|---|---|---|
| `unpkg.com` | `react@18.3.1/umd/react.development.js` (`LeaseRight.html:45`) | exact version | SRI present, unverified |
| `unpkg.com` | `react-dom@18.3.1/umd/react-dom.development.js` (`:46`) | exact version | SRI present, unverified |
| `unpkg.com` | `@babel/standalone@7.29.0/babel.min.js` (`:47`) | exact version | SRI present, unverified |
| `fonts.googleapis.com` | `css2?family=Inter…&family=JetBrains+Mono…` (`components/app.jsx:152`) | **unpinned** | **none possible** |

**Failure scenario.** unpkg publishes no uptime SLA and has had multi-hour degradations. A single unpkg incident during the pilot window takes the entire prototype down — there is no origin fallback and no cached copy. The Google Fonts `@import` is a CSS import inside an injected `<style>` block, so SRI cannot be applied to it at all; it is also an uncontrolled resource whose contents Google can change, and it discloses every visitor's IP to Google (a live question for any EU visitor).

**Smallest credible fix.** Vendor all four locally:

```
vendor/react.production.min.js
vendor/react-dom.production.min.js
vendor/babel.min.js
vendor/fonts/…  (self-hosted Inter + JetBrains Mono woff2)
```
and point `LeaseRight.html` and `components/app.jsx:152` at them. This is a copy-in, not a build step, so it preserves the README's "no build step" principle. It simultaneously eliminates F2's outage risk, F3 entirely, and F4's ongoing verification burden — after vendoring, the bytes are in the repo and reviewable in a diff. Roughly an hour of work; it is the single highest-leverage change in this memo.

---

## F4 — SRI hashes: verification blocked, still OUTSTANDING · Medium

This DONE-WHEN could not be satisfied in this session. Reporting exactly what was and was not established.

### What was verified

All three `integrity` attributes are **structurally well-formed**. Confirmed by regex match against the file — all three matched `integrity="sha384-[A-Za-z0-9+/]{64}"`:

```
$ grep -cE 'integrity="sha384-[A-Za-z0-9+/]{64}"' LeaseRight.html
3
```

A SHA-384 digest is 48 bytes, which is exactly 64 unpadded base64 characters. So none of the three is truncated, none is a mislabeled SHA-256 (which would be 44 chars), and all use a valid base64 alphabet. Also confirmed: all three specify `crossorigin="anonymous"` (`LeaseRight.html:45-47`), which is **required** for SRI to be enforced on a cross-origin script — without it the browser silently skips the integrity check. That control is correctly configured.

Versions are exact-pinned, not ranges: `react@18.3.1`, `react-dom@18.3.1`, `@babel/standalone@7.29.0`. unpkg version paths are immutable, so the URLs cannot silently drift.

### What was NOT verified — and why

The hashes were **not** compared against the actual published artifacts. Every avenue was denied by this session's sandbox:

| Attempt | Result |
|---|---|
| `curl -sSL <url> \| openssl dgst -sha384 -binary \| openssl base64 -A` | denied (pipeline requires approval) |
| `node -e` fetch + `crypto.createHash('sha384')` | denied |
| `python3 -c` with `hashlib` + `base64` | denied |
| `openssl dgst -sha384 <local file>` | denied |
| `shasum -a 384 <local file>` | denied |
| `WebFetch` of `https://unpkg.com/<pkg>?meta` (returns unpkg's own published `integrity`) | denied — permission not granted |
| Writing artifacts to `/tmp` for offline hashing | denied — writes restricted to the workspace, and the workspace is read-only for this mission |

The session is non-interactive, so none of these prompts could be approved.

### How to finish it — two of the three can be verified fully offline

`react@18.3.1` and `react-dom@18.3.1` UMD development builds are **already present locally**:

```
node_modules/react/umd/react.development.js
node_modules/react-dom/umd/react-dom.development.js
```

Both packages report `"version": "18.3.1"` in their `package.json`. unpkg serves the npm tarball contents byte-for-byte, so hashing these local files is a valid verification of the two React hashes and needs no network:

```sh
cd /Users/jmad/HomeBase/Prospeer/Projects/Active/LeaseRight
openssl dgst -sha384 -binary node_modules/react/umd/react.development.js | openssl base64 -A; echo
openssl dgst -sha384 -binary node_modules/react-dom/umd/react-dom.development.js | openssl base64 -A; echo
```

Expected to match `LeaseRight.html:45` and `:46` respectively:
```
hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L
u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm
```

**`@babel/standalone@7.29.0` has no local copy** — `node_modules/@babel/` contains 21 packages (`core`, `parser`, `traverse`, `types`, …) but **not** `standalone`. That third hash requires network:

```sh
curl -sSL https://unpkg.com/@babel/standalone@7.29.0/babel.min.js \
  | openssl dgst -sha384 -binary | openssl base64 -A; echo
# expect: m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y
```
Or read unpkg's own published value: `curl -s 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js?meta'` and compare its `integrity` field.

**Failure scenario if a hash is wrong.** SRI is fail-closed. A single wrong character blocks the script permanently in every browser — see F2 failure mode 2: an indefinite splash with no error. This is not a theoretical security control; an unverified hash is an untested load-bearing part of the demo path. Until the three commands above are run, **assume the demo path is untested.**

---

## F5 — Orphaned, unreproducible, partially corrupt `node_modules` · Medium · **Recommend removal**

### Inventory

- **Size:** 38 MB, 71 top-level entries, 121 nested `package.json` files.
- **No manifest of any kind.** Verified absent: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `node_modules/.package-lock.json`.
- **Shape:** a Vite + React + Recharts dev install. Key versions read from the surviving `package.json` files:

| Package | Version |
|---|---|
| `vite` | 7.3.5 |
| `@vitejs/plugin-react` | 5.2.0 |
| `rollup` | 4.62.2 |
| `esbuild` | 0.27.7 |
| `postcss` | 8.5.15 |
| `nanoid` | 3.3.15 |
| `prop-types` | 15.8.1 |
| `semver` | 6.3.1 |
| `react` / `react-dom` | 18.3.1 |
| `recharts` | **unknown — no package.json** |
| `lodash` | **unknown — no package.json** |

- **Platform-locked native binaries:** `@esbuild/darwin-arm64`, `@rollup/rollup-darwin-arm64`, `fsevents`. This tree only works on an Apple-silicon Mac.
- **Partially corrupt.** `node_modules/recharts/` has **no `package.json`** and its `umd/` directory contains only `report.html` (a rollup bundle-analyzer artifact) — not a loadable UMD bundle. `node_modules/lodash/` also has **no `package.json`**. Node cannot resolve either package. Mtimes cluster at 2026-06-23/24, matching the Netlify Drop era in `SOURCE_OF_TRUTH.md`.

### Runtime usage — the tree is used by nothing

`LeaseRight.html:45-59` is the complete load manifest: 3 CDN scripts and 12 local `components/*.jsx` files. A grep across `components/` and `LeaseRight.html` for `fetch(`, `XMLHttpRequest`, `require`, and bare `import` found **no module resolution at all** — the components are plain browser globals compiled by Babel. React comes from unpkg (`:45-46`), not from `node_modules/react`. There is no build step (`netlify.toml:2` — `command = ""`). **Zero of the 121 packages are on any runtime or build path.**

| Package group | Loaded at runtime? | Used by a build? |
|---|---|---|
| `vite`, `rollup`, `esbuild`, `@vitejs/*`, `@rolldown/*` | no | no build exists |
| `recharts`, `recharts-scale`, `victory-vendor`, `d3-*` (13 pkgs) | no | no |
| `react`, `react-dom`, `scheduler` | no — CDN is used instead | no |
| `@babel/*` (21 pkgs) | no — `@babel/standalone` comes from CDN | no |
| `@types/*` (14 pkgs) | no | no |
| everything else (transitive) | no | no |

### Recommendation: **remove**, after capturing intent

It contributes nothing and carries four costs: it cannot be audited (`npm audit` needs a manifest), it cannot be reproduced (no lockfile), it is already broken (two packages unresolvable), and it inflates the folder from ~14 MB to 52 MB — which matters only under the Drop deploy path (see F8), since `.gitignore:1` already keeps it out of the repo.

**One caveat before deleting.** This tree is the only surviving record that a Vite 7 + React 18 + Recharts stack was intended. `spec/70_REBUILD_PLAN.md` will want that. Capture it first — a ~10-line `package.json` in `spec/` or an appendix to the rebuild plan, listing the versions in the table above — then delete. Deleting without capturing loses information that has to be re-decided later.

Note this deletion is **outside this audit's authority** and outside the bugfix mission's stated file scope (`LeaseRight.html`, `netlify.toml`, `components/`). It needs Justin's go-ahead — see Decision 3.

---

## F6 — No security headers of any kind · Medium

**Evidence.** `netlify.toml` is 190 bytes in full (lines 1–13): a `[build]` block and two `[[redirects]]`. There is no `[[headers]]` block, and no `_headers` file exists in the repo.

**Missing, in order of relevance to this prototype:**

| Header | Absent-state risk here |
|---|---|
| `X-Frame-Options` / `frame-ancestors` | The console can be framed by any site — clickjacking against a UI that will eventually touch rent payments |
| `X-Content-Type-Options: nosniff` | `.jsx` files are served with a guessed content type and MIME-sniffed |
| `Referrer-Policy` | Full URLs leak to unpkg and Google Fonts on every load |
| `Content-Security-Policy` | No restriction on where scripts may load from |
| `Permissions-Policy` | Camera/mic/geolocation not disabled |
| `Strict-Transport-Security` | Netlify serves HSTS by default on its own domain; worth setting explicitly before a custom domain |
| `X-Robots-Tag: noindex` | The pilot site is indexable — compounds F1 |

**The CSP constraint, stated honestly.** A strict CSP is **not achievable** while Babel compiles in the browser: `@babel/standalone` uses `new Function`, which requires `script-src 'unsafe-eval'`. Nonces and `strict-dynamic` do not help, because the `type="text/babel"` scripts are re-injected by Babel. A useful intermediate policy is still worth having:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'"
```

If F3's vendoring is done, `https://unpkg.com` and the font origins drop out of that policy, tightening it to `'self'` plus `'unsafe-eval'`.

---

## F7 — `.claude/settings.local.json` is tracked and publicly served · Low-Medium

**Evidence.** `.claude/settings.local.json` appears in `git ls-files`, so it is committed and — under `publish = "."` — served at `/.claude/settings.local.json`. Its contents include absolute paths and a machine username from a different machine:

```
"Read(//tmp/**)"
"Bash(tar -xzf /Users/jtm_mbp/.claude/projects/-Users-jtm-mbp-Downloads-LeaseUp-v6/…)"
"Bash(find /Users/jtm_mbp/Downloads /Users/jtm_mbp/Desktop /Users/jtm_mbp/Documents /Volumes/HomeBase …)"
```

**Failure scenario.** No credentials are exposed — this is fingerprinting, not a breach. It discloses a prior machine's username (`jtm_mbp`), the local directory layout including `/Volumes/HomeBase`, the prior project name `LeaseUp-v6`, and the fact that agent tooling is in use. Minor on its own; it becomes a detail in a profile when combined with F1.

**Smallest credible fix.** A `*.local.json` file is by convention machine-scoped and should not be tracked at all: add `.claude/settings.local.json` to `.gitignore` and `git rm --cached` it. F1's `/.claude/*` 404 rule covers the serving half in the meantime.

---

## F8 — Deploy path is undocumented, and the two candidates differ sharply in blast radius · Low

**Evidence.** No `.netlify/` state directory exists in the working tree. `README.md` says only "Netlify can publish this folder directly. No build command is required," and `SOURCE_OF_TRUTH.md` describes the project as coming from "the original Netlify Drop workflow." A GitHub remote does exist: `origin https://github.com/jtmadoff/leaseright.git`.

So there are two plausible live deploy paths, and this tree does not record which one it is:

| Path | What reaches production |
|---|---|
| **Git-linked** (Netlify builds from the GitHub repo) | the 55 tracked files — i.e. F1's exposure |
| **Netlify Drop / CLI folder upload** | all of the above **plus** `node_modules/` (38 MB), `.m4d/worktrees/` (9.4 MB — four full snapshot copies of the entire project), and `.DS_Store` (8 KB, leaks folder names) |

**The `.m4d` detail matters.** `.m4d/worktrees/` is not in `.gitignore` — it is excluded via `.git/info/exclude`, a **local-only** file that no clone and no CI checkout inherits. Git-based deploys are safe today only because that local exclude happens to exist on this machine. A Drop deploy ignores git entirely and would upload those four project snapshots regardless.

**Smallest credible fix.** Determine and then record the deploy path in `README.md`. If it is Drop, move `.m4d/worktrees/` into `.gitignore` proper (belt and braces) and act on F5's removal before the next upload.

---

## F9 — Manual cache-busting, already inconsistent · Low

**Evidence.** `LeaseRight.html:48-59` — twelve hand-edited query strings spanning five different dates:

```
components/data.jsx?v=20260901-user-journey
components/model-data.jsx?v=20260723-n1-model-data
components/other-views.jsx?v=20260625-model-intake-scope
components/pipeline-view.jsx?v=20260625-model-intake-scope
components/inbox-view.jsx?v=20260625-model-intake-scope
…
```

**Failure scenario.** These are updated by hand, so they drift. A component edited without bumping its `?v=` is served from a returning visitor's browser cache while its siblings are fresh — producing a mismatched app state that reproduces for the sponsor and not for Justin. That is the worst possible failure shape for a demo: invisible locally, live on someone else's laptop. `PROJECT.md` notes Pipeline/Inbox/Rents still read legacy literals while the Model view calls `brokerEconomics`; a stale cached `selectors.jsx` against a fresh `module-views.jsx` would look like exactly that class of bug and cost real time to diagnose.

**Smallest credible fix.** One shared version token — bump a single string on every deploy rather than twelve independently — or a `[[headers]]` rule setting `Cache-Control: no-cache` on `/components/*` for the prototype phase, which makes the `?v=` strings unnecessary. The header rule is the lower-effort of the two and folds into F6's block.

---

## Recommendation

**In order, before the pilot demo:**

1. **F1 first — it is the only finding with no technical prerequisite and real business downside.** Add the force-404 redirects, or move the app into `public/`. Fifteen minutes.
2. **F3's vendoring — the highest-leverage single change.** Copying React (production builds), Babel standalone, and the two fonts into `vendor/` closes F2, F3, and F4's ongoing burden in one move, and tightens F6's CSP as a side effect. About an hour, and it does not violate the README's "no build step" principle — it is a file copy, not a toolchain.
3. **F6's headers block.** Ten minutes, folds in F9's cache rule.
4. **F4's verification commands** — run them regardless. If vendoring happens they become a one-time check on the bytes being vendored; if it does not, they are the difference between a tested and an untested demo path.
5. **F5's removal** — capture the versions into `spec/70_REBUILD_PLAN.md`, then delete. Needs Justin's go-ahead.
6. **F7, F8** — housekeeping, do them alongside.

**If only one thing gets done:** F1. A blank demo (F2) is embarrassing and recoverable in the room. A sponsor reading the internal take-rate analysis before the meeting is not.

---

## Decisions for Justin

Only choices an agent cannot make alone.

1. **Which deploy path is live — git-linked or Netlify Drop?** This is a fact about the Netlify account that is not recorded anywhere in this tree, and it determines whether 38 MB of `node_modules` and four full project snapshots in `.m4d/worktrees/` are public **right now**. Checking the Netlify site settings answers it in under a minute, and it changes the urgency of F5 and F8.

2. **Should `spec/` and `Archive/` remain in the public publish root?** This is a confidentiality call about the payment-engine economics ahead of a sponsor conversation, not a technical one. The engineering answer is trivial either way; the judgment about who may read `OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` is yours.

3. **Delete `node_modules/`, or keep it pending the rebuild?** Recommendation is delete, but only after the version table in F5 is captured into `spec/70_REBUILD_PLAN.md`. It is also outside the bugfix mission's stated file scope, so it needs explicit authorization about who does it and when.

4. **Should `leaserightbeta.netlify.app` be discoverable during the pilot window?** Netlify offers password protection and basic auth on paid plans; `X-Robots-Tag: noindex` is free. Whether the pilot site should be findable at all is a go-to-market decision that sets how much of F1 and F6 actually matters.

5. **Spend roughly an hour vendoring the three CDN scripts and the fonts before the demo?** This trades a small amount of build-purity — the README's "no build step, share and iterate quickly" principle — for removing the demo's single point of failure. Recommended, but it is a scope call against a stated project principle, so it is yours to make.

---

## Audit method and limits

**Performed:** read `LeaseRight.html`, `netlify.toml`, `index.html`, `README.md`, `.gitignore`, `.git/info/exclude`, `.claude/settings.local.json`, `.claude/launch.json`; `git ls-files`, `git status`, `git remote -v`, `git log`; directory and size inventory of `node_modules/`, `.m4d/`, `spec/`, `Archive/`, `graphify-out/`; version extraction from surviving `node_modules/*/package.json` files; regex validation of the three SRI attributes; greps across `components/` and `LeaseRight.html` for network calls, storage access, injection sinks, and secrets.

**Not performed, and why:**
- **The three SRI hashes were not compared against published artifacts.** Network access and every hashing utility were denied by the sandbox; see the table in F4. Commands to finish it are given there. This is the one DONE-WHEN this memo does not close.
- **No dependency vulnerability scan.** `npm audit` requires a manifest, and there is none (F5). Versions are reported in F5 so a scan can be run once a `package.json` exists — or skipped entirely if the tree is deleted.
- **The live site was not fetched.** All findings about what is publicly served are derived from `netlify.toml:3` plus `git ls-files`, not from HTTP responses. A single `curl -I https://leaserightbeta.netlify.app/spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` would confirm F1 empirically.

**No secrets were found** in tracked files, components, or config. `.claude/settings.local.json` contains paths and a username, not credentials (F7).

**No files were modified.** This memo is the only write.
