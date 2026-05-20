# bilingual-openspec-documentation Specification

## Purpose
Define bilingual OpenSpec documentation requirements so planning, behavior, implementation guidance, and canonical Purpose text remain understandable in English and Chinese.

定义双语 OpenSpec 文档要求，确保 planning、behavior、implementation guidance 与 canonical Purpose 文本同时可被英文和中文读者理解。
## Requirements
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

### Requirement: Canonical Spec Purpose Hygiene / 规范 Spec Purpose 卫生

Canonical OpenSpec specs SHALL have meaningful bilingual Purpose sections and SHALL NOT retain generated archive placeholder text.

规范 OpenSpec specs 必须具备有意义的双语 Purpose 区段，且不得保留归档生成的占位文本。

#### Scenario: Archived spec has non-placeholder purpose / 已归档 Spec 具备非占位 Purpose

- **WHEN** a change is archived into `openspec/specs/<capability>/spec.md`
- **THEN** the canonical spec Purpose describes the capability ownership in English and Chinese and does not contain `TBD - created by archiving change`
- **中文** 当变更归档到 `openspec/specs/<capability>/spec.md` 时，canonical spec 的 Purpose 必须用英文和中文描述 capability ownership，且不得包含 `TBD - created by archiving change`。

#### Scenario: Purpose avoids product-ready overclaim / Purpose 避免产品就绪夸大

- **WHEN** a canonical spec covers planned, partial, deferred, placeholder, or rollout-gated capability work
- **THEN** the Purpose describes scope and governance ownership without claiming the capability is product-ready
- **中文** 当 canonical spec 覆盖 planned、partial、deferred、placeholder 或 rollout-gated capability work 时，Purpose 必须描述 scope 与 governance ownership，不得声称该 capability 已产品就绪。

