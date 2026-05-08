import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

async function writeFixtureFile(root: string, path: string, content: string): Promise<void> {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, "utf8");
}

function lintScript(root: string): string {
  const frameworkUrl = pathToFileURL(resolve("scripts/lint-framework/index.mjs")).href;
  const sourceRoot = join(root, "src");
  return `
import { runArchitectureLint } from ${JSON.stringify(frameworkUrl)};

const conventions = {
  sourceRoots: [${JSON.stringify(sourceRoot)}],
  metadataRoots: [${JSON.stringify(sourceRoot)}],
  ignoredDirectoryNames: new Set(["node_modules", ".git", "dist", "coverage", ".cache", "\\u53c2\\u8003"]),
  typescriptExtensions: [".ts"],
  packageManifestNames: ["package.json"],
  hostApiModules: new Set(["node:fs", "node:fs/promises", "node:process", "vscode"]),
  packageImportPrefix: "@deepseek/",
  workspacePackageNames: new Map([
    ["platform-contracts", "@deepseek/platform-contracts"],
    ["runtime", "@deepseek/runtime"],
    ["cli", "deekseek-cli"],
    ["vscode-extension", "@deepseek/vscode-extension"]
  ]),
  packageDependencyPolicy: new Map([
    ["platform-contracts", new Set()],
    ["runtime", new Set(["@deepseek/platform-contracts"])]
  ]),
  appDependencyPolicy: new Map([
    ["cli", new Set(["@deepseek/platform-contracts"])],
    ["vscode-extension", new Set(["@deepseek/platform-contracts"])]
  ]),
  publishableApps: new Map([
    ["cli", { packageName: "deekseek-cli", binName: "deepseek", files: new Set(["dist", "README.md"]) }]
  ]),
  appPackages: new Map([
    ["cli", new Set(["@deepseek/vscode-extension"])],
    ["vscode-extension", new Set(["deekseek-cli"])]
  ]),
  packageRules: {
    "platform-contracts": {
      forbidPackageImports: true,
      forbidHostApiImports: true,
      forbiddenGlobals: new Set(["process", "Buffer"])
    },
    runtime: {
      forbiddenImports: new Set(["@deepseek/testing-regression"])
    }
  },
  governedExecution: {
    approvedPackages: new Set(["runtime"]),
    deterministicPackages: new Set(["testing-regression"]),
    primitives: [
      {
        serviceNames: new Set(["capabilities", "capabilityRegistry"]),
        methods: new Set(["execute", "resolveExecutable"]),
        ownerPackage: "capability-registry"
      },
      {
        serviceNames: new Set(["skills", "skillSystem"]),
        methods: new Set(["activate"]),
        ownerPackage: "skill-system"
      },
      {
        serviceNames: new Set(["hooks", "hookSystem"]),
        methods: new Set(["run"]),
        ownerPackage: "hook-system"
      },
      {
        serviceNames: new Set(["mcp", "mcpGateway"]),
        methods: new Set(["listTools", "callTool", "connect"]),
        ownerPackage: "mcp-gateway"
      },
      {
        serviceNames: new Set(["models", "modelGateway"]),
        methods: new Set(["stream"]),
        ownerPackage: "model-gateway"
      },
      {
        serviceNames: new Set(["sandbox", "sandboxRuntime"]),
        methods: new Set(["run"]),
        ownerPackage: "policy-sandbox"
      },
      {
        serviceNames: new Set(["scheduler", "concurrency", "concurrencyOrchestrator"]),
        methods: new Set(["run", "cancel"]),
        ownerPackage: "concurrency-orchestration"
      },
      {
        serviceNames: new Set(["policy", "policyEngine"]),
        methods: new Set(["decide"]),
        ownerPackage: "policy-sandbox"
      },
      {
        serviceNames: new Set(["workflow", "workflowOrchestrator"]),
        methods: new Set(["openInvocation", "closeInvocation"]),
        ownerPackage: "workflow-orchestration"
      },
      {
        serviceNames: new Set(["bus", "runtimeMessageBus"]),
        methods: new Set(["publish"]),
        ownerPackage: "runtime-message-bus"
      }
    ]
  }
};

const result = await runArchitectureLint({ conventions });
console.log(JSON.stringify(result.failures.map((failure) => failure.ruleId).sort()));
process.exit(result.failures.length > 0 ? 2 : 0);
`;
}

