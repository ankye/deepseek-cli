## ADDED Requirements

### Requirement: VSCode Runtime Event Adapter Seam

The VSCode extension adapter SHALL expose or document a seam for consuming the same runtime event stream as CLI.

VSCode extension adapter 必须暴露或记录一个 seam，用于消费与 CLI 相同的 runtime event stream。

#### Scenario: VSCode adapter imports runtime contracts

- **WHEN** the VSCode extension package needs runtime behavior
- **THEN** it depends on shared runtime contracts and not on CLI command implementation

#### Scenario: VSCode projection keeps execution ownership in kernel

- **WHEN** a future VSCode UI renders runtime progress
- **THEN** it projects canonical runtime events while the kernel remains the owner of execution lifecycle state
