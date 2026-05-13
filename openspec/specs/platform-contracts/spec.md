# platform-contracts Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Canonical Platform Contract Package

The system SHALL provide a canonical `platform-contracts` package that owns stable TypeScript interfaces, serializable DTOs, branded ids, versioned envelopes, error shapes, runtime events, host contracts, and dependency injection contracts.

系统必须提供 canonical `platform-contracts` package，统一承载稳定 TypeScript interfaces、serializable DTOs、branded ids、versioned envelopes、error shapes、runtime events、host contracts 和 dependency injection contracts。

#### Scenario: Contracts are centralized

- **WHEN** a package needs a cross-package interface
- **THEN** it imports the interface from `platform-contracts`
- **AND** it does not import another package's implementation internals

#### Scenario: Contracts are implementation-free

- **WHEN** `platform-contracts` is compiled
- **THEN** it has no dependency on CLI, VSCode APIs, terminal UI libraries, model SDKs, filesystem adapters, process adapters, or concrete tool executors

### Requirement: Platform Interface Groups

The `platform-contracts` package SHALL define interface groups for protocol, runtime message bus, runtime, host, workflow, concurrency, agent, model, capability, command, skill, hook, MCP, plugin, extension, context, memory, cache, credential, usage, workspace state, policy, approval, sandbox, session, platform runtime, evolution, code intelligence, remote runtime connectivity, distribution/update, config, observability, and testing.

`platform-contracts` package 必须定义 protocol、runtime message bus、runtime、host、workflow、concurrency、agent、model、capability、command、skill、hook、MCP、plugin、extension、context、memory、cache、credential、usage、workspace state、policy、approval、sandbox、session、platform runtime、evolution、code intelligence、remote runtime connectivity、distribution/update、config、observability 和 testing 的接口分组。

#### Scenario: Runtime dependency graph is explicit

- **WHEN** `AgentRuntime` is constructed
- **THEN** its dependencies are described by a typed dependency injection contract such as `RuntimeDependencies`
- **AND** tests can replace each dependency with a fake implementation

#### Scenario: Host adapters use shared contracts

- **WHEN** CLI or VSCode integrates with runtime
- **THEN** it implements or consumes host contracts from `platform-contracts`
- **AND** it does not require runtime packages to import CLI or VSCode APIs

### Requirement: Versioned Serializable Contracts

Runtime events, runtime bus events, session events, workspace events, edit transactions, audit records, plugin manifests, extension manifests, skill manifests, hook manifests, command manifests, MCP connector manifests, agent definitions, capability manifests, credential references, usage records, policy decisions, distribution records, and migration records SHALL be serializable and versioned.

runtime events、runtime bus events、session events、workspace events、edit transactions、audit records、plugin manifests、extension manifests、skill manifests、hook manifests、command manifests、MCP connector manifests、agent definitions、capability manifests、credential references、usage records、policy decisions、distribution records 和 migration records 必须可序列化并带版本。

#### Scenario: Event envelope includes schema version

- **WHEN** a cross-package event is emitted or persisted
- **THEN** it includes a stable kind, schema version, id, timestamp, payload, and optional trace context

#### Scenario: DTO does not contain implementation object

- **WHEN** a contract type crosses a package boundary
- **THEN** it contains serializable data or explicit interface references
- **AND** it does not contain concrete classes from implementation packages

### Requirement: Dependency Direction

Application adapters and implementation packages SHALL depend on `platform-contracts`; `platform-contracts` SHALL NOT depend on application adapters or implementation packages.

application adapters 和 implementation packages 必须依赖 `platform-contracts`；`platform-contracts` 不能依赖 application adapters 或 implementation packages。

#### Scenario: Implementation package exports factory

- **WHEN** an implementation package provides a runtime, model adapter, platform adapter, session store, or capability executor
- **THEN** it exports a factory or class implementing interfaces from `platform-contracts`

#### Scenario: Contract package remains portable

- **WHEN** `platform-contracts` is imported by a browser-like test, CLI, VSCode extension, or server package
- **THEN** it can be loaded without requiring Node-only globals or host-specific modules

### Requirement: Contract Compatibility and Evolution

The platform contract layer SHALL support additive evolution through schema versions, compatibility metadata, deprecation metadata, and migration hooks.

平台 contract layer 必须通过 schema versions、compatibility metadata、deprecation metadata 和 migration hooks 支持增量演进。

#### Scenario: Additive contract change is versioned

- **WHEN** a contract event, manifest, or persisted DTO adds fields
- **THEN** the schema version or compatibility metadata identifies the expected shape

#### Scenario: Breaking contract change requires migration plan

- **WHEN** a contract change breaks existing persisted sessions, protocol traces, bus traces, plugin manifests, extension manifests, skill manifests, hook manifests, command manifests, MCP connector manifests, or capability manifests
- **THEN** the evolution engine defines a migration or compatibility rejection path

