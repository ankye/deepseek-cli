# capability-execution-governance Specification

## Purpose
TBD - created by archiving change design-unified-capability-orchestration. Update Purpose after archive.
## Requirements
### Requirement: Capability Execution Levels

The platform SHALL classify every capability contribution as metadata-only, projectable, executable, or scheduled before it can affect runtime behavior.

平台必须在任何 capability contribution 影响 runtime behavior 前，将其分类为 metadata-only、projectable、executable 或 scheduled。

#### Scenario: Metadata remains inert

- **WHEN** a plugin manifest, skill manifest, agent definition, command manifest, hook manifest, MCP server manifest, model profile, workflow template, renderer contribution, or config fragment is discovered
- **THEN** the platform records it as metadata-only until an owning subsystem projects or executes it

#### Scenario: Side-effecting work is scheduled

- **WHEN** a capability can mutate state, call external resources, stream model output, execute hooks, call MCP, run sandboxed work, start a subagent, or run longer than one synchronous projection step
- **THEN** it MUST be treated as executable or scheduled work rather than metadata-only registration

### Requirement: Unified Execution Envelope

The platform SHALL normalize every executable or scheduled capability invocation into an execution envelope before execution starts.

平台必须在执行开始前，将每个 executable 或 scheduled capability invocation 规范化为 execution envelope。

#### Scenario: Envelope carries governance metadata

- **WHEN** a capability invocation is created
- **THEN** its envelope includes invocation id, capability or contribution id, version, kind, caller, parent invocation id, session id when available, workflow id when available, task id when available, agent id when available, input/output schema references, redaction class, provenance, trust, permissions, side-effect level, policy context, approval requirement, sandbox profile, resource locks, timeout, deadline, cancellation metadata, retry policy, idempotency metadata, trace context, telemetry metadata, and replay policy

#### Scenario: Envelope is stable across hosts

- **WHEN** CLI, VSCode, tests, CI, or future server mode invokes the same governed capability
- **THEN** host-specific UI state does not change the canonical envelope shape

### Requirement: Governed Execution Pipeline

The platform SHALL route executable and scheduled capability invocations through workflow orchestration, concurrency scheduling, policy, approval, sandbox, runtime message bus, observability, audit, and regression boundaries according to their constraints.

平台必须根据 capability constraints，将 executable 和 scheduled capability invocations 路由通过 workflow orchestration、concurrency scheduling、policy、approval、sandbox、runtime message bus、observability、audit 和 regression boundaries。

#### Scenario: Safe read-only execution

- **WHEN** a read-only synchronous capability has no external trust boundary, no side effect, no long-running work, and no special resource requirement
- **THEN** the platform can execute it with a minimal envelope and trace while still recording the result event

#### Scenario: Privileged execution

- **WHEN** a capability requires filesystem mutation, process execution, network access, memory write, cache mutation, workspace edit, plugin lifecycle action, MCP external call, or subagent delegation
- **THEN** the platform evaluates policy, approval, sandbox, resource locks, timeout, retry safety, audit, and replay metadata before execution

### Requirement: Direct Execution Boundary

No executable capability SHALL bypass the governed execution pipeline except inside approved execution owners, deterministic fakes, tests, or the package that owns the execution primitive.

任何 executable capability 都不得绕过 governed execution pipeline，除非位于 approved execution owners、deterministic fakes、tests 或拥有该 execution primitive 的 package 内。

#### Scenario: Application adapter cannot call primitive directly

- **WHEN** a CLI, VSCode, future server, or non-owner package needs a skill, hook, command, MCP call, model stream, sandbox job, plugin lifecycle action, or capability executor
- **THEN** it calls the governed runtime or execution pipeline instead of directly invoking the primitive subsystem

#### Scenario: Architecture lint rejects bypass

- **WHEN** source code outside approved execution owners, tests, deterministic fakes, or primitive-owning packages directly invokes a governed execution primitive
- **THEN** architecture lint fails with a stable rule id and file location

### Requirement: Canonical Execution Events

The platform SHALL expose canonical execution events that hosts can render without owning execution state machines.

平台必须暴露 canonical execution events，使 host 可以渲染状态但不拥有 execution state machines。

#### Scenario: Host renders canonical state

- **WHEN** a capability invocation progresses through requested, policy checked, approval required, scheduled, started, progress, completed, failed, cancelled, rolled back, or replay recorded states
- **THEN** CLI, VSCode, tests, CI, and future server mode consume the same canonical event stream and project it into host-specific rendering

### Requirement: Replayable Invocation Decisions

The platform SHALL persist enough redacted execution envelope, decision, event, result, and failure metadata for deterministic replay.

平台必须持久化足够的脱敏 execution envelope、decision、event、result 和 failure metadata，以支持 deterministic replay。

#### Scenario: Replay detects behavior drift

- **WHEN** a governed capability scenario is replayed
- **THEN** the regression harness can compare normalized envelopes, policy decisions, scheduled task events, bus records, outputs, errors, and audit summaries without live external services

