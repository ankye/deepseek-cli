## 1. Contracts / 契约

- [x] 1.1 Add versioned hook DTOs for manifest validation, summaries, lifecycle points, outputs, invocation requests/results, ordering metadata, failure policy, diagnostics, and replay fingerprints. / 增加 manifest validation、summaries、lifecycle points、outputs、invocation requests/results、ordering metadata、failure policy、diagnostics 和 replay fingerprints 的版本化 hook DTO。
- [x] 1.2 Replace `HookSystem` with canonical hooks v1 validate, register, list, project order, and invoke APIs. / 将 `HookSystem` 替换为 canonical hooks v1 validate、register、list、project order 和 invoke APIs。

## 2. Hook System Implementation / Hook System 实现

- [x] 2.1 Implement deterministic manifest validation and structured rejection for malformed or unsupported hooks. / 实现确定性 manifest validation，并对 malformed 或 unsupported hooks 做 structured rejection。
- [x] 2.2 Implement stable hook ordering by priority/order, trust, source kind, dependency metadata, name, and id. / 实现基于 priority/order、trust、source kind、dependency metadata、name 和 id 的稳定 hook ordering。
- [x] 2.3 Implement observe-only hook invocation with typed outputs, redaction, diagnostics, and replay fingerprints. / 实现 observe-only hook invocation，包含 typed outputs、redaction、diagnostics 和 replay fingerprints。
- [x] 2.4 Implement timeout containment and failure policies for continue, block, disable, and rollback-requested. / 实现 timeout containment，以及 continue、block、disable 和 rollback-requested failure policies。
- [x] 2.5 Add lint enforcement that rejects generic pre-launch hook `register` and `run` APIs. / 增加 lint enforcement，拒绝泛化的上线前 hook `register` 和 `run` APIs。

## 3. Tests / 测试

- [x] 3.1 Add package and contract tests for DTOs, manifest validation, canonical API enforcement, ordering, invocation, failure policy, timeout, inertness, and redaction. / 增加 package 与 contract tests，覆盖 DTO、manifest validation、canonical API enforcement、ordering、invocation、failure policy、timeout、inertness 和 redaction。
- [x] 3.2 Add integration and golden tests proving hook invocation evidence is replayable and observe-only. / 增加 integration 与 golden tests，证明 hook invocation evidence 可 replay 且 observe-only。
- [x] 3.3 Add compatibility and matrix tests for schema enforcement, malformed manifests, trust modes, disabled hooks, ordering, timeout, and failure policies. / 增加 compatibility 与 matrix tests，覆盖 schema enforcement、malformed manifests、trust modes、disabled hooks、ordering、timeout 和 failure policies。

## 4. Docs, Validation, Archive / 文档、校验与归档

- [x] 4.1 Update product/reference docs and roadmap implementation markers. / 更新 product/reference docs 与 roadmap implementation markers。
- [x] 4.2 Run typecheck, lint, tests, dependency boundaries, and OpenSpec validation. / 运行 typecheck、lint、tests、dependency boundaries 和 OpenSpec validation。
- [x] 4.3 Archive the completed OpenSpec change. / 归档完成的 OpenSpec change。