### Requirement: Type-Level Verification

The first framework implementation SHALL include type-level checks or contract tests that verify contract exports, dependency direction, serializability conventions, and fake implementation substitutability.

第一版框架实现必须包含 type-level checks 或 contract tests，用于验证 contract exports、dependency direction、serializability conventions 和 fake implementation substitutability。

#### Scenario: Fake dependencies satisfy runtime contracts

- **WHEN** runtime tests construct fake dependencies for protocol, runtime message bus, workflow, concurrency, model, agent, capability, command, skill, hook, MCP, plugin, extension, context, memory, cache, credential, usage, workspace state, policy, sandbox, session, platform, code intelligence, remote connectivity, distribution/update, evolution, config, observability, and testing
- **THEN** those fakes satisfy the `platform-contracts` interfaces without importing production implementations

### Requirement: Plugin Lockfile Contract / 插件 Lockfile 契约

`@deepseek/platform-contracts` SHALL declare the plugin lockfile shapes and `PluginManager` lockfile methods as readonly value types with structural, pluginId-sorted determinism. The contracts SHALL include `PluginLockfileEntry`, `PluginLockfile`, `IntegrityVerdict`, and `IntegrityMismatchError`, and `PluginManager` SHALL expose `install`, `verify`, `snapshot`, and `applyLockfile` with exactly the signatures below. Every array returned from a lockfile-shaped method SHALL be `readonly`; every entry SHALL be structurally immutable at the TypeScript type level.

`@deepseek/platform-contracts` 必须把 plugin lockfile 的字段形状和 `PluginManager` 的 lockfile 方法声明为只读的值类型，并且按 `pluginId` 排序保持结构性确定性。契约必须包含 `PluginLockfileEntry`、`PluginLockfile`、`IntegrityVerdict`、`IntegrityMismatchError` 四项；`PluginManager` 必须精确导出 `install` / `verify` / `snapshot` / `applyLockfile` 四个方法（签名如下）。任何 lockfile 相关方法返回的数组必须是 `readonly`，每个 entry 在 TypeScript 类型层面必须结构不可变。

#### Scenario: Contracts package exports lockfile types / contracts 包导出 lockfile 类型

- **WHEN** `@deepseek/platform-contracts` is imported by any downstream package
- **THEN** the module exports `PluginLockfileEntry`, `PluginLockfile`, `IntegrityVerdict`, and `IntegrityMismatchError` as named type/class exports, and each entry field (`pluginId`, `version`, `source`, `integrity`, `permissions`, `installedAt`) is declared `readonly` with `permissions` typed as `readonly string[]`
- **中文** 当任意下游包 import `@deepseek/platform-contracts` 时，模块必须以具名导出方式暴露 `PluginLockfileEntry`、`PluginLockfile`、`IntegrityVerdict`、`IntegrityMismatchError`；entry 的每个字段（`pluginId` / `version` / `source` / `integrity` / `permissions` / `installedAt`）必须为 `readonly`，其中 `permissions` 类型为 `readonly string[]`。

#### Scenario: PluginManager exposes install/verify/snapshot/applyLockfile / PluginManager 暴露四方法

- **WHEN** a type-level consumer inspects the `PluginManager` interface
- **THEN** the interface declares:
  - `install(manifest: PluginManifest): Promise<{ diff: PermissionDiff; lockEntry: PluginLockfileEntry }>`
  - `verify(manifest: PluginManifest): Promise<IntegrityVerdict>`
  - `snapshot(): Promise<PluginLockfile>`
  - `applyLockfile(lockfile: PluginLockfile): Promise<ReadonlyArray<{ diff: PermissionDiff; lockEntry: PluginLockfileEntry }>>`
  - `uninstall(id: PluginId): Promise<void>`
  - `list(): Promise<readonly PluginManifest[]>`
- **中文** 当类型层消费者检查 `PluginManager` 接口时，接口必须精确声明上述六个方法签名（`install` 返回 `{ diff, lockEntry }`；`verify` / `snapshot` / `applyLockfile` 为新增方法；`uninstall` / `list` 保留旧签名）。

#### Scenario: IntegrityVerdict models missing vs mismatch / IntegrityVerdict 区分 missing 与 mismatch

- **WHEN** `IntegrityVerdict` is used to communicate a verification result
- **THEN** the type is a discriminated union `{ ok: true } | { ok: false; reason: "missing" | "mismatch"; expected: string; actual: string }`, with `reason: "missing"` reserved for "no lock entry yet" and `reason: "mismatch"` reserved for "lock entry exists but integrity differs"
- **中文** 当 `IntegrityVerdict` 用于传达校验结果时，类型必须为辨识联合 `{ ok: true } | { ok: false; reason: "missing" | "mismatch"; expected: string; actual: string }`，其中 `reason: "missing"` 专用于「尚无 lock entry」，`reason: "mismatch"` 专用于「lock entry 存在但 integrity 不一致」。

