## 1. Contracts

- [x] 1.1 Add host-agnostic index provider DTOs to `@deepseek/platform-contracts`.
- [x] 1.2 Export index provider contracts from the platform contracts public entry.
- [x] 1.3 Add contract tests for serializable PageIndex, provider config, freshness evidence, and deferred semantic status.

## 2. Shared Provider Implementation

- [x] 2.1 Add `@deepseek/index-provider` workspace package.
- [x] 2.2 Move deterministic PageIndex normalization, freshness evidence extraction, and text recall primitives into the shared package.
- [x] 2.3 Add focused tests proving shared recall output is host-neutral and deterministic.

## 3. CLI Integration

- [x] 3.1 Refactor CLI PageIndex command logic to consume shared provider DTOs/primitives.
- [x] 3.2 Keep CLI command parsing/rendering/workspace persistence local and behavior-compatible.
- [x] 3.3 Update workspace package dependency policy and package metadata.

## 4. Validation

- [x] 4.1 Run focused contract, index-provider, and CLI tests.
- [x] 4.2 Run typecheck, lint, boundary checks, and OpenSpec validation.
