import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, relative, resolve, sep } from "node:path";

const ROOT = process.cwd();
const ENTRY = "LeaseRight.html";
const APP_ORIGIN = "http://leaseright.local";
const LOAD_TIMEOUT_MS = 30_000;
const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".jsx", "text/javascript; charset=utf-8"],
]);

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes(sep)) {
      if (existsSync(candidate)) return candidate;
    } else {
      const found = spawnSync("which", [candidate], { encoding: "utf8" }).stdout.trim();
      if (found) return found;
    }
  }
  throw new Error("Chrome or Chromium is required (set CHROME_PATH to its executable)");
}

function localComponentScripts(html) {
  return localScriptSources(html)
    .filter((source) => new URL(source, `${APP_ORIGIN}/${ENTRY}`).pathname.endsWith(".jsx"));
}

function scriptSources(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/giu)]
    .map((match) => match[1]);
}

function localScriptSources(html) {
  return scriptSources(html).filter((source) => {
    const url = new URL(source, `${APP_ORIGIN}/${ENTRY}`);
    return url.protocol === "http:" && url.origin === APP_ORIGIN;
  });
}

function buildConfigValue(section, name) {
  const match = section.match(new RegExp(`^\\s*${name}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")\\s*$`, "mu"));
  if (!match) throw new Error(`netlify.toml [build] must declare ${name} as a basic string`);
  return JSON.parse(match[1]);
}

async function deployConfig() {
  const toml = await readFile(join(ROOT, "netlify.toml"), "utf8");
  const lines = toml.split(/\r?\n/u);
  const buildLines = [];
  let inBuild = false;
  for (const line of lines) {
    if (/^\s*\[\[?[^\]]+\]\]?\s*$/u.test(line)) {
      if (inBuild) break;
      inBuild = /^\s*\[build\]\s*$/u.test(line);
    } else if (inBuild) {
      buildLines.push(line);
    }
  }
  if (!inBuild && !buildLines.length) throw new Error("netlify.toml has no [build] section");
  const section = buildLines.join("\n");
  return {
    command: buildConfigValue(section, "command"),
    publish: buildConfigValue(section, "publish"),
  };
}

function assertInside(parent, child, description) {
  const rel = relative(parent, child);
  if (rel === ".." || rel.startsWith(`..${sep}`) || resolve(child) === resolve(parent)) {
    throw new Error(`${description} escapes its staging root`);
  }
}

async function jsxNames(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsx"))
    .map((entry) => entry.name)
    .sort();
}

async function assertRegularFile(file, description) {
  try {
    if (!(await stat(file)).isFile()) throw new Error("not a regular file");
  } catch {
    throw new Error(`${description} does not resolve to a staged file`);
  }
}

function stagedScriptPath(publishRoot, source) {
  const pathname = decodeURIComponent(new URL(source, `${APP_ORIGIN}/${ENTRY}`).pathname);
  const relativePath = normalize(pathname).replace(/^[/\\]+/u, "");
  const file = resolve(publishRoot, relativePath);
  assertInside(publishRoot, file, `${source}: script path`);
  return { file, relativePath: relativePath.split(sep).join("/") };
}

function withoutScript(html, source) {
  for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/giu)) {
    if (match[1] !== source) continue;
    return `${html.slice(0, match.index)}${html.slice(match.index + match[0].length)}`;
  }
  throw new Error(`negative control could not remove ${source} from ${ENTRY}`);
}

