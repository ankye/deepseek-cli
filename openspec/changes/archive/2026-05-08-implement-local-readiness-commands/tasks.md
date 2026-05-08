## 1. Contracts And Design / 契约与设计

- [x] 1.1 Create bilingual proposal, design, and specs for R1 local readiness commands. / 创建 R1 local readiness commands 的双语 proposal、design 和 specs。
- [x] 1.2 Define readiness command result contracts with status, checks, warnings, metadata, and suggested actions. / 定义 readiness command result contracts，包含 status、checks、warnings、metadata 和 suggested actions。
- [x] 1.3 Define local credential reference result shape without raw secret fields. / 定义不含 raw secret fields 的 local credential reference result shape。

## 2. Command Implementation / 命令实现

- [x] 2.1 Implement command-system registration and execution for `init`, `config`, `auth`, `doctor`, `privacy`, and `verify-install`. / 实现 `init`、`config`、`auth`、`doctor`、`privacy` 和 `verify-install` 的 command-system registration 与 execution。
- [x] 2.2 Implement CLI parsing and text/JSON rendering for readiness commands. / 实现 readiness commands 的 CLI parsing 与 text/JSON rendering。
- [x] 2.3 Implement deterministic platform/config/credential readiness checks without live provider calls. / 实现 deterministic platform/config/credential readiness checks，且不调用 live provider。

## 3. Verification / 校验

- [x] 3.1 Add unit and contract tests for readiness command manifests and result shapes. / 增加 readiness command manifests 和 result shapes 的 unit/contract tests。
- [x] 3.2 Add CLI smoke tests for all readiness commands in text and JSON modes. / 增加所有 readiness commands 的 text 与 JSON CLI smoke tests。
- [x] 3.3 Add redaction tests proving fake credentials never appear in stdout, JSON, traces, or assertion output. / 增加 redaction tests，证明 fake credentials 不出现在 stdout、JSON、traces 或 assertion output。
- [x] 3.4 Run `openspec validate implement-local-readiness-commands --type change --strict`. / 运行 `openspec validate implement-local-readiness-commands --type change --strict`。
- [x] 3.5 Run `openspec validate --specs --strict`, `npm run lint`, `npm run typecheck`, and `npm test`. / 运行 `openspec validate --specs --strict`、`npm run lint`、`npm run typecheck` 和 `npm test`。
