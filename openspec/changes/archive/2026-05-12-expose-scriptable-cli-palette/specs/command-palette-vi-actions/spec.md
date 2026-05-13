## ADDED Requirements

### Requirement: Scriptable CLI Palette Commands / 可脚本化 CLI Palette 命令

The CLI SHALL expose scriptable palette commands that render palette projections, keymap profiles, and dry-run action resolution without executing palette owners.

CLI 必须暴露可脚本化 palette commands，用于渲染 palette projections、keymap profiles 和 dry-run action resolution，且不得执行 palette owners。

#### Scenario: Palette list emits projection / Palette List 输出投影
- **WHEN** a user runs `deepseek palette list --output json`
- **THEN** the CLI emits a `CliPaletteProjectionResult` derived from command composition records, including entries, result-list items, diagnostics, permissions, side effects, and reference pit fixture ids
- **中文** 当用户运行 `deepseek palette list --output json` 时，CLI 必须输出由 command composition records 派生的 `CliPaletteProjectionResult`，包含 entries、result-list items、diagnostics、permissions、side effects 和 reference pit fixture ids。

#### Scenario: Palette JSONL is record-oriented / Palette JSONL 面向记录
- **WHEN** a user runs `deepseek palette list --output jsonl`
- **THEN** the CLI emits a deterministic summary record followed by one record per palette entry and one record per diagnostic, without ANSI or terminal cursor controls
- **中文** 当用户运行 `deepseek palette list --output jsonl` 时，CLI 必须输出确定性的 summary record、每个 palette entry 一条 record、每个 diagnostic 一条 record，且不包含 ANSI 或 terminal cursor controls。

#### Scenario: Palette keymap emits profile / Palette Keymap 输出 Profile
- **WHEN** a user runs `deepseek palette keymap vi-minimal --output json`
- **THEN** the CLI emits the selected keymap profile with contributions and deterministic diagnostics
- **中文** 当用户运行 `deepseek palette keymap vi-minimal --output json` 时，CLI 必须输出所选 keymap profile，包含 contributions 与确定性 diagnostics。

#### Scenario: Palette action is dry-run / Palette Action 是 Dry Run
- **WHEN** a user runs `deepseek palette action inspect <target-id> --output json`
- **THEN** the CLI resolves the action against the projected result-list snapshot and emits a typed `CliActionResolutionResult` without mutating sessions, checkpoints, workspace files, or executing command handlers
- **中文** 当用户运行 `deepseek palette action inspect <target-id> --output json` 时，CLI 必须基于投影出的 result-list snapshot 解析 action，并输出 typed `CliActionResolutionResult`，且不修改 sessions、checkpoints、workspace files 或执行 command handlers。

#### Scenario: Unknown palette target is typed failure / 未知 Palette Target 是类型化失败
- **WHEN** a user runs `deepseek palette action inspect <unknown-target-id> --output json`
- **THEN** the CLI emits a typed failure with deterministic diagnostics rather than throwing an unstructured host error
- **中文** 当用户运行 `deepseek palette action inspect <unknown-target-id> --output json` 时，CLI 必须输出带确定性 diagnostics 的类型化失败，而不是抛出非结构化 host error。
