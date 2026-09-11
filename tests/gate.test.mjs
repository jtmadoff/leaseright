import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { validatePrototype } from "../scripts/validate-prototype.mjs";

test("the prototype validator rejects a missing local script", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "leaseright-gate-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "components"));
  await writeFile(path.join(root, "LeaseRight.html"), '<script src="components/missing.jsx"></script>');
  await writeFile(path.join(root, "index.html"), "<!doctype html>");
  await writeFile(path.join(root, "components", "present.jsx"), "const Present = true;");

  await assert.rejects(
    validatePrototype(root),
    /missing script src components\/missing\.jsx/u
  );
});
