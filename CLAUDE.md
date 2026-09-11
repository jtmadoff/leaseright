# LeaseRight project guidance

## Source of truth

- This directory is the canonical LeaseRight prototype. Do not replace it with the archived light-sidebar LeaseUp prototypes under `Archive/LeaseUp_prototypes/`.
- `LeaseRight.html` is the app entry point, and `components/*.jsx` contains the browser-loaded React components.
- `spec/OVERSEER_MODEL_AND_AGENT_SYNTHESIS.md` is the canonical business and product recommendation. Use `spec/80_IMPLEMENTER_PLAN.md` for the implementation sequence, but defer to the Overseer synthesis when conclusions differ.

## Static prototype conventions

- Keep the app build-free: it uses React UMD and Babel in the browser and deploys directly to Netlify. Do not add a package-manager, bundler, compiled output, backend, or build command unless the project direction explicitly changes.
- Preview from the repository root with `python3 -m http.server 4174`, then open `http://localhost:4174/LeaseRight.html`.
- When changing a file in `components/`, update that file's matching `<script>` URL in `LeaseRight.html` with a new `?v=` cache-bust value in the same change. Preserve the component script order.

## Knowledge graph

- `graphify-out/graph.json` is the repository knowledge graph. Consult it first for codebase and architecture questions.
- The graph must be regenerated after every change to `components/`. From the repository root, run `graphify update .` and retain the refreshed `graphify-out/` artifacts.
