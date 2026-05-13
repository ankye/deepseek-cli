## Context

The previous change archived typed palette projection, keymap profiles, and action resolution under `@deepseek/command-system` and `@deepseek/platform-contracts`. The CLI host already has a thin command module layout (`commands/*`, `parse.ts`, `run-cli.ts`) and supports deterministic `text`, `json`, and `jsonl` output modes.

上一个变更已经把 palette projection、keymap profiles 和 action resolution 归档到 `@deepseek/command-system` 与 `@deepseek/platform-contracts`。CLI host 已经有薄 command module 结构，并支持确定性的 `text`、`json`、`jsonl` 输出。

## Goals / Non-Goals

**Goals:**

- Expose command palette projection through `deepseek palette list`. / 通过 `deepseek palette list` 暴露 command palette projection。
- Expose keymap profiles through `deepseek palette keymap [core|vi-minimal]`. / 通过 `deepseek palette keymap [core|vi-minimal]` 暴露 keymap profiles。
- Expose dry-run action resolution through `deepseek palette action <action> <target-id>`. / 通过 `deepseek palette action <action> <target-id>` 暴露 dry-run action resolution。
- Keep CLI output deterministic and free of ANSI in structured modes. / 保持 CLI output 确定，并在结构化模式不包含 ANSI。
- Keep CLI host thin and reuse shared command-system helpers. / 保持 CLI host 薄，并复用共享 command-system helpers。

**Non-Goals:**

- No full-screen TUI, fuzzy picker, raw key input, alternate screen, or Vim emulation. / 不做 full-screen TUI、fuzzy picker、raw key input、alternate screen 或 Vim emulation。
- No execution from palette entries. / 不从 palette entries 执行命令。
- No model/tool/MCP/plugin/workflow invocation. / 不调用 model/tool/MCP/plugin/workflow。
- No persistent palette session state. / 不持久化 palette session state。

## Decisions

### Decision: Use a dedicated CLI palette command module

Add `src/apps/cli/src/commands/palette.ts` with rendering helpers and default composition records. `parse.ts` only parses palette subcommands, and `run-cli.ts` only routes to the module.

增加 `src/apps/cli/src/commands/palette.ts`，放 rendering helpers 与默认 composition records。`parse.ts` 只负责解析 palette subcommands，`run-cli.ts` 只负责路由到该模块。

Alternative considered: add palette handling inline in `run-cli.ts`. Rejected because the CLI host split was created specifically to avoid central file growth.

备选方案：直接在 `run-cli.ts` 内实现 palette。拒绝原因是 CLI host 已拆分，不能让入口文件重新膨胀。

### Decision: Default palette is built from existing local command composition records

The first scriptable palette will project readiness commands and interactive controls, both already represented as inert composition records. This gives useful output and validates the surface without inventing a runtime registry.

第一版 scriptable palette 从 readiness commands 与 interactive controls 构建，这两类已经有惰性的 composition records。这样可以提供有用输出并验证产品面，而不发明 runtime registry。

Alternative considered: discover every extension/plugin/MCP record at command time. Deferred because that crosses into extension lifecycle and trust policy; those records can be added later through explicit loaders.

备选方案：命令运行时发现所有 extension/plugin/MCP records。暂缓，因为这会触及 extension lifecycle 与 trust policy；后续可通过显式 loaders 加入。

### Decision: Action command reconstructs an ephemeral snapshot

`palette action` will project the current palette, create a `CliCompositionSnapshot` with its result list, resolve the requested action by target id, and emit the typed result. The action remains dry-run and state is not persisted.

`palette action` 会投影当前 palette，创建包含 result list 的临时 `CliCompositionSnapshot`，按 target id 解析请求动作，并输出 typed result。该动作保持 dry-run，状态不持久化。

Alternative considered: maintain palette state between CLI invocations. Rejected because scriptable commands must remain deterministic and stateless.

备选方案：跨 CLI invocation 维护 palette state。拒绝原因是脚本化命令必须保持确定性与无状态。

## Risks / Trade-offs

- [Risk] Users may expect `palette action open` to execute. -> Mitigation: command output labels action descriptors as dry-run and tests assert no owner execution. / [风险] 用户可能以为 `palette action open` 会执行。-> 缓解：输出将 action descriptor 标记为 dry-run，测试断言不执行 owner。
- [Risk] Default palette may look small. -> Mitigation: use this as the stable host surface first; extension/MCP/plugin loaders can be added through later explicit changes. / [风险] 默认 palette 可能显得小。-> 缓解：先稳定 host surface；extension/MCP/plugin loaders 后续通过显式变更加入。
- [Risk] Text output can become renderer-specific. -> Mitigation: keep text compact and structured, and rely on JSON/JSONL tests for exact contracts. / [风险] text output 可能变成 renderer-specific。-> 缓解：text 保持紧凑结构化，用 JSON/JSONL 测试约束精确合同。

## Migration Plan

1. Add CLI parsing/types/routing for `palette`. / 增加 `palette` 的 CLI parsing/types/routing。
2. Add focused palette command module. / 增加聚焦 palette command module。
3. Add CLI host tests for list/keymap/action and usage. / 增加 list/keymap/action 与 usage 的 CLI host 测试。
4. Run OpenSpec, typecheck, lint, targeted tests, npm test, and boundary checks. / 运行 OpenSpec、typecheck、lint、定向测试、npm test 与边界检查。

Rollback: remove the palette command module and routing; shared command-system palette APIs remain unchanged.

回滚：移除 palette command module 与 routing；共享 command-system palette APIs 保持不变。
