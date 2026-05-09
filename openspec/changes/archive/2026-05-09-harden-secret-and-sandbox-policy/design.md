## Overview / 概览

Secret and sandbox hardening should be implemented as a shared platform decision layer, not as scattered checks inside individual tools. Every side-effecting or model-visible operation should expose enough metadata for policy to allow, ask, deny, rewrite, or require sandbox before execution or context exposure.

secret 与 sandbox hardening 应实现为共享平台决策层，而不是散落在单个工具里的检查。每个有副作用或模型可见的操作都应暴露足够 metadata，让 policy 能在 execution 或 context exposure 前执行 allow、ask、deny、rewrite 或 require sandbox。

## Decision Pipeline / 决策管线

```text
Capability / context / command intent
        |
        v
Execution envelope + context scope + platform descriptor
        |
        v
Secret classifier + resource scope analyzer
        |
        v
Policy decision: allow | ask | deny | rewrite | require-sandbox
        |
        v
Sandbox profile selection + audit record
        |
        v
Scheduler execution OR typed rejection/rewrite evidence
```

## Secret Boundary / Secret 边界

- Secret detection should classify API keys, bearer tokens, private key blocks, env-style credentials, credential refs, and explicit secret redaction classes.
- Raw secret content must not appear in model context, protocol events, runtime events, session events, cache entries, golden traces, snapshots, assertion messages, or CLI/VSCode output.
- Secret-like content should produce structured redacted evidence and audit metadata with stable reason codes.
- Credential references are allowed as references only; raw credential values remain owned by credential managers.

- Secret detection 应识别 API keys、bearer tokens、private key blocks、env-style credentials、credential refs 和显式 secret redaction classes。
- raw secret content 不得出现在 model context、protocol events、runtime events、session events、cache entries、golden traces、snapshots、assertion messages 或 CLI/VSCode output。
- secret-like content 应产生 structured redacted evidence 与带稳定 reason codes 的 audit metadata。
- credential references 只允许以 reference 形式存在；raw credential values 仍由 credential managers 拥有。

## Sandbox Boundary / Sandbox 边界

- Filesystem operations declare read/write path scopes, traversal policy, workspace root, and rollback evidence.
- Process/shell operations declare shell profile, cwd, environment scope, timeout, network expectations, and output redaction.
- Network and native operations declare explicit capability, host scope, and platform availability.
- Degraded platforms such as remote/no-shell, missing secure storage, read-only filesystem, or WSL path translation must produce deterministic allow/deny/rewrite behavior.

- filesystem operations 声明 read/write path scopes、traversal policy、workspace root 和 rollback evidence。
- process/shell operations 声明 shell profile、cwd、environment scope、timeout、network expectations 和 output redaction。
- network 与 native operations 声明显式 capability、host scope 和 platform availability。
- remote/no-shell、missing secure storage、read-only filesystem 或 WSL path translation 等 degraded platforms 必须产生确定性的 allow/deny/rewrite 行为。

## Lint And Ownership / Lint 与所有权

Architecture lint should reject direct secret scanning, env credential reads, process execution, filesystem mutations, or sandbox bypasses outside approved owner packages and tests. Owner packages may expose public helpers through contracts, but hosts and providers should consume runtime/policy/protocol events instead of raw primitives.

architecture lint 应拒绝 approved owner packages 与 tests 之外的 direct secret scanning、env credential reads、process execution、filesystem mutations 或 sandbox bypasses。owner packages 可以通过 contracts 暴露公共 helper，但 hosts 与 providers 应消费 runtime/policy/protocol events，而不是 raw primitives。

## Testing Strategy / 测试策略

- Unit tests for secret classifier, redaction, path scope analyzer, shell/env/network scope analyzer, and sandbox profile selection.
- Contract tests for policy decision DTOs, execution envelope metadata, platform capability descriptors, and audit records.
- Integration tests for read/write/search/shell tool decisions through kernel, policy, scheduler, sandbox, bus, and session events.
- Golden replay for deny, rewrite, require-sandbox, and allow decisions with redacted audit evidence.
- Matrix tests for fake Windows/macOS/Linux/WSL/remote/no-shell/read-only/missing-secure-storage states.
- E2E smoke proving raw secret fixtures never appear in stdout, stream-json, traces, snapshots, cache entries, or assertion messages.

- secret classifier、redaction、path scope analyzer、shell/env/network scope analyzer 和 sandbox profile selection 的单元测试。
- policy decision DTOs、execution envelope metadata、platform capability descriptors 和 audit records 的合同测试。
- read/write/search/shell tool decisions 通过 kernel、policy、scheduler、sandbox、bus 和 session events 的集成测试。
- deny、rewrite、require-sandbox 和 allow decisions 的 golden replay，且 audit evidence 已脱敏。
- fake Windows/macOS/Linux/WSL/remote/no-shell/read-only/missing-secure-storage states 的 matrix tests。
- e2e smoke 证明 raw secret fixtures 不出现在 stdout、stream-json、traces、snapshots、cache entries 或 assertion messages。

## Risks / 风险

- Under-classifying secrets leaks credentials; classifier fixtures must be conservative and fail closed.
- Over-classifying normal code blocks can block useful coding flows; rewrites and structured explanations should preserve safe evidence.
- Sandbox metadata can drift from platform reality; fake platform matrix should define the contract first, with real adapters matching it later.
- Tool-specific checks can diverge; policy should own final decisions, and tools should expose metadata rather than duplicate policy.

- secret 分类不足会泄漏凭证；classifier fixtures 必须保守并 fail closed。
- normal code blocks 过度分类可能阻塞有用 coding flows；rewrite 与 structured explanation 应保留安全证据。
- sandbox metadata 可能与平台真实能力漂移；fake platform matrix 应先定义契约，real adapters 后续对齐。
- tool-specific checks 可能分叉；policy 应拥有最终决策，tools 应暴露 metadata 而不是复制 policy。
