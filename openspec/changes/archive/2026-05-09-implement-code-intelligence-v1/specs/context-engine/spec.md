## ADDED Requirements

### Requirement: Code Intelligence Node Consumption / 代码智能节点消费

Context projection SHALL accept code-intelligence context graph nodes and apply the same budget, ordering, redaction, cache, and exclusion rules as other context nodes.

context projection 必须接受 code-intelligence context graph nodes，并对其应用与其他 context nodes 相同的 budget、ordering、redaction、cache 和 exclusion rules。

#### Scenario: Diagnostic nodes project under budget / diagnostic node 在预算内投影

- **WHEN** candidate context includes code-intelligence diagnostic nodes within budget
- **THEN** projection may select them using normal priority and redaction rules
- **中文** 当 candidate context 包含预算内的 code-intelligence diagnostic nodes 时，projection 可以使用普通 priority 与 redaction rules 选择它们。
