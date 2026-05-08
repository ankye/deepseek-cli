import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dir = join("tests", "acceptance");
await mkdir(join(dir, "latest"), { recursive: true });

const content = `# Acceptance Evidence Index

This index maps each first-framework acceptance gate to a command, test suite, trace, fixture, or explicit deferral.

| Gate | Command or Evidence | Status |
| --- | --- | --- |
| OpenSpec validation | \`openspec validate --specs --strict\` -> \`latest/openspec-validation.txt\` | required |
| OpenSpec provenance hygiene | \`rg -n "Claude|claude|Hermes|hermes|参考" openspec/specs openspec/changes/archive/2026-05-08-bootstrap-future-ready-cli-framework\` -> \`latest/reference-hygiene.txt\` | required |
| Workspace layout | directory listing -> \`latest/workspace-layout.txt\` | required |
| Package boundaries | \`node scripts/check-boundaries.mjs\` -> \`latest/dependency-boundaries.txt\` | required |
| Type and contract checks | \`npm run typecheck\`, \`npm run test:contracts\` -> \`latest/typecheck.txt\`, \`latest/contracts.txt\` | required |
| CLI build artifact | \`npm run build:cli\` -> \`latest/build-cli.txt\` | required |
| Headless smoke | \`npm run smoke:headless\` -> \`latest/smoke-headless.txt\` | required |
| Protocol and bus replay | \`npm run test:golden\` -> \`latest/golden-replay.txt\` | required |
| Scheduler/workflow/concurrency | \`npm run test:integration\` and package tests -> \`latest/integration.txt\`, \`latest/test-summary.txt\` | required |
| Capability ecosystem | package and integration tests -> \`latest/integration.txt\`, \`latest/test-summary.txt\` | required |
| Policy/sandbox/platform/workspace | package, integration, and matrix tests -> \`latest/integration.txt\`, \`latest/matrix.txt\`, \`latest/compatibility.txt\` | required |
| Memory/cache/credential/usage/code intelligence | package and integration tests -> \`latest/test-summary.txt\` | required |
| Session/replay/regression | \`npm run test:golden\`, \`npm run test:compatibility\` -> \`latest/golden-replay.txt\`, \`latest/compatibility.txt\` | required |
| Host adapters | \`npm run test:e2e\` -> \`latest/smoke-host-adapters.txt\` | required |
| Future capability deferrals | OpenSpec landing map in design.md | deferred by design |
`;

await writeFile(join(dir, "acceptance-index.md"), content, "utf8");
console.log("wrote tests/acceptance/acceptance-index.md");
