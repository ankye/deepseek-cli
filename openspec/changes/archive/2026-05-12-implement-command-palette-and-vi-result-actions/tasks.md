## 1. Contracts / 契约

- [x] 1.1 Add additive CLI composition DTOs for palette projection results, action resolution results, action state updates, and keymap profile diagnostics. / 为 palette projection results、action resolution results、action state updates 和 keymap profile diagnostics 增加 CLI composition 增量 DTO。
- [x] 1.2 Ensure new DTOs remain host-agnostic, serializable, redaction-aware, and exported through `@deepseek/platform-contracts`. / 确保新 DTO host-agnostic、可序列化、带 redaction，并通过 `@deepseek/platform-contracts` 导出。

## 2. Palette Projection / 面板投影

- [x] 2.1 Implement `@deepseek/command-system` palette helpers in a focused module that maps composition records to `CliPaletteEntry` records. / 在聚焦模块中实现 `@deepseek/command-system` palette helpers，将 composition records 映射为 `CliPaletteEntry` records。
- [x] 2.2 Implement command result-list projection from composition records with stable ids, targets, ordering, metadata, and pit fixture preservation. / 实现从 composition records 到 command result-list 的投影，包含 stable ids、targets、ordering、metadata 和坑位 fixture 保留。
- [x] 2.3 Add deterministic diagnostics for malformed palette records and keep projection inert. / 增加 malformed palette records 的确定性 diagnostics，并保持 projection 惰性。

## 3. Action Resolution / 动作解析

- [x] 3.1 Implement result-list navigation actions (`next`, `previous`, `first`, `last`) that update focus and jump history without rerunning owner subsystems. / 实现 result-list navigation actions（`next`、`previous`、`first`、`last`），更新焦点和 jump history，且不重新运行 owner subsystems。
- [x] 3.2 Implement inert target actions (`open`, `inspect`, `copy`, `explain`) that return typed action results without host-specific rendering. / 实现惰性 target actions（`open`、`inspect`、`copy`、`explain`），返回 typed action results，不包含 host-specific rendering。
- [x] 3.3 Implement `add-to-reference-set` and dry-run `revert` descriptors over typed targets without mutating workspace, sessions, or checkpoints. / 实现 typed targets 上的 `add-to-reference-set` 与 dry-run `revert` descriptors，且不修改 workspace、sessions 或 checkpoints。

## 4. Keymap Profiles / 快捷键 Profile

- [x] 4.1 Implement core and minimal vi keymap profiles as declarative `CliInteractionContribution` records. / 将 core 与最小 vi keymap profiles 实现为声明式 `CliInteractionContribution` records。
- [x] 4.2 Add deterministic keymap conflict diagnostics using existing CLI contribution validation. / 使用现有 CLI contribution validation 增加确定性 keymap conflict diagnostics。

## 5. Regression Coverage / 回归覆盖

- [x] 5.1 Add contract tests for palette projection, stable ordering, target metadata, pit fixture propagation, and no-owner-execution behavior. / 增加 palette projection、stable ordering、target metadata、坑位 fixture 传递和不执行 owner 行为的契约测试。
- [x] 5.2 Add action resolution tests for navigation focus changes, jump history updates, reference set updates, inert inspect/copy/explain/open, and dry-run revert descriptors. / 增加 action resolution 测试，覆盖 navigation focus changes、jump history updates、reference set updates、惰性 inspect/copy/explain/open 和 dry-run revert descriptors。
- [x] 5.3 Add keymap profile tests for vi mappings and conflict diagnostics. / 增加 vi mappings 和 conflict diagnostics 的 keymap profile 测试。

## 6. Docs And Verification / 文档与验证

- [x] 6.1 Update product roadmap or CLI README only if visible behavior changes in this pack. / 只有本包改变可见行为时才更新产品路线或 CLI README。
- [x] 6.2 Run OpenSpec validation, typecheck, lint, targeted tests, npm test, boundary checks, and git hygiene checks. / 运行 OpenSpec validation、typecheck、lint、定向测试、npm test、边界检查和 git hygiene 检查。
