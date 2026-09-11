import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENTRY_POINTS = ["LeaseRight.html", "index.html"];

function localScriptPaths(html) {
  const scripts = [];
  const scriptSrc = /<script\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/giu;

  for (const match of html.matchAll(scriptSrc)) {
    const source = match[1] ?? match[2] ?? match[3];
    if (/^(?:[a-z][a-z\d+.-]*:)?\/\//iu.test(source)) continue;
    scripts.push(source);
  }

  return scripts;
}

async function assertFile(filePath, label) {
  await access(filePath);
  const details = await stat(filePath);
  if (!details.isFile()) throw new Error(`${label} is not a file`);
}

export async function validatePrototype(rootDirectory) {
  const componentsDirectory = path.join(rootDirectory, "components");
  const componentNames = (await readdir(componentsDirectory))
    .filter((name) => name.endsWith(".jsx"))
    .sort();

  if (componentNames.length === 0) {
    throw new Error("No components/*.jsx files were found");
  }

  const failures = [];
  let localScriptCount = 0;

  for (const entryPoint of ENTRY_POINTS) {
    try {
      const entryPath = path.join(rootDirectory, entryPoint);
      const html = await readFile(entryPath, "utf8");

      for (const source of localScriptPaths(html)) {
        localScriptCount += 1;
        const pathname = decodeURIComponent(source.split(/[?#]/u, 1)[0]);
        const resolvedPath = pathname.startsWith("/")
          ? path.resolve(rootDirectory, `.${pathname}`)
          : path.resolve(path.dirname(entryPath), pathname);
        const relativeTarget = path.relative(rootDirectory, resolvedPath);

        if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
          failures.push(`${entryPoint}: script src escapes the repository: ${source}`);
          continue;
        }

        try {
          await assertFile(resolvedPath, `${entryPoint} script src ${source}`);
        } catch (error) {
          failures.push(`${entryPoint}: missing script src ${source} (${error.message})`);
        }
      }
    } catch (error) {
      failures.push(`${entryPoint}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Prototype validation failed:\n- ${failures.join("\n- ")}`);
  }

  return {
    componentCount: componentNames.length,
    entryPointCount: ENTRY_POINTS.length,
    localScriptCount,
  };
}

const isMainModule = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const rootDirectory = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  try {
    const result = await validatePrototype(rootDirectory);
    console.log(
      `Found ${result.componentCount} JSX components; validated `
      + `${result.localScriptCount} local script references across `
      + `${result.entryPointCount} HTML entry points.`
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
