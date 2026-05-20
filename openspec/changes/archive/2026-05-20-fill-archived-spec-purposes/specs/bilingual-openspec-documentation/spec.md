## ADDED Requirements

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
