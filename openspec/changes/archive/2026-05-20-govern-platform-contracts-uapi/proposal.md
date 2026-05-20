## Why

`@deepseek/platform-contracts` is the platform UAPI: every host, package, replay harness, plugin boundary, and future server path depends on it. / `@deepseek/platform-contracts` 是平台 UAPI：所有 host、package、replay harness、plugin boundary 与未来 server 路径都依赖它。

The repo needs explicit compatibility governance so DTO, id, event, envelope, error, and service-interface changes are additive by default and migration-governed when breaking. / 仓库需要显式兼容性治理，使 DTO、id、event、envelope、error 与 service-interface 变更默认 additive，并在 breaking 时受 migration 治理。

## What Changes

- Treat platform contracts as stable UAPI rather than ordinary internal TypeScript types. / 将 platform contracts 作为稳定 UAPI，而不是普通内部 TypeScript 类型。
- Add compatibility classification for additive, breaking, persisted, replay-affecting, and host-affecting changes. / 增加 additive、breaking、persisted、replay-affecting 与 host-affecting 变更分类。
- Require migration and version evidence for breaking or persisted contract changes. / 要求 breaking 或 persisted contract change 具备 migration 与 version 证据。
- Require contracts to remain implementation-free and host-agnostic. / 要求 contracts 保持无实现且 host-agnostic。

## Capabilities

### New Capabilities

### Modified Capabilities

- `platform-contracts`: Add UAPI compatibility, migration, and implementation-free governance requirements. / 增加 UAPI compatibility、migration 与 implementation-free 治理要求。
- `testing-regression`: Add contract compatibility evidence and replay fixture requirements. / 增加 contract compatibility evidence 与 replay fixture 要求。

## Impact

- Owner packages / 责任包: `src/packages/platform-contracts`, protocol codecs, replay fixtures, host adapters, `testing-regression`.
- Compatibility / 兼容性: additive fields remain easy; breaking or persisted changes require explicit migration evidence. / additive 字段保持简单；breaking 或 persisted 变更需要显式迁移证据。
