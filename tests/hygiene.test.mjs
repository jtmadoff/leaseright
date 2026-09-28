import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const componentsDirectory = new URL("../components/", import.meta.url);

test("component sources do not contain the retired $1/unit pricing claim", async () => {
  const componentFiles = (await readdir(componentsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsx"))
    .map((entry) => entry.name)
    .sort();

  const matches = [];
  for (const fileName of componentFiles) {
    const source = await readFile(new URL(fileName, componentsDirectory), "utf8");
    if (source.includes("$1/unit")) matches.push(fileName);
  }

  assert.deepEqual(
    matches,
    [],
    `retired $1/unit pricing claim found in: ${matches.join(", ")}`
  );
});
