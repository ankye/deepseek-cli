## 1. Contracts And CLI Surface / 契约与 CLI 表面

- [x] 1.1 Add implementation-free extension management record DTOs if existing contracts are insufficient. / 若现有契约不足，增加无实现的 extension management record DTOs。
- [x] 1.2 Extend CLI argument parsing, help, and dispatch for `deepseek extension ...` text/json/jsonl commands. / 扩展 CLI 参数解析、help 和分发，支持 `deepseek extension ...` text/json/jsonl commands。
- [x] 1.3 Keep extension command adapters out of app entrypoints and direct runtime/model/tool execution. / 保持 extension command adapters 不进入 app entrypoints，也不直接执行 runtime/model/tool。

## 2. Extension Management Implementation / 扩展管理实现

- [x] 2.1 Implement extension list records that combine plugin, skill, MCP, credential, and contribution summaries as inert metadata. / 实现 extension list records，把 plugin、skill、MCP、credential 和 contribution summaries 组合为惰性元数据。
- [x] 2.2 Implement plugin install, verify, snapshot, and apply-lockfile commands with permission diff and lock metadata. / 实现 plugin install、verify、snapshot 和 apply-lockfile commands，包含 permission diff 与 lock metadata。
- [x] 2.3 Implement skill list and activate commands with compact summaries and no full context segment output. / 实现 skill list 与 activate commands，使用紧凑 summaries，且不输出完整 context segment。
- [x] 2.4 Implement credential scope diagnostics for provider/plugin/MCP scopes without resolving raw secrets. / 实现 provider/plugin/MCP scopes 的 credential scope diagnostics，且不解析 raw secrets。
- [x] 2.5 Project MCP test results through extension management while preserving the existing `mcp test` behavior. / 通过 extension management 投影 MCP test results，同时保留现有 `mcp test` 行为。

## 3. Redaction, Pits, And Docs / 脱敏、坑位与文档

- [x] 3.1 Add pit evidence for permission expansion, MCP/plugin precedence, env snapshot, diagnostic redaction, and legacy contribution normalization. / 增加 permission expansion、MCP/plugin precedence、env snapshot、diagnostic redaction 和 legacy contribution normalization 的坑位证据。
- [x] 3.2 Add serialization checks proving extension outputs omit raw env/auth/credential/plugin/MCP/trace/path secret fixtures. / 增加序列化检查，证明 extension outputs 不包含 raw env/auth/credential/plugin/MCP/trace/path secret fixtures。
- [x] 3.3 Update CLI README and product roadmap status for CLI extension management. / 更新 CLI README 与产品路线状态，补充 CLI extension management。

## 4. Regression And Verification / 回归与校验

- [x] 4.1 Add CLI tests for extension list, plugin install/verify/snapshot/apply-lockfile, skill list/activate, auth scopes, and MCP projection in text/json/jsonl modes. / 增加 CLI tests，覆盖 extension list、plugin install/verify/snapshot/apply-lockfile、skill list/activate、auth scopes 和 MCP projection 的 text/json/jsonl modes。
- [x] 4.2 Add contract or integration tests for extension management DTOs, credential scope diagnostics, permission diff pit evidence, and no raw secret serialization. / 增加 contract 或 integration tests，覆盖 extension management DTOs、credential scope diagnostics、permission diff pit evidence 和无 raw secret serialization。
- [x] 4.3 Run `openspec validate implement-cli-extension-auth-and-management --type change --strict`. / 运行 `openspec validate implement-cli-extension-auth-and-management --type change --strict`。
- [x] 4.4 Run `npm run typecheck`, `npm run lint`, targeted extension/plugin/credential/MCP/CLI tests, and boundary checks. / 运行 `npm run typecheck`、`npm run lint`、定向 extension/plugin/credential/MCP/CLI tests 和 boundary checks。
- [x] 4.5 Review `git status --short --ignored` and confirm forbidden local/reference/generated/secret paths are not added. / 检查 `git status --short --ignored`，确认未加入禁入 local/reference/generated/secret paths。
