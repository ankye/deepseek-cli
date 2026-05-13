## ADDED Requirements

### Requirement: CLI-Gated Future Host Landings / 受 CLI 门禁控制的未来 Host 落点

Future host landing zones SHALL remain reserved or skeletal until the corresponding CLI workflow has passed CLI-first product gates, unless the proposed work is limited to contracts, fixtures, or adapter seams needed to preserve architecture.

未来 host 落点必须保持预留或骨架状态，直到对应 CLI workflow 通过 CLI-first 产品门禁；除非 proposed work 仅限于维护架构所需的 contracts、fixtures 或 adapter seams。

#### Scenario: Deferred host remains a landing zone / 延后 host 保持落点状态

- **WHEN** browser/native host, team memory sync, local daemon/server, VSCode rich UI, public SDK, or update UI work is proposed before the related CLI workflow is proven
- **THEN** the proposal limits the work to landing-zone structure, shared contracts, compatibility fixtures, or protocol seams
- **中文** 当 browser/native host、team memory sync、local daemon/server、VSCode rich UI、public SDK 或 update UI 在相关 CLI workflow 被证明前提出时，proposal 必须把工作限制在 landing-zone structure、shared contracts、compatibility fixtures 或 protocol seams。

#### Scenario: CLI-proven UX can be projected / 已由 CLI 证明的 UX 可以投影

- **WHEN** a deferred host capability is activated after CLI acceptance
- **THEN** it reuses the CLI-proven command/protocol/policy semantics and adds only host-specific rendering, input, transport, or approval adapters
- **中文** 当一个 deferred host capability 在 CLI 验收后被激活时，它必须复用 CLI 已验证的 command/protocol/policy semantics，只增加 host-specific rendering、input、transport 或 approval adapters。

### Requirement: CLI UX Landings Move Earlier / CLI UX 落点前移

CLI UX capabilities that directly affect daily terminal use SHALL be eligible for earlier roadmap nodes than non-CLI host UX, provided they remain host-edge adapters over shared contracts.

直接影响终端日常使用的 CLI UX 能力，只要保持为共享契约之上的 host-edge adapters，就可以比非 CLI host UX 更早进入路线图节点。

#### Scenario: CLI UX is not deferred with all R6 work / CLI UX 不与全部 R6 工作一起延后

- **WHEN** CLI output style, permission prompts, command palette, history search, status line, onboarding, tips, or extension-management UX is needed to make the CLI daily-usable
- **THEN** the roadmap may place it in the CLI-first product track instead of deferring it to a broad R6 multi-host UX phase
- **中文** 当 CLI output style、permission prompts、command palette、history search、status line、onboarding、tips 或 extension-management UX 对 CLI 日常可用性必要时，路线图可以将其放入 CLI-first 产品主线，而不是延后到宽泛的 R6 多端 UX 阶段。
