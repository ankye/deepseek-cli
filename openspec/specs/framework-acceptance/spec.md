# framework-acceptance Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Acceptance Gate Model

The first framework SHALL define acceptance gates with pass/fail criteria, required evidence artifacts, owner packages, and commands or checks that can be run locally and in CI.

第一版框架必须定义 acceptance gates，包含 pass/fail criteria、required evidence artifacts、owner packages，以及可在本地和 CI 运行的 commands or checks。

#### Scenario: Gate has required evidence

- **WHEN** an acceptance gate is marked complete
- **THEN** the repository contains the required evidence artifact, test output, trace, fixture, or documented verification result for that gate

#### Scenario: Gate failure blocks acceptance

- **WHEN** a required acceptance gate fails
- **THEN** the framework change cannot be considered accepted until the failure is fixed or the gate is explicitly descoped through OpenSpec

### Requirement: OpenSpec and Documentation Acceptance

The framework SHALL pass OpenSpec strict validation and SHALL keep proposal, design, specs, tasks, and architecture analysis aligned with bilingual planning and no external vendor implementation leakage in OpenSpec artifacts.

框架必须通过 OpenSpec strict validation，并且 proposal、design、specs、tasks 和 architecture analysis 必须保持中英文规划一致，OpenSpec artifacts 中不能泄漏外部厂商实现专有内容。

#### Scenario: OpenSpec strict validation passes

- **WHEN** `openspec validate bootstrap-future-ready-cli-framework --strict` runs
- **THEN** the change validates successfully

#### Scenario: OpenSpec avoids reference implementation names

- **WHEN** OpenSpec artifacts are scanned for reference implementation names
- **THEN** no prohibited reference names are present in the change artifacts

### Requirement: Workspace and Package Boundary Acceptance

The framework SHALL create the required monorepo structure with separate CLI and VSCode apps, shared platform packages, package exports, and dependency boundaries that prevent app-to-app imports and implementation leaks into contracts.

框架必须创建所需 monorepo structure，包含独立 CLI 与 VSCode apps、共享 platform packages、package exports，并通过 dependency boundaries 防止 app-to-app imports 和 implementation leaks into contracts。

#### Scenario: Required directories exist

- **WHEN** the workspace skeleton is inspected
- **THEN** `src/apps/cli`, `src/apps/vscode-extension`, `src/packages/platform-contracts`, and all required platform package directories exist

#### Scenario: Contract package has no implementation dependency

- **WHEN** dependency boundary checks run
- **THEN** `platform-contracts` has no dependency on apps, host APIs, concrete runtime implementations, model SDKs, filesystem/process adapters, or tool executors

### Requirement: Contract and Type Acceptance

The framework SHALL provide serializable, versioned, host-agnostic contracts and SHALL pass typecheck plus contract tests for dependency direction, fake substitutability, event envelopes, manifests, ids, error shapes, and compatibility metadata.

框架必须提供 serializable、versioned、host-agnostic contracts，并通过 typecheck 与 contract tests，覆盖 dependency direction、fake substitutability、event envelopes、manifests、ids、error shapes 和 compatibility metadata。

#### Scenario: Workspace typecheck passes

- **WHEN** workspace typecheck runs
- **THEN** all apps and packages compile without type errors

#### Scenario: Fake dependencies satisfy contracts

- **WHEN** contract tests construct fake runtime dependencies
- **THEN** the fakes satisfy the public contracts without importing production implementations

### Requirement: Headless Runtime Smoke Acceptance

The framework SHALL provide a minimal deterministic `deepseek -p` headless smoke path that runs through protocol, runtime, workflow, concurrency, model gateway, context, session, observability, and regression hooks using fake dependencies.

框架必须提供最小 deterministic `deepseek -p` headless smoke path，并使用 fake dependencies 跑通 protocol、runtime、workflow、concurrency、model gateway、context、session、observability 和 regression hooks。

#### Scenario: Headless smoke emits structured events

- **WHEN** the smoke command runs with deterministic fakes
- **THEN** it emits structured protocol/runtime events containing session id, trace id, agent metadata, workflow metadata, task scope metadata, usage metadata, and terminal completion status

#### Scenario: Headless smoke does not require live provider

- **WHEN** default smoke tests run
- **THEN** they do not require live model credentials, external network access, real filesystem mutation, real plugin marketplaces, real MCP servers, or host UI

### Requirement: Protocol and Runtime Bus Acceptance

The framework SHALL pass golden tests for host-runtime protocol envelopes and runtime message bus events, including versioning, routing, correlation, causation, ordering, backpressure, cancellation, redaction, errors, and replay metadata.

框架必须通过 host-runtime protocol envelopes 和 runtime message bus events 的 golden tests，覆盖 versioning、routing、correlation、causation、ordering、backpressure、cancellation、redaction、errors 和 replay metadata。

#### Scenario: Protocol golden trace replays

- **WHEN** a protocol golden trace is replayed
- **THEN** normalized protocol events match expected output except declared nondeterministic fields

#### Scenario: Bus golden trace replays

- **WHEN** a runtime message bus golden trace is replayed
- **THEN** normalized bus events match expected output and preserve topic ownership, ordering, redaction, and correlation semantics

### Requirement: Scheduler, Workflow, and Concurrency Acceptance

The framework SHALL pass deterministic tests for workflow graph validation, step events, task scheduling, parent-child scopes, cancellation propagation, deadlines, locks, queues, backpressure, rate limits, retry budgets, and task telemetry.

框架必须通过 workflow graph validation、step events、task scheduling、parent-child scopes、cancellation propagation、deadlines、locks、queues、backpressure、rate limits、retry budgets 和 task telemetry 的 deterministic tests。

