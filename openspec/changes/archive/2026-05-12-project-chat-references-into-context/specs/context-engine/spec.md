## ADDED Requirements

### Requirement: Chat Reference Candidate Projection / Chat 引用候选投影

The context engine SHALL project runtime-supplied chat reference candidates with the same eligibility, budget, redaction, cache, and replay rules as other context graph nodes.

Context engine 必须用与其他 context graph nodes 相同的 eligibility、budget、redaction、cache 与 replay 规则投影 runtime-supplied chat reference candidates。

#### Scenario: File reference candidate is selected / 文件引用候选被选中

- **WHEN** runtime submits a file reference candidate whose content is within policy and budget
- **THEN** context projection may select it as a `file` node with provenance, dependency fingerprints, redaction metadata, and deterministic ordering
- **中文** 当 runtime 提交内容符合 policy 与 budget 的 file reference candidate 时，context projection 可以将其作为带 provenance、dependency fingerprints、redaction metadata 与 deterministic ordering 的 `file` node 选中。

#### Scenario: Unsafe reference candidate is excluded / 不安全引用候选被排除

- **WHEN** a chat reference candidate contains secret-like content, has unavailable redaction class, is outside scope, or exceeds budget
- **THEN** context projection excludes it with a structured reason and without exposing raw content in externally visible events
- **中文** 当 chat reference candidate 包含疑似 secret content、redaction class 不可用、超出 scope 或超过 budget 时，context projection 必须用 structured reason 排除它，且不得在 externally visible events 中暴露 raw content。
