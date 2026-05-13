## Context

`deepseek palette ...` now provides scriptable palette projection, keymap profile inspection, and dry-run action resolution. Chat already has local slash command handling for approvals, cost/model, and interactive controls. The missing piece is reusing the palette surface inside chat so users can inspect and act on typed targets without leaving the REPL.

`deepseek palette ...` 已经提供可脚本化 palette projection、keymap profile inspection 与 dry-run action resolution。Chat 已经有 approvals、cost/model 和 interactive controls 的本地 slash command handling。缺口是复用 palette 能力到 chat 内，让用户无需离开 REPL 就能查看并操作 typed targets。

## Goals / Non-Goals

**Goals:**

- Add `/palette`, `/palette list`, `/keymap`, and `/palette action` as local chat controls. / 增加 `/palette`、`/palette list`、`/keymap` 与 `/palette action` 本地 chat controls。
- Render compact text in text mode and structured records in JSON/JSONL modes. / text mode 渲染紧凑文本，JSON/JSONL modes 渲染结构化 records。
- Reuse existing CLI palette helpers and keep action resolution dry-run. / 复用现有 CLI palette helpers，并保持 action resolution dry-run。
- Ensure palette slash commands never submit model requests or execute owners. / 确保 palette slash commands 永不提交 model requests 或执行 owners。

**Non-Goals:**

- No persistent selection state across chat lines. / 不跨 chat lines 持久化 selection state。
- No raw-mode keybindings or full-screen result list. / 不做 raw-mode keybindings 或 full-screen result list。
- No command execution from palette. / 不从 palette 执行命令。
- No extension/MCP/plugin discovery expansion in this change. / 本变更不扩展 extension/MCP/plugin discovery。

## Decisions

### Decision: Export rendering helpers from CLI palette module

`commands/palette.ts` already knows how to create the default projection, keymap profile, action result, and text/structured render lines. We will export focused helper functions so chat can reuse exactly the same output contract without importing another app or bypassing packages.

`commands/palette.ts` 已经知道如何创建默认 projection、keymap profile、action result 和 text/structured render lines。我们会导出聚焦 helper functions，让 chat 复用同一输出合同，同时不引入 app-to-app import 或绕过 packages。

Alternative considered: duplicate palette logic in `chat.ts`. Rejected because it would diverge output behavior and increase chat file growth.

备选方案：在 `chat.ts` 复制 palette 逻辑。拒绝原因是输出行为会分叉，并让 chat 文件膨胀。

### Decision: Slash parser stays simple and local

Chat will parse only local slash shapes:

- `/palette` and `/palette list`
- `/keymap [core|vi-minimal]`
- `/palette action <action> <target-id>`

Chat 只解析这些本地 slash 形态。

Alternative considered: route arbitrary `deepseek palette` argv through `parseCliArgs`. Rejected because chat controls should remain a bounded local command surface and avoid accidental process-level behavior.

备选方案：把任意 `deepseek palette` argv 透传给 `parseCliArgs`。拒绝原因是 chat controls 应保持有边界的本地 command surface，避免意外的进程级行为。

## Risks / Trade-offs

- [Risk] Chat output and scriptable palette output may diverge. -> Mitigation: share render helpers and test both JSONL shapes. / [风险] Chat output 与 scriptable palette output 可能分叉。-> 缓解：共享 render helpers，并测试 JSONL 形态。
- [Risk] Users may expect `/palette action open` to execute. -> Mitigation: keep action result dry-run and expose descriptors, not execution. / [风险] 用户可能以为 `/palette action open` 会执行。-> 缓解：保持 dry-run，只暴露 descriptors。
- [Risk] More slash commands can make help noisy. -> Mitigation: add concise help entries, not a full manual. / [风险] slash commands 增多会让 help 变吵。-> 缓解：只加简短 help entries。

## Migration Plan

1. Export palette helper/render functions needed by chat. / 导出 chat 所需 palette helper/render functions。
2. Add chat slash handling for palette/keymap/action. / 增加 chat slash handling。
3. Update chat help projection text. / 更新 chat help 文本。
4. Add CLI host tests for text/JSONL local behavior and no model request. / 增加 CLI host tests。
5. Run OpenSpec validation, typecheck, lint, targeted tests, npm test, boundary and hygiene checks. / 运行验证。

Rollback: remove chat slash handling and helper exports; scriptable `deepseek palette` commands remain intact.

回滚：移除 chat slash handling 与 helper exports；可脚本化 `deepseek palette` commands 保持可用。
