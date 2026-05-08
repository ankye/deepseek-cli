## ADDED Requirements

### Requirement: IDE Roadmap Sequencing / IDE 路线图排序

The VSCode extension adapter SHALL align IDE features with roadmap nodes and consume runtime protocol events instead of owning separate execution state.

VSCode extension adapter 必须让 IDE features 与 roadmap nodes 对齐，并消费 runtime protocol events，而不是拥有独立 execution state。

#### Scenario: IDE feature waits for protocol readiness / IDE 功能等待协议就绪

- **WHEN** an IDE feature such as inline approval, diff projection, diagnostics, task view, remote session view, or rich renderer is proposed
- **THEN** it declares the protocol/runtime node dependency and host-visible acceptance tests
- **中文** 当提出 inline approval、diff projection、diagnostics、task view、remote session view 或 rich renderer 等 IDE 功能时，必须声明 protocol/runtime 节点依赖和 host-visible acceptance tests。