async function withFixture<T>(callback: (root: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(join(tmpdir(), "deepseek-lint-"));
  try {
    return await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("architecture lint framework", () => {
  it("passes a valid minimal workspace", async () => {
    await withFixture(async (root) => {
      await writeFixtureFile(
        root,
        "src/packages/platform-contracts/src/index.ts",
        "export interface ContractValue { readonly value: string; }\n"
      );
      await writeFixtureFile(
        root,
        "src/packages/platform-contracts/package.json",
        JSON.stringify({
          name: "@deepseek/platform-contracts",
          version: "0.1.0",
          private: true,
          type: "module",
          exports: {
            ".": {
              types: "./src/index.ts",
              default: "./src/index.ts"
            }
          },
          dependencies: {}
        })
      );
      await writeFixtureFile(
        root,
        "src/packages/runtime/src/index.ts",
        "import type { ContractValue } from \"@deepseek/platform-contracts\";\nexport type RuntimeValue = ContractValue;\n"
      );
      await writeFixtureFile(
        root,
        "src/packages/runtime/package.json",
        JSON.stringify({
          name: "@deepseek/runtime",
          version: "0.1.0",
          private: true,
          type: "module",
          exports: {
            ".": {
              types: "./src/index.ts",
              default: "./src/index.ts"
            }
          },
          dependencies: {
            "@deepseek/platform-contracts": "0.1.0"
          }
        })
      );

      const result = spawnSync(process.execPath, ["--input-type=module", "--eval", lintScript(root)], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.deepEqual(JSON.parse(result.stdout), []);
    });
  });

  it("reports stable rule ids for boundary violations", async () => {
    await withFixture(async (root) => {
      await writeFixtureFile(
        root,
        "src/packages/platform-contracts/src/index.ts",
        "import { createHeadlessRuntime } from \"@deepseek/runtime\";\nexport const env = process.env;\nexport { createHeadlessRuntime };\n"
      );
      await writeFixtureFile(
        root,
        "src/packages/runtime/src/index.ts",
        "import { createDeterministicRuntimeDependencies } from \"@deepseek/testing-regression\";\nexport { createDeterministicRuntimeDependencies };\n"
      );
      await writeFixtureFile(root, "src/apps/cli/src/index.ts", "import \"@deepseek/vscode-extension\";\n");
      await writeFixtureFile(
        root,
        "src/packages/runtime/package.json",
        JSON.stringify({
          name: "@deepseek/runtime",
          version: "0.1.0",
          private: true,
          type: "module",
          dependencies: {
            "@deepseek/testing-regression": "workspace:*"
          }
        })
      );

      const result = spawnSync(process.execPath, ["--input-type=module", "--eval", lintScript(root)], { encoding: "utf8" });
      assert.equal(result.status, 2, result.stderr || result.stdout);
      const ruleIds = new Set(JSON.parse(result.stdout) as string[]);

      assert.equal(ruleIds.has("contracts/platform-contracts-are-pure"), true);
      assert.equal(ruleIds.has("runtime/no-testing-regression-dependency"), true);
      assert.equal(ruleIds.has("imports/no-app-to-app-imports"), true);
      assert.equal(ruleIds.has("package/package-json-boundaries"), true);
    });
  });

  it("allows governed execution primitives in runtime, owner packages, and tests", async () => {
    await withFixture(async (root) => {
      await writeFixtureFile(root, "src/packages/runtime/src/index.ts", "export async function run(deps) { await deps.skills.activate(\"review\", {}); }\n");
      await writeFixtureFile(root, "src/packages/skill-system/src/index.ts", "export async function own(skillSystem) { await skillSystem.activate(\"review\", {}); }\n");
      await writeFixtureFile(root, "src/packages/concurrency-orchestration/src/index.ts", "export async function ownScheduler(scheduler) { await scheduler.run({ id: \"task\", name: \"work\" }, async () => undefined); }\n");
      await writeFixtureFile(root, "src/apps/cli/test/cli.test.ts", "export async function test(deps) { await deps.mcp.listTools(\"fake\"); }\n");

      const result = spawnSync(process.execPath, ["--input-type=module", "--eval", lintScript(root)], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.deepEqual(JSON.parse(result.stdout), []);
    });
  });

  it("rejects direct governed execution primitive bypasses outside approved owners", async () => {
    await withFixture(async (root) => {
      await writeFixtureFile(root, "src/apps/cli/src/index.ts", "export async function bad(deps) { await deps.skills.activate(\"review\", {}); }\n");
      await writeFixtureFile(root, "src/apps/vscode-extension/src/index.ts", "export async function badHost(deps) { await deps.scheduler.run({ id: \"task\", name: \"work\" }, async () => undefined); }\n");
      await writeFixtureFile(root, "src/packages/context-engine/src/index.ts", "export async function alsoBad(deps) { await deps.mcp.listTools(\"fake\"); await deps.policy.decide({}); await deps.capabilities.resolveExecutable(\"runtime.echo\"); }\n");

      const result = spawnSync(process.execPath, ["--input-type=module", "--eval", lintScript(root)], { encoding: "utf8" });
      assert.equal(result.status, 2, result.stderr || result.stdout);
      const ruleIds = new Set(JSON.parse(result.stdout) as string[]);

      assert.deepEqual([...ruleIds], ["governed-execution/no-direct-primitive-bypass"]);
    });
  });

  it("rejects legacy runtime direct execution paths inside runtime package", async () => {
    await withFixture(async (root) => {
      await writeFixtureFile(
        root,
        "src/packages/runtime/src/index.ts",
        "export class HeadlessAgentRuntime { async *runTurn(deps) { yield* deps.models.stream({}); await deps.workflow.runGraph({}, {}); } }\n"
      );

      const result = spawnSync(process.execPath, ["--input-type=module", "--eval", lintScript(root)], { encoding: "utf8" });
      assert.equal(result.status, 2, result.stderr || result.stdout);
      const ruleIds = new Set(JSON.parse(result.stdout) as string[]);
      assert.equal(ruleIds.has("runtime/no-legacy-direct-execution"), true);
    });
  });
});