#### Scenario: IntegrityMismatchError carries expected and actual / IntegrityMismatchError 携带 expected 与 actual

- **WHEN** `install` or `applyLockfile` rejects due to integrity mismatch
- **THEN** the thrown value is an `IntegrityMismatchError` whose `name === "IntegrityMismatchError"` and which exposes readonly string fields `expected` and `actual` copied from the conflicting lock entry and manifest
- **中文** 当 `install` 或 `applyLockfile` 因 integrity 不一致而 reject 时，抛出的值必须是 `IntegrityMismatchError`，其 `name === "IntegrityMismatchError"`，并对外暴露只读字符串字段 `expected` 与 `actual`（取自冲突的 lock entry 与 manifest）。

### Requirement: Approval Contract DTOs / 审批契约 DTOs

`@deepseek/platform-contracts` SHALL define implementation-free approval DTOs for approval requests, decisions, summaries, risk summaries, broker inputs, broker results, and audit references.

`@deepseek/platform-contracts` 必须定义无实现的 approval DTOs，覆盖 approval requests、decisions、summaries、risk summaries、broker inputs、broker results 和 audit references。

#### Scenario: Approval DTOs are serializable / 审批 DTO 可序列化

- **WHEN** an approval DTO crosses package, protocol, runtime, CLI, test, or future host boundaries
- **THEN** it includes schema version, stable ids, decision kind, redaction metadata, trace metadata, readonly serializable value fields, and no concrete implementation objects
- **中文** 当 approval DTO 跨越 package、protocol、runtime、CLI、test 或未来 host 边界时，它必须包含 schema version、stable ids、decision kind、redaction metadata、trace metadata、readonly serializable value fields，且不包含 concrete implementation objects。

#### Scenario: Approval contracts stay host agnostic / 审批契约保持 Host Agnostic

- **WHEN** `platform-contracts` is imported in a browser-like, CLI, VSCode, test, or server environment
- **THEN** approval contracts load without Node filesystem/process APIs, terminal libraries, VSCode APIs, model SDKs, or implementation packages
- **中文** 当 `platform-contracts` 在 browser-like、CLI、VSCode、test 或 server environment 中被导入时，approval contracts 必须能加载，且不依赖 Node filesystem/process APIs、terminal libraries、VSCode APIs、model SDKs 或 implementation packages。

### Requirement: Approval Broker Contract / 审批 Broker 契约

`@deepseek/platform-contracts` SHALL expose an approval broker interface for requesting decisions and returning deterministic allow, deny, timeout, or cancel results.

`@deepseek/platform-contracts` 必须暴露 approval broker interface，用于请求 decision 并返回确定性的 allow、deny、timeout 或 cancel results。

#### Scenario: Broker result is typed / Broker 结果类型化

- **WHEN** an approval broker resolves a request
- **THEN** the result includes approval id, decision, decision source, reason code, optional user message, audit reference, trace metadata, and redaction metadata
- **中文** 当 approval broker 解析 request 时，result 必须包含 approval id、decision、decision source、reason code、optional user message、audit reference、trace metadata 和 redaction metadata。

### Requirement: Agent Loop Reference Context Contract / Agent Loop 引用上下文契约

Platform contracts SHALL define a host-agnostic agent loop reference context DTO for carrying selected CLI reference sets as structured metadata.

Platform contracts 必须定义 host-agnostic agent loop reference context DTO，用于以结构化 metadata 携带选中的 CLI reference sets。

#### Scenario: Reference context is serializable / 引用上下文可序列化

- **WHEN** a host submits an agent loop request with selected references
- **THEN** the request carries serializable reference set ids, item ids, target ids/kinds, labels, provenance, ordering, active item ids, counts, and redaction metadata
- **中文** 当 host 使用 selected references 提交 agent loop request 时，该 request 必须携带可序列化的 reference set ids、item ids、target ids/kinds、labels、provenance、ordering、active item ids、counts 和 redaction metadata。

#### Scenario: Reference context omits raw content / 引用上下文不包含原始内容

- **WHEN** reference context describes file, directory, symbol, diagnostic, diff, message, turn, or tool-evidence targets
- **THEN** it MUST NOT include raw file contents, raw diff hunks, raw message bodies, credentials, or unredacted secret values
- **中文** 当 reference context 描述 file、directory、symbol、diagnostic、diff、message、turn 或 tool-evidence targets 时，它不得包含 raw file contents、raw diff hunks、raw message bodies、credentials 或未脱敏 secret values。
