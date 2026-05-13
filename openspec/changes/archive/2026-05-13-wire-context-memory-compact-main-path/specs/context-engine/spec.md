## ADDED Requirements

### Requirement: Runtime Memory Candidate Projection / Runtime 记忆候选投影

The context engine SHALL project runtime-supplied memory candidates with the same eligibility, ordering, budget, redaction, cache, and replay rules as other context graph nodes.

Context engine 必须用与其他 context graph nodes 相同的 eligibility、ordering、budget、redaction、cache 与 replay rules 投影 runtime-supplied memory candidates。

#### Scenario: Scoped memory is selected under budget / 作用域记忆在预算内被选中

- **WHEN** runtime submits working, session, or project memory candidates whose redaction class and scope are eligible for the turn
- **THEN** context projection may select them as `memory-ref` nodes with provenance, dependency fingerprints, deterministic priority, and redaction metadata
- **中文** 当 runtime 提交 working、session 或 project memory candidates，且其 redaction class 与 scope 对当前回合 eligible 时，context projection 可以将其作为带 provenance、dependency fingerprints、deterministic priority 与 redaction metadata 的 `memory-ref` nodes 选中。

#### Scenario: Memory provider degradation is structured / 记忆提供者降级结构化

- **WHEN** memory retrieval is unavailable, out of scope, or redaction-ineligible
- **THEN** context projection records structured exclusion or degradation metadata without failing model dispatch by default
- **中文** 当 memory retrieval 不可用、超出 scope 或 redaction-ineligible 时，context projection 必须记录结构化 exclusion 或 degradation metadata，默认不得让 model dispatch 失败。

### Requirement: Code References And Definitions Projection / 代码引用与定义投影

The context engine SHALL accept code-intelligence reference and definition candidates as regular context evidence with bounded content, provenance, redaction metadata, and deterministic dependency fingerprints.

Context engine 必须接受 code-intelligence reference 与 definition candidates，并把它们作为带 bounded content、provenance、redaction metadata 与 deterministic dependency fingerprints 的普通 context evidence。

#### Scenario: References project as language-aware evidence / 引用作为语言感知证据投影

- **WHEN** code intelligence provides references or definitions related to the turn
- **THEN** projection may select them using the same budget and ordering rules as diagnostics, symbols, files, memory, and PageIndex recall
- **中文** 当 code intelligence 为当前回合提供 references 或 definitions 时，projection 可以用与 diagnostics、symbols、files、memory 和 PageIndex recall 相同的 budget 与 ordering rules 选择它们。

#### Scenario: Reference lookup fallback is non-fatal / 引用查找失败不致命

- **WHEN** references or definitions cannot be resolved
- **THEN** projection emits degraded evidence or exclusions and continues with other context candidates
- **中文** 当 references 或 definitions 无法解析时，projection 必须发出 degraded evidence 或 exclusions，并继续处理其他 context candidates。
