## ADDED Requirements

### Requirement: Placeholder Platform Implementations / 占位平台实现

The `@deepseek/platform-abstraction` package SHALL expose deterministic placeholder implementations of the `PluginManager`, `ExtensionManager`, `EvolutionEngine`, `RemoteRuntimeConnectivity`, and `DistributionUpdateManager` platform contracts so that runtime assembly, testing harnesses, and future host adapters can compose a fully-populated `RuntimeDependencies` without depending on standalone stub packages.

`@deepseek/platform-abstraction` 包必须提供 `PluginManager`、`ExtensionManager`、`EvolutionEngine`、`RemoteRuntimeConnectivity`、`DistributionUpdateManager` 五个平台契约的确定性占位实现，使 runtime 组装、测试夹具、未来的 host adapter 都能组出完整的 `RuntimeDependencies`，而不需要依赖独立的 stub 包。

#### Scenario: Default platform placeholders are importable from platform-abstraction

- **WHEN** consumer code imports `InMemoryPluginManager`, `InMemoryExtensionManager`, `InMemoryEvolutionEngine`, `NoopRemoteRuntimeConnectivity`, or `StaticDistributionUpdateManager`
- **THEN** the import resolves from `@deepseek/platform-abstraction` and returns a class whose runtime behavior matches the prior standalone package exports, preserving method signatures, return values, and redaction characteristics
- **中文** 当消费代码 import `InMemoryPluginManager`、`InMemoryExtensionManager`、`InMemoryEvolutionEngine`、`NoopRemoteRuntimeConnectivity`、`StaticDistributionUpdateManager` 中任一符号时，必须从 `@deepseek/platform-abstraction` 解析得到类，其运行时行为、方法签名、返回值、redaction 特性与合并前的独立包导出保持一致。

#### Scenario: Placeholders do not shadow real platform providers

- **WHEN** a consumer wires `RuntimeDependencies` using `NodePlatformRuntime` or another non-placeholder platform provider from `@deepseek/platform-abstraction`
- **THEN** the placeholders for `PluginManager`, `ExtensionManager`, `EvolutionEngine`, `RemoteRuntimeConnectivity`, and `DistributionUpdateManager` are supplied only when the consumer explicitly instantiates them; nothing in `platform-abstraction` auto-installs the placeholders over a caller-provided implementation
- **中文** 当消费者使用 `NodePlatformRuntime` 或 `platform-abstraction` 的其他非占位 provider 组装 `RuntimeDependencies` 时，五个占位实现仅在消费者显式实例化时提供；`platform-abstraction` 不得自动用占位覆盖调用者已传入的实现。

#### Scenario: Public surface preserves the contracts unchanged

- **WHEN** downstream code relies on the `PluginManager`, `ExtensionManager`, `EvolutionEngine`, `RemoteRuntimeConnectivity`, or `DistributionUpdateManager` interfaces
- **THEN** consolidation does not alter the shape of those interfaces in `@deepseek/platform-contracts`; only the implementation location changes, and the interfaces remain the normative contract
- **中文** 当下游代码依赖 `PluginManager`、`ExtensionManager`、`EvolutionEngine`、`RemoteRuntimeConnectivity`、`DistributionUpdateManager` 任一接口时，合并不得改变 `@deepseek/platform-contracts` 中这些接口的形状；仅实现位置变化，接口仍是规范契约。
