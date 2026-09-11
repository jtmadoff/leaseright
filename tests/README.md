# LeaseRight unit tests

Run the suite with no install step, network access, or browser:

```sh
npm test --offline --script-shell=/bin/sh
```

The complete offline suite protects the static prototype in four ways:

- `tests/gate.test.mjs` proves the dependency-free prototype validator rejects a
  local script reference that does not resolve to a repository file.
- `scripts/validate-prototype.mjs` reads both `LeaseRight.html` and `index.html`.
  Every local `<script src>` is resolved relative to its HTML file (after query
  strings and fragments are removed) and must point to a file inside the
  repository. Remote HTTP(S) CDN URLs are ignored; the validator never fetches
  them.
- `tests/integrity.test.mjs` executes `resolveRefs(SEED)` and
  `Selectors.__selfTest()` against the checked-in seed. Dangling references or
  failed selector assertions make the suite fail.
- `tests/selectors.test.mjs` executes the dependency-free selector library in an
  isolated Node context and checks exact outputs from `brokerEconomics`,
  `deriveLeadStage`, `stageCounts`, and `variance`.

Any failed assertion, dangling seed reference, or missing local script makes
`npm test` exit non-zero. Browser rendering is covered separately by the second
declared project check in `.m4d/project.json`.
