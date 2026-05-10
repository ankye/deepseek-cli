## ADDED Requirements

### Requirement: Agent Loop Deterministic Tests / Agent Loop 确定性测试

The testing framework SHALL provide deterministic unit and integration fixtures for agent loop success, tool execution, repair, rejection, timeout, cancellation, and provider failure without network access.

testing framework 必须为 agent loop success、tool execution、repair、rejection、timeout、cancellation 和 provider failure 提供无需网络访问的 deterministic unit 与 integration fixtures。

#### Scenario: Offline tool loop test / 离线工具循环测试

- **WHEN** tests run the agent loop with a fake model that requests a file read tool and then returns assistant text
- **THEN** the event sequence, tool result evidence, terminal status, and rendered output match deterministic assertions
- **中文** 当测试使用 fake model 运行 agent loop，且 fake model 请求 file read tool 后返回 assistant text 时，event sequence、tool result evidence、terminal status 和 rendered output 必须匹配确定性断言。

#### Scenario: Unsafe tool request test / 不安全工具请求测试

- **WHEN** tests run the agent loop with a fake model that requests an outside-workspace path or disabled command
- **THEN** the loop rejects the request without mutation and emits typed validation evidence
- **中文** 当测试使用 fake model 运行 agent loop，且 fake model 请求 outside-workspace path 或 disabled command 时，loop 必须拒绝该请求、不产生修改，并发出 typed validation evidence。

### Requirement: Agent Loop Golden Replay / Agent Loop Golden Replay

The testing framework SHALL include golden replay fixtures for canonical agent loop event streams and rendered CLI output.

testing framework 必须为 canonical agent loop event streams 与 rendered CLI output 提供 golden replay fixtures。

#### Scenario: Golden trace catches event drift / Golden trace 捕获事件漂移

- **WHEN** runtime event order, event schema version, redaction metadata, trace correlation, or terminal status changes
- **THEN** golden tests fail unless fixtures are intentionally updated with reviewable evidence
- **中文** 当 runtime event order、event schema version、redaction metadata、trace correlation 或 terminal status 变化时，golden tests 必须失败，除非 fixtures 被有意更新并具备可审查证据。

### Requirement: Agent Loop CLI E2E / Agent Loop CLI E2E

The test suite SHALL include CLI e2e coverage for `deepseek run` and `deepseek chat` using deterministic runtime dependencies.

test suite 必须使用 deterministic runtime dependencies 覆盖 `deepseek run` 与 `deepseek chat` 的 CLI e2e。

#### Scenario: Run command e2e succeeds / Run 命令 e2e 成功

- **WHEN** e2e tests invoke `deepseek run --output json "hello"` with deterministic provider fixtures
- **THEN** the process exits successfully and stdout parses as the expected final JSON summary
- **中文** 当 e2e tests 使用 deterministic provider fixtures 调用 `deepseek run --output json "hello"` 时，进程必须成功退出，且 stdout 可解析为预期 final JSON summary。

#### Scenario: Chat command e2e exits / Chat 命令 e2e 退出

- **WHEN** e2e tests feed one prompt and an exit command into `deepseek chat --output jsonl`
- **THEN** the process emits valid JSONL events and exits without leaving child work running
- **中文** 当 e2e tests 向 `deepseek chat --output jsonl` 输入一个 prompt 和 exit command 时，进程必须发出有效 JSONL events 并退出，且不留下 child work。

### Requirement: Agent Loop Live Smoke Gate / Agent Loop Live Smoke Gate

The test suite SHALL provide opt-in live DeepSeek agent loop smoke tests gated by explicit environment variables and skipped by default.

test suite 必须提供 opt-in live DeepSeek agent loop smoke tests，通过显式环境变量启用，并默认跳过。

#### Scenario: Live smoke is skipped by default / Live smoke 默认跳过

- **WHEN** default tests run without live environment variables
- **THEN** live DeepSeek agent loop smoke tests are skipped with a clear reason and no network request is sent
- **中文** 当默认测试在没有 live 环境变量时运行时，live DeepSeek agent loop smoke tests 必须带明确原因跳过，且不得发送网络请求。

#### Scenario: Live smoke asserts structure / Live smoke 断言结构

- **WHEN** live smoke is explicitly enabled with credentials
- **THEN** tests assert event structure, redaction, terminal status, provider reachability, and optional usage metadata without snapshotting exact generated text
- **中文** 当 live smoke 通过凭证显式启用时，测试必须断言 event structure、redaction、terminal status、provider reachability 和可选 usage metadata，且不 snapshot 精确生成文本。