#### Scenario: Cancellation propagates through task scope

- **WHEN** a host cancellation is issued during a runtime turn
- **THEN** model streams, capability executions, context providers, sandbox work, and child tasks under the turn scope receive cancellation and emit terminal task events

#### Scenario: Conflicting workspace mutation is serialized

- **WHEN** concurrent tasks attempt conflicting file or workspace mutations
- **THEN** the scheduler applies workspace/path locks and serializes, queues, rejects, or blocks according to policy with structured telemetry

### Requirement: Capability and Extension Acceptance

The framework SHALL pass validation and deterministic execution tests for capabilities, commands, skills, hooks, MCP gateway fakes, plugin packages, extension contributions, agent definitions, and evolution metadata.

框架必须通过 capabilities、commands、skills、hooks、MCP gateway fakes、plugin packages、extension contributions、agent definitions 和 evolution metadata 的 validation 与 deterministic execution tests。

#### Scenario: Untrusted contribution is disabled by default

- **WHEN** an untrusted workspace extension, plugin, skill, hook, MCP connector, command, or capability is discovered
- **THEN** it remains disabled until trust, policy, compatibility, and enablement checks allow it

#### Scenario: Plugin permission diff is enforced

- **WHEN** a plugin install or update requests broader permissions
- **THEN** policy approval is required before enabling the new contribution set

### Requirement: Policy, Sandbox, Platform, and Workspace Acceptance

The framework SHALL pass deterministic tests for policy decisions, approval requests, audit records, sandbox boundary calls, platform fake adapters, path behavior, command fallback rules, workspace roots, file snapshots, edit transactions, and redaction.

框架必须通过 policy decisions、approval requests、audit records、sandbox boundary calls、platform fake adapters、path behavior、command fallback rules、workspace roots、file snapshots、edit transactions 和 redaction 的 deterministic tests。

#### Scenario: Platform fallback is visible

- **WHEN** text search or command resolution falls back from a preferred command to another platform strategy
- **THEN** runtime/audit metadata records the selected strategy and fallback reason

#### Scenario: Edit transaction records evidence

- **WHEN** a workspace edit transaction is proposed, approved, applied, rejected, or failed
- **THEN** session, audit, workspace state, and regression traces record structured evidence with redaction metadata

### Requirement: Memory, Cache, Credential, Usage, and Code Intelligence Acceptance

The framework SHALL pass deterministic tests for memory scope isolation, cache invalidation, credential references, secret redaction, usage/budget accounting, context projection, and code intelligence context providers.

框架必须通过 memory scope isolation、cache invalidation、credential references、secret redaction、usage/budget accounting、context projection 和 code intelligence context providers 的 deterministic tests。

#### Scenario: Secret value is not persisted

- **WHEN** credentials are used by model gateway, MCP gateway, plugin installation, or external resources
- **THEN** persisted events, traces, audit records, and test artifacts contain only secret references or redacted summaries

#### Scenario: Usage budget blocks execution

- **WHEN** a runtime turn would exceed a configured hard budget
- **THEN** execution stops with a structured budget event and no hidden model or tool work continues

### Requirement: Session, Replay, and Regression Acceptance

The framework SHALL persist deterministic session events, checkpoints, redacted traces, and replay artifacts sufficient to resume, fork, checkpoint, replay smoke traces, and run self-regression scenarios.

框架必须持久化 deterministic session events、checkpoints、redacted traces 和 replay artifacts，足以支持 resume、fork、checkpoint、replay smoke traces 和 self-regression scenarios。

#### Scenario: Smoke trace replays deterministically

- **WHEN** the smoke trace is replayed through the regression harness
- **THEN** normalized protocol, bus, runtime, workflow, task, session, audit, and usage events match expected golden outputs

#### Scenario: Compatibility checks gate persisted schemas

- **WHEN** persisted event, manifest, trace, memory/cache, workspace, credential, usage, or session schemas change incompatibly
- **THEN** compatibility checks fail unless an evolution migration or rejection path is declared

### Requirement: Host Adapter Acceptance

The framework SHALL provide smoke evidence that CLI and VSCode adapters are thin hosts over shared contracts and do not import each other's app code or runtime internals.

框架必须提供 smoke evidence，证明 CLI 和 VSCode adapters 是基于共享 contracts 的 thin hosts，且不互相导入 app code 或 runtime internals。

#### Scenario: CLI smoke uses protocol boundary

- **WHEN** CLI smoke tests run
- **THEN** the CLI submits typed protocol requests and renders structured events without owning runtime lifecycle logic

#### Scenario: VSCode smoke uses host bridge boundary

- **WHEN** VSCode adapter smoke tests run
- **THEN** the adapter uses shared host/protocol contracts for commands, editor context, approvals, cancellation, event rendering, and workspace edit application

### Requirement: Acceptance Evidence Index

The framework SHALL maintain an acceptance evidence index that maps each acceptance gate to the command, test suite, golden trace, fixture, scenario, or document section proving it.

框架必须维护 acceptance evidence index，把每个 acceptance gate 映射到证明它的 command、test suite、golden trace、fixture、scenario 或 document section。

#### Scenario: Evidence index is complete

- **WHEN** acceptance is reviewed
- **THEN** every required gate has an evidence reference or an explicit OpenSpec-approved deferral

#### Scenario: Deferral is explicit

- **WHEN** a future-only capability is not implemented in the first framework
- **THEN** its landing zone and deferral reason are recorded without counting it as a failed first-framework acceptance gate