async function verifyStaticDeploy() {
  const scratch = await mkdtemp(join(tmpdir(), "leaseright-static-check-"));
  const sourceRoot = join(scratch, "source");
  try {
    await cp(ROOT, sourceRoot, {
      recursive: true,
      filter(source) {
        const rel = relative(ROOT, source);
        if (!rel) return true;
        const topLevel = rel.split(sep, 1)[0];
        return topLevel !== ".git" && topLevel !== ".netlify-publish";
      },
    });

    const config = await deployConfig();
    const publishRoot = resolve(sourceRoot, config.publish);
    assertInside(sourceRoot, publishRoot, "netlify.toml publish directory");
    const build = spawnSync("/bin/sh", ["-c", config.command], {
      cwd: sourceRoot,
      encoding: "utf8",
    });
    if (build.error) throw build.error;
    if (build.status !== 0) {
      const detail = [build.stdout, build.stderr].filter(Boolean).join("\n").trim();
      throw new Error(`Netlify staging command exited ${build.status}${detail ? `:\n${detail}` : ""}`);
    }
    if (!(await stat(publishRoot)).isDirectory()) {
      throw new Error(`Netlify publish directory was not produced: ${config.publish}`);
    }

    const sourceComponents = await jsxNames(join(sourceRoot, "components"));
    if (!sourceComponents.length) throw new Error("components/ contains no JSX component scripts");

    const negative = process.env.LEASERIGHT_STATIC_NEGATIVE;
    if (negative === "missing") {
      await rm(join(publishRoot, "components", sourceComponents[0]), { force: true });
    } else if (negative === "unreferenced") {
      const entryFile = join(publishRoot, ENTRY);
      const entryHtml = await readFile(entryFile, "utf8");
      const firstReference = localComponentScripts(entryHtml)[0];
      if (!firstReference) throw new Error(`${ENTRY} declares no local component scripts`);
      await writeFile(entryFile, withoutScript(entryHtml, firstReference));
    } else if (negative) {
      throw new Error(`Unknown LEASERIGHT_STATIC_NEGATIVE value: ${negative}`);
    }

    const stagedComponents = await jsxNames(join(publishRoot, "components"));
    for (const name of sourceComponents) {
      if (!stagedComponents.includes(name)) {
        throw new Error(`components/${name} is missing from the staged output`);
      }
      const [sourceBytes, stagedBytes] = await Promise.all([
        readFile(join(sourceRoot, "components", name)),
        readFile(join(publishRoot, "components", name)),
      ]);
      if (!sourceBytes.equals(stagedBytes)) {
        throw new Error(`components/${name} is not staged byte-identically`);
      }
    }
    for (const name of stagedComponents) {
      if (!sourceComponents.includes(name)) {
        throw new Error(`components/${name} is staged but has no source component`);
      }
    }

    const entryHtml = await readFile(join(publishRoot, ENTRY), "utf8");
    const localScripts = localScriptSources(entryHtml);
    if (!localScripts.length) throw new Error(`${ENTRY} declares no local script references`);
    const referencedComponents = new Set();
    for (const source of localScripts) {
      const resolved = stagedScriptPath(publishRoot, source);
      await assertRegularFile(resolved.file, source);
      if (resolved.relativePath.startsWith("components/") && resolved.relativePath.endsWith(".jsx")) {
        referencedComponents.add(resolved.relativePath);
      }
    }
    for (const name of sourceComponents) {
      const relativePath = `components/${name}`;
      if (!referencedComponents.has(relativePath)) {
        throw new Error(`${relativePath} is staged but unreferenced by ${ENTRY}`);
      }
    }

    const privateDirectories = [".claude", ".m4d", "Archive", "graphify-out", "spec"];
    for (const directory of privateDirectories) {
      if (existsSync(join(publishRoot, directory))) {
        throw new Error(`${directory}/ must be absent from the staged output`);
      }
    }

    console.log(
      `Static deploy check passed: ${sourceComponents.length} byte-identical component scripts are staged, referenced, and resolvable; private directories are absent.`,
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

async function assertComponentFiles(scripts) {
  for (const source of scripts) {
    const pathname = decodeURIComponent(new URL(source, `${APP_ORIGIN}/`).pathname);
    const file = resolve(ROOT, pathname.replace(/^[/\\]+/u, ""));
    if (!file.startsWith(`${ROOT}${sep}`)) throw new Error(`${source}: path escapes the project`);
    try {
      if (!(await stat(file)).isFile()) throw new Error("not a file");
    } catch {
      throw new Error(`${source}: component script does not exist`);
    }
  }
}

function cdpClient(chrome, onEvent) {
  let nextId = 1;
  const pending = new Map();
  let stderr = "";
  let buffered = Buffer.alloc(0);
  chrome.stderr.on("data", (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-4_000);
  });
  chrome.once("exit", (code, signal) => {
    const detail = stderr ? `\n${stderr}` : "";
    const error = new Error(`Chrome exited before loading the app (${signal || `code ${code}`})${detail}`);
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
  });
  chrome.stdio[4].on("data", (chunk) => {
    buffered = Buffer.concat([buffered, chunk]);
    let separator;
    while ((separator = buffered.indexOf(0)) !== -1) {
      const frame = buffered.subarray(0, separator).toString("utf8");
      buffered = buffered.subarray(separator + 1);
      if (!frame) continue;
      const message = JSON.parse(frame);
      if (message.id) {
        const waiter = pending.get(message.id);
        if (!waiter) continue;
        pending.delete(message.id);
        if (message.error) waiter.reject(new Error(message.error.message));
        else waiter.resolve(message.result);
      } else {
        onEvent(message);
      }
    }
  });

  return (method, params = {}, sessionId) => new Promise((resolveCall, rejectCall) => {
    const id = nextId++;
    pending.set(id, { resolve: resolveCall, reject: rejectCall });
    chrome.stdio[3].write(`${JSON.stringify({ id, method, params, sessionId })}\0`);
  });
}

function describeRemoteValue(value) {
  return value.description || value.value || value.unserializableValue || value.type;
}

async function localResponse(url, entryHtml) {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const relative = normalize(pathname).replace(/^[/\\]+/u, "") || ENTRY;
    if (relative === ENTRY) {
      return { status: 200, type: MIME_TYPES.get(".html"), body: Buffer.from(entryHtml) };
    }
    const file = resolve(ROOT, relative);
    if (file !== ROOT && !file.startsWith(`${ROOT}${sep}`)) throw new Error("outside root");
    if (!(await stat(file)).isFile()) throw new Error("not a file");
    return {
      status: 200,
      type: MIME_TYPES.get(extname(file)) || "application/octet-stream",
      body: await readFile(file),
    };
  } catch {
    return { status: 404, type: "text/plain; charset=utf-8", body: Buffer.from("Not found\n") };
  }
}

async function verifyInBrowser(chrome, entryHtml, expectedScripts) {
  const failures = [];
  const responses = new Map();
  let sessionId;
  let call;
  call = cdpClient(chrome, ({ method, params, sessionId: eventSession }) => {
    if (method === "Fetch.requestPaused" && eventSession === sessionId) {
      void localResponse(params.request.url, entryHtml)
        .then(({ status, type, body }) => call("Fetch.fulfillRequest", {
          requestId: params.requestId,
          responseCode: status,
          responseHeaders: [
            { name: "Cache-Control", value: "no-store" },
            { name: "Content-Type", value: type },
          ],
          body: body.toString("base64"),
        }, sessionId))
        .catch((error) => failures.push(`local server: ${error.message}`));
    }
    if (method === "Runtime.exceptionThrown") {
      failures.push(params.exceptionDetails.exception?.description || params.exceptionDetails.text);
    }
    if (method === "Runtime.consoleAPICalled" && ["error", "assert"].includes(params.type)) {
      failures.push(`console.${params.type}: ${params.args.map(describeRemoteValue).join(" ")}`);
    }
    if (method === "Network.responseReceived") responses.set(params.response.url, params.response.status);
  });

  const { targetId } = await call("Target.createTarget", { url: "about:blank" });
  ({ sessionId } = await call("Target.attachToTarget", { targetId, flatten: true }));
  const appUrl = `${APP_ORIGIN}/${ENTRY}`;
  try {
    await Promise.all([
      call("Fetch.enable", { patterns: [{ urlPattern: `${APP_ORIGIN}/*` }] }, sessionId),
      call("Network.enable", {}, sessionId),
      call("Page.enable", {}, sessionId),
      call("Runtime.enable", {}, sessionId),
    ]);
    await call("Page.navigate", { url: appUrl }, sessionId);

    const deadline = Date.now() + LOAD_TIMEOUT_MS;
    let mounted = false;
    while (Date.now() < deadline) {
      try {
        const result = await call("Runtime.evaluate", {
          expression: "Boolean(document.querySelector('#root')?.children.length) && !document.querySelector('#splash')",
          returnByValue: true,
        }, sessionId);
        mounted = result.result.value === true;
      } catch {
        mounted = false;
      }
      const allComponentsLoaded = expectedScripts.every((source) => {
        const expectedUrl = new URL(source, appUrl).href;
        return responses.get(expectedUrl) === 200;
      });
      if (mounted && allComponentsLoaded) break;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }

    if (mounted) await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    for (const source of expectedScripts) {
      const expectedUrl = new URL(source, appUrl).href;
      const status = responses.get(expectedUrl);
      if (status !== 200) failures.push(`${source}: expected HTTP 200, received ${status ?? "no response"}`);
    }
    if (!mounted) failures.push("React did not mount into #root before the browser timeout");
    if (failures.length) throw new Error([...new Set(failures)].join("\n"));
  } finally {
    await call("Target.closeTarget", { targetId }).catch(() => {});
  }
}

async function verifyBrowser() {
  let chrome;
  let profile;
  try {
    let html = await readFile(join(ROOT, ENTRY), "utf8");
    let expectedScripts = localComponentScripts(html);
    if (process.env.LEASERIGHT_BREAK_COMPONENT_REFERENCE === "1" && expectedScripts.length) {
      html = html.replace(expectedScripts[0], "components/__m4d_missing_component__.jsx?v=broken");
      expectedScripts = localComponentScripts(html);
    }
    if (!expectedScripts.length) throw new Error(`${ENTRY} declares no component scripts`);
    await assertComponentFiles(expectedScripts);
    profile = await mkdtemp(join(tmpdir(), "leaseright-browser-check-"));
    const args = [
      "--headless=new",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-sync",
      "--no-default-browser-check",
      "--no-first-run",
      "--remote-debugging-pipe",
      `--user-data-dir=${profile}`,
      "about:blank",
    ];
    if (typeof process.getuid === "function" && process.getuid() === 0) args.unshift("--no-sandbox");
    chrome = spawn(findChrome(), args, { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
    await verifyInBrowser(chrome, html, expectedScripts);
    console.log(`Browser check passed: ${expectedScripts.length} component scripts loaded in headless Chrome.`);
  } finally {
    if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
      const exited = new Promise((resolveExit) => chrome.once("exit", resolveExit));
      chrome.kill("SIGTERM");
      await Promise.race([exited, new Promise((resolveWait) => setTimeout(resolveWait, 2_000))]);
    }
    if (profile) await rm(profile, { recursive: true, force: true });
  }
}

async function main() {
  await verifyStaticDeploy();
  if (process.env.LEASERIGHT_BROWSER_CHECK !== "1") {
    console.log("Browser check skipped; set LEASERIGHT_BROWSER_CHECK=1 to opt in.");
    return;
  }
  await verifyBrowser();
}

main().catch((error) => {
  console.error(`LeaseRight check failed:\n${error.message}`);
  process.exitCode = 1;
});
