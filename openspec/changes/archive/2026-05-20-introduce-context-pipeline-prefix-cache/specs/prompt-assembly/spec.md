## ADDED Requirements

### Requirement: Prompt Assembly Consumes Pipeline Manifest / Prompt Assembly 消费管道 Manifest

Prompt assembly SHALL consume context pipeline manifests as typed ordered evidence and SHALL NOT rebuild, reorder, or retrieve upstream context directly.

Prompt assembly 必须将 context pipeline manifests 作为类型化有序证据消费，且不得直接重建、重排或检索上游 context。

#### Scenario: Manifest order is preserved / Manifest 顺序被保留

- **WHEN** prompt assembly receives a pipeline manifest with kernel, project, session, and current-turn layers
- **THEN** model-visible sections preserve that layer order and preserve block order within each layer unless a block is explicitly excluded by assembly policy
- **中文** 当 prompt assembly 收到包含 kernel、project、session 与 current-turn layers 的 pipeline manifest 时，模型可见 sections 必须保持该层顺序，并保持每层内 block 顺序，除非某 block 被 assembly policy 显式排除。

#### Scenario: Assembly does not fetch context / Assembly 不获取 Context

- **WHEN** prompt assembly needs project rules, memory, file evidence, PageIndex recall, tool-result evidence, or code-intelligence evidence
- **THEN** it consumes manifest blocks supplied by runtime/context-engine instead of scanning files, querying stores, or reading host UI state
- **中文** 当 prompt assembly 需要 project rules、memory、file evidence、PageIndex recall、tool-result evidence 或 code-intelligence evidence 时，必须消费 runtime/context-engine 提供的 manifest blocks，而不是扫描文件、查询 stores 或读取 host UI state。

### Requirement: Stable Prefix Section Planning / 稳定前缀 Section Planning

Prompt assembly SHALL emit section plans that preserve stable prefix blocks ahead of volatile current-turn content and record prefix fingerprints in assembly evidence.

Prompt assembly 必须输出 section plans，将稳定前缀 blocks 保持在易变 current-turn content 前面，并在 assembly evidence 中记录 prefix fingerprints。

#### Scenario: Stable sections precede current turn / 稳定 Section 位于当前回合之前

- **WHEN** a prompt is assembled for a normal coding turn
- **THEN** kernel and project sections appear before session summaries and current user input, preserving the manifest prefix order
- **中文** 当为普通 coding turn 组装 prompt 时，kernel 与 project sections 必须出现在 session summaries 与当前用户输入之前，并保持 manifest prefix order。

#### Scenario: Assembly evidence carries hashes / Assembly 证据携带 Hashes

- **WHEN** prompt assembly returns a result
- **THEN** the result includes pipeline fingerprint, layer prefix hashes, included block ids, excluded block ids, and cache hint summary
- **中文** 当 prompt assembly 返回结果时，结果必须包含 pipeline fingerprint、layer prefix hashes、included block ids、excluded block ids 与 cache hint summary。
