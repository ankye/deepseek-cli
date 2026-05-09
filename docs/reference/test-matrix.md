# Test Matrix / 测试矩阵

| Suite / 套件 | Command / 命令 | Owner / 责任 | Purpose / 目的 |
| --- | --- | --- | --- |
| Typecheck | `npm run typecheck` | All packages | Compile-time contract safety. / 编译期契约安全。 |
| Lint | `npm run lint` | Architecture owners | Boundary and convention enforcement. / 边界与约定强制。 |
| Package tests | `npm test` | Package owners | Unit and package-level behavior. / 单元和包级行为。 |
| Contracts | `npm run test:contracts` | Platform owners | DTO/schema/package boundary guarantees. / DTO、schema、包边界保证。 |
| Integration | `npm run test:integration` | Runtime owners | End-to-end runtime pipeline across packages. / 跨包 runtime 管线。 |
| Golden | `npm run test:golden` | Runtime/testing owners | Replayable event shape and deterministic evidence. / 可 replay 事件形态和确定性证据。 |
| Compatibility | `npm run test:compatibility` | Contract owners | Persisted schema/version requirements. / 持久化 schema/version 要求。 |
| Matrix | `npm run test:matrix` | Platform/testing owners | Cross-platform and scenario matrix behavior. / 跨平台与场景矩阵行为。 |
| E2E | `npm run test:e2e` | Host owners | CLI and VSCode host adapter behavior. / CLI 与 VSCode host adapter 行为。 |
| Live | opt-in env flags | Provider owners | Real DeepSeek provider connectivity. / 真实 DeepSeek provider 连通性。 |

Checkpoint/undo coverage lives in unit, contract, integration, golden, and matrix suites.

checkpoint/undo 覆盖位于 unit、contract、integration、golden 和 matrix suites。

Code intelligence v1 coverage lives in unit, contract, integration, golden, and matrix suites with deterministic local analyzer fixtures and no live IDE/LSP dependency.

code intelligence v1 覆盖位于 unit、contract、integration、golden 和 matrix suites，使用 deterministic local analyzer fixtures，且不依赖 live IDE/LSP。

Observability/privacy v1 coverage lives in unit, contract, integration, golden, compatibility, and matrix suites with local-only diagnostic bundle fixtures, privacy opt-out/export-denial checks, and no raw secret persistence.

observability/privacy v1 覆盖位于 unit、contract、integration、golden、compatibility 和 matrix suites，使用 local-only diagnostic bundle fixtures、privacy opt-out/export-denial checks，并验证无 raw secret persistence。
