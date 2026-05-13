## 1. Contracts

- [x] 1.1 Add index provider manifest DTOs and implementation evidence fields to `@deepseek/platform-contracts`.
- [x] 1.2 Preserve existing diagnostics summary compatibility while adding manifest source metadata.

## 2. Shared Manifest Resolver

- [x] 2.1 Add manifest normalization and downgrade rules in `@deepseek/index-provider`.
- [x] 2.2 Add diagnostics for duplicate, malformed, and unsupported semantic provider entries.

## 3. CLI Integration

- [x] 3.1 Build CLI readiness provider manifest input from resolved config metadata.
- [x] 3.2 Thread resolved manifest diagnostics into readiness and diagnostics doctor output.

## 4. Tests And Validation

- [x] 4.1 Add focused contract and CLI tests for default, disabled, and unsupported enabled manifests.
- [x] 4.2 Run typecheck, lint, boundary checks, focused tests, and OpenSpec validation.
