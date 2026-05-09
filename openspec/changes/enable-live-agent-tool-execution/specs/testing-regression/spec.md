## MODIFIED Requirements

### Requirement: Contract Tests

The testing regression framework SHALL include contract tests for platform contracts, runtime events, execution envelopes, model gateway streams, tool feedback DTOs, command manifests, and public schema versioning.

testing regression framework 必须包含 platform contracts、runtime events、execution envelopes、model gateway streams、tool feedback DTOs、command manifests 和 public schema versioning 的 contract tests。

#### Scenario: Contract test validates DTO shape

- **WHEN** a public contract is added or changed
- **THEN** a contract test verifies required ids, schema version, redaction metadata, and typed error behavior

#### Scenario: Live tool feedback contract is covered / Live 工具反馈契约被覆盖

- **WHEN** live tool feedback DTOs or event payloads are introduced or changed
- **THEN** contract tests verify schema versioning, bounded previews, redaction metadata, normalized status, trace ids, and provider-neutral shape
- **中文** 当 live tool feedback DTOs 或 event payloads 被引入或修改时，contract tests 必须验证 schema versioning、bounded previews、redaction metadata、normalized status、trace ids 和 provider-neutral shape。

### Requirement: Golden Trace Replay

The testing regression framework SHALL support golden trace replay for deterministic runtime, model gateway, tool loop, scheduler, policy, sandbox, and host rendering behavior.

testing regression framework 必须支持 deterministic runtime、model gateway、tool loop、scheduler、policy、sandbox 和 host rendering behavior 的 golden trace replay。

#### Scenario: Replay validates event order

- **WHEN** a deterministic scenario is replayed
- **THEN** the replay asserts stable event ordering, stable ids when injected, normalized timestamps, and redacted payloads

#### Scenario: Replay validates live tool continuation order / Replay 校验 live 工具继续顺序

- **WHEN** a deterministic live-tool fixture is replayed
- **THEN** the golden trace asserts model request, tool intent, optional repair, governed execution, tool feedback, continuation request, final output, and terminal event ordering
- **中文** 当 deterministic live-tool fixture 被 replay 时，golden trace 必须断言 model request、tool intent、可选 repair、governed execution、tool feedback、continuation request、final output 和 terminal event ordering。

### Requirement: Platform Matrix Coverage

The testing regression framework SHALL include platform matrix coverage for path, filesystem, process, shell, search, native capability, sandbox, and tool preflight behavior across Windows, macOS, Linux, WSL, CI, and remote-like fake runtimes.

testing regression framework 必须包含 Windows、macOS、Linux、WSL、CI 和 remote-like fake runtimes 上 path、filesystem、process、shell、search、native capability、sandbox 和 tool preflight behavior 的 platform matrix coverage。

#### Scenario: Matrix covers path semantics

- **WHEN** path-sensitive behavior is introduced
- **THEN** matrix tests cover separators, drive letters, case sensitivity, symlink awareness, home expansion, traversal rejection, and fallback providers

#### Scenario: Matrix covers live tool path repair / Matrix 覆盖 live 工具路径修复

- **WHEN** provider-specific live tool repair touches path-like inputs
- **THEN** matrix tests cover Windows separators, POSIX separators, drive-relative rejection, absolute path rejection, traversal rejection, and workspace-relative repair
- **中文** 当 provider-specific live tool repair 处理 path-like inputs 时，matrix tests 必须覆盖 Windows separators、POSIX separators、drive-relative rejection、absolute path rejection、traversal rejection 和 workspace-relative repair。

### Requirement: Live Provider Tests Are Gated

The testing regression framework SHALL keep live provider tests skipped by default and runnable only through explicit environment flags, credential availability, and bounded structural assertions.

testing regression framework 必须让 live provider tests 默认跳过，仅能通过显式环境变量、credential availability 和有界 structural assertions 运行。

#### Scenario: Live test skipped by default

- **WHEN** default test suites run without live flags
- **THEN** live DeepSeek provider, auth, agent-loop, and tool-loop tests are skipped without making network requests

#### Scenario: Live tool test asserts structure / Live 工具测试断言结构

- **WHEN** `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1` is set with credentials
- **THEN** the live test asserts provider reachability, tool-call intent structure, runtime event order, redaction, terminal status, and bounded feedback without snapshotting exact model prose
- **中文** 当设置 `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1` 且 credentials 可用时，live test 必须断言 provider reachability、tool-call intent structure、runtime event order、redaction、terminal status 和 bounded feedback，且不得 snapshot 精确模型文本。

## ADDED Requirements

### Requirement: Unsafe Live Tool Regression Cases / 不安全 Live 工具回归用例

The regression suite SHALL include deterministic cases for unsafe live tool calls, including unknown tools, hidden tools, schema-invalid inputs, traversal paths, unsupported platform commands, policy denial, timeout, cancellation, and repeated unsafe retries.

回归套件必须包含不安全 live tool calls 的 deterministic cases，包括 unknown tools、hidden tools、schema-invalid inputs、traversal paths、unsupported platform commands、policy denial、timeout、cancellation 和 repeated unsafe retries。

#### Scenario: Unsafe call never reaches executor / 不安全调用不进入执行器

- **WHEN** a deterministic model fixture emits an unsafe live tool request
- **THEN** tests assert no executor invocation occurred and the emitted events include typed rejection evidence
- **中文** 当 deterministic model fixture 发出 unsafe live tool request 时，测试必须断言 executor 没有被调用，且 emitted events 包含 typed rejection evidence。

#### Scenario: Repeated unsafe calls stop loop / 重复不安全调用停止循环

- **WHEN** a model repeatedly emits unsafe tool calls after corrective feedback
- **THEN** tests assert runtime stops according to loop policy and emits a terminal failure
- **中文** 当模型在 corrective feedback 后重复发出 unsafe tool calls 时，测试必须断言 runtime 按 loop policy 停止，并发出 terminal failure。
