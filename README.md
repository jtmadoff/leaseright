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

Check Markdown whitespace and confirm that every local Babel script is versioned and resolves to
an existing component file:

```sh
git diff --check
node -e 'const fs=require("fs");const h=fs.readFileSync("LeaseRight.html","utf8");const s=[...h.matchAll(/<script type="text\/babel" src="([^"]+)"/g)].map(m=>m[1]);if(!s.length||s.some(x=>!x.includes("?v=")||!fs.existsSync(x.split("?")[0])))process.exit(1);console.log(`verified ${s.length} versioned local component scripts`);'
```

For a browser smoke test, run the local preview, open `LeaseRight.html`, start a project, choose a
project stage, and continue to property intake. Confirm that required property fields gate the next
section and that completing the Model flow unlocks Scenarios, Review, and Launch in order.

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
