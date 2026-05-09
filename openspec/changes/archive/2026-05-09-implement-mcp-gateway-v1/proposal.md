## Why

MCP is the first external capability surface after canonical skills and hooks, so it must enter DeepSeek through the same governed platform path instead of becoming a side-channel. The current MCP package is only a minimal fake; v1 needs stable contracts for server manifests, discovery, tool/resource/prompt projection, invocation metadata, failure isolation, and replayable evidence.

MCP 是 canonical skills 与 hooks 之后的第一个外部能力入口，因此必须通过同一套受治理的平台路径进入 DeepSeek，而不能成为旁路。当前 MCP package 只是最小 fake；v1 需要为 server manifests、discovery、tool/resource/prompt projection、invocation metadata、failure isolation 和 replayable evidence 建立稳定契约。

## What Changes

- Define MCP gateway v1 contracts with schema versioning, server manifests, transport declarations, trust, permissions, redaction, timeouts, health, resource cache policy, prompt metadata, and invocation traces. / 定义 MCP gateway v1 契约，包含 schema version、server manifests、transport declarations、trust、permissions、redaction、timeouts、health、resource cache policy、prompt metadata 和 invocation traces。
- Replace the generic pre-v1 fake behavior with canonical v1 gateway APIs for `validateManifest`, `connectServer`, `listServers`, `listTools`, `listResources`, `listPrompts`, `callTool`, and `readResource`. / 用 canonical v1 gateway APIs 替换 pre-v1 generic fake 行为，包括 `validateManifest`、`connectServer`、`listServers`、`listTools`、`listResources`、`listPrompts`、`callTool` 和 `readResource`。
- Keep v1 deterministic and testable with fake/in-process server adapters; stdio/HTTP/WebSocket real transports remain declared but not executed until later OpenSpecs. / v1 保持 deterministic 和可测试，使用 fake/in-process server adapters；stdio/HTTP/WebSocket 真实传输只声明不执行，留到后续 OpenSpec。
- Enforce fail-closed behavior for untrusted servers, invalid namespaces, malformed schemas, disabled servers, unhealthy connections, timeout, unknown tools/resources, and privileged calls outside declared permissions. / 对 untrusted servers、invalid namespaces、malformed schemas、disabled servers、unhealthy connections、timeout、unknown tools/resources 和超出声明权限的 privileged calls 执行 fail-closed。
- Add lint, contract, integration, golden, compatibility, and matrix coverage proving MCP cannot bypass platform governance. / 增加 lint、contract、integration、golden、compatibility 和 matrix 覆盖，证明 MCP 不能绕过平台治理。
- **BREAKING**: Remove pre-v1 `connect`, `listTools(namespace)`, and `callTool(namespace, name, input)` as canonical contract methods. / **BREAKING**：移除 pre-v1 `connect`、`listTools(namespace)` 和 `callTool(namespace, name, input)` 作为 canonical contract methods。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `mcp-gateway`: tighten the existing MCP gateway specification from a landing-zone contract into a canonical v1 governed gateway. / 将现有 MCP gateway 规格从落点契约收紧为 canonical v1 受治理 gateway。
- `runtime-message-bus`: require MCP discovery/invocation/resource evidence to be replayable runtime records when emitted. / 要求 MCP discovery/invocation/resource evidence 在发出时成为可 replay 的 runtime records。
- `testing-regression`: require deterministic fake MCP servers, golden traces, compatibility checks, and matrix coverage. / 要求 deterministic fake MCP servers、golden traces、compatibility checks 和 matrix coverage。
- `capability-execution-governance`: require MCP executable calls and resource reads to carry governed execution metadata before they are used by runtime, skills, hooks, commands, or agents. / 要求 MCP executable calls 和 resource reads 在被 runtime、skills、hooks、commands 或 agents 使用前携带受治理 execution metadata。

## Impact

- `src/packages/platform-contracts/src/mcp.ts`: canonical MCP v1 DTOs and service interface. / canonical MCP v1 DTO 与 service interface。
- `src/packages/mcp-gateway/src/index.ts`: deterministic in-memory/fake gateway implementation. / deterministic in-memory/fake gateway 实现。
- `src/packages/testing-regression/src/fakes`: runtime dependency fakes updated to v1 API. / runtime dependency fakes 更新到 v1 API。
- `scripts/lint-framework`: rule preventing pre-v1 MCP generic APIs outside migration-free code. / 增加规则，禁止 pre-v1 MCP generic APIs。
- `tests/contracts`, `tests/integration`, `tests/golden`, `tests/compatibility`, `tests/matrix`: MCP v1 coverage. / MCP v1 覆盖。
- `docs/product`, `docs/reference`, `docs/architecture`: roadmap and developer docs updated with MCP v1 status. / 更新路线图与开发者文档中的 MCP v1 状态。
