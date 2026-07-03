# LeaseRight Prototype

This is the confirmed Netlify Drop-era LeaseRight prototype.

## Source of truth

- Canonical local folder: `/Users/jtm_mbp/Downloads/LeaseUp_v6`
- Primary app file: `LeaseRight.html`
- Component files: `components/*.jsx`
- Hosting target: Netlify static deploy

This project is intentionally a static HTML prototype. It uses React UMD and Babel in the browser so the design can be shared and iterated quickly without a build step.

## Local preview

Run a static server from this folder:

```sh
python3 -m http.server 4174
```

Then open:

```text
http://localhost:4174/LeaseRight.html
```

## Deployment

Netlify can publish this folder directly. No build command is required.

The public entry points are `/`, `/app`, and `/leaseright`; all open the
LeaseRight prototype.
