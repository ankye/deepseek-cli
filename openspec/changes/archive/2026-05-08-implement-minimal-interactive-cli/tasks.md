## 1. Contracts And Command Metadata / 契约与命令元数据

- [x] 1.1 Add typed interactive control command ids, manifests, and command result shapes without introducing terminal-only objects.
- [x] 1.2 Add CLI option parsing for explicit `interactive` mode and safe no-arg TTY versus non-TTY behavior.
- [x] 1.3 Ensure side-effecting interactive commands delegate through existing command/runtime/platform contracts.

## 2. Interactive Runner / 交互式 Runner

- [x] 2.1 Implement a stream-injected interactive runner for prompt input, slash command handling, output writing, EOF, and shutdown.
- [x] 2.2 Route every plain prompt through the same kernel-backed runtime execution path used by headless CLI.
- [x] 2.3 Implement `/help`, `/exit`, `/quit`, `/clear`, unknown command handling, and `/cancel` with structured results.
- [x] 2.4 Wire SIGINT or injected cancellation to the active runtime invocation without exiting the shell when a turn is active.

## 3. Rendering And Protocol Alignment / 渲染与协议对齐

- [x] 3.1 Reuse or factor text and stream-json renderers so interactive and headless modes consume equivalent runtime events.
- [x] 3.2 Preserve correlation, trace, terminal state, redaction, and error metadata for interactive traces and tests.
- [x] 3.3 Add bounded writer behavior for slow output, EOF, active invocation shutdown, and structured overflow/failure cases as needed.

## 4. Regression Coverage / 回归覆盖

- [x] 4.1 Add package-local tests for CLI argument parsing, prompt/control parsing, help output, unknown commands, no-arg non-TTY behavior, and exit behavior.
- [x] 4.2 Add integration tests proving scripted interactive prompts render kernel-backed runtime events.
- [x] 4.3 Add golden replay fixtures for interactive/headless parity and cancellation semantics.
- [x] 4.4 Add e2e tests for `deepseek interactive` scripted prompt, `/help`, `/cancel`, `/exit`, and EOF behavior without live provider access.
- [x] 4.5 Add or extend architecture lint coverage if implementation creates new possible bypass paths.

## 5. Verification And Acceptance / 校验与验收

- [x] 5.1 Run `openspec validate implement-minimal-interactive-cli --type change --strict`.
- [x] 5.2 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`.
- [x] 5.3 Run acceptance-level checks relevant to this node: `npm run test:integration`, `npm run test:golden`, `npm run test:e2e`, and `npm run build:cli`.
- [x] 5.4 Record acceptance evidence in the change before archive.
