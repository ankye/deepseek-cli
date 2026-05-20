# vscode-extension-adapter Specification

## Purpose
Define VSCode extension adapter requirements for protocol projection, editor context, workspace edits, policy gates, and CLI-proven workflow promotion.

定义 VSCode extension adapter 对 protocol projection、editor context、workspace edits、policy gates 与 CLI-proven workflow promotion 的要求。

## Requirements
### Requirement: VSCode Adapter Boundary

The VSCode extension SHALL live in `src/apps/vscode-extension` and SHALL communicate with agent behavior through shared runtime and host protocol contracts instead of importing CLI application code.

VSCode extension 必须位于 `src/apps/vscode-extension`，并且必须通过共享 runtime 与 host protocol contract 访问 agent 行为，不能导入 CLI application code。

#### Scenario: Extension does not import CLI code

- **WHEN** the VSCode extension adapter is compiled
- **THEN** it imports shared packages for runtime behavior and host protocol types
- **AND** it does not import modules from `src/apps/cli`

#### Scenario: Runtime does not import VSCode APIs

- **WHEN** shared runtime packages are compiled or tested
- **THEN** they do not import the `vscode` API package

### Requirement: Host Bridge Protocol

The VSCode extension SHALL use a host bridge that maps VSCode commands, chat input, editor selections, workspace metadata, diagnostics, approval UI, cancellation, and edit application into typed runtime requests and host capabilities.

VSCode extension 必须使用 host bridge，把 VSCode commands、chat input、editor selections、workspace metadata、diagnostics、approval UI、cancellation 和 edit application 映射为 typed runtime requests 与 host capabilities。

#### Scenario: Submit VSCode command to runtime

- **WHEN** a user invokes a DeepSeek command from VSCode
- **THEN** the host bridge creates typed `UserInput` and context nodes for the runtime
- **AND** the runtime returns `RuntimeEvent` values for the extension to render

#### Scenario: Cancel active VSCode turn

- **WHEN** the user cancels an active VSCode request
- **THEN** the host bridge propagates cancellation to the runtime interruption contract
- **AND** the extension renders the terminal cancellation event

### Requirement: Editor Context Injection

The VSCode extension SHALL pass editor context as explicit context nodes with stable metadata instead of hiding editor state inside ad hoc prompt text.

VSCode extension 必须把 editor context 作为带稳定 metadata 的显式 context nodes 传入，不能把编辑器状态隐藏在临时拼接的 prompt text 里。

#### Scenario: Active document context

- **WHEN** the extension submits a turn with an active editor
- **THEN** it can provide document URI, language id, version, visible range, selected range, and selected text as structured context metadata

#### Scenario: Diagnostics context

- **WHEN** the extension includes diagnostics
- **THEN** diagnostics are represented as context nodes with source, severity, message, URI, and range metadata

### Requirement: VSCode Approval Broker

The VSCode extension SHALL implement approval handling as an adapter of the shared approval broker contract, using VSCode UI surfaces only at the application edge.

VSCode extension 必须把审批处理实现为共享 approval broker contract 的 adapter，只在应用边界使用 VSCode UI surface。

#### Scenario: Request file edit approval

- **WHEN** policy requires user approval for a workspace mutation
- **THEN** the extension receives a structured approval request
- **AND** it returns an approval decision through the shared approval broker contract

### Requirement: Workspace Edit Application Boundary

The VSCode extension SHALL apply proposed file edits through VSCode workspace APIs or an explicit host capability boundary rather than relying on CLI filesystem behavior.

VSCode extension 必须通过 VSCode workspace API 或显式 host capability 边界应用 proposed file edits，不能依赖 CLI filesystem behavior。

#### Scenario: Apply accepted workspace edit

- **WHEN** the runtime emits or completes an approved workspace edit proposal
- **THEN** the extension applies the edit through the workspace edit boundary
- **AND** the resulting success or failure is returned as a structured runtime or capability event

### Requirement: VSCode Session Binding

The VSCode extension SHALL bind sessions to workspace identity through the shared session store contract so resume, fork, and checkpoint behavior does not depend on webview state.

VSCode extension 必须通过共享 session store contract 把 session 绑定到 workspace identity，确保 resume、fork 和 checkpoint 不依赖 webview state。

#### Scenario: Resume workspace session

- **WHEN** a user resumes a DeepSeek session from a VSCode workspace
- **THEN** the extension resolves the workspace-scoped session id
- **AND** the runtime resumes through the shared session store contract

### Requirement: Transport-Flexible Runtime Connection

The VSCode extension SHALL use a typed runtime request/event protocol that can support an in-process runtime first and later support a local server or remote runtime without changing product behavior.

