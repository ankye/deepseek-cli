## ADDED Requirements

### Requirement: Kernel-Only Runtime Event Loop

The runtime event loop SHALL remove default legacy direct execution behavior and use `RuntimeKernel` for all executable work.

runtime event loop 必须移除默认 legacy direct execution behavior，并对所有 executable work 使用 `RuntimeKernel`。

#### Scenario: No direct model stream in runtime turn

- **WHEN** the runtime package handles a user turn
- **THEN** it does not directly invoke the model gateway and instead creates governed kernel invocations for model or capability work

#### Scenario: Compatibility name delegates only

- **WHEN** an exported API keeps a previous ergonomic name such as `runTurn`
- **THEN** that API is only a thin delegate over kernel execution and owns no separate execution state machine
