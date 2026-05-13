## ADDED Requirements

### Requirement: CLI Host Modules Remain Thin / CLI Host 模块保持轻量

The CLI host SHALL split process startup, argument parsing, command adapters, terminal input, renderers, host wiring, and diagnostics into dedicated modules while preserving existing user-visible behavior.

CLI host 必须将 process startup、argument parsing、command adapters、terminal input、renderers、host wiring 和 diagnostics 拆入专门模块，同时保持现有用户可见行为。

#### Scenario: CLI entry delegates to host modules / CLI 入口委托给 host 模块

- **WHEN** `src/apps/cli/src/index.ts` is loaded as the CLI executable or package entry
- **THEN** it delegates to dedicated CLI host modules and does not contain the primary implementations for command handling, rendering, input handling, diagnostics, or runtime wiring
- **中文** 当 `src/apps/cli/src/index.ts` 作为 CLI executable 或 package entry 加载时，它必须委托给专门的 CLI host 模块，不能包含 command handling、rendering、input handling、diagnostics 或 runtime wiring 的主要实现。

#### Scenario: CLI host does not own execution / CLI host 不拥有执行逻辑

- **WHEN** CLI commands trigger model, tool, policy, session, MCP, plugin, or runtime work
- **THEN** CLI modules route the request through shared contracts and owning packages rather than importing implementation internals or executable primitives directly
- **中文** 当 CLI commands 触发 model、tool、policy、session、MCP、plugin 或 runtime 工作时，CLI 模块必须通过共享契约和责任包路由请求，不得直接导入实现内部或可执行 primitive。

### Requirement: Package Index Files Are Public Surfaces / Package Index 文件是公开表面

Package `index.ts` files SHALL act as public export surfaces and small composition entrypoints, not as implementation hubs for engines, adapters, renderers, validators, or persistence.

package 的 `index.ts` 文件必须作为 public export surfaces 和小型组合入口，不得成为 engines、adapters、renderers、validators 或 persistence 的实现中心。

#### Scenario: Implementation-heavy index is split / 实现过重的 index 被拆分

- **WHEN** a package `index.ts` contains implementation-heavy logic or grows beyond the configured central-file threshold
- **THEN** implementation logic is moved into private modules while the package public exports remain source-compatible
- **中文** 当 package `index.ts` 包含过重实现逻辑或超过配置的中心文件阈值时，必须把实现逻辑移入私有模块，同时保持 package public exports 源码兼容。

#### Scenario: Public exports stay stable / 公开导出保持稳定

- **WHEN** package internals are split into private modules
- **THEN** existing package import paths documented as public exports continue to typecheck without cross-package relative imports
- **中文** 当 package internals 被拆入私有模块时，已记录为 public exports 的 package import paths 必须继续通过 typecheck，且不得引入跨 package 相对导入。

### Requirement: Architecture Scale Lint / 架构规模 Lint

The repository SHALL provide mechanical lint coverage that detects central-file growth, implementation-heavy `index.ts` files, and host-edge import boundary violations.

仓库必须提供机械化 lint 覆盖，用于识别中心文件膨胀、实现过重的 `index.ts` 文件和 host-edge import boundary 违规。

#### Scenario: Central files are flagged / 中心文件被标记

- **WHEN** a source file crosses the warning or failure threshold defined by architecture conventions
- **THEN** `npm run lint` reports the file with a stable rule id and actionable split guidance
- **中文** 当源码文件超过架构约定定义的 warning 或 failure 阈值时，`npm run lint` 必须用稳定 rule id 报告该文件，并给出可执行拆分建议。

#### Scenario: Host boundary bypass is rejected / Host 边界绕过被拒绝

- **WHEN** a CLI host module imports runtime, policy, MCP, plugin, model, or tool implementation internals in a way that bypasses `@deepseek/platform-contracts` or the owning package public export
- **THEN** the architecture lint fails with a boundary violation
- **中文** 当 CLI host 模块以绕过 `@deepseek/platform-contracts` 或责任包 public export 的方式导入 runtime、policy、MCP、plugin、model 或 tool 实现内部时，架构 lint 必须以 boundary violation 失败。

### Requirement: Directory Plan For Large Changes / 大型变更目录计划

Large product-facing or architecture-facing OpenSpec changes SHALL include a Directory Plan section before implementation.

大型面向产品或架构的 OpenSpec 变更必须在实现前包含 Directory Plan 小节。

#### Scenario: Directory plan declares ownership / 目录计划声明责任归属

- **WHEN** a future OpenSpec proposes a large CLI-facing capability or a broad package refactor
- **THEN** it declares owner packages, new folders, public exports, private modules, host-specific files, implementation-free contracts, fixture locations, test locations, and split triggers
- **中文** 当后续 OpenSpec 提出大型 CLI-facing capability 或广泛 package refactor 时，必须声明 owner packages、新目录、public exports、private modules、host-specific files、implementation-free contracts、fixture locations、test locations 和 split triggers。

#### Scenario: Missing plan blocks implementation / 缺少计划阻止实现

- **WHEN** an implementation change exceeds the configured scope or file-size thresholds without a Directory Plan
- **THEN** validation, lint, or review evidence marks the change incomplete until the plan is added
- **中文** 当实现变更超过配置的范围或文件体量阈值但缺少 Directory Plan 时，validation、lint 或 review evidence 必须将该变更标记为 incomplete，直到补充计划。

### Requirement: Behavior-Preserving Refactor Evidence / 行为保持型重构证据

This architecture split SHALL provide parity evidence proving the refactor does not change existing CLI product behavior.

本架构拆分必须提供 parity evidence，证明重构不改变现有 CLI 产品行为。

#### Scenario: Existing CLI behavior remains stable / 现有 CLI 行为保持稳定

- **WHEN** the CLI host modules and package index files are split
- **THEN** existing run, chat, text output, JSON output, JSONL output, readiness, smoke, golden, and e2e evidence remain semantically equivalent
- **中文** 当 CLI host 模块和 package index 文件被拆分后，现有 run、chat、text output、JSON output、JSONL output、readiness、smoke、golden 和 e2e 证据必须保持语义等价。
