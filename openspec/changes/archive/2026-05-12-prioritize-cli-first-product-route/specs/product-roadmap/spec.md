## ADDED Requirements

### Requirement: CLI-First Roadmap Sequencing / CLI 优先路线排序

The canonical product roadmap SHALL sequence user-facing product work so the CLI becomes the first polished daily-use surface before IDE, server, SDK, browser/native, team collaboration, or enterprise product surfaces become product priorities.

规范产品路线图必须对用户可见产品工作进行排序，使 CLI 先成为第一个成熟的日常使用界面，然后 IDE、server、SDK、browser/native、team collaboration 或 enterprise 产品面才成为产品优先级。

#### Scenario: Immediate sequence favors CLI / 近期顺序优先 CLI

- **WHEN** the roadmap lists immediate recommended OpenSpecs
- **THEN** CLI interaction, CLI approvals/permissions, CLI diagnostics, CLI packaging, CLI extension management, and CLI release readiness are prioritized before R4 host expansion unless a shared platform blocker must be fixed first
- **中文** 当路线图列出近期推荐 OpenSpec 时，必须优先 CLI interaction、CLI approvals/permissions、CLI diagnostics、CLI packaging、CLI extension management 和 CLI release readiness，再推进 R4 host expansion，除非必须先修复共享平台阻塞点。

#### Scenario: Roadmap explains deferred hosts / 路线图解释延后 host

- **WHEN** VSCode, server, SDK, browser/native, team sync, or enterprise surfaces appear in the roadmap
- **THEN** the roadmap identifies them as follow-on projections or later phases gated by CLI acceptance evidence and shared protocol stability
- **中文** 当路线图出现 VSCode、server、SDK、browser/native、team sync 或 enterprise surfaces 时，必须说明它们是由 CLI 验收证据和共享协议稳定性门禁控制的后续投影或后续阶段。

### Requirement: CLI Evidence Before Cross-Host Parity / 跨端对齐前必须具备 CLI 证据

The roadmap SHALL require CLI evidence before a capability is considered ready for cross-host parity work.

路线图必须要求一个能力在进入跨端对齐前先具备 CLI 证据。

#### Scenario: Cross-host roadmap item cites CLI proof / 跨端路线项引用 CLI 证明

- **WHEN** a roadmap node or future OpenSpec promotes a CLI capability to another host
- **THEN** it references the CLI smoke, golden replay, policy/audit trace, protocol fixture, and docs evidence that define the product behavior being projected
- **中文** 当路线图节点或未来 OpenSpec 将 CLI 能力推广到另一个 host 时，必须引用定义该产品行为的 CLI smoke、golden replay、policy/audit trace、protocol fixture 和文档证据。

#### Scenario: CLI-first does not weaken contracts / CLI-first 不削弱契约

- **WHEN** the roadmap prioritizes CLI work
- **THEN** it still requires package boundaries, shared contracts, protocol events, host-agnostic runtime execution, and deterministic regression gates
- **中文** 当路线图优先 CLI 工作时，仍必须要求 package boundaries、shared contracts、protocol events、host-agnostic runtime execution 和 deterministic regression gates。

### Requirement: Roadmap Tracks Directory And Pit Coverage / 路线图跟踪目录与坑位覆盖

The roadmap SHALL require future product-facing OpenSpecs to record directory plans, reference capability coverage, and reference pit fixture coverage so large CLI features do not rely on memory or implicit intent.

路线图必须要求后续面向产品的 OpenSpec 记录目录计划、参考能力覆盖和参考坑位 fixture 覆盖，使大型 CLI 功能不依赖记忆或隐含意图。

#### Scenario: Future OpenSpec includes scale metadata / 后续 OpenSpec 包含规模元数据

- **WHEN** a future OpenSpec proposes a large CLI-facing capability
- **THEN** its metadata includes owner packages, new folders, public exports, private modules, fixture/test locations, file-size split triggers, mapped reference capability areas, and applicable reference pit fixtures
- **中文** 当后续 OpenSpec 提出大型 CLI-facing capability 时，其 metadata 必须包含 owner packages、新目录、公开导出、私有模块、fixture/test 位置、文件体量拆分触发条件、映射的参考能力域，以及适用的参考坑位 fixtures。
