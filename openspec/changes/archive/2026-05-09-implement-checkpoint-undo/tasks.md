## 1. Contracts And Specifications / 契约与规格

- [x] 1.1 Add checkpoint/undo DTOs, result types, and workspace manager methods to `platform-contracts`. / 在 `platform-contracts` 增加 checkpoint/undo DTO、result types 和 workspace manager methods。
- [x] 1.2 Validate the OpenSpec change in strict mode after artifacts are complete. / artifacts 完成后用 strict mode 校验 OpenSpec change。

## 2. Workspace State Implementation / Workspace State 实现

- [x] 2.1 Implement deterministic checkpoint creation in `workspace-state-management` for applied file edit transactions. / 在 `workspace-state-management` 为已应用 file edit transactions 实现确定性 checkpoint creation。
- [x] 2.2 Implement restore-by-checkpoint-id with stale-hash rejection and typed diagnostics. / 实现 restore-by-checkpoint-id，包含 stale-hash rejection 和 typed diagnostics。
- [x] 2.3 Implement undo-latest with optional session/path scope and no mutation on empty stack. / 实现 undo-latest，支持可选 session/path scope，并确保空栈不修改文件。

## 3. Tool And Runtime Evidence / 工具与 Runtime 证据

- [x] 3.1 Wire file write/edit tools to record checkpoint references in successful mutation metadata without raw rollback content. / 将 file write/edit tools 接入 checkpoint reference，并确保成功 mutation metadata 不含 raw rollback content。
- [x] 3.2 Ensure restore/undo evidence can be consumed by runtime/session/golden tests as replay-safe JSON. / 确保 restore/undo evidence 可被 runtime/session/golden tests 作为 replay-safe JSON 消费。

## 4. Regression Coverage / 回归覆盖

- [x] 4.1 Add unit and contract tests for checkpoint creation, restore success, stale rejection, undo latest, and secret-safe evidence. / 增加 unit 与 contract tests，覆盖 checkpoint creation、restore success、stale rejection、undo latest 和 secret-safe evidence。
- [x] 4.2 Add integration, golden, and matrix tests for checkpoint/undo replay across fake platform modes. / 增加 integration、golden 和 matrix tests，覆盖 fake platform modes 下的 checkpoint/undo replay。
- [x] 4.3 Run targeted validation gates: typecheck, lint, relevant tests, and OpenSpec strict validation. / 运行目标校验门禁：typecheck、lint、相关 tests 和 OpenSpec strict validation。
