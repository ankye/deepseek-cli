import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "--test", "src/**/*.test.ts", "tests/**/*.test.ts"],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
