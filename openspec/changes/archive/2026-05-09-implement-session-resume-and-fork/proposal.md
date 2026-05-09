## Why

R1 needs sessions that survive beyond a single command or interactive process. Users must be able to resume a previous coding session and create a lightweight fork for alternative work without losing replay, trace, policy, or event ordering guarantees.

R1 需要能跨越单次 command 或 interactive process 的 sessions。用户必须能够恢复之前的 coding session，并为替代方案创建轻量 fork，同时不丢失 replay、trace、policy 或 event ordering 保证。

## What Changes

- Add session resume and fork-lite contracts to the session store and runtime entry points.
- 在 session store 与 runtime entry points 中增加 session resume 与 fork-lite 契约。
- Preserve event-sourced session history with parent/child lineage metadata and deterministic reconstructed state.
- 保留 event-sourced session history，并包含 parent/child lineage metadata 与确定性 reconstructed state。
- Add CLI-visible session controls for resume/fork without embedding private session state in the CLI adapter.
- 增加 CLI 可见的 session resume/fork 控制入口，但不在 CLI adapter 中嵌入私有 session state。
- Ensure resumed and forked runtime invocations continue through the governed kernel path.
- 确保 resumed 与 forked runtime invocations 继续通过 governed kernel path。
- Add deterministic unit, contract, integration, golden, compatibility, and e2e coverage for resume and fork-lite.
- 为 resume 与 fork-lite 增加 deterministic unit、contract、integration、golden、compatibility 和 e2e 覆盖。

## Capabilities

### New Capabilities

- `session-resume-fork`: Defines R1 session resume/fork-lite behavior, lineage metadata, event reconstruction, CLI command surface, and acceptance evidence.

### Modified Capabilities

- `session-store`: Adds concrete persisted session metadata, resume result, fork result, lineage, snapshot, and failure semantics.
- `runtime-event-loop`: Adds requirements that resumed/forked turns submit their session id through the kernel and preserve canonical event ordering.
- `minimal-interactive-cli`: Adds interactive command surface for session resume/fork-lite while keeping the CLI host adapter state-free.
- `communication-protocol`: Adds versioned session operation request/result/control event semantics.
- `testing-regression`: Adds regression coverage for session resume, fork-lite lineage, golden replay, compatibility, and CLI smoke.

## Impact

- Affected code: `src/packages/platform-contracts`, `src/packages/session-store`, `src/packages/runtime`, `src/apps/cli`, `src/packages/command-system`, `src/packages/testing-regression`, `tests/contracts`, `tests/integration`, `tests/golden`, `tests/compatibility`, and `tests/e2e`.
- 受影响代码：`src/packages/platform-contracts`、`src/packages/session-store`、`src/packages/runtime`、`src/apps/cli`、`src/packages/command-system`、`src/packages/testing-regression`、`tests/contracts`、`tests/integration`、`tests/golden`、`tests/compatibility` 和 `tests/e2e`。
- Public behavior: CLI can expose session resume/fork-lite commands and interactive controls backed by `SessionStore`, while existing headless and interactive prompt behavior remains compatible.
- 公共行为：CLI 可以暴露由 `SessionStore` 支撑的 session resume/fork-lite commands 与 interactive controls，同时现有 headless 与 interactive prompt 行为保持兼容。
- No breaking change is intended. Unsupported or unknown session ids must fail closed with typed errors.
- 不计划 breaking change。unsupported 或 unknown session ids 必须以 typed errors fail closed。
