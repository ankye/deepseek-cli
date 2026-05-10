import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { apps, appDependencies, packageDependencies, packages } from "./workspace-packages.mjs";

const root = process.cwd();

function packageJsonFor(name, deps, extra = {}) {
  return {
    name: `@deepseek/${name}`,
    version: "0.1.0",
    private: true,
    type: "module",
    exports: {
      ".": {
        types: "./src/index.ts",
        default: "./src/index.ts"
      }
    },
    dependencies: Object.fromEntries(deps.map((dep) => [`@deepseek/${dep}`, "0.1.0"])),
    ...extra
  };
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

for (const name of packages) {
  const dir = join(root, "src", "packages", name);
  await mkdir(join(dir, "src"), { recursive: true });
  await mkdir(join(dir, "test"), { recursive: true });
  await writeJson(join(dir, "package.json"), packageJsonFor(name, packageDependencies[name] ?? []));
}

for (const name of apps) {
  const dir = join(root, "src", "apps", name);
  await mkdir(join(dir, "src"), { recursive: true });
  await mkdir(join(dir, "test"), { recursive: true });
  const extra =
    name === "cli"
      ? {
          name: "deepseek-agent-cli",
          private: false,
          license: "MIT",
          exports: {
            ".": "./dist/index.js"
          },
          files: ["dist", "README.md"],
          scripts: {
            build: "esbuild src/index.ts --bundle --platform=node --format=esm --target=node22 --outfile=dist/index.js"
          },
          dependencies: {},
          publishConfig: {
            access: "public"
          },
          bin: {
            deepseek: "./dist/index.js"
          }
        }
      : {
          displayName: "DeepSeek Agent",
          engines: {
            vscode: "^1.90.0"
          },
          activationEvents: ["onCommand:deepseek.runPrompt"],
          main: "./src/index.ts"
        };
  await writeJson(join(dir, "package.json"), packageJsonFor(name, appDependencies[name] ?? [], extra));
}

console.log(`Scaffolded ${packages.length} packages and ${apps.length} apps.`);
