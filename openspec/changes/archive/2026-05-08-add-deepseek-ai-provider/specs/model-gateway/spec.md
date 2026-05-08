## ADDED Requirements

### Requirement: DeepSeek AI Provider Adapter

The model gateway SHALL provide a DeepSeek AI provider adapter that targets the DeepSeek OpenAI-compatible chat-completions wire protocol while exposing only provider-neutral `ModelGateway` contracts to runtime, CLI, VSCode, tests, and future hosts.

model gateway 必须提供 DeepSeek AI provider adapter，面向 DeepSeek OpenAI-compatible chat-completions wire protocol，但只向 runtime、CLI、VSCode、tests 和未来 hosts 暴露 provider-neutral `ModelGateway` contracts。

#### Scenario: Provider builds DeepSeek request

- **WHEN** a `ModelRequest` is streamed through the DeepSeek provider with prompt, profile, tools, temperature, reasoning options, and metadata
- **THEN** the provider sends a DeepSeek-compatible request through the injected transport without exposing DeepSeek wire fields to runtime callers

#### Scenario: Default provider does not call network

- **WHEN** the DeepSeek provider is constructed without an injected live transport
- **THEN** default tests and local runtime paths receive a typed provider error rather than performing network access

### Requirement: Provider Event Normalization

The model gateway SHALL normalize DeepSeek text deltas, reasoning deltas, tool-call intents, usage tokens, cache hit/miss metadata, finish reasons, and provider errors into stable `ModelStreamEvent` values.

model gateway 必须把 DeepSeek text deltas、reasoning deltas、tool-call intents、usage tokens、cache hit/miss metadata、finish reasons 和 provider errors 归一化为稳定的 `ModelStreamEvent` values。

#### Scenario: Reasoning is normalized

- **WHEN** DeepSeek returns reasoning content or thinking output
- **THEN** the model gateway emits provider-neutral reasoning events with redaction metadata and does not mix reasoning text into assistant text deltas

#### Scenario: Cache usage is normalized

- **WHEN** DeepSeek usage includes cache hit or cache miss token counts
- **THEN** the model gateway emits usage metadata with normalized cache token fields and provider metadata

#### Scenario: Tool call is normalized as intent

- **WHEN** DeepSeek returns a tool call
- **THEN** the model gateway emits a tool-call intent event with id, name, and parsed JSON input without executing the tool

### Requirement: Provider Boundary Enforcement

Provider adapters SHALL NOT execute capabilities, commands, skills, hooks, MCP tools, plugins, sandbox work, scheduler work, workflow work, policy decisions, or runtime bus publishing directly.

provider adapters 不得直接执行 capabilities、commands、skills、hooks、MCP tools、plugins、sandbox work、scheduler work、workflow work、policy decisions 或 runtime bus publishing。

#### Scenario: Provider emits intent only

- **WHEN** a provider response asks for a tool call
- **THEN** the adapter emits normalized intent and leaves execution to the governed runtime pipeline

#### Scenario: Lint rejects provider bypass

- **WHEN** provider source code calls governed execution primitives directly
- **THEN** architecture lint fails with a stable rule id before the code can pass tests
