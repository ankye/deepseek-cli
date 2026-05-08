## ADDED Requirements

### Requirement: Bilingual OpenSpec Artifacts

OpenSpec artifacts SHALL include English and Chinese descriptions for planning, behavior, and implementation guidance that affects the framework contract.

OpenSpec 文档对于影响框架契约的规划、行为和实现说明，必须同时提供英文和中文描述。

#### Scenario: Proposal contains bilingual descriptions

- **WHEN** a proposal explains motivation, changes, capabilities, or impact
- **THEN** the proposal includes both English and Chinese descriptions for those planning elements

#### Scenario: Design contains bilingual rationale

- **WHEN** a design document records architectural decisions or trade-offs
- **THEN** the design includes Chinese explanations alongside the English technical description

### Requirement: Bilingual Requirement Descriptions

Spec requirement descriptions SHALL be understandable in both English and Chinese while preserving stable technical identifiers in English.

规格需求描述必须能被英文和中文读者理解，同时稳定的技术标识符必须保留英文形式。

#### Scenario: Requirement uses stable technical identifiers

- **WHEN** a requirement names a package, interface, event, command, capability id, or file path
- **THEN** the technical identifier remains in English and the surrounding explanation includes Chinese description

#### Scenario: Scenario behavior is bilingual

- **WHEN** a scenario describes WHEN and THEN behavior
- **THEN** the behavior can be understood from the English text and accompanying Chinese description

### Requirement: Bilingual Task Guidance

Implementation tasks SHALL include enough Chinese description to make the work understandable without changing the checkbox format required by OpenSpec.

实现任务必须包含足够的中文说明，让任务意图可以被中文读者理解，同时不能破坏 OpenSpec 要求的 checkbox 格式。

#### Scenario: Task remains parseable

- **WHEN** a task is written in `tasks.md`
- **THEN** it keeps the `- [ ]` checkbox format and includes bilingual task intent where needed

