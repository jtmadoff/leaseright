import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const modelDataSource = await readFile(
  new URL("../components/model-data.jsx", import.meta.url),
  "utf8"
);
const selectorsSource = await readFile(
  new URL("../components/selectors.jsx", import.meta.url),
  "utf8"
);

const assertionConsole = Object.create(console);
assertionConsole.assert = (condition, ...message) => {
  assert.ok(condition, message.join(" ") || "Selector self-test assertion failed");
};

const context = vm.createContext({ console: assertionConsole, window: {} });
vm.runInContext(modelDataSource, context, { filename: "components/model-data.jsx" });
vm.runInContext(selectorsSource, context, { filename: "components/selectors.jsx" });

test("the checked-in seed has no dangling references", () => {
  const { resolveRefs, SEED } = context.window;
  const dangling = resolveRefs(SEED);

  assert.equal(
    dangling.length,
    0,
    `resolveRefs(SEED) found dangling references:\n${JSON.stringify(dangling, null, 2)}`
  );
});

test("the selector library self-test passes against the checked-in seed", () => {
  assert.equal(context.window.Selectors.__selfTest(), true);
});
