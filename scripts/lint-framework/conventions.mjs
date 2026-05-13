import { appDependencies, apps, packageDependencies, packages } from "../workspace-packages.mjs";

function packageNameForWorkspace(workspaceName) {
  if (workspaceName === "cli") return "deepseek-agent-cli";
  return `@deepseek/${workspaceName}`;
}

function dependencyPolicyFrom(dependenciesByWorkspace) {
  return new Map(
    Object.entries(dependenciesByWorkspace).map(([workspaceName, dependencies]) => [
      workspaceName,
      new Set(dependencies.map(packageNameForWorkspace))
    ])
  );
}

export const lintConventions = {
  sourceRoots: ["src", "tests"],
  metadataRoots: ["src"],
  ignoredDirectoryNames: new Set(["node_modules", ".git", "dist", "coverage", ".cache", "\u53c2\u8003"]),
  typescriptExtensions: [".ts", ".tsx", ".mts", ".cts"],
  packageManifestNames: ["package.json"],
  hostApiModules: new Set([
    "fs",
    "node:fs",
    "fs/promises",
    "node:fs/promises",
    "child_process",
    "node:child_process",
    "process",
    "node:process",
    "vscode"
  ]),
  packageImportPrefix: "@deepseek/",
  workspacePackages: new Set(packages),
  workspaceApps: new Set(apps),
  workspacePackageNames: new Map([...packages, ...apps].map((workspaceName) => [workspaceName, packageNameForWorkspace(workspaceName)])),
  packageDependencyPolicy: dependencyPolicyFrom(packageDependencies),
  appDependencyPolicy: dependencyPolicyFrom(appDependencies),
  publishableApps: new Map([
    [
      "cli",
      {
        packageName: "deepseek-agent-cli",
        binName: "deepseek",
        files: new Set(["dist", "README.md"])
      }
    ]
  ]),
  appPackages: new Map([
    ["cli", new Set(["@deepseek/vscode-extension"])],
    ["vscode-extension", new Set(["@deepseek/cli", "deepseek-agent-cli"])]
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
        serviceNames: new Set(["commands", "commandSystem"]),
        methods: new Set(["invoke"]),
        ownerPackage: "command-system"
      },
      {
        serviceNames: new Set(["skills", "skillSystem"]),
        methods: new Set(["activateSkill", "projectContext", "loadSkill", "registerSkill"]),
        ownerPackage: "skill-system"
      },
      {
        serviceNames: new Set(["hooks", "hookSystem"]),
        methods: new Set(["invokeHooks", "registerHook", "projectOrder"]),
        ownerPackage: "hook-system"
      },
      {
        serviceNames: new Set(["mcp", "mcpGateway"]),
        methods: new Set(["connectServer", "callTool", "readResource", "listTools", "listResources", "listPrompts"]),
        ownerPackage: "mcp-gateway"
      },
      {
        serviceNames: new Set(["plugins", "pluginManager"]),
        methods: new Set(["install", "uninstall"]),
        ownerPackage: "plugin-system"
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
  },
  contextProjection: {
    approvedPackages: new Set(["context-engine", "runtime", "testing-regression"]),
    serviceNames: new Set(["context", "contextEngine"]),
    methods: new Set(["addNode", "project", "projectGraph"])
  },
  platformAccess: {
    approvedPackages: new Set(["platform-abstraction", "workspace-state-management", "session-store", "testing-regression"]),
    forbiddenImports: new Set([
      "fs",
      "node:fs",
      "fs/promises",
      "node:fs/promises",
      "child_process",
      "node:child_process",
      "keytar",
      "keychain",
      "node-keytar",
      "clipboardy",
      "open",
      "sharp"
    ]),
    forbiddenProcessProperties: new Set(["platform", "arch"]),
    forbiddenSearchCommands: new Set(["rg", "grep", "findstr", "Select-String", "select-string"]),
    forbiddenNativeNames: [/keytar/i, /keychain/i, /clipboard/i, /native/i, /sharp/i]
  },
  secretSandbox: {
    approvedPackages: new Set([
      "platform-contracts",
      "policy-sandbox",
      "runtime",
      "core-coding-tools",
      "platform-abstraction",
      "credential-auth-management",
      "command-system",
      "model-gateway",
      "workspace-state-management",
      "session-store",
      "testing-regression"
    ]),
    forbiddenSandboxProperties: new Set(["sandboxProfile", "sandboxRequirements", "sandboxCapabilities"]),
    forbiddenSecretProperties: new Set(["apiKey", "token", "secret", "password", "credential"])
  },
  scaleGuardrails: {
    maxCentralFileLines: 800,
    maxPackageIndexLines: 500,
    plannedOversizedFiles: new Set([
      "src/packages/platform-abstraction/src/index.ts",
      "src/packages/mcp-gateway/src/index.ts",
      "src/packages/model-gateway/src/index.ts",
      "src/packages/context-engine/src/index.ts",
      "src/packages/policy-sandbox/src/index.ts"
    ])
  }
};
