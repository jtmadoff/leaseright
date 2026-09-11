import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve, sep } from "node:path";

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
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/giu)]
    .map((match) => match[1])
    .filter((source) => !/^(?:[a-z][a-z\d+.-]*:)?\/\//iu.test(source))
    .filter((source) => source.split(/[?#]/u, 1)[0].endsWith(".jsx"));
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
  profile = await mkdtemp(join(tmpdir(), "leaseright-check-"));
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
  console.log(`Verified ${expectedScripts.length} component scripts in ${ENTRY} with headless Chrome.`);
} catch (error) {
  console.error(`LeaseRight browser check failed:\n${error.message}`);
  process.exitCode = 1;
} finally {
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
    const exited = new Promise((resolveExit) => chrome.once("exit", resolveExit));
    chrome.kill("SIGTERM");
    await Promise.race([exited, new Promise((resolveWait) => setTimeout(resolveWait, 2_000))]);
  }
  if (profile) await rm(profile, { recursive: true, force: true });
}