VSCode extension 必须使用 typed runtime request/event protocol，第一版可以支持 in-process runtime，后续也能支持 local server 或 remote runtime，而不改变产品行为。

#### Scenario: In-process runtime uses shared protocol

- **WHEN** the first VSCode adapter runs the runtime in-process
- **THEN** it still submits typed requests and consumes runtime events through the shared protocol boundary

#### Scenario: Extension does not parse CLI stdout

- **WHEN** the VSCode extension needs runtime events
- **THEN** it consumes structured runtime events
- **AND** it does not depend on parsing CLI stdout as the primary protocol

### Requirement: VSCode Runtime Event Adapter Seam

The VSCode extension adapter SHALL expose or document a seam for consuming the same runtime event stream as CLI.

VSCode extension adapter 必须暴露或记录一个 seam，用于消费与 CLI 相同的 runtime event stream。

#### Scenario: VSCode adapter imports runtime contracts

- **WHEN** the VSCode extension package needs runtime behavior
- **THEN** it depends on shared runtime contracts and not on CLI command implementation

#### Scenario: VSCode projection keeps execution ownership in kernel

- **WHEN** a future VSCode UI renders runtime progress
- **THEN** it projects canonical runtime events while the kernel remains the owner of execution lifecycle state

### Requirement: VSCode Adapter Is Kernel Projection Only

The VSCode adapter SHALL only project canonical runtime kernel events and SHALL NOT invoke executable primitives directly.

VSCode adapter 只能投影 canonical runtime kernel events，不得直接调用 executable primitives。

#### Scenario: VSCode direct bypass fails lint

- **WHEN** VSCode extension code directly calls model, capability, scheduler, policy, workflow, bus, command, skill, hook, MCP, plugin, or sandbox execution primitives
- **THEN** architecture lint fails with a stable rule id

### Requirement: IDE Roadmap Sequencing / IDE 路线图排序

The VSCode extension adapter SHALL align IDE features with roadmap nodes and consume runtime protocol events instead of owning separate execution state.

VSCode extension adapter 必须让 IDE features 与 roadmap nodes 对齐，并消费 runtime protocol events，而不是拥有独立 execution state。

#### Scenario: IDE feature waits for protocol readiness / IDE 功能等待协议就绪

- **WHEN** an IDE feature such as inline approval, diff projection, diagnostics, task view, remote session view, or rich renderer is proposed
- **THEN** it declares the protocol/runtime node dependency and host-visible acceptance tests
- **中文** 当提出 inline approval、diff projection、diagnostics、task view、remote session view 或 rich renderer 等 IDE 功能时，必须声明 protocol/runtime 节点依赖和 host-visible acceptance tests。

### Requirement: VSCode Follows CLI-Proven Product Semantics / VSCode 跟随 CLI 已验证产品语义

The VSCode extension adapter SHALL treat CLI-proven runtime events, command semantics, policy decisions, approval flows, diagnostics, and session behavior as prerequisites for productized IDE features.

VSCode extension adapter 必须把 CLI 已验证的 runtime events、command semantics、policy decisions、approval flows、diagnostics 和 session behavior 作为产品化 IDE 功能的前置条件。

#### Scenario: IDE feature cites CLI evidence / IDE 功能引用 CLI 证据

- **WHEN** a VSCode product feature such as chat rendering, inline approval, diff projection, task view, diagnostics view, extension management, or session UI is proposed
- **THEN** the proposal cites the CLI workflow evidence and protocol fixtures it will project
- **中文** 当提出 VSCode product feature，例如 chat rendering、inline approval、diff projection、task view、diagnostics view、extension management 或 session UI 时，proposal 必须引用它将投影的 CLI workflow evidence 和 protocol fixtures。

#### Scenario: VSCode does not become parallel product surface early / VSCode 不过早成为并行产品面

- **WHEN** CLI-first gates for a workflow have not passed
- **THEN** VSCode work for that workflow is limited to bridge seams, contract tests, skeletal projections, or compatibility fixtures
- **中文** 当某个 workflow 的 CLI-first 门禁尚未通过时，该 workflow 的 VSCode 工作必须限制在 bridge seams、contract tests、skeletal projections 或 compatibility fixtures。

#### Scenario: IDE projection stays host-edge / IDE 投影保持在 host 边界

- **WHEN** a CLI-proven workflow is promoted to VSCode
- **THEN** the VSCode adapter adds host-specific rendering, editor context, workspace edit application, and approval UI without owning runtime execution state
- **中文** 当 CLI 已验证 workflow 推广到 VSCode 时，VSCode adapter 只能增加 host-specific rendering、editor context、workspace edit application 和 approval UI，不得拥有 runtime execution state。
