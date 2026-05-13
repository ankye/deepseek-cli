## ADDED Requirements

### Requirement: PageIndex Uses Runtime Event Timestamp / PageIndex 使用 Runtime Event 时间

The chat PageIndex SHALL use terminal runtime event `createdAt` as the page timestamp when it is available and parseable.

Chat PageIndex 在 terminal runtime event `createdAt` 可用且可解析时，必须使用它作为 page timestamp。

#### Scenario: Runtime timestamp becomes PageIndex timestamp / Runtime 时间成为 PageIndex 时间

- **WHEN** a completed prompt turn terminal event includes a parseable `createdAt`
- **THEN** the recorded PageIndex page and recall metadata use that value, and evidence quality marks `createdAtSource=runtime-event` with known freshness
- **中文** 当 completed prompt turn terminal event 包含可解析 `createdAt` 时，记录的 PageIndex page 与 recall metadata 必须使用该值，并且 evidence quality 标记 `createdAtSource=runtime-event` 与 known freshness。

#### Scenario: Missing runtime timestamp falls back deterministically / 缺失 Runtime 时间确定性回退

- **WHEN** a legacy or malformed runtime event lacks a parseable `createdAt`
- **THEN** PageIndex uses the deterministic fallback timestamp and marks freshness as unknown
- **中文** 当 legacy 或 malformed runtime event 缺少可解析 `createdAt` 时，PageIndex 必须使用 deterministic fallback timestamp，并将 freshness 标记为 unknown。
